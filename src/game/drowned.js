// The Дrowned (Утопленник) — 3.0d. The bog's own thing, and it works nothing like the forest's.
//
// It lives in the water and only in the water: it never climbs onto the planks, and it cannot follow you off
// them. Under the surface it does not show up in an echo at all — what a wave finds is a ring spreading on the
// water where it moved, and the ring is all the warning you get. It is deaf to your voice (there is nothing
// left in its head to hear with): what it goes by is the water you push. A step in the bog is worth three
// steps to it.
//
// When it has you it does not tear: it walks you out into the deep, and the deep is patient. It is slow —
// 0.9 m/s, slower than a walking man — so it never catches anyone. It waits for whoever goes in too far.
import { waterKick } from './waves.js'; // (3.0n) the Дrowned shoves the surface as it walks
import { Monster, makeRig, node, part, registerRig } from './monsters.js';
import { KIND } from '../world/builder.js';
import { CFG } from '../core/config.js';
import { clamp, lerp, angleDiff } from '../core/rng.js';
import { t } from '../core/i18n.js';

export const DROWNED = {
  speed: 0.9, // m/s — slower than a walk: it does not chase, it waits
  grabR: 1.2, // the hand closes at this range
  dragSpeed: 0.8, // and walks you out at this pace
  dragT: 2.6, // seconds in the deep before the water has you
  deep: 1.2, // "the deep" is this much water over your head
  shallow: 0.55, // pulled ashore of this, the grip is gone
  stepHearing: 3.0, // a step in water is worth three steps to it
  riseT: 1.8, // how long it takes to come up and show itself
  cool: 16, // seconds before it tries again after losing someone
  keepR: 42, // it stays this close to its pool
  spawnR: 26, // it comes up this far from the player
};

// The body: a heavy man in a coat that is mostly water, hair over the face, arms too long.
export function buildDrowned() {
  const R = makeRig('drowned');
  const N = (name, parent, x, y, z) => node(R, name, parent, x, y, z);
  const hips = N('hips', null, 0, 0.62, 0);
  part(R, hips, (b) => {
    b.identity();
    b.box(0.44, 0.26, 0.3, KIND.FLESH);
    // the coat, hanging heavy and open
    b.place(0, 0.12, 0);
    b.taper(0.5, 0.34, 0.42, 0.3, 0.5, KIND.WOOD);
  });
  const spine = N('spine', hips, 0, 0.16, 0);
  part(R, spine, (b) => {
    b.identity();
    b.taper(0.4, 0.28, 0.46, 0.3, 0.62, KIND.WOOD); // a swollen chest under the coat
    b.place(0, 0.3, 0.16);
    b.box(0.16, 0.1, 0.04, KIND.BONE); // a button, or a rib showing
  });
  const head = N('head', spine, 0, 0.66, 0.02);
  part(R, head, (b) => {
    b.identity();
    b.taper(0.2, 0.19, 0.17, 0.17, 0.24, KIND.FLESH); // the skull
    b.place(0, 0.1, 0);
    b.rock(0.15, () => 0.5, KIND.BARK, 0.2, 0.7); // sodden hair, hanging
    b.place(0, 0.06, -0.07);
    b.box(0.14, 0.05, 0.05, KIND.BONE); // where the eyes were
  });
  for (const side of [-1, 1]) {
    const arm = N(side > 0 ? 'armR' : 'armL', spine, side * 0.24, 0.4, 0);
    part(R, arm, (b) => {
      b.identity();
      b.limb([0, 0, 0], [0, -0.42, 0.02], 0.075, 0.06, KIND.WOOD, 5); // upper arm, in the coat
      b.limb([0, -0.42, 0.02], [0, -0.84, 0.06], 0.055, 0.035, KIND.FLESH, 5); // forearm: too long
      b.place(0, -0.88, 0.07);
      b.box(0.09, 0.12, 0.05, KIND.FLESH); // the hand
    });
    const leg = N(side > 0 ? 'legR' : 'legL', hips, side * 0.13, -0.1, 0);
    part(R, leg, (b) => {
      b.identity();
      b.limb([0, 0, 0], [0, -0.34, 0], 0.075, 0.06, KIND.WOOD, 5);
      b.limb([0, -0.34, 0], [0, -0.62, 0.01], 0.06, 0.045, KIND.FLESH, 5);
    });
  }
  return R;
}

registerRig('drowned', buildDrowned);

// Its body on the monster list: snapshots, echo imprints and lamp-light all treat it like the rest, except
// that under the surface it is not there. The brain that decides where it goes is the controller below.
export class DrownedBody extends Monster {
  constructor(game, id) {
    super('drowned', game, id);
    this.ghostColor = 0x2f6f7a; // what its ring looks like on the water
    this.noEyes = true;
    this.headY = 1.35;
    this.stepGain = 0;
    this.strideHz = 1.1;
    this.strideRef = 1.6;
    this.submerged = true; // presentation: under the water, only the ring shows
    this.mode = 'idle'; // idle | stalk | grab | drag
    this.grabT = 0;
  }

  // the water is the only ground it has: it never walks out onto the planks
  animate(dt, t) {
    const s = this.speedCur;
    this.phase += dt * dt * 0 + dt * Math.PI * 2 * this.strideHz * clamp(s / this.strideRef, 0, 2);
    const walk = Math.sin(this.phase);
    const n = this.rig.nodes;
    if (n.legL) n.legL.rotation.x = walk * 0.42;
    if (n.legR) n.legR.rotation.x = -walk * 0.42;
    if (n.armL) n.armL.rotation.x = -walk * 0.22 + 0.35; // the arms hang forward, reaching
    if (n.armR) n.armR.rotation.x = walk * 0.22 + 0.35;
    if (n.spine) n.spine.rotation.z = Math.sin(t * 0.9) * 0.05;
    // it sinks as it walks: only the head and shoulders are out of the water
    this.rig.root.position.y = this.y - (this.submerged ? 0.72 : 0.1) + Math.sin(t * 1.3) * 0.02;
  }

  hear() {
    return null; // it is deaf: the controller feeds it what it needs
  }

  danger() {
    const d = this.playerDist;
    return clamp(1 - d / 22, 0, 1) * (this.submerged ? 0.7 : 1);
  }

  think(dt) {
    // the controller steers; the body only keeps its own clock and its speed
    this.stateT += dt;
    this.tgtDist = this.tgt ? Math.hypot(this.tgt.x - this.x, this.tgt.z - this.z) : 1e4;
  }
}

// The controller: who it goes for, when the hand closes, and what the water does with you afterwards.
// Host- and solo-authoritative, like the Angler's: guests are told what happened ('dw' events).
export class Drowned {
  constructor(game) {
    this.g = game;
    this.reset();
  }

  reset() {
    this.body = null;
    this.cap = null; // { pid, t } while it has someone
    this.cool = 5;
    this.stepLoud = 0; // what the last splash told it
    this.hinted = {};
    this.lt = 0;
  }

  get onBog() {
    return this.g.map === 'bog';
  }

  bodyObj() {
    const g = this.g;
    if (this.body && g.monsters.includes(this.body)) return this.body;
    this.body = g.monsters.find((m) => m.type === 'drowned') || null;
    return this.body;
  }

  // one of these comes up on the first night, in the deepest water it can find near the camp
  spawnNight() {
    const g = this.g;
    if (!this.onBog) return null;
    if (this.bodyObj()) return this.body;
    const w = g.world;
    let best = null;
    for (let i = 0; i < 240; i++) {
      const a = g.rng.float(0, Math.PI * 2), d = g.rng.float(40, 110);
      const x = g.player.x + Math.cos(a) * d, z = g.player.z + Math.sin(a) * d;
      if (Math.abs(x) > w.wall - 6 || Math.abs(z) > w.wall - 6) continue;
      const dep = w.water.depth(x, z);
      if (dep < DROWNED.deep + 0.2) continue;
      if (!best || dep > best.d) best = { x, z, d: dep };
    }
    if (!best) return null;
    const m = new DrownedBody(g);
    m.spawn(best.x, best.z);
    m.submerged = true;
    m.y = g.world.terrain.height(best.x, best.z);
    g.monsters.push(m);
    this.body = m;
    return m;
  }

  // the local player is being walked out into the water: the game hands the body over to us
  captiveLocal() {
    return !!(this.cap && this.cap.pid === this.g.player.id && this.g.player.alive);
  }

  // while it has you: the view drops to the surface, sways, and you can do nothing about it
  dragFrame(dt) {
    const g = this.g, p = g.player;
    const body = this.bodyObj();
    p.vx = 0;
    p.vz = 0;
    p.speed = 0;
    p.crouching = false;
    p.sprinting = false;
    if (body) {
      const want = Math.atan2(body.x - p.x, body.z - p.z);
      p.yaw += clamp(angleDiff(p.yaw, want), -1.4 * dt, 1.4 * dt); // it turns you to face the water
    }
    p.eyeCur = lerp(p.eyeCur, 1.15, 1 - Math.exp(-3 * dt)); // the water comes up to your chin
    p.pitch = lerp(p.pitch, -0.18, 1 - Math.exp(-2 * dt));
    p.y = g.world.terrain.height(p.x, p.z);
    const stepLen = CFG.PLAYER.stepWalk;
    p.stepAcc += dt * DROWNED.dragSpeed; // being dragged splashes, and the splash is the only thing a friend hears
    if (p.stepAcc >= stepLen) {
      p.stepAcc -= stepLen;
      return { step: { loud: 0.2, mode: 'walk', intensity: 0.5, water: true, plank: false, ring: 8 }, bump: null, breath: false };
    }
    return { step: null, bump: null, breath: false };
  }

  update(dt) {
    const g = this.g;
    if (!this.onBog || g.state !== 'play') return;
    this.lt += dt;
    this.cool = Math.max(0, this.cool - dt);
    const body = this.bodyObj();
    if (!body) return;
    if (this.cap) this._drag(dt, body);
    else this._hunt(dt, body);
    // (3.0n) it is heavy, and the water says so: a ring every stride while it is up and moving
    this.ringT = (this.ringT || 0) - dt;
    if (this.ringT <= 0 && g.waves && body.mode !== 'idle' && g.world.water && g.world.water.depth(body.x, body.z) > 0.25) {
      waterKick(g.waves, g.world, body.x, body.z, g.time || 0, 'brute');
      this.ringT = 0.45;
    }
  }

  // ---------------- the hunt ----------------
  _hunt(dt, body) {
    const g = this.g, w = g.world;
    if (this.cool > 0) {
      body.mode = 'idle';
      body.submerged = true;
      return;
    }
    // whoever is standing in the water is worth going to. It cannot hear a voice, and it cannot leave
    // the water: a friend on the planks is out of its world.
    let tgt = null, best = 1e9;
    for (const p of g.livePlayers()) {
      if (!p.alive || p.held) continue;
      if (!w.water || w.water.depth(p.x, p.z) < 0.2) continue;
      if (g.world.onWalk(p.x, p.z, 0)) continue;
      const d = Math.hypot(p.x - body.x, p.z - body.z);
      if (d < best) { best = d; tgt = p; }
    }
    body.tgt = tgt;
    if (!tgt || best > DROWNED.keepR) {
      body.mode = 'idle';
      body.submerged = true;
      return;
    }
    body.mode = 'stalk';
    body.submerged = best > 6; // close enough and it comes up: the head, the hair, the long arms
    body._steer(dt, tgt.x, tgt.z, DROWNED.speed, 2.4);
    // it never steps out of the water, and never onto planks
    if (w.water.depth(body.x, body.z) < 0.35 || w.onWalk(body.x, body.z, 0.5)) {
      body.x = lerp(body.x, body.tx, -0.02);
      body.z = lerp(body.z, body.tz, -0.02);
    }
    // it shows itself the moment it is close, once a night
    if (best < 8 && !this.hinted.show) {
      this.hinted.show = true;
      g.hud && g.hud.flashAlert(t('aDrowned'), 'warn', 2.4);
      g.audio && g.audio.drownedRise && g.audio.drownedRise(body.x, body.y, body.z);
    }
    // the hand closes
    if (best <= DROWNED.grabR && body.tgtDist < DROWNED.grabR + 0.6) this._grab(tgt);
  }

  _grab(p) {
    const g = this.g;
    this.cap = { pid: p.id, t: 0 };
    p.held = true;
    this.body && (this.body.mode = 'drag');
    if (g.sync && g.auth) g.sync.ev('dw', p.id, 1);
    if (p.id === g.player.id) {
      g.addTrauma && g.addTrauma(0.3);
      g.hud && g.hud.flashAlert(t('aDrownedGrab'), 'danger', 2.2);
    }
    if (g.audio && g.audio.drownedGrab) g.audio.drownedGrab();
  }

  // ---------------- the drag ----------------
  _drag(dt, body) {
    const g = this.g, w = g.world;
    const p = g.playerById(this.cap.pid);
    if (!p || !p.alive) return this._release(0);
    // the deep: the wettest point within reach, away from the planks
    let tx = p.x, tz = p.z, bestD = w.water.depth(p.x, p.z);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = p.x + Math.cos(a) * 5, z = p.z + Math.sin(a) * 5;
      if (w.onWalk(x, z, 1)) continue;
      const d = w.water.depth(x, z);
      if (d > bestD) { bestD = d; tx = x; tz = z; }
    }
    const dx = tx - p.x, dz = tz - p.z, len = Math.hypot(dx, dz) || 1;
    const step = Math.min(len, DROWNED.dragSpeed * dt);
    p.x += (dx / len) * step;
    p.z += (dz / len) * step;
    body.x = lerp(body.x, p.x - (dx / len) * 0.9, 1 - Math.exp(-6 * dt));
    body.z = lerp(body.z, p.z - (dz / len) * 0.9, 1 - Math.exp(-6 * dt));
    body.yaw = Math.atan2(p.x - body.x, p.z - body.z);

    // pulled up onto the planks or back onto dry peat, the grip is gone
    if (w.onWalk(p.x, p.z, 0.2) || w.water.depth(p.x, p.z) < DROWNED.shallow) return this._release(0);

    // out of your depth, the clock runs
    if (w.water.depth(p.x, p.z) >= DROWNED.deep) this.cap.t += dt;
    if (this.cap.t >= DROWNED.dragT) return this._drown(p, body);
  }

  _drown(p, body) {
    const g = this.g;
    const pid = this.cap.pid;
    this.cap = null;
    this.cool = DROWNED.cool + 30;
    p.held = false;
    if (g.sync && g.auth) g.sync.ev('dw', pid, 2);
    if (body) body.mode = 'idle';
    g.kill(body || { type: 'drowned', x: p.x, z: p.z, y: p.y, huntCause: null }, p);
  }

  // how: 0 let go / pulled out · 1 a friend pulled you out
  _release(how) {
    const g = this.g;
    if (!this.cap) return;
    const pid = this.cap.pid;
    this.cap = null;
    this.cool = DROWNED.cool;
    const p = g.playerById(pid);
    if (p) p.held = false;
    if (this.body) this.body.mode = 'idle';
    if (g.sync && g.auth) g.sync.ev('dw', pid, 0, how);
  }

  // a friend hauling you back (Rescue calls this while it carries someone out of the water)
  freed(id) {
    if (this.cap && this.cap.pid === id) this._release(1);
  }
}
