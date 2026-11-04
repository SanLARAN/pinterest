// (4.0) The undergrowth: what grows under the pines where the light gets in — low bushes, ferns, young firs
// about chest-high, and heaps of dead brushwood. Like the meadow it is decoration, not a wall: nothing here is
// a collider, a lamp's light and the monsters' sight go straight through it, and the navigation never hears
// of it. What it does do is hold you back (wading through a bush is slower) and give you away (it rustles,
// and dry brushwood cracks under a boot) — see at()/probe(), Player.update and the step handling in game.js.
// Deterministic from the world seed with an RNG of its own: the forest and its trees stay exactly the same.
import * as THREE from 'three';
import { RNG, smoothstep } from '../core/rng.js';
import { MeshBuilder, KIND } from './builder.js';

export const UG = { BUSH: 0, FERN: 1, FIR: 2, BRUSH: 3 };
const CELL = 4; // the spatial hash at() reads: an item is never wider than a cell
const NO_LANDMARK = ['camp', 'cabin', 'cabin2', 'medhut', 'yard', 'wreck', 'wreck2', 'tower', 'tower2', 'lake', 'stones', 'graves', 'sovkhoz', 'firetower', 'zarya'];
const _probe = { k: 0, dry: false };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _o = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);

// a thin three-sided stick from a to b, no caps (a limb() costs twice the vertices for ends no one sees)
function stick(b, ax, ay, az, bx, by, bz, r0, r1) {
  _d.set(bx - ax, by - ay, bz - az);
  const len = _d.length() || 1e-4;
  _q.setFromUnitVectors(_up, _d.multiplyScalar(1 / len));
  b.setMatrix(_m.compose(_o.set(ax, ay, az), _q, _one));
  b.cylinder(3, r0, r1, len, KIND.BARK, { capTop: false });
}

export class Undergrowth {
  constructor(world) {
    this.world = world;
    this.meshes = [];
    this.items = []; // { x, z, r, k, type, h }
    this.grid = new Map();
    this.count = [0, 0, 0, 0];
    this.vertices = 0;
  }

  // where it may grow: not on a path, not in a clearing someone keeps, not inside a trunk or a rock
  allowed(x, z, r) {
    const w = this.world, L = w.lake, Y = w.zarya;
    if (Math.hypot(x, z - 3) < 13) return false; // the camp: trodden flat
    if (L && Math.hypot(x - L.x, z - L.z) < L.r + 4) return false;
    if (Math.abs(x - 96) < 19 && z > 226) return false; // the forestry yard, its gate and the escape road
    if (w.trails?.near(x, z, r + 0.7)) return false;
    if (!w.col.free(x, z, r * 0.6 + 0.2)) return false;
    for (const f of Y?.floors || []) if (Math.abs(x - f.x) < f.w / 2 + 1.5 && Math.abs(z - f.z) < f.d / 2 + 1.5) return false;
    const lm = w.inLandmark(x, z, 1.5);
    if (lm && NO_LANDMARK.includes(lm.id)) return false;
    return true;
  }

  generate() {
    const w = this.world, rng = new RNG((w.seed ^ 0x75677277) >>> 0), noise = w.terrain.noise;
    const C = 40, half = w.half - 9, step = 2.5, buckets = new Map();
    for (let gz = -half; gz < half; gz += step) {
      for (let gx = -half; gx < half; gx += step) {
        const x = gx + rng.float(-1.3, 1.3), z = gz + rng.float(-1.3, 1.3);
        const roll = rng.next(), size = rng.float(0.75, 1.25), seed = (rng.next() * 1e9) | 0, chance = rng.next();
        // under the canopy (the same density the trees grow by) and in patches of its own
        const forest = noise.noise(x / 70 + 40, z / 70 - 20) * 0.7 + noise.noise(x / 23, z / 23) * 0.3;
        const patch = noise.noise(x / 13 - 17, z / 13 + 29);
        const p = (0.08 + 0.62 * smoothstep(-0.3, 0.4, forest)) * (0.35 + 0.95 * smoothstep(-0.45, 0.45, patch));
        if (chance > p) continue;
        const type = roll < 0.3 ? UG.BUSH : roll < 0.66 ? UG.FERN : roll < 0.84 ? UG.FIR : UG.BRUSH;
        const r = [0.85, 0.55, 0.5, 0.8][type] * size;
        if (!this.allowed(x, z, r)) continue;
        const key = `${Math.floor((x + 400) / C)},${Math.floor((z + 400) / C)}`;
        if (!buckets.has(key)) buckets.set(key, { b: new MeshBuilder(8000), sway: [], sink: [] });
        const q = buckets.get(key), y = w.terrain.height(x, z);
        const from = q.b.count;
        const h = this._build(q.b, type, x, y, z, size, new RNG(seed));
        // per vertex: how far up the plant it is (sways with the wind) and how far to sink it in the distance
        for (let i = from; i < q.b.count; i++) {
          const up = Math.max(0, q.b.pos[i * 3 + 1] - y);
          q.sway.push(type === UG.BRUSH ? 0 : Math.min(1, up / Math.max(0.2, h)));
          q.sink.push(type === UG.BRUSH ? 0 : up);
        }
        const item = { x, z, r, h, type, k: [1, 0.55, 0.6, 0.85][type] };
        this.items.push(item);
        this.count[type]++;
        const ck = `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
        if (!this.grid.has(ck)) this.grid.set(ck, []);
        this.grid.get(ck).push(item);
      }
    }
    // the meadow's material (the forest's own shading + a wind sway, sinking into the ground far off)
    this.material = w.grass?.material || w.material;
    for (const q of buckets.values()) {
      const geo = q.b.toGeometry();
      geo.setAttribute('blade', new THREE.Float32BufferAttribute(q.sway, 1));
      geo.setAttribute('bladeHeight', new THREE.Float32BufferAttribute(q.sink.map((s, i) => (q.sway[i] > 0 ? s / q.sway[i] : 0)), 1));
      geo.computeBoundingSphere();
      geo.boundingSphere.radius += 0.3;
      const mesh = new THREE.Mesh(geo, this.material);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      mesh.userData.undergrowth = true;
      mesh.userData.centre = geo.boundingSphere.center.clone();
      w.scene.add(mesh);
      this.meshes.push(mesh);
      this.vertices += q.b.count;
    }
    return this;
  }

  // one plant, in world space; returns its height. (Lean on vertices: ~60 a plant, thousands of plants — the
  // sticks and stems have no caps, the tiers no bottoms, nobody sees those)
  _build(b, type, x, y, z, s, r) {
    const ry = r.float(0, 6.283);
    if (type === UG.BUSH) {
      // a squashed clump of leaves and a smaller one leaning off it
      const rr = r.float(0.4, 0.58) * s, cy = y + rr * r.float(0.42, 0.62);
      b.place(x, cy, z, 0, ry, 0, 1);
      b.rock(rr, () => r.next(), KIND.LEAF, 0.5, r.float(0.62, 0.82));
      const a = ry + r.float(-1, 1), d = rr * r.float(0.55, 0.8), r2 = rr * r.float(0.5, 0.7), lean = r.float(-0.3, 0.3);
      if (r.chance(0.6)) {
        b.place(x + Math.cos(a) * d, y + r2 * 0.75, z + Math.sin(a) * d, lean, a, -lean, 1);
        b.octa(r2, r2 * r.float(0.7, 1), KIND.LEAF);
      }
      return rr * 1.3;
    }
    if (type === UG.FERN) {
      // fronds out of one root: each a thin blade that arches up and over
      const n = r.int(5, 7), len = r.float(0.55, 0.85) * s;
      b.identity();
      for (let i = 0; i < n; i++) {
        const a = ry + (i / n) * 6.283 + r.float(-0.25, 0.25), ca = Math.cos(a), sa = Math.sin(a);
        const L = len * r.float(0.8, 1.15), wd = 0.075 * s, nx = -sa * wd, nz = ca * wd;
        const p0 = [x + ca * 0.04, y + 0.02, z + sa * 0.04];
        const p1 = [x + ca * L * 0.45, y + L * 0.62, z + sa * L * 0.45];
        const p2 = [x + ca * L * 0.95, y + L * 0.36, z + sa * L * 0.95];
        b.tri(p0, [p1[0] - nx, p1[1], p1[2] - nz], [p1[0] + nx, p1[1], p1[2] + nz], KIND.LEAF, 0);
        b.tri([p1[0] - nx, p1[1], p1[2] - nz], p2, [p1[0] + nx, p1[1], p1[2] + nz], KIND.LEAF, 4);
      }
      return len * 0.62;
    }
    if (type === UG.FIR) {
      // a young fir: a stick of a trunk and two or three little tiers
      const h = r.float(0.9, 1.7) * s, tiers = h > 1.25 ? 3 : 2;
      b.place(x, y - 0.05, z, r.float(-0.06, 0.06), ry, r.float(-0.06, 0.06), 1);
      b.cylinder(3, 0.035, 0.015, h, KIND.BARK, { capTop: false });
      let yb = h * 0.22, rr = 0.42 * s * (h / 1.3);
      for (let i = 0; i < tiers; i++) {
        const th = (h - yb) * (i === tiers - 1 ? 1 : 0.62);
        b.cone(5, rr, th, KIND.LEAF, { y0: yb, phase: i * 0.6, capBottom: false });
        yb += th * 0.5;
        rr *= 0.68;
      }
      return h;
    }
    // dead brushwood: snapped branches in a heap, one or two sticking up
    const n = r.int(3, 5);
    for (let i = 0; i < n; i++) {
      const a = ry + r.float(-1.2, 1.2) + (i % 2) * 1.4, L = r.float(0.7, 1.4) * s, cx = x + r.float(-0.25, 0.25), cz = z + r.float(-0.25, 0.25);
      const hx = Math.cos(a) * L * 0.5, hz = Math.sin(a) * L * 0.5, lift = 0.05 + i * 0.045;
      stick(b, cx - hx, y + lift, cz - hz, cx + hx, y + lift + r.float(0, 0.16), cz + hz, 0.035, 0.02);
    }
    const a = ry + 2.7;
    stick(b, x, y + 0.1, z, x + Math.cos(a) * 0.35 * s, y + r.float(0.45, 0.75) * s, z + Math.sin(a) * 0.35 * s, 0.025, 0.008);
    return 0.3 * s;
  }

  // how thick the growth is around a point (0 = open ground, 1 = in the middle of a bush), and whether it is dry
  probe(x, z) {
    _probe.k = 0;
    _probe.dry = false;
    const ci = Math.floor(x / CELL), cj = Math.floor(z / CELL);
    for (let j = cj - 1; j <= cj + 1; j++) {
      for (let i = ci - 1; i <= ci + 1; i++) {
        const list = this.grid.get(`${i},${j}`);
        if (!list) continue;
        for (const it of list) {
          const d = Math.hypot(x - it.x, z - it.z);
          if (d >= it.r) continue;
          const q = d / it.r, k = it.k * (1 - q * q);
          if (k > _probe.k) {
            _probe.k = k;
            _probe.dry = it.type === UG.BRUSH;
          }
        }
      }
    }
    return _probe;
  }

  at(x, z) {
    return this.probe(x, z).k;
  }

  update(camera) {
    for (const m of this.meshes) {
      const p = m.userData.centre;
      m.visible = Math.hypot(p.x - camera.position.x, p.z - camera.position.z) < 100;
    }
  }

  dispose(scene) {
    for (const m of this.meshes) {
      scene.remove(m);
      m.geometry?.dispose();
    }
    this.meshes = [];
  }
}
