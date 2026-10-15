// ---------------------------------------------------------------------------
//  All sound is synthesised at runtime with the Web Audio API:
//  engine, skids, guns, explosions, UI blips and a procedural synthwave track.
// ---------------------------------------------------------------------------

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioEngine {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.ready = false;
    this.last = {};
    this.paused = false;
  }

  init() {
    if (this.ctx) { this.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC({ latencyHint: 'interactive' });
    } catch (_) { return; }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.settings.volume;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4;
    comp.attack.value = 0.003; comp.release.value = 0.2;
    this.master.connect(comp);
    comp.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.gain.value = 0.85; this.sfx.connect(this.master);
    this.musicFilter = c.createBiquadFilter();
    this.musicFilter.type = 'lowpass'; this.musicFilter.frequency.value = 900; this.musicFilter.Q.value = 0.7;
    this.musicBus = c.createGain();
    this.musicBus.gain.value = this.settings.music ? 0.42 : 0;
    this.musicBus.connect(this.musicFilter);
    this.musicFilter.connect(this.master);
    // white noise buffer
    const len = c.sampleRate * 2;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // shaped distortion curve
    this.curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; this.curve[i] = Math.tanh(x * 3.2); }
    this.buildEngine();
    this.buildLoops();
    this.music = new Music(this);
    this.music.start();
    this.ready = true;
    if (c.state === 'suspended') c.resume();
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }

  setVolume(v) {
    this.settings.volume = v;
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  setMusic(on) {
    this.settings.music = on;
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(on ? 0.42 : 0, this.ctx.currentTime, 0.1);
  }

  setPaused(p) {
    this.paused = p;
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.sfx.gain.setTargetAtTime(p ? 0 : 0.85, t, 0.05);
    this.musicFilter.frequency.setTargetAtTime(p ? 380 : this.musicTarget || 900, t, 0.1);
  }

  /** 0 = menu (filtered pads), 1 = race (full band), 2 = victory */
  setMusicMode(mode) {
    if (!this.ready) return;
    this.music.mode = mode;
    this.musicTarget = mode === 1 ? 6000 : 1100;
    if (!this.paused) this.musicFilter.frequency.setTargetAtTime(this.musicTarget, this.ctx.currentTime, 0.3);
  }

  // ------------------------------------------------------------ engine/loops
  buildEngine() {
    const c = this.ctx;
    this.engGain = c.createGain(); this.engGain.gain.value = 0;
    this.engFilter = c.createBiquadFilter(); this.engFilter.type = 'lowpass'; this.engFilter.Q.value = 3; this.engFilter.frequency.value = 600;
    const shaper = c.createWaveShaper(); shaper.curve = this.curve;
    const mix = c.createGain(); mix.gain.value = 0.35;
    this.am = c.createGain(); this.am.gain.value = 0.8;
    this.o1 = c.createOscillator(); this.o1.type = 'sawtooth';
    this.o2 = c.createOscillator(); this.o2.type = 'square';
    this.o3 = c.createOscillator(); this.o3.type = 'sawtooth';
    const g2 = c.createGain(); g2.gain.value = 0.55;
    const g3 = c.createGain(); g3.gain.value = 0.25;
    this.o1.connect(mix); this.o2.connect(g2); g2.connect(mix); this.o3.connect(g3); g3.connect(mix);
    this.lfo = c.createOscillator(); this.lfo.type = 'square';
    this.lfoGain = c.createGain(); this.lfoGain.gain.value = 0.3;
    this.lfo.connect(this.lfoGain); this.lfoGain.connect(this.am.gain);
    mix.connect(this.am); this.am.connect(shaper); shaper.connect(this.engFilter); this.engFilter.connect(this.engGain);
    this.engGain.connect(this.sfx);
    for (const o of [this.o1, this.o2, this.o3, this.lfo]) o.start();
    this.o1.frequency.value = 50; this.o2.frequency.value = 25; this.o3.frequency.value = 75; this.lfo.frequency.value = 20;
  }

  buildLoops() {
    const c = this.ctx;
    const mk = (type, f, q) => {
      const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(fl); fl.connect(g); g.connect(this.sfx); src.start();
      return { g, fl };
    };
    this.skid = mk('bandpass', 1400, 1.2);
    this.gravel = mk('bandpass', 420, 0.8);
    this.wind = mk('lowpass', 800, 0.5);
  }

  updateCar(car, active) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const sp = Math.max(0, car.fwdSpeed);
    // fake 5-speed gearbox
    const top = 72;
    const r = Math.min(1, sp / top);
    const gears = [0, 0.16, 0.33, 0.52, 0.74, 1.01];
    let gi = 0;
    while (gi < 4 && r > gears[gi + 1]) gi++;
    const within = (r - gears[gi]) / (gears[gi + 1] - gears[gi]);
    const rpm = 0.22 + within * 0.75;
    if (this.gear !== undefined && gi > this.gear && active) this.backfire();
    this.gear = gi;
    const thr = car.input.throttle;
    const f = 42 + rpm * 120 + (car.boosting ? 18 : 0);
    this.o1.frequency.setTargetAtTime(f, t, 0.04);
    this.o2.frequency.setTargetAtTime(f * 0.5, t, 0.04);
    this.o3.frequency.setTargetAtTime(f * 1.5, t, 0.04);
    this.lfo.frequency.setTargetAtTime(f * 0.5, t, 0.04);
    this.engFilter.frequency.setTargetAtTime(380 + thr * 1500 + rpm * 1300 + (car.boosting ? 1600 : 0), t, 0.06);
    const vol = active && !car.dead ? 0.06 + thr * 0.05 + rpm * 0.03 : 0;
    this.engGain.gain.setTargetAtTime(vol, t, 0.08);
    const sl = active && car.grounded && !car.dead ? Math.min(1, Math.abs(car.slip) / 10) * Math.min(1, sp / 15) : 0;
    this.skid.g.gain.setTargetAtTime((car.drifting ? 0.08 : 0) + sl * 0.12, t, 0.05);
    this.gravel.g.gain.setTargetAtTime(active && car.grounded && !car.dead ? Math.min(0.12, sp * 0.0022) * (car.onRoad ? 0.6 : 1.4) : 0, t, 0.08);
    this.wind.g.gain.setTargetAtTime(active ? Math.min(0.12, sp * sp * 0.00003) : 0, t, 0.1);
  }

  silenceCar() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    for (const g of [this.engGain, this.skid.g, this.gravel.g, this.wind.g]) g.gain.setTargetAtTime(0, t, 0.05);
  }

  // ----------------------------------------------------------------- helpers
  throttle(key, ms) {
    const now = performance.now();
    if (this.last[key] && now - this.last[key] < ms) return false;
    this.last[key] = now;
    return true;
  }

  noise(dur, { type = 'lowpass', f = 1000, f2 = null, q = 1, gain = 0.3, attack = 0.002, delay = 0, out = null } = {}) {
    const c = this.ctx, t = c.currentTime + delay;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const fl = c.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); fl.connect(g); g.connect(out || this.sfx);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
  }

  tone(f, dur, { type = 'square', f2 = null, gain = 0.2, attack = 0.003, delay = 0, out = null } = {}) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out || this.sfx);
    o.start(t); o.stop(t + dur + 0.05);
  }

  distVol(d) { return Math.max(0, 1 - d / 140); }

  // -------------------------------------------------------------------- sfx
  shoot(od) {
    if (!this.ready || !this.throttle('shoot', 40)) return;
    const p = 0.9 + Math.random() * 0.2;
    this.tone(od ? 300 * p : 230 * p, 0.06, { type: 'square', f2: 70, gain: 0.07 });
    this.noise(0.05, { type: 'highpass', f: 1800, gain: 0.14 });
    this.noise(0.08, { type: 'lowpass', f: 900, f2: 200, gain: 0.12 });
  }

  hit() {
    if (!this.ready || !this.throttle('hit', 45)) return;
    this.tone(1300 + Math.random() * 300, 0.05, { type: 'triangle', f2: 700, gain: 0.06 });
    this.noise(0.03, { type: 'bandpass', f: 3500, q: 3, gain: 0.08 });
  }

  explosion(size = 1, dist = 0) {
    if (!this.ready) return;
    const v = this.distVol(dist) * Math.min(1.2, size);
    if (v <= 0.02) return;
    this.noise(1.1, { type: 'lowpass', f: 3200, f2: 90, q: 0.8, gain: 0.55 * v });
    this.noise(0.4, { type: 'highpass', f: 2500, gain: 0.12 * v, delay: 0.02 });
    this.tone(95, 0.6, { type: 'sine', f2: 32, gain: 0.75 * v });
    this.tone(60, 0.35, { type: 'triangle', f2: 30, gain: 0.4 * v, delay: 0.03 });
  }

  impact(strength, dist = 0) {
    if (!this.ready || !this.throttle('impact', 60)) return;
    const v = this.distVol(dist) * Math.min(1, strength / 30);
    if (v <= 0.02) return;
    this.noise(0.18, { type: 'lowpass', f: 1600, f2: 180, gain: 0.45 * v });
    this.tone(130, 0.18, { type: 'sine', f2: 45, gain: 0.5 * v });
    this.noise(0.08, { type: 'bandpass', f: 2600, q: 2, gain: 0.12 * v });
  }

  land(strength) {
    if (!this.ready || !this.throttle('land', 120)) return;
    const v = Math.min(1, strength / 20);
    this.tone(90, 0.2, { type: 'sine', f2: 40, gain: 0.5 * v });
    this.noise(0.22, { type: 'lowpass', f: 700, f2: 120, gain: 0.35 * v });
  }

  smash() {
    if (!this.ready || !this.throttle('smash', 50)) return;
    this.noise(0.14, { type: 'bandpass', f: 700, q: 1.5, gain: 0.3 });
    this.tone(180, 0.1, { type: 'square', f2: 60, gain: 0.08 });
  }

  pickup(kind) {
    if (!this.ready) return;
    const base = kind === 'rage' ? 523 : 660;
    [0, 4, 7, 12].forEach((n, i) => this.tone(base * Math.pow(2, n / 12), 0.09, { type: 'square', gain: 0.09, delay: i * 0.045 }));
    this.noise(0.3, { type: 'bandpass', f: 600, f2: 4000, q: 2, gain: 0.12 });
  }

  checkpoint() {
    if (!this.ready) return;
    this.tone(988, 0.12, { type: 'triangle', gain: 0.18 });
    this.tone(1319, 0.22, { type: 'triangle', gain: 0.18, delay: 0.08 });
  }

  kill(combo) {
    if (!this.ready) return;
    const n = Math.min(combo, 12);
    const f = 523 * Math.pow(2, n / 12);
    this.tone(f, 0.12, { type: 'square', gain: 0.1 });
    this.tone(f * 1.5, 0.18, { type: 'square', gain: 0.08, delay: 0.06 });
    this.tone(f * 2, 0.3, { type: 'triangle', gain: 0.12, delay: 0.12 });
    this.noise(0.25, { type: 'highpass', f: 6000, gain: 0.06, delay: 0.1 });
  }

  countdown(go) {
    if (!this.ready) return;
    if (go) {
      this.tone(880, 0.5, { type: 'square', gain: 0.16 });
      this.tone(1760, 0.5, { type: 'triangle', gain: 0.1 });
    } else this.tone(440, 0.18, { type: 'square', gain: 0.14 });
  }

  bolt(dist) {
    if (!this.ready || !this.throttle('bolt', 50)) return;
    const v = this.distVol(dist);
    if (v < 0.05) return;
    this.tone(900, 0.14, { type: 'sawtooth', f2: 260, gain: 0.07 * v });
  }

  playerHit() {
    if (!this.ready || !this.throttle('phit', 80)) return;
    this.tone(220, 0.22, { type: 'sawtooth', f2: 70, gain: 0.18 });
    this.noise(0.18, { type: 'bandpass', f: 1500, q: 1, gain: 0.25 });
  }

  heartbeat(rate) {
    if (!this.ready || !this.throttle('heart', 1000 / rate)) return;
    this.tone(62, 0.12, { type: 'sine', f2: 40, gain: 0.55 });
    this.tone(58, 0.14, { type: 'sine', f2: 38, gain: 0.4, delay: 0.17 });
  }

  boost() {
    if (!this.ready || !this.throttle('boost', 300)) return;
    this.noise(0.6, { type: 'bandpass', f: 300, f2: 3500, q: 1.2, gain: 0.22 });
    this.tone(110, 0.4, { type: 'sawtooth', f2: 220, gain: 0.06 });
  }

  backfire() {
    if (!this.ready || !this.throttle('bf', 150)) return;
    this.noise(0.07, { type: 'lowpass', f: 1400, f2: 300, gain: 0.25 });
    this.tone(75, 0.08, { type: 'square', f2: 40, gain: 0.1 });
  }

  overheat() {
    if (!this.ready) return;
    this.noise(0.6, { type: 'highpass', f: 4000, gain: 0.14 });
    this.tone(320, 0.3, { type: 'square', f2: 140, gain: 0.08 });
  }

  ui(confirm = false) {
    if (!this.ready || !this.throttle('ui', 40)) return;
    if (confirm) {
      this.tone(880, 0.07, { type: 'square', gain: 0.08 });
      this.tone(1320, 0.12, { type: 'square', gain: 0.08, delay: 0.06 });
    } else this.tone(1200, 0.04, { type: 'square', gain: 0.05 });
  }

  lap(final) {
    if (!this.ready) return;
    const notes = final ? [0, 4, 7, 12, 16] : [0, 7, 12];
    notes.forEach((n, i) => this.tone(659 * Math.pow(2, n / 12), 0.14, { type: 'square', gain: 0.09, delay: i * 0.07 }));
  }

  win() {
    if (!this.ready) return;
    [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((n, i) => this.tone(523 * Math.pow(2, n / 12), 0.22, { type: i % 2 ? 'triangle' : 'square', gain: 0.1, delay: i * 0.09 }));
  }

  lose() {
    if (!this.ready) return;
    [12, 7, 3, 0].forEach((n, i) => this.tone(330 * Math.pow(2, n / 12), 0.3, { type: 'sawtooth', gain: 0.08, delay: i * 0.16 }));
    this.tone(1000, 1.4, { type: 'sine', gain: 0.07, delay: 0.75 });
  }

  timeGain() {
    if (!this.ready || !this.throttle('tg', 60)) return;
    this.tone(1568, 0.08, { type: 'triangle', gain: 0.08 });
    this.tone(2093, 0.1, { type: 'triangle', gain: 0.06, delay: 0.05 });
  }
}

// ---------------------------------------------------------------------------
//  Tiny step sequencer: 140 BPM synthwave in A minor (Am - F - C - G).
// ---------------------------------------------------------------------------
const PROG = [
  { root: 45, tones: [57, 60, 64] },
  { root: 41, tones: [57, 60, 65] },
  { root: 48, tones: [55, 60, 64] },
  { root: 43, tones: [55, 59, 62] },
];

class Music {
  constructor(a) {
    this.a = a;
    this.bpm = 140;
    this.step = 0;
    this.mode = 0;
    this.next = 0;
    this.timer = null;
  }

  start() {
    const c = this.a.ctx;
    this.next = c.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  schedule() {
    const c = this.a.ctx;
    if (!c || c.state !== 'running') return;
    const stepDur = 60 / this.bpm / 4;
    if (this.next < c.currentTime - 0.2) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.12) {
      this.play(this.step, this.next, stepDur);
      this.next += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  play(step, t, sd) {
    const a = this.a, c = a.ctx, out = a.musicBus;
    const bar = Math.floor(step / 16) % 4;
    const s = step % 16;
    const ch = PROG[bar];
    const race = this.mode === 1;
    // bass: driving 8ths with octave jumps
    if (s % 2 === 0) {
      const n = ch.root + (s % 4 === 2 ? 12 : 0);
      this.voice(midi(n), t, sd * 1.8, 'sawtooth', race ? 0.16 : 0.09, 900, out);
    }
    if (race) {
      if (s % 4 === 0) this.kick(t, out);
      if (s === 4 || s === 12) this.snare(t, out);
      if (s % 2 === 1) this.hat(t, out, 0.05);
      if (s === 14 && bar === 3) this.snare(t, out, 0.6);
      // arpeggio
      const tone = ch.tones[(s + Math.floor(s / 4)) % 3] + 12;
      this.voice(midi(tone), t, sd * 0.9, 'square', 0.035, 3500, out);
    } else if (s === 0) {
      for (const n of ch.tones) this.voice(midi(n), t, sd * 15, 'sawtooth', 0.035, 1400, out, 0.4);
    }
  }

  voice(f, t, dur, type, gain, cutoff, out, attack = 0.005) {
    const c = this.a.ctx;
    const o = c.createOscillator(); o.type = type; o.frequency.value = f;
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 4;
    fl.frequency.setValueAtTime(cutoff, t);
    fl.frequency.exponentialRampToValueAtTime(Math.max(120, cutoff * 0.25), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.05);
  }

  kick(t, out) {
    const c = this.a.ctx;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + 0.3);
  }

  snare(t, out, k = 1) {
    const a = this.a, c = a.ctx;
    const src = c.createBufferSource(); src.buffer = a.noiseBuf;
    const fl = c.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 1200;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * k, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    src.connect(fl); fl.connect(g); g.connect(out);
    src.start(t, Math.random()); src.stop(t + 0.2);
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(190, t);
    const g2 = c.createGain();
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.15 * k, t + 0.003);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g2); g2.connect(out); o.start(t); o.stop(t + 0.1);
  }

  hat(t, out, gain) {
    const a = this.a, c = a.ctx;
    const src = c.createBufferSource(); src.buffer = a.noiseBuf;
    const fl = c.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 7500;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(fl); fl.connect(g); g.connect(out);
    src.start(t, Math.random()); src.stop(t + 0.06);
  }
}
