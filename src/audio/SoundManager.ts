/**
 * Reality Shift: Neon Rush - Procedural Web Audio API Sound Engine
 * Zero external audio files (100% synthesized in code)
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Background music synth loop properties
  private isBgmPlaying: boolean = false;
  private bgmIntervalId: number | null = null;
  private step: number = 0;
  private currentReality: 'CYAN' | 'MAGENTA' = 'CYAN';
  private tempoBpm: number = 130;

  constructor() {
    const savedMute = localStorage.getItem('neon_rush_muted');
    this.isMuted = savedMute === 'true';
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('neon_rush_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setReality(reality: 'CYAN' | 'MAGENTA') {
    this.currentReality = reality;
  }

  public setSpeedFactor(factor: number) {
    // Subtle BPM increase with speed
    this.tempoBpm = Math.min(160, 130 + factor * 25);
  }

  // --- Background Synth Rhythm ---
  public startBGM() {
    this.init();
    if (!this.ctx || this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.step = 0;

    const stepInterval = () => (60 / this.tempoBpm) / 4 * 1000; // 16th note in ms

    const runLoop = () => {
      if (!this.isBgmPlaying) return;
      this.playSynthStep(this.step);
      this.step = (this.step + 1) % 16;
      this.bgmIntervalId = window.setTimeout(runLoop, stepInterval());
    };

    runLoop();
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId) {
      clearTimeout(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  private playSynthStep(step: number) {
    if (!this.ctx || !this.bgmGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Kick on 0, 4, 8, 12
    if (step % 4 === 0) {
      this.playKick(t);
    }

    // Hi-hat / shakers on odd steps
    if (step % 2 === 1) {
      this.playHiHat(t, step % 4 === 2 ? 0.08 : 0.04);
    }

    // Synth bassline / arpeggio
    // Cyan Reality scale: D minor pentatonic / Dorian [D, F, G, A, C]
    // Magenta Reality scale: D Phrygian / Minor [D, Eb, G, A, Bb]
    const cyanScale = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23];
    const magentaScale = [146.83, 155.56, 196.00, 220.00, 233.08, 293.66, 311.13];
    const scale = this.currentReality === 'CYAN' ? cyanScale : magentaScale;

    // Arp melody pattern
    const pattern = [0, 2, 4, 3, 1, 3, 5, 4, 0, 3, 5, 6, 2, 4, 1, 3];
    const noteIdx = pattern[step % pattern.length];
    const freq = scale[noteIdx % scale.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = this.currentReality === 'CYAN' ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.currentReality === 'CYAN' ? 1200 : 900, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.12);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  private playKick(t: number) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  private playHiHat(t: number, volume: number) {
    if (!this.ctx || !this.bgmGain) return;
    // Synthesize noise for hat
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    noise.start(t);
    noise.stop(t + 0.04);
  }

  // --- Sound Effects (SFX) ---

  // Reality Shift Warp
  public playRealityShift(reality: 'CYAN' | 'MAGENTA') {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    if (reality === 'CYAN') {
      osc1.type = 'sine';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, t);
      osc1.frequency.exponentialRampToValueAtTime(880, t + 0.22);
      osc2.frequency.setValueAtTime(440, t);
      osc2.frequency.exponentialRampToValueAtTime(1320, t + 0.22);
      filter.frequency.setValueAtTime(3000, t);
    } else {
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(600, t);
      osc1.frequency.exponentialRampToValueAtTime(150, t + 0.22);
      osc2.frequency.setValueAtTime(1200, t);
      osc2.frequency.exponentialRampToValueAtTime(300, t + 0.22);
      filter.frequency.setValueAtTime(2400, t);
    }

    filter.type = 'bandpass';
    filter.Q.setValueAtTime(4, t);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.26);
    osc2.stop(t + 0.26);
  }

  // Jump swoosh
  public playJump() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.16);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  // Slide friction jet
  public playSlide() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(150, t + 0.25);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.linearRampToValueAtTime(350, t + 0.25);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.27);
  }

  // Collectible orb chime with pitch rising on higher combos
  public playCollect(combo: number = 1) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const baseFreq = 523.25; // C5
    const semitones = Math.min(combo - 1, 12);
    const pitch = baseFreq * Math.pow(2, semitones / 12);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(pitch, t);
    osc1.frequency.exponentialRampToValueAtTime(pitch * 1.5, t + 0.18);

    osc2.frequency.setValueAtTime(pitch * 2, t);
    osc2.frequency.exponentialRampToValueAtTime(pitch * 2.5, t + 0.18);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.24);
    osc2.stop(t + 0.24);
  }

  // Near Miss alert swoosh
  public playNearMiss() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.15);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.Q.setValueAtTime(5, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Crash / Collision explosion
  public playCollision() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Sub rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.45);
    oscGain.gain.setValueAtTime(0.6, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.52);

    // Noise explosion
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(120, t + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.48);
  }
}

export const soundManager = new SoundManager();
