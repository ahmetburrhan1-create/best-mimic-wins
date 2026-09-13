import React, { useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import AnimatedCharacter from '../Common/AnimatedCharacter';
import confetti from 'canvas-confetti';
import { playSound } from '../../utils/sfx';
import { Trophy, Crown, RotateCcw, Home, Sparkles } from 'lucide-react';

export default function GameOverPhase() {
  const { room, isHost, startGame, returnToLobby } = useSocket();
  const { refreshUser } = useAuth();

  useEffect(() => {
    playSound('win');
    if (typeof refreshUser === 'function') {
      refreshUser();
    }

    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  const sortedPlayers = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const winner = sortedPlayers[0];
  const second = sortedPlayers[1];
  const third = sortedPlayers[2];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-xs uppercase tracking-widest mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Oyun Bitti & Şampiyon Belli Oldu!</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white m-0 tracking-tight">
          PODYUM & KAZANANLAR 🏆
        </h1>
      </div>

      {/* 3D-style Podium Showcase */}
      <div className="w-full flex items-end justify-center gap-3 sm:gap-6 mb-12 min-h-[300px] px-2">
        {/* 2nd Place */}
        {second && (
          <div className="flex-1 max-w-[170px] flex flex-col items-center">
            <AnimatedCharacter avatar={second.avatar} size="md" />
            <div className="font-extrabold text-xs text-white truncate max-w-full text-center mt-2">
              {second.name}
            </div>
            <div className="text-xs font-mono font-bold text-slate-300 mb-2">
              {second.score} Puan
            </div>
            <div className="w-full h-32 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-600/80 border-t-2 border-slate-300 flex flex-col items-center justify-center p-3 shadow-xl">
              <span className="text-2xl font-black text-slate-200">2</span>
              <span className="text-[11px] font-bold text-slate-300">Gümüş</span>
            </div>
          </div>
        )}

        {/* 1st Place (Winner) */}
        {winner && (
          <div className="flex-1 max-w-[210px] flex flex-col items-center z-10">
            <div className="relative mb-2">
              <Crown className="w-8 h-8 text-amber-400 absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce" />
              <AnimatedCharacter avatar={winner.avatar} isSpeaking={true} size="xl" />
            </div>

            <div className="font-black text-sm text-amber-300 truncate max-w-full text-center mt-2">
              {winner.name}
            </div>
            <div className="text-sm font-mono font-black text-amber-400 mb-2">
              {winner.score} Puan
            </div>

            <div className="w-full h-44 rounded-t-3xl bg-gradient-to-t from-amber-900/90 via-amber-600 to-amber-400 border-t-4 border-yellow-200 flex flex-col items-center justify-center p-3 shadow-2xl shadow-amber-500/40">
              <Trophy className="w-8 h-8 text-yellow-950 mb-1" />
              <span className="text-3xl font-black text-yellow-950">1</span>
              <span className="text-xs font-black text-yellow-950 uppercase tracking-widest">
                Şampiyon
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="flex-1 max-w-[170px] flex flex-col items-center">
            <AnimatedCharacter avatar={third.avatar} size="md" />
            <div className="font-extrabold text-xs text-white truncate max-w-full text-center mt-2">
              {third.name}
            </div>
            <div className="text-xs font-mono font-bold text-slate-300 mb-2">
              {third.score} Puan
            </div>
            <div className="w-full h-24 rounded-t-2xl bg-gradient-to-t from-amber-950 to-amber-800/80 border-t-2 border-amber-600 flex flex-col items-center justify-center p-3 shadow-xl">
              <span className="text-2xl font-black text-amber-200">3</span>
              <span className="text-[11px] font-bold text-amber-300">Bronz</span>
            </div>
          </div>
        )}
      </div>

      {/* Final Action Controls */}
      <div className="w-full max-w-md flex flex-col sm:flex-row items-center gap-3">
        {isHost ? (
          <>
            <button
              onClick={() => { playSound('start_record'); startGame(); }}
              className="flex-1 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tekrar Oyna</span>
            </button>

            <button
              onClick={() => { playSound('click'); returnToLobby(); }}
              className="flex-1 w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Lobiye Dön</span>
            </button>
          </>
        ) : (
          <div className="w-full text-center p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs font-bold">
            Host'un yeni oyunu başlatması bekleniyor...
          </div>
        )}
      </div>
    </div>
  );
}
