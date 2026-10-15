// Chibi low-poly knight: big head, small body, plume, cape, shield and sword.
// The berserker variant is bare-headed with long ash-grey hair that moves in the wind, no shield,
// and a wavy blade of ice.
import * as THREE from 'three';
import { GeoAccumulator, part, G } from './geo.js';
import { bitmapMaterial } from './bitmap.js';
import { COLORS } from './palette.js';

const HIP = 0.42;
const C = COLORS.hero;
const ASH_LIGHT = 0xc4bfd0;
const ASH_DARK = 0x8d8799;
const ICE = 0xbfeaff;
const ICE_LIGHT = 0xe8fbff;

// hair: strands hang from the crown; each strand is a chain of segments (lengths in world units)
const STRAND_SEGMENTS = [0.4, 0.36, 0.3];
const STRAND_WIDTH = [0.2, 0.17, 0.13];
const STRANDS = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]; // x positions across the back of the head

/**
 * variant 'knight' is Sir Pip. variant 'berserker' is bare-headed with long ash-grey hair
 * (see hair.update), darkens the cape, drops the shield and gives him a frost blade.
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
  // faceted head (low-poly); the knight also wears a helmet with a gem crest
  part(body, G.ico(0.5, 1), C.skin, { y: u(1.3) });
  if (!berserker) {
    part(body, G.ico(0.57, 1), C.steel, { y: u(1.5), sy: 0.8 });
    part(body, G.box(0.62, 0.07, 0.5), C.gold, { y: u(1.44), z: 0.02 });
    part(body, G.ico(0.1, 0), C.gold, { y: u(1.72), z: 0.0 });
    part(body, G.ico(0.07, 0), C.glint, { y: u(1.98), z: 0.0 });
  } else {
    // the berserker's hair: a cap over the crown that the strands hang from
    part(body, G.ico(0.53, 1), ASH_LIGHT, { y: u(1.5), z: -0.06, sy: 0.6 });
  }
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

  // ---- hair (berserker): strands hang from the crown, one pivot per segment --------
  let hair = null;
  if (berserker) {
    const hairRoot = new THREE.Group();
    hairRoot.position.set(0, u(1.5), -0.18);
    upper.add(hairRoot);
    const strands = STRANDS.map((x, k) => {
      const chain = [];
      let parent = hairRoot;
      let px = x;
      let py = 0;
      let pz = -0.02 * Math.abs(x) * 4; // the outer strands fall a little further back
      STRAND_SEGMENTS.forEach((len, j) => {
        const pivot = new THREE.Group();
        pivot.position.set(px, py, pz);
        parent.add(pivot);
        const acc = new GeoAccumulator();
        const color = (k + j) % 2 === 0 ? ASH_LIGHT : ASH_DARK;
        part(acc, G.box(STRAND_WIDTH[j], len, 0.09), color, { y: -len / 2 });
        pivot.add(new THREE.Mesh(acc.build(), bodyMat));
        chain.push(pivot);
        parent = pivot;
        px = 0;
        py = -len;
        pz = 0;
      });
      return { chain, state: STRAND_SEGMENTS.map(() => ({ x: 0, z: 0 })), phase: k * 0.9 };
    });
    let t = 0;
    /**
     * Moves the hair: it trails back when the knight runs, sways sideways when he moves
     * sideways, and a slow wind gust ripples through the strands. vx, vz are the knight's
     * world velocity and facing his model yaw. Each segment lags behind the one above.
     */
    const update = (dt, vx, vz, facing) => {
      t += dt;
      const sin = Math.sin(facing);
      const cos = Math.cos(facing);
      const fwd = vx * sin + vz * cos; // velocity along the knight's facing
      const side = vx * cos - vz * sin; // velocity to his right
      const lean = Math.max(-0.2, Math.min(0.6, fwd * 0.06));
      const drift = Math.max(-0.25, Math.min(0.25, -side * 0.05));
      const k = Math.min(1, dt * 9);
      for (const s of strands) {
        for (let j = 0; j < s.chain.length; j++) {
          const flow = 1 + j * 0.35; // lower segments swing further
          const gust = 0.16 * Math.sin(t * 1.7 + s.phase + j * 0.7) + 0.08 * Math.sin(t * 3.9 + s.phase * 1.7);
          const tx = (lean + 0.03) * flow;
          const tz = (drift + gust) * flow;
          const st = s.state[j];
          st.x += (tx - st.x) * k;
          st.z += (tz - st.z) * k;
          s.chain[j].rotation.x = st.x;
          s.chain[j].rotation.z = st.z;
        }
      }
    };
    hair = { update };
  }

  // ---- crest (the plume): its own material and pivot, so it can burn red when the knight is hurt
  const CREST_Y = u(1.8);
  const crestAcc = new GeoAccumulator();
  part(crestAcc, G.cone(0.1, 0.5, 5), C.plume, { y: u(1.95) - CREST_Y, z: -0.06, rx: -0.2 });
  const crestMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: 0xff2a14, emissiveIntensity: 0 });
  const crestMesh = new THREE.Mesh(crestAcc.build(), crestMat);
  crestMesh.visible = !berserker; // the plume is part of the knight's helmet
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
    // a wavy blade of ice with shards along its edges and a glowing core. It is kept out of the
    // flashing material list so the frost glow is never overwritten by hit flashes
    const iceMat = new THREE.MeshLambertMaterial({ color: ICE, emissive: 0x2a7fd0, emissiveIntensity: 0.45, transparent: true, opacity: 0.92 });
    const ice = new GeoAccumulator();
    const N = 7;
    const z0 = 0.95;
    const z1 = 2.7;
    const xs = [];
    const zs = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      // one full wave that fades toward the tip, plus a small jag on every other joint
      xs.push(0.14 * Math.sin(s * Math.PI * 2) * (1 - 0.3 * s) + (i % 2 ? 0.03 : -0.03));
      zs.push(z0 + (z1 - z0) * s);
    }
    for (let i = 0; i < N; i++) {
      const dx = xs[i + 1] - xs[i];
      const dz = zs[i + 1] - zs[i];
      const len = Math.hypot(dx, dz);
      const ry = Math.atan2(dx, dz);
      const w = 0.3 * (1 - 0.5 * (i / N));
      const mx = (xs[i] + xs[i + 1]) / 2;
      const mz = (zs[i] + zs[i + 1]) / 2;
      part(ice, G.box(w, 0.07, len + 0.02), ICE, { x: mx, z: mz, ry });
      if (i % 2 === 0) {
        const side = i % 4 === 0 ? 1 : -1;
        part(ice, G.cone(0.05, 0.22, 4), ICE_LIGHT, { x: mx + side * w * 0.6, z: mz, rz: -side * 0.7, ry });
      }
    }
    part(ice, G.cone(0.13, 0.42, 4), ICE_LIGHT, { x: xs[N], z: zs[N] + 0.21, rx: Math.PI / 2, ry: Math.atan2(xs[N] - xs[N - 1], zs[N] - zs[N - 1]) });
    armR.add(new THREE.Mesh(ice.build(), iceMat));
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
  if (!berserker) {
    // the knight's shield
    const shieldAcc = new GeoAccumulator();
    part(shieldAcc, G.box(0.18, 0.18, 0.5), C.tunic, { z: 0.25 });
    part(shieldAcc, G.sphere(0.11, 8, 6), C.skin, { z: 0.52 });
    part(shieldAcc, G.cyl(0.36, 0.36, 0.08, 14), C.shield, { z: 0.5, rx: Math.PI / 2 });
    part(shieldAcc, G.cyl(0.38, 0.38, 0.04, 14), C.gold, { z: 0.47, rx: Math.PI / 2 });
    part(shieldAcc, G.sphere(0.1, 6, 4), C.gold, { z: 0.6 });
    part(shieldAcc, G.box(0.07, 0.5, 0.02), C.gold, { z: 0.6 });
    part(shieldAcc, G.box(0.36, 0.07, 0.02), C.gold, { z: 0.6 });
    armL.add(new THREE.Mesh(shieldAcc.build(), bodyMat));
  } else {
    // the berserker's empty hand: forearm and fist, no shield
    const handAcc = new GeoAccumulator();
    part(handAcc, G.box(0.18, 0.18, 0.5), C.tunic, { z: 0.25 });
    part(handAcc, G.sphere(0.11, 8, 6), C.skin, { z: 0.52 });
    armL.add(new THREE.Mesh(handAcc.build(), bodyMat));
  }

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
    hair,
    setDanger,
    height: 1.9,
  };
}
