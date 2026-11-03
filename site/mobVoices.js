// The ballot's candidates have no sound in the game yet, so each gets a short sketch of a voice, made from the
// engine's own building blocks (src/audio/audio.js: noise bursts, tones, envelopes, the forest's reverb): how it
// would sound between the pines. mobVoice(engine, id) → { dur, stop() } or null while the engine sleeps.

const R = (a, b) => a + Math.random() * (b - a);

export function mobVoice(A, id) {
  if (!A || !A.ready || !A.ctx) return null;
  const ctx = A.ctx;
  const t0 = A.now + 0.06;
  const buses = [];
  // a bus with its own share of reverb: distant things are wetter
  const bus = (rev = 0.5, gain = 1) => {
    const g = A._gain(gain);
    A._out(g, A.sfx, rev);
    buses.push(g);
    return g;
  };
  const pan = (dest, v) => {
    const p = A._stereo(v);
    p.connect(dest);
    return p;
  };
  const far = bus(0.75, 0.9);
  const near = bus(0.12, 1);
  const nb = (t, o, d = far, p = 0) => A._noiseBurst(t0 + t, { rev: 0, ...o, dest: p ? pan(d, p) : d });
  const tone = (t, o, d = far, p = 0) => A._tone(t0 + t, { rev: 0, ...o, dest: p ? pan(d, p) : d });
  let dur = 3;

  switch (id) {
    case 'gluhar': {
      // the song: knocks that speed up, the cork-pop, the «whetting» (deaf for it), then the take-off like a shot
      let t = 0, gap = 0.44;
      for (let i = 0; i < 11; i++) {
        nb(t, { type: 'bandpass', f: R(1750, 2050), q: 9, a: 0.0008, d: 0.026, gain: 0.5 }, far, -0.35);
        tone(t, { type: 'triangle', f: 1250, fEnd: 820, a: 0.001, d: 0.035, gain: 0.07 }, far, -0.35);
        t += gap;
        gap = Math.max(0.085, gap * 0.8);
      }
      tone(t + 0.05, { f: 560, fEnd: 170, a: 0.001, d: 0.08, gain: 0.45 }, far, -0.35);
      nb(t + 0.05, { type: 'lowpass', f: 1100, q: 0.8, a: 0.001, d: 0.05, gain: 0.3 }, far, -0.35);
      const w0 = t + 0.18;
      for (let i = 0; i < 26; i++) {
        const k = i / 25;
        nb(w0 + i * 0.058, { type: 'bandpass', f: R(5200, 6600), q: 3.2, a: 0.004, d: 0.048, gain: 0.05 + 0.13 * Math.sin(Math.PI * k) }, far, -0.3);
      }
      const c0 = w0 + 26 * 0.058 + 0.45;
      for (let i = 0; i < 4; i++) {
        nb(c0 + i * 0.13, { type: 'lowpass', f: 1500, q: 0.7, a: 0.002, d: 0.1, gain: 0.75 - i * 0.12 }, far, -0.35 + i * 0.18);
        tone(c0 + i * 0.13, { f: 90, fEnd: 50, a: 0.002, d: 0.14, gain: 0.35 }, far, -0.35 + i * 0.18);
      }
      dur = c0 + 0.8;
      break;
    }
    case 'kukushka': {
      // the clock on the pine: tick-tock, the little door, three calls — the last one off the note — and shut
      for (let i = 0; i < 9; i++) nb(i * 0.42, { type: 'bandpass', f: i % 2 ? 2500 : 3300, q: 12, a: 0.0006, d: 0.016, gain: 0.22 }, far, 0.25);
      nb(0.95, { type: 'bandpass', f: 900, q: 2, a: 0.002, d: 0.06, gain: 0.25 }, far, 0.25);
      tone(0.95, { type: 'square', f: 190, fEnd: 120, a: 0.002, d: 0.05, gain: 0.03 }, far, 0.25);
      const call = (t, hi, lo, g = 0.3) => {
        for (const [dt, f, h] of [[0, hi, 0.09], [0.26, lo, 0.16]]) {
          tone(t + dt, { f, a: 0.02, hold: h, d: 0.12, gain: g }, far, 0.25);
          tone(t + dt, { type: 'triangle', f: f * 2, a: 0.02, hold: h, d: 0.08, gain: g * 0.1 }, far, 0.25);
          nb(t + dt, { type: 'bandpass', f, q: 4, a: 0.02, hold: h * 0.6, d: 0.08, gain: g * 0.2 }, far, 0.25);
        }
      };
      call(1.15, 740, 622);
      call(2.0, 740, 622);
      call(2.9, 700, 560, 0.34);
      nb(3.65, { type: 'bandpass', f: 700, q: 1.6, a: 0.002, d: 0.08, gain: 0.32 }, far, 0.25);
      dur = 4;
      break;
    }
    case 'gribnica': {
      // one quiet step outside the ring, the next one inside it (three times as loud), the spores, the ring breathing
      const step = (t, g, d) => {
        nb(t, { type: 'lowpass', f: 1300, q: 0.7, a: 0.004, d: 0.13, gain: g }, d, -0.2);
        for (let i = 0; i < 5; i++) nb(t + R(0, 0.09), { type: 'bandpass', f: R(2400, 4200), q: 4, a: 0.001, d: 0.012, gain: g * 0.35 }, d, -0.2);
      };
      step(0.2, 0.1, near);
      step(1.0, 0.36, far);
      tone(1.0, { f: 62, fEnd: 40, a: 0.004, d: 0.6, gain: 0.42 }, far);
      nb(1.08, { type: 'highpass', f: 2500, fEnd: 8500, q: 0.7, a: 0.08, d: 0.7, gain: 0.07 }, far, 0.3);
      for (let i = 0; i < 46; i++) nb(1.4 + R(0, 1.9), { type: 'bandpass', f: R(2200, 6200), q: 5, a: 0.001, d: R(0.006, 0.016), gain: R(0.03, 0.09) }, far, R(-0.8, 0.8));
      tone(1.3, { f: 46, a: 0.7, hold: 0.9, d: 0.9, gain: 0.22 }, far);
      tone(1.3, { f: 49.5, a: 0.7, hold: 0.9, d: 0.9, gain: 0.18 }, far);
      dur = 4.1;
      break;
    }
    case 'shatun': {
      // it sniffs the wind three times, then the roar, then its weight on the ground
      for (let i = 0; i < 3; i++) nb(i * 0.27, { type: 'bandpass', f: 1500, fEnd: 2300, q: 1.4, a: 0.03, d: 0.13, gain: 0.24 }, far, 0.35);
      const r0 = t0 + 1.0;
      const roar = (f, g) => {
        const o = A._osc('sawtooth', f);
        o.frequency.setValueAtTime(f, r0);
        o.frequency.linearRampToValueAtTime(f * 1.25, r0 + 0.35);
        o.frequency.exponentialRampToValueAtTime(f * 0.78, r0 + 1.7);
        const ws = ctx.createWaveShaper();
        ws.curve = A.distSoft;
        const lp = A._filter('lowpass', 380, 1.2);
        lp.frequency.setValueAtTime(380, r0);
        lp.frequency.linearRampToValueAtTime(1100, r0 + 0.35);
        lp.frequency.exponentialRampToValueAtTime(260, r0 + 1.8);
        const e = A._gain();
        o.connect(ws).connect(lp).connect(e).connect(pan(far, 0.3));
        A._env(e, r0, 0.22, g, 1.3, 0.35);
        o.start(r0);
        o.stop(r0 + 2.1);
      };
      roar(74, 0.2);
      roar(111, 0.08);
      nb(1.0, { type: 'bandpass', f: 430, q: 0.8, a: 0.25, hold: 0.4, d: 1.0, gain: 0.32 }, far, 0.3);
      for (const [t, p] of [[2.75, 0.2], [3.3, 0.05]]) {
        tone(t, { f: 54, fEnd: 36, a: 0.004, d: 0.32, gain: 0.7 }, far, p);
        nb(t, { type: 'lowpass', f: 320, q: 0.7, a: 0.003, d: 0.16, gain: 0.45 }, far, p);
        for (let i = 0; i < 4; i++) nb(t + R(0.01, 0.12), { type: 'bandpass', f: R(1800, 3200), q: 3, a: 0.001, d: 0.02, gain: 0.08 }, far, p);
      }
      dur = 3.8;
      break;
    }
    case 'poludnica': {
      // the radio opens; a whispered question, rising at the end; the radio shuts; then the sickle
      nb(0, { type: 'bandpass', f: 1900, q: 0.7, a: 0.004, hold: 0.04, d: 0.05, gain: 0.2 }, near, -0.5);
      nb(0.08, { type: 'bandpass', f: 2100, q: 0.5, a: 0.05, hold: 1.75, d: 0.12, gain: 0.04 }, near, -0.5);
      const syl = [1150, 1750, 2500, 1300, 1900, 1500, 2300];
      syl.forEach((f, i) => {
        const last = i === syl.length - 1;
        nb(0.25 + i * 0.2 + R(0, 0.03), { type: 'bandpass', f, fEnd: last ? f * 1.6 : undefined, q: 5, a: 0.035, hold: last ? 0.12 : 0.03, d: last ? 0.2 : 0.1, gain: 0.2 }, near, -0.5);
      });
      nb(1.95, { type: 'bandpass', f: 1700, q: 0.7, a: 0.003, d: 0.06, gain: 0.22 }, near, -0.5);
      tone(1.95, { type: 'square', f: 1400, a: 0.002, d: 0.03, gain: 0.025 }, near, -0.5);
      const s0 = 2.6;
      nb(s0, { type: 'bandpass', f: 2800, fEnd: 7200, q: 6, a: 0.03, d: 0.34, gain: 0.36 }, far, 0.45);
      for (const [f, g, d] of [[2730, 0.06, 1.3], [4115, 0.045, 1.0], [5480, 0.03, 0.7], [7020, 0.02, 0.5]]) tone(s0 + 0.12, { f, a: 0.002, d, gain: g }, far, 0.45);
      dur = 4;
      break;
    }
    case 'pyaty': {
      // four of you walking; a fifth step, out of the rhythm, right behind; and it breathes
      const step = (t, p, g, d) => {
        nb(t, { type: 'lowpass', f: 1500, q: 0.7, a: 0.003, d: 0.09, gain: g }, d, p);
        nb(t + 0.01, { type: 'bandpass', f: 3300, q: 2, a: 0.001, d: 0.04, gain: g * 0.25 }, d, p);
      };
      nb(0, { type: 'bandpass', f: 1800, q: 0.8, a: 0.003, d: 0.05, gain: 0.12 }, near, -0.6);
      [-0.7, -0.25, 0.25, 0.7].forEach((p, i) => step(0.3 + i * 0.44, p, 0.2, far));
      step(0.3 + 3 * 0.44 + 0.66, 0.92, 0.34, near);
      const b0 = 2.85;
      nb(b0, { type: 'bandpass', f: 950, fEnd: 1300, q: 0.9, a: 0.45, d: 0.35, gain: 0.11 }, near, 0.9);
      nb(b0 + 0.85, { type: 'bandpass', f: 700, fEnd: 450, q: 0.9, a: 0.08, d: 0.85, gain: 0.1 }, near, 0.9);
      dur = 4.1;
      break;
    }
    default:
      for (const g of buses) g.disconnect();
      return null;
  }

  return {
    dur,
    stop() {
      const t = A.now;
      for (const g of buses) {
        g.gain.cancelScheduledValues(t);
        g.gain.setTargetAtTime(0, t, 0.06);
      }
      setTimeout(() => { for (const g of buses) { try { g.disconnect(); } catch { /* gone */ } } }, 500);
    },
    // once it has played out, let the buses go
    _gc: setTimeout(() => { for (const g of buses) { try { g.disconnect(); } catch { /* gone */ } } }, (dur + 3.5) * 1000),
  };
}
