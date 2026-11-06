// The traffic in the opening is choreographed in shot time, not simulated: seeking a cut must give the
// same wheelie and the same pursuit. All models use the world's palette and the owner's Kugoo rig.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../core/rng.js';
import { CFG } from '../core/config.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { GK, boxAt, tyre } from '../ui/garageSet.js';
import { buildKugoo, poseKugoo } from './moto.js';
import { buildSurvivor, poseRider } from './survivor.js';
import { cleanFit } from './outfit.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { haloMaterial } from './glowsticks.js';

const PI = Math.PI, R = CFG.ROAD;
const ease = (a, b, t) => smoothstep(a, b, t);
const HAND = new THREE.Vector3(0, -0.305, 0.066), FORE = HAND.clone().normalize();
const grip = new THREE.Vector3(), h = new THREE.Vector3(), u = new THREE.Vector3(), v = new THREE.Vector3();
const elbow = new THREE.Vector3(), dir = new THREE.Vector3(), pole = new THREE.Vector3(), q = new THREE.Quaternion();
function holdGrip(rig, side, target) {
  const n = rig.nodes, sh = n['sh' + side], el = n['el' + side], S = sh.position;
  n.chest.worldToLocal(h.copy(target));
  const l1 = el.position.length(), l2 = HAND.length(), d = clamp(u.copy(h).sub(S).length(), 0.05, l1 + l2 - 0.002);
  u.normalize();
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  pole.set(side === 'L' ? -1 : 1, -0.5, -0.2);
  v.copy(pole).addScaledVector(u, -pole.dot(u)).normalize();
  elbow.copy(S).addScaledVector(u, l1 * Math.cos(a)).addScaledVector(v, l1 * Math.sin(a));
  sh.quaternion.setFromUnitVectors(dir.copy(el.position).normalize(), grip.copy(elbow).sub(S).normalize());
  dir.copy(h).sub(elbow).normalize().applyQuaternion(q.copy(sh.quaternion).invert());
  el.quaternion.setFromUnitVectors(FORE, dir);
}
export function trafficAt(t, car) {
  const side = t >= 13.3 && t < 20.5, pursuit = t >= 25.6 && t < 39.5;
  const drone = t >= 32.5;
  const bikerX = side ? car.x + lerp(7, -12, clamp((t - 13.5) / 7, 0, 1))
    : drone ? car.x - 29 - (t - 32.5) * 2.8 : car.x - 23;
  return {
    biker: { visible: side || pursuit, x: bikerX, y: R.y + 0.015, z: R.z + 0.45,
      yaw: PI / 2, wheelie: side ? 0.68 * ease(13.9, 15.2, t) * (1 - ease(18.2, 19.8, t)) : 0,
      spin: t * 28 / 0.2218 },
    police: { visible: pursuit, x: drone ? car.x - 13 - (t - 32.5) * 1.3
      : car.x + lerp(18, -20, clamp((t - 26.5) / 6, 0, 1)), y: R.y + 0.02, z: R.z + 0.55,
      yaw: 0, flash: Math.floor(t * 9) % 4 },
  };
}

let _beaconTex;
export function beaconTexture() {
  if (_beaconTex) return _beaconTex;
  const n = 32, data = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const d = Math.hypot((i + 0.5 - n / 2) / (n / 2), (j + 0.5 - n / 2) / (n / 2));
    const k = (j * n + i) * 4;
    data[k] = data[k + 1] = data[k + 2] = 255;
    data[k + 3] = Math.round(255 * Math.pow(Math.max(0, 1 - d), 3));
  }
  _beaconTex = new THREE.DataTexture(data, n, n);
  _beaconTex.needsUpdate = true;
  return _beaconTex;
}

// A legible die-cut door legend: geometry, not an external font/texture.
const LETTERS = {
  'П': ['111', '101', '101', '101', '101'], 'О': ['111', '101', '101', '101', '111'],
  'Л': ['011', '101', '101', '101', '101'], 'И': ['101', '101', '111', '111', '101'],
  'Ц': ['101', '101', '101', '111', '001'], 'Я': ['111', '101', '111', '011', '101'],
};
export function policeGeometry() {
  const b = new MeshBuilder(4096);
  boxAt(b, 0, 0.62, 0, 4.1, 0.62, 1.64, KIND.BONE);
  boxAt(b, -1.35, 0.98, 0, 1.3, 0.12, 1.59, KIND.BONE);
  boxAt(b, 1.57, 0.97, 0, 0.9, 0.12, 1.59, KIND.BONE);
  b.place(0.1, 0.99, 0); b.taper(2.15, 1.46, 1.45, 1.25, 0.53, GK.NIGHT);
  boxAt(b, 0.1, 1.55, 0, 1.52, 0.09, 1.32, KIND.BONE);
  for (const x of [-0.69, 0.04, 0.89]) boxAt(b, x, 1.25, 0, 0.055, 0.53, 1.35, KIND.BONE);
  for (const z of [-0.57, 0.57]) for (const x of [-0.82, 0.98]) boxAt(b, x, 1.25, z, 0.06, 0.57, 0.08, KIND.BONE, 0, 0, x < 0 ? -0.48 : 0.48);
  for (const side of [-1, 1]) {
    boxAt(b, 0, 0.78, side * 0.83, 3.97, 0.23, 0.022, GK.NIGHT);
    boxAt(b, 0.08, 0.99, side * 0.848, 0.17, 0.03, 0.026, GK.DARK);
    let col = 0;
    for (const letter of 'ПОЛИЦИЯ') {
      LETTERS[letter].forEach((row, j) => [...row].forEach((bit, i) => {
        // (5.0b: side × — the far side read backwards, «ЯИЦИЛОП»)
        if (bit === '1') boxAt(b, side * (col + i - 13.5) * 0.043, 0.86 - j * 0.033, side * 0.847,
          0.038, 0.028, 0.01, KIND.BONE);
      }));
      col += 4;
    }
  }
  for (const x of [-2.1, 2.1]) boxAt(b, x, 0.41, 0, 0.09, 0.15, 1.73, GK.DARK);
  for (const z of [-0.58, 0.58]) {
    boxAt(b, -2.065, 0.82, z, 0.04, 0.19, 0.27, GK.HEADLAMP);
    boxAt(b, 2.065, 0.8, z, 0.04, 0.16, 0.26, GK.TAILLAMP);
  }
  boxAt(b, -2.07, 0.8, 0, 0.05, 0.2, 0.65, GK.DARK);
  boxAt(b, 0.12, 1.66, 0, 0.28, 0.07, 1.15, GK.DARK);
  boxAt(b, 0.12, 1.76, -0.38, 0.26, 0.17, 0.36, GK.REDPAINT);
  boxAt(b, 0.12, 1.76, 0.38, 0.26, 0.17, 0.36, GK.NIGHT);
  return b.toGeometry();
}

export class RoadTraffic {
  constructor(scene, material) {
    this.scene = scene;
    this.root = new THREE.Group();
    scene.add(this.root);
    this.biker = new THREE.Group();
    this.pivot = new THREE.Group();
    this.pivot.position.set(0, 0.2218, 0.5023); // rear axle: a wheelie must keep this contact on the road
    this.biker.add(this.pivot);
    this.bike = buildKugoo(GK.REDPAINT, material);
    this.bike.position.set(0, -0.2218, -0.5023);
    this.pivot.add(this.bike);
    this.rig = buildSurvivor(cleanFit({ head: 'keanuhair', body: 'jacket', hc: ['#241a12', '#3a2a1a'], bc: ['#232527', '#b5462a'] }));
    this.riderMat = createPersonMaterial(this.rig.dyes, 0xc3aa84);
    this.riderMat.uniforms.uShow.value = 1;
    this.meshes = dressPerson(this.rig, this.riderMat);
    this.rig.root.position.set(0, 0.7 - 0.2218, -0.5023);
    this.rig.root.rotation.y = PI;
    this.pivot.add(this.rig.root);
    const h = new MeshBuilder(256);
    h.place(0, 0.025, 0, 0, 0, 0, 1, 1.1, 1.05); h.octa(0.205, 0.205, GK.REDPAINT);
    boxAt(h, 0, 0.018, 0.16, 0.3, 0.13, 0.075, GK.DARK);
    boxAt(h, 0, -0.105, 0.1, 0.3, 0.07, 0.16, GK.REDPAINT);
    this.helmetGeo = h.toGeometry();
    this.rig.nodes.head.add(new THREE.Mesh(this.helmetGeo, material));
    this.police = new THREE.Group();
    this.policeGeo = policeGeometry();
    this.police.add(new THREE.Mesh(this.policeGeo, material));
    const w = new MeshBuilder(256); w.identity(); tyre(w, 0.31, 0.18, GK.RUBBER, 12, true);
    w.place(0, 0.095, 0); w.cylinder(10, 0.2, 0.2, 0.02, GK.DARK);
    this.wheelGeo = w.toGeometry();
    this.wheels = [];
    for (const x of [-1.23, 1.25]) for (const z of [-0.78, 0.78]) {
      const pivot = new THREE.Group(); pivot.position.set(x, 0.31, z);
      const wheel = new THREE.Mesh(this.wheelGeo, material); wheel.rotation.x = PI / 2;
      pivot.add(wheel); this.police.add(pivot); this.wheels.push(pivot);
    }
    this.halos = [-1, 1].map((s) => {
      const halo = new THREE.Sprite(haloMaterial(s < 0 ? 0xff251c : 0x3b80ff, beaconTexture()));
      halo.position.set(0.12, 1.79, s * 0.38); halo.scale.setScalar(1.15); this.police.add(halo); return halo;
    });
    this.root.add(this.biker, this.police);
  }

  update(t, car) {
    this.state = trafficAt(t, car);
    const { biker: b, police: p } = this.state;
    this.biker.visible = b.visible; this.police.visible = p.visible;
    this.biker.position.set(b.x, b.y, b.z); this.biker.rotation.y = b.yaw;
    this.pivot.rotation.x = b.wheelie;
    poseKugoo(this.bike, { steer: 0.015 * Math.sin(t * 1.6), spin: b.spin, spinR: b.spin, comp: undefined });
    poseRider(this.rig, 0, 0, t);
    this.rig.nodes.chest.rotation.x -= b.wheelie * 0.55;
    this.rig.nodes.head.rotation.x += b.wheelie * 0.7;
    // Keep hands on the low bars and feet by the pegs while the chassis pitches about the rear axle.
    const n = this.rig.nodes;
    for (const side of ['L', 'R']) {
      n['th' + side].rotation.x = -1.55; n['kn' + side].rotation.x = 2.05;
    }
    this.biker.updateMatrixWorld(true);
    const bars = this.bike.userData.kugoo.steer;
    for (const side of ['L', 'R']) {
      // Centres measured on the owner's model; the rider faces +z, the Kugoo faces -z.
      const target = bars.localToWorld(grip.set(side === 'L' ? 0.29 : -0.29, 0.278, 0.086));
      holdGrip(this.rig, side, target);
    }
    this.police.position.set(p.x, p.y, p.z); this.police.rotation.y = p.yaw;
    for (const w of this.wheels) w.rotation.z = t * 26 / 0.31;
    this.halos[0].material.opacity = p.flash === 0 || p.flash === 2 ? 1.7 : 0.05;
    this.halos[1].material.opacity = p.flash === 1 || p.flash === 3 ? 1.7 : 0.05;
  }

  sound(audio) {
    if (!audio || !this.state) return;
    for (const [key, pose, fn] of [['bikeSound', this.state.biker, 'filmMoto'], ['siren', this.state.police, 'policeSiren']]) {
      if (pose.visible) {
        this[key] ||= audio[fn]?.(pose.x, pose.y + 0.9, pose.z) || null;
        this[key]?.move(pose.x, pose.y + 0.9, pose.z);
      } else if (this[key]) { this[key].stop(); this[key] = null; }
    }
  }

  dispose() {
    this.bikeSound?.stop(); this.siren?.stop();
    undressPerson(this.meshes); this.riderMat.dispose();
    for (const g of [this.helmetGeo, this.policeGeo, this.wheelGeo]) g.dispose();
    for (const h of this.halos) h.material.dispose();
    this.root.removeFromParent();
  }
}
