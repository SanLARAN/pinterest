// Chibi low-poly knight: big head, small body, plume, cape, shield and sword.
import * as THREE from 'three';
import { GeoAccumulator, part, G } from './geo.js';
import { bitmapMaterial } from './bitmap.js';
import { COLORS } from './palette.js';

const HIP = 0.42;
const C = COLORS.hero;

export function createHeroModel() {
  const root = new THREE.Group();
  const upper = new THREE.Group(); // leans / squashes around the hips
  upper.position.y = HIP;
  root.add(upper);
  const u = (y) => y - HIP; // world height -> upper-local height

  const mats = [];
  const bodyMat = bitmapMaterial();
  mats.push(bodyMat);

  // ---- torso, head, helmet, face ------------------------------------------
  const body = new GeoAccumulator();
  part(body, G.cyl(0.3, 0.36, 0.6, 8), C.tunic, { y: u(0.75) });
  part(body, G.cyl(0.38, 0.38, 0.1, 8), C.gold, { y: u(0.56) });
  part(body, G.sphere(0.5, 14, 10), C.skin, { y: u(1.3) });
  part(body, G.sphere(0.54, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), C.steel, { y: u(1.36) });
  part(body, G.cone(0.1, 0.5, 5), C.plume, { y: u(1.95), z: -0.06, rx: -0.2 });
  part(body, G.sphere(0.1, 6, 4), C.gold, { y: u(1.72), z: 0.0 });
  for (const s of [-1, 1]) {
    part(body, G.sphere(0.075, 8, 6), C.eye, { x: s * 0.18, y: u(1.2), z: 0.44, sz: 0.6 });
    part(body, G.sphere(0.03, 6, 4), C.glint, { x: s * 0.2, y: u(1.24), z: 0.5 });
    part(body, G.sphere(0.1, 8, 6), C.cheek, { x: s * 0.31, y: u(1.1), z: 0.4, sz: 0.4 });
    part(body, G.sphere(0.13, 8, 6), C.steel, { x: s * 0.42, y: u(0.98) });
  }
  part(body, G.box(0.1, 0.03, 0.02), C.eye, { y: u(1.12), z: 0.48 });
  const bodyMesh = new THREE.Mesh(body.build(), bodyMat);
  upper.add(bodyMesh);

  // ---- cape ----------------------------------------------------------------
  const capeMat = new THREE.MeshLambertMaterial({ color: C.cape, side: THREE.DoubleSide });
  mats.push(capeMat);
  const capeGeo = new THREE.PlaneGeometry(0.66, 0.96, 1, 2);
  capeGeo.translate(0, -0.48, 0);
  const cape = new THREE.Group();
  cape.position.set(0, u(1.04), -0.24);
  cape.add(new THREE.Mesh(capeGeo, capeMat));
  upper.add(cape);

  // ---- legs ----------------------------------------------------------------
  const legs = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.17, HIP, 0);
    const acc = new GeoAccumulator();
    part(acc, G.box(0.2, 0.34, 0.22), C.pants, { y: -0.19 });
    part(acc, G.box(0.24, 0.16, 0.3), C.boots, { y: -0.36, z: 0.03 });
    pivot.add(new THREE.Mesh(acc.build(), bodyMat));
    root.add(pivot);
    legs.push(pivot);
  }

  // ---- arms ----------------------------------------------------------------
  const armR = new THREE.Group();
  armR.position.set(0.42, u(1.0), 0);
  armR.rotation.order = 'YXZ';
  upper.add(armR);
  const swordAcc = new GeoAccumulator();
  part(swordAcc, G.box(0.18, 0.18, 0.5), C.tunic, { z: 0.25 });
  part(swordAcc, G.sphere(0.11, 8, 6), C.skin, { z: 0.52 });
  part(swordAcc, G.cyl(0.035, 0.035, 0.3, 5), C.leather, { z: 0.7, rx: Math.PI / 2 });
  part(swordAcc, G.sphere(0.06, 6, 4), C.gold, { z: 0.55 });
  part(swordAcc, G.box(0.36, 0.07, 0.08), C.gold, { z: 0.86 });
  part(swordAcc, G.box(0.1, 0.025, 1.1), C.blade, { z: 1.5 });
  part(swordAcc, G.cone(0.05, 0.22, 4), C.blade, { z: 2.15, rx: Math.PI / 2 });
  part(swordAcc, G.box(0.02, 0.03, 0.9), C.bladeEdge, { x: 0.05, z: 1.5 });
  armR.add(new THREE.Mesh(swordAcc.build(), bodyMat));

  const armL = new THREE.Group();
  armL.position.set(-0.42, u(1.0), 0);
  armL.rotation.order = 'YXZ';
  upper.add(armL);
  const shieldAcc = new GeoAccumulator();
  part(shieldAcc, G.box(0.18, 0.18, 0.5), C.tunic, { z: 0.25 });
  part(shieldAcc, G.sphere(0.11, 8, 6), C.skin, { z: 0.52 });
  part(shieldAcc, G.cyl(0.36, 0.36, 0.08, 14), C.shield, { z: 0.5, rx: Math.PI / 2 });
  part(shieldAcc, G.cyl(0.38, 0.38, 0.04, 14), C.gold, { z: 0.47, rx: Math.PI / 2 });
  part(shieldAcc, G.sphere(0.1, 6, 4), C.gold, { z: 0.6 });
  part(shieldAcc, G.box(0.07, 0.5, 0.02), C.gold, { z: 0.6 });
  part(shieldAcc, G.box(0.36, 0.07, 0.02), C.gold, { z: 0.6 });
  armL.add(new THREE.Mesh(shieldAcc.build(), bodyMat));

  return {
    root,
    upper,
    cape,
    legs,
    armR,
    armL,
    mats,
    height: 1.9,
  };
}
