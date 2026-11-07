// (5.0g) The chase on the dirt road, directed (chapter 2 of «Топь», game/roadDrive.js).
//
// What the films and the horror games that do it well have in common, and what this file puts into the drive:
//  • The thing is felt before it is seen. Sam Raimi could not afford a monster for The Evil Dead, so he gave it a
//    point of view — a camera flown low and fast between the trees on a plank — and let the audience build the rest.
//    The chase opens that way: two seconds of its eyes, rushing up the ruts toward your tail lamps, then the cut.
//  • Sound carries a dark forest: trunks splitting, branches snapping, birds going up out of the canopy wherever it
//    is moving — so you know where it is without turning round.
//  • The pursuer is marginally slower than you, and the gap breathes: it surges and falls back in waves rather than
//    hanging at one distance (tension comes in waves, not as a flat line).
//  • Near misses tell you the gap is shrinking better than contact does: every blow lands just behind, shakes the
//    car, lights the forest for a moment.
//  • A smart pursuer cuts you off: twice in the chase it reaches over the car and brings a pine down across the road
//    ahead — slow, squeeze past the crown, go.
//  • The closer it is, the louder your own heart and the wider the world goes at the edges.
//
// Pure pieces here (the tests ride on them); RoadDrive wires them in.
import * as THREE from 'three';
import { clamp, smoothstep } from '../core/rng.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { FORKS } from '../world/swamp.js';

export const BEATS = {
  raimi: 2.3, // s of its own eyes at the start of the chase (a first try only)
  raimiFrom: 34, raimiTo: 7, // m behind the car the shot starts and ends
  fellAt: [9, 22], // s into the chase: it gets ahead of you and drops a pine across the road
  fellLate: 8, // ...and gives up on that one if the road will not allow it for this long
  fellAhead: 24, // m ahead of the car
  fellLen: 4.0, // m of trunk across the road: from the verge to just short of the middle (two metres left on the far side)
  fellFall: 0.9, // s to come down
  fellCost: 18, // m it falls back for it: the car that squeezed past has its lead again
  fellGap: 46, // m: only when it is this close behind (it has to reach over you — it is long)
  wave: 0.9, wavePeriod: 9, // m/s and s: the gap breathes
  crack: [0.45, 1.3], // s between trunks splitting where it is moving
};

// its pace's wave (added to Chase.speed): ± BEATS.wave over BEATS.wavePeriod
export function chaseWave(tc) {
  return Math.sin((tc * Math.PI * 2) / BEATS.wavePeriod) * BEATS.wave;
}

// where a pine can come down ahead of the car on route R (measured: { pts, cum, len, w }), s metres along it the car
// is: { base, d, len, F } — or null (a dead end too near, a fork in the way). side: which verge it stands on (±1)
export function fellPlan(R, carS, side, pointAt) {
  const s = carS + BEATS.fellAhead;
  if (s > R.len - 8) return null;
  const F = pointAt(R, s, {});
  if (FORKS.some((f) => Math.hypot(f.x - F.x, f.z - F.z) < 14)) return null;
  const w = (R.w || 5.2) / 2 + 2.0; // (on the verge, in the young trees)
  const lx = F.dz, lz = -F.dx; // left of the way it runs
  const base = { x: F.x + lx * w * side, z: F.z + lz * w * side };
  const d = { x: -lx * side, z: -lz * side }; // it falls across the road, toward the other side
  return { base, d, len: BEATS.fellLen, F, side };
}

// the trunk lying across the road as posts the car can hit (circles along it)
export function fellPosts(f, r = 0.45) {
  const out = [];
  for (let k = 0.3; k <= f.len; k += 0.8) out.push({ x: f.base.x + f.d.x * k, z: f.base.z + f.d.z * k, r });
  return out;
}

// how far over it is at age a: 0 standing … 1 down (falling faster as it goes)
export function fellK(a) {
  const k = clamp(a / BEATS.fellFall, 0, 1);
  return k * k;
}

// the pine it brings down: a trunk along +y from the origin (its root), the crown up its last third
export function buildFallenPine(mat) {
  const b = new MeshBuilder(1024);
  const L = BEATS.fellLen + 2.4;
  b.place(0, 0, 0);
  b.cylinder(6, 0.3, 0.12, L, KIND.BARK, { capTop: false, capBottom: true });
  let y = L * 0.45, r = 1.9;
  for (let i = 0; i < 4; i++) {
    const h = 2.4 - i * 0.3;
    b.cone(7, r, h, KIND.LEAF, { y0: y, phase: i });
    y += h * 0.55;
    r *= 0.74;
  }
  // the torn stump and splinters at its foot
  b.place(0, 0.1, 0);
  b.cylinder(6, 0.36, 0.3, 0.5, KIND.WOOD, { capTop: true });
  const m = new THREE.Mesh(b.toGeometry(), mat);
  m.frustumCulled = false;
  return m;
}

// lay the pine out: at its base, leaning toward d by k (0 upright … 1 flat)
const _q = new THREE.Quaternion(), _ax = new THREE.Vector3();
export function placeFallenPine(mesh, f, k, ground) {
  mesh.position.set(f.base.x, ground(f.base.x, f.base.z) - 0.15, f.base.z);
  _ax.set(f.d.z, 0, -f.d.x).normalize(); // Y × d: turning +y toward d
  _q.setFromAxisAngle(_ax, (Math.PI / 2) * 0.97 * k);
  mesh.quaternion.copy(_q);
}

// the thing's own eyes at the start: low between the ruts, weaving, rushing up behind the car. k: 0..1 through the
// shot; at(s): a point on its track; carS: where the car is on it. Returns { p, l, fov, roll }
export function raimiShot(k, time, at, carS, car, ground) {
  const e = smoothstep(0, 1, k);
  const s = carS - BEATS.raimiFrom + (BEATS.raimiFrom - BEATS.raimiTo) * e;
  const P = at(s, {});
  const weave = Math.sin(time * 5.3) * 1.3 + Math.sin(time * 2.1) * 0.6;
  const x = P.x + P.dz * weave, z = P.z - P.dx * weave;
  const y = ground(x, z) + 0.75 + Math.abs(Math.sin(time * 7.5)) * 0.28;
  return {
    p: [x, y, z],
    l: [car.x, car.y + 0.9, car.z],
    fov: 98 - e * 10,
    roll: Math.sin(time * 6.1) * 0.12 + Math.sin(time * 13) * 0.03,
  };
}
