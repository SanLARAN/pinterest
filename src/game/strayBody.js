// The Stray's body (3.0t): Дворняжка — a mongrel that learned to stand like the people it followed, and wears
// what they left behind. From a distance, in the echo, it is a man in a coat too big for him, stooping. Close
// up the coat is a quilted ватник off a dead shift, the legs under it bend the wrong way at the knee, it walks
// on its toes, the arms hang to its knees and end in nails, and the head is a long grey muzzle with its ears
// hanging. It stops to smell the air. It does not look at you; it smells you.
//
// A rig of its own, not the survivor's (the survivor cannot bend its knees backwards), in the shape every
// person-like rig in the game has: { key, root, nodes, parts: [{ node, arr }], dyes } — so `dressPerson`
// (people.js) clothes it in real light and `ghosts.spawn` draws it in the echo, unchanged. The dyed kinds:
// 13 fur, 14 bare skin, 15 the coat, 16 its stitching and lining. KIND.EYE is eyeshine: the only part of it that
// is lit in the dark.
//
// Facing +Z, feet on y = 0. poseStray() is pure: it reads a small state object and writes rotations, so the
// game, the atlas page and the close-up scare all move it with the same code.
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { RNG, clamp, lerp } from '../core/rng.js';

const PI = Math.PI;
export const STRAY_DYES = ['#6e6252', '#8e766c', '#434c3e', '#7f765f']; // mangy fur, bare skin, the ватник, its stitching
const FUR = 13, SKIN = 14, COAT = 15, STITCH = 16;

// ---------------- rig helpers (the shape people.js and ghosts.js read) ----------------
function makeRig(key) {
  return { key, root: new THREE.Object3D(), nodes: {}, parts: [] };
}
function node(R, name, parent, x, y, z) {
  const n = new THREE.Object3D();
  n.position.set(x, y, z);
  (parent || R.root).add(n);
  R.nodes[name] = n;
  n.userData.rest = n.position.clone();
  return n;
}
const _b = new MeshBuilder(1024);
function part(R, n, build) {
  _b.reset();
  build(_b);
  if (_b.count) R.parts.push({ node: n, arr: _b.toArrays() });
}
// a cone from (x, y, z) pointing along (yaw, tilt from straight up): a tuft, a nail, a tooth, a rag's end
function spike(b, x, y, z, yaw, tilt, r, h, kind, segs = 3) {
  b.place(x, y, z, 0, -yaw, -tilt);
  b.cone(segs, r, h, kind);
}

// the bones, rest pose. The leg is a dog's: hip → knee forward and down, knee → hock back and down, hock → the
// ball of the foot almost straight down. 0.06 + 0.36 + 0.34 + 0.22 = 0.98, the height of the hips.
export const STRAY_BONES = {
  hips: [0, 0.98, 0], thigh: [0, -0.36, 0.13], shin: [0, -0.34, -0.16], hock: [0, -0.22, 0.04],
  arm: [0, -0.37, 0.03], fore: [0, -0.36, 0.05], hand: 0.2,
};

export function buildStrayBody() {
  const R = makeRig('stray:dvornyazhka');
  R.root.rotation.order = 'YXZ';
  const B = STRAY_BONES;
  const N = (name, parent, x, y, z) => node(R, name, parent, x, y, z);
  const rnd = new RNG(4417);
  const r = () => rnd.next();

  const hips = N('hips', null, ...B.hips);
  const spine = N('spine', hips, 0, 0.06, 0);
  const chest = N('chest', spine, 0, 0.34, 0.02);
  const neck = N('neck', chest, 0, 0.3, 0.06);
  const head = N('head', neck, 0, 0.13, 0.1);
  const jaw = N('jaw', head, 0, -0.045, 0.05);
  const hackle = N('hackle', chest, 0, 0.27, -0.1);
  const tail = N('tail', hips, 0, -0.04, -0.13);
  const tail1 = N('tail1', tail, 0, -0.17, -0.03);

  // ---- the pelvis: narrow, bony, mostly under the coat
  part(R, hips, (b) => {
    b.place(0, -0.02, -0.01); b.rock(0.11, r, FUR, 0.3, 0.75);
    for (const s of [-1, 1]) { b.place(s * 0.085, 0.0, -0.05); b.octa(0.03, 0.04, KIND.BONE); } // hip bones under the hide
  });

  // ---- the coat, lower half: a ватник two sizes too big, its hem torn, hanging open over a furred belly
  part(R, spine, (b) => {
    b.place(0, -0.26, -0.03); b.taper(0.56, 0.4, 0.44, 0.31, 0.6, COAT, 0.03); // (an A-line: the hem stands off the legs)
    // the belly where the coat hangs open: fur and ribs
    b.place(0, 0.02, 0.13); b.box(0.12, 0.3, 0.04, FUR);
    for (let k = 0; k < 3; k++) { b.identity(); b.limb([-0.06, 0.1 + k * 0.07, 0.15], [0.06, 0.12 + k * 0.07, 0.15], 0.012, 0.012, SKIN, 3); }
    // the quilting: stitched seams round the coat
    for (let k = 0; k < 5; k++) {
      const y = -0.2 + k * 0.12;
      for (const z of [-0.163, 0.16]) { b.place(0, y, z); b.box(z > 0 ? 0.13 : 0.43, 0.012, 0.006, STITCH); }
      for (const s of [-1, 1]) { b.place(s * 0.228, y, 0); b.box(0.006, 0.012, 0.3, STITCH); }
    }
    // the hem, torn into tongues
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * PI * 2;
      const hx = Math.sin(a) * 0.27, hz = Math.cos(a) * 0.19 - 0.03;
      if (hz > 0.1 && Math.abs(hx) < 0.07) continue; // (open at the front)
      spike(b, hx, -0.25, hz, a, PI - 0.1, 0.045, 0.07 + r() * 0.1, COAT, 3);
    }
  });

  // ---- the coat, upper half: shoulders too wide for what is inside them, the collar turned up
  part(R, chest, (b) => {
    b.place(0, -0.02, -0.01); b.taper(0.44, 0.31, 0.52, 0.3, 0.26, COAT, -0.01);
    b.place(0, 0.24, -0.02); b.taper(0.52, 0.3, 0.34, 0.24, 0.08, COAT); // the shoulder line, sloping in
    // the open front: a furred chest, the breastbone showing
    b.place(0, 0.1, 0.15); b.box(0.12, 0.26, 0.03, FUR);
    b.identity(); b.limb([0, 0.0, 0.165], [0, 0.22, 0.16], 0.014, 0.012, KIND.BONE, 3);
    // the collar, standing up round the neck at the back and sides
    for (let i = 0; i < 7; i++) {
      const a = PI + (i / 6 - 0.5) * 2.6;
      b.place(Math.sin(a) * 0.15, 0.33, Math.cos(a) * 0.11 - 0.02, -0.25 * Math.cos(a), a, 0);
      b.box(0.08, 0.1, 0.022, COAT);
    }
    for (let k = 0; k < 2; k++) {
      const y = 0.06 + k * 0.12;
      b.place(0, y, -0.165); b.box(0.46, 0.012, 0.006, STITCH);
      for (const s of [-1, 1]) { b.place(s * 0.17, y, 0.152); b.box(0.12, 0.012, 0.006, STITCH); }
    }
    // a pocket hanging off by one corner, and the lining showing through a tear on the back
    b.place(0.14, -0.0, 0.158, 0, 0, 0.35); b.box(0.09, 0.08, 0.008, STITCH);
    b.place(-0.08, 0.12, -0.163, 0, 0, 0.5); b.box(0.1, 0.05, 0.006, STITCH);
  });

  // ---- the neck: long, mangy, pushed forward out of the collar
  part(R, neck, (b) => {
    b.identity(); b.limb([0, -0.02, -0.02], [0, 0.14, 0.1], 0.07, 0.06, FUR, 5);
    b.place(0, 0.04, 0.05, 0.6, 0, 0); b.box(0.06, 0.1, 0.02, SKIN); // a bald patch on the throat
    for (let i = 0; i < 6; i++) spike(b, (r() - 0.5) * 0.1, 0.02 + r() * 0.1, -0.02 + r() * 0.05, PI + (r() - 0.5) * 1.2, 1.1 + r() * 0.5, 0.02, 0.06, FUR, 3);
  });

  // ---- the hackles: a ridge of fur behind the collar that rises when it is angry (the bone tips it up)
  part(R, hackle, (b) => {
    for (let i = 0; i < 9; i++) {
      const x = (i / 8 - 0.5) * 0.3;
      spike(b, x, 0, 0, PI, 1.25 - Math.abs(x) * 1.2, 0.022, 0.09 + (1 - Math.abs(x) * 3) * 0.05, FUR, 3);
    }
  });

  // ---- the head: a long grey muzzle, a flat skull, the brow over two small eyes that shine
  part(R, head, (b) => {
    b.place(0, 0.01, -0.04); b.rock(0.1, r, FUR, 0.22, 0.78); // the skull
    b.place(0, 0.035, 0.0, 0, 0, 0, 1.1, 0.5, 1.2); b.rock(0.07, r, FUR, 0.2, 0.7); // the brow
    // the muzzle: long, narrowing, a little down
    b.place(0, -0.015, 0.03, PI / 2 - 0.12, 0, 0); b.taper(0.12, 0.1, 0.06, 0.055, 0.21, FUR);
    b.place(0, 0.0, 0.08, PI / 2 - 0.2, 0, 0); b.taper(0.07, 0.03, 0.04, 0.02, 0.15, SKIN); // the bridge, worn bare
    b.place(0, -0.033, 0.245); b.octa(0.028, 0.022, KIND.ROCK); // the nose
    // the upper teeth along the lip: yellow, uneven, one missing
    for (let i = 0; i < 6; i++) {
      if (i === 3) continue;
      for (const s of [-1, 1]) spike(b, s * (0.04 - i * 0.004), -0.055, 0.06 + i * 0.03, 0, PI, 0.007, 0.018 + (i === 0 ? 0.02 : 0), KIND.BONE, 3);
    }
    // the eyes, set deep and to the side: eyeshine, the one thing about it lit in the dark
    for (const s of [-1, 1]) {
      b.place(s * 0.05, 0.012, 0.06, 0, s * 0.5, 0, 1, 0.75, 0.6); b.octa(0.022, 0.018, KIND.ROCK);
      b.place(s * 0.054, 0.012, 0.074, 0, s * 0.5, 0, 1, 0.8, 0.5); b.octa(0.015, 0.012, KIND.EYE);
    }
    // the mange: bare patches on the cheek and the crown
    b.place(0.07, -0.03, 0.02, 0, 0.6, 0); b.box(0.004, 0.05, 0.06, SKIN);
    b.place(-0.03, 0.085, -0.05, 0.3, 0, 0); b.box(0.06, 0.004, 0.05, SKIN);
    for (let i = 0; i < 5; i++) spike(b, (r() - 0.5) * 0.14, 0.05 + r() * 0.04, -0.09 - r() * 0.04, PI, 0.9 + r() * 0.4, 0.018, 0.05, FUR, 3);
  });
  // ---- the jaw on its own hinge: it hangs a little open, and opens wide to take
  part(R, jaw, (b) => {
    b.place(0, -0.012, 0.0, PI / 2 - 0.05, 0, 0); b.taper(0.09, 0.05, 0.045, 0.03, 0.18, FUR);
    b.place(0, 0.0, 0.05, PI / 2 - 0.05, 0, 0); b.taper(0.07, 0.012, 0.035, 0.01, 0.12, KIND.FLESH); // the gum
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) spike(b, s * (0.032 - i * 0.004), 0.004, 0.03 + i * 0.03, 0, 0, 0.006, 0.016 + (i === 0 ? 0.016 : 0), KIND.BONE, 3);
  });
  // ---- the ears: long, hanging, one of them torn
  for (const s of [-1, 1]) {
    const ear = N(s < 0 ? 'earL' : 'earR', head, s * 0.075, 0.05, -0.03);
    part(R, ear, (b) => {
      b.place(0, 0, 0, 0, 0, s * 0.35); b.taper(0.07, 0.025, 0.05, 0.012, -0.17, FUR);
      b.place(0.0, -0.01, 0.012, 0, 0, s * 0.35); b.taper(0.045, 0.004, 0.03, 0.004, -0.13, SKIN); // the inside
      if (s > 0) { b.place(s * 0.07, -0.13, 0.0, 0, 0, s * 0.35); b.box(0.03, 0.04, 0.03, KIND.ROCK); } // the torn edge: a bite out of it
    });
  }

  // ---- the arms: too long, hanging to the knees. The left sleeve is whole, the right one torn off at the elbow
  for (const s of [-1, 1]) {
    const L = s < 0 ? 'L' : 'R';
    const sh = N('sh' + L, chest, s * 0.22, 0.22, 0.0);
    const el = N('el' + L, sh, ...[s * 0.01, B.arm[1], B.arm[2]]);
    const ha = N('ha' + L, el, 0, B.fore[1], B.fore[2]);
    part(R, sh, (b) => {
      b.identity(); b.limb([0, 0.03, 0], B.arm, 0.085, 0.07, COAT, 5); // a sleeve with room for two arms
      for (let k = 1; k < 4; k++) { b.place(0, -k * 0.09, k * 0.007); b.cylinder(6, 0.083 - k * 0.003, 0.083 - k * 0.003, 0.01, STITCH, { capTop: false }); }
      b.identity(); b.limb([0, -0.05, 0], [0, -0.3, 0.025], 0.04, 0.034, FUR, 4); // the arm inside it, glimpsed
    });
    part(R, el, (b) => {
      if (s < 0) {
        b.identity(); b.limb([0, 0, 0], B.fore, 0.072, 0.06, COAT, 5);
        b.place(0, -0.3, 0.04); b.cylinder(6, 0.064, 0.066, 0.03, STITCH); // the cuff, frayed
      } else {
        // torn off at the elbow: a ring of rags, then the bare forearm, thin as a stick
        for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; spike(b, Math.sin(a) * 0.06, -0.02, Math.cos(a) * 0.06, a, PI - 0.35, 0.03, 0.06 + r() * 0.05, COAT, 3); }
        b.place(0, -0.18, 0.03); b.box(0.035, 0.06, 0.04, SKIN); // mange
      }
      b.identity(); b.limb([0, 0, 0], B.fore, 0.04, 0.03, FUR, 4);
    });
    // the hand: a narrow palm, four long fingers and the nails — a hand that walked on the ground
    part(R, ha, (b) => {
      b.place(0, -0.035, 0.0); b.box(0.06, 0.07, 0.035, SKIN);
      for (let f = 0; f < 4; f++) {
        const x = (f - 1.5) * 0.017;
        const len = 0.11 + (f === 1 || f === 2 ? 0.03 : 0);
        b.identity(); b.limb([x, -0.06, 0.01], [x * 1.4, -0.06 - len, 0.04], 0.009, 0.007, SKIN, 3);
        spike(b, x * 1.4, -0.06 - len, 0.04, 0, PI - 0.4, 0.007, 0.045, KIND.BONE, 3);
      }
      b.identity(); b.limb([s * -0.03, -0.04, 0.02], [s * -0.04, -0.1, 0.06], 0.009, 0.007, SKIN, 3); // the dew-claw thumb
    });
  }

  // ---- the legs: a dog's, the knee forward, the hock back, standing on its toes
  for (const s of [-1, 1]) {
    const L = s < 0 ? 'L' : 'R';
    const th = N('th' + L, hips, s * 0.11, -0.06, 0);
    const kn = N('kn' + L, th, ...B.thigh);
    const hk = N('hk' + L, kn, ...B.shin);
    const pw = N('pw' + L, hk, ...B.hock);
    part(R, th, (b) => {
      b.identity(); b.limb([0, 0.02, -0.02], B.thigh, 0.095, 0.062, FUR, 5); // the haunch
      // what is left of a trouser leg on one side: a rag tied at the thigh
      if (s < 0) { b.place(0, -0.16, 0.06, -0.35, 0, 0); b.cylinder(6, 0.08, 0.075, 0.08, STITCH); }
      for (let i = 0; i < 3; i++) spike(b, s * 0.06, -0.08 - i * 0.08, -0.02 + i * 0.03, s * PI / 2, 2.2, 0.02, 0.05, FUR, 3);
    });
    part(R, kn, (b) => {
      b.identity(); b.limb([0, 0, 0], B.shin, 0.055, 0.032, FUR, 4);
      b.place(0, 0.0, 0.035); b.octa(0.03, 0.03, KIND.BONE); // the knee, bony
      b.place(0, -0.15, -0.07); b.box(0.03, 0.08, 0.03, SKIN); // mange down the shin
    });
    part(R, hk, (b) => {
      b.place(0, 0, -0.02); b.octa(0.03, 0.035, KIND.BONE); // the hock: the heel, high off the ground
      b.identity(); b.limb([0, 0, 0], B.hock, 0.032, 0.028, FUR, 4);
    });
    // the foot: four toes splayed on the ground and their nails, which is what you hear on boards
    part(R, pw, (b) => {
      b.place(0, 0.02, 0.03); b.box(0.07, 0.035, 0.07, SKIN);
      for (let f = 0; f < 4; f++) {
        const x = (f - 1.5) * 0.019;
        b.place(x * 1.2, 0.016, 0.075 + (f === 1 || f === 2 ? 0.012 : 0)); b.box(0.016, 0.026, 0.035, SKIN);
        spike(b, x * 1.2, 0.012, 0.09 + (f === 1 || f === 2 ? 0.012 : 0), 0, PI / 2 + 0.25, 0.006, 0.03, KIND.BONE, 3);
      }
    });
  }

  // ---- the tail: nearly bald, thin, hanging out from under the coat
  part(R, tail, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.17, -0.03], 0.025, 0.018, SKIN, 4); spike(b, 0, -0.02, -0.01, PI, 2.4, 0.03, 0.05, FUR, 3); });
  part(R, tail1, (b) => { b.identity(); b.limb([0, 0, 0], [0, -0.16, 0.03], 0.018, 0.006, SKIN, 3); });

  // (as the survivors' dyes: the hex goes in as it is, no sRGB → linear darkening — see dyeColors in survivor.js)
  R.dyes = STRAY_DYES.map((h) => new THREE.Color().setHex(parseInt(h.slice(1), 16), THREE.LinearSRGBColorSpace));
  return R;
}

export function strayVerts(R) {
  return R.parts.reduce((n, p) => n + p.arr.count, 0);
}

// ---------------- moving it ----------------
// st: { t, dt, mode, speed, sniff, anger } — mode is the controller's phase ('follow', 'anger', 'chase', 'grab',
// 'leave', 'wear', 'away' or 'idle'); speed m/s; sniff 0..1 (it has stopped to smell the air); anger 0..1.
//
// The gait is a stop-motion one: the cycle is read in eighths and the pose snaps from one to the next, then
// holds — a thing that walks like it remembers how, not like it learned. Everything else is blended on the rig's
// own state (R.pose), so phases never pop.
const STEP8 = PI / 4;
function jerk(ph) {
  const k = Math.floor(ph / STEP8);
  const f = ph / STEP8 - k;
  return (k + f * f * f * f) * STEP8; // snap late, hold long
}
const ease = (cur, want, k) => cur + (want - cur) * k;

export function poseStray(R, st = {}) {
  const n = R.nodes;
  const dt = clamp(st.dt ?? 1 / 60, 0, 0.1);
  const t = st.t ?? 0;
  const mode = st.mode || 'follow';
  const speed = Math.max(0, st.speed || 0);
  const P = R.pose || (R.pose = { ph: 0, run: 0, sniff: 0, anger: 0, grab: 0, hunt: 0, earL: 0, earR: 0, tw: 0, twT: 1.5, nod: 0 });
  const k = 1 - Math.exp(-dt * 7);
  // the blends
  P.run = ease(P.run, mode === 'chase' ? 1 : 0, 1 - Math.exp(-dt * 5));
  P.grab = ease(P.grab, mode === 'grab' ? 1 : 0, 1 - Math.exp(-dt * 9));
  P.anger = ease(P.anger, mode === 'anger' ? Math.max(0.5, st.anger || 0) : mode === 'chase' ? 0.6 : 0, k);
  P.sniff = ease(P.sniff, clamp(st.sniff || 0, 0, 1) * (1 - P.run), 1 - Math.exp(-dt * 4));
  P.hunt = ease(P.hunt, mode === 'leave' ? 1 : 0, 1 - Math.exp(-dt * 2));
  const amp = clamp(speed / 1.6, 0, 1.3) * (1 - P.grab);
  // the gait: a walk on two legs, a gallop on four when it chases
  P.ph += dt * (speed * (P.run > 0.5 ? 2.6 : 3.4) + 0.001);
  const ph = P.run > 0.5 ? P.ph : jerk(P.ph);
  const s = Math.sin(ph), c = Math.cos(ph);
  const run = P.run, walk = 1 - run;

  // the body: stooped when it walks, nearly flat when it runs, upright when it takes
  const crouch = P.anger * 0.12;
  n.hips.position.y = STRAY_BONES.hips[1] - Math.abs(c) * 0.035 * amp * walk - run * 0.16 - crouch + P.grab * 0.06;
  n.hips.rotation.set(-run * 0.15, 0, Math.sin(ph) * 0.07 * amp * walk);
  n.spine.rotation.set(lerp(0.24 + P.hunt * 0.1, 0.62, run) + crouch - P.grab * 0.3 + P.sniff * -0.08, 0, 0);
  const tremble = P.anger * Math.sin(t * 41) * 0.025;
  n.chest.rotation.set(lerp(0.3, 0.52, run) - P.grab * 0.42 + Math.sin(ph * 2) * 0.03 * amp, Math.sin(ph) * 0.06 * amp * walk, tremble);
  const lean = n.spine.rotation.x + n.chest.rotation.x; // how far the shoulders are tipped forward

  // the head looks level whatever the body does: up when it runs, up and twitching when it smells the air
  P.nod = Math.max(0, P.nod - dt);
  const sniffNod = P.sniff * (Math.sin(t * 26) > 0.2 ? Math.sin(t * 26) * 0.07 : 0);
  n.neck.rotation.set(-lean * 0.55 - P.sniff * 0.45 + P.anger * 0.05 - run * 0.25 + P.hunt * 0.25, (st.look || 0) * 0.5, 0);
  n.head.rotation.set(-lean * 0.3 - P.sniff * 0.3 + sniffNod + Math.sin(ph * 2) * 0.05 * amp - P.grab * 0.2 - P.anger * 0.12, (st.look || 0) * 0.5 + P.grab * Math.sin(t * 17) * 0.12, P.grab * Math.sin(t * 29) * 0.08 + P.sniff * Math.sin(t * 1.3) * 0.12);
  n.jaw.rotation.x = 0.06 + P.anger * (0.22 + Math.sin(t * 33) * 0.04) + run * 0.25 + P.grab * 0.75;
  n.hackle.rotation.x = -P.anger * 0.95 - run * 0.5;

  // the ears hang and swing with the head; they lift when it listens and flatten when it runs
  P.twT -= dt;
  if (P.twT <= 0) { P.twT = 0.8 + ((t * 7.3) % 1) * 2.6; P.tw = 1; }
  P.tw = Math.max(0, P.tw - dt * 5);
  const lift = P.sniff * 0.45 - run * 0.6 - P.anger * 0.3;
  for (const [e, sd] of [[n.earL, -1], [n.earR, 1]]) {
    if (!e) continue;
    const sw = Math.sin(ph * 2 + sd) * 0.18 * amp;
    e.rotation.set(-lift + sw - run * 0.5, 0, sd * (0.15 + lift * 0.5) + (sd > 0 ? Math.sin(P.tw * PI) * 0.3 : 0));
  }

  // the arms: long and loose, hanging past the hips and swinging late; forelegs when it runs; out when it takes
  for (const [L, sd] of [['L', -1], ['R', 1]]) {
    const sh = n['sh' + L], el = n['el' + L];
    const sw = sd < 0 ? s : -s;
    const hang = -lean * 0.9 + 0.12; // hang straight down from a tipped torso, a little forward
    const gallop = -lean + 0.25 + Math.sin(P.ph + (sd < 0 ? 0 : 0.6)) * 0.75; // forelegs: reach and pull
    const take = -1.2 + Math.sin(t * 13 + sd) * 0.05; // at the throat of someone standing in front of it
    sh.rotation.set(lerp(lerp(hang + sw * 0.32 * amp, gallop, run), take, P.grab), 0, sd * (0.08 + P.anger * 0.35 - P.grab * 0.05) + tremble);
    el.rotation.set(lerp(-0.22 - amp * 0.12 - P.anger * 0.3, -0.35 - Math.max(0, Math.cos(P.ph)) * 0.6, run) * (1 - P.grab) - P.grab * 0.08, 0, 0);
    const ha = n['ha' + L];
    if (ha) ha.rotation.set(-0.2 * run + P.grab * 0.6 - P.anger * 0.4, 0, 0); // fingers spread up, nails out
  }

  // the legs: a dog's walk on two legs — the thigh swings, the knee and the hock fold together in the swing
  for (const [L, sd] of [['L', -1], ['R', 1]]) {
    const th = n['th' + L], kn = n['kn' + L], hk = n['hk' + L], pw = n['pw' + L];
    const lph = run > 0.5 ? P.ph + (sd < 0 ? 0 : 0.35) : sd < 0 ? ph : ph + PI; // a bound: both legs nearly together
    const ls = Math.sin(lph), lc = Math.cos(lph);
    const amp2 = run > 0.5 ? 1.15 : amp;
    const fold = Math.max(0, lc) * amp2;
    const thx = -ls * 0.5 * amp2 - run * 0.55 + crouch * 2.2 - P.grab * 0.1;
    th.rotation.set(thx, 0, sd * -0.04);
    kn.rotation.set(fold * 0.55 + crouch * 1.6 + run * 0.35, 0, 0);
    hk.rotation.set(-fold * 0.75 - crouch * 1.4 - run * 0.2, 0, 0);
    pw.rotation.set(-(thx + kn.rotation.x + hk.rotation.x) + fold * 0.3, 0, 0); // the toes find the ground
  }

  // the tail: hangs and sways; between the legs when it leaves, stiff and out when it is angry
  n.tail.rotation.set(0.35 + Math.sin(t * 2.1) * 0.1 - P.anger * 0.8 + P.hunt * 0.4 - run * 0.9, Math.sin(t * 1.4 + ph) * 0.25 * (1 - P.anger), 0);
  n.tail1.rotation.set(0.2 + Math.sin(t * 2.1 - 0.7) * 0.15, 0, 0);

  // nothing goes into the ground: a crouch or a gallop that would sink a foot or a hand lifts the whole body
  // instead. (Measured on the toes and the fingertips in the rig's own frame; it only ever lifts.)
  const low = lowestPoint(R);
  if (low < 0) n.hips.position.y -= low;
}

const _inv = new THREE.Matrix4(), _v = new THREE.Vector3();
const PROBES = [['pwL', [0, 0.0, 0.1]], ['pwR', [0, 0.0, 0.1]], ['pwL', [0, 0, -0.03]], ['pwR', [0, 0, -0.03]], ['haL', [0, -0.21, 0.05]], ['haR', [0, -0.21, 0.05]]];
function lowestPoint(R) {
  R.root.updateWorldMatrix(true, true);
  _inv.copy(R.root.matrixWorld).invert();
  let m = Infinity;
  for (const [name, p] of PROBES) {
    const nd = R.nodes[name];
    if (!nd) continue;
    _v.set(p[0], p[1], p[2]).applyMatrix4(nd.matrixWorld).applyMatrix4(_inv);
    m = Math.min(m, _v.y);
  }
  return m;
}

// the close-up of the scare: it rises off its toes in front of you, the jaw open, both hands coming up
export function poseStrayLunge(R, tt) {
  poseStray(R, { t: tt, dt: 1 / 30, mode: 'grab', speed: 0 });
  const n = R.nodes;
  n.head.rotation.set(-0.15 + Math.sin(tt * 21) * 0.06, Math.sin(tt * 17) * 0.12, Math.sin(tt * 29) * 0.09);
  n.jaw.rotation.x = 0.85 + Math.sin(tt * 31) * 0.12;
  n.hackle.rotation.x = -1;
}
