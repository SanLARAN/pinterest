// (4.0) The forest gets worse every night. Each new day of the shift wakes one more layer of it — all of it decided
// from the world seed at generation, so every player in a room sees the same forest on the same day:
//   - dead snags: bare grey trunks where there was nothing the day before (solid: they are colliders);
//   - stick men and scarecrows by the paths — and each night's are set out a little closer to the camp;
//   - red rings and slashes on the trunks along the paths, as if somebody went round in the night marking them.
// One mesh per layer, shown from its day on (the morning after a night is when you see what it did).
// The colliders are filed at generation and kept parked (negative radius: nothing finds them) until their day.
import * as THREE from 'three';
import { RNG, smoothstep } from '../core/rng.js';
import { MeshBuilder, KIND } from './builder.js';
import { CAP } from './caps.js';

export const DECAY_LAYERS = 5; // days 2…6 of a shift
export const DECAY = { snags: 26, effigies: 7, marks: 48 }; // per layer
const RED = 47; // XPAL[28]: paint red by day, a pale blood-pink in the sonar's ash (sonar.js GARAGE_PAL_GLSL)
const RED_DARK = 37; // XPAL[18]: older paint, gone darker

export class ForestDecay {
  constructor(world) {
    this.world = world;
    this.layers = []; // { mesh, caps: [idx], snags: [{x,z}], effigies: [{x,z}], marks: [{x,z}] }
    this.day = 1;
  }

  _free(x, z, r) {
    const w = this.world;
    if (Math.hypot(x, z - 3) < 16) return false;
    if (w.trails?.near(x, z, r + 1.2)) return false;
    if (!w.col.free(x, z, r + 0.6)) return false;
    if (w.inLandmark(x, z, 2)) return false;
    if (Math.abs(x - 96) < 22 && z > 222) return false; // the yard and the road out
    const L = w.lake;
    if (L && Math.hypot(x - L.x, z - L.z) < L.r + 5) return false;
    return true;
  }

  generate() {
    const w = this.world, rng = new RNG((w.seed ^ 0x64656361) >>> 0), half = w.half - 12;
    // the trunks that can be marked: real standing trees (not stumps), nearest the paths first
    const trees = [];
    for (const c of w.col.caps) if (c.kind === CAP.TREE && c.h >= 5 && c.r > 0.15 && c.ax === c.bx) trees.push(c);
    const byPath = trees.filter((c) => w.trails?.near(c.ax, c.az, 9));
    const used = new Set();
    for (let L = 0; L < DECAY_LAYERS; L++) {
      const b = new MeshBuilder(6000), layer = { mesh: null, caps: [], snags: [], effigies: [], marks: [] };
      // snags: anywhere in the forest
      for (let n = 0, tries = 0; n < DECAY.snags && tries < 400; tries++) {
        const x = rng.float(-half, half), z = rng.float(-half, half);
        if (!this._free(x, z, 0.6)) continue;
        const s = rng.float(0.85, 1.3);
        this._snag(b, x, w.terrain.height(x, z), z, s, rng);
        layer.caps.push(w.col.circle(x, z, 0.3 * s, 8 * s, CAP.TREE));
        layer.snags.push({ x, z });
        n++;
      }
      // the stick men: by a path, and each layer's a little nearer the camp than the last
      const near = 190 - L * 36, far = Math.max(near * 0.35, 22);
      for (let n = 0, tries = 0; n < DECAY.effigies && tries < 600; tries++) {
        const a = rng.float(0, 6.283), d = rng.float(far, near), x = Math.cos(a) * d, z = 3 + Math.sin(a) * d;
        if (Math.abs(x) > half || Math.abs(z) > half) continue;
        if (!w.trails?.near(x, z, 5) || w.trails.near(x, z, 1.6)) continue;
        if (!w.col.free(x, z, 0.7) || w.inLandmark(x, z, 1) || Math.hypot(x, z - 3) < 14) continue;
        const kind = rng.chance(0.55) ? 'scarecrow' : 'stick';
        this._effigy(b, x, w.terrain.height(x, z), z, rng, kind);
        layer.caps.push(w.col.circle(x, z, 0.14, 2, CAP.EFFIGY));
        layer.effigies.push({ x, z, kind });
        n++;
      }
      // red marks on trunks by the paths (and a few deeper in)
      for (let n = 0, tries = 0; n < DECAY.marks && tries < 500; tries++) {
        const pool = rng.chance(0.8) && byPath.length ? byPath : trees;
        const c = pool[rng.int(0, pool.length - 1)];
        if (!c || used.has(c)) continue;
        used.add(c);
        this._mark(b, c, w.terrain.height(c.ax, c.az), rng, L);
        layer.marks.push({ x: c.ax, z: c.az });
        n++;
      }
      for (const idx of layer.caps) this._park(idx, true);
      const geo = b.toGeometry();
      const mesh = new THREE.Mesh(geo, w.material);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      mesh.visible = false;
      mesh.userData.decayLayer = L;
      w.scene.add(mesh);
      layer.mesh = mesh;
      this.layers.push(layer);
    }
    return this;
  }

  // a collider out of the world (r < 0: no query finds it), or back where it was filed
  _park(idx, parked) {
    const c = this.world.col.caps[idx];
    if (!c) return;
    if (parked) {
      if (c.r >= 0) { c._r = c.r; c._h = c.h; }
      c.r = -1;
      c.h = -1;
    } else if (c._r != null) {
      c.r = c._r;
      c.h = c._h;
    }
  }

  // which layers stand on this day of the shift (day 1: none — the forest as it was)
  setDay(day) {
    this.day = day | 0;
    for (let L = 0; L < this.layers.length; L++) {
      const on = this.day >= L + 2, layer = this.layers[L];
      if (layer.mesh.visible === on) continue;
      layer.mesh.visible = on;
      for (const idx of layer.caps) this._park(idx, !on);
    }
  }

  // how many of each are standing now (the HUD's morning line, tests)
  counts() {
    const out = { snags: 0, effigies: 0, marks: 0 };
    for (const l of this.layers) if (l.mesh.visible) { out.snags += l.snags.length; out.effigies += l.effigies.length; out.marks += l.marks.length; }
    return out;
  }

  // a dead tree: a bare, cracked trunk gone grey, a few broken limbs, the top snapped off
  _snag(b, x, y, z, s, rng) {
    const ry = rng.float(0, 6.283), tilt = rng.float(-0.1, 0.1), h = rng.float(5.5, 9);
    b.place(x, y - 0.3, z, tilt, ry, tilt * 0.6, s);
    b.cylinder(5, 0.32, 0.09, h, KIND.BARK, { capTop: true });
    const nb = rng.int(2, 4);
    for (let i = 0; i < nb; i++) {
      const by = h * rng.float(0.3, 0.85), a = rng.float(0, 6.283), len = rng.float(0.7, 2.2) * (1.15 - by / h), up = rng.float(-0.35, 0.5);
      const rr = 0.3 * (1 - by / h) + 0.05;
      b.limb([Math.cos(a) * rr * 0.5, by, Math.sin(a) * rr * 0.5], [Math.cos(a) * len, by + len * up, Math.sin(a) * len], 0.07, 0.015, KIND.BARK, 3);
    }
    // the splintered top: three teeth of wood
    for (let i = 0; i < 3; i++) {
      const a = ry + i * 2.1;
      b.limb([Math.cos(a) * 0.04, h - 0.05, Math.sin(a) * 0.04], [Math.cos(a) * 0.07, h + rng.float(0.25, 0.6), Math.sin(a) * 0.07], 0.05, 0.005, KIND.BARK, 3);
    }
  }

  // a stick man (stake, arms, a knot of a head) or a scarecrow (a crossbar in a coat, a sack for a head, rags)
  _effigy(b, x, y, z, rng, kind) {
    const ry = rng.float(0, 6.283), lean = rng.float(-0.18, 0.18);
    b.place(x, y - 0.05, z, lean, ry, lean * 0.5, 1);
    if (kind === 'stick') {
      b.limb([0, 0, 0], [0, 2.3, 0], 0.045, 0.035, KIND.EFFIGY);
      b.limb([-0.5, 1.75, 0], [0.5, 1.7, 0], 0.03, 0.03, KIND.EFFIGY);
      b.limb([0, 1.05, 0], [-0.24, 0.3, 0.05], 0.03, 0.02, KIND.EFFIGY);
      b.limb([0, 1.05, 0], [0.22, 0.3, -0.05], 0.03, 0.02, KIND.EFFIGY);
      b.place(x, y + 2.05, z, 0.3, ry, lean, 1);
      b.octa(0.13, 0.15, KIND.EFFIGY);
      return;
    }
    const tall = rng.float(1.9, 2.4);
    b.limb([0, 0, 0], [0, tall + 0.25, 0], 0.05, 0.04, KIND.WOOD); // the stake
    b.limb([-0.7, tall - 0.35, 0], [0.7, tall - 0.4, 0], 0.035, 0.035, KIND.WOOD); // the arms' bar
    // the coat: a sack hung on the bar, wider at the shoulders, rags hanging off the arms
    b.place(x, y - 0.05 + tall - 1.25, z, lean, ry, lean * 0.5, 1);
    b.taper(0.4, 0.2, 0.62, 0.24, 0.95, KIND.EFFIGY);
    b.place(x, y - 0.05, z, lean, ry, lean * 0.5, 1);
    for (const sx of [-1, 1]) {
      const ax = sx * rng.float(0.45, 0.65);
      b.quad([ax - 0.09, tall - 0.38, 0.02], [ax + 0.09, tall - 0.38, 0.02], [ax + 0.06, tall - 0.38 - rng.float(0.35, 0.6), 0.03], [ax - 0.05, tall - 0.38 - rng.float(0.3, 0.55), 0.03], KIND.EFFIGY);
    }
    // the head: a sack, tied off at the neck, tilted
    b.place(x, y - 0.05 + tall + 0.05, z, rng.float(-0.35, 0.35), ry, lean + rng.float(-0.3, 0.3), 1);
    b.rock(0.19, () => rng.next(), KIND.EFFIGY, 0.3, 1.15);
  }

  // paint on a trunk: a ring round it at chest height (sometimes two), or a slash across it
  _mark(b, c, y, rng, L) {
    const kind = L >= 2 && rng.chance(0.35) ? RED_DARK : RED;
    const R = c.r * 0.92 + 0.035, yb = y + rng.float(1.15, 1.65), ry = rng.float(0, 6.283);
    b.place(c.ax, yb, c.az, 0, ry, 0, 1);
    const style = rng.next();
    if (style < 0.6) {
      b.cylinder(7, R, R * 0.985, rng.float(0.09, 0.17), kind, { capTop: false, ringEdges: false });
      if (rng.chance(0.4)) b.cylinder(7, R * 0.985, R * 0.97, 0.07, kind, { y0: 0.26, capTop: false, ringEdges: false });
    } else {
      // a slash: a strip wrapped part way round, climbing as it goes (and a cross, now and then)
      const n = 4, span = rng.float(1.3, 2.0), rise = rng.float(0.25, 0.45), hw = 0.045;
      const strip = (dir) => {
        for (let i = 0; i < n; i++) {
          const a0 = (i / n - 0.5) * span, a1 = ((i + 1) / n - 0.5) * span;
          const y0 = (i / n - 0.5) * rise * dir, y1 = ((i + 1) / n - 0.5) * rise * dir;
          const p0 = [Math.cos(a0) * R, y0 - hw, Math.sin(a0) * R], p1 = [Math.cos(a1) * R, y1 - hw, Math.sin(a1) * R];
          const q1 = [Math.cos(a1) * R, y1 + hw, Math.sin(a1) * R], q0 = [Math.cos(a0) * R, y0 + hw, Math.sin(a0) * R];
          b.quadN(p0, p1, q1, q0, [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)], kind, 0);
        }
      };
      strip(1);
      if (rng.chance(0.45)) strip(-1);
    }
  }

  dispose(scene) {
    for (const l of this.layers) {
      scene.remove(l.mesh);
      l.mesh.geometry.dispose();
      for (const idx of l.caps) this._park(idx, true);
    }
    this.layers = [];
  }
}
