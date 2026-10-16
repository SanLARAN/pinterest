// Deterministic PRNG + value noise / fbm. Pure module: identical output on every
// client for a given seed, which is what makes co-op worlds match without syncing geometry.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded RNG helper object with the convenience methods the game needs. */
export class Rng {
  constructor(seed = 1337) {
    this.seed = seed >>> 0;
    this.f = mulberry32(this.seed);
  }
  next() { return this.f(); }
  range(a, b) { return a + (b - a) * this.f(); }
  int(a, b) { return Math.floor(this.range(a, b + 1 - 1e-9)); }
  pick(arr) { return arr[Math.floor(this.f() * arr.length) % arr.length]; }
  chance(p) { return this.f() < p; }
  sign() { return this.f() < 0.5 ? -1 : 1; }
  /** Point in a ring (radius min..max) around cx,cz */
  ring(cx, cz, rMin, rMax) {
    const a = this.f() * Math.PI * 2;
    const r = Math.sqrt(this.range(rMin * rMin, rMax * rMax));
    return { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, a };
  }
}

function ihash(ix, iy, s) {
  let n = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(s, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n = n ^ (n >>> 16);
  return (n >>> 0) / 4294967295;
}

const smooth = (t) => t * t * (3 - 2 * t);

/** 2D value noise in [0,1]; `scale` = size of one cell in world units. */
export function vnoise2(x, z, scale, seed) {
  const fx = x / scale, fz = z / scale;
  const ix = Math.floor(fx), iz = Math.floor(fz);
  const tx = smooth(fx - ix), tz = smooth(fz - iz);
  const a = ihash(ix, iz, seed);
  const b = ihash(ix + 1, iz, seed);
  const c = ihash(ix, iz + 1, seed);
  const d = ihash(ix + 1, iz + 1, seed);
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * tz;
}

/** Fractal brownian motion, returns roughly [-1,1]. */
export function fbm2(x, z, opts = {}) {
  const octaves = opts.octaves ?? 4;
  const lac = opts.lacunarity ?? 2.03;
  const gain = opts.gain ?? 0.5;
  let scale = opts.scale ?? 64;
  let seed = opts.seed ?? 1;
  let amp = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += (vnoise2(x, z, scale, seed + i * 7919) * 2 - 1) * amp;
    norm += amp;
    amp *= gain;
    scale /= lac;
  }
  return sum / (norm || 1);
}

/** Ridged multifractal — good for ravines and rocky crests. */
export function ridged2(x, z, opts = {}) {
  const octaves = opts.octaves ?? 3;
  let scale = opts.scale ?? 90;
  const seed = opts.seed ?? 5;
  let amp = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(vnoise2(x, z, scale, seed + i * 104729) * 2 - 1);
    sum += n * n * amp;
    norm += amp;
    amp *= 0.5;
    scale /= 2.1;
  }
  return sum / (norm || 1);
}

/** Cheap 1D noise for LFO-ish wobble. */
export function vnoise1(x, scale, seed) {
  const fx = x / scale;
  const ix = Math.floor(fx);
  const t = smooth(fx - ix);
  return ihash(ix, 0, seed) * (1 - t) + ihash(ix + 1, 0, seed) * t;
}
