export const TAU = Math.PI * 2;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
/** Frame-rate independent exponential smoothing. */
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

export function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export function easeOutBack(t, s = 1.70158) {
  const u = t - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
}

export function wrapAngle(a) {
  let x = (a + Math.PI) % TAU;
  if (x < 0) x += TAU;
  return x - Math.PI;
}

/** Shortest-path interpolation between two angles (radians). */
export function angleLerp(a, b, t) {
  return a + wrapAngle(b - a) * t;
}

/** Damped spring used for squash/stretch juice. */
export class Spring {
  constructor(stiffness = 300, damping = 18) {
    this.x = 0;
    this.v = 0;
    this.k = stiffness;
    this.c = damping;
  }
  impulse(v) {
    this.v += v;
  }
  update(dt) {
    const a = -this.k * this.x - this.c * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
  }
  reset() {
    this.x = 0;
    this.v = 0;
  }
}
