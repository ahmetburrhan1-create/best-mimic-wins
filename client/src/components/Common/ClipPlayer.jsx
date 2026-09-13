import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, RotateCcw, Film, Mic, Sparkles } from 'lucide-react';

export default function ClipPlayer({
  clip,
  isMuted = false,
  dubbedAudioUrl = null,
  showSubtitles = true,
  autoPlay = true,
  onEnded = null
}) {
  const videoRef = useRef(null);
  const dubbedAudioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isActuallyMuted, setIsActuallyMuted] = useState(isMuted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(clip?.duration || 4);

  const videoSrc = clip?.videoUrl || '/clips/kolpacino_tayfun.mp4';

  useEffect(() => {
    setCurrentTime(0);
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = isMuted;
    video.volume = 1.0;
    setIsActuallyMuted(isMuted);

    if (autoPlay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsActuallyMuted(video.muted);
          })
          .catch((err) => {
            console.log('Video autoplay unmuted prevented, falling back to muted autoplay:', err);
            video.muted = true;
            setIsActuallyMuted(true);
            video.play().catch(() => {});
          });
      }

      if (dubbedAudioUrl && dubbedAudioRef.current) {
        dubbedAudioRef.current.currentTime = 0;
        dubbedAudioRef.current.volume = 1.0;
        dubbedAudioRef.current.play().catch(e => console.log('Dubbed audio play error:', e));
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handleVideoEnded = () => {
      setIsPlaying(false);
      if (typeof onEnded === 'function') {
        onEnded();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleVideoEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleVideoEnded);
      video.pause();
      if (dubbedAudioRef.current) dubbedAudioRef.current.pause();
    };
  }, [clip?.id, videoSrc, isMuted, dubbedAudioUrl, autoPlay]);

  const handleToggleMute = (e) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    video.volume = 1.0;
    setIsActuallyMuted(nextMuted);
    if (!nextMuted) {
      video.play().catch(() => {});
    }
  };

  const handleReplay = (e) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.volume = 1.0;
    if (!isMuted) {
      video.muted = false;
      setIsActuallyMuted(false);
    }
    video.play();
    setIsPlaying(true);

    if (dubbedAudioUrl && dubbedAudioRef.current) {
      dubbedAudioRef.current.currentTime = 0;
      dubbedAudioRef.current.volume = 1.0;
      dubbedAudioRef.current.play();
    }
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="relative w-full aspect-video max-h-[460px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 flex flex-col justify-between select-none">
      {/* Real HTML5 Video Element with Original Sound */}
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        webkit-playsinline="true"
        preload="auto"
        className="absolute inset-0 w-full h-full object-contain bg-black cursor-pointer"
        onClick={handleToggleMute}
      />

      {/* If scene is meant to have audio but browser auto-muted it: Show Click-to-Unmute Banner */}
      {!isMuted && isActuallyMuted && (
        <div 
          onClick={handleToggleMute}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[2px] cursor-pointer"
        >
          <div className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-pink-500 text-white font-black text-sm sm:text-base flex items-center gap-2.5 shadow-2xl shadow-amber-500/40 animate-pulse hover:scale-105 transition-all">
            <Volume2 className="w-5 h-5" />
            <span>🔊 Sahne Sesini Açmak İçin Dokun / Tıkla</span>
          </div>
        </div>
      )}

      {/* Subtle Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

      {/* Top Bar: Source, Character & Sound Mode */}
      <div className="relative z-10 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-md flex items-center justify-center text-xl shadow border border-white/10">
            {clip?.icon || '🎬'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-amber-500/30">
                {clip?.source || 'Film'}
              </span>
              <span className="text-xs font-bold text-slate-300 bg-black/50 px-2 py-0.5 rounded-md">
                {clip?.character}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dubbedAudioUrl ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-black animate-pulse">
              <Mic className="w-3.5 h-3.5" />
              <span>Oyuncunun Dublaj Sesi</span>
            </div>
          ) : (
            <button
              onClick={handleToggleMute}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isActuallyMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
              title={isActuallyMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isActuallyMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
              <span>{isActuallyMuted ? 'Sesi Aç 🔇' : 'Ses Açık 🔊'}</span>
            </button>
          )}

          <button
            onClick={handleReplay}
            className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all active:scale-95"
            title="Tekrar Oynat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom: The Exact Single Sentence Subtitle */}
      {showSubtitles && (
        <div className="relative z-10 p-5 flex flex-col items-center">
          {clip?.tips && (
            <div className="mb-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{clip.tips}</span>
            </div>
          )}

          <div className="bg-black/80 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/15 shadow-2xl text-center max-w-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
              1 CÜMLELİK REPLİK:
            </span>
            <p className="text-xl sm:text-2xl font-black text-yellow-300 tracking-wide drop-shadow-[0_2px_12px_rgba(234,179,8,0.8)] m-0">
              "{clip?.subtitle}"
            </p>
          </div>
        </div>
      )}

      {/* Progress Timeline Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/80 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 transition-all duration-75 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Dubbed Audio playback element */}
      {dubbedAudioUrl && (
        <audio 
          ref={dubbedAudioRef} 
          src={dubbedAudioUrl} 
          autoPlay 
          playsInline
        />
      )}
    </div>
  );
}
