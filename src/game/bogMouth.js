// (5.0e) Chapter 5 of «Топь»: «Генератор» — the mouth of the bog (docs/LEVEL2.md).
//
// The village behind you, the map in somebody's hands (game/bogMap.js): out across the open ground to the gate in
// the stake fence where the bog begins. That ground has the Корень under it — its nerves, thin red veins in the
// earth that the echo picks out. Keep moving over them: stand still on them for a few seconds (reading the map,
// say) and the ground swells under you, and a second later it comes up. At the gate, the generator on its skid:
// when everyone still alive has come to it, one of you pulls the cord (hold E — three pulls, the third catches).
// It runs; the lamps along the causeway come on one after another, the gate swings open, and the Kugoo bikes stand
// by it, one for each of you. The way is open: the chapter is over.
//
// The mouth itself (the gate's two leaves, the causeway lamps, the bikes) belongs to the level, not the chapter
// (BogMouth, kept by game/level2.js): shut and dark before the generator, open and lit for the chapters after it.
//
// Co-op: the host decides the nerves (who stood too long, who was under a strike) and the generator; a guest
// sends the start it pulled ('gq'); the host sends everyone's state, the strikes and the start ('gv', 6 Hz).
import * as THREE from 'three';
import { RNG, clamp, damp, smoothstep } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { GK } from '../ui/garageSet.js';
import { createWorldMaterial } from '../render/sonar.js';
import { GATE, GENERATOR, HOUSES } from '../world/swamp.js';
import { haloMaterial } from './glowsticks.js';
import { beaconTexture } from './roadTraffic.js';
import { buildKugoo, newBike, poseKugoo } from './moto.js';
import { RoadArm } from './roadArm.js';
import { ROOT, rootPose, rootLife } from './roadDrive.js';
import { poseSprawled } from './survivor.js';
import { MOON } from './convoyFilm.js';
import { drawBogMap, MapOverlay } from './bogMap.js';

const PI = Math.PI;
const NO_LOOK = { dx: 0, dy: 0 };

export const NERVE = {
  n: 7, r: 7, // patches of nerves, metres across (radius)
  still: 2.8, // s standing on them before the ground swells (it comes up ROOT.swell later: ~4 s in all)
  reach: 1.7, // m from where it comes up: it has you
  moveV: 0.7, // m/s: slower than this is standing
  keep: 22, // m clear round the gate and the generator (you have to stand there to start it)
};
export const GEN = {
  gather: 14, // m from the generator: «everyone is here»
  useR: 2.6,
  pull: 3.0, // s on the cord (three pulls: the third catches)
  gateT: 2.6, // s for the gate to swing open
  lampEvery: 0.35, // s between one lamp coming on and the next
  doneT: 6.0, // s from the start to the end of the chapter
  deadT: 3.2,
  netHz: 6,
};
export const EDGE = { x: -14, z: -172 }; // where chapter 5 starts when it has to start somewhere (a retry, ?chapter=5)
export const BIKE_ROW = { x: GATE.x - 6, gap: 1.5 }; // the bikes, a row along the fence inside the gate

// where the nerves are: on the open ground between the village and the gate, clear of the houses and the mouth
export function nervePlan(seed) {
  const r = new RNG((seed ^ 0x5eed5) >>> 0);
  const out = [];
  for (let tries = 0; tries < 600 && out.length < NERVE.n; tries++) {
    const x = r.float(-26, 72), z = r.float(-222, -118);
    if (Math.hypot(x - GATE.x, z - GATE.z) < NERVE.keep + NERVE.r || Math.hypot(x - GENERATOR.x, z - GENERATOR.z) < NERVE.keep + NERVE.r) continue;
    if (HOUSES.some((H) => Math.hypot(x - H.x, z - H.z) < NERVE.r + 7)) continue;
    if (out.some((q) => Math.hypot(x - q.x, z - q.z) < NERVE.r * 2.2)) continue;
    out.push({ i: out.length, x, z, r: NERVE.r });
  }
  return out;
}

// is (x, z) on the nerves?
export function onNerves(nerves, x, z) {
  return nerves.some((q) => Math.hypot(x - q.x, z - q.z) < q.r);
}

// where the bikes stand: a row inside the gate, facing it
export function bikeSpots(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: BIKE_ROW.x, z: GATE.z + (i - (n - 1) / 2) * BIKE_ROW.gap, yaw: -PI / 2 });
  return out;
}

// ---------------------------------------------------------------- the mouth (the level's)
// the gate's two leaves (hinged on the posts, swinging east into the bog side), the causeway lamps, the bikes
export class BogMouth {
  constructor(game) {
    this.g = game;
    this.open = 0; // 0 shut … 1 open
    this.want = 0;
    this.lit = 0; // how many lamps are on
    this.litT = 0;
    this.lighting = false;
    this.leaves = [];
    this.halos = [];
    this.bikes = [];
    this.rides = []; // (5.0f) each bike's state for the ride down the causeway (moto.js newBike), by bike index
    const w = game.world, scene = game.scene;
    if (!w?.swamp || !scene) return;
    const y = w.terrain.height(GATE.x, GATE.z);
    for (const s of [-1, 1]) {
      // the leaf in its own frame: hinge at the origin, along +x, 2.5 m long, 2.2 high
      const b = new MeshBuilder(256);
      const L = 2.5, H = 2.2;
      for (let k = 0; k < 6; k++) { b.place(0.22 + k * 0.42, H / 2, 0); b.box(0.36, H - (k % 2) * 0.12, 0.06, KIND.WOOD); }
      for (const hy of [0.35, 1.1, 1.9]) { b.place(L / 2, hy, 0.06); b.box(L, 0.14, 0.06, KIND.WOOD); }
      b.place(L / 2, 1.1, 0.1, 0, 0, Math.atan2(1.5, L)); b.box(Math.hypot(L, 1.5), 0.12, 0.05, KIND.WOOD); // the brace
      const m = new THREE.Mesh(b.toGeometry(), w.material);
      m.frustumCulled = false;
      const hx = GATE.x, hz = GATE.z - s * 2.6; // s = +1: the north post (z − 2.6), the leaf closing toward +z
      m.position.set(hx, y - 0.05, hz);
      scene.add(m);
      const cap = w.col.addDynamic(hx, hz, L + 0.2, 0.09, H, 0);
      this.leaves.push({ m, s, hx, hz, L, cap });
    }
    this._place();
  }

  // the chapter the level is in: after the generator the mouth is open and lit; before it, shut and dark
  chapter(index) {
    const after = index >= 5;
    this.want = after ? 1 : 0;
    this.open = this.want;
    this.lighting = false;
    this.lit = after ? this._lamps().length : 0;
    this._halos();
    this._place();
    if (index >= 4) this.ensureBikes();
    if (after) this._hum();
    else this.quiet();
  }

  // the generator has caught: the lamps one by one, the gate swings, and it runs on
  start() {
    this.want = 1;
    this.lighting = true;
    this.litT = 0;
    this._hum();
  }

  _hum() {
    if (this.hum || !this.g.audio?.ready) return;
    const y = this.g.world.terrain.height(GENERATOR.x, GENERATOR.z);
    this.hum = this.g.audio.genHum?.(GENERATOR.x, y + 0.8, GENERATOR.z, true) || null;
    this.hum?.spin?.(1);
  }

  // the level is over (or left): the generator falls silent
  quiet() {
    this.hum?.stop?.();
    this.hum = null;
  }

  _lamps() { return this.g.world?.swamp?.lamps || []; }

  ensureBikes(n = null) {
    const g = this.g;
    const count = Math.max(1, Math.min(4, n ?? (g.online ? (g.remotes?.size || 0) + 1 : 1)));
    if (this.bikes.length === count || !g.scene) return;
    for (const b of this.bikes) b.removeFromParent();
    const paints = [KIND.BONE, GK.REDPAINT, GK.GATE, GK.CARPAINT];
    this.paints = paints;
    this.bikes = bikeSpots(count).map((p, i) => {
      const m = buildKugoo(paints[i % paints.length], g.world.material);
      m.rotation.order = 'YXZ';
      m.position.set(p.x, g.world.terrain.height(p.x, p.z), p.z);
      m.rotation.set(0, p.yaw, 0);
      g.scene.add(m);
      return m;
    });
    this.resetRides();
  }

  // (5.0f) every bike back at its place in the row, standing, still (a ride that starts again)
  resetRides(spots = bikeSpots(this.bikes.length)) {
    const w = this.g.world;
    this.rides = spots.map((p, i) => {
      const b = newBike(i, p.x, p.z, p.yaw);
      b.y = w.walkHeight?.(p.x, p.z) ?? w.terrain.height(p.x, p.z);
      return b;
    });
    this.rides.forEach((b, i) => this.placeRide(i));
  }

  // a bike's mesh where its state is (pitch, heading, lean; the wheels and the fork)
  placeRide(i, b = this.rides[i]) {
    const m = this.bikes[i];
    if (!m || !b) return;
    m.position.set(b.x, b.y, b.z);
    m.rotation.set(b.pitch || 0, b.yaw, b.roll || 0, 'YXZ');
    poseKugoo(m, b);
  }

  _halos() {
    const L = this._lamps(), scene = this.g.scene;
    while (this.halos.length < L.length && scene) {
      const l = L[this.halos.length];
      const sp = new THREE.Sprite(haloMaterial(0xffd9a0, beaconTexture()));
      sp.position.set(l.x, l.y - 0.18, l.z);
      sp.scale.setScalar(2.4);
      sp.material.opacity = 1.2;
      scene.add(sp);
      this.halos.push(sp);
    }
    this.halos.forEach((sp, i) => { sp.visible = i < this.lit; });
  }

  _place() {
    const w = this.g.world;
    const a = smoothstep(0, 1, this.open) * 1.62;
    for (const lf of this.leaves) {
      const dx = Math.sin(a), dz = lf.s * Math.cos(a);
      lf.m.rotation.set(0, Math.atan2(-dz, dx), 0);
      w.col.setSeg(lf.cap, lf.hx, lf.hz, lf.hx + dx * lf.L * 0.97, lf.hz + dz * lf.L * 0.97);
    }
  }

  update(dt) {
    if (this.open !== this.want) {
      const was = this.open;
      this.open = this.want > this.open ? Math.min(this.want, this.open + dt / GEN.gateT) : Math.max(this.want, this.open - dt / GEN.gateT);
      if (was === 0 && this.open > 0) this.g.audio?.gateSwing?.(GATE.x, this.g.world.terrain.height(GATE.x, GATE.z) + 1.2, GATE.z);
      this._place();
    }
    if (this.lighting) {
      this.litT += dt;
      const n = Math.min(this._lamps().length, Math.floor(this.litT / GEN.lampEvery) + 1);
      if (n > this.lit) {
        this.lit = n;
        const l = this._lamps()[n - 1];
        if (l) this.g.audio?.lampOn?.(l.x, l.y, l.z);
        this._halos();
      }
      if (this.lit >= this._lamps().length) this.lighting = false;
    }
  }

  // the lit lamps nearest the ears get the small-light slots (two of them)
  lightSources(out) {
    if (!this.lit) return;
    const e = this.g._ears || this.g.player || { x: 0, y: 0, z: 0 };
    const L = this._lamps().slice(0, this.lit).map((l) => ({ l, d: Math.hypot(l.x - e.x, l.z - e.z) })).sort((a, b) => a.d - b.d).slice(0, 2);
    for (const { l } of L) out.push({ x: l.x, y: l.y - 0.3, z: l.z, I: 1.25, c: [1, 0.86, 0.62], R: 17, prio: 2, near: 0.3, id: l });
  }

  dispose() {
    this.quiet();
    const w = this.g.world;
    for (const lf of this.leaves) { lf.m.removeFromParent(); lf.m.geometry.dispose(); w?.col?.setSeg(lf.cap, 9999, 9999, 9999, 9999); }
    for (const sp of this.halos) { sp.removeFromParent(); sp.material.dispose(); }
    for (const b of this.bikes) b.removeFromParent();
    this.leaves = []; this.halos = []; this.bikes = [];
  }
}

// ---------------------------------------------------------------- the chapter
export class GeneratorPlay {
  constructor(game) {
    this.g = game;
    this.t = 0;
    this.done = false;
    this.restart = false;
    this.danger = 0;
    this.players = new Map(); // id → { id, alive, still, spd, px, pz }
    this.strikes = []; // [{ x, z, age, pid, n }] — a swell, then what comes up
    this.started = false;
    this.startT = 0;
    this.pull = 0;
    this.cords = 0;
    this.sendT = 0;
    this.deadT = 0;
    this.cues = new Set();
    this.heard = new Set();
    this.seq = 0;
  }

  get me() { return this.g.player.id ?? 'me'; }
  get mine() { return this.players.get(this.me) || null; }
  get seated() { return !this.mine?.alive; }
  _pl(id) { return id === this.me ? this.g.player : this.g.remotes?.get(id) || null; }

  begin(tries = 0) {
    const g = this.g;
    this.tries = tries;
    this._roster();
    this.nerves = nervePlan(g.baseSeed || 0);
    this.mat = createWorldMaterial();
    this._veins();
    this.slots = [0, 1].map(() => {
      const arm = new RoadArm(g.scene, this.mat);
      arm.mesh.visible = false;
      const b = new MeshBuilder(512);
      b.place(0, 0, 0, 0, 0, 0, 1, 0.42, 1);
      b.rock(1.1, () => 0.5, KIND.GROUND, 0.3, 0.6);
      const bump = new THREE.Mesh(b.toGeometry(), this.mat);
      bump.frustumCulled = false;
      bump.visible = false;
      g.scene?.add(bump);
      return { arm, bump, pose: null };
    });
    this.map = new MapOverlay();
    const L2 = g.level2;
    if (L2 && (!L2.mapHolder || !this.players.has(L2.mapHolder))) L2.mapHolder = this._first();
    g.level2?.mouth?.ensureBikes(this.players.size);
  }

  dispose() {
    for (const s of this.slots || []) { s.arm.dispose(); s.bump.removeFromParent(); s.bump.geometry.dispose(); }
    this.slots = [];
    this.veins?.removeFromParent();
    this.veins?.geometry.dispose();
    this.veins = null;
    this.mat?.dispose?.();
    this.map?.hide();
    this.g.hud?.setUse(null);
  }

  // the first of us by seat (who carries the map when nobody did)
  _first() {
    let best = null, bs = Infinity;
    for (const P of this.players.values()) if (P.alive && P.slot < bs) { bs = P.slot; best = P.id; }
    return best;
  }

  _roster() {
    const g = this.g;
    const ids = [{ id: this.me, slot: g.player.slot | 0 }];
    for (const r of g.remotes?.values?.() || []) ids.push({ id: r.id, slot: r.slot | 0 });
    for (const { id, slot } of ids) if (!this.players.has(id)) this.players.set(id, { id, slot, alive: true, still: 0, spd: 0, px: null, pz: null });
    for (const id of [...this.players.keys()]) if (!ids.some((q) => q.id === id)) this.players.delete(id);
  }

  // the nerves in the ground: veins out from each patch's middle (the world's material: the echo picks them out)
  _veins() {
    const b = new MeshBuilder(4096), w = this.g.world, r = new RNG(77);
    for (const q of this.nerves) {
      for (let k = 0; k < 9; k++) {
        let x = q.x, z = q.z, a = (k / 9) * PI * 2 + r.float(-0.3, 0.3);
        for (let s = 0; s < 6; s++) {
          const len = r.float(0.8, 1.4), nx = x + Math.cos(a) * len, nz = z + Math.sin(a) * len;
          if (Math.hypot(nx - q.x, nz - q.z) > q.r) break;
          const y0 = w.terrain.height(x, z) + 0.03, y1 = w.terrain.height(nx, nz) + 0.03;
          b.identity();
          b.limb([x, y0, z], [nx, y1, nz], 0.05, 0.035, KIND.FLESH, 3);
          x = nx; z = nz; a += r.float(-0.6, 0.6);
        }
      }
    }
    this.veins = new THREE.Mesh(b.toGeometry(), this.mat);
    this.veins.frustumCulled = false;
    this.g.scene?.add(this.veins);
  }

  // ---------------- the frame ----------------
  update(dt, raw) {
    const g = this.g;
    this.t += dt;
    this._roster();
    if (g.auth) this._host(dt);
    else this._follow(dt);
    const pev = this._self(dt, raw);
    this._draw();
    this._others();
    this._sound();
    this._hud();
    if (g.role === 'host' && g.sync) {
      this.sendT -= dt;
      if (this.sendT <= 0) {
        this.sendT = 1 / GEN.netHz;
        g.sync.send('gv', this.pack());
      }
    }
    if (g.auth) {
      const live = [...this.players.values()].filter((P) => P.alive);
      this.deadT = live.length ? 0 : this.deadT + dt;
      if (this.deadT >= GEN.deadT) this.restart = true;
      if (this.started && this.startT >= GEN.doneT) this.done = true;
    }
    return pev;
  }

  // ---------------- the host ----------------
  _host(dt) {
    const g = this.g;
    if (this.started) this.startT += dt;
    for (const P of this.players.values()) {
      const p = this._pl(P.id);
      if (!p || !P.alive) continue;
      if (P.px !== null && dt > 0) P.spd = damp(P.spd, Math.hypot(p.x - P.px, p.z - P.pz) / dt, 8, dt);
      P.px = p.x; P.pz = p.z;
      // standing on the nerves: the ground notices
      if (!this.started && onNerves(this.nerves, p.x, p.z) && P.spd < NERVE.moveV) P.still += dt;
      else P.still = 0;
      if (P.still >= NERVE.still && !this.strikes.some((s) => s.pid === P.id && s.age < rootLife)) {
        P.still = 0;
        this.strikes.push({ x: p.x, z: p.z, age: 0, pid: P.id, n: ++this.seq });
        this._cue('swell:' + this.seq);
      }
    }
    for (const s of this.strikes) {
      const was = s.age;
      s.age += dt;
      if (was < ROOT.swell && s.age >= ROOT.swell) {
        this._cue('strike:' + s.n);
        for (const P of this.players.values()) {
          const p = this._pl(P.id);
          if (P.alive && p && Math.hypot(p.x - s.x, p.z - s.z) < NERVE.reach) {
            P.alive = false;
            this._cue('grab:' + P.id);
          }
        }
      }
    }
    this.strikes = this.strikes.filter((s) => s.age < rootLife);
    // the map goes to the next of us if its holder fell
    const L2 = g.level2;
    if (L2 && L2.mapHolder && !this.players.get(L2.mapHolder)?.alive) L2.mapHolder = this._first();
  }

  // everyone still alive within reach of the generator?
  gathered() {
    let n = 0, m = 0;
    for (const P of this.players.values()) {
      if (!P.alive) continue;
      m++;
      const p = this._pl(P.id);
      if (p && Math.hypot(p.x - GENERATOR.x, p.z - GENERATOR.z) < GEN.gather) n++;
    }
    return { n, m, all: m > 0 && n === m };
  }

  // the cord caught (the host's own, or a guest's 'gq'): only when everyone is here
  hostStart(pid = this.me) {
    if (this.started) return false;
    const P = this.players.get(pid), p = this._pl(pid);
    if (!P?.alive || !p || Math.hypot(p.x - GENERATOR.x, p.z - GENERATOR.z) > GEN.useR + 1.2) return false;
    if (!this.gathered().all) return false;
    this.started = true;
    this.startT = 0;
    this._cue('start');
    this.g.level2?.mouth?.start();
    return true;
  }

  _cue(key) {
    this.cues.add(key);
    if (this.cues.size > 30) this.cues.delete(this.cues.values().next().value);
  }

  // ---------------- the wire ----------------
  pack() {
    const r2 = (v) => Math.round(v * 100) / 100;
    return {
      p: [...this.players.values()].map((P) => [P.id, P.alive ? 1 : 0]),
      s: this.started ? 1 : 0,
      st: r2(this.startT),
      r: this.strikes.map((s) => [r2(s.x), r2(s.z), r2(s.age), s.pid, s.n]),
      h: this.g.level2?.mapHolder || '',
      c: [...this.cues],
    };
  }

  applyMouth(d) {
    if (!d || !Array.isArray(d.p)) return;
    for (const e of d.p) {
      const P = Array.isArray(e) && this.players.get(e[0]);
      if (P) P.alive = !!e[1];
    }
    if (d.s && !this.started) { this.started = true; this.g.level2?.mouth?.start(); }
    if (Number.isFinite(+d.st)) this.startT = +d.st;
    if (Array.isArray(d.r)) this.strikes = d.r.filter(Array.isArray).map(([x, z, age, pid, n]) => ({ x: +x, z: +z, age: +age, pid, n }));
    if (this.g.level2 && typeof d.h === 'string' && d.h) this.g.level2.mapHolder = d.h;
    for (const c of d.c || []) this.cues.add(c);
  }

  // a guest: the strikes' clocks run on between packets
  _follow(dt) {
    for (const s of this.strikes) s.age += dt;
    if (this.started) this.startT += dt;
  }

  // ---------------- you ----------------
  _self(dt, raw) {
    const g = this.g, p = g.player, P = this.mine;
    const look = g.inputMuted ? NO_LOOK : raw?.look || NO_LOOK;
    if (!P) return null;
    if (P.alive) {
      const pev = p.update(dt, g.input, look, g.inputMuted || g.inventory?.active);
      p.roll = damp(p.roll || 0, 0, 4, dt);
      this._generator(dt, raw);
      this._map();
      return pev;
    }
    // taken: down where it had you
    g.hud.setUse(null);
    this.map?.hide();
    p.vx = p.vz = 0;
    p.speed = 0;
    p.eyeCur = damp(p.eyeCur, 0.3, 3, dt);
    p.roll = damp(p.roll || 0, 0.9, 2, dt);
    g.fx.fade = Math.min(g.fx.fade, 1 - smoothstep(0, 1.6, (this.deadClock = (this.deadClock || 0) + dt)) * 0.8);
    return null;
  }

  // the generator: hold E on the cord when everyone is here
  _generator(dt) {
    const g = this.g, p = g.player;
    const d = Math.hypot(p.x - GENERATOR.x, p.z - GENERATOR.z);
    if (this.started || d > GEN.useR) {
      this.pull = 0;
      this.cords = 0;
      if (this.usePrompt) { g.hud.setUse(null); this.usePrompt = false; }
      return;
    }
    this.usePrompt = true;
    const G = this.gathered();
    if (!G.all) {
      this.pull = 0;
      g.hud.setUse(t('useGenWait').replace('{n}', G.n).replace('{m}', G.m), 0, false, true);
      return;
    }
    if (g.input?.useHeld && !g.inputMuted) {
      this.pull += dt;
      // a pull on the cord each second: the first two cough, the third catches
      const n = Math.min(3, Math.floor(this.pull / (GEN.pull / 3)) + 1);
      if (n > this.cords) { this.cords = n; g.audio?.cordPull?.(GENERATOR.x, g.world.terrain.height(GENERATOR.x, GENERATOR.z) + 0.8, GENERATOR.z, n === 3 ? 1 : 0.6); }
      if (this.pull >= GEN.pull) {
        this.pull = 0;
        if (g.auth) this.hostStart(this.me);
        else g.coop?.toHost('gq', 1);
      }
    } else { this.pull = Math.max(0, this.pull - dt * 2); if (!this.pull) this.cords = 0; }
    g.hud.setUse(t('useGen'), Math.min(1, this.pull / GEN.pull), true);
  }

  // TAB: the map, in the hands that hold it
  _map() {
    const g = this.g, mine = g.level2?.mapHolder === this.me;
    const want = mine && !g.inputMuted && !!g.input?.peekHeld;
    this.mapOpen = want;
    this.map?.show(want, (ctx, S) => drawBogMap(ctx, S, [true, true, true, true], g.player, (g.world.houses || []).filter((h) => HOUSES.some((H) => H.id === h.id))));
  }

  // ---------------- drawing ----------------
  _draw() {
    const g = this.g, ground = (x, z) => g.world.terrain.height(x, z);
    for (const s of this.slots) s.used = false;
    for (const S of this.strikes) {
      const sl = this.slots.find((q) => !q.used);
      if (!sl) break;
      sl.used = true;
      const gy = ground(S.x, S.z);
      const sw = S.age < ROOT.swell ? smoothstep(0, ROOT.swell, S.age) : 1 - smoothstep(ROOT.swell + ROOT.up + ROOT.stand, rootLife, S.age);
      sl.bump.visible = true;
      sl.bump.position.set(S.x, gy - 0.25 + 0.3 * sw, S.z);
      sl.bump.scale.set(0.4 + 0.6 * sw, 0.2 + 1.1 * sw * (1 + 0.15 * Math.sin(this.t * 13)), 0.4 + 0.6 * sw);
      sl.arm.mesh.visible = S.age >= ROOT.swell;
      if (sl.arm.mesh.visible) sl.arm.bend((sl.pose = rootPose({ x: S.x, z: S.z, i: S.n }, S.age, this.t, ground, sl.pose)));
    }
    for (const s of this.slots) if (!s.used) { s.bump.visible = false; s.arm.mesh.visible = false; }
    // the danger: how long you have stood on them
    const P = this.mine, p = g.player;
    const near = this.strikes.some((s) => s.age < ROOT.swell + 0.3 && Math.hypot(p.x - s.x, p.z - s.z) < NERVE.reach + 1.5);
    this.danger = near ? 1 : P?.alive && onNerves(this.nerves, p.x, p.z) ? clamp((P.still || 0) / NERVE.still, 0, 1) * 0.7 : 0;
  }

  _others() {
    for (const r of this.g.remotes?.values?.() || []) {
      const P = this.players.get(r.id);
      if (P && !P.alive && r.rig) poseSprawled(r.rig, 1);
    }
  }

  _sound() {
    const g = this.g, au = g.audio;
    if (!au) return;
    for (const c of this.cues) {
      if (this.heard.has(c)) continue;
      this.heard.add(c);
      const [kind, arg] = c.split(':');
      if (kind === 'swell' || kind === 'strike') {
        const s = this.strikes.find((q) => String(q.n) === arg);
        if (!s) continue;
        const y = g.world.terrain.height(s.x, s.z);
        if (kind === 'swell') {
          au.rootSwell?.(s.x, y, s.z);
          g.pulses?.emit(s.x, y + 0.3, s.z, g.time, { radius: 12, strength: 1.1, speed: 18, decay: 0.9, color: [1, 0.4, 0.3], kind: 'shard' });
          if (s.pid === this.me) g.hud.flashAlert?.(t('genNerves'), 'warn', 1.6);
        } else {
          au.rootStrike?.(s.x, y, s.z);
          g.addTrauma?.(Math.hypot(g.player.x - s.x, g.player.z - s.z) < 8 ? 0.6 : 0.15);
        }
      } else if (kind === 'grab' && arg === this.me) {
        g.addTrauma?.(1);
        g.fx.white = Math.max(g.fx.white, 0.4);
        g.hud.setIntro(t('genTaken'), t(this.players.size > 1 ? 'villageWait' : 'l2Again'));
      } else if (kind === 'start') {
        const y = g.world.terrain.height(GENERATOR.x, GENERATOR.z);
        g.pulses?.emit(GENERATOR.x, y + 1, GENERATOR.z, g.time, { radius: 60, strength: 0.9, speed: 30, decay: 0.6, color: [1, 0.85, 0.6], kind: 'shard' });
      }
    }
  }

  _hud() {
    const g = this.g, P = this.mine;
    if (!P || !P.alive || this.mapOpen) { if (this.mapOpen) g.hud.setHint(null); return; }
    if (this.t < 5.2) return;
    if (this.started) { g.hud.setHint(t('genStarted')); return; }
    const holder = g.level2?.mapHolder;
    if (Math.hypot(g.player.x - GENERATOR.x, g.player.z - GENERATOR.z) < GEN.gather) g.hud.setHint(t('genHere'));
    else if (holder === this.me) g.hud.setHint(t('genGoMap'));
    else g.hud.setHint(t('genGoWith').replace('{name}', g.nameOf(this._pl(holder) || holder || '')));
  }

  lightSources(out) {
    out.push({ x: MOON.x, y: MOON.y, z: MOON.z, I: MOON.I * 0.8, c: MOON.c, R: MOON.R, prio: 9, near: 2, id: 'moon' });
    for (const s of this.strikes) {
      const k = s.age < ROOT.swell ? smoothstep(0, ROOT.swell, s.age) : 1 - smoothstep(ROOT.swell, ROOT.swell + 1.2, s.age);
      if (k > 0.02) out.push({ x: s.x, y: this.g.world.terrain.height(s.x, s.z) + 0.5, z: s.z, I: 1.1 * k, c: [1, 0.22, 0.12], R: 7, prio: 1, near: 0.4, id: s });
    }
  }

  applyCamera() {
    return false;
  }
}

