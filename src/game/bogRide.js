// (5.0f) Chapters 6 and 7 of «Топь»: «Побег» and «Обрыв» — on the Kugoo bikes over the bog (docs/LEVEL2.md).
//
// 6. Each of you on the bike that stood by the gate for you, on the training ground's physics (moto.js: a sprung
//    pitching chassis, an electric motor, two brakes, turning by lean). Through the open gate and down the causeway:
//    3.4 m of planks over the bog, no handrail — off the edge is into it. The arms come up out of the bog beside the
//    causeway and lay themselves across it: you see one rear in its red light, you hold back or you race it; under
//    the blow, or riding into one lying across the planks, is the end. The Корень comes up through the planks
//    ahead of whoever is coming: the swell on one side, a second, the strike — be on the other side.
// 7. The causeway ends at the knoll: up it and off the cliff into the lake. When the first of you reaches the top,
//    the biggest of them rises out of the bog behind it; six seconds later it comes down on the top. In the water —
//    a film (game/pierFilm.js): the swim to the pier, the old man with his rod, the end of the night.
//
// Each rider rides their own machine (as on the training ground); the host judges the arms, the roots, the bog
// and the lake from where everyone is, and sends it ('ew', 10 Hz). A rider's bike index rides the usual state
// packet, so friends see you on your machine. Death is the chapter's: alone it starts again; in a room the fallen
// wait for the others.
import * as THREE from 'three';
import { clamp, damp, smoothstep, angleDiff } from '../core/rng.js';
import { fovFor } from '../core/config.js';
import { t } from '../core/i18n.js';
import { KIND, MeshBuilder } from '../world/builder.js';
import { createWorldMaterial } from '../render/sonar.js';
import { CAUSEWAY, CLIFF, LAKE } from '../world/swamp.js';
import { stepBike, settleDown, riderEye, MOTO, buildBars, placeBars, newBike } from './moto.js';
import { RoadArm } from './roadArm.js';
import { chasePose, chasePhase, CHASE, ROOT, rootPose, rootLife } from './roadDrive.js';
import { MOON } from './convoyFilm.js';
import { poseSprawled } from './survivor.js';
import { PierFilm, Fisherman, PT } from './pierFilm.js';

const NO_LOOK = { dx: 0, dy: 0 };
const _e = new THREE.Euler(0, 0, 0, 'YXZ');

export const RIDE = { bog: 0.1, stun: 1.4, netHz: 10, deadT: 3.2 };
// the arms across the causeway: where along it (m), which side they come from, their place in the cycle
export const ARMS = [{ s: 33, side: 1, off: 0 }, { s: 75, side: -1, off: 1.9 }];
export const ARM_PERIOD = 4.2; // s: up, down, lying, back under — and a while gone
export const ARM_HIT = 2.3; // m from where it comes down: under it
export const ARM_LIE = 1.6; // m from it while it lies across the planks: you rode into it
export const ROOTS = [{ s: 18, lat: 0.7 }, { s: 54, lat: -0.7 }, { s: 94, lat: 0.7 }]; // lat: m to the left of the middle
export const ROOT_LEAD = 1.2; // it comes up where a rider will be ROOT.swell from now (× their speed)
export const ROOT_HIT = 1.5; // m: the middle of the planks is in it; the far edge (1.7 m off) is not
export const ROOT_POST = 0.8; // m: standing afterwards it is a post in the planks
export const TOP = { r: 15, warn: 6.0, hit: 14, high: 4 }; // the cliff: reach the top and it comes down there 6 s later

// ---------------- the causeway, measured ----------------
export const CW = (() => {
  const pts = CAUSEWAY.pts, cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1], w: CAUSEWAY.w };
})();

// a point s metres along it: { x, z, dx, dz } (left of the way it runs is (dz, −dx))
export function cwAt(s, out = {}) {
  s = clamp(s, 0, CW.len);
  let i = 1;
  while (i < CW.cum.length - 1 && CW.cum[i] < s) i++;
  const [ax, az] = CW.pts[i - 1], [bx, bz] = CW.pts[i];
  const L = CW.cum[i] - CW.cum[i - 1] || 1, f = (s - CW.cum[i - 1]) / L;
  out.x = ax + (bx - ax) * f;
  out.z = az + (bz - az) * f;
  out.dx = (bx - ax) / L;
  out.dz = (bz - az) / L;
  return out;
}

// where a point is to it: s along, lat to the left of the middle, d from the middle
export function cwProject(x, z) {
  let best = { s: 0, lat: 0, d: Infinity };
  for (let i = 1; i < CW.pts.length; i++) {
    const [ax, az] = CW.pts[i - 1], [bx, bz] = CW.pts[i];
    const L = CW.cum[i] - CW.cum[i - 1], ux = (bx - ax) / L, uz = (bz - az) / L;
    const f = clamp((x - ax) * ux + (z - az) * uz, 0, L);
    const px = ax + ux * f, pz = az + uz * f, d = Math.hypot(x - px, z - pz);
    if (d < best.d) best = { s: CW.cum[i - 1] + f, lat: (x - px) * uz - (z - pz) * ux, d };
  }
  return best;
}

// an arm's place in its cycle at time tt (−1: under the bog)
export function armU(a, tt) {
  const u = (((tt + a.off) % ARM_PERIOD) + ARM_PERIOD) % ARM_PERIOD;
  return u < CHASE.cycle ? u : -1;
}
// where it comes down (on the planks) and where it comes out of the bog
export function armTB(a) {
  const T = cwAt(a.s, {});
  return { T, B: { x: T.x - T.dx * 3 + T.dz * 10 * a.side, z: T.z - T.dz * 3 - T.dx * 10 * a.side } };
}
export const ARM_LAND = CHASE.rise + CHASE.slam; // u: the moment it lands
export const ARM_UP = ARM_LAND + CHASE.lie; // ...and the moment it starts back under

export function rootAt(R) {
  const p = cwAt(R.s, {});
  return { x: p.x + p.dz * R.lat, z: p.z - p.dx * R.lat };
}

// ---------------------------------------------------------------- the ride (both chapters)
class RidePlay {
  constructor(game) {
    this.g = game;
    this.t = 0;
    this.done = false;
    this.restart = false;
    this.danger = 0;
    this.players = new Map(); // id → { id, slot, i (bike), st: 'ride' | 'swim' | 'dead', cause, at }
    this.cues = new Set();
    this.heard = new Set();
    this.sendT = 0;
    this.deadT = 0;
    this.stun = 0;
    this.look = { yaw: 0, pitch: -0.05, idle: 0 };
  }

  get me() { return this.g.player.id ?? 'me'; }
  get mine() { return this.players.get(this.me) || null; }
  get seated() { return true; } // (your hands are on the bars: no kit)
  get riding() { const P = this.mine; return P && P.st === 'ride' ? P.i : -1; }
  get mouth() { return this.g.level2?.mouth || null; }
  bike(i) { return this.mouth?.rides?.[i] || null; }
  _pl(id) { return id === this.me ? this.g.player : this.g.remotes?.get(id) || null; }
  get level() { return this.g.world?.water?.level ?? 0.34; }

  _roster() {
    const g = this.g;
    const ids = [{ id: this.me, slot: g.player.slot | 0 }];
    for (const r of g.remotes?.values?.() || []) ids.push({ id: r.id, slot: r.slot | 0 });
    ids.sort((a, b) => a.slot - b.slot);
    ids.forEach(({ id, slot }, i) => {
      const P = this.players.get(id);
      if (P) P.i = Math.min(i, 3);
      else this.players.set(id, { id, slot, i: Math.min(i, 3), st: 'ride', cause: null, at: null });
    });
    for (const id of [...this.players.keys()]) if (!ids.some((q) => q.id === id)) this.players.delete(id);
  }

  begin(tries = 0) {
    const g = this.g;
    this.tries = tries;
    this._roster();
    this.mouth?.ensureBikes(this.players.size);
    this.ground = (x, z) => g.world.walkHeight?.(x, z) ?? g.world.terrain.height(x, z);
    this.world = { terrain: { height: this.ground }, col: g.world.col };
    this.mat = createWorldMaterial();
    const paint = this.mouth?.paints?.[(this.mine?.i || 0) % 4] ?? KIND.BONE;
    this.bars = buildBars(paint, g.world.material);
    this.bars.visible = false;
    g.scene?.add(this.bars);
    this.place(tries);
    g.audio?.motoOn?.();
  }

  dispose() {
    this.bars?.removeFromParent();
    this.bars = null;
    this.mat?.dispose?.();
    this.g.audio?.motoOff?.();
    for (const m of this.mouth?.bikes || []) m.visible = true;
  }

  // ---------------- the frame ----------------
  update(dt, raw) {
    const g = this.g;
    this.t += dt;
    this.events = raw?.events || [];
    this._roster();
    if (g.auth) {
      this._judge();
      this.hostHazards(dt);
    } else this.follow(dt);
    this._ride(dt, raw);
    this.drawHazards(dt);
    this._others(dt);
    this.sound();
    this.hud();
    if (g.role === 'host' && g.sync) {
      this.sendT -= dt;
      if (this.sendT <= 0) {
        this.sendT = 1 / RIDE.netHz;
        g.sync.send('ew', this.pack());
      }
    }
    if (g.auth) {
      const live = [...this.players.values()].filter((P) => P.st !== 'dead');
      this.deadT = live.length ? 0 : this.deadT + dt;
      if (this.deadT >= RIDE.deadT) this.restart = true;
      if (live.length && this.finished(live)) this.done = true;
    }
    return null;
  }

  // the host: the bog takes whoever goes into it (the lake is the cliff's business)
  _judge() {
    for (const P of this.players.values()) {
      if (P.st !== 'ride') continue;
      const p = this._pl(P.id);
      if (!p || !Number.isFinite(p.y)) continue;
      if (p.y < this.level - RIDE.bog) this.wet(P, p);
    }
  }

  wet(P) { this.kill(P, 'bog'); }

  kill(P, cause) {
    if (P.st === 'dead') return;
    const p = this._pl(P.id);
    P.st = 'dead';
    P.cause = cause;
    P.at = p ? { x: p.x, z: p.z } : null;
    this._cue('die:' + P.id + ':' + cause);
  }

  _cue(key) {
    this.cues.add(key);
    if (this.cues.size > 40) this.cues.delete(this.cues.values().next().value);
  }

  // your own machine
  _ride(dt, raw) {
    const g = this.g, P = this.mine, p = g.player;
    if (!P) return;
    const look = g.inputMuted ? NO_LOOK : raw?.look || NO_LOOK, L = this.look;
    L.yaw = clamp(L.yaw - look.dx, -2.2, 2.2);
    L.pitch = clamp(L.pitch - look.dy, -1.0, 0.8);
    L.idle = look.dx || look.dy ? 0 : L.idle + dt;
    if (P.st !== 'ride') {
      if (this.bars) this.bars.visible = false;
      this.self(dt, raw);
      return;
    }
    const b = this.bike(P.i);
    if (!b) return;
    if (L.idle > 1.2 && Math.abs(b.speed || 0) > 3) L.yaw = damp(L.yaw, 0, 1.8, dt); // (the road pulls your eyes back)
    if (this.stun > 0) {
      // thrown: the machine on its side, you on the planks — and back on it
      this.stun -= dt;
      settleDown(b, this.world, dt);
      if (this.stun <= 0) this.remount(P.i, b);
    } else {
      const input = g.inputMuted || !g.input ? { move: { x: 0, y: 0 } } : { move: g.input.move || { x: 0, y: 0 }, sprint: !!g.input.sprint };
      const ev = stepBike(b, input, this.world, dt);
      if (ev.landed > 0.35) { g.audio?.bump?.(); g.addTrauma?.(ev.landed * 0.3); }
      if (ev.threw) {
        this.stun = RIDE.stun;
        g.addTrauma?.(0.5);
        g.hud.popup?.(t('escThrown'), 'warn');
        g.audio?.bump?.();
      }
    }
    p.x = b.x; p.z = b.z; p.y = b.y; p.yaw = b.yaw;
    p.vx = b.vx; p.vz = b.vz; p.speed = Math.hypot(b.vx, b.vz);
    p.pitch = L.pitch;
    g.audio?.motoLoop?.(Math.abs(b.speed || 0) / MOTO.max, true);
    this.mouth?.placeRide(P.i, b);
    if (this.mouth?.bikes[P.i]) this.mouth.bikes[P.i].visible = this.stun > 0; // (riding: the bars in front of you are it)
  }

  // up off the planks and back on: the machine stood up where it fell, its nose along the causeway, still
  remount(i, b) {
    const q = cwProject(b.x, b.z), d = cwAt(q.s, {});
    const yaw = q.d < 4 ? Math.atan2(-d.dx, -d.dz) : b.yaw;
    const nb = newBike(i, b.x, b.z, yaw);
    // standing it up on the slope it fell on: both wheels on the ground
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), h = MOTO.half;
    const gF = this.ground(b.x + fx * h, b.z + fz * h), gR = this.ground(b.x - fx * h, b.z - fz * h);
    nb.pitch = Math.atan2(gF - gR, 2 * h);
    nb.y = (gF + gR) / 2;
    Object.assign(b, nb);
    this.stun = 0;
  }

  // not riding: down (the chapter's own death) — subclasses add the water
  self(dt) {
    const g = this.g, p = g.player;
    g.audio?.motoOff?.();
    p.vx = p.vz = 0;
    p.speed = 0;
    p.eyeCur = damp(p.eyeCur ?? 1.6, 0.3, 3, dt);
    g.fx.fade = Math.min(g.fx.fade, 1 - smoothstep(0, 1.6, (this.deadClock = (this.deadClock || 0) + dt)) * 0.8);
  }

  // friends' machines under them
  _others(dt) {
    for (const r of this.g.remotes?.values?.() || []) {
      const P = this.players.get(r.id);
      if (!P) continue;
      const m = this.mouth?.bikes?.[P.i], b = this.bike(P.i);
      if (P.st === 'ride' && b && Number.isFinite(r.x)) {
        const dyaw = angleDiff(b.yaw, r.yaw ?? b.yaw);
        b.x = r.x; b.z = r.z; b.y = r.y; b.yaw = r.yaw ?? b.yaw;
        b.roll = damp(b.roll || 0, clamp(-dyaw * 14, -0.45, 0.45), 6, dt);
        b.pitch = damp(b.pitch || 0, 0, 4, dt);
        b.spin = (b.spin || 0) + ((r.speed || 0) * dt) / MOTO.R;
        this.mouth.placeRide(P.i, b);
        if (m) m.visible = true;
      } else if (P.st === 'dead' && r.rig) poseSprawled(r.rig, 1);
      else if (m && P.st === 'swim') m.visible = false;
    }
  }

  applyCamera(camera) {
    const P = this.mine;
    if (!P || P.st !== 'ride') return false;
    const b = this.bike(P.i);
    if (!b) return false;
    const bx = Math.sin(b.yaw), bz = Math.cos(b.yaw); // behind
    const down = this.stun > 0 ? 0.9 : 0;
    camera.position.set(b.x + bx * MOTO.eye[1], riderEye(b) - down, b.z + bz * MOTO.eye[1]);
    _e.set(this.look.pitch - (b.pitch || 0) * 0.6, b.yaw + this.look.yaw, (b.roll || 0) * 0.65 + (this.stun > 0 ? 0.8 : 0), 'YXZ');
    camera.quaternion.setFromEuler(_e);
    const fov = fovFor(camera.aspect) + clamp(Math.abs(b.speed || 0) * 0.35, 0, 6);
    if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
    if (this.bars && this.stun <= 0) placeBars(this.bars, camera, b);
    else if (this.bars) this.bars.visible = false;
    return true;
  }

  // the small lights: the moon, your headlamp on the planks
  lightSources(out) {
    out.push({ x: MOON.x, y: MOON.y, z: MOON.z, I: MOON.I * 0.8, c: MOON.c, R: MOON.R, prio: 9, near: 2, id: 'moon' });
    const P = this.mine, b = P && P.st === 'ride' ? this.bike(P.i) : null;
    if (b) {
      const fx = -Math.sin(b.yaw), fz = -Math.cos(b.yaw);
      out.push({ x: b.x + fx * 0.55, y: b.y + 0.95, z: b.z + fz * 0.55, I: 1.1, c: [1, 0.95, 0.85], R: 22, prio: 2, near: 0.3, id: 'kugooLamp', dir: [fx, -0.14, fz], cone: 0.82 });
    }
  }

  // ---------------- the wire ----------------
  pack() {
    return { p: [...this.players.values()].map((P) => [P.id, P.st === 'ride' ? 0 : P.st === 'swim' ? 1 : 2, P.cause || '']), t: Math.round(this.t * 100) / 100, c: [...this.cues] };
  }

  applyRide(d) {
    if (!d || !Array.isArray(d.p)) return;
    for (const e of d.p) {
      const P = Array.isArray(e) && this.players.get(e[0]);
      if (!P) continue;
      const st = ['ride', 'swim', 'dead'][e[1] | 0] || 'ride';
      if (st !== P.st) { P.st = st; P.cause = e[2] || null; }
    }
    if (Number.isFinite(+d.t) && Math.abs(+d.t - this.t) > 0.25) this.t = +d.t; // (the arms keep the host's time)
    for (const c of d.c || []) this.cues.add(c);
    this.applyMore?.(d);
  }

  follow() {}

  // the deaths, heard and shown once (here and on every guest)
  _deaths() {
    const g = this.g;
    for (const c of this.cues) {
      if (!c.startsWith('die:') || this.heard.has(c)) continue;
      this.heard.add(c);
      const [, id, cause] = c.split(':');
      const p = this._pl(id);
      if (cause === 'bog' && p) { g.audio?.splash?.(1); g.audio?.bogGulp?.(p.x, this.level, p.z); }
      if (id !== this.me) continue;
      g.addTrauma?.(1);
      g.fx.white = Math.max(g.fx.white, 0.3);
      const key = cause === 'arm' ? 'escArm' : cause === 'root' ? 'escRoot' : cause === 'top' ? 'cliffTop' : 'escBog';
      g.hud.setIntro(t(key), t(this.players.size > 1 ? 'villageWait' : 'l2Again'));
    }
  }
}

// ---------------------------------------------------------------- 6: the causeway
export class EscapePlay extends RidePlay {
  constructor(game) {
    super(game);
    this.rootAge = new Map();
  }

  place() {
    const g = this.g;
    this.mouth?.resetRides();
    for (const P of this.players.values()) { P.st = 'ride'; P.cause = null; }
    const b = this.bike(this.mine?.i ?? 0);
    if (b) { g.player.x = b.x; g.player.z = b.z; g.player.y = b.y; g.player.yaw = b.yaw; }
    this.arms = ARMS.map(() => { const arm = new RoadArm(g.scene, this.mat); arm.mesh.visible = false; return { arm, pose: null }; });
    this.slots = ROOTS.map(() => {
      const arm = new RoadArm(g.scene, this.mat);
      arm.mesh.visible = false;
      const mb = new MeshBuilder(512);
      mb.place(0, 0, 0, 0, 0, 0, 1, 0.42, 1);
      mb.rock(0.9, () => 0.5, KIND.WOOD, 0.3, 0.6); // the planks heaving
      const bump = new THREE.Mesh(mb.toGeometry(), this.mat);
      bump.frustumCulled = false;
      bump.visible = false;
      g.scene?.add(bump);
      return { arm, bump, pose: null };
    });
  }

  dispose() {
    for (const a of this.arms || []) a.arm.dispose();
    for (const s of this.slots || []) { s.arm.dispose(); s.bump.removeFromParent(); s.bump.geometry.dispose(); }
    super.dispose();
  }

  hostHazards(dt) {
    const riders = [...this.players.values()].filter((P) => P.st === 'ride');
    const t0 = this.t - dt, t1 = this.t;
    ARMS.forEach((a, k) => {
      const { T } = armTB(a);
      const r0 = (((t0 + a.off) % ARM_PERIOD) + ARM_PERIOD) % ARM_PERIOD, r1 = (((t1 + a.off) % ARM_PERIOD) + ARM_PERIOD) % ARM_PERIOD;
      if (r1 >= ARM_LAND && r0 < ARM_LAND && r1 > r0) {
        this._cue('slam:' + k + ':' + Math.floor((t1 + a.off) / ARM_PERIOD));
        for (const P of riders) { const p = this._pl(P.id); if (p && Math.hypot(p.x - T.x, p.z - T.z) < ARM_HIT) this.kill(P, 'arm'); }
      } else if (r1 >= ARM_LAND && r1 < ARM_UP) {
        for (const P of riders) { const p = this._pl(P.id); if (p && P.st === 'ride' && Math.hypot(p.x - T.x, p.z - T.z) < ARM_LIE) this.kill(P, 'arm'); }
      }
    });
    ROOTS.forEach((R, k) => {
      const at = rootAt(R);
      let age = this.rootAge.get(k);
      if (age === undefined) {
        for (const P of riders) {
          const p = this._pl(P.id);
          if (!p) continue;
          const q = cwProject(p.x, p.z), lead = Math.max(5, Math.abs(p.speed || 0) * ROOT_LEAD + 0.3);
          if (q.d < 3 && R.s - q.s > 0.5 && R.s - q.s < lead) { this.rootAge.set(k, 0); this._cue('swell:' + k); break; }
        }
        return;
      }
      const was = age;
      age += dt;
      this.rootAge.set(k, age);
      if (was < ROOT.swell && age >= ROOT.swell) {
        this._cue('strike:' + k);
        for (const P of riders) { const p = this._pl(P.id); if (p && P.st === 'ride' && Math.hypot(p.x - at.x, p.z - at.z) < ROOT_HIT) this.kill(P, 'root'); }
      } else if (age > ROOT.swell && age < ROOT.swell + ROOT.up + ROOT.stand) {
        for (const P of riders) { const p = this._pl(P.id); if (p && P.st === 'ride' && Math.hypot(p.x - at.x, p.z - at.z) < ROOT_POST) this.kill(P, 'root'); }
      }
    });
  }

  follow(dt) {
    for (const [k, a] of this.rootAge) this.rootAge.set(k, a + dt);
  }

  pack() {
    const d = super.pack();
    d.r = [...this.rootAge].map(([k, a]) => [k, Math.round(a * 100) / 100]);
    return d;
  }

  applyEscape(d) { this.applyRide(d); }
  applyMore(d) {
    if (Array.isArray(d.r)) for (const e of d.r) if (Array.isArray(e) && Number.isFinite(+e[1])) this.rootAge.set(e[0] | 0, +e[1]);
  }

  // everyone still riding is at the far end of the causeway (or past it, on the knoll)
  finished(live) {
    return live.every((P) => {
      const p = this._pl(P.id);
      if (!p || P.st !== 'ride') return false;
      const q = cwProject(p.x, p.z);
      return q.s >= CW.len - 3;
    });
  }

  drawHazards() {
    const g = this.g, ground = this.ground;
    let danger = 0;
    const me = g.player;
    ARMS.forEach((a, k) => {
      const A = this.arms[k], u = armU(a, this.t);
      const vis = u >= 0 && !(chasePhase(u).ph === 'sink' && chasePhase(u).k > 0.95);
      A.arm.mesh.visible = vis;
      if (!vis) return;
      const { T, B } = armTB(a);
      A.arm.bend((A.pose = chasePose(T, B, u, this.t, ground, A.pose)));
      const d = Math.hypot(me.x - T.x, me.z - T.z);
      if (u < ARM_UP) danger = Math.max(danger, clamp(1 - (d - 4) / 26, 0, 1));
    });
    ROOTS.forEach((R, k) => {
      const s = this.slots[k], age = this.rootAge.get(k);
      if (age === undefined || age >= rootLife) { s.bump.visible = false; s.arm.mesh.visible = false; return; }
      const at = rootAt(R), gy = ground(at.x, at.z);
      const sw = age < ROOT.swell ? smoothstep(0, ROOT.swell, age) : 1 - smoothstep(ROOT.swell + ROOT.up + ROOT.stand, rootLife, age);
      s.bump.visible = true;
      s.bump.position.set(at.x, gy - 0.2 + 0.25 * sw, at.z);
      s.bump.scale.set(0.4 + 0.6 * sw, 0.2 + 0.9 * sw, 0.4 + 0.6 * sw);
      s.arm.mesh.visible = age >= ROOT.swell;
      if (s.arm.mesh.visible) s.arm.bend((s.pose = rootPose({ x: at.x, z: at.z, i: k }, age, this.t, ground, s.pose)));
      if (age < ROOT.swell + 0.3) danger = Math.max(danger, clamp(1 - (Math.hypot(me.x - at.x, me.z - at.z) - 1) / 10, 0, 1));
    });
    this.danger = danger;
  }

  sound() {
    const g = this.g, au = g.audio;
    // an arm starting up out of the bog: heard on every machine from the clock
    ARMS.forEach((a, k) => {
      const u = armU(a, this.t), key = 'rise:' + k + ':' + Math.floor((this.t + a.off) / ARM_PERIOD);
      if (u >= 0 && u < CHASE.rise && !this.heard.has(key)) {
        this.heard.add(key);
        const { B } = armTB(a);
        au?.armGroan?.(B.x, this.level + 3, B.z, 0.8);
        const q = cwProject(g.player.x, g.player.z);
        if (this.mine?.st === 'ride' && a.s - q.s > 0 && a.s - q.s < 34) g.hud.flashAlert?.(t('escArmWarn'), 'warn', 1.4);
      }
    });
    for (const c of this.cues) {
      if (this.heard.has(c)) continue;
      const [kind, arg] = c.split(':');
      if (kind === 'slam') {
        this.heard.add(c);
        const { T } = armTB(ARMS[+arg]);
        au?.armSlam?.(T.x, this.level + 0.6, T.z, 1);
        g.pulses?.emit(T.x, this.level + 0.6, T.z, g.time, { radius: 40, strength: 1.1, speed: 32, decay: 0.6, color: [1, 0.5, 0.4], kind: 'shard' });
        if (Math.hypot(g.player.x - T.x, g.player.z - T.z) < 20) g.addTrauma?.(0.5);
      } else if (kind === 'swell' || kind === 'strike') {
        this.heard.add(c);
        const at = rootAt(ROOTS[+arg]), y = this.ground(at.x, at.z);
        if (kind === 'swell') {
          au?.rootSwell?.(at.x, y, at.z);
          g.pulses?.emit(at.x, y + 0.3, at.z, g.time, { radius: 12, strength: 1.1, speed: 18, decay: 0.9, color: [1, 0.4, 0.3], kind: 'shard' });
          if (Math.hypot(g.player.x - at.x, g.player.z - at.z) < 16) g.hud.flashAlert?.(t('escRootWarn'), 'warn', 1.4);
        } else au?.rootStrike?.(at.x, y, at.z);
      }
    }
    this._deaths();
  }

  hud() {
    const g = this.g, P = this.mine;
    if (!P || P.st !== 'ride' || this.t < 5.2) return;
    g.hud.setHint(t('escHint'));
  }

  lightSources(out) {
    super.lightSources(out);
    ARMS.forEach((a, k) => {
      if (!this.arms?.[k]?.arm.mesh.visible) return;
      const { T, B } = armTB(a), mx = (T.x + B.x) / 2, mz = (T.z + B.z) / 2;
      out.push({ x: mx, y: this.level + 8, z: mz, I: 1.2, c: [0.9, 0.16, 0.1], R: 24, prio: 1, near: 3, id: 'arm' + k });
    });
    ROOTS.forEach((R, k) => {
      const age = this.rootAge.get(k);
      if (age === undefined) return;
      const kk = age < ROOT.swell ? smoothstep(0, ROOT.swell, age) : 1 - smoothstep(ROOT.swell, ROOT.swell + 1.2, age);
      if (kk <= 0.02) return;
      const at = rootAt(R);
      out.push({ x: at.x, y: this.ground(at.x, at.z) + 0.5, z: at.z, I: 1.1 * kk, c: [1, 0.22, 0.12], R: 7, prio: 1, near: 0.4, id: 'root' + k });
    });
  }
}

// ---------------------------------------------------------------- 7: the cliff
// where the riders stand at the end of the causeway, facing the knoll (a retry; a jump straight to chapter 7)
export function endSpots(n) {
  const p = cwAt(CW.len - 13, {}), yaw = Math.atan2(-(CLIFF.x - p.x), -(CLIFF.z - p.z));
  const out = [];
  for (let i = 0; i < n; i++) {
    const lat = (i - (n - 1) / 2) * 1.3;
    out.push({ x: p.x + p.dz * lat, z: p.z - p.dx * lat, yaw });
  }
  return out;
}

export function inLake(x, z) {
  return Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 1;
}

export class CliffPlay extends RidePlay {
  constructor(game) {
    super(game);
    this.top = { on: false, t: 0, hit: false };
    this.film = null;
    this.entry = null;
  }

  place(tries) {
    const g = this.g;
    // on from the causeway where the riders are; a retry (or a jump here) at its end
    const near = [...this.players.values()].every((P) => { const b = this.bike(P.i); return b && cwProject(b.x, b.z).s > CW.len - 25; });
    if (tries > 0 || !near) {
      this.mouth?.resetRides(endSpots(this.mouth?.bikes?.length || 1));
      for (const P of this.players.values()) { P.st = 'ride'; P.cause = null; }
    }
    const b = this.bike(this.mine?.i ?? 0);
    if (b) { g.player.x = b.x; g.player.z = b.z; g.player.y = b.y; g.player.yaw = b.yaw; }
    this.fisher = new Fisherman(g.scene);
    this.big = new RoadArm(g.scene, this.mat);
    this.big.mesh.visible = false;
  }

  dispose() {
    this.fisher?.dispose();
    this.big?.dispose();
    super.dispose();
  }

  get filming() { return !!this.film && this.film.state === 'run'; }

  // into the water: the lake is the way out; anywhere else it is the bog
  wet(P, p) {
    if (inLake(p.x, p.z)) {
      P.st = 'swim';
      P.at = { x: p.x, z: p.z };
      this._cue('splash:' + P.id);
    } else this.kill(P, 'bog');
  }

  hostHazards(dt) {
    const T = this.top;
    const riders = [...this.players.values()].filter((P) => P.st === 'ride');
    if (!T.on) {
      for (const P of riders) {
        const p = this._pl(P.id);
        if (p && Math.hypot(p.x - CLIFF.x, p.z - CLIFF.z) < TOP.r && p.y > TOP.high) { T.on = true; T.t = 0; this._cue('rise'); break; }
      }
    } else {
      const was = T.t;
      T.t += dt;
      if (was < TOP.warn && T.t >= TOP.warn) {
        this._cue('crash');
        for (const P of riders) {
          const p = this._pl(P.id);
          if (p && Math.hypot(p.x - CLIFF.x, p.z - CLIFF.z) < TOP.hit && p.y > TOP.high) this.kill(P, 'top');
        }
      }
    }
    // everyone alive in the water: the film
    const live = [...this.players.values()].filter((P) => P.st !== 'dead');
    if (!this.film && live.length && live.every((P) => P.st === 'swim')) this._film();
    if (this.film && (this.events || []).some((e) => e === 'confirm' || e === 'skip')) this.film.t = Math.max(this.film.t, PT.end - 2.2); // (Enter: to its last fade)
    if (this.film) this.film.update(dt);
  }

  _film() {
    const P = this.mine;
    this.entry = P?.at || this.entry || { x: CLIFF.x + 14, z: CLIFF.z - 14 };
    this.film = new PierFilm(this.g, this.entry, this.fisher);
    this._cue('film');
    this.g.hud.setSkip?.(true, 'intro');
    this.g.hud.setIntro?.(null); // (the chapter's title, if it is still up: the picture is the film's now)
    this.g.hud.setHint?.(null);
  }

  follow(dt) {
    if (this.top.on) this.top.t += dt;
    if (this.film) this.film.update(dt);
  }

  pack() {
    const d = super.pack();
    d.top = this.top.on ? Math.round(this.top.t * 100) / 100 : -1;
    d.f = this.film ? Math.round(this.film.t * 100) / 100 : -1;
    return d;
  }

  applyCliff(d) { this.applyRide(d); }
  applyMore(d) {
    if (Number.isFinite(+d.top) && +d.top >= 0) { this.top.on = true; if (Math.abs(+d.top - this.top.t) > 0.3) this.top.t = +d.top; }
    if (Number.isFinite(+d.f) && +d.f >= 0 && !this.film) {
      const P = this.mine;
      this.entry = P?.at || { x: this.g.player.x, z: this.g.player.z };
      this.film = new PierFilm(this.g, this.entry, this.fisher);
      this.film.t = +d.f;
      this.g.hud.setIntro?.(null);
    }
  }

  finished() {
    return !!this.film && this.film.done;
  }

  // in the water waiting, or down
  self(dt, raw) {
    const g = this.g, P = this.mine, p = g.player;
    if (P.st !== 'swim') return super.self(dt);
    // treading water where you went in
    g.audio?.motoOff?.();
    const at = P.at || { x: p.x, z: p.z };
    p.x = at.x; p.z = at.z;
    p.y = this.level - 1.35 + Math.sin(this.t * 1.7) * 0.05;
    p.vx = p.vz = 0;
    p.speed = 0;
    const look = g.inputMuted ? NO_LOOK : raw?.look || NO_LOOK;
    p.yaw -= look.dx;
    p.pitch = clamp(p.pitch - look.dy, -0.8, 0.8);
    if (this.mine.i !== undefined && this.mouth?.bikes?.[this.mine.i]) this.mouth.bikes[this.mine.i].visible = false;
  }

  drawHazards() {
    const g = this.g;
    this.fisher?.pose(this.t);
    const T = this.top;
    this.big.mesh.visible = T.on && !(T.t > TOP.warn + 2.5);
    this.danger = 0;
    if (this.big.mesh.visible) {
      // the biggest of them, out of the bog behind the knoll and over its top: it looms, then it comes down
      const back = cwAt(CW.len - 2, {});
      const Bp = { x: back.x - back.dz * 14, z: back.z + back.dx * 14 };
      const u = T.t < TOP.warn ? CHASE.rise * (T.t / TOP.warn) : CHASE.rise + (T.t - TOP.warn);
      const ground = (x, z) => this.ground(x, z) + (Math.hypot(x - CLIFF.x, z - CLIFF.z) < 3 ? 4 : 0);
      this.big.bend((this.bigPose = chasePose({ x: CLIFF.x, z: CLIFF.z }, Bp, Math.min(u, CHASE.cycle - 0.01), this.t, ground, this.bigPose)));
      if (T.t < TOP.warn && this.mine?.st === 'ride') this.danger = clamp(T.t / TOP.warn, 0.3, 1);
    }
    if (this.film) {
      // the film's swimmers: your friends beside you
      const rigs = [];
      for (const r of g.remotes?.values?.() || []) { const P = this.players.get(r.id); if (P?.st === 'swim' && r.rig) rigs.push(r.rig); else if (r.rig) r.rig.root.visible = false; }
      this.film.poseSwimmers(rigs);
    }
  }

  sound() {
    const g = this.g, au = g.audio;
    for (const c of this.cues) {
      if (this.heard.has(c)) continue;
      const [kind, id] = c.split(':');
      if (kind === 'rise') {
        this.heard.add(c);
        au?.armGroan?.(CLIFF.x, this.level + 6, CLIFF.z, 1);
        g.hud.flashAlert?.(t('cliffRise'), 'warn', 2.2);
      } else if (kind === 'crash') {
        this.heard.add(c);
        au?.armSlam?.(CLIFF.x, 9.5, CLIFF.z, 1);
        g.addTrauma?.(Math.hypot(g.player.x - CLIFF.x, g.player.z - CLIFF.z) < 40 ? 0.9 : 0.3);
        g.pulses?.emit(CLIFF.x, 9.8, CLIFF.z, g.time, { radius: 70, strength: 1.2, speed: 36, decay: 0.5, color: [1, 0.5, 0.4], kind: 'shard' });
      } else if (kind === 'splash') {
        this.heard.add(c);
        const p = this._pl(id);
        if (id === this.me) { au?.splash?.(1); g.addTrauma?.(0.6); g.hud.setHint(t(this.players.size > 1 ? 'cliffSwim' : 'cliffDown')); }
        else if (p) au?.splash?.(0.5);
      } else if (kind === 'film') this.heard.add(c);
    }
    this._deaths();
  }

  hud() {
    const g = this.g, P = this.mine;
    if (!P || P.st !== 'ride' || this.t < 5.2 || this.filming) return;
    g.hud.setHint(t('cliffHint'));
  }

  applyCamera(camera) {
    if (this.filming) {
      if (this.bars) this.bars.visible = false;
      const ok = this.film.applyCamera(camera);
      const e = this.g._ears;
      if (ok && e) { e.x = camera.position.x; e.y = camera.position.y; e.z = camera.position.z; }
      return ok;
    }
    return super.applyCamera(camera);
  }

  lightSources(out) {
    if (this.filming) { this.film.lightSources(out); return; }
    super.lightSources(out);
    this.fisher?.lights(this.t, out, 0.85);
    if (this.big?.mesh.visible) out.push({ x: CLIFF.x, y: 16, z: CLIFF.z, I: 1.4, c: [0.9, 0.16, 0.1], R: 30, prio: 1, near: 3, id: 'bigArm' });
  }
}

