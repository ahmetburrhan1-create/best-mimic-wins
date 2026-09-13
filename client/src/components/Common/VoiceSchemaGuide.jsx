import React from 'react';
import { Volume2, Activity, Zap } from 'lucide-react';

export default function VoiceSchemaGuide({
  clip,
  elapsedTime = 0,
  userAudioLevel = 0,
  isRecording = false
}) {
  const duration = clip?.duration || 10;
  const progressPercent = Math.min(100, (elapsedTime / duration) * 100);

  // Generate intonation segments based on timeline
  const timeline = clip?.timeline || [
    { start: 0, end: duration * 0.4, text: clip?.subtitle?.slice(0, 30) },
    { start: duration * 0.4, end: duration, text: clip?.subtitle?.slice(30) }
  ];

  // Derive target energy for current segment
  const currentSegmentIndex = timeline.findIndex(
    item => elapsedTime >= item.start && elapsedTime <= item.end
  );
  
  // Last segment is usually high energy punchline
  const isHighEnergy = currentSegmentIndex === timeline.length - 1;
  const targetEnergy = isHighEnergy ? 'YÜKSEK (BAĞIRMA / VURGU)' : 'ORTA (NORMAL TON)';

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-pink-400 animate-pulse" />
          <span className="text-xs font-black text-white uppercase tracking-wider">
            Ses & Tonlama Şeması (Ritim Kılavuzu)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">Hedef Ton:</span>
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${
            isHighEnergy
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
          }`}>
            {targetEnergy}
          </span>
        </div>
      </div>

      {/* Target Voice Wave Curve / Bars */}
      <div className="relative h-14 bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden flex items-end px-2 py-1 gap-1">
        {/* Render rhythmic syllable bars */}
        {Array.from({ length: 32 }).map((_, i) => {
          const barProgress = (i / 32) * 100;
          const isPassed = barProgress <= progressPercent;

          // Simulated wave pattern with peak at the end
          const heightPercent = 25 + Math.sin(i * 0.4) * 20 + (i > 22 ? 40 : 0);

          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-100"
              style={{
                height: `${heightPercent}%`,
                backgroundColor: isPassed
                  ? (i > 22 ? '#f43f5e' : '#6366f1')
                  : '#1e293b',
                opacity: isPassed ? 1 : 0.4
              }}
            />
          );
        })}

        {/* Real-time User Voice Overlay Indicator */}
        {isRecording && (
          <div
            className="absolute bottom-0 h-full w-2 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] transition-all duration-75 pointer-events-none z-10"
            style={{ left: `${progressPercent}%` }}
          >
            {/* Live user mic height indicator */}
            <div
              className="absolute -top-3 -left-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-lg border-2 border-slate-900"
            >
              {userAudioLevel > 20 ? '🔥' : '🎙️'}
            </div>
          </div>
        )}
      </div>

      {/* Syllables / Timeline Guide Text */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-cyan-400" />
          <span>Giriş & Diyalog</span>
        </span>
        <span className="text-amber-400 font-bold">
          {isRecording ? `Canlı Ses Seviyesi: %${userAudioLevel}` : 'Kayda başlayınca ritmi takip et'}
        </span>
        <span className="flex items-center gap-1 text-rose-400">
          <Zap className="w-3 h-3" />
          <span>Patlama / Vurgu</span>
        </span>
      </div>
    </div>
  );
}
