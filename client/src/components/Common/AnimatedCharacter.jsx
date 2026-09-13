import React from 'react';

export const CHARACTER_PRESETS = [
  { id: 'cat', name: 'Neon Kedi', emoji: '🐱', color: 'cyan', border: 'border-cyan-500', bg: 'bg-cyan-500/20', text: 'text-cyan-300', glow: 'shadow-cyan-500/30' },
  { id: 'robot', name: 'Siber Robot', emoji: '🤖', color: 'purple', border: 'border-purple-500', bg: 'bg-purple-500/20', text: 'text-purple-300', glow: 'shadow-purple-500/30' },
  { id: 'wolf', name: 'Alfa Kurt', emoji: '🐺', color: 'rose', border: 'border-rose-500', bg: 'bg-rose-500/20', text: 'text-rose-300', glow: 'shadow-rose-500/30' },
  { id: 'panda', name: 'Gamer Panda', emoji: '🐼', color: 'emerald', border: 'border-emerald-500', bg: 'bg-emerald-500/20', text: 'text-emerald-300', glow: 'shadow-emerald-500/30' },
  { id: 'king', name: 'Kral Dublajcı', emoji: '👑', color: 'amber', border: 'border-amber-500', bg: 'bg-amber-500/20', text: 'text-amber-300', glow: 'shadow-amber-500/30' },
  { id: 'monkey', name: 'Çılgın Maymun', emoji: '🐒', color: 'pink', border: 'border-pink-500', bg: 'bg-pink-500/20', text: 'text-pink-300', glow: 'shadow-pink-500/30' },
  { id: 'alien', name: 'Komutan Uzaylı', emoji: '👽', color: 'lime', border: 'border-lime-500', bg: 'bg-lime-500/20', text: 'text-lime-300', glow: 'shadow-lime-500/30' },
  { id: 'pirate', name: 'Deniz Korsanı', emoji: '🏴‍☠️', color: 'orange', border: 'border-orange-500', bg: 'bg-orange-500/20', text: 'text-orange-300', glow: 'shadow-orange-500/30' },
];

export function getCharacterByAvatar(avatar) {
  return CHARACTER_PRESETS.find(c => c.emoji === avatar) || CHARACTER_PRESETS[0];
}

export default function AnimatedCharacter({
  avatar = '🐱',
  isSpeaking = false,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  badge = null
}) {
  const char = getCharacterByAvatar(avatar);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
    xl: 'w-32 h-32 text-6xl'
  }[size] || 'w-16 h-16 text-3xl';

  return (
    <div className="relative inline-flex flex-col items-center">
      <div
        className={`relative rounded-3xl ${sizeClasses} flex items-center justify-center border-2 ${char.border} ${char.bg} shadow-xl ${char.glow} transition-all duration-200 ${
          isSpeaking ? 'scale-110 animate-bounce' : 'hover:scale-105'
        }`}
      >
        {/* Animated speaking mouth wave effect */}
        {isSpeaking && (
          <span className="absolute -inset-1 rounded-3xl border-2 border-dashed border-white/60 animate-spin pointer-events-none" />
        )}

        <span className="select-none filter drop-shadow-md transform transition-transform">
          {char.emoji}
        </span>

        {/* Live Speaking Indicator */}
        {isSpeaking && (
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black shadow animate-pulse">
            🔊
          </span>
        )}
      </div>

      {badge && (
        <span className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${char.border} ${char.bg} ${char.text}`}>
          {badge}
        </span>
      )}
    </div>
  );
}
