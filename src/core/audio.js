// Procedural sound: every effect is synthesised with WebAudio (no asset downloads).
export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.music = null;
    this.noise = null;
    this.muted = false;
    this.musicTimer = 0;
    this.nextNoteTime = 0;
    this.stepIdx = 0;
    this.playingMusic = false;
  }

  /** Must be called from a user gesture (first click / tap / key). */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.7;
      this.sfx.connect(this.master);
      this.music = this.ctx.createGain();
      this.music.gain.value = 0.22;
      this.music.connect(this.master);
      const len = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.03);
  }

  get ready() {
    return !!this.ctx && !this.muted;
  }

  tone(freq, dur, { type = 'sine', vol = 0.2, attack = 0.004, freqEnd, delay = 0, bus } = {}) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(bus || this.sfx);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  noiseBurst(dur, { type = 'bandpass', f0 = 1000, f1, q = 1, vol = 0.2, delay = 0 } = {}) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    src.start(t0, Math.random() * 0.5, dur + 0.05);
    src.stop(t0 + dur + 0.05);
  }

  // ---- combat -----------------------------------------------------------------
  swing() {
    this.noiseBurst(0.16, { type: 'bandpass', f0: 800, f1: 2800, q: 1.4, vol: 0.22 });
  }

  hit() {
    this.tone(260, 0.1, { type: 'triangle', vol: 0.22, freqEnd: 90 });
    this.noiseBurst(0.05, { type: 'highpass', f0: 2400, vol: 0.12 });
  }

  crit() {
    this.tone(520, 0.12, { type: 'square', vol: 0.08, freqEnd: 1200 });
    this.hit();
  }

  kill(type = 'slime') {
    const base = { slime: 480, imp: 620, archer: 360, brute: 220, boss: 140 }[type] || 400;
    this.tone(base, 0.16, { type: 'square', vol: 0.09, freqEnd: base * 2.4 });
    this.noiseBurst(0.12, { type: 'lowpass', f0: 1800, f1: 400, vol: 0.14 });
  }

  hurt() {
    this.tone(230, 0.28, { type: 'sawtooth', vol: 0.18, freqEnd: 55 });
    this.noiseBurst(0.12, { type: 'lowpass', f0: 900, vol: 0.16 });
  }

  dash() {
    this.noiseBurst(0.22, { type: 'bandpass', f0: 500, f1: 2600, q: 1.2, vol: 0.2 });
  }

  step() {
    this.noiseBurst(0.06, { type: 'lowpass', f0: 500, vol: 0.05 });
  }

  hop() {
    this.tone(360, 0.12, { type: 'sine', vol: 0.07, freqEnd: 620 });
  }

  land() {
    this.tone(140, 0.12, { type: 'sine', vol: 0.12, freqEnd: 70 });
  }

  arrow() {
    this.noiseBurst(0.22, { type: 'bandpass', f0: 3200, f1: 1300, q: 2, vol: 0.07 });
  }

  windup() {
    this.tone(110, 0.55, { type: 'sawtooth', vol: 0.05, freqEnd: 240 });
  }

  slam() {
    this.tone(90, 0.7, { type: 'sine', vol: 0.5, freqEnd: 35 });
    this.noiseBurst(0.5, { type: 'lowpass', f0: 500, f1: 80, vol: 0.4 });
  }

  boss() {
    this.tone(110, 0.9, { type: 'sawtooth', vol: 0.09, freqEnd: 55 });
    this.tone(165, 0.9, { type: 'square', vol: 0.04, freqEnd: 82, delay: 0.05 });
  }

  spawn() {
    this.tone(260, 0.2, { type: 'sine', vol: 0.09, freqEnd: 680 });
  }

  // ---- pickups & progression ----------------------------------------------------
  coin(pitch = 0) {
    const f = 988 * Math.pow(2, pitch / 12);
    this.tone(f, 0.07, { type: 'square', vol: 0.07 });
    this.tone(f * 1.5, 0.12, { type: 'square', vol: 0.07, delay: 0.05 });
  }

  shard() {
    this.tone(660, 0.08, { type: 'triangle', vol: 0.14 });
    this.tone(990, 0.1, { type: 'triangle', vol: 0.12, delay: 0.05 });
  }

  heal() {
    [523, 659, 784].forEach((f, i) => this.tone(f, 0.16, { type: 'triangle', vol: 0.14, delay: i * 0.06 }));
  }

  levelUp() {
    [523, 659, 784, 1046].forEach((f, i) => {
      this.tone(f, 0.22, { type: 'triangle', vol: 0.16, delay: i * 0.07 });
      this.tone(f * 2, 0.22, { type: 'sine', vol: 0.05, delay: i * 0.07 });
    });
  }

  waveStart() {
    [220, 330, 440].forEach((f) => this.tone(f, 0.6, { type: 'sawtooth', vol: 0.05, attack: 0.08 }));
  }

  waveClear() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.25, { type: 'square', vol: 0.06, delay: i * 0.09 }));
  }

  pick() {
    this.tone(880, 0.06, { type: 'triangle', vol: 0.15 });
  }

  click() {
    this.tone(700, 0.05, { type: 'triangle', vol: 0.1 });
  }

  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.5, { type: 'triangle', vol: 0.18, delay: i * 0.22 }));
  }

  // ---- music ------------------------------------------------------------------
  startMusic() {
    if (!this.ctx || this.playingMusic) return;
    this.playingMusic = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.stepIdx = 0;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 40);
  }

  stopMusic() {
    this.playingMusic = false;
    clearInterval(this.musicTimer);
  }

  scheduleMusic() {
    if (!this.ctx) return;
    const bpm = 104;
    const stepDur = 60 / bpm / 2; // eighth notes
    const chords = [
      { root: 110, tones: [220, 262, 330, 392] }, // Am
      { root: 87.3, tones: [174.6, 220, 261.6, 349.2] }, // F
      { root: 130.8, tones: [261.6, 329.6, 392, 523.3] }, // C
      { root: 98, tones: [196, 246.9, 293.7, 392] }, // G
    ];
    while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
      const bar = Math.floor(this.stepIdx / 8) % chords.length;
      const pos = this.stepIdx % 8;
      const c = chords[bar];
      const t = this.nextNoteTime;
      if (pos % 4 === 0) this.noteAt(c.root, t, stepDur * 1.8, 'sine', 0.5);
      const arp = c.tones[(pos + (pos >> 2)) % c.tones.length];
      this.noteAt(arp, t, stepDur * 0.9, 'triangle', pos % 2 === 0 ? 0.25 : 0.15);
      if (pos === 4 && bar % 2 === 1) this.noiseHatAt(t);
      this.nextNoteTime += stepDur;
      this.stepIdx++;
    }
  }

  noteAt(freq, t, dur, type, vol) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.music);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noiseHatAt(t) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(f);
    f.connect(g);
    g.connect(this.music);
    src.start(t, 0, 0.06);
  }
}
