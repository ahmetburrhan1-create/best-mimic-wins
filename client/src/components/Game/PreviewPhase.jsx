import React, { useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import ClipPlayer from '../Common/ClipPlayer';
import ReactionToolbar from '../Common/ReactionToolbar';
import { playSound } from '../../utils/sfx';
import { Clock, Eye, Sparkles } from 'lucide-react';

export default function PreviewPhase() {
  const { room } = useSocket();
  const clip = room.currentClip;

  useEffect(() => {
    playSound('tick');
  }, [room.timer]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-extrabold text-xs">
            Tur {room.currentRound} / {room.totalRounds}
          </span>
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Klibi Tanı & Repliği Ezberle</span>
          </span>
        </div>

        {/* Big Countdown Timer */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-black text-base shadow animate-pulse">
          <Clock className="w-4 h-4" />
          <span>Kayıta: {room.timer}s</span>
        </div>
      </div>

      {/* Synchronized Clip Showcase */}
      <div className="w-full mb-6">
        <ClipPlayer
          clip={clip}
          isMuted={false}
          showSubtitles={true}
          autoPlay={true}
        />
      </div>

      {/* Mode & Performance Guidance Card */}
      <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 backdrop-blur-xl mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shrink-0">
            💡
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {room.settings.mode === 'mimic' ? 'Birebir Ses Taklidi Görevi' : 'Komik Dublaj / Parodi Görevi'}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {room.settings.mode === 'mimic'
                ? 'Karakterin ses tonunu, hızını ve duygusunu olabildiğince aynı yapmaya çalış.'
                : 'Kendi komik sözlerini uydur veya repliği saçmalayarak komediye çevir!'}
            </p>
          </div>
        </div>

        {/* Reaction Bar */}
        <ReactionToolbar />
      </div>
    </div>
  );
}
