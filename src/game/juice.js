// Game feel: particles, ground rings, screen shake and floating combat text.
import * as THREE from 'three';
import { G } from '../render/geo.js';
import { ParticlePool, MarkerPool } from '../render/pools.js';
import { easeOutBack, clamp } from '../util/math.js';

const _v = new THREE.Vector3();

class FloatingText {
  constructor(root, max = 36) {
    this.root = root;
    this.items = [];
    this.pool = [];
    for (let i = 0; i < max; i++) {
      const el = document.createElement('div');
      el.className = 'floater';
      el.style.display = 'none';
      root.appendChild(el);
      this.pool.push({ el, on: false });
    }
  }

  spawn(text, kind, x, y, z) {
    let slot = this.pool.find((p) => !p.on);
    if (!slot) {
      // recycle the oldest visible text
      slot = this.pool[0];
      const idx = this.items.indexOf(slot);
      if (idx >= 0) this.items.splice(idx, 1);
    }
    slot.on = true;
    slot.el.textContent = text;
    slot.el.className = `floater ${kind}`;
    slot.el.style.display = 'block';
    slot.t = 0;
    slot.x = x;
    slot.y = y;
    slot.z = z;
    slot.life = kind === 'big' ? 1.3 : 0.85;
    slot.jitter = (Math.random() - 0.5) * 0.6;
    this.items.push(slot);
  }

  update(dt, camera, width, height) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      if (it.t >= it.life) {
        it.on = false;
        it.el.style.display = 'none';
        this.items.splice(i, 1);
        continue;
      }
      _v.set(it.x + it.jitter, it.y + 0.8 + it.t * 1.6, it.z);
      _v.project(camera);
      const sx = (_v.x * 0.5 + 0.5) * width;
      const sy = (-_v.y * 0.5 + 0.5) * height;
      const p = clamp(it.t / 0.22, 0, 1);
      const pop = easeOutBack(p, 2.2);
      const fade = clamp((it.life - it.t) / 0.3, 0, 1);
      it.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%) scale(${(0.6 + 0.4 * pop).toFixed(3)})`;
      it.el.style.opacity = fade.toFixed(3);
    }
  }

  clear() {
    for (const p of this.pool) {
      p.on = false;
      p.el.style.display = 'none';
    }
    this.items.length = 0;
  }
}

export class Juice {
  constructor(scene, camera, popupRoot) {
    this.camera = camera;
    this.trauma = 0;
    this.shakeT = 0;
    this.chunks = new ParticlePool(
      scene,
      G.box(0.16, 0.16, 0.16),
      new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }),
      420,
      { gravity: 17 },
    );
    this.sparkPool = new ParticlePool(
      scene,
      G.octa(0.1),
      new THREE.MeshBasicMaterial({ blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }),
      260,
      { gravity: 3, fade: true },
    );
    this.puffs = new ParticlePool(
      scene,
      G.ico(0.22, 0),
      new THREE.MeshLambertMaterial({ color: 0xf2e4c8, flatShading: true }),
      120,
      { gravity: -0.4 },
    );
    this.disks = new MarkerPool(scene, new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2), 18);
    this.rings = new MarkerPool(scene, new THREE.RingGeometry(0.82, 1, 40).rotateX(-Math.PI / 2), 18);
    this.texts = new FloatingText(popupRoot);
    this.size = { w: 1, h: 1 };
  }

  setSize(w, h) {
    this.size.w = w;
    this.size.h = h;
  }

  addTrauma(a) {
    this.trauma = Math.min(1, this.trauma + a);
  }

  /** Screen-shake offset in world units (x, y, z). Uses real time so it never freezes in hitstop. */
  shakeOffset(realDt) {
    this.trauma = Math.max(0, this.trauma - realDt * 1.25);
    this.shakeT += realDt;
    const s = this.trauma * this.trauma;
    const t = this.shakeT;
    const x = s * 0.9 * (Math.sin(t * 61.3) * 0.6 + Math.sin(t * 27.1 + 1.3) * 0.4);
    const y = s * 0.6 * (Math.sin(t * 53.7 + 2.1) * 0.6 + Math.sin(t * 31.9) * 0.4);
    const z = s * 0.4 * Math.sin(t * 43.3 + 4.0);
    return { x, y, z };
  }

  /** Update time-based effects. simDt is scaled by hitstop / slow-mo, realDt is wall time. */
  update(simDt, realDt, camera) {
    this.chunks.update(simDt);
    this.sparkPool.update(simDt);
    this.puffs.update(simDt);
    this.disks.update(simDt);
    this.rings.update(simDt);
    this.texts.update(realDt, camera, this.size.w, this.size.h);
  }

  burst(x, y, z, color, count = 12, power = 1) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (2.5 + Math.random() * 4.5) * power;
      this.chunks.emit(
        x, y, z,
        Math.cos(a) * sp, 3.5 + Math.random() * 4.5 * power, Math.sin(a) * sp,
        color,
        0.5 + Math.random() * 0.7,
        0.5 + Math.random() * 0.5,
        { drag: 1.6, spin: (Math.random() - 0.5) * 16 },
      );
    }
  }

  sparks(x, y, z, color, count = 8, power = 1) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (4 + Math.random() * 6) * power;
      const up = Math.random() * 4;
      this.sparkPool.emit(x, y, z, Math.cos(a) * sp, up, Math.sin(a) * sp, color, 0.35 + Math.random() * 0.3, 0.22 + Math.random() * 0.2, { drag: 3 });
    }
  }

  /** Soft dust puffs kicked up at ground level. (dx,dz) is the direction they drift. */
  dust(x, z, dx, dz, amount = 1) {
    const n = Math.max(1, Math.round(3 * amount));
    for (let i = 0; i < n; i++) {
      const sp = 0.8 + Math.random() * 1.2;
      this.puffs.emit(
        x + (Math.random() - 0.5) * 0.5, 0.2, z + (Math.random() - 0.5) * 0.5,
        dx * sp + (Math.random() - 0.5), 0.6 + Math.random() * 0.6, dz * sp + (Math.random() - 0.5),
        0xf2e4c8,
        0.5 + Math.random() * 0.35,
        0.45 + Math.random() * 0.25,
        { drag: 2.5, gravity: -0.5 },
      );
    }
  }

  ring(x, y, z, r1, color, dur = 0.4, intensity = 1) {
    this.rings.spawn({ x, y, z, r0: 0.3, r1, dur, color, mode: 'burst', intensity });
  }

  disk(x, y, z, r1, color, dur = 0.5, mode = 'burst', intensity = 0.6) {
    return this.disks.spawn({ x, y, z, r0: 0.2, r1, dur, color, mode, intensity });
  }

  text(text, kind, x, y, z) {
    this.texts.spawn(text, kind, x, y, z);
  }

  clearTexts() {
    this.texts.clear();
  }

  clearParticles() {
    this.chunks.life.fill(0);
    this.sparkPool.life.fill(0);
    this.puffs.life.fill(0);
  }
}
