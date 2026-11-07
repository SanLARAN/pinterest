// (5.0d) Chapter 3 of «Топь»: «Удар» — the crash, a film (docs/LEVEL2.md).
//
// The last of the dirt road. The arm is behind the car one more time: it lies across the ruts, sinks, rears up and
// comes down — just behind, the car has got away from it — the driver throws the wheel, the road runs out, and the
// pine at its end fills the windscreen. A white blow, the ring in your ears, black. Then pieces, the way you would
// remember it if you remembered it at all:
//   1  the wreck from the ground: one headlight still burning crooked into the trees, and two tall shapes coming
//      into it — one of them with a lantern
//   2  over a shoulder, head down: the ground going by in the swinging lantern light, the other shape behind
//   3  a post at your back, a rope pulled tight; the lantern goes out through the door
// and the chapter is over: chapter 4 wakes you tied up in that house.
//
// Like the convoy film it is a pure function of its clock (seek and skip land on the same frame on every machine)
// and owns the camera, the small lights and the picture's fade while it runs.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../core/rng.js';
import { shared, createWorldMaterial } from '../render/sonar.js';
import { buildFilmCar, disposeFilmCar, FILM_CARS } from './filmCar.js';
import { buildSurvivor, poseSeated, poseSlumped, poseCarried } from './survivor.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { PLAYER_HEX } from './remote.js';
import { myFit } from './outfit.js';
import { haloMaterial } from './glowsticks.js';
import { beaconTexture } from './roadTraffic.js';
import { CRASH, houseFor } from '../world/swamp.js';
import { RoadArm } from './roadArm.js';
import { MAIN, pointAt, chasePose, chasePhase, CHASE, yawOf } from './roadDrive.js';
import { MOON } from './convoyFilm.js';
import { KeeperBody, yawTo } from './keeper.js';


const PI = Math.PI;
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _look = new THREE.Vector3();
const _e = new THREE.Euler(0, 0, 0, 'YXZ');
const _ry = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -PI / 2);

// the film's clock (s)
export const CT = {
  rise: 0.95, // the arm starts up out of the ground behind
  slam: 1.9, // ...and comes down, just behind the car
  swerve: 2.45, // the wheel thrown over
  hit: 4.1, // the pine
  black: 4.4, // nothing
  frag: [[7.4, 10.4], [11.4, 14.2], [15.2, 18.0]], // the three pieces
  end: 18.8,
};
export const LEAD = 52; // m of road the film drives (it starts where chapter 2 ended)
export const STOP = 2.35; // m from the pine's middle to the car's: the nose in the trunk
const SWERVE = 1.5; // m the car goes aside at the wheel's throw

// the way the car goes: the end of the main road, then off its end into the pine — baked every 0.5 m
export function crashPath() {
  const pts = [];
  const s0 = MAIN.len - LEAD - 30; // (a stretch behind the start, for the arm to come out of)
  const p = {};
  for (let s = s0; s <= MAIN.len; s += 0.5) {
    pointAt(MAIN, s, p);
    pts.push({ x: p.x, z: p.z });
  }
  const end = pts[pts.length - 1];
  const dx = CRASH.x - end.x, dz = CRASH.z - end.z, L = Math.hypot(dx, dz);
  const stopX = CRASH.x - (dx / L) * STOP, stopZ = CRASH.z - (dz / L) * STOP;
  const n = Math.ceil((L - STOP) / 0.5);
  for (let i = 1; i <= n; i++) pts.push({ x: end.x + (stopX - end.x) * (i / n), z: end.z + (stopZ - end.z) * (i / n) });
  let d = 0;
  pts[0].d = 0;
  for (let i = 1; i < pts.length; i++) {
    d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    pts[i].d = d;
  }
  const len = d, start = len - (LEAD + (L - STOP));
  return { pts, len, start, stop: { x: stopX, z: stopZ } };
}

export class CrashFilm {
  constructor(game) {
    this.g = game;
    this.state = 'idle';
    this.done = false;
    this.t = 0;
    this.cues = {};
    this.cast = [];
    this.path = crashPath();
    this.dur = CT.end;
    this.v = (this.path.len - this.path.start) / CT.hit; // m/s into the pine
    // the house chapter 4 wakes you in (the last piece is inside it)
    const H0 = houseFor(game.baseSeed || 0, game.player?.slot | 0);
    this.house = (game.world?.houses || []).find((h) => h.id === H0.id) || null;
    this.door = (game.doors?.list || []).find((d) => d.id === H0.id) || null;
  }

  // ---------------- the car's way ----------------
  _at(d, o = {}) {
    const P = this.path.pts;
    d = clamp(d, 0, this.path.len);
    let lo = 0, hi = P.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (P[m].d < d) lo = m;
      else hi = m;
    }
    const a = P[lo], b = P[hi], f = b.d > a.d ? (d - a.d) / (b.d - a.d) : 0;
    o.x = a.x + (b.x - a.x) * f;
    o.z = a.z + (b.z - a.z) * f;
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    o.dx = (b.x - a.x) / L;
    o.dz = (b.z - a.z) / L;
    return o;
  }

  // the throw of the wheel: aside and back, gone by the time the nose reaches the trunk
  _swerve(tt) {
    const k = clamp((tt - CT.swerve) / (CT.hit - CT.swerve), 0, 1);
    return SWERVE * Math.sin(PI * k) * (1 - k * 0.35);
  }

  // the car at time tt: { x, y, z, yaw, pitch, roll, d, v }
  carAt(tt, o = {}) {
    const w = this.g.world;
    const run = Math.min(tt, CT.hit);
    const d = this.path.start + this.v * run;
    const p = this._at(d, {}), q = this._at(d + 0.6, {});
    const off = this._swerve(run), off2 = this._swerve(run + 0.6 / this.v);
    // left of the way it runs is (dz, −dx)
    const x = p.x + p.dz * off, z = p.z - p.dx * off;
    const x2 = q.x + q.dz * off2, z2 = q.z - q.dx * off2;
    o.x = x; o.z = z;
    o.yaw = yawOf(x2 - x, z2 - z);
    o.d = d;
    o.v = tt < CT.hit ? this.v : 0;
    o.y = w?.terrain ? w.terrain.height(x, z) : 0;
    o.pitch = 0;
    o.roll = 0;
    if (tt >= CT.hit) {
      // stopped dead in the trunk: slewed, the nose down, a list
      const k = smoothstep(CT.hit, CT.hit + 0.35, tt);
      o.yaw += 0.24 * k;
      o.pitch = 0.07 * k;
      o.roll = 0.05 * k;
    }
    return o;
  }

  // the arm behind: lying across the road when it begins, sinking, up again, and down — just behind
  armAt(tt) {
    if (tt >= CT.rise + CHASE.cycle - 0.05) return null;
    const first = tt < CT.rise;
    const u = first ? tt + (CHASE.cycle - CT.rise) : tt - CT.rise;
    const dT = first ? this.path.start - 14 : this.path.start + this.v * CT.slam - 6;
    const T = this._at(dT, {});
    const side = first ? 1 : -1; // out of the trees on one side, then the other
    const B = { x: T.x - T.dx * 7 + T.dz * 11 * side, z: T.z - T.dz * 7 - T.dx * 11 * side };
    return { T, B, u };
  }

  shotAt(tt) {
    if (tt < 1.75) return 'back';
    if (tt < 2.6) return 'slam';
    if (tt < CT.black) return 'ahead';
    const F = CT.frag;
    if (tt >= F[0][0] && tt < F[0][1]) return 'wreck';
    if (tt >= F[1][0] && tt < F[1][1]) return 'carried';
    if (tt >= F[2][0] && tt < F[2][1]) return 'post';
    return 'black';
  }

  // ---------------- begin / end ----------------
  begin() {
    this._clear();
    this.state = 'run';
    this.done = false;
    this.t = 0;
    this.cues = {};
    this.built = false;
    this.skipping = false;
    const g = this.g;
    g.fx.fade = 1;
    g.hud.setHint(null);
    g.hud.setUse(null);
    g.hud.setSkip(true, 'intro');
    if (typeof document !== 'undefined') document.body?.classList?.add('intro');
  }

  skip() {
    if (this.state !== 'run' || this.skipping) return;
    this.skipping = true;
    this.skipAt = this.t;
  }

  end() {
    if (this.state === 'done') return;
    this.state = 'done';
    this.done = true;
    this._clear();
  }

  _clear() {
    for (const a of this.cast) {
      undressPerson(a.meshes);
      a.rig.root.removeFromParent();
      a.mat.dispose();
    }
    this.cast.length = 0;
    if (this.car) { disposeFilmCar(this.car); this.car = null; }
    for (const h of this.halos || []) h.sp.material.dispose();
    this.halos = null;
    this.arm?.dispose(); this.arm = null;
    for (const k of this.keepers || []) k.dispose();
    this.keepers = null;
    this.mat?.dispose?.(); this.mat = null;
    this.engine?.stop(0.2); this.engine = null;
    this.ring?.stop(0.5); this.ring = null;
    shared.uHead.value.w = 0;
    if (this.door && this.doorOpen) { this.door.open = false; this.doorOpen = false; }
    if (typeof document !== 'undefined') document.body?.classList?.remove('intro');
  }

  // who rode in the car: the host drives, the rest by slot (as in chapter 2)
  _players() {
    const g = this.g;
    const me = { id: 'me', slot: (g.player.slot | 0) % 4, fit: myFit(), host: !g.online || !!g.auth, self: true };
    const out = [me];
    if (g.online) {
      const hid = g.coop?.hostId;
      for (const r of g.remotes.values()) out.push({ id: r.id, slot: (r.slot | 0) % 4, fit: r.fit, host: r.id === hid });
    }
    out.sort((a, b) => (b.host - a.host) || (a.slot - b.slot));
    return out.slice(0, 4);
  }

  _hostFit() {
    return this._players().find((p) => p.host)?.fit || myFit();
  }

  _build() {
    this.built = true;
    const g = this.g, scene = g.scene;
    this.mat = createWorldMaterial();
    this.car = buildFilmCar(this._hostFit());
    this.carId = this.car.userData.id;
    this.fc = FILM_CARS[this.carId];
    scene.add(this.car);
    const P = this.car.userData.M.P;
    this.halos = [...P.head.map((p, i) => ['head', p, i]), ...P.tail.map((p, i) => ['tail', p, i])].map(([type, p, i]) => {
      const sp = new THREE.Sprite(haloMaterial(type === 'head' ? 0xfff1d6 : 0xff2a1a, beaconTexture()));
      sp.position.set(p[0] + (type === 'head' ? -0.04 : 0.04), p[1], p[2]);
      sp.scale.setScalar(type === 'head' ? 1.6 : 0.7);
      sp.material.opacity = type === 'head' ? 1.3 : 0.8;
      this.car.userData.body.add(sp);
      return { sp, type, i };
    });
    this._players().forEach((p, seat) => {
      const rig = buildSurvivor(p.fit);
      rig.root.rotation.order = 'YXZ';
      const mat = createPersonMaterial(rig.dyes, PLAYER_HEX[p.slot % 4]);
      mat.uniforms.uShow.value = 1;
      const meshes = dressPerson(rig, mat);
      scene.add(rig.root);
      this.cast.push({ ...p, seat, rig, mat, meshes });
    });
    this.arm = new RoadArm(scene, this.mat);
    this.arm.mesh.visible = false;
    // the two that come: the keeper with his lantern, and a shape without one
    this.keepers = [new KeeperBody(scene), new KeeperBody(scene, { lantern: false, rim: 0x2c2a26 })];
  }

  // car-local → world (the body on its springs)
  _local(lx, ly, lz, out = _v) {
    const b = this.car.userData.body;
    b.updateMatrixWorld(true);
    return out.set(lx, ly, lz).applyMatrix4(b.matrixWorld);
  }

  _eye(seat, out = _w) {
    const hip = this.fc.seats[Math.min(seat, this.fc.seats.length - 1)].hip;
    return this._local(hip[0] - 0.05, hip[1] + (this.carId === 'trueno' ? 0.62 : 0.72), hip[2], out);
  }

  // ---------------- the frame ----------------
  update(dt, events) {
    if (this.state !== 'run') return;
    if (!this.built) this._build();
    const silent = this.seeking;
    this.seeking = false;
    if (!this.hold) this.t += dt;
    const tt = this.t, g = this.g;
    const ev = Array.isArray(events) ? events : [];
    if (!silent && g.auth && (ev.includes('confirm') || ev.includes('skip'))) this.skip();
    const c = this.carAt(tt);
    this._place(tt, c);
    this._crew(tt, c);
    this._arm(tt);
    this._keepers(tt, c);
    this._beams(tt, c);
    if (!silent) this._sound(tt, c);
    if (!silent) this._fx(tt, c);
    if (this.skipping) {
      g.fx.fade = Math.min(g.fx.fade, 1 - smoothstep(this.skipAt, this.skipAt + 0.8, tt));
      if (tt >= this.skipAt + 0.85) this.end();
      return;
    }
    g.fx.fade = this.fadeAt(tt);
    if (tt >= CT.end) this.end();
  }

  // the picture: up at once (chapter 2 ran into it), gone at the blow, and the pieces fading in and out of the black
  fadeAt(tt) {
    if (tt < CT.hit) return 1;
    if (tt < CT.black + 0.4) return 1 - smoothstep(CT.hit + 0.05, CT.black, tt);
    for (const [a, b] of CT.frag) {
      if (tt >= a && tt < b) return smoothstep(a, a + 0.55, tt) * (1 - smoothstep(b - 0.7, b, tt)) * 0.92;
    }
    return 0;
  }

  seek(tt) {
    this.t = tt;
    this.seeking = true;
    this.cues = Object.fromEntries(Object.keys(this.cues).map((k) => [k, true]));
  }

  _place(tt, c) {
    const U = this.car.userData;
    this.car.position.set(c.x, c.y, c.z);
    _e.set(c.roll, c.yaw, c.pitch, 'YXZ');
    this.car.quaternion.setFromEuler(_e);
    const steer = tt < CT.swerve ? 0 : tt < CT.hit ? -Math.cos(PI * clamp((tt - CT.swerve) / (CT.hit - CT.swerve), 0, 1)) * 0.5 : 0.3;
    const dist = this.v * Math.min(tt, CT.hit);
    U.wheels.forEach((w, i) => {
      w.rotation.z = dist / this.fc.wheelR;
      w.rotation.y = i < 2 ? steer * 0.42 : 0;
    });
    if (U.steer) U.steer.rotation.x = -steer * 1.8;
    // the body: the ruts, the lean out of the swerve, and after the blow, down at the nose
    const rough = tt < CT.hit ? 0.012 * Math.sin(tt * 17) : 0;
    U.pivot.rotation.set(-steer * 0.05 + rough, 0, tt < CT.hit ? 0.008 * Math.sin(tt * 13.3) : 0.04);
    this.car.updateMatrixWorld(true);
    // a headlight is dead after the blow, the other burns on
    for (const h of this.halos) {
      if (h.type === 'tail') h.sp.visible = tt < CT.hit + 0.2;
      else h.sp.visible = tt < CT.hit || h.i === 0;
      if (h.type === 'head' && h.i === 0 && tt >= CT.hit) h.sp.material.opacity = 0.8 + 0.25 * Math.sin(tt * 31) * Math.sin(tt * 7);
    }
    this.steer = steer;
  }

  _crew(tt, c) {
    const P = this.fc.pose, sh = this.shotAt(tt);
    for (const a of this.cast) {
      const seat = Math.min(a.seat, this.fc.seats.length - 1);
      if (tt < CT.hit) poseSeated(a.rig, seat === 0, tt + seat * 1.7, this.steer || 0, P ? (seat < 2 ? P.front : P.rear) : null);
      else poseSlumped(a.rig, tt + seat);
      const hip = this.fc.seats[seat].hip;
      this._local(hip[0], hip[1], hip[2], _w);
      a.rig.root.position.copy(_w);
      this.car.userData.body.getWorldQuaternion(_q);
      a.rig.root.quaternion.copy(_q).multiply(_ry);
      // my own head is the camera inside; in the pieces I am somewhere else than my seat
      a.rig.nodes.head.visible = !(a.self && (sh === 'back' || sh === 'ahead'));
      a.rig.root.visible = !(a.self && (sh === 'wreck' || sh === 'carried' || sh === 'post')) && sh !== 'post' && sh !== 'carried';
    }
    // in the second piece the shape behind carries the next of us (alone: nobody)
    if (sh === 'carried') {
      const other = this.cast.find((a) => !a.self);
      const K = this.keepers[1];
      if (other) {
        poseCarried(other.rig, Math.sin(tt * 3.4) * 0.6);
        const yaw = K.yaw, rx = Math.cos(yaw), rz = -Math.sin(yaw), fx = -Math.sin(yaw), fz = -Math.cos(yaw);
        other.rig.root.quaternion.identity();
        other.rig.root.position.set(K.x - rx * 0.24 + fx * 0.1, K.y + 1.56 * 1.2, K.z - rz * 0.24 + fz * 0.1);
        other.rig.root.rotation.set(0, yaw, 0);
        other.rig.root.visible = true;
      }
    }
  }

  _arm(tt) {
    const a = this.armAt(tt);
    this.arm.mesh.visible = !!a && !(chasePhase(a.u).ph === 'sink' && chasePhase(a.u).k > 0.95);
    if (!this.arm.mesh.visible) return;
    const ground = (x, z) => this.g.world.terrain.height(x, z);
    this.arm.bend((this._cp = chasePose(a.T, a.B, a.u, tt, ground, this._cp)));
    this.armView = a;
  }

  // where the house piece happens: the post, the doorway (a stand-in when the house is unknown)
  _housePts() {
    const H = this.house;
    if (!H) return { post: { x: CRASH.x - 30, z: CRASH.z - 30 }, door: { x: CRASH.x - 26, z: CRASH.z - 26 }, out: { x: CRASH.x - 24, z: CRASH.z - 24 }, y: 0 };
    const d = this.door;
    return { post: H.post, door: d ? d.mid : { x: H.x, z: H.z }, out: d ? d.out : { x: H.x, z: H.z + H.D }, inn: d ? d.inn : { x: H.x, z: H.z }, y: H.y + 0.2 };
  }

  _keepers(tt, c) {
    const [A, B] = this.keepers, sh = this.shotAt(tt), w = this.g.world;
    A.lit = 1;
    const ground = (x, z) => w.terrain.height(x, z);
    A.setVisible(false);
    B.setVisible(false);
    if (sh === 'wreck') {
      // out of the dark on the camera's side into the burning headlight; the other by the bonnet
      const [a0] = CT.frag[0];
      const k = smoothstep(a0 + 0.3, a0 + 2.6, tt);
      const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
      const L = (lx, lz) => ({ x: c.x + lx * cy + lz * sy, z: c.z - lx * sy + lz * cy }); // car-local (nose −x, left +z)
      const from = L(4.5, 9), to = L(0.2, 2.6);
      const x = lerp(from.x, to.x, k), z = lerp(from.z, to.z, k);
      A.place(x, ground(x, z), z, yawTo(from.x, from.z, to.x, to.z));
      A.pose({ phase: tt * 4.2, speed: k < 1 ? 1.6 : 0, raise: smoothstep(a0 + 2.2, a0 + 2.9, tt), t: tt });
      A.setVisible(true);
      const b = L(-3.4, -1.6);
      B.place(b.x, ground(b.x, b.z), b.z, yawTo(b.x, b.z, c.x, c.z));
      B.pose({ t: tt, kneel: smoothstep(a0 + 1.0, a0 + 2.0, tt) * 0.6 });
      B.setVisible(true);
    } else if (sh === 'carried') {
      // across the field toward the village, you over his shoulder; the other behind with whoever is next
      const hp = this._housePts().post;
      const [a0, a1] = CT.frag[1];
      const dx = hp.x - CRASH.x, dz = hp.z - CRASH.z, L = Math.hypot(dx, dz) || 1;
      const k = (tt - a0) / (a1 - a0);
      const along = 0.4 * L + k * 4.5;
      const x = CRASH.x + (dx / L) * along, z = CRASH.z + (dz / L) * along;
      const yaw = yawTo(CRASH.x, CRASH.z, hp.x, hp.z);
      A.place(x, ground(x, z), z, yaw);
      A.pose({ phase: tt * 4.4, speed: 1.6, carry: true, t: tt });
      A.setVisible(true);
      const bx = x - (dx / L) * 4.2 + (dz / L) * 1.2, bz = z - (dz / L) * 4.2 - (dx / L) * 1.2;
      B.place(bx, ground(bx, bz), bz, yaw);
      B.pose({ phase: tt * 4.4 + 1.3, speed: 1.6, carry: this.cast.some((a2) => !a2.self), t: tt });
      B.setVisible(true);
    } else if (sh === 'post') {
      // he gets up off the knot and goes out through the door with the light
      const P = this._housePts();
      const [a0, a1] = CT.frag[2];
      const up = smoothstep(a0 + 0.2, a0 + 1.0, tt), go = smoothstep(a0 + 0.9, a1 - 0.3, tt);
      const tdx = P.door.x - P.post.x, tdz = P.door.z - P.post.z, tl = Math.hypot(tdx, tdz) || 1;
      const sx = P.post.x + (tdx / tl) * 0.35 + (tdz / tl) * 0.8, sz = P.post.z + (tdz / tl) * 0.35 - (tdx / tl) * 0.8;
      const mid = P.inn || P.door;
      const k1 = clamp(go * 1.6, 0, 1), k2 = clamp(go * 1.6 - 1, 0, 1);
      const x = k2 > 0 ? lerp(mid.x, P.out.x, k2) : lerp(sx, mid.x, k1), z = k2 > 0 ? lerp(mid.z, P.out.z, k2) : lerp(sz, mid.z, k1);
      A.place(x, P.y || ground(x, z), z, go > 0.02 ? yawTo(P.post.x, P.post.z, P.out.x, P.out.z) : yawTo(x, z, P.post.x, P.post.z));
      A.pose({ phase: tt * 4, speed: go > 0.02 && go < 0.98 ? 1.5 : 0, kneel: 1 - up, t: tt });
      A.setVisible(true);
      A.lit = 1 - smoothstep(a1 - 1.0, a1 - 0.2, tt) * 0.7;
    }
    // the door of that house stands open while he goes, and swings shut behind him (doors.update closes it)
    const d = this.door;
    if (d) {
      const open = sh === 'post' && tt < CT.frag[2][1] - 0.5;
      if (open !== !!this.doorOpen) { this.doorOpen = open; d.open = open; d.dir = 1; d.mode = 'creak'; }
    }
  }

  _beams(tt, c) {
    const H = shared.uHead.value;
    // the nose is local −x: forward is (−cos yaw, sin yaw)
    let fx = -Math.cos(c.yaw), fz = Math.sin(c.yaw);
    if (tt < CT.hit) {
      H.set(c.x + fx * 2.1, c.y + 0.85, c.z + fz * 2.1, 1.7);
      shared.uHeadD.value.set(fx, -0.07, fz).normalize();
    } else {
      // one lamp, knocked crooked, flickering
      const a = c.yaw + 0.5, fl = 0.75 + 0.25 * Math.sin(tt * 31) * Math.sin(tt * 7.3);
      fx = -Math.cos(a); fz = Math.sin(a);
      H.set(c.x - Math.cos(c.yaw) * 2.0, c.y + 0.7, c.z + Math.sin(c.yaw) * 2.0, this.shotAt(tt) === 'wreck' ? 1.1 * fl : 0);
      shared.uHeadD.value.set(fx, 0.06, fz).normalize();
    }
  }

  lightSources(out) {
    if (this.state !== 'run' || !this.built) return;
    const tt = this.t, sh = this.shotAt(tt), c = this.carAt(tt);
    if (sh !== 'post') out.push({ x: MOON.x, y: MOON.y, z: MOON.z, I: MOON.I, c: MOON.c, R: MOON.R, prio: 9, near: 2, id: 'moon' });
    if (tt < CT.hit) {
      const D = this.car.userData.M.P.dash;
      this._local(D[0], D[1] + 0.05, 0, _w);
      out.push({ x: _w.x, y: _w.y, z: _w.z, I: 0.4, c: [0.55, 0.95, 0.85], R: 1.9, prio: 3, near: 0.05, id: 'dash' });
      const fx = -Math.cos(c.yaw), fz = Math.sin(c.yaw);
      out.push({ x: c.x - fx * 2.4, y: c.y + 0.9, z: c.z - fz * 2.4, I: 0.95, c: [1, 0.14, 0.08], R: 11, prio: 2, near: 0.2, id: 'tail', dir: [-fx, -0.12, -fz], cone: 0.35 });
    }
    const a = this.arm?.mesh.visible ? this.armView : null;
    if (a) {
      const mx = (a.T.x + a.B.x) / 2, mz = (a.T.z + a.B.z) / 2;
      out.push({ x: mx, y: this.g.world.terrain.height(mx, mz) + 9, z: mz, I: 1.3, c: [0.9, 0.16, 0.1], R: 26, prio: 1, near: 3, id: 'chase' });
    }
    for (const K of this.keepers || []) {
      if (!K.rig.root.visible) continue;
      const L = K.light(tt);
      if (L) out.push(L);
    }
  }

  // ---------------- sound and the blows ----------------
  _sound(tt, c) {
    const au = this.g.audio;
    if (!au) return;
    const hit = (key, at, fn) => { if (tt >= at && !this.cues[key]) { this.cues[key] = true; fn(); } };
    hit('engine', 0, () => { this.engine = au.uazStart?.(c.x, c.y + 0.7, c.z, this.carId) || null; });
    if (this.engine && tt < CT.hit) this.engine.rev(0.85 + 0.1 * Math.sin(tt * 3), { x: c.x, y: c.y, z: c.z });
    const a = this.armAt(Math.max(tt, CT.rise));
    hit('groan', CT.rise + 0.1, () => a && au.armGroan?.(a.B.x, c.y + 4, a.B.z, 0.9));
    hit('slam', CT.slam, () => a && au.armSlam?.(a.T.x, c.y + 0.5, a.T.z, 1));
    hit('screech', CT.swerve, () => au.tyreScreech?.(c.x, c.y, c.z, 1.3));
    hit('crash', CT.hit, () => {
      this.engine?.stop(0.05); this.engine = null;
      au.crashSmash?.(c.x, c.y + 0.8, c.z);
      this.ring = au.ringing?.() || null;
    });
    if (this.ring) this.ring.set(tt < CT.frag[0][0] ? 1 : 1 - smoothstep(CT.frag[0][0], CT.frag[2][1], tt) * 0.85);
    for (const [i, at] of [5.2, 6.1, 9.0, 13.0, 16.4].entries()) hit('beat' + i, at, () => au.heartbeat?.(0.55));
    // the pieces: boots on the ground, the lantern's bail, the rope
    const [A] = this.keepers;
    const F = CT.frag;
    for (let k = 0; k < 6; k++) hit('stepW' + k, F[0][0] + 0.5 + k * 0.42, () => au.keeperStep?.(A.x, A.y, A.z, 0.8));
    hit('squeak0', F[0][0] + 2.4, () => au.lanternSqueak?.(A.x, A.y + 1.6, A.z));
    for (let k = 0; k < 6; k++) hit('stepC' + k, F[1][0] + 0.3 + k * 0.46, () => au.keeperStep?.(A.x, A.y, A.z, 1));
    hit('squeak1', F[1][0] + 1.2, () => au.lanternSqueak?.(A.x, A.y + 1.4, A.z));
    hit('tie', F[2][0] + 0.25, () => au.ropeTie?.(A.x, A.y + 0.6, A.z, 1));
    for (let k = 0; k < 4; k++) hit('stepP' + k, F[2][0] + 1.3 + k * 0.5, () => au.keeperStep?.(A.x, A.y, A.z, 0.7));
    hit('ringOff', CT.end - 0.6, () => { this.ring?.stop(1.2); this.ring = null; });
  }

  _fx(tt, c) {
    const g = this.g;
    const hit = (key, at, fn) => { if (tt >= at && !this.cues[key]) { this.cues[key] = true; fn(); } };
    const a = this.armAt(Math.max(tt, CT.slam));
    hit('fxSlam', CT.slam, () => {
      g.addTrauma?.(0.55);
      g.fx.glitch = Math.max(g.fx.glitch, 0.35);
      if (a) {
        g.pulses?.emit(a.T.x, c.y + 0.5, a.T.z, g.time, { radius: 50, strength: 1, speed: 34, decay: 0.6, color: [1, 0.5, 0.4], kind: 'shard' });
        g.particles?.burst(a.T.x, c.y + 0.4, a.T.z, 50, { color: [0.35, 0.3, 0.26], speed: 6, life: 1.3, size: 0.09, gravity: -9, drag: 0.7 });
      }
    });
    hit('fxSwerve', CT.swerve + 0.2, () => g.addTrauma?.(0.3));
    hit('fxHit', CT.hit, () => {
      g.fx.white = Math.max(g.fx.white, 0.85);
      g.fx.glitch = Math.max(g.fx.glitch, 0.8);
      g.fx.shockT = 0;
      g.fx.shockAmp = 1;
      g.addTrauma?.(1);
      g.particles?.burst(CRASH.x, c.y + 1.2, CRASH.z, 70, { color: [0.8, 0.88, 1], speed: 6, life: 1, size: 0.05, gravity: -9, drag: 0.6 });
      g.particles?.burst(CRASH.x, c.y + 4, CRASH.z, 40, { color: [0.2, 0.3, 0.18], speed: 3, life: 2.2, size: 0.08, gravity: -3, drag: 0.9 }); // needles
    });
  }

  // ---------------- the camera ----------------
  cameraAt(tt) {
    const c = this.carAt(tt, {}), sh = this.shotAt(tt), w = this.g.world;
    const gy = (x, z) => w.terrain.height(x, z);
    const fx = -Math.cos(c.yaw), fz = Math.sin(c.yaw);
    let p, l, fov = 62, roll = 0, inCar = false;
    if (sh === 'back') {
      // riding over the windscreen, looking back over the roof: the tail lamps on the ruts, and the arm rearing up
      // right behind in its own red light
      const bx = c.x + fx * 1.6, bz = c.z + fz * 1.6;
      p = [bx, c.y + 2.7, bz];
      const a = this.armAt(tt), up = smoothstep(0.9, 1.75, tt);
      const tx = a ? a.T.x : c.x - fx * 12, tz = a ? a.T.z : c.z - fz * 12;
      l = [tx - fx * 2, c.y + 1.2 + up * 6, tz - fz * 2];
      inCar = true; // (it rides with the car: no ground clamp, the car's own shake)
      fov = 70;
    } else if (sh === 'slam') {
      // low by the road where it comes down: the car racing away from it
      const a = this.armAt(CT.slam);
      const sx = a.T.dz, sz = -a.T.dx; // left of the road
      p = [a.T.x + sx * 6.5 - a.T.dx * 5, gy(a.T.x, a.T.z) + 1.1, a.T.z + sz * 6.5 - a.T.dz * 5];
      l = [c.x, c.y + 1, c.z];
      fov = 58;
    } else if (sh === 'ahead') {
      // the driver's eyes: the pine coming
      const e = this._eye(0, _w);
      p = [e.x, e.y, e.z];
      l = [e.x + fx * 10, e.y - 0.3, e.z + fz * 10];
      inCar = true;
      fov = 62 + smoothstep(CT.swerve, CT.hit, tt) * 8;
      roll = this._swerve(tt) * -0.08;
    } else if (sh === 'wreck') {
      // from the ground beside it, where you were thrown
      const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
      const L = (lx, lz) => [c.x + lx * cy + lz * sy, c.z - lx * sy + lz * cy];
      const [x, z] = L(3.4, 5.6), [tx, tz] = L(-0.4, 0.4);
      const k = (tt - CT.frag[0][0]) / (CT.frag[0][1] - CT.frag[0][0]);
      p = [x, gy(x, z) + 0.32, z];
      l = [tx, gy(tx, tz) + 1.0 + k * 0.4, tz];
      fov = 54;
      roll = 0.32 - k * 0.08;
    } else if (sh === 'carried') {
      // head down over his shoulder: the ground going by behind him
      const A = this.keepers[0];
      const yaw = A.yaw, bx = Math.sin(yaw), bz = Math.cos(yaw); // behind him
      const sway = Math.sin(tt * 4.4) * 0.08;
      p = [A.x + bx * 0.4, A.y + 1.5, A.z + bz * 0.4];
      l = [A.x + bx * 3.2 + sway, A.y + 0.1, A.z + bz * 3.2];
      fov = 64;
      roll = 2.6 + sway * 2;
    } else if (sh === 'post') {
      // tied to the post: the doorway, and his light going out of it
      const P = this._housePts();
      const ex = P.post.x + (P.door.x - P.post.x) * 0.07, ez = P.post.z + (P.door.z - P.post.z) * 0.07;
      p = [ex, (P.y || gy(ex, ez)) + 0.95, ez];
      l = [P.door.x, (P.y || gy(ex, ez)) + 1.0, P.door.z];
      fov = 60;
      roll = 0.12;
    } else {
      // black: hold on the last place (nothing is seen)
      p = [c.x, c.y + 1.5, c.z];
      l = [CRASH.x, c.y + 1.5, CRASH.z];
    }
    if (!inCar && p[1] < gy(p[0], p[2]) + 0.25) p[1] = gy(p[0], p[2]) + 0.25;
    return { p, l, fov, roll, inCar, kind: sh };
  }

  applyCamera(camera) {
    if (this.state !== 'run' || !this.built) return false;
    const tt = this.t, c = this.cameraAt(tt);
    camera.position.set(c.p[0], c.p[1], c.p[2]);
    _look.set(c.l[0], c.l[1], c.l[2]);
    camera.lookAt(_look);
    camera.rotateZ(c.roll + (c.inCar ? Math.sin(tt * 19) * 0.006 : Math.sin(tt * 0.9) * 0.004));
    if (Math.abs(camera.fov - c.fov) > 0.01) {
      camera.fov = c.fov;
      camera.updateProjectionMatrix();
    }
    this.camPos = { x: c.p[0], y: c.p[1], z: c.p[2] };
    return true;
  }
}
