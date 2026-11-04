// (4.2) The road film's car is the host's own, out of the garage: the УАЗ or the Trueno (a convertible now), in
// the host's two colours, on their rims, behind their tint, with their stickers — the same car the room watched
// in the lobby, not a khaki stand-in. Built from the garage's models (ui/garageSet.js CAR_MODELS) and drawn in
// the world's material with the paint and the stickers let into it (render/carPaint.js).
//
// The group: a root the film moves along the road (y = the ground, nose −x, the wheels' axles on it), a body
// on a pivot near its centre of mass (it leans in the turns and dips when it brakes), and inside it everything
// that rides on the springs: the body, the steering wheel, the pop-ups, the glass, the stickers.
import * as THREE from 'three';
import { CAR_MODELS, buildSteering, CARP, TRUENO_P } from '../ui/garageSet.js';
import { SEATS as UAZ_SEATS, geometryOf } from './uaz.js';
import { cleanLook } from './carLook.js';
import { carWorldMaterial, stickerTexture, decalGeometry, tintMaterial } from '../render/carPaint.js';

// how the film seats the crew in each car: hips (car-local), the spot outside where they get out, how they sit.
// cam: how much lower the cabin is than the УАЗ's (the close shots come down with it). over: no door of its own
// (the Trueno has two): out over the side, the way you get out of a convertible when nobody is looking.
export const FILM_CARS = {
  uaz: {
    seats: UAZ_SEATS.map((s) => ({ hip: s.hip, door: s.door })),
    pose: null, cam: 0, wheelR: CARP.wheelR, pivotY: 0.75,
  },
  trueno: {
    seats: [
      { hip: [-0.02, 0.5, 0.36], door: [-0.05, 0, 1.4] },
      { hip: [-0.02, 0.5, -0.36], door: [-0.05, 0, -1.4] },
      { hip: [0.98, 0.53, 0.34], door: [1.05, 0, 1.45], over: true },
      { hip: [0.98, 0.53, -0.34], door: [1.05, 0, -1.45], over: true },
    ],
    pose: { front: { thigh: -1.22, knee: 0.55, recline: -0.28 }, rear: { thigh: -1.45, knee: 1.5, recline: -0.12 } },
    cam: -0.42, wheelR: TRUENO_P.wheelR, pivotY: 0.5,
  },
};

const X = new THREE.Vector3(1, 0, 0);

export function buildFilmCar(fit) {
  const id = CAR_MODELS[fit?.car] ? fit.car : 'uaz';
  const M = CAR_MODELS[id], F = FILM_CARS[id];
  const L = cleanLook(fit?.ct);
  const cc = Array.isArray(fit?.cc) && fit.cc.length === 2 ? fit.cc : ['#4e6b3c', '#8a6a48'];
  const mat = carWorldMaterial(cc);
  const mats = [mat];
  const root = new THREE.Group();
  const pivot = new THREE.Group(); // the springs: the body leans about here
  pivot.position.y = F.pivotY;
  root.add(pivot);
  const body = new THREE.Group();
  body.position.y = -F.pivotY;
  pivot.add(body);
  const add = (arr, parent, m = mat) => {
    const mesh = new THREE.Mesh(geometryOf(arr), m);
    mesh.frustumCulled = false;
    parent.add(mesh);
    return mesh;
  };
  add(M.body(L), body);
  const st = new THREE.Group();
  st.position.set(...M.P.wheelC);
  st.quaternion.setFromUnitVectors(X, new THREE.Vector3(...M.P.wheelN).normalize());
  body.add(st);
  const wheel = add(buildSteering(M.P.wheelRad), st);
  const pods = [];
  if (M.pod) {
    for (const sz of [-1, 1]) {
      const g = new THREE.Group();
      g.position.set(M.P.pod.x, M.P.pod.y, sz * M.P.pod.z);
      body.add(g);
      add(M.pod(), g);
      pods.push(g);
    }
  }
  // the windscreen: up close the plain glass read as a white board (3.1n), so only a tinted one is drawn
  if (L.tint > 0) {
    const gm = tintMaterial(L.tint);
    mats.push(gm);
    add(M.glass(), body, gm).renderOrder = 4;
  }
  const dg = decalGeometry(M, L);
  if (dg) {
    const dm = carWorldMaterial(cc, stickerTexture(L));
    mats.push(dm);
    const m = new THREE.Mesh(dg, dm);
    m.frustumCulled = false;
    m.renderOrder = 1;
    body.add(m);
  }
  const wheels = [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => {
    const p = new THREE.Object3D(); // the axle is along the car's z: spin the pivot (and steer the front ones)
    p.position.set(sx * M.P.wheelX, M.P.wheelR, sz * M.P.wheelZ);
    root.add(p);
    add(M.wheels(i, L), p);
    return p;
  });
  root.userData = { id, M, F, look: L, pivot, body, wheels, pods, steer: wheel, mats, filmCar: true, crewCar: true };
  return root;
}

export function disposeFilmCar(car) {
  if (!car) return;
  car.removeFromParent();
  car.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  for (const m of car.userData.mats || []) m.dispose();
}
