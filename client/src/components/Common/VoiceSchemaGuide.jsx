import React from 'react';
import { Activity, Mic, Zap, Volume2, ShieldCheck } from 'lucide-react';

export default function VoiceSchemaGuide({
  clip,
  elapsedTime = 0,
  userAudioLevel = 0,
  frequencyBars = [],
  isRecording = false
}) {
  const duration = clip?.duration || 10;
  const progressPercent = Math.min(100, (elapsedTime / duration) * 100);

  // Fallback visualizer bars when idle or recording
  const barsCount = 24;
  const activeBars = Array.from({ length: barsCount }).map((_, idx) => {
    if (isRecording && frequencyBars && frequencyBars.length > idx) {
      return Math.max(8, frequencyBars[idx]);
    }
    if (isRecording) {
      // Dynamic responsiveness based on audioLevel
      const spread = Math.sin(idx * 0.5) * 15;
      return Math.max(6, Math.min(100, userAudioLevel * 0.9 + spread));
    }
    // Idle ambient pulse
    return 10 + Math.sin(idx * 0.4) * 6;
  });

  // VU Meter segments (12 segments)
  const vuSegmentsCount = 12;
  const activeSegmentCount = Math.round((userAudioLevel / 100) * vuSegmentsCount);

  // Status text based on loudness
  const getStatusText = () => {
    if (!isRecording) return { text: 'Mikrofon Beklemede', color: 'text-slate-400', bg: 'bg-slate-800/80 border-slate-700' };
    if (userAudioLevel < 10) return { text: 'Ses Bekleniyor... (Konuş)', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40 animate-pulse' };
    if (userAudioLevel < 40) return { text: 'Normal Konuşma Tonu 🎙️', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' };
    if (userAudioLevel < 75) return { text: 'Harika Taklit Seviyesi 🔥', color: 'text-yellow-300', bg: 'bg-yellow-500/20 border-yellow-500/40 animate-pulse' };
    return { text: 'Zirve Vurgu / Yüksek Güç ⚡', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40 animate-pulse' };
  };

  const status = getStatusText();

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl">
      {/* Top Bar: Title, Anti-Ducking Guarantee & Live Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Canlı Stüdyo Ses Göstergesi</span>
              <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Sabit Kazanç (Ses Kısma Kapalı)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Status Badge */}
        <div className={`px-3 py-1 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-sm ${status.bg} ${status.color}`}>
          <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
          <span>{status.text}</span>
        </div>
      </div>

      {/* Main 24-Band Dancing Frequency Spectrum */}
      <div className="relative h-20 bg-slate-950/90 rounded-2xl border border-slate-800/90 overflow-hidden flex items-end px-3 py-2 gap-1.5 shadow-inner">
        {/* Frequency Bars */}
        {activeBars.map((height, i) => {
          // Color grading: Bass (cyan) -> Mids (emerald/amber) -> Highs (rose)
          let barGradient = 'from-cyan-500 to-blue-600';
          if (i >= 8 && i < 16) barGradient = 'from-emerald-400 to-teal-500';
          else if (i >= 16 && i < 20) barGradient = 'from-amber-400 to-yellow-500';
          else if (i >= 20) barGradient = 'from-pink-500 to-rose-600';

          return (
            <div key={i} className="flex-1 h-full flex flex-col justify-end items-center relative group">
              {/* Peak LED Dot */}
              {isRecording && height > 15 && (
                <div
                  className="w-full h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)] mb-0.5 transition-all duration-75"
                  style={{ opacity: height > 30 ? 1 : 0.4 }}
                />
              )}

              {/* Bar Fill */}
              <div
                className={`w-full rounded-t-md bg-gradient-to-t ${barGradient} transition-all duration-75 ease-out shadow-sm`}
                style={{
                  height: `${height}%`,
                  opacity: isRecording ? (userAudioLevel > 5 ? 1 : 0.35) : 0.2
                }}
              />
            </div>
          );
        })}

        {/* Playback & Record Timeline Head */}
        {isRecording && (
          <div
            className="absolute bottom-0 top-0 w-1 bg-white shadow-[0_0_12px_#ffffff] transition-all duration-100 pointer-events-none z-10"
            style={{ left: `${progressPercent}%` }}
          />
        )}
      </div>

      {/* Real-time VU-Meter (Decibel Scale) */}
      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold">
          <span>VU-METRE / GİRİŞ ŞİDDETİ:</span>
          <span className="text-amber-300 font-mono font-black text-xs">
            {isRecording ? `%${userAudioLevel} (SABİT SEVİYE)` : '0%'}
          </span>
        </div>

        {/* Multi-Segment LED Meter Bar */}
        <div className="grid grid-cols-12 gap-1 h-3.5">
          {Array.from({ length: vuSegmentsCount }).map((_, idx) => {
            const isActive = isRecording && idx < activeSegmentCount;
            let segColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]';
            if (idx >= 7 && idx < 10) segColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
            else if (idx >= 10) segColor = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]';

            return (
              <div
                key={idx}
                className={`rounded-sm transition-all duration-75 ${
                  isActive ? segColor : 'bg-slate-800/50'
                }`}
              />
            );
          })}
        </div>

        {/* Decibel Labels */}
        <div className="flex justify-between text-[9px] font-mono text-slate-500">
          <span>-40 dB</span>
          <span>-24 dB</span>
          <span>-12 dB</span>
          <span>-6 dB</span>
          <span className="text-rose-400 font-bold">0 dB PEAK</span>
        </div>
      </div>

      {/* Bottom Timeline & Duration */}
      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Kayıt Süresi: {elapsedTime.toFixed(1)}s / {duration}s</span>
        </span>
        <span className="text-yellow-400 font-bold">
          "{clip?.subtitle || 'Repliği net ve güçlü söyle'}"
        </span>
      </div>
    </div>
  );
}
