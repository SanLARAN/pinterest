import * as THREE from 'three';
import { mulberry32, Noise2D, clamp } from './noise.js';
import { CFG, KIND_STATS } from './config.js';

const TAU = Math.PI * 2;

function smoothCircular(src, radius, passes) {
  const n = src.length;
  let a = Float32Array.from(src);
  let b = new Float32Array(n);
  const w = 2 * radius + 1;
  for (let p = 0; p < passes; p++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) sum += a[(k + n) % n];
    for (let i = 0; i < n; i++) {
      b[i] = sum / w;
      sum += a[(i + radius + 1) % n] - a[(i - radius + n) % n];
    }
    const t = a; a = b; b = t;
  }
  return a;
}

function rotateArr(arr, start) {
  const n = arr.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = arr[(i + start) % n];
  return out;
}

/**
 * A closed rally circuit generated from simplex noise.
 * Pure data: centreline samples, heights, curvature, AI speed profile and
 * fast nearest-point queries. Meshes are built in world.js.
 */
export class Track {
  constructor(seed) {
    this.seed = seed;
    this.hw = CFG.HW;
    this.rng = mulberry32(Math.imul(seed + 1, 2654435761));
    this.noise = new Noise2D(this.rng);
    this.hnoise = new Noise2D(mulberry32(seed * 7919 + 13));
    let ok = false;
    for (let attempt = 0; attempt < 80 && !ok; attempt++) ok = this._build(attempt);
    if (!ok) this._build(-1);
    this._heights();
    this._speedProfile();
    this._spatial();
    this.checkpoints = [];
    for (let k = 0; k < CFG.CP_PER_LAP; k++) this.checkpoints.push((k / CFG.CP_PER_LAP) * this.length);
  }

  /** Natural terrain height (shared with terrain.js so track & land agree). */
  naturalHeight(x, z) {
    const n = this.hnoise;
    const base = n.fbm(x * 0.0032, z * 0.0032, 4) * 26;
    const r = 1 - Math.abs(n.noise(x * 0.0075 + 31.7, z * 0.0075 - 12.3));
    const ridged = r * r * r * 16;
    const detail = n.noise(x * 0.035, z * 0.035) * 1.1;
    return base + ridged + detail;
  }

  _build(attempt) {
    const rng = this.rng;
    const N = 12 + Math.floor(rng() * 7);
    const R0 = 205 + rng() * 45;
    const amp = attempt < 0 ? 0.06 : 0.38 - Math.min(attempt, 40) * 0.006;
    const ox = rng() * 50, oz = rng() * 50;
    const stretch = 1 + rng() * 0.4;
    const rot = rng() * TAU;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU + (rng() - 0.5) * (TAU / N) * 0.45;
      const c = Math.cos(a), s = Math.sin(a);
      const n1 = this.noise.noise(c * 0.85 + ox, s * 0.85 + oz);
      const n2 = this.noise.noise(c * 2.1 + oz, s * 2.1 + ox);
      const r = R0 * (1 + amp * n1 + amp * 0.5 * n2);
      const x = c * r * stretch, z = s * r;
      pts.push(new THREE.Vector3(x * cr - z * sr, 0, x * sr + z * cr));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    const L0 = curve.getLength();
    const M = Math.round(L0 / 2);
    const sp = curve.getSpacedPoints(M);
    sp.pop();
    const n = sp.length;
    const px = new Float32Array(n), pz = new Float32Array(n);
    for (let i = 0; i < n; i++) { px[i] = sp[i].x; pz[i] = sp[i].z; }
    let L = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      L += Math.hypot(px[j] - px[i], pz[j] - pz[i]);
    }
    const spacing = L / n;
    const tx = new Float32Array(n), tz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = (i - 1 + n) % n, b = (i + 1) % n;
      const dx = px[b] - px[a], dz = pz[b] - pz[a];
      const l = Math.hypot(dx, dz) || 1;
      tx[i] = dx / l; tz[i] = dz / l;
    }
    const curvRaw = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = (i - 1 + n) % n, b = (i + 1) % n;
      const cross = tx[a] * tz[b] - tz[a] * tx[b];
      const dot = tx[a] * tx[b] + tz[a] * tz[b];
      curvRaw[i] = Math.atan2(cross, dot) / (2 * spacing);
    }
    const ks = smoothCircular(curvRaw, 3, 2);
    if (attempt >= 0) {
      let maxK = 0;
      for (let i = 0; i < n; i++) maxK = Math.max(maxK, Math.abs(ks[i]));
      if (1 / maxK < 27) return false;
      if (L < 1250 || L > 2250) return false;
      // no two non-adjacent parts of the track may come close
      const minSep = 2 * this.hw + 30, minSep2 = minSep * minSep;
      const skip = Math.ceil(100 / spacing);
      for (let i = 0; i < n; i += 2) {
        for (let j = i + skip; j < n; j += 2) {
          if (n - (j - i) < skip) break;
          const dx = px[i] - px[j], dz = pz[i] - pz[j];
          if (dx * dx + dz * dz < minSep2) return false;
        }
      }
    }
    // start line: the straightest stretch (long straight before, short after)
    let bestI = 0, bestScore = Infinity;
    const wb = Math.round(70 / spacing), wf = Math.round(40 / spacing);
    for (let i = 0; i < n; i++) {
      let sc = 0;
      for (let k = -wb; k <= wf; k++) sc += Math.abs(ks[(i + k + n) % n]);
      if (sc < bestScore) { bestScore = sc; bestI = i; }
    }
    this.n = n;
    this.length = L;
    this.spacing = spacing;
    this.px = rotateArr(px, bestI);
    this.pz = rotateArr(pz, bestI);
    this.tx = rotateArr(tx, bestI);
    this.tz = rotateArr(tz, bestI);
    this.curv = rotateArr(ks, bestI);
    this.rx = new Float32Array(n);
    this.rz = new Float32Array(n);
    for (let i = 0; i < n; i++) { this.rx[i] = -this.tz[i]; this.rz[i] = this.tx[i]; }
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < n; i++) {
      minX = Math.min(minX, this.px[i]); maxX = Math.max(maxX, this.px[i]);
      minZ = Math.min(minZ, this.pz[i]); maxZ = Math.max(maxZ, this.pz[i]);
    }
    this.bounds = { minX, maxX, minZ, maxZ };
    return true;
  }

  _heights() {
    const n = this.n, sp = this.spacing;
    const raw = new Float32Array(n);
    for (let i = 0; i < n; i++) raw[i] = this.naturalHeight(this.px[i], this.pz[i]) * 0.6;
    let h = smoothCircular(raw, Math.round(20 / sp * 2), 3);
    // limit slopes so the road rolls instead of climbing walls
    let mean = 0, maxSlope = 0;
    for (let i = 0; i < n; i++) mean += h[i];
    mean /= n;
    for (let i = 0; i < n; i++) maxSlope = Math.max(maxSlope, Math.abs(h[(i + 1) % n] - h[i]) / sp);
    if (maxSlope > 0.12) {
      const k = 0.12 / maxSlope;
      for (let i = 0; i < n; i++) h[i] = mean + (h[i] - mean) * k;
    }
    // jumps on long straights
    const cand = [];
    const back = Math.round(30 / sp), fwd = Math.round(110 / sp);
    for (let i = 0; i < n; i++) {
      const s = i * sp;
      if (s < 160 || s > this.length - 120) continue;
      let mk = 0;
      for (let k = -back; k <= fwd; k++) mk = Math.max(mk, Math.abs(this.curv[(i + k + n) % n]));
      if (mk < 1 / 110) cand.push({ i, mk });
    }
    cand.sort((a, b) => a.mk - b.mk);
    this.jumps = [];
    for (const c of cand) {
      if (this.jumps.length >= 3) break;
      let far = true;
      for (const j of this.jumps) {
        const d = Math.min(Math.abs(j - c.i), n - Math.abs(j - c.i)) * sp;
        if (d < 320) { far = false; break; }
      }
      if (far) this.jumps.push(c.i);
    }
    const up = Math.round(16 / sp), down = Math.round(36 / sp), H = 2.4;
    this.jumpUp = up;
    for (const j of this.jumps) {
      for (let k = -up; k <= down; k++) {
        const idx = (j + k + n) % n;
        let add;
        if (k <= 0) { const u = (k + up) / up; add = H * u * u; } else { const u = k / down; add = H * (1 - u * u * (3 - 2 * u)); }
        h[idx] += add;
      }
    }
    this.h = h;
  }

  _speedProfile() {
    const n = this.n, P = KIND_STATS.rival;
    const tr = P.turnRate * 0.86;
    const raw = new Float32Array(n);
    const ks = smoothCircular(this.curv, 4, 1);
    for (let i = 0; i < n; i++) {
      const k = Math.abs(ks[i]);
      raw[i] = clamp(tr / (k + (tr * P.turnFall) / P.maxSpeed), 15, 75);
    }
    const decel = 26, sp = this.spacing;
    for (let iter = 0; iter < 2; iter++) {
      for (let i = n - 1; i >= 0; i--) {
        const j = (i + 1) % n;
        raw[i] = Math.min(raw[i], Math.sqrt(raw[j] * raw[j] + 2 * decel * sp));
      }
    }
    this.vmax = raw;
  }

  _spatial() {
    this.cell = 24;
    this.grid = new Map();
    for (let i = 0; i < this.n; i++) {
      const key = this._key(Math.floor(this.px[i] / this.cell), Math.floor(this.pz[i] / this.cell));
      let b = this.grid.get(key);
      if (!b) { b = []; this.grid.set(key, b); }
      b.push(i);
    }
  }

  _key(ix, iz) { return (ix + 1024) * 4096 + (iz + 1024); }

  /** Closest centreline sample within maxR (grid accelerated). */
  nearest(x, z, maxR, out = { i: -1, d: Infinity }) {
    const cs = this.cell;
    const r = Math.ceil(maxR / cs);
    const cx = Math.floor(x / cs), cz = Math.floor(z / cs);
    let best = -1, bestD = maxR * maxR;
    for (let a = -r; a <= r; a++) {
      for (let b = -r; b <= r; b++) {
        const bucket = this.grid.get(this._key(cx + a, cz + b));
        if (!bucket) continue;
        for (let k = 0; k < bucket.length; k++) {
          const i = bucket[k];
          const dx = x - this.px[i], dz = z - this.pz[i];
          const d = dx * dx + dz * dz;
          if (d < bestD) { bestD = d; best = i; }
        }
      }
    }
    out.i = best;
    out.d = best >= 0 ? Math.sqrt(bestD) : Infinity;
    return out;
  }

  /**
   * Project a world position onto the track. `hint` = previous sample index
   * for an O(1) local search. Writes {idx, s, lateral, dist} into out.
   */
  query(x, z, hint, out, local = false) {
    const n = this.n, px = this.px, pz = this.pz;
    let best = -1, bestD = Infinity;
    if (hint >= 0 && hint < n) {
      for (let k = -16; k <= 16; k++) {
        let i = hint + k;
        if (i < 0) i += n; else if (i >= n) i -= n;
        const dx = x - px[i], dz = z - pz[i];
        const d = dx * dx + dz * dz;
        if (d < bestD) { bestD = d; best = i; }
      }
    }
    if (best < 0 || (bestD > 1600 && !local)) {
      const r = this.nearest(x, z, 90, _nr);
      if (r.i >= 0 && r.d * r.d < bestD) { best = r.i; bestD = r.d * r.d; }
      if (best < 0) {
        for (let i = 0; i < n; i++) {
          const dx = x - px[i], dz = z - pz[i];
          const d = dx * dx + dz * dz;
          if (d < bestD) { bestD = d; best = i; }
        }
      }
    }
    const dx = x - px[best], dz = z - pz[best];
    let along = dx * this.tx[best] + dz * this.tz[best];
    if (along > this.spacing) along = this.spacing; else if (along < -this.spacing) along = -this.spacing;
    let s = best * this.spacing + along;
    if (s < 0) s += this.length; else if (s >= this.length) s -= this.length;
    out.idx = best;
    out.s = s;
    out.lateral = dx * this.rx[best] + dz * this.rz[best];
    out.dist = Math.sqrt(bestD);
    return out;
  }

  wrapS(s) {
    const L = this.length;
    s %= L;
    return s < 0 ? s + L : s;
  }

  /** Interpolated point at arc length s with lateral offset. */
  pointAt(s, lateral, out) {
    s = this.wrapS(s);
    const f = s / this.spacing;
    let i = Math.floor(f);
    const t = f - i;
    i %= this.n;
    const j = (i + 1) % this.n;
    let tx = this.tx[i] + (this.tx[j] - this.tx[i]) * t;
    let tz = this.tz[i] + (this.tz[j] - this.tz[i]) * t;
    const l = Math.hypot(tx, tz) || 1;
    tx /= l; tz /= l;
    out.x = this.px[i] + (this.px[j] - this.px[i]) * t - tz * lateral;
    out.z = this.pz[i] + (this.pz[j] - this.pz[i]) * t + tx * lateral;
    out.y = this.h[i] + (this.h[j] - this.h[i]) * t;
    out.tx = tx; out.tz = tz;
    out.heading = Math.atan2(tx, tz);
    out.idx = t < 0.5 ? i : j;
    return out;
  }

  heightAtS(s) {
    s = this.wrapS(s);
    const f = s / this.spacing;
    let i = Math.floor(f);
    const t = f - i;
    i %= this.n;
    const j = (i + 1) % this.n;
    return this.h[i] + (this.h[j] - this.h[i]) * t;
  }

  speedAt(s) {
    s = this.wrapS(s);
    const i = Math.floor(s / this.spacing) % this.n;
    return this.vmax[i];
  }

  curvAt(s) {
    s = this.wrapS(s);
    return this.curv[Math.floor(s / this.spacing) % this.n];
  }
}

const _nr = { i: -1, d: Infinity };
