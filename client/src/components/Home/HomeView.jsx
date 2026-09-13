import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import AnimatedCharacter, { CHARACTER_PRESETS } from '../Common/AnimatedCharacter';
import { Sparkles, Mic, Play, Users, PlusCircle, ArrowRight, Gift } from 'lucide-react';
import { playSound } from '../../utils/sfx';

export default function HomeView() {
  const { myProfile, updateProfile, createRoom, joinRoom } = useSocket();
  const [activeTab, setActiveTab] = useState('create');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [settings, setSettings] = useState({
    rounds: 3,
    recordDuration: 18,
    category: 'all',
    mode: 'mimic'
  });

  const handleCharacterSelect = (char) => {
    playSound('click');
    updateProfile({ avatar: char.emoji });
  };

  const handleNameChange = (e) => {
    updateProfile({ name: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!myProfile.name.trim()) {
      setErrorMsg('Lütfen bir takma ad (nickname) girin!');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    playSound('click');

    const res = await createRoom(settings);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Oda oluşturulamadı!');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!myProfile.name.trim()) {
      setErrorMsg('Lütfen bir takma ad (nickname) girin!');
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMsg('Lütfen bir oda kodu girin!');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    playSound('click');

    const res = await joinRoom(roomCodeInput.toUpperCase().trim());
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Odaya katılınamadı!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[90vh]">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black tracking-widest uppercase mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Canlı Dublaj, Ses Taklidi & Gizemli Kutu Partisi</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white m-0">
          TAKLİT <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400">WEB 2.0</span>
        </h1>
        <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
          Replikleri kendi sesinle taklit et, her tur gizemli kutudan ses değiştirici güçlendirmeler kazan! 🎙️🎁
        </p>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Profile Customizer */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <AnimatedCharacter avatar={myProfile.avatar} size="lg" />

            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Oyuncu Adın
              </label>
              <input
                type="text"
                maxLength={18}
                value={myProfile.name}
                onChange={handleNameChange}
                placeholder="Örn: KralDublajcı"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Mascot Character Selector */}
          <div className="mt-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Karakter Maskotunu Seç
            </div>
            <div className="grid grid-cols-4 gap-2">
              {CHARACTER_PRESETS.map((char) => {
                const isSelected = myProfile.avatar === char.emoji;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleCharacterSelect(char)}
                    className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? `bg-slate-800 ${char.border} ring-2 ring-indigo-400 scale-105 shadow-lg`
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-2xl">{char.emoji}</span>
                    <span className="text-[10px] font-bold text-slate-300 truncate max-w-full">
                      {char.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-slate-800/80 p-1 mb-6 border border-slate-700/60">
          <button
            type="button"
            onClick={() => { playSound('click'); setActiveTab('create'); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Yeni Lobi Kur</span>
          </button>
          <button
            type="button"
            onClick={() => { playSound('click'); setActiveTab('join'); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'join'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Odaya Katıl</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* Create Room Form */}
        {activeTab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tur Sayısı
                </label>
                <select
                  value={settings.rounds}
                  onChange={(e) => setSettings({ ...settings, rounds: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value={3}>3 Tur (Hızlı)</option>
                  <option value={5}>5 Tur (Standart)</option>
                  <option value={7}>7 Tur (Maraton)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Kayıt Süresi
                </label>
                <select
                  value={settings.recordDuration}
                  onChange={(e) => setSettings({ ...settings, recordDuration: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value={15}>15 Saniye</option>
                  <option value={20}>20 Saniye</option>
                  <option value={25}>25 Saniye</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Kategori
                </label>
                <select
                  value={settings.category}
                  onChange={(e) => setSettings({ ...settings, category: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Karışık (Tüm Klipler)</option>
                  <option value="yesilcam">Yeşilçam Klasikleri</option>
                  <option value="dizi">Efsane Diziler</option>
                  <option value="komedi">Komedi & Memeler</option>
                  <option value="animasyon">Çizgi Film / Animasyon</option>
                  <option value="film">Yabancı Filmler</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Oyun Modu
                </label>
                <select
                  value={settings.mode}
                  onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="mimic">Birebir Ses Taklidi</option>
                  <option value="parody">Komik Dublaj / Parodi</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{isSubmitting ? 'Lobi Kuruluyor...' : 'Lobiyi Başlat & Oda Kodu Al'}</span>
            </button>
          </form>
        ) : (
          /* Join Room Form */
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                5 Haneli Oda Kodu
              </label>
              <input
                type="text"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="Örn: VGZQ6"
                className="w-full px-4 py-4 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white font-mono text-center text-3xl font-black tracking-widest placeholder-slate-600 focus:outline-none focus:border-pink-500 uppercase transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-pink-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <ArrowRight className="w-5 h-5" />
              <span>{isSubmitting ? 'Bağlanılıyor...' : 'Odaya Gir'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl w-full mt-8">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-2xl mb-1">🎁</div>
          <div className="text-xs font-bold text-white mb-0.5">Gizemli Kutu</div>
          <div className="text-[11px] text-slate-400">Her tur ses değiştirici güçler</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-2xl mb-1">🎼</div>
          <div className="text-xs font-bold text-white mb-0.5">Ses Şeması</div>
          <div className="text-[11px] text-slate-400">Ritim ve tonlama kılavuzu</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-2xl mb-1">🔄</div>
          <div className="text-xs font-bold text-white mb-0.5">Tekrar Kaydet</div>
          <div className="text-[11px] text-slate-400">Beğenmezsen baştan dene</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-2xl mb-1">🎭</div>
          <div className="text-xs font-bold text-white mb-0.5">Özel Karakterler</div>
          <div className="text-[11px] text-slate-400">Renkli maskotlar & animasyon</div>
        </div>
      </div>
    </div>
  );
}
