// The way out. With all five generators running there's power again at the forestry yard by the north
// edge: its floodlight comes on, the siren howls and the sliding gate rolls open. Inside stands the УАЗ —
// stripped: a front wheel, the battery, the carburettor gone, the tank dry. The guard's log on the booth says
// where it all went. The parts are real things: pick one up (E) and carry it in your arms — slow, no running,
// no hands for anything else — put it down (R), or throw it (F: it bounces, the wheel rolls). Fit each one at
// the car (hold E). Then: in at the driver's door, hold E — the starter grinds, the engine catches (and
// everything in the forest hears it) — E again, and whoever is in the car (friends who are down too, laid in
// the back) drives out through the chained back gate, up the cut and off along the highway.
//
// Co-op: the host says who gets a part (a guest asks: 'xq'), who sits where ('xs'), and when the car goes
// ('xd' → 'xx', the same cutscene everywhere). Whoever holds a part throws it, sends where it went ('xt')
// and where it came to rest ('xr'). A fitted part ('xi') stays fitted. The state also rides along with the
// objectives' snapshot, so anything lost heals itself.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { t } from '../core/i18n.js';
import { RNG, clamp, lerp, smoothstep, damp } from '../core/rng.js';
import { shared, shadowLights, createWorldMaterial } from '../render/sonar.js';
import { LANDMARKS, CAP } from '../world/world.js';
import { Collision } from '../world/collision.js';
import { GATE, BACK, buildGateLeaf, buildBackLeaf, exitPath, groundAt, roadHeight, lampFirst, inYard } from '../world/yard.js';
import { PARTS, SLOTS, SEATS, WHEELS, MISSING, HOOD_HINGE, HOOD_OPEN, buildForestCar, buildPart, geometryOf } from './uaz.js';
import { CARP } from '../ui/garageSet.js';

const CARP_HEAD = CARP.head, CARP_TAIL = CARP.tail;
import { MeshBuilder } from '../world/builder.js';
import { haloMaterial } from './glowsticks.js';
import { buildSurvivor, poseSeated, poseSlumped, poseCarryPart } from './survivor.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { myFit } from './outfit.js';

const Y = CFG.YARD;
const PI = Math.PI;
const GRAV = 12;
const PICK_R = 1.7;
const SLOT_R = 1.6;
const SEAT_R = 1.5;
const LAMP_SLOT = 5; // uLamp[5]: the yard's floodlight
const LAMP_I = 1.2;
const GATE_TIME = 7.5;
const CRANK = 2.1; // s of grinding before it catches (with everything fitted)
const CUT_LEN = 15.6;
const WIN_PART = 750; // score for each part you fit
// where each part might have ended up (one landmark each, a different one every night)
const HIDE = {
  wheel: ['cabin2', 'stones2', 'graves2'],
  battery: ['stones2', 'cabin2', 'lake'],
  carb: ['cabin2', 'graves2', 'stones'],
  can: ['lake', 'stones2', 'graves2'],
};
const UP = new THREE.Vector3(0, 1, 0);
const AX = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)];
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _u = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _e = new THREE.Euler();
const _m = new THREE.Matrix4();
const _res = { d: 0, nx: 0, nz: 0 };
const qYaw = (a, out = new THREE.Quaternion()) => out.setFromAxisAngle(UP, a);
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const STATES = ['ground', 'fly', 'roll', 'topple', 'held', 'in'];

let _lampTex = null;
function warmTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
function lampTexture() {
  return (_lampTex ||= warmTexture([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,214,160,0.8)'], [0.5, 'rgba(255,150,70,0.16)'], [1, 'rgba(255,120,40,0)']]));
}

// how a part sits in your arms (in the frame of whoever holds it: +z = ahead)
function holdQuat(key, out = new THREE.Quaternion()) {
  if (key === 'wheel') return out.setFromAxisAngle(_u.set(1, 0, 0), PI / 2); // upright, axle ahead
  if (key === 'can') return out.setFromAxisAngle(UP, PI / 2);
  return out.identity();
}

export class Escape {
  constructor(game) {
    this.g = game;
    const world = game.world;
    this.Y = world.yard;
    const yd = this.Y;
    this.mat = world.material;
    // the view-model material: the world's, with a breath of light of its own (you can tell what's in your arms)
    this.viewMat = createWorldMaterial();
    this.viewMat.uniforms.uSelfLit = { value: 0.32 };
    this.viewMat.defines = { SELF_LIT: 1 };
    this.viewMat.needsUpdate = true;

    // ---- the car ----
    const C = buildForestCar();
    this.car = new THREE.Group();
    this.car.position.set(yd.car.x, yd.car.y, yd.car.z);
    this.car.rotation.y = yd.car.yaw;
    const mk = (arr, parent = this.car, mat = this.mat) => {
      const m = new THREE.Mesh(geometryOf(arr), mat);
      parent.add(m);
      return m;
    };
    this.carBody = mk(C.body);
    const wheelGeo = geometryOf(C.wheel);
    this.wheels = WHEELS.map(([x, y, z], i) => {
      const m = new THREE.Mesh(wheelGeo, this.mat);
      m.position.set(x, y, z);
      m.rotation.set(PI / 2, 0, 0);
      m.visible = i !== MISSING;
      this.car.add(m);
      return m;
    });
    this.hood = new THREE.Group();
    this.hood.position.set(...HOOD_HINGE);
    this.hood.rotation.z = HOOD_OPEN;
    this.car.add(this.hood);
    this.hoodMesh = mk(C.hood, this.hood);
    this.batMesh = mk(C.battery);
    this.batMesh.position.set(...SLOTS.battery.at);
    this.carbMesh = mk(C.carb);
    this.carbMesh.position.set(...SLOTS.carb.at);
    this.steering = mk(C.steering);
    this.steering.position.set(...[-0.42, 1.24, 0.42]);
    this.steering.rotation.set(0, 0, -0.45);
    // its lamps, as you see them from a way off once the engine runs (the beams themselves: uHead)
    this.carLights = [];
    for (const [p, color, sc] of [...CARP_HEAD.map((h) => [h, 0xfff2d8, 0.75]), ...CARP_TAIL.map((h) => [h, 0xff2a1a, 0.42])]) {
      const s = new THREE.Sprite(haloMaterial(color, lampTexture()));
      s.position.set(p[0] + (p[0] < 0 ? -0.06 : 0.06), p[1], p[2]);
      s.scale.setScalar(sc);
      s.material.opacity = 0.95;
      s.visible = false;
      this.car.add(s);
      this.carLights.push(s);
    }
    game.scene.add(this.car);
    if (game.shadows) {
      game.shadows.addDynamic(this.carBody, 2.6);
      game.shadows.addDynamic(this.hoodMesh, 2.6);
    }
    // ---- the sliding gate and the back gate's two leaves ----
    const gb = new MeshBuilder(4096);
    buildGateLeaf(gb);
    this.gateMesh = new THREE.Mesh(gb.toGeometry(), this.mat);
    this.gateMesh.matrixAutoUpdate = true;
    game.scene.add(this.gateMesh);
    if (game.shadows) game.shadows.addDynamic(this.gateMesh, GATE.len + 1);
    this.backLeaves = [false, true].map((lock, i) => {
      const b = new MeshBuilder(2048);
      buildBackLeaf(b, lock);
      const m = new THREE.Mesh(b.toGeometry(), this.mat);
      const s = i === 0 ? -1 : 1; // left / right
      m.position.set(yd.x + s * BACK.half, world.terrain.height(yd.x + s * BACK.half, yd.z + BACK.z), yd.z + BACK.z);
      m.rotation.y = i === 0 ? 0 : PI;
      game.scene.add(m);
      return { mesh: m, s, ang: 0, vel: 0 };
    });
    // ---- the floodlight, the gate's beacon, the highway's lamps ----
    this.floodCore = new THREE.Sprite(haloMaterial(0xfff2dc, lampTexture()));
    this.floodHalo = new THREE.Sprite(haloMaterial(0xffc890, lampTexture()));
    this.floodCore.position.set(yd.lamp.x, yd.lamp.y, yd.lamp.z);
    this.floodHalo.position.copy(this.floodCore.position);
    this.floodCore.scale.setScalar(0.7);
    this.floodHalo.scale.setScalar(6);
    this.beacon = new THREE.Sprite(haloMaterial(0xff8a20, lampTexture()));
    this.beacon.position.set(yd.motor.x, yd.motor.y, yd.motor.z);
    this.beacon.scale.setScalar(1.4);
    game.scene.add(this.floodCore, this.floodHalo, this.beacon);
    const out = world.outside || { lamps: [] };
    this.roadY = roadHeight(world);
    // sodium lamps along the highway: a hot core, a halo, a wide haze (from the yard they're a string of lights
    // down the cut)
    this.roadLamps = out.lamps.map((L) => {
      const add = (color, scale, op) => {
        const s = new THREE.Sprite(haloMaterial(color, lampTexture()));
        s.position.set(L.x, L.y - 0.05, L.z);
        s.scale.setScalar(scale);
        s.material.opacity = op;
        s.userData.base = scale;
        game.scene.add(s);
        return s;
      };
      return [add(0xffe2b0, 0.9, 1), add(0xff9a40, 5.2, 0.85), add(0xff8a30, 15, 0.18)];
    });
    // ...and the glow they put up into the damp air over the lowland
    this.skyGlow = new THREE.Sprite(haloMaterial(0xff8c3a, warmTexture([[0, 'rgba(255,255,255,0.9)'], [0.4, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']])));
    this.skyGlow.position.set(CFG.PASS.x - 10, this.roadY + 22, CFG.ROAD.z + 30);
    this.skyGlow.scale.set(260, 70, 1);
    this.skyGlow.material.opacity = 0.07;
    game.scene.add(this.skyGlow);
    shared.uRoad.value.set(lampFirst(), CFG.ROAD.lampEvery, CFG.ROAD.z - 2.6, this.roadY + 8.7);
    shared.uRoadK.value.set(1.5, lampFirst(), CFG.ROAD.x1);
    // ---- the four parts ----
    this.parts = PARTS.map((def, i) => {
      const geo = geometryOf(buildPart(def.key).toArrays());
      const mesh = new THREE.Mesh(geo, this.mat);
      game.scene.add(mesh);
      return { i, def, key: def.key, geo, mesh, state: 'ground', x: 0, y: -100, z: 0, vx: 0, vy: 0, vz: 0, q: new THREE.Quaternion(), w: new THREE.Vector3(), holder: null, seq: 0, by: null, rest: 0, roll: null, settle: null, revealed: false, landT: 0 };
    });
    // what's in your arms, as you see it (first person)
    this.view = new THREE.Mesh(this.parts[0].geo, this.viewMat);
    this.view.visible = false;
    this.view.frustumCulled = false;
    this.view.renderOrder = 8;
    game.scene.add(this.view);
    // ---- traffic on the highway ----
    this.traffic = [];
    this.trafficT = 6;
    this.path = null;
    this.reset(new RNG(1));
  }

  // ---------------- a new night ----------------
  reset(rng) {
    const g = this.g, world = g.world;
    this.silence();
    this.power = false;
    this.gate = { open: 0, state: 'shut', t: 0, siren: null, motor: null };
    this.gateShut();
    this.flood = 0;
    this.installed = 0;
    this.engine = 'dead';
    this.crankT = 0;
    this.crankFail = 0;
    this.seats = [null, null, null, null];
    this.mySeat = -1;
    this.knows = false; // read the guard's log: the parts' beacons tick
    this.inYardOnce = false;
    this.workT = 0;
    this.workKey = null;
    this.workClank = 0;
    this.askT = 0;
    this.waitPick = null;
    this.beaconT = 3;
    this.hum = null;
    this.idleNoiseT = 0;
    this.cut = null;
    this.departed = false;
    this.hinted = {};
    this.viewAnim = { k: 0, lift: 0, put: 0, throwT: 0 };
    this.hood.rotation.z = HOOD_OPEN;
    this.hoodT = 0;
    for (const w of this.wheels) w.rotation.set(PI / 2, 0, 0);
    this.wheels.forEach((w, i) => (w.visible = i !== MISSING));
    this.batMesh.visible = false;
    this.carbMesh.visible = false;
    for (const L of this.backLeaves) { L.ang = 0; L.vel = 0; L.mesh.rotation.y = L.s < 0 ? 0 : PI; }
    const yd = this.Y;
    this.car.position.set(yd.car.x, yd.car.y, yd.car.z);
    this.car.rotation.set(0, yd.car.yaw, 0);
    this.steering.rotation.set(0, 0, -0.45);
    shared.uLamp.value[LAMP_SLOT].w = 0;
    shadowLights.lamp[LAMP_SLOT] = null;
    shared.uHead.value.w = 0;
    for (const l of this.carLights) l.visible = false;
    this.floodCore.visible = this.floodHalo.visible = false;
    this.beacon.visible = false;
    this.trafficT = 4 + rng.next() * 8;
    document.body.classList.remove('in-car');
    this._dropCutRigs();
    // the parts: each at one of its landmarks (a different one each), somewhere clear near it
    const used = new Set();
    for (const p of this.parts) {
      const opts = HIDE[p.key].filter((id) => !used.has(id));
      const id = opts[Math.floor(rng.next() * opts.length)] || HIDE[p.key][0];
      used.add(id);
      const L = LANDMARKS.find((l) => l.id === id);
      const spot = this._spot(L, rng);
      p.site = id;
      p.home = { x: spot.x, z: spot.z };
      p.state = 'ground';
      p.holder = null;
      p.seq = 0;
      p.by = null;
      p.roll = null;
      p.settle = null;
      p.revealed = false;
      p.x = spot.x;
      p.z = spot.z;
      qYaw(rng.next() * PI * 2, p.q);
      p.y = this.floorY(p.x, p.z) + this._restHalf(p);
      p.vx = p.vy = p.vz = 0;
      p.w.set(0, 0, 0);
      p.mesh.visible = true;
      this._place(p);
    }
    this.view.visible = false;
  }

  // somewhere clear in a landmark — not by a generator or the body beside one (their E would get in the way)
  _spot(L, rng) {
    const world = this.g.world;
    const near = [];
    for (const site of world.sites || []) near.push([site.x, site.z], [site.corpse.x, site.corpse.z]);
    for (let k = 0; k < 60; k++) {
      const a = rng.next() * PI * 2, r = 2.5 + rng.next() * Math.max(1, L.r - 4.5);
      const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r;
      if (!world.col.free(x, z, 0.9)) continue;
      if (near.some(([nx, nz]) => Math.hypot(nx - x, nz - z) < 4.5)) continue;
      const lake = world.lake;
      if (lake && Math.hypot(x - lake.x, z - lake.z) < lake.r + 1.5) continue;
      if (this.g.doors && this.g.doors.indoors(x, z)) continue;
      return { x, z };
    }
    return world._freeSpot(L.x, L.z, 2.5, Math.max(3.5, L.r - 2), 0.9, rng);
  }

  // back to the menu: every sound off
  silence() {
    if (this.engineSnd) { this.engineSnd.stop(0.3); this.engineSnd = null; }
    if (this.crankSnd) { this.crankSnd.stop(0.1); this.crankSnd = null; }
    if (this.remoteCrank) { this.remoteCrank.stop(0.1); this.remoteCrank = null; }
    if (this.gate && this.gate.motor) { this.gate.motor.stop(0.2); this.gate.motor = null; }
    if (this.gate && this.gate.siren) { this.gate.siren.stop(0.2); this.gate.siren = null; }
    for (const c of this.traffic || []) this._dropCar(c);
    this.traffic = [];
    shared.uHead.value.w = 0;
    for (const l of this.carLights || []) l.visible = false;
    if (this.view) this.view.visible = false;
  }

  // ---------------- queries ----------------
  floorY(x, z) {
    const g = this.g;
    if (inYard(x, z, -0.2)) return groundAt(g.world, x, z) + 0.08; // the slabs
    return groundAt(g.world, x, z) + (g.doors && g.doors.indoors(x, z) ? 0.2 : 0);
  }

  _restHalf(p) {
    // how high its centre sits above the ground in its current orientation
    _q.copy(p.q).invert();
    _v.copy(UP).applyQuaternion(_q);
    const [hx, hy, hz] = p.def.half;
    return Math.abs(_v.x) * hx + Math.abs(_v.y) * hy + Math.abs(_v.z) * hz;
  }

  heldBy(pid) {
    return this.parts.find((p) => p.state === 'held' && p.holder === pid) || null;
  }
  get held() {
    return this.heldBy(this.g.player.id);
  }
  // how fast you walk with what's in your arms (null: nothing)
  load(pid) {
    const p = this.heldBy(pid);
    return p ? p.def : null;
  }
  has(key) {
    return !!(this.installed & (1 << PARTS.findIndex((d) => d.key === key)));
  }
  get count() {
    let n = 0;
    for (let i = 0; i < 4; i++) if (this.installed & (1 << i)) n++;
    return n;
  }
  get ready() {
    return this.installed === 15;
  }
  seatOf(pid) {
    return this.seats.indexOf(pid);
  }

  // yard-local car → world
  carToWorld(lx, ly, lz, out = new THREE.Vector3()) {
    this.car.updateMatrixWorld(true);
    return out.set(lx, ly, lz).applyMatrix4(this.car.matrixWorld);
  }

  // ---------------- power: the gate opens ----------------
  powerOn() {
    if (this.power) return;
    this.power = true;
    const g = this.g, yd = this.Y;
    this.gate.state = 'opening';
    this.gate.t = 0;
    this.flood = 0.001;
    this.floodFlick = 1.4;
    this.beacon.visible = true;
    const a = g.audio;
    if (a.ready) {
      this.gate.siren = a.gateSiren ? a.gateSiren(yd.motor.x, yd.motor.y + 0.4, yd.motor.z, 8.5) : null;
      a.gateFar && a.gateFar(yd.motor.x, yd.motor.z);
    }
    g.noise(yd.front.x, yd.front.z, 0.8, 'repair'); // the siren: everything in the north of the forest comes to look
    g.hud.flashAlert(t('aGateOpen'), 'dawn', 3.2);
    g.hud.peek(5);
    g.addTrauma(0.12);
    if (g.player.alive && !this.hinted.gate) {
      this.hinted.gate = true;
      g.timeline.push({ at: g.time + 3.2, fn: () => g.hud.setHint(t('hintGate')) });
      g.timeline.push({ at: g.time + 10.5, fn: () => g.hud.setHint(null) });
    }
    this.beaconT = 4;
  }

  gateShut() {
    this.gateMesh.position.set(this.Y.x + GATE.x0, this.g.world.terrain.height(this.Y.x, this.Y.z + GATE.z), this.Y.z + GATE.z);
    this._gateCol();
  }

  _gateCol() {
    const yd = this.Y;
    const x0 = yd.x + GATE.x0 + this.gate.open * GATE.travel;
    this.g.world.col.setSeg(yd.gateCap, x0 + 0.1, yd.z + GATE.z, x0 + GATE.len - 0.1, yd.z + GATE.z);
  }

  _updateGate(dt) {
    const g = this.g, gt = this.gate, yd = this.Y;
    if (gt.state === 'opening') {
      gt.t += dt;
      const run = clamp((gt.t - 1.6) / GATE_TIME, 0, 1);
      if (gt.t >= 1.6 && !gt.motor && g.audio.ready && g.audio.gateMotor) gt.motor = g.audio.gateMotor(yd.x + GATE.open1 + 0.7, yd.motor.y - 0.3, yd.z + GATE.z, GATE_TIME);
      const k = run * run * (3 - 2 * run);
      gt.open = k;
      if (run >= 1) {
        gt.state = 'open';
        gt.motor = null;
        if (g.audio.ready && g.audio.gateClunk) g.audio.gateClunk(yd.x + GATE.open1 + 4.6, yd.motor.y, yd.z + GATE.z);
        g.noise(yd.front.x, yd.front.z, 0.55, 'repair');
      }
      if (gt.t > 4 && gt.t - dt <= 4) g.noise(yd.front.x, yd.front.z, 0.6, 'repair');
      this.gateMesh.position.x = yd.x + GATE.x0 + gt.open * GATE.travel;
      this.gateMesh.position.y = g.world.terrain.height(yd.x + gt.open * GATE.travel, yd.z + GATE.z) + Math.sin(gt.t * 31) * 0.006 * (run > 0 && run < 1 ? 1 : 0);
      this._gateCol();
    }
    // the beacon on the drive unit: turns while there's power and the gate moves (then a slow blink)
    if (this.beacon.visible) {
      const moving = gt.state === 'opening';
      const ph = g.time * (moving ? 6.5 : 1.6);
      const on = moving ? 0.35 + 0.65 * Math.max(0, Math.sin(ph)) : (Math.sin(ph) > 0.92 ? 1 : 0.08);
      this.beacon.material.opacity = on;
      this.beacon.scale.setScalar(moving ? 1.2 + on * 0.8 : 1.1);
    }
    // the floodlight: it stutters on, then burns
    if (this.flood > 0) {
      this.flood = Math.min(1, this.flood + dt * 0.8);
      let I = this.flood;
      if (this.floodFlick > 0) {
        this.floodFlick -= dt;
        I *= Math.random() < 0.5 ? 0.1 : 1;
      }
      const L = yd.lamp;
      shared.uLamp.value[LAMP_SLOT].set(L.x, L.y, L.z, I * LAMP_I);
      const sl = shadowLights.lamp[LAMP_SLOT] || (shadowLights.lamp[LAMP_SLOT] = { x: 0, y: 0, z: 0, R: 0, near: 0.32 });
      sl.x = L.x;
      sl.y = L.y;
      sl.z = L.z;
      sl.R = CFG.LAMP_R * 1.5;
      this.floodCore.visible = this.floodHalo.visible = true;
      this.floodCore.material.opacity = Math.min(1, I * 1.2);
      this.floodHalo.material.opacity = I * 0.25;
    }
  }

  // ---------------- the parts: physics ----------------
  _place(p) {
    const m = p.mesh;
    if (p.state === 'in') {
      m.visible = false;
      return;
    }
    const mine = p.state === 'held' && p.holder === this.g.player.id;
    m.visible = !mine && p.y > -50;
    m.position.set(p.x, p.y, p.z);
    m.quaternion.copy(p.q);
  }

  // every machine runs every part (a throw is an event; where it lands is the thrower's word, see 'xr')
  _updateParts(dt) {
    const g = this.g;
    for (const p of this.parts) {
      if (p.state === 'held') {
        const h = g.playerById(p.holder);
        if (!h || (!h.alive && h !== g.player)) this._dropAt(p, h ? h.x : p.x, h ? h.z : p.z);
        else if (h === g.player && !h.alive) this._dropAt(p, h.x, h.z);
        else this._holdPos(p, h);
      } else if (p.state === 'fly') this._fly(p, dt);
      else if (p.state === 'roll') this._roll(p, dt);
      else if (p.state === 'topple') this._topple(p, dt);
      else if (p.state === 'ground' && p.settle) {
        const s = p.settle;
        s.t = Math.min(1, s.t + dt / s.dur);
        const k = s.t * s.t * (3 - 2 * s.t);
        p.q.copy(s.q0).slerp(s.q1, k);
        p.x = lerp(s.x0, s.x1, k);
        p.z = lerp(s.z0, s.z1, k);
        p.y = lerp(s.y0, s.y1, k);
        if (s.t >= 1) p.settle = null;
      }
      this._place(p);
    }
  }

  // in someone's arms
  _holdPos(p, h) {
    const yaw = h.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const heavy = p.key !== 'carb';
    p.x = h.x + fx * (heavy ? 0.42 : 0.36);
    p.z = h.z + fz * (heavy ? 0.42 : 0.36);
    p.y = h.y + (h.crouching ? 0.62 : heavy ? (p.key === 'wheel' ? 1.0 : 0.88) : 1.02);
    qYaw(yaw + PI, p.q).multiply(holdQuat(p.key, _q));
  }

  _dropAt(p, x, z) {
    p.state = 'ground';
    p.holder = null;
    p.roll = null;
    p.x = x;
    p.z = z;
    const res = { x, z };
    this.g.world.col.resolve(res, 0.3);
    p.x = res.x;
    p.z = res.z;
    this._settleFrom(p, 0.3);
  }

  // come to rest in whatever stable pose is nearest the one it's in (a box lands on a face, a wheel flat)
  _settleFrom(p, dur = 0.25) {
    _q.copy(p.q).invert();
    _v.copy(UP).applyQuaternion(_q); // world up, in the part's frame
    let best = 0, bd = -2;
    for (let i = 0; i < 6; i++) {
      if (p.key === 'wheel' && i !== 2 && i !== 3) continue; // a wheel only lies flat
      const d = _v.dot(AX[i]);
      if (d > bd) { bd = d; best = i; }
    }
    const a = AX[best];
    _w.copy(a).applyQuaternion(p.q); // that axis, in the world now
    _q2.setFromUnitVectors(_w, UP);
    const q1 = _q2.clone().multiply(p.q);
    const half = p.def.half[best >> 1];
    const y1 = this.floorY(p.x, p.z) + half;
    p.settle = { q0: p.q.clone(), q1, t: 0, dur, x0: p.x, x1: p.x, z0: p.z, z1: p.z, y0: p.y, y1 };
    p.vx = p.vy = p.vz = 0;
    p.w.set(0, 0, 0);
    p.state = 'ground';
  }

  _collide(p, nx, ny, nz) {
    const world = this.g.world;
    const h = ny - groundAt(world, nx, nz);
    const pr = Math.max(p.def.half[0], p.def.half[2]) * 0.8;
    for (const ci of world.col.query(nx, nz, 1.5)) {
      const c = world.col.caps[ci];
      if (c.kind === CAP.WATER || h > c.h) continue;
      Collision.closest(c, nx, nz, _res);
      if (_res.d < pr) return { nx: _res.nx, nz: _res.nz, pen: pr - _res.d };
    }
    return null;
  }

  _fly(p, dt) {
    const g = this.g;
    p.vy -= GRAV * dt;
    let nx = p.x + p.vx * dt, ny = p.y + p.vy * dt, nz = p.z + p.vz * dt;
    // tumbling
    const wl = p.w.length();
    if (wl > 1e-4) {
      _q.setFromAxisAngle(_v.copy(p.w).divideScalar(wl), wl * dt);
      p.q.premultiply(_q);
    }
    const hit = this._collide(p, nx, ny, nz);
    if (hit) {
      const vn = p.vx * hit.nx + p.vz * hit.nz;
      if (vn < 0) {
        p.vx = (p.vx - 1.7 * vn * hit.nx) * 0.5;
        p.vz = (p.vz - 1.7 * vn * hit.nz) * 0.5;
        if (-vn > 1.5) this._landFx(p, -vn * 0.6, true);
      }
      nx = p.x + hit.nx * hit.pen;
      nz = p.z + hit.nz * hit.pen;
    }
    const L = g.world.lake;
    if (L && Math.hypot(nx - L.x, nz - L.z) < L.r - 0.5 && ny <= L.y) {
      // into the lake: it sinks where it went in (fished out, it lies on the bottom by the shore)
      g.audio.impact(nx, L.y, nz, true);
      const a = Math.atan2(nz - L.z, nx - L.x);
      p.x = L.x + Math.cos(a) * (L.r + 0.8);
      p.z = L.z + Math.sin(a) * (L.r + 0.8);
      p.y = this.floorY(p.x, p.z) + 0.2;
      this._settleFrom(p, 0.05);
      this._restSync(p);
      return;
    }
    const floor = this.floorY(nx, nz);
    p.x = nx;
    p.z = nz;
    p.y = ny;
    const half = this._restHalf(p);
    if (ny - half <= floor) {
      const v = Math.hypot(p.vx, p.vy, p.vz);
      const hv = Math.hypot(p.vx, p.vz);
      p.y = floor + half;
      if (v > 1.2) this._landFx(p, v, false);
      if (p.key === 'wheel' && hv > 1.6 && p.rest < 3) {
        // it lands on its tread and rolls
        p.state = 'roll';
        p.roll = { yaw: Math.atan2(p.vx, p.vz), v: hv * 0.85, spin: 0, lean: 0, wob: Math.random() * 6 };
        return;
      }
      if (-p.vy > 2.2 && p.rest < 3) {
        p.vy = -p.vy * p.def.bounce;
        p.vx *= 0.62;
        p.vz *= 0.62;
        p.w.multiplyScalar(0.55).add(_v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(3));
        p.rest++;
        return;
      }
      // it slides a little and stops
      const slide = (hv * hv) / (2 * p.def.slide);
      const res = { x: p.x + (hv > 0.01 ? (p.vx / hv) * slide : 0), z: p.z + (hv > 0.01 ? (p.vz / hv) * slide : 0) };
      g.world.col.resolve(res, 0.25);
      this._settleFrom(p, 0.22 + slide * 0.3);
      p.settle.x1 = res.x;
      p.settle.z1 = res.z;
      p.settle.y1 = this.floorY(res.x, res.z) + (p.settle.y1 - this.floorY(p.x, p.z));
      this._restSync(p);
      return;
    }
    if (p.y < -60) this._dropAt(p, p.home.x, p.home.z);
  }

  // a wheel on its tread: it rolls on, slows, wobbles, and falls flat
  _roll(p, dt) {
    const g = this.g, R = p.roll;
    R.v = Math.max(0, R.v - 1.15 * dt);
    const nx = p.x + Math.sin(R.yaw) * R.v * dt, nz = p.z + Math.cos(R.yaw) * R.v * dt;
    const rad = p.def.half[0];
    const hit = this._collide(p, nx, this.floorY(nx, nz) + rad, nz);
    if (hit) {
      // off a tree: back the way it came, a good deal slower
      const dx = Math.sin(R.yaw), dz = Math.cos(R.yaw);
      const vn = dx * hit.nx + dz * hit.nz;
      const rx = dx - 2 * vn * hit.nx, rz = dz - 2 * vn * hit.nz;
      R.yaw = Math.atan2(rx, rz);
      R.v *= 0.5;
      this._landFx(p, R.v + 1.5, true);
    } else {
      p.x = nx;
      p.z = nz;
    }
    p.y = this.floorY(p.x, p.z) + rad;
    R.spin += (R.v / rad) * dt;
    R.wob += dt * 9;
    R.lean = Math.sin(R.wob) * 0.06 * (1.2 - Math.min(1, R.v / 4));
    R.yaw += Math.sin(R.wob * 0.5) * 0.02 * dt * 10 * (1 - Math.min(1, R.v / 5));
    this._rollQuat(p, R.lean);
    if (R.v < 0.75) {
      p.state = 'topple';
      R.t = 0;
      R.dir = R.lean >= 0 ? 1 : -1;
    }
  }

  _rollQuat(p, lean) {
    const R = p.roll;
    // yaw, then stood on its tread (axle → +x) and leaning about the way it rolls, spinning on its axle
    qYaw(R.yaw, p.q);
    _q.setFromAxisAngle(_v.set(0, 0, 1), lean - PI / 2);
    p.q.multiply(_q);
    _q.setFromAxisAngle(UP, R.spin);
    p.q.multiply(_q);
  }

  _topple(p, dt) {
    const R = p.roll;
    R.t += dt;
    const k = Math.min(1, R.t / 0.85);
    const ease = k * k;
    const wob = Math.sin(R.t * 26) * 0.08 * (1 - k);
    const lean = R.dir * (ease * (PI / 2) + wob);
    R.spin += (R.v / p.def.half[0]) * dt * (1 - k);
    this._rollQuat(p, lean);
    const rad = p.def.half[0], halfW = p.def.half[1];
    p.y = this.floorY(p.x, p.z) + lerp(rad, halfW, ease);
    if (k >= 1) {
      this._landFx(p, 2.2, false, true);
      p.roll = null;
      this._settleFrom(p, 0.12);
      this._restSync(p);
    }
  }

  // it hit something: a sound (what it is decides which), a little sonar flash — and the forest hears it
  _landFx(p, v, wall, flat = false) {
    const g = this.g;
    if (g.time - p.landT < 0.12) return;
    p.landT = g.time;
    const k = clamp(v / 7, 0.15, 1);
    if (g.audio.ready && g.audio.partLand) g.audio.partLand(p.x, p.y, p.z, p.key, k, flat);
    if (k > 0.3) {
      g.pulses.emit(p.x, p.y + 0.2, p.z, g.time, { radius: 6 + k * 8, strength: 0.6 + k * 0.4, decay: 1.2, color: [0.85, 0.92, 1.0], kind: 'stone' });
      g.radar.blip(p.x, p.z, 'stone');
    }
    // only the one who threw it (or the host for a fall) makes it heard: the noise isn't counted twice
    if (p.by === g.player.id || (!p.by && g.auth)) g.noise(p.x, p.z, p.def.land * (0.4 + 0.6 * k), 'part', false, p.by || null);
  }

  // the thrower has the last word on where it lies
  _restSync(p) {
    const g = this.g;
    if (!g.sync || p.by !== g.player.id) return;
    const s = p.settle;
    const x = s ? s.x1 : p.x, y = s ? s.y1 : p.y, z = s ? s.z1 : p.z;
    const q = s ? s.q1 : p.q;
    g.sync.ev('xr', p.i, p.seq, r3(x), r3(y), r3(z), r3(q.x), r3(q.y), r3(q.z), r3(q.w));
  }

  netRest(i, seq, x, y, z, qx, qy, qz, qw) {
    const p = this.parts[i | 0];
    if (!p || seq < p.seq || p.state === 'held' || p.state === 'in') return;
    if (![x, y, z, qx, qy, qz, qw].every(Number.isFinite)) return;
    p.seq = seq;
    p.state = 'ground';
    p.roll = null;
    const q1 = new THREE.Quaternion(qx, qy, qz, qw).normalize();
    p.settle = { q0: p.q.clone(), q1, t: 0, dur: 0.35, x0: p.x, x1: x, z0: p.z, z1: z, y0: p.y, y1: y };
  }

  // ---------------- the parts: hands ----------------
  // E on a part lying about
  pick(p) {
    const g = this.g, me = g.player;
    if (!me.alive || this.held || me.carrying || this.mySeat >= 0) return;
    if (p.state === 'held' || p.state === 'in') return;
    if (g.auth) this.grant(p.i, me.id);
    else if (this.askT <= 0) {
      g.coop.toHost('xq', p.i);
      this.askT = 0.7;
      this.waitPick = p;
    }
  }

  // the host: may this one have that part?
  grant(i, pid) {
    const g = this.g;
    const p = this.parts[i | 0], who = g.playerById(pid);
    if (!p || !who || !who.alive || p.state === 'held' || p.state === 'in') return;
    if (this.heldBy(pid) || who.carrying) return;
    if (Math.hypot(p.x - who.x, p.z - who.z) > PICK_R + 2.2) return;
    const seq = p.seq + 1;
    this.take(p, pid, seq);
    if (g.sync) g.sync.ev('xg', p.i, pid, seq);
  }

  netGrant(i, pid, seq) {
    const p = this.parts[i | 0];
    if (!p || seq <= p.seq || p.state === 'in') return;
    this.take(p, pid, seq);
  }

  // (every machine) pid has it in their arms now
  take(p, pid, seq) {
    const g = this.g;
    p.state = 'held';
    p.holder = pid;
    p.seq = seq;
    p.roll = null;
    p.settle = null;
    p.by = null;
    const h = g.playerById(pid);
    if (h) this._holdPos(p, h);
    // a lit stick in their hand goes to the ground: this takes both arms
    if (h && g.glows && g.glows.heldBy(pid)) g.glows.dropFor(pid, h.x + 0.3, h.z);
    if (g.audio.ready && g.audio.partPick) g.audio.partPick(p.x, p.y, p.z, p.key, pid === g.player.id);
    if (pid === g.player.id) {
      this.waitPick = null;
      this.viewAnim.lift = 1;
      if (!this.hinted.carry) {
        this.hinted.carry = true;
        g.hud.setHint(t(g.input.touch ? 'hintPartTouch' : 'hintPart'));
        g.timeline.push({ at: g.time + 7, fn: () => g.hud.setHint(null) });
      }
      g.addTrauma(0.06);
    }
  }

  // R: put it down in front of you; F: throw it
  putDown() {
    this._release(false);
  }
  throwHeld() {
    this._release(true);
  }

  _release(thrown) {
    const g = this.g, me = g.player;
    const p = this.held;
    if (!p) return;
    const seq = p.seq + 1;
    const cp = Math.cos(me.pitch);
    const fx = -Math.sin(me.yaw), fz = -Math.cos(me.yaw);
    let x, y, z, vx = 0, vy = 0, vz = 0;
    if (thrown) {
      const e = g.eyePos();
      x = e.x + fx * 0.45;
      z = e.z + fz * 0.45;
      y = e.y - 0.4;
      const pitch = clamp(me.pitch + 0.1, -0.5, 0.9);
      const c2 = Math.cos(pitch);
      vx = fx * c2 * p.def.throw + me.vx * 0.5;
      vz = fz * c2 * p.def.throw + me.vz * 0.5;
      vy = Math.sin(pitch) * p.def.throw + p.def.up;
      this.viewAnim.throwT = 0.25;
      g.audio.throwWhoosh();
      g.addTrauma(0.05);
    } else {
      const pos = { x: me.x + fx * 0.7, z: me.z + fz * 0.7 };
      g.world.col.resolve(pos, 0.3);
      x = pos.x;
      z = pos.z;
      y = me.y + 0.5;
    }
    void cp;
    this.fling(p, me.id, seq, x, y, z, vx, vy, vz, me.yaw, thrown ? 1 : 0);
    if (g.sync) g.sync.ev('xt', p.i, seq, r2(x), r2(y), r2(z), r2(vx), r2(vy), r2(vz), r3(me.yaw), thrown ? 1 : 0);
  }

  netFling(pid, i, seq, x, y, z, vx, vy, vz, yaw, mode) {
    const p = this.parts[i | 0];
    if (!p || seq <= p.seq || p.state === 'in') return;
    if (![x, y, z, vx, vy, vz].every(Number.isFinite)) return;
    this.fling(p, pid, seq, x, y, z, vx, vy, vz, +yaw || 0, mode);
  }

  // (every machine) out of someone's arms: thrown (mode 1) or set down (0)
  fling(p, pid, seq, x, y, z, vx, vy, vz, yaw, mode) {
    const g = this.g;
    p.seq = seq;
    p.holder = null;
    p.by = pid;
    p.rest = 0;
    p.roll = null;
    p.settle = null;
    p.x = x;
    p.y = y;
    p.z = z;
    qYaw(yaw + PI, p.q);
    if (p.key === 'wheel') {
      // thrown, it goes upright with its axle across (it'll land rolling); set down, it lies flat
      if (mode) p.q.multiply(_q.setFromAxisAngle(_v.set(0, 0, 1), PI / 2));
    } else p.q.multiply(holdQuat(p.key, _q));
    if (!mode) {
      // set down gently: it stands the way you held it
      p.state = 'ground';
      this._settleFrom(p, 0.3);
      if (g.audio.ready && g.audio.partLand) g.audio.partLand(x, y - 0.4, z, p.key, 0.25, true);
      return;
    }
    p.state = 'fly';
    p.vx = vx;
    p.vy = vy;
    p.vz = vz;
    // a spin that's the same on every machine (from its version number)
    const r = new RNG((seq * 7919 + p.i * 104729) >>> 0);
    if (p.key === 'wheel') {
      // thrown like a wheel is: upright, spinning forward about its axle (it lands rolling)
      const sp = Math.hypot(vx, vz) / p.def.half[0];
      _v.set(-vz, 0, vx).normalize();
      p.w.copy(_v).multiplyScalar(-sp * 0.3);
    } else p.w.set(r.float(-1, 1), r.float(-1, 1), r.float(-1, 1)).normalize().multiplyScalar(r.float(4, 8));
  }

  // whoever held it went down or left: it falls where they were
  dropFor(pid, x, z) {
    const p = this.heldBy(pid);
    if (p) this._dropAt(p, x, z);
  }

  // ---------------- fitting it ----------------
  slotPos(key, out = new THREE.Vector3()) {
    const s = SLOTS[key].stand;
    return this.carToWorld(s[0], 0, s[2], out);
  }

  install(p) {
    const g = this.g;
    const seq = p.seq + 1;
    this.fit(p.i, seq, g.player.id);
    if (g.sync) g.sync.ev('xi', p.i, seq);
  }

  netFit(pid, i, seq) {
    this.fit(i | 0, seq, pid);
  }

  // (every machine) it goes in
  fit(i, seq, pid) {
    const g = this.g;
    const p = this.parts[i];
    if (!p || p.state === 'in') return;
    p.state = 'in';
    p.holder = null;
    p.seq = Math.max(p.seq, seq | 0);
    p.mesh.visible = false;
    this.installed |= 1 << i;
    this._showInstalled();
    const at = SLOTS[p.key].at;
    const w = this.carToWorld(at[0], at[1], at[2], _v);
    if (g.audio.ready && g.audio.partFitted) g.audio.partFitted(w.x, w.y, w.z, p.key);
    g.particles.burst(w.x, w.y, w.z, 12, { color: [1.0, 0.82, 0.5], speed: 2, up: 1, life: 0.6, size: 0.05, gravity: -4, drag: 2 });
    const mine = pid === g.player.id;
    const who = mine ? null : g.playerById(pid);
    const pts = Math.round(WIN_PART * g.mult);
    if (mine) {
      g.score += pts;
      g.stats.parts = (g.stats.parts | 0) + 1;
      (g.stats.carFit ||= [0, 0, 0, 0])[i]++;
      g.hud.popup(`+${pts} · ${t('carParts')[p.key]}`, 'amber');
    } else if (who) g.hud.popup(t('mateFitted').replace('{name}', g.nameOf(who.id)).replace('{part}', t('carParts')[p.key]), 'amber');
    g.hud.flashAlert(t('aCarParts').replace('{n}', this.count), 'dawn', 2.2);
    g.hud.peek(4);
    if (this.ready) {
      g.timeline.push({ at: g.time + 2.4, fn: () => {
        if (g.state !== 'play') return;
        g.hud.flashAlert(t('aCarReady'), 'dawn', 3);
        if (g.player.alive) {
          g.hud.setHint(t(g.input.touch ? 'hintDriveTouch' : 'hintDrive'));
          g.timeline.push({ at: g.time + 7, fn: () => g.hud.setHint(null) });
        }
      } });
    }
  }

  _showInstalled() {
    this.wheels[MISSING].visible = this.has('wheel');
    this.batMesh.visible = this.has('battery');
    this.carbMesh.visible = this.has('carb');
  }

  // ---------------- the seats ----------------
  // E at a door: in (the host says which seat is whose)
  sit(i) {
    const g = this.g;
    if (this.held || g.player.carrying) return;
    if (g.auth) this.assign(i, g.player.id);
    else if (this.askT <= 0) {
      g.coop.toHost('xs', i);
      this.askT = 0.6;
    }
  }
  standUp() {
    const g = this.g;
    if (this.mySeat < 0) return;
    if (g.auth) this.assign(-1, g.player.id);
    else if (this.askT <= 0) {
      g.coop.toHost('xs', -1);
      this.askT = 0.6;
    }
  }

  // the host: seat i to pid (i = −1: out)
  assign(i, pid) {
    const g = this.g;
    if (this.cut) return;
    const who = g.playerById(pid);
    if (!who) return;
    const was = this.seats.indexOf(pid);
    if (i >= 0) {
      if (this.seats[i] && this.seats[i] !== pid) return;
      if (!who.alive) return;
      const d = this.carToWorld(SEATS[i].door[0], 0, SEATS[i].door[2], _v);
      if (Math.hypot(d.x - who.x, d.z - who.z) > SEAT_R + 2) return;
      if (was >= 0) this.seats[was] = null;
      this.seats[i] = pid;
    } else if (was >= 0) this.seats[was] = null;
    else return;
    this._seatsChanged();
    if (g.sync) g.sync.ev('xa', this.seats.slice());
  }

  netSeats(arr) {
    if (!Array.isArray(arr) || this.cut) return;
    this.seats = [0, 1, 2, 3].map((i) => (typeof arr[i] === 'string' ? arr[i] : null));
    this._seatsChanged();
  }

  _seatsChanged() {
    const g = this.g, me = g.player;
    const was = this.mySeat;
    this.mySeat = this.seats.indexOf(me.id);
    if (was < 0 && this.mySeat >= 0) {
      g.audio.ready && g.audio.carDoor && g.audio.carDoor(me.x, me.y + 1, me.z, true);
      if (this.mySeat === 0 && !this.hinted.seat) {
        this.hinted.seat = true;
        g.hud.setHint(t(g.input.touch ? (this.ready ? 'hintCrankTouch' : 'hintCrankNotTouch') : this.ready ? 'hintCrank' : 'hintCrankNot'));
        g.timeline.push({ at: g.time + 6, fn: () => g.hud.setHint(null) });
      }
    } else if (was >= 0 && this.mySeat < 0) {
      // out by the door you got in at
      const d = this.carToWorld(SEATS[was].door[0], 0, SEATS[was].door[2], _v);
      const pos = { x: d.x, z: d.z };
      g.world.col.resolve(pos, 0.4);
      me.x = pos.x;
      me.z = pos.z;
      me.y = g.world.terrain.height(me.x, me.z);
      me.vx = me.vz = 0;
      g.audio.ready && g.audio.carDoor && g.audio.carDoor(me.x, me.y + 1, me.z, false);
    }
    document.body.classList.toggle('in-car', this.mySeat >= 0);
  }

  // someone in a seat went down (caught through the open top): they fall out by their door. (a friend
  // who was down already when laid in the back stays there)
  onDown(p) {
    const g = this.g;
    const i = this.seats.indexOf(p.id);
    if (i < 0 || this.cut) return;
    this.seats[i] = null;
    const d = this.carToWorld(SEATS[i].door[0], 0, SEATS[i].door[2], _v);
    const pos = { x: d.x, z: d.z };
    g.world.col.resolve(pos, 0.4);
    p.x = pos.x;
    p.z = pos.z;
    p.y = g.world.terrain.height(p.x, p.z);
    if (p === g.player) {
      this.mySeat = -1;
      document.body.classList.remove('in-car');
    }
  }

  // someone left the night: their seat is free (the host tells everyone)
  left(id) {
    const i = this.seats.indexOf(id);
    if (i < 0 || this.cut) return;
    this.seats[i] = null;
    const g = this.g;
    if (g.role === 'host' && g.sync) g.sync.ev('xa', this.seats.slice());
  }

  // someone lifted a friend back out of the car
  onLifted(b) {
    const i = this.seats.indexOf(b.id);
    if (i >= 0 && !this.cut) this.seats[i] = null;
  }

  // a friend who is down, laid into the back (R by a rear door while you carry them) — the host's say
  loadBody() {
    const g = this.g, me = g.player;
    const b = g.playerById(me.carrying);
    if (!b) return false;
    const seat = this._freeRear();
    if (seat < 0) return false;
    if (g.auth) this.hostLoad(b.id, me.id);
    else g.coop.toHost('xb', b.id);
    return true;
  }
  // are you carrying someone by one of the car's doors (with a seat free)?
  canLoad() {
    const g = this.g, me = g.player;
    if (!me.carrying || this.cut || this._freeRear() < 0) return false;
    const c = this.car.position;
    return Math.hypot(c.x - me.x, c.z - me.z) < 3.4;
  }

  _freeRear() {
    for (const i of [2, 3, 1]) if (!this.seats[i]) return i;
    return -1;
  }
  hostLoad(bodyId, carrierId) {
    const g = this.g;
    const b = g.playerById(bodyId), c = g.playerById(carrierId);
    if (!b || !c || b.alive || c.carrying !== b.id || this.cut) return;
    const seat = this._freeRear();
    if (seat < 0) return;
    this.seats[seat] = b.id;
    // off the carrier's shoulder
    c.carrying = null;
    b.carriedBy = null;
    this._seatsChanged();
    g.sync && g.sync.ev('xa', this.seats.slice());
    g.sync && g.sync.ev('xl', bodyId, carrierId);
    this._loaded(b, c);
  }
  netLoaded(bodyId, carrierId) {
    const g = this.g;
    const b = g.playerById(bodyId), c = g.playerById(carrierId);
    if (b && c) this._loaded(b, c);
  }
  _loaded(b, c) {
    const g = this.g;
    if (c && c.carrying === b.id) c.carrying = null;
    b.carriedBy = null;
    const w = this.carToWorld(1.2, 0.9, 0, _v);
    b.x = w.x;
    b.z = w.z;
    g.audio.bodyDrop(w.x, w.y, w.z, false);
    if (b === g.player && g.spectate) g.spectLabel = null;
  }

  // ---------------- the engine ----------------
  _crank(dt, held) {
    const g = this.g, me = g.player;
    const has = this.has('battery');
    if (this.engine === 'running') return;
    if (held && this.crankFail <= 0) {
      if (this.engine !== 'cranking') {
        this.engine = 'cranking';
        this.crankT = 0;
        const car = this.car.position;
        if (g.audio.ready && g.audio.uazCrank) this.crankSnd = g.audio.uazCrank(car.x, car.y + 0.9, car.z, has);
        if (g.sync) g.sync.ev('xk', has ? 1 : 3);
        g.playerNoise(car.x, car.z, has ? 0.42 : 0.08, 'engine');
      }
      this.crankT += dt;
      if (!has && this.crankT > 0.5) return this._crankStop('crankDead');
      if (has && this.crankT > 0.9 && Math.floor(this.crankT / 0.9) !== Math.floor((this.crankT - dt) / 0.9)) g.playerNoise(this.car.position.x, this.car.position.z, 0.42, 'engine');
      if (this.ready && this.crankT >= CRANK) {
        this._crankStop(null, true);
        this.startEngine(true);
        return;
      }
      if (!this.ready && this.crankT >= CRANK + 0.8) return this._crankStop(!this.has('can') ? 'crankDry' : 'crankNoCarb');
    } else if (this.engine === 'cranking') this._crankStop(null);
    if (this.crankFail > 0) this.crankFail -= dt;
    void me;
  }

  _crankStop(why, caught = false) {
    const g = this.g;
    if (this.crankSnd) {
      this.crankSnd.stop(caught ? 0.05 : 0.15);
      this.crankSnd = null;
    }
    if (this.engine === 'cranking') this.engine = 'dead';
    if (!caught && g.sync) g.sync.ev('xk', 0);
    if (why) {
      this.crankFail = 1.2;
      g.hud.popup(t(why), 'dim');
    }
  }

  netCrank(phase) {
    const g = this.g;
    const car = this.car.position;
    if (this.remoteCrank) {
      this.remoteCrank.stop(0.12);
      this.remoteCrank = null;
    }
    if ((phase === 1 || phase === 3) && g.audio.ready && g.audio.uazCrank) this.remoteCrank = g.audio.uazCrank(car.x, car.y + 0.9, car.z, phase === 1);
  }

  // it catches. (every machine — the one who started it says so)
  startEngine(mine = false) {
    const g = this.g;
    if (this.engine === 'running') return;
    if (this.remoteCrank) { this.remoteCrank.stop(0.05); this.remoteCrank = null; }
    this.engine = 'running';
    const car = this.car.position;
    if (g.audio.ready && g.audio.uazStart) this.engineSnd = g.audio.uazStart(car.x, car.y + 0.9, car.z);
    if (mine && g.sync) g.sync.ev('xe');
    g.noise(car.x, car.z, 0.72, 'engine', false, mine ? g.player.id : null);
    this.idleNoiseT = 2.5;
    g.addTrauma(0.15);
    g.hud.flashAlert(t('aEngine'), 'danger', 2.6);
    g.particles.burst(car.x - 0.5, car.y + 0.45, car.z - 2.1, 24, { color: [0.4, 0.4, 0.42], speed: 1.5, up: 0.8, life: 1.6, size: 0.12, gravity: 0.5, drag: 1.2 });
    if (this.mySeat === 0) {
      g.hud.setHint(t(g.input.touch ? 'hintGoTouch' : 'hintGo'));
      g.timeline.push({ at: g.time + 6, fn: () => g.hud.setHint(null) });
    }
  }

  // the driver: go. (a guest asks the host, who tells everyone)
  go() {
    const g = this.g;
    if (this.engine !== 'running' || this.mySeat !== 0 || this.cut) return;
    if (g.auth) this.hostDepart();
    else if (this.askT <= 0) {
      g.coop.toHost('xd', 1);
      this.askT = 1;
    }
  }

  hostDepart(byId = null) {
    const g = this.g;
    if (this.cut || this.engine !== 'running') return;
    if (byId && this.seats[0] !== byId) return;
    const seats = this.seats.slice();
    if (g.sync) g.sync.ev('xx', seats);
    this.depart(seats);
  }

  // ---------------- co-op: the snapshot ----------------
  netState() {
    return {
      p: this.parts.map((p) => [STATES.indexOf(p.state), p.holder || 0, p.seq, r2(p.settle ? p.settle.x1 : p.x), r2(p.settle ? p.settle.y1 : p.y), r2(p.settle ? p.settle.z1 : p.z)]),
      m: this.installed,
      s: this.seats.map((v) => v || 0),
      en: this.engine === 'running' ? 1 : 0,
    };
  }

  // someone's view of the yard: fitted parts stay fitted, a newer version of a part wins, the host's seats
  netMerge(e, fromHost) {
    if (!e || this.cut) return;
    const m = e.m | 0;
    for (let i = 0; i < 4; i++) if (m & (1 << i) && !(this.installed & (1 << i))) this.fit(i, 0, null);
    if (Array.isArray(e.p)) {
      e.p.forEach((a, i) => {
        const p = this.parts[i];
        if (!p || !Array.isArray(a) || p.state === 'in') return;
        const seq = a[2] | 0;
        if (seq <= p.seq) return;
        const st = STATES[a[0] | 0] || 'ground';
        if (st === 'in') return;
        if (st === 'held' && typeof a[1] === 'string' && this.g.playerById(a[1])) {
          this.take(p, a[1], seq);
          return;
        }
        if (![a[3], a[4], a[5]].every((v) => Number.isFinite(+v))) return;
        p.seq = seq;
        p.holder = null;
        p.roll = null;
        p.x = +a[3];
        p.z = +a[5];
        this._settleFrom(p, 0.2);
        p.settle.y1 = +a[4];
      });
    }
    if (fromHost && Array.isArray(e.s) && !this.g.auth) {
      const s = e.s.map((v) => (typeof v === 'string' ? v : null));
      if (s.join('|') !== this.seats.join('|')) this.netSeats(s);
    }
    if (e.en && this.engine !== 'running') this.startEngine(false);
  }

  // ---------------- per frame ----------------
  update(dt) {
    const g = this.g;
    this.askT -= dt;
    this._updateGate(dt);
    this._updateParts(dt);
    this._updateTraffic(dt);
    this._lampSizes();
    this._backLeaves(dt);
    // the hood comes down once the battery and the carburettor are in
    const shut = this.has('battery') && this.has('carb');
    if (shut && this.hood.rotation.z < -0.001) {
      const was = this.hood.rotation.z;
      this.hood.rotation.z = Math.min(0, was + dt * 2.6);
      if (this.hood.rotation.z >= 0 && was < 0 && g.audio.ready && g.audio.hoodSlam) {
        const p = this.carToWorld(-1.4, 1.1, 0, _v);
        g.audio.hoodSlam(p.x, p.y, p.z);
      }
    }
    // the engine idles: headlights on, a shiver, and every few seconds the forest hears it again
    if (this.engine === 'running' && !this.cut) {
      this.carBody.position.y = Math.sin(g.time * 71) * 0.004;
      this._headlights(1.15);
      if (g.auth) {
        this.idleNoiseT -= dt;
        if (this.idleNoiseT <= 0) {
          this.idleNoiseT = 2.6;
          g.noise(this.car.position.x, this.car.position.z, 0.36, 'engine');
        }
      }
    }
    // a seated friend who went down: out of the seat (a body in the back stays)
    for (let i = 0; i < 4; i++) {
      const id = this.seats[i];
      if (!id) continue;
      const p = g.playerById(id);
      if (!p) this.seats[i] = null;
    }
    // you, in a seat
    if (this.mySeat >= 0) this._seated(dt);
    this._viewModel(dt);
  }

  // far off, a sodium lamp still reads as a lamp: its glow never shrinks below a few degrees across
  _lampSizes() {
    const c = shared.uCam.value;
    for (const [core, halo, haze] of this.roadLamps) {
      const d = c.distanceTo(core.position);
      core.scale.setScalar(Math.max(core.userData.base, d * 0.016));
      halo.scale.setScalar(Math.max(halo.userData.base, d * 0.09));
      haze.scale.setScalar(Math.max(haze.userData.base, d * 0.3));
    }
  }

  _headlights(I) {
    for (const s of this.carLights) s.visible = I > 0;
    const p = this.carToWorld(-2.1, 0.85, 0, _v);
    const f = this.carToWorld(-3.1, 0.68, 0, _w).sub(p).normalize();
    shared.uHead.value.set(p.x, p.y, p.z, I);
    shared.uHeadD.value.copy(f);
  }

  _seated() {
    const g = this.g, me = g.player;
    const s = SEATS[this.mySeat];
    const eye = this.carToWorld(s.eye[0], s.eye[1], s.eye[2], _v);
    me.x = eye.x;
    me.z = eye.z;
    me.y = eye.y - me.eyeCur;
    me.vx = me.vz = 0;
    me.speed = 0;
    // you look about, but you're facing the way the car faces
    const fwd = this.car.rotation.y + PI / 2;
    let d = me.yaw - fwd;
    while (d > PI) d -= 2 * PI;
    while (d < -PI) d += 2 * PI;
    me.yaw = fwd + clamp(d, -1.9, 1.9);
  }

  // ---------------- monsters and the fence ----------------
  // a monster at (x, z) after (tx, tz) on the other side of the fence: by the gateway (if it's open)
  route(x, z, tx, tz) {
    const ain = inYard(x, z, 0.4), bin = inYard(tx, tz, 0.4);
    if (ain === bin || this.gate.open < 0.8) return null;
    const gx = this.Y.front.x, gz = this.Y.front.z;
    const near = ain ? { x: gx, z: gz + 2.4 } : { x: gx, z: gz - 2.4 };
    const far = ain ? { x: gx, z: gz - 2.4 } : { x: gx, z: gz + 2.4 };
    const lined = Math.abs(x - gx) < 3.3 && Math.abs(z - gz) < 2.8;
    if (!lined && Math.hypot(near.x - x, near.z - z) > 1.2) return near;
    return far;
  }

  // does the fence stand between these two (nothing reaches through chain-link)?
  blocks(ax, az, bx, bz) {
    const ain = inYard(ax, az, -0.15), bin = inYard(bx, bz, -0.15);
    if (ain === bin) return false;
    const gx = this.Y.front.x, gz = this.Y.front.z;
    const inGate = (x, z) => this.gate.open > 0.5 && Math.abs(x - gx) < 4 && Math.abs(z - gz) < 1.6;
    return !(inGate(ax, az) || inGate(bx, bz));
  }

  // ---------------- the E prompt ----------------
  consider(fn) {
    const g = this.g, me = g.player;
    if (this.cut) return;
    if (this.mySeat >= 0) {
      fn({ seat: this.mySeat }, me.x, me.z, 99, 'carSeat');
      return;
    }
    const held = this.held;
    if (!held && !me.carrying) {
      for (const p of this.parts) if (p.state === 'ground' || (p.state === 'roll' && p.roll && p.roll.v < 1.2)) fn(p, p.x, p.z, PICK_R, 'part');
    }
    if (held) {
      const s = this.slotPos(held.key, _v);
      fn({ fit: held }, s.x, s.z, SLOT_R, 'carFit');
    } else if (!me.carrying) {
      for (let i = 0; i < 4; i++) {
        if (this.seats[i]) continue;
        const d = this.carToWorld(SEATS[i].door[0], 0, SEATS[i].door[2], _w);
        fn({ door: i }, d.x, d.z, SEAT_R, 'carDoor');
      }
    }
    // the paper on the gate's drive unit, the log on the booth
    const yd = this.Y;
    fn({ note: 'gate' }, yd.sign.x, yd.sign.z, 1.6, 'carNote');
    fn({ note: 'log' }, yd.log.x, yd.log.z, 1.6, 'carNote');
  }

  // per frame while E points at one of ours. Returns nothing; sets the prompt
  interact(best, dt, held, pressed, still, T) {
    const g = this.g, hud = g.hud, o = best.obj;
    if (best.kind === 'part') {
      this.workT = 0;
      const wait = this.waitPick === o && this.askT > 0;
      hud.setUse(`${T('usePart')} ${t('carParts')[o.key]}`, wait ? 0.5 : 0, !wait);
      if (pressed) this.pick(o);
      return;
    }
    if (best.kind === 'carNote') {
      hud.setUse(T('useRead'), 0, true);
      if (pressed) this.readNote(o.note);
      return;
    }
    if (best.kind === 'carDoor') {
      const i = o.door;
      hud.setUse(T(i === 0 ? 'useDriver' : 'useSeat'), 0, true);
      if (pressed) this.sit(i);
      return;
    }
    if (best.kind === 'carFit') {
      const p = o.fit;
      if (held && still) {
        if (this.workKey !== p.key) { this.workKey = p.key; this.workT = 0; }
        this.workT += dt;
        this._workFx(p, dt);
      } else this.workT = Math.max(0, this.workT - dt * 2);
      hud.setUse(T('useFit').replace('{part}', t('carParts')[p.key]), this.workT / p.def.work, true);
      if (this.workT >= p.def.work) {
        this.workT = 0;
        this.install(p);
      }
      return;
    }
    if (best.kind === 'carSeat') {
      if (this.mySeat === 0) {
        if (this.engine === 'running') {
          hud.setUse(`${T('useGo')} · ${T('useOut')}`, 0, true);
          if (pressed) this.go();
        } else {
          hud.setUse(`${T('useCrank')} · ${T('useOut')}`, this.engine === 'cranking' ? clamp(this.crankT / CRANK, 0, 1) : 0, true);
          this._crank(dt, held);
        }
      } else {
        hud.setUse(T('useOutSeat'), 0, true);
        if (pressed) this.standUp();
      }
    }
  }

  // no E target this frame (let go of the key, walked off)
  idle(dt) {
    if (this.engine === 'cranking') this._crank(dt, false);
    if (this.workT > 0) this.workT = Math.max(0, this.workT - dt * 2);
  }

  _workFx(p, dt) {
    const g = this.g;
    this.workClank -= dt;
    if (this.workClank > 0) return;
    const at = SLOTS[p.key].at;
    const w = this.carToWorld(at[0], at[1], at[2], _v);
    const step = { wheel: 0.62, battery: 0.8, carb: 0.7, can: 0.45 }[p.key];
    this.workClank = step * (0.8 + Math.random() * 0.4);
    if (g.audio.ready && g.audio.partWork) g.audio.partWork(w.x, w.y, w.z, p.key);
    if (g.sync) g.sync.ev('xw', p.i);
    g.playerNoise(w.x, w.z, p.def.workLoud, 'part');
    g.addTrauma(p.key === 'wheel' ? 0.04 : 0.015);
  }

  remoteWork(i) {
    const p = this.parts[i | 0];
    const g = this.g;
    if (!p || !g.audio.ready || !g.audio.partWork) return;
    const at = SLOTS[p.key].at;
    const w = this.carToWorld(at[0], at[1], at[2], _v);
    g.audio.partWork(w.x, w.y, w.z, p.key);
  }

  readNote(which) {
    const g = this.g, ob = g.objectives;
    if (which === 'gate') {
      ob.openNote(t('noteGateKicker'), this.power ? t('noteGateOn') : t('noteGate'));
      return;
    }
    const where = (key) => {
      const p = this.parts.find((q) => q.key === key);
      if (p.state === 'in') return t('logFitted');
      return t('placeAt')[p.site] || '';
    };
    const text = t('noteLog').replace('{wheel}', where('wheel')).replace('{battery}', where('battery')).replace('{carb}', where('carb')).replace('{can}', where('can'));
    ob.openNote(t('noteLogKicker'), text);
    if (!this.knows) {
      this.knows = true;
      this.beaconT = 2;
    }
  }

  // the line under the peek: what's left to do once the gate is open
  taskText() {
    if (!this.power) return '';
    if (this.engine === 'running') return t('taskGo');
    if (this.ready) return t('taskStart');
    if (!this.inYardOnce) return t('taskYard');
    if (!this.knows) return t('taskLog');
    const left = this.parts.filter((p) => p.state !== 'in').map((p) => t('carParts')[p.key]);
    return t('taskParts').replace('{n}', this.count).replace('{list}', left.join(', '));
  }

  // ---------------- beacons ----------------
  beacons(dt) {
    const g = this.g, me = g.player;
    if (!this.power || !me.alive || this.cut || this.mySeat >= 0) return;
    if (inYard(me.x, me.z, -0.5)) this.inYardOnce = true;
    this.beaconT -= dt;
    if (this.beaconT > 0) return;
    let tx = null, tz = null, kind = 'car';
    const held = this.held;
    if (!this.inYardOnce || held || this.ready) {
      const c = held ? this.slotPos(held.key, _v) : this.car.position;
      tx = c.x;
      tz = c.z;
      if (!this.inYardOnce) { tx = this.Y.front.x; tz = this.Y.front.z; }
    } else if (this.knows) {
      let bd = 1e9;
      for (const p of this.parts) {
        if (p.state === 'in' || p.state === 'held') continue;
        const d = Math.hypot(p.x - me.x, p.z - me.z);
        if (d < bd) { bd = d; tx = p.x; tz = p.z; }
      }
      kind = '';
    }
    if (tx === null) { this.beaconT = 2; return; }
    const d = Math.hypot(tx - me.x, tz - me.z);
    this.beaconT = d < 15 ? 1.8 : 2.4 + 1.6 * clamp(d / 120, 0, 1);
    if (d < 2.5) return;
    const f = me.forward();
    const dx = tx - me.x, dz = tz - me.z;
    g.hud.beacon(Math.atan2(dx * -f.z + dz * f.x, dx * f.x + dz * f.z), d, kind);
    g.radar.blip(tx, tz, 'beacon');
  }

  // a sound wave just found something (the parts glint amber and tick back)
  onFront(s) {
    const g = this.g;
    for (const p of this.parts) {
      if (p.revealed || p.state === 'in' || p.state === 'held') continue;
      const d = Math.hypot(p.x - s.x, p.y - s.y, p.z - s.z);
      if (d > s.prevR && d <= s.curR && d <= s.radius) {
        p.revealed = true;
        g.audio.discover(p.x, p.y + 0.2, p.z);
        g.radar.blip(p.x, p.z, 'beacon');
      }
    }
  }

  // ---------------- the view: what's in your arms ----------------
  _viewModel(dt) {
    const a = this.viewAnim;
    const p = this.held;
    if (a.lift > 0) a.lift = Math.max(0, a.lift - dt * 3.2);
    if (a.throwT > 0) a.throwT -= dt;
    a.k = damp(a.k, p ? 1 : 0, 9, dt);
    this.viewPart = p;
  }

  placeView(camera, show) {
    const p = show ? this.viewPart : null;
    const a = this.viewAnim;
    if (!p || this.mySeat >= 0) {
      this.view.visible = false;
      return;
    }
    if (this.view.geometry !== p.geo) this.view.geometry = p.geo;
    const me = this.g.player;
    const bob = Math.sin(me.bobPhase || 0) * 0.018 * clamp(me.speed / 2, 0, 1);
    const lift = a.lift * a.lift;
    const heavy = p.key !== 'carb';
    const off = heavy ? { wheel: [0, -0.64, -0.8], battery: [0, -0.3, -0.56], can: [0.03, -0.38, -0.58] }[p.key] : [0.07, -0.19, -0.46];
    _v.set(off[0], off[1] - lift * 0.5 + bob + (1 - a.k) * -0.4, off[2]);
    this.view.position.copy(_v.applyMatrix4(camera.matrixWorld));
    this.view.quaternion.copy(camera.quaternion);
    this.view.quaternion.multiply(_q.setFromAxisAngle(UP, PI)).multiply(holdQuat(p.key, _q2));
    this.view.quaternion.multiply(_q.setFromAxisAngle(_u.set(1, 0, 0), heavy ? 0.12 + lift * 0.4 : 0.35));
    this.view.visible = a.k > 0.05;
  }

  // ---------------- remote friends: in a seat, with a part ----------------
  poseRemote(r) {
    const s = this.seats.indexOf(r.id);
    if (s >= 0) {
      this._seatRig(r.rig, s, !r.alive, s === 0);
      r.x = this.car.position.x;
      r.z = this.car.position.z;
      return true;
    }
    const p = this.heldBy(r.id);
    if (p && r.alive) poseCarryPart(r.rig, p.key !== 'carb');
    return false;
  }

  _seatRig(rig, s, down, driver) {
    const g = this.g;
    if (down) poseSlumped(rig, g.time);
    else poseSeated(rig, driver, g.time + s, this.steer || 0);
    const hip = this.carToWorld(SEATS[s].hip[0], SEATS[s].hip[1], SEATS[s].hip[2], _v);
    rig.root.position.copy(hip);
    rig.root.rotation.set(0, this.car.rotation.y - PI / 2, 0);
    rig.root.visible = true;
  }

  // ---------------- the highway's traffic ----------------
  _updateTraffic(dt) {
    const g = this.g;
    this.trafficT -= dt;
    if (this.trafficT <= 0 && this.traffic.length < 2) {
      this.trafficT = 14 + Math.random() * 30;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const R = CFG.ROAD;
      const c = { dir, x: dir > 0 ? R.x0 + 2 : R.x1 - 2, z: R.z + (dir > 0 ? 1.9 : -1.9), v: 19 + Math.random() * 8, passed: false };
      const geo = (this._trafficGeo ||= (() => {
        const b = new MeshBuilder(256);
        b.place(0, 0.62, 0);
        b.box(4.2, 0.7, 1.75, 25);
        b.place(0.25, 1.22, 0);
        b.box(2.2, 0.55, 1.6, 25);
        return b.toGeometry();
      })());
      c.mesh = new THREE.Mesh(geo, this.mat);
      c.lights = [];
      for (const [lx, color, sc] of [[2.1, 0xfff4dc, 0.9], [-2.1, 0xff3020, 0.5]]) {
        for (const lz of [-0.62, 0.62]) {
          const s = new THREE.Sprite(haloMaterial(color, lampTexture()));
          s.scale.setScalar(sc);
          s.material.opacity = 0.95;
          s.userData.off = [lx, 0.7, lz];
          c.lights.push(s);
          g.scene.add(s);
        }
      }
      g.scene.add(c.mesh);
      this.traffic.push(c);
    }
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const c = this.traffic[i];
      c.x += c.dir * c.v * dt;
      const y = this.roadY;
      c.mesh.position.set(c.x, y, c.z);
      c.mesh.rotation.y = c.dir > 0 ? 0 : PI;
      for (const s of c.lights) {
        const [lx, ly, lz] = s.userData.off;
        s.position.set(c.x + lx * c.dir, y + ly, c.z + lz);
      }
      // a whoosh as it passes the end of the cut (you hear it from the yard, faintly)
      if (!c.passed && Math.abs(c.x - CFG.PASS.x) < 50 && g.audio.ready && g.audio.carPass) {
        c.passed = true;
        g.audio.carPass(c.x, y + 0.6, c.z, c.dir, c.v);
      }
      if (c.x < CFG.ROAD.x0 - 5 || c.x > CFG.ROAD.x1 + 5) {
        this._dropCar(c);
        this.traffic.splice(i, 1);
      }
    }
  }

  _dropCar(c) {
    const s = this.g.scene;
    s.remove(c.mesh);
    for (const l of c.lights) {
      s.remove(l);
      l.material.dispose();
    }
  }

  // ---------------- the back gate's leaves (they fly open when the car goes through) ----------------
  _backLeaves(dt) {
    for (const L of this.backLeaves) {
      if (L.vel === 0 && L.ang === 0) continue;
      L.vel -= L.ang * 2.2 * dt; // a little spring in the hinges
      L.vel *= Math.exp(-1.6 * dt);
      L.ang += L.vel * dt;
      const lim = 2.0;
      if (Math.abs(L.ang) > lim) {
        L.ang = lim * Math.sign(L.ang);
        L.vel = -L.vel * 0.35;
      }
      L.mesh.rotation.y = (L.s < 0 ? 0 : PI) + L.ang * L.s;
    }
  }

  // ---------------- off we go: the fly-by ----------------
  depart(seats) {
    const g = this.g;
    if (this.cut) return;
    this.seats = seats.slice(0, 4).map((v) => (typeof v === 'string' ? v : null));
    this.mySeat = this.seats.indexOf(g.player.id);
    document.body.classList.remove('in-car');
    if (this.crankSnd) { this.crankSnd.stop(0.05); this.crankSnd = null; }
    if (this.engine !== 'running') this.startEngine(false);
    // the path out
    const pts = exitPath(g.world).map(([x, z]) => new THREE.Vector3(x, groundAt(g.world, x, z), z));
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    this.curveLen = this.curve.getLength();
    const gateZ = this.Y.z + BACK.z;
    let sGate = 0;
    for (let s = 0; s < 30; s += 0.25) {
      const p = this.curve.getPointAt(s / this.curveLen);
      if (p.z >= gateZ - 2.1) { sGate = s; break; }
    }
    let sTurn = 0;
    for (let s = sGate; s < this.curveLen; s += 0.5) {
      const p = this.curve.getPointAt(s / this.curveLen);
      if (p.z >= CFG.ROAD.z - 9) { sTurn = s; break; }
    }
    this.cut = { t: 0, s: 0, v: 0, sGate, sTurn, hit: false, yaw: this.car.rotation.y, cam: new THREE.Vector3(), look: new THREE.Vector3(), camInit: false, scream: false, merged: false, dawn: 0 };
    this.departed = true;
    // who's in the car (and you, if you are): sat in their seats for the ride
    this._dropCutRigs();
    this.cutRigs = [];
    for (let i = 0; i < 4; i++) {
      const id = this.seats[i];
      if (!id) continue;
      if (id === g.player.id) {
        const rig = buildSurvivor(myFit());
        const mat = createPersonMaterial(rig.dyes, 0xffffff);
        const meshes = dressPerson(rig, mat);
        g.scene.add(rig.root);
        this.cutRigs.push({ rig, mat, meshes, seat: i, down: !g.player.alive, own: true });
      } else {
        const r = g.remotes.get(id);
        if (r) this.cutRigs.push({ rig: r.rig, seat: i, down: !r.alive, own: false });
      }
    }
    g.startEscape(this.mySeat >= 0);
  }

  _dropCutRigs() {
    if (!this.cutRigs) return;
    for (const c of this.cutRigs) {
      if (!c.own) continue;
      if (c.rig.root.parent) c.rig.root.parent.remove(c.rig.root);
      undressPerson(c.meshes);
      c.mat.dispose();
    }
    this.cutRigs = null;
  }

  // the cutscene, one frame (every machine plays it the same)
  updateCut(dt) {
    const g = this.g, c = this.cut;
    if (!c) return false;
    c.t += dt;
    const T0 = 0.7;
    // speed: off the line, through the gate, up the cut, slow for the turn, then away
    let want;
    if (c.t < T0) want = 0;
    else if (c.s < c.sGate + 1) want = 9.5;
    else if (c.s < c.sTurn - 10) want = 13.5;
    else if (c.s < c.sTurn + 8) want = 7.5;
    else want = 27;
    const acc = want > c.v ? (c.s > c.sTurn ? 5.5 : 4.2) : 6;
    c.v = c.v < want ? Math.min(want, c.v + acc * dt) : Math.max(want, c.v - acc * dt);
    c.s = Math.min(this.curveLen - 0.5, c.s + c.v * dt);
    const u = c.s / this.curveLen;
    const pos = this.curve.getPointAt(u);
    const tan = this.curve.getTangentAt(u);
    const yawWant = Math.atan2(tan.z, -tan.x); // car-local −x is its nose
    let dy = yawWant - c.yaw;
    while (dy > PI) dy -= 2 * PI;
    while (dy < -PI) dy += 2 * PI;
    this.steer = clamp(dy * 3, -1, 1);
    c.yaw += dy * Math.min(1, dt * 8);
    // the car: on the ground, nose-up on the climb, a jolt at the gate
    const ahead = this.curve.getPointAt(Math.min(1, u + 1.5 / this.curveLen));
    const pitch = Math.atan2(groundAt(g.world, ahead.x, ahead.z) - pos.y, 1.5);
    this.car.position.set(pos.x, groundAt(g.world, pos.x, pos.z) + 0.04 + (c.hitT > 0 ? Math.sin(c.hitT * 40) * 0.03 * c.hitT : 0), pos.z);
    this.car.rotation.set(0, c.yaw, 0);
    this.car.rotateZ(-pitch * 0.9);
    this.carBody.position.y = Math.sin(c.t * 61) * 0.003 * (1 + c.v * 0.05);
    for (let i = 0; i < 4; i++) this.wheels[i].rotation.y -= (c.v / 0.39) * dt;
    this.steering.rotation.x = this.steer * 1.2;
    if (c.hitT > 0) c.hitT -= dt;
    // through the back gate
    if (!c.hit && c.s >= c.sGate) {
      c.hit = true;
      c.hitT = 0.6;
      c.v *= 0.7;
      for (const L of this.backLeaves) L.vel = 7.5;
      const gp = { x: this.Y.x, y: this.Y.y + 1, z: this.Y.z + BACK.z };
      if (g.audio.ready && g.audio.gateCrash) g.audio.gateCrash(gp.x, gp.y, gp.z);
      g.particles.burst(gp.x, gp.y, gp.z, 36, { color: [1, 0.85, 0.5], speed: 6, up: 2, life: 0.6, size: 0.05, gravity: -9, drag: 1 });
      g.addTrauma(0.45);
      g.pulses.emit(gp.x, gp.y, gp.z, g.time, { radius: 22, strength: 1.0, decay: 0.7, color: [0.9, 0.95, 1], kind: 'stone' });
    }
    // ...and they came, just too late: at the front gate, red in the wave
    if (!c.scream && c.t > 3.2) {
      c.scream = true;
      const fx = this.Y.front.x - 1.5, fz = this.Y.front.z - 2.5;
      const fy = g.world.terrain.height(fx, fz);
      g.audio.screech(fx, fy + 2.4, fz, 0.9);
      g.pulses.emit(fx, fy + 1.6, fz, g.time, { radius: 18, strength: 0.95, decay: 0.75, color: [1.0, 0.13, 0.08], kind: 'monster' });
      const rig = g.scareRig('listener');
      rig.root.position.set(fx, fy, fz);
      rig.root.rotation.set(0, Math.atan2(this.Y.x - fx, this.Y.z + 5 - fz), 0);
      rig.nodes.spine.rotation.x = 0.5;
      rig.nodes.jaw.rotation.x = 0.9;
      rig.root.updateMatrixWorld(true);
      g.ghosts.spawn(rig, g.time, { strength: 1.3, color: 0xff3020, life: 2.6, decay: 0.9 });
    }
    // the engine, the headlights, a trail of exhaust
    if (this.engineSnd && this.engineSnd.rev) this.engineSnd.rev(clamp(c.v / 25, 0, 1), this.car.position);
    this._headlights(1.6);
    this._lampSizes();
    c.exT = (c.exT || 0) - dt;
    if (c.exT <= 0) {
      c.exT = 0.08;
      const ex = this.carToWorld(2.15, 0.43, -0.52, _w);
      g.particles.burst(ex.x, ex.y, ex.z, 2, { color: [0.35, 0.35, 0.37], speed: 0.6, up: 0.5, life: 1.4, size: 0.1, gravity: 0.3, drag: 1.5 });
    }
    if (!c.merged && c.s > c.sTurn + 4) {
      c.merged = true;
      if (g.audio.ready && g.audio.escapeChord) g.audio.escapeChord();
    }
    // who's in it
    for (const r of this.cutRigs || []) {
      if (r.down) poseSlumped(r.rig, g.time);
      else poseSeated(r.rig, r.seat === 0, c.t + r.seat, this.steer);
      const hip = this.carToWorld(SEATS[r.seat].hip[0], SEATS[r.seat].hip[1], SEATS[r.seat].hip[2], _v);
      r.rig.root.position.copy(hip);
      _e.set(0, 0, 0);
      r.rig.root.quaternion.copy(this.car.quaternion).multiply(_q.setFromAxisAngle(UP, -PI / 2));
      r.rig.root.visible = true;
    }
    // first light, as the highway takes them
    c.dawn = smoothstep(9, 15.5, c.t) * 0.32;
    shared.uDawn.value = c.dawn;
    this._camera(dt);
    return c.t >= CUT_LEN;
  }

  // the fly-by: behind the car → by the back gate as it bursts through → a crane up the cut → wide over the highway
  _camera(dt) {
    const c = this.cut, car = this.car.position;
    const yaw = c.yaw;
    const fwd = _u.set(-Math.cos(yaw), 0, Math.sin(yaw)); // car-local −x in the world
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const camT = new THREE.Vector3(), lookT = new THREE.Vector3();
    const t1 = 2.9, t2 = 4.3, t3 = 9.4;
    if (c.t < t1) {
      camT.copy(car).addScaledVector(fwd, -5.2 - c.t * 0.4).addScaledVector(right, 1.6).add(_w.set(0, 1.7 + c.t * 0.15, 0));
      lookT.copy(car).addScaledVector(fwd, 6).add(_w.set(0, 0.9, 0));
    } else if (c.t < t2) {
      const gx = this.Y.x - 6.5, gz = this.Y.z + BACK.z + 3.5;
      camT.set(gx, this.Y.y + 1.5, gz);
      lookT.copy(car).add(_w.set(0, 0.9, 0));
    } else if (c.t < t3) {
      const k = smoothstep(t2, t3, c.t);
      camT.copy(car).addScaledVector(fwd, -9 - k * 6).addScaledVector(right, 3 - k * 2).add(_w.set(0, 3 + k * 13, 0));
      lookT.copy(car).addScaledVector(fwd, 10 + k * 8).add(_w.set(0, 0.5, 0));
    } else {
      const k = smoothstep(t3, CUT_LEN, c.t);
      const R = CFG.ROAD;
      camT.set(this.Y.x + 10 - k * 6, this.roadY + 7 + k * 14, R.z + 17 + k * 6);
      lookT.copy(car).add(_w.set(0, 0.6, 0));
    }
    const cut1 = c.t >= t1 && c.t - dt < t1, cut2 = c.t >= t2 && c.t - dt < t2;
    if (!c.camInit || cut1) {
      c.cam.copy(camT);
      c.look.copy(lookT);
      c.camInit = true;
    } else {
      const k = 1 - Math.exp(-dt * (c.t > t3 && c.t < t3 + 1.2 ? 2.2 : cut2 ? 2.5 : 6));
      c.cam.lerp(camT, k);
      c.look.lerp(lookT, 1 - Math.exp(-dt * 8));
    }
    // the camera can't go under the ground
    const gy = groundAt(this.g.world, c.cam.x, c.cam.z) + 0.6;
    if (c.cam.y < gy) c.cam.y = gy;
  }

  // the cutscene's camera, every frame of the cut (and after it, on the results screen)
  applyCutCamera(camera) {
    const c = this.cut;
    if (!c) return false;
    camera.position.copy(c.cam);
    camera.lookAt(c.look);
    const fov = 62;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    return true;
  }

  // after the screen goes dark: the car keeps going, the camera keeps watching
  afterCut(dt) {
    const c = this.cut;
    if (!c) return;
    c.t += dt * 0.5;
    c.s = Math.min(this.curveLen - 0.5, c.s + 20 * dt);
    const u = c.s / this.curveLen;
    const pos = this.curve.getPointAt(u);
    this.car.position.set(pos.x, groundAt(this.g.world, pos.x, pos.z) + 0.04, pos.z);
    this._headlights(1.6);
  }

  endCut() {
    shared.uHead.value.w = 0;
    if (this.engineSnd) { this.engineSnd.stop(2.5); this.engineSnd = null; }
  }
}
