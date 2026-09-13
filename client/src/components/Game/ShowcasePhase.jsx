import React, { useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import ClipPlayer from '../Common/ClipPlayer';
import ReactionToolbar from '../Common/ReactionToolbar';
import AnimatedCharacter from '../Common/AnimatedCharacter';
import { playWithEffect } from '../../utils/audioFilters';
import { Sparkles, Zap, Volume2 } from 'lucide-react';

export default function ShowcasePhase() {
  const { room, currentPlayer } = useSocket();
  const clip = room.currentClip;
  const currentItem = room.showcaseItem;

  const audioHandleRef = useRef(null);

  const isMe = currentItem?.socketId === currentPlayer?.socketId;
  const effect = currentItem?.powerUp?.audioEffect || 'normal';

  useEffect(() => {
    if (currentItem?.audioData) {
      // Play through DSP audio effect filter
      playWithEffect(currentItem.audioData, effect).then((handle) => {
        audioHandleRef.current = handle;
      });
    }

    return () => {
      if (audioHandleRef.current) {
        audioHandleRef.current.stop();
      }
    };
  }, [currentItem?.socketId, effect]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Top Banner: Current Performance & Character Stage */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AnimatedCharacter
            avatar={currentItem?.avatar || '🐱'}
            isSpeaking={true}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                Şu Anki Performans ({ (room.showcaseIndex || 0) + 1 } / { room.showcaseTotal || 1 })
              </span>
              {isMe && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-black animate-pulse">
                  SENİN DUBLAJIN
                </span>
              )}
              {currentItem?.powerUp && (
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-black flex items-center gap-1">
                  <span>{currentItem.powerUp.icon}</span>
                  <span>{currentItem.powerUp.name}</span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-white m-0">
              {currentItem?.name || 'Oyuncu'} Dublajı
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold text-sm shadow">
          <span>Kalan: {room.timer}s</span>
        </div>
      </div>

      {/* Main Video Stage */}
      <div className="w-full mb-6">
        <ClipPlayer
          clip={clip}
          isMuted={true}
          showSubtitles={true}
          autoPlay={true}
        />
      </div>

      {/* Live Reactions & Audience Interactivity */}
      <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 backdrop-blur-xl mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Dublajı nasıl buldun? Canlı tepki ver, ekrana emojiler uçuşsun!</span>
        </div>

        {/* Reaction Bar */}
        <ReactionToolbar />
      </div>
    </div>
  );
}
