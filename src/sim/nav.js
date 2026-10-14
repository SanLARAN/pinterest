// Grid-based flow field used by enemies to path around walls, towers and trees.
import { HALF, N, SIZE } from './layout.js';

const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

export class FlowField {
  constructor(blocked) {
    this.blocked = blocked;
    this.dist = new Int32Array(SIZE * SIZE);
    this.queue = new Int32Array(SIZE * SIZE);
    this.goal = -1;
  }

  cellOf(x, z) {
    const i = Math.min(N, Math.max(0, Math.round(x) + HALF));
    const j = Math.min(N, Math.max(0, Math.round(z) + HALF));
    return j * SIZE + i;
  }

  /** Recompute distances from the cell nearest to (x, z). Returns true if the goal changed. */
  setGoal(x, z) {
    let gi = this.cellOf(x, z);
    if (this.blocked[gi]) {
      // move to the nearest free neighbour so BFS has a seed cell
      let found = -1;
      for (let r = 1; r <= 4 && found < 0; r++) {
        for (let dz = -r; dz <= r && found < 0; dz++) for (let dx = -r; dx <= r && found < 0; dx++) {
          const n = (gi + dz * SIZE + dx);
          if (n < 0 || n >= SIZE * SIZE) continue;
          if (!this.blocked[n]) found = n;
        }
      }
      if (found >= 0) gi = found;
    }
    if (gi === this.goal) return false;
    this.goal = gi;
    this.compute(gi);
    return true;
  }

  compute(goal) {
    const dist = this.dist;
    const queue = this.queue;
    const blocked = this.blocked;
    dist.fill(-1);
    let head = 0;
    let tail = 0;
    dist[goal] = 0;
    queue[tail++] = goal;
    while (head < tail) {
      const cur = queue[head++];
      const ci = cur % SIZE;
      const cj = (cur - ci) / SIZE;
      const nd = dist[cur] + 1;
      for (const [dx, dz] of DIRS) {
        const ni = ci + dx;
        const nj = cj + dz;
        if (ni < 0 || nj < 0 || ni >= SIZE || nj >= SIZE) continue;
        const n = nj * SIZE + ni;
        if (blocked[n] || dist[n] !== -1) continue;
        if (dx !== 0 && dz !== 0) {
          // no corner cutting
          if (blocked[cur + dx] || blocked[cur + dz * SIZE]) continue;
        }
        dist[n] = nd;
        queue[tail++] = n;
      }
    }
  }

  /** Whether a straight segment is free of blocked cells (sampled). */
  hasLine(x0, z0, x1, z1) {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(len / 0.5));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const idx = this.cellOf(x0 + dx * t, z0 + dz * t);
      if (this.blocked[idx]) return false;
    }
    return true;
  }

  /**
   * Writes a unit-ish steering direction into out {x,z}. Returns false if no route.
   * Uses a straight line when unobstructed for smooth motion, else follows the field.
   */
  steer(x, z, tx, tz, out) {
    if (this.hasLine(x, z, tx, tz)) {
      const dx = tx - x;
      const dz = tz - z;
      const d = Math.hypot(dx, dz) || 1;
      out.x = dx / d;
      out.z = dz / d;
      return true;
    }
    const cur = this.cellOf(x, z);
    const d0 = this.dist[cur];
    if (d0 < 0) {
      const dx = tx - x;
      const dz = tz - z;
      const d = Math.hypot(dx, dz) || 1;
      out.x = dx / d;
      out.z = dz / d;
      return false;
    }
    let best = cur;
    let bestD = d0;
    const ci = cur % SIZE;
    const cj = (cur - ci) / SIZE;
    for (const [dx, dz] of DIRS) {
      const ni = ci + dx;
      const nj = cj + dz;
      if (ni < 0 || nj < 0 || ni >= SIZE || nj >= SIZE) continue;
      const n = nj * SIZE + ni;
      const nd = this.dist[n];
      if (nd < 0 || nd >= bestD) continue;
      if (dx !== 0 && dz !== 0 && (this.blocked[cur + dx] || this.blocked[cur + dz * SIZE])) continue;
      best = n;
      bestD = nd;
    }
    if (best === cur) {
      out.x = 0;
      out.z = 0;
      return true;
    }
    const bx = best % SIZE - HALF;
    const bz = (best - (best % SIZE)) / SIZE - HALF;
    const ddx = bx - x;
    const ddz = bz - z;
    const d = Math.hypot(ddx, ddz) || 1;
    out.x = ddx / d;
    out.z = ddz / d;
    return true;
  }
}
