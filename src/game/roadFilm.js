// The forest's opening, first half (3.1n): «Дорога». The squad drives out to the forestry at sunset in the УАЗ, the
// radio on, and leaves the car in the yard; then the camp's last evening (campFilm.js) takes over.
//
//   0 – 39 s   the highway: a wide shot of the car coming out of the low sun; the passenger finds the station
//              (static, then the song); a side shot alongside, the back seats, an arm out of the window in the
//              wind as the car rushes past, the drone behind it. The highway is ~170 m from the edge of the world
//              to the turn, so the drive is cut: each shot runs the car along a stretch of it.
//   39 s –     the arrival, one continuous drive baked in _plan(): slow for the turn, off the highway into the cut,
//              down to the yard's back gate, round the yard and nose back to the gate — where the game's own
//              stripped УАЗ stands all shift. Ignition off: the song stops mid-line. Doors, out, a stretch, and they
//              walk off toward the booth. Then the picture goes dark and the camp's film begins.
//
// Each seat is the player who owns it (their own clothes and colour), and each does something of their own on the
// way: the driver drives (and glances over), the front passenger tunes the radio and rides the wind with an arm out
// of the window, the one behind the driver sleeps against the glass (and wakes when the engine stops), the one
// behind the passenger reads the map. Alone, you drive and tune it yourself. Heads move on the song's beat
// (129 bpm, measured from the track). Enter skips the whole opening (ForestOpening in intro.js).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { CFG } from '../core/config.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { createWorldMaterial, shared } from '../render/sonar.js';
import { buildCrewCar, SEATS as CAR_SEATS } from './uaz.js';
import { buildSurvivor, poseSeated, poseSurvivor } from './survivor.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { PLAYER_HEX } from './remote.js';
import { myFit, cleanFit } from './outfit.js';
import { CAR_AT } from '../world/yard.js';

const PI = Math.PI;
const Y = CFG.YARD;
const R = CFG.ROAD;
const LANE = R.z - 1.9; // the near lane, heading west: the cut is a right turn off it
export const BEAT = 60 / 129; // «вайфуу»: 129 beats a minute (autocorrelation of the track's onsets)
export const BEAT0 = 0.409; // ...the first downbeat, in song seconds
export const TUNE_AT = 8.2; // the passenger turns the knob
export const TUNE_DUR = 1.7; // static, then the station
export const TF = 39.5; // the arrival's continuous drive begins
const WHEEL_R = 0.39;

// the highway shots: a stretch of road each (x from → to, heading west), cut together
export const ROAD_SHOTS = [
  { k: 'wide', t0: 0, t1: 7, hw: [262, 160] },
  { k: 'radio', t0: 7, t1: 13.5, hw: [252, 160] },
  { k: 'side', t0: 13.5, t1: 20.5, hw: [262, 158] },
  { k: 'rear', t0: 20.5, t1: 26.5, hw: [254, 166] },
  { k: 'pass', t0: 26.5, t1: 32.5, hw: [262, 128] },
  { k: 'drone', t0: 32.5, t1: TF, hw: [262, 168] },
];

// the way in, world x/z: off the highway, down the cut, through the back gate and round the yard to the spot
export function arrivalPath() {
  const X = Y.x, Z = Y.z, hd = Y.d / 2;
  return [
    [X + 80, LANE], [X + 50, LANE], [X + 22, LANE], [X + 9, R.z - 2.6], [X + 1.6, R.z - 6.2], [X + 0.2, R.z - 14],
    [X - 0.4, Z + hd + 44], [X + 0.2, Z + hd + 22], [X + 0.6, Z + hd + 4], [X + 0.7, Z + 9], [X + 4, Z + 4],
    [X + 9, Z], [X + 11.5, Z - 4], [X + 10, Z - 8.5], [X + 5.5, Z - 9], [X + 2.8, Z - 5.5], [X + CAR_AT.x, Z - 1],
    [X + CAR_AT.x, Z + CAR_AT.z],
  ];
}

// who does what on the way: by seat (0 driver, 1 front passenger, 2 behind the driver, 3 behind the passenger)
export const ROLES = ['drive', 'radio', 'sleep', 'map'];

// a nod on the beat: 0..1, sharp on the downbeat, easing off before the next
export function beatPulse(songT) {
  if (!(songT > 0)) return 0;
  const ph = (((songT - BEAT0) / BEAT) % 1 + 1) % 1;
  return Math.exp(-ph * 5.5);
}

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _e = new THREE.Euler(0, 0, 0, 'YXZ');

export class RoadFilm {
  constructor(game) {
    this.g = game;
    this.state = 'idle'; // idle | run | done
    this.done = false;
    this.t = 0;
    this.cast = [];
    this.cues = {};
    this.hold = false; // (debug: freeze the clock)
    this.car = null;
    this._cam = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this.pose = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, v: 0, dist: 0 };
    this.dur = 70;
    this.tFade = Infinity;
  }

  // ---------------- begin / end ----------------
  begin() {
    this._clear();
    this.state = 'run';
    this.done = false;
    this.t = 0;
    this.cues = {};
    this.built = false;
    this.skipAll = false;
    this.tFade = Infinity;
    const g = this.g;
    g.state = 'intro';
    g.fx.fade = 0;
    g.hud.setIntro(null);
    g.hud.setHint(null);
    g.hud.setUse(null);
    g.hud.setSkip(true, 'intro');
    if (typeof document !== 'undefined') document.body.classList.add('intro');
    g.audio?.setMorning?.(true);
    // sunset: the day is still up, warm, the sun low in the west, down the road the car is driving
    shared.uDawn.value = 0.9;
    shared.uMorning.value = 1;
    shared.uSun.value.set(-0.85, 0.18, 0.28).normalize();
  }

  _clear() {
    for (const a of this.cast) {
      undressPerson(a.meshes);
      a.rig.root.removeFromParent();
      a.mat.dispose();
      if (a.map) a.map.removeFromParent();
    }
    this.cast.length = 0;
    if (this.car) { this.car.removeFromParent(); this.car = null; }
    if (this.engine) { this.engine.stop(0.3); this.engine = null; }
    if (this.radio) { this.radio.off(0.2); this.radio = null; }
    this._yardBack(false);
  }

  // the game's own УАЗ (the stripped one) gives the spot to the film's car, and the back gate stands open for it
  _yardBack(film) {
    const es = this.g.escape;
    if (!es) return;
    if (es.car) es.car.visible = !film;
    for (const L of es.backLeaves || []) {
      L.ang = film ? 1.45 : 0;
      L.vel = 0;
      L.mesh.rotation.y = (L.s < 0 ? 0 : PI) + L.ang * L.s;
    }
  }

  // the road part is over: the camp's film (or the night, on a skip) comes next
  end() {
    if (this.state !== 'run') return;
    this.state = 'done';
    this.done = true;
    this._clear();
    shared.uSun.value.set(0.42, 0.62, -0.66).normalize(); // (the camp's evening sun)
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
    const w = this.g.world;
    if (!w?.terrain) return R.y;
    const half = CFG.WORLD_HALF;
    const h = Math.abs(x) <= half && Math.abs(z) <= half ? w.terrain.height(x, z) : R.y;
    return Math.abs(z - R.z) < 6 ? Math.max(h, R.y) : h; // the highway is a built road, flat at its own level
  }

  _build() {
    this.built = true;
    const g = this.g;
    this.mat = this.mat || createWorldMaterial();
    this.car = buildCrewCar(this.mat);
    const glass = this.car.getObjectByName('glass');
    if (glass) glass.visible = false; // an open УАЗ, windscreen folded: up close the glass reads as a white board
    g.scene.add(this.car);
    const players = this._players();
    // alone you are the driver; a crew fills the seats in their lobby order
    players.forEach((p, i) => {
      const rig = buildSurvivor(p.fit);
      rig.root.rotation.order = 'YXZ';
      const mat = createPersonMaterial(rig.dyes, PLAYER_HEX[p.slot % 4]);
      mat.uniforms.uShow.value = 1;
      const meshes = dressPerson(rig, mat);
      g.scene.add(rig.root);
      const seat = players.length === 1 ? 0 : p.slot % 4;
      const a = { slot: p.slot, seat, role: ROLES[seat], solo: players.length === 1, rig, mat, meshes, out: null };
      if (a.role === 'map') a.map = this._mapProp(rig);
      this.cast.push(a);
    });
    this._yardBack(true);
    this._plan();
  }

  // a folded road map, in the reader's hands
  _mapProp(rig) {
    const b = new MeshBuilder(256);
    b.place(0, 0, 0, -0.6, 0, 0);
    b.box(0.42, 0.006, 0.3, KIND.BONE);
    b.place(-0.1, 0.005, 0.02, -0.6, 0, 0);
    b.box(0.12, 0.004, 0.08, KIND.LEAF);
    const m = new THREE.Mesh(b.toGeometry(), this.mat);
    m.frustumCulled = false;
    m.position.set(0, 0.4, 0.3);
    rig.nodes.chest.add(m);
    return m;
  }

  // the arrival, baked once: the car's distance along the way in, every 1/60 s from TF until it stops
  _plan() {
    const pts = arrivalPath().map(([x, z]) => new THREE.Vector3(x, this._ground(x, z), z));
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    this.L = this.curve.getLength();
    const at = (s) => this.curve.getPointAt(clamp(s / this.L, 0, 1));
    // where the turn is, the cut, the back gate
    let sTurn = 0, sGate = 0;
    for (let s = 0; s < this.L; s += 0.5) {
      const p = at(s);
      if (!sTurn && p.z < R.z - 3) sTurn = s;
      if (!sGate && p.z < Y.z + Y.d / 2 + 1) { sGate = s; break; }
    }
    this.sTurn = sTurn;
    this.sGate = sGate;
    const want = (s) => {
      let w = s < sTurn - 4 ? 14 : s < sGate - 6 ? 8.5 : 4.6;
      if (s < sTurn) w = Math.min(w, Math.sqrt(5.6 * 5.6 + 2 * 3.2 * Math.max(0, sTurn - s)));
      if (s < sGate) w = Math.min(w, Math.sqrt(4.6 * 4.6 + 2 * 3 * Math.max(0, sGate - s)));
      return Math.min(w, Math.sqrt(2 * 2.6 * Math.max(0, this.L - s)));
    };
    const S = [0];
    let s = 0, v = 14;
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 60; i++) {
      const w = want(s);
      v = v < w ? Math.min(w, v + 2.4 * dt) : Math.max(w, v - 3.4 * dt);
      s = Math.min(this.L, s + v * dt);
      S.push(s);
      if (this.L - s < 0.03 || (v < 0.05 && this.L - s < 0.6)) break;
    }
    S[S.length - 1] = this.L;
    this.S = S;
    const tOf = (pred) => { for (let i = 0; i < S.length; i++) if (pred(at(S[i]))) return TF + i / 60; return TF + S.length / 60; };
    this.tCut = tOf((p) => p.z < R.z - 18);
    this.tGate = tOf((p) => p.z < Y.z + Y.d / 2 + 3);
    this.tStop = TF + (S.length - 1) / 60;
    this.tOff = this.tStop + 0.6; // the ignition: the song stops mid-line
    this.tDoor = this.tStop + 1.3;
    this.tFade = this.tStop + 7.2;
    this.dur = this.tFade + 1.3;
    this.shots = [
      ...ROAD_SHOTS,
      { k: 'turn', t0: TF, t1: this.tCut },
      { k: 'cut', t0: this.tCut, t1: this.tGate },
      { k: 'yard', t0: this.tGate, t1: this.tStop + 1.0 },
      { k: 'out', t0: this.tStop + 1.0, t1: this.dur + 1 },
    ];
    // where each of them walks to when they are out: toward the front gate (and the camera), a little apart
    this.walkTo = [[-1.6, -7.4], [0.3, -8.2], [1.9, -7.2], [-0.2, -6.2]].map(([lx, lz]) => ({ x: Y.x + lx, z: Y.z + lz }));
  }

  shotAt(tt) {
    const list = this.shots || ROAD_SHOTS;
    for (const s of list) if (tt < s.t1) return s;
    return list[list.length - 1];
  }

  // the car, where it is at tt: { x, y, z, yaw (nose −x), pitch, v, dist (for the wheels) }
  carAt(tt, o = this.pose) {
    const sh = this.shotAt(tt);
    if (sh.hw) {
      const k = clamp((tt - sh.t0) / (sh.t1 - sh.t0), 0, 1);
      o.x = lerp(sh.hw[0], sh.hw[1], k);
      o.z = LANE;
      o.y = R.y + 0.015 * Math.sin(tt * 13.7) + 0.01 * Math.sin(tt * 5.3);
      o.yaw = 0.004 * Math.sin(tt * 0.9);
      o.pitch = 0.004 * Math.sin(tt * 7.1);
      o.v = (sh.hw[0] - sh.hw[1]) / (sh.t1 - sh.t0);
      o.dist = tt * o.v;
      return o;
    }
    const S = this.S;
    const u = clamp((tt - TF) * 60, 0, S.length - 1);
    const i = Math.floor(u), f = u - i;
    const s = i + 1 < S.length ? lerp(S[i], S[i + 1], f) : S[S.length - 1];
    const p = this.curve.getPointAt(clamp(s / this.L, 0, 1));
    const a = this.curve.getPointAt(clamp((s - 1.2) / this.L, 0, 1));
    const b = this.curve.getPointAt(clamp((s + 1.2) / this.L, 0, 1));
    const dx = b.x - a.x, dz = b.z - a.z;
    o.x = p.x;
    o.z = p.z;
    o.y = this._ground(p.x, p.z);
    o.yaw = Math.atan2(dz, -dx);
    // nose up when the ground ahead is higher (car-local nose −x: a rotation about its own z)
    o.pitch = -Math.atan2(this._ground(b.x, b.z) - this._ground(a.x, a.z), Math.hypot(dx, dz) || 1);
    o.v = i + 1 < S.length ? (S[i + 1] - S[i]) * 60 : 0;
    o.dist = 1000 + s; // (a cut from the highway: the wheels need not agree)
    return o;
  }

  // car-local → world, for the car where it is now
  toWorld(lx, ly, lz, out = new THREE.Vector3()) {
    this.car.updateMatrixWorld(true);
    return out.set(lx, ly, lz).applyMatrix4(this.car.matrixWorld);
  }

  // ---------------- the frame ----------------
  update(dt, events) {
    if (this.state !== 'run') return;
    if (!this.built) this._build();
    const silent = this.seeking;
    this.seeking = false;
    if (!this.hold) this.t += dt;
    const tt = this.t;
    const ev = Array.isArray(events) ? events : [];
    if (!silent && (ev.includes('confirm') || ev.includes('skip')) && !this.skipAll) {
      // Enter: the whole opening goes, the road and the camp (the night begins after a short fade)
      this.skipAll = true;
      this.tFade = Math.min(this.tFade, tt);
      this.dur = Math.min(this.dur, tt + 0.9);
    }
    const c = this.carAt(tt);
    this.car.position.set(c.x, c.y, c.z);
    _e.set(0, c.yaw, c.pitch, 'YXZ');
    this.car.quaternion.setFromEuler(_e);
    const steer = this._steer(tt);
    for (const w of this.car.userData.wheels || []) w.rotation.z = c.dist / WHEEL_R;
    this.car.updateMatrixWorld(true);
    this._crew(tt, steer);
    if (!silent) this._sound(tt, c);
    this._hud(tt);
    if (tt < 1.0) this.g.fx.fade = smoothstep(0, 1.0, tt);
    else if (tt >= this.tFade) this.g.fx.fade = 1 - smoothstep(this.tFade, this.dur, tt);
    else this.g.fx.fade = 1;
    if (tt >= this.dur) this.end();
  }

  // the wheel follows the way's curvature (and a hand's small corrections on the straight)
  _steer(tt) {
    if (tt < TF) return 0.06 * Math.sin(tt * 0.7) + 0.03 * Math.sin(tt * 2.1);
    const a = this.carAt(tt - 0.15, { ...this.pose }).yaw, b = this.carAt(tt + 0.15, { ...this.pose }).yaw;
    let d = b - a;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    return clamp(d * 3.2, -1, 1);
  }

  // the song's own clock: the element's position if it is playing, else the film's idea of it
  songT(tt) {
    const el = this.radio?.el;
    if (el && !el.paused && el.currentTime > 0) return el.currentTime;
    return tt - (TUNE_AT + TUNE_DUR * 0.8);
  }

  _crew(tt, steer) {
    const song = tt > TUNE_AT + TUNE_DUR * 0.8 && tt < this.tOff ? this.songT(tt) : -1;
    const beat = beatPulse(song);
    for (const a of this.cast) {
      if (tt >= this.tDoor + a.seat * 0.4) { this._outside(a, tt); continue; }
      const n = a.rig.nodes;
      const driver = a.seat === 0;
      poseSeated(a.rig, driver, tt + a.seat * 1.7, steer);
      const hip = CAR_SEATS[a.seat].hip;
      this.toWorld(hip[0], hip[1], hip[2], _v);
      a.rig.root.position.copy(_v);
      a.rig.root.rotation.set(0, this.pose.yaw - PI / 2, 0);
      a.rig.root.visible = true;
      if (a.map) a.map.visible = true;
      this._role(a, n, tt, beat, song);
    }
  }

  // what each of them does on the way (rig faces +z; its left, +x, is the car's driver side)
  _role(a, n, tt, beat, song) {
    const on = song >= 0;
    const settle = smoothstep(this.tStop - 0.4, this.tStop + 0.6, tt); // the car has stopped
    const reach = (from, to) => smoothstep(from, from + 0.45, tt) * (1 - smoothstep(to - 0.35, to, tt));
    if (a.role === 'drive') {
      // eyes on the road; a glance across at the passenger when the song comes on, and in the turn
      n.head.rotation.y = 0.35 * reach(TUNE_AT + 1.6, TUNE_AT + 3.4) + 0.12 * Math.sin(tt * 0.31);
      n.head.rotation.x = 0.04 - 0.05 * beat * (on ? 1 : 0);
      n.chest.rotation.x += 0.02 * beat;
      if (a.solo) {
        // alone: the right hand leaves the wheel for the knob
        const r = reach(TUNE_AT - 0.6, TUNE_AT + TUNE_DUR + 0.4);
        n.shR.rotation.x = lerp(n.shR.rotation.x, -1.15, r);
        n.shR.rotation.z = lerp(n.shR.rotation.z, -0.55, r);
        n.elR.rotation.x = lerp(n.elR.rotation.x, -0.35, r);
        n.head.rotation.y -= 0.4 * r;
        n.head.rotation.x += 0.25 * r;
      }
      // at the spot: hands off the wheel, a breath, the key
      n.shL.rotation.x = lerp(n.shL.rotation.x, -0.4, settle);
      n.shR.rotation.x = lerp(n.shR.rotation.x, -0.4, settle);
      return;
    }
    if (a.role === 'radio') {
      // the knob: reach across to the middle of the dash with the inner (left) hand, lean, look at it
      const r = reach(TUNE_AT - 0.7, TUNE_AT + TUNE_DUR + 0.3);
      n.shL.rotation.set(lerp(-0.35, -1.2, r), 0, lerp(-0.12, 0.62, r));
      n.elL.rotation.x = lerp(-0.95, -0.25, r) + 0.08 * Math.sin(tt * 9) * r; // turning it
      n.chest.rotation.y = 0.18 * r;
      n.head.rotation.set(0.05 + 0.35 * r, 0.45 * r, 0);
      if (on) {
        n.head.rotation.x += 0.13 * beat;
        n.chest.rotation.x += 0.03 * beat;
      }
      // the arm out of the window, riding the wind (the outer, right one), from the side shot to the turn
      const w = reach(13.8, TF + 1.5);
      if (w > 0) {
        const ride = Math.sin(tt * 1.9) * 0.25 + Math.sin(tt * 4.3) * 0.08;
        n.shR.rotation.set(lerp(n.shR.rotation.x, -0.55, w), 0, lerp(n.shR.rotation.z, -1.35 + ride, w));
        n.elR.rotation.x = lerp(n.elR.rotation.x, -0.15, w);
        n.head.rotation.y = lerp(n.head.rotation.y, -0.5, w * 0.6); // looking out at the evening
      }
      return;
    }
    if (a.role === 'sleep') {
      // asleep against the window (left, +x), rocked by the road; awake when the engine stops
      const awake = smoothstep(this.tOff, this.tOff + 0.9, tt);
      const sway = Math.sin(tt * 1.3) * 0.04 + Math.sin(tt * 3.7) * 0.015;
      n.head.rotation.set(lerp(0.42, 0.05, awake), lerp(0, 0.25, awake), lerp(-0.42 + sway, 0, awake));
      n.chest.rotation.set(lerp(-0.02, -0.08, awake), 0, lerp(-0.1, 0, awake));
      n.shL.rotation.set(-0.15, 0, -0.05);
      n.shR.rotation.set(-0.45, 0, 0.35);
      n.elR.rotation.x = -1.2; // arms folded
      n.elL.rotation.x = -1.1;
      return;
    }
    if (a.role === 'map') {
      // the map in both hands, head down over it; now and then up, out of the window, and back; nodding along
      const up = Math.max(reach(16.5, 19.5), reach(30, 33.5), reach(this.tGate - 0.5, this.tStop + 2));
      n.shL.rotation.set(-0.42, 0, -0.22);
      n.shR.rotation.set(-0.42, 0, 0.22);
      n.elL.rotation.x = -1.05;
      n.elR.rotation.x = -1.05;
      n.head.rotation.set(lerp(0.48, 0.02, up) + (on ? 0.07 * beat : 0), lerp(0, -0.55, up), 0);
      if (a.map) a.map.rotation.z = 0.05 * Math.sin(tt * 2.2);
    }
  }

  // out of the car: beside its door, a stretch (the sleeper), then a walk toward the front gate
  _outside(a, tt) {
    const t0 = this.tDoor + a.seat * 0.4;
    const k = tt - t0;
    const door = CAR_SEATS[a.seat].door;
    if (!a.out) {
      this.toWorld(door[0], 0, door[2] + Math.sign(door[2]) * 0.25, _v);
      a.out = { x: _v.x, z: _v.z, phase: a.seat * 0.7 };
      if (a.map) a.map.visible = false;
    }
    const o = a.out, to = this.walkTo[a.seat];
    const stretch = a.role === 'sleep' ? 1.6 : 0.5;
    const go = Math.max(0, k - stretch);
    const dx = to.x - o.x, dz = to.z - o.z, d = Math.hypot(dx, dz) || 1;
    const along = Math.min(d, go * 1.25);
    const x = o.x + (dx / d) * along, z = o.z + (dz / d) * along;
    const walking = along < d - 0.05 && go > 0;
    const sp = walking ? 1.25 : 0;
    o.phase += 0; // (phase is the distance walked: the steps follow the ground, not the clock)
    poseSurvivor(a.rig, along / 0.62 + o.phase, sp, false, false);
    const n = a.rig.nodes;
    if (k < stretch) {
      // the sleeper stretches, arms up; the others just stand a moment by the door
      const s = a.role === 'sleep' ? Math.sin(clamp(k / stretch, 0, 1) * PI) : 0;
      n.shL.rotation.x = -2.6 * s;
      n.shR.rotation.x = -2.6 * s;
      n.chest.rotation.x = -0.15 * s;
    }
    a.rig.root.position.set(x, this._ground(x, z), z);
    const face = walking || k > stretch ? Math.atan2(dx, dz) : Math.atan2(Math.sign(door[2]) * Math.sin(this.pose.yaw), Math.sign(door[2]) * Math.cos(this.pose.yaw));
    a.rig.root.rotation.set(0, face, 0);
    a.rig.root.visible = k > 0.05;
  }

  // ---------------- sound ----------------
  _sound(tt, c) {
    const g = this.g, au = g.audio;
    if (!au) return;
    const hit = (key, at, fn) => { if (tt >= at && !this.cues[key]) { this.cues[key] = true; fn(); } };
    hit('engine', 0.05, () => {
      this.engine = au.uazStart?.(c.x, c.y + 0.7, c.z) || null;
    });
    if (this.engine && tt < this.tOff) {
      const k = clamp(c.v / 16, 0.12, 1);
      this.engine.rev(clamp(0.28 + 0.62 * k + 0.03 * Math.sin(tt * 2.7), 0.15, 1), { x: c.x, y: c.y, z: c.z });
    }
    hit('radioOn', TUNE_AT - 0.3, () => {
      this.radio = au.carRadio?.() || null;
      this.radio?.tune(TUNE_DUR);
    });
    // inside the car the radio is right there; outside it is a car going past with its radio on
    if (this.radio) {
      const inside = ['radio', 'rear'].includes(this.shotAt(tt).k) ? 1 : this.shotAt(tt).k === 'side' ? 0.6 : 0.25;
      this.radio.cabin(inside);
    }
    hit('off', this.tOff, () => {
      if (this.engine) { this.engine.stop(0.5); this.engine = null; }
      if (this.radio) { this.radio.off(0.08); this.radio = null; }
    });
    for (const a of this.cast) {
      hit('door' + a.seat, this.tDoor + a.seat * 0.4, () => {
        const d = CAR_SEATS[a.seat].door;
        this.toWorld(d[0], 0.8, d[2], _w);
        au.carDoor?.(_w.x, _w.y, _w.z, false);
      });
    }
  }

  _hud(tt) {
    const g = this.g;
    if (tt > 1.2 && tt < 6.2 && !this.titleShown) {
      this.titleShown = true;
      g.hud.setIntro(t('introBig'), t('introSmallRoad'));
    }
    if (tt >= 6.2 && this.titleShown) {
      this.titleShown = false;
      g.hud.setIntro(null);
    }
  }

  // ---------------- the camera ----------------
  cameraAt(tt) {
    const sh = this.shotAt(tt);
    const k = clamp((tt - sh.t0) / Math.max(0.01, sh.t1 - sh.t0), 0, 1);
    const c = this.carAt(tt, { ...this.pose });
    const local = (lx, ly, lz) => {
      // car-local → world without touching the car mesh (the camera may be asked for any time)
      const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
      return [c.x + lx * cy + lz * sy, c.y + ly, c.z - lx * sy + lz * cy];
    };
    let p, l, fov = 52;
    switch (sh.k) {
      case 'wide': // far down the road ahead, a long lens on the car coming out of the low sun
        p = [140, R.y + 5.5 - 2 * k, LANE + 0.8];
        l = [c.x, c.y + 1.2, c.z];
        fov = lerp(26, 34, k);
        break;
      case 'radio': // beside the passenger's open window: both of them and the dash
        p = local(lerp(0.65, 0.45, k), 1.78, -2.35);
        l = local(-0.45, 1.2, 0.1);
        fov = 54;
        break;
      case 'side': // running alongside on the driver's side, low, the lamps sweeping past behind
        p = local(lerp(1.4, 0.2, k), 1.2, 4.6);
        l = local(0.55, 1.15, 0);
        fov = 46;
        break;
      case 'rear': // at the back window: the map in front, the sleeper beyond
        p = local(1.75, 1.82, -2.45);
        l = local(1.0, 1.3, 0.1);
        fov = 48;
        break;
      case 'pass': // on the verge, low: it comes, the arm out in the wind, and it is gone
        p = [176, R.y + 0.9, R.z - 3.7];
        l = [c.x, c.y + 1.15, c.z];
        fov = 44;
        break;
      case 'drone': // behind and above, the road running into the sun, the forest's edge on the left
        p = local(lerp(16, 22, k), lerp(8, 11, k), 3.5);
        l = local(-26, 0, -2);
        fov = 50;
        break;
      case 'turn': // in the mouth of the cut: it slows, swings off the highway toward us
        p = [Y.x - 5.5, this._ground(Y.x - 5.5, R.z - 26) + 3.2, R.z - 26];
        l = [c.x, c.y + 1, c.z];
        fov = 48;
        break;
      case 'cut': // following it down to the yard
        p = local(9, 3.4, 1.5);
        l = local(-12, 0.6, 0);
        fov = 52;
        break;
      case 'yard': // the yard's corner by the booth: round the yard, onto its spot
        p = [Y.x + 14, this._ground(Y.x + 14, Y.z + 8) + 5.2, Y.z + 8]; // (from the tyres: the lamp pole out of the frame)
        l = [c.x, c.y + 0.8, c.z];
        fov = 50;
        break;
      default: { // out: low, inside the front gate, the car behind them as they come toward us
        const px = Y.x + 5.5, pz = Y.z - 10.5;
        p = [px, this._ground(px, pz) + 1.6, pz];
        l = [Y.x + 1.2, this._ground(Y.x, Y.z) + 1.1, Y.z + lerp(1.5, -2.5, k)];
        fov = 50;
      }
    }
    // never under the ground
    const gy = this._ground(p[0], p[2]) + 0.35;
    if (p[1] < gy) p[1] = gy;
    return { p, l, fov, kind: sh.k };
  }

  applyCamera(camera) {
    if (this.state !== 'run') return false;
    const tt = this.t;
    const c = this.cameraAt(tt);
    camera.position.set(c.p[0], c.p[1], c.p[2]);
    this._look.set(c.l[0], c.l[1], c.l[2]);
    camera.lookAt(this._look);
    const inCar = c.kind === 'radio' || c.kind === 'rear';
    const hh = inCar ? 0.006 : 0.0025; // the road under the camera in the car, a breath of handheld outside
    camera.rotateZ(Math.sin(tt * 0.9) * hh + Math.sin(tt * 11.3) * (inCar ? 0.002 : 0));
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
