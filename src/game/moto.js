// Enduro bikes for the training ground: one per player, standing by the camp rack. The controls are
// the walker's — W/S is throttle and brake, A/D leans it over — but the physics is a dirt bike's:
// sprung wheels that leave the ground over crests, grip that lets the back step out, and stops dead
// against trees hard enough to throw you off. Each rider simulates their own bike; the wire carries
// nothing new — a rider's machine sends the usual position, and a mount/dismount event ('mb') tells
// the others which bike to draw under whom.
import * as THREE from 'three';
import { clamp, damp, lerp } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { GK } from '../ui/garageSet.js';
import { geometryOf } from './uaz.js';
import { GroundShade } from './groundShade.js';

const PI = Math.PI;
export const MOTO = {
  max: 17, // m/s flat out (~60 km/h through the trees)
  accel: 7.5,
  brake: 13,
  engineBrake: 2.2,
  drag: 0.028, // v²
  steer: 2.4, // rad/s of bar at a crawl
  steerFade: 0.55, // ...and this much left at top speed
  grip: 7.5, // how hard the tyre fights sliding sideways
  lean: 0.52, // rad of lean for a full-bar turn at speed
  hop: 5.2, // m/s of lift a crest gives the front wheel
  gravity: 17,
  seat: 1.24, // the rider's eye line on the seat
  throwAt: 5.5, // a head-on hit faster than this dumps the rider
  radius: 0.55,
};

// the bike itself: a plain state object the park moves around (pure math, tested without a scene)
export function newBike(i, x, z, yaw) {
  return { i, x, z, y: 0, yaw, vx: 0, vz: 0, vy: 0, roll: 0, pitch: 0, steer: 0, air: 0, spin: 0, speed: 0, hit: 0 };
}

// one step of a rider's bike. input: { move: {x,y}, brake } with y>0 throttle, x steering; world:
// { terrain: { height }, col: { resolve } }. Returns what happened this step (for sounds and throws)
export function stepBike(b, input, world, dt) {
  const ev = { throttle: 0, brake: 0, landed: 0, threw: false, bump: 0 };
  const ground = world.terrain.height(b.x, b.z);
  const onGround = b.y <= ground + 0.02 && b.vy <= 0.01;
  b.air = onGround ? Math.max(0, b.air - dt * 4) : Math.min(1, b.air + dt * 4);

  // the bar: quick at a crawl, heavy at speed
  const steerRate = MOTO.steer * lerp(1, MOTO.steerFade, clamp(Math.abs(b.speed) / MOTO.max, 0, 1));
  b.steer = damp(b.steer, clamp(input.move.x, -1, 1), 8, dt);
  const moving = clamp(Math.abs(b.speed) / 2, 0, 1); // the bar turns, the heading follows the wheels
  const yawRate = b.steer * steerRate * clamp(1 - 0.25 * Math.abs(b.speed) / MOTO.max, 0.6, 1) * moving;
  b.yaw -= yawRate * dt * (b.speed >= 0 ? 1 : -1);

  // thrust along the heading
  const fx = -Math.sin(b.yaw), fz = -Math.cos(b.yaw);
  const v = b.vx * fx + b.vz * fz; // signed forward speed
  b.speed = v;
  const throttle = clamp(input.move.y, 0, 1) * (onGround ? 1 : 0.15); // wheelspin in the air
  const braking = clamp(-input.move.y, 0, 1) * 0.7; // S drags the back wheel; hard, but not a stoppie
  let a = throttle * MOTO.accel - braking * (v > 0.5 ? MOTO.brake : MOTO.accel * 0.5);
  if (!throttle && !braking) a = -Math.sign(v) * MOTO.engineBrake;
  a -= MOTO.drag * v * Math.abs(v);
  const nv = clamp(v + a * dt, -3.5, MOTO.max);
  ev.throttle = throttle; ev.brake = braking;
  b.vx += fx * (nv - v);
  b.vz += fz * (nv - v);

  // grip: sideways velocity bleeds off — but never quite all of it (the back steps out a little)
  const rx = -fz, rz = fx;
  const side = b.vx * rx + b.vz * rz;
  const keep = Math.exp(-MOTO.grip * (onGround ? 1 : 0.12) * dt);
  const cut = side * (1 - keep);
  b.vx -= rx * cut;
  b.vz -= rz * cut;

  // where it goes
  const pos = { x: b.x + b.vx * dt, z: b.z + b.vz * dt };
  const hit = world.col.resolve(pos, MOTO.radius);
  if (hit.hit) {
    const into = -(b.vx * hit.nx + b.vz * hit.nz);
    if (into > 0) {
      // restitution below 1: the bark takes its share, a slide never builds up into a throw
      b.vx -= into * hit.nx * 0.35;
      b.vz -= into * hit.nz * 0.35;
      ev.bump = Math.min(1, into / 7);
      if (into > MOTO.throwAt && onGround) { ev.threw = true; b.hit = 1; }
    }
  }
  b.x = clamp(pos.x, -286, 286);
  b.z = clamp(pos.z, -286, 286);

  // the ground: follow it, or leave it over a crest
  const g2 = world.terrain.height(b.x, b.z);
  if (onGround) {
    const drop = g2 - ground;
    if (drop < -0.16 && Math.abs(v) > 4) { // the ground fell away: airborne
      b.vy = Math.max(0.4 * v * -drop, MOTO.hop * -drop * 0.5);
      b.y = ground;
    } else {
      b.y = g2;
      b.vy = 0;
      b.pitch = damp(b.pitch, clamp(Math.atan2(world.terrain.height(b.x + fx, b.z + fz) - g2, 1) * (v >= 0 ? 1 : -1), -0.6, 0.6), 6, dt);
    }
  } else {
    b.vy -= MOTO.gravity * dt;
    b.pitch = damp(b.pitch, b.vy > 0 ? 0.18 : -0.25, 1.5, dt); // nose up on the jump, down on the fall
  }
  b.y += b.vy * dt;
  const g3 = world.terrain.height(b.x, b.z);
  if (b.y < g3) {
    if (b.vy < -4) ev.landed = Math.min(1, -b.vy / 9);
    b.y = g3;
    b.vy = 0;
  }

  // the lean: into the turn at speed, upright in the air
  const leanT = onGround ? -b.steer * MOTO.lean * clamp(Math.abs(v) / 6, 0, 1) : b.roll * 0.4;
  b.roll = damp(b.roll, leanT, 6, dt);
  b.spin = (b.spin + v * dt * 2.2) % (2 * PI);
  b.hit = Math.max(0, b.hit - dt);
  return ev;
}

// ---------------- the mesh ----------------
// A lean enduro: two spoked wheels on long travel, a slim steel frame, a flat seat, high bars, a
// headlight and a mudguard number plate. Everything is built in the bike's own frame — forward is -Z,
// the ground is y = 0 — and `limb()` composes on top of the current matrix, so each tube is drawn from
// an identity (a missing `identity()` is what turned these bikes into a pile of loose sticks).
export function buildMoto(paint = GK.CARPAINT) {
  const b = new MeshBuilder(512);
  const RUBBER = GK.RUBBER, STEEL = GK.CHROME, DARK = GK.DARK, TIN = GK.TIN, SEAT = GK.SEAT;
  const tube = (a, c, r0, r1, kind, segs) => b.identity().limb(a, c, r0, r1, kind, segs);
  // a block at a point, optionally tipped nose-up (about X) or rolled (about Z)
  const box = (x, y, z, w, h, d, k, rx = 0, rz = 0) => { b.identity().place(x, y, z, rx, 0, rz); b.box(w, h, d, k); };
  // a tapered block standing on (x, y, z): its top face can slide back along +z
  const wedge = (x, y, z, w0, d0, w1, d1, h, k, topZ = 0) => {
    b.identity().place(x, y, z, 0, 0, 0);
    b.taper(w0, d0, w1, d1, h, k, topZ);
  };
  const WZ = 0.68; // half the wheelbase
  const R = 0.32; // wheel radius

  // two wheels, axles along X (a disc built along Y, turned a quarter about Z)
  for (const z of [-WZ, WZ]) {
    b.place(0, R, z, 0, 0, PI / 2);
    b.cylinder(16, R, R, 0.11, RUBBER, { y0: -0.055, capBottom: true });
    b.place(0, R, z, 0, 0, PI / 2);
    b.cylinder(10, 0.075, 0.075, 0.13, STEEL, { y0: -0.065 });
  }

  // the frame: a headstock, one thick spine back to the seat rails, a down tube, the swingarm
  box(0, 0.94, -0.46, 0.1, 0.18, 0.12, DARK); // headstock
  tube([0, 0.88, -0.44], [0, 0.8, 0.06], 0.045, 0.05, DARK, 4); // spine
  tube([0, 0.84, -0.4], [0, 0.48, 0.04], 0.03, 0.04, DARK, 4); // down tube
  for (const x of [-0.08, 0.08]) tube([x, 0.54, 0.04], [x, R, WZ], 0.028, 0.022, DARK, 4); // swingarm
  for (const x of [-0.08, 0.08]) tube([x, 0.52, 0.0], [x, 0.34, 0.3], 0.02, 0.016, DARK, 4); // the cradle under the engine
  for (const x of [-0.08, 0.08]) tube([x, 0.78, 0.02], [x, 0.8, 0.66], 0.022, 0.018, DARK, 4); // seat rails
  tube([0, 0.72, 0.08], [0, 0.44, 0.32], 0.032, 0.024, TIN, 5); // shock
  // forks: two raked legs and the triple clamp
  for (const x of [-0.09, 0.09]) tube([x, 0.98, -0.46], [x, R, -WZ], 0.03, 0.024, STEEL, 5);
  box(0, 1.02, -0.46, 0.24, 0.05, 0.13, DARK);

  // engine: a block with its cylinder and clutch cover; the exhaust runs down the right
  box(0, 0.48, 0.0, 0.25, 0.3, 0.32, DARK);
  box(0, 0.66, -0.14, 0.19, 0.14, 0.16, TIN);
  box(0.14, 0.4, 0.06, 0.04, 0.2, 0.2, TIN);
  tube([0.1, 0.54, 0.06], [0.16, 0.7, 0.46], 0.022, 0.03, STEEL, 4);
  box(0.17, 0.72, 0.6, 0.09, 0.1, 0.3, STEEL, -0.08); // muffler
  for (const x of [-0.2, 0.2]) box(x, 0.4, 0.0, 0.12, 0.025, 0.05, DARK); // pegs

  // tank on the spine: wide at the knees, narrowing to the seat; the seat runs flat behind it
  wedge(0, 0.84, -0.44, 0.32, 0.34, 0.2, 0.24, 0.14, paint, 0.06);
  box(0, 0.84, 0.26, 0.21, 0.09, 0.52, SEAT); // the seat sits right on the rails
  box(0, 0.82, 0.55, 0.2, 0.06, 0.1, paint); // the tail
  // side panels under the seat and the airbox, and the tank's shrouds: the mass a frame alone lacks
  for (const x of [-0.115, 0.115]) box(x, 0.7, 0.24, 0.02, 0.2, 0.34, paint);
  for (const x of [-0.2, 0.2]) box(x, 0.92, -0.34, 0.03, 0.2, 0.3, paint, -0.12);
  // the chain and the rear sprocket, on the left
  b.identity().place(-0.115, 0.32, 0.66, 0, 0, PI / 2);
  b.cylinder(12, 0.13, 0.13, 0.02, STEEL, { y0: -0.01 });
  tube([-0.115, 0.44, 0.06], [-0.115, 0.44, 0.66], 0.012, 0.012, DARK, 4);
  // fenders: close over the tyres
  box(0, 0.66, -0.62, 0.16, 0.026, 0.34, paint, -0.36);
  box(0, 0.66, 0.64, 0.17, 0.026, 0.3, paint, 0.3);
  box(0, 0.68, 0.84, 0.12, 0.05, 0.02, GK.TAILLAMP); // the tail light on the fender's tip

  // bars, grips, levers and guards
  tube([0, 1.02, -0.46], [0, 1.12, -0.49], 0.024, 0.022, DARK, 4);
  box(0, 1.12, -0.49, 0.62, 0.03, 0.03, STEEL);
  for (const x of [-0.29, 0.29]) {
    b.identity().place(x, 1.12, -0.49, 0, 0, PI / 2);
    b.cylinder(6, 0.028, 0.028, 0.12, RUBBER, { y0: -0.06 });
    tube([x * 0.72, 1.13, -0.48], [x * 0.9, 1.17, -0.6], 0.014, 0.01, STEEL, 3); // a guard over the lever
  }
  // headlight in its can, and the number plate above it
  box(0, 1.0, -0.62, 0.17, 0.15, 0.09, DARK);
  box(0, 1.0, -0.667, 0.13, 0.11, 0.02, GK.HEADLAMP);
  box(0, 1.14, -0.56, 0.2, 0.15, 0.02, paint, 0.24);
  return geometryOf(b.toArrays());
}

// ---------------- the rider's own cockpit ----------------
// The bike under you is a real object in the world, but at 1.24 m on the seat its bars fall below the
// bottom of the screen and the machine reads as a floating camera. This is a small, local copy of the
// cockpit — the bar, the grips, the tank's shoulders and a mudguard — drawn against the camera in the
// same material as the forest, so you can see the bars turn and the machine lean. It is not part of the
// world and never collides with anything.
function buildCockpit(paint) {
  // Coordinates are the camera's own: -z is forward, -y is down from your eye. The bar sits half a
  // metre out and a hand's width below the eye line — where an enduro's bars actually are.
  const b = new MeshBuilder(160);
  const BAR_Y = -0.3, BAR_Z = -0.56;
  b.identity().place(0, BAR_Y, BAR_Z);
  b.box(0.62, 0.028, 0.034, GK.CHROME); // the bar
  for (const x of [-0.3, 0.3]) {
    b.identity().place(x, BAR_Y, BAR_Z, 0, 0, Math.PI / 2);
    b.cylinder(6, 0.026, 0.026, 0.11, GK.RUBBER, { y0: -0.055 }); // the grips
    b.identity().place(x * 0.92, BAR_Y - 0.02, BAR_Z - 0.01, 0, 0, 0.5);
    b.box(0.16, 0.015, 0.02, GK.DARK); // the levers, angled in
  }
  b.identity().place(0, BAR_Y - 0.02, BAR_Z + 0.06);
  b.box(0.16, 0.05, 0.1, GK.DARK); // the clamp, between the bar and the tank
  b.identity().place(0, BAR_Y - 0.16, BAR_Z + 0.16, 0.2);
  b.box(0.34, 0.05, 0.3, paint); // the tank's shoulders under the bars
  b.identity().place(0, BAR_Y - 0.3, BAR_Z - 0.12, 0.5);
  b.box(0.26, 0.02, 0.3, paint); // the front mudguard's tip, out past the bars
  return geometryOf(b.toArrays());
}

// ---------------- the park: four bikes by the camp ----------------
export class MotoPark {
  constructor(game) {
    this.g = game;
    this.paints = [GK.CARPAINT, GK.REDPAINT, GK.YELLOW, GK.GATE];
    this.geos = this.paints.map((k) => buildMoto(k));
    this.cockpits = this.paints.map((k) => buildCockpit(k));
    this.wheelGeo = (() => {
      const b = new MeshBuilder(128);
      for (let i = 0; i < 4; i++) { // four bars across the hub = eight spokes, in the wheel's plane
        b.place(0, 0, 0, (i / 4) * PI, 0, 0);
        b.box(0.022, 0.56, 0.022, GK.CHROME);
      }
      b.place(0, 0, 0, 0, 0, PI / 2);
      b.cylinder(8, 0.06, 0.06, 0.03, GK.CHROME, { y0: -0.015 });
      return geometryOf(b.toArrays());
    })();
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
    const yaw = g.trainingYaw || 0.6;
    for (let i = 0; i < 4; i++) {
      const off = (i - 1.5) * 1.5;
      const x = (g.rackX ?? 6) + Math.cos(yaw) * off, z = (g.rackZ ?? 14) - Math.sin(yaw) * off;
      const b = newBike(i, x, z, yaw);
      b.y = g.world.terrain.height(x, z);
      b.mesh = new THREE.Mesh(this.geos[i % this.geos.length], g.world.material);
      b.mesh.frustumCulled = false;
      b.wheels = [new THREE.Mesh(this.wheelGeo, g.world.material), new THREE.Mesh(this.wheelGeo, g.world.material)];
      b.wheels[0].position.set(0, 0.3, -0.62);
      b.wheels[1].position.set(0, 0.3, 0.62);
      b.mesh.add(...b.wheels);
      b.mesh.rotation.order = 'YXZ'; // heading first: the lean and the slope belong to the machine
      b.shade = new GroundShade({ rx: 0.44, rz: 1.08, strength: 0.52 }); // where it meets the grass
      b.shade.place(x, z, yaw, true);
      // both wheels on the ground: sample the hill under the axles, not under the middle
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      const hf = g.world.terrain.height(x + fx * 0.62, z + fz * 0.62);
      const hb = g.world.terrain.height(x - fx * 0.62, z - fz * 0.62);
      b.y = (hf + hb) / 2 + 0.01;
      b.pitch = Math.atan2(hf - hb, 1.24);
      g.scene.add(b.mesh);
      this.bikes.push(b);
    }
    this.place();
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
    this.g.hud.setUse(T(this.rider >= 0 ? 'motoDismount' : 'motoMount'), 0, true);
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
    g.player.x = b.x; g.player.z = b.z; g.player.vx = g.player.vz = 0; // onto the seat
    if (!silent) {
      g.hud.popup(t('motoOn'), 'dim');
      g.audio?.motoOn?.();
    }
    if (g.sync) g.sync.ev('mb', i, 1);
  }

  dismount(silent = false) {
    const g = this.g;
    if (this.rider < 0) return;
    const b = this.bikes[this.rider];
    const i = this.rider;
    this.rider = -1;
    this.mountT = 0.45;
    if (b) { // step off beside it; the bike stands where you left it, at rest
      g.player.x = b.x + Math.cos(b.yaw) * 0.9;
      g.player.z = b.z - Math.sin(b.yaw) * 0.9;
      g.player.vx = g.player.vz = 0;
      b.vx = b.vz = 0;
      b.speed = 0;
      b.y = g.world.terrain.height(b.x, b.z);
    }
    if (!silent) g.hud.popup(t('motoOff'), 'dim');
    g.audio?.motoOff?.();
    if (g.sync) g.sync.ev('mb', i, 0);
    this.place(); // it was hidden while under you (the cockpit stood in for it)
  }

  // a friend got on/off their bike ('mb': every machine marks it, and draws it under them)
  netMount(pid, i, on) {
    if (on) this.riders.set(i, pid);
    else this.riders.delete(i);
  }

  // your own ride: the input drives the bike, the player rides it (remote sync carries the position)
  update(dt, input) {
    const g = this.g;
    this.mountT = Math.max(0, this.mountT - dt);
    if (this.rider < 0) {
      // on foot: a parked machine is a solid thing, not a picture — and your own must be back in
      // sight the moment you step off (place() is what makes it visible again)
      this.separate();
      this.place();
      return;
    }
    const b = this.bikes[this.rider];
    const muted = g.inputMuted || g.inventory?.active || g.state !== 'training';
    const ev = stepBike(b, muted ? { move: { x: 0, y: 0 } } : { move: input.move }, g.world, dt);
    g.player.x = b.x;
    g.player.z = b.z;
    g.player.y = b.y;
    g.player.yaw = b.yaw;
    g.player.vx = b.vx;
    g.player.vz = b.vz;
    g.player.speed = Math.hypot(b.vx, b.vz);
    if (ev.landed > 0.35) g.audio?.bump?.();
    if (ev.bump > 0.2) g.audio?.bump?.();
    if (ev.threw) { // head-on: off you go
      this.dismount(true);
      g.player.x = b.x - Math.sin(b.yaw) * 1.4;
      g.player.z = b.z - Math.cos(b.yaw) * 1.4;
      g.addTrauma?.(0.5);
      g.hud.popup(t('motoThrown'), 'warn');
      g.audio?.bump?.();
    }
    this._apart(b);
    g.audio?.motoLoop?.(Math.abs(b.speed) / MOTO.max, this.rider >= 0);
    this.place();
  }

  // the closest point on a bike's spine (a capsule along its heading), and how far you are from it
  _near(b, x, z, res) {
    const fx = -Math.sin(b.yaw), fz = -Math.cos(b.yaw);
    const t = clamp((x - b.x) * fx + (z - b.z) * fz, -0.74, 0.74);
    const cx = b.x + fx * t, cz = b.z + fz * t;
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
      const rr = 0.72;
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
      let x = b.x, z = b.z, yaw = b.yaw, y = b.y, roll = b.roll, pitch = b.pitch, spin = b.spin;
      if (b.i !== this.rider && riderId) {
        const r = g.remotes.get(riderId);
        if (r) { x = r.x; z = r.z; yaw = r.yaw; y = r.y; spin = (r.moved || 0) * 2.2; }
      }
      b.mesh.position.set(x, y, z);
      b.mesh.rotation.set(pitch, yaw, roll, 'YXZ');
      b.mesh.visible = b.i !== this.rider; // yours is replaced by the cockpit (see placeCockpit)
      for (const w of b.wheels) w.rotation.x = spin;
      b.shade?.place(x, z, yaw);
    }
  }

  dispose() {
    for (const b of this.bikes) {
      if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
      b.shade?.dispose();
    }
    this.bikes = [];
    if (this.cockpit?.mesh.parent) this.cockpit.mesh.parent.remove(this.cockpit.mesh);
    this.cockpit = null;
  }

  // the cockpit under the camera: built once, hidden while walking, leaning with the bike
  placeCockpit(camera, visible) {
    const g = this.g, i = this.rider;
    if (!visible || i < 0) {
      if (this.cockpitMesh) this.cockpitMesh.visible = false;
      return;
    }
    if (!this.cockpitMesh) {
      this.cockpitMesh = new THREE.Mesh(this.cockpits[i % this.cockpits.length], g.world.material);
      this.cockpitMesh.frustumCulled = false;
      this.cockpitMesh.renderOrder = 3;
      g.scene.add(this.cockpitMesh);
    }
    const b = this.bikes[i];
    const m = this.cockpitMesh;
    m.visible = true;
    const roll = b?.roll || 0, pitch = b?.pitch || 0;
    // the cockpit is laid out facing -Z like a bike; hang it off the camera, then lean it with the
    // machine (its own pitch, plus a little of the rider's look-down so the bars never detach)
    m.position.copy(camera.position);
    m.quaternion.copy(camera.quaternion);
    m.rotateZ(roll * 0.9); // lean with the machine, not with the view
    m.rotateX(pitch * 0.5);
    m.updateMatrixWorld();
  }
}
