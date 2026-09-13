// Web Audio API DSP Effects: Helium (Pitch Up), Monster (Pitch Down), Robot, Echo + Master Volume Booster

let audioCtx = null;

export function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Auto unlock on first user interaction anywhere
if (typeof window !== 'undefined') {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  ['click', 'touchstart', 'keydown', 'mousedown'].forEach(evt => {
    window.addEventListener(evt, unlock, { passive: true });
  });
}

export async function playWithEffect(audioDataUrl, effectType = 'normal', onEnded = null) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return null;

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    // Fetch and decode base64 or blob audio
    const response = await fetch(audioDataUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    let lastNode = source;

    switch (effectType) {
      case 'helium': {
        // High pitch: increase playback speed + high-shelf boost
        source.playbackRate.value = 1.42;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 400;

        const shelf = ctx.createBiquadFilter();
        shelf.type = 'highshelf';
        shelf.frequency.value = 2500;
        shelf.gain.value = 8;

        source.connect(filter);
        filter.connect(shelf);
        lastNode = shelf;
        break;
      }

      case 'monster': {
        // Deep bass pitch: slow down playback + low-pass filter
        source.playbackRate.value = 0.72;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 1600;

        const bassBoost = ctx.createBiquadFilter();
        bassBoost.type = 'lowshelf';
        bassBoost.frequency.value = 200;
        bassBoost.gain.value = 12;

        source.connect(lowpass);
        lowpass.connect(bassBoost);
        lastNode = bassBoost;
        break;
      }

      case 'robot': {
        // Ring modulation & periodic oscillation
        source.playbackRate.value = 1.0;

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 55; // 55Hz mechanical buzzing

        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.5;

        const mainGain = ctx.createGain();
        mainGain.gain.value = 1.2;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1200;
        bandpass.Q.value = 3;

        source.connect(bandpass);
        bandpass.connect(mainGain);

        osc.connect(oscGain);
        osc.start();

        // Cross connect
        lastNode = mainGain;
        break;
      }

      case 'echo': {
        // Stadium delay & feedback echo
        source.playbackRate.value = 1.0;

        const delay = ctx.createDelay();
        delay.delayTime.value = 0.28; // 280ms echo

        const feedback = ctx.createGain();
        feedback.gain.value = 0.45; // echo decay

        const filter = ctx.createBiquadFilter();
        filter.frequency.value = 2000;

        const dryGain = ctx.createGain();
        dryGain.gain.value = 1.2;

        const wetGain = ctx.createGain();
        wetGain.gain.value = 0.7;

        const merger = ctx.createGain();

        source.connect(dryGain);
        dryGain.connect(merger);

        source.connect(delay);
        delay.connect(feedback);
        feedback.connect(filter);
        filter.connect(delay);
        delay.connect(wetGain);
        wetGain.connect(merger);

        lastNode = merger;
        break;
      }

      default: {
        // Normal clean voice
        source.playbackRate.value = 1.0;
        lastNode = source;
        break;
      }
    }

    // Professional Master Dynamics Compressor (evens out loud and quiet parts)
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 24;
    compressor.ratio.value = 10;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.2;

    // Master Voice Volume Booster (boosts low microphone inputs by 2.4x)
    const masterGain = ctx.createGain();
    masterGain.gain.value = 2.4;

    lastNode.connect(compressor);
    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);

    source.onended = () => {
      if (typeof onEnded === 'function') onEnded();
    };

    source.start(0);

    return {
      stop: () => {
        try {
          source.stop();
        } catch (e) {}
      }
    };
  } catch (err) {
    console.error('Error playing with audio effect, falling back to standard audio:', err);
    // Fallback: standard HTML5 Audio with max volume
    try {
      const fallback = new Audio(audioDataUrl);
      fallback.volume = 1.0;
      if (effectType === 'helium') fallback.playbackRate = 1.4;
      else if (effectType === 'monster') fallback.playbackRate = 0.75;
      fallback.onended = onEnded;
      const p = fallback.play();
      if (p && p.catch) p.catch(() => {});
      return { stop: () => fallback.pause() };
    } catch (e) {
      return null;
    }
  }
}
