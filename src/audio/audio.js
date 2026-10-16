// ============================================================
// AUDIO — 100% procedural WebAudio. Wind, drone, birds, sonar pings with
// distance-delayed returns, monster voices, heartbeat, jumpscares.
// Nothing is routed to the destination from the mic (no feedback).
// ============================================================
import { clamp, lerp, TAU } from '../core/util.js';

export class AudioEngine {
  constructor() {
    this.ok = false;
    this.master = null;
    this.vol = 0.85;
    this.listener = { x: 0, z: 0, yaw: 0 };
    this.phase = 0;          // 0 day .. 1 night
    this.threat = 0;
    this._lastStep = 0;
    this._hb = 0;
    this.enabled = true;
  }

  async init() {
    if (this.ok) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC({ latencyHint: 'interactive' });
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      const c = this.ctx;

      this.master = c.createGain();
      this.master.gain.value = this.vol;
      this.limiter = c.createDynamicsCompressor();
      this.limiter.threshold.value = -8;
      this.limiter.knee.value = 6;
      this.limiter.ratio.value = 12;
      this.limiter.attack.value = 0.003;
      this.limiter.release.value = 0.18;
      this.master.connect(this.limiter);
      this.limiter.connect(c.destination);

      // reverb bus (procedural impulse response — a dark forest slap)
      this.revSend = c.createGain();
      this.revSend.gain.value = 1;
      this.conv = c.createConvolver();
      this.conv.buffer = this.makeIR(2.6, 2.4, 0.42);
      this.revOut = c.createGain();
      this.revOut.gain.value = 0.5;
      const revLP = c.createBiquadFilter();
      revLP.type = 'lowpass'; revLP.frequency.value = 2600;
      this.revSend.connect(this.conv);
      this.conv.connect(revLP);
      revLP.connect(this.revOut);
      this.revOut.connect(this.master);

      this.noiseBuf = this.makeNoise(3.2);
      this.brownBuf = this.makeBrown(6.0);

      this.buildAmbience();
      this.ok = true;
      return true;
    } catch (e) {
      console.warn('[audio] init failed', e);
      this.ok = false;
      return false;
    }
  }

  makeIR(dur, decay, dark) {
    const c = this.ctx, rate = c.sampleRate, len = Math.floor(rate * dur);
    const buf = c.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (1 - dark * t);
      }
      // early reflections
      for (let k = 0; k < 7; k++) {
        const p = Math.floor(rate * (0.012 + k * 0.021 + Math.random() * 0.006));
        if (p < len) d[p] += (Math.random() * 2 - 1) * 0.42 * (1 - k / 8);
      }
    }
    return buf;
  }
  makeNoise(dur) {
    const c = this.ctx, len = Math.floor(c.sampleRate * dur);
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  makeBrown(dur) {
    const c = this.ctx, len = Math.floor(c.sampleRate * dur);
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    return b;
  }

  // -------------------------------------------------------------- helpers
  get t() { return this.ctx ? this.ctx.currentTime : 0; }
  out(node, gain = 1, pan = 0, rev = 0) {
    const c = this.ctx;
    const g = c.createGain(); g.gain.value = gain;
    node.connect(g);
    let tail = g;
    if (Math.abs(pan) > 0.001) { const p = c.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); tail = p; }
    tail.connect(this.master);
    if (rev > 0) { const r = c.createGain(); r.gain.value = rev; tail.connect(r); r.connect(this.revSend); }
    return g;
  }
  /** 3D placement from a world position: returns {gain, pan} */
  spatial(x, z, refDist = 1, maxDist = 90) {
    const dx = x - this.listener.x, dz = z - this.listener.z;
    const d = Math.hypot(dx, dz);
    const g = clamp(1 - d / maxDist, 0, 1);
    // angle relative to where we look: forward is (-sin yaw, -cos yaw)
    const fx = -Math.sin(this.listener.yaw), fz = -Math.cos(this.listener.yaw);
    const rx = fz, rz = -fx;                       // right vector
    const nd = d || 1;
    const pan = clamp(((dx / nd) * rx + (dz / nd) * rz) * 1.25, -1, 1);
    return { gain: Math.pow(g, 1.5) / (1 + d * refDist * 0.06), pan, d };
  }
  noise(dur = 0.2) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    s.playbackRate.value = 0.8 + Math.random() * 0.5;
    return s;
  }
  env(param, t0, peak, attack, decay, curve = 'exponential') {
    param.cancelScheduledValues(t0);
    param.setValueAtTime(0.0001, t0);
    if (curve === 'exponential') {
      param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + attack);
      param.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    } else {
      param.linearRampToValueAtTime(peak, t0 + attack);
      param.linearRampToValueAtTime(0.0001, t0 + attack + decay);
    }
  }
  tone(freq, dur, type = 'sine', gain = 0.2, opts = {}) {
    if (!this.ok || !this.enabled) return;
    const c = this.ctx, t = this.t + (opts.delay || 0);
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + (opts.sweepT || dur));
    if (opts.detune) o.detune.value = opts.detune;
    const g = c.createGain();
    this.env(g.gain, t, gain, opts.attack || 0.006, dur, opts.linear ? 'linear' : 'exponential');
    o.connect(g);
    let node = g;
    if (opts.filter) {
      const f = c.createBiquadFilter();
      f.type = opts.filter.type || 'lowpass';
      f.frequency.setValueAtTime(opts.filter.f0 || 800, t);
      if (opts.filter.f1) f.frequency.exponentialRampToValueAtTime(opts.filter.f1, t + dur);
      f.Q.value = opts.filter.q || 1;
      g.connect(f); node = f;
    }
    const pan = c.createStereoPanner();
    pan.pan.value = clamp(opts.pan || 0, -1, 1);
    node.connect(pan);
    const mg = c.createGain(); mg.gain.value = opts.vol ?? 1;
    pan.connect(mg); mg.connect(this.master);
    if (opts.rev) { const r = c.createGain(); r.gain.value = opts.rev; mg.connect(r); r.connect(this.revSend); }
    o.start(t); o.stop(t + dur + (opts.attack || 0.006) + 0.08);
    return o;
  }
  noiseHit(dur = 0.2, gain = 0.2, opts = {}) {
    if (!this.ok || !this.enabled) return;
    const c = this.ctx, t = this.t + (opts.delay || 0);
    const s = this.noise(dur);
    const f = c.createBiquadFilter();
    f.type = opts.type || 'bandpass';
    f.frequency.setValueAtTime(opts.f0 || 900, t);
    if (opts.f1) f.frequency.exponentialRampToValueAtTime(Math.max(60, opts.f1), t + dur);
    f.Q.value = opts.q ?? 1.2;
    const g = c.createGain();
    this.env(g.gain, t, gain, opts.attack || 0.004, dur, opts.linear ? 'linear' : 'exponential');
    s.connect(f); f.connect(g);
    const pan = c.createStereoPanner(); pan.pan.value = clamp(opts.pan || 0, -1, 1);
    g.connect(pan);
    const mg = c.createGain(); mg.gain.value = opts.vol ?? 1;
    pan.connect(mg); mg.connect(this.master);
    if (opts.rev) { const r = c.createGain(); r.gain.value = opts.rev; mg.connect(r); r.connect(this.revSend); }
    s.start(t); s.stop(t + dur + 0.1);
  }

  // -------------------------------------------------------------- ambience
  buildAmbience() {
    const c = this.ctx;
    this.ambGain = c.createGain(); this.ambGain.gain.value = 1; this.ambGain.connect(this.master);

    // wind
    const wind = c.createBufferSource(); wind.buffer = this.brownBuf; wind.loop = true;
    const wlp = c.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 420; wlp.Q.value = 0.7;
    this.windGain = c.createGain(); this.windGain.gain.value = 0.12;
    wind.connect(wlp); wlp.connect(this.windGain); this.windGain.connect(this.ambGain);
    const wlfo = c.createOscillator(); wlfo.frequency.value = 0.07;
    const wlfoG = c.createGain(); wlfoG.gain.value = 0.07;
    wlfo.connect(wlfoG); wlfoG.connect(this.windGain.gain);
    const wlfo2 = c.createOscillator(); wlfo2.frequency.value = 0.031;
    const wlfo2G = c.createGain(); wlfo2G.gain.value = 180;
    wlfo2.connect(wlfo2G); wlfo2G.connect(wlp.frequency);
    wind.start(); wlfo.start(); wlfo2.start();

    // high air hiss (night presence)
    const air = c.createBufferSource(); air.buffer = this.noiseBuf; air.loop = true;
    const ahf = c.createBiquadFilter(); ahf.type = 'highpass'; ahf.frequency.value = 3200;
    this.airGain = c.createGain(); this.airGain.gain.value = 0.0;
    air.connect(ahf); ahf.connect(this.airGain); this.airGain.connect(this.ambGain);
    air.start();

    // night drone: detuned sub oscillators
    this.droneGain = c.createGain(); this.droneGain.gain.value = 0;
    const dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 220;
    this.droneGain.connect(dlp); dlp.connect(this.ambGain);
    this.drones = [];
    for (const [f, type, g] of [[41, 'sine', 0.5], [55.5, 'sine', 0.36], [61.7, 'triangle', 0.16], [82.5, 'sine', 0.12]]) {
      const o = c.createOscillator(); o.type = type; o.frequency.value = f;
      const og = c.createGain(); og.gain.value = g;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.03 + Math.random() * 0.09;
      const lg = c.createGain(); lg.gain.value = f * 0.006;
      lfo.connect(lg); lg.connect(o.frequency);
      o.connect(og); og.connect(this.droneGain);
      o.start(); lfo.start();
      this.drones.push(o);
    }

    // crickets / night insects
    this.insectGain = c.createGain(); this.insectGain.gain.value = 0;
    const ibp = c.createBiquadFilter(); ibp.type = 'bandpass'; ibp.frequency.value = 4300; ibp.Q.value = 9;
    const isrc = c.createBufferSource(); isrc.buffer = this.noiseBuf; isrc.loop = true;
    const iam = c.createGain(); iam.gain.value = 0.5;
    const iamLfo = c.createOscillator(); iamLfo.type = 'square'; iamLfo.frequency.value = 13.5;
    const iamG = c.createGain(); iamG.gain.value = 0.5;
    iamLfo.connect(iamG); iamG.connect(iam.gain);
    isrc.connect(ibp); ibp.connect(iam); iam.connect(this.insectGain); this.insectGain.connect(this.ambGain);
    isrc.start(); iamLfo.start();

    this.birdTimer = 0;
    this.cricketTimer = 0;
  }

  setPhase(skyT, dt) {
    if (!this.ok) return;
    this.phase = skyT;
    const t = this.t;
    this.windGain.gain.setTargetAtTime(lerp(0.075, 0.2, skyT), t, 1.4);
    this.airGain.gain.setTargetAtTime(lerp(0.0, 0.028, skyT), t, 2);
    this.droneGain.gain.setTargetAtTime(lerp(0.0, 0.34, clamp((skyT - 0.35) / 0.5, 0, 1)), t, 2.5);
    this.insectGain.gain.setTargetAtTime(skyT > 0.6 ? 0.05 : 0.0, t, 2);
    this.revOut.gain.setTargetAtTime(lerp(0.36, 0.62, skyT), t, 2);
    // birds by day
    this.birdTimer -= dt;
    if (skyT < 0.42 && this.birdTimer <= 0) {
      this.birdTimer = 0.5 + Math.random() * 2.6;
      this.bird();
    }
    if (skyT > 0.55 && this.cricketTimer <= 0) {
      this.cricketTimer = 2.5 + Math.random() * 5;
      this.creak();
    }
  }

  bird() {
    if (!this.ok) return;
    const n = 2 + (Math.random() * 4 | 0);
    const base = 1500 + Math.random() * 1900;
    const pan = Math.random() * 2 - 1;
    for (let i = 0; i < n; i++) {
      const f = base * (0.85 + Math.random() * 0.4);
      this.tone(f, 0.09, 'sine', 0.045, { delay: i * (0.07 + Math.random() * 0.09), to: f * (1.1 + Math.random() * 0.5), sweepT: 0.07, pan, rev: 0.25, attack: 0.012 });
    }
  }
  creak() {
    const sp = this.spatial((Math.random() - 0.5) * 90, (Math.random() - 0.5) * 90, 1, 95);
    this.noiseHit(0.5, 0.05 * (0.4 + sp.gain), { type: 'bandpass', f0: 700, f1: 240, q: 3.5, pan: sp.pan, rev: 0.4 });
  }

  // -------------------------------------------------------------- gameplay sfx
  setListener(x, z, yaw) { this.listener.x = x; this.listener.z = z; this.listener.yaw = yaw; }

  ping(strength = 0.4) {
    if (!this.ok || !this.enabled) return;
    const s = clamp(strength, 0.05, 1);
    const t = this.t;
    // tongue click
    this.noiseHit(0.035, 0.22 * (0.5 + s), { type: 'highpass', f0: 2200, q: 0.8, rev: 0.15 });
    // sonar sweep
    this.tone(lerp(1500, 780, s), 0.14 + s * 0.2, 'sine', 0.16 + s * 0.14, { to: lerp(420, 190, s), sweepT: 0.16 + s * 0.2, rev: 0.55 });
    this.tone(lerp(760, 400, s), 0.2 + s * 0.24, 'triangle', 0.05, { to: lerp(220, 110, s), rev: 0.5, delay: 0.01 });
    // sub thump for charged pings
    if (s > 0.55) this.tone(62, 0.5, 'sine', 0.24 * (s - 0.4), { to: 34, rev: 0.3 });
  }

  /** A delayed echo return — the sonar made audible. */
  echoReturn(kind, gain, pan, dist) {
    if (!this.ok || !this.enabled) return;
    const g = clamp(gain, 0, 1.4) * 0.11 * clamp(1 - dist / 150, 0.06, 1);
    if (g < 0.004) return;
    switch (kind) {
      case 'monster':
        this.noiseHit(0.16, g * 2.2, { type: 'bandpass', f0: 420, f1: 180, q: 2.2, pan, rev: 0.7 });
        this.tone(150, 0.22, 'sawtooth', g * 0.9, { to: 84, pan, rev: 0.8, filter: { type: 'lowpass', f0: 900, f1: 300 } });
        break;
      case 'player':
        this.tone(880, 0.14, 'sine', g * 1.6, { to: 1180, pan, rev: 0.5 });
        break;
      case 'gen': case 'gen_on':
        this.tone(kind === 'gen_on' ? 620 : 380, 0.2, 'square', g * 1.1, { to: kind === 'gen_on' ? 900 : 300, pan, rev: 0.6, filter: { type: 'lowpass', f0: 2200, f1: 700, q: 3 } });
        break;
      case 'corpse':
        this.noiseHit(0.2, g * 1.5, { type: 'bandpass', f0: 1200, f1: 620, q: 4, pan, rev: 0.7 });
        break;
      case 'stone':
        this.tone(210 + Math.random() * 90, 0.26, 'triangle', g * 1.2, { to: 120, pan, rev: 0.8 });
        break;
      case 'mast': case 'cabin': case 'tent': case 'fire':
        this.tone(300 + Math.random() * 120, 0.24, 'triangle', g * 1.2, { to: 180, pan, rev: 0.7 });
        break;
      default:
        this.noiseHit(0.1, g * 0.9, { type: 'bandpass', f0: 1400 + Math.random() * 2200, f1: 700, q: 6, pan, rev: 0.45 });
    }
  }

  footstep(kind = 1, wet = 0) {
    if (!this.ok || !this.enabled) return;
    const g = kind === 2 ? 0.19 : kind === 0 ? 0.055 : 0.1;
    if (wet > 0.15) {
      this.noiseHit(0.16, g * 1.5, { type: 'bandpass', f0: 1500, f1: 400, q: 1.4, rev: 0.3 });
      this.noiseHit(0.09, g * 0.8, { type: 'highpass', f0: 3000, rev: 0.2, delay: 0.03 });
    } else {
      this.noiseHit(0.09, g, { type: 'lowpass', f0: kind === 2 ? 900 : 620, f1: 180, q: 1.1, rev: 0.18 });
      this.tone(70 + Math.random() * 24, 0.07, 'sine', g * 0.55, { to: 42 });
      if (Math.random() < 0.3) this.noiseHit(0.05, g * 0.3, { type: 'highpass', f0: 3400, delay: 0.02, rev: 0.1 });
    }
  }
  bump(hard = 1) {
    this.tone(90, 0.16, 'sine', 0.22 * hard, { to: 48, rev: 0.25 });
    this.noiseHit(0.12, 0.14 * hard, { type: 'bandpass', f0: 700, f1: 200, q: 1.4, rev: 0.3 });
  }

  heartbeat(level) {
    if (!this.ok || !this.enabled) return;
    const g = 0.1 + level * 0.3;
    this.tone(58, 0.16, 'sine', g, { to: 34, rev: 0.12, filter: { type: 'lowpass', f0: 200 } });
    this.tone(52, 0.2, 'sine', g * 0.7, { to: 30, delay: 0.19, rev: 0.12, filter: { type: 'lowpass', f0: 180 } });
  }

  monsterSound(m, kind, listenerPos) {
    if (!this.ok || !this.enabled) return;
    const sp = this.spatial(m.x, m.z, 1.1, m.type === 'tall' ? 150 : 85);
    if (sp.gain < 0.01 && kind !== 'wail') return;
    const pan = sp.pan, g = sp.gain;
    const t = m.type;
    if (kind === 'wail') {
      this.weeperWail(clamp(g * 1.4 + 0.25, 0.3, 1.3), pan);
      return;
    }
    if (kind === 'lost') {
      // it lost your trail — the most satisfying sound in the game
      if (t === 'whisperer') {
        this.noiseHit(0.5, g * 0.4, { type: 'bandpass', f0: 2400, f1: 640, q: 4.5, pan, rev: 0.9, attack: 0.03 });
        this.tone(230, 0.45, 'sawtooth', g * 0.13, { to: 96, pan, rev: 0.9, filter: { type: 'lowpass', f0: 900, f1: 280 } });
      } else if (t === 'tall') {
        this.tone(41, 1.7, 'sine', g * 0.5, { to: 25, pan, rev: 0.55, attack: 0.22 });
      } else {
        for (let i = 0; i < 3; i++) this.tone(430 + Math.random() * 190, 0.34, 'sine', g * 0.2, { to: 175, delay: i * 0.31, pan, rev: 1.0, attack: 0.06 });
      }
      return;
    }
    if (t === 'whisperer') {
      if (kind === 'idle' || kind === 'search' || kind === 'sniff') {
        for (let i = 0; i < 3; i++) {
          this.noiseHit(0.22, g * 0.5, { type: 'bandpass', f0: 900 + Math.random() * 1400, f1: 500 + Math.random() * 900, q: 7 + Math.random() * 6, pan: pan + (Math.random() - 0.5) * 0.3, delay: i * 0.11, rev: 0.85, attack: 0.05 });
        }
        if (kind === 'search') this.tone(180, 0.5, 'sawtooth', g * 0.16, { to: 120, pan, rev: 0.9, filter: { type: 'lowpass', f0: 700, f1: 260 } });
      } else if (kind === 'growl') {
        this.tone(96, 0.75, 'sawtooth', g * 0.4, { to: 58, pan, rev: 0.8, filter: { type: 'lowpass', f0: 640, f1: 220, q: 6 } });
        this.noiseHit(0.7, g * 0.2, { type: 'bandpass', f0: 420, f1: 200, q: 2, pan, rev: 0.8 });
      } else if (kind === 'step') {
        this.noiseHit(0.1, g * 0.5, { type: 'lowpass', f0: 520, f1: 150, pan, rev: 0.3 });
      }
    } else if (t === 'tall') {
      if (kind === 'rumble') {
        this.tone(33, 2.4, 'sine', g * 0.55, { to: 27, pan, rev: 0.5, attack: 0.4 });
        this.tone(49.5, 2.2, 'triangle', g * 0.2, { to: 41, pan, rev: 0.5, attack: 0.5 });
        this.noiseHit(2.0, g * 0.09, { type: 'lowpass', f0: 180, f1: 90, pan, rev: 0.6, attack: 0.5, linear: true });
      } else if (kind === 'charge') {
        // the Tall One's warning: a rising tectonic groan, ~1.5s before it is on you
        this.tone(30, 1.5, 'sawtooth', g * 0.5, { to: 74, pan, rev: 0.75, attack: 0.12, filter: { type: 'lowpass', f0: 140, f1: 620, q: 5 } });
        this.noiseHit(1.4, g * 0.16, { type: 'bandpass', f0: 120, f1: 900, q: 1.6, pan, rev: 0.8, attack: 0.14, linear: true });
        this.tone(66, 1.3, 'sine', g * 0.22, { to: 120, pan, rev: 0.7, attack: 0.1 });
      } else if (kind === 'bump') {
        this.tone(70, 0.3, 'sine', g * 0.5, { to: 40, pan, rev: 0.5 });
        this.noiseHit(0.35, g * 0.35, { type: 'bandpass', f0: 1200, f1: 300, q: 1.5, pan, rev: 0.6 });
      } else if (kind === 'idle') {
        this.noiseHit(1.2, g * 0.14, { type: 'lowpass', f0: 240, f1: 90, pan, rev: 0.7, attack: 0.4, linear: true });
      }
    } else if (t === 'weeper') {
      if (kind === 'growl' || kind === 'idle' || kind === 'search' || kind === 'sniff') {
        // sobbing
        for (let i = 0; i < 4; i++) {
          this.tone(340 + Math.random() * 220, 0.3, 'sine', g * 0.22, {
            to: 200 + Math.random() * 160, delay: i * 0.34, pan, rev: 1.0, attack: 0.06,
          });
        }
        this.noiseHit(0.9, g * 0.12, { type: 'bandpass', f0: 1800, f1: 700, q: 3, pan, rev: 1.0, attack: 0.2, linear: true });
      } else if (kind === 'step') {
        this.noiseHit(0.08, g * 0.55, { type: 'highpass', f0: 1400, pan, rev: 0.4 });
      }
    }
  }

  weeperWail(level = 1, pan = 0) {
    if (!this.ok || !this.enabled) return;
    const g = 0.16 * level;
    this.tone(420, 2.6, 'sine', g, { to: 1500, sweepT: 1.1, pan, rev: 1.4, attack: 0.28 });
    this.tone(630, 2.4, 'triangle', g * 0.5, { to: 2100, sweepT: 1.2, pan, rev: 1.4, attack: 0.3, delay: 0.05 });
    this.tone(210, 2.8, 'sawtooth', g * 0.35, { to: 720, sweepT: 1.2, pan, rev: 1.2, attack: 0.35, filter: { type: 'lowpass', f0: 900, f1: 3000 } });
    this.noiseHit(2.2, g * 0.5, { type: 'bandpass', f0: 1200, f1: 3200, q: 2.4, pan, rev: 1.5, attack: 0.4, linear: true });
  }

  playerScream(level = 1) {
    if (!this.ok || !this.enabled) return;
    const g = 0.2 * clamp(level, 0.5, 1.6);
    this.tone(520, 0.9, 'sawtooth', g, { to: 180, sweepT: 0.85, rev: 1.2, attack: 0.02, filter: { type: 'lowpass', f0: 2600, f1: 700, q: 3 } });
    this.tone(780, 0.8, 'square', g * 0.35, { to: 260, rev: 1.0, attack: 0.02 });
    this.noiseHit(0.85, g * 0.9, { type: 'bandpass', f0: 1600, f1: 500, q: 1.1, rev: 1.3, attack: 0.02 });
    this.tone(96, 0.7, 'sine', g * 0.7, { to: 48, rev: 0.5 });
  }

  repair(on) {
    if (!this.ok || !this.enabled) return;
    if (on && !this._repairNode) {
      const c = this.ctx;
      const s = this.noise(1);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 3;
      const g = c.createGain(); g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(this.master);
      const r = c.createGain(); r.gain.value = 0.4; g.connect(r); r.connect(this.revSend);
      s.start();
      this._repairNode = { s, g, f };
      g.gain.setTargetAtTime(0.06, this.t, 0.08);
      this._ratchet = setInterval(() => {
        if (!this._repairNode) return;
        this.noiseHit(0.06, 0.12, { type: 'bandpass', f0: 1800 + Math.random() * 900, f1: 700, q: 5, rev: 0.4 });
        this.tone(140 + Math.random() * 60, 0.05, 'square', 0.05, { to: 90 });
      }, 190);
    } else if (!on && this._repairNode) {
      this._repairNode.g.gain.setTargetAtTime(0, this.t, 0.06);
      const n = this._repairNode; this._repairNode = null;
      clearInterval(this._ratchet);
      setTimeout(() => { try { n.s.stop(); } catch (e) {} }, 400);
    }
  }
  spark() {
    this.noiseHit(0.08, 0.13, { type: 'highpass', f0: 3800, rev: 0.3 });
    this.tone(2400 + Math.random() * 1600, 0.05, 'square', 0.03, { to: 900, rev: 0.2 });
  }
  fusePickup() {
    this.tone(680, 0.12, 'square', 0.1, { to: 1180, rev: 0.35, filter: { type: 'lowpass', f0: 3000 } });
    this.tone(1020, 0.2, 'sine', 0.07, { delay: 0.07, rev: 0.4 });
  }
  noteRead() {
    this.noiseHit(0.4, 0.06, { type: 'bandpass', f0: 2600, f1: 900, q: 1.2, rev: 0.5 });
    this.tone(320, 0.5, 'sine', 0.05, { to: 240, rev: 0.6 });
  }
  generatorDone() {
    if (!this.ok || !this.enabled) return;
    this.tone(48, 1.6, 'sine', 0.34, { to: 30, rev: 0.6, attack: 0.01 });
    this.noiseHit(0.7, 0.24, { type: 'lowpass', f0: 1400, f1: 120, rev: 0.8 });
    this.tone(180, 2.4, 'sawtooth', 0.09, { to: 900, sweepT: 2.2, rev: 0.9, filter: { type: 'lowpass', f0: 600, f1: 3400, q: 4 } });
    this.tone(240, 2.2, 'square', 0.05, { to: 1200, sweepT: 2.0, rev: 0.9, delay: 0.1, filter: { type: 'lowpass', f0: 900, f1: 3000 } });
  }
  sting(kind) {
    if (!this.ok || !this.enabled) return;
    if (kind === 'tall') {
      this.tone(28, 4.5, 'sine', 0.5, { to: 22, attack: 0.5, rev: 0.7 });
      this.tone(42, 4.2, 'triangle', 0.16, { to: 33, attack: 0.6, rev: 0.7 });
      this.noiseHit(3.5, 0.14, { type: 'lowpass', f0: 240, f1: 70, attack: 0.9, linear: true, rev: 0.9 });
      this.tone(1200, 0.6, 'sine', 0.05, { to: 90, rev: 1.4, delay: 1.2 });
    } else if (kind === 'weeper') {
      this.weeperWail(1.1, 0);
      this.tone(36, 3.0, 'sine', 0.28, { to: 30, attack: 0.3, rev: 0.8 });
    } else if (kind === 'adrenaline') {
      // the shot: a cold inhale, a rising wire, then your own heart hammering
      this.noiseHit(0.7, 0.2, { type: 'bandpass', f0: 700, f1: 3400, q: 2.2, rev: 0.7, attack: 0.06, linear: true });
      this.tone(180, 0.9, 'sawtooth', 0.1, { to: 1500, rev: 0.9, attack: 0.05, filter: { type: 'lowpass', f0: 2600, f1: 900 } });
      this.tone(52, 0.22, 'sine', 0.4, { to: 40, rev: 0.2, delay: 0.32 });
      this.tone(58, 0.2, 'sine', 0.32, { to: 44, rev: 0.2, delay: 0.78 });
    } else {
      this.noiseHit(1.6, 0.24, { type: 'bandpass', f0: 400, f1: 120, q: 1.4, rev: 1.0, attack: 0.02 });
      this.tone(120, 1.1, 'sawtooth', 0.12, { to: 44, rev: 1.0, filter: { type: 'lowpass', f0: 1200, f1: 200 } });
    }
  }
  scare(kind) {
    if (!this.ok || !this.enabled) return;
    if (kind === 'bang') {
      this.noiseHit(0.5, 0.5, { type: 'lowpass', f0: 2600, f1: 120, rev: 1.2 });
      this.tone(70, 0.6, 'square', 0.3, { to: 34, rev: 0.9 });
    } else if (kind === 'grab') {
      this.noiseHit(0.3, 0.28, { type: 'bandpass', f0: 900, f1: 200, q: 1.6, rev: 0.8 });
      this.tone(150, 0.4, 'sawtooth', 0.12, { to: 60, rev: 0.9 });
    } else if (kind === 'whisper') {
      for (let i = 0; i < 5; i++) this.noiseHit(0.4, 0.13, { type: 'bandpass', f0: 700 + Math.random() * 1800, f1: 400, q: 9, delay: i * 0.16, rev: 1.3, attack: 0.08, pan: Math.random() * 2 - 1 });
    } else if (kind === 'crow') {
      for (let i = 0; i < 7; i++) this.tone(320 + Math.random() * 180, 0.22, 'sawtooth', 0.06, { to: 180, delay: i * 0.07, pan: Math.random() * 2 - 1, rev: 0.9, filter: { type: 'bandpass', f0: 900, q: 2 } });
      this.noiseHit(1.4, 0.14, { type: 'highpass', f0: 1200, rev: 1.0, attack: 0.05 });
    } else if (kind === 'face') {
      this.tone(1800, 0.16, 'sine', 0.12, { to: 300, rev: 1.2 });
      this.noiseHit(0.2, 0.12, { type: 'highpass', f0: 4000, rev: 0.9 });
    } else {
      this.noiseHit(0.35, 0.3, { type: 'bandpass', f0: 1800, f1: 400, q: 1.2, rev: 1.0 });
    }
  }

  hurt() {
    this.tone(180, 0.5, 'sawtooth', 0.3, { to: 60, rev: 0.8, filter: { type: 'lowpass', f0: 1400, f1: 300 } });
    this.noiseHit(0.45, 0.34, { type: 'lowpass', f0: 1800, f1: 200, rev: 0.9 });
    this.tone(52, 0.7, 'sine', 0.34, { to: 30, rev: 0.5 });
  }

  /** The big one. */
  jumpscare(kind = 'whisperer') {
    if (!this.ok) return;
    const c = this.ctx, t = this.t;
    this.enabled = true;
    // dissonant cluster
    const freqs = [110, 116.5, 155.6, 233, 311, 466, 622];
    for (const f of freqs) {
      this.tone(f, 1.5, 'sawtooth', 0.13, { to: f * 0.42, sweepT: 1.4, rev: 1.2, attack: 0.004, filter: { type: 'lowpass', f0: 4200, f1: 500, q: 2 } });
    }
    this.noiseHit(1.6, 0.5, { type: 'lowpass', f0: 7000, f1: 200, rev: 1.4, attack: 0.003 });
    this.tone(1400, 0.9, 'square', 0.16, { to: 90, sweepT: 0.85, rev: 1.3 });
    if (kind === 'weeper') this.weeperWail(1.6, 0);
    if (kind === 'tall') { this.tone(30, 2.4, 'sine', 0.6, { to: 20, rev: 0.9 }); this.tone(45, 2.2, 'triangle', 0.24, { to: 28, rev: 0.9 }); }
    // a scream that isn't yours
    this.tone(720, 1.1, 'sawtooth', 0.14, { to: 240, sweepT: 1.0, rev: 1.4, attack: 0.01, filter: { type: 'bandpass', f0: 1200, f1: 600, q: 3 } });
    // sub drop then silence
    this.tone(60, 2.0, 'sine', 0.4, { to: 24, sweepT: 1.8, rev: 0.6, delay: 0.1 });
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.vol, t);
    this.master.gain.linearRampToValueAtTime(this.vol * 1.25, t + 0.02);
    this.master.gain.linearRampToValueAtTime(this.vol * 0.0001, t + 2.1);
    this.master.gain.setTargetAtTime(this.vol * 0.5, t + 2.4, 0.4);
  }

  dawn() {
    if (!this.ok || !this.enabled) return;
    const chord = [174.6, 261.6, 349.2, 440, 523.3];
    chord.forEach((f, i) => this.tone(f, 5.5, 'sine', 0.075, { attack: 0.9 + i * 0.25, rev: 1.4, delay: i * 0.22, linear: true }));
    for (let i = 0; i < 8; i++) setTimeout(() => this.bird(), 900 + i * 420);
    this.tone(523, 3, 'triangle', 0.05, { to: 1046, sweepT: 2.8, rev: 1.5, delay: 1.2 });
  }
  thunder() {
    if (!this.ok || !this.enabled) return;
    this.noiseHit(3.2, 0.42, { type: 'lowpass', f0: 900, f1: 60, rev: 1.3, attack: 0.03, linear: true });
    this.tone(38, 3.0, 'sine', 0.4, { to: 22, rev: 0.9, attack: 0.05 });
    this.noiseHit(1.2, 0.2, { type: 'bandpass', f0: 2200, f1: 400, q: 0.9, rev: 1.4, delay: 0.05 });
  }
  ui(kind = 'click') {
    if (!this.ok || !this.enabled) return;
    if (kind === 'click') this.tone(1250, 0.05, 'square', 0.045, { to: 800, rev: 0.2, filter: { type: 'lowpass', f0: 3000 } });
    else if (kind === 'hover') this.tone(2100, 0.03, 'sine', 0.02, { rev: 0.15 });
    else if (kind === 'start') { this.tone(120, 1.4, 'sine', 0.2, { to: 46, rev: 1.1 }); this.noiseHit(1.2, 0.14, { type: 'lowpass', f0: 1200, f1: 100, rev: 1.2, attack: 0.02, linear: true }); }
    else if (kind === 'win') { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 1.6, 'sine', 0.09, { delay: i * 0.14, rev: 1.3, attack: 0.02 })); }
    else if (kind === 'deny') this.tone(180, 0.14, 'square', 0.07, { to: 110, rev: 0.3 });
    else if (kind === 'mark') { this.tone(880, 0.1, 'sine', 0.06, { rev: 0.5 }); this.tone(1320, 0.16, 'sine', 0.045, { delay: 0.09, rev: 0.6 }); }
  }

  setVolume(v) {
    this.vol = clamp(v, 0, 1);
    if (this.master) this.master.gain.setTargetAtTime(this.vol, this.t, 0.05);
  }
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
}
