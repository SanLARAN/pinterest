// The bog's opening cut scene (3.0l). The forestry keeps the 2.1j film (see duskFilm.js); which one runs is
// decided by the map you chose, in the dispatcher at the bottom of this file.
//
// It used to open on a camera falling out of the sky onto a camp fire, while four people put the fire out
// and went to bed. That film did not fit the shift any more: nobody arrives at a bog by falling on it. Now it
// opens the way the night actually began — a УАЗ coming up the old track, out of the rain, and stopping at the
// проезд because the проезд is under water. That is why the squad is stuck here, and what they are stuck here
// *to do* is start the pumps.
//
// The film is one arrival and one piece of work, in five beats:
//   1. the drive: the car comes up the road through the water and stops on the far bank, headlights on the flood
//   2. the doors: four of them get out into the rain, one after another, and stand looking at the water
//   3. the wade: they cross the flooded stretch on foot — the pump is on the camp side of it
//   4. the work: each seat has its own job (drag the suction line, prime the pump, crank it, plant the marker)
//   5. the water: the pump takes, and the shift's first job is running when the picture goes dark
//
// Every seat is the player who owns it (their own clothes, their own colour); alone it is one person doing
// their own part of the same job. Enter (or the touch SKIP button) ends it at any moment.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { createWorldMaterial, shared } from '../render/sonar.js';
import { crewCarBody, CAMP_TRACK } from '../world/bog.js';
import { DuskFilm } from './duskFilm.js';
import { buildSurvivor, poseSurvivor, poseFur } from './survivor.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { PLAYER_HEX } from './remote.js';
import { myFit, cleanFit } from './outfit.js';

const DRIVE = 4.4; // s: the УАЗ coming up the track to the water
const STOP = DRIVE; // the wheels stop here
const DOORS = 0.8; // s after that before the first door opens
const DOOR_GAP = 0.3; // s between one door and the next
const STEP_OUT = 0.55; // s: out of the car and onto the road
const WADE = 3.4; // s of the crossing we actually watch (then the cut takes us to the pump)
const WALK_SPEED = 1.4; // m/s — hurrying, in the rain

// one seat per lobby slot: which side of the car they get out on, and their part of the job
//   · 1 drags the suction line down to the water   · 2 cranks the pump
//   · 3 primes it from a can                       · 4 plants the marker at the edge of the flood
export const SEATS = [
  { side: -1, row: 0, act: 'hose' },
  { side: 1, row: 1, act: 'crank' },
  { side: 1, row: 0, act: 'prime' },
  { side: -1, row: 1, act: 'sign' },
];
export const SOLO_SEAT = { side: 1, row: 0, act: 'crank' };

const ACT_DUR = { hose: 2.6, crank: 2.4, prime: 2.2, sign: 2.2 };
const POSE_NODES = ['hips', 'chest', 'head', 'shL', 'shR', 'elL', 'elR', 'thL', 'thR', 'knL', 'knR'];

// a fallback staging, so the film (and its tests) can be laid out without a generated bog under it
function fallbackSet() {
  const pump = { x: 12.6, z: 0.9, y: 0.9, yaw: 1.5 };
  return {
    pump,
    car: { x: 24.3, z: 8.8, y: 0.8, yaw: 1.22 },
    near: { x: 13.7, z: 5.0 },
    far: { x: 21.5, z: 7.8 },
    water: { x: 15.8, z: 4.5 },
    hose: { x: 11.5, z: 1.7 },
    crank: { x: 12.8, z: -0.3 },
    prime: { x: 11.4, z: 0.9 },
    marker: { x: 13.0, z: 4.2 },
    sign: { x: 10.5, z: 5.0 },
    toWater: { x: 0.673, z: 0.74 },
    side: { x: -0.74, z: 0.673 },
  };
}

// ---------------- poses ----------------
function breathe(tt, amp = 1) {
  return Math.sin(tt * 1.35) * 0.012 * amp;
}

function pStand(rig, tt) {
  poseSurvivor(rig, 0, 0, false, false);
  const n = rig.nodes;
  n.hips.position.y = 0.94;
  n.chest.rotation.set(0.05 + breathe(tt), Math.sin(tt * 0.31) * 0.03, 0);
  n.head.rotation.set(0, Math.sin(tt * 0.37) * 0.16, 0);
  n.shL.rotation.set(-0.12, 0, -0.12);
  n.shR.rotation.set(-0.1, 0, 0.12);
  n.elL.rotation.x = -0.32;
  n.elR.rotation.x = -0.28;
}

// the suction line: bend over it, take it in both hands and haul it hand over hand towards the water
function pHose(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const bend = smoothstep(0.02, 0.22, u) * (1 - smoothstep(0.84, 1, u));
  const pull = Math.sin(u * Math.PI * 6.0);
  n.hips.position.y = 0.94 - bend * 0.3;
  n.chest.rotation.set(0.05 + bend * 0.72 + pull * 0.04, 0, 0);
  n.head.rotation.set(bend * 0.16, 0, 0);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['sh' + A].rotation.set(-0.3 - bend * 0.95 + pull * 0.2, 0, s * (0.12 + bend * 0.1));
    n['el' + A].rotation.x = -0.35 - bend * 0.5 - Math.max(0, pull) * 0.45;
    n['th' + A].rotation.set(0.08 - bend * 0.5, 0, s * 0.05);
    n['kn' + A].rotation.x = 0.1 + bend * 0.74;
  }
}

// priming: a can in both hands, up over the filler, tipped, and shaken empty
function pPrime(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const lift = smoothstep(0.04, 0.34, u) * (1 - smoothstep(0.84, 1, u));
  const tip = smoothstep(0.42, 0.58, u) * (1 - smoothstep(0.7, 0.86, u));
  const shake = Math.sin(u * Math.PI * 12) * tip * 0.08;
  n.chest.rotation.set(0.06 + lift * 0.12 + tip * 0.34, 0, shake * 0.4);
  n.head.rotation.set(-tip * 0.1, 0, 0);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['sh' + A].rotation.set(-0.2 - lift * 1.05 - tip * 0.18, 0, s * (0.16 + tip * 0.05));
    n['el' + A].rotation.x = -0.4 - lift * 0.9 + tip * 0.55;
    n['th' + A].rotation.set(0.06 - tip * 0.12, 0, s * 0.04);
    n['kn' + A].rotation.x = 0.1 + tip * 0.18;
  }
  n.hips.position.y = 0.94 - lift * 0.03 + shake;
}

// the lever: both hands on the handle, the whole body pulling it down and letting it come back up
function pCrank(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const lean = smoothstep(0.02, 0.18, u) * (1 - smoothstep(0.88, 1, u));
  const beat = Math.sin(u * Math.PI * 5.6);
  n.hips.position.y = 0.94 - lean * 0.09 - Math.max(0, -beat) * 0.05;
  n.chest.rotation.set(0.06 + lean * 0.22 + beat * 0.13, 0, beat * 0.03);
  n.head.rotation.set(0.1 + lean * 0.05, 0, 0);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['sh' + A].rotation.set(-0.5 - lean * 0.5 + beat * 0.5, 0, s * (0.15 + lean * 0.05));
    n['el' + A].rotation.x = -0.5 - lean * 0.4 + beat * 0.3;
    n['th' + A].rotation.set(0.1 - lean * 0.32, 0, s * 0.05);
    n['kn' + A].rotation.x = 0.1 + lean * 0.5;
  }
}

// a stake and a rag: the mallet comes down twice, then a hand presses the stake home
function pStake(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const squat = smoothstep(0.02, 0.2, u) * (1 - smoothstep(0.86, 1, u));
  const swing = u < 0.62 ? Math.max(0, Math.sin(((u % 0.31) / 0.31) * Math.PI)) : 0;
  const press = u > 0.7 ? smoothstep(0.7, 0.8, u) * (1 - smoothstep(0.9, 1, u)) : 0;
  n.hips.position.y = 0.94 - squat * 0.26 - press * 0.1;
  n.chest.rotation.set(0.06 + squat * 0.3 + swing * 0.1 + press * 0.24, 0, -swing * 0.06);
  n.head.rotation.set(squat * 0.2, 0, 0);
  n.shR.rotation.set(-0.3 - swing * 2.1 - press * 0.5, 0, 0.2 + squat * 0.1);
  n.elR.rotation.x = -0.4 - swing * 0.5;
  n.shL.rotation.set(-0.25 - squat * 0.75, 0, -0.2 - squat * 0.12);
  n.elL.rotation.x = -0.45 - squat * 0.5;
  n.thR.rotation.set(0.06 - squat * 0.25, 0, 0.12);
  n.knR.rotation.x = 0.12 + squat * 0.4;
  n.thL.rotation.set(0.02 - squat * 0.15, 0, -0.16);
  n.knL.rotation.x = 0.1 + squat * 0.32;
}

const POSERS = { hose: pHose, crank: pCrank, prime: pPrime, sign: pStake };

export class BogArrival {
  constructor(game) {
    this.g = game;
    this.state = 'idle'; // idle | run | done
    this.t = 0;
    this.active = false;
    this.cast = [];
    this.hold = false; // (debug: freeze the clock, keep posing)
    this.cues = {};
    this._cam = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._tmp = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this.keyA = new THREE.Vector3();
    this.keyB = new THREE.Vector3();
    this.dur = 14;
    this.tJump = 9;
    this.tCrane = 12;
    this.tFade = 12.6;
    this.fireSnd = null;
    this.carSnd = null;
    this.pumpSnd = null;
    this.pumpAt = -1;
    this.propMat = createWorldMaterial();
    this.day0 = 0.95; // the light of the last day (Game.startMorning's MORNING_LIGHT)
    this.tDusk = 9.6; // when the sky starts to go: the pump has just taken water
    this.tDuskEnd = 12.2;
    this.duskHit = false;
  }

  // ---------------- begin / end ----------------
  begin() {
    this.state = 'run';
    this.active = true;
    this.done = false;
    this.titleShown = false;
    this.skipping = false;
    this.t = 0;
    this.skipT = 0;
    this.cues = {};
    this.cast.length = 0;
    this.built = false;
    this.pumpAt = -1;
    this.carSnd = null;
    this.pumpSnd = null;
    this.g.state = 'intro';
    this.g.fx.fade = 0; // out of the black
    this.g.hud.setIntro(null);
    this.g.hud.setHint(null);
    this.g.hud.setUse(null);
    this.g.hud.setSkip(true, 'intro');
    document.body.classList.add('intro');
    this.g.audio.setMorning(true);
    this.g.fire.reset();
    this.duskHit = false;
    shared.uDawn.value = this.day0;
    shared.uMorning.value = 1; // the last day: a high sun, the warm palette
  }

  // the film is over (or skipped): put everything away and hand over to the first night
  _teardown() {
    if (this.carSnd) { this.carSnd.stop(0.6); this.carSnd = null; }
    if (this.pumpSnd) { this.pumpSnd.stop(0.9); this.pumpSnd = null; }
    if (this.carNode) { this.g.scene.remove(this.carNode); this.carNode.geometry?.dispose(); this.carNode = null; }
    const staticCar = this.g.world?.crewCar?.node;
    if (staticCar) staticCar.visible = true; // the car the world keeps: it was here all along
    for (const a of this.cast) {
      undressPerson(a.meshes);
      this.g.scene.remove(a.rig.root);
      a.mat.dispose();
      for (const p of a.props) if (p.mesh.parent) p.mesh.parent.remove(p.node || p.mesh);
    }
    this.cast.length = 0;
    if (this.fireSnd) { this.fireSnd.stop(1.6); this.fireSnd = null; }
    this.g.fire.out();
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

  // the last beat: the picture goes dark, the night begins (Game.startNight sets the clocks)
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
  // Every seat of the lobby is the player who owns it (their own clothes, their own colour); alone it is one
  // person and their own part of the shift.
  _seats() {
    // (?seats=N in the URL: preview a full lobby's four jobs alone — nothing else uses this)
    if (!this.g.online && this.forceSeats > 1) {
      const heads = ['hood', 'ushanka', 'animehair', 'boykisser'];
      const bodies = ['jacket', 'tulup', 'seifuku', 'fluffy'];
      return SEATS.slice(0, Math.min(4, this.forceSeats | 0)).map((seat, i) => ({
        slot: i,
        fit: i === 0 ? myFit() : cleanFit({ head: heads[i], body: bodies[i] }),
        seat,
      }));
    }
    if (!this.g.online) return [{ slot: 0, fit: myFit(), seat: SOLO_SEAT, solo: true }];
    const out = [];
    const me = this.g.player;
    out.push({ slot: (me.slot | 0) % 4, fit: myFit() });
    for (const r of this.g.remotes.values()) out.push({ slot: (r.slot | 0) % 4, fit: r.fit });
    const seen = new Set();
    return out.filter((p) => (seen.has(p.slot) ? false : (seen.add(p.slot), true)))
      .sort((a, b) => a.slot - b.slot)
      .map((p) => ({ ...p, seat: SEATS[p.slot] }));
  }

  // the staging: the pump, the road, the water and the car, measured once by the world
  _set() {
    const cs = this.g.world?.campSet;
    return cs || (this._fallback || (this._fallback = fallbackSet()));
  }

  _build() {
    this.built = true;
    const set = this._set();
    this.set = set;
    const ground = (x, z) => this.g.world.terrain.height(x, z);
    const car = set.car;
    this.carYaw = car.yaw;
    this.carY = ground(car.x, car.z);
    // the film drives its own car along the road the world left ruts in; the parked one is put away until the
    // film is over, and it is standing exactly where the film leaves this one
    // it comes up the road the world left ruts in: the same heading, twenty-four metres back
    this.carStart = { x: car.x + CAMP_TRACK.x * 24, z: car.z + CAMP_TRACK.z * 24 };
    const b = crewCarBody(new MeshBuilder(320));
    this.carNode = new THREE.Mesh(b.toGeometry(), this.propMat);
    this.carNode.frustumCulled = false;
    this.g.scene.add(this.carNode);
    const staticCar = this.g.world?.crewCar?.node;
    if (staticCar) staticCar.visible = false;

    const list = this._seats();
    for (const p of list) {
      const seat = p.seat;
      const rig = buildSurvivor(p.fit);
      rig.root.rotation.order = 'YXZ';
      const mat = createPersonMaterial(rig.dyes, PLAYER_HEX[p.slot % 4]);
      mat.uniforms.uShow.value = 1;
      const meshes = dressPerson(rig, mat);
      rig.root.visible = false;
      this.g.scene.add(rig.root);
      const a = {
        slot: p.slot,
        solo: !!p.solo,
        seat,
        rig,
        mat,
        meshes,
        props: [],
        phase: 0,
        hit: {},
        x: car.x,
        z: car.z,
        y: this.carY,
        yaw: car.yaw,
        yawCur: car.yaw,
        px: car.x,
        pz: car.z,
        u: 0,
        show: 0,
        lift: 0,
        done: false,
        work: {
          hose: set.hose,
          crank: set.crank,
          prime: set.prime,
          sign: set.sign,
        }[seat.act] || set.crank,
      };
      a.door0 = this._doorPoint(a);
      this._props(a);
      this.cast.push(a);
    }
    this._plan();
    this.fireSnd = this.g.audio.fire(0, ground(0, 0) + 0.5, 0);
  }

  // the thing in their hands: a jerry can for priming, a mallet for the marker
  _props(a) {
    const build = {
      prime: (b) => {
        b.box(0.22, 0.3, 0.13, KIND.METAL, { bottom: true });
        b.place(0, 0.16, 0, 0, 0, Math.PI / 2);
        b.limb([0, 0, 0], [0.05, 0, 0.02], 0.018, 0.018, KIND.METAL, 3);
      },
      sign: (b) => {
        b.place(0, 0, 0, 0, 0, 0);
        b.box(0.1, 0.12, 0.26, KIND.WOOD);
        b.place(0, -0.19, 0.06, Math.PI / 2 - 0.3, 0, 0);
        b.limb([0, 0, 0], [0, 0.55, 0], 0.022, 0.022, KIND.WOOD, 4);
      },
    }[a.seat.act];
    if (!build) return;
    const b = new MeshBuilder(128);
    build(b);
    const mesh = new THREE.Mesh(b.toGeometry(), this.propMat);
    mesh.frustumCulled = false;
    const node = new THREE.Object3D();
    if (a.seat.act === 'prime') node.position.set(0, -0.34, 0.1);
    else node.position.set(0, -0.36, 0.12);
    node.add(mesh);
    a.rig.nodes.elR.add(node);
    node.visible = false;
    a.props.push({ mesh, node, kind: a.seat.act });
  }

  // The schedule. Everything after the doors is a pure function of film time, so a seek, a slow phone and 60 fps
  // all see the same film.
  _plan() {
    const n = Math.max(1, this.cast.length);
    const lastDoor = STOP + DOORS + (n - 1) * DOOR_GAP;
    this.tJump = lastDoor + STEP_OUT + WADE; // the cut: we do not watch them climb the whole bank
    let tEnd = 0;
    this.cast.forEach((a, i) => {
      const door = STOP + DOORS + i * DOOR_GAP;
      const dist = Math.hypot(a.work.x - a.door0.x, a.work.z - a.door0.z);
      const walkFull = Math.max(0.8, dist / WALK_SPEED);
      const tAct = this.tJump + 0.35 + i * 0.22;
      const dur = ACT_DUR[a.seat.act] || 2.2;
      // where along that line the flood is: the boots go in there, and not anywhere else
      a.splashAt = [];
      const water = this.g.world?.water;
      if (water?.depth) {
        for (let f = 0.08; f < 0.95; f += 0.05) {
          const x = lerp(a.door0.x, a.work.x, f), z = lerp(a.door0.z, a.work.z, f);
          if (water.depth(x, z) > 0.1) a.splashAt.push(f);
        }
        if (a.splashAt.length > 3) a.splashAt = [a.splashAt[0], a.splashAt[Math.floor(a.splashAt.length / 2)], a.splashAt[a.splashAt.length - 1]];
      }
      a.plan = { door, walkFull, tAct, dur, tEnd: tAct + dur };
      tEnd = Math.max(tEnd, tAct + dur);
    });
    this.dur = tEnd + 1.7;
    this.tFade = this.dur - 1.4;
    this.tCrane = Math.max(this.tJump + 1.2, tEnd - 0.4);
    const crank = this.cast.find((a) => a.seat.act === 'crank');
    this.tDusk = (crank ? crank.plan.tAct + 0.8 : this.tJump + 1.0);
    this.tDuskEnd = Math.min(this.dur - 1.2, this.tDusk + 2.6);
  }

  // ---------------- per frame ----------------
  update(dt, events) {
    if (this.state !== 'run') return;
    if (!this.built) this._build();
    const silent = this.seeking;
    this.seeking = false;
    if (!this.hold) this.t += dt;
    const tt = this.t;

    // skip: Enter, or the touch button — the last shot fades out and the night starts
    const ev = Array.isArray(events) ? events : [];
    if (!silent && (ev.includes('confirm') || ev.includes('skip')) && !this.skipping) {
      this.skipping = true;
      this.skipAt = tt;
      this.tFade = tt;
      this.dur = Math.min(this.dur, tt + (tt < this.tJump ? 1.1 : 0.9));
    }

    this._sky(tt, silent);
    this.g.fire.douse(0.78 + 0.07 * Math.sin(tt * 2.1)); // the camp fire is burning: this is their own camp
    this.g.fire.update(dt);
    if (this.fireSnd) this.fireSnd.level(0.5);
    this._car(tt, silent);
    this._pump(tt, silent);
    this._actors(tt, dt, silent);
    this._hud(tt);

    // the picture: out of the black, and back into it at the end
    if (tt < 1.0) this.g.fx.fade = smoothstep(0, 1.0, tt);
    else if (tt >= this.tFade) this.g.fx.fade = 1 - smoothstep(this.tFade, this.dur, tt);
    else this.g.fx.fade = 1;
    if (tt >= this.dur) this.finish();
  }

  // the car: out of the rain on the far road, slowing, and stopping with its nose at the water
  _car(tt, silent) {
    const set = this.set;
    const k = clamp(tt / STOP, 0, 1);
    const e = 1 - (1 - k) * (1 - k); // it slows down as it comes into the flood
    const x = lerp(this.carStart.x, set.car.x, e);
    const z = lerp(this.carStart.z, set.car.z, e);
    const y = this.g.world.terrain.height(x, z);
    // a little nose-down as the brakes come on, then a settle on the springs
    const settle = tt > STOP ? Math.exp(-(tt - STOP) * 4) * Math.sin((tt - STOP) * 22) * 0.03 : 0;
    this.carNode.position.set(x, y + settle, z);
    this.carNode.rotation.set(settle * 0.6, this.carYaw, 0);
    this.carPos = { x, y, z };
    if (silent) return;

    const hit = (key, at, fn) => {
      if (tt >= at && !this.cues[key]) { this.cues[key] = true; fn(); }
    };
    hit('engine', 0.15, () => {
      this.carSnd = this.g.audio.uazStart(x, y + 0.7, z);
      if (this.carSnd) this.carSnd.rev(0.55, { x, y: y + 0.7, z });
    });
    if (this.carSnd && tt < STOP) {
      // pitch follows the speed: high on the road, dropping as it comes into the water
      this.carSnd.rev(clamp(0.75 - 0.35 * k + 0.05 * Math.sin(tt * 3.1), 0.2, 1), { x, y: y + 0.7, z });
    }
    hit('stop', STOP + 0.35, () => {
      if (this.carSnd) { this.carSnd.stop(1.4); this.carSnd = null; }
    });
    this.cast.forEach((a, i) => {
      hit('door' + i, a.plan.door, () => {
        const d = this._doorPoint(a);
        this.g.audio.carDoor(d.x, d.y + 0.8, d.z, false);
      });
    });
  }

  // the pump: the lever bites, the cylinder takes water, and then it is running for the rest of the film
  _pump(tt, silent) {
    if (silent) return;
    const set = this.set;
    const crank = this.cast.find((a) => a.seat.act === 'crank');
    if (!crank) {
      // (a lobby that has no crank seat in it: the pump is still started, just not by anyone we can see)
      if (this.pumpAt < 0 && tt >= this.tJump + 1.0) {
        this.pumpAt = tt;
        this.g.audio.pumpStart(set.pump.x, set.pump.y + 1.0, set.pump.z);
        this.pumpSnd = this.g.audio.pumpRun(set.pump.x, set.pump.y + 0.6, set.pump.z, 0.5);
      }
      if (this.pumpSnd) this.pumpSnd.level(0.5 + 0.3 * clamp((tt - this.tJump - 1) / 2, 0, 1));
      return;
    }
    const p = crank.plan;
    const u = (tt - p.tAct) / p.dur;
    if (this.pumpAt < 0 && u >= 0.22) {
      this.pumpAt = tt;
      this.g.audio.pumpStart(set.pump.x, set.pump.y + 1.0, set.pump.z);
      if (this.carSnd) { this.carSnd.stop(0.8); this.carSnd = null; }
    }
    const hit = (key, at, fn) => {
      if (u >= at && !this.cues[key]) { this.cues[key] = true; fn(); }
    };
    hit('lever1', 0.06, () => this.g.audio.clank(set.pump.x, set.pump.y + 1.2, set.pump.z, 0.35));
    hit('lever2', 0.34, () => this.g.audio.clank(set.pump.x, set.pump.y + 1.2, set.pump.z, 0.3));
    hit('take', 0.5, () => {
      this.pumpSnd = this.g.audio.pumpRun(set.pump.x, set.pump.y + 0.6, set.pump.z, 0.35);
      this.g.hud.setIntro(null);
    });
    hit('water', 0.62, () => {
      this.pumpSnd?.glug({ x: set.water.x, z: set.water.z });
      this.g.audio.wade(0.35, 0.7);
    });
    if (this.pumpSnd) {
      const k = clamp((tt - p.tAct - p.dur * 0.5) / 2.2, 0, 1);
      this.pumpSnd.level(0.35 + 0.45 * k);
    }
  }

  // ---------------- the cast, frame by frame ----------------
  _doorPoint(a) {
    const set = this.set;
    const yaw = this.carYaw;
    const lx = a.seat.side * 1.6;
    const lz = a.seat.row ? -1.05 : 0.55;
    const x = set.car.x + lx * Math.cos(yaw) + lz * Math.sin(yaw);
    const z = set.car.z - lx * Math.sin(yaw) + lz * Math.cos(yaw);
    return { x, z, y: this.g.world.terrain.height(x, z) };
  }

  _actors(tt, dt, silent) {
    const ground = (x, z) => this.g.world.terrain.height(x, z);
    this.cast.forEach((a, i) => {
      const p = a.plan;
      const n = a.rig.nodes;
      const door = a.door0;
      const poser = POSERS[a.seat.act] || pCrank;
      const toPump = Math.atan2(this.set.pump.x - a.work.x, this.set.pump.z - a.work.z);
      this._propVis(a, false);
      a.rig.root.rotation.set(0, a.yaw, 0);
      n.hips.position.set(0, 0.94, 0);
      n.hips.rotation.set(0, 0, 0);
      pStand(a.rig, tt);
      a.mat.uniforms.uShow.value = 1;
      let visible = true;

      if (tt < p.door) {
        // still in the car: not in the shot
        visible = false;
        a.x = this.carNode.position.x;
        a.z = this.carNode.position.z;
        a.yaw = this.carYaw;
        a.phase = 0;
      } else if (tt < this.tJump) {
        // out of the door and into the water, walking towards the pump
        const u = clamp((tt - p.door - STEP_OUT) / Math.max(0.2, p.walkFull), 0, 1);
        a.x = lerp(door.x, a.work.x, u);
        a.z = lerp(door.z, a.work.z, u);
        a.yaw = Math.atan2(a.work.x - door.x, a.work.z - door.z);
        const d = Math.hypot(a.work.x - door.x, a.work.z - door.z);
        a.phase = u * d / 0.62 * Math.PI;
        const spd = p.walkFull > 0 ? d / p.walkFull : 0;
        if (u <= 0.001) { pStand(a.rig, tt); a.phase = 0; }
        else { poseSurvivor(a.rig, a.phase, spd, false, false); poseFur(a.rig, dt, spd); }
        a.u = 0;
        // the splash of a boot going into the flood: three of them, at the water
        if (!silent && a.splashAt) {
          a.splashAt.forEach((f, k) => {
            if (u >= f && !a.hit['w' + k]) {
              a.hit['w' + k] = true;
              this.g.audio.wade(0.5 + 0.1 * k, 0.5);
            }
          });
        }
      } else if (tt < p.tAct) {
        // the cut lands on them already at the pump, catching their breath
        a.x = a.work.x;
        a.z = a.work.z;
        a.yaw = toPump;
        a.phase = 0;
        pStand(a.rig, tt);
        poseFur(a.rig, dt, 0);
        a.u = 0;
      } else if (tt < p.tEnd) {
        // their own part of the job
        const u = clamp((tt - p.tAct) / p.dur, 0, 1);
        a.x = a.work.x;
        a.z = a.work.z;
        a.yaw = toPump;
        const blend = smoothstep(0, 0.1, u) * (1 - smoothstep(0.9, 1, u));
        this._mix(a, pStand, (r, t2) => poser(r, u, t2), blend, tt + i);
        a.u = u;
        a.phase = 0;
        poseFur(a.rig, dt, 0);
        this._propVis(a, true);
        this._actFx(a, tt, u, silent);
      } else {
        // done: stand there and watch the water find its way out
        a.x = a.work.x;
        a.z = a.work.z;
        a.yaw = toPump;
        pStand(a.rig, tt);
        poseFur(a.rig, dt, 0);
        a.u = 1;
        a.phase = 0;
      }
      a.rig.root.visible = visible;
      a.show = visible ? 1 : 0;
      a.yawCur = a.yaw;
      a.rig.root.position.set(a.x, ground(a.x, a.z), a.z);
      a.rig.root.rotation.y = a.yawCur;
      // the thing in their hands follows the beat
      if (a.props[0] && a.seat.act === 'sign') {
        a.props[0].node.rotation.set(a.u > 0.02 && a.u < 0.66 ? Math.sin(a.u * Math.PI * 3.2) * 0.5 : 0, 0, 0);
      } else if (a.props[0] && a.seat.act === 'prime') {
        const tip = smoothstep(0.42, 0.58, a.u) * (1 - smoothstep(0.7, 0.86, a.u));
        a.props[0].node.rotation.set(0.1 + tip * 1.5, 0, 0);
      }
      a.px = a.x;
      a.pz = a.z;
    });
  }

  // a cross-fade between two poses (a tiny mixer: only the joints and the hips' height)
  _mix(a, poseA, poseB, k, tt) {
    const A = this._poseA || (this._poseA = {});
    const B = this._poseB || (this._poseB = {});
    if (k >= 1) { poseB(a.rig, tt); return; }
    if (k <= 0) { poseA(a.rig, tt); return; }
    poseA(a.rig, tt);
    this._capture(a.rig, A);
    poseB(a.rig, tt);
    this._capture(a.rig, B);
    for (const name of POSE_NODES) {
      const na = a.rig.nodes[name];
      const o1 = A[name], o2 = B[name];
      na.position.set(lerp(o1.px, o2.px, k), lerp(o1.py, o2.py, k), lerp(o1.pz, o2.pz, k));
      na.rotation.set(lerp(o1.rx, o2.rx, k), lerp(o1.ry, o2.ry, k), lerp(o1.rz, o2.rz, k));
    }
  }

  _capture(rig, out) {
    for (const name of POSE_NODES) {
      const nd = rig.nodes[name];
      const o = out[name] || (out[name] = {});
      o.px = nd.position.x; o.py = nd.position.y; o.pz = nd.position.z;
      o.rx = nd.rotation.x; o.ry = nd.rotation.y; o.rz = nd.rotation.z;
    }
  }

  _propVis(a, on) {
    for (const p of a.props) p.node.visible = on;
  }

  // sounds at the exact beat of each action
  _actFx(a, tt, u, silent) {
    if (silent) return;
    const hit = (key, at, fn) => {
      if (u >= at && !a.hit[key]) { a.hit[key] = true; fn(); }
    };
    const set = this.set;
    const pumpY = set.pump.y;
    const act = a.seat.act;
    if (act === 'hose') {
      hit('h1', 0.2, () => this.g.audio.wade(0.4, 0.5));
      hit('h2', 0.55, () => this.g.audio.wade(0.6, 0.6));
      hit('h3', 0.82, () => this.pumpSnd?.glug({ x: set.water.x, z: set.water.z }));
    } else if (act === 'prime') {
      hit('p1', 0.16, () => this.g.audio.clank(set.pump.x, pumpY + 1.1, set.pump.z, 0.25));
      hit('p2', 0.5, () => {
        this.g.audio.splash(0.4);
        this.g.audio.wade(0.3, 0.2);
      });
      hit('p3', 0.86, () => this.g.audio.clank(set.pump.x, pumpY + 1.1, set.pump.z, 0.2));
    } else if (act === 'crank') {
      // (the lever and the water are driven by _pump: they have to land on one clock for the whole shot)
    } else if (act === 'sign') {
      hit('k1', 0.28, () => this.g.audio.whump(set.marker.x, ground(this.g, set.marker.x, set.marker.z) + 0.4, set.marker.z, 0.9));
      hit('k2', 0.58, () => this.g.audio.whump(set.marker.x, ground(this.g, set.marker.x, set.marker.z) + 0.4, set.marker.z, 0.7));
      hit('k3', 0.78, () => this.g.audio.wade(0.2, 0.3));
    }
  }

  // the day ends over the work: the same stutter as a real dusk (a bulb dying), slow, and only once the pump
  // has taken water. The sky goes with uDawn, all the way down to black.
  _sky(tt, silent) {
    const span = Math.max(1.8, this.tDuskEnd - this.tDusk);
    const k = clamp((tt - this.tDusk) / span, 0, 1);
    let L = lerp(this.day0, 0.3, smoothstep(0.08, 1, k));
    L += 0.11 * smoothstep(this.tDuskEnd, this.tDuskEnd + 1.5, tt); // a breath of moonlight, so the sleepers show
    if (k > 0.1 && k < 0.9 && Math.sin(tt * 37) * Math.sin(tt * 13) > 0.45) L *= 0.62;
    shared.uDawn.value = L;
    shared.uMorning.value = 1 - smoothstep(0, 0.75, k);
    if (!this.duskHit && k > 0.06) {
      this.duskHit = true;
      if (!silent) {
        this.g.audio.dusk();
        this.g.fx.glitch = Math.max(this.g.fx.glitch, 0.3);
      }
    }
  }

  _hud(tt) {
    // the title over the arrival, then the work, then the night (startNight sets its own tag)
    if (tt > 1.0 && tt < DRIVE + 0.6 && !this.titleShown) {
      this.titleShown = true;
      this.g.hud.setIntro(t('introBig'), t('introSmall'));
    }
    if (tt > DRIVE + 0.6 && this.titleShown) {
      this.titleShown = false;
      this.g.hud.setIntro(null);
    }
  }

  // ---------------- the camera ----------------
  // Keys, not a spline: a film is a sequence of shots, and one of them is a cut (at the water, when the crossing
  // is over). Between keys the camera eases; on a cut it snaps.
  _camKeys() {
    if (this._keys) return this._keys;
    const s = this.set;
    // the staging, in the set's own vectors: `tw` is towards the water, `sd` along the bank
    const tw = s.toWater, sd = s.side;
    const at = (f, side, dy) => [s.pump.x + tw.x * f + sd.x * side, s.pump.y + dy, s.pump.z + tw.z * f + sd.z * side];
    const look = (x, y, z) => [x, y, z];
    const carNose = { x: s.car.x - CAMP_TRACK.x * 2.2, z: s.car.z - CAMP_TRACK.z * 2.2 };
    const road = { x: this.carStart.x, z: this.carStart.z };
    const mid = { x: lerp(s.car.x, road.x, 0.45), z: lerp(s.car.z, road.z, 0.45) };
    const cross = { x: lerp(s.car.x, s.near.x, 0.4), z: lerp(s.car.z, s.near.z, 0.4) };
    // the four of them work in a loose ring round the pump: the next shot is aimed at the ring, not at the pump
    const work = { x: (s.hose.x + s.prime.x + s.crank.x + s.sign.x) / 4, z: (s.hose.z + s.prime.z + s.crank.z + s.sign.z) / 4 };
    const k = [
      // 1. the road, the water and the camp: the car is out there in the rain, coming in
      { t: 0, p: at(-4.5, 5.2, 4.3), l: look(mid.x, 1.2, mid.z), fov: 46 },
      { t: DRIVE * 0.72, p: at(-1.2, 2.6, 2.9), l: look(s.car.x, 1.1, s.car.z), fov: 48 },
      // 2. it stops at the water, and the doors open one after another
      { t: STOP + 0.25, p: at(-1.3, 4.3, 2.4), l: look(carNose.x, 1.1, carNose.z), fov: 47 },
      { t: STOP + 2.1, p: at(-2.6, 5.6, 2.5), l: look((s.car.x + carNose.x) / 2, 1.0, (s.car.z + carNose.z) / 2), fov: 46 },
      // 3. the wade: low, in the water, and they come past the camera on their way to the pump
      { t: STOP + 3.1, p: at(1.4, 2.3, 1.5), l: look(cross.x, 1.3, cross.z), fov: 50 },
      // 4. (cut) the work: four of them round the pump, and the lever going
      { t: this.tJump, cut: true, p: at(-3.8, 1.3, 3.2), l: look(work.x, 1.2, work.z), fov: 52 },
      { t: this.tJump + 1.5, p: at(-2.7, 2.1, 2.5), l: look(work.x + tw.x * 0.5, 1.1, work.z + tw.z * 0.5), fov: 50 },
      { t: this.tDusk + 0.4, p: at(-1.4, 3.0, 2.2), l: look(s.pump.x + tw.x * 0.6, 1.1, s.pump.z + tw.z * 0.6), fov: 48 },
      // 5. the water: pull back and up, and the flood is the last thing in the light
      { t: this.tDuskEnd, p: at(-5.0, 5.6, 4.4), l: look(s.water.x - 1.4, 1.0, s.water.z), fov: 54 },
      { t: this.dur, p: at(-12.0, 8.0, 8.5), l: look(s.water.x - 4.0, 0.9, s.water.z + 0.5), fov: 58 },
    ];
    k.sort((a, b) => a.t - b.t); // (a lobby with no crank seat at all: the keys still come out in order)
    this._keys = k;
    return k;
  }

  applyCamera(camera) {
    if (!this.active) return false;
    const tt = this.t;
    const keys = this._camKeys();
    let i = 0;
    while (i < keys.length - 1 && tt > keys[i + 1].t) i++;
    const A = keys[i], B = keys[Math.min(i + 1, keys.length - 1)];
    if (B === A || A.cut || B.cut) {
      this._cam.set(A.p[0], A.p[1], A.p[2]);
      this._look.set(A.l[0], A.l[1], A.l[2]);
      camera.fov = A.fov;
    } else {
      const span = Math.max(1e-3, B.t - A.t);
      const k = smoothstep(0, 1, clamp((tt - A.t) / span, 0, 1));
      this._cam.set(lerp(A.p[0], B.p[0], k), lerp(A.p[1], B.p[1], k), lerp(A.p[2], B.p[2], k));
      this._look.set(lerp(A.l[0], B.l[0], k), lerp(A.l[1], B.l[1], k), lerp(A.l[2], B.l[2], k));
      camera.fov = lerp(A.fov, B.fov, k);
    }
    camera.position.copy(this._cam);
    camera.lookAt(this._look);
    // a breath of handheld: rain, boots and a camera that is not on a tripod
    const hh = 0.0032;
    camera.rotateZ(Math.sin(tt * 0.9) * hh + Math.sin(tt * 2.3 + 1) * hh * 0.5);
    camera.rotateX(Math.sin(tt * 0.7 + 2) * hh);
    camera.updateProjectionMatrix();
    return true;
  }

  // (debug: jump to a moment of the film without playing the sound cues)
  seek(tt) {
    this.t = tt;
    this.seeking = true;
  }
}

// a small helper the sound cues use: the ground under a point in the world
function ground(g, x, z) {
  return g.world.terrain.height(x, z);
}

// ---------------- which film opens the shift (3.0l) ----------------
// Two участка, two ways of arriving. The forestry still begins with the last light over the camp fire (2.1j); the
// bog begins on the road, at the flooded проезд. `new IntroCutscene(game)` returns the right one for the map, so
// Game keeps talking to a single object with begin/update/applyCamera/cancel/seek on it.
export class IntroCutscene {
  constructor(game) {
    return game.map === 'bog' ? new BogArrival(game) : new DuskFilm(game);
  }
}

export { DuskFilm } from './duskFilm.js';
