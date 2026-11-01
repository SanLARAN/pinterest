// «Последний свет» — the forest's opening film, rebuilt in 3.1h (it replaces the 2.1j film, which fell out of
// a foggy sky onto four people crowding the flames, left the fire burning after it was «put out», and put
// people to bed on top of a crate).
//
// The story is the camp's last evening, on the real camp (world.js lm_camp + the camp generator):
//   1. a crane comes down onto the camp at sunset; the squad sits on the two log benches, each in their own way,
//      and whoever looks after the generator is already over at it, under its lamp
//   2. one shot per player: each gets up and does one real job before the night, at the place it belongs —
//        torch  · crouch at the backpack, take the flashlight, click it on, sweep the treeline
//        tent   · kneel at the tent's open end and pull the flap down
//        fuel   · lift the jerry can and top up the camp generator
//        douse  · carry the bucket to the fire and pour it on; the fire hisses and really goes out
//   3. the finale: the camp in the last light — the generator coughs and dies (objectives.campFail, the same
//      dusk the game uses), they all turn towards the dark trees, and the first night begins
//
// Which jobs exist depends on how many play, so the story always holds (the fire always goes out last):
//   1 → douse, then torch (one person, two beats) · 2 → fuel, douse · 3 → torch, fuel, douse · 4 → all four.
//
// Everything is a pure function of film time (the plan is built once): a seek, a skip, a slow phone and 60 fps
// all see the same film. Routes go round the fire, the tent, the benches, the backpack and the generator, and the
// stride is tied to the distance walked, so feet do not slide. Enter (or SKIP) ends it at any moment.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { createWorldMaterial, shared } from '../render/sonar.js';
import { buildSurvivor, poseSurvivor, poseFur } from './survivor.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { PLAYER_HEX } from './remote.js';
import { myFit, cleanFit } from './outfit.js';
import { CAMP_TENT, tentPoint } from '../world/campLayout.js';

// ---------------------------------------------------------------- the camp (world.js lm_camp, at the origin)
export const FIRE = { x: 0, z: 0 };
export const BENCH_A = [{ x: -3.4, z: -1.8 }, { x: -2.1, z: -3.4 }];
export const BENCH_B = [{ x: 3.0, z: -2.6 }, { x: 3.6, z: -0.6 }];
export const BACKPACK = { x: 2.1, z: 2.4 };
const GEN_DEFAULT = { x: -3.8, z: 7.4 };
const TREES = { x: 12.5, z: 3.2 }; // where the flashlight sweeps: the empty treeline east of the camp — clear of the
// trail post at (6, 6) and of the bench, so the beam never lands on a friend
const DARK = { x: -10, z: 10 }; // where they all look when the lamp dies

const benchAt = (B, f) => ({ x: lerp(B[0].x, B[1].x, f), z: lerp(B[0].z, B[1].z, f) });
// where each job's person sits at the start (the fuel one is not sitting: they are at the generator already)
export const SEAT_OF = {
  torch: benchAt(BENCH_B, 0.8),
  douse: benchAt(BENCH_B, 0.22),
  tent: benchAt(BENCH_A, 0.22),
  fuel: benchAt(BENCH_A, 0.78), // (only for a lobby whose fuel person is also its first: never the case below)
};
const SIT_STYLE = { torch: 'elbows', douse: 'warm', tent: 'back', fuel: 'warm' };
export const ORDER = ['torch', 'tent', 'fuel', 'douse'];
export function choresFor(n) {
  if (n <= 1) return [['douse', 'torch']];
  if (n === 2) return [['fuel'], ['douse']];
  if (n === 3) return [['torch'], ['fuel'], ['douse']];
  return [['torch'], ['tent'], ['fuel'], ['douse']];
}

// timing
const T0 = 3.9; // the crane shot
const RISE = 0.85; // off the log and onto their feet
const WALK_V = 1.45; // m/s: brisk, it is getting dark
const ACC = 0.32; // s to get up to speed / to stop
const LEAD = 1.15; // how much of the walk in a player's shot shows
const ACT = { torch: 2.6, tent: 2.1, fuel: 2.2, douse: 2.1 };
const TAIL = 0.15;
const BLEND = 0.24; // pose cross-fade at the start of a segment
const STRIDE = 0.62; // m per half cycle of poseSurvivor's phase (π)

const POSE_NODES = ['hips', 'chest', 'head', 'shL', 'shR', 'elL', 'elR', 'thL', 'thR', 'knL', 'knR'];

// ---------------------------------------------------------------- geometry helpers
const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const dist = (a, b) => Math.hypot(b.x - a.x, b.z - a.z);
function angDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
const lerpAng = (a, b, k) => a + angDiff(a, b) * k;
function segDist(p, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz;
  const k = L2 > 1e-9 ? clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / L2, 0, 1) : 0;
  return Math.hypot(p.x - (a.x + dx * k), p.z - (a.z + dz * k));
}

// what a person walking round the camp must keep clear of (radius = the thing + a body's half width)
export function campObstacles(gen = GEN_DEFAULT) {
  const tA = tentPoint(0, -CAMP_TENT.halfLength), tB = tentPoint(0, CAMP_TENT.halfLength);
  return [
    { a: FIRE, b: FIRE, r: 1.05 + 0.4, name: 'fire' },
    { a: BENCH_A[0], b: BENCH_A[1], r: 0.26 + 0.15, name: 'benchA' },
    { a: BENCH_B[0], b: BENCH_B[1], r: 0.24 + 0.15, name: 'benchB' },
    { a: tA, b: tB, r: CAMP_TENT.halfWidth + 0.25, name: 'tent' },
    { a: BACKPACK, b: BACKPACK, r: 0.3 + 0.25, name: 'backpack' },
    { a: gen, b: gen, r: 0.55 + 0.3, name: 'generator' },
  ];
}
const freeAt = (p, obs, skip) => obs.every((o) => o === skip || segDist(p, o.a, o.b) >= o.r - 1e-6);
function clearLine(p, q, obs) {
  const n = Math.max(2, Math.ceil(dist(p, q) / 0.12));
  for (let i = 0; i <= n; i++) {
    const k = i / n, s = { x: lerp(p.x, q.x, k), z: lerp(p.z, q.z, k) };
    for (const o of obs) if (segDist(s, o.a, o.b) < o.r - 1e-6) return false;
  }
  return true;
}
const pathLen = (pts) => pts.reduce((s, p, i) => (i ? s + dist(pts[i - 1], p) : 0), 0);

// the shortest route from a to b with at most two turns round the camp's things (a and b themselves may stand
// a little inside an obstacle's margin: the first and last few centimetres are not checked against it)
export function routeAround(a, b, obs) {
  const near = (p) => obs.filter((o) => segDist(p, o.a, o.b) < o.r);
  const own = new Set([...near(a), ...near(b)]);
  const test = obs.filter((o) => !own.has(o));
  if (clearLine(a, b, test)) return [a, b];
  const cands = [];
  for (const o of obs) {
    const c = { x: (o.a.x + o.b.x) / 2, z: (o.a.z + o.b.z) / 2 };
    const half = dist(o.a, o.b) / 2;
    for (const extra of [0.35, 0.8, 1.4]) {
      const R = o.r + half + extra;
      for (let i = 0; i < 20; i++) {
        const ang = (i / 20) * Math.PI * 2;
        const p = { x: c.x + Math.cos(ang) * R, z: c.z + Math.sin(ang) * R };
        if (freeAt(p, obs)) cands.push(p);
      }
    }
  }
  let best = null, bestL = Infinity;
  for (const w of cands) {
    if (!clearLine(a, w, test) || !clearLine(w, b, test)) continue;
    const L = dist(a, w) + dist(w, b);
    if (L < bestL) { bestL = L; best = [a, w, b]; }
  }
  if (best) return best;
  for (const w1 of cands) {
    if (!clearLine(a, w1, test)) continue;
    for (const w2 of cands) {
      const L = dist(a, w1) + dist(w1, w2) + dist(w2, b);
      if (L >= bestL || !clearLine(w1, w2, test) || !clearLine(w2, b, test)) continue;
      bestL = L; best = [a, w1, w2, b];
    }
  }
  return best || [a, b];
}

// distance along a walk of length L at time tau (seconds since it started) — up to speed, cruise, slow down
function walkDist(tau, L, v = WALK_V) {
  const T = L / v + ACC;
  tau = clamp(tau, 0, T);
  const cruise = v * Math.max(0, T - 2 * ACC) > 0;
  if (!cruise) return L * smoothstep(0, T, tau);
  if (tau < ACC) return (v / (2 * ACC)) * tau * tau;
  if (tau > T - ACC) { const r = T - tau; return L - (v / (2 * ACC)) * r * r; }
  return (v * ACC) / 2 + v * (tau - ACC);
}
const walkTime = (L, v = WALK_V) => L / v + ACC;
function pointAt(pts, s) {
  for (let i = 1; i < pts.length; i++) {
    const L = dist(pts[i - 1], pts[i]);
    if (s <= L || i === pts.length - 1) {
      const k = L > 1e-9 ? clamp(s / L, 0, 1) : 1;
      return { x: lerp(pts[i - 1].x, pts[i].x, k), z: lerp(pts[i - 1].z, pts[i].z, k) };
    }
    s -= L;
  }
  return { ...pts[pts.length - 1] };
}

// ---------------------------------------------------------------- poses
const breathe = (tt, amp = 1) => Math.sin(tt * 1.35) * 0.012 * amp;

function pStand(rig, tt) {
  poseSurvivor(rig, 0, 0, false, false);
  const n = rig.nodes;
  n.hips.position.set(0, 0.94, 0);
  n.chest.rotation.set(0.05 + breathe(tt), Math.sin(tt * 0.31) * 0.03, 0);
  n.head.rotation.set(0, Math.sin(tt * 0.37) * 0.12, 0);
  n.shL.rotation.set(-0.1, 0, -0.1);
  n.shR.rotation.set(-0.1, 0, 0.1);
  n.elL.rotation.set(-0.3, 0, 0);
  n.elR.rotation.set(-0.28, 0, 0);
}

// on a log bench: hips on the bark (0.6 m), thighs level, shins down to the ground — and each their own way
function pSit(rig, style, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  n.hips.position.set(0, 0.6, 0);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['th' + A].rotation.set(-1.48, 0, s * 0.13);
    n['kn' + A].rotation.set(1.46, 0, -s * 0.05);
  }
  if (style === 'warm') {
    // hands held out to the fire, rubbing now and then
    const rub = Math.sin(tt * 3.1) * 0.07;
    n.chest.rotation.set(0.22 + breathe(tt), 0, 0);
    n.head.rotation.set(0.1, Math.sin(tt * 0.4) * 0.08, 0);
    n.shL.rotation.set(-1.15 + rub, 0, -0.22);
    n.shR.rotation.set(-1.15 - rub, 0, 0.22);
    n.elL.rotation.set(-0.55, 0, 0);
    n.elR.rotation.set(-0.55, 0, 0);
  } else if (style === 'elbows') {
    // elbows on the knees, hunched, looking up into the flames
    n.chest.rotation.set(0.62 + breathe(tt, 0.6), 0, 0);
    n.head.rotation.set(-0.42, Math.sin(tt * 0.33) * 0.1, 0);
    n.shL.rotation.set(-0.78, 0, -0.08);
    n.shR.rotation.set(-0.78, 0, 0.08);
    n.elL.rotation.set(-1.62, 0, 0);
    n.elR.rotation.set(-1.62, 0, 0);
  } else {
    // leaning back on straight arms
    n.chest.rotation.set(-0.22 + breathe(tt), 0, 0);
    n.head.rotation.set(0.16, Math.sin(tt * 0.29) * 0.14, 0);
    n.shL.rotation.set(0.62, 0, -0.3);
    n.shR.rotation.set(0.62, 0, 0.3);
    n.elL.rotation.set(-0.08, 0, 0);
    n.elR.rotation.set(-0.08, 0, 0);
  }
}

// bent over the generator, a hand on its top, the other on the cap: the one who looks after it
function pTinker(rig, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const fiddle = Math.sin(tt * 2.2) * 0.08;
  n.hips.position.y = 0.9;
  n.chest.rotation.set(0.58, 0, 0.04);
  n.head.rotation.set(0.25, Math.sin(tt * 0.5) * 0.12, 0);
  n.shL.rotation.set(-1.05, 0, -0.18);
  n.elL.rotation.set(-0.45, 0, 0);
  n.shR.rotation.set(-0.95 + fiddle, 0, 0.12);
  n.elR.rotation.set(-0.9 - fiddle, 0, 0);
  n.thL.rotation.set(-0.18, 0, -0.05);
  n.thR.rotation.set(0.04, 0, 0.05);
  n.knL.rotation.set(0.32, 0, 0);
  n.knR.rotation.set(0.12, 0, 0);
}

// carrying: the bucket hangs from the right hand, the flashlight / the can are held low
function holdPose(rig, held) {
  const n = rig.nodes;
  if (held === 'bucket') { n.shR.rotation.set(-0.06, 0, 0.2); n.elR.rotation.set(-0.12, 0, 0); }
  else if (held === 'torch') { n.shR.rotation.set(-1.12, 0, 0.04); n.elR.rotation.set(-0.12, 0, 0); }
  else if (held === 'can') { n.shR.rotation.set(-0.1, 0, 0.18); n.elR.rotation.set(-0.2, 0, 0); }
}

// the four jobs (u: 0..1 through it)
function pTorchAct(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const down = smoothstep(0.02, 0.22, u) * (1 - smoothstep(0.3, 0.46, u));
  n.hips.position.y = 0.94 - down * 0.34;
  n.chest.rotation.set(0.05 + down * 0.55, 0, 0);
  n.head.rotation.set(down * 0.2, 0, 0);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['th' + A].rotation.set(-down * 1.0, 0, s * 0.06);
    n['kn' + A].rotation.set(down * 1.45, 0, 0);
  }
  n.shR.rotation.set(-0.1 - down * 0.85, 0, 0.1);
  n.elR.rotation.set(-0.28 + down * 0.12, 0, 0);
  // up, and the arm comes level: the beam goes out over the trees
  const aim = smoothstep(0.4, 0.58, u);
  if (aim > 0) {
    n.shR.rotation.set(lerp(-0.1, -1.42, aim), 0, 0.04);
    n.elR.rotation.set(lerp(-0.28, -0.08, aim), 0, 0);
    n.shL.rotation.set(-0.1 - aim * 0.2, 0, -0.14);
    n.head.rotation.set(-aim * 0.05, 0, 0);
  }
}

function pTentAct(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const kneel = smoothstep(0.0, 0.2, u) * (1 - smoothstep(0.86, 1, u));
  n.hips.position.y = 0.94 - kneel * 0.4;
  n.chest.rotation.set(0.05 + kneel * 0.16, 0, 0);
  n.thL.rotation.set(-kneel * 1.25, 0, -0.08);
  n.knL.rotation.set(kneel * 1.32, 0, 0);
  n.thR.rotation.set(kneel * 0.12, 0, 0.08);
  n.knR.rotation.set(kneel * 1.62, 0, 0);
  // reach up to the rolled flap, pull it down to the ground, tie it off
  const reach = smoothstep(0.18, 0.34, u) * (1 - smoothstep(0.68, 0.8, u));
  const pull = smoothstep(0.34, 0.66, u);
  const tie = smoothstep(0.66, 0.74, u) * (1 - smoothstep(0.82, 0.9, u));
  const sh = lerp(-0.25, lerp(-2.0, -0.65, pull), reach);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['sh' + A].rotation.set(sh - tie * 0.45 + (A === 'L' ? Math.sin(u * 60) * tie * 0.06 : 0), 0, s * 0.18);
    n['el' + A].rotation.set(-0.2 - tie * 0.9, 0, 0);
  }
  n.head.rotation.set(-reach * 0.25 * (1 - pull) + pull * 0.15, 0, 0);
}

function pFuelAct(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const bend = smoothstep(0.02, 0.14, u) * (1 - smoothstep(0.16, 0.28, u));
  const lift = smoothstep(0.18, 0.34, u) * (1 - smoothstep(0.84, 0.97, u));
  const pour = smoothstep(0.36, 0.46, u) * (1 - smoothstep(0.76, 0.86, u));
  const shake = Math.sin(u * 70) * pour * 0.04;
  n.hips.position.y = 0.94 - bend * 0.16;
  n.chest.rotation.set(0.05 + bend * 0.55 + lift * 0.12 + pour * 0.2, 0, 0);
  n.head.rotation.set(bend * 0.2 + pour * 0.15, 0, 0);
  n.thL.rotation.set(-bend * 0.3, 0, -0.05);
  n.thR.rotation.set(-bend * 0.35, 0, 0.05);
  n.knL.rotation.set(bend * 0.55, 0, 0);
  n.knR.rotation.set(bend * 0.6, 0, 0);
  n.shR.rotation.set(-0.1 - bend * 0.65 - lift * 1.0 - pour * 0.2 + shake, 0, 0.12);
  n.elR.rotation.set(-0.25 - lift * 0.85 + pour * 0.25, 0, 0);
  n.shL.rotation.set(-0.1 - lift * 1.05 - pour * 0.15, 0, -0.1);
  n.elL.rotation.set(-0.3 - lift * 0.8, 0, 0);
}

function pDouseAct(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const lift = smoothstep(0.02, 0.26, u) * (1 - smoothstep(0.78, 0.98, u));
  const tip = smoothstep(0.3, 0.48, u) * (1 - smoothstep(0.7, 0.86, u));
  n.chest.rotation.set(0.05 + lift * 0.1 + tip * 0.48, 0, 0);
  n.head.rotation.set(tip * 0.18, 0, 0);
  n.hips.position.y = 0.94 - tip * 0.05;
  // the right fist brings the bucket round in front of the chest; the left hand goes under its bottom
  n.shR.rotation.set(-0.06 - lift * 0.95 - tip * 0.42, 0, 0.2 - lift * 0.62);
  n.elR.rotation.set(-0.12 - lift * 0.95 + tip * 0.65, 0, 0);
  n.shL.rotation.set(-0.1 - lift * 0.78 - tip * 0.3, 0, -0.12 + lift * 0.5);
  n.elL.rotation.set(-0.3 - lift * 0.42 + tip * 0.2, 0, 0);
  n.thL.rotation.set(-tip * 0.2, 0, -0.05);
  n.knL.rotation.set(0.05 + tip * 0.24, 0, 0);
  n.thR.rotation.set(tip * 0.12, 0, 0.05);
}
const ACT_POSE = { torch: pTorchAct, tent: pTentAct, fuel: pFuelAct, douse: pDouseAct };

// a cross-fade of the joints between two poses (the root is the schedule's business)
function capture(rig, out) {
  for (const name of POSE_NODES) {
    const nd = rig.nodes[name];
    const o = out[name] || (out[name] = {});
    o.px = nd.position.x; o.py = nd.position.y; o.pz = nd.position.z;
    o.rx = nd.rotation.x; o.ry = nd.rotation.y; o.rz = nd.rotation.z;
  }
  return out;
}
function blendInto(rig, A, B, k) {
  for (const name of POSE_NODES) {
    const nd = rig.nodes[name], a = A[name], b = B[name];
    nd.position.set(lerp(a.px, b.px, k), lerp(a.py, b.py, k), lerp(a.pz, b.pz, k));
    nd.rotation.set(lerp(a.rx, b.rx, k), lerp(a.ry, b.ry, k), lerp(a.rz, b.rz, k));
  }
}

// a soft round glow for the flashlight's bulb (a canvas, so not in a test runner)
let GLOW = null;
function glowTexture() {
  if (GLOW !== null) return GLOW;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,240,210,1)');
    g.addColorStop(0.35, 'rgba(255,214,150,0.45)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    GLOW = new THREE.CanvasTexture(c);
  } catch { GLOW = undefined; }
  return GLOW;
}

export class CampFilm {
  constructor(game) {
    this.g = game;
    this.state = 'idle'; // idle | run | done
    this.t = 0;
    this.active = false;
    this.cast = [];
    this.hold = false; // (debug: freeze the clock, keep posing)
    this.cues = {};
    this.props = [];
    this.propMat = createWorldMaterial();
    this.day0 = 0.95; // the light of the last day (Game.startMorning's MORNING_LIGHT)
    this._cam = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._v = new THREE.Vector3();
    this._v2 = new THREE.Vector3();
    this._A = {};
    this._B = {};
    this.dur = 14;
  }

  // ---------------- begin / end ----------------
  begin() {
    this._clearCast();
    this.state = 'run';
    this.active = true;
    this.done = false;
    this.titleShown = false;
    this.skipping = false;
    this.t = 0;
    this.cues = {};
    this.built = false;
    this.g.state = 'intro';
    this.g.fx.fade = 0;
    this.g.hud.setIntro(null);
    this.g.hud.setHint(null);
    this.g.hud.setUse(null);
    this.g.hud.setSkip(true, 'intro');
    document.body.classList.add('intro');
    this.g.audio.setMorning(true);
    this.g.fire.reset();
    this.g.objectives?.setMorning?.(true); // the camp generator runs, its lamp lit — until the finale
    shared.uDawn.value = this.day0;
    shared.uMorning.value = 1;
  }

  // the people, their things and the flap out of the scene (also at a new begin: a run left by the menu in the
  // middle of the film must not leave its cast standing in the next one)
  _clearCast() {
    for (const a of this.cast) {
      undressPerson(a.meshes);
      this.g.scene.remove(a.rig.root);
      a.mat.dispose();
    }
    for (const p of this.props) p.node.removeFromParent();
    this.props.length = 0;
    this.cast.length = 0;
    if (this.flap) { this.flap.removeFromParent(); this.flap = null; }
    if (this.fireSnd) { this.fireSnd.stop(0.3); this.fireSnd = null; }
  }

  _teardown() {
    this._clearCast();
    this.g.fire.out();
    const ob = this.g.objectives;
    if (ob) ob.morningOn = false; // (a skip before the finale: the night starts with the generator off, as always)
    shared.uDawn.value = 0;
    shared.uMorning.value = 0;
    document.body.classList.remove('intro');
    this.g.hud.setSkip(false);
    this.g.hud.setIntro(null);
    this.active = false;
  }

  cancel() {
    if (this.state !== 'run') return;
    this.state = 'done';
    this.done = true;
    this._teardown();
  }

  finish() {
    if (this.state !== 'run') return;
    this.state = 'done';
    this.done = true;
    this._teardown();
    this.g.fx.fade = 0;
    this.g.fadeIn = 1.4; // ...and comes back up as the first night (spent in Game._commonFx)
    try { this.g.input.requestLock(); } catch { /* the browser may refuse: the hint says so */ }
  }

  // ---------------- the cast ----------------
  _players() {
    if (!this.g.online && this.forceSeats > 1) {
      const heads = ['hood', 'ushanka', 'animehair', 'boykisser'];
      const bodies = ['jacket', 'tulup', 'seifuku', 'fluffy'];
      const n = Math.min(4, this.forceSeats | 0);
      return Array.from({ length: n }, (_, i) => ({ slot: i, fit: i === 0 ? myFit() : cleanFit({ head: heads[i], body: bodies[i] }) }));
    }
    if (!this.g.online) return [{ slot: 0, fit: myFit() }];
    const out = [{ slot: (this.g.player.slot | 0) % 4, fit: myFit() }];
    for (const r of this.g.remotes.values()) out.push({ slot: (r.slot | 0) % 4, fit: r.fit });
    const seen = new Set();
    return out.filter((p) => (seen.has(p.slot) ? false : (seen.add(p.slot), true))).sort((a, b) => a.slot - b.slot);
  }

  _ground(x, z) {
    return this.g.world?.terrain?.height ? this.g.world.terrain.height(x, z) : 0;
  }

  _build() {
    this.built = true;
    const gen0 = this.g.objectives?.gens?.[0];
    this.gen = gen0 ? { x: gen0.x, z: gen0.z } : { ...GEN_DEFAULT };
    this.obs = campObstacles(this.gen);
    const players = this._players();
    const jobs = choresFor(players.length);
    players.forEach((p, i) => {
      const rig = buildSurvivor(p.fit);
      rig.root.rotation.order = 'YXZ';
      const mat = createPersonMaterial(rig.dyes, PLAYER_HEX[p.slot % 4]);
      mat.uniforms.uShow.value = 1;
      const meshes = dressPerson(rig, mat);
      this.g.scene.add(rig.root);
      this.cast.push({ slot: p.slot, chores: jobs[i], rig, mat, meshes, x: 0, z: 0, yaw: 0, hit: {}, held: null, u: 0, seg: null });
    });
    this._stations();
    this._plan();
    this._buildProps();
    this.fireSnd = this.g.audio?.fire?.(FIRE.x, this._ground(FIRE.x, FIRE.z) + 0.5, FIRE.z) || null;
  }

  // where each job is done, and which way the person faces while doing it
  _stations() {
    const toFireFromGen = yawTo(this.gen, FIRE);
    const fuelAt = { x: this.gen.x + Math.sin(toFireFromGen) * 1.2, z: this.gen.z + Math.cos(toFireFromGen) * 1.2 };
    const tentMouth = tentPoint(0, CAMP_TENT.halfLength);
    // at the side edge of the opening, not in front of it: the cloth comes down beside them, in plain view
    const tentKneel = tentPoint(0.75, CAMP_TENT.halfLength + 0.45);
    const torchAt = { x: BACKPACK.x + 0.18, z: BACKPACK.z - 0.72 }; // on the fire's side of the pack
    const douseFrom = SEAT_OF.douse;
    const dy = yawTo(FIRE, douseFrom);
    const douseAt = { x: FIRE.x + Math.sin(dy) * 1.6, z: FIRE.z + Math.cos(dy) * 1.6 };
    this.st = {
      torch: { at: torchAt, face: yawTo(torchAt, BACKPACK), aim: yawTo(torchAt, TREES) },
      tent: { at: tentKneel, approach: tentPoint(1.1, CAMP_TENT.halfLength + 1.7), face: yawTo(tentKneel, tentPoint(0.15, CAMP_TENT.halfLength)), mouth: tentMouth },
      fuel: { at: fuelAt, face: yawTo(fuelAt, this.gen) },
      douse: { at: douseAt, face: yawTo(douseAt, FIRE) },
    };
  }

  // the schedule: segments per actor, and the shots
  _plan() {
    const beats = [];
    const solo = this.cast.length === 1;
    if (solo) for (const c of this.cast[0].chores) beats.push({ a: this.cast[0], chore: c });
    else for (const c of ORDER) { const a = this.cast.find((x) => x.chores.includes(c)); if (a) beats.push({ a, chore: c }); }

    for (const a of this.cast) {
      a.segs = [];
      const first = a.chores[0];
      if (first === 'fuel' && !solo) {
        a.home = { ...this.st.fuel.at };
        a.homeYaw = this.st.fuel.face;
        a.sitting = false;
      } else {
        a.home = { ...SEAT_OF[first] };
        a.homeYaw = yawTo(a.home, FIRE);
        a.sitting = true;
        a.style = SIT_STYLE[first];
      }
      a.free = 0; // when they may start moving
      a.pos = { ...a.home };
      a.yawNow = a.homeYaw;
    }

    this.shots = [{ kind: 'crane', t0: 0, t1: T0 }];
    let cursor = T0;
    for (const beat of beats) {
      const a = beat.a, s = this.st[beat.chore];
      let walkPts = null, walkDur = 0;
      if (dist(a.pos, s.at) > 0.05) {
        // off the bench first: the root comes forward over the feet
        let from = a.pos;
        if (a.sitting) {
          const y = a.homeYaw;
          from = { x: a.home.x + Math.sin(y) * 0.45, z: a.home.z + Math.cos(y) * 0.45 };
        }
        const via = s.approach ? routeAround(from, s.approach, this.obs).concat([s.at]) : routeAround(from, s.at, this.obs);
        walkPts = via.filter((p, i) => i === 0 || dist(via[i - 1], p) > 1e-3);
        walkDur = walkTime(pathLen(walkPts));
      }
      const firstYaw = walkPts ? yawTo(walkPts[0], walkPts[1]) : a.yawNow;
      const turn0 = walkPts ? 0.15 + Math.abs(angDiff(a.yawNow, firstYaw)) / Math.PI * 0.55 : 0;
      const riseDur = a.sitting ? RISE : 0;
      const lead = walkPts ? Math.min(LEAD, walkDur) : 0.35;
      // the earliest they can arrive: up, turned and walked; never before their shot can show the last of the walk
      let arrive = Math.max(cursor + lead, a.free + riseDur + turn0 + walkDur, (a.sitting ? T0 - 1.0 : 0) + riseDur + turn0 + walkDur);
      const depart = arrive - walkDur;
      let tt = depart - turn0 - riseDur;
      if (a.sitting) {
        a.segs.push({ type: 'sit', t0: a.free, t1: tt, at: a.home, yaw: a.homeYaw, style: a.style });
        const fwd = { x: a.home.x + Math.sin(a.homeYaw) * 0.45, z: a.home.z + Math.cos(a.homeYaw) * 0.45 };
        a.segs.push({ type: 'rise', t0: tt, t1: tt + riseDur, at: a.home, to: fwd, yaw: a.homeYaw, style: a.style, grab: beat.chore === 'douse' ? 'bucket' : null });
        tt += riseDur;
        a.pos = fwd;
        a.sitting = false;
        if (beat.chore === 'douse') a.held = 'bucket';
      } else if (tt > a.free + 1e-3) {
        a.segs.push({ type: a.segs.length ? 'idle' : (a.chores[0] === 'fuel' ? 'tinker' : 'idle'), t0: a.free, t1: tt, at: a.pos, yaw: a.yawNow, held: a.held, aim: a.aimHeld });
      }
      if (walkPts) {
        if (turn0 > 0) a.segs.push({ type: 'turn', t0: tt, t1: tt + turn0, at: a.pos, yaw0: a.yawNow, yaw1: firstYaw, held: a.held });
        tt += turn0;
        a.segs.push({ type: 'walk', t0: tt, t1: tt + walkDur, pts: walkPts, len: pathLen(walkPts), held: a.held });
        tt += walkDur;
        const last = walkPts[walkPts.length - 1], prev = walkPts[walkPts.length - 2];
        a.pos = { ...last };
        a.yawNow = yawTo(prev, last);
      }
      // turn to the work, and do it
      const turn1 = 0.2 + Math.abs(angDiff(a.yawNow, s.face)) / Math.PI * 0.45;
      a.segs.push({ type: 'turn', t0: tt, t1: tt + turn1, at: a.pos, yaw0: a.yawNow, yaw1: s.face, held: a.held });
      tt += turn1;
      const actT0 = tt, actT1 = tt + ACT[beat.chore];
      a.segs.push({ type: 'act', t0: actT0, t1: actT1, at: a.pos, yaw: s.face, chore: beat.chore, held: a.held });
      beat.actT0 = actT0;
      beat.actT1 = actT1;
      a.free = actT1;
      if (beat.chore === 'torch') { a.held = 'torch'; a.yawNow = s.aim + 0.42; a.aimHeld = true; }
      else if (beat.chore === 'fuel') { a.held = 'can'; a.yawNow = s.face; }
      else if (beat.chore === 'douse') {
        a.yawNow = s.face;
        // alone, the same hand takes the flashlight next: the empty bucket goes down by the fire first
        if (a.chores.indexOf('douse') < a.chores.length - 1) { a.held = null; a.dropBucketAt = actT1; }
        else a.held = 'bucket';
      } else a.yawNow = s.face;
      const shotStart = Math.max(cursor, (walkPts ? actT0 - turn1 - lead : actT0 - 0.35));
      if (this.shots.length === 1) this.shots[0].t1 = Math.max(this.shots[0].t1, shotStart);
      this.shots.push({ kind: beat.chore, t0: shotStart, t1: actT1 + TAIL, a, arrive });
      cursor = actT1 + TAIL;
    }
    this.beats = beats;
    // the finale: the lamp dies, they turn to the dark, black
    this.tFin = cursor;
    this.tLampOff = cursor + 0.9;
    this.tLook = cursor + 1.35;
    this.tFade = cursor + 2.9;
    this.dur = cursor + 4.0;
    this.shots.push({ kind: 'finale', t0: cursor, t1: this.dur + 1 });
    for (const a of this.cast) {
      if (a.free < this.tLook) a.segs.push({ type: 'idle', t0: a.free, t1: this.tLook, at: a.pos, yaw: a.yawNow, held: a.held, aim: a.aimHeld });
      a.segs.push({ type: 'look', t0: this.tLook, t1: this.dur + 1, at: a.pos, yaw0: a.yawNow, yaw1: yawTo(a.pos, DARK), held: a.held, aim: a.aimHeld });
      for (let i = 1; i < a.segs.length; i++) a.segs[i].prev = a.segs[i - 1];
    }
    // the light: a warm sunset that goes grey through the jobs; black once the lamp dies
    const douse = beats.find((b) => b.chore === 'douse');
    this.tFireOut = douse ? douse.actT0 + ACT.douse * 0.75 : this.tFin;
  }

  // ---------------- props ----------------
  _mesh(build, n = 128) {
    const b = new MeshBuilder(n);
    build(b);
    const m = new THREE.Mesh(b.toGeometry(), this.propMat);
    m.frustumCulled = false;
    return m;
  }

  _buildProps() {
    const scene = this.g.scene;
    const make = (kind, a, build, ground, handPos, handRot) => {
      const node = new THREE.Object3D();
      node.add(this._mesh(build));
      const p = { kind, a, node, ground, handPos, handRot, inHand: null };
      this.props.push(p);
      scene.add(node);
      return p;
    };
    for (const a of this.cast) {
      for (const c of a.chores) {
        if (c === 'douse') {
          const s = SEAT_OF.douse, y = yawTo(s, FIRE);
          a.bucket = make('bucket', a, (b) => {
            b.cylinder(9, 0.12, 0.15, 0.24, KIND.METAL, { capBottom: true });
            b.place(0, 0.24, 0, 0, 0, Math.PI / 2);
            b.limb([-0.13, 0, 0], [0, 0.13, 0], 0.01, 0.01, KIND.METAL);
            b.limb([0.13, 0, 0], [0, 0.13, 0], 0.01, 0.01, KIND.METAL);
          }, { x: s.x + Math.sin(y + 1.5) * 0.45, z: s.z + Math.cos(y + 1.5) * 0.45, y: 0 }, [0, -0.73, 0.04], [0, 0, 0]); // (the handle in the fist)
        } else if (c === 'torch') {
          a.torch = make('torch', a, (b) => {
            b.place(0, 0, 0, Math.PI / 2, 0, 0);
            b.cylinder(7, 0.03, 0.03, 0.2, KIND.METAL);
            b.place(0, 0.2, 0, Math.PI / 2, 0, 0);
            b.cylinder(7, 0.045, 0.034, 0.05, KIND.METAL);
          }, { x: BACKPACK.x, z: BACKPACK.z, y: 0.64 }, [0, -0.36, 0.05], [Math.PI / 2, 0, 0]); // (along the forearm, out of the fist)
          const tex = glowTexture();
          if (tex) {
            const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffe2b0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
            sp.scale.setScalar(0.55);
            sp.position.set(0, 0, 0.24);
            a.torch.node.add(sp);
            a.torch.glow = sp;
          }
          // the beam: a faint cone of light out of the lens, so you can see where it points
          const cone = new THREE.Mesh(new THREE.ConeGeometry(0.85, 5.5, 18, 1, true), new THREE.MeshBasicMaterial({
            color: 0xffe6b8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
          }));
          cone.rotation.x = -Math.PI / 2; // (the apex at the lens, opening along the beam)
          cone.position.set(0, 0, 0.24 + 5.5 / 2);
          cone.frustumCulled = false;
          a.torch.node.add(cone);
          a.torch.cone = cone;
        } else if (c === 'fuel') {
          const s = this.st.fuel, side = s.face + Math.PI / 2;
          a.can = make('can', a, (b) => {
            b.box(0.26, 0.34, 0.14, KIND.METAL, { bottom: true });
            b.place(0, 0.38, 0.0, 0, 0, Math.PI / 2);
            b.box(0.04, 0.12, 0.04, KIND.METAL);
            b.place(0.09, 0.38, 0, 0.6, 0, 0);
            b.limb([0, 0, 0], [0, 0.09, 0.05], 0.018, 0.016, KIND.METAL);
          }, { x: s.at.x + Math.sin(side) * 0.42, z: s.at.z + Math.cos(side) * 0.42, y: 0 }, [0, -0.8, 0.06], [0, 0, 0]);
        }
      }
    }
    // the tent's flap: a cloth over its open end, rolled up at the top until someone pulls it down
    if (this.cast.some((a) => a.chores.includes('tent'))) {
      const { halfWidth: hw, halfLength: hl, height: hh } = CAMP_TENT;
      const F = [0, hh * 0.7, hl];
      const D = [-hw - F[0], -F[1], 0], E = [hw - F[0], -F[1], 0];
      const mesh = this._mesh((b) => {
        b.identity();
        b.triN(D, E, [0, 0, 0], [0, 0, 1], KIND.WOOD);
        b.triN(E, D, [0, 0, 0], [0, 0, -1], KIND.WOOD);
      }, 32);
      const pivot = new THREE.Object3D();
      const c = Math.cos(CAMP_TENT.yaw), s = Math.sin(CAMP_TENT.yaw);
      const wx = CAMP_TENT.x + F[2] * s, wz = CAMP_TENT.z + F[2] * c;
      pivot.position.set(wx, this._ground(CAMP_TENT.x, CAMP_TENT.z) + F[1], wz);
      pivot.rotation.set(0, CAMP_TENT.yaw, 0);
      pivot.add(mesh);
      pivot.scale.set(1, 0.06, 1);
      scene.add(pivot);
      this.flap = pivot;
    }
  }

  // where a prop is at film time: on the ground until it is picked up, then in the right hand
  _propsAt(tt) {
    for (const p of this.props) {
      const a = p.a;
      const pick = p.kind === 'bucket' ? a.segs.find((s) => s.type === 'rise' && s.grab === 'bucket') : a.segs.find((s) => s.type === 'act' && s.chore === p.kind.replace('can', 'fuel'));
      const tPick = !pick ? Infinity : p.kind === 'bucket' ? lerp(pick.t0, pick.t1, 0.5) : p.kind === 'torch' ? lerp(pick.t0, pick.t1, 0.28) : lerp(pick.t0, pick.t1, 0.16);
      const dropped = p.kind === 'bucket' && a.dropBucketAt != null && tt >= a.dropBucketAt;
      if (dropped && !p.dropAt) {
        const d = this.st.douse, side = d.face - Math.PI / 2;
        p.dropAt = { x: d.at.x + Math.sin(side) * 0.4, z: d.at.z + Math.cos(side) * 0.4, y: 0 };
      }
      const inHand = tt >= tPick && !dropped;
      if (dropped) {
        if (p.inHand !== 'dropped') {
          this.g.scene.add(p.node);
          p.node.position.set(p.dropAt.x, this._ground(p.dropAt.x, p.dropAt.z), p.dropAt.z);
          p.node.rotation.set(0, 0.4, 0);
          p.inHand = 'dropped';
        }
        continue;
      }
      if (inHand && p.inHand !== true) {
        if (p.kind === 'torch') {
          // the flashlight is a part of the forearm: it points where the arm points
          a.rig.nodes.elR.add(p.node);
          p.node.position.set(...p.handPos);
          p.node.rotation.set(...p.handRot);
        } else this.g.scene.add(p.node); // (a bucket and a can hang from the fist: placed every frame, _propPose)
        p.inHand = true;
      } else if (!inHand && p.inHand !== false) {
        this.g.scene.add(p.node);
        p.node.position.set(p.ground.x, this._ground(p.ground.x, p.ground.z) + p.ground.y, p.ground.z);
        p.node.rotation.set(0, p.kind === 'torch' ? 0.7 : 0, 0);
        p.inHand = false;
      }
    }
  }

  // ---------------- per frame ----------------
  update(dt, events) {
    if (this.state !== 'run') return;
    if (!this.built) this._build();
    const silent = this.seeking;
    this.seeking = false;
    if (!this.hold) this.t += dt;
    const tt = this.t;

    const ev = Array.isArray(events) ? events : [];
    if (!silent && (ev.includes('confirm') || ev.includes('skip')) && !this.skipping) {
      this.skipping = true;
      this.tFade = tt;
      this.dur = Math.min(this.dur, tt + 1.0);
    }

    this._actors(tt, dt, silent);
    this._world(tt, dt, silent);
    this._hud(tt);

    if (tt < 0.9) this.g.fx.fade = smoothstep(0, 0.9, tt);
    else if (tt >= this.tFade) this.g.fx.fade = 1 - smoothstep(this.tFade, this.dur, tt);
    else this.g.fx.fade = 1;
    if (tt >= this.dur) this.finish();
  }

  // the fire, the flap, the sky, the generator and the cues that are not anyone's own
  _world(tt, dt, silent) {
    const g = this.g;
    // the fire: alive until the bucket, then hissing out for good
    const douse = this.beats.find((b) => b.chore === 'douse');
    let lit = 0.86 + 0.06 * Math.sin(tt * 2.3);
    if (douse) {
      const u = (tt - douse.actT0) / ACT.douse;
      lit *= 1 - smoothstep(0.42, 0.78, u);
    }
    g.fire.douse(lit);
    if (this.fireSnd) this.fireSnd.level(Math.min(1, lit * 1.1 + 0.02));
    if (!silent && lit > 0.2 && Math.random() < dt * 1.4 * lit) this.fireSnd?.crackle?.();
    // the flap
    const tent = this.beats.find((b) => b.chore === 'tent');
    if (this.flap && tent) this.flap.scale.y = lerp(0.06, 1, smoothstep(0.34, 0.68, (tt - tent.actT0) / ACT.tent));
    // the sky: sunset, greying through the jobs; after the lamp a moonlit dark, so the last look still reads
    const work = smoothstep(T0 * 0.6, this.tFin, tt);
    let L = lerp(this.day0, 0.5, work);
    const night = smoothstep(this.tLampOff, this.tLampOff + 1.2, tt);
    L = lerp(L, 0.24, night);
    shared.uDawn.value = L;
    shared.uMorning.value = 1 - smoothstep(T0, this.tFin, tt);
    // the generator keeps running (objectives drives its lamp and hum) until it coughs out
    // ...the lamp's state is the film's time too: a seek past it puts it out, a seek back before it lights it again
    const ob = g.objectives;
    if (tt >= this.tLampOff && !this.cues.lamp) {
      this.cues.lamp = true;
      ob?.campFail?.();
      if (!silent) {
        g.audio?.dusk?.();
        g.fx.glitch = Math.max(g.fx.glitch || 0, 0.3);
      }
    } else if (tt < this.tLampOff && this.cues.lamp) {
      this.cues.lamp = false;
      ob?.setMorning?.(true);
      const gen = ob?.gens?.[0];
      if (gen) { gen.dying = false; gen.flick = 0; }
    }
    ob?.update?.(dt, false);
    if (tt >= this.tLook + 0.2 && !this.cues.heart) { this.cues.heart = true; if (!silent) g.audio?.heartbeat?.(0.55); }
  }

  // ---------------- the cast, frame by frame ----------------
  _segAt(a, tt) {
    const segs = a.segs;
    for (let i = 0; i < segs.length; i++) if (tt < segs[i].t1 || i === segs.length - 1) return segs[i];
    return segs[segs.length - 1];
  }

  // write one segment's pose at a time into the rig; returns where the body is and which way it faces
  _poseSeg(a, s, tt) {
    const rig = a.rig;
    const k = clamp((tt - s.t0) / Math.max(1e-6, s.t1 - s.t0), 0, 1);
    const out = { x: 0, z: 0, yaw: 0, spd: 0, phase: 0 };
    const pt = tt + a.slot * 1.7; // (their own breathing, not in step)
    switch (s.type) {
      case 'sit':
        pSit(rig, s.style, pt);
        out.x = s.at.x; out.z = s.at.z; out.yaw = s.yaw;
        break;
      case 'rise': {
        // the weight goes forward over the feet, then up; the hands push off the knees
        const e = smoothstep(0, 1, k);
        pSit(rig, s.style, pt);
        capture(rig, this._A);
        pStand(rig, pt);
        if (s.grab === 'bucket') holdPose(rig, k > 0.5 ? 'bucket' : null);
        capture(rig, this._B);
        blendInto(rig, this._A, this._B, smoothstep(0.15, 1, k));
        const n = rig.nodes;
        n.chest.rotation.x += Math.sin(Math.PI * smoothstep(0, 0.85, k)) * 0.55;
        n.head.rotation.x -= Math.sin(Math.PI * k) * 0.2;
        if (s.grab === 'bucket') { const reach = Math.sin(Math.PI * smoothstep(0.25, 0.6, k)); n.shR.rotation.x -= reach * 0.4; }
        out.x = lerp(s.at.x, s.to.x, smoothstep(0.1, 0.8, e));
        out.z = lerp(s.at.z, s.to.z, smoothstep(0.1, 0.8, e));
        out.yaw = s.yaw;
        break;
      }
      case 'tinker':
        pTinker(rig, pt);
        out.x = s.at.x; out.z = s.at.z; out.yaw = s.yaw;
        break;
      case 'idle':
        pStand(rig, pt);
        holdPose(rig, s.held);
        out.x = s.at.x; out.z = s.at.z; out.yaw = s.yaw;
        if (s.aim) out.yaw += Math.sin(tt * 0.6) * 0.05;
        break;
      case 'turn': {
        // turning on the spot: a small shift of the weight, the head leading
        pStand(rig, pt);
        holdPose(rig, s.held);
        const e = smoothstep(0, 1, k);
        const d = angDiff(s.yaw0, s.yaw1);
        rig.nodes.head.rotation.y = d * 0.25 * Math.sin(Math.PI * Math.min(1, k * 1.3));
        rig.nodes.thL.rotation.x = Math.sin(Math.PI * k) * 0.18 * Math.sign(d);
        rig.nodes.thR.rotation.x = -Math.sin(Math.PI * k) * 0.18 * Math.sign(d);
        out.x = s.at.x; out.z = s.at.z; out.yaw = s.yaw0 + d * e;
        break;
      }
      case 'walk': {
        const tau = tt - s.t0;
        const d = walkDist(tau, s.len);
        const d2 = walkDist(tau + 1 / 60, s.len);
        const p = pointAt(s.pts, d);
        // the heading looks a little ahead, so a corner is a curve and not a snap
        const ahead = pointAt(s.pts, Math.min(s.len, d + 0.45));
        const back = pointAt(s.pts, Math.max(0, d - 0.05));
        const yaw = dist(back, ahead) > 1e-3 ? yawTo(back, ahead) : yawTo(s.pts[s.pts.length - 2], s.pts[s.pts.length - 1]);
        const spd = (d2 - d) * 60;
        out.phase = (d / STRIDE) * Math.PI;
        out.spd = spd;
        poseSurvivor(rig, out.phase, spd, false, false);
        rig.nodes.hips.position.x = 0;
        holdPose(rig, s.held);
        out.x = p.x; out.z = p.z; out.yaw = yaw;
        break;
      }
      case 'act':
        ACT_POSE[s.chore](rig, k, pt);
        out.x = s.at.x; out.z = s.at.z; out.yaw = s.yaw;
        if (s.chore === 'torch') {
          // facing the pack to take it, then round to the trees and a slow sweep along them
          const st = this.st.torch;
          const sweep = lerp(-0.42, 0.42, smoothstep(0.6, 0.98, k));
          out.yaw = lerpAng(st.face, st.aim + sweep, smoothstep(0.38, 0.6, k));
          rig.nodes.head.rotation.y = sweep * 0.25 * smoothstep(0.6, 0.7, k);
        }
        if (s.chore !== 'torch' && s.held) holdPose(rig, k < 0.04 ? s.held : null);
        break;
      case 'look': {
        // the lamp is gone: everyone turns to the dark between the trees
        pStand(rig, pt);
        holdPose(rig, s.held);
        const e = smoothstep(0, 0.9, tt - s.t0);
        const d = angDiff(s.yaw0, s.yaw1);
        out.x = s.at.x; out.z = s.at.z; out.yaw = s.yaw0 + d * e;
        const n = rig.nodes;
        n.head.rotation.set(-0.08 * e, d * 0.15 * (1 - e), 0);
        n.chest.rotation.x -= 0.05 * e;
        // a start when it goes dark: the shoulders come up and settle
        const jolt = Math.exp(-Math.max(0, tt - this.tLampOff) * 3) * (tt > this.tLampOff ? 1 : 0);
        n.shL.rotation.z -= jolt * 0.15;
        n.shR.rotation.z += jolt * 0.15;
        break;
      }
      default:
        pStand(rig, pt);
    }
    return out;
  }

  _actors(tt, dt, silent) {
    if (!this.built) this._build();
    this._propsAt(tt);
    for (const a of this.cast) {
      const s = this._segAt(a, tt);
      a.rig.root.rotation.set(0, 0, 0);
      let o;
      if (s.prev && tt - s.t0 < BLEND && s.type !== 'walk' && s.prev.type !== 'walk') {
        // a cross-fade of the joints out of the segment before (the body's place and heading are continuous already)
        this._poseSeg(a, s.prev, s.prev.t1);
        capture(a.rig, this._A);
        o = this._poseSeg(a, s, tt);
        capture(a.rig, this._B);
        blendInto(a.rig, this._A, this._B, smoothstep(0, BLEND, tt - s.t0));
      } else o = this._poseSeg(a, s, tt);
      poseFur(a.rig, dt, o.spd || 0);
      a.seg = s;
      a.x = o.x;
      a.z = o.z;
      a.yaw = o.yaw;
      a.yawCur = o.yaw;
      a.phase = o.phase;
      a.u = s.type === 'act' ? clamp((tt - s.t0) / (s.t1 - s.t0), 0, 1) : 0;
      a.rig.root.position.set(a.x, this._ground(a.x, a.z), a.z);
      a.rig.root.rotation.y = a.yaw;
      a.rig.root.visible = true;
      this._propPose(a, s, tt);
      if (!silent) this._cues(a, s, tt, o);
    }
  }

  // the thing in the hand follows the beat: the bucket tips, the can pours, the flashlight shines
  _propPose(a, s, tt) {
    const k = s.type === 'act' ? clamp((tt - s.t0) / (s.t1 - s.t0), 0, 1) : 0;
    // a bucket or a can hangs straight down from the fist (gravity, not the forearm's angle), tipping forward to pour
    const hang = (p, tip, handleH) => {
      a.rig.root.updateMatrixWorld(true);
      const hand = a.rig.nodes.elR.localToWorld(this._v.set(0, -0.36, 0.05));
      p.node.rotation.set(tip, a.yaw, 0, 'YXZ');
      const off = this._v2.set(0, -handleH, 0).applyEuler(p.node.rotation);
      p.node.position.copy(hand).add(off);
    };
    if (a.bucket?.inHand === true) {
      const tip = s.type === 'act' && s.chore === 'douse' ? smoothstep(0.3, 0.48, k) * (1 - smoothstep(0.7, 0.86, k)) : 0;
      hang(a.bucket, tip * 1.9, 0.37);
      if (tip > 0.05 && this.g.fire?.stream) {
        a.bucket.node.updateMatrixWorld(true);
        const lip = a.bucket.node.localToWorld(this._v.set(0, 0.24, 0.13));
        this.g.fire.stream(lip, tip);
      } else if (s.type === 'act' && s.chore === 'douse') this.g.fire?.stream?.(null, 0);
    }
    if (a.can?.inHand === true) {
      const pour = s.type === 'act' && s.chore === 'fuel' ? smoothstep(0.36, 0.46, k) * (1 - smoothstep(0.76, 0.86, k)) : 0;
      hang(a.can, pour * 1.25, 0.44);
    }
    if (a.torch) {
      const on = a.torch.inHand === true && (s.type !== 'act' || s.chore !== 'torch' || k >= 0.52);
      const flick = tt > this.tLampOff ? 1 : 0.85;
      if (a.torch.glow) a.torch.glow.material.opacity = on ? flick : 0;
      if (a.torch.cone) a.torch.cone.material.opacity = on ? 0.075 * flick : 0;
    }
  }

  // sounds at their exact beats (footsteps on each stride, the work's own noises)
  _cues(a, s, tt, o) {
    const g = this.g, au = g.audio;
    if (!au) return;
    const hit = (key, fn) => { if (!a.hit[key]) { a.hit[key] = true; fn(); } };
    if (s.type === 'walk') {
      const step = Math.floor(o.phase / Math.PI);
      if (step > 0) hit(`${s.t0}:${step}`, () => au.mateStep?.(a.x, this._ground(a.x, a.z) + 0.1, a.z, 0.32));
      return;
    }
    if (s.type !== 'act') return;
    const k = clamp((tt - s.t0) / (s.t1 - s.t0), 0, 1);
    const y = this._ground(a.x, a.z);
    const at = (key, u, fn) => { if (k >= u) hit(`${s.chore}:${key}`, fn); };
    if (s.chore === 'torch') {
      at('click', 0.52, () => au.torchClick?.(true));
    } else if (s.chore === 'tent') {
      at('flap', 0.45, () => au.whump?.(this.st.tent.mouth.x, y + 0.6, this.st.tent.mouth.z, 0.35));
      at('tie', 0.72, () => au.paper?.());
    } else if (s.chore === 'fuel') {
      at('cap', 0.3, () => au.clank?.(this.gen.x, y + 0.7, this.gen.z, 0.25));
      at('glug', 0.48, () => au.glug?.(this.gen.x, y + 0.7, this.gen.z));
      at('glug2', 0.66, () => au.glug?.(this.gen.x, y + 0.7, this.gen.z));
    } else if (s.chore === 'douse') {
      at('hiss', 0.48, () => {
        au.steam?.(FIRE.x, this._ground(FIRE.x, FIRE.z) + 0.6, FIRE.z, 1);
        g.fire?.puff?.(1);
      });
    }
  }

  _hud(tt) {
    const off = Math.min(T0 - 0.2, (this.shots[1]?.t0 ?? T0) - 0.3);
    if (tt > 0.6 && tt < off && !this.titleShown) {
      this.titleShown = true;
      this.g.hud.setIntro(t('introBig'), t('introSmallCamp'));
    }
    if (tt >= off && this.titleShown) {
      this.titleShown = false;
      this.g.hud.setIntro(null);
    }
  }

  // ---------------- the camera ----------------
  // One shot per beat, cut between them: the crane, then each player at their job, then the camp at the end.
  _shotAt(tt) {
    for (const s of this.shots) if (tt < s.t1) return s;
    return this.shots[this.shots.length - 1];
  }

  cameraAt(tt) {
    const s = this._shotAt(tt);
    const k = clamp((tt - s.t0) / Math.max(1e-6, s.t1 - s.t0), 0, 1);
    const e = smoothstep(0, 1, k);
    const gy = (x, z) => this._ground(x, z);
    let p, l, fov;
    if (s.kind === 'crane') {
      const kk = smoothstep(0, 1, clamp(tt / T0, 0, 1));
      // from the south, over the benches, towards the generator's lamp
      p = [lerp(6.5, 3.2, kk), lerp(10.5, 2.6, kk), lerp(-14.5, -6.9, kk)];
      l = [lerp(-0.4, -0.7, kk), lerp(0.2, 0.75, kk), lerp(2.0, 1.6, kk)];
      fov = lerp(46, 52, kk);
    } else if (s.kind === 'finale') {
      // from the east, past the flashlight: the fire's smoke, the tent, the generator's lamp going out
      p = [lerp(8.6, 7.6, e), lerp(2.8, 2.5, e), lerp(1.2, 1.5, e)];
      l = [-2.6, 1.15, 3.4];
      fov = 54;
    } else {
      const st = this.st[s.kind], a = s.a;
      const at = st.at, y0 = gy(at.x, at.z);
      const chest = [a.x, gy(a.x, a.z) + 1.15, a.z];
      if (s.kind === 'torch') {
        // from the side: the camp behind them, the arm and the beam crossing the picture into the trees
        const side = st.aim - Math.PI / 2;
        p = [at.x + Math.sin(side) * 3.0, y0 + 1.5, at.z + Math.cos(side) * 3.0];
        const far = [at.x + Math.sin(st.aim) * 2.2, y0 + 1.25, at.z + Math.cos(st.aim) * 2.2];
        const w = smoothstep(0.5, 0.8, clamp((tt - (s.t1 - TAIL - ACT.torch)) / ACT.torch, 0, 1)) * 0.5;
        l = [lerp(chest[0], far[0], w), lerp(chest[1], far[1], w), lerp(chest[2], far[2], w)];
        fov = 52;
      } else if (s.kind === 'tent') {
        // from the other front corner: the whole opening, the cloth coming down over it, them at its edge
        const cp = tentPoint(-1.3, CAMP_TENT.halfLength + 1.7);
        const lk = tentPoint(0.3, CAMP_TENT.halfLength);
        p = [cp.x, y0 + 1.35, cp.z];
        l = [lk.x, y0 + 0.62, lk.z];
        fov = 52;
      } else if (s.kind === 'fuel') {
        // between the generator and the camp: the can, the machine and its lamp above
        const side = st.face + Math.PI - 0.7;
        p = [at.x + Math.sin(side) * 2.8, y0 + 1.6, at.z + Math.cos(side) * 2.8];
        l = [lerp(at.x, this.gen.x, 0.45), y0 + 1.15, lerp(at.z, this.gen.z, 0.45)];
        fov = 54;
      } else {
        // across the fire: the bucket coming over the flames towards us
        const across = yawTo(at, FIRE) + 0.42;
        p = [FIRE.x + Math.sin(across) * 2.5, gy(FIRE.x, FIRE.z) + 1.3, FIRE.z + Math.cos(across) * 2.5];
        l = [lerp(chest[0], FIRE.x, 0.3), y0 + 0.95, lerp(chest[2], FIRE.z, 0.3)];
        fov = 52;
      }
      // a slow push in through the shot
      p = [lerp(p[0], l[0], 0.12 * e), lerp(p[1], l[1], 0.12 * e), lerp(p[2], l[2], 0.12 * e)];
    }
    return { p, l, fov, kind: s.kind };
  }

  applyCamera(camera) {
    if (!this.active) return false;
    const tt = this.t;
    const c = this.cameraAt(tt);
    camera.position.set(c.p[0], c.p[1], c.p[2]);
    this._look.set(c.l[0], c.l[1], c.l[2]);
    camera.lookAt(this._look);
    const hh = 0.003; // a breath of handheld
    camera.rotateZ(Math.sin(tt * 0.9) * hh + Math.sin(tt * 2.3 + 1) * hh * 0.5);
    camera.rotateX(Math.sin(tt * 0.7 + 2) * hh);
    if (Math.abs(camera.fov - c.fov) > 0.01) {
      camera.fov = c.fov;
      camera.updateProjectionMatrix();
    }
    return true;
  }

  seek(tt) {
    this.t = tt;
    this.seeking = true;
  }
}
