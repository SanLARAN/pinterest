// The travelling merchant's stall: a striped canopy, a counter with goods, a lantern and a
// pulsing ground ring that marks it as interactive.
import * as THREE from 'three';
import { GeoAccumulator, G, part } from './geo.js';
import { bitmapMaterial } from './bitmap.js';

export function buildMerchant(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const acc = new GeoAccumulator();
  part(acc, G.box(2.4, 0.16, 2.0), 0x6b4a36, { y: 0.08 });              // stall floor
  part(acc, G.box(2.2, 0.9, 0.6), 0x8a5a3c, { y: 0.6, z: 0.5 });         // counter
  part(acc, G.box(2.3, 0.08, 0.7), 0xd9a441, { y: 1.1, z: 0.5 });        // counter top
  for (const [px, pz] of [[-1.1, -0.9], [1.1, -0.9], [-1.1, 0.9], [1.1, 0.9]]) {
    part(acc, G.cyl(0.07, 0.07, 2.4, 5), 0x3d2a2a, { x: px, y: 1.2, z: pz }); // posts
  }
  for (let i = 0; i < 4; i++) {                                          // striped canopy
    part(acc, G.box(0.6, 0.14, 2.2), i % 2 ? 0xf6c24f : 0xd2433a, { x: -1.05 + i * 0.7, y: 2.45, z: 0 });
  }
  part(acc, G.box(0.25, 0.3, 0.25), 0x43d3c1, { x: -0.6, y: 1.35, z: 0.5 }); // goods
  part(acc, G.box(0.22, 0.22, 0.22), 0x8c5cf0, { x: 0.1, y: 1.3, z: 0.5 });
  part(acc, G.box(0.3, 0.2, 0.3), 0xe5484d, { x: 0.7, y: 1.32, z: 0.5 });
  part(acc, G.cyl(0.28, 0.34, 0.9, 6), 0x3b5a4a, { x: 0, y: 0.85, z: -0.6 }); // merchant body
  part(acc, G.sphere(0.24, 6, 5), 0xf2d2b0, { x: 0, y: 1.6, z: -0.6 });      // head
  part(acc, G.cone(0.3, 0.6, 6), 0x6a2a3f, { x: 0, y: 1.98, z: -0.6 });      // hat
  const mesh = new THREE.Mesh(acc.build(), bitmapMaterial());
  group.add(mesh);

  const lanternGeo = new THREE.SphereGeometry(0.16, 8, 6);
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffc27a });
  const lantern = new THREE.Mesh(lanternGeo, lanternMat);
  lantern.position.set(1.45, 2.05, 0.9);
  group.add(lantern);

  const ringGeo = new THREE.RingGeometry(1.7, 2.0, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf6c24f, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.06;
  group.add(ring);

  const update = (t) => {
    lantern.scale.setScalar(1 + Math.sin(t * 6) * 0.12);
    const p = (t * 0.6) % 1;
    ring.scale.setScalar(1 + p * 0.3);
    ringMat.opacity = 0.55 * (1 - p);
  };

  const dispose = () => {
    mesh.geometry.dispose();
    mesh.material.dispose();
    lanternGeo.dispose();
    lanternMat.dispose();
    ringGeo.dispose();
    ringMat.dispose();
  };

  return { group, update, dispose };
}
