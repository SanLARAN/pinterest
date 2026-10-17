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

// co-op voices (see voiceAttach). Levels are dBFS of the levelled voice before the limiter; tuned so a friend
// at arm's length sits clearly above the night's ambience in the speech band (tests: /tmp/harness/voicelevel.mjs)
const VOICE = {
  target: -21, // where the auto-level puts a friend's speech (into the limiter)
  start: -30, // what we assume about a mic we haven't heard yet (between a laptop mic and a headset)
  minDb: -10, // auto-level range
  maxDb: 20,
  gate: -58, // below this nobody is talking
  hissCeil: -46, // never lift someone's room noise above this
  limThreshold: -10, // per-voice limiter: speech peaks touch it, screams get held
  limMakeup: 4.1, // Chrome's DynamicsCompressor adds makeup gain on its own (measured for these settings)
  post: 4.5, // after the limiter: up to the level we want (≈ -16 LUFS at the output in the lobby)
  ref: 3, // proximity: full level within 3 m, then a gentle inverse falloff
  roll: 0.9,
};
const dbGain = (db) => Math.pow(10, db / 20);

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ambOn = false;
    this.nextAmbEvent = 0;
    this.nextBeat = 0;
    this.listener = { x: 0, y: 0, z: 0, fx: 0, fz: -1 };
    this._outBuf = null;
    this.offline = false; // true when rendering into an OfflineAudioContext (sound tests)
    this.voices = new Map(); // co-op: friends' microphones
    this.voiceGains = new Map(); // co-op: your volume for each friend (linear gain), kept across reconnects
    this.voiceMemo = new Map(); // co-op: what the auto-level learned about each friend's mic (a new stream picks it up)
    this._agcTimer = 0;
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

    // co-op voices: muffled by a hit like everything else, but never paused (the world doesn't stop online),
    // and fed to the mic's self-gate so a friend in your speakers doesn't count as you making noise
    this.voiceBus = ctx.createGain();
    this.voiceBus.gain.value = 1;
    this.voiceBus.connect(this.stunLP);
    this.voiceBus.connect(this.gateAnalyser);

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
  click(loud = 0.3, dest = null) {
    if (!this.ready) return;
    const t = this.now;
    const o = dest || this.sfx;
    this._noiseBurst(t, { f: 3400, q: 2.5, a: 0.0008, d: 0.03, gain: 0.7 + loud, dest: o });
    this._tone(t, { f: 2100, fEnd: 900, a: 0.001, d: 0.05, gain: 0.35, dest: o });
    this._tone(t + 0.01, { f: 1250, fEnd: 990, a: 0.004, d: 0.7, gain: 0.07, rev: 0.6, dest: o });
  }

  clap(loud = 0.6, dest = null) {
    if (!this.ready) return;
    const t = this.now;
    const o = dest || this.sfx;
    for (let i = 0; i < 3; i++) this._noiseBurst(t + i * 0.009, { f: 1150 + i * 200, q: 0.9, a: 0.001, d: 0.012, gain: 0.6 * loud, dest: o });
    this._noiseBurst(t + 0.027, { f: 1200, q: 0.7, a: 0.001, d: 0.14, gain: 0.9 * loud, rev: 0.9, dest: o });
  }

  shout(loud = 0.9, dest = null) {
    if (!this.ready) return;
    const out = dest || this.sfx;
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
    this._out(g, out, 0.8);
    this._env(g, t, 0.03, 0.55 * loud, 0.25, dur - 0.1);
    src.start(t); vib.start(t);
    src.stop(t + dur + 0.4); vib.stop(t + dur + 0.4);
    this._noiseBurst(t, { f: 1800, q: 0.8, a: 0.02, d: 0.25, hold: dur - 0.15, gain: 0.08 * loud, dest: out });
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

  footstep(intensity = 0.5, dest = null) {
    if (!this.ready) return;
    const t = this.now;
    const o = dest || this.sfx;
    const f = 650 + Math.random() * 700;
    this._noiseBurst(t, { f, q: 0.9, a: 0.002, d: 0.06 + intensity * 0.06, gain: 0.12 + intensity * 0.3, dest: o });
    this._noiseBurst(t + 0.02, { f: f * 2.4, q: 2, a: 0.004, d: 0.05, gain: 0.04 + intensity * 0.08, dest: o });
    if (intensity > 0.6) this._tone(t, { f: 95, fEnd: 55, a: 0.002, d: 0.08, gain: 0.25 * intensity, dest: o });
  }

  // ---------- co-op: your friends in the forest ----------
  // a teammate's footstep, from where they walk
  mateStep(x, y, z, intensity = 0.4) {
    if (!this.ready) return;
    const pn = this._panner(x, y, z, 2.5, 1.3);
    pn.connect(this.sfx);
    this.footstep(intensity * 0.8, pn);
  }

  // a teammate's click / clap / shout (their mic voice comes through the voice chat instead)
  matePing(x, y, z, loud, scream = 0.78) {
    if (!this.ready) return;
    const pn = this._panner(x, y, z, 4, 1.0);
    pn.connect(this.sfx);
    if (loud < 0.36) this.click(loud, pn);
    else if (loud < scream) this.clap(loud, pn);
    else this.shout(loud, pn);
  }

  // somewhere out there, a friend just died
  mateDeath(x, y, z, near = false) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 6, 0.8);
    pn.connect(this.sfx);
    // a cut-off human scream: formant buzz that chokes into silence
    const o = this._osc('sawtooth', 310);
    o.frequency.linearRampToValueAtTime(420, t + 0.12);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.75);
    const f1 = this._filter('bandpass', 950, 5), f2 = this._filter('bandpass', 1500, 6);
    const g = this._gain();
    o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g);
    this._out(g, pn, 0.9);
    this._env(g, t, 0.02, near ? 0.5 : 0.38, 0.12, 0.55);
    o.start(t); o.stop(t + 0.95);
    this._noiseBurst(t + 0.58, { type: 'lowpass', f: 420, q: 0.8, a: 0.004, d: 0.4, gain: 0.55, dest: pn, rev: 0.6 });
    this._tone(t + 0.6, { f: 60, fEnd: 34, a: 0.004, d: 0.5, gain: 0.4, dest: pn });
  }

  // ---------- co-op voices: a friend's microphone, placed where they stand ----------
  // Friends' mics arrive raw — no browser auto-gain, because the mic is also everyone's echolocator — so a
  // laptop mic can be 20 dB quieter than a headset. Each voice is levelled to the same loudness (well above
  // the night's ambience), a limiter keeps a scream from flattening the whole mix, then your volume for that
  // friend, then proximity.
  //   src → hp → lp ─┬→ agc → lim → trim → user → g ─┬→ dry ───────→ voiceBus   (lobby)
  //                  └→ level (meter + agc input)    ├→ wet → pn ──→ voiceBus   (forest)
  //                                                  └→ rv ────────→ reverb
  voiceAttach(id, stream) {
    this.init();
    if (!this.ctx) return;
    this.voiceDetach(id);
    const ctx = this.ctx;
    // Chrome only feeds a remote WebRTC stream into Web Audio while some media element is playing it
    const el = new Audio();
    el.muted = true;
    el.srcObject = stream;
    const pl = el.play();
    if (pl && pl.catch) pl.catch(() => {});
    let src;
    try {
      src = ctx.createMediaStreamSource(stream);
    } catch (e) {
      console.warn('[voice] no audio track yet', e);
      return;
    }
    const hp = this._filter('highpass', 100, 0.7);
    const lp = this._filter('lowpass', 7500, 0.7);
    const level = ctx.createAnalyser();
    level.fftSize = 2048;
    const memo = this.voiceMemo.get(id);
    const speech = memo ? memo.speech : VOICE.start;
    const agcDb = memo ? memo.agcDb : VOICE.target - VOICE.start;
    const agc = this._gain(dbGain(agcDb));
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = VOICE.limThreshold;
    lim.knee.value = 6;
    lim.ratio.value = 8;
    lim.attack.value = 0.003;
    lim.release.value = 0.25;
    const trim = this._gain(dbGain(VOICE.post - VOICE.limMakeup)); // (minus the makeup the compressor adds on its own)
    const user = this._gain(this.voiceGains.has(id) ? this.voiceGains.get(id) : 1);
    const g = this._gain(1); // mute / proximity fade
    const dry = this._gain(1); // lobby: straight into your ears
    const wet = this._gain(0); // in the forest: from where they are
    const rv = this._gain(0); // ...with a little of the forest around it
    const pn = this._panner(0, 0, 0, VOICE.ref, VOICE.roll);
    pn.maxDistance = 90;
    src.connect(hp).connect(lp).connect(agc).connect(lim).connect(trim).connect(user).connect(g);
    lp.connect(level);
    g.connect(dry);
    g.connect(wet);
    g.connect(rv);
    dry.connect(this.voiceBus);
    wet.connect(pn).connect(this.voiceBus);
    rv.connect(this.revSend);
    this.voices.set(id, {
      el, src, hp, lp, agc, lim, trim, user, g, dry, wet, rv, pn, level, buf: new Float32Array(level.fftSize), spatial: false,
      speech, floor: memo ? memo.floor : -62, agcDb, db: -100,
      hist: new Float32Array(50), hn: 0, hi: 0, sorted: new Float32Array(50),
    });
    if (!this._agcTimer) this._agcTimer = setInterval(() => this._voiceAgc(), 100);
  }

  // auto-level: follow how loud this friend talks (fast up, slow down, only while they're clearly talking)
  // and steer the gain toward the target — but never lift their background hiss above VOICE.hissCeil
  _voiceAgc() {
    if (!this.voices.size || !this.ctx) {
      clearInterval(this._agcTimer);
      this._agcTimer = 0;
      return;
    }
    const t = this.now;
    for (const v of this.voices.values()) {
      v.level.getFloatTimeDomainData(v.buf);
      let s = 0;
      for (let i = 0; i < v.buf.length; i++) s += v.buf[i] * v.buf[i];
      const db = 10 * Math.log10(s / v.buf.length + 1e-12);
      v.db = db;
      // the room behind them: a low percentile of the last 5 s (digital silence — muted, not started — doesn't count)
      if (db > -90) {
        v.hist[v.hi] = db;
        v.hi = (v.hi + 1) % v.hist.length;
        v.hn = Math.min(v.hist.length, v.hn + 1);
        const srt = v.sorted.subarray(0, v.hn);
        srt.set(v.hist.subarray(0, v.hn));
        srt.sort();
        v.floor = srt[Math.floor(v.hn * 0.08)];
      }
      if (db > VOICE.gate && db > v.floor + 9) v.speech += (db - v.speech) * (db > v.speech ? 0.22 : 0.035);
      let want = VOICE.target - v.speech;
      want = Math.min(want, VOICE.hissCeil - v.floor);
      want = Math.max(VOICE.minDb, Math.min(VOICE.maxDb, want));
      if (Math.abs(want - v.agcDb) > 0.2) {
        v.agcDb = want;
        v.agc.gain.setTargetAtTime(dbGain(want), t, 0.25);
      }
    }
  }

  // your volume for one friend (linear gain; 0 = muted). Remembered even before their voice connects.
  voiceVolume(id, gain) {
    this.voiceGains.set(id, gain);
    const v = this.voices.get(id);
    if (v) v.user.gain.setTargetAtTime(gain, this.now, 0.04);
  }

  voiceSpatial(id, on) {
    const v = this.voices.get(id);
    if (!v || v.spatial === on) return;
    v.spatial = on;
    const t = this.now;
    v.dry.gain.setTargetAtTime(on ? 0 : 1, t, 0.08);
    v.wet.gain.setTargetAtTime(on ? 1 : 0, t, 0.08);
    v.rv.gain.setTargetAtTime(on ? 0.22 : 0, t, 0.08);
  }

  voiceSet(id, x, y, z, gain) {
    const v = this.voices.get(id);
    if (!v) return;
    const t = this.now;
    const p = v.pn;
    if (p.positionX) {
      p.positionX.setTargetAtTime(x, t, 0.03);
      p.positionY.setTargetAtTime(y, t, 0.03);
      p.positionZ.setTargetAtTime(z, t, 0.03);
    } else p.setPosition(x, y, z);
    if (Math.abs((v.lastGain ?? -1) - gain) > 0.01) {
      v.lastGain = gain;
      v.g.gain.setTargetAtTime(gain, t, 0.06);
    }
  }

  // how loud a friend is talking right now (0..1) — for the lobby's talk indicator
  voiceLevel(id) {
    const v = this.voices.get(id);
    if (!v) return 0;
    v.level.getFloatTimeDomainData(v.buf);
    let s = 0;
    for (let i = 0; i < v.buf.length; i++) s += v.buf[i] * v.buf[i];
    // as you hear them: after the auto-level and your volume for them
    const u = v.user.gain.value;
    if (u < 0.001) return 0;
    const db = 10 * Math.log10(s / v.buf.length + 1e-12) + v.agcDb + 20 * Math.log10(u);
    return Math.max(0, Math.min(1, (db + 50) / 34));
  }

  voiceDetach(id) {
    const v = this.voices.get(id);
    if (!v) return;
    this.voices.delete(id);
    this.voiceMemo.set(id, { speech: v.speech, agcDb: v.agcDb, floor: v.floor });
    try {
      v.src.disconnect();
      v.lp.disconnect();
      v.g.disconnect();
      v.pn.disconnect();
      v.rv.disconnect();
    } catch { /* */ }
    v.el.srcObject = null;
  }

  voiceDetachAll() {
    for (const id of [...this.voices.keys()]) this.voiceDetach(id);
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

  // ---------- glow sticks ----------
  // the inner vial snaps, then a shake: liquid rattling in plastic (own = in your hand: not positioned)
  glowCrack(x, y, z, own = false) {
    if (!this.ready) return;
    const t = this.now;
    let dest = this.sfx;
    if (!own) {
      dest = this._panner(x, y, z, 2.5, 1.2);
      dest.connect(this.sfx);
    }
    this._noiseBurst(t, { type: 'highpass', f: 3200, a: 0.0006, d: 0.03, gain: 0.7, dest });
    this._tone(t, { f: 2650, fEnd: 2100, a: 0.001, d: 0.05, gain: 0.08, dest });
    this._noiseBurst(t + 0.012, { type: 'bandpass', f: 5200, q: 3, a: 0.001, d: 0.035, gain: 0.25, dest });
    for (let i = 0; i < 4; i++) {
      const at = t + 0.24 + i * (0.13 + Math.random() * 0.03);
      this._noiseBurst(at, { type: 'bandpass', f: 1900 + Math.random() * 600, q: 1.6, a: 0.01, d: 0.07, gain: 0.12, dest });
      this._noiseBurst(at + 0.02, { type: 'highpass', f: 4500, a: 0.002, d: 0.03, gain: 0.05, dest });
    }
  }

  // a light plastic tick where it lands (k: how hard)
  glowLand(x, y, z, k = 1) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 3, 1.0);
    pn.connect(this.sfx);
    this._noiseBurst(t, { type: 'bandpass', f: 2400, q: 2.5, a: 0.0008, d: 0.04, gain: 1.1 * k, dest: pn });
    this._noiseBurst(t + 0.06 + Math.random() * 0.03, { type: 'bandpass', f: 1600, q: 2, a: 0.0008, d: 0.03, gain: 0.55 * k, dest: pn });
  }

  glowPick() {
    if (!this.ready) return;
    const t = this.now;
    this._noiseBurst(t, { type: 'bandpass', f: 1300, q: 0.9, a: 0.03, d: 0.12, gain: 0.14 });
    this._noiseBurst(t + 0.09, { type: 'bandpass', f: 2200, q: 2, a: 0.002, d: 0.04, gain: 0.12 });
  }

  // ---------- carrying a friend ----------
  // cloth and weight: a heave, a held breath let out (own = it's you lifting)
  bodyLift(x, y, z, own = false) {
    if (!this.ready) return;
    const t = this.now;
    let dest = this.sfx;
    if (!own) {
      dest = this._panner(x, y, z, 3, 1.1);
      dest.connect(this.sfx);
    }
    this._noiseBurst(t, { type: 'bandpass', f: 900, q: 0.8, a: 0.05, d: 0.25, gain: 0.16, dest });
    this._noiseBurst(t + 0.18, { buf: this.brown, type: 'lowpass', f: 260, a: 0.005, d: 0.16, gain: 0.5, dest });
    this._noiseBurst(t + 0.32, { type: 'bandpass', f: 650, fEnd: 420, q: 1.4, a: 0.06, d: 0.35, hold: 0.06, gain: own ? 0.09 : 0.06, dest });
  }

  // a body set down: a soft heavy thud — on the cot, a creak of old canvas and wood
  bodyDrop(x, y, z, cot = false) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 3, 1.0);
    pn.connect(this.sfx);
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 220, a: 0.004, d: 0.22, gain: 1.3, dest: pn, rev: 0.2 });
    this._noiseBurst(t + 0.01, { type: 'bandpass', f: 1100, q: 0.7, a: 0.01, d: 0.16, gain: 0.08, dest: pn });
    if (cot) {
      const o = this._osc('sawtooth', 180);
      o.frequency.linearRampToValueAtTime(240, t + 0.18);
      o.frequency.linearRampToValueAtTime(150, t + 0.42);
      const bp = this._filter('bandpass', 900, 9);
      const g = this._gain();
      o.connect(bp).connect(g).connect(pn);
      this._env(g, t + 0.05, 0.05, 0.05, 0.3, 0.05);
      o.start(t + 0.05);
      o.stop(t + 0.6);
    }
  }

  // two fingers on a friend's neck: what you feel, as sound. k: 1 steady, 0.6 weak, 0.3 faint, 0 nothing
  pulseFelt(k) {
    if (!this.ready) return;
    const t = this.now;
    if (k <= 0) {
      // nothing. just your own blood in your ears
      this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 90, a: 0.4, d: 1.2, hold: 0.4, gain: 0.08, dest: this.body });
      return;
    }
    const gap = k >= 1 ? 0.82 : k >= 0.6 ? 0.62 : 0.5;
    const n = 3;
    for (let i = 0; i < n; i++) {
      const at = t + 0.06 + i * gap + (k < 0.5 && i > 0 ? (Math.random() - 0.5) * 0.12 : 0); // (faint: it stumbles)
      this._tone(at, { f: 58, fEnd: 40, a: 0.008, d: 0.12, gain: 0.25 * k + 0.08, dest: this.body });
      this._noiseBurst(at, { buf: this.brown, type: 'lowpass', f: 140, a: 0.006, d: 0.1, gain: 0.18 * k + 0.04, dest: this.body });
    }
  }

  // one push on someone's chest, on the creaking cot
  cprPush(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 2.5, 1.1);
    pn.connect(this.sfx);
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 200, a: 0.01, d: 0.12, gain: 1.1, dest: pn });
    this._noiseBurst(t + 0.02, { type: 'bandpass', f: 700 + Math.random() * 200, q: 6, a: 0.02, d: 0.1, gain: 0.1, dest: pn });
    this._noiseBurst(t + 0.05, { type: 'bandpass', f: 500, q: 0.8, a: 0.04, d: 0.18, gain: 0.12, dest: pn });
  }

  // a breath dragged back in, then coughing (own = it's you, coming back)
  reviveGasp(x, y, z, own = false) {
    if (!this.ready) return;
    const t = this.now;
    let dest = this.sfx;
    if (!own) {
      dest = this._panner(x, y, z, 3, 1.0);
      dest.connect(this.sfx);
    } else dest = this.body;
    // the gasp: noise swept up through a narrowing throat
    this._noiseBurst(t, { type: 'bandpass', f: 380, fEnd: 2300, q: 2.2, a: 0.09, d: 0.32, hold: 0.12, gain: own ? 0.34 : 0.28, dest, rev: own ? 0 : 0.3 });
    this._noiseBurst(t + 0.04, { type: 'highpass', f: 3000, a: 0.08, d: 0.3, hold: 0.06, gain: 0.05, dest });
    // ...and the coughs
    for (let i = 0; i < 3; i++) {
      const at = t + 0.75 + i * (0.3 + Math.random() * 0.08);
      this._noiseBurst(at, { type: 'bandpass', f: 520 + Math.random() * 120, q: 1.1, a: 0.004, d: 0.13, gain: (own ? 0.3 : 0.24) * (1 - i * 0.2), dest });
      this._noiseBurst(at, { buf: this.brown, type: 'lowpass', f: 300, a: 0.003, d: 0.1, gain: 0.2 * (1 - i * 0.2), dest });
    }
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

  heavyStep(x, y, z, gain = 0.5, pitch = 1) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 3, 1.2);
    pn.connect(this.sfx);
    const o = this._osc('sine', 75 * pitch); o.frequency.exponentialRampToValueAtTime(40 * pitch, t + 0.12 / pitch);
    const g = this._gain(); o.connect(g).connect(pn);
    this._env(g, t, 0.003, gain, 0.15 / pitch);
    o.start(t); o.stop(t + 0.2 / pitch + 0.05);
    const n = this._noise(); const bp = this._filter('bandpass', (500 + Math.random() * 400) * pitch, 1); const g2 = this._gain();
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
  breather(x, y, z, low = false) {
    if (!this.ready) return null;
    const pn = this._panner(x, y, z, low ? 4 : 2.5, low ? 1.1 : 1.4);
    pn.connect(this.sfx);
    const g = this._gain(0);
    const n = this._noise(this.pink);
    const bp = this._filter('bandpass', low ? 300 : 520, 2.2);
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
        bp.frequency.setValueAtTime(low ? 230 + Math.random() * 150 : 420 + Math.random() * 300, t);
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

  // ---------- morning ----------
  // daylight: no drone under the forest, birds everywhere
  setMorning(on) {
    this.morning = on;
    if (!this.ctx) return;
    const t = this.now;
    const n = this.ambNodes;
    if (n) {
      n.dg.gain.cancelScheduledValues(t);
      n.dg.gain.setTargetAtTime(on ? 0 : 0.07, t, on ? 0.2 : 2.5);
      n.tg.gain.setTargetAtTime(0, t, 0.3);
      n.sub.gain.setTargetAtTime(0, t, 0.3);
    }
    if (on) this.nextBird = t + 0.4;
  }

  morningTick() {
    if (!this.ready || !this.morning) return;
    const t = this.now;
    if (t < (this.nextBird || 0)) return;
    this.nextBird = t + 0.3 + Math.random() * 1.5;
    this.bird();
  }

  bird(kind = null) {
    if (!this.ready) return;
    const L = this.listener;
    const r = Math.random();
    kind = kind || (r < 0.4 ? 'chirp' : r < 0.64 ? 'trill' : r < 0.84 ? 'tsee' : r < 0.92 ? 'cuckoo' : 'pecker');
    const far = kind === 'cuckoo' || kind === 'pecker';
    const a = Math.random() * Math.PI * 2, d = far ? 35 + Math.random() * 25 : 10 + Math.random() * 28;
    const x = L.x + Math.cos(a) * d, z = L.z + Math.sin(a) * d, y = L.y + 3 + Math.random() * 7;
    const pn = this._panner(x, y, z, 6, 0.6);
    const bg = this._gain(6); // calls are synthesized quietly; this is where they get their voice
    bg.connect(pn);
    pn.connect(this.amb);
    const rs = this._gain(0.35); pn.connect(rs); rs.connect(this.revSend);
    const t = this.now;
    const dest = bg;
    if (kind === 'chirp') {
      const n = 2 + Math.floor(Math.random() * 4);
      const f0 = 3000 + Math.random() * 2200;
      const up = Math.random() < 0.5;
      for (let i = 0; i < n; i++) {
        const tt = t + i * (0.07 + Math.random() * 0.05);
        const f = f0 * (1 + (Math.random() - 0.5) * 0.12);
        this._tone(tt, { f, fEnd: f * (up ? 1.35 : 0.7), a: 0.004, d: 0.055, gain: 0.07, dest });
      }
    } else if (kind === 'trill') {
      const dur = 0.5 + Math.random() * 0.6;
      const o = this._osc('sine', 3800 + Math.random() * 1200);
      const m = this._osc('sine', 24 + Math.random() * 10);
      const mg = this._gain(500 + Math.random() * 400);
      m.connect(mg).connect(o.frequency);
      const g = this._gain(0);
      o.connect(g).connect(dest);
      this._env(g, t, 0.05, 0.05, dur * 0.6, dur * 0.3);
      o.start(t); m.start(t); o.stop(t + dur + 0.1); m.stop(t + dur + 0.1);
    } else if (kind === 'tsee') {
      // "tea-cher, tea-cher": high, low, high, low
      const reps = 2 + Math.floor(Math.random() * 2);
      const hi = 5600 + Math.random() * 900, lo = hi * 0.72;
      for (let i = 0; i < reps; i++) {
        const tt = t + i * 0.36;
        this._tone(tt, { f: hi, fEnd: hi * 0.96, a: 0.01, d: 0.1, gain: 0.05, dest });
        this._tone(tt + 0.15, { f: lo, fEnd: lo * 0.9, a: 0.01, d: 0.12, gain: 0.05, dest });
      }
    } else if (kind === 'cuckoo') {
      this._tone(t, { type: 'triangle', f: 680, fEnd: 650, a: 0.04, d: 0.22, gain: 0.1, dest });
      this._tone(t + 0.34, { type: 'triangle', f: 560, fEnd: 530, a: 0.04, d: 0.3, gain: 0.09, dest });
    } else {
      // a woodpecker, somewhere
      const n = 12 + Math.floor(Math.random() * 8);
      const f = 900 + Math.random() * 400;
      for (let i = 0; i < n; i++) {
        const tt = t + i * 0.055;
        this._tone(tt, { f, fEnd: f * 0.85, a: 0.001, d: 0.025, gain: 0.16 * (1 - i / (n * 1.6)), dest });
      }
    }
  }

  // the light dies: birds cut out, the forest holds its breath, something enormous booms far away
  dusk() {
    if (!this.ready) return;
    this.setMorning(false);
    const t = this.now;
    this.duck(0.03, 0.5, 2.2, 4);
    this._noiseBurst(t, { buf: this.pink, type: 'lowpass', f: 260, fEnd: 2600, a: 1.7, d: 0.05, gain: 0.22, dest: this.body });
    const tb = t + 1.8;
    this._tone(tb, { f: 52, fEnd: 21, a: 0.008, d: 2.8, gain: 0.95, dest: this.body });
    this._noiseBurst(tb, { buf: this.brown, type: 'lowpass', f: 220, a: 0.01, d: 2.4, gain: 1.4, dest: this.body, rev: 0.9 });
    this._noiseBurst(tb, { type: 'bandpass', f: 900, q: 0.7, a: 0.004, d: 0.5, gain: 0.25, dest: this.body, rev: 0.6 });
    [3136, 3322].forEach((f) => this._tone(tb, { f, a: 0.002, d: 2.2, gain: 0.012, dest: this.body }));
  }

  // ---------- generators ----------
  // a persistent engine at (x,y,z): returns { spin(level 0..1), sputter(), stop() }
  genHum(x, y, z, spinning = false) {
    if (!this.ready) return null;
    const t = this.now;
    const pn = this._panner(x, y, z, 2.5, 1.15);
    pn.connect(this.amb);
    const out = this._gain(0);
    out.connect(pn);
    const o1 = this._osc('sawtooth', 52), o2 = this._osc('sawtooth', 104.5);
    const lp = this._filter('lowpass', 460, 1.3);
    const am = this._gain(0.6);
    const lfo = this._osc('square', 13);
    const lfoG = this._gain(0.38);
    lfo.connect(lfoG).connect(am.gain);
    o1.connect(lp); o2.connect(lp);
    lp.connect(am).connect(out);
    const n = this._noise(this.white);
    const bp = this._filter('bandpass', 2300, 1.5);
    const ng = this._gain(0.035);
    n.connect(bp).connect(ng).connect(am);
    const srcs = [o1, o2, lfo, n];
    srcs.forEach((q) => q.start(t));
    const self = this;
    const set = (lvl, tc = 0.25) => {
      const now = self.now;
      o1.frequency.setTargetAtTime(30 + 22 * lvl, now, tc);
      o2.frequency.setTargetAtTime(60 + 44.5 * lvl, now, tc);
      lfo.frequency.setTargetAtTime(6 + 7 * lvl, now, tc);
      lp.frequency.setTargetAtTime(260 + 200 * lvl, now, tc);
      out.gain.setTargetAtTime(0.03 + 0.17 * lvl, now, tc);
    };
    if (spinning) set(0.05, 0.05);
    else set(1, 0.4);
    let dead = false;
    return {
      spin(lvl) { if (!dead) set(Math.min(1, Math.max(0, lvl)), 0.3); },
      sputter() {
        if (dead) return;
        const now = self.now;
        // it catches, misses, catches, and runs down to nothing
        for (let i = 0; i < 7; i++) {
          const tt = now + i * 0.19;
          out.gain.setValueAtTime(i % 2 ? 0.04 : 0.2 * (1 - i / 9), tt);
          o1.frequency.setValueAtTime(52 - i * 4.2, tt);
          lfo.frequency.setValueAtTime(13 - i * 1.3, tt);
        }
        out.gain.setTargetAtTime(0, now + 1.35, 0.12);
      },
      stop() {
        if (dead) return;
        dead = true;
        const now = self.now;
        out.gain.cancelScheduledValues(now);
        out.gain.setTargetAtTime(0, now, 0.15);
        srcs.forEach((q) => { try { q.stop(now + 0.8); } catch { /* */ } });
      },
    };
  }

  genStart(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 4, 0.9);
    pn.connect(this.sfx);
    const rs = this._gain(0.4); pn.connect(rs); rs.connect(this.revSend);
    // starter whine, two coughs, then it catches
    const st = this._osc('sawtooth', 170);
    st.frequency.exponentialRampToValueAtTime(420, t + 0.6);
    const sbp = this._filter('bandpass', 900, 2);
    const sg = this._gain(0);
    st.connect(sbp).connect(sg).connect(pn);
    this._env(sg, t, 0.04, 0.22, 0.12, 0.45);
    st.start(t); st.stop(t + 0.7);
    [0.22, 0.46].forEach((d) => this._noiseBurst(t + d, { buf: this.brown, type: 'lowpass', f: 320, a: 0.005, d: 0.16, gain: 1.6, dest: pn }));
    this._noiseBurst(t + 0.68, { buf: this.brown, type: 'lowpass', f: 420, a: 0.004, d: 0.3, gain: 2.0, dest: pn });
    this._noiseBurst(t + 0.7, { type: 'highpass', f: 3000, a: 0.0006, d: 0.02, gain: 0.5, dest: pn }); // relay
    // the lamp: a hot filament tink and mains hum swelling up
    this._tone(t + 0.85, { f: 3700, a: 0.001, d: 0.35, gain: 0.05, dest: pn });
    [100, 150].forEach((f, i) => this._tone(t + 0.8, { f, a: 0.3, d: 1.2, hold: 0.4, gain: i ? 0.03 : 0.05, dest: pn }));
    // and in your chest: relief (a warm chord that doesn't quite resolve)
    [196, 246.9, 293.7, 370].forEach((f, i) => this._tone(t + 0.75 + i * 0.06, { type: 'triangle', f, a: 0.6, d: 2.6, hold: 0.4, gain: 0.035, dest: this.body, rev: 0.7 }));
  }

  cordPull(x, y, z, ok = false) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 2.5, 1.1);
    pn.connect(this.sfx);
    this._noiseBurst(t, { type: 'bandpass', f: 1100, fEnd: 3600, q: 2, a: 0.03, d: 0.18, gain: 0.5, dest: pn }); // the cord zips out
    if (ok) return; // genStart takes it from here
    for (let i = 0; i < 4; i++) {
      this._noiseBurst(t + 0.18 + i * 0.075, { buf: this.brown, type: 'lowpass', f: 300, a: 0.004, d: 0.07, gain: 1.0 * (1 - i / 4.5), dest: pn });
    }
    this._noiseBurst(t + 0.5, { buf: this.pink, type: 'bandpass', f: 500, q: 0.8, a: 0.05, d: 0.5, gain: 0.15, dest: pn }); // exhaust sigh
  }

  clank(x, y, z, heavy = 0.6) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 2.5, 1.2);
    pn.connect(this.sfx);
    const f = 480 + Math.random() * 380;
    [[1, 0.32, 0.22], [2.76, 0.18, 0.14], [5.4, 0.09, 0.08], [8.93, 0.05, 0.05]].forEach(([m, d, g]) => {
      this._tone(t, { f: f * m, a: 0.001, d: d * (0.7 + heavy * 0.6), gain: g * heavy * 2, dest: pn });
    });
    this._noiseBurst(t, { type: 'highpass', f: 2800, a: 0.0005, d: 0.012, gain: 0.9 * heavy, dest: pn });
  }

  glug(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 2, 1.3);
    pn.connect(this.sfx);
    const n = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const tt = t + i * (0.09 + Math.random() * 0.06);
      const f = 180 + Math.random() * 140;
      this._tone(tt, { f, fEnd: f * 2.1, a: 0.004, d: 0.05, gain: 0.18, dest: pn });
    }
    this._noiseBurst(t, { buf: this.pink, type: 'lowpass', f: 700, a: 0.08, d: 0.4, hold: 0.2, gain: 0.25, dest: pn });
  }

  spark(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 3, 1.0);
    pn.connect(this.sfx);
    const rs = this._gain(0.3); pn.connect(rs); rs.connect(this.revSend);
    this._noiseBurst(t, { type: 'highpass', f: 2200, a: 0.0004, d: 0.035, gain: 2.2, dest: pn });
    const o = this._osc('sawtooth', 118);
    const bp = this._filter('bandpass', 1700, 2.2);
    const rm = this._ring(o, 61, t, 0.4);
    const g = this._gain(0);
    rm.connect(bp).connect(g).connect(pn);
    this._env(g, t, 0.002, 0.5, 0.25, 0.05);
    o.start(t); o.stop(t + 0.4);
    this._noiseBurst(t + 0.02, { type: 'highpass', f: 6000, a: 0.01, d: 0.45, gain: 0.18, dest: pn });
  }

  // a portable radio taped to the generator: it chirps until somebody makes it run
  beacon(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 8, 0.45);
    pn.connect(this.sfx);
    this._noiseBurst(t, { type: 'bandpass', f: 2600, q: 1.2, a: 0.004, d: 0.1, gain: 0.26, dest: pn });
    this._tone(t + 0.05, { type: 'square', f: 1318.5, a: 0.003, d: 0.06, hold: 0.04, gain: 0.12, dest: pn });
    this._tone(t + 0.19, { type: 'square', f: 987.8, a: 0.003, d: 0.08, hold: 0.04, gain: 0.12, dest: pn });
  }

  // ---------- cabin doors ----------
  // a dry hinge: the leaf sticks and slips, and every slip rings through the planks. dur s, pitch ~1
  doorCreak(x, y, z, dur = 0.6, pitch = 1, gain = 0.45) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 3, 1.0);
    pn.connect(this.sfx);
    const rs = this._gain(0.4); pn.connect(rs); rs.connect(this.revSend);
    const steps = Math.max(3, Math.round(dur * 6));
    // stick-slip: a buzzing pulse train whose rate wanders as the hinge binds and frees
    const o = this._osc('sawtooth', 62 * pitch);
    for (let i = 1; i <= steps; i++) o.frequency.linearRampToValueAtTime((42 + Math.random() * 64) * pitch, t + (dur * i) / steps);
    const am = this._gain(0.5);
    const lfo = this._osc('square', 19 + Math.random() * 12);
    const lg = this._gain(0.5);
    lfo.connect(lg).connect(am.gain);
    o.connect(am);
    const env = this._gain(0);
    // the wood's voice: three resonances, the top one the squeal
    [[540, 5, 1.0], [1180, 9, 2.5], [2480, 12, 1.8]].forEach(([f, q, g]) => {
      const bp = this._filter('bandpass', f * pitch * (0.94 + Math.random() * 0.12), q);
      const gg = this._gain(g);
      am.connect(bp).connect(gg).connect(env);
    });
    env.connect(pn);
    const p = env.gain;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(gain, t + 0.05);
    for (let i = 1; i < steps; i++) p.linearRampToValueAtTime(gain * (0.35 + Math.random() * 0.65), t + (dur * i) / steps);
    p.linearRampToValueAtTime(0.0001, t + dur + 0.1);
    o.start(t); lfo.start(t);
    o.stop(t + dur + 0.2); lfo.stop(t + dur + 0.2);
    // and the soft rub of the leaf moving through the air
    this._noiseBurst(t, { buf: this.pink, type: 'bandpass', f: 420, q: 1.1, a: 0.1, d: dur * 0.6, hold: dur * 0.3, gain: gain * 0.3, dest: pn });
  }

  // the leaf meets the frame (or the stop out front): a thump, a knock, the latch
  doorShut(x, y, z, hard = 0.6) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 3.5, 1.0);
    pn.connect(this.sfx);
    const rs = this._gain(0.55); pn.connect(rs); rs.connect(this.revSend);
    this._tone(t, { f: 96, fEnd: 46, a: 0.002, d: 0.24, gain: 0.9 * hard, dest: pn });
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 720, a: 0.001, d: 0.13, gain: 1.6 * hard, dest: pn });
    this._noiseBurst(t, { type: 'bandpass', f: 430, q: 2.4, a: 0.001, d: 0.08, gain: 0.9 * hard, dest: pn });
    this._noiseBurst(t + 0.05, { type: 'highpass', f: 3200, a: 0.0005, d: 0.016, gain: 0.45 * hard, dest: pn });
    this._noiseBurst(t + 0.078, { type: 'bandpass', f: 2300, q: 4, a: 0.0005, d: 0.03, gain: 0.3 * hard, dest: pn });
  }

  // something heavy hitting the door from the other side. final: it gives
  doorBash(x, y, z, final = false) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 5, 0.85);
    pn.connect(this.sfx);
    const rs = this._gain(0.9); pn.connect(rs); rs.connect(this.revSend);
    const k = final ? 1.25 : 1;
    this._tone(t, { f: 74, fEnd: 36, a: 0.002, d: 0.42, gain: 1.15 * k, dest: pn }); // the whole door booms
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 950, a: 0.001, d: 0.24, gain: 2.2 * k, dest: pn });
    this._noiseBurst(t, { type: 'bandpass', f: 300, q: 1.5, a: 0.001, d: 0.17, gain: 1.3 * k, dest: pn });
    for (let i = 0; i < 4; i++) {
      // the frame and the hinges rattle
      this._noiseBurst(t + 0.05 + i * 0.045, { type: 'bandpass', f: 1400 + Math.random() * 1100, q: 5, a: 0.001, d: 0.026, gain: 0.5 * (1 - i / 5), dest: pn });
    }
    this._tone(t + 0.02, { type: 'square', f: 650, fEnd: 590, a: 0.001, d: 0.09, gain: 0.04, dest: pn });
    if (final) {
      // wood splits; the leaf slams round into the wall
      for (let i = 0; i < 8; i++) {
        this._noiseBurst(t + 0.015 + i * (0.018 + Math.random() * 0.03), { type: 'bandpass', f: 1700 + Math.random() * 2800, q: 3, a: 0.0006, d: 0.03 + Math.random() * 0.05, gain: 0.85, dest: pn });
      }
      this._noiseBurst(t + 0.26, { buf: this.brown, type: 'lowpass', f: 620, a: 0.002, d: 0.32, gain: 1.7, dest: pn });
      this._tone(t + 0.26, { f: 62, fEnd: 33, a: 0.002, d: 0.42, gain: 0.95, dest: pn });
    }
  }

  // ---------- the flare gun ----------
  // a big bore at low pressure: more of a hollow thoonk than a bang. local = your own gun (in your hands)
  flareShot(x, y, z, local = false) {
    if (!this.ready) return;
    const t = this.now;
    let dest = this.sfx;
    if (!local) {
      const pn = this._panner(x, y, z, 6, 0.8);
      pn.connect(this.sfx);
      dest = pn;
    }
    this._tone(t, { f: 170, fEnd: 52, a: 0.001, d: 0.22, gain: 1.0, dest, rev: 0.5 });
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 1300, a: 0.001, d: 0.16, gain: 2.4, dest, rev: 0.7 });
    this._noiseBurst(t, { type: 'bandpass', f: 760, q: 1.2, a: 0.001, d: 0.08, gain: 1.1, dest });
    this._noiseBurst(t + 0.006, { type: 'highpass', f: 4200, a: 0.0005, d: 0.03, gain: 0.5, dest }); // the breech
  }

  // the star bursting out at the top of the arc
  flarePop(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 10, 0.7);
    pn.connect(this.sfx);
    const rs = this._gain(1.0); pn.connect(rs); rs.connect(this.revSend);
    this._noiseBurst(t, { type: 'bandpass', f: 1700, q: 0.8, a: 0.0008, d: 0.06, gain: 1.7, dest: pn });
    this._tone(t, { f: 220, fEnd: 70, a: 0.001, d: 0.26, gain: 0.6, dest: pn });
    this._noiseBurst(t + 0.02, { buf: this.brown, type: 'lowpass', f: 520, a: 0.004, d: 0.55, gain: 1.1, dest: pn });
  }

  // a flare burning: magnesium fizz with a roar under it, never even. returns { setPos, level, crackle, stop }
  flareBurn(x, y, z) {
    if (!this.ready) return null;
    const t = this.now;
    const pn = this._panner(x, y, z, 7, 0.75);
    pn.connect(this.sfx);
    const rs = this._gain(0.45); pn.connect(rs); rs.connect(this.revSend);
    const out = this._gain(0);
    out.connect(pn);
    const n = this._noise(this.white);
    const hp = this._filter('highpass', 2600, 0.7);
    const fz = this._gain(0.42);
    n.connect(hp).connect(fz).connect(out);
    const n2 = this._noise(this.pink);
    const bp = this._filter('bandpass', 850, 0.6);
    const rg = this._gain(0.4);
    n2.connect(bp).connect(rg).connect(out);
    const lfo = this._osc('sawtooth', 8.5);
    const lg = this._gain(0.2);
    lfo.connect(lg).connect(fz.gain);
    n.start(t, Math.random()); n2.start(t, Math.random()); lfo.start(t);
    const self = this;
    let dead = false;
    return {
      setPos(px, py, pz) {
        if (dead) return;
        const now = self.now;
        if (pn.positionX) {
          pn.positionX.setTargetAtTime(px, now, 0.05);
          pn.positionY.setTargetAtTime(py, now, 0.05);
          pn.positionZ.setTargetAtTime(pz, now, 0.05);
        } else pn.setPosition(px, py, pz);
      },
      level(v, tc = 0.08) {
        if (!dead) out.gain.setTargetAtTime(v * 0.5, self.now, tc);
      },
      crackle() {
        if (dead) return;
        self._noiseBurst(self.now, { type: 'bandpass', f: 2200 + Math.random() * 3600, q: 3, a: 0.0005, d: 0.008 + Math.random() * 0.02, gain: 0.25 + Math.random() * 0.35, dest: pn });
      },
      stop(fade = 0.4) {
        if (dead) return;
        dead = true;
        const now = self.now;
        out.gain.cancelScheduledValues(now);
        out.gain.setTargetAtTime(0, now, Math.max(0.02, fade / 3));
        [n, n2, lfo].forEach((q) => { try { q.stop(now + fade + 0.6); } catch { /* */ } });
      },
    };
  }

  // the atlas page: a couple of seconds of a flare burning, self-contained
  flareHiss(x, y, z, dur = 2.4) {
    const s = this.flareBurn(x, y, z);
    if (!s) return;
    s.level(0.9, 0.04);
    for (let i = 0; i < Math.round(dur * 10); i++) setTimeout(() => s.crackle(), 40 + Math.random() * dur * 1000);
    setTimeout(() => s.stop(0.7), dur * 1000);
  }

  // a flare into the lake: one angry hiss and it's gone
  flareDrown(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 5, 0.9);
    pn.connect(this.sfx);
    this._noiseBurst(t, { type: 'highpass', f: 3000, fEnd: 1200, a: 0.004, d: 0.9, gain: 0.7, dest: pn, rev: 0.4 });
    this._noiseBurst(t, { buf: this.pink, type: 'lowpass', f: 900, a: 0.01, d: 0.4, gain: 0.5, dest: pn });
  }

  // you picked up the flare gun: a heavy click, cartridges rattling in a pocket
  flareFound() {
    if (!this.ready) return;
    const t = this.now;
    this._noiseBurst(t, { type: 'bandpass', f: 2600, q: 3, a: 0.0006, d: 0.02, gain: 0.5, dest: this.body });
    this._tone(t, { f: 1200, fEnd: 700, a: 0.001, d: 0.05, gain: 0.08, dest: this.body });
    [0.16, 0.24].forEach((d) => this._noiseBurst(t + d, { type: 'bandpass', f: 3400, q: 5, a: 0.0006, d: 0.025, gain: 0.25, dest: this.body }));
  }

  // flies over a body: returns { stop() }
  flies(x, y, z) {
    if (!this.ready) return null;
    const t = this.now;
    const pn = this._panner(x, y, z, 1.1, 1.5);
    pn.connect(this.amb);
    const bp = this._filter('bandpass', 620, 1.2);
    const g = this._gain(0);
    bp.connect(g).connect(pn);
    const srcs = [];
    [188, 212, 243].forEach((f) => {
      const o = this._osc('sawtooth', f);
      const m = this._osc('sine', 6 + Math.random() * 8);
      const mg = this._gain(14 + Math.random() * 10);
      m.connect(mg).connect(o.frequency);
      const og = this._gain(0.33);
      const tr = this._osc('sine', 0.3 + Math.random() * 0.6);
      const tg = this._gain(0.3);
      tr.connect(tg).connect(og.gain);
      o.connect(og).connect(bp);
      srcs.push(o, m, tr);
    });
    srcs.forEach((q) => q.start(t));
    g.gain.setTargetAtTime(0.36, t, 0.6);
    const self = this;
    return {
      stop() {
        const now = self.now;
        g.gain.setTargetAtTime(0, now, 0.3);
        srcs.forEach((q) => { try { q.stop(now + 1.5); } catch { /* */ } });
      },
    };
  }

  // your echo just touched a body: something low and wrong in your chest
  discover(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const g = this._gain(0);
    const lp = this._filter('lowpass', 650, 0.8);
    g.connect(lp);
    this._out(lp, this.body, 0.5);
    [110, 116.5].forEach((f) => { const o = this._osc('sawtooth', f); o.connect(g); o.start(t); o.stop(t + 3); });
    this._env(g, t, 0.7, 0.05, 1.9, 0.2);
    this._tone(t + 0.2, { f: 1975, a: 0.6, d: 1.6, gain: 0.006, dest: this.body });
    void x; void y; void z;
  }

  paper() {
    if (!this.ready) return;
    const t = this.now;
    this._noiseBurst(t, { type: 'bandpass', f: 1400, q: 0.8, a: 0.06, d: 0.18, gain: 0.12, dest: this.body });
    for (let i = 0; i < 5; i++) {
      this._noiseBurst(t + 0.05 + i * (0.04 + Math.random() * 0.05), { type: 'highpass', f: 2600 + Math.random() * 2000, a: 0.001, d: 0.02 + Math.random() * 0.03, gain: 0.16, dest: this.body });
    }
  }

  // ---------- the Watcher ----------
  // a thin ringing that grows as it closes in, breath-like hiss while it moves, and something
  // under it you feel in your teeth. level 0 = gone.
  watcherPresence(level, x = 0, y = 0, z = 0, moving = false) {
    if (!this.ready) return;
    if (!this.wNodes) {
      if (level <= 0) return;
      const t = this.now;
      const pn = this._panner(x, y, z, 4, 1.0);
      pn.connect(this.amb);
      const out = this._gain(1);
      out.connect(pn);
      const g1 = this._gain(0), g2 = this._gain(0), g3 = this._gain(0);
      [1760, 1767.3].forEach((f) => { const o = this._osc('sine', f); o.connect(g1); o.start(t); });
      const n = this._noise(this.pink);
      const bp = this._filter('bandpass', 2600, 3);
      const am = this._gain(0.6);
      const lfo = this._osc('sine', 0.35); const lg = this._gain(0.4); lfo.connect(lg).connect(am.gain);
      n.connect(bp).connect(am).connect(g2);
      n.start(t); lfo.start(t);
      const lp = this._filter('lowpass', 320, 0.8);
      [73.4, 77.8].forEach((f) => { const o = this._osc('sawtooth', f); o.connect(lp); o.start(t); });
      lp.connect(g3);
      [g1, g2, g3].forEach((g) => g.connect(out));
      this.wNodes = { pn, g1, g2, g3, level: 0 };
    }
    const n = this.wNodes;
    if (level <= 0 && n.level <= 0) return;
    n.level = level;
    const t = this.now;
    n.g1.gain.setTargetAtTime(level * level * 0.03, t, 0.4);
    n.g2.gain.setTargetAtTime(level * (moving ? 0.14 : 0.04), t, 0.25);
    n.g3.gain.setTargetAtTime(level * 0.1, t, 0.5);
    if (level > 0 && n.pn.positionX) {
      n.pn.positionX.setTargetAtTime(x, t, 0.1);
      n.pn.positionY.setTargetAtTime(y, t, 0.1);
      n.pn.positionZ.setTargetAtTime(z, t, 0.1);
    }
  }

  // joints popping, somewhere close
  crack(x, y, z, gain = 0.5) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 2, 1.2);
    pn.connect(this.sfx);
    const n = 2 + Math.floor(Math.random() * 3);
    let tt = t;
    for (let i = 0; i < n; i++) {
      this._noiseBurst(tt, { type: 'bandpass', f: 1600 + Math.random() * 1800, q: 4, a: 0.0005, d: 0.008 + Math.random() * 0.01, gain: gain * 3.2, dest: pn });
      tt += 0.015 + Math.random() * 0.035;
    }
    this._tone(t, { f: 150, fEnd: 90, a: 0.001, d: 0.05, gain: gain * 0.3, dest: pn });
  }

  // the first time your echo finds it: a thin, high shriek of strings and a drop
  watcherSting() {
    if (!this.ready) return;
    const t = this.now;
    this._tone(t, { f: 60, fEnd: 24, a: 0.004, d: 1.2, gain: 0.7 });
    const str = this._gain(0);
    const lp = this._filter('lowpass', 7500, 0.7);
    str.connect(lp);
    this._out(lp, this.sfx, 0.9);
    [1568, 1661.2, 1760, 2093, 2217.5].forEach((f, i) => {
      const o = this._osc('sawtooth', f);
      const vib = this._osc('sine', 7 + Math.random() * 3);
      const vg = this._gain(20 + i * 6);
      vib.connect(vg).connect(o.detune);
      o.frequency.exponentialRampToValueAtTime(f * 1.03, t + 1.2);
      const og = this._gain(0.06);
      o.connect(og).connect(str);
      o.start(t); vib.start(t); o.stop(t + 1.5); vib.stop(t + 1.5);
    });
    this._env(str, t, 0.006, 0.9, 1.2, 0.08);
    this._noiseBurst(t, { type: 'highpass', f: 4000, a: 0.002, d: 0.4, gain: 0.15, rev: 0.6 });
  }

  // far away, something like a wet finger on the rim of a glass
  watcherArrive() {
    if (!this.ready) return;
    const L = this.listener;
    const a = Math.random() * Math.PI * 2;
    const x = L.x + Math.cos(a) * 40, z = L.z + Math.sin(a) * 40;
    const pn = this._panner(x, L.y + 3, z, 12, 0.6);
    pn.connect(this.sfx);
    const rs = this._gain(0.8); pn.connect(rs); rs.connect(this.revSend);
    const t = this.now;
    [1244.5, 1864.7].forEach((f, i) => {
      const o = this._osc('sine', f);
      const v = this._osc('sine', 4.5); const vg = this._gain(9); v.connect(vg).connect(o.detune);
      const g = this._gain(0);
      o.connect(g).connect(pn);
      this._env(g, t, 1.4, i ? 0.05 : 0.09, 2.2, 1.6);
      o.start(t); v.start(t); o.stop(t + 5.4); v.stop(t + 5.4);
    });
  }

  // ---------- the Howler ----------
  howlerInhale(x, y, z) {
    if (!this.ready) return;
    const t = this.now, dur = 1.8;
    const pn = this._panner(x, y, z, 7, 0.6);
    pn.connect(this.sfx);
    const rs = this._gain(0.5); pn.connect(rs); rs.connect(this.revSend);
    const n = this._noise(this.pink);
    const bp = this._filter('bandpass', 260, 1.4);
    bp.frequency.exponentialRampToValueAtTime(1150, t + dur);
    const g = this._gain(0);
    n.connect(bp).connect(g).connect(pn);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.3, t + dur - 0.05);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    n.start(t, Math.random()); n.stop(t + dur + 0.05);
    const o = this._osc('sawtooth', 36);
    o.frequency.linearRampToValueAtTime(44, t + dur);
    const lp = this._filter('lowpass', 170, 1);
    const og = this._gain(0);
    o.connect(lp).connect(og).connect(pn);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.5, t + dur - 0.05);
    og.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
    this.duck(0.25, 0.6, dur - 0.6, 1.5); // the forest holds its breath with it
  }

  howlerHowl(x, y, z, gain = 1) {
    if (!this.ready) return;
    const t = this.now;
    const ctx = this.ctx;
    const pn = this._panner(x, y, z, 10, 0.45);
    pn.connect(this.sfx);
    // the panner only attenuates the dry voice: scale the forest's answer by distance too
    const L = this.listener;
    const dist = Math.hypot(x - L.x, z - L.z);
    const wet = Math.sqrt(10 / (10 + 0.45 * Math.max(0, dist - 10)));
    const dl = ctx.createDelay(1.5);
    dl.delayTime.value = 0.55;
    const elp = this._filter('lowpass', 1200, 0.7);
    const fb = this._gain(0.4);
    dl.connect(elp).connect(fb).connect(dl);
    const eg = this._gain(0.45 * wet);
    elp.connect(eg);
    eg.connect(this.sfx);
    eg.connect(this.revSend);
    if (!this.offline) setTimeout(() => { try { dl.disconnect(); fb.disconnect(); } catch { /* */ } }, 8000);
    const mix = this._gain(0);
    const sh = this._shaper(this.distScream);
    const post = this._gain(0.55);
    mix.connect(sh).connect(post);
    post.connect(pn);
    post.connect(dl);
    const rs = this._gain(0.9 * wet); post.connect(rs); rs.connect(this.revSend);
    const v = this._voice(t, {
      f0: [[0, 92], [0.3, 150], [1.3, 126], [2.1, 66]], vowel: [[0, 'o'], [0.35, 'A'], [1.5, 'u']],
      dur: 2.2, vib: [4.5, 45], jitter: 45, rasp: 0.6, q: 5, fg: 3,
    });
    const vg = this._gain(0.7); v.connect(vg).connect(mix);
    const v2 = this._voice(t, {
      f0: [[0, 300], [0.3, 470], [1.3, 410], [2.1, 220]], vowel: [[0, 'A'], [1.2, 'o']],
      dur: 2.2, vib: [5.5, 60], jitter: 40, rasp: 0.3, q: 6, fg: 3,
    });
    const v2g = this._gain(0.35); v2.connect(v2g).connect(mix);
    this._env(mix, t, 0.12, 0.55 * gain, 1.2, 0.8);
    const sub = this._osc('sine', 46);
    sub.frequency.exponentialRampToValueAtTime(32, t + 2.2);
    const sg = this._gain(0);
    sub.connect(sg).connect(pn);
    this._env(sg, t, 0.1, 0.7 * gain, 1.6, 0.5);
    sub.start(t); sub.stop(t + 2.3);
  }

  howlerBark(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 6, 0.7);
    pn.connect(this.sfx);
    const mix = this._gain(0);
    const sh = this._shaper(this.distScream);
    const post = this._gain(0.5);
    mix.connect(sh).connect(post).connect(pn);
    const rs = this._gain(0.4); post.connect(rs); rs.connect(this.revSend);
    const v = this._voice(t, { f0: [[0, 120], [0.08, 175], [0.38, 85]], vowel: [[0, 'A'], [0.3, 'o']], dur: 0.42, jitter: 60, rasp: 0.8, q: 5, fg: 3 });
    v.connect(mix);
    this._env(mix, t, 0.015, 0.6, 0.3, 0.05);
  }

  // the calm is over: something far off calls out, something else answers, and the birds go up
  forestWake(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const ctx = this.ctx;
    const L = this.listener;
    const call = (at, px, pz, pitch, len, gain) => {
      const pn = this._panner(px, y, pz, 30, 0.6);
      pn.connect(this.sfx);
      const dist = Math.hypot(px - L.x, pz - L.z);
      const wet = Math.sqrt(30 / (30 + 0.6 * Math.max(0, dist - 30)));
      const dl = ctx.createDelay(1.5);
      dl.delayTime.value = 0.48 + Math.random() * 0.12;
      const elp = this._filter('lowpass', 900, 0.7);
      const fb = this._gain(0.42);
      dl.connect(elp).connect(fb).connect(dl);
      const eg = this._gain(0.5 * wet);
      elp.connect(eg);
      eg.connect(this.sfx);
      eg.connect(this.revSend);
      if (!this.offline) setTimeout(() => { try { dl.disconnect(); fb.disconnect(); } catch { /* */ } }, 9000);
      const mix = this._gain(0);
      const sh = this._shaper(this.distSoft);
      const lp = this._filter('lowpass', 1500, 0.7); // far away: the trees eat the top
      const post = this._gain(0.2);
      mix.connect(sh).connect(lp).connect(post);
      post.connect(pn);
      post.connect(dl);
      const rs = this._gain(1.0 * wet); post.connect(rs); rs.connect(this.revSend);
      const f = 170 * pitch;
      const v = this._voice(at, {
        f0: [[0, f * 0.8], [0.45 * len, f * 1.45], [0.75 * len, f * 1.25], [len, f * 0.62]],
        vowel: [[0, 'u'], [0.35 * len, 'o'], [0.6 * len, 'A'], [len, 'u']],
        dur: len, vib: [4.6, 55], jitter: 45, rasp: 0.4, q: 6, fg: 3,
      });
      const vg = this._gain(0.75); v.connect(vg).connect(mix);
      const hi = this._voice(at, { // a thin, wrong overtone riding on top
        f0: [[0, f * 2.4], [0.45 * len, f * 3.6], [len, f * 1.9]],
        vowel: [[0, 'i'], [len, 'e']],
        dur: len, vib: [6.2, 70], jitter: 40, rasp: 0.15, q: 8, fg: 3,
      });
      const hg = this._gain(0.18); hi.connect(hg).connect(mix);
      this._env(mix, at, 0.25 * len, 0.5 * gain, 0.55 * len, 0.2 * len);
    };
    call(t, x, z, 1, 2.6, 1);
    // the answer comes from the other side of you
    call(t + 1.5, L.x - (x - L.x) * 0.8 + (z - L.z) * 0.5, L.z - (z - L.z) * 0.8 - (x - L.x) * 0.5, 0.82, 2.0, 0.8);
    // under it all, the ground itself seems to shift
    const sub = this._noise(this.brown);
    const slp = this._filter('lowpass', 85, 0.8);
    const sg = this._gain(0);
    sub.connect(slp).connect(sg).connect(this.sfx);
    this._env(sg, t, 1.4, 0.3, 2.4, 0.6);
    sub.start(t, Math.random() * 2);
    sub.stop(t + 4.6);
    // the birds that were sleeping in the tops go up all at once
    for (let i = 0; i < 16; i++) {
      const at = t + 0.25 + Math.random() * 1.1;
      const pan = this._stereo(Math.random() * 1.6 - 0.8);
      pan.connect(this.sfx);
      this._noiseBurst(at, { f: 900 + Math.random() * 900, q: 1.4, a: 0.006, d: 0.05, gain: 0.05 + Math.random() * 0.04, dest: pan, rev: 0.3 });
      this._noiseBurst(at + 0.07, { f: 800 + Math.random() * 700, q: 1.4, a: 0.006, d: 0.045, gain: 0.04, dest: pan, rev: 0.3 });
    }
  }

  // ---------- the wardrobe ----------
  // a wire hanger on the rail, cloth, a hat being settled, a drop of dye, the stage's own echo
  wardrobe(kind) {
    if (!this.ready) return;
    const t = this.now;
    const out = this.ui;
    if (kind === 'open' || kind === 'close') {
      const up = kind === 'open';
      this._tone(t, { type: 'triangle', f: up ? 1250 : 980, fEnd: up ? 900 : 760, a: 0.001, d: 0.09, gain: 0.07, dest: out });
      this._tone(t + 0.035, { type: 'triangle', f: up ? 1830 : 1460, a: 0.001, d: 0.07, gain: 0.035, dest: out });
      this._noiseBurst(t + 0.02, { buf: this.pink, type: 'bandpass', f: 1800, q: 0.7, a: 0.05, d: 0.28, gain: 0.16, dest: out, fEnd: 900 });
    } else if (kind === 'hat') {
      this._noiseBurst(t, { buf: this.pink, type: 'bandpass', f: 2400, q: 0.9, a: 0.015, d: 0.12, gain: 0.18, dest: out, fEnd: 1200 });
      this._noiseBurst(t + 0.14, { buf: this.pink, type: 'lowpass', f: 900, q: 0.7, a: 0.004, d: 0.07, gain: 0.22, dest: out });
    } else if (kind === 'cloth') {
      for (let i = 0; i < 3; i++) {
        this._noiseBurst(t + i * 0.09 + Math.random() * 0.03, { buf: this.pink, type: 'bandpass', f: 1400 + Math.random() * 1400, q: 0.8, a: 0.03, d: 0.14, gain: 0.14, dest: out, fEnd: 700 });
      }
    } else if (kind === 'dye') {
      const f = 520 + Math.random() * 120;
      this._tone(t, { type: 'sine', f, fEnd: f * 2.5, a: 0.002, d: 0.09, gain: 0.08, dest: out });
      this._tone(t + 0.05, { type: 'sine', f: 1500, fEnd: 2100, a: 0.002, d: 0.05, gain: 0.03, dest: out });
    } else if (kind === 'tap') {
      this._tone(t, { type: 'sine', f: 2300, fEnd: 1500, a: 0.001, d: 0.05, gain: 0.06, dest: out });
      this._tone(t + 0.16, { type: 'sine', f: 1500, fEnd: 1100, a: 0.001, d: 0.08, gain: 0.025, dest: out });
    }
  }

  // ---------- UI ----------
  uiHover() {
    if (!this.ready) return;
    const t = this.now;
    const o = this._osc('sine', 1900); const g = this._gain(); o.connect(g).connect(this.ui);
    this._env(g, t, 0.002, 0.08, 0.04); o.start(t); o.stop(t + 0.08);
  }
  // ---------- the forestry yard and the УАЗ ----------
  // a positional source that carries: the yard's siren is meant to be heard across the north of the forest
  _far(x, y, z, ref = 8, roll = 0.5, rev = 0.5) {
    const pn = this._panner(x, y, z, ref, roll);
    pn.connect(this.sfx);
    if (rev > 0) {
      const rs = this._gain(rev);
      pn.connect(rs);
      rs.connect(this.revSend);
    }
    return pn;
  }

  // the gate's siren: an old rotating-beacon wail, up and down, rough in the horn. Returns { stop(fade) }
  gateSiren(x, y, z, dur = 8) {
    if (!this.ready) return null;
    const t = this.now;
    const pn = this._far(x, y, z, 9, 0.42, 0.7);
    const out = this._gain(0);
    out.connect(pn);
    const o = this._osc('sawtooth', 620);
    const o2 = this._osc('square', 310);
    const o2g = this._gain(0.35);
    const bp = this._filter('bandpass', 1300, 0.9);
    const sh = this._shaper(this.distSoft);
    const post = this._gain(0.28);
    o.connect(bp);
    o2.connect(o2g).connect(bp);
    bp.connect(sh).connect(post).connect(out);
    const period = 1.7;
    for (let tt = t, k = 0; tt < t + dur; tt += period, k++) {
      for (const p of [o.frequency, o2.frequency]) {
        const m = p === o.frequency ? 1 : 0.5;
        p.setValueAtTime(520 * m, tt);
        p.linearRampToValueAtTime(1180 * m, tt + period * 0.55);
        p.linearRampToValueAtTime(520 * m, tt + period);
      }
    }
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(1, t + 0.5);
    out.gain.setValueAtTime(1, t + dur - 0.9);
    out.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.1);
    o2.stop(t + dur + 0.1);
    // a relay clacks as it powers up
    this._noiseBurst(t, { type: 'highpass', f: 2800, a: 0.0005, d: 0.02, gain: 0.8, dest: pn });
    this._tone(t, { f: 100, a: 0.02, d: 0.6, gain: 0.12, dest: pn });
    let stopped = false;
    return {
      stop: (fade = 0.3) => {
        if (stopped) return;
        stopped = true;
        const n = this.now;
        out.gain.cancelScheduledValues(n);
        out.gain.setValueAtTime(out.gain.value, n);
        out.gain.linearRampToValueAtTime(0.0001, n + fade);
        try { o.stop(n + fade + 0.05); o2.stop(n + fade + 0.05); } catch { /* */ }
      },
    };
  }

  // ...and as everyone else hears it: far off, muffled by the forest, from the yard's direction
  gateFar(x, z, dur = 8) {
    if (!this.ready) return;
    const t = this.now;
    const L = this.listener;
    const d = Math.hypot(x - L.x, z - L.z);
    if (d < 70) return; // (close enough to hear the real one)
    const pan = this._stereo(this.panOf(x, z) * 0.8);
    const lp = this._filter('lowpass', 700, 0.7);
    const g = this._gain(0);
    lp.connect(g).connect(pan).connect(this.sfx);
    const rs = this._gain(0.9);
    g.connect(rs).connect(this.revSend);
    const o = this._osc('sawtooth', 520);
    o.connect(lp);
    for (let tt = t; tt < t + dur; tt += 1.7) {
      o.frequency.setValueAtTime(520, tt);
      o.frequency.linearRampToValueAtTime(1180, tt + 0.94);
      o.frequency.linearRampToValueAtTime(520, tt + 1.7);
    }
    const lvl = 0.05 * Math.max(0.35, 1 - d / 600);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(lvl, t + 0.8);
    g.gain.setValueAtTime(lvl, t + dur - 1);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  // the gate's drive: a motor's whine, the gear on the rack, the rollers rumbling, a rattle. { stop(fade) }
  gateMotor(x, y, z, dur = 7.5) {
    if (!this.ready) return null;
    const t = this.now;
    const pn = this._far(x, y, z, 5, 0.7, 0.4);
    const out = this._gain(0);
    out.connect(pn);
    const m1 = this._osc('sawtooth', 96), m2 = this._osc('sine', 192);
    const mlp = this._filter('lowpass', 600, 1.2);
    const mg = this._gain(0.18);
    m1.connect(mlp); m2.connect(mlp);
    mlp.connect(mg).connect(out);
    const gw = this._osc('triangle', 940);
    const gwg = this._gain(0.025);
    gw.connect(gwg).connect(out);
    for (const [o, f0, f1] of [[m1, 60, 96], [m2, 120, 192], [gw, 600, 940]]) {
      o.frequency.setValueAtTime(f0, t);
      o.frequency.linearRampToValueAtTime(f1, t + 0.8);
      o.frequency.setValueAtTime(f1, t + dur - 0.8);
      o.frequency.linearRampToValueAtTime(f0 * 0.8, t + dur);
    }
    const rum = this._noise(this.brown);
    const rlp = this._filter('lowpass', 220, 0.8);
    const rg = this._gain(0.55);
    const rl = this._osc('sine', 3.1);
    const rlg = this._gain(0.25);
    rl.connect(rlg).connect(rg.gain);
    rum.connect(rlp).connect(rg).connect(out);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(1, t + 0.4);
    out.gain.setValueAtTime(1, t + dur - 0.5);
    out.gain.linearRampToValueAtTime(0.0001, t + dur + 0.1);
    const srcs = [m1, m2, gw, rum, rl];
    for (const s of srcs) s.start(t);
    for (const s of srcs) s.stop(t + dur + 0.2);
    // the rack's teeth and the leaf's loose bolts
    for (let tt = t + 0.3; tt < t + dur - 0.3; tt += 0.11 + Math.random() * 0.05) {
      this._noiseBurst(tt, { type: 'bandpass', f: 1800 + Math.random() * 1600, q: 4, a: 0.0006, d: 0.02, gain: 0.08 + Math.random() * 0.06, dest: pn });
    }
    for (let i = 0; i < 5; i++) this._noiseBurst(t + 0.6 + Math.random() * (dur - 1.2), { type: 'bandpass', f: 600 + Math.random() * 500, q: 2, a: 0.002, d: 0.12, gain: 0.25, dest: pn });
    let stopped = false;
    return {
      stop: (fade = 0.2) => {
        if (stopped) return;
        stopped = true;
        const n = this.now;
        out.gain.cancelScheduledValues(n);
        out.gain.setValueAtTime(out.gain.value, n);
        out.gain.linearRampToValueAtTime(0.0001, n + fade);
      },
    };
  }

  // the leaf hits its stop: a heavy steel clunk that rings
  gateClunk(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._far(x, y, z, 5, 0.8, 0.8);
    this._tone(t, { f: 70, fEnd: 38, a: 0.002, d: 0.5, gain: 1.0, dest: pn });
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 900, a: 0.001, d: 0.25, gain: 1.6, dest: pn });
    [[312, 0.9], [497, 0.7], [783, 0.5], [1240, 0.3]].forEach(([f, d]) => this._tone(t, { f, a: 0.001, d, gain: 0.07, dest: pn }));
  }

  // picked up: a grunt of effort, and the thing itself (own: it's in your arms)
  partPick(x, y, z, key, own = false) {
    if (!this.ready) return;
    const t = this.now;
    let dest = this.sfx;
    if (!own) {
      dest = this._panner(x, y, z, 3, 1.1);
      dest.connect(this.sfx);
    }
    this._noiseBurst(t, { type: 'bandpass', f: 800, q: 0.8, a: 0.04, d: 0.18, gain: 0.12, dest }); // cloth
    if (key === 'wheel') {
      this._noiseBurst(t + 0.05, { buf: this.brown, type: 'lowpass', f: 300, a: 0.006, d: 0.18, gain: 0.5, dest });
      this._tone(t + 0.06, { type: 'sawtooth', f: 420, fEnd: 360, a: 0.01, d: 0.08, gain: 0.02, dest }); // rubber squeak
    } else if (key === 'battery') {
      this._noiseBurst(t + 0.05, { buf: this.brown, type: 'lowpass', f: 260, a: 0.005, d: 0.14, gain: 0.55, dest });
      this._slosh(t + 0.12, 0.6, dest);
    } else if (key === 'can') {
      this._tone(t + 0.04, { f: 380, fEnd: 340, a: 0.002, d: 0.25, gain: 0.06, dest }); // hollow tin
      this._slosh(t + 0.1, 0.25, dest); // (all but empty)
    } else {
      [2300, 3100].forEach((f, i) => this._tone(t + 0.03 + i * 0.03, { f, a: 0.001, d: 0.08, gain: 0.04, dest }));
    }
    if (own) this._noiseBurst(t + 0.15, { type: 'bandpass', f: 500, fEnd: 380, q: 1.5, a: 0.05, d: 0.25, gain: 0.05, dest: this.body }); // your breath
  }

  _slosh(t, k, dest) {
    for (let i = 0; i < 4; i++) {
      const at = t + i * (0.07 + Math.random() * 0.05);
      this._noiseBurst(at, { buf: this.pink, type: 'bandpass', f: 500 + Math.random() * 400, q: 2.2, a: 0.02, d: 0.09, gain: 0.12 * k, dest });
      this._tone(at, { f: 220 + Math.random() * 120, fEnd: 360, a: 0.004, d: 0.05, gain: 0.04 * k, dest });
    }
  }

  // it hits the ground (or a tree): what it's made of decides the sound. k: how hard; flat: just tips over
  partLand(x, y, z, key, k = 1, flat = false) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 4, 0.95);
    pn.connect(this.sfx);
    const rs = this._gain(0.4 * k);
    pn.connect(rs);
    rs.connect(this.revSend);
    if (key === 'wheel') {
      this._tone(t, { f: 95, fEnd: 52, a: 0.003, d: 0.28, gain: 0.9 * k, dest: pn }); // rubber, a boomy thump
      this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 420, a: 0.002, d: 0.18, gain: 1.0 * k, dest: pn });
      if (flat) for (let i = 0; i < 6; i++) this._noiseBurst(t + 0.05 + i * (0.09 - i * 0.01), { buf: this.brown, type: 'lowpass', f: 300, a: 0.002, d: 0.05, gain: 0.35 * (1 - i / 7), dest: pn }); // the wobble down
    } else if (key === 'battery') {
      this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 320, a: 0.002, d: 0.16, gain: 1.4 * k, dest: pn }); // dead weight
      this._noiseBurst(t, { type: 'bandpass', f: 1200, q: 1.5, a: 0.001, d: 0.05, gain: 0.4 * k, dest: pn });
      this._slosh(t + 0.05, 0.5 * k, pn);
    } else if (key === 'can') {
      this._tone(t, { f: 330, fEnd: 290, a: 0.001, d: 0.35, gain: 0.25 * k, dest: pn }); // a hollow tin bonk
      this._tone(t, { f: 870, a: 0.001, d: 0.18, gain: 0.1 * k, dest: pn });
      this._noiseBurst(t, { type: 'bandpass', f: 1600, q: 1.2, a: 0.001, d: 0.06, gain: 0.6 * k, dest: pn });
      this._slosh(t + 0.06, 0.2 * k, pn);
    } else {
      [1850, 2700, 4100].forEach((f, i) => this._tone(t, { f: f * (0.95 + Math.random() * 0.1), a: 0.0008, d: 0.16 - i * 0.03, gain: 0.08 * k, dest: pn })); // cast alloy: clink
      this._noiseBurst(t, { type: 'highpass', f: 2600, a: 0.0006, d: 0.03, gain: 0.5 * k, dest: pn });
      this._noiseBurst(t + 0.09, { type: 'highpass', f: 3000, a: 0.0006, d: 0.02, gain: 0.25 * k, dest: pn });
    }
  }

  // one step of the work at the car: the wheel brace on a nut, a clamp, a bolt, a glug of petrol
  partWork(x, y, z, key) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 2.5, 1.15);
    pn.connect(this.sfx);
    if (key === 'wheel') {
      for (let i = 0; i < 3; i++) this._noiseBurst(t + i * 0.07, { type: 'bandpass', f: 3400, q: 5, a: 0.0005, d: 0.02, gain: 0.3, dest: pn }); // the brace's ratchet
      this.clank(x, y, z, 0.75);
    } else if (key === 'battery') {
      this._noiseBurst(t, { type: 'bandpass', f: 2600, q: 3, a: 0.0006, d: 0.03, gain: 0.35, dest: pn });
      this._tone(t + 0.02, { f: 1900, a: 0.001, d: 0.06, gain: 0.05, dest: pn });
    } else if (key === 'carb') {
      for (let i = 0; i < 4; i++) this._noiseBurst(t + i * 0.05, { type: 'bandpass', f: 4200, q: 6, a: 0.0004, d: 0.015, gain: 0.22, dest: pn });
      this.clank(x, y, z, 0.35);
    } else this.glug(x, y, z);
  }

  // it's in: the last turn of the brace, a spark off the terminal, the clip on the hose, the cap screwed down
  partFitted(x, y, z, key) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 3, 1.0);
    pn.connect(this.sfx);
    if (key === 'battery') {
      this.spark(x, y, z);
      this._tone(t + 0.25, { type: 'square', f: 3100, a: 0.001, d: 0.04, gain: 0.03, dest: pn });
    } else if (key === 'wheel') {
      this.clank(x, y, z, 1);
      this._noiseBurst(t + 0.25, { buf: this.brown, type: 'lowpass', f: 260, a: 0.004, d: 0.25, gain: 1.0, dest: pn }); // the car settles onto it
    } else if (key === 'can') {
      for (let i = 0; i < 3; i++) this._noiseBurst(t + i * 0.06, { type: 'bandpass', f: 1500, q: 3, a: 0.001, d: 0.03, gain: 0.25, dest: pn });
      this._tone(t + 0.3, { f: 330, fEnd: 300, a: 0.002, d: 0.3, gain: 0.1, dest: pn });
    } else {
      this._noiseBurst(t, { type: 'bandpass', f: 1800, q: 2, a: 0.001, d: 0.04, gain: 0.4, dest: pn });
      this.clank(x, y, z, 0.5);
    }
    // and in your chest: one more step done
    [261.6, 329.6, 392].forEach((f, i) => this._tone(t + 0.15 + i * 0.05, { type: 'triangle', f, a: 0.15, d: 1.0, gain: 0.025, dest: this.body, rev: 0.5 }));
  }

  // a УАЗ door: the handle, the clunk (in = getting in)
  carDoor(x, y, z, entering = true) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 3, 1.0);
    pn.connect(this.sfx);
    this._noiseBurst(t, { type: 'bandpass', f: 2400, q: 2.5, a: 0.001, d: 0.03, gain: 0.3, dest: pn });
    const at = t + (entering ? 0.45 : 0.25);
    this._tone(at, { f: 110, fEnd: 60, a: 0.002, d: 0.18, gain: 0.6, dest: pn });
    this._noiseBurst(at, { buf: this.brown, type: 'lowpass', f: 700, a: 0.001, d: 0.12, gain: 1.0, dest: pn });
    this._noiseBurst(at + 0.02, { type: 'bandpass', f: 1600, q: 3, a: 0.001, d: 0.04, gain: 0.3, dest: pn });
  }

  hoodSlam(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._panner(x, y, z, 4, 0.9);
    pn.connect(this.sfx);
    const rs = this._gain(0.5);
    pn.connect(rs);
    rs.connect(this.revSend);
    this._tone(t, { f: 140, fEnd: 70, a: 0.002, d: 0.3, gain: 0.8, dest: pn });
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 1100, a: 0.001, d: 0.2, gain: 1.3, dest: pn });
    [520, 860, 1330].forEach((f) => this._tone(t, { f, a: 0.001, d: 0.3, gain: 0.04, dest: pn }));
  }

  // the starter: with a battery it drags the engine round (on and on, until you let go); without, the
  // solenoid just clicks. Returns { stop(fade) }
  uazCrank(x, y, z, battery = true) {
    if (!this.ready) return null;
    const t = this.now;
    const pn = this._far(x, y, z, 4, 0.8, 0.35);
    this._noiseBurst(t, { type: 'highpass', f: 3200, a: 0.001, d: 0.025, gain: 0.35, dest: pn }); // the key
    if (!battery) {
      for (let i = 0; i < 3; i++) this._noiseBurst(t + 0.1 + i * 0.22, { type: 'bandpass', f: 2100, q: 4, a: 0.0006, d: 0.025, gain: 0.3, dest: pn });
      return { stop() {} };
    }
    const out = this._gain(1);
    out.connect(pn);
    const st = this._osc('sawtooth', 210);
    const sbp = this._filter('bandpass', 1300, 1.4);
    const sg = this._gain(0);
    st.connect(sbp).connect(sg).connect(out);
    sg.gain.setValueAtTime(0.0001, t + 0.06);
    sg.gain.linearRampToValueAtTime(0.09, t + 0.12);
    const end = t + 12;
    for (let tt = t + 0.08; tt < end; tt += 0.17) {
      st.frequency.setValueAtTime(235, tt);
      st.frequency.linearRampToValueAtTime(160, tt + 0.11);
      st.frequency.linearRampToValueAtTime(235, tt + 0.17);
    }
    // each compression: a cough through the dry pipe
    const thumps = [];
    for (let tt = t + 0.16; tt < t + 6; tt += 0.17) thumps.push(this._noiseBurst(tt, { buf: this.brown, type: 'lowpass', f: 240, a: 0.01, d: 0.09, gain: 0.7, dest: out }));
    st.start(t + 0.06);
    st.stop(end);
    let stopped = false;
    return {
      stop: (fade = 0.12) => {
        if (stopped) return;
        stopped = true;
        const n = this.now;
        out.gain.cancelScheduledValues(n);
        out.gain.setValueAtTime(out.gain.value, n);
        out.gain.linearRampToValueAtTime(0.0001, n + fade);
        try { st.stop(n + fade + 0.05); } catch { /* */ }
      },
    };
  }

  // it catches: a bang through the pipe, a rev, then a lumpy idle — in the world, where the car is.
  // { stop(fade), rev(k 0..1, pos) } — rev: the engine's pitch, and where it is now (it drives away)
  uazStart(x, y, z) {
    if (!this.ready) return null;
    const t = this.now;
    const pn = this._far(x, y, z, 5, 0.75, 0.3);
    const out = this._gain(1);
    out.connect(pn);
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 520, a: 0.004, d: 0.3, gain: 1.4, dest: out });
    const eng = this._gain(0);
    const lp = this._filter('lowpass', 520, 0.9);
    const sh = this._shaper(this.distSoft);
    const post = this._gain(0.13);
    eng.connect(sh).connect(lp).connect(post).connect(out);
    const f = (rpm) => rpm / 30;
    const o1 = this._osc('sawtooth', f(500));
    const o2 = this._osc('square', f(500) / 2);
    const o2g = this._gain(0.55);
    o1.connect(eng);
    o2.connect(o2g).connect(eng);
    const ex = this._noise(this.pink);
    const exg = this._gain(0);
    const am = this._osc('sine', f(500));
    const amg = this._gain(0.5);
    am.connect(amg).connect(exg.gain);
    const exlp = this._filter('lowpass', 650, 0.8);
    const exo = this._gain(0.4);
    ex.connect(exg).connect(exlp).connect(exo).connect(eng);
    const revs = [[0.12, 1400], [0.38, 2300], [0.75, 1500], [1.5, 900], [2.4, 840]];
    for (const p of [o1.frequency, am.frequency]) {
      p.setValueAtTime(f(500), t);
      for (const [dt, rpm] of revs) p.exponentialRampToValueAtTime(f(rpm), t + dt);
    }
    o2.frequency.setValueAtTime(f(500) / 2, t);
    for (const [dt, rpm] of revs) o2.frequency.exponentialRampToValueAtTime(f(rpm) / 2, t + dt);
    lp.frequency.setValueAtTime(380, t);
    lp.frequency.linearRampToValueAtTime(1300, t + 0.38);
    lp.frequency.linearRampToValueAtTime(560, t + 1.6);
    eng.gain.setValueAtTime(0.0001, t);
    eng.gain.linearRampToValueAtTime(1.2, t + 0.08);
    eng.gain.linearRampToValueAtTime(0.65, t + 0.45);
    eng.gain.linearRampToValueAtTime(0.32, t + 1.9);
    const srcs = [o1, o2, ex, am];
    for (const s of srcs) s.start(t);
    let stopped = false;
    let lastK = -1;
    return {
      rev: (k, pos) => {
        if (stopped) return;
        const n = this.now;
        if (Math.abs(k - lastK) > 0.01) {
          lastK = k;
          const rpm = 840 + 3400 * k;
          o1.frequency.setTargetAtTime(f(rpm), n, 0.12);
          am.frequency.setTargetAtTime(f(rpm), n, 0.12);
          o2.frequency.setTargetAtTime(f(rpm) / 2, n, 0.12);
          lp.frequency.setTargetAtTime(560 + 1500 * k, n, 0.15);
          eng.gain.setTargetAtTime(0.32 + 0.55 * k, n, 0.15);
        }
        if (pos && pn.positionX) {
          pn.positionX.setTargetAtTime(pos.x, n, 0.03);
          pn.positionY.setTargetAtTime(pos.y + 0.8, n, 0.03);
          pn.positionZ.setTargetAtTime(pos.z, n, 0.03);
        }
      },
      stop: (fade = 1) => {
        if (stopped) return;
        stopped = true;
        const n = this.now;
        out.gain.cancelScheduledValues(n);
        out.gain.setValueAtTime(out.gain.value, n);
        out.gain.linearRampToValueAtTime(0.0001, n + fade);
        for (const s of srcs) {
          try { s.stop(n + fade + 0.05); } catch { /* */ }
        }
      },
    };
  }

  // the УАЗ through the chained back gate: the chain snaps, the leaves bang open, wire rattles
  gateCrash(x, y, z) {
    if (!this.ready) return;
    const t = this.now;
    const pn = this._far(x, y, z, 6, 0.7, 0.9);
    this._tone(t, { f: 80, fEnd: 40, a: 0.002, d: 0.45, gain: 1.2, dest: pn });
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 1200, a: 0.001, d: 0.3, gain: 2.0, dest: pn });
    for (let i = 0; i < 10; i++) this._noiseBurst(t + 0.01 + i * (0.02 + Math.random() * 0.03), { type: 'bandpass', f: 1500 + Math.random() * 3500, q: 4, a: 0.0006, d: 0.04 + Math.random() * 0.05, gain: 0.7, dest: pn });
    [[0.0, 2900], [0.03, 3700]].forEach(([d, f]) => this._tone(t + d, { f, a: 0.0005, d: 0.25, gain: 0.08, dest: pn })); // the chain
    for (let i = 0; i < 14; i++) this._noiseBurst(t + 0.15 + i * 0.05, { type: 'bandpass', f: 2600 + Math.random() * 2000, q: 6, a: 0.001, d: 0.03, gain: 0.25 * (1 - i / 15), dest: pn });
    this._noiseBurst(t + 0.35, { buf: this.brown, type: 'lowpass', f: 600, a: 0.002, d: 0.3, gain: 1.0, dest: pn }); // a leaf slams round
    this._noiseBurst(t + 0.5, { buf: this.brown, type: 'lowpass', f: 600, a: 0.002, d: 0.25, gain: 0.7, dest: pn });
  }

  // a car on the highway, going by (far: a hiss of tyres and an engine note that drops as it passes)
  carPass(x, y, z, dir, v) {
    if (!this.ready) return;
    const t = this.now;
    const dur = 80 / v;
    const pn = this._panner(x, y, z, 14, 1.0);
    pn.connect(this.amb);
    if (pn.positionX) {
      pn.positionX.setValueAtTime(x, t);
      pn.positionX.linearRampToValueAtTime(x + dir * v * dur, t + dur);
    }
    const g = this._gain(0);
    g.connect(pn);
    const n = this._noise(this.pink);
    const bp = this._filter('bandpass', 900, 0.7);
    n.connect(bp).connect(g);
    const o = this._osc('sawtooth', 95);
    const olp = this._filter('lowpass', 400, 1);
    const og = this._gain(0.25);
    o.connect(olp).connect(og).connect(g);
    o.frequency.setValueAtTime(102, t);
    o.frequency.linearRampToValueAtTime(102, t + dur * 0.45);
    o.frequency.linearRampToValueAtTime(84, t + dur * 0.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5, t + dur * 0.48);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    n.start(t, Math.random() * 2);
    o.start(t);
    n.stop(t + dur + 0.1);
    o.stop(t + dur + 0.1);
  }

  // out on the highway: a long warm chord that finally resolves
  escapeChord() {
    if (!this.ready) return;
    const t = this.now;
    [196, 246.9, 293.7, 392, 493.9].forEach((f, i) => this._tone(t + i * 0.12, { type: 'triangle', f, a: 1.4, d: 5.5, hold: 1.5, gain: 0.04, dest: this.body, rev: 0.8 }));
    this._tone(t + 2.2, { type: 'sine', f: 587.3, a: 1.2, d: 4, hold: 1, gain: 0.025, dest: this.body, rev: 0.9 });
  }

  // ---------- the garage (co-op lobby) ----------
  // its own buses straight to the master: the menu isn't "paused", but the garage shouldn't go through the
  // night's stun/duck either. Transient garage sounds feed the mic's self-gate (the engine isn't your voice).
  _gbus() {
    if (this.gSfx || !this.ctx) return;
    const ctx = this.ctx;
    this.gAmbBus = this._gain(0);
    this.gAmbBus.connect(this.master);
    this.gSfx = this._gain(0.9);
    this.gSfx.connect(this.master);
    if (this.gateAnalyser) this.gSfx.connect(this.gateAnalyser);
    this.gRev = ctx.createConvolver();
    this.gRev.buffer = makeIR(ctx, 0.9, 3.4); // a small concrete box
    this.gRevSend = this._gain(1);
    const out = this._gain(0.45);
    this.gRevSend.connect(this.gRev);
    this.gRev.connect(out);
    out.connect(this.gSfx);
  }

  // rain on the tin roof, wind in the gap of the wicket door, the bulb's hum, now and then a drip
  garageAmb(on) {
    if (!this.ctx) return;
    this._gbus();
    const t = this.now;
    const g = this.gAmbBus.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(on ? 1 : 0, t + (on ? 1.2 : 0.4));
    clearTimeout(this._gAmbOff);
    if (!on) {
      this._gAmbOff = setTimeout(() => this._garageAmbStop(), 700);
      return;
    }
    if (this._gAmb) return;
    const ctx = this.ctx;
    const nodes = [];
    const keep = (n) => (nodes.push(n), n);
    // rain: pink noise, the roof's ring, a slow swell
    const rain = keep(this._noise(this.pink));
    const hp = this._filter('highpass', 700, 0.7);
    const pk = this._filter('peaking', 3600, 0.8);
    pk.gain.value = 6;
    const rg = this._gain(0.03);
    const lfo = keep(this._osc('sine', 0.11));
    const lg = this._gain(0.008);
    lfo.connect(lg).connect(rg.gain);
    rain.connect(hp).connect(pk).connect(rg).connect(this.gAmbBus);
    // drips and ticks on the roof: a pre-rendered loop
    const len = Math.floor(ctx.sampleRate * 6);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let k = 0; k < 150; k++) {
      const at = Math.floor(Math.random() * (len - 2000));
      const a = 0.05 + Math.random() * 0.25;
      for (let i = 0; i < 300; i++) d[at + i] += (Math.random() * 2 - 1) * a * Math.exp(-i / 40);
    }
    for (let k = 0; k < 3; k++) {
      // a fat drop into a puddle by the gate
      const at = Math.floor(Math.random() * (len - 9000));
      const f = 900 + Math.random() * 700;
      for (let i = 0; i < 8000; i++) {
        const tt = i / ctx.sampleRate;
        d[at + i] += Math.sin(2 * Math.PI * f * tt * (1 + tt * 3)) * 0.35 * Math.exp(-tt * 28);
      }
    }
    const drips = keep(ctx.createBufferSource());
    drips.buffer = buf;
    drips.loop = true;
    const dbp = this._filter('bandpass', 2600, 0.6);
    const dg = this._gain(0.07);
    drips.connect(dbp).connect(dg).connect(this.gAmbBus);
    const dr = this._gain(0.25);
    dg.connect(dr).connect(this.gRevSend);
    // wind through the gap
    const wind = keep(this._noise(this.brown));
    const wbp = this._filter('bandpass', 380, 0.9);
    const wlfo = keep(this._osc('sine', 0.07));
    const wl = this._gain(160);
    wlfo.connect(wl).connect(wbp.frequency);
    const wg = this._gain(0.04);
    const wlfo2 = keep(this._osc('sine', 0.045));
    const wl2 = this._gain(0.02);
    wlfo2.connect(wl2).connect(wg.gain);
    wind.connect(wbp).connect(wg).connect(this.gAmbBus);
    // the bulb: mains hum and a filament buzz
    const h1 = keep(this._osc('sine', 100));
    const h1g = this._gain(0.006);
    h1.connect(h1g).connect(this.gAmbBus);
    const bz = keep(this._osc('sawtooth', 100));
    const bbp = this._filter('bandpass', 2400, 6);
    const bg = this._gain(0.0025);
    bz.connect(bbp).connect(bg).connect(this.gAmbBus);
    for (const n of nodes) {
      try { n.start(t, n.buffer && n.loop && n !== drips ? Math.random() * 1.5 : 0); } catch { n.start(t); }
    }
    this._gAmb = nodes;
  }

  _garageAmbStop() {
    if (!this._gAmb) return;
    for (const n of this._gAmb) {
      try { n.stop(); } catch { /* */ }
    }
    this._gAmb = null;
  }

  // far-off thunder, after the gap and the window flash
  garageThunder() {
    if (!this.ready) return;
    this._gbus();
    const t = this.now;
    const n = this._noise(this.brown);
    const lp = this._filter('lowpass', 150, 0.8);
    lp.frequency.setValueAtTime(420, t);
    lp.frequency.exponentialRampToValueAtTime(110, t + 3.5);
    const g = this._gain(0);
    n.connect(lp).connect(g).connect(this.gSfx);
    this._env(g, t, 0.35, 0.38, 3.6, 0.3);
    n.start(t, Math.random() * 2);
    n.stop(t + 4.5);
    for (let i = 0; i < 3; i++) this._noiseBurst(t + 0.05 + Math.random() * 0.5, { buf: this.brown, type: 'lowpass', f: 700, a: 0.01, d: 0.4, gain: 0.25, dest: this.gSfx });
  }

  // something heavy walks past outside, on wet gravel, left to right (or back)
  garageSteps(dur, dir = 1) {
    if (!this.ready) return;
    this._gbus();
    const t = this.now;
    const pan = this._stereo(-0.8 * dir);
    pan.pan.linearRampToValueAtTime(0.8 * dir, t + dur);
    const wall = this._filter('lowpass', 650, 0.7); // through the blocks
    const g = this._gain(0.9);
    wall.connect(g).connect(pan).connect(this.gSfx);
    const n = Math.max(3, Math.round(dur / 0.95));
    for (let i = 0; i < n; i++) {
      const at = t + 0.2 + i * (dur / n) + Math.random() * 0.08;
      const near = 1 - Math.abs(i / (n - 1) - 0.5) * 1.2;
      this._noiseBurst(at, { buf: this.brown, type: 'lowpass', f: 260, a: 0.006, d: 0.22, gain: 0.5 * near, dest: wall });
      this._noiseBurst(at + 0.01, { type: 'bandpass', f: 1600 + Math.random() * 600, q: 1.2, a: 0.004, d: 0.12, gain: 0.12 * near, dest: wall });
    }
    // halfway, by the window: a long, low breath out
    this._noiseBurst(t + dur * 0.5, { buf: this.brown, type: 'bandpass', f: 380, q: 1.5, a: 0.5, d: 0.9, hold: 0.2, gain: 0.35, dest: wall });
  }

  // the УАЗ: key, starter, a cough, it catches, revs and settles into a lumpy idle. Returns { stop(fade) }
  carStart() {
    if (!this.ready) return null;
    this._gbus();
    const ctx = this.ctx;
    const t = this.now;
    const out = this._gain(1);
    out.connect(this.gSfx);
    const rs = this._gain(0.35);
    out.connect(rs).connect(this.gRevSend);
    // the key, the solenoid
    this._noiseBurst(t, { type: 'highpass', f: 3200, a: 0.001, d: 0.025, gain: 0.3, dest: out });
    this._tone(t, { f: 2700, a: 0.001, d: 0.04, gain: 0.04, dest: out });
    this._noiseBurst(t + 0.06, { buf: this.brown, type: 'lowpass', f: 700, a: 0.002, d: 0.06, gain: 0.6, dest: out });
    // the starter dragging the engine round: a whine that sags on each compression
    const ts = t + 0.08, te = t + 0.9;
    const st = this._osc('sawtooth', 210);
    const sbp = this._filter('bandpass', 1300, 1.4);
    const sg = this._gain(0);
    st.connect(sbp).connect(sg).connect(out);
    sg.gain.setValueAtTime(0.0001, ts);
    sg.gain.linearRampToValueAtTime(0.07, ts + 0.05);
    sg.gain.setValueAtTime(0.07, te - 0.05);
    sg.gain.linearRampToValueAtTime(0.0001, te + 0.03);
    for (let k = 0, tt = ts; tt < te; k++, tt += 0.15) {
      st.frequency.setValueAtTime(235, tt);
      st.frequency.linearRampToValueAtTime(165, tt + 0.1);
      st.frequency.linearRampToValueAtTime(235, tt + 0.15);
      this._noiseBurst(tt + 0.08, { buf: this.brown, type: 'lowpass', f: 240, a: 0.01, d: 0.09, gain: 0.55, dest: out });
    }
    st.start(ts);
    st.stop(te + 0.1);
    // it catches: a bang through the pipe, then the engine's own voice
    const tc = t + 0.9;
    this._noiseBurst(tc, { buf: this.brown, type: 'lowpass', f: 520, a: 0.004, d: 0.3, gain: 1.1, dest: out });
    const eng = this._gain(0);
    const lp = this._filter('lowpass', 500, 0.9);
    const sh = this._shaper(this.distSoft);
    const post = this._gain(0.1); // (the shaper runs hot; this sets the level)
    eng.connect(sh).connect(lp).connect(post).connect(out);
    const f = (rpm) => rpm / 30; // four cylinders: two firings per revolution
    const o1 = this._osc('sawtooth', f(500));
    const o2 = this._osc('square', f(500) / 2);
    const o2g = this._gain(0.55);
    o1.connect(eng);
    o2.connect(o2g).connect(eng);
    // the exhaust: noise chopped by the firing
    const ex = this._noise(this.pink);
    const exg = this._gain(0);
    const am = this._osc('sine', f(500));
    const amg = this._gain(0.5);
    am.connect(amg).connect(exg.gain);
    const exlp = this._filter('lowpass', 600, 0.8);
    const exo = this._gain(0.35);
    ex.connect(exg).connect(exlp).connect(exo).connect(eng);
    const rev = [[0, 500], [0.12, 1300], [0.38, 2250], [0.7, 1500], [1.5, 900], [2.4, 830]];
    for (const p of [o1.frequency, am.frequency]) {
      p.setValueAtTime(f(500), tc);
      for (const [dt, rpm] of rev.slice(1)) p.exponentialRampToValueAtTime(f(rpm), tc + dt);
    }
    o2.frequency.setValueAtTime(f(500) / 2, tc);
    for (const [dt, rpm] of rev.slice(1)) o2.frequency.exponentialRampToValueAtTime(f(rpm) / 2, tc + dt);
    lp.frequency.setValueAtTime(380, tc);
    lp.frequency.linearRampToValueAtTime(1300, tc + 0.38);
    lp.frequency.linearRampToValueAtTime(520, tc + 1.6);
    eng.gain.setValueAtTime(0.0001, tc);
    eng.gain.linearRampToValueAtTime(1.2, tc + 0.08);
    eng.gain.linearRampToValueAtTime(0.6, tc + 0.45);
    eng.gain.linearRampToValueAtTime(0.1, tc + 1.9);
    // a lumpy idle: the revs hunt a little
    for (let tt = tc + 2.5; tt < tc + 30; tt += 0.35 + Math.random() * 0.3) {
      const r = f(830 * (0.96 + Math.random() * 0.08));
      o1.frequency.linearRampToValueAtTime(r, tt);
      am.frequency.linearRampToValueAtTime(r, tt);
      o2.frequency.linearRampToValueAtTime(r / 2, tt);
    }
    // valve tick
    const tick = this._noise(this.white);
    const tg = this._gain(0);
    const tam = this._osc('square', f(830) * 2);
    const tamg = this._gain(0.004);
    tam.connect(tamg).connect(tg.gain);
    const thp = this._filter('highpass', 4000, 0.7);
    tick.connect(thp).connect(tg).connect(out);
    const nodes = [o1, o2, ex, am, tick, tam];
    for (const n of nodes) n.start(tc);
    let stopped = false;
    return {
      stop: (fade = 1) => {
        if (stopped) return;
        stopped = true;
        const n = this.now;
        out.gain.cancelScheduledValues(n);
        out.gain.setValueAtTime(out.gain.value, n);
        out.gain.linearRampToValueAtTime(0.0001, n + fade);
        for (const x of nodes) {
          try { x.stop(Math.max(n, tc) + fade + 0.05); } catch { /* */ }
        }
        try { st.stop(n + 0.05); } catch { /* */ }
        if (!this.offline) setTimeout(() => { try { out.disconnect(); } catch { /* */ } }, (fade + 0.3) * 1000);
      },
    };
  }

  // two notes of an old Soviet horn: "come on, get in"
  carHorn(second = false) {
    if (!this.ready) return;
    this._gbus();
    const t = this.now;
    const mix = this._gain(0);
    const bp = this._filter('bandpass', 950, 0.9);
    const sh = this._shaper(this.distSoft);
    const post = this._gain(0.45);
    mix.connect(sh).connect(bp).connect(post).connect(this.gSfx);
    const rs = this._gain(0.5);
    post.connect(rs).connect(this.gRevSend);
    for (const fq of [405, 508]) {
      const o = this._osc('sawtooth', fq * (second ? 0.995 : 1));
      o.connect(mix);
      o.start(t);
      o.stop(t + 0.4);
    }
    this._env(mix, t, 0.012, 0.22, 0.06, second ? 0.22 : 0.11);
  }

  // a petrol lighter: the lid, the wheel, the flame catching, the lid shut
  lighter() {
    if (!this.ready) return;
    this._gbus();
    const t = this.now;
    this._tone(t, { f: 3300, a: 0.001, d: 0.09, gain: 0.025, dest: this.gSfx });
    this._tone(t, { f: 4150, a: 0.001, d: 0.07, gain: 0.018, dest: this.gSfx });
    this._noiseBurst(t + 0.28, { type: 'bandpass', f: 2600, q: 1.5, a: 0.002, d: 0.05, gain: 0.18, dest: this.gSfx });
    this._noiseBurst(t + 0.3, { type: 'lowpass', f: 1300, a: 0.06, d: 0.4, gain: 0.07, dest: this.gSfx });
    this._noiseBurst(t + 1.25, { type: 'bandpass', f: 1900, q: 2, a: 0.002, d: 0.04, gain: 0.12, dest: this.gSfx });
    this._tone(t + 1.25, { f: 2500, a: 0.001, d: 0.05, gain: 0.02, dest: this.gSfx });
  }

  // a rucksack's zip, tooth by tooth
  zipper(fast = false) {
    if (!this.ready) return;
    this._gbus();
    const t = this.now;
    const dur = fast ? 0.28 : 0.5;
    const n = fast ? 16 : 26;
    for (let i = 0; i < n; i++) {
      const at = t + dur * Math.pow(i / n, 0.8);
      this._noiseBurst(at, { type: 'highpass', f: 2600, a: 0.0008, d: 0.007, gain: 0.07, dest: this.gSfx });
    }
    this._noiseBurst(t, { type: 'bandpass', f: 3400, fEnd: 4600, q: 2, a: 0.04, d: 0.12, hold: dur - 0.1, gain: 0.03, dest: this.gSfx });
  }

  // a rucksack set down on concrete
  softThud() {
    if (!this.ready) return;
    this._gbus();
    const t = this.now;
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 240, a: 0.003, d: 0.14, gain: 0.9, dest: this.gSfx });
    this._noiseBurst(t, { type: 'bandpass', f: 1300, q: 0.8, a: 0.004, d: 0.16, gain: 0.08, dest: this.gSfx });
  }

  // someone takes their place: a step, a breath of the echo
  garageArrive() {
    if (!this.ready) return;
    this._gbus();
    const t = this.now;
    this._noiseBurst(t, { buf: this.brown, type: 'lowpass', f: 300, a: 0.004, d: 0.1, gain: 0.25, dest: this.gSfx });
    this._tone(t + 0.04, { f: 1320, fEnd: 1290, a: 0.004, d: 0.7, gain: 0.018, dest: this.gSfx, rev: 0 });
    const g = this._gain(0.4);
    const o = this._osc('sine', 1320);
    o.connect(g).connect(this.gRevSend);
    this._env(g, t + 0.04, 0.004, 0.02, 0.5);
    o.start(t + 0.04);
    o.stop(t + 0.7);
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
