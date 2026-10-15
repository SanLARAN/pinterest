// 2D capsule collision in a uniform grid. Trees, rocks and walls are capsules (a-b segment + radius).
export class Collision {
  constructor(half, cell = 8) {
    this.half = half;
    this.cell = cell;
    this.n = Math.ceil((2 * half) / cell);
    this.cells = new Array(this.n * this.n);
    for (let i = 0; i < this.cells.length; i++) this.cells[i] = [];
    this.caps = []; // { ax, az, bx, bz, r, h, kind }
    this.stamp = new Uint32Array(1024);
    this.qid = 1;
    this._out = [];
  }

  _ci(x) {
    const i = Math.floor((x + this.half) / this.cell);
    return i < 0 ? 0 : i >= this.n ? this.n - 1 : i;
  }

  add(ax, az, bx, bz, r, h = 6, kind = 0) {
    const idx = this.caps.length;
    this.caps.push({ ax, az, bx, bz, r, h, kind });
    if (this.stamp.length <= idx) {
      const s = new Uint32Array(this.stamp.length * 2);
      s.set(this.stamp);
      this.stamp = s;
    }
    const i0 = this._ci(Math.min(ax, bx) - r), i1 = this._ci(Math.max(ax, bx) + r);
    const j0 = this._ci(Math.min(az, bz) - r), j1 = this._ci(Math.max(az, bz) + r);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) this.cells[j * this.n + i].push(idx);
    return idx;
  }

  circle(x, z, r, h = 6, kind = 0) {
    return this.add(x, z, x, z, r, h, kind);
  }

  query(x, z, r) {
    const out = this._out;
    out.length = 0;
    const q = ++this.qid;
    const i0 = this._ci(x - r), i1 = this._ci(x + r), j0 = this._ci(z - r), j1 = this._ci(z + r);
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const cell = this.cells[j * this.n + i];
        for (let k = 0; k < cell.length; k++) {
          const c = cell[k];
          if (this.stamp[c] !== q) {
            this.stamp[c] = q;
            out.push(c);
          }
        }
      }
    }
    return out;
  }

  // closest distance from point to capsule surface (negative = inside)
  static closest(c, x, z, res) {
    const abx = c.bx - c.ax, abz = c.bz - c.az;
    const len2 = abx * abx + abz * abz;
    let t = 0;
    if (len2 > 1e-8) {
      t = ((x - c.ax) * abx + (z - c.az) * abz) / len2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
    }
    const cx = c.ax + abx * t, cz = c.az + abz * t;
    const dx = x - cx, dz = z - cz;
    const d = Math.sqrt(dx * dx + dz * dz);
    res.d = d - c.r;
    res.nx = d > 1e-6 ? dx / d : 1;
    res.nz = d > 1e-6 ? dz / d : 0;
    return res;
  }

  // push a circle out of all capsules; returns info about the strongest contact
  resolve(p, r, maxH = Infinity) {
    const res = { d: 0, nx: 0, nz: 0 };
    const hit = { hit: false, nx: 0, nz: 0, depth: 0, kind: -1, idx: -1 };
    for (let iter = 0; iter < 3; iter++) {
      const list = this.query(p.x, p.z, r + 2);
      let any = false;
      for (let k = 0; k < list.length; k++) {
        const c = this.caps[list[k]];
        if (c.h < maxH && maxH !== Infinity) continue;
        Collision.closest(c, p.x, p.z, res);
        const pen = r - res.d;
        if (pen > 0) {
          p.x += res.nx * pen;
          p.z += res.nz * pen;
          any = true;
          if (pen > hit.depth) {
            hit.hit = true;
            hit.depth = pen;
            hit.nx = res.nx;
            hit.nz = res.nz;
            hit.kind = c.kind;
            hit.idx = list[k];
          }
        }
      }
      if (!any) break;
    }
    return hit;
  }

  // is the point free (with clearance)?
  free(x, z, r) {
    const res = { d: 0, nx: 0, nz: 0 };
    const list = this.query(x, z, r + 2);
    for (let k = 0; k < list.length; k++) {
      Collision.closest(this.caps[list[k]], x, z, res);
      if (res.d < r) return false;
    }
    return true;
  }
}
