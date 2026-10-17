// Monsters: procedural low-poly rigs + noise-driven AI.
// They are never rendered directly — only as echo afterimages when a wave reaches them.
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { CFG } from '../core/config.js';
import { clamp, angleDiff, lerp } from '../core/rng.js';

// ---------------- rig helpers ----------------
function makeRig(key) {
  const root = new THREE.Object3D();
  return { key, root, nodes: {}, parts: [] };
}
function node(rig, name, parent, x, y, z) {
  const n = new THREE.Object3D();
  n.position.set(x, y, z);
  (parent || rig.root).add(n);
  rig.nodes[name] = n;
  n.userData.rest = n.position.clone();
  return n;
}
const _b = new MeshBuilder(512);
function part(rig, n, build) {
  _b.reset();
  build(_b);
  rig.parts.push({ node: n, arr: _b.toArrays() });
}

// ---------------- Listener: tall antlered thing ----------------
export function buildListener() {
  const R = makeRig('listener');
  const N = (name, parent, x, y, z) => node(R, name, parent, x, y, z);
  const hips = N('hips', null, 0, 1.6, 0);
  part(R, hips, (b) => { b.place(0, -0.04, 0); b.box(0.42, 0.22, 0.27, KIND.FLESH); });
  const spine = N('spine', hips, 0, 0.06, 0);
  part(R, spine, (b) => {
    b.identity();
    b.taper(0.32, 0.22, 0.52, 0.3, 0.98, KIND.FLESH, 0.06);
    // protruding vertebrae
    for (let k = 0; k < 6; k++) {
      b.place(0, 0.12 + k * 0.15, -0.13 - k * 0.006, -1.2, 0, 0);
      b.cone(4, 0.035, 0.13, KIND.BONE);
    }
    // ribs
    for (let k = 0; k < 4; k++) {
      for (const s of [-1, 1]) {
        b.identity();
        b.limb([s * 0.05, 0.48 + k * 0.11, 0.15], [s * 0.27, 0.42 + k * 0.11, 0.05], 0.018, 0.012, KIND.BONE, 3);
      }
    }
  });
  const chest = N('chest', spine, 0, 0.98, 0.06);
  const neck = N('neck', chest, 0, 0.0, 0.04);
  part(R, neck, (b) => { b.identity(); b.limb([0, 0, 0], [0, 0.3, 0.14], 0.075, 0.05, KIND.FLESH); });
  const head = N('head', neck, 0, 0.3, 0.14);
  part(R, head, (b) => {
    b.place(0, 0.0, -0.06, Math.PI / 2 + 0.2, 0, 0);
    b.taper(0.25, 0.26, 0.08, 0.11, 0.56, KIND.BONE);
    // cranium
    b.place(0, 0.08, -0.06, 0, 0, 0);
    b.rock(0.17, mulberry(3), KIND.BONE, 0.1, 1.0);
    // antlers
    b.identity();
    for (const s of [-1, 1]) {
      const A = [s * 0.08, 0.14, -0.08], B = [s * 0.3, 0.52, -0.2], C = [s * 0.42, 0.95, -0.12], D = [s * 0.62, 1.25, -0.25];
      b.limb(A, B, 0.035, 0.028, KIND.BONE, 4);
      b.limb(B, C, 0.028, 0.02, KIND.BONE, 4);
      b.limb(C, D, 0.02, 0.008, KIND.BONE, 3);
      b.limb(B, [s * 0.18, 0.78, 0.12], 0.02, 0.006, KIND.BONE, 3);
      b.limb(C, [s * 0.25, 1.22, 0.02], 0.018, 0.005, KIND.BONE, 3);
      b.limb(C, [s * 0.68, 0.98, 0.05], 0.016, 0.005, KIND.BONE, 3);
      b.limb([s * 0.36, 0.7, -0.17], [s * 0.6, 0.66, -0.36], 0.016, 0.005, KIND.BONE, 3);
    }
    // eyes: deep and burning
    b.place(-0.085, 0.07, 0.07); b.octa(0.032, 0.03, KIND.EYE);
    b.place(0.085, 0.07, 0.07); b.octa(0.032, 0.03, KIND.EYE);
  });
  const jaw = N('jaw', head, 0, -0.06, -0.02);
  part(R, jaw, (b) => {
    b.place(0, 0, 0, Math.PI / 2 + 0.35, 0, 0);
    b.taper(0.19, 0.08, 0.06, 0.04, 0.46, KIND.BONE);
    for (let k = 0; k < 5; k++) {
      for (const s of [-1, 1]) {
        b.place(s * (0.07 - k * 0.01), 0.02 - k * 0.03, 0.1 + k * 0.07, 0, 0, 0);
        b.cone(3, 0.014, 0.06, KIND.BONE);
      }
    }
  });
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    const sh = N('shoulder' + side, chest, s * 0.27, -0.04, 0);
    part(R, sh, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.98, 0], 0.06, 0.045, KIND.FLESH); });
    const el = N('elbow' + side, sh, 0, -0.98, 0);
    part(R, el, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.98, 0], 0.045, 0.03, KIND.FLESH); });
    const hand = N('hand' + side, el, 0, -0.98, 0);
    part(R, hand, (b) => {
      b.identity();
      for (let f = 0; f < 4; f++) {
        const a = (f - 1.5) * 0.12;
        b.limb([a * 0.3, 0, 0.02], [a + s * 0.03, -0.42, 0.08 + Math.abs(a) * 0.2], 0.014, 0.004, KIND.BONE, 3);
      }
    });
    const th = N('thigh' + side, hips, s * 0.14, -0.08, 0);
    part(R, th, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.8, 0.12], 0.08, 0.05, KIND.FLESH); });
    const kn = N('knee' + side, th, 0, -0.8, 0.12);
    part(R, kn, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.78, -0.2], 0.05, 0.035, KIND.FLESH); });
    const ft = N('foot' + side, kn, 0, -0.78, -0.2);
    part(R, ft, (b) => {
      b.identity();
      b.limb([0, 0, 0], [-0.05, -0.02, 0.25], 0.03, 0.01, KIND.BONE, 3);
      b.limb([0, 0, 0], [0.05, -0.02, 0.24], 0.03, 0.01, KIND.BONE, 3);
    });
  }
  return R;
}

// ---------------- Crawler: low, fast, many limbs ----------------
export function buildCrawler() {
  const R = makeRig('crawler');
  const N = (name, parent, x, y, z) => node(R, name, parent, x, y, z);
  const body = N('body', null, 0, 0.62, 0);
  part(R, body, (b) => {
    b.place(0, 0, -0.6, Math.PI / 2, 0, 0);
    b.taper(0.34, 0.26, 0.46, 0.32, 1.3, KIND.FLESH, 0.02);
    for (let k = 0; k < 7; k++) {
      b.place(0, 0.17, -0.5 + k * 0.17, -0.5, 0, 0);
      b.cone(4, 0.04, 0.18, KIND.BONE);
    }
  });
  const head = N('head', body, 0, 0.06, 0.72);
  part(R, head, (b) => {
    b.place(0, 0.02, -0.05, Math.PI / 2 - 0.1, 0, 0);
    b.taper(0.3, 0.24, 0.14, 0.12, 0.42, KIND.BONE);
    for (let e = 0; e < 4; e++) {
      b.place((e % 2 ? 1 : -1) * (0.05 + (e > 1 ? 0.06 : 0)), 0.09 - (e > 1 ? 0.03 : 0), 0.16 + (e > 1 ? -0.05 : 0));
      b.octa(0.022, 0.022, KIND.EYE);
    }
  });
  const jaw = N('jaw', head, 0, -0.07, 0.0);
  part(R, jaw, (b) => {
    b.place(0, 0, -0.02, Math.PI / 2 + 0.25, 0, 0);
    b.taper(0.26, 0.06, 0.1, 0.04, 0.38, KIND.BONE);
    for (let k = 0; k < 6; k++) {
      for (const s of [-1, 1]) {
        b.place(s * (0.1 - k * 0.012), 0.02 - k * 0.02, 0.06 + k * 0.05, 0, 0, 0);
        b.cone(3, 0.012, 0.05, KIND.BONE);
      }
    }
  });
  const legs = [
    ['FL', -0.2, 0.42, 1], ['FR', 0.2, 0.42, 1],
    ['ML', -0.22, -0.05, 0], ['MR', 0.22, -0.05, 0],
    ['BL', -0.2, -0.5, -1], ['BR', 0.2, -0.5, -1],
  ];
  for (const [name, x, z, fb] of legs) {
    const s = x < 0 ? -1 : 1;
    const hip = N('hip' + name, body, x, 0, z);
    const kx = s * 0.55, ky = 0.42, kz = fb * 0.25;
    part(R, hip, (b) => { b.identity(); b.limb([0, 0, 0], [kx, ky, kz], 0.05, 0.035, KIND.FLESH); });
    const kn = N('kn' + name, hip, kx, ky, kz);
    part(R, kn, (b) => { b.identity(); b.limb([0, 0, 0], [s * 0.32, -1.02, fb * 0.2], 0.035, 0.012, KIND.BONE, 4); });
  }
  return R;
}

// ---------------- Shade: the thing that is only there when you look ----------------
export function buildShade() {
  const R = makeRig('shade');
  const N = (name, parent, x, y, z) => node(R, name, parent, x, y, z);
  const torso = N('torso', null, 0, 1.25, 0);
  part(R, torso, (b) => {
    b.identity();
    b.taper(0.3, 0.18, 0.42, 0.22, 0.95, KIND.FLESH);
    b.limb([-0.1, 0, 0], [-0.13, -1.25, 0.02], 0.06, 0.035, KIND.FLESH);
    b.limb([0.1, 0, 0], [0.12, -1.25, -0.03], 0.06, 0.035, KIND.FLESH);
    b.limb([-0.22, 0.9, 0], [-0.32, -0.3, 0.08], 0.04, 0.025, KIND.FLESH);
    b.limb([0.22, 0.9, 0], [0.3, -0.35, 0.1], 0.04, 0.025, KIND.FLESH);
    b.limb([-0.32, -0.3, 0.08], [-0.34, -0.62, 0.12], 0.012, 0.004, KIND.BONE, 3);
    b.limb([0.3, -0.35, 0.1], [0.33, -0.66, 0.14], 0.012, 0.004, KIND.BONE, 3);
  });
  const head = N('head', torso, 0, 1.12, 0.02);
  part(R, head, (b) => {
    b.identity();
    b.octa(0.13, 0.2, KIND.BONE);
    // hair curtain
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      if (Math.sin(a) > 0.6) continue;
      b.limb([Math.cos(a) * 0.1, 0.12, Math.sin(a) * 0.1 - 0.02], [Math.cos(a) * 0.17, -0.65 - (i % 3) * 0.12, Math.sin(a) * 0.15 - 0.04], 0.012, 0.003, KIND.FLESH, 3);
    }
    b.place(-0.045, 0.02, 0.11); b.octa(0.018, 0.012, KIND.EYE);
    b.place(0.045, 0.02, 0.11); b.octa(0.018, 0.012, KIND.EYE);
  });
  return R;
}

// ---------------- Watcher: too tall, too thin, no face ----------------
export function buildWatcher() {
  const R = makeRig('watcher');
  const N = (name, parent, x, y, z) => node(R, name, parent, x, y, z);
  const hips = N('hips', null, 0, 1.8, 0);
  part(R, hips, (b) => { b.place(0, -0.03, 0); b.box(0.3, 0.16, 0.18, KIND.FLESH); });
  const spine = N('spine', hips, 0, 0.05, 0);
  part(R, spine, (b) => {
    b.identity();
    b.taper(0.2, 0.13, 0.32, 0.17, 0.9, KIND.FLESH, -0.04);
    for (let k = 0; k < 5; k++) {
      for (const s of [-1, 1]) {
        b.identity();
        b.limb([s * 0.03, 0.4 + k * 0.1, 0.085], [s * 0.16, 0.36 + k * 0.1, 0.02], 0.012, 0.008, KIND.BONE, 3);
      }
    }
  });
  const chest = N('chest', spine, 0, 0.9, -0.04);
  const neck = N('neck', chest, 0, 0, 0.02);
  part(R, neck, (b) => { b.identity(); b.limb([0, 0, 0], [0, 0.44, 0.07], 0.045, 0.034, KIND.FLESH); });
  const head = N('head', neck, 0, 0.44, 0.07);
  part(R, head, (b) => {
    // a long smooth skull with nothing on the front of it
    b.place(0, 0.17, -0.02); b.octa(0.125, 0.27, KIND.FLESH);
    b.place(0, 0.3, -0.05); b.octa(0.09, 0.16, KIND.BONE);
  });
  // the face is two plates that can open like a split seam, lined with teeth
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    const f = N('face' + side, head, s * 0.004, 0.17, 0.09);
    part(R, f, (b) => {
      b.place(s * 0.055, 0, 0.0); b.box(0.1, 0.4, 0.035, KIND.BONE);
      for (let k = 0; k < 6; k++) {
        b.place(s * 0.008, 0.15 - k * 0.06, 0.012, 0, 0, s * -Math.PI / 2);
        b.cone(3, 0.012, 0.05, KIND.BONE);
      }
    });
    const sh = N('shoulder' + side, chest, s * 0.2, -0.03, 0);
    part(R, sh, (b) => { b.identity(); b.limb([0, 0, 0], [0, -1.05, 0], 0.045, 0.032, KIND.FLESH); });
    const el = N('elbow' + side, sh, 0, -1.05, 0);
    part(R, el, (b) => { b.identity(); b.limb([0, 0, 0], [0, -1.05, 0], 0.032, 0.022, KIND.FLESH); });
    const hand = N('hand' + side, el, 0, -1.05, 0);
    part(R, hand, (b) => {
      b.identity();
      for (let k = 0; k < 3; k++) {
        const a = (k - 1) * 0.07;
        b.limb([a * 0.4, 0, 0.01], [a + s * 0.02, -0.5, 0.05], 0.012, 0.003, KIND.BONE, 3);
      }
    });
    const th = N('thigh' + side, hips, s * 0.1, -0.06, 0);
    part(R, th, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.9, 0.04], 0.05, 0.035, KIND.FLESH); });
    const kn = N('knee' + side, th, 0, -0.9, 0.04);
    part(R, kn, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.86, -0.06], 0.035, 0.022, KIND.FLESH); });
    const ft = N('foot' + side, kn, 0, -0.86, -0.06);
    part(R, ft, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.02, 0.24], 0.022, 0.008, KIND.BONE, 3); });
  }
  return R;
}

// ---------------- Howler: a hunched brute that walks on its knuckles ----------------
export function buildHowler() {
  const R = makeRig('howler');
  const N = (name, parent, x, y, z) => node(R, name, parent, x, y, z);
  const pelvis = N('pelvis', null, 0, 1.05, -0.45);
  part(R, pelvis, (b) => { b.place(0, 0, 0); b.box(0.62, 0.42, 0.5, KIND.FLESH); });
  const chest = N('chest', pelvis, 0, 0.12, 0.15);
  part(R, chest, (b) => {
    b.place(0, 0, 0, Math.PI / 2 - 0.42, 0, 0);
    b.taper(0.66, 0.52, 1.08, 0.78, 1.05, KIND.FLESH, 0.08);
    // ridge of bone spikes down the back
    for (let k = 0; k < 6; k++) {
      b.place(0, 0.36 + k * 0.05, 0.05 + k * 0.17, -0.9, 0, 0);
      b.cone(4, 0.06, 0.26 - k * 0.02, KIND.BONE);
    }
  });
  const neck = N('neck', chest, 0, 0.5, 0.92);
  part(R, neck, (b) => { b.identity(); b.limb([0, -0.05, -0.1], [0, 0.02, 0.18], 0.17, 0.14, KIND.FLESH); });
  const head = N('head', neck, 0, 0.02, 0.22);
  part(R, head, (b) => {
    b.place(0, 0.02, -0.04, Math.PI / 2, 0, 0);
    b.taper(0.38, 0.3, 0.26, 0.18, 0.4, KIND.BONE);
    b.place(0, 0.14, 0.02); b.rock(0.17, mulberry(11), KIND.BONE, 0.2, 0.7);
    for (let e = 0; e < 4; e++) {
      b.place((e % 2 ? 1 : -1) * (0.08 + (e > 1 ? 0.05 : 0)), 0.1 - (e > 1 ? 0.04 : 0), 0.24 - (e > 1 ? 0.05 : 0));
      b.octa(0.02, 0.018, KIND.EYE);
    }
  });
  const jaw = N('jaw', head, 0, -0.1, -0.02);
  part(R, jaw, (b) => {
    b.place(0, 0, 0, Math.PI / 2 + 0.15, 0, 0);
    b.taper(0.36, 0.12, 0.26, 0.07, 0.5, KIND.BONE);
    for (let k = 0; k < 6; k++) {
      for (const s of [-1, 1]) {
        b.place(s * (0.14 - k * 0.015), 0.03, 0.08 + k * 0.065, 0, 0, 0);
        b.cone(3, 0.018, 0.08, KIND.BONE);
      }
    }
  });
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    const sh = N('shoulder' + side, chest, s * 0.52, 0.36, 0.78);
    part(R, sh, (b) => { b.identity(); b.limb([0, 0, 0], [s * 0.08, -0.82, 0.12], 0.13, 0.09, KIND.FLESH, 5); });
    const el = N('elbow' + side, sh, s * 0.08, -0.82, 0.12);
    part(R, el, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.78, 0.06], 0.09, 0.08, KIND.FLESH, 5); });
    const hand = N('hand' + side, el, 0, -0.78, 0.06);
    part(R, hand, (b) => {
      b.identity();
      for (let k = 0; k < 3; k++) {
        const a = (k - 1) * 0.07;
        b.limb([a, 0, 0], [a * 1.4, -0.12, 0.2], 0.035, 0.012, KIND.BONE, 3);
      }
    });
    const th = N('thigh' + side, pelvis, s * 0.28, -0.12, 0);
    part(R, th, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.5, 0.18], 0.14, 0.1, KIND.FLESH, 5); });
    const kn = N('knee' + side, th, 0, -0.5, 0.18);
    part(R, kn, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.46, -0.16], 0.1, 0.07, KIND.FLESH, 5); });
    const ft = N('foot' + side, kn, 0, -0.46, -0.16);
    part(R, ft, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.02, 0.3], 0.07, 0.03, KIND.BONE, 4); });
  }
  return R;
}

function mulberry(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------- animation ----------------
function animListener(m, dt, t) {
  const n = m.rig.nodes;
  const sp = m.speedCur;
  const amp = clamp(sp / 2.0, 0, 1.1);
  const hunt = m.state === 'hunt';
  const p = m.phase;
  const s = Math.sin(p);
  n.thighL.rotation.x = s * 0.6 * amp - (hunt ? 0.25 : 0);
  n.thighR.rotation.x = -s * 0.6 * amp - (hunt ? 0.25 : 0);
  n.kneeL.rotation.x = Math.max(0, -s) * 0.8 * amp + 0.08;
  n.kneeR.rotation.x = Math.max(0, s) * 0.8 * amp + 0.08;
  const reach = hunt ? -1.15 : m.state === 'search' ? -0.35 : 0.05;
  n.shoulderL.rotation.x = -s * 0.4 * amp + reach + Math.sin(t * 1.3) * 0.04;
  n.shoulderR.rotation.x = s * 0.4 * amp + reach + Math.sin(t * 1.1 + 1) * 0.04;
  n.shoulderL.rotation.z = -0.1 - (hunt ? 0.25 : 0);
  n.shoulderR.rotation.z = 0.1 + (hunt ? 0.25 : 0);
  n.elbowL.rotation.x = -0.25 - amp * 0.2 + (hunt ? -0.4 : 0);
  n.elbowR.rotation.x = -0.25 - amp * 0.2 + (hunt ? -0.4 : 0);
  n.spine.rotation.x = (hunt ? 0.62 : m.state === 'search' ? 0.42 : 0.26) + Math.sin(p * 2) * 0.03;
  n.hips.position.y = 1.6 + Math.abs(s) * 0.06 * amp - (hunt ? 0.16 : 0);
  n.neck.rotation.x = hunt ? -0.45 : -0.25;
  const listen = m.state === 'search' || m.state === 'idle' || m.listenT > 0;
  n.head.rotation.z = listen ? Math.sin(t * 1.9 + m.seed) * 0.4 : Math.sin(t * 0.7) * 0.06;
  n.head.rotation.y = clamp(m.headYaw, -0.9, 0.9);
  n.jaw.rotation.x = hunt ? 0.55 + Math.sin(t * 24) * 0.12 : 0.06 + Math.max(0, Math.sin(t * 0.8 + m.seed)) * 0.1;
}

function animCrawler(m, dt, t) {
  const n = m.rig.nodes;
  const amp = clamp(m.speedCur / 2.5, 0, 1.2);
  const p = m.phase;
  const names = ['FL', 'FR', 'ML', 'MR', 'BL', 'BR'];
  for (let i = 0; i < 6; i++) {
    const ph = p + (i % 2 ? Math.PI : 0) + (i >> 1) * 0.9;
    const s = Math.sin(ph);
    n['hip' + names[i]].rotation.y = s * 0.45 * amp;
    n['hip' + names[i]].rotation.z = (i % 2 ? -1 : 1) * Math.max(0, Math.cos(ph)) * 0.35 * amp;
  }
  n.body.position.y = 0.62 + Math.abs(Math.sin(p * 2)) * 0.05 * amp + (m.state === 'hunt' ? -0.1 : 0);
  n.body.rotation.z = Math.sin(p) * 0.06 * amp;
  n.head.rotation.y = clamp(m.headYaw, -0.7, 0.7) + Math.sin(t * 13) * 0.05 * (m.state === 'hunt' ? 1 : 0.2);
  n.head.rotation.z = m.state === 'search' ? Math.sin(t * 3 + m.seed) * 0.5 : 0;
  n.jaw.rotation.x = m.state === 'hunt' ? 0.5 + Math.sin(t * 30) * 0.15 : 0.08;
}

// it walks like something imitating walking: long slow strides, arms dragging behind
function animWatcher(m, dt, t) {
  const n = m.rig.nodes;
  const amp = clamp(m.speedCur / 3.2, 0, 1.1);
  const p = m.phase;
  const s = Math.sin(p);
  n.thighL.rotation.x = s * 0.55 * amp;
  n.thighR.rotation.x = -s * 0.55 * amp;
  n.kneeL.rotation.x = Math.max(0, -s) * 0.7 * amp + 0.05;
  n.kneeR.rotation.x = Math.max(0, s) * 0.7 * amp + 0.05;
  n.shoulderL.rotation.x = 0.18 * amp + Math.sin(p + 0.6) * 0.12 * amp;
  n.shoulderR.rotation.x = 0.18 * amp - Math.sin(p + 0.6) * 0.12 * amp;
  n.shoulderL.rotation.z = -0.06;
  n.shoulderR.rotation.z = 0.06;
  n.elbowL.rotation.x = -0.1;
  n.elbowR.rotation.x = -0.1;
  n.spine.rotation.x = 0.12 + amp * 0.2;
  n.hips.position.y = 1.8 + Math.abs(s) * 0.05 * amp;
  // the head sits at a wrong angle, and drifts further when it's near you
  const near = clamp(1 - m.playerDist / 14, 0, 1);
  n.neck.rotation.x = -0.15 - near * 0.2;
  n.head.rotation.z = Math.sin(t * 0.37 + m.seed) * 0.25 + (0.35 + near * 0.5) * (m.seed > 5 ? 1 : -1);
  n.head.rotation.y = clamp(m.headYaw, -1.2, 1.2);
  n.faceL.rotation.y = 0;
  n.faceR.rotation.y = 0;
}

function animHowler(m, dt, t) {
  const n = m.rig.nodes;
  const amp = clamp(m.speedCur / 2.4, 0, 1.3);
  const p = m.phase;
  const s = Math.sin(p);
  const st = m.state;
  let rear = 0, jaw = 0.1 + Math.max(0, Math.sin(t * 0.9 + m.seed)) * 0.08, spread = 0;
  if (st === 'inhale') {
    const k = clamp(m.stateT / 1.8, 0, 1);
    rear = k * 0.55;
    jaw = 0.15 + k * 0.25;
    spread = k * 0.35;
    n.chest.scale.setScalar(1 + k * 0.12); // the chest fills like a bellows
  } else if (st === 'howl') {
    const k = clamp(m.stateT / 0.25, 0, 1) * (1 - clamp((m.stateT - 1.4) / 0.4, 0, 1));
    rear = 0.55 + 0.35 * k;
    jaw = 0.4 + 0.75 * k + Math.sin(t * 30) * 0.08 * k;
    spread = 0.35 + 0.55 * k;
    n.chest.scale.setScalar(1.12 - 0.1 * k);
  } else {
    n.chest.scale.setScalar(1);
    if (st === 'hunt') jaw = 0.55 + Math.sin(t * 22) * 0.12;
  }
  n.pelvis.rotation.x = -rear * 0.5;
  n.pelvis.position.y = 1.05 + Math.abs(Math.sin(p * 2)) * 0.05 * amp - (st === 'hunt' ? 0.1 : 0);
  n.chest.rotation.x = -rear * 0.75;
  n.neck.rotation.x = -rear * 0.9 + (st === 'hunt' ? 0.15 : 0);
  n.head.rotation.x = -rear * 0.5;
  n.head.rotation.y = clamp(m.headYaw, -0.7, 0.7) * (1 - rear);
  n.jaw.rotation.x = jaw;
  // knuckle-walk: front arms and back legs in opposite phase
  const sw = rear > 0.05 ? 0 : 1;
  n.shoulderL.rotation.x = s * 0.5 * amp * sw - rear * 1.2;
  n.shoulderR.rotation.x = -s * 0.5 * amp * sw - rear * 1.2;
  n.shoulderL.rotation.z = -spread;
  n.shoulderR.rotation.z = spread;
  n.elbowL.rotation.x = Math.max(0, s) * 0.4 * amp * sw - rear * 0.4;
  n.elbowR.rotation.x = Math.max(0, -s) * 0.4 * amp * sw - rear * 0.4;
  n.thighL.rotation.x = -s * 0.45 * amp + rear * 0.6;
  n.thighR.rotation.x = s * 0.45 * amp + rear * 0.6;
  n.kneeL.rotation.x = Math.max(0, s) * 0.6 * amp;
  n.kneeR.rotation.x = Math.max(0, -s) * 0.6 * amp;
}

// the atlas animates its portraits with the very same code (a stand-in `m`: rig, state, stateT, speedCur, phase, seed, headYaw...)
export const ANIMS = { listener: animListener, crawler: animCrawler, watcher: animWatcher, howler: animHowler };

// (the survivor — a teammate in co-op, you in the wardrobe — lives in survivor.js)

// ---------------- AI ----------------
// A monster runs in one of two modes:
//  • authoritative (solo, or the co-op host): think() decides where it goes and whom it hunts
//  • puppet (co-op guest): follow() replays the host's snapshots, slightly delayed and interpolated
// Either way present() animates it and makes it sound like itself, relative to whoever listens here.
let _id = 0;
const RIGS = { listener: buildListener, crawler: buildCrawler, watcher: buildWatcher, howler: buildHowler };
export function buildRig(type) {
  return RIGS[type]();
}
// stand-in "player" when nobody is alive: far away, still
const FAR = { x: 1e5, z: 1e5, y: 0, speed: 0, alive: false, charging: false, forward: () => ({ x: 0, z: -1 }) };
const INTERP_DELAY = 140; // ms behind the newest snapshot: hides network jitter
export const STATES = ['idle', 'wander', 'investigate', 'search', 'hunt', 'flee', 'feed', 'lurk', 'stalk', 'frozen', 'inhale', 'howl'];
export const TYPES = ['listener', 'crawler', 'watcher', 'howler'];

function lerpAngle(a, b, k) {
  return a + angleDiff(a, b) * k;
}

export class Monster {
  constructor(type, game, id) {
    this.id = id ?? ++_id;
    this.type = type;
    this.game = game;
    this.cfg = CFG.MONSTER[type];
    this.rig = RIGS[type]();
    this.ghostColor = 0xff2a20; // what its echo afterimage looks like
    this.noEyes = false;
    this.headY = type === 'crawler' ? 0.7 : 2.1; // where sniffs / breath come from
    this.stepGain = type === 'crawler' ? 0.5 : 1;
    this.stepPitch = 1;
    this.strideHz = type === 'crawler' ? 3.2 : 1.55;
    this.strideRef = type === 'crawler' ? 2.5 : 1.8;
    this.huntTarget = null; // null = it knows where its target is while hunting
    this.lampGhost = null; // live afterimage while it stands in a lamp's light
    this.x = 0;
    this.z = 0;
    this.y = 0;
    this.yaw = 0;
    this.state = 'wander';
    this.stateT = 0;
    this.tx = 0;
    this.tz = 0;
    this.speedCur = 0;
    this.phase = Math.random() * 6;
    this.lastStepSign = 1;
    this.lock = 0;
    this.seed = Math.random() * 10;
    this.headYaw = 0;
    this.listenT = 0;
    this.pauseT = 0;
    this.stuckT = 0;
    this.detourT = 0;
    this.lastCloseCall = -100;
    this.breath = null;
    this.chitterT = 2;
    this.heardCD = 0;
    this.huntedPlayer = false;
    this.alive = true;
    this.scripted = null;
    this.playerDist = 1e4; // distance to whoever is listening on this machine (presentation)
    this.tgt = null; // the player it is paying attention to (AI)
    this.tgtDist = 1e4;
    this.feedT = 0;
    this.puppet = false;
    this.snaps = [];
  }

  spawn(x, z, state = 'wander') {
    this.x = x;
    this.z = z;
    this.y = this.game.world.terrain.height(x, z);
    this.playerDist = this.game.distToEars(x, z);
    this.state = state;
    this.stateT = 0;
    this.pickTarget();
    this.pickWander();
    this.syncRig();
  }

  dispose() {
    if (this.breath) this.breath.stop();
    this.breath = null;
    if (this.lampGhost) this.game.ghosts.release(this.lampGhost);
    this.lampGhost = null;
    this.alive = false;
  }

  // how much this one should make your heart race right now (0..1)
  danger() {
    const d = this.playerDist;
    if (this.state === 'hunt') return 0.55 + 0.45 * clamp(1 - d / 40, 0, 1);
    if (this.state === 'investigate' || this.state === 'search') return 0.55 * clamp(1 - d / 28, 0, 1);
    return 0.4 * clamp(1 - d / 14, 0, 1);
  }

  animate(dt, t) {
    if (this.type === 'listener') animListener(this, dt, t);
    else animCrawler(this, dt, t);
  }

  get hearingMult() {
    return this.cfg.hearing * this.game.hearingScale;
  }

  // ---------------- whom it cares about ----------------
  nearestTo(x, z) {
    let best = null, bd = 1e9;
    for (const q of this.game.livePlayers()) {
      const d = Math.hypot(q.x - x, q.z - z);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
    return best;
  }

  // whoever it is chasing; otherwise whoever is nearest
  pickTarget() {
    const g = this.game;
    if (!(this.state === 'hunt' && this.tgt && this.tgt.alive && g.isPlayer(this.tgt))) this.tgt = this.nearestTo(this.x, this.z);
    this.tgtDist = this.tgt ? Math.hypot(this.tgt.x - this.x, this.tgt.z - this.z) : 1e4;
    return this.tgt;
  }

  pickWander() {
    const live = this.game.livePlayers();
    // drift toward the players' region to keep the pressure on
    if (live.length && Math.random() < 0.4) {
      const p = live[Math.floor(Math.random() * live.length)];
      const a = Math.random() * Math.PI * 2, d = 12 + Math.random() * 30;
      this.tx = p.x + Math.cos(a) * d;
      this.tz = p.z + Math.sin(a) * d;
    } else {
      const a = Math.random() * Math.PI * 2, d = 15 + Math.random() * 35;
      this.tx = this.x + Math.cos(a) * d;
      this.tz = this.z + Math.sin(a) * d;
    }
    const w = CFG.WORLD_WALL - 8;
    this.tx = clamp(this.tx, -w, w);
    this.tz = clamp(this.tz, -w, w);
  }

  setState(s) {
    this.state = s;
    this.stateT = 0;
  }

  investigate(x, z, slow = false) {
    if (this.state === 'hunt' || this.state === 'feed') return;
    const fresh = this.state !== 'investigate';
    this.setState('investigate');
    this.tx = x;
    this.tz = z;
    this.slowInvestigate = slow;
    this.listenT = 0.6;
    return fresh;
  }

  startHunt(pl) {
    const g = this.game;
    if (pl) {
      this.tgt = pl;
      this.tgtDist = Math.hypot(pl.x - this.x, pl.z - this.z);
    }
    const fresh = this.state !== 'hunt';
    this.setState('hunt');
    this.lock = this.cfg.lock;
    this.huntedPlayer = true;
    if (fresh) g.onMonsterHunt(this);
  }

  // it got someone: it stays with the body for a while (co-op — the others can get away)
  feed(sec = 4.5) {
    this.setState('feed');
    this.feedT = sec;
    this.huntTarget = null;
    this.speedCur = 0;
  }

  // noise from the world. pid = which player made it (null: a stone, a machine...). returns 'hunt' | 'investigate' | null
  hear(nx, nz, loud, source, scream, pid = null) {
    if (!this.alive || this.state === 'flee' || this.state === 'feed' || this.scripted === 'freeze') return null;
    const dx = nx - this.x, dz = nz - this.z;
    const d = Math.hypot(dx, dz);
    const mult = source === 'step' && this.cfg.stepHearing ? this.cfg.stepHearing : 1;
    const R = (source === 'voice' ? CFG.voiceHearRadius(loud) : CFG.hearRadius(loud)) * this.hearingMult * mult;
    if (d > R) return null;
    const g = this.game;
    const lure = source === 'stone' || source === 'tape' || source === 'speaker';
    const fromPlayer = !lure && source !== 'scare';
    const who = pid != null ? g.playerById(pid) : null;
    if (this.state === 'hunt') {
      if (fromPlayer) {
        this.lock = Math.max(this.lock, 2.6);
        // someone much closer giving themselves away pulls it off whoever it was chasing
        if (who && who.alive && who !== this.tgt) {
          const dn = Math.hypot(who.x - this.x, who.z - this.z);
          if (dn < this.tgtDist * 0.6) {
            this.tgt = who;
            this.tgtDist = dn;
          }
        }
        return 'hunt';
      }
      // a stone can break the chase if you've been quiet for a moment and it lands nearer to it than you are
      const p = this.tgt || FAR;
      const pd = Math.hypot(p.x - this.x, p.z - this.z);
      if (lure && this.lock < this.cfg.lock * 0.75 && d < pd && pd > 3) {
        this.setState('investigate');
        this.tx = nx;
        this.tz = nz;
        this.slowInvestigate = false;
        g.onMonsterLost(this);
        return 'investigate';
      }
      return 'hunt';
    }
    if (fromPlayer && !g.grace && (scream || d < Math.max(2.5, R * 0.22))) {
      this.startHunt(who && who.alive ? who : this.nearestTo(nx, nz));
      return 'hunt';
    }
    const err = d * 0.12;
    const a = Math.random() * Math.PI * 2, r = Math.random() * err;
    const fresh = this.investigate(nx + Math.cos(a) * r, nz + Math.sin(a) * r);
    if (fresh) g.onMonsterInvestigate(this, d, pid);
    return 'investigate';
  }

  syncRig() {
    const r = this.rig.root;
    r.position.set(this.x, this.y, this.z);
    r.rotation.y = this.yaw;
  }

  // walk toward (tx, tz) at `speed`, sliding around trees, detouring when stuck
  _steer(dt, tx, tz, speed, turnRate = this.state === 'hunt' ? 7 : 2.6) {
    const g = this.game;
    const cfg = this.cfg;
    // detour if stuck
    if (this.detourT > 0) {
      this.detourT -= dt;
      tx = this.dtx;
      tz = this.dtz;
    } else if (g.doors) {
      // into (or out of) a cabin: by the door. a shut one gets leaned on — or broken down
      const rt = g.doors.route(this.x, this.z, tx, tz);
      if (rt) {
        tx = rt.x;
        tz = rt.z;
        if (rt.shut) {
          speed = Math.min(speed, 0.6);
          g.doors.push(rt.door, this, dt);
          this.stuckT = 0;
        }
      } else if (g.escape) {
        // into (or out of) the forestry yard: through the gateway, once the gate is open
        const yr = g.escape.route(this.x, this.z, tx, tz);
        if (yr) {
          tx = yr.x;
          tz = yr.z;
        }
      }
    }

    // ---- steering ----
    const dx = tx - this.x, dz = tz - this.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05 && speed > 0) {
      const want = Math.atan2(dx, dz);
      const da = angleDiff(this.yaw, want);
      this.yaw += clamp(da, -turnRate * dt, turnRate * dt);
      // slow down for sharp turns
      speed *= 1 - Math.min(0.7, Math.abs(da) / Math.PI);
    }
    this.speedCur = lerp(this.speedCur, speed, 1 - Math.exp(-6 * dt));
    const ox = this.x, oz = this.z;
    this.x += Math.sin(this.yaw) * this.speedCur * dt;
    this.z += Math.cos(this.yaw) * this.speedCur * dt;
    const pos = { x: this.x, z: this.z };
    g.world.col.resolve(pos, g.doors ? g.doors.squeeze(this.x, this.z, cfg.radius) : cfg.radius);
    if (g.world.lake) {
      const L = g.world.lake;
      const lx = pos.x - L.x, lz = pos.z - L.z, ld = Math.hypot(lx, lz);
      if (ld < L.r + 0.5) { pos.x = L.x + (lx / ld) * (L.r + 0.5); pos.z = L.z + (lz / ld) * (L.r + 0.5); }
    }
    const w = CFG.WORLD_WALL;
    this.x = clamp(pos.x, -w, w);
    this.z = clamp(pos.z, -w, w);
    const moved = Math.hypot(this.x - ox, this.z - oz);
    if (this.speedCur > 0.5 && moved < this.speedCur * dt * 0.3) {
      this.stuckT += dt;
      if (this.stuckT > 0.6) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const a = this.yaw + side * (Math.PI / 2 + Math.random() * 0.6);
        this.dtx = this.x + Math.sin(a) * 4;
        this.dtz = this.z + Math.cos(a) * 4;
        this.detourT = 0.9;
        this.stuckT = 0;
      }
    } else this.stuckT = Math.max(0, this.stuckT - dt);
    this.y = lerp(this.y, g.world.terrain.height(this.x, this.z), 1 - Math.exp(-12 * dt));
  }

  update(dt, t) {
    if (this.puppet) this.follow(dt);
    else this.think(dt, t);
    if (!this.alive) return;
    this.present(dt, t);
  }

  // ---------------- decisions (authoritative only) ----------------
  think(dt, t) {
    const g = this.game;
    this.stateT += dt;
    this.heardCD -= dt;
    this.listenT -= dt;
    this.pickTarget();
    const cfg = this.cfg;
    const scale = g.speedScale;

    // ---- proximity sense: anyone who walks into it, or rushes past right next to it ----
    if (this.state !== 'hunt' && this.state !== 'flee' && this.state !== 'feed' && !this.scripted) {
      for (const q of g.livePlayers()) {
        const d = Math.hypot(q.x - this.x, q.z - this.z);
        const touch = d < 0.95;
        const feels = d < 2.3 && (q.speed > 1.75 || (q.speed > 0.3 && d < 1.5));
        if (touch || (feels && !g.grace)) {
          this.startHunt(q);
          break;
        }
      }
    }

    const p = this.tgt || FAR;
    const pdx = p.x - this.x, pdz = p.z - this.z;
    const pd = Math.hypot(pdx, pdz);
    this.tgtDist = pd;

    // ---- state machine ----
    let speed = 0;
    let tx = this.tx, tz = this.tz;
    switch (this.state) {
      case 'idle':
        speed = 0;
        this.headYaw = lerp(this.headYaw, clamp(angleDiff(this.yaw, Math.atan2(pdx, pdz)), -0.8, 0.8), dt * 2);
        break;
      case 'wander': {
        if (this.pauseT > 0) {
          this.pauseT -= dt;
          speed = 0;
        } else {
          speed = cfg.wander;
          if (Math.hypot(tx - this.x, tz - this.z) < 2) {
            this.pickWander();
            if (Math.random() < 0.5) this.pauseT = 1.5 + Math.random() * 3;
          }
        }
        if (this.stateT > 40) { this.pickWander(); this.stateT = 0; }
        break;
      }
      case 'investigate': {
        speed = this.slowInvestigate ? cfg.wander * 1.25 : cfg.investigate;
        if (this.rushT > 0) {
          // a flare went up: it comes at a lope to see what's burning
          this.rushT -= dt;
          speed = cfg.investigate * 1.6;
        }
        const still = p.speed < 0.3;
        if (Math.hypot(tx - this.x, tz - this.z) < 1.6 || this.stateT > 30 || (still && pd < 2.1)) {
          this.setState('search');
          this.searchDur = 4 + Math.random() * 3.5;
        }
        break;
      }
      case 'search': {
        speed = 0.35;
        tx = this.x + Math.sin(t * 0.7 + this.seed) * 3;
        tz = this.z + Math.cos(t * 0.6 + this.seed) * 3;
        // it sniffs around... but a frozen, silent player is just another tree
        if (pd < 2.1) {
          tx = this.x - pdx;
          tz = this.z - pdz;
        }
        if (this.stateT > this.searchDur) {
          this.setState('wander');
          this.pickWander();
        }
        break;
      }
      case 'hunt': {
        this.lock -= dt;
        tx = this.huntTarget ? this.huntTarget.x : p.x;
        tz = this.huntTarget ? this.huntTarget.z : p.z;
        if (pd < 4) this.lock = Math.max(this.lock, 1.2);
        speed = cfg.hunt * (pd < 7 ? 1.18 : 1);
        if (this.stateT < 0.7) speed *= 0.25; // the windup screech
        if (this.stateT > 0.35) {
          // whoever it reaches: the one it chases first, else whoever is nearest in its way
          const kd = CFG.MONSTER.killDist;
          let victim = p.alive && pd < kd ? p : null;
          if (!victim) {
            let vd = kd;
            for (const q of g.livePlayers()) {
              const d = Math.hypot(q.x - this.x, q.z - this.z);
              if (d < vd) {
                vd = d;
                victim = q;
              }
            }
          }
          if (victim && g.doors && g.doors.blocks(this.x, this.z, victim.x, victim.z)) victim = null; // not through a wall or a shut door
          if (victim && g.escape && g.escape.blocks(this.x, this.z, victim.x, victim.z)) victim = null; // ...or the yard's fence
          if (victim) {
            g.kill(this, victim);
            return;
          }
        }
        if (this.lock <= 0) {
          this.setState('investigate');
          this.tx = p.x + (Math.random() - 0.5) * 6;
          this.tz = p.z + (Math.random() - 0.5) * 6;
          g.onMonsterLost(this);
        }
        break;
      }
      case 'feed': {
        this.feedT -= dt;
        if (this.feedT <= 0) {
          this.setState('wander');
          this.pickWander();
        }
        break;
      }
      case 'flee': {
        speed = cfg.hunt;
        tx = this.x + (this.x - p.x);
        tz = this.z + (this.z - p.z);
        break;
      }
    }
    speed *= scale;

    this._steer(dt, tx, tz, speed);

    // head tracks its target when hunting / close
    if (this.state !== 'idle') {
      const rel = angleDiff(this.yaw, Math.atan2(pdx, pdz));
      const want = this.state === 'hunt' || pd < 10 ? clamp(rel, -0.9, 0.9) : 0;
      this.headYaw = lerp(this.headYaw, want, 1 - Math.exp(-4 * dt));
    }
    this.phase += dt * Math.PI * 2 * this.strideHz * clamp(this.speedCur / this.strideRef, 0, 2.2);
  }

  // ---------------- puppet (co-op guest) ----------------
  // s: { x, z, yaw, hy, spd, st, lit, intro, scr }
  pushSnap(now, s) {
    this.snaps.push({ t: now, ...s });
    if (this.snaps.length > 8) this.snaps.shift();
  }

  follow(dt) {
    const S = this.snaps;
    if (!S.length) return;
    const now = performance.now() - INTERP_DELAY;
    let a = S[0], b = S[0];
    for (let i = S.length - 1; i >= 0; i--) {
      if (S[i].t <= now) {
        a = S[i];
        b = S[Math.min(i + 1, S.length - 1)];
        break;
      }
    }
    let k = b.t > a.t ? (now - a.t) / (b.t - a.t) : 1;
    k = clamp(k, 0, 1.2); // a little extrapolation hides a late packet
    const jump = Math.hypot(b.x - a.x, b.z - a.z) > 8 || Math.hypot(b.x - this.x, b.z - this.z) > 14;
    if (jump) {
      a = b;
      k = 1;
    }
    const k1 = Math.min(k, 1);
    this.x = lerp(a.x, b.x, k);
    this.z = lerp(a.z, b.z, k);
    this.yaw = lerpAngle(a.yaw, b.yaw, k1);
    this.headYaw = lerp(a.hy, b.hy, k1);
    this.speedCur = lerp(a.spd, b.spd, k1);
    const nb = k1 > 0.5 ? b : a;
    if (nb.st !== this.state) {
      if (this.state === 'lurk') this.revealed = false; // the Watcher came back: it can sting again
      this.state = nb.st;
      this.stateT = 0;
    } else this.stateT += dt;
    this.lit = nb.lit;
    this.intro = nb.intro;
    this.scripted = nb.scr ? 'freeze' : null;
    if (Math.abs(this.x) < 2000) {
      const gy = this.game.world.terrain.height(this.x, this.z);
      this.y = jump ? gy : lerp(this.y, gy, 1 - Math.exp(-12 * dt));
    }
    this.phase += dt * Math.PI * 2 * this.strideHz * clamp(this.speedCur / this.strideRef, 0, 2.2);
  }

  // ---------------- what you see and hear of it (every machine) ----------------
  present(dt, t) {
    const g = this.game;
    this.playerDist = g.distToEars(this.x, this.z);
    const pd = this.playerDist;
    this.animate(dt, t);
    this.syncRig();

    const audio = g.audio;
    const near = pd < 32;
    const sign = Math.sin(this.phase) >= 0 ? 1 : -1;
    if (sign !== this.lastStepSign) {
      this.lastStepSign = sign;
      if (near && this.speedCur > 0.4) {
        const gain = clamp(0.15 + this.speedCur * 0.08, 0, 0.7) * this.stepGain;
        audio.heavyStep(this.x, this.y + 0.2, this.z, gain, this.stepPitch);
      }
    }
    if (this.type === 'crawler' && near) {
      this.chitterT -= dt;
      if (this.chitterT <= 0) {
        audio.chitter(this.x, this.y + 0.6, this.z, this.state === 'hunt' ? 0.7 : 0.35);
        this.chitterT = this.state === 'hunt' ? 0.5 + Math.random() * 0.4 : 3 + Math.random() * 5;
      }
    }
    if (pd < 28 && audio.ready) {
      if (!this.breath) this.breath = audio.breather(this.x, this.y + 2.2, this.z, this.type === 'howler');
      if (this.breath) {
        this.breath.setPos(this.x, this.y + (this.type === 'crawler' ? 0.7 : this.type === 'howler' ? 1.8 : 2.6), this.z);
        const rate = this.state === 'hunt' ? 2.8 : this.state === 'investigate' || this.state === 'search' ? 1.5 : 1;
        const gain = this.state === 'hunt' ? 0.9 : 0.45;
        this.breath.update(rate, gain);
      }
    } else if (this.breath && pd > 36) {
      this.breath.stop();
      this.breath = null;
    }
  }
}

// ---------------- the Watcher ----------------
// It never hears you and makes no sound you would call a footstep. It moves only while nothing lights
// it: every time your echo finds it, it is a little closer. Freeze it with light; the lamps keep it out.
export class Watcher extends Monster {
  constructor(game, id) {
    super('watcher', game, id);
    this.ghostColor = 0xd9e4ec;
    this.noEyes = true;
    this.headY = 3.2;
    this.strideHz = 0.95;
    this.strideRef = 3.0;
    this.lit = false;
    this.litStreak = 0;
    this.lampWait = 0;
    this.crackT = 1;
    this.lurkT = 3;
    this.state = 'lurk';
    this.x = this.z = 1e4;
    this.playerDist = 1e4;
  }

  hear() {
    return null;
  }

  danger() {
    if (this.state === 'lurk' || this.state === 'flee') return 0;
    return clamp(1 - this.playerDist / 26, 0, 1) * (this.lit ? 0.5 : 0.8);
  }

  animate(dt, t) {
    animWatcher(this, dt, t);
  }

  // somewhere behind someone, in the dark, away from the lamps
  appearBehind(p, dmin, dmax) {
    const g = this.game, w = CFG.WORLD_WALL - 6;
    if (!p) return false;
    const f = p.forward();
    for (let k = 0; k < 40; k++) {
      const a = (Math.random() - 0.5) * 2.4;
      const ca = Math.cos(a), sa = Math.sin(a);
      const bx = -f.x * ca + f.z * sa, bz = -f.z * ca - f.x * sa;
      const d = dmin + Math.random() * (dmax - dmin);
      const x = p.x + bx * d, z = p.z + bz * d;
      if (Math.abs(x) > w || Math.abs(z) > w || !g.world.col.free(x, z, 0.8)) continue;
      if (g.world.inYard(x, z, 1) !== g.world.inYard(p.x, p.z, 1)) continue; // (not on the other side of the yard's fence)
      const L = g.world.lake;
      if (L && Math.hypot(x - L.x, z - L.z) < L.r + 3) continue;
      if (g.objectives.lampAt(x, z) > 0.005) continue;
      if (g.lightAt(x, g.world.terrain.height(x, z) + 1.8, z) > 0.02) continue;
      if (g.flares && g.flares.lightAt(x, g.world.terrain.height(x, z) + 1.8, z) > 0.02) continue; // nor under a flare
      if (g.smallLightAt && g.smallLightAt(x, g.world.terrain.height(x, z) + 1.8, z) > 0.02) continue; // nor by a glow stick
      if (g.livePlayers().some((q) => Math.hypot(q.x - x, q.z - z) < dmin * 0.7)) continue; // not right next to someone else
      this.spawn(x, z, 'stalk');
      this.tgt = p;
      this.yaw = Math.atan2(p.x - x, p.z - z);
      this.litStreak = 0;
      this.revealed = false;
      return true;
    }
    return false;
  }

  vanish(sec) {
    this.state = 'lurk';
    this.stateT = 0;
    this.lurkT = sec;
    this.x = this.z = 1e4;
    this.playerDist = 1e4;
    this.lit = false;
    this.speedCur = 0;
    if (this.lampGhost) this.game.ghosts.release(this.lampGhost);
    this.lampGhost = null;
    this.syncRig();
  }

  setState(s) {
    if (s === 'flee') this.vanish(1e9); // when the lights come back it simply isn't there
    else super.setState(s);
  }

  dispose() {
    super.dispose();
    this.game.audio.watcherPresence(0);
  }

  think(dt, t) {
    const g = this.game, cfg = this.cfg;
    this.stateT += dt;
    if (this.state === 'lurk') {
      this.lurkT -= dt;
      if (this.lurkT <= 0) {
        // it picks someone who isn't sheltering in a lamp (or in a glow stick's light)
        const live = g.livePlayers().filter((q) => !g.objectives.inLamp(q.x, q.z) && !(g.smallLightAt && g.smallLightAt(q.x, q.y + 1, q.z) > 0.3));
        const p = live.length ? live[Math.floor(Math.random() * live.length)] : null;
        if (!p || !this.appearBehind(p, 27, 37)) this.lurkT = 1.5;
      }
      return;
    }
    const p = this.pickTarget() || FAR;
    const pdx = p.x - this.x, pdz = p.z - this.z;
    const pd = this.tgtDist;
    const lampL = Math.max(g.objectives.lampAt(this.x, this.z), g.flares ? g.flares.lightAt(this.x, this.y + 1.8, this.z) : 0, g.smallLightAt ? g.smallLightAt(this.x, this.y + 1.8, this.z) : 0);
    const lit = g.lightAt(this.x, this.y + 1.8, this.z) > cfg.litThreshold || lampL > 0.08;
    this.lit = lit;
    this.state = lit ? 'frozen' : 'stalk';
    this.litStreak = lit ? this.litStreak + dt : Math.max(0, this.litStreak - dt * 0.5);
    const sheltered = g.objectives.inLamp(p.x, p.z) || (g.smallLightAt && g.smallLightAt(p.x, (p.y || 0) + 1, p.z) > 0.3);
    this.lampWait = p.alive && sheltered ? this.lampWait + dt : 0;
    // it gets bored of being stared at, and it won't wait forever at the edge of a lamp
    if (this.litStreak > 14 || this.lampWait > 9 || !p.alive) {
      this.vanish(18 + Math.random() * 16);
      return;
    }
    if (pd > 60 && !lit) {
      if (!this.appearBehind(p, 27, 37)) this.vanish(2);
      return;
    }
    let speed = 0;
    if (!lit) {
      speed = cfg.stalk * g.speedScale * (pd < 4 ? 0.8 : 1);
      // a flashlight that has just gone out for a moment: it lunges (the dark between two flickers)
      if (g.torch && g.torch.dipping) speed *= 2.2;
      // it will not step into a lamp's light
      const la = Math.min(1.2, speed * 0.4);
      const ax = this.x + Math.sin(this.yaw) * la, az = this.z + Math.cos(this.yaw) * la;
      if (g.objectives.lampAt(ax, az) > 0.05 || (g.flares && g.flares.lightAt(ax, this.y + 1.8, az) > 0.05) || (g.smallLightAt && g.smallLightAt(ax, this.y + 1.8, az) > 0.05)) speed = 0;
    }
    if (speed > 0) {
      this._steer(dt, p.x, p.z, speed, 3.2);
      this.phase += dt * Math.PI * 2 * this.strideHz * clamp(this.speedCur / this.strideRef, 0, 2);
      this.headYaw = lerp(this.headYaw, clamp(angleDiff(this.yaw, Math.atan2(pdx, pdz)), -1.2, 1.2), 1 - Math.exp(-3 * dt));
    } else {
      this.speedCur = 0; // lit: not a single joint moves. the pose holds exactly.
    }
    if (!lit && this.stateT > 0.6) {
      let victim = null, vd = CFG.MONSTER.killDist + 0.15;
      for (const q of g.livePlayers()) {
        const d = Math.hypot(q.x - this.x, q.z - this.z);
        if (d < vd) {
          vd = d;
          victim = q;
        }
      }
      if (victim && g.doors && g.doors.blocks(this.x, this.z, victim.x, victim.z)) victim = null;
      if (victim && g.escape && g.escape.blocks(this.x, this.z, victim.x, victim.z)) victim = null;
      if (victim) {
        g.kill(this, victim);
        return;
      }
    }
  }

  present(dt, t) {
    const g = this.game;
    if (this.state === 'lurk') {
      this.playerDist = 1e4;
      g.audio.watcherPresence(0);
      return;
    }
    this.playerDist = g.distToEars(this.x, this.z);
    const pd = this.playerDist;
    const lit = this.lit;
    if (!lit && this.speedCur > 0.01) this.animate(dt, t);
    this.syncRig();
    // bones creaking as it walks; a thin ringing that grows as it closes in
    const presence = clamp(1 - pd / 24, 0, 1);
    g.audio.watcherPresence(presence, this.x, this.y + 2.8, this.z, !lit && this.speedCur > 0.3);
    if (!lit && this.speedCur > 0.5 && pd < 24) {
      this.crackT -= dt;
      if (this.crackT <= 0) {
        g.audio.crack(this.x, this.y + 0.8 + Math.random() * 2.2, this.z, 0.3 + presence * 0.55);
        this.crackT = 0.3 + Math.random() * 0.55;
      }
    }
    if (pd < 10 && g.localAlive()) g.fx.glitch = Math.max(g.fx.glitch, (1 - pd / 10) * (lit ? 0.1 : 0.32));
  }
}

// ---------------- the Howler ----------------
// Nearly deaf. Every half a minute it fills its chest and howls, and the howl is its eyes: whatever
// is moving inside that wave gets charged. Stand still and it looks straight through you.
export class Howler extends Monster {
  constructor(game, id) {
    super('howler', game, id);
    this.ghostColor = 0xff5a14;
    this.headY = 1.8;
    this.stepGain = 2.4;
    this.stepPitch = 0.6;
    this.strideHz = 1.2;
    this.strideRef = 2.2;
    this.howlT = 14 + Math.random() * 8;
    this.barkT = 0;
  }

  animate(dt, t) {
    animHowler(this, dt, t);
  }

  danger() {
    if (this.state === 'inhale' || this.state === 'howl') return this.playerDist < this.cfg.howlR ? 0.78 : 0.15;
    return super.danger();
  }

  hear(nx, nz, loud, source, scream, pid) {
    if (this.state === 'inhale' || this.state === 'howl') return null;
    if (loud < this.cfg.minLoud) return null; // clicks, footsteps, breathing: too quiet for it
    const r = super.hear(nx, nz, loud, source, scream, pid);
    if (r === 'hunt' && source !== 'stone' && source !== 'scare') this.huntTarget = { x: nx, z: nz };
    return r;
  }

  startHunt(pl) {
    const p = pl || this.tgt;
    if (!this.huntTarget && p) this.huntTarget = { x: p.x, z: p.z };
    super.startHunt(pl);
  }

  think(dt, t) {
    const g = this.game;
    if (this.state === 'inhale' || this.state === 'howl') {
      this.stateT += dt;
      this.pickTarget();
      this.speedCur = lerp(this.speedCur, 0, 1 - Math.exp(-8 * dt));
      if (this.state === 'inhale' && this.stateT >= 1.8) {
        this.setState('howl');
        g.onHowl(this);
      } else if (this.state === 'howl') {
        // the wave rolls out at ~30 m/s; anything moving inside it is seen
        const reach = Math.min(this.cfg.howlR, Math.max(0, this.stateT - 0.1) * 30);
        let seen = null, sd = 1e9;
        if (this.stateT < 1.9) {
          for (const q of g.livePlayers()) {
            const d = Math.hypot(q.x - this.x, q.z - this.z);
            if (d < reach && d < sd && g.movingForHowler(q)) {
              sd = d;
              seen = q;
            }
          }
        }
        if (seen) this.spot(seen);
        else if (this.stateT > 2.0) {
          this.setState('wander');
          this.pickWander();
        }
      }
      return;
    }
    if (this.state === 'hunt') {
      this.barkT -= dt;
      if (this.barkT <= 0) {
        this.barkT = 1.0 + Math.random() * 0.35;
        g.onHowlerBark(this);
        // every bark is another look: anyone moving close by
        let best = null, bd = 18;
        for (const q of g.livePlayers()) {
          const d = Math.hypot(q.x - this.x, q.z - this.z);
          if (d < bd && g.movingForHowler(q)) {
            bd = d;
            best = q;
          }
        }
        if (best) {
          this.tgt = best;
          this.huntTarget = { x: best.x, z: best.z };
        }
      }
      const ht = this.huntTarget;
      const p = this.tgt || FAR;
      const pd = Math.hypot(p.x - this.x, p.z - this.z);
      if (ht && Math.hypot(ht.x - this.x, ht.z - this.z) < 1.7 && pd > 2.4 && this.stateT > 0.8) {
        // it got to where it saw you, and you're not there
        this.huntTarget = null;
        this.setState('search');
        this.searchDur = 3.5 + Math.random() * 2.5;
        g.onMonsterLost(this);
      }
    } else if (this.state !== 'flee' && this.state !== 'feed') {
      this.huntTarget = null;
      this.howlT -= dt;
      if (this.howlT <= 0 && this.state !== 'idle') {
        this.howlT = 24 + Math.random() * 14;
        this.setState('inhale');
        g.onHowlerInhale(this);
      }
    }
    super.think(dt, t);
  }

  spot(q) {
    this.tgt = q;
    this.huntTarget = { x: q.x, z: q.z };
    this.yaw = Math.atan2(q.x - this.x, q.z - this.z);
    this.state = 'wander';
    this.startHunt(q);
    this.barkT = 1.1;
  }
}

export function createMonster(type, game, id) {
  if (type === 'watcher') return new Watcher(game, id);
  if (type === 'howler') return new Howler(game, id);
  return new Monster(type, game, id);
}

export class ShadeRig {
  constructor() {
    this.rig = buildShade();
  }
  place(x, y, z, yaw) {
    const r = this.rig.root;
    r.position.set(x, y, z);
    r.rotation.y = yaw;
    const n = this.rig.nodes;
    n.head.rotation.z = (Math.random() - 0.5) * 0.9;
    n.head.rotation.x = (Math.random() - 0.5) * 0.4;
    n.torso.rotation.x = (Math.random() - 0.3) * 0.25;
  }
}
