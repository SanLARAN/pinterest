// Dread: the things that make the dark feel inhabited.
//  - real monsters' eyes glint when they face you (more often the more interested they are)
//  - hallucinations: a faint silhouette at the edge of vision, eyes that belong to nothing
//  - perception flicker when something is hunting you
// Pure atmosphere — none of this changes the rules, but the player can't know that.
import * as THREE from 'three';
import { settings } from '../core/storage.js';
import { angleDiff } from '../core/rng.js';

const _v = new THREE.Vector3();
const EYE_RED = [1.0, 0.13, 0.08];
const EYE_PALE = [1.0, 0.82, 0.7];

export class Dread {
  constructor(game, eyes) {
    this.g = game;
    this.eyes = eyes;
    this.reset();
  }

  reset() {
    const r = this.g.rng;
    this.hallT = r ? r.float(55, 80) : 60;
    this.flickT = 1;
    this.flickLeft = 0;
    this.flickAmt = 0;
    this.introGlint = false;
    this.eyes.clear();
  }

  get flicker() {
    return this.flickLeft > 0 ? this.flickAmt : 0;
  }

  // where a monster's eyes are right now
  eyePos(m) {
    const n = m.rig.nodes.head;
    m.rig.root.updateMatrixWorld(true);
    n.getWorldPosition(_v);
    const yaw = m.yaw + (m.headYaw || 0);
    const fwd = m.type === 'crawler' ? 0.16 : m.type === 'howler' ? 0.24 : 0.09;
    const up = m.type === 'crawler' ? 0.07 : m.type === 'howler' ? 0.08 : 0.06;
    return { x: _v.x + Math.sin(yaw) * fwd, y: _v.y + up, z: _v.z + Math.cos(yaw) * fwd, yaw };
  }

  glintMonster(m, intensity, life, blink = false) {
    const e = this.eyePos(m);
    this.eyes.add(e.x, e.y, e.z, e.yaw, {
      time: this.g.time, life, intensity, blink,
      spacing: m.type === 'crawler' ? 0.2 : m.type === 'howler' ? 0.18 : 0.26,
      size: m.type === 'crawler' || m.type === 'howler' ? 0.13 : 0.16,
      color: EYE_RED,
    });
  }

  update(dt) {
    const g = this.g;
    const p = g.player;
    const rng = g.rng;
    const reduced = settings.scares === 'reduced';
    let hunted = false;

    // the very first thing you ever see: two points in the dark, looking at you
    if (!this.introGlint && g.firstPingT < 0 && g.intro.t > 4.6) {
      const m = g.monsters.find((q) => q.intro);
      if (m) this.glintMonster(m, 0.9, 0.9, true);
      this.introGlint = true;
    }

    // ---- real eyes ----
    for (const m of g.monsters) {
      if (m.state === 'hunt') hunted = true;
      if (m.scripted === 'freeze' || m.state === 'flee' || m.noEyes) continue; // the Watcher has no face to glint
      const d = m.playerDist;
      if (d > 42 || d < 2.5) continue;
      if (m.glintT === undefined) m.glintT = rng.float(2, 6);
      m.glintT -= dt;
      if (m.glintT > 0) continue;
      const st = m.state;
      m.glintT = st === 'hunt' ? rng.float(1.1, 2.2) : st === 'investigate' || st === 'search' ? rng.float(2.6, 5) : rng.float(7, 15);
      const toP = Math.atan2(p.x - m.x, p.z - m.z);
      if (Math.abs(angleDiff(m.yaw + (m.headYaw || 0), toP)) > 1.25) continue; // not looking at you
      if (g.time - (m.lastGhostT ?? -9) < 1.2) continue; // you can already see it
      const near = 1 - d / 46;
      const I = (st === 'hunt' ? 1.1 : st === 'wander' || st === 'idle' ? 0.5 : 0.8) * (0.45 + 0.55 * near);
      this.glintMonster(m, I, st === 'hunt' ? 0.3 : 0.45 + rng.float(0, 0.3), st !== 'hunt' && rng.chance(0.4));
    }

    // ---- sniffing: something searching close by smells the air for you ----
    for (const m of g.monsters) {
      if ((m.state !== 'search' && m.state !== 'investigate') || m.playerDist > 8) continue;
      m.sniffT = (m.sniffT ?? rng.float(0.6, 2)) - dt;
      if (m.sniffT > 0) continue;
      m.sniffT = rng.float(3.5, 6.5);
      g.audio.sniff(m.x, m.y + m.headY, m.z, 0.42 + 0.25 * (1 - m.playerDist / 8));
    }

    // ---- hallucinations (only once you know what is out there, never mid-chase) ----
    const dark = g.time - (g.lastPulseT ?? -9) > 2.4;
    if (g.firstPingT >= 0 && g.time > 45 && !hunted && g.state === 'play') {
      this.hallT -= dt;
      if (this.hallT <= 0 && dark) {
        this.hallT = rng.float(24, 48) * (g.time > 900 ? 0.75 : 1);
        if (rng.chance(0.5)) this.peripheralShade();
        else this.fakeEyes(g.time > 600 && rng.chance(0.3) ? rng.int(3, 5) : 1);
      }
    }

    // ---- perception flicker ----
    const danger = g.fx.danger;
    if (this.flickLeft > 0) this.flickLeft -= dt;
    if (!reduced && danger > 0.5) {
      this.flickT -= dt;
      if (this.flickT <= 0) {
        this.flickAmt = rng.float(0.35, 0.85);
        this.flickLeft = rng.float(0.04, 0.12);
        this.flickT = rng.float(0.35, 2.2) / danger;
      }
    }
  }

  // something stands at the edge of your vision. it is gone before you turn.
  peripheralShade() {
    const g = this.g;
    const p = g.player;
    const rng = g.rng;
    for (let k = 0; k < 8; k++) {
      const side = rng.sign();
      const a = p.yaw + side * rng.float(0.62, 0.86);
      const d = rng.float(9, 17);
      const x = p.x - Math.sin(a) * d, z = p.z - Math.cos(a) * d;
      if (!g.world.col.free(x, z, 0.6)) continue;
      const y = g.world.terrain.height(x, z);
      g.shade.place(x, y, z, Math.atan2(p.x - x, p.z - z));
      g.ghosts.spawn(g.shade.rig, g.time, { strength: rng.float(0.26, 0.4), life: 1.3, decay: 1.4, color: 0xb81c14, jitter: 1.6, body: 0.5 });
      // the forest goes quiet around it; sometimes you hear it breathe out
      g.audio.duck(0.12, 0.35, 1.6, 2.4);
      if (rng.chance(0.4)) g.audio.exhale(x, y + 1.8, z, 0.22);
      if (rng.chance(0.5)) {
        const e = g.shade.rig.nodes.head;
        g.shade.rig.root.updateMatrixWorld(true);
        e.getWorldPosition(_v);
        this.eyes.add(_v.x, _v.y + 0.02, _v.z, Math.atan2(p.x - x, p.z - z), { time: g.time, life: 1.0, intensity: 0.6, spacing: 0.16, size: 0.12, color: EYE_PALE });
      }
      return;
    }
  }

  // eyes in the trees, watching. sometimes many.
  fakeEyes(count) {
    const g = this.g;
    const p = g.player;
    const rng = g.rng;
    if (count > 1) g.audio.duck(0.1, 0.5, 2.2, 2.6); // many of them: everything else goes silent
    for (let i = 0; i < count; i++) {
      const a = p.yaw + rng.float(-0.75, 0.75);
      const d = rng.float(13, 32);
      const x = p.x - Math.sin(a) * d, z = p.z - Math.cos(a) * d;
      const y = g.world.terrain.height(x, z) + rng.float(1.3, 2.5);
      this.eyes.add(x, y, z, Math.atan2(p.x - x, p.z - z), {
        time: g.time + i * rng.float(0.1, 0.5), life: rng.float(0.6, 1.3), intensity: rng.float(0.45, 0.8),
        blink: rng.chance(0.5), spacing: rng.float(0.2, 0.3), size: 0.16, color: rng.chance(0.75) ? EYE_RED : EYE_PALE,
      });
    }
  }
}
