import React, { useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import AnimatedCharacter from '../Common/AnimatedCharacter';
import { playSound } from '../../utils/sfx';
import { Trophy, Star, ArrowUpRight, Clock, Award } from 'lucide-react';

export default function ScoreboardPhase() {
  const { room, currentPlayer } = useSocket();

  useEffect(() => {
    playSound('win');
  }, []);

  const sortedPlayers = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-xs mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>Tur {room.currentRound} / {room.totalRounds} Tamamlandı</span>
        </div>
        <h2 className="text-3xl font-black text-white m-0 tracking-tight">
          Tur Puanları & Sıralama
        </h2>
        <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span>Sonraki tura geçişe: <strong className="text-white">{room.timer}s</strong></span>
        </div>
      </div>

      {/* Players Leaderboard Table */}
      <div className="w-full space-y-3 mb-6">
        {sortedPlayers.map((player, index) => {
          const isMe = player.socketId === currentPlayer?.socketId;
          const isLeader = index === 0;

          return (
            <div
              key={player.socketId}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between shadow-xl ${
                isLeader
                  ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/50 ring-1 ring-amber-500/30'
                  : isMe
                  ? 'bg-indigo-950/40 border-indigo-500/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {/* Rank & Profile */}
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                  index === 0
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                    : index === 1
                    ? 'bg-slate-300 text-slate-950'
                    : index === 2
                    ? 'bg-amber-700 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {index + 1}
                </div>

                <AnimatedCharacter avatar={player.avatar} size="sm" />

                <div>
                  <div className="font-black text-sm text-white flex items-center gap-1.5">
                    <span>{player.name}</span>
                    {isMe && <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/20 px-1.5 py-0.2 rounded-md">SEN</span>}
                    {player.powerUp && (
                      <span className="text-xs" title={player.powerUp.name}>
                        {player.powerUp.icon}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Alınan Oy: <strong className="text-pink-400">{player.votesReceived || 0}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      +{player.roundScore || 0} puan
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Score */}
              <div className="text-right">
                <div className="text-xs text-slate-500 font-bold uppercase">Toplam</div>
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 font-mono">
                  {player.score || 0}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
