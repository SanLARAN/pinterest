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
import { geometryOf } from './uaz.js';

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
// a lean enduro: two spoked wheels on long travel, a skinny frame, a flat seat, high bars, a headlight
export function buildMoto(dyed) {
  const b = new MeshBuilder(512);
  const M = KIND.METAL, T = KIND.BARK, R = KIND.ROCK;
  // wheels: tyre + hub (spokes drawn as a disc of thin boxes by the wheel mesh itself)
  for (const z of [-0.62, 0.62]) {
    b.place(0, 0.3, z, PI / 2, 0, 0);
    b.cylinder(14, 0.3, 0.3, 0.09, R, { capBottom: true });
    b.place(0, 0.3, z, PI / 2, 0, 0);
    b.cylinder(8, 0.09, 0.09, 0.12, M);
  }
  // the frame: a simple beam with a downtube to the front fork
  b.limb([0, 0.42, -0.5], [0, 0.72, 0.28], 0.045, 0.045, M, 4);
  b.limb([0, 0.86, -0.5], [0, 0.72, 0.28], 0.035, 0.035, M, 4);
  b.limb([0, 0.86, -0.5], [0, 0.42, -0.5], 0.045, 0.035, M, 4);
  b.limb([0, 0.42, -0.5], [0, 0.3, -0.62], 0.04, 0.03, M, 4); // front fork
  b.limb([0, 0.72, 0.28], [0, 0.3, 0.62], 0.04, 0.03, M, 4); // swingarm
  // engine block, exhaust
  b.place(0, 0.5, 0.02); b.box(0.16, 0.2, 0.26, M);
  b.limb([0.06, 0.58, 0.12], [0.06, 0.66, 0.5], 0.03, 0.025, M, 4);
  // seat, tank, fenders
  b.place(0, 0.86, 0.12, 0.06); b.box(0.14, 0.06, 0.55, dyed ? KIND.LEAF : T);
  b.place(0, 0.92, -0.12, -0.1); b.box(0.16, 0.12, 0.3, dyed ? KIND.EFFIGY : T);
  b.place(0, 0.66, -0.66, -0.4); b.box(0.1, 0.03, 0.3, M);
  b.place(0, 0.7, 0.66, 0.4); b.box(0.12, 0.03, 0.32, M);
  // bars, headlight, mudguard number plate
  b.place(0, 1.04, -0.46); b.box(0.5, 0.035, 0.035, M);
  for (const x of [-0.22, 0.22]) b.limb([x, 1.04, -0.46], [x, 1.12, -0.42], 0.02, 0.015, M, 3);
  b.place(0, 0.98, -0.56); b.box(0.14, 0.14, 0.06, KIND.EYE);
  b.place(0, 1.06, -0.6, 0.35); b.box(0.22, 0.18, 0.02, dyed ? KIND.LEAF : T);
  return geometryOf(b.toArrays());
}

// ---------------- the park: four bikes by the camp ----------------
export class MotoPark {
  constructor(game) {
    this.g = game;
    this.geo = buildMoto(false);
    this.wheelGeo = (() => {
      const b = new MeshBuilder(128);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2;
        b.place(Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24, 0, 0, 0);
        b.box(0.02, 0.02, 0.26, KIND.METAL);
      }
      return geometryOf(b.toArrays());
    })();
    this.bikes = [];
    this.rider = -1; // which bike YOU sit on (-1 walking)
    this.riders = new Map(); // bike index -> remote player id (drawn at their position)
    this.mountT = 0;
    this.hum = null;
  }

  // park them in a row by the camp, noses out — one per slot, waiting
  reset() {
    const g = this.g;
    for (const m of this.bikes) if (m.mesh.parent) m.mesh.parent.remove(m.mesh);
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
      b.mesh = new THREE.Mesh(this.geo, g.world.material);
      b.mesh.frustumCulled = false;
      b.wheels = [new THREE.Mesh(this.wheelGeo, g.world.material), new THREE.Mesh(this.wheelGeo, g.world.material)];
      b.wheels[0].position.set(0, 0.3, -0.62);
      b.wheels[1].position.set(0, 0.3, 0.62);
      b.mesh.add(...b.wheels);
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
    if (this.rider < 0) return;
    const b = this.bikes[this.rider];
    const muted = g.inputMuted || g.inventory.active || g.state !== 'training';
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
    g.audio?.motoLoop?.(Math.abs(b.speed) / MOTO.max, this.rider >= 0);
    this.place();
  }

  // the meshes: yours exactly where it is; a friend's under their remote body
  place() {
    const g = this.g;
    for (const b of this.bikes) {
      const riderId = this.riders.get(b.i);
      let x = b.x, z = b.z, yaw = b.yaw, y = b.y, roll = b.roll, pitch = b.pitch, spin = b.spin;
      if (b.i !== this.rider && riderId) {
        const r = g.remotes.get(riderId);
        if (r) { x = r.x; z = r.z; yaw = r.yaw; y = r.y; spin = (r.moved || 0) * 2.2; }
      }
      b.mesh.position.set(x, y, z);
      b.mesh.rotation.set(pitch, yaw, 0);
      b.mesh.rotation.z = roll;
      b.mesh.visible = b.i !== this.rider || true; // your own bike is under you too (you sit on it)
      for (const w of b.wheels) w.rotation.x = spin;
    }
  }

  dispose() {
    for (const b of this.bikes) if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
    this.bikes = [];
  }
}
