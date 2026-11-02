// The Angler (Удильщик): the man with the lantern who works the third and fourth nights.
//
// He is not driven by noise like the things in monsters.js. He takes whoever has wandered off alone —
// far from every other living, free player — walks up at a pace just above a walk, closes a hand on
// them and hauls them by the arm to a tree, where he ties them. On the drag the captive rides low
// behind his back and can only look around: alternate A/D (or tap ЭХО) to struggle free, but a raised
// voice irritates him, and enough of it earns a fist and eight seconds of black. Tied to the tree you
// have five minutes on his clock — a clock dawn does not stop — for a friend to cut you down (hold E).
// Alone in the shift, or with nobody left able to come, you can chew through the rope yourself:
// slowly, and loud enough for the forest to hear. When the clock runs out he walks back out of the
// dark and finishes it in front of your eyes. What he takes stays taken: no cot, no syringe and no
// dawn brings you back — you are gone for the rest of the run (see Rescue's `consumed`).
//
// The body (AnglerBody, monsters.js) rides the ordinary monster list, so snapshots, echo imprints and
// lamp-ghosts need nothing new. Everything with a decision in it happens here, on the host (solo: the
// only machine); guests mirror the capture from the host's monster snapshot ('sn'.a, see NetSync) and
// send only struggle meters and finished unties. The fallen rules are the same as everywhere else: the
// host's word, checked against distance and walls.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { clamp, damp, angleDiff, lerp } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { createMonster } from './monsters.js';
import { CAP } from '../world/world.js';
import { poseDragged, poseBound } from './survivor.js';

export const ANGLER_PHASES = ['drag', 'tie', 'bound', 'finish'];
const A = () => CFG.ANGLER;
const _v = new THREE.Vector3();
const clamp01 = (v) => clamp(v, 0, 1);

// ---------------- pure pieces (tests ride on these) ----------------

// how far p stands from the nearest other player in the list (Infinity: nobody else out there)
export function isolationOf(p, players) {
  let d = Infinity;
  for (const q of players) {
    if (q === p || q.id === p.id) continue;
    const dd = Math.hypot(q.x - p.x, q.z - p.z);
    if (dd < d) d = dd;
  }
  return d;
}

// how fast he comes for you at `d` metres: a lope across the forest, a workman's walk up close —
// the last stretch is meant to be out-sprintable toward friends, the distance before it is not
export function approachSpeed(d, a = A()) {
  const t = clamp01((d - 12) / Math.max(1, a.farR - 12));
  return a.approach + (a.approachFar - a.approach) * t;
}

// who he would take: alive, free (not held, not seated, not down), and alone by A.isolateR.
// The loneliest first. `players` is the free-living list (the caller filters seats and towers).
export function pickTarget(players, a = A()) {
  let best = null, bd = -1;
  for (const p of players) {
    if (!p.alive || p.held) continue;
    const d = isolationOf(p, players);
    if (d >= a.isolateR && d > bd) { bd = d; best = p; }
  }
  return best;
}

// can the captive hope only for themselves? (solo, or every friend down / held / gone)
export function canSelfFree(players, victimId) {
  for (const p of players) {
    if (p.id === victimId) continue;
    if (p.alive && !p.held) return false;
  }
  return true;
}

// one step of the struggle meter: hits this frame in, the leak out
export function struggleStep(meter, hits, dt, hit, decay) {
  return clamp01(meter + hits * hit - decay * dt);
}

// a loud captive on the drag: the integral that ends in a fist. returns { v, ko }
export function irritationStep(v, loud, dt, a = A()) {
  if (loud > a.voiceLoud) v += (loud - a.voiceLoud) * dt * 2;
  else v = Math.max(0, v - a.irritateDecay * dt);
  return v >= a.irritate ? { v: 0, ko: true } : { v, ko: false };
}

// pick the tree: a real trunk (a tall TREE capsule, not a stump) 30–60 m off. `caps` is the collision
// world's capsule list; `reject(x, z)` vetoes a spot (lake, yard, inside a wall). The victim sits at
// (ax, az) against the trunk facing back the way they came; he stands at (fx, fz) to finish it.
export function chooseTree(caps, x, z, next, a = A(), reject = null) {
  const cand = [];
  for (const c of caps) {
    if (!c || c.kind !== CAP.TREE || c.h < 4 || c.ax !== c.bx || c.az !== c.bz) continue;
    const d = Math.hypot(c.ax - x, c.az - z);
    if (d < a.treeMin || d > a.treeMax) continue;
    cand.push(c);
  }
  while (cand.length) {
    const i = Math.floor(next() * cand.length) % cand.length;
    const c = cand.splice(i, 1)[0];
    let dx = x - c.ax, dz = z - c.az;
    const dl = Math.hypot(dx, dz) || 1;
    dx /= dl; dz /= dl;
    const ax = c.ax + dx * (c.r + 0.5), az = c.az + dz * (c.r + 0.5);
    if (reject && reject(ax, az)) continue;
    return {
      x: c.ax, z: c.az, r: c.r, ax, az,
      fx: ax + dx * 1.15, fz: az + dz * 1.15,
      yaw: Math.atan2(-dx, -dz), // player convention: forward = (-sin yaw, -cos yaw) = back the way they came
    };
  }
  return null;
}

export class Angler {
  constructor(game) {
    this.g = game;
    this.reset();
  }

  reset() {
    this.body = null; // the AnglerBody on g.monsters (host/solo bookkeeping; guests find it there too)
    this.hunt = null; // { id, t, regroup } while he is coming for someone
    this.huntTarget = null; // the player object the body steers at (read by AnglerBody.think)
    this.cap = null; // { pid, phase, tree, t, boundLeft, irrit, ko, struggle, dragT, returning, mid, selfFree }
    this.coolT = 8;
    this.untieT = 0;
    this.untieWait = 0;
    this.meter = 0; // the local captive's own struggle meter (authoritative-reported)
    this.lastSign = 0;
    this.sendT = 0;
    this.noiseT = 0;
    this.scrapeT = 0;
    this.hinted = {};
    this.lt = Math.random() * 10;
  }

  // ---------------- small queries ----------------
  get auth() { return this.g.auth; }

  bodyObj() {
    const g = this.g;
    if (this.body && g.monsters.includes(this.body)) return this.body;
    this.body = g.monsters.find((m) => m.type === 'angler') || null;
    return this.body;
  }

  myCap() {
    return this.cap && this.cap.pid === this.g.player.id ? this.cap : null;
  }

  heldLocal() {
    return !!this.myCap();
  }

  victim() {
    return this.cap ? this.g.playerById(this.cap.pid) : null;
  }

  // players he could conceivably take or who could run a rescue: alive and on their own feet
  _freePlayers() {
    const g = this.g;
    return g.livePlayers().filter((p) => !p.held && !this._seated(p));
  }

  _seated(p) {
    const g = this.g;
    if (p === g.player) return g.escape && g.escape.mySeat >= 0;
    return !!(g.escape && typeof g.escape.seatOf === 'function' && g.escape.seatOf(p.id) >= 0);
  }

  _loudOf(p) {
    const g = this.g;
    if (p === g.player) return g.mic && g.mic.state === 'on' ? g.mic.loud || 0 : 0;
    return p.loud || 0;
  }

  // ---------------- the lantern is a small light (see GlowSticks.lightSources) ----------------
  lightSource(out) {
    const b = this.bodyObj();
    if (!b || !b.rig.nodes.lantern) return;
    b.rig.nodes.lantern.getWorldPosition(_v);
    const L = A().lamp;
    const fl = 0.9 + 0.07 * Math.sin(this.lt * 11) + 0.03 * Math.sin(this.lt * 23 + 1.7);
    out.push({ x: _v.x, y: _v.y, z: _v.z, I: L.I * fl, c: L.c, R: L.R, prio: 1, near: 0.12, id: 'anglerLamp' });
  }

  // ---------------- every frame, every machine ----------------
  update(dt) {
    const g = this.g;
    this.lt += dt;
    if (this.cap && this.cap.ko > 0) this.cap.ko = Math.max(0, this.cap.ko - dt);
    this._syncHeld();
    if (this.auth) this._host(dt);
    else if (this.cap && this.cap.phase === 'bound') this.cap.boundLeft -= dt; // guests tick the rope clock locally between snapshots
    this._rescuerFrame(dt);
    this._sounds(dt);
  }

  _syncHeld() {
    const g = this.g;
    const all = [g.player, ...g.remotes.values()];
    for (const p of all) {
      const held = !!(this.cap && this.cap.pid === p.id && p.alive);
      if (held && !p.held) this._onHeld(p); // the moment his hand closes: whatever was carried, falls
      p.held = held;
    }
  }

  _onHeld(p) {
    const g = this.g;
    if (p.carrying) {
      const b = g.playerById(p.carrying);
      p.carrying = null;
      if (b && !b.alive && g.rescue) g.rescue.place(b, null, p.x, p.z, false);
    }
    if (g.escape) g.escape.dropFor(p.id, p.x, p.z);
    if (g.glows) g.glows.dropFor(p.id, p.x, p.z);
    if (p === g.player) {
      if (g.inventory && g.inventory.active) g.inventory.close();
      g.charge.active = false;
      this.meter = 0;
      this.lastSign = 0;
    }
  }

  _sounds(dt) {
    const g = this.g;
    if (!this.cap || !g.audio || !g.audio.ready) return;
    const b = this.bodyObj();
    if (this.cap.phase === 'drag' && b) {
      this.scrapeT -= dt;
      if (this.scrapeT <= 0) {
        this.scrapeT = 0.34;
        g.audio.dragScrape(b.x, b.y + 0.3, b.z, 0.8);
      }
    }
    if (this.cap.phase === 'finish' && b) {
      // the chop, timed to the arm coming down (the same finishK the animation reads)
      const k = b.finishK || 0;
      if (k >= 0.8 && !this.struck) {
        this.struck = true;
        g.audio.cleaverStrike(b.x, b.y + 1.6, b.z, this.myCap() ? 1.3 : 0.9);
        if (this.myCap()) g.addTrauma(0.6);
      }
    } else this.struck = false;
  }

  // ---------------- host: the hunt ----------------
  _host(dt) {
    const g = this.g, a = A();
    if (g.map === 'bog') return; // (3.0k) the man with the lantern is the forest's, and he stays in it
    if (this.body && !g.monsters.includes(this.body)) this.body = null;
    if (g.state !== 'play') {
      // dawn and morning: he is gone with the other things. A drag ends where it lies;
      // a tied captive stays tied — his clock keeps its own time, under the sun too.
      if (this.cap) {
        if (this.cap.phase === 'bound') this.cap.boundLeft -= dt;
        else if (this.cap.phase === 'finish') { this.cap.phase = 'bound'; this.cap.returning = false; }
        else this._release(2);
      }
      this.hunt = null;
      this.huntTarget = null;
      return;
    }
    if (this.cap) { this._hostCap(dt); return; }
    if (this.hunt) { this._hostHunt(dt); return; }
    this._leaveTick();
    this.coolT -= dt;
    if (this.coolT > 0) return;
    if (g.diffDay() < a.fromDay || !g.awake || g.time < a.after) return; // (2.1s: by effective day — in a two-night shift he works the finale)
    const target = pickTarget(this._freePlayers(), a);
    if (!target) { this.coolT = 4; return; }
    if (this._spawnBody(target.x, target.z, 34, 48)) { // (2.1q: nearer — a hunt that starts 60 m out rarely ended)
      this.hunt = { id: target.id, t: 0, regroup: 0, high: 0 };
      this.huntTarget = target;
      this.body.mode = 'stalk';
    } else this.coolT = 6;
  }

  _spawnBody(cx, cz, dmin, dmax) {
    const g = this.g;
    if (this.bodyObj()) {
      // a leftover body walking off somewhere past the trees is no use to a new errand:
      // past a certain distance it is simpler for him to come out of a nearer dark (2.1q)
      if (Math.hypot(this.body.x - cx, this.body.z - cz) <= dmax + 25) return true;
      this.body.dispose();
      const i = g.monsters.indexOf(this.body);
      if (i >= 0) g.monsters.splice(i, 1);
      this.body = null;
    }
    const w = this.g.world.wall - 6;
    for (let k = 0; k < 40; k++) {
      const ang = g.rng.float(0, Math.PI * 2), d = g.rng.float(dmin, dmax);
      const x = cx + Math.cos(ang) * d, z = cz + Math.sin(ang) * d;
      if (Math.abs(x) > w || Math.abs(z) > w) continue;
      if (!g.world.col.free(x, z, 1) || g.world.inYard(x, z, 1.5)) continue;
      const L = g.world.lake;
      if (L && Math.hypot(x - L.x, z - L.z) < L.r + 3) continue;
      let clear = true;
      for (const q of g.livePlayers()) if (Math.hypot(q.x - x, q.z - z) < 26) { clear = false; break; }
      if (!clear) continue;
      const m = createMonster('angler', g);
      m.spawn(x, z);
      g.monsters.push(m);
      this.body = m;
      if (g.audio) g.audio.anglerFound(m.x, m.y + 1.7, m.z); // he has his loner: let the forest hear it
      return true;
    }
    return false;
  }

  _leaveTick() {
    // a body with no work walks off into the trees and is gone
    const b = this.body;
    if (!b || this.cap || this.hunt) return;
    if (b.mode !== 'leave') {
      b.mode = 'leave';
      const ang = Math.atan2(b.x, b.z) + (Math.random() - 0.5);
      const W = this.g.world.wall;
      b.tx = clamp(b.x + Math.sin(ang) * 90, -W + 8, W - 8);
      b.tz = clamp(b.z + Math.cos(ang) * 90, -W + 8, W - 8);
    }
    let near = 1e9;
    for (const q of this.g.livePlayers()) near = Math.min(near, Math.hypot(q.x - b.x, q.z - b.z));
    if (near > 75) {
      b.dispose();
      const i = this.g.monsters.indexOf(b);
      if (i >= 0) this.g.monsters.splice(i, 1);
      this.body = null;
    }
  }

  _hostHunt(dt) {
    const g = this.g, a = A();
    const b = this.body;
    const target = g.playerById(this.hunt.id);
    const giveUp = () => {
      this.hunt = null;
      this.huntTarget = null;
      this.coolT = g.rng.float(a.cooldown[0], a.cooldown[1]);
      if (b) b.mode = 'leave';
    };
    if (!b || !target || !target.alive || target.held || this._seated(target)) { giveUp(); return; }
    this.hunt.t += dt;
    this.huntTarget = target;
    b.mode = 'stalk';
    // back among friends, and he lets the matter drop (he only takes the alone)
    const iso = isolationOf(target, this._freePlayers());
    this.hunt.regroup = iso < a.regroupR ? this.hunt.regroup + dt : 0;
    // up the lookout where he cannot follow: he will not wait under it forever
    this.hunt.high = target.y - b.y > 4 ? this.hunt.high + dt : 0;
    if (this.hunt.regroup > a.regroupT || this.hunt.high > 6 || this.hunt.t > a.huntGiveUp) { giveUp(); return; }
    // the hand closes
    const d = Math.hypot(target.x - b.x, target.z - b.z);
    b.stalkSpeed = approachSpeed(d, a); // read by AnglerBody.think (kept off the body: no import cycle)
    if (d < a.grabR && Math.abs(target.y - b.y) < 2.3) {
      if (g.doors && g.doors.blocks(b.x, b.z, target.x, target.z)) return;
      if (g.escape && g.escape.blocks(b.x, b.z, target.x, target.z)) return;
      if (g.world.losBlocked(b.x, b.y + 1.2, b.z, target.x, target.y + 1.1, target.z, 0.15)) return;
      this._grab(target);
    }
  }

  _grab(target) {
    const g = this.g, a = A();
    // (3.1p) the spot is half a metre off the trunk's bark, so it is only asked to hold a body (the player's
    // 0.35 m): asked for 0.8 m, the tree itself was "in the way" of every spot — not one of the ~130 trees in
    // reach ever passed, and every hunt ended with his hand on you and him walking off
    const tree = chooseTree(g.world.col.caps, target.x, target.z, () => g.rng.next(), a, (x, z) => {
      const L = g.world.lake;
      return g.world.inYard(x, z, 1) || !g.world.col.free(x, z, CFG.PLAYER.radius) || (L && Math.hypot(x - L.x, z - L.z) < L.r + 1.5);
    });
    if (!tree) { // no tree worth the walk: tonight he lets this one go with a warning
      this.hunt = null; this.huntTarget = null;
      this.coolT = g.rng.float(a.cooldown[0], a.cooldown[1]);
      if (this.body) this.body.mode = 'leave';
      return;
    }
    this.hunt = null;
    this.huntTarget = null;
    this.cap = {
      pid: target.id, phase: 'drag', tree, t: 0, dragT: 0,
      boundLeft: a.boundFor, irrit: 0, ko: 0, struggle: 0, returning: false,
      mid: this.body ? this.body.id : -1, selfFree: false,
    };
    if (this.body) this.body.mode = 'haul';
    this._syncHeld();
    g.hlNote?.('grab');
    if (g.sync) g.sync.ev('ag', target.id);
    this.netGrab(target.id); // the host's own machine hears it too
  }

  // ---------------- host: the capture ----------------
  _hostCap(dt) {
    const g = this.g, a = A();
    const cap = this.cap;
    const v = g.playerById(cap.pid);
    const b = this.body;
    if (!v || !v.alive) { this.cap = null; if (b) b.mode = 'leave'; return; }
    cap.t += dt;
    cap.selfFree = canSelfFree(g.livePlayers(), cap.pid);

    if (cap.phase === 'drag' || cap.phase === 'tie') {
      if (!b) { this._release(3); return; }
      // a loud captive earns a fist
      if (cap.ko <= 0) {
        const r = irritationStep(cap.irrit, this._loudOf(v), dt, a);
        cap.irrit = r.v;
        if (r.ko) {
          cap.ko = a.ko;
          cap.struggle = 0;
          if (g.sync) g.sync.ev('ako', cap.pid);
          this.netKO(cap.pid);
        }
      }
      if (cap.struggle >= 0.999) { this._release(0); return; }
    }

    switch (cap.phase) {
      case 'drag': {
        cap.dragT += dt;
        b.mode = 'haul';
        const d = Math.hypot(cap.tree.x - b.x, cap.tree.z - b.z);
        if (cap.dragT > a.dragGiveUp && d > 6) { this._release(3); return; } // lost his way, lost his temper: dropped
        if (d < 1.5) {
          cap.phase = 'tie'; cap.t = 0;
          b.mode = 'tie';
          g.audio.ropeTie(b.x, b.y + 1, b.z, 0.8);
        }
        break;
      }
      case 'tie': {
        b.mode = 'tie';
        if (cap.t >= a.tie) {
          cap.phase = 'bound'; cap.t = 0;
          cap.boundLeft = a.boundFor;
          cap.struggle = 0;
          b.mode = 'leave';
          if (g.sync) g.sync.ev('ab', cap.pid);
          this.netBound(cap.pid);
        }
        break;
      }
      case 'bound': {
        cap.boundLeft -= dt;
        if (cap.selfFree && cap.struggle >= 0.999) { this._release(0); return; }
        if (cap.boundLeft <= 0) {
          if (!cap.returning) {
            if (this._spawnBody(cap.tree.ax, cap.tree.az, 24, 34)) cap.returning = true;
          }
          const bb = this.body;
          if (bb && cap.returning) {
            bb.mode = 'return';
            if (Math.hypot(cap.tree.fx - bb.x, cap.tree.fz - bb.z) < 0.7) {
              cap.phase = 'finish'; cap.t = 0;
              bb.mode = 'finish';
              if (g.sync) g.sync.ev('afin', cap.pid);
              this.netFinish(cap.pid);
            }
          }
        } else this._leaveTick();
        break;
      }
      case 'finish': {
        if (b) b.mode = 'finish';
        if (cap.t >= a.finishT) this._annihilate();
        break;
      }
    }
  }

  // how: 0 struggled/chewed free · 1 cut down by a friend · 2 dropped at dawn · 3 dropped on the way
  _release(how, byId = '') {
    const g = this.g, a = A();
    if (!this.cap) return;
    const pid = this.cap.pid;
    this.cap = null;
    this.coolT = g.rng.float(a.cooldown[0], a.cooldown[1]);
    if (this.body) this.body.mode = 'leave';
    this._syncHeld();
    if (g.sync) g.sync.ev('afr', pid, how, byId);
    this.netFreed(pid, how, byId);
  }

  _annihilate() {
    const g = this.g, a = A();
    if (!this.cap) return;
    const pid = this.cap.pid;
    const tree = this.cap.tree;
    this.cap = null;
    this.coolT = g.rng.float(a.cooldown[0], a.cooldown[1]) + 40;
    if (this.body) this.body.mode = 'leave';
    if (g.sync) g.sync.ev('ak', pid, +tree.ax.toFixed(2), +tree.az.toFixed(2));
    this._applyKill(pid, tree);
  }

  _applyKill(pid, tree) {
    const g = this.g;
    const proxy = this.bodyObj() || { type: 'angler', x: tree.ax + 1, z: tree.az, y: g.world.terrain.height(tree.ax, tree.az), id: -1 };
    if (pid === g.player.id) g.anglerDeath(proxy);
    else {
      const r = g.remotes.get(pid);
      if (r) g.anglerTook(r, tree);
    }
  }

  // ---------------- host: words from guests ----------------
  hostStruggle(pid, meter) {
    if (!this.cap || this.cap.pid !== pid || !Number.isFinite(meter)) return;
    if (this.cap.ko > 0) return;
    this.cap.struggle = clamp01(meter);
  }

  hostUntie(victimId, byId) {
    const g = this.g, a = A();
    const cap = this.cap;
    if (!cap || cap.pid !== victimId || cap.phase !== 'bound') return; // not once he's back and the arm is up
    const by = g.playerById(byId);
    if (!by || !by.alive || by.held) return;
    if (Math.hypot(by.x - cap.tree.ax, by.z - cap.tree.az) > a.untieR + 1.1) return;
    if (g.world.losBlocked(by.x, by.y + 1.2, by.z, cap.tree.ax, cap.tree.ay || by.y + 1.1, cap.tree.az, 0.9)) return;
    this._release(1, byId);
  }

  // ---------------- network: the snapshot slice and the events ----------------
  // rides inside the host's monster snapshot ('sn'.a): self-healing, no event can be lost for long
  netState() {
    const c = this.cap;
    if (!c) return 0;
    const r2 = (v) => Math.round(v * 100) / 100;
    return [c.pid, ANGLER_PHASES.indexOf(c.phase), r2(c.tree.x), r2(c.tree.z), r2(c.tree.r), r2(c.tree.ax), r2(c.tree.az), r2(c.tree.yaw), Math.ceil(c.boundLeft), r2(c.ko), r2(c.struggle), c.mid, c.selfFree ? 1 : 0];
  }

  netMerge(a) {
    if (!a || a === 0) { this.cap = null; return; }
    if (!Array.isArray(a) || typeof a[0] !== 'string') return;
    const phase = ANGLER_PHASES[a[1] | 0] || 'drag';
    const tree = {
      x: +a[2], z: +a[3], r: +a[4] || 0.3, ax: +a[5], az: +a[6], yaw: +a[7],
      fx: +a[5], fz: +a[6],
    };
    if (![tree.x, tree.z, tree.ax, tree.az, tree.yaw].every(Number.isFinite)) return;
    const was = this.cap;
    this.cap = {
      pid: a[0], phase, tree,
      t: was && was.phase === phase ? was.t + 0.1 : 0, dragT: 0,
      boundLeft: +a[8] || 0, irrit: 0,
      ko: Math.max(was && was.pid === a[0] ? was.ko : 0, +a[9] || 0),
      struggle: +a[10] || 0, returning: false, mid: a[11] | 0, selfFree: !!a[12],
    };
    // the stand point, rebuilt the same way the host made it (anchor pushed out from the trunk)
    const dx = tree.ax - tree.x, dz = tree.az - tree.z, dl = Math.hypot(dx, dz) || 1;
    tree.fx = tree.ax + (dx / dl) * 1.15;
    tree.fz = tree.az + (dz / dl) * 1.15;
    this._syncHeld();
  }

  // ---- event effects (host calls these on itself too; guests get them from the wire) ----
  netGrab(pid) {
    const g = this.g;
    const b = this.bodyObj();
    const v = g.playerById(pid);
    const x = b ? b.x : v ? v.x : 0, y = b ? b.y + 1.4 : 1, z = b ? b.z : v ? v.z : 0;
    if (g.audio.ready) g.audio.anglerGrab(x, y, z);
    if (pid === g.player.id) {
      g.addTrauma(0.55);
      g.fx.red = Math.max(g.fx.red, 0.35);
      g.hud.flashAlert(t('anglerGrabbed'), 'danger', 2.6);
      if (!this.hinted.drag) {
        this.hinted.drag = true;
        g.hud.setHint(t(g.input.touch ? 'anglerDragHintTouch' : 'anglerDragHint'));
        g.timeline.push({ at: g.time + 7, fn: () => g.hud.setHint(null) });
      }
    } else if (v) {
      g.hud.flashAlert(t('anglerMateTaken').replace('{name}', g.nameOf(v)), 'danger', 2.8);
    }
  }

  netKO(pid) {
    const g = this.g;
    const v = g.playerById(pid);
    if (v && g.audio.ready) g.audio.koThud(v.x, v.y + 1, v.z, pid === g.player.id ? 1.2 : 0.8);
    if (this.cap && this.cap.pid === pid) this.cap.ko = Math.max(this.cap.ko, A().ko - 0.15);
    if (pid === g.player.id) {
      g.addTrauma(0.5);
      this.meter = 0;
      g.hud.setHint(null);
    }
  }

  netBound(pid) {
    const g = this.g;
    const v = g.playerById(pid);
    if (v && g.audio.ready) g.audio.ropeTie(v.x, v.y + 1, v.z, 1);
    if (pid === g.player.id) {
      this.meter = 0;
      g.hud.flashAlert(t('anglerBound'), 'danger', 3);
      if (!this.hinted.bound) {
        this.hinted.bound = true;
        g.hud.setHint(t('anglerBoundHint'));
        g.timeline.push({ at: g.time + 8, fn: () => g.hud.setHint(null) });
      }
    } else if (v) {
      g.hud.flashAlert(t('anglerMateBound').replace('{name}', g.nameOf(v)), 'danger', 3);
    }
  }

  netFreed(pid, how, byId) {
    const g = this.g;
    if (this.cap && this.cap.pid === pid) this.cap = null;
    this._syncHeld();
    const v = g.playerById(pid);
    if (v && g.audio.ready) g.audio.ropeTie(v.x, v.y + 1, v.z, 0.5);
    if (pid === g.player.id) {
      g.player.stamina = Math.min(g.player.stamina, 25);
      g.hud.flashAlert(t(how === 2 ? 'anglerDawnFree' : 'anglerFreed'), 'dawn', 2.6);
      g.fx.fade = 1;
    } else if (v) {
      g.hud.flashAlert(t('anglerMateFree').replace('{name}', g.nameOf(v)), 'dawn', 2.4);
    }
    if (how === 1 && byId === g.player.id) {
      const pts = Math.round(CFG.SCORE.untie * g.mult);
      g.score += pts;
      g.hud.popup(`+${pts}`, 'dawn');
    }
  }

  netFinish(pid) {
    const g = this.g;
    if (this.cap && this.cap.pid === pid) this.cap.phase = 'finish';
    if (pid === g.player.id) {
      g.addTrauma(0.4);
      if (g.audio.ready) g.audio.sting(0.8);
    }
  }

  netKill(pid, ax, az) {
    if (this.cap && this.cap.pid === pid) this.cap = null;
    this._applyKill(pid, { ax: +ax || 0, az: +az || 0 });
  }

  // ---------------- the captive's own frame (called instead of Player.update) ----------------
  // You do not walk. On the drag you ride on the ground behind him and can look about; tied, you sit
  // against the trunk; at the end your head is made to watch. Returns Player.update's event shape.
  captiveFrame(dt, look) {
    const g = this.g, a = A(), cap = this.cap, p = g.player;
    const ev = { step: null, bump: null, breath: false };
    if (!cap) return ev;
    g.input.useHeld = false; // your hands are not yours: no doors, no generators, no seats
    p.crouching = false;
    p.sprinting = false;
    p.speed = 0;
    p.bobY = 0;
    const ko = cap.ko > 0;
    g.fx.fade = damp(g.fx.fade, ko ? 0 : 1, ko ? 6 : 2.5, dt);

    // struggle: alternating strafe (A/D, or the stick), and the echo tap counts too (touch)
    let hits = 0;
    if (!ko) {
      const sx = g.input.move ? g.input.move.x : 0;
      const sign = sx > 0.5 ? 1 : sx < -0.5 ? -1 : 0;
      if (sign && this.lastSign && sign !== this.lastSign) hits++;
      if (sign) this.lastSign = sign;
      if (g.events && g.events.includes('pingDown')) hits++;
    }

    const b = this.bodyObj();
    if (cap.phase === 'drag') {
      if (b) {
        const back = 1.2;
        const pos = { x: b.x - Math.sin(b.yaw) * back, z: b.z - Math.cos(b.yaw) * back };
        g.world.col.resolve(pos, CFG.PLAYER.radius);
        p.x = pos.x; p.z = pos.z;
        const base = b.yaw + Math.PI; // facing his back (player yaw runs the other way to a monster's)
        if (!ko) {
          p.yaw -= look.dx;
          p.pitch = clamp(p.pitch - look.dy, -0.55, 1.0);
        }
        p.yaw = base + clamp(angleDiff(base, p.yaw), -2.1, 2.1);
      }
      p.eyeCur = damp(p.eyeCur, 0.45, 8, dt);
      p.roll = Math.sin(g.time * 2.1) * 0.07;
      this.meter = struggleStep(this.meter, hits, dt, a.struggleHit, a.struggleDecay);
      g.hud.setUse(t(g.input.touch ? 'anglerStruggleTouch' : 'anglerStruggle'), this.meter, true);
    } else {
      // tie / bound / finish: against the trunk
      const tx = cap.tree.ax, tz = cap.tree.az;
      if (cap.phase === 'tie') {
        p.x = damp(p.x, tx, 3.5, dt);
        p.z = damp(p.z, tz, 3.5, dt);
      } else { p.x = tx; p.z = tz; }
      p.eyeCur = damp(p.eyeCur, 1.02, 8, dt);
      p.roll = damp(p.roll || 0, 0.05, 4, dt);
      if (cap.phase === 'finish' && b) {
        const want = Math.atan2(-(b.x - p.x), -(b.z - p.z));
        p.yaw += clamp(angleDiff(p.yaw, want), -2.4 * dt, 2.4 * dt);
        p.pitch = damp(p.pitch, 0.34, 3, dt); // made to look up at it
      } else if (!ko) {
        p.yaw -= look.dx;
        p.pitch = clamp(p.pitch - look.dy, -0.9, 0.95);
        p.yaw = cap.tree.yaw + clamp(angleDiff(cap.tree.yaw, p.yaw), -1.15, 1.15);
      }
      if (cap.phase === 'bound') {
        if (cap.selfFree) {
          this.meter = struggleStep(this.meter, hits, dt, a.selfHit, a.selfDecay);
          if (hits) {
            this.noiseT -= dt;
            if (this.noiseT <= 0) { this.noiseT = 0.35; g.playerNoise(p.x, p.z, 0.13, 'bump'); }
          }
          g.hud.setUse(t(g.input.touch ? 'anglerChewTouch' : 'anglerChew'), this.meter, true);
        } else {
          this.meter = 0;
          const left = Math.max(0, cap.boundLeft);
          const mm = Math.floor(left / 60), ss = String(Math.floor(left % 60)).padStart(2, '0');
          g.hud.setUse(`${t('anglerTied')} · ${mm}:${ss}`, 1 - left / a.boundFor, false);
        }
      } else if (cap.phase === 'tie') {
        this.meter = struggleStep(this.meter, hits, dt, a.struggleHit, a.struggleDecay);
        g.hud.setUse(t(g.input.touch ? 'anglerStruggleTouch' : 'anglerStruggle'), this.meter, true);
      }
    }
    p.y = damp(p.y, g.world.terrain.height(p.x, p.z), 18, dt);
    p.vx = p.vz = 0;

    // the host keeps the meter of record
    if (this.auth) cap.struggle = this.meter;
    else if (g.coop) {
      this.sendT -= dt;
      if (this.sendT <= 0) {
        this.sendT = 0.18;
        g.coop.toHost('as', Math.round(this.meter * 1000) / 1000);
      }
    }
    return ev;
  }

  // ---------------- a friend at the rope ----------------
  _rescuerFrame(dt) {
    const g = this.g, a = A();
    this.untieWait = Math.max(0, this.untieWait - dt);
    const cap = this.cap, p = g.player;
    if (!cap || cap.phase !== 'bound' || !p.alive || p.held || (g.state !== 'play' && g.state !== 'dawn' && g.state !== 'morning')) {
      this.untieT = 0;
      return;
    }
    const v = g.playerById(cap.pid);
    if (!v || v === p) { this.untieT = 0; return; }
    const d = Math.hypot(p.x - cap.tree.ax, p.z - cap.tree.az);
    if (d > a.untieR || Math.abs(p.y - v.y) > 2.6) { this.untieT = 0; return; }
    if (g.input.useHeld && !g.inventory.active) {
      this.untieT += dt;
      if (g.audio.ready && Math.random() < dt * 3) g.audio.ropeRub(cap.tree.ax, p.y + 1.1, cap.tree.az);
      if (this.untieT >= a.untie && this.untieWait <= 0) {
        this.untieT = 0;
        this.untieWait = 1.2;
        if (this.auth) this.hostUntie(cap.pid, p.id);
        else if (g.coop) g.coop.toHost('au', cap.pid);
        return;
      }
    } else this.untieT = Math.max(0, this.untieT - dt * 2);
    g.hud.setUse(`${t('useUntie').replace('{name}', g.nameOf(v))}`, this.untieT / a.untie, true);
  }

  // ---------------- how a captive friend looks to you ----------------
  poseRemote(r) {
    const cap = this.cap;
    if (!cap || cap.pid !== r.id || !r.alive) return false;
    const g = this.g;
    const root = r.rig.root;
    if (cap.phase === 'drag') {
      poseDragged(r.rig, g.time + (r.seed || 0), cap.ko > 0 ? 0 : clamp01(cap.struggle + 0.25));
      root.position.set(r.x, r.y + 0.08, r.z);
      root.rotation.set(-0.95, r.yaw + Math.PI, 0); // tipped back, hauled along the ground (YXZ: yaw first, then the fall)
    } else {
      poseBound(r.rig, g.time + (r.seed || 0), cap.phase === 'finish' ? 1 : 0);
      root.position.set(cap.tree.ax, g.world.terrain.height(cap.tree.ax, cap.tree.az), cap.tree.az);
      root.rotation.set(0, cap.tree.yaw + Math.PI, 0);
    }
    return true;
  }
}
