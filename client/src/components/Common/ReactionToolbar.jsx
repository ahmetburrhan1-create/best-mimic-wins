import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { playSound } from '../../utils/sfx';

const REACTION_EMOJIS = ['🔥', '😂', '💀', '👏', '🎭', '🏆'];

export default function ReactionToolbar() {
  const { sendReaction } = useSocket();

  const handleEmojiClick = (emoji) => {
    playSound('click');
    sendReaction(emoji);
  };

  return (
    <div className="flex items-center justify-center gap-2 p-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
      <span className="text-xs text-slate-400 font-bold px-2 hidden sm:inline">Tepki Ver:</span>
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 active:scale-125 transition-all flex items-center justify-center text-xl shadow hover:shadow-indigo-500/20"
          title="Tepki Gönder"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
