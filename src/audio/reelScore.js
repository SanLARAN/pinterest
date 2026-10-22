// The reel's own soundtrack (2.1u fix). The night's sound was never recorded — only its pictures were — so
// the exported reel gets a score instead of silence: a cold tape bed, a shutter at every cut, and a sting that
// matches what the episode is about (a death lands low, a chain rings, an engine comes back up).
//
// The timeline is arithmetic (scoreEvents) and the sound is WebAudio built on the spot, so the whole thing can
// be checked in plain Node: the test only needs the event list, not a speaker.
import { reelDuration } from '../game/highlights.js';

export const SCORE = {
  intro: 1.5, // matches drawExport's title card
  end: 1.6, // ...and its end card
  bed: 0.12, // the drone's level under everything
  cut: 0.33, // a shutter at each episode's first frame
};

// Every sound the score will make, in seconds from the start of the file. Pure: no WebAudio here.
export function scoreEvents(plan, opts = {}) {
  const intro = opts.intro ?? SCORE.intro;
  const end = opts.end ?? SCORE.end;
  const at0 = opts.at ?? 0;
  const ev = [
    { at: at0 + 0.02, kind: 'tape' },
    { at: at0 + 0.34, kind: 'title' },
  ];
  let at = at0 + intro;
  for (const c of plan) {
    ev.push({ at: at + 0.03, kind: 'cut' });
    ev.push({ at: at + Math.max(0.12, c.lead * 0.6), kind: 'tick' });
    ev.push({ at: at + Math.max(0.25, c.lead * 0.75), kind: 'sting', sting: c.kind });
    at += c.duration;
  }
  const total = at + end;
  ev.push({ at: at + 0.06, kind: 'end' });
  return { events: ev, total, bedEnd: total - 0.25 };
}

// the WebAudio side: one media-stream destination, a bed that runs the whole file, and the events scheduled
// ahead of time (the recording happens in real time, so everything is placed by AudioContext time)
export class ReelScore {
  constructor(ctx) {
    this.ctx = ctx;
    this.dest = ctx.createMediaStreamDestination();
    this.bus = ctx.createGain();
    this.bus.gain.value = 0.9;
    this.bus.connect(this.dest);
    this.nodes = [];
    this.noise = makeNoise(ctx);
  }

  get stream() {
    return this.dest.stream;
  }

  schedule(plan, at = null) {
    const ctx = this.ctx;
    const t0 = at ?? ctx.currentTime + 0.06;
    const { events, total, bedEnd } = scoreEvents(plan, { at: t0 });
    this._bed(t0, bedEnd);
    for (const e of events) {
      switch (e.kind) {
        case 'tape': this._tape(e.at); break;
        case 'title': this._bell(e.at, 660, 0.55, 1.5); break;
        case 'cut': this._shutter(e.at); break;
        case 'tick': this._tick(e.at); break;
        case 'sting': this._sting(e.at, e.sting); break;
        case 'end': this._end(e.at); break;
      }
    }
    return total;
  }

  stop() {
    for (const n of this.nodes) { try { n.stop(); } catch { /* already done */ } }
    this.nodes = [];
    try { this.bus.disconnect(); } catch { /* gone */ }
    try { this.dest.disconnect(); } catch { /* gone */ }
  }

  // ---- pieces ----
  _keep(n) { this.nodes.push(n); return n; }

  _env(at, attack, hold, release, peak = 1) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + attack);
    g.gain.setValueAtTime(Math.max(0.0002, peak), at + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
    g.connect(this.bus);
    return g;
  }

  _tone(at, { type = 'sine', f0 = 440, f1 = null, attack = 0.005, hold = 0.02, release = 0.4, gain = 0.2, detune = 0 }) {
    const ctx = this.ctx;
    const o = this._keep(ctx.createOscillator());
    o.type = type;
    o.frequency.setValueAtTime(f0, at);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), at + attack + hold + release);
    if (detune) o.detune.value = detune;
    o.connect(this._env(at, attack, hold, release, gain));
    o.start(at);
    o.stop(at + attack + hold + release + 0.05);
    return o;
  }

  _hiss(at, { f = 3000, q = 1, type = 'bandpass', attack = 0.002, hold = 0.01, release = 0.09, gain = 0.18 } = {}) {
    const ctx = this.ctx;
    const src = this._keep(ctx.createBufferSource());
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = type;
    bp.frequency.value = f;
    bp.Q.value = q;
    src.connect(bp).connect(this._env(at, attack, hold, release, gain));
    src.start(at, Math.random() * 0.5);
    src.stop(at + attack + hold + release + 0.05);
    return src;
  }

  // a tape starting: a dull thump and the motor's flutter
  _tape(at) {
    this._hiss(at, { f: 900, q: 0.7, release: 0.12, gain: 0.22 });
    this._tone(at + 0.02, { type: 'triangle', f0: 120, f1: 60, release: 0.3, gain: 0.16 });
    this._hiss(at + 0.06, { f: 5200, q: 2, release: 0.5, gain: 0.035 });
  }

  _bell(at, f, gain = 0.2, release = 1.2) {
    this._tone(at, { f0: f, release, gain });
    this._tone(at, { f0: f * 2.01, release: release * 0.7, gain: gain * 0.35 });
    this._tone(at, { f0: f * 2.98, release: release * 0.4, gain: gain * 0.14 });
  }

  // the projector's shutter on every cut: two hard clicks a hair apart
  _shutter(at) {
    this._hiss(at, { f: 4200, q: 5, release: 0.02, gain: 0.3 });
    this._hiss(at + 0.055, { f: 2600, q: 3, release: 0.03, gain: 0.16 });
    this._tone(at, { type: 'square', f0: 200, release: 0.03, gain: 0.06 });
  }

  _tick(at) {
    this._hiss(at, { f: 6200, q: 8, release: 0.012, gain: 0.1 });
  }

  // what the episode is about, in one sound
  _sting(at, kind) {
    switch (kind) {
      case 'death':
      case 'left':
        this._tone(at, { f0: 92, f1: 38, attack: 0.004, hold: 0.05, release: 0.9, gain: 0.5 });
        this._tone(at + 0.01, { type: 'sawtooth', f0: 220, f1: 110, release: 0.6, gain: 0.07 });
        this._hiss(at, { f: 500, q: 0.8, release: 0.5, gain: 0.12 });
        break;
      case 'seize':
        for (const k of [0, 0.42, 0.84]) this._tone(at + k, { f0: 58, f1: 44, attack: 0.01, hold: 0.03, release: 0.22, gain: 0.42 });
        this._tone(at, { type: 'triangle', f0: 330, f1: 900, attack: 0.6, hold: 0.2, release: 0.4, gain: 0.09 });
        break;
      case 'grab':
        this._hiss(at, { f: 1400, q: 2, release: 0.3, gain: 0.2 });
        this._tone(at + 0.02, { type: 'sawtooth', f0: 150, f1: 70, release: 0.45, gain: 0.12 });
        break;
      case 'chain':
        for (const [i, f] of [[0, 2100], [1, 2870], [2, 3440]]) this._tone(at + i * 0.045, { f0: f, release: 0.5 - i * 0.1, gain: 0.12 - i * 0.02 });
        this._hiss(at, { f: 5200, q: 4, release: 0.3, gain: 0.06 });
        break;
      case 'genBroken':
        this._tone(at, { type: 'sawtooth', f0: 180, f1: 42, attack: 0.02, hold: 0.1, release: 0.7, gain: 0.16 });
        this._hiss(at + 0.05, { f: 800, q: 1, release: 0.5, gain: 0.14 });
        break;
      case 'genStart':
        this._tone(at, { type: 'sawtooth', f0: 42, f1: 120, attack: 0.05, hold: 0.2, release: 0.5, gain: 0.18 });
        this._tone(at + 0.28, { type: 'triangle', f0: 240, f1: 300, release: 0.5, gain: 0.1 });
        break;
      case 'down':
        this._tone(at, { type: 'triangle', f0: 160, f1: 70, release: 0.7, gain: 0.28 });
        break;
      case 'revive':
        this._tone(at, { type: 'triangle', f0: 220, f1: 440, attack: 0.02, hold: 0.05, release: 0.5, gain: 0.16 });
        this._tone(at + 0.12, { f0: 330, release: 0.5, gain: 0.1 });
        break;
      case 'scream':
        this._hiss(at, { f: 1200, q: 6, type: 'bandpass', attack: 0.05, hold: 0.15, release: 0.35, gain: 0.24 });
        this._tone(at, { type: 'triangle', f0: 620, f1: 480, attack: 0.06, hold: 0.12, release: 0.3, gain: 0.07 });
        break;
      case 'escape':
        this._tone(at, { type: 'sawtooth', f0: 60, f1: 95, attack: 0.08, hold: 0.35, release: 0.8, gain: 0.16 });
        this._tone(at + 0.1, { f0: 196, release: 0.9, gain: 0.09 });
        this._tone(at + 0.1, { f0: 294, release: 0.9, gain: 0.06 });
        break;
      case 'win':
        this._tone(at, { f0: 261.6, release: 1.1, gain: 0.1 });
        this._tone(at + 0.02, { f0: 392, release: 1.0, gain: 0.07 });
        break;
      default:
        this._tone(at, { f0: 300, f1: 240, release: 0.3, gain: 0.12 });
    }
  }

  _end(at) {
    this._tone(at, { type: 'triangle', f0: 200, f1: 62, attack: 0.02, hold: 0.2, release: 1.2, gain: 0.22 });
    this._hiss(at, { f: 700, q: 0.8, release: 1.1, gain: 0.08 });
  }

  // the bed: two detuned low sines and a slow swelled hiss, faded at both ends
  _bed(at, until) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(SCORE.bed, at + 1.2);
    g.gain.setValueAtTime(SCORE.bed, Math.max(at + 1.3, until - 0.8));
    g.gain.exponentialRampToValueAtTime(0.0001, until);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 0.6;
    lp.connect(g).connect(this.bus);
    for (const [f, det] of [[48, -6], [49.5, 7]]) {
      const o = this._keep(ctx.createOscillator());
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      o.start(at);
      o.stop(until + 0.1);
    }
    const src = this._keep(ctx.createBufferSource());
    src.buffer = this.noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 0.5;
    const ng = ctx.createGain();
    ng.gain.value = 0.5;
    src.connect(bp).connect(ng).connect(lp);
    src.start(at);
    src.stop(until + 0.1);
    this.nodes.push(g, lp, bp, ng, src);
  }
}

// a second of noise, made once and reused by every hiss in the score
function makeNoise(ctx) {
  const n = Math.floor(ctx.sampleRate * 1.2);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + white * 0.35) * 0.86; // (a touch of brown: less like static, more like tape)
    d[i] = last * 1.4;
  }
  return buf;
}

export function scoreLength(plan) {
  return SCORE.intro + reelDuration(plan) + SCORE.end;
}
