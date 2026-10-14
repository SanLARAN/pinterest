// Dropped gold coins (score), xp shards (level-ups) and hearts (healing).
import * as THREE from 'three';
import { G, GeoAccumulator, part } from '../render/geo.js';
import { PICKUPS } from '../sim/defs.js';
import { damp } from '../util/math.js';

const KIND = {
  coin: { max: 120, color: 0xf6c343, emissive: 0x7a5200, scale: 1 },
  shard: { max: 90, color: 0x43d3c1, emissive: 0x0c5a52, scale: 1 },
  heart: { max: 16, color: 0xff5d7a, emissive: 0x5a0d1c, scale: 1 },
  loot: { max: 24, color: 0xffb347, emissive: 0x6a3a00, scale: 1 },
};
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _e = new THREE.Euler();

function heartGeometry() {
  const acc = new GeoAccumulator();
  part(acc, G.sphere(0.13, 8, 6), 0xffffff, { x: -0.07, y: 0.06 });
  part(acc, G.sphere(0.13, 8, 6), 0xffffff, { x: 0.07, y: 0.06 });
  part(acc, G.cone(0.17, 0.26, 6), 0xffffff, { y: -0.08, rz: Math.PI });
  return acc.build();
}

export class Pickups {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.meshes = {};
    const geos = {
      coin: new THREE.CylinderGeometry(0.26, 0.26, 0.07, 12),
      shard: new THREE.OctahedronGeometry(0.2, 0),
      heart: heartGeometry(),
      loot: new THREE.BoxGeometry(0.28, 0.28, 0.28),
    };
    const mats = {
      coin: new THREE.MeshLambertMaterial({ color: KIND.coin.color, emissive: KIND.coin.emissive }),
      shard: new THREE.MeshLambertMaterial({ color: KIND.shard.color, emissive: KIND.shard.emissive, flatShading: true }),
      heart: new THREE.MeshLambertMaterial({ color: KIND.heart.color, emissive: KIND.heart.emissive, flatShading: true }),
      loot: new THREE.MeshLambertMaterial({ color: KIND.loot.color, emissive: KIND.loot.emissive, flatShading: true }),
    };
    for (const kind of Object.keys(KIND)) {
      const mesh = new THREE.InstancedMesh(geos[kind], mats[kind], KIND[kind].max);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      scene.add(mesh);
      this.meshes[kind] = mesh;
    }
    this.geos = geos;
  }

  clear() {
    this.items.length = 0;
  }

  count(kind) {
    let n = 0;
    for (const it of this.items) if (it.kind === kind) n++;
    return n;
  }

  /** Drops `n` items of `kind` around (x, z) with a little hop. */
  drop(kind, x, z, n = 1, value) {
    for (let i = 0; i < n; i++) {
      if (this.count(kind) >= KIND[kind].max) this.removeOldest(kind);
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 3.5;
      this.items.push({
        kind,
        x: x + Math.cos(a) * 0.2,
        y: 0.6,
        z: z + Math.sin(a) * 0.2,
        vx: Math.cos(a) * sp,
        vy: 5 + Math.random() * 3,
        vz: Math.sin(a) * sp,
        t: 0,
        value: value ?? (kind === 'coin' ? PICKUPS.coinValue : kind === 'heart' ? PICKUPS.heartHeal : 0),
        grounded: false,
        life: kind === 'heart' ? 14 : kind === 'loot' ? 40 : 16,
        spin: Math.random() * 6,
      });
    }
  }

  removeOldest(kind) {
    const idx = this.items.findIndex((it) => it.kind === kind);
    if (idx >= 0) this.items.splice(idx, 1);
  }

  /**
   * Advances physics and collection. Calls onCollect(kind, value, x, y, z) for each pickup taken.
   */
  update(dt, hero, layout, magnet, onCollect) {
    const hy = hero.y + 0.6;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      it.life -= dt;
      if (it.cd > 0) it.cd -= dt;
      it.spin += dt * 4;
      if (!it.grounded) {
        it.vy -= 22 * dt;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.z += it.vz * dt;
        it.vx = damp(it.vx, 0, 4, dt);
        it.vz = damp(it.vz, 0, 4, dt);
        const g = layout.heightAt(it.x, it.z) + 0.3;
        if (it.y <= g) {
          it.y = g;
          if (Math.abs(it.vy) > 3) {
            it.vy = -it.vy * 0.35;
          } else {
            it.vy = 0;
            it.grounded = true;
          }
        }
      } else {
        it.y = damp(it.y, layout.heightAt(it.x, it.z) + 0.3 + Math.sin(it.t * 4 + it.spin) * 0.06, 20, dt);
      }
      // magnet: start pulling after a short pop
      const dx = hero.x - it.x;
      const dz = hero.z - it.z;
      const dy = hy - it.y;
      const d = Math.hypot(dx, dz, dy);
      if (it.t > 0.35 && d < magnet) {
        const pull = (6 + 16 * (1 - d / magnet)) * dt;
        const k = Math.min(1, pull / Math.max(d, 1e-3));
        it.x += dx * k * 1.2;
        it.z += dz * k * 1.2;
        it.y += dy * k;
        it.grounded = true;
      }
      if (d < 0.8 && it.t > 0.12 && !(it.cd > 0)) {
        // onCollect returns false when the pickup cannot be taken (e.g. a full pack);
        // it then stays on the ground and retries after a short pause.
        if (onCollect(it.kind, it.value, it.x, it.y, it.z) !== false) {
          this.items.splice(i, 1);
          continue;
        }
        it.cd = 1.2;
      }
      if (it.life <= 0) this.items.splice(i, 1);
    }
    this.render();
  }

  render() {
    const idx = {};
    for (const kind of Object.keys(KIND)) idx[kind] = 0;
    for (const it of this.items) {
      const mesh = this.meshes[it.kind];
      const i = idx[it.kind]++;
      if (i >= KIND[it.kind].max) continue;
      const blink = it.life < 2 && Math.floor(it.life * 10) % 2 === 0;
      const sc = blink ? 0.0001 : 1;
      // coins flip about X, shards and hearts spin about Y
      if (it.kind === 'coin') _e.set(it.spin, 0, 0);
      else _e.set(0, it.spin, 0);
      _q.setFromEuler(_e);
      _p.set(it.x, it.y + (it.kind === 'shard' ? 0.1 : 0), it.z);
      _s.setScalar(sc * (it.t < 0.2 ? Math.min(1, it.t / 0.2 * 1.2) : 1));
      _m.compose(_p, _q, _s);
      mesh.setMatrixAt(i, _m);
    }
    for (const kind of Object.keys(KIND)) {
      const mesh = this.meshes[kind];
      for (let i = idx[kind]; i < KIND[kind].max; i++) {
        _s.setScalar(0);
        _p.set(0, -100, 0);
        _m.compose(_p, _q.identity(), _s);
        mesh.setMatrixAt(i, _m);
      }
      mesh.count = KIND[kind].max;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

