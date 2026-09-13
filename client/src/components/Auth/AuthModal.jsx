import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { CHARACTER_PRESETS } from '../Common/AnimatedCharacter';
import { X, LogIn, UserPlus, User, Trophy, Star, ShieldCheck, LogOut, Sparkles, Check, AlertCircle, Key, AtSign, Flame } from 'lucide-react';
import { playSound } from '../../utils/sfx';

export default function AuthModal() {
  const { user, isAuthenticated, showAuthModal, authModalTab, setAuthModalTab, closeAuth, login, register, logout, updateProfile } = useAuth();
  const { updateProfile: updateSocketProfile } = useSocket();

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👑');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!showAuthModal) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!username.trim() || !password) {
      setErrorMsg('Lütfen kullanıcı adı ve şifrenizi girin.');
      return;
    }

    setIsSubmitting(true);
    playSound('click');
    const res = await login({ username: username.trim(), password });
    setIsSubmitting(false);

    if (res.success && res.user) {
      playSound('win');
      setSuccessMsg('Giriş başarılı! Hoş geldin.');
      updateSocketProfile({
        name: res.user.displayName || res.user.username,
        avatar: res.user.avatar || '👑'
      });
      setTimeout(() => {
        closeAuth();
        setSuccessMsg('');
      }, 700);
    } else {
      playSound('wrong');
      setErrorMsg(res.error || 'Giriş yapılamadı.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!username.trim() || !password) {
      setErrorMsg('Lütfen tüm alanları doldurun.');
      return;
    }

    setIsSubmitting(true);
    playSound('click');
    const res = await register({
      username: username.trim(),
      password,
      displayName: displayName.trim() || username.trim(),
      avatar: selectedAvatar
    });
    setIsSubmitting(false);

    if (res.success && res.user) {
      playSound('win');
      setSuccessMsg('Hesabın başarıyla oluşturuldu! Hoş geldin.');
      updateSocketProfile({
        name: res.user.displayName || res.user.username,
        avatar: res.user.avatar || selectedAvatar
      });
      setTimeout(() => {
        closeAuth();
        setSuccessMsg('');
      }, 700);
    } else {
      playSound('wrong');
      setErrorMsg(res.error || 'Kayıt olunamadı.');
    }
  };

  const handleAvatarChange = async (emoji) => {
    playSound('click');
    setSelectedAvatar(emoji);
    if (isAuthenticated) {
      await updateProfile({ avatar: emoji });
      updateSocketProfile({ avatar: emoji });
    }
  };

  const handleLogoutClick = () => {
    playSound('click');
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => { playSound('click'); closeAuth(); }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            {isAuthenticated ? <User className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-xl font-black text-white m-0">
              {isAuthenticated ? 'Oyuncu Profili & İstatistikler' : 'Taklit Web Hesabı'}
            </h3>
            <span className="text-xs text-slate-400">
              {isAuthenticated ? 'İlerlemen ve kazandığın unvanlar' : 'Puanlarını kaydet, unvan kazan ve seviye atla'}
            </span>
          </div>
        </div>

        {/* Tab switcher (if not authenticated) */}
        {!isAuthenticated ? (
          <div className="flex rounded-xl bg-slate-800/80 p-1 mb-5 border border-slate-700/60">
            <button
              type="button"
              onClick={() => { playSound('click'); setAuthModalTab('login'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                authModalTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Giriş Yap</span>
            </button>
            <button
              type="button"
              onClick={() => { playSound('click'); setAuthModalTab('register'); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                authModalTab === 'register'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Kayıt Ol</span>
            </button>
          </div>
        ) : null}

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* --- TAB 1: LOGIN --- */}
        {!isAuthenticated && authModalTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adın"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Şifre
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              {isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap & Oyna'}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => { playSound('click'); closeAuth(); }}
                className="text-xs text-slate-400 hover:text-slate-200 underline font-semibold cursor-pointer"
              >
                Giriş yapmadan misafir olarak devam et
              </button>
            </div>
          </form>
        )}

        {/* --- TAB 2: REGISTER --- */}
        {!isAuthenticated && authModalTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="örn: ahmet34"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Görünecek İsim
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="örn: Ahmet"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Şifre (En az 4 karakter)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Avatar Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Varsayılan Karakter Maskotu
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CHARACTER_PRESETS.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleAvatarChange(char.emoji)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      selectedAvatar === char.emoji
                        ? 'bg-pink-600/30 border-pink-500 ring-2 ring-pink-500/40 scale-105'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xl block">{char.emoji}</span>
                    <span className="text-[10px] text-slate-300 font-bold block truncate">{char.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-pink-500/25 disabled:opacity-50"
            >
              {isSubmitting ? 'Hesap Açılıyor...' : 'Hesap Oluştur & Başla'}
            </button>
          </form>
        )}

        {/* --- TAB 3: LOGGED-IN PROFILE & STATS --- */}
        {isAuthenticated && user && (
          <div className="space-y-4">
            {/* User Badge Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl p-2 rounded-2xl bg-black/40 border border-white/10">
                  {user.avatar || '👑'}
                </span>
                <div>
                  <h4 className="text-base font-black text-white m-0 flex items-center gap-1.5">
                    <span>{user.displayName || user.username}</span>
                    <span className="text-[10px] font-bold text-slate-400">(@{user.username})</span>
                  </h4>
                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>Seviye {user.stats?.level || 1} • {user.stats?.title || '🌱 Acemi Taklitçi'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                <Trophy className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                <span className="text-lg font-black text-white block">{user.stats?.gamesWon || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Galibiyet</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                <Flame className="w-4 h-4 mx-auto text-pink-400 mb-1" />
                <span className="text-lg font-black text-white block">{user.stats?.gamesPlayed || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Maç</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                <Sparkles className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                <span className="text-lg font-black text-white block">{user.stats?.totalScore || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Toplam Puan</span>
              </div>
            </div>

            {/* Avatar Selector Quick Change */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Maskotunu Değiştir
              </span>
              <div className="grid grid-cols-4 gap-2">
                {CHARACTER_PRESETS.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleAvatarChange(char.emoji)}
                    className={`p-1.5 rounded-xl border text-center transition-all ${
                      user.avatar === char.emoji
                        ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500/40 scale-105'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xl">{char.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full mt-2 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Oturumu Kapat (Çıkış)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
