import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import RoomManager from './roomManager.js';
import { generateAiClip } from './aiClipService.js';

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

io.on('connection', (socket) => {
  let currentRoomCode = null;

  socket.on('create_room', ({ name, avatar, settings }, callback) => {
    try {
      const room = roomManager.createRoom({ socketId: socket.id, name, avatar }, settings);
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

  socket.on('join_room', ({ roomCode, name, avatar }, callback) => {
    try {
      const result = roomManager.joinRoom(roomCode, { socketId: socket.id, name, avatar });
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

  socket.on('add_custom_clip', ({ roomCode, clip }) => {
    roomManager.addCustomClipToRoom(roomCode, clip);
  });

  socket.on('ai_generate_clip', async ({ roomCode, query, isRandom }, callback) => {
    try {
      io.to(roomCode).emit('ai_clip_progress', { step: 'search', message: 'YouTube sahnesi taranıyor...' });
      const clip = await generateAiClip({
        query,
        isRandom,
        onProgress: (progress) => {
          io.to(roomCode).emit('ai_clip_progress', progress);
        }
      });
      const addedClip = roomManager.addCustomClipToRoom(roomCode, clip);
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
