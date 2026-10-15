// Low-poly mesh builder.
// Produces NON-indexed triangle soups with a compact per-vertex `data` attribute
// (Uint8 x4, normalized): xyz = barycentric corner (used to draw glowing wire edges,
// a component stays at 1 for edges we want hidden, e.g. quad diagonals), w = material kind.
import * as THREE from 'three';

export const KIND = {
  GROUND: 0,
  BARK: 1,
  LEAF: 2,
  ROCK: 3,
  WOOD: 4,
  METAL: 5,
  EFFIGY: 6,
  FLESH: 7,
  BONE: 8,
  EYE: 9,
  WATER: 10,
  SHARD: 11,
};

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

export class MeshBuilder {
  constructor(initialTris = 2048) {
    this.pos = new Float32Array(initialTris * 9);
    this.dat = new Uint8Array(initialTris * 12);
    this.count = 0; // vertex count
    this.m = new THREE.Matrix4();
    this.e = this.m.elements;
    this.flip = false;
    this.kind = 0;
  }

  reset() {
    this.count = 0;
    this.identity();
    return this;
  }

  _ensure(extraVerts) {
    const need = (this.count + extraVerts) * 3;
    if (need <= this.pos.length) return;
    let cap = this.pos.length;
    while (cap < need) cap *= 2;
    const p = new Float32Array(cap);
    p.set(this.pos.subarray(0, this.count * 3));
    const d = new Uint8Array((cap / 3) * 4);
    d.set(this.dat.subarray(0, this.count * 4));
    this.pos = p;
    this.dat = d;
  }

  identity() {
    this.m.identity();
    this.flip = false;
    return this;
  }

  // position, euler rotation (radians, order YXZ), scale (number or [x,y,z])
  place(px, py, pz, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
    _e.set(rx, ry, rz, 'YXZ');
    _q.setFromEuler(_e);
    _p.set(px, py, pz);
    _s.set(sx, sy, sz);
    this.m.compose(_p, _q, _s);
    this.flip = this.m.determinant() < 0;
    return this;
  }

  setMatrix(m) {
    this.m.copy(m);
    this.flip = this.m.determinant() < 0;
    return this;
  }

  _v(x, y, z, bx, by, bz, kind) {
    const e = this.e;
    const i = this.count * 3;
    this.pos[i] = e[0] * x + e[4] * y + e[8] * z + e[12];
    this.pos[i + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
    this.pos[i + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
    const j = this.count * 4;
    this.dat[j] = bx;
    this.dat[j + 1] = by;
    this.dat[j + 2] = bz;
    this.dat[j + 3] = kind;
    this.count++;
  }

  // hide bitmask: 1 = edge a-b, 2 = edge b-c, 4 = edge c-a
  tri(a, b, c, kind = this.kind, hide = 0) {
    if (this.flip) {
      const t = b; b = c; c = t;
      hide = (hide & 2) | ((hide & 1) << 2) | ((hide & 4) >> 2);
    }
    this._ensure(3);
    const hx = hide & 2 ? 255 : 0; // edge b-c lies opposite a -> x
    const hy = hide & 4 ? 255 : 0; // edge c-a opposite b -> y
    const hz = hide & 1 ? 255 : 0; // edge a-b opposite c -> z
    this._v(a[0], a[1], a[2], 255, hy, hz, kind);
    this._v(b[0], b[1], b[2], hx, 255, hz, kind);
    this._v(c[0], c[1], c[2], hx, hy, 255, kind);
  }

  // CCW quad (as seen from the front), diagonal hidden
  quad(a, b, c, d, kind = this.kind, hideMask = 0) {
    // hideMask for quad outline: 1=a-b, 2=b-c, 4=c-d, 8=d-a
    this.tri(a, b, c, kind, 4 | (hideMask & 1 ? 1 : 0) | (hideMask & 2 ? 2 : 0));
    this.tri(a, c, d, kind, 1 | (hideMask & 4 ? 2 : 0) | (hideMask & 8 ? 4 : 0));
  }

  // quad that orients itself to face direction n (local space)
  quadN(a, b, c, d, n, kind = this.kind) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * n[0] + cy * n[1] + cz * n[2] < 0) this.quad(a, d, c, b, kind);
    else this.quad(a, b, c, d, kind);
  }

  triN(a, b, c, n, kind = this.kind, hide = 0) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * n[0] + cy * n[1] + cz * n[2] < 0) {
      // swap b,c -> remap hide bits (a-b <-> c-a)
      const h = (hide & 2) | ((hide & 1) << 2) | ((hide & 4) >> 2);
      this.tri(a, c, b, kind, h);
    } else this.tri(a, b, c, kind, hide);
  }

  // Tapered cylinder along +Y from y0 to y0+h.
  cylinder(segs, r0, r1, h, kind = this.kind, opts = {}) {
    const y0 = opts.y0 || 0;
    const phase = opts.phase || 0;
    const capTop = opts.capTop !== false && r1 > 0.001;
    const capBottom = !!opts.capBottom;
    const ringEdges = opts.ringEdges !== false;
    const y1 = y0 + h;
    for (let i = 0; i < segs; i++) {
      const a0 = phase + (i / segs) * Math.PI * 2;
      const a1 = phase + ((i + 1) / segs) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const p0 = [c0 * r0, y0, s0 * r0], p1 = [c1 * r0, y0, s1 * r0];
      const q0 = [c0 * r1, y1, s0 * r1], q1 = [c1 * r1, y1, s1 * r1];
      // (p1, p0, q0, q1) is CCW from outside
      this.quad(p1, p0, q0, q1, kind, ringEdges ? 0 : 1 | 4);
      if (capTop) this.tri([0, y1, 0], q1, q0, kind, 5);
      if (capBottom) this.tri([0, y0, 0], p0, p1, kind, 5);
    }
  }

  cone(segs, r, h, kind = this.kind, opts = {}) {
    const y0 = opts.y0 || 0;
    const phase = opts.phase || 0;
    const apex = [opts.ax || 0, y0 + h, opts.az || 0];
    const hideRibs = opts.hideRibs ? 6 : 0;
    for (let i = 0; i < segs; i++) {
      const a0 = phase + (i / segs) * Math.PI * 2;
      const a1 = phase + ((i + 1) / segs) * Math.PI * 2;
      const p0 = [Math.cos(a0) * r, y0, Math.sin(a0) * r];
      const p1 = [Math.cos(a1) * r, y0, Math.sin(a1) * r];
      this.tri(p1, p0, apex, kind, hideRibs);
      if (opts.capBottom !== false) this.tri([0, y0, 0], p0, p1, kind, 5);
    }
  }

  // Axis-aligned box centered at origin (in local space).
  box(w, h, d, kind = this.kind, opts = {}) {
    const x0 = -w / 2, x1 = w / 2, y0 = opts.bottom ? 0 : -h / 2, y1 = opts.bottom ? h : h / 2, z0 = -d / 2, z1 = d / 2;
    const P = [
      [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
      [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
    ];
    const skip = opts.skip || '';
    if (!skip.includes('z-')) this.quadN(P[0], P[1], P[2], P[3], [0, 0, -1], kind);
    if (!skip.includes('z+')) this.quadN(P[4], P[5], P[6], P[7], [0, 0, 1], kind);
    if (!skip.includes('x-')) this.quadN(P[0], P[3], P[7], P[4], [-1, 0, 0], kind);
    if (!skip.includes('x+')) this.quadN(P[1], P[2], P[6], P[5], [1, 0, 0], kind);
    if (!skip.includes('y+')) this.quadN(P[3], P[2], P[6], P[7], [0, 1, 0], kind);
    if (!skip.includes('y-')) this.quadN(P[0], P[1], P[5], P[4], [0, -1, 0], kind);
  }

  // Tapered box from y=0 to y=h; bottom w0 x d0, top w1 x d1, optional top offset along z.
  taper(w0, d0, w1, d1, h, kind = this.kind, oz = 0, ox = 0) {
    const P = [
      [-w0 / 2, 0, -d0 / 2], [w0 / 2, 0, -d0 / 2], [w0 / 2, 0, d0 / 2], [-w0 / 2, 0, d0 / 2],
      [-w1 / 2 + ox, h, -d1 / 2 + oz], [w1 / 2 + ox, h, -d1 / 2 + oz], [w1 / 2 + ox, h, d1 / 2 + oz], [-w1 / 2 + ox, h, d1 / 2 + oz],
    ];
    this.quadN(P[0], P[1], P[5], P[4], [0, 0, -1], kind);
    this.quadN(P[1], P[2], P[6], P[5], [1, 0, 0], kind);
    this.quadN(P[2], P[3], P[7], P[6], [0, 0, 1], kind);
    this.quadN(P[3], P[0], P[4], P[7], [-1, 0, 0], kind);
    this.quadN(P[4], P[5], P[6], P[7], [0, 1, 0], kind);
    this.quadN(P[0], P[1], P[2], P[3], [0, -1, 0], kind);
  }

  // Jittered icosahedron rock / crown.
  rock(r, rnd, kind = this.kind, jitter = 0.28, squash = 0.7) {
    const t = (1 + Math.sqrt(5)) / 2;
    const V = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
    ].map((v) => {
      const l = Math.hypot(v[0], v[1], v[2]);
      const k = r * (1 - jitter / 2 + rnd() * jitter) / l;
      return [v[0] * k, v[1] * k * squash, v[2] * k];
    });
    const F = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ];
    for (const f of F) {
      const a = V[f[0]], b = V[f[1]], c = V[f[2]];
      const n = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
      this.triN(a, b, c, n, kind);
    }
  }

  octa(r, h, kind = this.kind) {
    const top = [0, h, 0], bot = [0, -h, 0];
    const ring = [[r, 0, 0], [0, 0, r], [-r, 0, 0], [0, 0, -r]];
    for (let i = 0; i < 4; i++) {
      const a = ring[i], b = ring[(i + 1) % 4];
      this.triN(a, b, top, [a[0] + b[0], h, a[2] + b[2]], kind);
      this.triN(a, b, bot, [a[0] + b[0], -h, a[2] + b[2]], kind);
    }
  }

  // Thin limb between two local points (4-sided tapered prism).
  limb(from, to, r0, r1, kind = this.kind, segs = 4) {
    const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
    const len = Math.hypot(dx, dy, dz) || 1e-4;
    const saved = this.m.clone();
    const savedFlip = this.flip;
    const dir = new THREE.Vector3(dx / len, dy / len, dz / len);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const local = new THREE.Matrix4().compose(new THREE.Vector3(from[0], from[1], from[2]), q, new THREE.Vector3(1, 1, 1));
    this.m.multiply(local);
    this.cylinder(segs, r0, r1, len, kind, { capTop: true, capBottom: true, phase: Math.PI / segs });
    this.m.copy(saved);
    this.flip = savedFlip;
  }

  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, this.count * 3), 3));
    g.setAttribute('data', new THREE.BufferAttribute(this.dat.slice(0, this.count * 4), 4, true));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }

  toArrays() {
    return { pos: this.pos.slice(0, this.count * 3), dat: this.dat.slice(0, this.count * 4), count: this.count };
  }
}
