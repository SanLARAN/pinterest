// Low-poly heightfield terrain from simplex noise.
import { CFG } from '../core/config.js';
import { Simplex2, smoothstep, lerp } from '../core/rng.js';
import { KIND } from './builder.js';

export class Terrain {
  constructor(seed) {
    this.noise = new Simplex2(seed);
    this.half = CFG.WORLD_HALF;
    this.cell = CFG.TERRAIN_CELL;
    this.n = Math.round((2 * this.half) / this.cell);
    this.H = new Float32Array((this.n + 1) * (this.n + 1));
    this.flats = []; // { x, z, r, h }
    this.basins = []; // { x, z, r, depth }
  }

  rawHeight(x, z) {
    const n = this.noise;
    let h = n.fbm(x / 120, z / 120, 3) * 7.5 + n.noise(x / 40 + 11.3, z / 40 - 7.1) * 2.4 + n.noise(x / 13.7, z / 13.7) * 0.5;
    const e = Math.max(Math.abs(x), Math.abs(z));
    // the hills that ring the forest (and, past the edge, fall away again to the lowland with the highway)
    const edge = smoothstep(this.half - 55, this.half, e) * (1 - smoothstep(this.half + 12, this.half + 32, e));
    h += edge * edge * 30 + edge * n.noise(x / 9, z / 9) * 3;
    // ...cut through north of the forestry yard: the old road out, running down to the highway
    const P = CFG.PASS;
    const dx = Math.abs(x - P.x);
    if (z > P.z0 && dx < P.w + P.slope) {
      const pass = (1 - smoothstep(P.w, P.w + P.slope, dx)) * smoothstep(P.z0, P.z0 + 17, z);
      const floor = P.y0 + (CFG.ROAD.y - P.y0) * smoothstep(P.zA, P.zB, z) + n.noise(x / 13.7, z / 13.7) * 0.35;
      h += (floor - h) * pass;
    }
    return h;
  }

  // a flat patch (at the ground's own height there, or at h)
  addFlat(x, z, r, h = null) {
    this.flats.push({ x, z, r, h: h ?? this.rawHeight(x, z) });
  }
  addBasin(x, z, r, depth) {
    this.basins.push({ x, z, r, depth });
  }

  shapedHeight(x, z) {
    let h = this.rawHeight(x, z);
    for (const f of this.flats) {
      const d = Math.hypot(x - f.x, z - f.z);
      if (d < f.r) h = lerp(h, f.h, 1 - smoothstep(f.r * 0.55, f.r, d));
    }
    for (const b of this.basins) {
      const d = Math.hypot(x - b.x, z - b.z);
      if (d < b.r * 1.4) h -= b.depth * (1 - smoothstep(b.r * 0.6, b.r * 1.4, d));
    }
    return h;
  }

  finalize() {
    const n = this.n, c = this.cell, half = this.half;
    for (let j = 0; j <= n; j++) {
      for (let i = 0; i <= n; i++) {
        this.H[j * (n + 1) + i] = this.shapedHeight(-half + i * c, -half + j * c);
      }
    }
  }

  h(i, j) {
    const n = this.n;
    i = i < 0 ? 0 : i > n ? n : i;
    j = j < 0 ? 0 : j > n ? n : j;
    return this.H[j * (n + 1) + i];
  }

  // exact height of the rendered triangle surface
  height(x, z) {
    const c = this.cell;
    const gx = (x + this.half) / c, gz = (z + this.half) / c;
    let i = Math.floor(gx), j = Math.floor(gz);
    if (i < 0) i = 0; if (j < 0) j = 0;
    if (i > this.n - 1) i = this.n - 1; if (j > this.n - 1) j = this.n - 1;
    const fx = Math.min(Math.max(gx - i, 0), 1), fz = Math.min(Math.max(gz - j, 0), 1);
    const h00 = this.h(i, j), h10 = this.h(i + 1, j), h01 = this.h(i, j + 1), h11 = this.h(i + 1, j + 1);
    if (fz > fx) return h00 + (h11 - h01) * fx + (h01 - h00) * fz;
    return h00 + (h10 - h00) * fx + (h11 - h10) * fz;
  }

  // emit terrain triangles for cells inside [x0,x1) x [z0,z1)
  build(b, x0, z0, x1, z1) {
    const c = this.cell, half = this.half;
    const i0 = Math.max(0, Math.floor((x0 + half) / c)), i1 = Math.min(this.n, Math.floor((x1 + half) / c));
    const j0 = Math.max(0, Math.floor((z0 + half) / c)), j1 = Math.min(this.n, Math.floor((z1 + half) / c));
    b.identity();
    for (let j = j0; j < j1; j++) {
      for (let i = i0; i < i1; i++) {
        const xa = -half + i * c, xb = xa + c, za = -half + j * c, zb = za + c;
        const p00 = [xa, this.h(i, j), za];
        const p10 = [xb, this.h(i + 1, j), za];
        const p01 = [xa, this.h(i, j + 1), zb];
        const p11 = [xb, this.h(i + 1, j + 1), zb];
        // diagonal 00-11 hidden -> reads as a scan grid with faceted shading
        b.tri(p00, p01, p11, KIND.GROUND, 4);
        b.tri(p00, p11, p10, KIND.GROUND, 1);
      }
    }
  }
}
