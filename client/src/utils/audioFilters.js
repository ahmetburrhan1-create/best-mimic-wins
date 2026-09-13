// Web Audio API DSP Effects: Helium (Pitch Up), Monster (Pitch Down), Robot, Echo

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export async function playWithEffect(audioDataUrl, effectType = 'normal', onEnded = null) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return null;

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
        mainGain.gain.value = 0.8;

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
        dryGain.gain.value = 1.0;

        const wetGain = ctx.createGain();
        wetGain.gain.value = 0.6;

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

    lastNode.connect(ctx.destination);

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
    console.error('Error playing with audio effect:', err);
    // Fallback: standard HTML5 Audio
    const fallback = new Audio(audioDataUrl);
    if (effectType === 'helium') fallback.playbackRate = 1.4;
    else if (effectType === 'monster') fallback.playbackRate = 0.75;
    fallback.onended = onEnded;
    fallback.play().catch(() => {});
    return { stop: () => fallback.pause() };
  }
}
