import { getRandomClips, CLIPS_DATA, addCustomClip } from './clipsData.js';

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  createRoom(hostData, initialSettings = {}) {
    const code = this.generateRoomCode();
    const room = {
      code,
      hostId: hostData.socketId,
      status: 'LOBBY',
      settings: {
        rounds: initialSettings.rounds || 3,
        recordDuration: initialSettings.recordDuration || 18,
        previewDuration: initialSettings.previewDuration || 12,
        votingDuration: initialSettings.votingDuration || 20,
        category: initialSettings.category || 'all',
        mode: initialSettings.mode || 'mimic'
      },
      currentRound: 0,
      clips: [],
      customClips: [],
      usedClipIds: new Set(),
      currentClip: null,
      players: new Map(),
      showcaseIndex: 0,
      showcaseList: [],
      timer: 0,
      timerInterval: null
    };

    const hostPlayer = {
      socketId: hostData.socketId,
      name: hostData.name || 'Sunucu',
      avatar: hostData.avatar || '👑',
      score: 0,
      roundScore: 0,
      isReady: true,
      isHost: true,
      hasRecorded: false,
      recording: null,
      powerUp: null,
      hasVoted: false,
      votedFor: null,
      votesReceived: 0
    };

    room.players.set(hostData.socketId, hostPlayer);
    this.rooms.set(code, room);
    return room;
  }

  joinRoom(code, playerData) {
    const formattedCode = code.trim().toUpperCase();
    const room = this.rooms.get(formattedCode);
    if (!room) {
      return { success: false, error: 'Oda bulunamadı!' };
    }
    if (room.status !== 'LOBBY') {
      return { success: false, error: 'Oyun çoktan başlamış, lobiye katılamazsınız.' };
    }
    if (room.players.size >= 12) {
      return { success: false, error: 'Oda dolu! (Maksimum 12 oyuncu)' };
    }

    const player = {
      socketId: playerData.socketId,
      name: playerData.name || `Oyuncu ${room.players.size + 1}`,
      avatar: playerData.avatar || '🐱',
      score: 0,
      roundScore: 0,
      isReady: false,
      isHost: false,
      hasRecorded: false,
      recording: null,
      powerUp: null,
      hasVoted: false,
      votedFor: null,
      votesReceived: 0
    };

    room.players.set(playerData.socketId, player);
    return { success: true, room };
  }

  leaveRoom(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      if (room.players.has(socketId)) {
        const leavingPlayer = room.players.get(socketId);
        room.players.delete(socketId);

        if (room.players.size === 0) {
          this.clearTimer(room);
          this.rooms.delete(code);
          return null;
        }

        if (room.hostId === socketId) {
          const nextHost = Array.from(room.players.values())[0];
          room.hostId = nextHost.socketId;
          nextHost.isHost = true;
          nextHost.isReady = true;
        }

        if (room.status === 'RECORDING') {
          this.checkRecordingCompletion(room);
        } else if (room.status === 'VOTING') {
          this.checkVotingCompletion(room);
        }

        this.broadcastRoomState(room);
        return { code, room, playerName: leavingPlayer.name };
      }
    }
    return null;
  }

  updateSettings(code, socketId, newSettings) {
    const room = this.rooms.get(code);
    if (!room || room.hostId !== socketId) return false;
    room.settings = { ...room.settings, ...newSettings };
    this.broadcastRoomState(room);
    return true;
  }

  setReady(code, socketId, isReady) {
    const room = this.rooms.get(code);
    if (!room || !room.players.has(socketId)) return false;
    const player = room.players.get(socketId);
    player.isReady = isReady;
    this.broadcastRoomState(room);
    return true;
  }

  addCustomClipToRoom(code, clipData) {
    const room = this.rooms.get(code);
    if (!room) return null;
    const newClip = addCustomClip(clipData);
    if (!room.customClips) room.customClips = [];
    room.customClips.unshift(newClip);
    this.broadcastRoomState(room);
    return newClip;
  }

  startGame(code, socketId) {
    const room = this.rooms.get(code);
    if (!room || room.hostId !== socketId) return false;

    room.currentRound = 0;
    const needed = room.settings.rounds;
    const custom = room.customClips || [];

    if (!room.usedClipIds) room.usedClipIds = new Set();
    const excluded = Array.from(room.usedClipIds);
    let pool = getRandomClips(room.settings.category, Math.max(0, needed - custom.length), excluded);

    // If remaining pool couldn't fulfill, reset and take from fresh pool
    let selectedClips = [...custom, ...pool];
    if (selectedClips.length < needed) {
      room.usedClipIds.clear();
      const freshPool = getRandomClips(room.settings.category, Math.max(0, needed - custom.length));
      selectedClips = [...custom, ...freshPool];
    }

    room.clips = selectedClips.slice(0, needed);
    // Mark as used
    room.clips.forEach(c => {
      if (c?.id) room.usedClipIds.add(c.id);
    });

    for (const player of room.players.values()) {
      player.score = 0;
      player.roundScore = 0;
    }

    this.startNextRound(room);
    return true;
  }

  startNextRound(room) {
    this.clearTimer(room);
    room.currentRound += 1;
    
    let roundClip = room.clips[room.currentRound - 1];
    if (!roundClip) {
      const excluded = Array.from(room.usedClipIds || []);
      const fallback = getRandomClips(room.settings.category, 1, excluded);
      roundClip = fallback[0] || getRandomClips('all', 1)[0];
      if (roundClip?.id && room.usedClipIds) {
        room.usedClipIds.add(roundClip.id);
      }
    }
    room.currentClip = roundClip;

    for (const player of room.players.values()) {
      player.hasRecorded = false;
      player.recording = null;
      player.powerUp = null;
      player.hasVoted = false;
      player.votedFor = null;
      player.votesReceived = 0;
      player.roundScore = 0;
    }

    // PREVIEW PHASE
    room.status = 'PREVIEW';
    room.timer = room.settings.previewDuration;
    this.broadcastRoomState(room);

    this.startCountdown(room, () => {
      this.startRecordPhase(room);
    });
  }

  startRecordPhase(room) {
    this.clearTimer(room);
    room.status = 'RECORDING';
    room.timer = room.settings.recordDuration;
    this.broadcastRoomState(room);

    this.startCountdown(room, () => {
      this.startShowcasePhase(room);
    });
  }

  submitRecording(code, socketId, audioData, powerUp = null) {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'RECORDING') return false;
    const player = room.players.get(socketId);
    if (!player) return false;

    player.hasRecorded = true;
    player.powerUp = powerUp;
    player.recording = {
      audioData,
      submittedAt: Date.now()
    };

    this.broadcastRoomState(room);
    this.checkRecordingCompletion(room);
    return true;
  }

  checkRecordingCompletion(room) {
    const allRecorded = Array.from(room.players.values()).every(p => p.hasRecorded);
    if (allRecorded) {
      this.clearTimer(room);
      this.startShowcasePhase(room);
    }
  }

  startShowcasePhase(room) {
    this.clearTimer(room);
    room.status = 'SHOWCASE';

    const recordedPlayers = Array.from(room.players.values())
      .filter(p => p.hasRecorded && p.recording);

    if (recordedPlayers.length === 0) {
      this.startRoundSummaryPhase(room);
      return;
    }

    // Resolve Targeted Power-Ups:
    // Check if any player targeted another player
    for (const p of recordedPlayers) {
      if (p.powerUp && p.powerUp.targetSocketId && p.powerUp.targetSocketId !== p.socketId) {
        const target = room.players.get(p.powerUp.targetSocketId);
        if (target) {
          // If swap was used
          if (p.powerUp.id === 'swap' && target.recording) {
            const temp = p.recording.audioData;
            p.recording.audioData = target.recording.audioData;
            target.recording.audioData = temp;
          } else {
            // Apply curse / audio modifier to target
            target.powerUp = p.powerUp;
          }
        }
      }
    }

    room.showcaseList = recordedPlayers.map(p => ({
      socketId: p.socketId,
      name: p.name,
      avatar: p.avatar,
      audioData: p.recording.audioData,
      powerUp: p.powerUp
    }));

    room.showcaseIndex = 0;
    this.playShowcaseItem(room);
  }

  playShowcaseItem(room) {
    this.clearTimer(room);
    if (room.showcaseIndex >= room.showcaseList.length) {
      this.startVotingPhase(room);
      return;
    }

    const currentItem = room.showcaseList[room.showcaseIndex];
    const itemDuration = Math.max(8, (room.currentClip?.duration || 10) + 2);
    room.timer = itemDuration;

    this.io.to(room.code).emit('showcase_item', {
      index: room.showcaseIndex,
      total: room.showcaseList.length,
      player: currentItem,
      clip: room.currentClip,
      duration: itemDuration
    });

    this.broadcastRoomState(room);

    this.startCountdown(room, () => {
      room.showcaseIndex += 1;
      this.playShowcaseItem(room);
    });
  }

  startVotingPhase(room) {
    this.clearTimer(room);
    room.status = 'VOTING';
    room.timer = room.settings.votingDuration;
    this.broadcastRoomState(room);

    this.startCountdown(room, () => {
      this.startRoundSummaryPhase(room);
    });
  }

  submitVote(code, voterSocketId, votedForSocketId) {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'VOTING') return false;
    const voter = room.players.get(voterSocketId);
    if (!voter || voter.hasVoted) return false;

    if (voterSocketId === votedForSocketId && room.showcaseList.length > 1) {
      return false;
    }

    voter.hasVoted = true;
    voter.votedFor = votedForSocketId;

    const candidate = room.players.get(votedForSocketId);
    if (candidate) {
      candidate.votesReceived = (candidate.votesReceived || 0) + 1;
    }

    this.broadcastRoomState(room);
    this.checkVotingCompletion(room);
    return true;
  }

  checkVotingCompletion(room) {
    const allVoted = Array.from(room.players.values()).every(p => p.hasVoted);
    if (allVoted) {
      this.clearTimer(room);
      this.startRoundSummaryPhase(room);
    }
  }

  startRoundSummaryPhase(room) {
    this.clearTimer(room);
    room.status = 'ROUND_SUMMARY';
    room.timer = 10;

    let maxVotes = 0;
    for (const player of room.players.values()) {
      let earned = 0;
      if (player.hasRecorded) earned += 20;

      // Power-up: Score Boost (x2 points per vote)
      const voteValue = player.powerUp?.id === 'score_boost' ? 200 : 100;
      earned += (player.votesReceived || 0) * voteValue;

      // Power-up: Shield (+60 if 0 votes)
      if (player.powerUp?.id === 'shield' && (player.votesReceived || 0) === 0) {
        earned += 60;
      }

      player.roundScore = earned;
      player.score += earned;
      if (player.votesReceived > maxVotes) {
        maxVotes = player.votesReceived;
      }
    }

    if (maxVotes > 0) {
      for (const player of room.players.values()) {
        if (player.votesReceived === maxVotes) {
          player.roundScore += 50;
          player.score += 50;
        }
      }
    }

    this.broadcastRoomState(room);

    this.startCountdown(room, () => {
      if (room.currentRound >= room.settings.rounds) {
        this.startGameOverPhase(room);
      } else {
        this.startNextRound(room);
      }
    });
  }

  startGameOverPhase(room) {
    this.clearTimer(room);
    room.status = 'GAME_OVER';
    room.timer = 0;
    this.broadcastRoomState(room);
  }

  returnToLobby(code, socketId) {
    const room = this.rooms.get(code);
    if (!room || room.hostId !== socketId) return false;
    this.clearTimer(room);
    room.status = 'LOBBY';
    room.currentRound = 0;
    room.currentClip = null;
    room.clips = [];
    for (const player of room.players.values()) {
      player.isReady = player.isHost;
      player.score = 0;
      player.roundScore = 0;
      player.hasRecorded = false;
      player.recording = null;
      player.powerUp = null;
      player.hasVoted = false;
      player.votedFor = null;
      player.votesReceived = 0;
    }
    this.broadcastRoomState(room);
    return true;
  }

  sendReaction(code, reaction) {
    const room = this.rooms.get(code);
    if (!room) return;
    this.io.to(code).emit('live_reaction', reaction);
  }

  startCountdown(room, onComplete) {
    this.clearTimer(room);
    room.timerInterval = setInterval(() => {
      room.timer -= 1;
      this.io.to(room.code).emit('timer_tick', { timer: room.timer, status: room.status });
      if (room.timer <= 0) {
        this.clearTimer(room);
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    }, 1000);
  }

  clearTimer(room) {
    if (room && room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
  }

  getPublicRoomState(room) {
    return {
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      settings: room.settings,
      currentRound: room.currentRound,
      totalRounds: room.settings.rounds,
      currentClip: room.currentClip,
      customClips: room.customClips || [],
      timer: room.timer,
      showcaseIndex: room.showcaseIndex,
      showcaseTotal: room.showcaseList ? room.showcaseList.length : 0,
      showcaseItem: room.showcaseList && room.showcaseList[room.showcaseIndex] ? room.showcaseList[room.showcaseIndex] : null,
      players: Array.from(room.players.values()).map(p => ({
        socketId: p.socketId,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        roundScore: p.roundScore,
        isReady: p.isReady,
        isHost: p.isHost,
        hasRecorded: p.hasRecorded,
        powerUp: p.powerUp,
        hasVoted: p.hasVoted,
        votesReceived: p.votesReceived,
        recording: room.status === 'SHOWCASE' || room.status === 'VOTING' || room.status === 'ROUND_SUMMARY' || room.status === 'GAME_OVER' 
          ? p.recording 
          : null
      }))
    };
  }

  broadcastRoomState(room) {
    if (!room) return;
    const publicState = this.getPublicRoomState(room);
    this.io.to(room.code).emit('room_state_update', publicState);
  }
}

export default RoomManager;
