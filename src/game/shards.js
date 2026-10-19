// Amber echo shards: collectibles that ring when a wave touches them and glow for a while.
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { createShardMaterial } from '../render/sonar.js';
import { CFG } from '../core/config.js';

export class Shards {
  constructor(scene) {
    const b = new MeshBuilder(256);
    b.identity();
    b.octa(0.2, 0.36, KIND.SHARD);
    b.place(0, 0, 0, 0, 0.6, 0);
    b.octa(0.12, 0.2, KIND.SHARD);
    b.identity();
    b.limb([0, 0.45, 0], [0, 5.5, 0], 0.03, 0.01, 12, 3);
    const geo = b.toGeometry();
    this.max = CFG.SHARDS;
    this.glow = new Float32Array(this.max);
    this.phase = new Float32Array(this.max);
    for (let i = 0; i < this.max; i++) this.phase[i] = Math.random() * 6.28;
    this.glowAttr = new THREE.InstancedBufferAttribute(this.glow, 1);
    this.glowAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aGlow', this.glowAttr);
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(this.phase, 1));
    this.mesh = new THREE.InstancedMesh(geo, createShardMaterial(), this.max);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    scene.add(this.mesh);
    this.items = [];
    this._m = new THREE.Matrix4();
  }

  reset(world, rng) {
    this.items = [];
    const pts = [];
    let guard = 0;
    while (pts.length < this.max && guard++ < 4000) {
      const p = world.randomOpenPoint(rng, 24);
      if (pts.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 16)) continue;
      pts.push(p);
    }
    // a couple of early shards close to the camp so the first minute has a goal
    pts[0] = this._near(world, rng, 16, 24) || pts[0];
    pts[1] = this._near(world, rng, 26, 38) || pts[1];
    for (let i = 0; i < this.max; i++) {
      const p = pts[i % pts.length];
      const y = world.terrain.height(p.x, p.z) + 1.05;
      this.items.push({ x: p.x, y, z: p.z, alive: true, chimeT: Math.random() * 3 });
      this._m.makeTranslation(p.x, y, p.z);
      this.mesh.setMatrixAt(i, this._m);
      this.glow[i] = 0;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.glowAttr.needsUpdate = true;
  }

  _near(world, rng, dmin, dmax) {
    for (let k = 0; k < 40; k++) {
      const a = rng.float(0, Math.PI * 2), d = rng.float(dmin, dmax);
      const x = world.spawn.x + Math.cos(a) * d, z = world.spawn.z + Math.sin(a) * d;
      if (world.col.free(x, z, 1.2)) return { x, z };
    }
    return null;
  }

  // someone else picked it up
  // someone else took it: true if it was still there
  take(i) {
    const s = this.items[i];
    if (!s || !s.alive) return false;
    s.alive = false;
    this.glow[i] = 0;
    this._m.makeScale(0, 0, 0);
    this.mesh.setMatrixAt(i, this._m);
    this.mesh.instanceMatrix.needsUpdate = true;
    this.glowAttr.needsUpdate = true;
    return true;
  }

  remaining() {
    return this.items.reduce((n, s) => n + (s.alive ? 1 : 0), 0);
  }

  // a wavefront passed: light up shards it reached
  onFront(pulse, game) {
    for (let i = 0; i < this.items.length; i++) {
      const s = this.items[i];
      if (!s.alive) continue;
      const d = Math.hypot(s.x - pulse.x, s.y - pulse.y, s.z - pulse.z);
      if (d > pulse.prevR && d <= pulse.curR && d <= pulse.radius) {
        const was = this.glow[i];
        this.glow[i] = Math.max(this.glow[i], 1.25);
        if (was < 0.5) {
          game.audio.chime(s.x, s.y, s.z, i % 7, 0.12, true);
          game.radar.blip(s.x, s.z, 'shard');
        }
      }
    }
  }

  update(dt, game) {
    const p = game.player;
    if (!p.alive) return;
    let dirty = false;
    for (let i = 0; i < this.items.length; i++) {
      const s = this.items[i];
      if (!s.alive) {
        if (this.glow[i] !== 0) { this.glow[i] = 0; dirty = true; }
        continue;
      }
      const d = Math.hypot(s.x - p.x, s.z - p.z);
      let g = this.glow[i] - dt * 0.11;
      if (d < 4.5) g = Math.max(g, 0.5 * (1 - d / 4.5));
      g = Math.max(0, g);
      if (g !== this.glow[i]) { this.glow[i] = g; dirty = true; }
      // faint beacon chime when near — hunt them by ear
      if (d < 22) {
        s.chimeT -= dt;
        if (s.chimeT <= 0) {
          game.audio.chime(s.x, s.y, s.z, (i % 5) + 7, 0.05 * (1 - d / 22) + 0.01, true);
          s.chimeT = 3 + Math.random() * 2;
        }
      }
      if (d < 1.35 && Math.abs(p.y + 1 - s.y) < 2.5) {
        s.alive = false;
        this.glow[i] = 0;
        this._m.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, this._m);
        this.mesh.instanceMatrix.needsUpdate = true;
        dirty = true;
        game.onShard(s, i);
      }
    }
    if (dirty) this.glowAttr.needsUpdate = true;
  }
}
