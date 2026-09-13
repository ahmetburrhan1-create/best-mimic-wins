import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const animFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const previewAudioRef = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioUrl(null);
    setAudioBase64(null);
    audioChunksRef.current = [];

    try {
      // Direct user gesture ensures permission prompt opens
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // Audio level analyser
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Mime type resolution
      let options = {};
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Mikrofon başlatılamadı. Lütfen tarayıcı izinlerini kontrol edin.');
      setIsRecording(false);
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      setAudioLevel(0);

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);

          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result;
            setAudioBase64(base64);
            setIsRecording(false);
            resolve({ audioBlob, audioUrl: url, audioBase64: base64 });
          };
          reader.readAsDataURL(audioBlob);

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
          }
        };

        mediaRecorderRef.current.stop();
      } else {
        setIsRecording(false);
        resolve(null);
      }
    });
  }, []);

  const playPreview = useCallback(() => {
    if (!audioUrl) return;
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    previewAudioRef.current = audio;
    setIsPlayingPreview(true);
    audio.onended = () => setIsPlayingPreview(false);
    audio.play().catch(() => setIsPlayingPreview(false));
  }, [audioUrl]);

  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBase64(null);
    setAudioLevel(0);
    setError(null);
    setIsRecording(false);
    audioChunksRef.current = [];
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (previewAudioRef.current) previewAudioRef.current.pause();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    isRecording,
    audioLevel,
    audioUrl,
    audioBase64,
    isPlayingPreview,
    error,
    startRecording,
    stopRecording,
    playPreview,
    stopPreview,
    resetRecording
  };
}
