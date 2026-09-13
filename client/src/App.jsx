import React from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import HomeView from './components/Home/HomeView';
import LobbyView from './components/Lobby/LobbyView';
import PreviewPhase from './components/Game/PreviewPhase';
import RecordPhase from './components/Game/RecordPhase';
import ShowcasePhase from './components/Game/ShowcasePhase';
import VotingPhase from './components/Game/VotingPhase';
import ScoreboardPhase from './components/Game/ScoreboardPhase';
import GameOverPhase from './components/Game/GameOverPhase';
import ReactionOverlay from './components/Common/ReactionOverlay';
import { Mic, Wifi, WifiOff } from 'lucide-react';

function GameContent() {
  const { room, connected, myProfile } = useSocket();

  const renderCurrentPhase = () => {
    if (!room) {
      return <HomeView />;
    }

    switch (room.status) {
      case 'LOBBY':
        return <LobbyView />;
      case 'PREVIEW':
        return <PreviewPhase />;
      case 'RECORDING':
        return <RecordPhase />;
      case 'SHOWCASE':
        return <ShowcasePhase />;
      case 'VOTING':
        return <VotingPhase />;
      case 'ROUND_SUMMARY':
        return <ScoreboardPhase />;
      case 'GAME_OVER':
        return <GameOverPhase />;
      default:
        return <LobbyView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-100 selection:bg-pink-500 selection:text-white">
      <ReactionOverlay />

      {/* Modern App Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-500 p-0.5 shadow-lg shadow-pink-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Mic className="w-4 h-4 text-pink-400" />
              </div>
            </div>
            <span className="font-black text-lg tracking-tight text-white flex items-center gap-1">
              TAKLİT<span className="text-pink-400">WEB</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold">
              {connected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-400 hidden sm:inline">Bağlı</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-rose-400">Bağlantı Yok</span>
                </>
              )}
            </div>

            {/* Current Player Tag */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              <span className="text-base">{myProfile?.avatar || '🎭'}</span>
              <span className="text-xs font-bold text-slate-200 max-w-[120px] truncate">
                {myProfile?.name || 'Oyuncu'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Stage Area */}
      <main className="flex-1 flex flex-col justify-center">
        {renderCurrentPhase()}
      </main>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Hatası Yakalandı:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 text-3xl">
              ⚠️
            </div>
            <h2 className="text-2xl font-black mb-2 text-rose-300">Ekran Yüklenirken Bir Hata Oluştu</h2>
            <p className="text-slate-400 text-sm mb-4">
              {this.state.error?.message || 'Beklenmedik bir arayüz hatası oluştu.'}
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Verileri Sıfırla ve Yeniden Başlat
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <GameContent />
      </SocketProvider>
    </ErrorBoundary>
  );
}
