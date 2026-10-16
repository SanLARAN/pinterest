// Echo afterimages: when a sound wave reaches a monster we bake its current pose into a static
// snapshot — a black silhouette outlined in red — that fades out. You never see monsters move,
// only where they WERE.
import * as THREE from 'three';
import { createGhostMaterial } from './sonar.js';

export class Ghosts {
  constructor(scene, capacity = 56, maxVerts = 3200) {
    this.list = [];
    this.maxVerts = maxVerts;
    for (let i = 0; i < capacity; i++) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(maxVerts * 3);
      const dat = new Uint8Array(maxVerts * 4);
      const pa = new THREE.BufferAttribute(pos, 3);
      pa.setUsage(THREE.DynamicDrawUsage);
      const da = new THREE.BufferAttribute(dat, 4, true);
      da.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', pa);
      geo.setAttribute('data', da);
      geo.setDrawRange(0, 0);
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4.5);
      const mat = createGhostMaterial(0xff2a20);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.matrixAutoUpdate = false;
      mesh.renderOrder = 5;
      scene.add(mesh);
      this.list.push({ mesh, geo, pos, dat, pa, da, born: -1, life: 0, strength: 0, model: null, sticky: false, count: 0 });
    }
  }

  clear() {
    for (const g of this.list) {
      g.mesh.visible = false;
      g.born = -1;
      g.sticky = false;
    }
  }

  _take(time) {
    let best = null, bestAge = -1;
    for (const g of this.list) {
      if (!g.mesh.visible && !g.sticky) return g;
      if (g.sticky) continue;
      const age = time - g.born;
      if (age > bestAge) { bestAge = age; best = g; }
    }
    return best || this.list[0];
  }

  // model: { parts: [{ arr:{pos,dat,count}, node }], root, key, dyes? }
  spawn(model, time, opts = {}) {
    const g = this._take(time);
    model.root.updateMatrixWorld(true);
    let n = 0;
    const copyDat = g.model !== model.key;
    for (const part of model.parts) {
      const e = part.node.matrixWorld.elements;
      const src = part.arr.pos, sd = part.arr.dat, cnt = part.arr.count;
      if (n + cnt > this.maxVerts) break;
      const P = g.pos;
      for (let i = 0; i < cnt; i++) {
        const x = src[i * 3], y = src[i * 3 + 1], z = src[i * 3 + 2];
        const o = (n + i) * 3;
        P[o] = e[0] * x + e[4] * y + e[8] * z + e[12];
        P[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
        P[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      }
      if (copyDat) g.dat.set(sd.subarray(0, cnt * 4), n * 4);
      n += cnt;
    }
    g.model = model.key;
    g.count = n;
    g.geo.setDrawRange(0, n);
    g.pa.clearUpdateRanges();
    g.pa.addUpdateRange(0, n * 3);
    g.pa.needsUpdate = true;
    if (copyDat) {
      g.da.clearUpdateRanges();
      g.da.addUpdateRange(0, n * 4);
      g.da.needsUpdate = true;
    }
    g.geo.boundingSphere.center.copy(model.root.position);
    g.geo.boundingSphere.center.y += 1.5;
    g.born = time;
    g.life = opts.life ?? 2.6;
    g.strength = opts.strength ?? 1;
    g.decay = opts.decay ?? 1.25;
    g.sticky = !!opts.sticky;
    const u = g.mesh.material.uniforms;
    u.uColor.value.set(opts.color ?? 0xff2a20);
    u.uFull.value = opts.full ?? 0;
    u.uBody.value = opts.body ?? 0.85;
    u.uJitter.value = opts.jitter ?? 1;
    // a teammate's outfit colours (model.dyes); dyeK < 1 washes them out (the dead)
    if (model.dyes) {
      for (let i = 0; i < 4; i++) u.uDye.value[i].copy(model.dyes[i]);
      u.uDyeK.value = opts.dyeK ?? 1;
    } else u.uDyeK.value = 0;
    g.mesh.visible = true;
    return g;
  }

  // rewrite an existing (sticky) ghost from the model's current pose
  refresh(g, model) {
    model.root.updateMatrixWorld(true);
    let n = 0;
    for (const part of model.parts) {
      const e = part.node.matrixWorld.elements;
      const src = part.arr.pos, cnt = part.arr.count;
      if (n + cnt > this.maxVerts) break;
      const P = g.pos;
      for (let i = 0; i < cnt; i++) {
        const x = src[i * 3], y = src[i * 3 + 1], z = src[i * 3 + 2];
        const o = (n + i) * 3;
        P[o] = e[0] * x + e[4] * y + e[8] * z + e[12];
        P[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
        P[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      }
      n += cnt;
    }
    g.pa.clearUpdateRanges();
    g.pa.addUpdateRange(0, n * 3);
    g.pa.needsUpdate = true;
    g.geo.boundingSphere.center.copy(model.root.position);
    g.geo.boundingSphere.center.y += 1.5;
  }

  release(g) {
    if (!g) return;
    g.sticky = false;
    g.mesh.visible = false;
  }

  update(time) {
    for (const g of this.list) {
      if (!g.mesh.visible) continue;
      const age = time - g.born;
      const u = g.mesh.material.uniforms;
      if (g.sticky) {
        u.uAlpha.value = g.strength;
        u.uFlash.value = 0;
        continue;
      }
      if (age > g.life) {
        g.mesh.visible = false;
        continue;
      }
      const fade = Math.exp(-age * g.decay) * (1 - Math.max(0, (age - g.life * 0.7) / (g.life * 0.3)));
      u.uAlpha.value = g.strength * fade;
      u.uFlash.value = Math.max(0, 1 - age * 7) * g.strength;
    }
  }
}
