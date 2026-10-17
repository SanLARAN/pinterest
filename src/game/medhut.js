// The scouts' first-aid hut, a stone's throw from the camp (the building itself is a landmark: see
// World.lm_medhut). Its battery lantern still works — a small warm light by the door that you can see
// from a way off at night — and inside, on the cot, a fallen friend can be brought back (see Rescue).
import * as THREE from 'three';
import { haloMaterial } from './glowsticks.js';
import { shared } from '../render/sonar.js';

const WARM = [1.0, 0.8, 0.56];

let _tex = null;
function lampTexture() {
  if (_tex) return _tex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.18, 'rgba(255,225,180,0.8)');
  gr.addColorStop(0.5, 'rgba(255,170,90,0.14)');
  gr.addColorStop(1, 'rgba(255,140,60,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  _tex = new THREE.CanvasTexture(c);
  return _tex;
}

export class MedHut {
  constructor(game) {
    this.g = game;
    const h = game.world.medhut;
    this.h = h;
    this.cot = h ? h.cot : null;
    this.stand = h ? h.stand : null;
    // the battery lantern by the door, and a camping lantern hung inside over the cot
    // (near: their own cages don't count as walls — see render/shadows.js)
    this.light = h ? { x: h.lamp.x, y: h.lamp.y, z: h.lamp.z, I: 0.9, c: WARM, R: 8, near: 0.2 } : null;
    this.inner = h ? { x: h.lampIn.x, y: h.lampIn.y, z: h.lampIn.z, I: 0.8, c: [1.0, 0.88, 0.7], R: 5.5, near: 0.2 } : null;
    this.core = new THREE.Sprite(haloMaterial(0xfff0dc, lampTexture()));
    this.halo = new THREE.Sprite(haloMaterial(0xffb070, lampTexture()));
    this.coreIn = new THREE.Sprite(haloMaterial(0xfff4e4, lampTexture()));
    this.core.scale.setScalar(0.32);
    this.halo.scale.setScalar(2.6);
    this.coreIn.scale.setScalar(0.26);
    this.core.renderOrder = this.halo.renderOrder = this.coreIn.renderOrder = 6;
    if (h) {
      this.core.position.set(h.lamp.x, h.lamp.y, h.lamp.z);
      this.halo.position.copy(this.core.position);
      this.coreIn.position.set(h.lampIn.x, h.lampIn.y, h.lampIn.z);
      game.scene.add(this.core, this.halo, this.coreIn);
    }
    this.flickT = 3;
    this.flick = 0;
    game.glows.lanterns = h ? [this.light, this.inner] : [];
  }

  // a battery lantern on its last legs: steady, a slow breathing sag, and now and then a stutter
  update(dt) {
    const L = this.light;
    if (!L) return;
    const g = this.g;
    this.flickT -= dt;
    if (this.flickT <= 0) {
      this.flickT = 5 + Math.random() * 11;
      this.flick = 0.18 + Math.random() * 0.45;
    }
    let I = 0.9 + 0.06 * Math.sin(g.time * 0.63) * Math.sin(g.time * 0.21 + 1);
    if (this.flick > 0) {
      this.flick -= dt;
      I *= Math.random() < 0.45 ? 0.2 : 0.8;
    }
    L.I = I;
    this.inner.I = 0.8 * (0.94 + 0.06 * Math.sin(g.time * 1.7));
    const night = 1 - Math.max(0, Math.min(1, shared.uDawn.value));
    this.core.material.opacity = (0.35 + 0.65 * night) * I;
    this.halo.material.opacity = (0.05 + 0.3 * night) * I;
    this.coreIn.material.opacity = (0.3 + 0.6 * night) * this.inner.I;
  }

  // how far (x, z) is from the cot
  cotDist(x, z) {
    return this.cot ? Math.hypot(this.cot.x - x, this.cot.z - z) : 1e9;
  }

  // a body laid on the cot: where its rig root goes and which way it faces (head on the pillow)
  cotPose() {
    const c = this.cot;
    const hx = Math.sin(c.yaw), hz = Math.cos(c.yaw);
    return { x: c.x - hx * 0.2, z: c.z - hz * 0.2, y: c.y + 0.13, yaw: c.yaw };
  }

  // someone gets up off the cot: on their feet beside it, facing the door
  standPose() {
    const s = this.stand, d = this.h.door;
    return { x: s.x, z: s.z, yaw: Math.atan2(-(d.x - s.x), -(d.z - s.z)) };
  }
}
