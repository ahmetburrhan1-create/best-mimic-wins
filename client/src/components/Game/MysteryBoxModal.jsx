import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import AnimatedCharacter from '../Common/AnimatedCharacter';
import { Gift, Sparkles, Target, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import { playSound } from '../../utils/sfx';

export const POWER_UPS = [
  { id: 'helium', name: 'Helyum Gazı (Tiz Sincap Sesi)', desc: 'Kurbanın sesini çizgi film sincabı gibi incecik ve komik yapar!', icon: '🐿️', color: 'from-amber-500 to-yellow-400', audioEffect: 'helium' },
  { id: 'monster', name: 'Canavar / İblis Modu', desc: 'Kurbanın sesini derinden gelen korkutucu bir canavara çevirir!', icon: '👹', color: 'from-purple-600 to-red-700', audioEffect: 'monster' },
  { id: 'robot', name: 'Robotik Vocoder Efekti', desc: 'Kurbanın sesine sibernetik robot ve mekanik cızırtı basar!', icon: '🤖', color: 'from-cyan-500 to-blue-600', audioEffect: 'robot' },
  { id: 'echo', name: 'Stadyum Yankısı (Mega Eko)', desc: 'Ses dev bir amfide yankılanır!', icon: '📢', color: 'from-emerald-500 to-teal-600', audioEffect: 'echo' },
  { id: 'swap', name: 'Kader Çarkı (Ses Takası)', desc: 'Seçtiğin kişinin ses kaydı ile senin ses kaydın yer değiştirir!', icon: '🔄', color: 'from-pink-500 to-rose-600', audioEffect: 'swap' },
  { id: 'score_boost', name: '2x Puan Katlayıcı', desc: 'Seçilen kişi bu tur alacağı her oydan 2 kat puan kazanır!', icon: '🚀', color: 'from-amber-400 to-orange-500', audioEffect: 'none' },
  { id: 'shield', name: 'Puan Kalkanı (+60 Puan)', desc: 'Turda hiç oy alınamazsa bile garanti teselli puanı verir!', icon: '🛡️', color: 'from-blue-500 to-indigo-600', audioEffect: 'none' }
];

export default function MysteryBoxModal({ onSelectPowerUp, currentRound = 1 }) {
  const { room, currentPlayer } = useSocket();
  const [openedBox, setOpenedBox] = useState(null);
  const [selectedPowerUp, setSelectedPowerUp] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState(currentPlayer?.socketId);

  const handleOpenBox = (boxIndex) => {
    if (openedBox !== null) return;
    playSound('win');
    setOpenedBox(boxIndex);

    // Draw random power-up
    const randomPower = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
    setSelectedPowerUp(randomPower);
  };

  const handleConfirmAndApply = () => {
    playSound('click');
    const targetPlayer = room.players.find(p => p.socketId === selectedTargetId) || currentPlayer;

    const payload = {
      ...selectedPowerUp,
      targetSocketId: selectedTargetId,
      targetName: targetPlayer.name,
      senderSocketId: currentPlayer?.socketId,
      senderName: currentPlayer?.name
    };

    if (onSelectPowerUp) {
      onSelectPowerUp(payload, true);
    }
  };

  const isSelf = selectedTargetId === currentPlayer?.socketId;
  const targetPlayer = room.players.find(p => p.socketId === selectedTargetId);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Tur {currentRound} — Şans & Lanet Çarkı</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white m-0 tracking-tight">
          {openedBox === null ? 'GİZEMLİ KUTUNU SEÇ! 🎁' : 'HEDEFİNİ SEÇ! 🎯'}
        </h2>
        <p className="text-xs text-slate-300 mt-1 mb-6">
          {openedBox === null
            ? 'Kutudan çıkan özelliği ister kendine al, ister bir arkadaşına yapıştır!'
            : 'Bu özelliği kime uygulamak istersin? Arkadaşını trolle veya kendini güçlendir!'}
        </p>

        {/* Step 1: Open Mystery Box */}
        {openedBox === null ? (
          <div className="grid grid-cols-3 gap-4 w-full mb-6">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => handleOpenBox(idx)}
                className="group relative p-6 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-500/40 hover:border-amber-400 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center shadow-xl shadow-amber-500/10"
              >
                <div className="text-5xl mb-2 filter drop-shadow-lg group-hover:rotate-12 transition-transform">
                  🎁
                </div>
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Kutu {idx + 1}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Step 2: Target Selection Screen */
          <div className="w-full flex flex-col items-center mb-6">
            {/* Revealed Card Banner */}
            <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-400/80 shadow-xl flex items-center gap-4 mb-4 text-left">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${selectedPowerUp.color} flex items-center justify-center text-3xl shadow-lg shrink-0 border border-white/20`}>
                {selectedPowerUp.icon}
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  KUTUDAN ÇIKAN ÖZELLİK:
                </span>
                <h4 className="text-base font-black text-white m-0">
                  {selectedPowerUp.name}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedPowerUp.desc}
                </p>
              </div>
            </div>

            {/* Target Players Grid */}
            <div className="w-full">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Target className="w-4 h-4 text-pink-400" />
                <span>Hedef Oyuncuyu Seç:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                {room.players.map((p) => {
                  const isPlayerSelf = p.socketId === currentPlayer?.socketId;
                  const isSelected = selectedTargetId === p.socketId;

                  return (
                    <button
                      key={p.socketId}
                      onClick={() => setSelectedTargetId(p.socketId)}
                      className={`p-3 rounded-2xl border transition-all flex flex-col items-center text-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-400/40 shadow-lg scale-105'
                          : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-700/80'
                      }`}
                    >
                      <AnimatedCharacter avatar={p.avatar} size="sm" />
                      <span className="text-xs font-black text-white truncate max-w-full">
                        {p.name} {isPlayerSelf && '(Sen)'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400'
                      }`}>
                        {isSelected ? 'Hedef Seçildi 🎯' : 'Seç'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {openedBox !== null && (
          <button
            onClick={handleConfirmAndApply}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-pink-600/30 transition-all hover:scale-105"
          >
            <Target className="w-4 h-4" />
            <span>
              {isSelf
                ? `Kendime Uygula (${selectedPowerUp.name})`
                : `${targetPlayer?.name}'e Uygula ve Trolle! 😈`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
