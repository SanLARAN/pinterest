// ============================================================
// MONSTER VIEWS — low-poly procedural horrors. They only exist in the
// dark as echo-lit silhouettes plus faint eyes and a point aura.
// ============================================================
import * as THREE from 'three';
import { patchEcho } from './echo.js';
import { clamp, damp, lerp, TAU } from '../core/util.js';

const GEO = {};
function geo(key, make) { return GEO[key] || (GEO[key] = make()); }

export class MonsterViews {
  constructor(U) {
    this.U = U;
    this.views = new Map();
    this.root = new THREE.Group();
    this.root.matrixAutoUpdate = false;
  }
  attach(scene) { scene.add(this.root); }
  mat(color, opts = {}) {
    return patchEcho(new THREE.MeshLambertMaterial(Object.assign({ color, flatShading: true }, opts)), this.U);
  }

  sync(monsters, dt, t, player) {
    const seen = new Set();
    for (const m of monsters) {
      if (!m.alive) { const v = this.views.get(m.id); if (v) { this.root.remove(v.g); v.dispose && v.dispose(); this.views.delete(m.id); } continue; }
      seen.add(m.id);
      let v = this.views.get(m.id);
      if (!v) { v = this.build(m); this.views.set(m.id, v); this.root.add(v.g); }
      v.update(m, dt, t, player);
    }
    for (const [id, v] of this.views) if (!seen.has(id)) { this.root.remove(v.g); this.views.delete(id); }
  }
  clear() {
    for (const [, v] of this.views) this.root.remove(v.g);
    this.views.clear();
  }

  build(m) {
    switch (m.type) {
      case 'tall': return new TallView(m, this);
      case 'weeper': return new WeeperView(m, this);
      default: return new WhispererView(m, this);
    }
  }
}

class BaseView {
  constructor(m, mv) {
    this.mv = mv;
    this.g = new THREE.Group();
    this.parts = {};
    this.t = Math.random() * 10;
    this.eyeI = 0;
  }
  mesh(g2, mat, x, y, z, parent) {
    const m = new THREE.Mesh(g2, mat);
    m.position.set(x, y, z);
    (parent || this.g).add(m);
    return m;
  }
  place(m) {
    this.g.position.set(m.x, m.y, m.z);
    this.g.rotation.y = m.yaw + Math.PI;
  }
  baseUpdate(m, dt, t) {
    this.t += dt;
    this.place(m);
    const sinking = m.state === 'spawn' ? clamp(m.spawnT / 1.7, 0, 1) : m.state === 'flee' ? clamp(1 - m.drownT / 6, 0, 1) : 1;
    this.g.scale.setScalar(lerp(0.55, 1, sinking));
    this.g.visible = sinking > 0.02;
  }
}

// ------------------------------------------------------------------ whisperer
class WhispererView extends BaseView {
  constructor(m, mv) {
    super(m, mv);
    const skin = mv.mat(0x9fb4ae);
    const dark = mv.mat(0x4a5551);
    const cloth = mv.mat(0x33383a);
    const gCyl = geo('wLimb', () => new THREE.CylinderGeometry(0.055, 0.075, 1, 5));
    gCyl.translate(0, -0.5, 0);
    const gArm = geo('wArm', () => { const g = new THREE.CylinderGeometry(0.045, 0.062, 1, 5); g.translate(0, -0.5, 0); return g; });
    const gHead = geo('wHead', () => new THREE.IcosahedronGeometry(0.2, 0));
    const gTorso = geo('wTorso', () => new THREE.BoxGeometry(0.42, 0.82, 0.26));
    const gSh = geo('wSh', () => new THREE.BoxGeometry(0.66, 0.16, 0.28));
    const gFinger = geo('wFing', () => new THREE.ConeGeometry(0.022, 0.3, 3));

    this.pelvis = new THREE.Group(); this.pelvis.position.y = 1.06; this.g.add(this.pelvis);
    this.mesh(gTorso, cloth, 0, 1.52, 0);
    this.mesh(gSh, skin, 0, 1.96, 0);
    this.head = this.mesh(gHead, skin, 0, 2.22, 0.02);
    this.jaw = this.mesh(geo('wJaw', () => new THREE.BoxGeometry(0.16, 0.09, 0.14)), dark, 0, 2.11, 0.12);
    // eyes: the only thing that is always there
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: 0.9, fog: false, blending: THREE.AdditiveBlending, depthWrite: false });
    const gEye = geo('wEye', () => new THREE.SphereGeometry(0.035, 6, 5));
    this.eyeL = this.mesh(gEye, this.eyeMat, -0.075, 2.24, 0.17);
    this.eyeR = this.mesh(gEye, this.eyeMat, 0.075, 2.24, 0.17);
    // arms
    this.armL = new THREE.Group(); this.armL.position.set(-0.33, 1.94, 0); this.g.add(this.armL);
    this.armR = new THREE.Group(); this.armR.position.set(0.33, 1.94, 0); this.g.add(this.armR);
    for (const [grp, s] of [[this.armL, 1], [this.armR, -1]]) {
      this.mesh(gArm, skin, 0, 0, 0, grp).scale.y = 1.12;
      const hand = new THREE.Group(); hand.position.y = -1.12; grp.add(hand);
      for (let f = 0; f < 4; f++) {
        const fg = this.mesh(gFinger, skin, (f - 1.5) * 0.035, -0.05, 0.02, hand);
        fg.rotation.x = 0.25 + f * 0.06;
      }
    }
    // legs
    this.legL = new THREE.Group(); this.legL.position.set(-0.13, 1.06, 0); this.g.add(this.legL);
    this.legR = new THREE.Group(); this.legR.position.set(0.13, 1.06, 0); this.g.add(this.legR);
    this.mesh(gCyl, dark, 0, 0, 0, this.legL).scale.y = 1.06;
    this.mesh(gCyl, dark, 0, 0, 0, this.legR).scale.y = 1.06;
  }
  update(m, dt, t, player) {
    this.baseUpdate(m, dt, t);
    const sp = clamp(m.speed / 4.4, 0, 1.6);
    const ph = m.anim * (2.6 + sp * 2.4);
    const hunt = m.state === 'hunt';
    this.legL.rotation.x = Math.sin(ph) * (0.35 + sp * 0.6);
    this.legR.rotation.x = -Math.sin(ph) * (0.35 + sp * 0.6);
    this.armL.rotation.x = -Math.sin(ph) * (0.2 + sp * 0.5) - (hunt ? 0.7 : 0.06);
    this.armR.rotation.x = Math.sin(ph) * (0.2 + sp * 0.5) - (hunt ? 0.7 : 0.06);
    this.armL.rotation.z = 0.08 + (hunt ? 0.28 : 0) + Math.sin(this.t * 1.1) * 0.05;
    this.armR.rotation.z = -0.08 - (hunt ? 0.28 : 0) - Math.sin(this.t * 1.3) * 0.05;
    this.g.position.y = m.y + Math.abs(Math.sin(ph)) * 0.055 * sp;
    this.g.rotation.z = Math.sin(ph * 0.5) * 0.035 * (0.4 + sp);
    this.g.rotation.x = hunt ? 0.16 : 0.03 + Math.sin(this.t * 0.8) * 0.02;
    this.head.rotation.z = m.headTilt + (hunt ? Math.sin(this.t * 7) * 0.06 : 0);
    this.head.rotation.x = hunt ? -0.22 : Math.sin(this.t * 0.7) * 0.09;
    this.jaw.position.y = 2.11 - (hunt ? 0.05 : 0) - Math.max(0, Math.sin(this.t * 3.1)) * (hunt ? 0.05 : 0.012);
    const want = hunt ? 1.5 : m.state === 'search' || m.state === 'investigate' ? 0.7 : 0.22;
    this.eyeI = damp(this.eyeI, want, 4, dt);
    this.eyeMat.opacity = 0.25 + this.eyeI * 0.6 * (0.7 + 0.3 * Math.sin(this.t * 9));
    this.eyeMat.color.setRGB(1, 0.12 + (1 - this.eyeI) * 0.3, 0.22);
  }
}

// ------------------------------------------------------------------ the tall one
class TallView extends BaseView {
  constructor(m, mv) {
    super(m, mv);
    const black = mv.mat(0x15191b);
    const pale = mv.mat(0xcfc7bb);
    const gLeg = geo('tLeg', () => { const g = new THREE.CylinderGeometry(0.075, 0.11, 1, 5); g.translate(0, -0.5, 0); return g; });
    const gArm = geo('tArm', () => { const g = new THREE.CylinderGeometry(0.05, 0.085, 1, 5); g.translate(0, -0.5, 0); return g; });

    this.legL = new THREE.Group(); this.legL.position.set(-0.2, 3.5, 0); this.g.add(this.legL);
    this.legR = new THREE.Group(); this.legR.position.set(0.2, 3.5, 0); this.g.add(this.legR);
    this.mesh(gLeg, black, 0, 0, 0, this.legL).scale.y = 3.5;
    this.mesh(gLeg, black, 0, 0, 0, this.legR).scale.y = 3.5;
    this.mesh(geo('tTorso', () => new THREE.BoxGeometry(0.62, 2.5, 0.4)), black, 0, 4.75, 0);
    this.mesh(geo('tSh', () => new THREE.BoxGeometry(1.05, 0.2, 0.34)), black, 0, 5.95, 0);
    this.mesh(geo('tNeck', () => new THREE.CylinderGeometry(0.09, 0.12, 0.85, 5)), black, 0, 6.4, 0);
    this.head = this.mesh(geo('tHead', () => new THREE.BoxGeometry(0.36, 0.56, 0.34)), pale, 0, 6.95, 0);
    this.slit = this.mesh(geo('tSlit', () => new THREE.BoxGeometry(0.05, 0.34, 0.04)), mv.mat(0x05060a), 0, 6.88, 0.17);
    this.armL = new THREE.Group(); this.armL.position.set(-0.5, 5.95, 0); this.g.add(this.armL);
    this.armR = new THREE.Group(); this.armR.position.set(0.5, 5.95, 0); this.g.add(this.armR);
    for (const grp of [this.armL, this.armR]) {
      this.mesh(gArm, black, 0, 0, 0, grp).scale.y = 4.4;
      const hand = new THREE.Group(); hand.position.y = -4.4; grp.add(hand);
      for (let f = 0; f < 5; f++) {
        const fg = this.mesh(geo('tFing', () => new THREE.CylinderGeometry(0.018, 0.032, 0.85, 4)), black, (f - 2) * 0.055, -0.4, 0, hand);
        fg.rotation.x = 0.12 * (f - 2);
      }
    }
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, fog: false, blending: THREE.AdditiveBlending, depthWrite: false });
  }
  update(m, dt, t, player) {
    this.baseUpdate(m, dt, t);
    const sp = clamp(m.speed / 3.2, 0, 1.7);
    const ph = m.anim * (1.1 + sp * 1.3);
    this.legL.rotation.x = Math.sin(ph) * (0.22 + sp * 0.42);
    this.legR.rotation.x = -Math.sin(ph) * (0.22 + sp * 0.42);
    this.armL.rotation.x = -Math.sin(ph * 0.9) * 0.14 - 0.05;
    this.armR.rotation.x = Math.sin(ph * 0.9) * 0.14 - 0.05;
    this.armL.rotation.z = 0.05 + Math.sin(this.t * 0.6) * 0.03;
    this.armR.rotation.z = -0.05 - Math.sin(this.t * 0.7) * 0.03;
    this.g.position.y = m.y + Math.abs(Math.sin(ph)) * 0.1 * sp;
    this.g.rotation.x = 0.03 + sp * 0.07;
    this.g.rotation.z = Math.sin(ph * 0.5) * 0.02;
    this.head.rotation.y = Math.sin(this.t * 0.31) * 0.35;
    this.head.rotation.z = Math.sin(this.t * 0.23) * 0.08;
    this.slit.scale.y = 1 + Math.abs(Math.sin(this.t * 0.9)) * (m.state === 'hunt' ? 1.6 : 0.4);
    this.slit.scale.x = 1 + (m.state === 'hunt' ? 1.4 : 0);
  }
}

// ------------------------------------------------------------------ the weeper
class WeeperView extends BaseView {
  constructor(m, mv) {
    super(m, mv);
    const pale = mv.mat(0xd8cfc0);
    const dress = mv.mat(0x6a6459);
    const hair = mv.mat(0x12100f);
    this.dressM = this.mesh(geo('pDress', () => { const g = new THREE.ConeGeometry(0.78, 1.6, 7, 1, true); g.translate(0, 0.8, 0); return g; }), dress, 0, 0, 0);
    this.dressM.material.side = THREE.DoubleSide;
    this.torso = this.mesh(geo('pTorso', () => new THREE.BoxGeometry(0.4, 0.6, 0.26)), dress, 0, 1.72, 0);
    this.headG = new THREE.Group(); this.headG.position.set(0, 2.14, 0); this.g.add(this.headG);
    this.head = this.mesh(geo('pHead', () => new THREE.IcosahedronGeometry(0.21, 0)), pale, 0, 0, 0, this.headG);
    this.mouth = this.mesh(geo('pMouth', () => new THREE.SphereGeometry(0.1, 6, 5)), mv.mat(0x0a0406), 0, -0.07, 0.16, this.headG);
    this.hairM = this.mesh(geo('pHair', () => new THREE.ConeGeometry(0.3, 1.15, 7, 1, true)), hair, 0, 0.02, -0.03, this.headG);
    this.hairM.material.side = THREE.DoubleSide;
    this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff2e0, transparent: true, opacity: 0.6, fog: false, blending: THREE.AdditiveBlending, depthWrite: false });
    const gEye = geo('wEye');
    this.eyeL = this.mesh(gEye, this.eyeMat, -0.075, 0.03, 0.17, this.headG);
    this.eyeR = this.mesh(gEye, this.eyeMat, 0.075, 0.03, 0.17, this.headG);
    this.armL = new THREE.Group(); this.armL.position.set(-0.26, 1.95, 0); this.g.add(this.armL);
    this.armR = new THREE.Group(); this.armR.position.set(0.26, 1.95, 0); this.g.add(this.armR);
    const gArm = geo('wArm');
    this.mesh(gArm, pale, 0, 0, 0, this.armL).scale.y = 0.78;
    this.mesh(gArm, pale, 0, 0, 0, this.armR).scale.y = 0.78;
  }
  update(m, dt, t, player) {
    this.baseUpdate(m, dt, t);
    const sp = clamp(m.speed / 5.4, 0, 1.6);
    const ph = m.anim * (3.1 + sp * 3.4);
    const wail = clamp(m.wailT || 0, 0, 1);
    this.armL.rotation.x = lerp(Math.sin(ph) * 0.5 * sp, -2.5, wail);
    this.armR.rotation.x = lerp(-Math.sin(ph) * 0.5 * sp, -2.5, wail);
    this.armL.rotation.z = lerp(0.1, 0.55, wail);
    this.armR.rotation.z = lerp(-0.1, -0.55, wail);
    this.headG.rotation.x = lerp(Math.sin(this.t * 2) * 0.12, -0.85, wail);
    this.headG.rotation.z = Math.sin(this.t * 1.4) * 0.1 * (1 - wail) + wail * 0.06;
    this.mouth.scale.set(1 + wail * 1.3, 1 + wail * 2.6, 1 + wail * 1.3);
    this.mouth.position.y = -0.07 - wail * 0.03;
    this.dressM.rotation.y = Math.sin(ph * 0.5) * 0.12;
    this.dressM.scale.x = 1 + wail * 0.12;
    this.dressM.scale.z = 1 + wail * 0.12;
    this.g.position.y = m.y + Math.abs(Math.sin(ph)) * 0.09 * sp;
    this.g.rotation.x = sp * 0.22 - wail * 0.16;
    this.g.rotation.z = Math.sin(ph * 0.5) * 0.06;
    this.hairM.rotation.x = -0.1 + wail * 0.4 + Math.sin(this.t * 2.2) * 0.05;
    const want = wail > 0.2 ? 1.6 : m.state === 'hunt' ? 1.2 : 0.4;
    this.eyeI = damp(this.eyeI, want, 6, dt);
    this.eyeMat.opacity = 0.35 + this.eyeI * 0.45 * (0.75 + 0.25 * Math.sin(this.t * 12));
    this.eyeMat.color.setRGB(1, 0.9 - wail * 0.5, 0.85 - wail * 0.6);
  }
}
