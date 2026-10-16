// Procedural audio engine. No samples: everything is synthesized with WebAudio.
// Scares are built like film sound: the forest holds its breath (ambience ducks to silence),
// something inhales behind you, then the hit — voices come from a crude vocal-tract synth
// (buzz/noise -> formant resonances), so screams and whispers sound like throats, not oscillators.
// After a death the world goes muffled, your ears ring, and your heart slows to nothing.
import { settings } from '../core/storage.js';
import { getLang } from '../core/i18n.js';

// vowel formants F1/F2/F3 (Hz), rough adult averages; 'A' is a screamed «а» (throat wide open)
const VOWELS = {
  a: [800, 1250, 2600],
  o: [500, 880, 2500],
  u: [340, 760, 2300],
  i: [290, 2250, 3000],
  e: [470, 1850, 2600],
  y: [420, 1450, 2400],
  A: [1000, 1500, 3000],
};
const VOWEL_KEYS = ['a', 'o', 'u', 'i', 'e', 'y'];
const sstep = (a, b, v) => {
  const x = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

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
    this.offline = false; // true when rendering into an OfflineAudioContext (sound tests)
  }

  get ready() {
    return !!this.ctx && (this.ctx.state === 'running' || this.offline);
  }
  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  init(ctxOverride) {
    if (this.ctx) {
      if (this.ctx.state !== 'running' && !this.offline) this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC && !ctxOverride) return;
    const ctx = (this.ctx = ctxOverride || new AC({ latencyHint: 'interactive' }));
    this.offline = !!ctxOverride;
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

    // everything in the world passes a "stun" lowpass: after a hit your ears shut down for a moment
    this.stunLP = ctx.createBiquadFilter();
    this.stunLP.type = 'lowpass';
    this.stunLP.frequency.value = 20000;
    this.stunLP.Q.value = 0.6;
    this.stunLP.connect(this.master);
    this.pauseGain = ctx.createGain();
    this.pauseGain.connect(this.stunLP);
    const bus = (g) => {
      const n = ctx.createGain();
      n.gain.value = g;
      n.connect(this.pauseGain);
      return n;
    };
    this.sfx = bus(1);
    this.amb = bus(0);
    this.echoBus = bus(0.9);
    this.body = bus(1); // your own heartbeat: not ducked, not heard by the mic gate
    // the forest can fall silent: ambience runs through a duck stage
    this.duckGain = ctx.createGain();
    this.amb.disconnect();
    this.amb.connect(this.duckGain);
    this.duckGain.connect(this.pauseGain);
    this._freshDeathBus();
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
    this.distScream = distCurve(40);

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

  // ---------- scare infrastructure ----------
  _freshDeathBus() {
    // death sounds (scream, ringing, the last heartbeats) live on their own bus so a quick
    // restart can cut them off cleanly
    if (this.deathBus) {
      const old = this.deathBus;
      old.gain.setTargetAtTime(0, this.now, 0.04);
      setTimeout(() => { try { old.disconnect(); } catch { /* */ } }, 600);
    }
    this.deathBus = this.ctx.createGain();
    this.deathBus.connect(this.stunLP);
  }

  // new run / back to menu: clear any lingering stun, silence, or death tail
  resetFx() {
    if (!this.ctx) return;
    const t = this.now;
    this.stunLP.frequency.cancelScheduledValues(t);
    this.stunLP.frequency.setValueAtTime(20000, t);
    this.duckGain.gain.cancelScheduledValues(t);
    this.duckGain.gain.setValueAtTime(this.duckGain.gain.value, t);
    this.duckGain.gain.linearRampToValueAtTime(1, t + 0.4);
    this._freshDeathBus();
  }

  // ears shutting down after a hit: everything sinks under a lowpass, then slowly comes back
  stun(depth = 1, dur = 3) {
    if (!this.stunLP) return;
    const t = this.now;
    const f = this.stunLP.frequency;
    const low = 20000 * Math.pow(0.03, depth); // depth 1 -> 600 Hz
    f.cancelScheduledValues(t);
    f.setValueAtTime(20000, t);
    f.setValueAtTime(20000, t + 0.14);
    f.exponentialRampToValueAtTime(low, t + 0.5);
    f.setValueAtTime(low, t + 0.5 + dur * 0.22);
    f.exponentialRampToValueAtTime(20000, t + dur);
  }

  // a thin, beating whine in both ears (bypasses the stun filter: it's inside your head)
  tinnitus(t, dur = 3, gain = 0.02) {
    [6150, 6163].forEach((f, i) => this._tone(t, { f, a: 0.4, hold: dur * 0.3, d: dur * 0.7, gain: gain * (i ? 0.6 : 1), dest: this.master }));
  }

  // the forest holds its breath
  duck(depth = 0.1, attack = 0.3, hold = 1, release = 2) {
    if (!this.duckGain) return;
    const t = this.now, g = this.duckGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.0001, g.value), t);
    g.linearRampToValueAtTime(depth, t + attack);
    g.setValueAtTime(depth, t + attack + hold);
    g.linearRampToValueAtTime(1, t + attack + hold + release);
  }

  // the second before a scare: silence, then (sometimes) something breathes in right behind you,
  // or a pressure you feel more than hear. Leaves a sliver of dead air before the hit.
  preScare(lead = 0.9, mode = null, intensity = 1) {
    if (!this.ready) return;
    const t = this.now;
    this.duck(0.03, lead * 0.5, lead * 0.5 + 0.6, 2.8);
    if (!mode) mode = Math.random() < 0.45 ? 'inhale' : Math.random() < 0.55 ? 'pressure' : 'silence';
    const end = t + lead - 0.12;
    if (mode === 'inhale') {
      const L = this.listener;
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = L.x - L.fx * 0.5 - L.fz * side * 0.3, z = L.z - L.fz * 0.5 + L.fx * side * 0.3;
      const pn = this._panner(x, L.y + 0.05, z, 0.5, 1.6);
      pn.connect(this.sfx);
      const n = this._noise(this.pink);
      const bp = this._filter('bandpass', 480, 1.7);
      bp.frequency.setValueAtTime(480, t + 0.1);
      bp.frequency.exponentialRampToValueAtTime(1800, end);
      const g = this._gain(0);
      n.connect(bp).connect(g).connect(pn);
      g.gain.setValueAtTime(0.0001, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.5 * intensity, end - 0.02);
      g.gain.linearRampToValueAtTime(0.0001, end);
      n.start(t, Math.random()); n.stop(end + 0.05);
    } else if (mode === 'pressure') {
      this._tone(t, { f: 33, fEnd: 47, a: lead - 0.13, d: 0.02, gain: 0.2 * intensity, dest: this.body });
      this._noiseBurst(t, { f: 5500, q: 0.9, a: lead - 0.13, d: 0.015, gain: 0.04 * intensity });
    }
  }

  _shaper(curve) {
    const s = this.ctx.createWaveShaper();
    s.curve = curve;
    s.oversample = '4x';
    return s;
  }

  // multiply a signal by a sine: inharmonic, metallic sidebands
  _ring(input, freq, t, dur) {
    const m = this._gain(0);
    const o = this._osc('sine', freq);
    o.connect(m.gain);
    input.connect(m);
    o.start(t);
    o.stop(t + dur + 0.05);
    return m;
  }

  // A throat: buzzing source (+ breath noise) through three moving formant resonances.
  // o: { f0: [[dt, hz], ...], vowel: 'a' | [[dt, vowel], ...], dur, vib: [rate, cents], jitter: cents,
  //      rasp: breath level, q, fg: formant makeup gain, type }
  _voice(t, o) {
    const dur = o.dur;
    const src = this._osc(o.type || 'sawtooth', o.f0[0][1]);
    const f = src.frequency;
    f.setValueAtTime(o.f0[0][1], t);
    for (let i = 1; i < o.f0.length; i++) f.exponentialRampToValueAtTime(o.f0[i][1], t + o.f0[i][0]);
    if (o.vib) {
      const vib = this._osc('sine', o.vib[0]);
      const vg = this._gain(o.vib[1]);
      vib.connect(vg).connect(src.detune);
      vib.start(t);
      vib.stop(t + dur + 0.05);
    }
    if (o.jitter) {
      for (let tt = t; tt < t + dur; tt += 0.028) src.detune.setValueAtTime((Math.random() * 2 - 1) * o.jitter, tt);
    }
    const tract = this._gain(1);
    src.connect(tract);
    if (o.rasp) {
      const n = this._noise(this.white);
      const ng = this._gain(o.rasp);
      n.connect(ng).connect(tract);
      n.start(t, Math.random() * 1.5);
      n.stop(t + dur + 0.05);
    }
    const out = this._gain(1);
    const vow = typeof o.vowel === 'string' ? [[0, o.vowel]] : o.vowel;
    const q = o.q || 7;
    const amps = [1, 0.7, 0.4];
    for (let k = 0; k < 3; k++) {
      const bp = this._filter('bandpass', VOWELS[vow[0][1]][k], k === 0 ? q * 0.7 : q);
      bp.frequency.setValueAtTime(VOWELS[vow[0][1]][k], t);
      for (let i = 1; i < vow.length; i++) bp.frequency.linearRampToValueAtTime(VOWELS[vow[i][1]][k], t + vow[i][0]);
      const g = this._gain(amps[k] * (o.fg || 3));
      tract.connect(bp).connect(g).connect(out);
    }
    src.start(t);
    src.stop(t + dur + 0.05);
    return out;
  }

  heartbeat(gain, at = 0, dest = null) {
    if (!this.ready) return;
    const t = at || this.now;
    const d = dest || this.body;
    this._tone(t, { f: 62, fEnd: 38, a: 0.006, d: 0.14, gain, dest: d });
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 150, q: 0.7, a: 0.004, d: 0.12, gain: gain * 0.6, dest: d });
    this._tone(t + 0.21, { f: 55, fEnd: 36, a: 0.006, d: 0.16, gain: gain * 0.7, dest: d });
    this._noiseBurst(t + 0.21, { buf: this.brown, type: 'lowpass', f: 125, q: 0.7, a: 0.004, d: 0.12, gain: gain * 0.4, dest: d });
  }

  breathHeavy() {
    if (!this.ready) return;
    const t = this.now;
    this._noiseBurst(t, { f: 950, q: 1.1, a: 0.12, d: 0.25, hold: 0.1, gain: 0.12 });
    this._noiseBurst(t + 0.5, { f: 700, q: 1.1, a: 0.08, d: 0.3, hold: 0.05, gain: 0.09 });
  }

  // ---------- monster sounds ----------
  // a low, wet throat that keeps catching (vocal fry) — it heard something
  growl(x, y, z, gain = 0.8) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 4, 0.9);
    pn.connect(this.sfx);
    const rs = this._gain(0.25); pn.connect(rs); rs.connect(this.revSend);
    const out = this._gain(0);
    const sh = this._shaper(this.distSoft);
    const post = this._gain(0.7);
    out.connect(sh).connect(post).connect(pn);
    const f0 = 62 + Math.random() * 18;
    const v = this._voice(t, {
      f0: [[0, f0], [0.5, f0 * 1.14], [1.35, f0 * 0.76]],
      vowel: [[0, 'u'], [0.5, 'o'], [1.25, 'y']],
      dur: 1.45, vib: [5, 25], jitter: 60, rasp: 0.55, q: 4, fg: 2.8,
    });
    const fry = this._gain(0.6);
    const fo = this._osc('square', 23 + Math.random() * 10);
    const fg = this._gain(0.4);
    fo.connect(fg).connect(fry.gain);
    v.connect(fry).connect(out);
    fo.start(t); fo.stop(t + 1.5);
    // a sub-octave under it: something big
    const sub = this._osc('triangle', f0 / 2);
    sub.frequency.exponentialRampToValueAtTime(f0 * 0.38, t + 1.35);
    const sg = this._gain(0.35);
    sub.connect(sg).connect(out);
    sub.start(t); sub.stop(t + 1.5);
    this._env(out, t, 0.18, gain, 0.75, 0.42);
  }

  // the hunt: a shriek with a huge chest behind it, metal in its throat, echoing through the trees
  screech(x, y, z, gain = 1) {
    if (!this.ready) return;
    const t = this.now;
    const ctx = this.ctx;
    const pn = this._panner(x, y, z, 6, 0.6);
    pn.connect(this.sfx);
    // forest slap-back: the trees answer twice, darker each time
    const dl = ctx.createDelay(1.5);
    dl.delayTime.value = 0.43 + Math.random() * 0.1;
    const elp = this._filter('lowpass', 1600, 0.7);
    const fb = this._gain(0.36);
    dl.connect(elp).connect(fb).connect(dl);
    const eg = this._gain(0.4);
    elp.connect(eg);
    eg.connect(this.sfx);
    eg.connect(this.revSend);
    if (!this.offline) setTimeout(() => { try { dl.disconnect(); fb.disconnect(); } catch { /* */ } }, 6000);

    const mix = this._gain(0);
    const sh = this._shaper(this.distScream);
    const hp = this._filter('highpass', 90, 0.7);
    const post = this._gain(0.5); // drive the throat hard, then sit it below the death scream
    mix.connect(sh).connect(hp).connect(post);
    post.connect(pn);
    post.connect(dl);
    const rs = this._gain(0.55); post.connect(rs); rs.connect(this.revSend);
    [720, 860].forEach((b, i) => {
      const f0 = b * (0.95 + Math.random() * 0.1);
      const v = this._voice(t, {
        f0: [[0, f0 * 0.7], [0.12, f0 * 1.22], [0.45, f0 * 1.08], [1.5, f0 * 0.5]],
        vowel: [[0, 'A'], [0.35, 'i'], [1.25, 'e']],
        dur: 1.6, vib: [6.5 + i * 1.3, 70], jitter: 50, rasp: 0.45, q: 6, fg: 3.5,
      });
      const g = this._gain(0.5);
      v.connect(g).connect(mix);
    });
    const body = this._voice(t, {
      f0: [[0, 90], [0.2, 112], [1.4, 62]], vowel: [[0, 'o'], [1.2, 'u']],
      dur: 1.5, vib: [4, 30], jitter: 35, rasp: 0.3, q: 4, fg: 3,
    });
    const bg = this._gain(0.6);
    body.connect(bg).connect(mix);
    const metal = this._osc('sawtooth', 1900);
    metal.frequency.exponentialRampToValueAtTime(1150, t + 1.3);
    const rm = this._ring(metal, 1350, t, 1.4);
    const mbp = this._filter('bandpass', 2800, 1.2);
    const mg = this._gain(0.14);
    rm.connect(mbp).connect(mg).connect(mix);
    metal.start(t); metal.stop(t + 1.45);
    this._env(mix, t, 0.025, 0.6 * gain, 1.15, 0.3);
    this._noiseBurst(t, { type: 'highpass', f: 2000, a: 0.0008, d: 0.03, gain: 0.5 * gain, dest: pn });
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

  // short wet sniffs, then a long exhale — it's smelling for you
  sniff(x, y, z, gain = 0.6) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 1.5, 1.3);
    pn.connect(this.sfx);
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const tt = t + i * (0.13 + Math.random() * 0.05);
      this._noiseBurst(tt, { f: 2100 + Math.random() * 900, q: 2.2, a: 0.03, d: 0.07, gain: gain * 2.4, dest: pn });
    }
    this.exhale(x, y, z, gain * 1.6, t + count * 0.16 + 0.15, pn);
  }

  exhale(x, y, z, gain = 0.4, at = 0, pnIn = null) {
    if (!this.ready) return;
    const t = at || this.now;
    let pn = pnIn;
    if (!pn) {
      pn = this._panner(x, y, z, 1.5, 1.3);
      pn.connect(this.sfx);
    }
    this._noiseBurst(t, { buf: this.pink, f: 620, fEnd: 360, q: 1.3, a: 0.09, d: 0.7, hold: 0.18, gain, dest: pn });
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
  // the apparition: a hard, out-of-tune string stab, an ugly low brass blat, sub drop, air blast
  sting(gain = 1) {
    if (!this.ready) return;
    const t = this.now;
    const big = gain >= 0.9;
    this._tone(t, { f: 74, fEnd: 26, a: 0.004, d: 1.0, gain: 0.8 * gain });
    this._noiseBurst(t, { f: 2000, fEnd: 450, q: 0.6, a: 0.002, d: 0.55, gain: 0.45 * gain, rev: 0.6 });
    const str = this._gain(0);
    const lp = this._filter('lowpass', 7000, 0.7);
    str.connect(lp);
    this._out(lp, this.sfx, 0.8);
    [1046.5, 1108.7, 1480, 1568, 554.4].forEach((f, i) => {
      const o = this._osc('sawtooth', f * (1 + (Math.random() - 0.5) * 0.006));
      const vib = this._osc('sine', 5.5 + Math.random() * 2);
      const vg = this._gain(14 + i * 3);
      vib.connect(vg).connect(o.detune);
      o.frequency.exponentialRampToValueAtTime(f * 0.982, t + 1.1);
      const og = this._gain(0.075);
      o.connect(og).connect(str);
      o.start(t); vib.start(t); o.stop(t + 1.3); vib.stop(t + 1.3);
    });
    this._env(str, t, 0.004, gain, 1.0, 0.12);
    this._noiseBurst(t, { f: 3300, q: 2.5, a: 0.003, d: 0.3, gain: 0.22 * gain, rev: 0.4 });
    const br = this._gain(0);
    const blp = this._filter('lowpass', 200, 4);
    blp.frequency.setValueAtTime(200, t);
    blp.frequency.exponentialRampToValueAtTime(2200, t + 0.06);
    blp.frequency.exponentialRampToValueAtTime(260, t + 1.0);
    [61.7, 65.4, 92.5].forEach((f) => {
      const o = this._osc('sawtooth', f);
      o.connect(blp);
      o.start(t); o.stop(t + 1.2);
    });
    blp.connect(br);
    this._out(br, this.sfx, 0.5);
    this._env(br, t, 0.01, 0.24 * gain, 0.9, 0.1);
    if (big) this.stun(0.45, 1.7);
  }

  // one whispering mouth: noise through moving formants (vowels), a sibilant band (s/sh/t)
  // and an aspiration band (h/breath). plan: [[type, dur, arg, amp], ...]
  _whisperVoice(t, x, y, z, gain, plan) {
    const pn = this._panner(x, y, z, 0.55, 1.6);
    pn.connect(this.sfx);
    const rs = this._gain(0.12); pn.connect(rs); rs.connect(this.revSend);
    const n = this._noise(this.white);
    const fo = [0, 1, 2].map((k) => this._filter('bandpass', 1000, k ? 9 : 6));
    const vg = this._gain(0);
    fo.forEach((f, k) => {
      const g = this._gain([1, 0.8, 0.45][k] * 7);
      n.connect(f).connect(g).connect(vg);
    });
    const sib = this._filter('bandpass', 4000, 1.3);
    const sg = this._gain(0);
    n.connect(sib).connect(sg);
    const asp = this._filter('bandpass', 1300, 0.7);
    const ag = this._gain(0);
    n.connect(asp).connect(ag);
    const mix = this._gain(gain);
    const air = this._filter('highpass', 260, 0.7); // a whisper has no chest
    vg.connect(mix); sg.connect(mix); ag.connect(mix);
    mix.connect(air).connect(pn);
    let tt = t;
    for (const [type, d, arg, amp = 1] of plan) {
      if (type === 'v') {
        const F = VOWELS[arg];
        fo.forEach((f, k) => f.frequency.setTargetAtTime(F[k], tt, 0.012));
        vg.gain.setTargetAtTime(0.9 * amp, tt, 0.02);
        vg.gain.setTargetAtTime(0, tt + d * 0.75, 0.03);
      } else if (type === 's') {
        sib.frequency.setValueAtTime(arg, tt);
        sg.gain.setTargetAtTime(0.75 * amp, tt, 0.03);
        sg.gain.setTargetAtTime(0, tt + d * 0.8, 0.03);
      } else if (type === 't') {
        sib.frequency.setValueAtTime(arg || 4800, tt);
        sg.gain.setValueAtTime(1.1 * amp, tt);
        sg.gain.setTargetAtTime(0, tt + 0.004, 0.007);
      } else if (type === 'h') {
        ag.gain.setTargetAtTime(0.55 * amp, tt, d * 0.3);
        ag.gain.setTargetAtTime(0, tt + d * 0.6, d * 0.15);
      }
      tt += d;
    }
    n.start(t, Math.random());
    n.stop(tt + 0.4);
    return tt;
  }

  // a whisper right behind your head: a breath, unintelligible murmur, then the word — «тише»
  whisper(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const ru = getLang() !== 'en';
    const plan = [['h', 0.3, null, 0.7]];
    const syl = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < syl; i++) {
      const c = Math.random();
      if (c < 0.4) plan.push(['t', 0.03, 4200 + Math.random() * 1500, 0.6]);
      else if (c < 0.7) plan.push(['s', 0.09, Math.random() < 0.5 ? 5500 : 3000, 0.55]);
      else plan.push(['h', 0.07, null, 0.6]);
      plan.push(['v', 0.1 + Math.random() * 0.07, VOWEL_KEYS[Math.floor(Math.random() * VOWEL_KEYS.length)], 0.55 + Math.random() * 0.2]);
    }
    plan.push(['_', 0.28]);
    if (ru) plan.push(['s', 0.4, 2900, 0.8], ['_', 0.12], ['t', 0.035, 4800], ['v', 0.16, 'i'], ['s', 0.3, 2800, 0.95], ['v', 0.32, 'e', 0.85], ['h', 0.4, null, 0.45]);
    else plan.push(['s', 0.4, 2900, 0.8], ['_', 0.12], ['h', 0.1, null, 0.9], ['v', 0.2, 'a', 0.9], ['s', 0.45, 2800, 0.95], ['h', 0.35, null, 0.4]);
    this._whisperVoice(t, x, y, z, 0.3, plan);
    // a second mouth at the other ear, a breath behind the first
    const L = this.listener;
    const rx = -L.fz, rz = L.fx;
    const side = (x - L.x) * rx + (z - L.z) * rz >= 0 ? 1 : -1;
    const x2 = L.x - L.fx * 0.45 - rx * side * 0.35, z2 = L.z - L.fz * 0.45 - rz * side * 0.35;
    this._whisperVoice(t + 0.06, x2, y, z2, 0.13, plan);
  }

  // a dry branch breaking behind you: a crackle of fibres, a woody knock, a little thump.
  // close=true: then something takes one slow step, and breathes out.
  branchSnap(x, y, z, gain = 1, close = false) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 4, 0.8);
    pn.connect(this.sfx);
    const s = this._gain(0.6); pn.connect(s); s.connect(this.revSend);
    const cracks = 5 + Math.floor(Math.random() * 4);
    let tt = t;
    for (let i = 0; i < cracks; i++) {
      const g = gain * (i === 0 ? 4 : 1.2 + Math.random() * 1.4);
      this._noiseBurst(tt, { type: 'highpass', f: 1200 + Math.random() * 2400, q: 0.8, a: 0.0004, d: 0.01 + Math.random() * 0.018, gain: g, dest: pn });
      tt += 0.005 + Math.random() * (i === 0 ? 0.02 : 0.014);
    }
    this._noiseBurst(t, { f: 900 + Math.random() * 600, q: 6, a: 0.0008, d: 0.09, gain: gain * 2.2, dest: pn });
    this._tone(t, { f: 170, fEnd: 70, a: 0.002, d: 0.1, gain: gain * 0.5, dest: pn });
    if (close) {
      // ...one slow, heavy step where it broke...
      const ts = t + 0.85;
      this._tone(ts, { f: 75, fEnd: 40, a: 0.003, d: 0.15, gain: 0.22 * gain, dest: pn });
      this._noiseBurst(ts, { buf: this.brown, type: 'lowpass', f: 600, a: 0.002, d: 0.09, gain: 0.3 * gain, dest: pn });
      this._noiseBurst(ts + 0.006, { type: 'highpass', f: 2800, a: 0.001, d: 0.05, gain: 0.2 * gain, dest: pn });
      // ...and a long breath out
      this.exhale(x, y + 0.5, z, 0.32 * gain, t + 1.5);
    }
  }

  // something sprints past in the dark: footfalls, panting and a snarl sweeping across your head
  runnerPass(x0, y0, z0, x1, y1, z1, dur = 1.1) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x0, y0, z0, 3, 1.0);
    if (pn.positionX) {
      pn.positionX.setValueAtTime(x0, t); pn.positionX.linearRampToValueAtTime(x1, t + dur);
      pn.positionY.setValueAtTime(y0, t); pn.positionY.linearRampToValueAtTime(y1, t + dur);
      pn.positionZ.setValueAtTime(z0, t); pn.positionZ.linearRampToValueAtTime(z1, t + dur);
    } else pn.setPosition((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    pn.connect(this.sfx);
    const rs = this._gain(0.25); pn.connect(rs); rs.connect(this.revSend);
    const steps = Math.round(dur * 7);
    for (let i = 0; i < steps; i++) {
      const tt = t + i / 7 + Math.random() * 0.02;
      this._noiseBurst(tt, { buf: this.brown, type: 'lowpass', f: 700, q: 0.7, a: 0.002, d: 0.08, gain: 1.6, dest: pn });
      this._noiseBurst(tt + 0.005, { type: 'highpass', f: 2600 + Math.random() * 1500, q: 0.7, a: 0.001, d: 0.05, gain: 0.55, dest: pn });
    }
    const n = this._noise(this.pink);
    const bp = this._filter('bandpass', 760, 1.4);
    const g = this._gain(0);
    n.connect(bp).connect(g).connect(pn);
    for (let tt = t; tt < t + dur; tt += 0.19) {
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.linearRampToValueAtTime(0.65, tt + 0.06);
      g.gain.linearRampToValueAtTime(0.0001, tt + 0.17);
    }
    n.start(t, Math.random()); n.stop(t + dur + 0.1);
    const mid = t + dur * 0.45;
    const v = this._voice(mid, { f0: [[0, 135], [0.28, 100]], vowel: 'a', dur: 0.32, vib: [11, 50], jitter: 80, rasp: 0.6, q: 4, fg: 3 });
    const sg = this._gain(0);
    const sh = this._shaper(this.distSoft);
    v.connect(sh).connect(sg).connect(pn);
    this._env(sg, mid, 0.02, 0.85, 0.26, 0.05);
  }

  // death. The hit, three throats screaming out of tune and tearing in time with the strobe,
  // metal, an air blast — then your ears give out, ring, and your heart slows down.
  jumpscare(intensity = 1) {
    if (!this.ready) return;
    const t = this.now;
    const full = intensity > 0.7;
    const I = full ? intensity : intensity * 0.6;
    let bus = this.deathBus;
    if (!full) {
      bus = this._gain(0.4);
      bus.connect(this.deathBus);
    }
    this._tone(t, { f: 120, fEnd: 24, a: 0.002, d: 1.2, gain: 1.0 * I, dest: bus });
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 320, q: 0.8, a: 0.001, d: 0.3, gain: 1.4 * I, dest: bus });
    this._noiseBurst(t, { type: 'highpass', f: 2500, q: 0.7, a: 0.0005, d: 0.04, gain: 0.9 * I, dest: bus });

    const scream = this._gain(1);
    const stut = this._gain(1);
    const sh = this._shaper(full ? this.distScream : this.distSoft);
    const hp = this._filter('highpass', 170, 0.7);
    const sg = this._gain(0);
    scream.connect(stut).connect(sh).connect(hp).connect(sg).connect(bus);
    const rs = this._gain(0.5); sg.connect(rs); rs.connect(this.revSend);
    if (full) {
      const sq = this._osc('square', 14);
      const sqg = this._gain(0.55);
      sq.connect(sqg).connect(stut.gain);
      sq.start(t); sq.stop(t + 0.6);
    }
    [560, 650, 800].forEach((b, i) => {
      const f0 = b * (0.97 + Math.random() * 0.06);
      const v = this._voice(t, {
        f0: [[0, f0 * 0.82], [0.07, f0 * 1.18], [0.5, f0 * 1.06], [1.45, f0 * 0.58]],
        vowel: [[0, 'A'], [0.6, 'A'], [1.4, 'o']],
        dur: 1.5, vib: [9 + i * 1.7, 55], jitter: 45, rasp: 0.5, q: 5, fg: 4,
      });
      const g = this._gain(0.34);
      v.connect(g).connect(scream);
    });
    this._env(sg, t, 0.004, 0.95 * I, 1.05, 0.42);
    if (full) {
      const a = this._osc('sawtooth', 2350);
      a.frequency.exponentialRampToValueAtTime(1500, t + 0.6);
      const rm = this._ring(a, 1730, t, 0.6);
      const bp = this._filter('bandpass', 3200, 1.1);
      const mg = this._gain(0);
      rm.connect(bp).connect(mg).connect(bus);
      this._env(mg, t, 0.003, 0.42 * I, 0.5, 0.05);
      a.start(t); a.stop(t + 0.65);
    }
    this._noiseBurst(t, { f: 5200, fEnd: 700, q: 0.7, a: 0.002, d: 0.5, gain: 0.55 * I, dest: bus });
    this.duck(0.0001, 0.05, 3, 3);
    if (full) {
      this.stun(1, 3.8);
      this.tinnitus(t + 0.35, 3.6, 0.022);
      this.heartbeat(0.55, t + 2.3, bus);
      this.heartbeat(0.32, t + 3.9, bus);
    } else this.stun(0.4, 1.8);
  }

  // ---------- ambience ----------
  startAmbience() {
    if (!this.ready || this.ambOn) return;
    this.ambOn = true;
    const t = this.now;
    // wind
    const wn = this._noise(this.brown);
    const wf = this._filter('bandpass', 380, 0.6);
    const wg = this._gain(0.3);
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
    // tension, rising with danger: a dissonant string cluster whose voices swell independently,
    // a sub pressure that beats at 2 Hz, and a faint glassy shimmer
    const tg = this._gain(0);
    const tlp = this._filter('lowpass', 500, 0.8);
    tlp.connect(tg).connect(this.amb);
    [82.41, 87.31, 116.54, 123.47, 174.61].forEach((f) => {
      const o = this._osc('sawtooth', f);
      o.detune.value = (Math.random() - 0.5) * 18;
      const sw = this._osc('sine', 0.05 + Math.random() * 0.12);
      const swg = this._gain(0.5);
      const og = this._gain(0.5);
      sw.connect(swg).connect(og.gain);
      o.connect(og).connect(tlp);
      o.start(t); sw.start(t);
    });
    const sub = this._gain(0);
    [31, 33.1].forEach((f) => { const o = this._osc('sine', f); o.connect(sub); o.start(t); });
    sub.connect(this.amb);
    const glass = this._gain(0);
    [2093, 2117.5].forEach((f) => { const o = this._osc('sine', f); o.connect(glass); o.start(t); });
    glass.connect(this.amb);
    this.ambNodes = { wg, dg, tg, tlp, sub, glass };
    this.nextAmbEvent = t + 4;
  }

  setAmbience(level, dread = 0) {
    if (!this.ctx) return;
    const t = this.now;
    this.amb.gain.setTargetAtTime(level, t, 0.8);
    const n = this.ambNodes;
    if (!n) return;
    n.dg.gain.setTargetAtTime(0.06 + dread * 0.12, t, 1.5);
    n.tg.gain.setTargetAtTime(sstep(0.2, 0.9, dread) * 0.06, t, 0.9);
    n.tlp.frequency.setTargetAtTime(420 + dread * 1500, t, 1.0);
    n.sub.gain.setTargetAtTime(dread * dread * 0.16, t, 0.8);
    n.glass.gain.setTargetAtTime(sstep(0.3, 0.6, dread) * (1 - sstep(0.8, 1, dread)) * 0.005, t, 1.2);
  }

  // progress 0..1 through the night: the later it gets, the less of the forest is "nature"
  ambientEvent(progress = 0, force = null) {
    if (!this.ready) return;
    const L = this.listener;
    let kind = force;
    if (!kind) {
      if (Math.random() < 0.22 + progress * 0.5) kind = ['knocks', 'scream', 'steps', 'groan'][Math.floor(Math.random() * 4)];
      else {
        const r = Math.random();
        kind = r < 0.25 ? 'owl' : r < 0.45 ? 'howl' : r < 0.7 ? 'creak' : r < 0.87 ? 'snap' : 'leaves';
      }
    }
    const wrong = kind === 'knocks' || kind === 'scream' || kind === 'steps' || kind === 'groan';
    const a = Math.random() * Math.PI * 2, d = wrong ? 22 + Math.random() * 20 : 30 + Math.random() * 40;
    const x = L.x + Math.cos(a) * d, z = L.z + Math.sin(a) * d, y = L.y + 4;
    const t = this.now;
    const pn = this._panner(x, y, z, 6, 0.7);
    pn.connect(this.amb);
    const s = this._gain(0.8); pn.connect(s); s.connect(this.revSend);
    if (kind === 'owl') {
      for (let i = 0; i < 2; i++) {
        const o = this._osc('sine', 390); const g = this._gain();
        const tt = t + i * 0.45;
        o.frequency.setValueAtTime(360, tt); o.frequency.linearRampToValueAtTime(410, tt + 0.08); o.frequency.linearRampToValueAtTime(330, tt + 0.35);
        o.connect(g).connect(pn);
        this._env(g, tt, 0.04, 0.25, 0.3);
        o.start(tt); o.stop(tt + 0.5);
      }
    } else if (kind === 'howl') {
      const o = this._osc('sine', 380); const g = this._gain();
      const v = this._osc('sine', 5); const vg = this._gain(12); v.connect(vg).connect(o.frequency);
      o.frequency.setValueAtTime(300, t); o.frequency.linearRampToValueAtTime(560, t + 0.9); o.frequency.linearRampToValueAtTime(380, t + 2.8);
      o.connect(g).connect(pn);
      this._env(g, t, 0.5, 0.18, 1.6, 0.8);
      o.start(t); v.start(t); o.stop(t + 3.2); v.stop(t + 3.2);
    } else if (kind === 'creak') {
      const o = this._osc('sawtooth', 110); const bp = this._filter('bandpass', 700, 9); const g = this._gain();
      o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(150, t + 1.4);
      const tr = this._osc('square', 24); const tg = this._gain(30); tr.connect(tg).connect(o.frequency);
      o.connect(bp).connect(g).connect(pn);
      this._env(g, t, 0.3, 0.14, 0.6, 0.8);
      o.start(t); tr.start(t); o.stop(t + 1.9); tr.stop(t + 1.9);
    } else if (kind === 'snap') {
      this.branchSnap(x, y, z, 0.35);
    } else if (kind === 'leaves') {
      const n = this._noise(this.pink); const bp = this._filter('bandpass', 3200, 0.8); const g = this._gain();
      n.connect(bp).connect(g).connect(pn);
      this._env(g, t, 0.6, 0.2, 1.2, 0.4);
      n.start(t, Math.random()); n.stop(t + 2.4);
    } else if (kind === 'knocks') {
      // somebody knocking on a tree. two, three times. nobody lives out here.
      const k = 2 + Math.floor(Math.random() * 2);
      const f = 210 + Math.random() * 70; // the same trunk every time: a struck, hollow resonance
      for (let i = 0; i < k; i++) {
        const tt = t + i * (0.34 + Math.random() * 0.08);
        this._tone(tt, { f, fEnd: f * 0.9, a: 0.001, d: 0.17, gain: 0.9, dest: pn });
        this._tone(tt, { f: f * 2.7, fEnd: f * 2.5, a: 0.001, d: 0.06, gain: 0.3, dest: pn });
        this._noiseBurst(tt, { type: 'highpass', f: 1500, a: 0.0005, d: 0.014, gain: 0.55, dest: pn });
      }
    } else if (kind === 'scream') {
      // far away, somebody (something) screams once
      const v = this._voice(t, { f0: [[0, 880], [0.3, 1080], [1.7, 500]], vowel: [[0, 'A'], [1.5, 'o']], dur: 1.8, vib: [6, 45], jitter: 30, rasp: 0.3, q: 6, fg: 3 });
      const lp = this._filter('lowpass', 2200, 0.7);
      const g = this._gain(0);
      v.connect(lp).connect(g).connect(pn);
      const r2 = this._gain(1.2); g.connect(r2); r2.connect(this.revSend);
      this._env(g, t, 0.08, 0.55, 1.2, 0.5);
    } else if (kind === 'steps') {
      // slow footsteps, walking around you in the dark
      const dir = Math.random() < 0.5 ? -1 : 1;
      const x1 = L.x + Math.cos(a + dir * 0.5) * d, z1 = L.z + Math.sin(a + dir * 0.5) * d;
      if (pn.positionX) {
        pn.positionX.setValueAtTime(x, t); pn.positionX.linearRampToValueAtTime(x1, t + 3.2);
        pn.positionZ.setValueAtTime(z, t); pn.positionZ.linearRampToValueAtTime(z1, t + 3.2);
        pn.positionY.setValueAtTime(L.y, t);
      }
      for (let i = 0; i < 6; i++) {
        const tt = t + i * (0.55 + Math.random() * 0.08);
        this._noiseBurst(tt, { buf: this.brown, type: 'lowpass', f: 650, a: 0.002, d: 0.1, gain: 3.2, dest: pn });
        this._noiseBurst(tt + 0.008, { type: 'highpass', f: 2400, a: 0.001, d: 0.06, gain: 1.0, dest: pn });
      }
    } else if (kind === 'groan') {
      // something huge and metal settling, somewhere it shouldn't be
      const o = this._osc('sawtooth', 46);
      o.frequency.linearRampToValueAtTime(58, t + 2.4);
      const tr = this._osc('sine', 7); const tg = this._gain(4); tr.connect(tg).connect(o.frequency);
      const bp = this._filter('bandpass', 260, 6);
      bp.frequency.linearRampToValueAtTime(430, t + 2.4);
      const bp2 = this._filter('bandpass', 1450, 8);
      const rm = this._ring(o, 173, t, 2.9); // rust: inharmonic sidebands
      const g = this._gain(0);
      o.connect(bp).connect(g);
      rm.connect(bp2).connect(g);
      g.connect(pn);
      this._env(g, t, 0.6, 5, 1.2, 0.9);
      o.start(t); tr.start(t); o.stop(t + 2.9); tr.stop(t + 2.9);
    }
  }

  // called every frame while playing
  update(dangerBeat, progress = 0) {
    if (!this.ready) return;
    const t = this.now;
    if (this.ambOn && t > this.nextAmbEvent) {
      this.ambientEvent(progress);
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
