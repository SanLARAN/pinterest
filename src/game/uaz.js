// The УАЗ in the forestry yard — the same car that took you out to the forest (ui/garageSet.js), left here
// broken: a front wheel gone (the hub on a stump), the hood propped open over an empty battery tray and a
// bare carburettor flange, the tank dry. And the four things it needs, as real objects you carry about.
//
// Car-local frame (as in the garage): nose toward −x, driver's side +z, ground at y = 0.
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { GK, CARP, boxAt, tyre, buildCarBody, buildSteering, buildCarGlass } from '../ui/garageSet.js';

const PI = Math.PI;

// ---------------- the four parts ----------------
// half: half-extents of the part in its own frame (centre of mass at the origin). walk: how fast you go
// carrying it (m/s, no running). throw: m/s out of your hands (+ up). land: how loud it lands (monsters hear)
export const PARTS = [
  { key: 'wheel', half: [0.39, 0.125, 0.39], walk: 2.25, step: 0.11, throw: 6.2, up: 1.4, land: 0.26, bounce: 0.42, slide: 7, work: 5.0, workLoud: 0.24 },
  { key: 'battery', half: [0.15, 0.115, 0.09], walk: 1.9, step: 0.12, throw: 3.8, up: 2.2, land: 0.3, bounce: 0.14, slide: 11, work: 3.2, workLoud: 0.1 },
  { key: 'carb', half: [0.075, 0.085, 0.07], walk: 2.9, step: 0.09, throw: 8.2, up: 3.0, land: 0.2, bounce: 0.3, slide: 6, work: 4.0, workLoud: 0.14 },
  { key: 'can', half: [0.085, 0.24, 0.17], walk: 2.15, step: 0.11, throw: 4.8, up: 2.4, land: 0.34, bounce: 0.28, slide: 8, work: 4.2, workLoud: 0.08 },
];
export const PART_KEYS = PARTS.map((p) => p.key);

// where each part goes on the car (car-local): where you stand to fit it, and where it ends up
export const SLOTS = {
  wheel: { stand: [-1.19, 0, 1.78], at: [-1.19, CARP.wheelR, 0.76] },
  battery: { stand: [-2.75, 0, 0.5], at: [-1.6, 0.92, 0.5] },
  carb: { stand: [-2.75, 0, -0.3], at: [-1.18, 1.095, -0.12] },
  can: { stand: [0.72, 0, 1.7], at: [0.72, 0.62, 0.93] },
};

// the seats: where a body sits (hips, car-local), where you stand to get in, where your eyes are
export const SEATS = [
  { kind: 'driver', hip: [0.13, 0.9, 0.42], door: [0.15, 0, 1.65], eye: [0.12, 1.62, 0.42] },
  { kind: 'front', hip: [0.13, 0.9, -0.42], door: [0.15, 0, -1.65], eye: [0.12, 1.62, -0.42] },
  { kind: 'rear', hip: [1.16, 0.92, 0.45], door: [1.25, 0, 1.65], eye: [1.12, 1.64, 0.45] },
  { kind: 'rear', hip: [1.16, 0.92, -0.45], door: [1.25, 0, -1.65], eye: [1.12, 1.64, -0.45] },
];
export const HOOD_HINGE = [-0.72, 1.09, 0];
export const HOOD_OPEN = -1.05;
export const MISSING = 1; // which of the four wheels (index into WHEELS) is the one you have to find
export const WHEELS = [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => [sx * CARP.wheelX, CARP.wheelR, sz * CARP.wheelZ]);

// ---------------- part meshes (each in its own frame) ----------------
function wheelPart(b) {
  const r = CARP.wheelR, w = CARP.wheelW;
  b.identity();
  tyre(b, r, w, GK.RUBBER, 12, true);
  for (const s of [-1, 1]) {
    b.place(0, s * w * 0.36, 0, s < 0 ? PI : 0, 0, 0);
    b.cylinder(10, r * 0.55, r * 0.55, 0.02, GK.CARPAINT, { y0: -0.01, capBottom: true });
    b.place(0, s * w * 0.42, 0, s < 0 ? PI : 0, 0, 0);
    b.cylinder(6, 0.07, 0.06, 0.03, GK.CHROME, { y0: 0 });
  }
  // a strip of reflective tape someone wound round the rim (it catches any light)
  b.place(r * 0.56, 0, 0, 0, 0, 0);
  b.box(0.03, w * 0.8, 0.07, KIND.SHARD);
}

function batteryPart(b) {
  const D = GK.DARK;
  boxAt(b, 0, -0.015, 0, 0.3, 0.2, 0.18, D);
  boxAt(b, 0, 0.09, 0, 0.29, 0.015, 0.17, GK.RUBBER); // the lid
  for (let i = 0; i < 6; i++) { // cell caps
    b.place(-0.11 + i * 0.044, 0.1, 0.02);
    b.cylinder(5, 0.012, 0.012, 0.012, GK.RUBBER);
  }
  for (const [x, k] of [[-0.12, GK.REDPAINT], [0.12, GK.TIN]]) { // the two posts (+ under a red cap)
    b.place(x, 0.1, -0.055);
    b.cylinder(6, 0.016, 0.014, 0.03, k);
  }
  b.identity();
  b.limb([-0.1, 0.1, 0.0], [-0.05, 0.155, 0.0], 0.008, 0.008, GK.RUBBER, 3); // the strap handle
  b.limb([-0.05, 0.155, 0.0], [0.05, 0.155, 0.0], 0.008, 0.008, GK.RUBBER, 3);
  b.limb([0.05, 0.155, 0.0], [0.1, 0.1, 0.0], 0.008, 0.008, GK.RUBBER, 3);
  boxAt(b, 0, -0.02, 0.091, 0.14, 0.07, 0.004, KIND.SHARD); // the label
}

function carbPart(b) {
  const A = GK.TIN;
  boxAt(b, 0, -0.075, 0, 0.15, 0.014, 0.13, A); // the flange
  for (const [x, z] of [[-0.06, -0.05], [0.06, -0.05], [-0.06, 0.05], [0.06, 0.05]]) {
    b.place(x, -0.068, z);
    b.cylinder(5, 0.008, 0.008, 0.01, GK.DARK);
  }
  boxAt(b, 0, -0.02, 0, 0.12, 0.1, 0.11, A); // the body
  boxAt(b, 0.068, -0.02, 0.0, 0.02, 0.07, 0.07, A); // float chamber
  b.place(0, 0.03, 0);
  b.cylinder(8, 0.052, 0.05, 0.05, A, { capTop: false }); // the air horn
  b.place(0, 0.035, 0);
  b.cylinder(8, 0.04, 0.04, 0.004, GK.DARK); // ...and the dark inside it
  b.identity();
  b.limb([-0.06, -0.03, 0.05], [-0.1, 0.0, 0.07], 0.006, 0.006, GK.CHROME, 3); // throttle lever
  b.limb([0.07, 0.0, -0.03], [0.1, 0.02, -0.06], 0.007, 0.007, GK.CHROME, 3); // fuel inlet
  boxAt(b, -0.1, -0.035, 0.07, 0.035, 0.045, 0.004, KIND.SHARD, 0.3); // a cardboard tag on a string
}

function canPart(b) {
  const R = GK.REDPAINT;
  boxAt(b, 0, -0.02, 0, 0.17, 0.4, 0.34, R);
  b.identity();
  for (const x of [-0.088, 0.088]) { // the pressed X on both flanks
    b.limb([x, -0.15, -0.13], [x, 0.13, 0.13], 0.006, 0.006, R, 3);
    b.limb([x, -0.15, 0.13], [x, 0.13, -0.13], 0.006, 0.006, R, 3);
  }
  for (const x of [-0.04, 0, 0.04]) { // three-bar handle
    b.limb([x, 0.18, -0.15], [x, 0.245, -0.13], 0.01, 0.01, R, 4);
    b.limb([x, 0.245, -0.13], [x, 0.245, 0.0], 0.01, 0.01, R, 4);
    b.limb([x, 0.245, 0.0], [x, 0.18, 0.03], 0.01, 0.01, R, 4);
  }
  b.place(0, 0.165, 0.11, 0.55, 0, 0);
  b.cylinder(7, 0.03, 0.028, 0.06, KIND.SHARD); // the spout and its cap: amber, the way they make them
  b.place(0, 0.2, 0.145, 0.55, 0, 0);
  b.cylinder(7, 0.034, 0.034, 0.025, KIND.SHARD);
}

const PART_BUILD = { wheel: wheelPart, battery: batteryPart, carb: carbPart, can: canPart };

export function buildPart(key, b = new MeshBuilder(1024)) {
  PART_BUILD[key](b);
  return b;
}

// ---------------- the car ----------------
// the bay under the hood: radiator, block, cables — the battery's empty tray and the carburettor's bare flange
function engineBay(b) {
  const D = GK.DARK;
  boxAt(b, -1.35, 0.56, 0, 1.24, 0.03, 1.3, D); // the bay's floor
  boxAt(b, -1.93, 0.78, 0, 0.06, 0.42, 0.9, D); // radiator
  for (let i = 0; i < 6; i++) boxAt(b, -1.9, 0.78, -0.35 + i * 0.14, 0.01, 0.38, 0.012, GK.RUST);
  boxAt(b, -1.25, 0.74, -0.08, 0.62, 0.34, 0.44, D); // the block
  boxAt(b, -1.25, 0.94, -0.08, 0.56, 0.06, 0.28, GK.RUST); // valve cover
  boxAt(b, -1.18, 1.0, -0.12, 0.18, 0.04, 0.15, GK.CHROME); // the intake flange (bare studs)
  for (const [x, z] of [[-1.24, -0.17], [-1.12, -0.17], [-1.24, -0.07], [-1.12, -0.07]]) {
    b.place(x, 1.02, z);
    b.cylinder(4, 0.007, 0.007, 0.035, GK.CHROME);
  }
  boxAt(b, -1.6, 0.8, 0.5, 0.34, 0.03, 0.24, D); // the battery tray, empty
  b.identity();
  b.limb([-1.48, 0.83, 0.43], [-1.42, 0.7, 0.62], 0.012, 0.012, GK.REDPAINT, 3); // the cables, hanging loose
  b.limb([-1.72, 0.83, 0.45], [-1.8, 0.66, 0.62], 0.012, 0.012, D, 3);
  b.limb([-1.0, 0.9, -0.3], [-1.6, 0.92, -0.45], 0.02, 0.02, D, 4); // a hose
  b.limb([-1.25, 0.95, 0.15], [-1.7, 0.9, 0.3], 0.008, 0.008, GK.YELLOW, 3); // a wire
}

function hood(b) {
  // in the hinge's frame: the hood runs forward (−x) from the hinge
  boxAt(b, -0.64, -0.03, 0, 1.28, 0.06, 1.32, GK.CARPAINT, 0, 0, 0.025);
  boxAt(b, -0.64, -0.065, 0, 1.1, 0.012, 1.1, GK.DARK); // its underside
}

// the hub of the missing wheel, on a stump; the tank's filler cap (open)
function strippedBits(b) {
  const [x, y, z] = WHEELS[MISSING];
  b.place(x, y, z + 0.08, PI / 2, 0, 0);
  b.cylinder(8, 0.2, 0.2, 0.1, GK.DARK, { y0: -0.05, capTop: true, capBottom: true });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * PI * 2;
    b.place(x + Math.cos(a) * 0.12, y + Math.sin(a) * 0.12, z + 0.16, PI / 2, 0, 0);
    b.cylinder(4, 0.012, 0.012, 0.05, GK.CHROME, { y0: -0.02 });
  }
  b.place(x, 0, z - 0.08);
  b.cylinder(7, 0.18, 0.2, y - 0.2, KIND.BARK, { capTop: true }); // the stump the hub rests on
  const [fx, fy, fz] = SLOTS.can.at;
  b.place(fx, fy, fz, PI / 2, 0, 0);
  b.cylinder(7, 0.045, 0.045, 0.04, GK.DARK, { y0: -0.02 }); // the filler neck
  b.place(fx + 0.06, fy + 0.04, fz + 0.03, 0.2, 0.9, 0.4);
  b.box(0.012, 0.09, 0.09, GK.CARPAINT); // its flap, hanging open
}

// everything the forest's car is made of, as arrays (geometry data). Each wheel on its own (one is missing
// until it's found), the hood on its hinge, the installed battery and carburettor (hidden until fitted)
export function buildForestCar() {
  const body = buildCarBody({ forest: true });
  const bay = new MeshBuilder(2048);
  engineBay(bay);
  strippedBits(bay);
  // merge the bay into the body's arrays
  const merged = mergeArrays([body, bay.toArrays()]);
  // (a wheel is the part itself, axle along its y: the car turns each one onto its side, see game/escape.js)
  const wheel = buildPart('wheel').toArrays();
  const hb = new MeshBuilder(256);
  hood(hb);
  const bat = buildPart('battery').toArrays();
  const carb = buildPart('carb').toArrays();
  return { body: merged, wheel, hood: hb.toArrays(), battery: bat, carb, steering: buildSteering(), glass: buildCarGlass() };
}

export function mergeArrays(list) {
  let n = 0;
  for (const a of list) n += a.count;
  const pos = new Float32Array(n * 3), dat = new Uint8Array(n * 4);
  let o = 0;
  for (const a of list) {
    pos.set(a.pos.subarray(0, a.count * 3), o * 3);
    dat.set(a.dat.subarray(0, a.count * 4), o * 4);
    o += a.count;
  }
  return { pos, dat, count: n };
}

export function geometryOf(arr) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(arr.dat, 4, true));
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}
