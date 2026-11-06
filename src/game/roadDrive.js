// «Топь», chapter 2 (5.0c): «Грунтовка». The car the convoy film left on the dirt road, and now it is yours to
// drive: the host at the wheel (alone — you), the rest in their seats looking about. Behind it the arm comes after
// you along the very track you drove — it surfaces, rears over the road and comes down where you were a moment
// ago; be slower than it and it comes down on you. Ahead, out of the road itself, the Корень: the ground swells
// on one side of the ruts for a second, then a root-arm shoots up out of it — swerve to the other side. Three
// times the road forks and two of the three ways end in a felled tree; the map is in the navigator's hands (the
// seat beside the driver), and they have to say where to turn. Alone you look at it yourself — and while you do
// you are not looking at the road.
//
// The host's machine drives: the car, the chase and the roots are simulated there and sent to everyone ('dv',
// fifteen times a second); a guest only draws them. A death (the arm on the car, or the car flipped by a root)
// starts the chapter again for everyone (game/level2.js). The end of the road — the pine — is chapter 3.
import * as THREE from 'three';
import { RNG, clamp, lerp, smoothstep, damp, angleDiff } from '../core/rng.js';
import { fovFor } from '../core/config.js';
import { t } from '../core/i18n.js';
import { shared, createWorldMaterial } from '../render/sonar.js';
import { buildFilmCar, disposeFilmCar, FILM_CARS } from './filmCar.js';
import { buildSurvivor, poseSeated } from './survivor.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { PLAYER_HEX } from './remote.js';
import { myFit } from './outfit.js';
import { haloMaterial } from './glowsticks.js';
import { beaconTexture } from './roadTraffic.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { ROADS, FORKS, CRASH, onRoad } from '../world/swamp.js';
import { RoadArm, armRadius, ARM } from './roadArm.js';
import { MOON } from './convoyFilm.js';

const PI = Math.PI;
const NO_LOOK = { dx: 0, dy: 0 };
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const _e = new THREE.Euler(0, 0, 0, 'YXZ');
const _ry = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -PI / 2);

// the car: a УАЗ on a dirt road at night — quick enough to get away, not quick enough to be careless
export const DRIVE = {
  wheelbase: 2.4,
  vmax: 13, // m/s on the road (47 km/h: a forest track at night)
  vmaxOff: 7, // ...off it (ruts, roots, brushwood)
  vrev: 5,
  accel: 5.4,
  brake: 9.5,
  revAccel: 3.2,
  roll: 0.3, // rolling resistance, m/s²
  offDrag: 1.6, // ...and the extra off the road
  drag: 0.0025, // air, × v² (a УАЗ is a brick, but a heavy one)
  steerMax: 0.62, // rad at the wheels, standing
  steerHigh: 0.2, // ...at speed
  steerRate: 2.8, // how fast the wheel turns (full lock per second)
  grip: 6.2, // m/s² the tyres hold sideways on the dirt
  gripOff: 4.5,
  axle: 1.15, // the two circles the car is to the trees: at ± this along it
  r: 1.0,
  hz: 120,
};
// the arm behind: it follows your track, coming up to slam every `cycle` seconds where it has got to
export const CHASE = {
  start: 2.5, // s before it moves
  behind: 36, // m behind the car along the road when it does
  v0: 9.2, v1: 11.2, ramp: 30, // m/s along your track: from v0 to v1 over `ramp` seconds
  leash: 28, pull: 0.07, pullMax: 4, // left further behind than `leash` it gains `pull` m/s per metre over (up to pullMax)
  cycle: 2.4, rise: 0.95, slam: 0.22, lie: 0.55, // s: up out of the ground, the blow, lying across the road, (down again)
  reach: 4.3, // m from where it comes down: the car is under it
  side: 11, // m to the side of the road its root is
};
// the Корень: a swell on the road for `swell` s, then the arm out of it
export const ROOT = {
  swell: 1.2, up: 0.16, stand: 2.0, sink: 0.8,
  reach: 1.8, // m between it and the car's middle line: hit
  flip: 0.65, // ...this close at speed: the car goes over
  r: 0.7, // standing, it is a post you can hit (under the reach: whoever it touches was knocked clear first)
  every: [44, 66], lateral: [1.0, 1.45],
};
export const START_S = 62; // where the car is on the main road when the chapter starts (the film's end)
export const GOAL_D = 38; // m from the pine: the chapter is over (the crash itself is chapter 3)
export const NET_HZ = 15;

// ---------------------------------------------------------------- the roads, measured

function measure(R) {
  const cum = [0];
  for (let i = 1; i < R.pts.length; i++) cum.push(cum[i - 1] + Math.hypot(R.pts[i][0] - R.pts[i - 1][0], R.pts[i][1] - R.pts[i - 1][1]));
  return { id: R.id, dead: !!R.dead, w: R.w, pts: R.pts, cum, len: cum[cum.length - 1] };
}
export const ROUTES = ROADS.map(measure);
export const MAIN = ROUTES.find((r) => r.id === 'main');

// a point s metres along a route: { x, z, dx, dz } (dx, dz: the way it runs)
export function pointAt(R, s, out = {}) {
  s = clamp(s, 0, R.len);
  let i = 1;
  while (i < R.cum.length - 1 && R.cum[i] < s) i++;
  const [ax, az] = R.pts[i - 1], [bx, bz] = R.pts[i];
  const L = R.cum[i] - R.cum[i - 1] || 1, f = (s - R.cum[i - 1]) / L;
  out.x = ax + (bx - ax) * f;
  out.z = az + (bz - az) * f;
  out.dx = (bx - ax) / L;
  out.dz = (bz - az) / L;
  return out;
}

// where a point is to a route: s along it, and how far to its left (+) or right
export function project(R, x, z) {
  let best = { s: 0, d: Infinity, lat: 0 };
  for (let i = 1; i < R.pts.length; i++) {
    const [ax, az] = R.pts[i - 1], [bx, bz] = R.pts[i];
    const L = R.cum[i] - R.cum[i - 1] || 1, dx = (bx - ax) / L, dz = (bz - az) / L;
    const u = clamp((x - ax) * dx + (z - az) * dz, 0, L);
    const px = ax + dx * u, pz = az + dz * u;
    const d = Math.hypot(x - px, z - pz);
    if (d < best.d) best = { s: R.cum[i - 1] + u, d, lat: (x - px) * dz - (z - pz) * dx };
  }
  return best;
}

// a car facing along (dx, dz): its yaw (the root's rotation.y; the nose is local −x)
export const yawOf = (dx, dz) => Math.atan2(dz, -dx);

// the roots on the roads: where each one waits, from the night's seed (none near the start, none at a fork)
export function rootPlan(seed) {
  const r = new RNG(((seed >>> 0) ^ 0x52a07) >>> 0 || 1);
  const out = [];
  const p = {};
  for (const R of ROUTES) {
    let s = R.id === 'main' ? START_S + 55 : 26;
    while (s < R.len - (R.dead ? 16 : GOAL_D + 12)) {
      pointAt(R, s, p);
      const lat = r.float(ROOT.lateral[0], ROOT.lateral[1]) * (r.chance(0.5) ? 1 : -1);
      if (!FORKS.some((F) => Math.hypot(p.x - F.x, p.z - F.z) < 17)) {
        out.push({ i: out.length, route: R.id, s, lat, x: p.x + p.dz * lat, z: p.z - p.dx * lat });
      }
      s += r.float(ROOT.every[0], ROOT.every[1]);
    }
  }
  return out;
}

// ---------------------------------------------------------------- the car

export class Car {
  constructor(x, z, yaw, v = 0) {
    Object.assign(this, { x, z, yaw, v, steer: 0, stall: 0, spin: 0, y: 0, pitch: 0, roll: 0, slope: 0, lat: 0, dist: 0, onRoad: true });
  }

  fwd() {
    return [-Math.cos(this.yaw), Math.sin(this.yaw)];
  }

  // the ground under its four corners: where it stands, how it leans, what it climbs
  settle(world) {
    const h = (x, z) => world.terrain.height(x, z);
    const [fx, fz] = this.fwd(), lx = fz, lz = -fx;
    const a = DRIVE.axle, w = 0.8;
    const hF = h(this.x + fx * a, this.z + fz * a), hB = h(this.x - fx * a, this.z - fz * a);
    const hL = h(this.x + lx * w, this.z + lz * w), hR = h(this.x - lx * w, this.z - lz * w);
    this.y = (hF + hB + hL + hR) / 4;
    this.slope = (hF - hB) / (2 * a);
    this.pitch = -Math.atan(this.slope);
    this.roll = Math.atan((hR - hL) / (2 * w));
  }

  // one small step: thr −1..1 (W / S), steerIn −1..1 (+ = left)
  step(h, thr, steerIn) {
    const D = DRIVE;
    if (this.stall > 0) {
      this.stall -= h;
      thr = 0;
    }
    const lock = h * D.steerRate;
    this.steer += clamp(steerIn - this.steer, -lock, lock);
    const vmax = this.onRoad ? D.vmax : D.vmaxOff;
    let a = 0;
    // (the pedal asks for a speed: full pull up to 70% of it, fading to nothing at it; past it the engine holds it back)
    if (thr > 0) a = this.v < -0.3 ? D.brake : D.accel * clamp((thr * vmax - this.v) / (0.3 * vmax), -1.5, 1);
    else if (thr < 0) a = this.v > 0.3 ? -D.brake * -thr : -D.revAccel * -thr * clamp(1 + this.v / D.vrev, 0, 1);
    const resist = (D.roll + (this.onRoad ? 0 : D.offDrag)) * Math.sign(this.v) + D.drag * this.v * Math.abs(this.v) + 9.8 * this.slope;
    let v = this.v + (a - resist) * h;
    // resistance stops a car; it never turns it round
    if (thr === 0 && Math.sign(v) !== Math.sign(this.v) && this.v !== 0) v = 0;
    if (thr === 0 && Math.abs(v) < 0.08) v = 0;
    this.v = v;
    // the turn: the bicycle model, held to what the tyres can grip
    const dmax = lerp(D.steerMax, D.steerHigh, clamp(Math.abs(v) / 14, 0, 1));
    let w = (v / D.wheelbase) * Math.tan(this.steer * dmax);
    const wMax = (this.onRoad ? D.grip : D.gripOff) / Math.max(Math.abs(v), 2);
    w = clamp(w, -wMax, wMax);
    this.yaw += (w + this.spin) * h;
    this.spin *= Math.exp(-3 * h);
    this.lat = w * v;
    const [fx, fz] = this.fwd();
    this.x += fx * v * h;
    this.z += fz * v * h;
    this.dist += v * h;
  }

  // the trees (and anything else that stands): the car is two circles, front and back. Returns the hardest impact
  // (m/s into whatever it hit)
  collide(world, extra = null) {
    let impact = 0;
    const [fx, fz] = this.fwd();
    for (const k of [1, -1]) {
      const p = { x: this.x + fx * DRIVE.axle * k, z: this.z + fz * DRIVE.axle * k };
      const ox = p.x, oz = p.z;
      let hit = world.col.resolve(p, DRIVE.r);
      if (extra) {
        // (a Корень standing in the road: a post like any other)
        for (const c of extra) {
          const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), pen = DRIVE.r + c.r - d;
          if (pen > 0 && d > 1e-4) {
            p.x += (dx / d) * pen;
            p.z += (dz / d) * pen;
            if (!hit.hit || pen > hit.depth) hit = { hit: true, nx: dx / d, nz: dz / d, depth: pen };
          }
        }
      }
      if (!hit.hit) continue;
      this.x += p.x - ox;
      this.z += p.z - oz;
      const into = -(fx * hit.nx + fz * hit.nz) * this.v;
      if (into > 0) {
        impact = Math.max(impact, into);
        this.v -= Math.sign(this.v) * Math.min(Math.abs(this.v), into * 1.1);
      }
    }
    const wall = world.wall - 2;
    this.x = clamp(this.x, -wall, wall);
    this.z = clamp(this.z, -wall, wall);
    return impact;
  }
}

// ---------------------------------------------------------------- the chase

// where in its cycle the arm is: 'under' (moving underground), 'rise', 'slam', 'lie', 'sink'; k 0..1 of it
export function chasePhase(u) {
  const C = CHASE;
  if (u < C.rise) return { ph: 'rise', k: u / C.rise };
  if (u < C.rise + C.slam) return { ph: 'slam', k: (u - C.rise) / C.slam };
  if (u < C.rise + C.slam + C.lie) return { ph: 'lie', k: (u - C.rise - C.slam) / C.lie };
  return { ph: 'sink', k: (u - C.rise - C.slam - C.lie) / (C.cycle - C.rise - C.slam - C.lie) };
}

export class Chase {
  // the track it follows starts where the dirt road leaves the highway: the car's own track is added to it
  constructor(startS = START_S) {
    this.trail = [];
    const p = {};
    for (let s = 0; s <= startS; s += 2) {
      pointAt(MAIN, s, p);
      this.trail.push({ x: p.x, z: p.z, s });
    }
    this.cs = Math.max(0, startS - CHASE.behind); // how far along the track it has got
    this.t = 0;
    this.u = 0; // where in its cycle
    this.cycle = -1;
    this.on = false;
    this.T = { x: 0, z: 0 }; // where it comes down
    this.B = { x: 0, z: 0 }; // where it comes out of the ground
    this.side = 1;
  }

  push(x, z) {
    const L = this.trail[this.trail.length - 1];
    const d = Math.hypot(x - L.x, z - L.z);
    if (d > 1.5) this.trail.push({ x, z, s: L.s + d });
  }

  // how far along the track the car is
  carS(x, z) {
    const L = this.trail[this.trail.length - 1];
    return L.s + Math.hypot(x - L.x, z - L.z);
  }

  at(s, out = {}) {
    const T = this.trail;
    s = clamp(s, 0, T[T.length - 1].s);
    let lo = 0, hi = T.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (T[m].s < s) lo = m;
      else hi = m;
    }
    const a = T[lo], b = T[hi], f = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
    out.x = a.x + (b.x - a.x) * f;
    out.z = a.z + (b.z - a.z) * f;
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    out.dx = (b.x - a.x) / L;
    out.dz = (b.z - a.z) / L;
    return out;
  }

  // its pace: rising over the chapter, and quicker while it is far behind (it is always within earshot)
  speed(gap = 0) {
    const tc = this.t - CHASE.start;
    return lerp(CHASE.v0, CHASE.v1, smoothstep(0, CHASE.ramp, tc)) + clamp((gap - CHASE.leash) * CHASE.pull, 0, CHASE.pullMax);
  }

  // one frame. carS: where the car is on the track. Returns 'slam' on the frame it comes down
  update(dt, carS) {
    this.t += dt;
    const tc = this.t - CHASE.start;
    if (tc < 0) return null;
    this.on = true;
    this.cs = Math.min(this.cs + this.speed(carS - this.cs) * dt, carS);
    const idx = Math.floor(tc / CHASE.cycle);
    const u = tc - idx * CHASE.cycle;
    const was = this.u;
    this.u = u;
    if (idx !== this.cycle) {
      this.cycle = idx;
      this.side = idx % 2 ? 1 : -1;
    }
    // it aims while it rises; at the top it is committed
    if (u < CHASE.rise) this._aim();
    const hit = CHASE.rise + CHASE.slam;
    return was < hit && u >= hit ? 'slam' : null;
  }

  _aim() {
    const p = this.at(this.cs);
    this.T.x = p.x;
    this.T.z = p.z;
    // its root: a little behind, off to one side of the track (alternating), out in the trees
    this.B.x = p.x - p.dx * 7 + p.dz * this.side * CHASE.side;
    this.B.z = p.z - p.dz * 7 - p.dx * this.side * CHASE.side;
  }
}

// the arm's spine for one moment of its cycle: a curve from its root (under the ground, off to the side) up over the
// road and down onto T. ground(x, z): the height there
export function chasePose(T, B, u, time, ground, out = null) {
  const n = ARM.seg + 1;
  const o = out || { pos: new Float32Array(n * 3), rad: new Float32Array(n), roll: new Float32Array(n) };
  const { ph, k } = chasePhase(u);
  const gT = ground(T.x, T.z), gB = ground(B.x, B.z);
  let tipY = gT + 0.6, mid = 5, down = 0;
  if (ph === 'rise') { tipY = gT + 9.5; mid = 14; down = (1 - smoothstep(0, 1, k)) * 18; }
  else if (ph === 'slam') { tipY = lerp(gT + 9.5, gT + 0.6, k * k); mid = lerp(14, 5, k); }
  else if (ph === 'sink') { down = smoothstep(0, 1, k) * 20; }
  const P0 = [B.x, gB - 6, B.z], P1 = [B.x, gB + 13, B.z];
  const P2 = [T.x + (B.x - T.x) * 0.3, gT + mid, T.z + (B.z - T.z) * 0.3], P3 = [T.x, tipY, T.z];
  const ax = T.x - B.x, az = T.z - B.z, aL = Math.hypot(ax, az) || 1, px = -az / aL, pz = ax / aL;
  const calm = ph === 'lie' ? 0.4 : 1;
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1), q = 1 - s;
    const b0 = q * q * q, b1 = 3 * q * q * s, b2 = 3 * q * s * s, b3 = s * s * s;
    const wv = Math.sin(time * 2.3 - s * 7) * 0.9 * s * calm;
    o.pos[i * 3] = b0 * P0[0] + b1 * P1[0] + b2 * P2[0] + b3 * P3[0] + px * wv;
    o.pos[i * 3 + 1] = b0 * P0[1] + b1 * P1[1] + b2 * P2[1] + b3 * P3[1] - down;
    o.pos[i * 3 + 2] = b0 * P0[2] + b1 * P1[2] + b2 * P2[2] + b3 * P3[2] + pz * wv;
    o.rad[i] = armRadius(s) * 0.82 * (1 + 0.05 * Math.sin(time * 6 + s * 20));
    o.roll[i] = 0.3 * Math.sin(time * 0.9 + s * 3);
  }
  return o;
}

// a Корень's spine `age` seconds after the ground began to swell: straight up out of the road, writhing at the top
export function rootPose(R, age, time, ground, out = null) {
  const n = ARM.seg + 1;
  const o = out || { pos: new Float32Array(n * 3), rad: new Float32Array(n), roll: new Float32Array(n) };
  const g = ground(R.x, R.z);
  const u = age - ROOT.swell;
  const up = u < 0 ? 0 : smoothstep(0, ROOT.up, u);
  const sink = u > ROOT.up + ROOT.stand ? smoothstep(0, ROOT.sink, u - ROOT.up - ROOT.stand) : 0;
  const H = 10.5 * up;
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    const top = smoothstep(0.55, 1, s);
    const curl = top * top * 2.2 * Math.sin(time * 3.1 + R.i);
    o.pos[i * 3] = R.x + curl + Math.sin(time * 2 + s * 5 + R.i) * 0.25 * s;
    o.pos[i * 3 + 1] = g - 2.6 + s * H - sink * 11;
    o.pos[i * 3 + 2] = R.z + top * top * 1.6 * Math.cos(time * 2.4 + R.i) + Math.cos(time * 1.7 + s * 4) * 0.2 * s;
    o.rad[i] = armRadius(s) * 0.34;
    o.roll[i] = 0;
  }
  return o;
}

// is a root standing (a post in the road) at this age?
export const rootStanding = (age) => age >= ROOT.swell && age < ROOT.swell + ROOT.up + ROOT.stand;
export const rootLife = ROOT.swell + ROOT.up + ROOT.stand + ROOT.sink;

// ---------------------------------------------------------------- the map

export const MAP_VIEW = { x0: -205, x1: 205, z0: -95, z1: 352 };

// the paper map of the forest roads (the navigator's): the highway, the dirt road and its forks, the dead ends,
// the way to the village, and you on it
export function drawMap(ctx, S, car) {
  const V = MAP_VIEW;
  const sc = Math.min((S - 90) / (V.x1 - V.x0), (S - 150) / (V.z1 - V.z0));
  const mx = (V.x0 + V.x1) / 2, mz = (V.z0 + V.z1) / 2, cx = S / 2, cy = S / 2 + 28;
  const X = (x) => cx + (x - mx) * sc, Y = (z) => cy + (z - mz) * sc;
  const INK = '#2e261d', ROAD = '#7a5532', RED = '#a3170f';
  ctx.save();
  ctx.fillStyle = '#d8ccae';
  ctx.fillRect(0, 0, S, S);
  // age: stains, and the forest stippled in
  const r = new RNG(1771);
  for (let i = 0; i < 9; i++) {
    // (one centre for both circles: two would draw a cone, not a stain)
    const sx = r.float(0, S), sy = r.float(0, S);
    const g = ctx.createRadialGradient ? ctx.createRadialGradient(sx, sy, 0, sx, sy, r.float(60, 220)) : null;
    if (!g) break;
    g.addColorStop(0, 'rgba(120,90,50,0.10)');
    g.addColorStop(1, 'rgba(120,90,50,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  }
  ctx.fillStyle = 'rgba(60,80,50,0.28)';
  for (let i = 0; i < 900; i++) {
    const x = r.float(V.x0, V.x1), z = r.float(V.z0, V.z1);
    if (onRoad(x, z, 6) || Math.abs(z - 334) < 9) continue;
    ctx.fillRect(X(x), Y(z), 2, 2);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, S - 44, S - 44);
  // the highway
  ctx.lineWidth = 7;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(X(V.x0), Y(334));
  ctx.lineTo(X(V.x1), Y(334));
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#d8ccae';
  ctx.setLineDash?.([10, 10]);
  ctx.beginPath();
  ctx.moveTo(X(V.x0), Y(334));
  ctx.lineTo(X(V.x1), Y(334));
  ctx.stroke();
  ctx.setLineDash?.([]);
  // the roads
  ctx.lineCap = 'round';
  for (const R of ROUTES) {
    ctx.strokeStyle = ROAD;
    ctx.lineWidth = R.dead ? 4 : 6;
    ctx.beginPath();
    R.pts.forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Y(z)) : ctx.moveTo(X(x), Y(z))));
    ctx.stroke();
    if (R.dead) {
      // a dead end: a bar across it, and the word
      const [x, z] = R.pts[R.pts.length - 1], [px, pz] = R.pts[R.pts.length - 2];
      const L = Math.hypot(x - px, z - pz), ux = (x - px) / L, uz = (z - pz) / L;
      ctx.strokeStyle = RED;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(X(x) - uz * 14, Y(z) + ux * 14);
      ctx.lineTo(X(x) + uz * 14, Y(z) - ux * 14);
      ctx.stroke();
      ctx.fillStyle = RED;
      ctx.font = '600 21px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t('l2MapDead'), X(x) + ux * 30, Y(z) + uz * 30 + 7);
    }
  }
  // the way on: an arrow off the end of the main road, to the village
  const e = MAIN.pts[MAIN.pts.length - 1], e0 = MAIN.pts[MAIN.pts.length - 2];
  const eL = Math.hypot(e[0] - e0[0], e[1] - e0[1]), ex = (e[0] - e0[0]) / eL, ez = (e[1] - e0[1]) / eL;
  ctx.strokeStyle = ROAD;
  ctx.lineWidth = 6;
  ctx.setLineDash?.([8, 9]);
  ctx.beginPath();
  ctx.moveTo(X(e[0]), Y(e[1]));
  ctx.lineTo(X(e[0] + ex * 48), Y(e[1] + ez * 48));
  ctx.stroke();
  ctx.setLineDash?.([]);
  const hx = X(e[0] + ex * 56), hy = Y(e[1] + ez * 56);
  ctx.fillStyle = ROAD;
  ctx.beginPath();
  ctx.moveTo(hx + ex * 14, hy + ez * 14);
  ctx.lineTo(hx - ez * 11, hy + ex * 11);
  ctx.lineTo(hx + ez * 11, hy - ex * 11);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(t('l2MapVillage'), hx + 22, hy + 4); // (beside the arrowhead, clear of the dashes)
  ctx.textAlign = 'center';
  // the forks
  FORKS.forEach((F, i) => {
    ctx.fillStyle = '#d8ccae';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(X(F.x), Y(F.z), 15, 0, PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = '700 19px "JetBrains Mono", monospace';
    ctx.fillText(String(i + 1), X(F.x), Y(F.z) + 7);
  });
  ctx.fillStyle = INK;
  ctx.font = '600 19px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(t('l2MapHighway'), X(110), Y(334) - 14);
  // the title and the north
  ctx.font = '700 32px "JetBrains Mono", monospace';
  ctx.fillText(t('l2MapTitle'), 46, 70);
  ctx.textAlign = 'center';
  ctx.beginPath();
  ctx.moveTo(S - 70, 44);
  ctx.lineTo(S - 80, 74);
  ctx.lineTo(S - 60, 74);
  ctx.fill();
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.fillText('N', S - 70, 98);
  // you
  if (car) {
    const [fx, fz] = car.fwd ? car.fwd() : [-Math.cos(car.yaw), Math.sin(car.yaw)];
    const x = X(car.x), y = Y(car.z), lx = fz, lz = -fx;
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(x + fx * 20, y + fz * 20);
    ctx.lineTo(x - fx * 11 + lx * 11, y - fz * 11 + lz * 11);
    ctx.lineTo(x - fx * 11 - lx * 11, y - fz * 11 - lz * 11);
    ctx.fill();
    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.fillText(t('l2MapYou'), x, y - 22);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- the chapter

export class RoadDrive {
  constructor(game) {
    this.g = game;
    this.t = 0;
    this.seated = true;
    this.done = false;
    this.restart = false;
    this.dead = null; // { kind: 'caught' | 'flipped', t }
    this.danger = 0;
    this.look = { yaw: 0, pitch: -0.06, idle: 0 };
    this.mapK = 0;
    this.net = null;
    this.sendT = 0;
    this.seats = new Map();
    this.roots = rootPlan(game.baseSeed || 0);
    this.rootAge = new Map(); // i → seconds since the ground began to swell
    this.cues = new Set();
    this.swelled = new Set(); // the roots whose swell has been seen and heard
    this.pose = null; // what is drawn (the host: the car itself; a guest: the host's car, smoothed)
  }

  // ---------------- begin / end ----------------
  begin(tries = 0) {
    const g = this.g;
    const p = pointAt(MAIN, START_S);
    this.car = new Car(p.x, p.z, yawOf(p.dx, p.dz), tries ? 4 : 9);
    this.car.settle(g.world);
    this.chase = new Chase(START_S);
    this.chaseView = { on: false, T: { x: 0, z: 0 }, B: { x: 0, z: 0 }, u: 0 };
    this._build();
    if (typeof document !== 'undefined') document.body?.classList?.add('driving');
  }

  dispose() {
    for (const a of this.rigs || []) {
      undressPerson(a.meshes);
      a.rig.root.removeFromParent();
      a.mat.dispose();
    }
    this.rigs = [];
    if (this.car3) { disposeFilmCar(this.car3); this.car3 = null; }
    for (const h of this.halos || []) h.sp.material.dispose();
    this.halos = null;
    this.chaseArm?.dispose();
    for (const s of this.slots || []) {
      s.arm.dispose();
      s.bump.removeFromParent();
      s.bump.geometry.dispose();
    }
    this.slots = [];
    this.mat?.dispose?.();
    this.engine?.stop(0.4); this.engine = null;
    this.gravel?.stop(); this.gravel = null;
    this.rumble?.stop(); this.rumble = null;
    shared.uHead.value.w = 0;
    this._mapShow(false);
    if (typeof document !== 'undefined') document.body?.classList?.remove('driving');
  }

  _hostFit() {
    const g = this.g;
    if (!g.online || g.auth) return myFit();
    const hid = g.coop?.hostId;
    for (const r of g.remotes.values()) if (hid && r.id === hid) return r.fit;
    return myFit();
  }

  _build() {
    const g = this.g, scene = g.scene;
    this.mat = createWorldMaterial();
    this.car3 = buildFilmCar(this._hostFit());
    this.carId = this.car3.userData.id;
    this.fc = FILM_CARS[this.carId];
    scene.add(this.car3);
    const P = this.car3.userData.M.P;
    this.halos = [...P.head.map((p) => ['head', p]), ...P.tail.map((p) => ['tail', p])].map(([type, p]) => {
      const sp = new THREE.Sprite(haloMaterial(type === 'head' ? 0xfff1d6 : 0xff2a1a, beaconTexture()));
      sp.position.set(p[0] + (type === 'head' ? -0.04 : 0.04), p[1], p[2]);
      sp.scale.setScalar(type === 'head' ? 1.6 : 0.7);
      sp.material.opacity = type === 'head' ? 1.3 : 0.8;
      this.car3.userData.body.add(sp);
      return { sp, type };
    });
    // my own body in my seat (its head is my eyes: hidden)
    this.rigs = [];
    const rig = buildSurvivor(myFit());
    rig.root.rotation.order = 'YXZ';
    const mat = createPersonMaterial(rig.dyes, PLAYER_HEX[(g.player.slot | 0) % 4]);
    mat.uniforms.uShow.value = 1;
    if (mat.uniforms.uNear) mat.uniforms.uNear.value = 0.55;
    const meshes = dressPerson(rig, mat);
    rig.nodes.head.visible = false;
    scene.add(rig.root);
    this.self = { rig, mat, meshes };
    this.rigs.push(this.self);
    // the chase, and two of everything a Корень needs (they come one at a time; two can overlap)
    this.chaseArm = new RoadArm(scene, this.mat);
    this.chaseArm.mesh.visible = false;
    this.slots = [0, 1].map(() => {
      const arm = new RoadArm(scene, this.mat);
      arm.mesh.visible = false;
      const b = new MeshBuilder(512);
      b.place(0, 0, 0, 0, 0, 0, 1, 0.42, 1);
      b.rock(1.3, () => 0.5, KIND.GROUND, 0.3, 0.6);
      b.place(0, 0.18, 0, 0, 0.6, 0, 0.55, 0.3, 0.55);
      b.rock(1.0, () => 0.3, KIND.FLESH, 0.35, 0.7);
      const bump = new THREE.Mesh(b.toGeometry(), this.mat);
      bump.frustumCulled = false;
      bump.visible = false;
      scene.add(bump);
      return { arm, bump, root: null, pose: null };
    });
    this._mapEl();
  }

  // ---------------- who sits where ----------------
  // the host drives; the others fill the seats in their lobby order: the first of them is the navigator
  _seats() {
    const g = this.g;
    const n = g.online ? g.remotes.size + 1 : 1;
    if (this.seats.size === n && this.seats.has(this._me())) return;
    this.seats.clear();
    if (!g.online) { this.seats.set(this._me(), 0); return; }
    const hid = g.coop?.hostId;
    const all = [{ id: this._me(), slot: g.player.slot | 0, host: !!g.auth }];
    for (const r of g.remotes.values()) all.push({ id: r.id, slot: r.slot | 0, host: r.id === hid });
    all.sort((a, b) => (b.host - a.host) || (a.slot - b.slot));
    all.slice(0, 4).forEach((p, i) => this.seats.set(p.id, i));
  }

  _me() {
    return this.g.player.id ?? 'me';
  }

  get seat() {
    return this.seats.get(this._me()) ?? 0;
  }

  // may this seat open the map? the navigator; alone, the driver (there is nobody else)
  get canMap() {
    return this.seat === 1 || (this.seat === 0 && this.seats.size < 2);
  }

  // ---------------- the frame ----------------
  update(dt, raw) {
    const g = this.g;
    this.t += dt;
    this._seats();
    const look = g.inputMuted ? NO_LOOK : raw?.look || NO_LOOK;
    // the eyes: free about the seat; the driver's drift back to the road when the mouse lets go
    const L = this.look;
    L.yaw = clamp(L.yaw - look.dx, -2.5, 2.5);
    L.pitch = clamp(L.pitch - look.dy, -1.1, 0.9);
    L.idle = look.dx || look.dy ? 0 : L.idle + dt;
    if (this.seat === 0 && !this.hold && L.idle > 1.4 && Math.abs(this.car.v) > 3) L.yaw = damp(L.yaw, 0, 1.6, dt);
    if (this.hold) { /* (debug: __hush.game.level2.play.hold = true freezes the car, the chase and the roots) */ }
    else if (g.auth) this._simulate(dt);
    else this._follow(dt);
    this._place(dt);
    this._crew();
    this._arms();
    this._beams();
    this._map(dt);
    this._sound();
    this._hud();
    if (g.role === 'host' && g.sync) {
      this.sendT -= dt;
      if (this.sendT <= 0) {
        this.sendT = 1 / NET_HZ;
        g.sync.send('dv', this.pack());
      }
    }
    if (this.dead) {
      this.dead.t += dt;
      g.fx.fade = Math.min(g.fx.fade, 1 - smoothstep(0.15, 0.75, this.dead.t));
      if (g.auth && this.dead.t > 2.6) this.restart = true;
    }
  }

  // the host's machine: drive the car, move the chase, wake the roots
  _simulate(dt) {
    const g = this.g, c = this.car, input = g.input;
    const driving = !this.dead && !g.inputMuted && !!input;
    const thr = driving ? clamp(input.move?.y || 0, -1, 1) : 0;
    const st = driving ? clamp(-(input.move?.x || 0) - (input.turn || 0), -1, 1) : 0;
    c.onRoad = !!onRoad(c.x, c.z, 0.35);
    const n = Math.max(1, Math.ceil(dt * DRIVE.hz));
    for (let i = 0; i < n; i++) c.step(dt / n, this.dead ? (c.v > 0 ? -1 : 0) : thr, st);
    const posts = [];
    for (const R of this.roots) {
      const a = this.rootAge.get(R.i);
      if (a !== undefined && rootStanding(a)) posts.push({ x: R.x, z: R.z, r: ROOT.r });
    }
    const impact = c.collide(g.world, posts);
    c.settle(g.world);
    if (impact > 2.5) this._hit(impact);
    if (this.dead) return;
    // the chase
    this.chase.push(c.x, c.z);
    const ev = this.chase.update(dt, this.chase.carS(c.x, c.z));
    if (ev === 'slam') {
      this.cue('slam');
      if (this._near(this.chase.T, CHASE.reach)) this._die('caught');
    }
    const { ph } = chasePhase(this.chase.u);
    if (this.chase.on && ph === 'lie') {
      // lying across the road: drive into it and it has you
      const T = this.chase.T, B = this.chase.B;
      const mx = T.x + (B.x - T.x) * 0.25, mz = T.z + (B.z - T.z) * 0.25;
      if (this._near(T, 2.6) || this._near({ x: mx, z: mz }, 2.8)) this._die('caught');
    }
    this.chaseView.on = this.chase.on;
    this.chaseView.T = this.chase.T;
    this.chaseView.B = this.chase.B;
    this.chaseView.u = this.chase.u;
    // the roots: a swell ahead of the car, then the strike
    const [fx, fz] = c.fwd();
    for (const R of this.roots) {
      let a = this.rootAge.get(R.i);
      if (a === undefined) {
        const dx = R.x - c.x, dz = R.z - c.z;
        const along = dx * fx + dz * fz, side = Math.abs(dx * fz - dz * fx);
        const lead = Math.max(8, Math.abs(c.v) * ROOT.swell + 1); // (it comes up where the car will be)
        if (c.v > 1 && along > 0 && along < lead && side < 4) this.rootAge.set(R.i, 0);
        continue;
      }
      const was = a;
      a += dt;
      this.rootAge.set(R.i, a);
      if (was < ROOT.swell && a >= ROOT.swell) this._strike(R);
    }
    // the end of the road
    if (Math.hypot(c.x - CRASH.x, c.z - CRASH.z) < GOAL_D) this.done = true;
  }

  // how close the car (either end of it) comes to a point
  _near(p, r) {
    const c = this.car, [fx, fz] = c.fwd();
    for (const k of [1, 0, -1]) if (Math.hypot(c.x + fx * DRIVE.axle * k - p.x, c.z + fz * DRIVE.axle * k - p.z) < r) return true;
    return false;
  }

  _strike(R) {
    const c = this.car, [fx, fz] = c.fwd();
    // the distance from the root to the car's middle line (its length, not just its centre)
    const dx = R.x - c.x, dz = R.z - c.z;
    // (and a little ahead of the nose: the car is moving onto it)
    const along = clamp(dx * fx + dz * fz, -DRIVE.axle - 0.9, DRIVE.axle + 2.4);
    const d = Math.hypot(dx - fx * along, dz - fz * along);
    this.cue('strike' + R.i);
    if (d >= ROOT.reach) return;
    if (d < ROOT.flip && Math.abs(c.v) > 6) { this._die('flipped'); return; }
    // knocked aside: the nose thrown away from it, the car shoved clear of the post it now is, stalled
    const side = Math.sign(dx * fz - dz * fx) || 1; // + : it came up on the car's left (left = (fz, −fx))
    c.spin -= side * 1.2; // (a blow on the left turns the nose right: yaw down)
    const shove = Math.max(0.9, ROOT.r + DRIVE.r + 0.35 - d);
    c.x -= fz * side * shove;
    c.z += fx * side * shove;
    c.v *= 0.45;
    c.stall = 0.55;
    this.g.addTrauma?.(0.7);
    this.g.fx.glitch = Math.max(this.g.fx.glitch, 0.3);
    this.cue('knock');
  }

  _hit(impact) {
    const g = this.g;
    g.addTrauma?.(clamp(impact / 14, 0.15, 0.7));
    if (impact > 7) this.car.stall = Math.max(this.car.stall, 0.6);
    this.cue('bump', impact);
  }

  _die(kind) {
    if (this.dead) return;
    this.dead = { kind, t: 0 };
    const g = this.g;
    g.addTrauma?.(1);
    g.fx.white = Math.max(g.fx.white, 0.5);
    g.fx.glitch = Math.max(g.fx.glitch, 0.7);
    g.hud.setIntro(t(kind === 'flipped' ? 'l2Flipped' : 'l2Caught'), t('l2Again'));
    this.cue('die');
  }

  // a sound or a flash, once (the host's own, and on a guest from the packet)
  cue(key, k = 1) {
    this.cues.add(key);
    this._k = k;
  }

  // ---------------- the wire ----------------
  pack() {
    const c = this.car, r2 = (v) => Math.round(v * 100) / 100, r3 = (v) => Math.round(v * 1000) / 1000;
    const ch = this.chase;
    const roots = [];
    for (const [i, a] of this.rootAge) if (a < rootLife) roots.push([i, r2(a)]);
    return {
      c: [r2(c.x), r2(c.z), r2(c.y), r3(c.yaw), r3(c.pitch), r3(c.roll), r2(c.v), r2(c.steer)],
      h: [ch.on ? 1 : 0, r2(ch.T.x), r2(ch.T.z), r2(ch.B.x), r2(ch.B.z), r2(ch.u)],
      r: roots,
      d: this.dead ? (this.dead.kind === 'flipped' ? 2 : 1) : 0,
    };
  }

  // a guest: the host's car, chase and roots
  applyNet(d) {
    if (!d || !Array.isArray(d.c) || d.c.length < 8 || !d.c.every(Number.isFinite)) return;
    this.net = { d, at: this.t };
  }

  _follow(dt) {
    const N = this.net;
    if (!N) return;
    const d = N.d, age = Math.min(0.25, this.t - N.at);
    const [x, z, y, yaw, pitch, roll, v, steer] = d.c;
    const fx = -Math.cos(yaw), fz = Math.sin(yaw);
    // where the car is now (dead reckoning from the last word), and the drawn car eased onto it
    const c = this.car;
    const tx = x + fx * v * age, tz = z + fz * v * age;
    const far = Math.hypot(tx - c.x, tz - c.z) > 8;
    c.x = far ? tx : damp(c.x, tx, 10, dt);
    c.z = far ? tz : damp(c.z, tz, 10, dt);
    c.y = damp(c.y, y, 10, dt);
    c.yaw += angleDiff(c.yaw, yaw) * Math.min(1, dt * 10);
    c.pitch = pitch; c.roll = roll; c.v = v; c.steer = steer;
    c.dist += v * dt;
    if (Array.isArray(d.h) && d.h.length >= 6) {
      const [on, Tx, Tz, Bx, Bz, u] = d.h;
      const cv = this.chaseView;
      cv.on = !!on;
      cv.T = { x: Tx, z: Tz };
      cv.B = { x: Bx, z: Bz };
      if (N.uAt !== N.at) { N.uAt = N.at; cv.u = u; }
      else cv.u = Math.min(CHASE.cycle - 1e-3, cv.u + dt);
      const { ph } = chasePhase(cv.u);
      if (ph === 'slam' && !N.slam) { N.slam = true; this.cue('slam'); }
      if (ph !== 'slam') N.slam = false;
    }
    if (Array.isArray(d.r)) {
      for (const [i, a] of d.r) {
        const was = this.rootAge.get(i);
        if (was === undefined || Math.abs(was - a) > 0.3) this.rootAge.set(i, a);
        if (was !== undefined && was < ROOT.swell && a >= ROOT.swell) this.cue('strike' + i);
      }
      for (const [i, a] of this.rootAge) this.rootAge.set(i, a + dt);
    }
    if (d.d && !this.dead) this._die(d.d === 2 ? 'flipped' : 'caught');
  }

  // ---------------- drawing ----------------
  _place(dt) {
    const c = this.car, U = this.car3.userData;
    this.car3.position.set(c.x, c.y, c.z);
    _e.set(c.roll * 0.6, c.yaw, c.pitch, 'YXZ');
    this.car3.quaternion.setFromEuler(_e);
    U.wheels.forEach((w, i) => {
      w.rotation.z = c.dist / this.fc.wheelR;
      w.rotation.y = i < 2 ? c.steer * 0.42 : 0;
    });
    if (U.steer) U.steer.rotation.x = -c.steer * 1.8;
    for (const p of U.pods || []) p.rotation.z = -U.M.P.pod.open;
    // the body on its springs: leaning out of a turn, nodding at a stop, shaken by the ruts off the road
    const rough = c.onRoad ? 0.004 : 0.016;
    this._roll = damp(this._roll || 0, clamp(-c.lat * 0.012, -0.08, 0.08) + rough * Math.sin(this.t * 17) * clamp(Math.abs(c.v) / 6, 0, 1), 8, dt);
    U.pivot.rotation.set(this._roll, 0, rough * 0.7 * Math.sin(this.t * 13.3) * clamp(Math.abs(c.v) / 6, 0, 1));
    this.car3.updateMatrixWorld(true);
    const braking = this.g.input?.move?.y < 0 && c.v > 0.5;
    for (const h of this.halos) if (h.type === 'tail') h.sp.material.opacity = braking ? 1.6 : 0.8;
  }

  // a seat's point in the world (car-local, on the springs)
  _local(lx, ly, lz, out = _v) {
    const b = this.car3.userData.body;
    b.updateMatrixWorld(true);
    return out.set(lx, ly, lz).applyMatrix4(b.matrixWorld);
  }

  _crew() {
    const g = this.g, c = this.car;
    const P = this.fc.pose;
    const sit = (rig, seat, look = 0, pitch = 0) => {
      poseSeated(rig, seat === 0, this.t + seat * 1.7, c.steer, P ? (seat < 2 ? P.front : P.rear) : null);
      const hip = this.fc.seats[seat].hip;
      this._local(hip[0], hip[1], hip[2], _w);
      rig.root.position.copy(_w);
      this.car3.userData.body.getWorldQuaternion(_q);
      rig.root.quaternion.copy(_q).multiply(_ry);
      rig.nodes.head.rotation.y = clamp(look, -1.3, 1.3);
      rig.nodes.chest.rotation.y = clamp(look * 0.35, -0.5, 0.5);
      rig.nodes.head.rotation.x = clamp(-pitch * 0.8, -0.6, 0.6);
      rig.root.visible = true;
    };
    const mine = this.seat;
    sit(this.self.rig, mine, this.look.yaw, this.look.pitch);
    // my own eyes are in my seat: the game's player is put there, looking where I look
    const p = g.player;
    const eye = this._eye(mine, _w);
    p.x = eye.x;
    p.z = eye.z;
    p.y = eye.y - (p.eyeCur || 1.6);
    p.yaw = c.yaw + PI / 2 + this.look.yaw;
    p.pitch = this.look.pitch;
    p.vx = p.vz = 0;
    p.speed = 0;
    // a friend's reports put them anywhere: in the car they are where their seat is
    for (const r of g.remotes?.values?.() || []) {
      const s = this.seats.get(r.id);
      if (s === undefined) { r.rig.root.visible = false; continue; }
      sit(r.rig, s, angleDiff(c.yaw + PI / 2, r.yaw || 0), r.pitch || 0);
    }
  }

  _eye(seat, out) {
    const hip = this.fc.seats[seat].hip;
    return this._local(hip[0] - 0.05, hip[1] + (this.carId === 'trueno' ? 0.62 : 0.72), hip[2], out);
  }

  _arms() {
    const g = this.g, ground = (x, z) => g.world.terrain.height(x, z);
    const cv = this.chaseView;
    const ph = chasePhase(cv.u).ph;
    this.chaseArm.mesh.visible = cv.on && !(ph === 'sink' && chasePhase(cv.u).k > 0.95);
    if (this.chaseArm.mesh.visible) this.chaseArm.bend((this._cp = chasePose(cv.T, cv.B, cv.u, this.t, ground, this._cp)));
    // the roots: each live one takes a slot (a swell, then its arm)
    for (const s of this.slots) s.root = null;
    for (const R of this.roots) {
      const a = this.rootAge.get(R.i);
      if (a === undefined || a >= rootLife) continue;
      const s = this.slots.find((q) => !q.root);
      if (!s) break;
      s.root = R;
      const gy = ground(R.x, R.z);
      const sw = a < ROOT.swell ? smoothstep(0, ROOT.swell, a) : 1 - smoothstep(ROOT.swell + ROOT.up + ROOT.stand, rootLife, a);
      s.bump.visible = true;
      s.bump.position.set(R.x, gy - 0.25 + 0.3 * sw, R.z);
      s.bump.scale.set(0.4 + 0.6 * sw, 0.2 + 1.1 * sw * (1 + 0.15 * Math.sin(this.t * 13)), 0.4 + 0.6 * sw);
      s.arm.mesh.visible = a >= ROOT.swell;
      if (s.arm.mesh.visible) s.arm.bend((s.pose = rootPose(R, a, this.t, ground, s.pose)));
      // (once, when it first shows: on the host and on every guest alike)
      if (!this.swelled.has(R.i)) {
        this.swelled.add(R.i);
        this.cue('swell' + R.i);
      }
    }
    for (const s of this.slots) if (!s.root) { s.bump.visible = false; s.arm.mesh.visible = false; }
    // the danger the picture feels: how close it is
    const c = this.car;
    const dT = cv.on ? Math.hypot(cv.T.x - c.x, cv.T.z - c.z) : 99;
    this.danger = cv.on ? clamp(1 - (dT - 6) / 30, 0, 1) : 0;
  }

  _beams() {
    const c = this.car;
    const [fx, fz] = c.fwd();
    shared.uHead.value.set(c.x + fx * 2.1, c.y + 0.85, c.z + fz * 2.1, this.dead ? 0 : 1.7);
    shared.uHeadD.value.set(fx, -0.08, fz).normalize();
  }

  // the small lights: the moon, the dash, the tail lamps (on whatever is behind), the arm's own glow, a swell's
  lightSources(out) {
    if (!this.car3) return;
    const c = this.car, [fx, fz] = c.fwd();
    out.push({ x: MOON.x, y: MOON.y, z: MOON.z, I: MOON.I, c: MOON.c, R: MOON.R, prio: 9, near: 2, id: 'moon' });
    const D = this.car3.userData.M.P.dash;
    this._local(D[0], D[1] + 0.05, 0, _w);
    out.push({ x: _w.x, y: _w.y, z: _w.z, I: 0.4, c: [0.55, 0.95, 0.85], R: 1.9, prio: 3, near: 0.05, id: 'dash' });
    out.push({ x: c.x - fx * 2.4, y: c.y + 0.9, z: c.z - fz * 2.4, I: this.dead ? 0.1 : 0.95, c: [1, 0.14, 0.08], R: 11, prio: 2, near: 0.2, id: 'tail', dir: [-fx, -0.12, -fz], cone: 0.35 });
    const cv = this.chaseView;
    if (cv.on && this.chaseArm.mesh.visible) {
      const mx = (cv.T.x + cv.B.x) / 2, mz = (cv.T.z + cv.B.z) / 2;
      out.push({ x: mx, y: this.g.world.terrain.height(mx, mz) + 9, z: mz, I: 1.3, c: [0.9, 0.16, 0.1], R: 26, prio: 1, near: 3, id: 'chase' });
    }
    for (const s of this.slots) {
      if (!s.root) continue;
      const a = this.rootAge.get(s.root.i) || 0;
      const k = a < ROOT.swell ? smoothstep(0, ROOT.swell, a) : 1 - smoothstep(ROOT.swell, ROOT.swell + 1.2, a);
      if (k > 0.02) out.push({ x: s.root.x, y: this.g.world.terrain.height(s.root.x, s.root.z) + 0.5, z: s.root.z, I: 1.1 * k, c: [1, 0.22, 0.12], R: 7, prio: 1, near: 0.4, id: s });
    }
  }

  // ---------------- the camera ----------------
  applyCamera(camera) {
    if (!this.car3) return false;
    this._eye(this.seat, _v);
    camera.position.copy(_v);
    this.car3.userData.body.getWorldQuaternion(_q);
    _e.set(this.look.pitch, PI / 2 + this.look.yaw, 0, 'YXZ');
    _q2.setFromEuler(_e);
    camera.quaternion.copy(_q).multiply(_q2);
    // the ruts, through the seat
    const c = this.car, k = clamp(Math.abs(c.v) / 10, 0, 1) * (c.onRoad ? 0.004 : 0.012);
    camera.rotateZ(Math.sin(this.t * 19) * k);
    camera.rotateX(Math.sin(this.t * 23 + 1) * k);
    const fov = fovFor(camera.aspect) + clamp(Math.abs(c.v) * 0.3, 0, 5);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    return true;
  }

  // ---------------- the map ----------------
  _mapEl() {
    if (typeof document === 'undefined') return;
    let el = document.getElementById?.('l2map');
    if (!el) {
      el = document.createElement('div');
      el.id = 'l2map';
      const cv = document.createElement('canvas');
      el.appendChild(cv);
      document.body.appendChild(el);
    }
    this.mapWrap = el;
    this.mapCanvas = el.querySelector?.('canvas') || null;
    if (this.mapCanvas) { this.mapCanvas.width = 900; this.mapCanvas.height = 900; }
  }

  _mapShow(on) {
    this.mapWrap?.classList?.toggle('open', !!on);
  }

  _map(dt) {
    const g = this.g;
    const want = this.canMap && !this.dead && !g.inputMuted && !!g.input?.peekHeld;
    this.mapK = damp(this.mapK, want ? 1 : 0, 14, dt);
    this.mapOpen = want;
    this._mapShow(want);
    if (want && this.mapCanvas) {
      const ctx = this.mapCanvas.getContext('2d');
      if (ctx) drawMap(ctx, 900, this.car);
    }
  }

  // ---------------- sound ----------------
  _sound() {
    const au = this.g.audio, c = this.car;
    if (!au?.ready) { this.cues.clear(); return; }
    if (!this.engine) this.engine = au.uazStart?.(c.x, c.y + 0.7, c.z, this.carId) || null;
    if (this.engine) this.engine.rev(this.dead ? 0.1 : clamp(0.22 + Math.abs(c.v) / 17 + (this.g.input?.move?.y > 0 && this.seat === 0 ? 0.12 : 0), 0.12, 1), { x: c.x, y: c.y, z: c.z });
    if (!this.gravel) this.gravel = au.gravelRoll?.() || null;
    this.gravel?.set(Math.abs(c.v), !c.onRoad);
    const cv = this.chaseView;
    if (!this.rumble && cv.on) this.rumble = au.chaseRumble?.() || null;
    if (this.rumble) {
      const g = this.g.world.terrain.height(cv.T.x, cv.T.z);
      this.rumble.move(cv.T.x, g + 2, cv.T.z);
      const ph = chasePhase(cv.u).ph;
      this.rumble.set(cv.on ? (ph === 'rise' || ph === 'slam' ? 1 : 0.6) : 0);
    }
    for (const key of this.cues) {
      if (key === 'slam') au.armSlam?.(cv.T.x, this.g.world.terrain.height(cv.T.x, cv.T.z) + 1, cv.T.z, 0.75);
      else if (key === 'knock') au.armSlam?.(c.x, c.y + 1, c.z, 0.45);
      else if (key === 'bump') au.carHit?.(c.x, c.y + 0.8, c.z, clamp((this._k || 5) / 12, 0.2, 1));
      else if (key === 'die') { au.armSlam?.(c.x, c.y + 1, c.z, 1); au.carHit?.(c.x, c.y + 0.8, c.z, 1); }
      else if (key.startsWith('swell')) {
        const R = this.roots[+key.slice(5)];
        if (R) {
          const y = this.g.world.terrain.height(R.x, R.z);
          au.rootSwell?.(R.x, y, R.z);
          // the echo finds it: a ring out of the road where it is coming
          this.g.pulses?.emit(R.x, y + 0.3, R.z, this.g.time, { radius: 16, strength: 1.1, speed: 20, decay: 0.9, color: [1, 0.4, 0.3], kind: 'shard' });
          if (!this.rootSeen) { this.rootSeen = true; this.g.hud.flashAlert?.(t('l2RootAlert'), 'warn', 1.8); }
        }
      } else if (key.startsWith('strike')) {
        const R = this.roots[+key.slice(6)];
        if (R) au.rootStrike?.(R.x, this.g.world.terrain.height(R.x, R.z), R.z);
      }
    }
    this.cues.clear();
  }

  _hud() {
    const g = this.g;
    if (this.dead || this.t < 5.2) return;
    if (this.t - (this._hintT ?? -9) < 1) return;
    this._hintT = this.t;
    const s = this.seat, coop = this.seats.size > 1;
    const key = s === 0 ? (coop ? 'l2DriveHintCoop' : 'l2DriveHint') : s === 1 ? 'l2NavHint' : 'l2RideHint';
    g.hud.setHint(this.mapOpen ? null : t(key));
  }
}
