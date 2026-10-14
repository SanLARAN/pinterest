// Pooled, instanced effect primitives. Each pool is one draw call regardless of count.
import * as THREE from 'three';

const _dummy = new THREE.Object3D();
const _col = new THREE.Color();
const WHITE = new THREE.Color(1, 1, 1);

/** Shadow blobs under every entity: one instanced draw call. */
export class ShadowPool {
  constructor(parent, max = 128) {
    const geo = new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2);
    this.mesh = new THREE.InstancedMesh(
      geo,
      new THREE.MeshBasicMaterial({ color: 0x1d1230, transparent: true, opacity: 0.32, depthWrite: false }),
      max,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.max = max;
    this.n = 0;
    parent.add(this.mesh);
  }
  begin() {
    this.n = 0;
  }
  put(x, y, z, r) {
    if (this.n >= this.max) return;
    _dummy.position.set(x, y + 0.03, z);
    _dummy.rotation.set(0, 0, 0);
    _dummy.scale.set(r, 1, r);
    _dummy.updateMatrix();
    this.mesh.setMatrixAt(this.n++, _dummy.matrix);
  }
  end() {
    for (let i = this.n; i < this.max; i++) {
      _dummy.scale.set(0, 0, 0);
      _dummy.position.set(0, -100, 0);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/**
 * Low-poly particles (chunks / sparks). Ring-buffer emission, gravity, drag, spin.
 */
export class ParticlePool {
  constructor(parent, geometry, material, max, { gravity = 14, fade = false } = {}) {
    this.max = max;
    this.gravity = gravity;
    this.fade = fade;
    this.mesh = new THREE.InstancedMesh(geometry, material, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < max; i++) this.mesh.setColorAt(i, WHITE);
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    parent.add(this.mesh);

    this.life = new Float32Array(max);
    this.life0 = new Float32Array(max);
    this.px = new Float32Array(max);
    this.py = new Float32Array(max);
    this.pz = new Float32Array(max);
    this.vx = new Float32Array(max);
    this.vy = new Float32Array(max);
    this.vz = new Float32Array(max);
    this.size = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.spin = new Float32Array(max);
    this.rot = new Float32Array(max);
    this.gravityOf = new Float32Array(max).fill(gravity);
    this.cr = new Float32Array(max).fill(1);
    this.cg = new Float32Array(max).fill(1);
    this.cb = new Float32Array(max).fill(1);
    this.cursor = 0;
    this.update(0);
  }

  emit(x, y, z, vx, vy, vz, color, size, life, { drag = 0.6, spin = 0, gravity } = {}) {
    const i = this.cursor;
    this.cursor = (i + 1) % this.max;
    this.life[i] = life;
    this.life0[i] = life;
    this.px[i] = x;
    this.py[i] = y;
    this.pz[i] = z;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.vz[i] = vz;
    this.size[i] = size;
    this.drag[i] = drag;
    this.spin[i] = spin;
    this.rot[i] = Math.random() * 6;
    _col.set(color);
    this.cr[i] = _col.r;
    this.cg[i] = _col.g;
    this.cb[i] = _col.b;
    this.gravityOf[i] = gravity ?? this.gravity;
  }

  update(dt) {
    const m = this.mesh;
    const g = this.gravityOf;
    for (let i = 0; i < this.max; i++) {
      let s = 0;
      if (this.life[i] > 0) {
        this.life[i] -= dt;
        const k = Math.max(0, this.life[i]) / this.life0[i];
        if (dt > 0) {
          const d = Math.max(0, 1 - this.drag[i] * dt);
          this.vx[i] *= d;
          this.vz[i] *= d;
          this.vy[i] -= g[i] * dt;
          this.px[i] += this.vx[i] * dt;
          this.py[i] += this.vy[i] * dt;
          this.pz[i] += this.vz[i] * dt;
          this.rot[i] += this.spin[i] * dt;
        }
        if (this.py[i] < 0) {
          this.py[i] = 0;
          this.vy[i] *= -0.25;
          this.vx[i] *= 0.6;
          this.vz[i] *= 0.6;
        }
        s = this.size[i] * (this.life[i] > 0 ? Math.sqrt(k) : 0);
        if (this.fade) {
          _col.setRGB(this.cr[i] * k, this.cg[i] * k, this.cb[i] * k);
          m.setColorAt(i, _col);
        }
      }
      _dummy.position.set(this.px[i], this.py[i], this.pz[i]);
      _dummy.rotation.set(this.rot[i], this.rot[i] * 0.7, this.rot[i] * 0.3);
      _dummy.scale.setScalar(s);
      _dummy.updateMatrix();
      m.setMatrixAt(i, _dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (this.fade) m.instanceColor.needsUpdate = true;
  }
}

/**
 * Ground markers (rings / discs) that expand, pulse or fade. Additive, colour = intensity.
 */
export class MarkerPool {
  constructor(parent, geometry, max = 24) {
    this.max = max;
    this.mesh = new THREE.InstancedMesh(
      geometry,
      new THREE.MeshBasicMaterial({ blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }),
      max,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < max; i++) this.mesh.setColorAt(i, new THREE.Color(0, 0, 0));
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    parent.add(this.mesh);
    this.items = Array.from({ length: max }, () => ({ on: false }));
  }

  /**
   * mode: 'burst' (grow + fade), 'warn' (grow + brighten until end), 'rift' (steady pulse, fade at end)
   */
  spawn({ x, y = 0, z, r0 = 0.1, r1 = 1, dur = 0.6, color = 0xffffff, intensity = 1, mode = 'burst', spin = 0 }) {
    let slot = this.items.find((it) => !it.on);
    if (!slot) slot = this.items.reduce((a, b) => (a.t / a.dur > b.t / b.dur ? a : b));
    Object.assign(slot, { on: true, x, y, z, r0, r1, dur, t: 0, mode, spin, intensity });
    _col.set(color);
    slot.cr = _col.r;
    slot.cg = _col.g;
    slot.cb = _col.b;
    return slot;
  }

  update(dt) {
    const m = this.mesh;
    for (let i = 0; i < this.max; i++) {
      const it = this.items[i];
      let scale = 0;
      if (it.on) {
        it.t += dt;
        const p = Math.min(1, it.t / it.dur);
        const e = 1 - Math.pow(1 - p, 3);
        scale = it.r0 + (it.r1 - it.r0) * e;
        let k;
        if (it.mode === 'warn') k = 0.25 + 0.75 * p;
        else if (it.mode === 'rift') k = (0.6 + 0.4 * Math.sin(it.t * 9)) * Math.min(1, it.t * 3) * (p > 0.85 ? (1 - p) / 0.15 : 1);
        else k = p < 0.15 ? p / 0.15 : (1 - p) / 0.85;
        k *= it.intensity;
        _col.setRGB(it.cr * k, it.cg * k, it.cb * k);
        m.setColorAt(i, _col);
        if (it.t >= it.dur) it.on = false;
      }
      _dummy.position.set(it.x ?? 0, (it.y ?? 0) + 0.02, it.z ?? 0);
      _dummy.rotation.set(0, it.spin ?? 0, 0);
      _dummy.scale.setScalar(scale);
      _dummy.updateMatrix();
      m.setMatrixAt(i, _dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    m.instanceColor.needsUpdate = true;
  }
}
