import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import ClipPlayer from '../Common/ClipPlayer';
import VoiceSchemaGuide from '../Common/VoiceSchemaGuide';
import AnimatedCharacter from '../Common/AnimatedCharacter';
import MysteryBoxModal from './MysteryBoxModal';
import { playSound } from '../../utils/sfx';
import { Mic, Square, Play, RotateCcw, Send, CheckCircle2, Clock, Volume2, Sparkles, AlertCircle } from 'lucide-react';

export default function RecordPhase() {
  const { room, currentPlayer, submitRecording } = useSocket();
  const clip = room.currentClip;

  const {
    isRecording,
    audioLevel,
    frequencyBars,
    audioUrl,
    audioBase64,
    isPlayingPreview,
    startRecording,
    stopRecording,
    playPreview,
    stopPreview,
    resetRecording,
    error: micError
  } = useAudioRecorder();

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showMysteryBox, setShowMysteryBox] = useState(true);
  const [powerUp, setPowerUp] = useState(null);
  const [elapsedRecordTime, setElapsedRecordTime] = useState(0);
  const [previewVideoTrigger, setPreviewVideoTrigger] = useState(0);

  const timerRef = useRef(null);

  // Track elapsed recording time for the schema guide
  useEffect(() => {
    if (isRecording) {
      setElapsedRecordTime(0);
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedRecordTime((Date.now() - start) / 1000);
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Auto-submit on timer expiry if recording exists
  useEffect(() => {
    if (room.timer <= 1 && !hasSubmitted) {
      if (audioBase64) {
        handleFinalSubmit();
      } else {
        // Submit empty fallback
        submitRecording('data:audio/webm;base64,', powerUp);
        setHasSubmitted(true);
      }
    }
  }, [room.timer, audioBase64, hasSubmitted, powerUp]);

  const handleStartRecord = async () => {
    playSound('start_record');
    setPreviewVideoTrigger(c => c + 1);
    await startRecording();
  };

  const handleStopRecord = async () => {
    playSound('stop_record');
    await stopRecording();
  };

  const handleRetryRecord = () => {
    playSound('click');
    resetRecording();
    setElapsedRecordTime(0);
  };

  const handleTogglePreview = () => {
    if (isPlayingPreview) {
      stopPreview();
    } else {
      setPreviewVideoTrigger(c => c + 1);
      playPreview();
    }
  };

  const handleFinalSubmit = () => {
    if (hasSubmitted) return;
    playSound('click');
    setHasSubmitted(true);
    submitRecording(audioBase64 || 'data:audio/webm;base64,', powerUp);
  };

  const handleSelectPowerUp = (selectedPower, close = false) => {
    setPowerUp(selectedPower);
    if (close) {
      setShowMysteryBox(false);
    }
  };

  const recordedCount = room.players.filter(p => p.hasRecorded).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Mystery Box Modal on Round Start */}
      {showMysteryBox && (
        <MysteryBoxModal
          currentRound={room.currentRound}
          onSelectPowerUp={handleSelectPowerUp}
        />
      )}

      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <AnimatedCharacter
            avatar={currentPlayer?.avatar || '🐱'}
            isSpeaking={isRecording && audioLevel > 15}
            size="sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Tur {room.currentRound} Kayıt Aşaması
              </span>
              {powerUp && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black flex items-center gap-1">
                  <span>{powerUp.icon}</span>
                  <span>{powerUp.name}</span>
                </span>
              )}
            </div>
            <h3 className="text-sm font-black text-white m-0">
              {currentPlayer?.name} (Sen)
            </h3>
          </div>
        </div>

        {/* Big Countdown Timer */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-black text-base shadow animate-pulse">
          <Clock className="w-4 h-4" />
          <span>Kalan Süre: {room.timer}s</span>
        </div>
      </div>

      {/* Silent Video Clip Player */}
      <div className="w-full mb-3">
        <ClipPlayer
          clip={clip}
          isMuted={true}
          isDubbedMode={!!audioUrl}
          showSubtitles={true}
          autoPlay={true}
          replayTrigger={previewVideoTrigger}
        />
      </div>

      {/* Voice Schema / Intonation & Rhythm Guide */}
      <div className="w-full mb-4">
        <VoiceSchemaGuide
          clip={clip}
          elapsedTime={elapsedRecordTime}
          userAudioLevel={audioLevel}
          frequencyBars={frequencyBars}
          isRecording={isRecording}
        />
      </div>

      {micError && (
        <div className="w-full mb-3 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Interactive Microphone Control Hub */}
      <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Current State Info */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border-2 transition-all ${
            hasSubmitted
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : isRecording
              ? 'bg-rose-500/20 border-rose-500 text-rose-400 recording-pulse'
              : audioUrl
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            {hasSubmitted ? <CheckCircle2 className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </div>

          <div>
            <h4 className="text-sm font-black text-white">
              {hasSubmitted
                ? 'Dublajın Odaya Gönderildi! 🎉'
                : isRecording
                ? 'Mikrofonun Kayıtta! Konuş...'
                : audioUrl
                ? 'Kaydın Hazır! Dinle veya Tekrar Çek'
                : 'Hazır Olduğunda Kayda Başla!'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasSubmitted
                ? 'Diğer oyuncuların kayıtları bekleniyor...'
                : isRecording
                ? 'Repliği oku, bitince "Kaydı Bitir" tuşuna bas.'
                : audioUrl
                ? 'Sesini dinleyebilir ya da beğenmediysen baştan yapabilirsin.'
                : 'Kayıt butonuna basıp konuşmaya başla.'}
            </p>
          </div>
        </div>

        {/* Right: Explicit User Action Buttons */}
        {!hasSubmitted ? (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* 1. If not recording and no audio yet: START RECORD */}
            {!isRecording && !audioUrl && (
              <button
                onClick={handleStartRecord}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Mic className="w-4 h-4" />
                <span>Kayda Başla (Mikrofonu Aç)</span>
              </button>
            )}

            {/* 2. If actively recording: STOP RECORD */}
            {isRecording && (
              <button
                onClick={handleStopRecord}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-600/40 transition-all hover:scale-105 active:scale-95 animate-pulse"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Kaydı Bitir</span>
              </button>
            )}

            {/* 3. If recorded audio exists: PREVIEW, RETRY, SUBMIT */}
            {!isRecording && audioUrl && (
              <>
                <button
                  onClick={handleTogglePreview}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
                >
                  <Play className={`w-3.5 h-3.5 ${isPlayingPreview ? 'text-emerald-400' : ''}`} />
                  <span>{isPlayingPreview ? 'Durdur' : 'Kaydı Dinle (Video ile)'}</span>
                </button>

                <button
                  onClick={handleRetryRecord}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Beğenmedim, Baştan Yap</span>
                </button>

                <button
                  onClick={handleFinalSubmit}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Bu Oldu, Gönder!</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300">
            <span>Hazır Olanlar:</span>
            <span className="text-emerald-400 font-mono text-sm">{recordedCount} / {room.players.length}</span>
          </div>
        )}
      </div>

      {/* Live Players Status Badges */}
      <div className="w-full mt-4 flex flex-wrap items-center justify-center gap-2">
        {room.players.map((p) => {
          const recorded = p.hasRecorded || (p.socketId === currentPlayer?.socketId && hasSubmitted);
          return (
            <div
              key={p.socketId}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                recorded
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              }`}
            >
              <AnimatedCharacter avatar={p.avatar} size="sm" />
              <span>{p.name}</span>
              {recorded ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
