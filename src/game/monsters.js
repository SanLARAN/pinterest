// Monsters: procedural low-poly rigs + noise-driven AI.
// They are never rendered directly — only as echo afterimages when a wave reaches them.
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { CFG } from '../core/config.js';
import { clamp, angleDiff, lerp } from '../core/rng.js';

// ---------------- rig helpers ----------------
function makeRig(key) {
  const root = new THREE.Object3D();
  return { key, root, nodes: {}, parts: [] };
}
function node(rig, name, parent, x, y, z) {
  const n = new THREE.Object3D();
  n.position.set(x, y, z);
  (parent || rig.root).add(n);
  rig.nodes[name] = n;
  n.userData.rest = n.position.clone();
  return n;
}
const _b = new MeshBuilder(512);
function part(rig, n, build) {
  _b.reset();
  build(_b);
  rig.parts.push({ node: n, arr: _b.toArrays() });
}

// ---------------- Listener: tall antlered thing ----------------
export function buildListener() {
  const R = makeRig('listener');
  const N = (name, parent, x, y, z) => node(R, name, parent, x, y, z);
  const hips = N('hips', null, 0, 1.6, 0);
  part(R, hips, (b) => { b.place(0, -0.04, 0); b.box(0.42, 0.22, 0.27, KIND.FLESH); });
  const spine = N('spine', hips, 0, 0.06, 0);
  part(R, spine, (b) => {
    b.identity();
    b.taper(0.32, 0.22, 0.52, 0.3, 0.98, KIND.FLESH, 0.06);
    // protruding vertebrae
    for (let k = 0; k < 6; k++) {
      b.place(0, 0.12 + k * 0.15, -0.13 - k * 0.006, -1.2, 0, 0);
      b.cone(4, 0.035, 0.13, KIND.BONE);
    }
    // ribs
    for (let k = 0; k < 4; k++) {
      for (const s of [-1, 1]) {
        b.identity();
        b.limb([s * 0.05, 0.48 + k * 0.11, 0.15], [s * 0.27, 0.42 + k * 0.11, 0.05], 0.018, 0.012, KIND.BONE, 3);
      }
    }
  });
  const chest = N('chest', spine, 0, 0.98, 0.06);
  const neck = N('neck', chest, 0, 0.0, 0.04);
  part(R, neck, (b) => { b.identity(); b.limb([0, 0, 0], [0, 0.3, 0.14], 0.075, 0.05, KIND.FLESH); });
  const head = N('head', neck, 0, 0.3, 0.14);
  part(R, head, (b) => {
    b.place(0, 0.0, -0.06, Math.PI / 2 + 0.2, 0, 0);
    b.taper(0.25, 0.26, 0.08, 0.11, 0.56, KIND.BONE);
    // cranium
    b.place(0, 0.08, -0.06, 0, 0, 0);
    b.rock(0.17, mulberry(3), KIND.BONE, 0.1, 1.0);
    // antlers
    b.identity();
    for (const s of [-1, 1]) {
      const A = [s * 0.08, 0.14, -0.08], B = [s * 0.3, 0.52, -0.2], C = [s * 0.42, 0.95, -0.12], D = [s * 0.62, 1.25, -0.25];
      b.limb(A, B, 0.035, 0.028, KIND.BONE, 4);
      b.limb(B, C, 0.028, 0.02, KIND.BONE, 4);
      b.limb(C, D, 0.02, 0.008, KIND.BONE, 3);
      b.limb(B, [s * 0.18, 0.78, 0.12], 0.02, 0.006, KIND.BONE, 3);
      b.limb(C, [s * 0.25, 1.22, 0.02], 0.018, 0.005, KIND.BONE, 3);
      b.limb(C, [s * 0.68, 0.98, 0.05], 0.016, 0.005, KIND.BONE, 3);
      b.limb([s * 0.36, 0.7, -0.17], [s * 0.6, 0.66, -0.36], 0.016, 0.005, KIND.BONE, 3);
    }
    // eyes: deep and burning
    b.place(-0.085, 0.07, 0.07); b.octa(0.032, 0.03, KIND.EYE);
    b.place(0.085, 0.07, 0.07); b.octa(0.032, 0.03, KIND.EYE);
  });
  const jaw = N('jaw', head, 0, -0.06, -0.02);
  part(R, jaw, (b) => {
    b.place(0, 0, 0, Math.PI / 2 + 0.35, 0, 0);
    b.taper(0.19, 0.08, 0.06, 0.04, 0.46, KIND.BONE);
    for (let k = 0; k < 5; k++) {
      for (const s of [-1, 1]) {
        b.place(s * (0.07 - k * 0.01), 0.02 - k * 0.03, 0.1 + k * 0.07, 0, 0, 0);
        b.cone(3, 0.014, 0.06, KIND.BONE);
      }
    }
  });
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    const sh = N('shoulder' + side, chest, s * 0.27, -0.04, 0);
    part(R, sh, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.98, 0], 0.06, 0.045, KIND.FLESH); });
    const el = N('elbow' + side, sh, 0, -0.98, 0);
    part(R, el, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.98, 0], 0.045, 0.03, KIND.FLESH); });
    const hand = N('hand' + side, el, 0, -0.98, 0);
    part(R, hand, (b) => {
      b.identity();
      for (let f = 0; f < 4; f++) {
        const a = (f - 1.5) * 0.12;
        b.limb([a * 0.3, 0, 0.02], [a + s * 0.03, -0.42, 0.08 + Math.abs(a) * 0.2], 0.014, 0.004, KIND.BONE, 3);
      }
    });
    const th = N('thigh' + side, hips, s * 0.14, -0.08, 0);
    part(R, th, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.8, 0.12], 0.08, 0.05, KIND.FLESH); });
    const kn = N('knee' + side, th, 0, -0.8, 0.12);
    part(R, kn, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.78, -0.2], 0.05, 0.035, KIND.FLESH); });
    const ft = N('foot' + side, kn, 0, -0.78, -0.2);
    part(R, ft, (b) => {
      b.identity();
      b.limb([0, 0, 0], [-0.05, -0.02, 0.25], 0.03, 0.01, KIND.BONE, 3);
      b.limb([0, 0, 0], [0.05, -0.02, 0.24], 0.03, 0.01, KIND.BONE, 3);
    });
  }
  return R;
}

// ---------------- Crawler: low, fast, many limbs ----------------
export function buildCrawler() {
  const R = makeRig('crawler');
  const N = (name, parent, x, y, z) => node(R, name, parent, x, y, z);
  const body = N('body', null, 0, 0.62, 0);
  part(R, body, (b) => {
    b.place(0, 0, -0.6, Math.PI / 2, 0, 0);
    b.taper(0.34, 0.26, 0.46, 0.32, 1.3, KIND.FLESH, 0.02);
    for (let k = 0; k < 7; k++) {
      b.place(0, 0.17, -0.5 + k * 0.17, -0.5, 0, 0);
      b.cone(4, 0.04, 0.18, KIND.BONE);
    }
  });
  const head = N('head', body, 0, 0.06, 0.72);
  part(R, head, (b) => {
    b.place(0, 0.02, -0.05, Math.PI / 2 - 0.1, 0, 0);
    b.taper(0.3, 0.24, 0.14, 0.12, 0.42, KIND.BONE);
    for (let e = 0; e < 4; e++) {
      b.place((e % 2 ? 1 : -1) * (0.05 + (e > 1 ? 0.06 : 0)), 0.09 - (e > 1 ? 0.03 : 0), 0.16 + (e > 1 ? -0.05 : 0));
      b.octa(0.022, 0.022, KIND.EYE);
    }
  });
  const jaw = N('jaw', head, 0, -0.07, 0.0);
  part(R, jaw, (b) => {
    b.place(0, 0, -0.02, Math.PI / 2 + 0.25, 0, 0);
    b.taper(0.26, 0.06, 0.1, 0.04, 0.38, KIND.BONE);
    for (let k = 0; k < 6; k++) {
      for (const s of [-1, 1]) {
        b.place(s * (0.1 - k * 0.012), 0.02 - k * 0.02, 0.06 + k * 0.05, 0, 0, 0);
        b.cone(3, 0.012, 0.05, KIND.BONE);
      }
    }
  });
  const legs = [
    ['FL', -0.2, 0.42, 1], ['FR', 0.2, 0.42, 1],
    ['ML', -0.22, -0.05, 0], ['MR', 0.22, -0.05, 0],
    ['BL', -0.2, -0.5, -1], ['BR', 0.2, -0.5, -1],
  ];
  for (const [name, x, z, fb] of legs) {
    const s = x < 0 ? -1 : 1;
    const hip = N('hip' + name, body, x, 0, z);
    const kx = s * 0.55, ky = 0.42, kz = fb * 0.25;
    part(R, hip, (b) => { b.identity(); b.limb([0, 0, 0], [kx, ky, kz], 0.05, 0.035, KIND.FLESH); });
    const kn = N('kn' + name, hip, kx, ky, kz);
    part(R, kn, (b) => { b.identity(); b.limb([0, 0, 0], [s * 0.32, -1.02, fb * 0.2], 0.035, 0.012, KIND.BONE, 4); });
  }
  return R;
}

// ---------------- Shade: the thing that is only there when you look ----------------
export function buildShade() {
  const R = makeRig('shade');
  const N = (name, parent, x, y, z) => node(R, name, parent, x, y, z);
  const torso = N('torso', null, 0, 1.25, 0);
  part(R, torso, (b) => {
    b.identity();
    b.taper(0.3, 0.18, 0.42, 0.22, 0.95, KIND.FLESH);
    b.limb([-0.1, 0, 0], [-0.13, -1.25, 0.02], 0.06, 0.035, KIND.FLESH);
    b.limb([0.1, 0, 0], [0.12, -1.25, -0.03], 0.06, 0.035, KIND.FLESH);
    b.limb([-0.22, 0.9, 0], [-0.32, -0.3, 0.08], 0.04, 0.025, KIND.FLESH);
    b.limb([0.22, 0.9, 0], [0.3, -0.35, 0.1], 0.04, 0.025, KIND.FLESH);
    b.limb([-0.32, -0.3, 0.08], [-0.34, -0.62, 0.12], 0.012, 0.004, KIND.BONE, 3);
    b.limb([0.3, -0.35, 0.1], [0.33, -0.66, 0.14], 0.012, 0.004, KIND.BONE, 3);
  });
  const head = N('head', torso, 0, 1.12, 0.02);
  part(R, head, (b) => {
    b.identity();
    b.octa(0.13, 0.2, KIND.BONE);
    // hair curtain
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      if (Math.sin(a) > 0.6) continue;
      b.limb([Math.cos(a) * 0.1, 0.12, Math.sin(a) * 0.1 - 0.02], [Math.cos(a) * 0.17, -0.65 - (i % 3) * 0.12, Math.sin(a) * 0.15 - 0.04], 0.012, 0.003, KIND.FLESH, 3);
    }
    b.place(-0.045, 0.02, 0.11); b.octa(0.018, 0.012, KIND.EYE);
    b.place(0.045, 0.02, 0.11); b.octa(0.018, 0.012, KIND.EYE);
  });
  return R;
}

function mulberry(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------- animation ----------------
function animListener(m, dt, t) {
  const n = m.rig.nodes;
  const sp = m.speedCur;
  const amp = clamp(sp / 2.0, 0, 1.1);
  const hunt = m.state === 'hunt';
  const p = m.phase;
  const s = Math.sin(p);
  n.thighL.rotation.x = s * 0.6 * amp - (hunt ? 0.25 : 0);
  n.thighR.rotation.x = -s * 0.6 * amp - (hunt ? 0.25 : 0);
  n.kneeL.rotation.x = Math.max(0, -s) * 0.8 * amp + 0.08;
  n.kneeR.rotation.x = Math.max(0, s) * 0.8 * amp + 0.08;
  const reach = hunt ? -1.15 : m.state === 'search' ? -0.35 : 0.05;
  n.shoulderL.rotation.x = -s * 0.4 * amp + reach + Math.sin(t * 1.3) * 0.04;
  n.shoulderR.rotation.x = s * 0.4 * amp + reach + Math.sin(t * 1.1 + 1) * 0.04;
  n.shoulderL.rotation.z = -0.1 - (hunt ? 0.25 : 0);
  n.shoulderR.rotation.z = 0.1 + (hunt ? 0.25 : 0);
  n.elbowL.rotation.x = -0.25 - amp * 0.2 + (hunt ? -0.4 : 0);
  n.elbowR.rotation.x = -0.25 - amp * 0.2 + (hunt ? -0.4 : 0);
  n.spine.rotation.x = (hunt ? 0.62 : m.state === 'search' ? 0.42 : 0.26) + Math.sin(p * 2) * 0.03;
  n.hips.position.y = 1.6 + Math.abs(s) * 0.06 * amp - (hunt ? 0.16 : 0);
  n.neck.rotation.x = hunt ? -0.45 : -0.25;
  const listen = m.state === 'search' || m.state === 'idle' || m.listenT > 0;
  n.head.rotation.z = listen ? Math.sin(t * 1.9 + m.seed) * 0.4 : Math.sin(t * 0.7) * 0.06;
  n.head.rotation.y = clamp(m.headYaw, -0.9, 0.9);
  n.jaw.rotation.x = hunt ? 0.55 + Math.sin(t * 24) * 0.12 : 0.06 + Math.max(0, Math.sin(t * 0.8 + m.seed)) * 0.1;
}

function animCrawler(m, dt, t) {
  const n = m.rig.nodes;
  const amp = clamp(m.speedCur / 2.5, 0, 1.2);
  const p = m.phase;
  const names = ['FL', 'FR', 'ML', 'MR', 'BL', 'BR'];
  for (let i = 0; i < 6; i++) {
    const ph = p + (i % 2 ? Math.PI : 0) + (i >> 1) * 0.9;
    const s = Math.sin(ph);
    n['hip' + names[i]].rotation.y = s * 0.45 * amp;
    n['hip' + names[i]].rotation.z = (i % 2 ? -1 : 1) * Math.max(0, Math.cos(ph)) * 0.35 * amp;
  }
  n.body.position.y = 0.62 + Math.abs(Math.sin(p * 2)) * 0.05 * amp + (m.state === 'hunt' ? -0.1 : 0);
  n.body.rotation.z = Math.sin(p) * 0.06 * amp;
  n.head.rotation.y = clamp(m.headYaw, -0.7, 0.7) + Math.sin(t * 13) * 0.05 * (m.state === 'hunt' ? 1 : 0.2);
  n.head.rotation.z = m.state === 'search' ? Math.sin(t * 3 + m.seed) * 0.5 : 0;
  n.jaw.rotation.x = m.state === 'hunt' ? 0.5 + Math.sin(t * 30) * 0.15 : 0.08;
}

// ---------------- AI ----------------
let _id = 0;
export class Monster {
  constructor(type, game) {
    this.id = ++_id;
    this.type = type;
    this.game = game;
    this.cfg = CFG.MONSTER[type];
    this.rig = type === 'listener' ? buildListener() : buildCrawler();
    this.x = 0;
    this.z = 0;
    this.y = 0;
    this.yaw = 0;
    this.state = 'wander';
    this.stateT = 0;
    this.tx = 0;
    this.tz = 0;
    this.speedCur = 0;
    this.phase = Math.random() * 6;
    this.lastStepSign = 1;
    this.lock = 0;
    this.seed = Math.random() * 10;
    this.headYaw = 0;
    this.listenT = 0;
    this.pauseT = 0;
    this.stuckT = 0;
    this.detourT = 0;
    this.lastCloseCall = -100;
    this.breath = null;
    this.chitterT = 2;
    this.heardCD = 0;
    this.huntedPlayer = false;
    this.alive = true;
    this.scripted = null;
  }

  spawn(x, z, state = 'wander') {
    this.x = x;
    this.z = z;
    this.y = this.game.world.terrain.height(x, z);
    this.playerDist = Math.hypot(this.game.player.x - x, this.game.player.z - z);
    this.state = state;
    this.stateT = 0;
    this.pickWander();
    this.syncRig();
  }

  dispose() {
    if (this.breath) this.breath.stop();
    this.breath = null;
    this.alive = false;
  }

  get hearingMult() {
    return this.cfg.hearing * this.game.hearingScale;
  }

  pickWander() {
    const g = this.game;
    const p = g.player;
    // drift toward the player's region to keep the pressure on
    if (Math.random() < 0.4) {
      const a = Math.random() * Math.PI * 2, d = 12 + Math.random() * 30;
      this.tx = p.x + Math.cos(a) * d;
      this.tz = p.z + Math.sin(a) * d;
    } else {
      const a = Math.random() * Math.PI * 2, d = 15 + Math.random() * 35;
      this.tx = this.x + Math.cos(a) * d;
      this.tz = this.z + Math.sin(a) * d;
    }
    const w = CFG.WORLD_WALL - 8;
    this.tx = clamp(this.tx, -w, w);
    this.tz = clamp(this.tz, -w, w);
  }

  setState(s) {
    this.state = s;
    this.stateT = 0;
  }

  investigate(x, z, slow = false) {
    if (this.state === 'hunt') return;
    const fresh = this.state !== 'investigate';
    this.setState('investigate');
    this.tx = x;
    this.tz = z;
    this.slowInvestigate = slow;
    this.listenT = 0.6;
    return fresh;
  }

  startHunt() {
    const g = this.game;
    const fresh = this.state !== 'hunt';
    this.setState('hunt');
    this.lock = this.cfg.lock;
    this.huntedPlayer = true;
    if (fresh) g.onMonsterHunt(this);
  }

  // noise from the world. returns 'hunt' | 'investigate' | null
  hear(nx, nz, loud, source, scream) {
    if (!this.alive || this.state === 'flee' || this.scripted === 'freeze') return null;
    const dx = nx - this.x, dz = nz - this.z;
    const d = Math.hypot(dx, dz);
    const mult = source === 'step' && this.cfg.stepHearing ? this.cfg.stepHearing : 1;
    const R = CFG.hearRadius(loud) * this.hearingMult * mult;
    if (d > R) return null;
    const g = this.game;
    const fromPlayer = source !== 'stone' && source !== 'scare';
    if (this.state === 'hunt') {
      if (fromPlayer) {
        this.lock = Math.max(this.lock, 2.6);
        return 'hunt';
      }
      // a stone can break the chase if you've been quiet for a moment and it lands nearer to it than you are
      const p = g.player;
      const pd = Math.hypot(p.x - this.x, p.z - this.z);
      if (source === 'stone' && this.lock < this.cfg.lock * 0.75 && d < pd && pd > 3) {
        this.setState('investigate');
        this.tx = nx;
        this.tz = nz;
        this.slowInvestigate = false;
        g.onMonsterLost(this);
        return 'investigate';
      }
      return 'hunt';
    }
    if (fromPlayer && !g.grace && (scream || d < Math.max(2.5, R * 0.22))) {
      this.startHunt();
      return 'hunt';
    }
    const err = d * 0.12;
    const a = Math.random() * Math.PI * 2, r = Math.random() * err;
    const fresh = this.investigate(nx + Math.cos(a) * r, nz + Math.sin(a) * r);
    if (fresh) g.onMonsterInvestigate(this, d);
    return 'investigate';
  }

  syncRig() {
    const r = this.rig.root;
    r.position.set(this.x, this.y, this.z);
    r.rotation.y = this.yaw;
  }

  update(dt, t) {
    const g = this.game;
    const p = g.player;
    this.stateT += dt;
    this.heardCD -= dt;
    this.listenT -= dt;
    const pdx = p.x - this.x, pdz = p.z - this.z;
    const pd = Math.hypot(pdx, pdz);
    this.playerDist = pd;
    const cfg = this.cfg;
    const scale = g.speedScale;

    // ---- proximity sense ----
    if (this.state !== 'hunt' && this.state !== 'flee' && !this.scripted) {
      const moving = p.speed;
      const touch = pd < 0.95;
      const feels = pd < 2.3 && (moving > 1.75 || (moving > 0.3 && pd < 1.5));
      if (touch || (feels && !g.grace)) this.startHunt();
    }

    // ---- state machine ----
    let speed = 0;
    let tx = this.tx, tz = this.tz;
    switch (this.state) {
      case 'idle':
        speed = 0;
        this.headYaw = lerp(this.headYaw, clamp(angleDiff(this.yaw, Math.atan2(pdx, pdz)), -0.8, 0.8), dt * 2);
        break;
      case 'wander': {
        if (this.pauseT > 0) {
          this.pauseT -= dt;
          speed = 0;
        } else {
          speed = cfg.wander;
          if (Math.hypot(tx - this.x, tz - this.z) < 2) {
            this.pickWander();
            if (Math.random() < 0.5) this.pauseT = 1.5 + Math.random() * 3;
          }
        }
        if (this.stateT > 40) { this.pickWander(); this.stateT = 0; }
        break;
      }
      case 'investigate': {
        speed = this.slowInvestigate ? cfg.wander * 1.25 : cfg.investigate;
        const still = p.speed < 0.3;
        if (Math.hypot(tx - this.x, tz - this.z) < 1.6 || this.stateT > 30 || (still && pd < 2.1)) {
          this.setState('search');
          this.searchDur = 4 + Math.random() * 3.5;
        }
        break;
      }
      case 'search': {
        speed = 0.35;
        tx = this.x + Math.sin(t * 0.7 + this.seed) * 3;
        tz = this.z + Math.cos(t * 0.6 + this.seed) * 3;
        // it sniffs around... but a frozen, silent player is just another tree
        if (pd < 2.1) {
          tx = this.x - pdx;
          tz = this.z - pdz;
        }
        if (this.stateT > this.searchDur) {
          this.setState('wander');
          this.pickWander();
        }
        break;
      }
      case 'hunt': {
        this.lock -= dt;
        tx = p.x;
        tz = p.z;
        if (pd < 4) this.lock = Math.max(this.lock, 1.2);
        speed = cfg.hunt * (pd < 7 ? 1.18 : 1);
        if (this.stateT < 0.7) speed *= 0.25; // the windup screech
        if (pd < CFG.MONSTER.killDist && this.stateT > 0.35) {
          g.kill(this);
          return;
        }
        if (this.lock <= 0) {
          this.setState('investigate');
          this.tx = p.x + (Math.random() - 0.5) * 6;
          this.tz = p.z + (Math.random() - 0.5) * 6;
          g.onMonsterLost(this);
        }
        break;
      }
      case 'flee': {
        speed = cfg.hunt;
        tx = this.x + (this.x - p.x);
        tz = this.z + (this.z - p.z);
        break;
      }
    }
    speed *= scale;

    // detour if stuck
    if (this.detourT > 0) {
      this.detourT -= dt;
      tx = this.dtx;
      tz = this.dtz;
    }

    // ---- steering ----
    const dx = tx - this.x, dz = tz - this.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05 && speed > 0) {
      const want = Math.atan2(dx, dz);
      const turnRate = this.state === 'hunt' ? 7 : 2.6;
      const da = angleDiff(this.yaw, want);
      this.yaw += clamp(da, -turnRate * dt, turnRate * dt);
      // slow down for sharp turns
      speed *= 1 - Math.min(0.7, Math.abs(da) / Math.PI);
    }
    this.speedCur = lerp(this.speedCur, speed, 1 - Math.exp(-6 * dt));
    const ox = this.x, oz = this.z;
    this.x += Math.sin(this.yaw) * this.speedCur * dt;
    this.z += Math.cos(this.yaw) * this.speedCur * dt;
    const pos = { x: this.x, z: this.z };
    g.world.col.resolve(pos, cfg.radius);
    if (g.world.lake) {
      const L = g.world.lake;
      const lx = pos.x - L.x, lz = pos.z - L.z, ld = Math.hypot(lx, lz);
      if (ld < L.r + 0.5) { pos.x = L.x + (lx / ld) * (L.r + 0.5); pos.z = L.z + (lz / ld) * (L.r + 0.5); }
    }
    const w = CFG.WORLD_WALL;
    this.x = clamp(pos.x, -w, w);
    this.z = clamp(pos.z, -w, w);
    const moved = Math.hypot(this.x - ox, this.z - oz);
    if (this.speedCur > 0.5 && moved < this.speedCur * dt * 0.3) {
      this.stuckT += dt;
      if (this.stuckT > 0.6) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const a = this.yaw + side * (Math.PI / 2 + Math.random() * 0.6);
        this.dtx = this.x + Math.sin(a) * 4;
        this.dtz = this.z + Math.cos(a) * 4;
        this.detourT = 0.9;
        this.stuckT = 0;
      }
    } else this.stuckT = Math.max(0, this.stuckT - dt);
    this.y = lerp(this.y, g.world.terrain.height(this.x, this.z), 1 - Math.exp(-12 * dt));

    // head tracks the player when hunting / close
    if (this.state !== 'idle') {
      const rel = angleDiff(this.yaw, Math.atan2(pdx, pdz));
      const want = this.state === 'hunt' || pd < 10 ? clamp(rel, -0.9, 0.9) : 0;
      this.headYaw = lerp(this.headYaw, want, 1 - Math.exp(-4 * dt));
    }

    // ---- animation + sounds ----
    const strideHz = this.type === 'crawler' ? 3.2 : 1.55;
    this.phase += dt * Math.PI * 2 * strideHz * clamp(this.speedCur / (this.type === 'crawler' ? 2.5 : 1.8), 0, 2.2);
    if (this.type === 'listener') animListener(this, dt, t);
    else animCrawler(this, dt, t);
    this.syncRig();

    const audio = g.audio;
    const near = pd < 32;
    const sign = Math.sin(this.phase) >= 0 ? 1 : -1;
    if (sign !== this.lastStepSign) {
      this.lastStepSign = sign;
      if (near && this.speedCur > 0.4) {
        const gain = clamp(0.15 + this.speedCur * 0.08, 0, 0.7) * (this.type === 'crawler' ? 0.5 : 1);
        audio.heavyStep(this.x, this.y + 0.2, this.z, gain);
      }
    }
    if (this.type === 'crawler' && near) {
      this.chitterT -= dt;
      if (this.chitterT <= 0) {
        audio.chitter(this.x, this.y + 0.6, this.z, this.state === 'hunt' ? 0.7 : 0.35);
        this.chitterT = this.state === 'hunt' ? 0.5 + Math.random() * 0.4 : 3 + Math.random() * 5;
      }
    }
    if (pd < 28 && audio.ready) {
      if (!this.breath) this.breath = audio.breather(this.x, this.y + 2.2, this.z);
      if (this.breath) {
        this.breath.setPos(this.x, this.y + (this.type === 'crawler' ? 0.7 : 2.6), this.z);
        const rate = this.state === 'hunt' ? 2.8 : this.state === 'investigate' || this.state === 'search' ? 1.5 : 1;
        const gain = this.state === 'hunt' ? 0.9 : 0.45;
        this.breath.update(rate, gain);
      }
    } else if (this.breath && pd > 36) {
      this.breath.stop();
      this.breath = null;
    }
  }
}

export class ShadeRig {
  constructor() {
    this.rig = buildShade();
  }
  place(x, y, z, yaw) {
    const r = this.rig.root;
    r.position.set(x, y, z);
    r.rotation.y = yaw;
    const n = this.rig.nodes;
    n.head.rotation.z = (Math.random() - 0.5) * 0.9;
    n.head.rotation.x = (Math.random() - 0.5) * 0.4;
    n.torso.rotation.x = (Math.random() - 0.3) * 0.25;
  }
}
