// Enemy arrows: travel in a straight line, hit the hero, or break on walls.
import * as THREE from 'three';
import { G, GeoAccumulator, part, vertexMaterial } from '../render/geo.js';
import { overlapsStatic } from '../sim/collision.js';

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _t = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _q = new THREE.Quaternion();
const _dummy = new THREE.Object3D();
const MAX = 40;

function arrowGeometry() {
  const acc = new GeoAccumulator();
  part(acc, G.box(0.05, 0.05, 0.8), 0xb08a5a, { z: 0 });
  part(acc, G.cone(0.07, 0.22, 4), 0xcfd6df, { z: 0.5, rx: Math.PI / 2 });
  part(acc, G.box(0.14, 0.02, 0.14), 0xe0453b, { z: -0.36 });
  return acc.build();
}

export class Arrows {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.mesh = new THREE.InstancedMesh(arrowGeometry(), vertexMaterial(), MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.hidden();
  }

  hidden() {
    _s.setScalar(0);
    _p.set(0, -100, 0);
    _m.compose(_p, _q.identity(), _s);
    for (let i = 0; i < MAX; i++) this.mesh.setMatrixAt(i, _m);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() {
    this.items.length = 0;
    this.hidden();
  }

  spawn(x, y, z, tx, ty, tz, dmg, speed = 11) {
    const dx = tx - x;
    const dy = ty - y;
    const dz = tz - z;
    const d = Math.hypot(dx, dy, dz) || 1;
    if (this.items.length >= MAX) this.items.shift();
    this.items.push({ x, y, z, vx: (dx / d) * speed, vy: (dy / d) * speed, vz: (dz / d) * speed, life: 2.6, dmg });
  }

  /**
   * hooks: onHero(dmg, x, z) -> bool, onImpact(x, y, z, hitHero)
   */
  update(dt, hero, layout, hooks) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const a = this.items[i];
      a.life -= dt;
      a.vy -= 3 * dt; // slight arc
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.z += a.vz * dt;
      let remove = a.life <= 0;
      const ground = layout.heightAt(a.x, a.z);
      if (a.y <= ground) {
        remove = true;
        hooks.onImpact(a.x, ground, a.z, false);
      } else if (overlapsStatic(layout, a.x, a.z, 0.12)) {
        remove = true;
        hooks.onImpact(a.x, a.y, a.z, false);
      } else if (Math.hypot(a.x - hero.x, a.z - hero.z) < hero.radius + 0.28 && Math.abs(a.y - (hero.y + 0.8)) < 1.1) {
        remove = true;
        hooks.onHero(a.dmg, a.x, a.z);
        hooks.onImpact(a.x, a.y, a.z, true);
      }
      if (remove) this.items.splice(i, 1);
    }
    this.render();
  }

  render() {
    const n = Math.min(this.items.length, MAX);
    for (let i = 0; i < MAX; i++) {
      if (i < n) {
        const a = this.items[i];
        _p.set(a.x, a.y, a.z);
        _t.set(a.x + a.vx, a.y + a.vy, a.z + a.vz);
        _dummy.position.copy(_p);
        _dummy.lookAt(_t);
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        this.mesh.setMatrixAt(i, _dummy.matrix);
      } else {
        _s.setScalar(0);
        _p.set(0, -100, 0);
        _m.compose(_p, _q.identity(), _s);
        this.mesh.setMatrixAt(i, _m);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
