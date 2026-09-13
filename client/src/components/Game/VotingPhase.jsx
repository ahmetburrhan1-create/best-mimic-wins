import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import AnimatedCharacter from '../Common/AnimatedCharacter';
import { playSound } from '../../utils/sfx';
import { playWithEffect } from '../../utils/audioFilters';
import { Vote, Volume2, CheckCircle2, Clock, ThumbsUp, Square } from 'lucide-react';

export default function VotingPhase() {
  const { room, currentPlayer, submitVote } = useSocket();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioHandleRef = React.useRef(null);

  const candidates = room.players.filter(p => p.hasRecorded);
  const hasVoted = currentPlayer?.hasVoted || !!selectedCandidate;

  const handleVote = (candidateSocketId) => {
    if (hasVoted) return;
    playSound('vote');
    setSelectedCandidate(candidateSocketId);
    submitVote(candidateSocketId);
  };

  const handleTogglePreview = (player) => {
    if (!player.recording?.audioData) return;

    if (playingAudioId === player.socketId) {
      if (audioHandleRef.current) audioHandleRef.current.stop();
      setPlayingAudioId(null);
    } else {
      if (audioHandleRef.current) audioHandleRef.current.stop();
      setPlayingAudioId(player.socketId);

      const effect = player.powerUp?.audioEffect || 'normal';
      playWithEffect(player.recording.audioData, effect, () => {
        setPlayingAudioId(null);
      }).then(handle => {
        audioHandleRef.current = handle;
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white m-0">
              Oylama Zamanı!
            </h2>
            <p className="text-xs text-slate-400">
              {room.settings.mode === 'mimic'
                ? 'Karakteri en iyi taklit eden performansı seç!'
                : 'Seni en çok güldüren dublaja oyunu ver!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-pink-500/20 border border-pink-500/40 text-pink-300 font-mono font-black text-base shadow">
          <Clock className="w-4 h-4" />
          <span>Kalan: {room.timer}s</span>
        </div>
      </div>

      {hasVoted && (
        <div className="w-full mb-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-2 font-bold text-sm shadow">
          <CheckCircle2 className="w-5 h-5" />
          <span>Oyun başarıyla kaydedildi! Diğer oyuncuların oyları bekleniyor...</span>
        </div>
      )}

      {/* Candidates Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {candidates.map((candidate) => {
          const isMe = candidate.socketId === currentPlayer?.socketId;
          const isSelected = selectedCandidate === candidate.socketId || currentPlayer?.votedFor === candidate.socketId;
          const canVote = !hasVoted && (!isMe || candidates.length === 1);
          const isPlaying = playingAudioId === candidate.socketId;

          return (
            <div
              key={candidate.socketId}
              className={`relative p-5 rounded-3xl border transition-all flex flex-col items-center justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-pink-950/60 to-slate-900 border-pink-500 shadow-xl shadow-pink-500/20 ring-2 ring-pink-500/40 scale-[1.02]'
                  : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {/* Avatar & Info */}
              <div className="flex flex-col items-center text-center">
                <AnimatedCharacter
                  avatar={candidate.avatar}
                  isSpeaking={isPlaying}
                  size="lg"
                />

                <div className="font-black text-base text-white mt-3">
                  {candidate.name} {isMe && <span className="text-xs text-indigo-400 font-bold">(Sen)</span>}
                </div>

                {/* Power-Up Badge */}
                {candidate.powerUp && (
                  <span className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-white/10 text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <span>{candidate.powerUp.icon}</span>
                    <span>{candidate.powerUp.name}</span>
                  </span>
                )}

                {/* Quick Audio Preview Button */}
                {candidate.recording?.audioData && (
                  <button
                    onClick={() => handleTogglePreview(candidate)}
                    className={`mt-3 px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isPlaying
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Durdur' : 'Sesi Dinle'}</span>
                  </button>
                )}
              </div>

              {/* Vote Button */}
              <div className="w-full mt-5">
                {isMe && candidates.length > 1 ? (
                  <div className="text-center py-2 text-xs font-bold text-slate-500">
                    (Kendine oy veremezsin)
                  </div>
                ) : (
                  <button
                    onClick={() => handleVote(candidate.socketId)}
                    disabled={!canVote}
                    className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : canVote
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-600/20 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Oylandı</span>
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="w-4 h-4" />
                        <span>En İyisi Bu!</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
