// The steed for the berserker's Summon Steed: an ash-grey horse with a frost-blue mane.
import * as THREE from 'three';
import { GeoAccumulator, part, G } from './geo.js';
import { bitmapMaterial } from './bitmap.js';

const COAT = 0x4d5468; // dark slate, so the steed reads against the grey stone
const MANE = 0x7fd8ff;
const SADDLE = 0x7a4a2e;
const TRIM = 0xf2c14e;
const HOOF = 0x2a2536;
const EYE = 0x231a2e;

export function createSteedModel() {
  const root = new THREE.Group();
  const mat = bitmapMaterial();

  const body = new GeoAccumulator();
  part(body, G.box(0.7, 0.5, 1.3), COAT, { y: 0.95 }); // barrel
  part(body, G.box(0.46, 0.14, 0.9), SADDLE, { y: 1.22, z: -0.05 }); // saddle
  part(body, G.box(0.14, 0.1, 0.4), TRIM, { y: 1.3, z: -0.05 }); // saddle trim
  part(body, G.box(0.36, 0.56, 0.32), COAT, { y: 1.3, z: 0.62, rx: -0.5 }); // neck
  part(body, G.box(0.34, 0.34, 0.6), COAT, { y: 1.5, z: 0.95, rx: -0.15 }); // head
  part(body, G.box(0.22, 0.2, 0.3), COAT, { y: 1.38, z: 1.2 }); // muzzle
  for (const s of [-1, 1]) part(body, G.sphere(0.05, 6, 4), EYE, { x: s * 0.12, y: 1.56, z: 1.2 });
  part(body, G.box(0.1, 0.22, 0.62), MANE, { y: 1.5, z: 0.62 }); // frost mane along the neck
  part(body, G.cone(0.12, 0.6, 5), MANE, { y: 1.0, z: -0.8, rx: 1.1 }); // tail
  root.add(new THREE.Mesh(body.build(), mat));

  // four legs, each on its own pivot so the gallop can swing them
  const legs = [];
  for (const [x, z] of [[-0.2, 0.5], [0.2, 0.5], [-0.2, -0.5], [0.2, -0.5]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.7, z);
    const acc = new GeoAccumulator();
    part(acc, G.box(0.16, 0.7, 0.16), COAT, { y: -0.35 });
    part(acc, G.box(0.18, 0.1, 0.2), HOOF, { y: -0.72 });
    pivot.add(new THREE.Mesh(acc.build(), mat));
    root.add(pivot);
    legs.push(pivot);
  }
  return { root, legs };
}
