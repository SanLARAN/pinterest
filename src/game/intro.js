// The opening cut scene (2.1j). The camera comes down out of the sky over the camp while the last day
// drains out of the light; around the fire the people of the shift put it out — a different way each:
//   · seat 1 waters it down with the pot            · seat 2 stamps the coals out with a boot
//   · seat 3 beats the flames down with a tarp       · seat 4 tips the bucket over it
// then each goes to bed their own way (on their back, curled up, inside the tent, against the bench).
// Alone it is one person and their own little ritual: rake the coals apart with a stick, stamp out what
// is left, and lie down by the fire with a blanket.
//
// It is a film, not a minigame: Enter (or the touch SKIP button) ends it at any moment, the fire is put
// out for good and the first night starts exactly as it always has (Game.startNight).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { createWorldMaterial, shared } from '../render/sonar.js';
import { buildSurvivor, poseSurvivor, poseFur } from './survivor.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { PLAYER_HEX } from './remote.js';
import { myFit, cleanFit } from './outfit.js';

const DESCENT = 4.6; // s: the camera's fall from the sky
const R_SEAT = 2.0; // m: where the four seats sit around the fire
const FIRE = { x: 0, z: 0 };

// one seat per lobby slot: which way it looks at the fire, how it puts it out, and where it sleeps
// (bed.inside: they crawl into the tent and are gone)
export const SEATS = [
  { angle: 292, act: 'pour', sleep: 'back', bed: { x: 2.6, z: 1.5 } },
  { angle: 248, act: 'stomp', sleep: 'curl', bed: { x: -1.5, z: 3.0 } },
  { angle: 200, act: 'tarp', sleep: 'tent', bed: { x: -4.2, z: 3.8 }, inside: { x: -4.2, z: 2.4 } },
  { angle: 338, act: 'bucket', sleep: 'slump', bed: { x: 3.2, z: -1.0 } },
];
export const SOLO_SEAT = { angle: 235, act: 'stick', sleep: 'blanket', bed: { x: -2.7, z: 2.15 } };

const ACT_DUR = { pour: 2.0, stomp: 1.9, tarp: 2.1, bucket: 2.0, stick: 2.4 };
const SLEEP_DUR = { back: 1.15, curl: 1.25, slump: 1.2, tent: 1.9, blanket: 1.35 };

const POSE_NODES = ['hips', 'chest', 'head', 'shL', 'shR', 'elL', 'elR', 'thL', 'thR', 'knL', 'knR'];

// (?seats=N) four different survivors, so a lobby's four goodnights can be seen alone
function previewFit(head, body) {
  return cleanFit({ head, body });
}

// ---------------- a tiny pose mixer ----------------
// Pose functions write the rig; a transition is a cross-fade between two of them (stand → sit, sitting →
// lying down). Only the joints, the hips' height and the root's tilt are blended — where the body is in
// the world is the schedule's business.
function capture(rig, out) {
  for (const name of POSE_NODES) {
    const n = rig.nodes[name];
    const o = out[name] || (out[name] = {});
    o.px = n.position.x; o.py = n.position.y; o.pz = n.position.z;
    o.rx = n.rotation.x; o.ry = n.rotation.y; o.rz = n.rotation.z;
  }
  out.rx = rig.root.rotation.x;
  out.ry = rig.root.rotation.y;
  out.rz = rig.root.rotation.z;
  return out;
}
function applyCapture(rig, c) {
  for (const name of POSE_NODES) {
    const n = rig.nodes[name];
    const o = c[name];
    n.position.set(o.px, o.py, o.pz);
    n.rotation.set(o.rx, o.ry, o.rz);
  }
  rig.root.rotation.set(c.rx, c.ry, c.rz);
}
function blendInto(rig, a, b, k) {
  for (const name of POSE_NODES) {
    const n = rig.nodes[name];
    const A = a[name], B = b[name];
    n.position.set(lerp(A.px, B.px, k), lerp(A.py, B.py, k), lerp(A.pz, B.pz, k));
    n.rotation.set(lerp(A.rx, B.rx, k), lerp(A.ry, B.ry, k), lerp(A.rz, B.rz, k));
  }
  rig.root.rotation.set(lerp(a.rx, b.rx, k), lerp(a.ry, b.ry, k), lerp(a.rz, b.rz, k));
}
// write pose A, write pose B, and put the rig k of the way from one to the other
function poseMix(rig, bufs, poseA, poseB, k, tt) {
  poseA(rig, tt);
  capture(rig, bufs.a);
  poseB(rig, tt);
  capture(rig, bufs.b);
  blendInto(rig, bufs.a, bufs.b, k);
}

// ---------------- poses ----------------
function breathe(t, amp = 1) {
  return Math.sin(t * 1.35) * 0.012 * amp;
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

// k: 0 on their feet, 1 sitting on the ground with their knees around the fire
function pSit(rig, k, tt) {
  const n = rig.nodes;
  rig.root.rotation.set(0, rig.root.rotation.y, 0);
  n.hips.position.set(0, lerp(0.94, 0.19, k), 0);
  n.chest.rotation.set(lerp(0.05, 0.14, k) + breathe(tt), 0, 0);
  n.head.rotation.set(lerp(0, -0.05, k), Math.sin(tt * 0.4) * 0.12, 0);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['th' + A].rotation.set(lerp(0, -1.46, k), 0, s * lerp(0.04, 0.6, k));
    n['kn' + A].rotation.set(lerp(0.06, 2.45, k), 0, s * lerp(0, 0.24, k));
    n['sh' + A].rotation.set(lerp(-0.12, -0.72, k), 0, s * lerp(0.12, 0.3, k));
    n['el' + A].rotation.x = lerp(-0.3, -0.92, k);
  }
}

// the four ways of putting a fire out (u: 0..1 through the action)
function pPour(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const lift = smoothstep(0.02, 0.24, u) * (1 - smoothstep(0.8, 1, u));
  const tip = smoothstep(0.24, 0.46, u) * (1 - smoothstep(0.62, 0.84, u));
  n.chest.rotation.x += tip * 0.6 + lift * 0.03;
  n.head.rotation.x = -tip * 0.2;
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['sh' + A].rotation.set(-0.25 - lift * 1.02 - tip * 0.1, 0, s * (0.15 + tip * 0.05));
    n['el' + A].rotation.x = -0.35 - lift * 0.85 + tip * 0.5;
    n['th' + A].rotation.x = -tip * 0.14;
    n['kn' + A].rotation.x = 0.06 + tip * 0.2;
  }
}

function pStomp(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const kicks = smoothstep(0.02, 0.12, u) * (1 - smoothstep(0.9, 1, u));
  const beat = Math.min(1, u / 0.68) * 2; // two stomps, then a kick
  const ph = beat % 1;
  const lift = u < 0.68 ? Math.max(0, Math.sin(ph * Math.PI)) * kicks : 0;
  const kick = u > 0.68 ? Math.sin(((u - 0.68) / 0.32) * Math.PI) : 0;
  n.thR.rotation.set(-0.18 - lift * 1.35 - kick * 0.85, 0, 0.04);
  n.knR.rotation.x = 0.12 + lift * 1.5 + kick * 0.5;
  n.thL.rotation.set(0.1, 0, -0.04);
  n.knL.rotation.x = 0.2;
  n.chest.rotation.x = 0.08 + lift * 0.12 + kick * 0.3;
  n.chest.rotation.z = -lift * 0.08;
  n.head.rotation.x = 0.12 + lift * 0.1;
  n.shL.rotation.set(-0.55 - lift * 0.25, 0, -0.3);
  n.shR.rotation.set(-0.4 - lift * 0.2, 0, 0.26);
  n.elL.rotation.x = -0.7;
  n.elR.rotation.x = -0.55;
  n.hips.position.y = 0.94 - lift * 0.03;
}

function pTarp(rig, u, tt) {
  const n = rig.nodes;
  const crouch = smoothstep(0, 0.24, u) * (1 - smoothstep(0.86, 1, u));
  const flap = Math.sin(u * Math.PI * 6.2 - 1.2); // three quick beats
  const swing = Math.max(-1, Math.min(1, flap)) * crouch;
  pStand(rig, tt);
  n.hips.position.y = 0.94 - crouch * 0.46;
  n.chest.rotation.set(0.1 + crouch * 0.4 + swing * 0.12, 0, 0);
  n.head.rotation.x = 0.08 + crouch * 0.12;
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['th' + A].rotation.set(-crouch * 1.0, 0, s * crouch * 0.16);
    n['kn' + A].rotation.x = crouch * 1.65;
    n['sh' + A].rotation.set(-1.15 - swing * 0.95, 0, s * (0.16 + crouch * 0.14));
    n['el' + A].rotation.x = -0.5 + Math.max(0, swing) * 0.55;
  }
}

function pBucket(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const lift = smoothstep(0.06, 0.4, u) * (1 - smoothstep(0.82, 1, u));
  const tip = smoothstep(0.48, 0.66, u) * (1 - smoothstep(0.78, 0.95, u));
  n.chest.rotation.set(0.06 + lift * 0.1 + tip * 0.5, 0, 0);
  n.head.rotation.x = -tip * 0.18;
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['sh' + A].rotation.set(0.15 - lift * 1.1 - tip * 0.35, 0, s * (0.14 + tip * 0.06));
    n['el' + A].rotation.x = -0.35 - lift * 0.75 + tip * 0.35;
    n['th' + A].rotation.x = -tip * 0.12;
    n['kn' + A].rotation.x = 0.06 + lift * 0.2 + tip * 0.16;
  }
}

// alone: rake the coals apart, then stamp out what is left
function pStick(rig, u, tt) {
  pStand(rig, tt);
  const n = rig.nodes;
  const lean = smoothstep(0.0, 0.16, u) * (1 - smoothstep(0.86, 1, u));
  const rake = Math.sin(u * Math.PI * 4.4 - 0.6) * lean;
  const stamp = u > 0.62 ? Math.max(0, Math.sin(((u - 0.62) / 0.3) * Math.PI)) : 0;
  n.hips.position.y = 0.94 - lean * 0.1 - stamp * 0.03;
  n.chest.rotation.set(0.08 + lean * 0.5 + rake * 0.06, 0, rake * 0.05);
  n.head.rotation.set(0.12 + lean * 0.1, -rake * 0.08, 0);
  n.shL.rotation.set(-0.35 - lean * 0.85, 0, -0.24 - lean * 0.12);
  n.shR.rotation.set(-0.3 - lean * 0.7, 0, 0.22 + lean * 0.1);
  n.elL.rotation.x = -0.45 - lean * 0.55;
  n.elR.rotation.x = -0.5 - lean * 0.4;
  n.thL.rotation.set(0.12 - lean * 0.16, 0, -0.05);
  n.knL.rotation.x = 0.16 + lean * 0.24;
  n.thR.rotation.set(0.1 - stamp * 1.15, 0, 0.05);
  n.knR.rotation.x = 0.16 + stamp * 1.5;
}

// ---------------- sleeping ----------------
function pLieBack(rig, tt) {
  poseSurvivor(rig, 0, 0, false, true); // (the dead's flat lie is the base)
  const n = rig.nodes;
  n.head.rotation.set(-0.16, 0, 0.12);
  n.shL.rotation.set(-2.55, 0, -0.5);
  n.shR.rotation.set(-2.55, 0, 0.5);
  n.elL.rotation.x = -1.55;
  n.elR.rotation.x = -1.55;
  n.thL.rotation.set(0.1 + breathe(tt, 0.3), 0, 0.06);
  n.thR.rotation.set(-0.02, 0, -0.05);
  n.knL.rotation.x = 0.12;
  n.knR.rotation.x = 0.06;
}

function pCurl(rig, tt) {
  const n = rig.nodes;
  rig.root.rotation.set(0, rig.root.rotation.y, 0);
  n.hips.position.set(0, 0.2, 0.04);
  n.chest.rotation.set(0.92 + breathe(tt), 0, 0.05);
  n.head.rotation.set(0.32, 0.1, 0.08);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['th' + A].rotation.set(-2.05, 0, s * 0.22);
    n['kn' + A].rotation.set(2.35, 0, s * 0.1);
    n['sh' + A].rotation.set(-1.5, 0, s * 0.34);
    n['el' + A].rotation.x = -1.7;
  }
}

function pSlump(rig, tt) {
  const n = rig.nodes;
  rig.root.rotation.set(0, rig.root.rotation.y, 0);
  n.hips.position.set(0, 0.2, 0);
  n.chest.rotation.set(-0.26 + breathe(tt), 0, 0.06);
  n.head.rotation.set(0.34, 0.12, 0.16);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['th' + A].rotation.set(-1.53, 0, s * 0.1);
    n['kn' + A].rotation.x = 0.12 + (A === 'L' ? 0.16 : 0.04);
    n['sh' + A].rotation.set(-0.2, 0, s * 0.24);
    n['el' + A].rotation.x = -0.28;
  }
}

// hands and knees, heading into the tent
function pCrawl(rig, tt) {
  const n = rig.nodes;
  rig.root.rotation.set(0, rig.root.rotation.y, 0);
  n.hips.position.set(0, 0.46, 0);
  n.chest.rotation.set(1.02 + breathe(tt, 0.4), 0, 0);
  n.head.rotation.set(-0.55, 0, 0);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['th' + A].rotation.set(-1.42, 0, s * 0.12);
    n['kn' + A].rotation.x = 1.5;
    n['sh' + A].rotation.set(-1.5, 0, s * 0.16);
    n['el' + A].rotation.x = -0.25;
  }
}

// on their back with a blanket pulled up to the chest
function pBlanket(rig, tt, k = 1) {
  pLieBack(rig, tt);
  const n = rig.nodes;
  n.shL.rotation.set(lerp(-2.55, -0.35, k), 0, lerp(-0.5, -0.18, k));
  n.shR.rotation.set(lerp(-2.55, -0.3, k), 0, lerp(0.5, 0.2, k));
  n.elL.rotation.x = lerp(-1.55, -0.75, k);
  n.elR.rotation.x = lerp(-1.55, -0.7, k);
}

export class IntroCutscene {
  constructor(game) {
    this.g = game;
    this.state = 'idle'; // idle | run | done
    this.t = 0;
    this.active = false;
    this.cast = [];
    this.bufs = [];
    this.hold = false; // (debug: freeze the clock, keep posing)
    this.cues = {};
    this.camPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.2, 41, 45),
      new THREE.Vector3(0.4, 27, 34),
      new THREE.Vector3(2.4, 14, 20.5),
      new THREE.Vector3(3.4, 6.4, 10.6),
      new THREE.Vector3(2.7, 2.9, 6.1),
      new THREE.Vector3(2.35, 1.72, 4.45),
    ], false, 'catmullrom', 0.32);
    this._cam = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._tmp = new THREE.Vector3();
    this.dur = 12;
    this.tCrane = 9.5;
    this.tFade = 11.2;
    this.fireSnd = null;
    this.propMat = createWorldMaterial();
    this.day0 = 0.95; // the light of the last day (Game.startMorning's MORNING_LIGHT)
    this.tDusk = 5.2; // when the sky starts to go (set from the plan: as the first flame dies)
    this.tDuskEnd = 7.8; // ...and when there is nothing left of the day
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
    this.bufs.length = 0;
    this.built = false;
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

  // the film is over (or skipped): put everything back and hand over to the first night
  _teardown() {
    for (const a of this.cast) {
      undressPerson(a.meshes);
      this.g.scene.remove(a.rig.root);
      a.mat.dispose();
      for (const p of a.props) if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
    }
    this.cast.length = 0;
    this.bufs.length = 0;
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
    this.g.fadeIn = 0.9; // ...and comes back up as the first night
  }

  // ---------------- the cast ----------------
  // Every seat of the lobby is the player who owns it (their own clothes, their own colour); alone it is
  // one person and their own way of saying goodnight.
  _seats() {
    // (?seats=N in the URL: preview a full lobby's four goodnights alone — nothing else uses this)
    if (!this.g.online && this.forceSeats > 1) {
      const heads = ['hood', 'ushanka', 'animehair', 'boykisser'];
      const bodies = ['jacket', 'tulup', 'seifuku', 'fluffy'];
      return SEATS.slice(0, Math.min(4, this.forceSeats | 0)).map((seat, i) => ({
        slot: i,
        fit: i === 0 ? myFit() : previewFit(heads[i], bodies[i]),
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

  _build() {
    this.built = true;
    const ground = (x, z) => this.g.world.terrain.height(x, z);
    const list = this._seats();
    const n = list.length;
    for (const p of list) {
      const seat = p.seat;
      const a = (seat.angle * Math.PI) / 180;
      const rig = buildSurvivor(p.fit);
      const mat = createPersonMaterial(rig.dyes, PLAYER_HEX[p.slot % 4]);
      mat.uniforms.uShow.value = 1;
      const meshes = dressPerson(rig, mat);
      rig.root.visible = true;
      this.g.scene.add(rig.root);
      const sx = Math.cos(a) * R_SEAT;
      const sz = Math.sin(a) * R_SEAT;
      const fx = Math.cos(a) * 1.18; // where they stand to work on the fire (in from their seat)
      const fz = Math.sin(a) * 1.18;
      const actor = {
        slot: p.slot,
        solo: !!p.solo,
        seat,
        rig,
        mat,
        meshes,
        props: [],
        phase: 0,
        speed: 0,
        hit: {},
        x: sx,
        z: sz,
        y: ground(sx, sz),
        yaw: Math.atan2(-(FIRE.x - sx), -(FIRE.z - sz)),
        k: 1, // sitting
        u: 0,
        lit: 1,
        show: 1,
        sleepK: 0,
        done: false,
        work: { x: fx, z: fz },
      };
      this._props(actor);
      this.cast.push(actor);
    }
    this._plan();
    this.fireSnd = this.g.audio.fire(FIRE.x, ground(FIRE.x, FIRE.z) + 0.5, FIRE.z);
  }

  _props(a) {
    const make = (build, parent, pos, rot) => {
      const b = new MeshBuilder(256);
      build(b);
      const mesh = new THREE.Mesh(b.toGeometry(), this.propMat);
      mesh.frustumCulled = false;
      mesh.position.set(0, 0, 0);
      if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
      const node = new THREE.Object3D();
      node.position.set(pos[0], pos[1], pos[2]);
      node.add(mesh);
      a.rig.nodes[parent].add(node);
      node.visible = false;
      a.props.push({ mesh, node, kind: a.seat.act });
      return { mesh, node };
    };
    if (a.seat.act === 'pour') {
      make((b) => {
        b.cylinder(9, 0.1, 0.125, 0.15, KIND.METAL);
        b.place(0, 0.15, 0, 0, 0, Math.PI / 2);
        b.box(0.19, 0.018, 0.018, KIND.METAL);
      }, 'elR', [0, -0.33, 0.08], [0.2, 0, 0]);
    } else if (a.seat.act === 'bucket') {
      make((b) => {
        b.cylinder(9, 0.085, 0.11, 0.17, KIND.METAL, { capBottom: true });
        b.place(0, 0.17, 0, 0, 0, Math.PI / 2);
        b.limb([-0.085, 0, 0], [0, 0.1, 0], 0.008, 0.008, KIND.METAL);
        b.limb([0.085, 0, 0], [0, 0.1, 0], 0.008, 0.008, KIND.METAL);
      }, 'elR', [0, -0.38, 0.06], [0.15, 0, 0]);
    } else if (a.seat.act === 'tarp') {
      make((b) => {
        b.box(0.4, 0.07, 0.3, KIND.WOOD);
        b.place(0.02, 0, 0, 0, 0.3, 0);
        b.box(0.3, 0.05, 0.22, KIND.WOOD);
      }, 'elR', [0, -0.34, 0.1], [0.4, 0.2, 0]);
    } else if (a.seat.act === 'stick') {
      make((b) => {
        b.limb([0, -0.42, 0], [0, 0.62, 0], 0.022, 0.012, KIND.WOOD, 4);
      }, 'elR', [0.02, -0.34, 0.09], [0.9, 0, 0.2]);
    }
    if (a.seat.sleep === 'blanket') {
      // a folded blanket: in the hips' frame it is a flat sheet across the chest — and once the body is
      // lying down that same sheet lies over it, the local z turning into "up"
      const b = new MeshBuilder(128);
      b.box(0.9, 0.62, 0.06, KIND.WOOD);
      const mesh = new THREE.Mesh(b.toGeometry(), this.propMat);
      mesh.frustumCulled = false;
      const node = new THREE.Object3D();
      node.position.set(0, 0.42, 0.16);
      node.add(mesh);
      a.rig.nodes.hips.add(node);
      node.visible = false;
      a.blanket = { mesh, node };
    }
  }

  // the schedule: when each of them stands, works on the fire, walks and lies down
  _plan() {
    const n = Math.max(1, this.cast.length);
    let tEnd = 0;
    this.tEndDouse = 0;
    this.cast.forEach((a, i) => {
      const seat = a.seat;
      const solo = a.solo;
      // they get up once the camera is down (DESCENT): the evening is the film, not the fall
      const t0 = DESCENT + 0.15 + i * 0.35;
      const rise = 0.5;
      const d1 = Math.hypot(a.work.x - a.x, a.work.z - a.z);
      const walk1 = d1 / 0.95;
      const tAct = t0 + rise + walk1 + 0.12;
      const dur = ACT_DUR[seat.act] || 2;
      const tWalk = tAct + dur + 0.15;
      const d2 = Math.hypot(seat.bed.x - a.work.x, seat.bed.z - a.work.z);
      const walk2 = Math.max(0.7, d2 / (solo ? 1.6 : 1.5));
      const tBed = tWalk + walk2;
      const lie = SLEEP_DUR[seat.sleep] || 1.2;
      a.plan = { t0, rise, walk1, tAct, dur, tWalk, walk2, tBed, lie };
      this.tEndDouse = Math.max(this.tEndDouse, tAct + dur * 0.6);
      a.douseW = 1 / n; // together they put it out; alone one person does it all
      tEnd = Math.max(tEnd, tBed + lie);
    });
    this.dur = Math.min(15, Math.max(10.5, tEnd + 1.3));
    this.tCrane = this.dur - 3.0;
    this.tFade = this.dur - 1.3;
    // the light goes out with the fire: from the first flame that dies to just after the last one
    // (each actor's douse eats 55% of its action — see _fire)
    let first = Infinity;
    this.cast.forEach((a) => {
      const p = a.plan;
      if (p) first = Math.min(first, p.tAct + p.dur * 0.12);
    });
    if (!isFinite(first)) first = DESCENT;
    this.tDusk = Math.max(DESCENT * 0.9, first - 0.3);
    this.tDuskEnd = Math.max(this.tDusk + 2.2, this.tEndDouse + 0.7);
    this.tDuskEnd = Math.min(this.tDuskEnd, this.tCrane - 0.4);
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
      this.dur = Math.min(this.dur, tt + (tt < this.tCrane ? 1.1 : 0.9));
    }

    const lit = this._fire(tt);
    this.g.fire.douse(lit);
    this._sky(tt, silent);
    if (this.fireSnd) this.fireSnd.level(Math.min(1, lit * 1.15 + 0.02));
    if (!silent && lit > 0.15 && Math.random() < dt * (1.6 * lit)) this.fireSnd?.crackle();

    this._actors(tt, dt, silent);
    this._hud(tt);

    // the picture: out of the black, and back into it at the end
    if (tt < 0.9) this.g.fx.fade = smoothstep(0, 0.9, tt);
    else if (tt >= this.tFade) this.g.fx.fade = 1 - smoothstep(this.tFade, this.dur, tt);
    else this.g.fx.fade = 1;
    if (tt >= this.dur) this.finish();
  }

  // the light drains out of the day while the camera comes down (the dusk's stutter, reused)
  _fire(tt) {
    const k = tt - 4.9;
    let lit = 1;
    for (const a of this.cast) {
      const p = a.plan;
      if (!p) continue;
      const u = (tt - p.tAct) / p.dur;
      if (u <= 0.16) continue;
      const killed = smoothstep(0.16, 0.55, Math.min(1, u)) * a.douseW;
      lit -= killed;
    }
    // (a fire that nobody has touched yet still eats at itself, slowly)
    if (k > 3) lit = Math.min(lit, 0.92);
    return clamp(lit, 0, 1);
  }

  // the day ends with the fire: the same stutter as the dusk in game (a bulb dying), but slow, and only
  // once the first flame is under water. The sky goes with uDawn, so the stars come out on their own.
  _sky(tt, silent) {
    const span = Math.max(1.8, this.tDuskEnd - this.tDusk);
    const k = clamp((tt - this.tDusk) / span, 0, 1);
    // ...down to a moonlit dark, not to nothing: the film still has people in it
    let L = lerp(this.day0, 0.3, smoothstep(0.08, 1, k));
    // and a last grey breath of moonlight once it is fully dark, so the sleepers are not lost in it
    L += 0.11 * smoothstep(this.tDuskEnd, this.tDuskEnd + 1.5, tt);
    // the flicker: two beat frequencies fighting over the last of the light
    if (k > 0.1 && k < 0.9 && Math.sin(tt * 37) * Math.sin(tt * 13) > 0.45) L *= 0.62;
    shared.uDawn.value = L;
    shared.uMorning.value = 1 - smoothstep(0, 0.75, k); // warm evening, then no palette at all
    if (!this.duskHit && k > 0.06) {
      this.duskHit = true;
      if (!silent) {
        this.g.audio.dusk(); // the roar and the tone: the same cue as a real dusk
        this.g.fx.glitch = Math.max(this.g.fx.glitch, 0.3);
      }
    }
  }

  _actors(tt, dt, silent) {
    const ground = (x, z) => this.g.world.terrain.height(x, z);
    this.cast.forEach((a, i) => {
      const p = a.plan;
      const bufs = this.bufs[i] || (this.bufs[i] = { a: {}, b: {} });
      const n = a.rig.nodes;
      let visible = true;
      a.mat.uniforms.uShow.value = a.show;

      // --- the same evening, four ways of ending it ---
      if (tt < p.t0) {
        // sitting, watching the fire
        a.k = 1;
        pSit(a.rig, 1, tt + i * 1.7);
        a.x = Math.cos((a.seat.angle * Math.PI) / 180) * R_SEAT;
        a.z = Math.sin((a.seat.angle * Math.PI) / 180) * R_SEAT;
        a.yaw = Math.atan2(-(FIRE.x - a.x), -(FIRE.z - a.z));
      } else if (tt < p.t0 + p.rise) {
        const k = smoothstep(0, 1, (tt - p.t0) / p.rise);
        poseMix(a.rig, bufs, (r, t) => pSit(r, 1, t), pStand, k, tt + i * 1.7);
        a.yaw = Math.atan2(-(FIRE.x - a.x), -(FIRE.z - a.z));
      } else if (tt < p.tWalk) {
        const u1 = clamp((tt - p.t0 - p.rise) / p.walk1, 0, 1);
        const sx = Math.cos((a.seat.angle * Math.PI) / 180) * R_SEAT;
        const sz = Math.sin((a.seat.angle * Math.PI) / 180) * R_SEAT;
        a.x = lerp(sx, a.work.x, u1);
        a.z = lerp(sz, a.work.z, u1);
        const toFire = Math.atan2(-(FIRE.x - a.x), -(FIRE.z - a.z));
        if (tt < p.tAct) {
          a.phase += dt * 7.5;
          a.yaw = u1 < 0.98 ? Math.atan2(-(a.work.x - a.x), -(a.work.z - a.z)) : toFire;
          poseSurvivor(a.rig, a.phase, 1.15, false, false);
          poseFur(a.rig, dt, 1.15);
        } else {
          poseSurvivor(a.rig, 0, 0, false, false);
          a.yaw = toFire;
          const u = clamp((tt - p.tAct) / p.dur, 0, 1);
          const poser = { pour: pPour, stomp: pStomp, tarp: pTarp, bucket: pBucket, stick: pStick }[a.seat.act] || pPour;
          poser(a.rig, u, tt + i);
          a.u = u;
          this._propVis(a, true);
          this._pivot(a, u);
          this._actFx(a, tt, u, silent);
        }
      } else if (tt < p.tBed) {
        // walking to bed
        const u = clamp((tt - p.tWalk) / p.walk2, 0, 1);
        const e = smoothstep(0, 1, u);
        const from = this._actEnd(a);
        a.x = lerp(from.x, a.seat.bed.x, e);
        a.z = lerp(from.z, a.seat.bed.z, e);
        const fy = a.yaw;
        const want = Math.atan2(-(a.seat.bed.x - from.x), -(a.seat.bed.z - from.z));
        a.yaw = want;
        a.phase += dt * 8.2;
        poseSurvivor(a.rig, a.phase, 1.5, false, false);
        poseFur(a.rig, dt, 1.5);
        this._propVis(a, false);
        void fy;
      } else {
        // the last part: lie down your own way
        const k = clamp((tt - p.tBed) / p.lie, 0, 1);
        const sleep = a.seat.sleep;
        if (sleep === 'tent') {
          const from = this._actEnd(a);
          const e = smoothstep(0, 1, k);
          const inside = a.seat.inside || a.seat.bed;
          a.x = lerp(a.seat.bed.x, inside.x, e);
          a.z = lerp(a.seat.bed.z, inside.z, e);
          a.yaw = Math.atan2(-(a.seat.bed.x - from.x), -(a.seat.bed.z - from.z));
          poseMix(a.rig, bufs, (r) => poseSurvivor(r, 0, 0, false, false), pCrawl, smoothstep(0, 0.45, k), tt);
          a.show = k < 0.55 ? 1 : Math.max(0, 1 - (k - 0.55) / 0.35);
          visible = a.show > 0.01;
        } else if (sleep === 'blanket') {
          const e = smoothstep(0, 1, k);
          // (they walked here already: the last beat is only the body going down)
          a.x = a.seat.bed.x;
          a.z = a.seat.bed.z;
          a.yaw = Math.atan2(-(a.seat.bed.x - FIRE.x), -(a.seat.bed.z - FIRE.z));
          poseMix(a.rig, bufs, pStand, (r, t2) => pLieBack(r, t2), e, tt);
          if (a.blanket) {
            const pull = smoothstep(0.45, 1, k);
            const bp = a.blanket.node;
            bp.visible = pull > 0.02;
            bp.position.set(0, 0.42, lerp(-0.12, 0.17, pull));
            bp.rotation.set(0, 0, 0);
          }
        } else {
          const e = smoothstep(0, 1, k);
          // (the walk to bed is over by now — this used to lerp from the fire and they all slid back)
          a.x = a.seat.bed.x;
          a.z = a.seat.bed.z;
          const bedYaw = sleep === 'slump'
            ? Math.atan2(-(a.seat.bed.x - FIRE.x), -(a.seat.bed.z - FIRE.z)) + Math.PI
            : Math.atan2(-(a.seat.bed.x - FIRE.x), -(a.seat.bed.z - FIRE.z));
          a.yaw = bedYaw;
          const target = sleep === 'back' ? pLieBack : sleep === 'curl' ? pCurl : pSlump;
          poseMix(a.rig, bufs, pStand, target, e, tt + i * 0.9);
        }
      }
      if (tt >= p.tWalk) poseFur(a.rig, 0, 0); // (a furry survivor's tail keeps its own time)
      a.rig.root.visible = visible;
      a.rig.root.position.set(a.x, ground(a.x, a.z) + (a.seat.sleep && a.rig.root.rotation.x < -0.2 ? 0.18 : 0), a.z);
      a.rig.root.rotation.y = a.yaw;
      void n;
    });
  }

  _actEnd(a) {
    // where the action left them standing
    return { x: a.work.x, z: a.work.z };
  }

  _propVis(a, on) {
    for (const p of a.props) if (p.kind !== 'blanket') p.node.visible = on;
  }

  // the pot tips, the tarp swings: the thing in their hands follows the action
  _pivot(a, u) {
    const prop = a.props[0];
    if (!prop) return;
    const act = a.seat.act;
    const tip = act === 'pour' ? smoothstep(0.24, 0.48, u) * (1 - smoothstep(0.64, 0.84, u))
      : act === 'bucket' ? smoothstep(0.46, 0.66, u) * (1 - smoothstep(0.78, 0.92, u))
        : 0;
    if (tip > 0) prop.node.rotation.set(0.2 + tip * 2.1, 0, 0);
    else if (act === 'stick') prop.node.rotation.set(0.9 + Math.sin(u * Math.PI * 4.4) * 0.12, 0, 0.2);
    else prop.node.rotation.set(0.2, 0, 0);
  }

  // sounds and steam at the exact beat of each action
  _actFx(a, tt, u, silent) {
    if (silent) return;
    const hit = (key, at, fn) => {
      if (u >= at && !a.hit[key]) { a.hit[key] = true; fn(); }
    };
    const fy = this.g.world.terrain.height(FIRE.x, FIRE.z);
    const act = a.seat.act;
    if (act === 'pour' || act === 'bucket') {
      hit('tip', 0.5, () => {
        this.g.audio.steam(FIRE.x, fy + 0.6, FIRE.z, 1);
        this.g.fire.puff(1);
      });
    } else if (act === 'stomp') {
      hit('s1', 0.28, () => this.g.audio.stomp(FIRE.x, fy + 0.2, FIRE.z, 0.9));
      hit('s2', 0.95, () => this.g.audio.stomp(FIRE.x, fy + 0.2, FIRE.z, 1));
      hit('kick', 0.74, () => { this.g.audio.stomp(FIRE.x, fy + 0.2, FIRE.z, 0.7); this.g.fire.puff(0.4); });
    } else if (act === 'tarp') {
      hit('w1', 0.22, () => this.g.audio.whump(FIRE.x, fy + 0.6, FIRE.z, 1));
      hit('w2', 0.5, () => this.g.audio.whump(FIRE.x, fy + 0.6, FIRE.z, 0.9));
      hit('w3', 0.78, () => this.g.audio.whump(FIRE.x, fy + 0.6, FIRE.z, 0.8));
    } else if (act === 'stick') {
      hit('r1', 0.24, () => this.g.audio.whump(FIRE.x, fy + 0.3, FIRE.z, 0.7));
      hit('r2', 0.5, () => this.g.audio.whump(FIRE.x, fy + 0.3, FIRE.z, 0.8));
      hit('st', 0.72, () => { this.g.audio.stomp(FIRE.x, fy + 0.2, FIRE.z, 1); this.g.fire.puff(0.5); });
    }
  }

  _hud(tt) {
    // the title over the fall, then the camp and the night (the night tag is startNight's own)
    if (tt > 0.7 && tt < 4.9 && !this.titleShown) {
      this.titleShown = true;
      this.g.hud.setIntro(t('introBig'), t('introSmall'));
    }
    if (tt > 4.9 && this.titleShown) {
      this.titleShown = false;
      this.g.hud.setIntro(null);
    }
  }

  // ---------------- the camera ----------------
  applyCamera(camera) {
    if (!this.active) return false;
    const tt = this.t;
    const k = smoothstep(0, DESCENT, tt);
    // out of the sky and down: the rail is a curve, the look is a slower one of its own
    this.camPath.getPointAt(k, this._cam);
    const crane = smoothstep(this.tCrane, this.dur, tt);
    if (crane > 0) {
      this._cam.x = lerp(this._cam.x, 3.0, crane);
      this._cam.y = lerp(this._cam.y, 2.7, crane);
      this._cam.z = lerp(this._cam.z, 6.9, crane);
    }
    this._look.set(0, lerp(3.2, 0.85, k), 0);
    if (crane > 0) this._look.lerp(this._tmp.set(0, 0.45, 0.7), crane);
    camera.position.copy(this._cam);
    camera.lookAt(this._look);
    // a breath of handheld as we come down out of the wind
    const hh = 0.0035 * k;
    camera.rotateZ(Math.sin(tt * 0.9) * hh + Math.sin(tt * 2.3 + 1) * hh * 0.5);
    camera.rotateX(Math.sin(tt * 0.7 + 2) * hh);
    const fov = k < 1 ? lerp(44, 58, k) : lerp(58, 62, crane);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    return true;
  }

  // (debug: jump to a moment of the film without playing the sound cues)
  seek(tt) {
    this.t = tt;
    this.seeking = true;
  }
}
