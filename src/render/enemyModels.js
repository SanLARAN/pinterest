// Low-poly chibi enemy models. Each is one merged mesh with its origin at the feet.
import * as THREE from 'three';
import { GeoAccumulator, part, G } from './geo.js';
import { bitmapMaterial } from './bitmap.js';
import { ENEMY_DEFS } from '../sim/defs.js';

const WHITE = 0xffffff;
const INK = 0x1b1424;

function slime() {
  const d = ENEMY_DEFS.slime;
  const acc = new GeoAccumulator();
  part(acc, G.sphere(0.55, 12, 9), d.color, { y: 0.42, sy: 0.82 });
  part(acc, G.sphere(0.58, 12, 4, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), d.accent, { y: 0.1, sy: 0.35 });
  for (const s of [-1, 1]) {
    part(acc, G.sphere(0.085, 8, 6), INK, { x: s * 0.19, y: 0.5, z: 0.43, sz: 0.5 });
    part(acc, G.sphere(0.03, 5, 4), WHITE, { x: s * 0.21, y: 0.53, z: 0.49 });
  }
  part(acc, G.sphere(0.09, 6, 4), 0xff8fa3, { x: 0.3, y: 0.38, z: 0.36, sz: 0.4 });
  part(acc, G.sphere(0.09, 6, 4), 0xff8fa3, { x: -0.3, y: 0.38, z: 0.36, sz: 0.4 });
  part(acc, G.sphere(0.12, 6, 4), WHITE, { x: 0.27, y: 0.78, z: 0.22 });
  return acc;
}

function imp() {
  const d = ENEMY_DEFS.imp;
  const acc = new GeoAccumulator();
  part(acc, G.ico(0.36, 0), d.color, { y: 0.48, sy: 0.95 });
  for (const s of [-1, 1]) {
    part(acc, G.cone(0.08, 0.34, 4), d.accent, { x: s * 0.16, y: 0.84, z: -0.02, rz: -s * 0.35 });
    part(acc, G.sphere(0.065, 6, 4), d.accent, { x: s * 0.14, y: 0.52, z: 0.3 });
    part(acc, G.box(0.42, 0.04, 0.26), 0x7a4fd1, { x: s * 0.36, y: 0.5, z: -0.06, rz: -s * 0.45 });
  }
  part(acc, G.cyl(0.025, 0.02, 0.5, 4), d.color, { y: 0.36, z: -0.42, rx: 0.9 });
  return acc;
}

function archer() {
  const d = ENEMY_DEFS.archer;
  const acc = new GeoAccumulator();
  part(acc, G.sphere(0.22, 8, 6), d.color, { y: 1.02 });
  part(acc, G.box(0.22, 0.1, 0.18), d.color, { y: 0.84, z: 0.02 });
  part(acc, G.box(0.1, 0.07, 0.04), INK, { x: -0.07, y: 1.04, z: 0.2 });
  part(acc, G.box(0.1, 0.07, 0.04), INK, { x: 0.07, y: 1.04, z: 0.2 });
  part(acc, G.box(0.26, 0.42, 0.18), d.color, { y: 0.66 });
  for (const y of [0.58, 0.68, 0.78]) part(acc, G.box(0.3, 0.035, 0.2), d.accent, { y });
  part(acc, G.box(0.26, 0.14, 0.18), d.accent, { y: 0.4 });
  for (const s of [-1, 1]) {
    part(acc, G.box(0.1, 0.5, 0.1), d.color, { x: s * 0.09, y: 0.2 });
    part(acc, G.box(0.08, 0.4, 0.08), d.color, { x: s * 0.2, y: 0.68, rz: -s * 0.12 });
  }
  // bow held in front
  part(acc, G.torus(0.42, 0.025, 4, 10, Math.PI), 0x7a4a2e, { x: 0.3, y: 0.7, z: 0.22, ry: Math.PI / 2, rz: 0 });
  part(acc, G.box(0.01, 0.8, 0.01), WHITE, { x: 0.3, y: 0.7, z: 0.22 });
  return acc;
}

function brute() {
  const d = ENEMY_DEFS.brute;
  const acc = new GeoAccumulator();
  part(acc, G.ico(0.75, 1), d.color, { y: 0.92, sz: 0.9 });
  part(acc, G.sphere(0.42, 8, 6), 0xa9c27a, { y: 0.82, z: 0.44, sz: 0.7 });
  part(acc, G.ico(0.44, 0), 0x95b266, { y: 1.8 });
  for (const s of [-1, 1]) {
    part(acc, G.cone(0.1, 0.42, 4), 0xefe6cf, { x: s * 0.28, y: 2.08, rz: -s * 0.5 });
    part(acc, G.sphere(0.07, 5, 4), 0xff5a3c, { x: s * 0.15, y: 1.85, z: 0.37 });
    part(acc, G.cone(0.05, 0.18, 4), 0xefe6cf, { x: s * 0.17, y: 1.66, z: 0.36, rx: 0.5 });
    part(acc, G.sphere(0.3, 8, 6), 0x6d6a66, { x: s * 0.72, y: 1.25 });
  }
  part(acc, G.box(0.9, 0.3, 0.6), d.accent, { y: 0.32 });
  // club
  part(acc, G.cyl(0.07, 0.09, 1.3, 5), d.accent, { x: 0.8, y: 1.1, z: 0.2, rz: -0.5 });
  part(acc, G.ico(0.34, 0), 0x5b5550, { x: 1.14, y: 1.6, z: 0.2 });
  return acc;
}

function boss() {
  const d = ENEMY_DEFS.boss;
  const acc = new GeoAccumulator();
  part(acc, G.cone(0.95, 2.2, 8), d.color, { y: 1.1 });
  part(acc, G.sphere(0.45, 8, 6), 0x2a1d43, { y: 1.95 });
  part(acc, G.sphere(0.36, 8, 6), 0x2a1d43, { y: 2.38 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    part(acc, G.cone(0.07, 0.36, 4), 0xf2c14e, { x: Math.cos(a) * 0.3, y: 2.7, z: Math.sin(a) * 0.3 });
  }
  for (const s of [-1, 1]) {
    part(acc, G.sphere(0.07, 6, 4), d.accent, { x: s * 0.14, y: 2.4, z: 0.3 });
    part(acc, G.cone(0.3, 1.0, 4), d.color, { x: s * 0.58, y: 0.7, z: -0.4, rx: 0.4 });
  }
  // greatsword
  part(acc, G.box(0.12, 0.08, 1.8), 0x3a3a48, { x: 0.9, y: 1.6, z: 0.5, rz: -0.2 });
  part(acc, G.box(0.04, 0.09, 1.7), d.accent, { x: 0.95, y: 1.66, z: 0.5, rz: -0.2 });
  part(acc, G.box(0.42, 0.08, 0.08), 0xf2c14e, { x: 0.78, y: 1.6, z: 0.02, rz: -0.2 });
  return acc;
}

const BUILDERS = { slime, imp, archer, brute, boss };

// Red threat outline: an inverted hull. The body's own geometry is pushed out along its normals
// and drawn back-face only, so it reads as a solid red rim. One shared material for every foe.
const OUTLINE_MAT = new THREE.ShaderMaterial({
  uniforms: { uW: { value: 0.09 }, uColor: { value: new THREE.Color(0xff2a2a) } },
  vertexShader: 'uniform float uW; void main(){ vec3 p = position + normal * uW; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
  fragmentShader: 'uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor, 1.0); }',
  side: THREE.BackSide,
});

/**
 * Creates a fresh enemy model (own material so hit flashes don't affect others).
 * Returns { root, body, mat, ring, outline }. The outline is hidden until the foe is near the hero.
 */
export function createEnemyModel(type) {
  const root = new THREE.Group();
  const body = new THREE.Mesh(BUILDERS[type]().build(), bitmapMaterial());
  root.add(body);
  const outline = new THREE.Mesh(body.geometry, OUTLINE_MAT);
  outline.visible = false;
  outline.castShadow = false;
  outline.receiveShadow = false;
  body.add(outline);
  let ring = null;
  if (type === 'boss') {
    ring = new THREE.Mesh(
      new THREE.RingGeometry(1.45, 1.7, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x6ff3ff, transparent: true, opacity: 0.6, depthWrite: false }),
    );
    ring.position.y = 0.03;
    root.add(ring);
  }
  return { root, body, mat: body.material, ring, outline };
}
