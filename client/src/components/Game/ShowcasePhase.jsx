import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import ClipPlayer from '../Common/ClipPlayer';
import ReactionToolbar from '../Common/ReactionToolbar';
import AnimatedCharacter from '../Common/AnimatedCharacter';
import { playWithEffect, getAudioContext } from '../../utils/audioFilters';
import { Sparkles, Zap, Volume2, RotateCcw, Play } from 'lucide-react';

export default function ShowcasePhase() {
  const { room, currentPlayer } = useSocket();
  const clip = room.currentClip;
  const currentItem = room.showcaseItem;

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [replayTrigger, setReplayTrigger] = useState(1);
  const audioHandleRef = useRef(null);

  const isMe = currentItem?.socketId === currentPlayer?.socketId;
  const effect = currentItem?.powerUp?.audioEffect || 'normal';

  const playVoice = useCallback(() => {
    if (!currentItem?.audioData) return;
    if (audioHandleRef.current) {
      audioHandleRef.current.stop();
    }

    // Trigger video to restart from 0:00 in lockstep with the voice
    setReplayTrigger(prev => prev + 1);

    setIsPlayingAudio(true);
    playWithEffect(currentItem.audioData, effect, () => {
      setIsPlayingAudio(false);
    }).then((handle) => {
      audioHandleRef.current = handle;
    }).catch(() => {
      setIsPlayingAudio(false);
    });
  }, [currentItem?.audioData, effect]);

  useEffect(() => {
    // Unlock AudioContext and play
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    playVoice();

    return () => {
      if (audioHandleRef.current) {
        audioHandleRef.current.stop();
      }
      setIsPlayingAudio(false);
    };
  }, [currentItem?.socketId, playVoice]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Top Banner: Current Performance & Character Stage */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 p-4 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-xl">
        <div className="flex items-center gap-3">
          <AnimatedCharacter
            avatar={currentItem?.avatar || '🐱'}
            isSpeaking={isPlayingAudio}
            size="md"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                Performans ({ (room.showcaseIndex || 0) + 1 } / { room.showcaseTotal || 1 })
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
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-lg font-black text-white m-0">
                {currentItem?.name || 'Oyuncu'} Dublajı
              </h3>
              {isPlayingAudio && (
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-bounce" />
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Direct Play/Replay Dubbing Audio Button */}
          <button
            onClick={playVoice}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
            <span>{isPlayingAudio ? 'Tekrar Dinle 🔊' : 'Sesi Dinle ▶️'}</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs shadow">
            <span>{room.timer}s</span>
          </div>
        </div>
      </div>

      {/* Main Video Stage: Plays Video in Background Synchronized with Player Voice */}
      <div className="w-full mb-6">
        <ClipPlayer
          clip={clip}
          isMuted={true}
          isDubbedMode={true}
          showSubtitles={true}
          autoPlay={true}
          replayTrigger={replayTrigger}
          onReplay={playVoice}
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
