/**
 * Web Audio API based sound synthesizer for Pomodoro study timer.
 * Completely self-contained: zero external MP3/WAV dependencies.
 */

let audioCtx: AudioContext | null = null;
let ambientSource: AudioBufferSourceNode | null = null;
let ambientGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a soft, melodious completion chime (C5 - E5 - G5 - C6 chord)
 * when a study focus session or break ends.
 */
export function playChime(type: 'focusComplete' | 'breakComplete' | 'tick' = 'focusComplete') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
      return;
    }

    const now = ctx.currentTime;
    // Frequencies: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes =
      type === 'focusComplete'
        ? [523.25, 659.25, 783.99, 1046.50]
        : [783.99, 659.25, 523.25];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      // Soft marimba envelope
      const startTime = now + idx * 0.14;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.9);
    });
  } catch (err) {
    console.warn('Audio playback not permitted or unavailable:', err);
  }
}

/**
 * Ambient background noise generator (Soft Rain or Pink Noise)
 */
export function startAmbientSound(mode: 'rain' | 'whitenoise', volume: number = 0.3) {
  try {
    stopAmbientSound();

    const ctx = getAudioContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 2; // 2 seconds loop
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (mode === 'whitenoise') {
        // Soft pink noise filter
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      } else {
        // Rain simulation: low-pass filtered pink noise with gentle droplets
        b0 = 0.98 * b0 + white * 0.06;
        output[i] = b0 * 0.12;
      }
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to make it warm, soft, and soothing
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(mode === 'rain' ? 800 : 1200, ctx.currentTime);

    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume * 0.3)), ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    whiteNoise.start();
    ambientSource = whiteNoise;
  } catch (err) {
    console.warn('Could not start ambient sound:', err);
  }
}

export function stopAmbientSound() {
  if (ambientSource) {
    try {
      ambientSource.stop();
      ambientSource.disconnect();
    } catch (e) {}
    ambientSource = null;
  }
}

export function setAmbientVolume(volume: number) {
  if (ambientGain && audioCtx) {
    try {
      ambientGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume * 0.3)), audioCtx.currentTime);
    } catch (e) {}
  }
}
