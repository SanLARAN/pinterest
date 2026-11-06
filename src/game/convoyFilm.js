// «Топь», chapter 1 (5.0b): «Кортеж». The night highway in the host's car, the radio on; a lorry comes the other
// way; a convoy — police, the ambulance, two fire engines, police — comes up behind with everything flashing and
// goes by; the crew rolls on; at the lit junction ahead the road is shut: the arm lies across it, the convoy round
// it, a queue in front of you. You wait. It is a long wait. Then the arm moves — up, and down on the police car,
// and along the road through the rest — and the driver puts the car off the highway into the forest.
//
// Everything is a function of the film's time (carAt, convoyAt, armPose, cameraAt): a seek, a skip, a guest's
// machine — the same frame. Light is the film's whole language here: nothing is seen at night unless something
// lights it, so every shot is built round its lights — the car's own beams (the shader's uHead), the junction's
// sodium lamps (uRoad, turned on by the level), and up to five small lights a frame (beacons, the floodlight, a
// torch, the dash) handed to the shader's slots through GlowSticks.lightSources (game/level2.js → lightSources).
// Enter (the host's, in co-op) skips it.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../core/rng.js';
import { shared, createWorldMaterial } from '../render/sonar.js';
import { buildFilmCar, disposeFilmCar, FILM_CARS } from './filmCar.js';
import { buildSurvivor, poseSeated, poseSurvivor } from './survivor.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { PLAYER_HEX } from './remote.js';
import { myFit, cleanFit } from './outfit.js';
import { haloMaterial } from './glowsticks.js';
import { beaconTexture } from './roadTraffic.js';
import { HIGHWAY } from '../world/swamp.js';
import { Vehicle, LAMP_HEX, LAMP_RGB } from './convoyCast.js';
import { RoadArm, armSAt } from './roadArm.js';

const PI = Math.PI;
const HY = HIGHWAY.y, LANE = HIGHWAY.lane, ONC = HIGHWAY.oncoming;
export const SHOULDER = 330.35; // pulled over to let the convoy by
export const STOP_X = 22; // where the car stops in the queue: the turn-off is right beside it
export const PASS_X0 = 364; // the convoy's lead, when the pass begins
export const COLUMN = ['police', 'ambulance', 'fire', 'fire', 'police']; // front to back
export const GAP = 20; // m between them
// where they stand at the blockade (x, z, yaw: nose −x at 0), the queue, and the three people of the cordon
export const STAGE = [
  { x: -31, z: 331.4, yaw: 0.55 }, // the lead police car, across the north lane — under the arm
  { x: -21.5, z: 329.4, yaw: -0.08 }, // the ambulance, on the north shoulder
  { x: -27, z: 336.4, yaw: 0.02, mast: true }, // a fire engine in the south lane, its mast up, the lamp on the arm
  { x: -15, z: 336.5, yaw: 0.06 }, // the second engine
  { x: -9, z: 333.8, yaw: -0.8 }, // the police car behind, slewed across the middle
];
export const QUEUE = { lorry: { x: 4, z: LANE }, sedan: { x: 15.2, z: LANE } };
// the moon's light (see lightSources)
export const MOON = { x: -160, y: 260, z: 560, I: 0.3, c: [0.5, 0.64, 1], R: 1100 };

// the fixed beats (s), before the arrival is baked; the rest follow the stop (see timeline())
export const T0 = {
  radio: 8.6, meet: 12.2, mirror: 15, pass: 21, passEnd: 33, chill: 33, drone: 37, arrive: 41,
};

// every beat after the car stops, from the moment it stops
export function timeline(stop) {
  const T = { ...T0, stop };
  T.reveal = stop + 0.6;
  T.faces = stop + 6.4;
  T.worker = stop + 10.6;
  T.still = stop + 15.6;
  T.close = stop + 21.0;
  T.twitch = stop + 22.4;
  T.wake = stop + 25.2;
  T.lift = stop + 25.6;
  T.slam = T.lift + 2.9;
  T.sweep = T.slam + 0.8;
  T.chaos = T.slam + 1.2;
  T.tip = T.slam + 1.9;
  T.go = T.slam + 4.3;
  T.rear = T.go + 3.9;
  T.truck = T.go + 5.0;
  T.forest = T.go + 6.9;
  T.end = T.go + 11.3;
  T.fade = T.end - 1.7;
  return T;
}

// the shot list: what the camera does, when
export function shotList(T) {
  return [
    { k: 'open', t0: 0, t1: 7 }, // low on the centre line, a long lens: the car out of the dark, past, gone
    { k: 'cabin', t0: 7, t1: T.mirror }, // in the back between the seats: the road in the beams, the lorry coming
    { k: 'mirror', t0: T.mirror, t1: T.pass }, // at the driver's window, looking back: lights on the road behind
    { k: 'rearwin', t0: T.pass, t1: 25.2 }, // the back window filling with blue and red
    { k: 'verge', t0: 25.2, t1: 30.2 }, // on the verge behind the rail: the column goes by, the car pulled over
    { k: 'follow', t0: 30.2, t1: T.passEnd }, // behind, above: their lights running away down the road
    { k: 'faces', t0: T.chill, t1: T.drone }, // the dash looking back at the two in front: the radio, a shrug
    { k: 'drone', t0: T.drone, t1: T.arrive }, // high behind: the dark road, the junction's lamps far ahead
    { k: 'arrive', t0: T.arrive, t1: T.reveal }, // through the windscreen into the lamps, the brake lights, the beacons
    { k: 'reveal', t0: T.reveal, t1: T.faces }, // low at the cordon: the arm across the road, up it
    { k: 'facesW', t0: T.faces, t1: T.worker }, // the crew, the beacons on their faces
    { k: 'worker', t0: T.worker, t1: T.still }, // a policeman with a torch walks up to it
    { k: 'still', t0: T.still, t1: T.close }, // the whole of it, from behind the queue: nothing moves
    { k: 'close', t0: T.close, t1: T.wake }, // the torch on the flesh … and something runs under it
    { k: 'wake', t0: T.wake, t1: T.chaos }, // up, over, down on the police car
    { k: 'chaos', t0: T.chaos, t1: T.go }, // by the car: people running at us, the ambulance rolling, the tip rising
    { k: 'turn', t0: T.go, t1: T.rear }, // in the car: the wheel over, off the highway, into the trees
    { k: 'rearwin2', t0: T.rear, t1: T.forest }, // the back window: the lorry goes under the tip
    { k: 'forest', t0: T.forest, t1: T.end + 1 }, // above, behind: the beams tunnelling into the forest
  ];
}

// the turn into the forest: off the north lane, through the gap in the rail, down onto the dirt road
export const TURN_PATH = [[STOP_X, LANE], [20.5, 330.7], [19.3, 328.6], [18.4, 325.3], [17.0, 319], [14.8, 307], [12.2, 290], [6.5, 274], [0, 258], [-6, 246]];

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _e = new THREE.Euler(0, 0, 0, 'YXZ');
const _look = new THREE.Vector3();
const bell = (x, w) => Math.exp(-(x / w) * (x / w));

export class ConvoyFilm {
  constructor(game) {
    this.g = game;
    this.state = 'idle';
    this.done = false;
    this.t = 0;
    this.cues = {};
    this.cast = [];
    this.people = [];
    this.cars = [];
    this.pose = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, v: 0, dist: 0 };
    this._bakePass();
    this._bakeArrival();
    this.T = timeline(this.tStop);
    this.T.sRoad = armSAt(HIGHWAY.block, HIGHWAY.z); // where along the arm the road is
    this.T.sCar = this.T.sRoad - 0.04; // ...and the part of it that comes down on the police car
    this._bakeTurn();
    this.shots = shotList(this.T);
    this.dur = this.T.end;
  }

  // ---------------- the car's way ----------------
  _ground(x, z) {
    const w = this.g.world;
    const h = w?.terrain ? w.terrain.height(x, z) : HY;
    return Math.abs(z - HIGHWAY.z) < HIGHWAY.w / 2 + 0.3 ? Math.max(h, HY) : h;
  }

  // the pass: 22 m/s, braking onto the shoulder to 10, holding, back up to 21 — baked every 1/60 s from T0.pass
  _bakePass() {
    const X = [285];
    let x = 285;
    for (let i = 1; i <= 12 * 60; i++) {
      const t = T0.pass + i / 60;
      const v = t < 22 ? 22 : t < 24.5 ? lerp(22, 10, (t - 22) / 2.5) : t < 29.5 ? 10 : lerp(10, 21, clamp((t - 29.5) / 3.5, 0, 1));
      x -= v / 60;
      X.push(x);
    }
    this.passX = X;
  }

  // into the junction: from 150 m out at 18 m/s, braking to a stop at STOP_X behind the Lada
  _bakeArrival() {
    const x0 = 150, L = x0 - STOP_X, a = 1.7;
    const S = [0];
    let s = 0, v = 18;
    for (let i = 0; i < 60 * 40; i++) {
      const want = Math.min(18, Math.sqrt(2 * a * Math.max(0, L - s)));
      v = v < want ? Math.min(want, v + 2 / 60) : Math.max(want, v - 3 / 60);
      s = Math.min(L, s + v / 60);
      S.push(s);
      if (L - s < 0.02 || (v < 0.05 && L - s < 0.4)) break;
    }
    S[S.length - 1] = L;
    this.arrS = S;
    this.arrX0 = x0;
    this.tStop = T0.arrive + (S.length - 1) / 60;
  }

  // off the highway: from a standstill, hard into the turn (it is tight: 5.5 m/s), then away up the dirt road
  _bakeTurn() {
    const pts = TURN_PATH.map(([x, z]) => new THREE.Vector3(x, this._ground(x, z), z));
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    this.L = this.curve.getLength();
    const S = [0];
    let s = 0, v = 0;
    const n = Math.ceil((this.T.end - this.T.go + 1) * 60);
    for (let i = 0; i < n; i++) {
      const want = s < 10 ? 5.5 : 11.5;
      v = v < want ? Math.min(want, v + 3.6 / 60) : Math.max(want, v - 4 / 60);
      s = Math.min(this.L, s + v / 60);
      S.push(s);
    }
    this.turnS = S;
  }

  shotAt(tt) {
    for (const s of this.shots) if (tt < s.t1) return s;
    return this.shots[this.shots.length - 1];
  }

  // the car at tt: { x, y, z, yaw (nose −x), pitch, v, dist }
  carAt(tt, o = this.pose) {
    const T = this.T;
    const road = (x, z, v) => {
      o.x = x; o.z = z;
      o.y = HY + 0.012 * Math.sin(tt * 13.7) + 0.008 * Math.sin(tt * 5.3);
      o.yaw = 0.003 * Math.sin(tt * 0.9);
      o.pitch = 0.003 * Math.sin(tt * 7.1);
      o.v = v;
      o.dist = tt * v;
      return o;
    };
    if (tt < 7) return road(335 - 26 * tt, LANE, 26);
    if (tt < T.mirror) return road(300 - 22 * (tt - 7), LANE, 22);
    if (tt < T.pass) return road(250 - 22 * (tt - T.mirror), LANE, 22);
    if (tt < T.passEnd) {
      const u = clamp((tt - T.pass) * 60, 0, this.passX.length - 1), i = Math.floor(u), f = u - i;
      const X = this.passX, x = i + 1 < X.length ? lerp(X[i], X[i + 1], f) : X[X.length - 1];
      const off = smoothstep(22.2, 24.4, tt) * (1 - smoothstep(30, 32.2, tt));
      road(x, lerp(LANE, SHOULDER, off), i + 1 < X.length ? (X[i] - X[i + 1]) * 60 : 21);
      o.yaw += (smoothstep(22.2, 23.3, tt) - smoothstep(23.3, 24.4, tt)) * 0.07 - (smoothstep(30, 31.1, tt) - smoothstep(31.1, 32.2, tt)) * 0.07;
      o.dist = 600 + (285 - x);
      return o;
    }
    if (tt < T.drone) return road(205 - 20 * (tt - T.chill), LANE, 20);
    if (tt < T.arrive) return road(262 - 20 * (tt - T.drone), LANE, 20);
    if (tt < T.go) {
      const S = this.arrS, u = clamp((tt - T.arrive) * 60, 0, S.length - 1), i = Math.floor(u), f = u - i;
      const s = i + 1 < S.length ? lerp(S[i], S[i + 1], f) : S[S.length - 1];
      road(this.arrX0 - s, LANE, i + 1 < S.length ? (S[i + 1] - S[i]) * 60 : 0);
      if (o.v < 0.05) { o.y = HY; o.yaw = 0; o.pitch = 0; }
      o.dist = 900 + s;
      return o;
    }
    const S = this.turnS, u = clamp((tt - T.go) * 60, 0, S.length - 1), i = Math.floor(u), f = u - i;
    const s = i + 1 < S.length ? lerp(S[i], S[i + 1], f) : S[S.length - 1];
    const p = this.curve.getPointAt(clamp(s / this.L, 0, 1));
    const a = this.curve.getPointAt(clamp((s - 1.2) / this.L, 0, 1)), b = this.curve.getPointAt(clamp((s + 1.2) / this.L, 0, 1));
    const dx = b.x - a.x, dz = b.z - a.z;
    o.x = p.x; o.z = p.z;
    o.y = this._ground(p.x, p.z);
    o.yaw = Math.atan2(dz, -dx);
    o.pitch = -Math.atan2(this._ground(b.x, b.z) - this._ground(a.x, a.z), Math.hypot(dx, dz) || 1);
    o.v = i + 1 < S.length ? (S[i + 1] - S[i]) * 60 : 0;
    o.dist = 1100 + s;
    return o;
  }

  // the convoy's k-th car at tt: { x, z, yaw, visible }
  convoyAt(tt, k, o = {}) {
    const T = this.T;
    o.visible = true;
    o.yaw = 0;
    o.z = ONC;
    if (tt >= T.mirror && tt < T.pass) {
      const c = this.carAt(tt, {});
      o.x = c.x + 230 - 9 * (tt - T.mirror) + GAP * k;
    } else if (tt >= T.pass && tt < T.drone - 1) {
      o.x = Math.max(70 + GAP * k, PASS_X0 - 33 * (tt - T.pass) + GAP * k);
    } else if (tt >= T.drone - 1) {
      const S = STAGE[k];
      o.x = S.x; o.z = S.z; o.yaw = S.yaw;
    } else o.visible = false;
    return o;
  }

  // the lorry: first the other way (it meets the car at T.meet), then the head of the queue
  lorryAt(tt, o = {}) {
    const T = this.T;
    o.visible = true;
    if (tt >= 7 && tt < 16.2) {
      const xm = 300 - 22 * (T.meet - 7);
      o.x = xm + 20 * (tt - T.meet); o.z = ONC; o.yaw = PI; o.oncoming = true;
    } else if (tt >= T.drone - 1) {
      o.x = QUEUE.lorry.x; o.z = QUEUE.lorry.z; o.yaw = 0; o.oncoming = false;
    } else o.visible = false;
    return o;
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
    g.fx.fade = 0;
    g.hud.setHint(null);
    g.hud.setUse(null);
    g.hud.setSkip(true, 'intro');
    if (typeof document !== 'undefined') document.body.classList.add('intro');
    shared.uDawn.value = 0;
    shared.uMorning.value = 0;
  }

  // skip (Enter): a short fade and the chapter ends
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
    for (const p of this.people) {
      undressPerson(p.meshes);
      p.rig.root.removeFromParent();
      p.mat.dispose();
    }
    this.people.length = 0;
    for (const v of this.cars) v.dispose();
    this.cars.length = 0;
    this.convoy = null;
    this.lorry = this.sedan = null;
    if (this.car) { disposeFilmCar(this.car); this.car = null; }
    for (const h of this.carHalos || []) h.sp.material.dispose();
    this.carHalos = null;
    this.arm?.dispose();
    this.arm = null;
    this.engine?.stop(0.3); this.engine = null;
    this.radio?.off(0.2); this.radio = null;
    for (const s of this.sirens || []) s?.stop(0.2);
    this.sirens = null;
    this.hum?.stop(); this.hum = null;
    this.drone?.stop(0.4); this.drone = null;
    shared.uHead.value.w = 0;
    if (typeof document !== 'undefined') document.body.classList.remove('intro');
  }

  // ---------------- the cast ----------------
  _players() {
    const g = this.g;
    if (!g.online) return [{ slot: 0, fit: myFit() }];
    const out = [{ slot: (g.player.slot | 0) % 4, fit: myFit() }];
    for (const r of g.remotes.values()) out.push({ slot: (r.slot | 0) % 4, fit: r.fit });
    const seen = new Set();
    return out.filter((p) => (seen.has(p.slot) ? false : (seen.add(p.slot), true))).sort((a, b) => a.slot - b.slot);
  }

  _hostFit() {
    const g = this.g;
    if (!g.online || g.auth) return myFit();
    const hid = g.coop?.hostId;
    for (const r of g.remotes.values()) if (hid && r.id === hid) return r.fit;
    for (const r of g.remotes.values()) if ((r.slot | 0) === 0) return r.fit;
    return myFit();
  }

  _build() {
    this.built = true;
    const g = this.g, scene = g.scene;
    this.mat = this.mat || createWorldMaterial();
    // the host's car, its lamps
    this.car = buildFilmCar(this._hostFit());
    this.carId = this.car.userData.id;
    this.fc = FILM_CARS[this.carId];
    scene.add(this.car);
    const P = this.car.userData.M.P;
    this.carHalos = [...P.head.map((p) => ['head', p]), ...P.tail.map((p) => ['tail', p])].map(([type, p]) => {
      const sp = new THREE.Sprite(haloMaterial(LAMP_HEX[type], beaconTexture()));
      sp.position.set(p[0] + (type === 'head' ? -0.04 : 0.04), p[1], p[2]);
      sp.scale.setScalar(type === 'head' ? 1.6 : 0.7);
      this.car.userData.body.add(sp);
      return { sp, type };
    });
    // the crew: alone you drive; a room fills the seats by slot
    const players = this._players();
    players.forEach((p) => {
      const rig = buildSurvivor(p.fit);
      rig.root.rotation.order = 'YXZ';
      const mat = createPersonMaterial(rig.dyes, PLAYER_HEX[p.slot % 4]);
      mat.uniforms.uShow.value = 1;
      const meshes = dressPerson(rig, mat);
      scene.add(rig.root);
      const seat = players.length === 1 ? 0 : p.slot % 4;
      this.cast.push({ slot: p.slot, seat, rig, mat, meshes, solo: players.length === 1 });
    });
    // the convoy (each beacon out of step with the next), the lorry, the Lada
    this.convoy = COLUMN.map((kind, k) => new Vehicle(kind, this.mat, scene, { phase: k * 0.37, mast: !!STAGE[k].mast }));
    this.lorry = new Vehicle('lorry', this.mat, scene);
    this.sedan = new Vehicle('sedan', this.mat, scene);
    this.cars.push(...this.convoy, this.lorry, this.sedan);
    // the arm
    this.arm = new RoadArm(scene, this.mat);
    // the cordon: a policeman (he has the torch), a medic, a fireman
    const fits = [
      cleanFit({ head: 'ushanka', body: 'jacket', hc: ['#1d2a44', '#2c3d63'], bc: ['#1d2a44', '#c9d23a'] }),
      cleanFit({ head: 'hood', body: 'doctorcoat', hc: ['#e9e6df', '#b5462a'], bc: ['#e9e6df', '#b5462a'] }),
      cleanFit({ head: 'hood', body: 'hazmat', hc: ['#2a2a2a', '#c9d23a'], bc: ['#b8321f', '#e0c23a'] }),
    ];
    this.people = fits.map((fit) => {
      const rig = buildSurvivor(fit);
      const mat = createPersonMaterial(rig.dyes, 0xc3aa84);
      mat.uniforms.uShow.value = 1;
      const meshes = dressPerson(rig, mat);
      scene.add(rig.root);
      return { rig, mat, meshes };
    });
  }

  // car-local → world (the body on its springs)
  toWorld(lx, ly, lz, out = new THREE.Vector3()) {
    const b = this.car.userData.body || this.car;
    b.updateMatrixWorld(true);
    return out.set(lx, ly, lz).applyMatrix4(b.matrixWorld);
  }

  // ---------------- the frame ----------------
  update(dt, events) {
    if (this.state !== 'run') return;
    if (!this.built) this._build();
    const silent = this.seeking;
    this.seeking = false;
    if (!this.hold) this.t += dt; // (debug: hold freezes the clock on a frame)
    const tt = this.t;
    const ev = Array.isArray(events) ? events : [];
    if (!silent && this.g.auth && (ev.includes('confirm') || ev.includes('skip'))) this.skip();
    const c = this.carAt(tt);
    this.car.position.set(c.x, c.y, c.z);
    _e.set(0, c.yaw, c.pitch, 'YXZ');
    this.car.quaternion.setFromEuler(_e);
    const steer = this._steer(tt);
    this._springs(tt, c, steer);
    this.car.updateMatrixWorld(true);
    this._crew(tt, steer);
    this._traffic(tt);
    this._cordon(tt);
    this.arm.update(tt, this.T, (x, z) => this._ground(x, z));
    this._beams(tt, c);
    if (!silent) this._sound(tt, c);
    if (!silent) this._fx(tt);
    // the picture: up out of the black, down into it at the end (or at a skip)
    const g = this.g;
    if (this.skipping) {
      g.fx.fade = Math.min(g.fx.fade, 1 - smoothstep(this.skipAt, this.skipAt + 0.8, tt));
      if (tt >= this.skipAt + 0.85) this.end();
      return;
    }
    if (tt < 1.4) g.fx.fade = smoothstep(0, 1.4, tt);
    else if (tt >= this.T.fade) g.fx.fade = 1 - smoothstep(this.T.fade, this.T.end, tt);
    else g.fx.fade = 1;
    if (tt >= this.T.end) this.end();
  }

  seek(tt) {
    this.t = tt;
    this.seeking = true;
    this.cues = Object.fromEntries(Object.keys(this.cues).map((k) => [k, true]));
  }

  // the wheels roll, the front ones steer, the body leans out of a turn and dips under the brakes; the lamps
  _springs(tt, c, steer) {
    const U = this.car.userData, R0 = this.fc.wheelR;
    U.wheels.forEach((w, i) => {
      w.rotation.z = c.dist / R0;
      w.rotation.y = i < 2 ? steer * 0.32 : 0;
    });
    if (U.steer) U.steer.rotation.x = -steer * 1.6;
    const a = (this.carAt(tt + 0.1, {}).v - this.carAt(tt - 0.1, {}).v) / 0.2;
    const fast = clamp(c.v / 9, 0, 1);
    this._roll = lerp(this._roll || 0, -steer * 0.05 * Math.max(fast, 0.5), 0.12);
    this._dip = lerp(this._dip || 0, clamp(-a * 0.008, -0.035, 0.04), 0.12);
    U.pivot.rotation.set(this._roll + 0.004 * Math.sin(tt * 9.3) * fast, 0, this._dip);
    for (const p of U.pods || []) p.rotation.z = -U.M.P.pod.open; // (a Trueno: lamps up, it is night)
    const braking = a < -0.6 || (c.v < 0.2 && tt > this.T.arrive && tt < this.T.go);
    for (const h of this.carHalos) {
      h.sp.material.opacity = h.type === 'head' ? 1.3 : braking ? 1.6 : 0.75;
      h.sp.visible = true;
    }
  }

  _steer(tt) {
    const T = this.T;
    if (tt >= T.go) {
      const a = this.carAt(tt - 0.15, {}).yaw, b = this.carAt(tt + 0.15, {}).yaw;
      let d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
      return clamp(d * 3.4, -1, 1);
    }
    if (tt >= T.pass && tt < T.passEnd) return -0.25 * (smoothstep(22.2, 23.3, tt) - smoothstep(23.3, 24.4, tt)) + 0.25 * (smoothstep(30, 31.1, tt) - smoothstep(31.1, 32.2, tt));
    return 0.05 * Math.sin(tt * 0.7) + 0.025 * Math.sin(tt * 2.1);
  }

  // ---------------- the crew ----------------
  _crew(tt, steer) {
    const T = this.T;
    for (const a of this.cast) {
      const n = a.rig.nodes, driver = a.seat === 0, P = this.fc.pose;
      poseSeated(a.rig, driver, tt + a.seat * 1.7, steer, P ? (a.seat < 2 ? P.front : P.rear) : null);
      const hip = this.fc.seats[a.seat].hip;
      this.toWorld(hip[0], hip[1], hip[2], _v);
      a.rig.root.position.copy(_v);
      a.rig.root.rotation.set(0, this.pose.yaw - PI / 2, 0);
      a.rig.root.visible = true;
      const k = (t0, t1, e = 0.5) => smoothstep(t0, t0 + e, tt) * (1 - smoothstep(t1 - e, t1, tt));
      // (head.rotation.y > 0 looks left: the driver's side, where the convoy goes by)
      const behind = k(T.pass + 0.4, 25.6, 0.6); // the sirens behind: turn round
      const by = k(25.4, 30.6, 0.6); // ...and they go past on the left
      const lean = smoothstep(T.stop + 1.2, T.stop + 3, tt) * (1 - smoothstep(T.go - 0.2, T.go + 0.4, tt)); // at the cordon: forward
      const freeze = k(T.twitch + 0.3, T.lift + 0.6, 0.25);
      const recoil = k(T.lift + 0.2, T.go + 1.0, 0.25);
      const thrown = k(T.go + 0.5, T.go + 2.6, 0.35); // the turn throws them left
      if (driver) {
        n.head.rotation.y = 0.45 * by + 0.1 * Math.sin(tt * 0.31) - 0.5 * k(T.go - 0.2, T.go + 1.6, 0.3);
        n.head.rotation.x = 0.04 - 0.1 * lean;
        if (a.solo) {
          // alone: the right hand finds the knob
          const r = k(T0.radio - 0.6, T0.radio + 1.9, 0.45);
          n.shR.rotation.x = lerp(n.shR.rotation.x, -1.15, r);
          n.shR.rotation.z = lerp(n.shR.rotation.z, -0.55, r);
          n.elR.rotation.x = lerp(n.elR.rotation.x, -0.35, r);
          n.head.rotation.y -= 0.4 * r;
        }
      } else if (a.seat === 1) {
        // the passenger: the phone in the lap, the radio, the convoy, the arm — and a hand up at the end
        const phone = 1 - smoothstep(T0.radio - 1.2, T0.radio - 0.6, tt);
        const r = k(T0.radio - 0.7, T0.radio + 1.8, 0.45);
        n.shL.rotation.set(lerp(-0.35, -1.2, r), 0, lerp(-0.12, 0.62, r));
        n.elL.rotation.x = lerp(-0.95, -0.25, r) + 0.08 * Math.sin(tt * 9) * r;
        n.head.rotation.set(0.42 * phone + 0.35 * r - 0.08 * lean, 0.45 * r + 0.75 * by + 1.1 * behind, 0);
        n.chest.rotation.x += 0.18 * lean;
        n.chest.rotation.y = 0.18 * r + 0.3 * behind;
        const up = recoil;
        n.shR.rotation.x = lerp(n.shR.rotation.x, -2.1, up * 0.8);
        n.elR.rotation.x = lerp(n.elR.rotation.x, -1.5, up * 0.8);
      } else {
        // the back: asleep against the glass until the sirens; then round, then between the front seats
        const awake = smoothstep(T.pass - 0.4, T.pass + 0.6, tt);
        const sway = Math.sin(tt * 1.3 + a.seat) * 0.04;
        const side = a.seat === 2 ? 1 : -1;
        n.head.rotation.set(lerp(0.4, 0.02, awake) - 0.1 * lean, lerp(0, 1.3 * side, behind) + 0.7 * by - 0.25 * side * lean, lerp(-0.4 * side + sway, 0, awake));
        n.chest.rotation.set(lerp(-0.02, 0, awake) + 0.32 * lean - 0.25 * recoil, 0.35 * behind * side, 0);
        n.shL.rotation.set(-0.5 - 0.6 * lean, 0, -0.1);
        n.shR.rotation.set(-0.5 - 0.6 * lean, 0, 0.1);
      }
      if (freeze > 0) n.head.rotation.x -= 0.05 * freeze;
      n.chest.rotation.z += 0.28 * thrown;
      n.head.rotation.z += 0.12 * thrown;
    }
  }

  // ---------------- the convoy, the lorry, the Lada ----------------
  _traffic(tt) {
    const T = this.T, o = {};
    this.convoy.forEach((v, k) => {
      this.convoyAt(tt, k, o);
      if (!o.visible) { v.hide(); return; }
      const parked = tt >= T.drone - 1;
      let y = HY, roll = 0, pitch = 0;
      let x = o.x, z = o.z, yaw = o.yaw;
      v.body.scale.set(1, 1, 1);
      v.body.position.set(0, 0, 0);
      v.on.dead = false;
      v.on.brake = parked;
      v.on.lamps = true;
      if (parked && k === 0 && tt >= T.slam) {
        // under the arm: the roof comes down to the doors, the car sits on its rims, the beacon goes out
        const c = smoothstep(T.slam - 0.02, T.slam + 0.1, tt);
        v.body.scale.set(1, lerp(1, 0.36, c), lerp(1, 1.12, c));
        v.body.position.y = -0.12 * c;
        roll = 0.1 * c;
        v.on.dead = tt > T.slam + 0.45 || (tt > T.slam + 0.15 && Math.floor(tt * 30) % 3 === 0);
      }
      if (parked && k === 1 && tt >= T.sweep + 0.4) {
        // the ambulance: shoved off the shoulder and over, into the ditch — its beacons still turning
        const r = smoothstep(T.sweep + 0.4, T.sweep + 1.9, tt);
        roll = -2.6 * r;
        z -= 6.2 * r;
        x += 2.2 * r;
        y = HY + Math.sin(r * PI) * 1.1 - 2.3 * r;
      }
      if (v.mast) v.mast.visible = v.head.visible = parked;
      if (parked && k === 2 && v.head) {
        // the mast: on the arm while it lies there; then the blow takes it, and the lamp swings through the trees
        const hit = smoothstep(T.slam + 0.2, T.slam + 0.7, tt);
        const wob = tt > T.slam + 0.2 ? Math.exp(-(tt - T.slam - 0.2) * 1.3) * Math.sin((tt - T.slam) * 7) : 0;
        v.head.rotation.set(0, -0.55 + 1.9 * hit + 0.6 * wob, -0.32 - 0.5 * hit + 0.35 * wob);
        v.on.flood = tt < T.sweep + 1.6 || (tt < T.sweep + 1.9 && Math.floor(tt * 24) % 2 === 0);
      }
      if (!parked) {
        y = HY + 0.012 * Math.sin(tt * 11 + k);
        roll = 0.004 * Math.sin(tt * 8 + k);
      }
      v.place(x, y, z, yaw, pitch, roll);
      v.lamps(tt);
    });
    // the lorry: the other way, then the head of the queue (its brake lights on; then the tip comes down on it)
    const L = this.lorryAt(tt, o);
    if (!L.visible) this.lorry.hide();
    else {
      this.lorry.body.scale.set(1, 1, 1);
      this.lorry.body.position.set(0, 0, 0);
      this.lorry.on.brake = !L.oncoming;
      this.lorry.on.dead = false;
      let roll = 0;
      if (!L.oncoming && tt >= T.truck) {
        const c = smoothstep(T.truck - 0.02, T.truck + 0.12, tt);
        this.lorry.body.scale.set(1, lerp(1, 0.55, c), 1);
        roll = 0.14 * c;
        this.lorry.on.dead = tt > T.truck + 0.3;
      }
      this.lorry.place(L.x, HY, L.z, L.yaw, 0, roll);
      this.lorry.lamps(tt);
    }
    // the Lada in front of you: brake lights; after the blow it backs up a metre, its horn on
    if (tt >= T.drone - 1) {
      const back = smoothstep(T.slam + 0.9, T.slam + 2.2, tt) * 1.2;
      this.sedan.on.brake = true;
      this.sedan.place(QUEUE.sedan.x + back, HY, QUEUE.sedan.z, 0);
      this.sedan.lamps(tt);
    } else this.sedan.hide();
  }

  // the three of the cordon: where they stand, the policeman's walk up to the arm with his torch, and the run
  _cordon(tt) {
    const T = this.T;
    const vis = tt >= T.drone - 1;
    const runFrom = T.lift + 0.35;
    const spots = [
      // [stand x, z, face yaw], walk-to (the policeman), the run's lane z
      { x: -29, z: 329.3, face: -1.2, to: { x: -37.4, z: 331.4 }, lane: 334.1 },
      { x: -17.6, z: 330.6, face: -1.4, lane: 331.0 },
      { x: -31.5, z: 335.0, face: -1.65, lane: 334.8 },
    ];
    this.people.forEach((p, i) => {
      const S = spots[i], rig = p.rig;
      rig.root.visible = vis;
      if (!vis) return;
      let x = S.x, z = S.z, face = S.face, speed = 0, phase = tt * 0.6 + i;
      if (S.to && tt >= T.worker && tt < runFrom) {
        // the walk up to it, then the step back when it moves
        const w = smoothstep(T.worker + 0.4, T.worker + 5.2, tt);
        const back = smoothstep(T.twitch + 0.2, T.twitch + 0.9, tt) * 1.3;
        x = lerp(S.x, S.to.x, w) + back;
        z = lerp(S.z, S.to.z, w);
        face = Math.atan2(S.to.x - S.x, S.to.z - S.z);
        speed = w > 0.02 && w < 0.98 ? 1.4 : 0;
        phase = w * 6.2;
      }
      if (tt >= runFrom + i * 0.25) {
        // they run: east, toward the queue (and the camera)
        const u = tt - runFrom - i * 0.25;
        const x0 = S.to ? S.to.x + 1.3 : S.x;
        x = x0 + 6.2 * Math.max(0, u - 0.3);
        z = lerp(S.to ? S.to.z : S.z, S.lane, smoothstep(0, 1.2, u));
        face = PI / 2;
        speed = 6;
        phase = (x - x0) / 0.9;
      }
      rig.root.position.set(x, this._ground(x, z), z);
      rig.root.rotation.set(0, face, 0);
      poseSurvivor(rig, phase, speed, false, false);
      if (i === 0) {
        // the torch: held out, pointed at the arm (and bouncing when he runs)
        const n = rig.nodes;
        n.shR.rotation.x = speed > 5 ? -0.6 + 0.4 * Math.sin(phase * 2) : -1.25;
        n.elR.rotation.x = -0.25;
      }
    });
  }

  // the light the film hands the shader: the car's own beams on uHead (the small lights are lightSources)
  _beams(tt, c) {
    const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
    // the nose is local −x: forward in the world is (−cos yaw, 0, sin yaw)
    const fx = -cy, fz = sy;
    const H = shared.uHead.value;
    H.set(c.x + fx * 2.1, c.y + 0.85, c.z + fz * 2.1, 1.7);
    shared.uHeadD.value.set(fx, -0.07, fz).normalize();
  }

  // up to five small lights for this frame, the nearest to the camera first: [{ x, y, z, I, c, R, prio, near, id, dir, cone }]
  lightSources(out) {
    if (this.state !== 'run' || !this.built) return;
    const tt = this.t, T = this.T, sh = this.shotAt(tt).k;
    const cam = this.camPos || this.pose;
    const list = [];
    // the moon, low in the south-west: a faint cold light over all of it (it never moves: its shadow faces are
    // drawn once), so the treeline and the road have a shape between the lamps
    out.push({ x: MOON.x, y: MOON.y, z: MOON.z, I: MOON.I, c: MOON.c, R: MOON.R, prio: 9, near: 2, id: 'moon' });
    const inside = ['cabin', 'rearwin', 'faces', 'arrive', 'facesW', 'turn', 'rearwin2'].includes(sh);
    if (inside) {
      // the instruments: a dim green-white on the hands and the faces
      const D = this.car.userData.M.P.dash;
      this.toWorld(D[0], D[1] + 0.05, 0, _w);
      list.push({ x: _w.x, y: _w.y, z: _w.z, I: 0.42, c: [0.55, 0.95, 0.85], R: 1.9, prio: 3, near: 0.05, id: 'dash' });
    }
    // the lorry coming the other way: its beams fill the cabin as it closes
    const L = this.lorryAt(tt, {});
    if (L.visible && L.oncoming) {
      list.push({ x: L.x + 7.3, y: HY + 1.2, z: L.z, I: 2.6, c: LAMP_RGB.head, R: 48, prio: 2, near: 0.3, id: 'lorryBeam', dir: [1, -0.04, -0.12], cone: 0.78 });
    }
    // the beacons
    for (const v of this.convoy) {
      const b = v.beacon(tt);
      if (b) list.push({ ...b, R: 42, prio: 0, near: 0.35, id: v });
    }
    // the floodlight on the arm, and the policeman's torch
    const f = this.convoy[2].flood();
    if (f && tt >= T.drone - 1) list.push({ ...f, I: 3.2, c: LAMP_RGB.flood, R: 36, prio: 2, near: 0.4, id: 'flood', cone: 0.82 });
    if (tt >= T.worker && tt < T.lift + 3) {
      const p = this.people[0].rig.nodes.handR || this.people[0].rig.nodes.elR;
      p.updateWorldMatrix(true, false);
      p.getWorldPosition(_w);
      const tx = -40.8, tz = 332.8, ty = HY + 1.4;
      const d = new THREE.Vector3(tx - _w.x, ty - _w.y, tz - _w.z).normalize();
      list.push({ x: _w.x, y: _w.y, z: _w.z, I: 1.7, c: [1, 0.96, 0.86], R: 15, prio: 2, near: 0.12, id: 'torch', dir: [d.x, d.y, d.z], cone: 0.9 });
    }
    for (const l of list) l.score = l.prio * 1000 - Math.hypot(l.x - cam.x, l.y - cam.y, l.z - cam.z);
    list.sort((a, b) => b.score - a.score);
    for (const l of list.slice(0, 5)) out.push(l); // (five: the moon is the sixth)
  }

  // ---------------- sound ----------------
  _sound(tt, c) {
    const g = this.g, au = g.audio, T = this.T;
    if (!au) return;
    const hit = (key, at, fn) => { if (tt >= at && !this.cues[key]) { this.cues[key] = true; fn(); } };
    const sh = this.shotAt(tt).k;
    // the engine, where the car is
    hit('engine', 0.05, () => { this.engine = au.uazStart?.(c.x, c.y + 0.7, c.z, this.carId) || null; });
    if (this.engine) {
      const rev = tt >= T.go ? clamp(0.55 + c.v / 12, 0, 1) : clamp(0.22 + 0.6 * clamp(c.v / 24, 0, 1) + 0.02 * Math.sin(tt * 2.7), 0.12, 1);
      this.engine.rev(rev, { x: c.x, y: c.y, z: c.z });
    }
    // the radio: the station at 8.6 s; through the speaker in the cabin, a car going by outside; then it drowns
    hit('radio', T0.radio - 0.3, () => { this.radio = au.nightRadio?.() || null; this.radio?.tune(1.4); });
    if (this.radio) {
      const inside = ['cabin', 'faces', 'arrive', 'facesW', 'rearwin', 'turn', 'rearwin2'].includes(sh) ? 1 : sh === 'mirror' ? 0.5 : 0.2;
      this.radio.cabin(inside);
      if (tt > T.stop + 4) this.radio.crackle(smoothstep(T.stop + 4, T.twitch, tt));
    }
    hit('radioDies', T.twitch + 0.2, () => { this.radio?.off(0.35); this.radio = null; });
    // the lorry going by, and the car past the camera in the first shot
    hit('passOpen', 6.0, () => au.carPass?.(c.x + 20, c.y + 0.6, c.z, -1, 26, au.sfx));
    hit('passLorry', T.meet - 1.4, () => au.carPass?.(c.x - 30, HY + 1, ONC, 1, 42, au.sfx));
    // the convoy's sirens: from far behind, past, away; at the cordon they are off
    hit('sirens', T.mirror + 0.2, () => { this.sirens = this.convoy.map((v) => (v.siren ? au.sirenLoop?.(v.siren, v.root.position.x, HY + 1.5, v.root.position.z) || null : null)); });
    if (this.sirens) this.convoy.forEach((v, k) => this.sirens[k]?.move(v.root.position.x, HY + 1.5, v.root.position.z));
    COLUMN.forEach((_, k) => hit('whoosh' + k, 25.6 + k * 0.62, () => au.carPass?.(c.x - 25, HY + 1, ONC, -1, 33, au.sfx)));
    hit('sirensOff', T.drone - 1, () => { for (const s of this.sirens || []) s?.stop(0.8); this.sirens = null; });
    // the cordon: the fire engine's generator under the floodlight, the police radios, a dread under all of it
    hit('hum', T.arrive + 2, () => { this.hum = au.genHum?.(STAGE[2].x + 2, HY + 1, STAGE[2].z) || null; });
    hit('drone', T.stop - 2, () => { this.drone = au.tensionDrone?.() || null; });
    if (this.drone) this.drone.set(smoothstep(T.stop - 2, T.lift, tt));
    for (const [i, at] of [3.2, 8.9, 14.1, 19.6].entries()) hit('squelch' + i, T.stop + at, () => au.radioSquelch?.(STAGE[4].x, HY + 1.4, STAGE[4].z));
    // it moves
    hit('twitch', T.twitch, () => au.armGroan?.(-40, HY + 1.5, 333, 0.45));
    hit('lift', T.lift, () => { au.armGroan?.(-38, HY + 3, 332, 1); this.drone?.set(1); });
    hit('slam', T.slam, () => {
      au.armSlam?.(STAGE[0].x, HY + 1, STAGE[0].z, 1);
      au.humanScream?.(-20, HY + 1.6, 331, false, 0.5);
      this.drone?.stop(1.2); this.drone = null;
    });
    hit('scrape', T.sweep, () => au.metalScrape?.(STAGE[1].x, HY + 1, STAGE[1].z, 1.8));
    hit('roll', T.sweep + 1.3, () => au.armSlam?.(STAGE[1].x + 2, HY - 1, STAGE[1].z - 6, 0.45));
    hit('floodOut', T.sweep + 1.6, () => { this.hum?.sputter?.(); });
    for (const [i, at] of [0.9, 1.6, 2.1, 2.7, 3.3].entries()) hit('horn' + i, T.slam + at, () => au.filmHorn?.(QUEUE.sedan.x, HY + 0.8, QUEUE.sedan.z, 0.25 + (i % 2) * 0.35));
    hit('tip', T.tip, () => au.armGroan?.(-20, HY + 8, 348, 0.8));
    hit('screech', T.go + 0.1, () => au.tyreScreech?.(c.x, HY, c.z, 1.1));
    hit('truck', T.truck, () => au.armSlam?.(QUEUE.lorry.x, HY + 2, QUEUE.lorry.z, 0.85));
    hit('engineOff', T.end - 0.3, () => { this.engine?.stop(1.2); this.engine = null; this.hum?.stop(); this.hum = null; });
  }

  // the blows: a white flash, the shock in the picture, an echo off everything for a hundred metres
  _fx(tt) {
    const g = this.g, T = this.T;
    const hit = (key, at, fn) => { if (tt >= at && !this.cues[key]) { this.cues[key] = true; fn(); } };
    hit('glare', T.meet - 0.25, () => { g.fx.white = Math.max(g.fx.white, 0.16); });
    hit('fxTwitch', T.twitch + 0.15, () => { g.fx.glitch = Math.max(g.fx.glitch, 0.25); });
    hit('fxSlam', T.slam, () => {
      g.fx.white = Math.max(g.fx.white, 0.42);
      g.fx.glitch = Math.max(g.fx.glitch, 0.55);
      g.fx.shockT = 0;
      g.fx.shockAmp = 0.85;
      g.addTrauma?.(0.85);
      g.pulses?.emit(STAGE[0].x, HY + 1, STAGE[0].z, g.time, { radius: 90, strength: 1.2, speed: 38, decay: 0.45, color: [0.9, 0.95, 1], kind: 'shard' });
      g.particles?.burst(STAGE[0].x, HY + 1.2, STAGE[0].z, 60, { color: [0.75, 0.85, 1], speed: 7, life: 1.1, size: 0.05, gravity: -9, drag: 0.6 });
      g.particles?.burst(STAGE[0].x, HY + 0.6, STAGE[0].z, 40, { color: [0.35, 0.3, 0.28], speed: 5, life: 1.4, size: 0.09, gravity: -9, drag: 0.8 });
    });
    hit('fxRoll', T.sweep + 1.3, () => g.addTrauma?.(0.35));
    hit('fxTruck', T.truck, () => {
      g.addTrauma?.(0.5);
      g.fx.white = Math.max(g.fx.white, 0.18);
      g.pulses?.emit(QUEUE.lorry.x, HY + 2, QUEUE.lorry.z, g.time, { radius: 60, strength: 0.9, speed: 34, decay: 0.55, color: [0.9, 0.95, 1], kind: 'shard' });
    });
    hit('fxGo', T.go + 0.2, () => g.addTrauma?.(0.3));
  }

  // ---------------- the camera ----------------
  cameraAt(tt) {
    const T = this.T, sh = this.shotAt(tt);
    const k = clamp((tt - sh.t0) / Math.max(0.01, sh.t1 - sh.t0), 0, 1);
    const c = this.carAt(tt, {});
    const local = (lx, ly, lz) => {
      const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
      return [c.x + lx * cy + lz * sy, c.y + ly, c.z - lx * sy + lz * cy];
    };
    const cam = this.fc?.cam || 0;
    let p, l, fov = 50, inCar = false;
    switch (sh.k) {
      case 'open': // a long lens down the road; it comes out of the dark, past us
        p = [158, HY + 0.55, 333.5];
        l = c.x > 164 ? [c.x, c.y + 0.9, c.z] : [lerp(c.x, c.x - 30, smoothstep(164, 140, c.x)), c.y + 0.8, c.z];
        fov = lerp(20, 34, smoothstep(0, 6.5, tt));
        break;
      case 'cabin': case 'arrive': case 'turn': // in the back between the seats, through the windscreen
        p = local(lerp(0.95, sh.k === 'arrive' ? 0.6 : 0.95, k), (sh.k === 'turn' ? 1.78 : 1.62) + cam, -0.05);
        l = local(-9, (sh.k === 'turn' ? 0.95 : 1.15) + cam, sh.k === 'turn' ? -2.5 * k : 0.25);
        fov = 60;
        inCar = true;
        break;
      case 'mirror': // at the driver's window, looking back down the road
        p = local(-0.75, 1.55 + cam, 1.32);
        l = local(9, 1.25 + cam, 0.9);
        fov = 44;
        break;
      case 'rearwin': case 'rearwin2': // between the front seats, looking back out of the rear window
        p = local(-0.35, 1.58 + cam, 0);
        l = local(8, 1.3 + cam, sh.k === 'rearwin2' ? 0.8 : 0);
        fov = 62;
        inCar = true;
        break;
      case 'verge': { // behind the rail on the verge, ahead of the pulled-over car: the column goes by
        p = [160, HY + 0.7, 327.9];
        // look where the column is passing (the nearest of them), or at the car before and after
        let best = null, bd = Infinity;
        this.convoy.forEach((v, kk) => {
          const o = this.convoyAt(tt, kk, {});
          const d = Math.abs(o.x - 160);
          if (o.visible && d < bd && o.x > 105) { bd = d; best = o; }
        });
        const at = best && bd < 40 ? [best.x, HY + 1.3, best.z] : [c.x, c.y + 1, c.z];
        const w = best ? smoothstep(60, 20, bd) : 0;
        l = [lerp(c.x, at[0], w), HY + 1.2, lerp(c.z, at[2], w)];
        fov = 46;
        break;
      }
      case 'follow': // behind and above the car, their lights going away
        p = local(lerp(10, 14, k), lerp(4.5, 6, k), 1.6);
        l = local(-40, 0, -1.5);
        fov = 50;
        break;
      case 'faces': case 'facesW': // on the dash: the two in front — alone, close on the driver's face
        if (this.cast.length > 1) {
          p = local(-0.95, 1.45 + cam, lerp(-0.08, 0.06, k));
          l = local(0.3, 1.45 + cam, 0);
        } else {
          p = local(-0.62, 1.47 + cam, lerp(0.26, 0.32, k));
          l = local(0.2, 1.5 + cam, 0.42);
        }
        fov = 52;
        inCar = true;
        break;
      case 'drone': // up behind: the long dark road in the beams, the junction's lamps and the beacons at the end of it
        p = local(lerp(13, 17, k), lerp(6, 7.6, k), 3.2);
        l = local(-60, -0.5, -1);
        fov = 44;
        break;
      case 'reveal': { // low by the police car, the arm across the road; a slow push, then up it
        p = [lerp(-23.5, -29.5, k), HY + lerp(0.4, 0.75, k), lerp(333.4, 333.8, k)];
        l = [lerp(-41, -45.5, smoothstep(0.35, 1, k)), HY + lerp(1.1, 4.6, smoothstep(0.35, 1, k)), lerp(334, 329, smoothstep(0.35, 1, k))];
        fov = lerp(42, 36, k);
        break;
      }
      case 'worker': { // behind him and to his right, low: he walks up to it with the torch
        const W = this.people[0].rig.root.position;
        p = [W.x + 4.2, HY + 1.35, W.z + 2.6];
        l = [W.x - 3.5, HY + 1.2, W.z - 0.2];
        fov = 46;
        break;
      }
      case 'still': // from behind the queue and up, over the lorry: the whole of it, nothing moving but the lights
        p = [34, HY + 6.8, 339.8];
        l = [-38, HY + 2.4, 333.4];
        fov = 30;
        break;
      case 'close': // low by the flesh, looking up it in the torch's light
        p = [-36.0, HY + 0.55, 336.6];
        l = [-41.2, HY + lerp(2.0, 2.5, k), lerp(333.6, 333.1, k)];
        fov = lerp(46, 40, k);
        break;
      case 'wake': // high on the north verge, over the ambulance: up, over — and down on the police car
        p = [lerp(-4, -6, k), HY + 9.2, 321.5];
        l = [lerp(-34, -31.5, k), HY + lerp(5.5, 2.5, smoothstep(0.4, 0.75, k)), 332.5];
        fov = 48;
        break;
      case 'chaos': // low on the south shoulder by the car: they run at us, the ambulance goes over, the tip comes up
        p = [19.4, HY + 1.6, 338.4];
        l = [lerp(-14, -22, k), HY + lerp(1.8, 5, k), lerp(332, 336, k)];
        fov = 54;
        break;
      default: // forest: behind the car on the dirt road, low over the roof — the beams tunnelling ahead
        p = local(lerp(6, 7.5, k), lerp(2.3, 2.9, k), 0.4);
        l = local(-16, 0.7, 0);
        fov = 54;
    }
    const gy = this._ground(p[0], p[2]) + 0.3;
    if (!inCar && p[1] < gy) p[1] = gy;
    return { p, l, fov, kind: sh.k, inCar };
  }

  applyCamera(camera) {
    if (this.state !== 'run' || !this.built) return false;
    const tt = this.t;
    const c = this.cameraAt(tt);
    camera.position.set(c.p[0], c.p[1], c.p[2]);
    _look.set(c.l[0], c.l[1], c.l[2]);
    camera.lookAt(_look);
    const hh = c.inCar ? 0.005 : c.kind === 'chaos' || c.kind === 'turn' ? 0.012 : 0.002;
    camera.rotateZ(Math.sin(tt * 0.9) * hh + (c.inCar ? Math.sin(tt * 11.3) * 0.002 : 0));
    camera.rotateX(Math.sin(tt * 0.7 + 2) * hh);
    if (Math.abs(camera.fov - c.fov) > 0.01) {
      camera.fov = c.fov;
      camera.updateProjectionMatrix();
    }
    this.camPos = { x: c.p[0], y: c.p[1], z: c.p[2] };
    return true;
  }
}
