// Small math / helper kit used everywhere. Pure, allocation-light.

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : clamp01((v - a) / (b - a)));
export const smoothstep = (e0, e1, x) => { const t = invLerp(e0, e1, x); return t * t * (3 - 2 * t); };
/** Frame-rate independent exponential approach. */
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
export const dist2sq = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };

/** Shortest signed angle difference, result in [-PI, PI]. */
export function angleDelta(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}
export const approachAngle = (a, b, maxStep) => {
  const d = angleDelta(a, b);
  return a + clamp(d, -maxStep, maxStep);
};

export function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtClock(sec) {
  const m = Math.floor(sec / 60) % 60;
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function fmtNum(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Convert a bearing (radians, 0 = +Z/north of our map) to a compass letter. */
const DIRS = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
const DIRS_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export function compass(rad, lang = 'ru') {
  const i = Math.round((((rad % TAU) + TAU) % TAU) / (TAU / 8)) % 8;
  return (lang === 'en' ? DIRS_EN : DIRS)[i];
}

/** Tiny event emitter for game -> ui/audio/net notifications. */
export class Emitter {
  constructor() { this.m = new Map(); }
  on(k, fn) { if (!this.m.has(k)) this.m.set(k, new Set()); this.m.get(k).add(fn); return () => this.off(k, fn); }
  off(k, fn) { this.m.get(k)?.delete(fn); }
  emit(k, a, b, c) {
    const s = this.m.get(k);
    if (!s) return;
    for (const fn of s) { try { fn(a, b, c); } catch (e) { console.warn('[emit]', k, e); } }
  }
  clear() { this.m.clear(); }
}

/** Fixed-capacity ring buffer of recent events (used for radar returns, damage log). */
export class Ring {
  constructor(n = 64) { this.n = n; this.a = []; }
  push(v) { this.a.push(v); if (this.a.length > this.n) this.a.shift(); return v; }
  clear() { this.a.length = 0; }
  [Symbol.iterator]() { return this.a[Symbol.iterator](); }
  get length() { return this.a.length; }
}

export const now = () => performance.now() / 1000;
export const uid = (() => { let i = 1; return () => i++; })();
