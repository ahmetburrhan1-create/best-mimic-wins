import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import AnimatedCharacter from '../Common/AnimatedCharacter';
import { Copy, Check, Play, Crown, Settings2, Users, Mic, PlusCircle, Sparkles, UserPlus, Film, X, Bot, Search, Shuffle, AlertCircle, Loader2, Package, FolderPlus, Layers } from 'lucide-react';
import { playSound } from '../../utils/sfx';

export default function LobbyView() {
  const { room, isHost, currentPlayer, setReady, updateSettings, startGame, addCustomClip, createCustomPack, generateAiClip, aiClipProgress, setAiClipProgress } = useSocket();
  const [copied, setCopied] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddClipModal, setShowAddClipModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showCreatePackModal, setShowCreatePackModal] = useState(false);
  const [allowSoloStart, setAllowSoloStart] = useState(false);

  // Pack creation form state
  const [newPackName, setNewPackName] = useState('');
  const [newPackDesc, setNewPackDesc] = useState('');
  const [newPackIcon, setNewPackIcon] = useState('📦');
  const [newPackColor, setNewPackColor] = useState('from-purple-600 to-indigo-700');

  // AI Clip State & Target Pack
  const [aiQuery, setAiQuery] = useState('');
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiResultClip, setAiResultClip] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [aiTargetPackId, setAiTargetPackId] = useState(() => room?.settings?.selectedPackId || 'pack_all');

  // New Custom Clip Form State
  const [customTitle, setCustomTitle] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [customCharacter, setCustomCharacter] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customCategory, setCustomCategory] = useState('komedi');
  const [customClipTargetPackId, setCustomClipTargetPackId] = useState(() => room?.settings?.selectedPackId || 'pack_all');
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
    }, customClipTargetPackId);

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

    const res = await generateAiClip({ query, isRandom, targetPackId: aiTargetPackId });
    setAiIsGenerating(false);

    if (res?.success && res.clip) {
      playSound('win');
      setAiResultClip(res.clip);
    } else {
      playSound('wrong');
      setAiError(res?.error || 'Klip oluşturulamadı. Lütfen başka bir film/replik adı deneyin.');
    }
  };

  const handleCreatePackSubmit = async (e) => {
    e.preventDefault();
    if (!newPackName.trim()) return;

    playSound('win');
    const res = await createCustomPack({
      name: newPackName.trim(),
      description: newPackDesc.trim() || 'Özel oluşturulan sahne paketi.',
      icon: newPackIcon,
      color: newPackColor
    });

    if (res?.success && res.pack) {
      if (isHost) {
        updateSettings({ selectedPackId: res.pack.id });
      }
      setAiTargetPackId(res.pack.id);
      setCustomClipTargetPackId(res.pack.id);
    }

    setShowCreatePackModal(false);
    setNewPackName('');
    setNewPackDesc('');
  };

  const handleSelectPack = (packId) => {
    if (!isHost) return;
    playSound('click');
    updateSettings({ selectedPackId: packId });
    setAiTargetPackId(packId);
    setCustomClipTargetPackId(packId);
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

      {/* Replik & Sahne Paketi Seçim Bölümü */}
      <div className="bg-slate-900/85 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-5 sm:p-6 mb-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white m-0 flex items-center gap-2">
                <span>Replik & Sahne Paketleri</span>
                {isHost && (
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Oda Yöneticisi Seçimi
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Oyunda hangi repliklerin geleceğini belirle veya kendi özel paketini oluştur!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { playSound('click'); setShowCreatePackModal(true); }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-pink-400" />
            <span>+ Kendi Paketini Oluştur</span>
          </button>
        </div>

        {/* Grid of Packs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {(room.packs || [
            { id: 'pack_all', name: 'Tüm Replikler (Karma)', description: 'Tüm sahneler karışık', icon: '🌟', color: 'from-indigo-600 to-pink-600', clipCount: 13 },
            { id: 'pack_turkish_series', name: 'Ezel & Behzat & KV', description: 'Racon ve dizi sahneleri', icon: '🚬', color: 'from-stone-800 to-zinc-950', clipCount: 4 },
            { id: 'pack_comedy_legends', name: 'Komedi & Yeşilçam', description: 'Kolpaçino, GORA, Kemal Sunal', icon: '🎭', color: 'from-amber-600 to-rose-700', clipCount: 4 },
            { id: 'pack_hollywood_cult', name: 'Kült Sinema', description: 'Fight Club, Godfather, Joker', icon: '🎬', color: 'from-purple-900 to-indigo-950', clipCount: 5 }
          ]).map((pack) => {
            const isSelected = (room.settings?.selectedPackId || 'pack_all') === pack.id;
            return (
              <div
                key={pack.id}
                onClick={() => handleSelectPack(pack.id)}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/20 scale-[1.02]'
                    : 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl p-1.5 rounded-xl bg-black/40 border border-white/10">
                      {pack.icon || '📦'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-700/40 text-slate-400 border-slate-700'
                    }`}>
                      {pack.clipCount ?? 0} Klip
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-white m-0 group-hover:text-indigo-300 transition-colors">
                    {pack.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {pack.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                  {isSelected ? (
                    <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Aktif Paket</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300">
                      {isHost ? 'Seçmek için tıkla' : 'Bekleniyor'}
                    </span>
                  )}
                  {pack.isDefault === false && (
                    <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest bg-pink-500/10 px-1.5 py-0.5 rounded">
                      ÖZEL
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Eklenecek Paket
                  </label>
                  <select
                    value={customClipTargetPackId}
                    onChange={(e) => setCustomClipTargetPackId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
                  >
                    {(room.packs || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.icon || '📦'} {p.name}
                      </option>
                    ))}
                  </select>
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

            {/* Target Pack Selector for AI */}
            <div className="mb-4 p-3.5 rounded-2xl bg-slate-800/80 border border-purple-500/30">
              <label className="block text-[11px] font-black text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-pink-400" />
                <span>📦 Kesilen Sahne Hangi Pakete Eklensin?</span>
              </label>
              <select
                disabled={aiIsGenerating}
                value={aiTargetPackId}
                onChange={(e) => setAiTargetPackId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500 disabled:opacity-50"
              >
                {(room.packs || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon || '📦'} {p.name} ({p.clipCount ?? 0} Klip)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Yapay zekanın kırptığı video seçtiğin pakete doğrudan eklenecektir.
              </p>
            </div>

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

      {/* Kendi Paketini Oluştur Modal */}
      {showCreatePackModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowCreatePackModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xl shadow">
                📦
              </div>
              <div>
                <h3 className="text-lg font-black text-white m-0">
                  Yeni Replik Paketi Oluştur
                </h3>
                <span className="text-[10px] font-bold text-indigo-400">
                  Kendi temanı, dizini veya özel replik koleksiyonunu yarat
                </span>
              </div>
            </div>

            <form onSubmit={handleCreatePackSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Paket Adı
                </label>
                <input
                  type="text"
                  required
                  value={newPackName}
                  onChange={(e) => setNewPackName(e.target.value)}
                  placeholder="Örn: Kurtlar Vadisi Derin Konsey, Çukur Racon..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Paket Açıklaması
                </label>
                <input
                  type="text"
                  value={newPackDesc}
                  onChange={(e) => setNewPackDesc(e.target.value)}
                  placeholder="Örn: En sert racon replikleri ve dizi sahneleri..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    İkon / Emoji
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['📦', '🔥', '🕶️', '🔫', '🎭', '🎬', '💀', '👑'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewPackIcon(emoji)}
                        className={`w-7 h-7 rounded-xl border text-sm flex items-center justify-center transition-all ${
                          newPackIcon === emoji
                            ? 'bg-indigo-600 border-indigo-400 ring-2 ring-indigo-400/40 scale-110'
                            : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Tema Rengi
                  </label>
                  <select
                    value={newPackColor}
                    onChange={(e) => setNewPackColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="from-purple-600 to-indigo-700">Mor - Gece</option>
                    <option value="from-rose-600 to-orange-600">Alev - Kırmızı</option>
                    <option value="from-emerald-600 to-teal-700">Neon - Yeşil</option>
                    <option value="from-amber-500 to-yellow-600">Altın - Sarı</option>
                    <option value="from-stone-800 to-zinc-950">Karanlık - Siyah</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300">
                💡 Paketi oluşturduktan sonra AI Sahne Kesici veya Manuel Ekleme ile doğrudan bu pakete istediğin kadar sahne ekleyebilirsin!
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25"
              >
                Paketi Oluştur & Seç
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

