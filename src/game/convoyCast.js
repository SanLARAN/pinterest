// (5.0b) The cars of chapter 1, «Кортеж»: the convoy that overtakes the crew on the night highway — a police car
// in front, the ambulance, two fire engines (one with a lighting mast), a police car behind — and the queue at
// the blockade: a lorry and a Lada. Built like everything else in the world (MeshBuilder + the garage's paints,
// drawn in the world's material: lit only by what lights them), nose toward −x, standing on y = 0.
//
// Their lamps are sprites (the beacon halo of 4.1), and each flashing vehicle also lends the film one real light —
// its beacon — for the shader's small-light slots (convoyFilm.js decides which ones get a slot).
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { GK, boxAt, tyre } from '../ui/garageSet.js';
import { haloMaterial } from './glowsticks.js';
import { beaconTexture, policeGeometry } from './roadTraffic.js';

const PI = Math.PI;

// a legend in pixels (3 × 5 each), geometry and not a font: it reads from both sides (the far side is mirrored back)
const GLYPH = {
  'С': ['111', '100', '100', '100', '111'], 'К': ['101', '110', '100', '110', '101'], 'О': ['111', '101', '101', '101', '111'],
  'Р': ['111', '101', '111', '100', '100'], 'А': ['010', '101', '111', '101', '101'], 'Я': ['111', '101', '111', '011', '101'],
  'М': ['101', '111', '111', '101', '101'], 'Ч': ['101', '101', '111', '001', '001'], '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'], '3': ['111', '001', '011', '001', '111'],
};
function legend(b, text, cx, top, z, px, kind) {
  const n = text.length, w = (n * 4 - 1) * px;
  for (const side of [-1, 1]) {
    const dir = side; // +z side reads toward +x, the −z side toward −x
    [...text].forEach((ch, k) => {
      const g = GLYPH[ch];
      if (!g) return;
      g.forEach((row, j) => [...row].forEach((bit, i) => {
        if (bit !== '1') return;
        const lx = -w / 2 + (k * 4 + i) * px + px / 2;
        boxAt(b, cx + dir * lx, top - j * px, side * z, px * 0.9, px * 0.9, 0.012, kind);
      }));
    });
  }
}
function wheels(b, xs, z, r, w = 0.24) {
  for (const x of xs) for (const s of [-1, 1]) {
    b.place(x, r, s * z, PI / 2, 0, 0);
    tyre(b, r, w, GK.RUBBER, 12, true);
  }
}

// the ambulance: a van with a tall white box, the red band, crosses, «СКОРАЯ», blue beacons
export function ambulanceGeometry() {
  const b = new MeshBuilder(6144);
  boxAt(b, 0.75, 1.6, 0, 4.1, 2.1, 2.04, KIND.BONE);
  boxAt(b, -2.0, 0.95, 0, 1.6, 0.9, 1.96, KIND.BONE);
  b.place(-1.85, 1.4, 0);
  b.taper(1.3, 1.92, 0.72, 1.86, 0.95, GK.GLASS, 0, 0.29);
  boxAt(b, 0.75, 1.2, 0, 4.12, 0.22, 2.06, GK.MARK);
  boxAt(b, -2.0, 1.2, 0, 1.62, 0.16, 1.98, GK.MARK);
  boxAt(b, 1.95, 1.98, 0, 0.62, 0.18, 2.07, GK.MARK);
  boxAt(b, 1.95, 1.98, 0, 0.18, 0.62, 2.07, GK.MARK);
  boxAt(b, 2.81, 1.98, 0, 0.03, 0.5, 0.16, GK.MARK);
  boxAt(b, 2.81, 1.98, 0, 0.03, 0.16, 0.5, GK.MARK);
  legend(b, 'СКОРАЯ', 0.2, 2.42, 1.026, 0.07, GK.MARK);
  boxAt(b, -1.55, 2.42, 0, 0.32, 0.12, 1.3, GK.DARK);
  for (const s of [-1, 1]) {
    boxAt(b, -1.55, 2.53, s * 0.42, 0.26, 0.14, 0.34, GK.NIGHT);
    boxAt(b, 2.72, 2.52, s * 0.88, 0.12, 0.16, 0.16, GK.NIGHT);
    boxAt(b, -2.81, 0.95, s * 0.7, 0.04, 0.2, 0.32, GK.HEADLAMP);
    boxAt(b, 2.81, 0.95, s * 0.86, 0.04, 0.32, 0.18, GK.TAILLAMP);
  }
  boxAt(b, -2.81, 0.95, 0, 0.04, 0.24, 0.8, GK.DARK);
  boxAt(b, -2.86, 0.58, 0, 0.12, 0.2, 2.0, GK.DARK);
  boxAt(b, 2.86, 0.58, 0, 0.12, 0.2, 2.0, GK.DARK);
  boxAt(b, 2.81, 1.6, 0, 0.02, 1.9, 0.03, GK.DARK); // the back doors' seam
  wheels(b, [-1.95, 1.75], 0.92, 0.37);
  return b.toGeometry();
}

// a fire engine: a flat-fronted red cab, the body with three roller shutters, a ladder on the roof, «МЧС»
export function fireGeometry() {
  const b = new MeshBuilder(8192);
  boxAt(b, -3.35, 1.95, 0, 1.75, 2.1, 2.45, GK.REDPAINT);
  boxAt(b, -4.235, 2.35, 0, 0.03, 0.75, 2.2, GK.GLASS);
  for (const s of [-1, 1]) boxAt(b, -3.5, 2.35, s * 1.236, 1.0, 0.7, 0.03, GK.GLASS);
  boxAt(b, 0.9, 1.97, 0, 6.6, 2.05, 2.5, GK.REDPAINT);
  boxAt(b, -3.35, 1.42, 0, 1.77, 0.16, 2.47, KIND.BONE);
  boxAt(b, 0.9, 1.42, 0, 6.62, 0.16, 2.52, KIND.BONE);
  for (const cx of [-1.3, 0.9, 3.1]) {
    for (let y = 1.62; y < 2.86; y += 0.11) for (const s of [-1, 1]) boxAt(b, cx, y, s * 1.256, 1.8, 0.03, 0.02, GK.CHROME);
  }
  boxAt(b, 0, 0.72, 0, 8.4, 0.32, 2.2, GK.DARK);
  for (const s of [-1, 1]) boxAt(b, 0.9, 3.18, s * 0.5, 6.0, 0.08, 0.06, GK.CHROME);
  for (let x = -2; x < 3.9; x += 0.4) boxAt(b, x, 3.18, 0, 0.05, 0.05, 1.0, GK.CHROME);
  boxAt(b, -3.5, 3.08, 0, 0.3, 0.12, 1.6, GK.DARK);
  for (const s of [-1, 1]) {
    boxAt(b, -3.5, 3.19, s * 0.55, 0.26, 0.14, 0.4, GK.NIGHT);
    boxAt(b, -4.24, 1.1, s * 0.85, 0.04, 0.22, 0.34, GK.HEADLAMP);
    boxAt(b, 4.21, 1.1, s * 1.0, 0.04, 0.3, 0.2, GK.TAILLAMP);
  }
  boxAt(b, -4.24, 1.15, 0, 0.04, 0.35, 1.0, GK.DARK);
  boxAt(b, -4.3, 0.75, 0, 0.14, 0.26, 2.4, GK.CHROME);
  legend(b, 'МЧС', -3.35, 1.86, 1.236, 0.08, KIND.BONE);
  wheels(b, [-3.2, 1.9, 3.25], 1.0, 0.55, 0.4);
  return b.toGeometry();
}

// the lighting mast that stands up out of the first engine's body: a pole, and the head on its own pivot
function mastGeometry() {
  const b = new MeshBuilder(512);
  b.identity();
  b.limb([0, 0, 0], [0, 4.3, 0], 0.09, 0.06, GK.CHROME, 6);
  return b.toGeometry();
}
function floodGeometry() {
  const b = new MeshBuilder(256);
  boxAt(b, 0.05, 0, 0, 0.42, 0.42, 0.7, GK.DARK);
  boxAt(b, -0.17, 0, 0, 0.02, 0.36, 0.62, GK.BULB);
  return b.toGeometry();
}

// a lorry in the queue: a white cab, a long canvas trailer, amber markers down its sides
export function lorryGeometry() {
  const b = new MeshBuilder(6144);
  boxAt(b, -6.0, 1.95, 0, 2.0, 2.3, 2.45, KIND.BONE);
  boxAt(b, -7.01, 2.45, 0, 0.03, 0.8, 2.2, GK.GLASS);
  boxAt(b, -6.0, 1.25, 0, 2.02, 0.2, 2.47, GK.NIGHT);
  boxAt(b, 1.6, 2.35, 0, 12.6, 2.7, 2.5, GK.CANVAS);
  boxAt(b, 0.5, 0.8, 0, 15, 0.3, 2.0, GK.DARK);
  for (const s of [-1, 1]) {
    boxAt(b, -7.03, 1.15, s * 0.95, 0.04, 0.22, 0.3, GK.HEADLAMP);
    boxAt(b, 7.92, 1.2, s * 1.1, 0.04, 0.24, 0.2, GK.TAILLAMP);
  }
  boxAt(b, -7.05, 0.85, 0, 0.12, 0.3, 2.4, GK.CHROME);
  wheels(b, [-6.3, -4.3, 4.6, 5.9, 7.2], 1.0, 0.5, 0.34);
  return b.toGeometry();
}

// a Lada: a low box, glass all round the cabin
export function sedanGeometry(paint = GK.REDPAINT) {
  const b = new MeshBuilder(3072);
  boxAt(b, 0, 0.62, 0, 4.1, 0.55, 1.62, paint);
  b.place(0.25, 0.9, 0);
  b.taper(2.3, 1.55, 1.7, 1.4, 0.48, GK.GLASS, 0, 0.05);
  boxAt(b, 0.28, 1.39, 0, 1.6, 0.04, 1.38, paint);
  for (const s of [-1, 1]) {
    boxAt(b, -2.06, 0.7, s * 0.55, 0.04, 0.16, 0.3, GK.HEADLAMP);
    boxAt(b, 2.06, 0.72, s * 0.6, 0.04, 0.14, 0.26, GK.TAILLAMP);
  }
  boxAt(b, -2.1, 0.45, 0, 0.1, 0.16, 1.62, GK.CHROME);
  boxAt(b, 2.1, 0.45, 0, 0.1, 0.16, 1.62, GK.CHROME);
  wheels(b, [-1.25, 1.25], 0.72, 0.3, 0.2);
  return b.toGeometry();
}

// ---------------------------------------------------------------- lamps

export const LAMP_HEX = { red: 0xff251c, blue: 0x3b80ff, head: 0xfff1d6, tail: 0xff2a1a, marker: 0xffa020, flood: 0xfff4dc };
export const LAMP_RGB = { red: [1, 0.12, 0.08], blue: [0.16, 0.38, 1], head: [1, 0.93, 0.8], flood: [1, 0.95, 0.86] };
const SIZE = { red: 1.9, blue: 1.9, head: 1.7, tail: 0.75, marker: 0.4, flood: 3.2 };

// the flashing: which side of the beacon bar is lit at time t (0/1 each) — a police double-flash red then blue,
// the ambulance's quick blue, the fire engines' slower blue pairs
export function flashState(kind, t, phase = 0) {
  const u = t + phase;
  if (kind === 'police') { const p = Math.floor(u * 10) % 8; return { a: p === 0 || p === 2 ? 1 : 0, b: p === 4 || p === 6 ? 1 : 0 }; }
  if (kind === 'ambulance') { const p = Math.floor(u * 7.5) % 4; return { a: p === 0 ? 1 : 0, b: p === 2 ? 1 : 0 }; }
  if (kind === 'fire') { const p = Math.floor(u * 9) % 6; return { a: p === 0 || p === 2 ? 1 : 0, b: p === 3 || p === 5 ? 1 : 0 }; }
  return { a: 0, b: 0 };
}

const SPECS = {
  police: {
    geo: () => policeGeometry(), len: 4.1,
    lamps: [['red', 0.12, 1.79, -0.38, 'a'], ['blue', 0.12, 1.79, 0.38, 'b'], ['head', -2.08, 0.82, 0.58], ['head', -2.08, 0.82, -0.58], ['tail', 2.08, 0.8, 0.58], ['tail', 2.08, 0.8, -0.58]],
    beacon: [0.12, 1.85, 0],
  },
  ambulance: {
    geo: () => ambulanceGeometry(), len: 5.7,
    lamps: [['blue', -1.55, 2.56, 0.42, 'a'], ['blue', -1.55, 2.56, -0.42, 'b'], ['blue', 2.74, 2.54, 0.88, 'b'], ['blue', 2.74, 2.54, -0.88, 'a'],
      ['head', -2.84, 0.95, 0.7], ['head', -2.84, 0.95, -0.7], ['tail', 2.84, 0.95, 0.86], ['tail', 2.84, 0.95, -0.86]],
    beacon: [-1.55, 2.65, 0],
  },
  fire: {
    geo: () => fireGeometry(), len: 8.5,
    lamps: [['blue', -3.5, 3.22, 0.55, 'a'], ['blue', -3.5, 3.22, -0.55, 'b'], ['head', -4.27, 1.1, 0.85], ['head', -4.27, 1.1, -0.85], ['tail', 4.24, 1.1, 1.0], ['tail', 4.24, 1.1, -1.0]],
    beacon: [-3.5, 3.3, 0],
  },
  lorry: {
    geo: () => lorryGeometry(), len: 15,
    lamps: [['head', -7.06, 1.15, 0.95], ['head', -7.06, 1.15, -0.95], ['tail', 7.95, 1.2, 1.1], ['tail', 7.95, 1.2, -1.1],
      ...[-3.5, -1, 1.5, 4, 6.5].flatMap((x) => [['marker', x, 1.08, 1.27], ['marker', x, 1.08, -1.27]])],
  },
  sedan: {
    geo: () => sedanGeometry(), len: 4.1,
    lamps: [['head', -2.09, 0.7, 0.55], ['head', -2.09, 0.7, -0.55], ['tail', 2.09, 0.72, 0.6], ['tail', 2.09, 0.72, -0.6]],
  },
  sedanW: {
    geo: () => sedanGeometry(KIND.BONE), len: 4.1,
    lamps: [['head', -2.09, 0.7, 0.55], ['head', -2.09, 0.7, -0.55], ['tail', 2.09, 0.72, 0.6], ['tail', 2.09, 0.72, -0.6]],
  },
};

const _v = new THREE.Vector3();

// one vehicle of the film: a root on the road (nose −x), the body inside it (it can be squashed, rolled, thrown),
// its lamps (sprites), and for the flashing ones a beacon light the film can give a slot
export class Vehicle {
  constructor(kind, material, scene, opts = {}) {
    const S = SPECS[kind];
    this.kind = kind;
    this.siren = kind === 'police' ? 'police' : kind === 'ambulance' ? 'ambulance' : kind === 'fire' ? 'fire' : null;
    this.phase = opts.phase || 0;
    this.len = S.len;
    this.root = new THREE.Group();
    this.root.rotation.order = 'YXZ';
    this.body = new THREE.Group();
    this.root.add(this.body);
    this.geo = S.geo();
    const mesh = new THREE.Mesh(this.geo, material);
    mesh.frustumCulled = false;
    this.body.add(mesh);
    this.beaconAt = S.beacon || null;
    this.halos = S.lamps.map(([type, x, y, z, side]) => {
      const m = haloMaterial(LAMP_HEX[type], beaconTexture());
      const sp = new THREE.Sprite(m);
      sp.position.set(x, y, z);
      sp.scale.setScalar(SIZE[type]);
      this.body.add(sp);
      return { sp, type, side };
    });
    this.extra = [];
    if (opts.mast) {
      // the lighting mast: up out of the body, its head aimed by the film (head.rotation: y = yaw, z = tilt)
      this.mastGeo = mastGeometry();
      this.floodGeo = floodGeometry();
      const mast = (this.mast = new THREE.Mesh(this.mastGeo, material));
      mast.position.set(1.4, 3.05, 0);
      mast.frustumCulled = false;
      this.body.add(mast);
      this.head = new THREE.Group();
      this.head.rotation.order = 'YXZ';
      this.head.position.set(1.4, 7.35, 0);
      this.body.add(this.head);
      const hm = new THREE.Mesh(this.floodGeo, material);
      hm.frustumCulled = false;
      this.head.add(hm);
      const fm = haloMaterial(LAMP_HEX.flood, beaconTexture());
      this.floodHalo = new THREE.Sprite(fm);
      this.floodHalo.position.set(-0.32, 0, 0);
      this.floodHalo.scale.setScalar(SIZE.flood);
      this.head.add(this.floodHalo);
    }
    this.on = { lamps: true, brake: false, flash: !!this.siren, flood: !!opts.mast, dead: false };
    scene.add(this.root);
  }

  place(x, y, z, yaw = 0, pitch = 0, roll = 0) {
    this.root.position.set(x, y, z);
    this.root.rotation.set(roll, yaw, pitch);
    this.root.visible = true;
  }

  hide() {
    this.root.visible = false;
  }

  // the lamps at time t: the beacons flash, brakes glow, a dead one is dark (a crushed car's last flicker aside)
  lamps(t) {
    const f = flashState(this.siren, t, this.phase);
    const on = this.on;
    for (const h of this.halos) {
      let k = 0;
      if (h.type === 'red' || h.type === 'blue') k = on.flash && !on.dead ? (h.side === 'a' ? f.a : f.b) * 1.8 : 0.03;
      else if (h.type === 'head') k = on.lamps && !on.dead ? 1.25 : 0;
      else if (h.type === 'tail') k = on.dead ? 0 : on.brake ? 1.6 : on.lamps ? 0.75 : 0;
      else if (h.type === 'marker') k = on.lamps ? 0.9 : 0;
      h.sp.material.opacity = k;
      h.sp.visible = k > 0.001;
    }
    if (this.floodHalo) this.floodHalo.material.opacity = on.flood && !on.dead && this.head.visible ? 2.2 : 0;
  }

  // its beacon as a real light: where it is (world), which colour is lit now, how bright
  beacon(t, out = {}) {
    if (!this.beaconAt || !this.siren || !this.root.visible) return null;
    const f = flashState(this.siren, t, this.phase);
    const lit = this.on.flash && !this.on.dead ? Math.max(f.a, f.b) : 0;
    this.root.updateMatrixWorld(true);
    _v.set(...this.beaconAt).applyMatrix4(this.body.matrixWorld);
    out.x = _v.x; out.y = _v.y; out.z = _v.z;
    out.c = this.siren === 'police' ? (f.a ? LAMP_RGB.red : LAMP_RGB.blue) : LAMP_RGB.blue;
    out.I = 0.06 + 3.0 * lit;
    return out;
  }

  // the floodlight's beam: where the head is, and which way it looks (world)
  flood(out = {}) {
    if (!this.head || !this.on.flood || this.on.dead || !this.root.visible || !this.head.visible) return null;
    this.root.updateMatrixWorld(true);
    _v.set(-0.3, 0, 0).applyMatrix4(this.head.matrixWorld);
    out.x = _v.x; out.y = _v.y; out.z = _v.z;
    const d = new THREE.Vector3(-1, 0, 0).transformDirection(this.head.matrixWorld);
    out.dir = [d.x, d.y, d.z];
    return out;
  }

  dispose() {
    this.root.removeFromParent();
    this.geo.dispose();
    this.mastGeo?.dispose();
    this.floodGeo?.dispose();
    for (const h of this.halos) h.sp.material.dispose();
    this.floodHalo?.material.dispose();
  }
}
