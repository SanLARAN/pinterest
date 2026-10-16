// the smoke-test bot, shared with the debug harness
import { dist2 } from '../src/core/util.js';
export function nearest(p, list) {
  let best = null, bd = 1e9;
  for (const o of list) { const d = dist2(p.x, p.z, o.x, o.z); if (d < bd) { bd = d; best = o; } }
  return best;
}
export class Bot {
  /** A competent, deterministic player stand-in: it knows the map, pings quietly,
   *  loots bodies for fuses, repairs, and breaks contact by going silent. */
  constructor(game, seed = 1) {
    this.g = game;
    let a = seed >>> 0;
    this.rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    this.pingT = 1.5;
    this.target = null;
    this.mode = 'explore';
    this.stats = { pings: 0, deaths: 0 };
  }
  step(dt) {
    const g = this.g, p = g.local, w = g.world;
    if (!p || !p.alive) return;

    // ---- threat scan
    let threat = null, td = 1e9;
    for (const m of g.monsters) {
      if (!m.alive || m.state === 'spawn' || m.state === 'flee') continue;
      const d = dist2(p.x, p.z, m.x, m.z);
      if (d < td) { td = d; threat = m; }
    }
    const hunting = !!threat && (threat.state === 'hunt' || threat.state === 'lunge');
    const reach = threat ? (threat.type === 'tall' ? 3.0 : threat.type === 'weeper' ? 1.8 : 2.05) : 2;
    const panic = hunting && td < (threat.type === 'tall' ? 26 : 18);
    // hunted but not yet cornered: slip away silently instead of sprinting (sprinting is loud)
    const slip = hunting && !panic && td < 52;

    // ---- goal
    // away-from-threat headings are committed, never recomputed per frame
    this.awayT = (this.awayT || 0) - dt;
    if (threat && (this.awayT <= 0 || this.awayThreat !== threat)) {
      this.awayT = 1.1;
      this.awayThreat = threat;
      this.awayYaw = Math.atan2(p.x - threat.x, p.z - threat.z);   // heading straight away from it
    }
    if (slip) {
      this.mode = 'slip';
      this.target = { x: p.x - Math.sin(this.awayYaw) * 45, z: p.z - Math.cos(this.awayYaw) * 45 };
    } else if (!panic) {
      const unfixed = w.gens.filter((x) => !x.fixed);
      const corpses = w.corpses.filter((c) => !c.searched);
      if (p.fuses > 0 && unfixed.length) { this.mode = 'repair'; this.target = nearest(p, unfixed); }
      else if (corpses.length) { this.mode = 'loot'; this.target = nearest(p, corpses); }
      else if (unfixed.length) { this.mode = 'explore-gen'; this.target = nearest(p, unfixed); }
      else this.target = null;
    } else {
      this.mode = 'flee';
      const lit = w.gens.filter((x) => x.fixed && dist2(p.x, p.z, x.x, x.z) < 130);
      this.silentT = 0;
      if (lit.length) this.target = nearest(p, lit);
      else this.target = { x: p.x - Math.sin(this.awayYaw) * 70, z: p.z - Math.cos(this.awayYaw) * 70 };
    }
    this.silentT = 0;

    // ---- ping like a player would: quiet clicks, occasional loud one to map the area
    this.pingT -= dt;
    if (this.pingT <= 0 && g.phase === 'night' && !panic && !slip) {
      const loud = this.rnd() < 0.05;
      this.pingT = 2.8 + this.rnd() * 2.2;
      g.ping(p, loud ? 0.75 : 0.08 + this.rnd() * 0.2);
      this.stats.pings++;
    } else if (panic || slip) this.pingT = Math.max(this.pingT, 1.5);

    // ---- global unstick: measures the body, not the target distance
    this.moveT = (this.moveT || 0) + dt;
    if (this.lastPos === undefined) this.lastPos = { x: p.x, z: p.z };
    if (this.moveT > 3) {
      const moved = dist2(p.x, p.z, this.lastPos.x, this.lastPos.z);
      if (moved < 3.2) {
        const w = g.world;
        const base = this.target ? Math.atan2(-(this.target.x - p.x), -(this.target.z - p.z)) : p.yaw;
        const clearPath = (a, len) => {
          for (let d = 1.6; d <= len; d += 1.6) {
            if (w.collide(p.x - Math.sin(a) * d, p.z - Math.cos(a) * d, 0.55)) return false;
          }
          return true;
        };
        // spiral out from the goal heading until a walkable lane is found
        let best = null;
        for (let i = 0; i < 20 && best === null; i++) {
          const side = i % 2 ? 1 : -1;
          const a = base + side * (0.35 + Math.floor(i / 2) * 0.42);
          const len = clearPath(a, 11) ? 11 : clearPath(a, 6) ? 6 : 0;
          if (len) best = { a, len };
        }
        if (best) {
          this.avoidYaw = best.a;
          this.avoidT = best.len / 3.2 + 0.5;
          this.escapeN = (this.escapeN || 0) + 1;
        } else { this.avoidYaw = base + Math.PI; this.avoidT = 1.6; }
      }
      this.moveT = 0;
      this.lastPos = { x: p.x, z: p.z };
    }

    // ---- steer with obstacle hugging
    if (this.target) {
      const dx = this.target.x - p.x, dz = this.target.z - p.z;
      const d = Math.hypot(dx, dz) || 1;
      // repulsion from anything awake inside 55m — the sonar shows it, so use it
      let ux = dx / d, uz = dz / d;
      for (const m of g.monsters) {
        if (!m.alive || m.state === 'flee' || m.state === 'spawn') continue;
        const md = dist2(p.x, p.z, m.x, m.z);
        const R = m.type === 'tall' ? 70 : 55;
        if (md > 1 && md < R) {
          const k = (1 - md / R) * (m.state === 'hunt' ? 3.4 : 2.1);
          ux += ((p.x - m.x) / md) * k;
          uz += ((p.z - m.z) / md) * k;
        }
      }
      const um = Math.hypot(ux, uz) || 1;
      let yaw = Math.atan2(-ux / um, -uz / um);
      this.avoidT = (this.avoidT || 0) - dt;
      this.progT = (this.progT || 0) + dt;
      if (this.checkD === undefined) this.checkD = d;
      if (this.progT > 0.9) {
        if (this.checkD - d < 1.2 && d > 3.5) {
          this.stuckN = (this.stuckN || 0) + 1;
          if (this.stuckN > 7) { this.stuckN = 0; this.hug = null; this.avoidT = 0; }
          if (this.hug === undefined || this.hug === null) this.hug = this.rnd() < 0.5 ? -1 : 1;
          if (this.avoidT <= 0) {
            this.avoidYaw = yaw + this.hug * (1.15 + Math.min(this.stuckN, 5) * 0.25);
            this.avoidT = 1.2 + this.stuckN * 0.22;
          }
        } else this.stuckN = 0;
        this.progT = 0;
        this.checkD = d;
      }
      if (this.avoidT > 0) yaw = this.avoidYaw;
      this.lastD = d;
      p.yaw = yaw; p.tYaw = yaw;
      p.inputs.ax = 0; p.inputs.az = 1;
      // doctrine: sprint only to buy metres, then go silent — blind hunters forget fast
      let crouching = slip || (!panic && td < 42);
      if (panic) crouching = td > 15;                 // off your back? stop being loud
      p.inputs.crouch = crouching;
      p.inputs.breath = !panic && !slip && td < 9;
      const clear = !threat || td > 70;
      if (panic) this.wantSprint = td <= 15 ? true : (p.stamina > 0.8 ? true : this.wantSprint && p.stamina > 0.15);
      else this.wantSprint = p.stamina > 0.85 ? true : this.wantSprint && p.stamina > 0.3;
      p.inputs.sprint = !crouching && this.wantSprint && (panic || (clear && d > 45));
      this.silentT = 0;
    } else { p.inputs.az = 0; p.inputs.ax = 0; }

    // ---- use
    const it = g.interact;
    g.setUse(!!it && !panic && !slip && (it.kind !== 'gen' || p.fuses > 0));
  }
}
