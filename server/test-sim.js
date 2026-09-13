import { io } from 'socket.io-client';

console.log('Testing v3: Targeted Power-Ups & Custom Clips via Socket.IO...');

async function runTest() {
  const client1 = io('http://localhost:3001');
  
  await new Promise((resolve) => client1.on('connect', resolve));
  console.log('Host connected:', client1.id);

  const roomRes = await new Promise((resolve) => {
    client1.emit('create_room', {
      name: 'KralHost',
      avatar: '🐱',
      settings: { rounds: 1, recordDuration: 3, previewDuration: 2, votingDuration: 3 }
    }, resolve);
  });

  console.log('Room created successfully:', roomRes.roomCode);
  const roomCode = roomRes.roomCode;

  const client2 = io('http://localhost:3001');
  await new Promise((resolve) => client2.on('connect', resolve));
  console.log('Player 2 connected:', client2.id);

  const joinRes = await new Promise((resolve) => {
    client2.emit('join_room', {
      roomCode,
      name: 'KralTaklitci',
      avatar: '🤖'
    }, resolve);
  });

  console.log('Player 2 joined:', joinRes.success);

  // Test adding custom clip
  console.log('Adding custom movie scene...');
  client1.emit('add_custom_clip', {
    roomCode,
    clip: {
      title: 'Breaking Bad Custom',
      source: 'Breaking Bad',
      character: 'Heisenberg',
      subtitle: 'Say my name!',
      category: 'film',
      duration: 10
    }
  });

  client1.on('room_state_update', (state) => {
    console.log(`[STATE] Status: ${state.status}, Round: ${state.currentRound}/${state.totalRounds}, Timer: ${state.timer}s`);

    if (state.status === 'RECORDING') {
      console.log('Submitting recordings: Host casts Helium curse onto Player 2!');
      // Host targets Player 2 with Helium power-up!
      client1.emit('submit_recording', {
        roomCode: state.code,
        audioData: 'mock_audio_data_host',
        powerUp: {
          id: 'helium',
          name: 'Helyum Gazı',
          audioEffect: 'helium',
          targetSocketId: client2.id,
          targetName: 'KralTaklitci',
          senderSocketId: client1.id,
          senderName: 'KralHost'
        }
      });

      // Player 2 self-casts Score Boost
      client2.emit('submit_recording', {
        roomCode: state.code,
        audioData: 'mock_audio_data_p2',
        powerUp: {
          id: 'score_boost',
          name: '2x Puan Katlayıcı',
          audioEffect: 'none',
          targetSocketId: client2.id,
          targetName: 'KralTaklitci'
        }
      });
    }

    if (state.status === 'SHOWCASE') {
      if (state.showcaseItem) {
        console.log(`[SHOWCASE ITEM] Playing: ${state.showcaseItem.name} | PowerUp: ${state.showcaseItem.powerUp?.name} (AudioEffect: ${state.showcaseItem.powerUp?.audioEffect})`);
      }
    }

    if (state.status === 'VOTING') {
      console.log('Submitting votes...');
      const target = state.players.find(p => p.name === 'KralTaklitci');
      if (target) {
        client1.emit('submit_vote', { roomCode: state.code, votedForSocketId: target.socketId });
      }
    }

    if (state.status === 'GAME_OVER') {
      console.log('🎉 v3 Test reached GAME_OVER successfully!');
      console.log('Final scores with targeted effects:');
      state.players.forEach(p => {
        console.log(` - ${p.name} (${p.avatar}): ${p.score} pts [Active Power: ${p.powerUp?.name || 'Yok'}]`);
      });
      client1.disconnect();
      client2.disconnect();
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.log('Starting game...');
    client1.emit('start_game', { roomCode });
  }, 1000);
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
