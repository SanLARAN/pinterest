// Procedural audio engine. No samples: everything is synthesized with WebAudio.
import { settings } from '../core/storage.js';

function makeNoise(ctx, type, seconds = 2) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'white') d[i] = w;
    else if (type === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    } else {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  return buf;
}

function makeIR(ctx, seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // sparse early reflections (trees) + diffuse tail
      const early = i < ctx.sampleRate * 0.12 && Math.random() < 0.004 ? (Math.random() * 2 - 1) * 2 : 0;
      d[i] = ((Math.random() * 2 - 1) * Math.pow(1 - t, decay) + early) * 0.6;
    }
  }
  return buf;
}

function distCurve(amount) {
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    c[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return c;
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ambOn = false;
    this.nextAmbEvent = 0;
    this.nextBeat = 0;
    this.listener = { x: 0, y: 0, z: 0, fx: 0, fz: -1 };
    this._outBuf = null;
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }
  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC({ latencyHint: 'interactive' }));
    this.master = ctx.createGain();
    this.master.gain.value = settings.volume;
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -9;
    this.limiter.knee.value = 6;
    this.limiter.ratio.value = 14;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.22;
    this.master.connect(this.limiter);
    this.limiter.connect(ctx.destination);
    this.outAnalyser = ctx.createAnalyser();
    this.outAnalyser.fftSize = 512;
    this.limiter.connect(this.outAnalyser);
    this._outBuf = new Float32Array(this.outAnalyser.fftSize);

    this.pauseGain = ctx.createGain();
    this.pauseGain.connect(this.master);
    const bus = (g) => {
      const n = ctx.createGain();
      n.gain.value = g;
      n.connect(this.pauseGain);
      return n;
    };
    this.sfx = bus(1);
    this.amb = bus(0);
    this.echoBus = bus(0.9);
    this.ui = ctx.createGain();
    this.ui.gain.value = 0.5;
    this.ui.connect(this.master);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = makeIR(ctx, 3.2, 2.6);
    this.revSend = ctx.createGain();
    this.revSend.gain.value = 1;
    const revOut = ctx.createGain();
    revOut.gain.value = 0.55;
    this.revSend.connect(this.reverb);
    this.reverb.connect(revOut);
    revOut.connect(this.pauseGain);

    // what could leak back into the microphone: transient SFX + voice echo + reverb (not the steady ambience)
    this.gateAnalyser = ctx.createAnalyser();
    this.gateAnalyser.fftSize = 512;
    this.sfx.connect(this.gateAnalyser);
    this.echoBus.connect(this.gateAnalyser);
    revOut.connect(this.gateAnalyser);
    this._gateBuf = new Float32Array(this.gateAnalyser.fftSize);

    this.white = makeNoise(ctx, 'white', 2);
    this.pink = makeNoise(ctx, 'pink', 3);
    this.brown = makeNoise(ctx, 'brown', 4);
    this.distHard = distCurve(80);
    this.distSoft = distCurve(12);

    if (ctx.listener.positionX) {
      ctx.listener.upX.value = 0;
      ctx.listener.upY.value = 1;
      ctx.listener.upZ.value = 0;
    }
  }

  setVolume(v) {
    if (this.master) this.master.gain.setTargetAtTime(v, this.now, 0.05);
  }

  setPaused(p) {
    this.pausedFlag = p;
    if (!this.ctx) return;
    this.pauseGain.gain.setTargetAtTime(p ? 0 : 1, this.now, 0.06);
  }

  // RMS (dBFS) of the transient sounds we're playing, at speaker level (used so the mic doesn't hear the game)
  outputDb() {
    if (!this.gateAnalyser || this.pausedFlag) return -100;
    const b = this._gateBuf;
    this.gateAnalyser.getFloatTimeDomainData(b);
    let s = 0;
    for (let i = 0; i < b.length; i++) s += b[i] * b[i];
    const vol = Math.max(0.001, this.master.gain.value);
    return 20 * Math.log10(Math.sqrt(s / b.length) * vol + 1e-9);
  }

  setListener(x, y, z, fx, fy, fz) {
    this.listener.x = x; this.listener.y = y; this.listener.z = z;
    this.listener.fx = fx; this.listener.fz = fz;
    if (!this.ctx) return;
    const L = this.ctx.listener;
    const t = this.now;
    if (L.positionX) {
      L.positionX.setTargetAtTime(x, t, 0.02);
      L.positionY.setTargetAtTime(y, t, 0.02);
      L.positionZ.setTargetAtTime(z, t, 0.02);
      L.forwardX.setTargetAtTime(fx, t, 0.02);
      L.forwardY.setTargetAtTime(fy, t, 0.02);
      L.forwardZ.setTargetAtTime(fz, t, 0.02);
    } else if (L.setPosition) {
      L.setPosition(x, y, z);
      L.setOrientation(fx, fy, fz, 0, 1, 0);
    }
  }

  // pan [-1,1] of a world point relative to the listener (cheap stereo)
  panOf(x, z) {
    const L = this.listener;
    const dx = x - L.x, dz = z - L.z;
    const d = Math.hypot(dx, dz) || 1;
    const rx = -L.fz, rz = L.fx; // right vector = (-fz, fx)
    return Math.max(-1, Math.min(1, (dx * rx + dz * rz) / d));
  }
  behindOf(x, z) {
    const L = this.listener;
    const dx = x - L.x, dz = z - L.z;
    const d = Math.hypot(dx, dz) || 1;
    return (dx * L.fx + dz * L.fz) / d < -0.2;
  }

  // ---------- building blocks ----------
  _noise(buf = this.white) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    return s;
  }
  _gain(v = 0) {
    const g = this.ctx.createGain();
    g.gain.value = v;
    return g;
  }
  _filter(type, f, q = 1) {
    const b = this.ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    return b;
  }
  _osc(type, f) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    return o;
  }
  _env(g, t, a, peak, d, hold = 0) {
    const p = g.gain;
    p.cancelScheduledValues(t);
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(peak, t + a);
    if (hold) p.setValueAtTime(peak, t + a + hold);
    p.exponentialRampToValueAtTime(0.0001, t + a + hold + d);
    return t + a + hold + d;
  }
  _panner(x, y, z, ref = 3, roll = 1.1) {
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = ref;
    p.rolloffFactor = roll;
    p.maxDistance = 150;
    if (p.positionX) {
      p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z;
    } else p.setPosition(x, y, z);
    return p;
  }
  _stereo(pan) {
    const p = this.ctx.createStereoPanner();
    p.pan.value = pan;
    return p;
  }
  // route node -> dest (+ reverb send)
  _out(node, dest, rev = 0) {
    node.connect(dest);
    if (rev > 0) {
      const s = this._gain(rev);
      node.connect(s);
      s.connect(this.revSend);
    }
  }
  _noiseBurst(t, { buf, type = 'bandpass', f = 1000, q = 1, a = 0.002, d = 0.1, gain = 0.5, dest, rev = 0, fEnd, hold = 0 }) {
    const n = this._noise(buf || this.white);
    const fl = this._filter(type, f, q);
    if (fEnd) fl.frequency.exponentialRampToValueAtTime(fEnd, t + a + hold + d);
    const g = this._gain();
    n.connect(fl).connect(g);
    this._out(g, dest || this.sfx, rev);
    const end = this._env(g, t, a, gain, d, hold);
    n.start(t, Math.random() * 1.5);
    n.stop(end + 0.05);
    return g;
  }
  _tone(t, { type = 'sine', f = 440, fEnd, a = 0.005, d = 0.2, gain = 0.3, dest, rev = 0, hold = 0, detune = 0 }) {
    const o = this._osc(type, f);
    o.detune.value = detune;
    if (fEnd) o.frequency.exponentialRampToValueAtTime(fEnd, t + a + hold + d);
    const g = this._gain();
    o.connect(g);
    this._out(g, dest || this.sfx, rev);
    const end = this._env(g, t, a, gain, d, hold);
    o.start(t);
    o.stop(end + 0.05);
    return { o, g };
  }

  // ---------- player sounds ----------
  click(loud = 0.3) {
    if (!this.ready) return;
    const t = this.now;
    this._noiseBurst(t, { f: 3400, q: 2.5, a: 0.0008, d: 0.03, gain: 0.7 + loud });
    this._tone(t, { f: 2100, fEnd: 900, a: 0.001, d: 0.05, gain: 0.35 });
    this._tone(t + 0.01, { f: 1250, fEnd: 990, a: 0.004, d: 0.7, gain: 0.07, rev: 0.6 });
  }

  clap(loud = 0.6) {
    if (!this.ready) return;
    const t = this.now;
    for (let i = 0; i < 3; i++) this._noiseBurst(t + i * 0.009, { f: 1150 + i * 200, q: 0.9, a: 0.001, d: 0.012, gain: 0.6 * loud });
    this._noiseBurst(t + 0.027, { f: 1200, q: 0.7, a: 0.001, d: 0.14, gain: 0.9 * loud, rev: 0.9 });
  }

  shout(loud = 0.9) {
    if (!this.ready) return;
    const t = this.now;
    const dur = 0.35 + loud * 0.25;
    const src = this._osc('sawtooth', 170 + loud * 90);
    src.frequency.linearRampToValueAtTime(230 + loud * 120, t + 0.08);
    src.frequency.linearRampToValueAtTime(190 + loud * 60, t + dur);
    const vib = this._osc('sine', 5.5);
    const vg = this._gain(6 + loud * 10);
    vib.connect(vg).connect(src.frequency);
    const f1 = this._filter('bandpass', 720, 6), f2 = this._filter('bandpass', 1180, 7), f3 = this._filter('bandpass', 2600, 8);
    const g = this._gain();
    const shaper = this.ctx.createWaveShaper();
    shaper.curve = loud > 0.75 ? this.distSoft : null;
    src.connect(f1); src.connect(f2); src.connect(f3);
    const mix = this._gain(1);
    f1.connect(mix); f2.connect(mix); const g3 = this._gain(0.5); f3.connect(g3).connect(mix);
    mix.connect(shaper).connect(g);
    this._out(g, this.sfx, 0.8);
    this._env(g, t, 0.03, 0.55 * loud, 0.25, dur - 0.1);
    src.start(t); vib.start(t);
    src.stop(t + dur + 0.4); vib.stop(t + dur + 0.4);
    this._noiseBurst(t, { f: 1800, q: 0.8, a: 0.02, d: 0.25, hold: dur - 0.15, gain: 0.08 * loud });
  }

  sonarSweep(loud, big = false) {
    if (!this.ready) return;
    const t = this.now;
    this._noiseBurst(t, { buf: this.pink, f: 300, fEnd: 2400, q: 1.6, a: 0.05, d: 0.6 + loud * 0.6, gain: 0.05 + loud * 0.08, rev: 0.5 });
    if (big) this._tone(t, { f: 70, fEnd: 38, a: 0.01, d: 0.7, gain: 0.35 * loud });
  }

  // echo return from an object, scheduled when the visual wave reaches it
  tick(delay, pan, gain, pitch = 1, kind = 0) {
    if (!this.ready || gain < 0.01) return;
    const t = this.now + delay;
    const ctx = this.ctx;
    const p = this._stereo(pan);
    p.connect(this.sfx);
    const g = this._gain();
    g.connect(p);
    if (kind === 3) {
      // metal: ringing
      const o = this._osc('triangle', 1900 * pitch);
      const o2 = this._osc('sine', 2930 * pitch);
      o.connect(g); o2.connect(g);
      this._env(g, t, 0.001, gain * 0.5, 0.35);
      o.start(t); o2.start(t); o.stop(t + 0.4); o2.stop(t + 0.4);
    } else if (kind === 4) {
      // water: soft slap
      const n = this._noise();
      const f = this._filter('lowpass', 1600, 0.7);
      n.connect(f).connect(g);
      this._env(g, t, 0.003, gain * 0.6, 0.12);
      n.start(t, Math.random()); n.stop(t + 0.2);
    } else {
      const o = this._osc('sine', (kind === 1 ? 2300 : kind === 2 ? 1500 : 3000) * pitch);
      o.connect(g);
      this._env(g, t, 0.001, gain * 0.45, kind === 1 ? 0.04 : 0.03);
      o.start(t); o.stop(t + 0.08);
    }
    void ctx;
  }

  // eerie return when a wave hits a monster
  monsterReturn(delay, x, y, z, gain = 0.6) {
    if (!this.ready) return;
    const t = this.now + delay;
    const pn = this._panner(x, y, z, 4, 0.8);
    pn.connect(this.sfx);
    const g = this._gain();
    g.connect(pn);
    const o = this._osc('sawtooth', 62);
    const o2 = this._osc('sawtooth', 93.5);
    const lp = this._filter('lowpass', 420, 4);
    o.connect(lp); o2.connect(lp); lp.connect(g);
    this._env(g, t, 0.01, gain * 0.5, 0.45);
    o.start(t); o2.start(t); o.stop(t + 0.6); o2.stop(t + 0.6);
    // reversed-like breathy swell
    const n = this._noise();
    const bp = this._filter('bandpass', 900, 3);
    const ng = this._gain();
    n.connect(bp).connect(ng).connect(pn);
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(gain * 0.25, t + 0.22);
    ng.gain.linearRampToValueAtTime(0.0001, t + 0.24);
    n.start(t, Math.random()); n.stop(t + 0.3);
  }

  chime(x, y, z, step = 0, gain = 0.3, spatial = true) {
    if (!this.ready) return;
    const t = this.now;
    const f = 660 * Math.pow(2, (step % 12) / 12);
    const car = this._osc('sine', f);
    const mod = this._osc('sine', f * 2.76);
    const mg = this._gain(f * 1.8);
    mg.gain.exponentialRampToValueAtTime(1, t + 1.2);
    mod.connect(mg).connect(car.frequency);
    const g = this._gain();
    car.connect(g);
    if (spatial) {
      const pn = this._panner(x, y, z, 4, 1.0);
      g.connect(pn);
      pn.connect(this.sfx);
    } else this._out(g, this.sfx, 0.5);
    const s = this._gain(0.35);
    g.connect(s); s.connect(this.revSend);
    this._env(g, t, 0.003, gain, 1.8);
    car.start(t); mod.start(t);
    car.stop(t + 2); mod.stop(t + 2);
  }

  shardPickup(count) {
    if (!this.ready) return;
    const t0 = this.now;
    const base = [0, 4, 7, 12];
    base.forEach((st, i) => {
      const t = t0 + i * 0.06;
      const f = 523 * Math.pow(2, (st + (count % 5)) / 12);
      this._tone(t, { f, a: 0.003, d: 0.9, gain: 0.16, rev: 0.6 });
      this._tone(t, { f: f * 2.01, a: 0.003, d: 0.4, gain: 0.05 });
    });
    this._noiseBurst(t0, { f: 7000, q: 1, a: 0.01, d: 0.5, gain: 0.08, type: 'highpass' });
  }

  footstep(intensity = 0.5) {
    if (!this.ready) return;
    const t = this.now;
    const f = 650 + Math.random() * 700;
    this._noiseBurst(t, { f, q: 0.9, a: 0.002, d: 0.06 + intensity * 0.06, gain: 0.12 + intensity * 0.3 });
    this._noiseBurst(t + 0.02, { f: f * 2.4, q: 2, a: 0.004, d: 0.05, gain: 0.04 + intensity * 0.08 });
    if (intensity > 0.6) this._tone(t, { f: 95, fEnd: 55, a: 0.002, d: 0.08, gain: 0.25 * intensity });
  }

  bump() {
    if (!this.ready) return;
    const t = this.now;
    this._tone(t, { f: 90, fEnd: 42, a: 0.002, d: 0.3, gain: 0.7 });
    this._noiseBurst(t, { type: 'lowpass', f: 600, q: 0.7, a: 0.002, d: 0.12, gain: 0.5, rev: 0.4 });
    const o = this._osc('sawtooth', 130);
    o.frequency.linearRampToValueAtTime(95, t + 0.35);
    const bp = this._filter('bandpass', 520, 6);
    const g = this._gain();
    o.connect(bp).connect(g);
    this._out(g, this.sfx, 0.3);
    this._env(g, t + 0.05, 0.03, 0.12, 0.3);
    o.start(t); o.stop(t + 0.5);
  }

  throwWhoosh() {
    if (!this.ready) return;
    this._noiseBurst(this.now, { f: 500, fEnd: 2600, q: 2.2, a: 0.04, d: 0.22, gain: 0.18 });
  }

  impact(x, y, z, water = false) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 4, 0.9);
    pn.connect(this.sfx);
    const s = this._gain(0.7); pn.connect(s); s.connect(this.revSend);
    if (water) {
      const n = this._noise(); const lp = this._filter('lowpass', 3500, 1); const g = this._gain();
      lp.frequency.exponentialRampToValueAtTime(500, t + 0.45);
      n.connect(lp).connect(g).connect(pn);
      this._env(g, t, 0.005, 0.9, 0.45);
      n.start(t, Math.random()); n.stop(t + 0.6);
      return;
    }
    const n = this._noise(); const bp = this._filter('bandpass', 1700, 3); const g = this._gain();
    n.connect(bp).connect(g).connect(pn);
    this._env(g, t, 0.001, 1.2, 0.05);
    n.start(t, Math.random()); n.stop(t + 0.1);
    const o = this._osc('sine', 420); o.frequency.exponentialRampToValueAtTime(180, t + 0.1);
    const g2 = this._gain(); o.connect(g2).connect(pn);
    this._env(g2, t, 0.001, 0.8, 0.12);
    o.start(t); o.stop(t + 0.2);
    // second small bounce
    const n2 = this._noise(); const bp2 = this._filter('bandpass', 2300, 3); const g3 = this._gain();
    n2.connect(bp2).connect(g3).connect(pn);
    this._env(g3, t + 0.16, 0.001, 0.4, 0.04);
    n2.start(t + 0.16, Math.random()); n2.stop(t + 0.25);
  }

  heartbeat(gain) {
    if (!this.ready) return;
    const t = this.now;
    this._tone(t, { f: 62, fEnd: 38, a: 0.006, d: 0.14, gain: gain });
    this._tone(t + 0.21, { f: 55, fEnd: 36, a: 0.006, d: 0.16, gain: gain * 0.7 });
  }

  breathHeavy() {
    if (!this.ready) return;
    const t = this.now;
    this._noiseBurst(t, { f: 950, q: 1.1, a: 0.12, d: 0.25, hold: 0.1, gain: 0.12 });
    this._noiseBurst(t + 0.5, { f: 700, q: 1.1, a: 0.08, d: 0.3, hold: 0.05, gain: 0.09 });
  }

  // ---------- monster sounds ----------
  growl(x, y, z, gain = 0.8) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 4, 0.9);
    pn.connect(this.sfx);
    const o = this._osc('sawtooth', 68 + Math.random() * 20);
    o.frequency.linearRampToValueAtTime(52, t + 1.1);
    const trem = this._osc('square', 13 + Math.random() * 6);
    const tg = this._gain(0.5);
    const g = this._gain();
    const lp = this._filter('lowpass', 520, 3);
    const am = this._gain(0.5);
    trem.connect(tg).connect(am.gain);
    o.connect(lp).connect(am).connect(g).connect(pn);
    this._env(g, t, 0.15, gain, 0.7, 0.35);
    o.start(t); trem.start(t); o.stop(t + 1.4); trem.stop(t + 1.4);
  }

  screech(x, y, z, gain = 1) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 6, 0.6);
    pn.connect(this.sfx);
    const sh = this.ctx.createWaveShaper();
    sh.curve = this.distHard;
    const g = this._gain();
    sh.connect(g).connect(pn);
    const s = this._gain(0.5); g.connect(s); s.connect(this.revSend);
    const fs = [410, 553, 742, 1180];
    fs.forEach((f) => {
      const o = this._osc('sawtooth', f);
      o.frequency.setValueAtTime(f * 0.7, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.25, t + 0.15);
      o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 1.2);
      const v = this._osc('sine', 28 + Math.random() * 14);
      const vg = this._gain(f * 0.05);
      v.connect(vg).connect(o.frequency);
      const og = this._gain(0.18);
      o.connect(og).connect(sh);
      o.start(t); v.start(t); o.stop(t + 1.3); v.stop(t + 1.3);
    });
    const n = this._noise(); const bp = this._filter('bandpass', 2500, 0.8); const ng = this._gain(0.4);
    n.connect(bp).connect(ng).connect(sh);
    n.start(t, Math.random()); n.stop(t + 1.3);
    this._env(g, t, 0.04, 0.55 * gain, 0.9, 0.25);
  }

  heavyStep(x, y, z, gain = 0.5) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 3, 1.2);
    pn.connect(this.sfx);
    const o = this._osc('sine', 75); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const g = this._gain(); o.connect(g).connect(pn);
    this._env(g, t, 0.003, gain, 0.15);
    o.start(t); o.stop(t + 0.2);
    const n = this._noise(); const bp = this._filter('bandpass', 500 + Math.random() * 400, 1); const g2 = this._gain();
    n.connect(bp).connect(g2).connect(pn);
    this._env(g2, t, 0.003, gain * 0.6, 0.09);
    n.start(t, Math.random()); n.stop(t + 0.15);
  }

  chitter(x, y, z, gain = 0.5) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 3, 1.1);
    pn.connect(this.sfx);
    const count = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const tt = t + i * (0.03 + Math.random() * 0.02);
      const n = this._noise(); const bp = this._filter('bandpass', 2500 + Math.random() * 2500, 6); const g = this._gain();
      n.connect(bp).connect(g).connect(pn);
      this._env(g, tt, 0.001, gain, 0.02);
      n.start(tt, Math.random()); n.stop(tt + 0.04);
    }
  }

  // persistent breathing voice attached to a monster (returns handle with setPos / stop)
  breather(x, y, z) {
    if (!this.ready) return null;
    const pn = this._panner(x, y, z, 2.5, 1.4);
    pn.connect(this.sfx);
    const g = this._gain(0);
    const n = this._noise(this.pink);
    const bp = this._filter('bandpass', 520, 2.2);
    n.connect(bp).connect(g).connect(pn);
    n.start(this.now, Math.random() * 2);
    const self = this;
    let next = 0;
    return {
      setPos(px, py, pz) {
        const t = self.now;
        if (pn.positionX) {
          pn.positionX.setTargetAtTime(px, t, 0.05);
          pn.positionY.setTargetAtTime(py, t, 0.05);
          pn.positionZ.setTargetAtTime(pz, t, 0.05);
        } else pn.setPosition(px, py, pz);
      },
      update(rate, gain) {
        const t = self.now;
        if (t < next) return;
        const per = 2.6 / rate;
        next = t + per;
        const p = g.gain;
        p.cancelScheduledValues(t);
        p.setValueAtTime(0.0001, t);
        p.linearRampToValueAtTime(gain, t + per * 0.35);
        p.linearRampToValueAtTime(0.0001, t + per * 0.5);
        p.linearRampToValueAtTime(gain * 0.8, t + per * 0.75);
        p.linearRampToValueAtTime(0.0001, t + per * 0.98);
        bp.frequency.setValueAtTime(420 + Math.random() * 300, t);
      },
      stop() {
        try { g.gain.setTargetAtTime(0, self.now, 0.05); n.stop(self.now + 0.3); } catch { /* */ }
      },
    };
  }

  // ---------- scares ----------
  sting(gain = 1) {
    if (!this.ready) return;
    const t = this.now;
    [233, 247, 349, 370, 494].forEach((f) => this._tone(t, { type: 'sawtooth', f, fEnd: f * 0.94, a: 0.005, d: 1.4, gain: 0.07 * gain, rev: 0.7 }));
    this._noiseBurst(t, { f: 1800, q: 0.6, a: 0.002, d: 0.5, gain: 0.5 * gain, rev: 0.6 });
    const v = this._tone(t, { f: 1760, a: 0.01, d: 1.0, gain: 0.08 * gain, hold: 0.2 });
    const lfo = this._osc('sine', 9); const lg = this._gain(60); lfo.connect(lg).connect(v.o.frequency); lfo.start(t); lfo.stop(t + 1.3);
    this._tone(t, { f: 48, fEnd: 30, a: 0.005, d: 0.8, gain: 0.6 * gain });
  }

  whisper(x, y, z, dur = 1.6) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 1, 1.5);
    pn.connect(this.sfx);
    const n = this._noise(this.white);
    const bp = this._filter('bandpass', 3000, 1.5);
    const bp2 = this._filter('peaking', 1200, 2);
    bp2.gain.value = 8;
    const am = this._gain(0);
    n.connect(bp).connect(bp2).connect(am).connect(pn);
    let tt = t;
    while (tt < t + dur) {
      const syl = 0.06 + Math.random() * 0.12;
      am.gain.setValueAtTime(0.0001, tt);
      am.gain.linearRampToValueAtTime(0.25 + Math.random() * 0.25, tt + syl * 0.3);
      am.gain.linearRampToValueAtTime(0.0001, tt + syl);
      bp.frequency.setValueAtTime(2000 + Math.random() * 3000, tt);
      tt += syl + Math.random() * 0.06;
    }
    n.start(t, Math.random()); n.stop(t + dur + 0.2);
  }

  branchSnap(x, y, z, gain = 1) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 4, 0.8);
    pn.connect(this.sfx);
    const s = this._gain(0.6); pn.connect(s); s.connect(this.revSend);
    for (let i = 0; i < 3; i++) {
      const tt = t + i * 0.025 + Math.random() * 0.02;
      const n = this._noise(); const hp = this._filter('highpass', 1200 + i * 500, 1); const g = this._gain();
      n.connect(hp).connect(g).connect(pn);
      this._env(g, tt, 0.0005, gain * (1 - i * 0.25), 0.04);
      n.start(tt, Math.random()); n.stop(tt + 0.07);
    }
  }

  jumpscare(intensity = 1) {
    if (!this.ready) return;
    const t = this.now;
    const g = this._gain();
    const sh = this.ctx.createWaveShaper();
    sh.curve = this.distHard;
    sh.connect(g);
    g.connect(this.master);
    const fs = [180, 311, 466, 622, 933, 1244];
    fs.forEach((f) => {
      const o = this._osc('sawtooth', f);
      o.frequency.setValueAtTime(f * 1.6, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 1.5);
      const j = this._osc('square', 31 + Math.random() * 20);
      const jg = this._gain(f * 0.12);
      j.connect(jg).connect(o.frequency);
      const og = this._gain(0.16);
      o.connect(og).connect(sh);
      o.start(t); j.start(t); o.stop(t + 1.7); j.stop(t + 1.7);
    });
    const n = this._noise(); const ng = this._gain(0.7);
    n.connect(ng).connect(sh); n.start(t); n.stop(t + 1.7);
    this._env(g, t, 0.005, 0.85 * intensity, 1.3, 0.2);
    const b = this._tone(t, { f: 55, fEnd: 28, a: 0.003, d: 1.2, gain: 0.9 * intensity, dest: this.master });
    void b;
  }

  // ---------- ambience ----------
  startAmbience() {
    if (!this.ready || this.ambOn) return;
    this.ambOn = true;
    const ctx = this.ctx;
    const t = this.now;
    // wind
    const wn = this._noise(this.brown);
    const wf = this._filter('bandpass', 380, 0.6);
    const wg = this._gain(0.35);
    const lfo = this._osc('sine', 0.07); const lfoG = this._gain(170);
    lfo.connect(lfoG).connect(wf.frequency);
    const lfo2 = this._osc('sine', 0.113); const lfo2G = this._gain(0.18);
    lfo2.connect(lfo2G).connect(wg.gain);
    wn.connect(wf).connect(wg).connect(this.amb);
    wn.start(t); lfo.start(t); lfo2.start(t);
    // high whistle through branches
    const hn = this._noise(this.pink);
    const hf = this._filter('bandpass', 1650, 14);
    const hg = this._gain(0.05);
    const hl = this._osc('sine', 0.05); const hlG = this._gain(400);
    hl.connect(hlG).connect(hf.frequency);
    hn.connect(hf).connect(hg).connect(this.amb);
    hn.start(t); hl.start(t);
    // low drone
    const dg = this._gain(0.07);
    const dl = this._filter('lowpass', 240, 0.7);
    dl.connect(dg).connect(this.amb);
    [41.2, 41.75, 82.9].forEach((f, i) => {
      const o = this._osc(i === 2 ? 'triangle' : 'sine', f);
      o.connect(dl);
      o.start(t);
    });
    this.ambNodes = { wg, dg };
    this.nextAmbEvent = t + 4;
    void ctx;
  }

  setAmbience(level, dread = 0) {
    if (!this.ctx) return;
    this.amb.gain.setTargetAtTime(level, this.now, 0.8);
    if (this.ambNodes) this.ambNodes.dg.gain.setTargetAtTime(0.06 + dread * 0.12, this.now, 1.5);
  }

  ambientEvent() {
    if (!this.ready) return;
    const L = this.listener;
    const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 40;
    const x = L.x + Math.cos(a) * d, z = L.z + Math.sin(a) * d, y = L.y + 4;
    const r = Math.random();
    const t = this.now;
    const pn = this._panner(x, y, z, 6, 0.7);
    pn.connect(this.amb);
    const s = this._gain(0.8); pn.connect(s); s.connect(this.revSend);
    if (r < 0.3) {
      // owl
      for (let i = 0; i < 2; i++) {
        const o = this._osc('sine', 390); const g = this._gain();
        const tt = t + i * 0.45;
        o.frequency.setValueAtTime(360, tt); o.frequency.linearRampToValueAtTime(410, tt + 0.08); o.frequency.linearRampToValueAtTime(330, tt + 0.35);
        o.connect(g).connect(pn);
        this._env(g, tt, 0.04, 0.25, 0.3);
        o.start(tt); o.stop(tt + 0.5);
      }
    } else if (r < 0.5) {
      // distant howl
      const o = this._osc('sine', 380); const g = this._gain();
      const v = this._osc('sine', 5); const vg = this._gain(12); v.connect(vg).connect(o.frequency);
      o.frequency.setValueAtTime(300, t); o.frequency.linearRampToValueAtTime(560, t + 0.9); o.frequency.linearRampToValueAtTime(380, t + 2.8);
      o.connect(g).connect(pn);
      this._env(g, t, 0.5, 0.18, 1.6, 0.8);
      o.start(t); v.start(t); o.stop(t + 3.2); v.stop(t + 3.2);
    } else if (r < 0.75) {
      // tree creak
      const o = this._osc('sawtooth', 110); const bp = this._filter('bandpass', 700, 9); const g = this._gain();
      o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(150, t + 1.4);
      const tr = this._osc('square', 24); const tg = this._gain(30); tr.connect(tg).connect(o.frequency);
      o.connect(bp).connect(g).connect(pn);
      this._env(g, t, 0.3, 0.14, 0.6, 0.8);
      o.start(t); tr.start(t); o.stop(t + 1.9); tr.stop(t + 1.9);
    } else if (r < 0.9) {
      // branch snap far away
      this.branchSnap(x, y, z, 0.35);
    } else {
      // leaves rustle gust
      const n = this._noise(this.pink); const bp = this._filter('bandpass', 3200, 0.8); const g = this._gain();
      n.connect(bp).connect(g).connect(pn);
      this._env(g, t, 0.6, 0.2, 1.2, 0.4);
      n.start(t, Math.random()); n.stop(t + 2.4);
    }
  }

  // called every frame while playing
  update(dangerBeat) {
    if (!this.ready) return;
    const t = this.now;
    if (this.ambOn && t > this.nextAmbEvent) {
      this.ambientEvent();
      this.nextAmbEvent = t + 7 + Math.random() * 14;
    }
    if (dangerBeat > 0.05) {
      if (t > this.nextBeat) {
        this.heartbeat(0.25 + dangerBeat * 0.55);
        const bpm = 62 + dangerBeat * 90;
        this.nextBeat = t + 60 / bpm;
      }
    } else this.nextBeat = Math.max(this.nextBeat, t);
  }

  dawn() {
    if (!this.ready) return;
    const t = this.now;
    [220, 277.2, 329.6, 440, 554.4].forEach((f, i) => this._tone(t + i * 0.4, { f, a: 2.5, d: 5, hold: 2, gain: 0.05, rev: 0.6 }));
    for (let i = 0; i < 14; i++) {
      const tt = t + 1.5 + Math.random() * 7;
      const f = 2800 + Math.random() * 1800;
      this._tone(tt, { f, fEnd: f * (0.7 + Math.random() * 0.6), a: 0.01, d: 0.12, gain: 0.04 });
      this._tone(tt + 0.15, { f: f * 1.1, fEnd: f * 0.8, a: 0.01, d: 0.1, gain: 0.03 });
    }
  }

  // ---------- UI ----------
  uiHover() {
    if (!this.ready) return;
    const t = this.now;
    const o = this._osc('sine', 1900); const g = this._gain(); o.connect(g).connect(this.ui);
    this._env(g, t, 0.002, 0.08, 0.04); o.start(t); o.stop(t + 0.08);
  }
  uiClick() {
    if (!this.ready) return;
    const t = this.now;
    const o = this._osc('sine', 700); o.frequency.exponentialRampToValueAtTime(1500, t + 0.08);
    const g = this._gain(); o.connect(g).connect(this.ui);
    this._env(g, t, 0.003, 0.18, 0.14); o.start(t); o.stop(t + 0.2);
  }
}

export const audio = new AudioEngine();
