// Chibi low-poly knight: big head, small body, plume, cape, shield and sword.
import * as THREE from 'three';
import { GeoAccumulator, part, G } from './geo.js';
import { bitmapMaterial } from './bitmap.js';
import { COLORS } from './palette.js';

const HIP = 0.42;
const C = COLORS.hero;
const ASH_LIGHT = 0xc4bfd0;
const ASH_DARK = 0x8d8799;

/**
 * variant 'knight' is Sir Pip. variant 'berserker' swaps the helmet for long ash-grey hair,
 * darkens the cape and gives him a massive frost-blue sword.
 */
export function createHeroModel(variant = 'knight') {
  const berserker = variant === 'berserker';
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
  // faceted head and helmet (low-poly), gem crest, plume
  part(body, G.ico(0.5, 1), C.skin, { y: u(1.3) });
  if (berserker) {
    // long ash-grey hair: a cap over the crown and locks falling behind the shoulders
    part(body, G.ico(0.56, 1), ASH_LIGHT, { y: u(1.56), z: -0.1, sy: 0.7 });
    part(body, G.box(0.5, 0.95, 0.2), ASH_DARK, { y: u(1.08), z: -0.32 });
    for (const s of [-1, 1]) part(body, G.box(0.14, 0.7, 0.22), ASH_LIGHT, { x: s * 0.36, y: u(1.2), z: -0.12 });
  } else {
    part(body, G.ico(0.57, 1), C.steel, { y: u(1.5), sy: 0.8 });
  }
  part(body, G.box(0.62, 0.07, 0.5), C.gold, { y: u(1.44), z: 0.02 });
  part(body, G.ico(0.1, 0), C.gold, { y: u(1.72), z: 0.0 });
  part(body, G.ico(0.07, 0), C.glint, { y: u(1.98), z: 0.0 });
  for (const s of [-1, 1]) {
    part(body, G.sphere(0.075, 8, 6), C.eye, { x: s * 0.18, y: u(1.2), z: 0.44, sz: 0.6 });
    part(body, G.sphere(0.03, 6, 4), C.glint, { x: s * 0.2, y: u(1.24), z: 0.5 });
    part(body, G.sphere(0.1, 8, 6), C.cheek, { x: s * 0.31, y: u(1.1), z: 0.4, sz: 0.4 });
    part(body, G.sphere(0.13, 8, 6), C.steel, { x: s * 0.42, y: u(0.98) });
  }
  part(body, G.box(0.1, 0.03, 0.02), C.eye, { y: u(1.12), z: 0.48 });
  // belt, buckle, heraldic tabard and gold pauldrons
  part(body, G.cyl(0.33, 0.36, 0.12, 8), C.leather, { y: u(0.6) });
  part(body, G.box(0.1, 0.1, 0.04), C.gold, { y: u(0.6), z: 0.36 });
  part(body, G.box(0.34, 0.5, 0.04), C.plume, { y: u(0.78), z: 0.33 });
  part(body, G.box(0.12, 0.12, 0.02), C.gold, { y: u(0.8), z: 0.36, rz: Math.PI / 4 });
  for (const s of [-1, 1]) {
    part(body, G.ico(0.2, 0), C.gold, { x: s * 0.44, y: u(1.22), sy: 0.7 });
    part(body, G.cyl(0.16, 0.18, 0.06, 6), C.steel, { x: s * 0.44, y: u(1.1) });
  }
  const bodyMesh = new THREE.Mesh(body.build(), bodyMat);
  upper.add(bodyMesh);

  // ---- crest (the plume): its own material and pivot, so it can burn red when the knight is hurt
  const CREST_Y = u(1.8);
  const crestAcc = new GeoAccumulator();
  part(crestAcc, G.cone(0.1, 0.5, 5), C.plume, { y: u(1.95) - CREST_Y, z: -0.06, rx: -0.2 });
  const crestMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: 0xff2a14, emissiveIntensity: 0 });
  const crestMesh = new THREE.Mesh(crestAcc.build(), crestMat);
  const crest = new THREE.Group();
  crest.position.set(0, CREST_Y, 0);
  crest.add(crestMesh);
  upper.add(crest);
  let crestT = 0;
  /** danger 0..1 (see sim/danger.js): the crest glows, flickers and sways harder as the knight nears death. */
  const setDanger = (danger, dt) => {
    crestT += dt;
    if (danger <= 0.001) {
      crestMat.emissiveIntensity = 0;
      crestMat.color.setRGB(1, 1, 1);
      crest.rotation.z = 0;
      crest.scale.setScalar(1);
      return;
    }
    const flicker = 0.75 + 0.25 * Math.sin(crestT * 11) + 0.12 * Math.sin(crestT * 23.7);
    crestMat.emissiveIntensity = danger * (0.5 + 0.4 * flicker);
    crestMat.color.setRGB(1, 1 - danger * 0.45, 1 - danger * 0.6);
    crest.rotation.z = Math.sin(crestT * 7) * 0.07 * danger;
    crest.scale.setScalar(1 + danger * 0.05 * flicker);
  };

  // ---- cape ----------------------------------------------------------------
  const capeMat = new THREE.MeshLambertMaterial({ color: berserker ? 0x3f3558 : C.cape, side: THREE.DoubleSide });
  mats.push(capeMat);
  const capeGeo = new THREE.PlaneGeometry(0.66, 0.96, 3, 4);
  capeGeo.translate(0, -0.48, 0);
  // torn, faceted hem: every other bottom vertex hangs lower
  {
    const pos = capeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < -0.9 && i % 4 % 2 === 1) pos.setY(i, y - 0.14);
    }
    capeGeo.computeVertexNormals();
  }
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
  if (berserker) {
    // massive frost blade: a wide glowing edge with a heavy crossguard; it is kept out of the
    // flashing material list so the frost glow is never overwritten by hit flashes
    const frostMat = new THREE.MeshLambertMaterial({ color: 0x9fe6ff, emissive: 0x2a9cff, emissiveIntensity: 0.85 });
    const frostAcc = new GeoAccumulator();
    part(frostAcc, G.box(0.3, 0.08, 1.35), 0xbfefff, { z: 1.6 });
    part(frostAcc, G.box(0.06, 0.1, 1.3), 0xe8fbff, { x: 0.13, z: 1.6 });
    part(frostAcc, G.cone(0.15, 0.4, 4), 0xbfefff, { z: 2.5, rx: Math.PI / 2 });
    armR.add(new THREE.Mesh(frostAcc.build(), frostMat));
    part(swordAcc, G.box(0.7, 0.14, 0.12), C.gold, { z: 0.95 });
  } else {
    part(swordAcc, G.box(0.1, 0.025, 1.1), C.blade, { z: 1.5 });
    part(swordAcc, G.cone(0.05, 0.22, 4), C.blade, { z: 2.15, rx: Math.PI / 2 });
    part(swordAcc, G.box(0.02, 0.03, 0.9), C.bladeEdge, { x: 0.05, z: 1.5 });
  }
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
    crest,
    crestMesh,
    setDanger,
    height: 1.9,
  };
}
