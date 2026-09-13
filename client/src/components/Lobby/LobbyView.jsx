import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import AnimatedCharacter from '../Common/AnimatedCharacter';
import { Copy, Check, Play, Crown, Settings2, Users, Mic, PlusCircle, Sparkles, UserPlus, Film, X, Bot, Search, Shuffle, AlertCircle, Loader2 } from 'lucide-react';
import { playSound } from '../../utils/sfx';

export default function LobbyView() {
  const { room, isHost, currentPlayer, setReady, updateSettings, startGame, addCustomClip, generateAiClip, aiClipProgress, setAiClipProgress } = useSocket();
  const [copied, setCopied] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddClipModal, setShowAddClipModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [allowSoloStart, setAllowSoloStart] = useState(false);

  // AI Clip State
  const [aiQuery, setAiQuery] = useState('');
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiResultClip, setAiResultClip] = useState(null);
  const [aiError, setAiError] = useState(null);

  // New Custom Clip Form State
  const [customTitle, setCustomTitle] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [customCharacter, setCustomCharacter] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customCategory, setCustomCategory] = useState('komedi');
  const [clipAddedMsg, setClipAddedMsg] = useState(false);

  const handleCopyCode = () => {
    playSound('click');
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    playSound('click');
    setReady(!currentPlayer?.isReady);
  };

  const handleStartGame = () => {
    playSound('start_record');
    startGame();
  };

  const handleAddClipSubmit = (e) => {
    e.preventDefault();
    if (!customSubtitle.trim()) return;

    playSound('win');
    addCustomClip({
      title: customTitle.trim() || `${customSource} Repliği`,
      source: customSource.trim() || 'Özel Sahne',
      character: customCharacter.trim() || 'Özel Karakter',
      subtitle: customSubtitle.trim(),
      category: customCategory,
      duration: 12
    });

    setClipAddedMsg(true);
    setTimeout(() => {
      setClipAddedMsg(false);
      setShowAddClipModal(false);
      setCustomTitle('');
      setCustomSource('');
      setCustomCharacter('');
      setCustomSubtitle('');
    }, 1500);
  };

  const handleAiGenerate = async (query = '', isRandom = false) => {
    playSound('click');
    setAiIsGenerating(true);
    setAiError(null);
    setAiResultClip(null);

    const res = await generateAiClip({ query, isRandom });
    setAiIsGenerating(false);

    if (res?.success && res.clip) {
      playSound('win');
      setAiResultClip(res.clip);
    } else {
      playSound('wrong');
      setAiError(res?.error || 'Klip oluşturulamadı. Lütfen başka bir film/replik adı deneyin.');
    }
  };

  const playerCount = room.players.length;
  const isTooFew = playerCount < 2;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Banner: Room Code & Quick Invite */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 mb-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Oda Kodu (Arkadaşlarını Çağır)
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-400 tracking-wider">
              {room.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="Kodu Kopyala"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
            </button>
          </div>
        </div>

        {/* Game Mode / Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { playSound('click'); setShowAiModal(true); }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/50 text-purple-200 hover:text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-lg animate-pulse"
          >
            <Bot className="w-4 h-4 text-pink-400" />
            <span>🤖 AI YouTube Sahne Kesici</span>
          </button>

          <button
            onClick={() => { playSound('click'); setShowAddClipModal(true); }}
            className="px-3.5 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Film className="w-3.5 h-3.5 text-pink-400" />
            <span>+ Manuel Replik Ekle</span>
          </button>

          {isHost && (
            <button
              onClick={() => { playSound('click'); setShowSettingsModal(true); }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Ayarlar</span>
            </button>
          )}
        </div>
      </div>

      {/* Minimum Player Warning */}
      {isTooFew && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              Ses taklidi ve oylama partisi için <strong>en az 2 oyuncu</strong> önerilir. 
              İkinci bir sekme açarak veya arkadaşına oda kodunu vererek katılmasını sağla!
            </span>
          </div>

          {isHost && (
            <button
              onClick={() => setAllowSoloStart(!allowSoloStart)}
              className="text-[11px] font-bold underline hover:text-white shrink-0"
            >
              {allowSoloStart ? 'Normal Kurala Dön' : 'Yine de Tek Başlat'}
            </button>
          )}
        </div>
      )}

      {/* Players List Grid */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 mb-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-black text-white m-0">
              Lobi Oyuncuları ({playerCount}/12)
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            Her oyuncu kendi özel maskotuna ve rengine sahip
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {room.players.map((p) => {
            const isMe = p.socketId === currentPlayer?.socketId;
            return (
              <div
                key={p.socketId}
                className={`relative p-4 rounded-2xl border transition-all flex flex-col items-center text-center ${
                  isMe
                    ? 'bg-indigo-950/40 border-indigo-500/50 ring-2 ring-indigo-500/20'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                {/* Host Crown */}
                {p.isHost && (
                  <div className="absolute -top-2.5 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Crown className="w-3 h-3" />
                    <span>HOST</span>
                  </div>
                )}

                {/* Animated Mascot Character */}
                <div className="my-2">
                  <AnimatedCharacter avatar={p.avatar} size="md" />
                </div>

                {/* Name */}
                <div className="font-extrabold text-sm text-white truncate max-w-full">
                  {p.name} {isMe && <span className="text-indigo-400 text-xs">(Sen)</span>}
                </div>

                {/* Ready Status */}
                <div className="mt-2">
                  {p.isHost ? (
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      👑 Oda Yöneticisi
                    </span>
                  ) : p.isReady ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Hazır</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">
                      Bekliyor...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Room Replik Havuzu Summary Card */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/70 rounded-3xl p-5 mb-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-pink-400" />
            <h3 className="text-sm font-black text-white m-0">
              Odadaki Sahne & Replik Havuzu ({13 + (room.customClips?.length || 0)} Klip Aktif)
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {room.customClips?.length > 0 ? `+${room.customClips.length} Özel/AI Sahne` : 'Varsayılan Kült Havuz'}
          </span>
        </div>

        {room.customClips && room.customClips.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {room.customClips.map((c, i) => (
              <div key={i} className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 shadow">
                <span>{c.icon || '🎬'}</span>
                <span className="text-white font-extrabold">{c.source}:</span>
                <span className="italic text-slate-300">"{c.subtitle}"</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>G.O.R.A., Kolpaçino, Kurtlar Vadisi, Fight Club, Ezel, Godfather, Behzat Ç., Kemal Sunal ve daha fazlası hazır!</span>
            <button
              onClick={() => { playSound('click'); setShowAiModal(true); }}
              className="text-[11px] font-black text-pink-400 hover:text-pink-300 underline shrink-0"
            >
              + AI ile Yeni Sahne Çek
            </button>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Mic className="w-4 h-4 text-emerald-400" />
          <span>Kayıt başladığında mikrofon izin penceresine izin ver.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isHost && (
            <button
              onClick={handleToggleReady}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-extrabold text-sm transition-all shadow-lg ${
                currentPlayer?.isReady
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {currentPlayer?.isReady ? 'Hazır Durumu İptal Et' : 'Hazırım! 🚀'}
            </button>
          )}

          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={isTooFew && !allowSoloStart}
              className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-pink-600 to-amber-500 hover:opacity-90 active:scale-95 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {isTooFew && !allowSoloStart
                  ? 'Oyuncu Bekleniyor (En az 2)'
                  : `Oyunu Başlat (${playerCount} Oyuncu)`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Clip Modal */}
      {showAddClipModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setShowAddClipModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
              <Film className="w-5 h-5 text-pink-400" />
              <span>Özel Sahne / Replik Ekle</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              İstediğin herhangi bir Türk veya yabancı film/dizi repliğini oyuna ekle!
            </p>

            {clipAddedMsg ? (
              <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-center">
                🎉 Replik başarıyla eklendi ve oyuna dahil edildi!
              </div>
            ) : (
              <form onSubmit={handleAddClipSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Film / Dizi Adı
                    </label>
                    <input
                      type="text"
                      required
                      value={customSource}
                      onChange={(e) => setCustomSource(e.target.value)}
                      placeholder="Örn: Kurtlar Vadisi"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Karakter Adı
                    </label>
                    <input
                      type="text"
                      required
                      value={customCharacter}
                      onChange={(e) => setCustomCharacter(e.target.value)}
                      placeholder="Örn: Polat Alemdar"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Taklit Edilecek Replik Metni
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={customSubtitle}
                    onChange={(e) => setCustomSubtitle(e.target.value)}
                    placeholder="Örn: Sonunu düşünen kahraman olamaz!"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-pink-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Sahne Başlığı (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Örn: Racon Sahnesi"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Kategori
                    </label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold"
                    >
                      <option value="komedi">Komedi</option>
                      <option value="dizi">Efsane Dizi</option>
                      <option value="film">Yabancı Film</option>
                      <option value="yesilcam">Yeşilçam</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider transition-all"
                >
                  Kütüphaneye Ekle
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Host Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-400" />
              <span>Lobi Ayarları</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tur Sayısı
                </label>
                <select
                  value={room.settings.rounds}
                  onChange={(e) => updateSettings({ rounds: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold"
                >
                  <option value={3}>3 Tur</option>
                  <option value={5}>5 Tur</option>
                  <option value={7}>7 Tur</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Kayıt Süresi
                </label>
                <select
                  value={room.settings.recordDuration}
                  onChange={(e) => updateSettings({ recordDuration: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold"
                >
                  <option value={15}>15 Saniye</option>
                  <option value={20}>20 Saniye</option>
                  <option value={25}>25 Saniye</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Kategori
                </label>
                <select
                  value={room.settings.category}
                  onChange={(e) => updateSettings({ category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold"
                >
                  <option value="all">Karışık (Yerli & Yabancı Tüm Klipler)</option>
                  <option value="dizi">Türk Dizileri (Kurtlar Vadisi, Ezel, Gibi...)</option>
                  <option value="film">Yabancı Kült Filmler (Godfather, Scarface, Joker...)</option>
                  <option value="komedi">Komedi & Memeler (Kolpaçino, GORA...)</option>
                  <option value="yesilcam">Yeşilçam Klasikleri</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Oyun Modu
                </label>
                <select
                  value={room.settings.mode}
                  onChange={(e) => updateSettings({ mode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold"
                >
                  <option value="mimic">Birebir Ses Taklidi</option>
                  <option value="parody">Komik Dublaj / Parodi</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => { playSound('click'); setShowSettingsModal(false); }}
              className="w-full mt-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* AI YouTube Sahne & Replik Kesici Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowAiModal(false); setAiResultClip(null); setAiError(null); }}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl shadow">
                🤖
              </div>
              <div>
                <h3 className="text-xl font-black text-white m-0">
                  AI YouTube Sahne & Replik Kesici
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                  Otomatik Video Kırpma & Ses Normalizasyonu
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 my-3">
              İstediğin film/dizi adını veya repliği yaz; yapay zeka YouTube'dan sahneyi bulup vurucu 1 cümleyi milimetrik olarak kırparak odaya eklesin!
            </p>

            {/* Quick Random Discovery Button */}
            <div className="mb-4">
              <button
                type="button"
                disabled={aiIsGenerating}
                onClick={() => handleAiGenerate('', true)}
                className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:opacity-95 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
              >
                <Shuffle className="w-4 h-4" />
                <span>🎲 AI Rastgele Kült Sahne Keşfet</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <span className="relative px-3 bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-500">veya kendin ara</span>
            </div>

            {/* Search Input */}
            <form onSubmit={(e) => { e.preventDefault(); if (aiQuery.trim()) handleAiGenerate(aiQuery, false); }} className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    disabled={aiIsGenerating}
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Örn: GORA bir cisim yaklaşıyor, Organize İşler araba nerde, Fight Club..."
                    className="w-full pl-9 pr-3 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={aiIsGenerating || !aiQuery.trim()}
                  className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4" />
                  <span>Kırp</span>
                </button>
              </div>
            </form>

            {/* Live Progress Bar */}
            {aiIsGenerating && (
              <div className="mt-5 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-col gap-2 animate-pulse">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                  <span>{aiClipProgress?.message || 'YouTube taranıyor ve ses analiz ediliyor...'}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-2/3 animate-pulse"></div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {aiError && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Result Clip Preview & Success */}
            {aiResultClip && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-800/90 border border-emerald-500/50 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Klip Başarıyla Kesildi & Odaya Eklendi!</span>
                  </span>
                  <span className="text-xs font-bold text-slate-400">{aiResultClip.source}</span>
                </div>

                <div className="rounded-2xl overflow-hidden aspect-video bg-black border border-slate-700">
                  <video
                    src={aiResultClip.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-center p-2 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">1 Cümlelik Replik:</span>
                  <p className="text-base font-black text-amber-300 mt-0.5">
                    "{aiResultClip.subtitle}"
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg"
                >
                  Harika, Lobiye Dön
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

