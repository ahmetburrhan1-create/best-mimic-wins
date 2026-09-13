import React from 'react';
import { useSocket } from '../../context/SocketContext';

export default function ReactionOverlay() {
  const { reactions } = useSocket();

  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((reaction, index) => {
        // Deterministic horizontal spread based on reaction id
        const leftPercent = 15 + ((reaction.id.charCodeAt(0) * 17) % 70);

        return (
          <div
            key={reaction.id || index}
            className="absolute bottom-16 animate-float-emoji flex flex-col items-center select-none"
            style={{ left: `${leftPercent}%` }}
          >
            <span className="text-4xl md:text-5xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] transform transition-transform hover:scale-125">
              {reaction.emoji}
            </span>
            {reaction.senderName && (
              <span className="mt-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white border border-white/20 whitespace-nowrap shadow">
                {reaction.senderName}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
