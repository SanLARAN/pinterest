// Enduro bikes for the training ground: one per player, standing by the camp rack. (3.1r) They are the owner's
// Kugoo Wish 01 now — a small electric pit bike, modelled in Blender (kugooModel.js) — and they ride on a physics
// meant to feel like the real thing rather than a sliding box:
//
//  • a pitching chassis on two sprung wheels (a fork that slides along its rake, a swingarm that swings), each wheel
//    reading the hill under itself; landings compress the springs, bottom out, and a crest at speed lets go of you;
//  • an electric motor — force-limited off the line, power-limited above that — through a rear tyre that can only push
//    as hard as its load and the dirt allow: open it up from a crawl and the front lifts (a wheelie you hold with the
//    throttle and Shift, your weight back); too much in a turn and the back steps out;
//  • two brakes (S): the front does most of the stopping, pitches the bike onto its nose and can lock; a locked front
//    in a lean washes out;
//  • turning by lean at speed (A/D lean it; the yaw is what a leaned bike does, g·tanφ/v) and by the bar at a crawl,
//    with a friction circle shared between the two jobs — grip spent braking or driving is grip not there for the turn;
//  • in the air the wheels are gyros: gas lifts the nose, the brake drops it;
//  • and the ways it ends: over the bars off a nose-first landing, a loop-out, a lowside, a tree head-on.
// Each rider simulates their own bike (240 Hz inside the frame); the wire carries nothing new — a rider's machine
// sends the usual position, and 'mb' tells the others which bike to draw under whom.
import * as THREE from 'three';
import { clamp, damp, lerp } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { GK } from '../ui/garageSet.js';
import { geometryOf } from './uaz.js';
import { GroundShade } from './groundShade.js';
import { KUGOO_GROUPS, KUGOO_PIVOTS, KUGOO_STEER_AXIS, KUGOO_Q } from './kugooModel.js';

const PI = Math.PI;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };

// The machine and its rider, in SI. The geometry is the model's: 1.005 m between the axles, 0.222 m wheels.
export const MOTO = {
  mass: 123, // 48 kg of bike, 75 of you
  inertia: 24, // kg·m² about the pitch axis
  half: 0.5023, // half the wheelbase (axles at z = ∓half, ground at y = 0 in the model)
  R: 0.2218, // wheel radius
  cog: [0.74, 0.03], // height, and how far behind the middle of the wheelbase (+z is back)
  back: 0.09, // m your weight moves back with Shift
  travel: [0.16, 0.14], // suspension travel, front / rear
  sag: [0.052, 0.046], // ...and how much of it the bike sits in, standing
  damp: [620, 680], // N·s/m
  power: 2600, // W at the rear wheel
  force: 800, // N off the line: just past what lifts the front (m·g·b/H ≈ 770 N) — a wheelie you have to ask for
  brake: [620, 440], // N front, rear at full lever: hard, just inside a stoppie (Shift back is safer still)
  squeeze: 0.25, // s to pull the levers in
  mu: 0.9, // tyre on forest dirt
  air: 0.42, // ½ρC_dA
  roll: 0.022, // rolling resistance
  gravity: 9.81,
  leanMax: 0.85, // rad
  steerMax: 0.55, // rad of bar at a crawl
  gyro: [45, 70], // N·m of pitch the spinning wheels give in the air: gas, brake (a real wheel's spin-up, not a rocket)
  max: 17, // m/s (61 km/h): the power and the drag meet about here
  reverse: 1.3, // m/s: paddling it backwards with the brake held at a standstill
  throwAt: 5.5, // m/s into a trunk head-on
  radius: 0.48, // its footprint against trees
  seat: 0.7,
  eye: [1.38, 0.1], // your eyes on it: height, and how far behind the middle
};
const K = [0, 1].map((i) => (MOTO.mass * MOTO.gravity * (i === 0 ? 0.5 - MOTO.cog[1] / (2 * MOTO.half) : 0.5 + MOTO.cog[1] / (2 * MOTO.half))) / MOTO.sag[i]);
MOTO.spring = K; // N/m, from the static load and the sag

// the bike itself: a plain state object the park moves around (pure math, tested without a scene)
export function newBike(i, x, z, yaw) {
  return {
    i, x, z, y: 0, yaw, vx: 0, vz: 0, vy: 0, roll: 0, pitch: 0, wp: 0, steer: 0, air: 0, spin: 0, spinR: 0, speed: 0, hit: 0,
    grounded: true, sus: 0, comp: [MOTO.sag[0], MOTO.sag[1]], load: [0, 0], slip: 0, wheelie: 0, down: 0, downSide: 1, lastGh: null,
  };
}

// a point of the model (y up, z back) at the bike's pitch: [forward distance, height] relative to its origin
function at(b, py, pz) {
  const c = Math.cos(b.pitch), s = Math.sin(b.pitch);
  return [-s * py - c * pz, c * py - s * pz]; // (Rx(pitch) of (0, py, pz); forward is −z)
}

// one step of a rider's bike. input: { move: {x,y}, sprint } — y>0 gas, y<0 brakes, x lean/bar, sprint: weight back.
// world: { terrain: { height }, col: { resolve } }. Returns what happened (for sounds and throws)
export function stepBike(b, input, world, dt) {
  const ev = { throttle: 0, brake: 0, landed: 0, threw: false, bump: 0, cause: null };
  const n = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / n;
  for (let k = 0; k < n && !ev.threw; k++) _sub(b, input, world, h, ev);
  b.air = b.grounded ? Math.max(0, b.air - dt * 4) : Math.min(1, b.air + dt * 4);
  b.hit = Math.max(0, b.hit - dt);
  b.sus = Math.max(0, b.sus - dt * 2.2);
  return ev;
}

function _sub(b, input, world, h, ev) {
  const M = MOTO, g = M.gravity;
  const gas = clamp(input.move?.y || 0, 0, 1), u = clamp(input.move?.x || 0, -1, 1);
  b.lever = clamp((b.lever || 0) + (input.move?.y < 0 ? h : -2 * h) / M.squeeze, 0, 1) * (input.move?.y < 0 ? 1 : 0.999);
  const brk = clamp(-(input.move?.y || 0), 0, 1) * b.lever;
  // your weight: back with Shift; otherwise forward over the bars as the front starts to come up (the way anyone rides
  // a climb), and braced back a little on the brakes
  const back = (input.sprint ? M.back : -0.12 * smooth(0.04, 0.25, b.rel || 0)) + (b.lever || 0) * 0.05;
  const fx = -Math.sin(b.yaw), fz = -Math.cos(b.yaw), rx = -fz, rz = fx;
  let v = b.vx * fx + b.vz * fz; // forward
  // ---- the two wheels on the ground: where each one is, and what its spring pushes ----
  const wasGrounded = b.grounded, vyIn = b.vy;
  const cogZ = M.cog[1] + back;
  const [dC, yC] = at(b, M.cog[0] - (back > 0 ? 0.04 : 0), cogZ);
  let Ny = 0, tau = 0, any = false;
  const gHs = [0, 0], load = [0, 0], ds = [0, 0];
  for (let i = 0; i < 2; i++) {
    const [d, y] = at(b, M.R, i === 0 ? -M.half : M.half); // the wheel's centre where it sits standing
    const wx = b.x + fx * d, wz = b.z + fz * d;
    const gh = world.terrain.height(wx, wz);
    gHs[i] = gh;
    ds[i] = d;
    const pen = gh + M.R - (b.y + y); // how far the ground would push the wheel up from its standing place
    let c = M.sag[i] + pen;
    // deeper than the fork can take (a step, a spawn under the ground): the chassis is put back on its stops rather
    // than fired off them by a spring compressed a metre
    // and past the end of its travel it is bottomed out: metal on metal — the chassis goes up with the ground at that
    // wheel, without a bounce (it was a stiff spring, and a roller face at speed fired the bike five metres up)
    if (c > M.travel[i]) { const lift = c - M.travel[i]; b.y += lift; b.vy = Math.max(b.vy, Math.min(b.vy + lift / h, 6)); c -= lift; b.sus = 1; }
    let c0 = b.comp[i];
    if (Math.abs(c - c0) > 0.03) c0 = c; // a jump in it (a spawn, a teleport, the first touch of a step) is no speed for the damper
    if (c <= 0) { b.comp[i] = 0; continue; } // that wheel hangs in the air
    any = true;
    const rate = clamp((c - c0) / h, -4, 4); // (a damper has a top speed: valves, not a wall)
    let N = M.spring[i] * Math.min(c, M.travel[i]) + M.damp[i] * rate * (rate > 0 ? 1 : 1.6);
    N = Math.max(0, N);
    b.comp[i] = Math.min(c, M.travel[i] + 0.02);
    load[i] = N;
    Ny += N;
    tau += N * (d - dC); // a push in front of the weight lifts the nose
  }
  b.load = load;
  // the ground's own slope under the two wheels, and the bike's pitch against it (a wheelie is that, not the hill)
  // (read only while both tyres are down: with one wheel over a lip, the ground between them is not a slope)
  if (load[0] > 0 && load[1] > 0) b.gslope = Math.atan2(gHs[0] - gHs[1], 2 * M.half * Math.cos(b.pitch));
  else if (b.gslope == null) b.gslope = b.pitch;
  const slope = b.gslope;
  const rel = b.pitch - slope;
  b.rel = rel;
  // ---- along the ground: the motor, the brakes, the air ----
  const muF = M.mu * load[0], muR = M.mu * load[1];
  // the rider's own hand on the gas: without Shift you ease off as the front climbs past ~10°; with your weight back
  // you hold it short of the balance point (atan(b/H) ≈ 0.47 rad), where a keyboard can still ride it — S brings it down
  // ...and either way you never hold it on past the balance point — the pitch at which the weight sits over the
  // rear axle (on a climb that comes sooner: the hill has already tipped you back)
  const margin = Math.atan2(M.half - cogZ, M.cog[0]) - b.pitch;
  const ease = input.sprint ? smooth(0.04, 0.22, margin) : Math.min(1 - smooth(0.14, 0.3, rel), smooth(0.1, 0.3, margin));
  const want = gas * ease * Math.min(M.force, M.power / Math.max(1.5, Math.abs(v)));
  const drive = Math.min(want, muR);
  const spin = want > muR + 1 ? clamp((want - muR) / 400, 0, 1) : 0; // the rear breaks loose
  const pressF = brk * M.brake[0], pressR = brk * M.brake[1];
  const lockF = pressF > muF && load[0] > 0, lockR = pressR > muR && load[1] > 0;
  // at a crawl with the brake held you are paddling it backwards with your feet, not braking
  const paddle = any && brk > 0.3 && !gas && v < 0.3;
  const stopF = paddle ? 0 : Math.min(pressF, muF * (lockF ? 0.8 : 1)), stopR = paddle ? 0 : Math.min(pressR, muR * (lockR ? 0.8 : 1));
  const sgn = v > 0.05 ? 1 : v < -0.05 ? -1 : 0;
  let Fx = drive - (stopF + stopR) * sgn;
  const drag = M.air * v * Math.abs(v) + M.roll * Ny * sgn;
  // the hill under the wheels: the slope's own pull
  let a = (Fx - drag) / M.mass - g * Math.sin(slope) * (any ? 1 : 0);
  if (!any) a = -drag / M.mass;
  let nv = v + a * h;
  if (sgn > 0 && nv < 0 && !gas) nv = 0; // brakes stop it, they do not run it backwards
  // at a standstill with the brake held: you paddle it back with your feet, at a walk
  if (paddle) nv = Math.max(-M.reverse * brk, Math.min(v, 0) - 2.5 * h);
  if (any && !gas && !brk && Math.abs(nv) < 0.05 && Math.abs(slope) < 0.12) nv = 0;
  ev.throttle = gas; ev.brake = brk;
  b.vx += fx * (nv - v);
  b.vz += fz * (nv - v);
  v = nv;
  // the longitudinal pushes act at the tyres, below the weight: gas lifts the front, the brakes put it down
  // (each force at its own tyre: the height of the weight over THAT wheel's ground — over a lip the front has none)
  // (and measured square to the ground's slope, not straight up: on a climb the rear tyre is under the weight's heel)
  const cs = Math.cos(slope), sn = Math.sin(slope);
  const Hf = clamp((b.y + yC - gHs[0]) * cs - (dC - ds[0]) * sn, 0.2, 1.2), Hr = clamp((b.y + yC - gHs[1]) * cs - (dC - ds[1]) * sn, 0.2, 1.2);
  tau += (drive - stopR * sgn) * Hr - stopF * sgn * Hf;
  // ---- up and down, and the pitch ----
  b.vy += (Ny / M.mass - g) * h;
  b.y += b.vy * h;
  if (!any) tau += (gas * M.gyro[0] - brk * M.gyro[1]) + (back ? 25 : 0); // in the air the wheels are gyros
  b.wp += (tau / M.inertia) * h;
  b.wp *= Math.exp(-(any ? 3 : 0.4) * h);
  b.pitch = wrap(b.pitch + b.wp * h); // (a full flip in the air lands you upright again: it is an angle, not a counter)
  b.grounded = any;
  if (any && !wasGrounded && vyIn < -2.5) {
    ev.landed = Math.min(1, -vyIn / 9);
    b.sus = Math.max(b.sus, clamp(-vyIn / 7, 0, 1));
    // nose first, hard, at speed: over the bars
    if (rel < -0.55 && vyIn < -4 && Math.abs(v) > 3) { ev.threw = true; ev.cause = 'bars'; }
  }
  b.wheelie = load[0] < 1 && load[1] > 0 ? Math.min(1, b.wheelie + h * 3) : Math.max(0, b.wheelie - h * 5);
  if (rel > 1.2 && any) { ev.threw = true; ev.cause = 'loop'; } // looped it over backwards
  if (rel < -0.95 && any) { ev.threw = true; ev.cause = 'bars'; } // on its nose: over the front
  // ---- the lean, the turn, and how much grip there is for it ----
  const speed = Math.abs(v);
  const lean = smooth(2.5, 6, speed); // 0: steered by the bar at a crawl, 1: steered by lean
  const leanT = any ? -u * Math.min(M.leanMax, Math.atan(M.mu * 0.92)) * lean : b.roll; // full lean sits just inside the grip
  b.roll = damp(b.roll, leanT, any ? 5.5 : 1.2, h);
  const bar = u * M.steerMax * (1 - lean);
  b.steer = damp(b.steer, bar + -b.roll * 0.12, 10, h);
  let r = -(v * Math.tan(bar)) / (2 * M.half) * (any ? 1 : 0.15);
  if (speed > 0.5) r += lean * (g * Math.tan(b.roll)) / Math.max(3, speed) * (any ? 1 : 0.05);
  // the back stepping out: wheelspin in a lean swings the tail round
  if (spin > 0 && any) r += -u * spin * 1.6;
  b.yaw += r * h;
  // grip across: what the tyres can still hold sideways after driving and braking (the friction circle)
  const along = Math.abs(drive - (stopF + stopR)) / M.mass;
  const total = any ? (M.mu * Ny) / M.mass : 0;
  let side = Math.sqrt(Math.max(0, total * total - along * along));
  if (lockF) side *= 0.3;
  if (spin) side *= 1 - 0.55 * spin;
  const nfx = -Math.sin(b.yaw), nfz = -Math.cos(b.yaw), nrx = -nfz, nrz = nfx;
  const vs = b.vx * nrx + b.vz * nrz;
  const cut = clamp(vs, -side * h, side * h);
  b.vx -= nrx * cut;
  b.vz -= nrz * cut;
  b.slip = damp(b.slip, Math.abs(vs - cut), 6, h);
  // a lowside: leaned over, the tyres asked for an eighth more than they have for a third of a second — or a locked
  // front in a lean — and the front tucks
  const demand = Math.abs(speed * r);
  b.wash = any && Math.abs(b.roll) > 0.4 && speed > 4 && demand > side * 1.12 ? (b.wash || 0) + h : Math.max(0, (b.wash || 0) - 2 * h);
  if (any && speed > 4 && ((Math.abs(b.roll) > 0.45 && lockF) || b.wash > 0.3)) { ev.threw = true; ev.cause = 'lowside'; }
  // ---- where it goes, and what is in the way ----
  const pos = { x: b.x + b.vx * h, z: b.z + b.vz * h };
  const hit = world.col.resolve(pos, M.radius);
  if (hit.hit) {
    const into = -(b.vx * hit.nx + b.vz * hit.nz);
    if (into > 0) {
      b.vx += into * hit.nx * 1.35; // out of it, with a little bounce: the bark takes its share
      b.vz += into * hit.nz * 1.35;
      ev.bump = Math.max(ev.bump, Math.min(1, into / 7));
      if (into > M.throwAt && any) { ev.threw = true; ev.cause = 'tree'; b.hit = 1; }
    }
  }
  b.x = clamp(pos.x, -286, 286);
  b.z = clamp(pos.z, -286, 286);
  b.speed = b.vx * nfx + b.vz * nfz;
  b.spin = (b.spin + (b.speed / M.R) * h) % (2 * PI);
  b.spinR = (b.spinR + ((b.speed + spin * 6) / M.R) * h) % (2 * PI);
  if (ev.threw) {
    b.down = 1;
    b.downSide = b.roll !== 0 ? Math.sign(-b.roll) || 1 : 1;
    if (ev.cause === 'tree') b.hit = 1;
  }
}

// where your eyes are on the bike (world height), as it pitches and leans
export function riderEye(b, back = 0) {
  const [, y] = at({ pitch: b.pitch || 0 }, MOTO.eye[0], MOTO.eye[1] + back);
  return (b.y || 0) + y * Math.cos(b.roll || 0);
}

// a machine on its side (it threw you): it slides to a stop where it fell
export function settleDown(b, world, dt) {
  const k = Math.exp(-3.5 * dt);
  b.vx *= k; b.vz *= k;
  b.x += b.vx * dt; b.z += b.vz * dt;
  b.roll = damp(b.roll, 1.42 * b.downSide, 6, dt);
  b.pitch = damp(b.pitch, 0, 6, dt);
  b.wp = 0;
  b.y = world.terrain.height(b.x, b.z) - 0.12;
  b.vy = 0;
  b.speed = 0;
}

// ---------------- the mesh: the Kugoo, in its own parts ----------------
// (generated from the owner's .blend: see kugooModel.js) — the frame and the rest of the body; the swingarm round its
// pivot; the steering (bars, plate, fender) round the raked steering axis; the fork's sliders along it; the two wheels.
const _geo = new Map();
function partGeometry(name, paint) {
  const key = name + ':' + paint;
  if (_geo.has(key)) return _geo.get(key);
  const G = KUGOO_GROUPS[name];
  const pos = decode(G.p, Int16Array), meta = decode(G.m, Uint8Array);
  const b = new MeshBuilder(G.n + 8);
  const q = 1 / KUGOO_Q;
  for (let i = 0; i < G.n; i++) {
    const o = i * 9;
    const kind = meta[i * 2] === 255 ? paint : meta[i * 2];
    b.tri([pos[o] * q, pos[o + 1] * q, pos[o + 2] * q], [pos[o + 3] * q, pos[o + 4] * q, pos[o + 5] * q], [pos[o + 6] * q, pos[o + 7] * q, pos[o + 8] * q], kind, meta[i * 2 + 1]);
  }
  const geo = geometryOf(b.toArrays());
  _geo.set(key, geo);
  return geo;
}
function decode(b64, T) {
  const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new T(u8.buffer);
}

const PV = KUGOO_PIVOTS;
const AXIS = new THREE.Vector3(...KUGOO_STEER_AXIS);
// the bike, assembled: { root, steer, fork, swing, wheelF, wheelR } — root is the model's origin, on the ground
export function buildKugoo(paint = KIND.BONE, mat = null) {
  const m = (name) => { const o = new THREE.Mesh(partGeometry(name, paint), mat); o.frustumCulled = false; return o; };
  const root = new THREE.Group();
  const body = m('body');
  body.position.fromArray(PV.body); // (every group is stored around its own pivot: the body's is the rear axle's foot)
  root.add(body);
  const swing = new THREE.Group();
  swing.position.fromArray(PV.swing);
  swing.add(m('swing'));
  const wheelR = new THREE.Group();
  wheelR.position.set(PV.wheelR[0] - PV.swing[0], PV.wheelR[1] - PV.swing[1], PV.wheelR[2] - PV.swing[2]);
  wheelR.add(m('wheelR'));
  swing.add(wheelR);
  root.add(swing);
  const steer = new THREE.Group();
  steer.position.fromArray(PV.steer);
  steer.add(m('steer'));
  const fork = new THREE.Group(); // the sliders and the front wheel: they ride up the axis as the fork compresses
  fork.add(m('forkLow'));
  const wheelF = new THREE.Group();
  wheelF.position.set(PV.wheelF[0] - PV.steer[0], PV.wheelF[1] - PV.steer[1], PV.wheelF[2] - PV.steer[2]);
  wheelF.add(m('wheelF'));
  fork.add(wheelF);
  steer.add(fork);
  root.add(steer);
  root.userData.kugoo = { steer, fork, swing, wheelF, wheelR };
  return root;
}

// pose the parts from the state: the bar, the fork's travel, the swingarm's angle, the wheels turning
const ARM = Math.hypot(PV.wheelR[1] - PV.swing[1], PV.wheelR[2] - PV.swing[2]);
const ARM0 = Math.atan2(PV.wheelR[1] - PV.swing[1], PV.wheelR[2] - PV.swing[2]);
const _q = new THREE.Quaternion();
export function poseKugoo(root, b) {
  const P = root?.userData?.kugoo;
  if (!P) return;
  P.steer.quaternion.setFromAxisAngle(AXIS, -(b.steer || 0));
  const cf = (b.comp?.[0] ?? MOTO.sag[0]) - MOTO.sag[0], cr = (b.comp?.[1] ?? MOTO.sag[1]) - MOTO.sag[1];
  P.fork.position.copy(AXIS).multiplyScalar(cf);
  // the rear wheel rises by cr: the arm turns about its pivot by that much of its length
  const ang = Math.asin(clamp(Math.sin(ARM0) + cr / ARM, -1, 1)) - ARM0;
  P.swing.rotation.x = -ang; // (three's +x rotation turns +z down: the arm's angle in (z, y) runs the other way)
  P.wheelR.rotation.x = -(b.spinR ?? b.spin ?? 0) + ang;
  P.wheelF.rotation.x = -(b.spin || 0);
  void _q;
}

// ---------------- the rider's own cockpit ----------------
// At the eye line on the seat the bars fall below the bottom of the screen, so you get a copy of the Kugoo's own
// steering — bars, grips, the dash and the number plate — hung off the camera where the bars would sit in your view.
const BAR = (() => {
  // the middle of the grips, in the steering's own frame (from the model: its rubber, high up)
  const G = KUGOO_GROUPS.steer, pos = decode(G.p, Int16Array), meta = decode(G.m, Uint8Array);
  let x = 0, y = 0, z = 0, n = 0;
  for (let i = 0; i < G.n; i++) if (meta[i * 2] === GK.RUBBER) { for (let v = 0; v < 3; v++) { y += pos[i * 9 + v * 3 + 1]; z += pos[i * 9 + v * 3 + 2]; n++; } }
  return n ? [x, y / n / KUGOO_Q, z / n / KUGOO_Q] : [0, 0.3, -0.1];
})();

// ---------------- the park: four bikes by the camp ----------------
export class MotoPark {
  constructor(game) {
    this.g = game;
    this.paints = [KIND.BONE, GK.REDPAINT, GK.GATE, GK.CARPAINT]; // the Kugoo's own white first
    this.bikes = [];
    this.cockpit = null;
    this.rider = -1; // which bike YOU sit on (-1 walking)
    this.riders = new Map(); // bike index -> remote player id (drawn at their position)
    this.mountT = 0;
    this.hum = null;
  }

  // park them in a row by the camp, noses out — one per slot, waiting
  reset() {
    const g = this.g;
    for (const m of this.bikes) {
      if (m.mesh.parent) m.mesh.parent.remove(m.mesh);
      m.shade?.dispose();
    }
    this.bikes = [];
    this.rider = -1;
    this.riders.clear();
    this.mountT = 0;
    this._dropCockpit();
    const yaw = g.trainingYaw || 0.6;
    for (let i = 0; i < 4; i++) {
      const off = (i - 1.5) * 1.3;
      const x = (g.rackX ?? 6) + Math.cos(yaw) * off, z = (g.rackZ ?? 14) - Math.sin(yaw) * off;
      const b = newBike(i, x, z, yaw);
      b.mesh = buildKugoo(this.paints[i % this.paints.length], g.world.material);
      b.mesh.rotation.order = 'YXZ'; // heading first: the lean and the slope belong to the machine
      b.wheels = [b.mesh.userData.kugoo.wheelF, b.mesh.userData.kugoo.wheelR];
      b.shade = new GroundShade({ rx: 0.34, rz: 0.82, strength: 0.52 }); // where it meets the grass
      b.shade.place(x, z, yaw, true);
      this._seat(b); // both wheels on the ground: the hill under the axles, not under the middle
      g.scene.add(b.mesh);
      this.bikes.push(b);
    }
    this.place();
  }

  // stand a machine on the hill: the two axles are sampled on their own, so a bike left on a slope rests on both
  // wheels instead of sinking into it; a fallen one is picked up
  _seat(b) {
    const tr = this.g.world.terrain;
    const fx = -Math.sin(b.yaw), fz = -Math.cos(b.yaw);
    const hf = tr.height(b.x + fx * MOTO.half, b.z + fz * MOTO.half);
    const hb = tr.height(b.x - fx * MOTO.half, b.z - fz * MOTO.half);
    b.y = (hf + hb) / 2 + 0.005;
    b.vy = 0; b.wp = 0; b.roll = 0; b.down = 0;
    b.grounded = true;
    b.lastGh = null;
    b.comp = [MOTO.sag[0], MOTO.sag[1]];
    b.pitch = Math.atan2(hf - hb, 2 * MOTO.half);
  }

  // the nearest mountable bike within reach (Objectives-style: what E can find) — or, in the saddle,
  // the bike under you, so E can step off again
  consider(fn) {
    if (!this.g.training || this.mountT > 0) return;
    if (this.rider >= 0) {
      const b = this.bikes[this.rider];
      if (b) fn(b, b.x, b.z, 2.4, 'moto');
      return;
    }
    for (const b of this.bikes) {
      if (this.riders.get(b.i)) continue; // a friend is on it
      fn(b, b.x, b.z, 1.9, 'moto');
    }
  }

  interact(best, dt, held, still, T) {
    const b = best.obj;
    this.g.hud.setUse(T(this.rider >= 0 ? 'motoDismount' : b.down ? 'motoLift' : 'motoMount'), 0, true);
    if (held && still) this.mount(b.i);
  }

  // get on (or off, if i is the bike you're on)
  mount(i, silent = false) {
    const g = this.g;
    if (this.rider === i) return this.dismount(silent);
    if (this.rider >= 0) this.dismount(true);
    const b = this.bikes[i];
    if (!b) return;
    this.rider = i;
    this.mountT = 0.45;
    b.x = g.player.x; b.z = g.player.z; b.yaw = g.player.yaw; // it stands where you found it; you ride from where you are
    b.vx = b.vz = 0;
    this._seat(b); // (a fallen one is stood back up)
    g.player.x = b.x; g.player.z = b.z; g.player.vx = g.player.vz = 0; // onto the seat
    if (!silent) {
      g.hud.popup(t('motoOn'), 'dim');
      g.audio?.motoOn?.();
    }
    if (g.sync) g.sync.ev('mb', i, 1);
  }

  dismount(silent = false, fell = false) {
    const g = this.g;
    if (this.rider < 0) return;
    const b = this.bikes[this.rider];
    const i = this.rider;
    this.rider = -1;
    this.mountT = 0.45;
    if (b) { // step off beside it and half a pace back — the machine stays in the corner of your eye
      g.player.x = b.x + Math.cos(b.yaw) * 1.05 + Math.sin(b.yaw) * 0.3;
      g.player.z = b.z - Math.sin(b.yaw) * 1.05 + Math.cos(b.yaw) * 0.3;
      g.player.vx = g.player.vz = 0;
      if (!fell) {
        b.vx = b.vz = 0;
        b.speed = 0;
        this._seat(b); // down on both wheels where you left it, even on a slope
      }
    }
    if (!silent) g.hud.popup(t('motoOff'), 'dim');
    g.audio?.motoOff?.();
    if (g.sync) g.sync.ev('mb', i, 0);
    if (b && b.mesh) b.mesh.visible = true; // it was hidden while under you: show it *before* the next place()
    this.place(); // ...which then keeps it shown (rider is -1 now)
    if (b && b.mesh) b.mesh.visible = true; // belt and braces: it is never left as the invisible ride
  }

  // a friend got on/off their bike ('mb': every machine marks it, and draws it under them)
  netMount(pid, i, on) {
    if (on) this.riders.set(i, pid);
    else this.riders.delete(i);
  }

  // …and every state packet carries the bike they sit on, so the picture survives a lost 'mb' (and a
  // friend who joins the range halfway through a lap still sees them riding rather than walking)
  _reconcile() {
    const remotes = this.g.remotes;
    if (!remotes || !remotes.size) return;
    for (const r of remotes.values()) {
      const i = r.riding | 0;
      if (i >= 0 && this.bikes[i]) this.riders.set(i, r.id);
    }
    for (const [i, id] of [...this.riders]) {
      const r = remotes.get(id);
      if (!r || !r.alive || (r.riding | 0) !== i) this.riders.delete(i);
    }
  }

  // your own ride: the input drives the bike, the player rides it (remote sync carries the position)
  update(dt, input) {
    const g = this.g;
    this.mountT = Math.max(0, this.mountT - dt);
    if (this.rider >= 0 && !this.bikes[this.rider]) this.rider = -1; // the ride was taken away under them
    if (this.rider >= 0 && g.state !== 'training') this.dismount(true); // the range ended under you
    this._reconcile();
    for (const b of this.bikes) if (b.down && b.i !== this.rider && !this.riders.get(b.i)) settleDown(b, g.world, dt);
    if (this.rider < 0) {
      // on foot: a parked machine is a solid thing, not a picture — and your own must be back in
      // sight the moment you step off (place() is what makes it visible again)
      this.separate();
      this.place();
      return;
    }
    const b = this.bikes[this.rider];
    const muted = g.inputMuted || g.inventory?.active || g.state !== 'training';
    const ev = stepBike(b, muted ? { move: { x: 0, y: 0 } } : { move: input.move, sprint: !!input.sprint }, g.world, dt);
    g.player.x = b.x;
    g.player.z = b.z;
    g.player.y = b.y;
    g.player.yaw = b.yaw;
    g.player.vx = b.vx;
    g.player.vz = b.vz;
    g.player.speed = Math.hypot(b.vx, b.vz);
    if (ev.landed > 0.35) { g.audio?.bump?.(); g.addTrauma?.(ev.landed * 0.3); }
    if (ev.bump > 0.2) g.audio?.bump?.();
    if (ev.threw) { // off you go: the machine goes down where it is, you land past it
      const fx = -Math.sin(b.yaw), fz = -Math.cos(b.yaw);
      const vx = b.vx, vz = b.vz;
      this.dismount(true, true);
      const fly = ev.cause === 'loop' ? -1.2 : 1.4;
      g.player.x = b.x + fx * fly;
      g.player.z = b.z + fz * fly;
      g.player.vx = vx * 0.3; g.player.vz = vz * 0.3;
      g.addTrauma?.(0.55);
      g.hud.popup(t(ev.cause === 'bars' ? 'motoBars' : ev.cause === 'loop' ? 'motoLoop' : ev.cause === 'lowside' ? 'motoLowside' : 'motoThrown'), 'warn');
      g.audio?.bump?.();
    }
    this._apart(b);
    g.audio?.motoLoop?.(Math.abs(b.speed) / MOTO.max, this.rider >= 0);
    this.place();
  }

  // the closest point on a bike's spine (a capsule along its heading), and how far you are from it
  _near(b, x, z, res) {
    const fx = -Math.sin(b.yaw), fz = -Math.cos(b.yaw);
    const tt = clamp((x - b.x) * fx + (z - b.z) * fz, -0.62, 0.62);
    const cx = b.x + fx * tt, cz = b.z + fz * tt;
    const dx = x - cx, dz = z - cz;
    res.d = Math.hypot(dx, dz);
    res.nx = res.d > 1e-5 ? dx / res.d : 1;
    res.nz = res.d > 1e-5 ? dz / res.d : 0;
    return res;
  }

  // a walker against the parked machines: push out of the spine, kill the step into it
  separate() {
    const g = this.g, p = g.player;
    if (!p) return;
    const q = { d: 0, nx: 0, nz: 0 };
    for (const b of this.bikes) {
      if (this.riders.get(b.i)) continue; // a friend is sitting on it: their body does the colliding
      this._near(b, p.x, p.z, q);
      const rr = 0.36 + 0.3; // half the machine's width, plus the walker
      if (q.d >= rr) continue;
      p.x += q.nx * (rr - q.d);
      p.z += q.nz * (rr - q.d);
      const vn = p.vx * q.nx + p.vz * q.nz;
      if (vn < 0) { p.vx -= vn * q.nx; p.vz -= vn * q.nz; }
    }
  }

  // a ridden machine against the parked ones: it stops and slides, it does not pass through
  _apart(b) {
    const q = { d: 0, nx: 0, nz: 0 };
    for (const o of this.bikes) {
      if (o === b) continue;
      this._near(o, b.x, b.z, q);
      const rr = 0.62;
      if (q.d >= rr) continue;
      b.x += q.nx * (rr - q.d);
      b.z += q.nz * (rr - q.d);
      const vn = b.vx * q.nx + b.vz * q.nz;
      if (vn < 0) { b.vx -= vn * q.nx; b.vz -= vn * q.nz; }
    }
  }

  // the meshes: yours exactly where it is; a friend's under their remote body
  place() {
    const g = this.g;
    for (const b of this.bikes) {
      if (!b.mesh) continue; // a bare bike state (the physics tests build those)
      const riderId = this.riders.get(b.i);
      let x = b.x, z = b.z, yaw = b.yaw, y = b.y, roll = b.roll, pitch = b.pitch;
      if (b.i !== this.rider && riderId) {
        const r = g.remotes.get(riderId);
        if (r && Number.isFinite(r.x) && Number.isFinite(r.z)) {
          // Their state is the bike's state: write it back into the bike itself, so the machine is
          // standing where they stepped off it (and not back at the rack where it was parked).
          const dyaw = wrap(r.yaw - b.yaw);
          b.x = x = r.x; b.z = z = r.z; b.y = y = r.y; b.yaw = yaw = r.yaw;
          b.roll = roll = damp(b.roll, clamp(-dyaw * 14, -0.45, 0.45), 6, 1 / 60);
          b.pitch = pitch = damp(b.pitch, 0, 4, 1 / 60);
          b.down = 0;
          b.spin = b.spinR = (r.moved || 0) / MOTO.R;
        }
      }
      if (!b.mesh.parent && g.scene) g.scene.add(b.mesh); // a mesh that lost its parent comes home
      b.mesh.position.set(x, y, z);
      b.mesh.rotation.set(pitch, yaw, roll, 'YXZ');
      b.mesh.visible = !(b.i === this.rider && this.rider >= 0 && g.state === 'training'); // yours is replaced by the cockpit (see placeCockpit)
      poseKugoo(b.mesh, b);
      b.shade?.place(x, z, yaw);
    }
  }

  dispose() {
    for (const b of this.bikes) {
      if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
      b.shade?.dispose();
    }
    this.bikes = [];
    this._dropCockpit();
  }

  // the bars in front of you are one mesh, made on the first ride and reused: take it out of the scene
  // with the park (it used to stay behind, frozen at the last camera position)
  _dropCockpit() {
    const m = this.cockpitMesh;
    if (m?.parent) m.parent.remove(m);
    this.cockpitMesh = null;
    this.cockpitPaint = null;
  }

  // the cockpit under the camera: the Kugoo's own steering, built once, hidden while walking
  placeCockpit(camera, visible) {
    const g = this.g, i = this.rider;
    if (!visible || i < 0) {
      if (this.cockpitMesh) this.cockpitMesh.visible = false;
      return;
    }
    const paint = this.paints[i % this.paints.length];
    if (!this.cockpitMesh || this.cockpitPaint !== paint) {
      this._dropCockpit();
      this.cockpitMesh = buildBars(paint, g.world.material);
      this.cockpitPaint = paint;
      g.scene.add(this.cockpitMesh);
    }
    placeBars(this.cockpitMesh, camera, this.bikes[i]);
  }
}

// (5.0e→5.0f) the rider's bars, for any ride (the training ground's, «Топь»'s causeway): the Kugoo's own steering,
// its grips' middle at the holder's origin
export function buildBars(paint, mat) {
  const holder = new THREE.Group();
  const steer = new THREE.Mesh(partGeometry('steer', paint), mat);
  steer.frustumCulled = false;
  steer.renderOrder = 3;
  steer.position.set(-BAR[0], -BAR[1], -BAR[2]);
  const turn = new THREE.Group();
  turn.add(steer);
  holder.add(turn);
  holder.userData.turn = turn;
  return holder;
}

// ...hung under the camera where an enduro's bars sit in your view: a hand below the eyes, half a metre out
export function placeBars(m, camera, b) {
  m.visible = true;
  m.position.copy(camera.position);
  m.quaternion.copy(camera.quaternion);
  m.translateY(-0.36);
  m.translateZ(-0.5);
  m.rotateZ((b?.roll || 0) * 0.3); // the view already leans with the machine: a little more for the bars
  m.userData.turn.quaternion.setFromAxisAngle(AXIS, -(b?.steer || 0));
  m.updateMatrixWorld();
}
