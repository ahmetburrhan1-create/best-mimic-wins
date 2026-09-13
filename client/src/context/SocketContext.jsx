import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_SERVER_URL = window.location.port === '5173'
  ? `http://${window.location.hostname || 'localhost'}:3001`
  : '/';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [aiClipProgress, setAiClipProgress] = useState(null);
  const [myProfile, setMyProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('taklit_player_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            name: (parsed.name && typeof parsed.name === 'string') ? parsed.name : `Oyuncu_${Math.floor(100 + Math.random() * 900)}`,
            avatar: parsed.avatar || '🎭'
          };
        }
      }
    } catch (e) {}
    return {
      name: `Oyuncu_${Math.floor(100 + Math.random() * 900)}`,
      avatar: '🎭'
    };
  });
  const [reactions, setReactions] = useState([]);

  // Save profile to localstorage
  const updateProfile = (updates) => {
    setMyProfile(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('taklit_player_profile', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      setConnected(true);
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('room_state_update', (newState) => {
      setRoom(newState);
    });

    s.on('timer_tick', ({ timer, status }) => {
      setRoom(prev => prev ? { ...prev, timer, status } : prev);
    });

    s.on('showcase_item', (data) => {
      setRoom(prev => prev ? {
        ...prev,
        showcaseIndex: data.index,
        showcaseTotal: data.total,
        showcaseItem: data.player,
        currentClip: data.clip,
        timer: data.duration
      } : prev);
    });

    s.on('live_reaction', (reaction) => {
      setReactions(prev => [...prev.slice(-20), reaction]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, 2400);
    });

    s.on('ai_clip_progress', (progress) => {
      setAiClipProgress(progress);
    });

    s.on('ai_clip_success', ({ clip }) => {
      setAiClipProgress({ step: 'ready', message: 'Klip hazır!', clip });
    });

    s.on('ai_clip_error', ({ error }) => {
      setAiClipProgress({ step: 'error', message: error });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const createRoom = useCallback((settings = {}) => {
    return new Promise((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Sunucuya bağlanılamadı' });
      socket.emit('create_room', {
        name: myProfile.name,
        avatar: myProfile.avatar,
        settings
      }, (res) => {
        if (res?.success) {
          setRoom(res.state);
        }
        resolve(res);
      });
    });
  }, [socket, myProfile]);

  const joinRoom = useCallback((roomCode) => {
    return new Promise((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Sunucuya bağlanılamadı' });
      socket.emit('join_room', {
        roomCode,
        name: myProfile.name,
        avatar: myProfile.avatar
      }, (res) => {
        if (res?.success) {
          setRoom(res.state);
        }
        resolve(res);
      });
    });
  }, [socket, myProfile]);

  const setReady = useCallback((isReady) => {
    if (!socket || !room) return;
    socket.emit('set_ready', { roomCode: room.code, isReady });
  }, [socket, room]);

  const updateSettings = useCallback((settings) => {
    if (!socket || !room) return;
    socket.emit('update_settings', { roomCode: room.code, settings });
  }, [socket, room]);

  const startGame = useCallback(() => {
    if (!socket || !room) return;
    socket.emit('start_game', { roomCode: room.code });
  }, [socket, room]);

  const submitRecording = useCallback((audioData, powerUp = null) => {
    if (!socket || !room) return;
    socket.emit('submit_recording', { roomCode: room.code, audioData, powerUp });
  }, [socket, room]);

  const submitVote = useCallback((votedForSocketId) => {
    if (!socket || !room) return;
    socket.emit('submit_vote', { roomCode: room.code, votedForSocketId });
  }, [socket, room]);

  const sendReaction = useCallback((emoji) => {
    if (!socket || !room) return;
    socket.emit('send_reaction', {
      roomCode: room.code,
      emoji,
      senderName: myProfile.name
    });
  }, [socket, room, myProfile]);

  const returnToLobby = useCallback(() => {
    if (!socket || !room) return;
    socket.emit('return_to_lobby', { roomCode: room.code });
  }, [socket, room]);

  const addCustomClip = useCallback((clip) => {
    if (!socket || !room) return;
    socket.emit('add_custom_clip', { roomCode: room.code, clip });
  }, [socket, room]);

  const generateAiClip = useCallback(({ query = '', isRandom = false }) => {
    return new Promise((resolve) => {
      if (!socket || !room) return resolve({ success: false, error: 'Oda bağlantısı yok' });
      socket.emit('ai_generate_clip', { roomCode: room.code, query, isRandom }, (res) => {
        resolve(res);
      });
    });
  }, [socket, room]);

  const currentPlayer = room?.players?.find(p => p.socketId === socket?.id);
  const isHost = currentPlayer?.isHost || room?.hostId === socket?.id;

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      room,
      myProfile,
      updateProfile,
      currentPlayer,
      isHost,
      reactions,
      aiClipProgress,
      setAiClipProgress,
      createRoom,
      joinRoom,
      setReady,
      updateSettings,
      startGame,
      submitRecording,
      submitVote,
      sendReaction,
      returnToLobby,
      addCustomClip,
      generateAiClip
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
