import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import RoomManager from './roomManager.js';
import { generateAiClip } from './aiClipService.js';
import { authService } from './authService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e7
});

const roomManager = new RoomManager(io);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    roomsActive: roomManager.rooms.size,
    timestamp: Date.now()
  });
});

// --- AUTH REST API ROUTES ---
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, displayName, avatar } = req.body;
    const result = authService.register({ username, password, displayName, avatar });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Sunucu hatası oluştu.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const result = authService.login({ username, password });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Sunucu hatası oluştu.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({ success: false, error: 'Yetkilendirme tokenı eksik.' });
    }
    const user = authService.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Geçersiz veya süresi dolmuş oturum.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ success: false, error: 'Sunucu hatası oluştu.' });
  }
});

app.post('/api/auth/update', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const user = authService.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Yetkisiz erişim.' });
    }
    const { displayName, avatar } = req.body;
    const result = authService.updateProfile(user.id, { displayName, avatar });
    res.json(result);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, error: 'Profil güncellenemedi.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    authService.logout(token);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

io.on('connection', (socket) => {
  let currentRoomCode = null;

  socket.on('create_room', ({ name, avatar, userId, settings }, callback) => {
    try {
      const room = roomManager.createRoom({ socketId: socket.id, name, avatar, userId }, settings);
      currentRoomCode = room.code;
      socket.join(room.code);
      const publicState = roomManager.getPublicRoomState(room);
      if (typeof callback === 'function') {
        callback({ success: true, roomCode: room.code, state: publicState });
      }
    } catch (err) {
      console.error('Error creating room:', err);
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('join_room', ({ roomCode, name, avatar, userId }, callback) => {
    try {
      const result = roomManager.joinRoom(roomCode, { socketId: socket.id, name, avatar, userId });
      if (!result.success) {
        if (typeof callback === 'function') callback({ success: false, error: result.error });
        return;
      }
      currentRoomCode = result.room.code;
      socket.join(result.room.code);
      roomManager.broadcastRoomState(result.room);
      const publicState = roomManager.getPublicRoomState(result.room);
      if (typeof callback === 'function') {
        callback({ success: true, roomCode: result.room.code, state: publicState });
      }
    } catch (err) {
      console.error('Error joining room:', err);
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('update_settings', ({ roomCode, settings }) => {
    roomManager.updateSettings(roomCode, socket.id, settings);
  });

  socket.on('set_ready', ({ roomCode, isReady }) => {
    roomManager.setReady(roomCode, socket.id, isReady);
  });

  socket.on('start_game', ({ roomCode }) => {
    roomManager.startGame(roomCode, socket.id);
  });

  socket.on('submit_recording', ({ roomCode, audioData, powerUp }) => {
    roomManager.submitRecording(roomCode, socket.id, audioData, powerUp);
  });

  socket.on('submit_vote', ({ roomCode, votedForSocketId }) => {
    roomManager.submitVote(roomCode, socket.id, votedForSocketId);
  });

  socket.on('create_custom_pack', ({ roomCode, pack }, callback) => {
    try {
      const newPack = roomManager.createCustomPack(roomCode, pack);
      if (typeof callback === 'function') callback({ success: true, pack: newPack });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('add_custom_clip', ({ roomCode, clip, targetPackId }) => {
    roomManager.addCustomClipToRoom(roomCode, clip, targetPackId);
  });

  socket.on('ai_generate_clip', async ({ roomCode, query, isRandom, targetPackId }, callback) => {
    try {
      io.to(roomCode).emit('ai_clip_progress', { step: 'search', message: 'YouTube sahnesi taranıyor...' });
      const clip = await generateAiClip({
        query,
        isRandom,
        onProgress: (progress) => {
          io.to(roomCode).emit('ai_clip_progress', progress);
        }
      });
      const addedClip = roomManager.addCustomClipToRoom(roomCode, clip, targetPackId);
      io.to(roomCode).emit('ai_clip_success', { clip: addedClip });
      if (typeof callback === 'function') callback({ success: true, clip: addedClip });
    } catch (err) {
      console.error('AI clip generation error:', err);
      io.to(roomCode).emit('ai_clip_error', { error: err.message });
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('send_reaction', ({ roomCode, emoji, senderName }) => {
    roomManager.sendReaction(roomCode, {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      senderName,
      createdAt: Date.now()
    });
  });

  socket.on('return_to_lobby', ({ roomCode }) => {
    roomManager.returnToLobby(roomCode, socket.id);
  });

  socket.on('disconnect', () => {
    const res = roomManager.leaveRoom(socket.id);
    if (res && res.code) {
      console.log(`Player left room ${res.code}`);
    }
  });
});

const clientPublicClips = path.join(__dirname, '../client/public/clips');
app.use('/clips', express.static(clientPublicClips));

const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

httpServer.listen(port, () => {
  console.log(`Taklit Web server running on http://localhost:${port}`);
});
