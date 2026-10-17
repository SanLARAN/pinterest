// The survivor: a teammate in co-op — and you, in the wardrobe. Seen in the game only as a cold afterimage
// in the player's colour, like everything else; the clothes show in the fill (and in daylight, or under a work
// lamp, in full). The same rig, nodes and walk cycle for every outfit: only the pieces hung on the bones change.
//
// Dyed surfaces carry their own material kinds past the forest palette; the colours are uniforms, so recolouring
// never rebuilds anything:
//   13 / 14 = headwear main / accent, 15 / 16 = outfit main / accent, 17 / 18 = a light in the accent colour
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { clamp, lerp } from '../core/rng.js';
import { cleanFit, shapeKey } from './outfit.js';

export const DYE = { HA: 13, HB: 14, BA: 15, BB: 16, HG: 17, BG: 18 };
const { HA, HB, BA, BB, HG } = DYE;
const PI = Math.PI;

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
const _b = new MeshBuilder(1024);
function part(rig, n, build) {
  _b.reset();
  build(_b);
  if (_b.count) rig.parts.push({ node: n, arr: _b.toArrays() });
}

// a surface of revolution around +y. prof = [[radius, y], ...] bottom → top. ribs: the radius swells by
// (1 + amp·cos(n·θ)) — a pumpkin's lobes. hide = 5 draws only the vertical seams
function lathe(b, prof, segs, kind, { ribN = 0, amp = 0, phase = 0, hide = 0 } = {}) {
  const P = (r, y, i) => {
    const a = phase + (i / segs) * PI * 2;
    const rr = r * (1 + amp * Math.cos(ribN * (a - phase)));
    return [Math.cos(a) * rr, y, Math.sin(a) * rr];
  };
  for (let j = 0; j < prof.length - 1; j++) {
    const [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
    for (let i = 0; i < segs; i++) {
      const p0 = P(r0, y0, i), p1 = P(r0, y0, i + 1), q0 = P(r1, y1, i), q1 = P(r1, y1, i + 1);
      if (r0 < 1e-4) b.tri(p1, q0, q1, kind, 1 & hide ? 2 : 0);
      else if (r1 < 1e-4) b.tri(p1, p0, q0, kind, 1 & hide ? 1 : 0);
      else b.quad(p1, p0, q0, q1, kind, hide);
    }
  }
}

// a cone of straw / a rag tail: base at (x, y, z), pointing along the direction (yaw, tilt from straight up)
function spike(b, x, y, z, yaw, tilt, r, h, kind, segs = 3) {
  b.place(x, y, z, 0, -yaw, -tilt);
  b.cone(segs, r, h, kind);
}

// ---------------- the body underneath ----------------
function face(R) {
  part(R, R.nodes.head, (b) => {
    b.identity(); b.octa(0.115, 0.15, KIND.FLESH);
    for (const s of [-1, 1]) { b.place(s * 0.04, -0.006, 0.07, 0, s * 0.35, 0, 1, 0.8, 0.5); b.octa(0.017, 0.017, KIND.ROCK); }
  });
}
function hands(R, kind = KIND.FLESH, r = 0.042, h = 0.06) {
  for (const L of ['L', 'R']) part(R, R.nodes['el' + L], (b) => { b.place(0, -0.305, 0.066); b.octa(r, h, kind); });
}
// sleeves, trousers and boots: per side, (b, s) with s = -1 / +1
function limbs(R, { upper, fore, thigh, shin }) {
  for (const s of [-1, 1]) {
    const L = s < 0 ? 'L' : 'R';
    if (upper) part(R, R.nodes['sh' + L], (b) => upper(b, s));
    if (fore) part(R, R.nodes['el' + L], (b) => fore(b, s));
    if (thigh) part(R, R.nodes['th' + L], (b) => thigh(b, s));
    if (shin) part(R, R.nodes['kn' + L], (b) => shin(b, s));
  }
}
const ARM = [0, -0.3, 0.02]; // shoulder → elbow (x mirrored)
const FORE = [0, -0.27, 0.06]; // elbow → wrist
const THIGH = [0, -0.42, 0.02];
const SHIN = [0, -0.42, -0.02];

// ---------------- outfits ----------------
const BODY = {
  // the kit you came with: windbreaker, backpack, bedroll
  jacket(R) {
    const n = R.nodes;
    part(R, n.hips, (b) => { b.place(0, -0.06, 0); b.box(0.32, 0.16, 0.2, KIND.WOOD); });
    part(R, n.chest, (b) => {
      b.place(0, -0.075, 0); b.taper(0.33, 0.2, 0.42, 0.24, 0.635, BA); // (reaches down over the belt: no gap at the waist)
      b.place(0, 0.53, 0.005); b.taper(0.3, 0.2, 0.22, 0.17, 0.08, BA); // collar
      b.place(0, 0.3, -0.17); b.box(0.3, 0.38, 0.14, BB); // backpack
      b.place(0, 0.2, -0.25); b.box(0.2, 0.15, 0.04, BB); // its pocket
      b.place(-0.16, 0.52, -0.13, 0, 0, -PI / 2); b.cylinder(6, 0.055, 0.055, 0.32, BB, { ringEdges: false }); // bedroll
      for (const s of [-1, 1]) { // straps: over the shoulder and flat down the chest
        b.place(s * 0.1, 0.566, -0.01); b.box(0.036, 0.014, 0.23, BB);
        b.place(s * 0.1, 0.36, 0.1196, 0.0315, 0, 0); b.box(0.036, 0.42, 0.012, BB);
      }
    });
    limbs(R, {
      upper: (b, s) => { b.identity(); b.limb([0, 0, 0], [s * 0.04, -0.3, 0.02], 0.058, 0.048, BA, 5); },
      fore: (b) => { b.identity(); b.limb([0, 0, 0], FORE, 0.048, 0.04, BA, 5); },
      thigh: (b) => { b.identity(); b.limb([0, 0, 0], THIGH, 0.075, 0.06, KIND.WOOD, 5); },
      shin: (b) => { b.identity(); b.limb([0, 0, 0], SHIN, 0.06, 0.047, KIND.WOOD, 5); b.place(0, -0.44, 0.05); b.box(0.11, 0.08, 0.25, KIND.ROCK); },
    });
    hands(R);
  },

  // Taiga: knee-length sheepskin, fleece collar and cuffs, a red sash, felt boots, mittens
  tulup(R) {
    const n = R.nodes;
    part(R, n.hips, (b) => {
      b.place(0, -0.5, 0); b.taper(0.56, 0.38, 0.4, 0.27, 0.53, BA); // the skirt of the coat
      b.place(0, -0.535, 0); b.taper(0.6, 0.42, 0.575, 0.395, 0.06, BB); // fleece hem
      b.identity(); b.limb([0, -0.48, 0.17], [0, 0.0, 0.13], 0.012, 0.012, BB, 3); // the front edge
    });
    part(R, n.chest, (b) => {
      b.place(0, -0.08, 0); b.taper(0.4, 0.27, 0.46, 0.28, 0.64, BA);
      b.place(0, 0.48, 0, 0, PI / 8, 0, 1, 1, 0.78); b.cylinder(8, 0.245, 0.165, 0.13, BB); // the big fleece collar
      b.place(0, -0.01, 0, 0, PI / 8, 0, 1, 1, 0.66); b.cylinder(8, 0.218, 0.218, 0.075, KIND.EFFIGY); // sash
      b.identity(); b.limb([0.13, 0.02, 0.13], [0.16, -0.2, 0.15], 0.018, 0.012, KIND.EFFIGY, 3); // its loose end
    });
    limbs(R, {
      upper: (b, s) => { b.identity(); b.limb([0, 0, 0], [s * 0.04, -0.3, 0.02], 0.075, 0.066, BA, 6); },
      fore: (b) => {
        b.identity(); b.limb([0, 0, 0], [0, -0.24, 0.053], 0.066, 0.06, BA, 6);
        b.limb([0, -0.2, 0.045], [0, -0.255, 0.057], 0.078, 0.075, BB, 6); // fleece cuff
      },
      thigh: (b) => { b.identity(); b.limb([0, 0, 0], THIGH, 0.078, 0.064, KIND.WOOD, 5); },
      shin: (b) => {
        b.identity(); b.limb([0, -0.04, 0], [0, -0.41, -0.02], 0.078, 0.072, KIND.ROCK, 6); // valenki
        b.place(0, -0.43, 0.04); b.box(0.13, 0.09, 0.24, KIND.ROCK);
      },
    });
    hands(R, BB, 0.05, 0.068); // mittens
  },

  // the Zone: rubberised hazmat suit, tank on the back, gloves and boots
  hazmat(R) {
    const n = R.nodes;
    part(R, n.hips, (b) => {
      b.place(0, -0.06, 0); b.box(0.37, 0.18, 0.25, BA);
      b.place(0, 0.0, 0); b.box(0.39, 0.05, 0.27, BB); // belt
      b.place(0.15, -0.05, 0.13); b.box(0.09, 0.1, 0.05, BB); // pouch
      b.place(-0.19, -0.05, 0.02); b.box(0.04, 0.11, 0.1, BB);
    });
    part(R, n.chest, (b) => {
      b.place(0, -0.08, 0); b.taper(0.41, 0.27, 0.49, 0.3, 0.66, BA);
      b.place(0, 0.55, 0.005, 0, PI / 8, 0); b.cylinder(8, 0.16, 0.135, 0.065, BB); // neck seal
      b.identity(); b.limb([0, 0.03, 0.137], [0, 0.55, 0.152], 0.013, 0.013, BB, 4); // zip
      b.place(0.115, 0.38, 0.1565, 0.0227, 0, 0); b.box(0.1, 0.1, 0.02, BB); // badge
      b.place(0, 0.07, -0.25); b.cylinder(8, 0.088, 0.088, 0.42, BB, { capBottom: true }); // air tank
      b.place(0, 0.49, -0.25); b.cylinder(6, 0.03, 0.024, 0.06, KIND.METAL); // valve
      b.place(0, 0.3, -0.155); b.box(0.24, 0.05, 0.03, BB); // tank bracket
      for (const s of [-1, 1]) { // harness
        b.place(s * 0.11, 0.586, -0.02); b.box(0.04, 0.014, 0.27, BB);
        b.place(s * 0.11, 0.33, 0.1503, 0.0227, 0, 0); b.box(0.04, 0.5, 0.012, BB);
      }
    });
    limbs(R, {
      upper: (b, s) => { b.identity(); b.limb([0, 0, 0], [s * 0.04, -0.3, 0.02], 0.082, 0.072, BA, 6); },
      fore: (b) => {
        b.identity(); b.limb([0, 0, 0], [0, -0.23, 0.05], 0.072, 0.064, BA, 6);
        b.limb([0, -0.19, 0.043], [0, -0.25, 0.056], 0.076, 0.07, BB, 6); // glove cuff
      },
      thigh: (b) => { b.identity(); b.limb([0, 0, 0], THIGH, 0.092, 0.078, BA, 6); },
      shin: (b) => {
        b.identity(); b.limb([0, 0, 0], [0, -0.2, 0], 0.078, 0.07, BA, 6);
        b.limb([0, -0.18, 0], [0, -0.41, -0.02], 0.082, 0.078, BB, 6); // rubber boots
        b.place(0, -0.44, 0.045); b.box(0.135, 0.09, 0.26, BB);
      },
    });
    hands(R, BB, 0.056, 0.076); // gloves
  },

  // Halloween: a patched shirt, straw out of every opening, denim, and a crow
  scarecrow(R) {
    const n = R.nodes;
    part(R, n.hips, (b) => {
      b.place(0, -0.06, 0); b.box(0.32, 0.16, 0.2, KIND.WATER);
      b.place(0, 0.035, 0, 0, PI / 7, 0, 1, 1, 0.66); b.cylinder(7, 0.2, 0.2, 0.035, KIND.WOOD); // rope belt
    });
    part(R, n.chest, (b) => {
      b.place(0, -0.075, 0); b.taper(0.35, 0.22, 0.44, 0.26, 0.635, BA);
      // ragged shirt tails
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * PI * 2 + 0.2;
        b.place(Math.cos(a) * 0.165, -0.05, Math.sin(a) * 0.1, PI + Math.sin(a * 3) * 0.12, 0, Math.cos(a) * 0.25);
        b.cone(3, 0.06, 0.13 + 0.05 * ((i * 7) % 3) / 2, BA);
      }
      // patches
      b.place(0.09, 0.36, 0.122, 0, 0, 0.3); b.box(0.09, 0.08, 0.022, BB);
      b.place(-0.1, 0.13, 0.112, 0, 0, -0.2); b.box(0.075, 0.07, 0.022, BB);
      // straw at the collar
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * PI * 2 + 0.3;
        spike(b, Math.cos(a) * 0.1, 0.53, Math.sin(a) * 0.07, a, 1.05, 0.024, 0.11 + 0.03 * (i % 2), BB);
      }
    });
    // the crow, on the left shoulder (its own bone: the wardrobe lets it look around)
    const crow = node(R, 'crow', n.chest, -0.262, 0.575, -0.015);
    part(R, crow, (b) => {
      b.place(0, 0.03, 0, 0.25, 0, 0, 0.85, 0.8, 1.45); b.octa(0.05, 0.06, KIND.ROCK); // body
      b.place(0, 0.035, -0.07, -PI / 2 - 0.35, 0, 0); b.cone(4, 0.032, 0.1, KIND.ROCK); // tail
      for (const s of [-1, 1]) { b.place(s * 0.04, 0.035, -0.005, 0.2, 0, s * 0.25, 0.4, 0.7, 1.4); b.octa(0.04, 0.05, KIND.ROCK); } // wings
    });
    const crowHead = node(R, 'crowHead', crow, 0, 0.085, 0.045);
    part(R, crowHead, (b) => {
      b.identity(); b.octa(0.032, 0.035, KIND.ROCK);
      b.place(0, -0.004, 0.026, PI / 2, 0, 0); b.cone(3, 0.012, 0.05, KIND.BONE); // beak
      for (const s of [-1, 1]) { b.place(s * 0.022, 0.008, 0.012); b.octa(0.007, 0.007, KIND.EYE); }
    });
    limbs(R, {
      upper: (b, s) => { b.identity(); b.limb([0, 0, 0], [s * 0.04, -0.3, 0.02], 0.06, 0.052, BA, 5); },
      fore: (b, s) => {
        b.identity(); b.limb([0, 0, 0], [0, -0.25, 0.055], 0.052, 0.047, BA, 5);
        for (let i = 0; i < 4; i++) { // straw where the hand should be
          const a = (i / 4) * PI * 2 + s * 0.4;
          spike(b, Math.cos(a) * 0.022, -0.24, 0.055 + Math.sin(a) * 0.022, a, 2.55, 0.02, 0.1 + 0.025 * (i % 2), BB);
        }
      },
      thigh: (b) => { b.identity(); b.limb([0, 0, 0], THIGH, 0.076, 0.062, KIND.WATER, 5); },
      shin: (b, s) => {
        b.identity(); b.limb([0, 0, 0], SHIN, 0.062, 0.05, KIND.WATER, 5);
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * PI * 2 + s * 0.5;
          spike(b, Math.cos(a) * 0.04, -0.33, Math.sin(a) * 0.035, a, 2.45, 0.02, 0.085, BB);
        }
        b.place(0, -0.44, 0.05); b.box(0.115, 0.08, 0.25, KIND.BARK);
      },
    });
  },
};

// ---------------- headwear ----------------
const HEAD = {
  // the windbreaker's hood, drawstrings pulled tight
  hood(R) {
    face(R);
    part(R, R.nodes.head, (b) => {
      b.place(0, 0.02, -0.02, -0.25, 0, 0); b.cone(7, 0.17, 0.32, HA);
      for (const s of [-1, 1]) {
        b.identity(); b.limb([s * 0.055, -0.03, 0.118], [s * 0.062, -0.165, 0.128], 0.008, 0.008, HB, 3);
        b.place(s * 0.062, -0.18, 0.128); b.octa(0.016, 0.022, HB);
      }
    });
  },

  // Taiga: a fur drum, flaps down, the front folded up, a badge
  ushanka(R) {
    face(R);
    part(R, R.nodes.head, (b) => {
      b.place(0, 0.065, -0.005, 0, PI / 8, 0); b.cylinder(8, 0.155, 0.145, 0.14, HA, { capTop: false });
      b.place(0, 0.205, -0.005, 0, PI / 8, 0); b.cone(8, 0.145, 0.035, HA, { capBottom: false });
      b.place(0, 0.135, 0.135, -0.2, 0, 0); b.box(0.3, 0.115, 0.05, HA); // front flap, folded up
      for (const s of [-1, 1]) { b.place(s * 0.15, -0.02, -0.005, 0, 0, s * 0.1); b.box(0.046, 0.19, 0.145, HA); } // ear flaps
      b.place(0, 0.045, -0.142, 0.15, 0, 0); b.box(0.28, 0.12, 0.046, HA); // back flap
      b.place(0, 0.14, 0.163, PI / 2 - 0.2, 0, 0); b.cone(5, 0.034, 0.02, HB, { phase: PI / 2 }); // badge
    });
  },

  // the Zone: a rubber helmet-mask, round glowing lenses, a filter can
  gasmask(R) {
    part(R, R.nodes.head, (b) => {
      b.identity();
      lathe(b, [[0, -0.155], [0.098, -0.135], [0.13, -0.06], [0.137, 0.04], [0.122, 0.13], [0.072, 0.19], [0, 0.206]], 8, HA, { phase: PI / 8 });
      for (const s of [-1, 1]) {
        b.place(s * 0.053, 0.035, 0.108, PI / 2, 0, 0); b.cylinder(7, 0.047, 0.044, 0.034, KIND.METAL, { capTop: false }); // rims
        b.place(s * 0.053, 0.035, 0.132, PI / 2, 0, 0); b.cylinder(7, 0.039, 0.039, 0.006, HG); // the glass
      }
      b.place(0, -0.07, 0.11, PI / 2 + 0.55, 0, 0); b.cylinder(8, 0.036, 0.036, 0.05, HA); // valve
      b.place(0, -0.095, 0.145, PI / 2 + 0.55, 0, 0); b.cylinder(8, 0.06, 0.06, 0.085, KIND.METAL, { capBottom: true }); // filter
      for (const s of [-1, 1]) { b.identity(); b.limb([s * 0.125, 0.09, 0.02], [s * 0.1, 0.13, -0.11], 0.014, 0.014, HA, 3); } // straps
    });
  },

  // Halloween: a carved pumpkin, a candle inside
  pumpkin(R) {
    part(R, R.nodes.head, (b) => {
      b.place(0, 0.005, 0.005);
      lathe(b, [[0, -0.13], [0.12, -0.112], [0.195, -0.052], [0.212, 0.022], [0.188, 0.095], [0.11, 0.14], [0, 0.146]], 16, HA, { ribN: 8, amp: 0.06, phase: PI / 2, hide: 5 });
      b.place(0.0, 0.135, 0.0, 0.18, 0, 0.22); b.cylinder(5, 0.026, 0.017, 0.085, KIND.LEAF);
      b.place(0.035, 0.155, 0.012, 0, 0.4, 1.15); b.cone(3, 0.022, 0.075, KIND.LEAF);
      // the carving faces out of the front lobe: two eyes, a nose, a grin with two teeth
      const carve = (x, y, ry, pts) => {
        const z = Math.sqrt(Math.max(0, 0.226 * 0.226 - x * x)) + 0.002;
        b.place(x, y, z, 0, ry, 0);
        for (let i = 0; i + 2 < pts.length; i += 3) b.triN(pts[i], pts[i + 1], pts[i + 2], [0, 0, 1], HG);
      };
      for (const s of [-1, 1]) carve(s * 0.072, 0.045, s * 0.33, [[-0.035, -0.022, 0], [0.035, -0.022, 0], [s * 0.012, 0.042, 0]]);
      carve(0, -0.005, 0, [[-0.016, -0.012, 0], [0.016, -0.012, 0], [0, 0.016, 0]]);
      // the grin: three pieces round the lobe, the gaps between them are the teeth.
      // each piece: left edge (centre eL, height hL) → right edge (eR, hR)
      const grin = (xc, yc, w, eL, hL, eR, hR) => {
        const BL = [-w / 2, eL - hL / 2, 0], BR = [w / 2, eR - hR / 2, 0], TR = [w / 2, eR + hR / 2, 0], TL = [-w / 2, eL + hL / 2, 0];
        carve(xc, yc, Math.asin(clamp(xc / 0.22, -1, 1)), [BL, BR, TR, BL, TR, TL]);
      };
      grin(-0.084, -0.05, 0.064, 0.014, 0.024, -0.004, 0.04);
      grin(0, -0.062, 0.07, 0, 0.042, 0, 0.042);
      grin(0.084, -0.05, 0.064, -0.004, 0.04, 0.014, 0.024);
    });
  },
};

// ---------------- dyes ----------------
// the hex is used as-is (the renderers output linear values straight to the screen), so the cloth on the
// plate matches the swatch you picked
export function dyeColors(fit, out = null) {
  const o = out || [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()];
  const hex = [fit.hc[0], fit.hc[1], fit.bc[0], fit.bc[1]];
  for (let i = 0; i < 4; i++) o[i].setHex(parseInt(hex[i].slice(1), 16), THREE.LinearSRGBColorSpace);
  return o;
}

export function buildSurvivor(fitIn = null) {
  const fit = cleanFit(fitIn);
  const R = makeRig('survivor:' + shapeKey(fit));
  R.root.rotation.order = 'YXZ'; // turn first, then (when dead) tip over
  R.fit = fit;
  const N = (name, parent, x, y, z) => node(R, name, parent, x, y, z);
  const hips = N('hips', null, 0, 0.94, 0);
  const chest = N('chest', hips, 0, 0.06, 0);
  N('head', chest, 0, 0.66, 0.02);
  for (const s of [-1, 1]) {
    const L = s < 0 ? 'L' : 'R';
    const sh = N('sh' + L, chest, s * 0.24, 0.5, 0);
    N('el' + L, sh, s * 0.04, ARM[1], ARM[2]);
    const th = N('th' + L, hips, s * 0.1, -0.08, 0);
    N('kn' + L, th, 0, -0.42, 0.02);
  }
  BODY[fit.body](R);
  HEAD[fit.head](R);
  R.dyes = dyeColors(fit);
  return R;
}

// walk cycle + crouch + lying dead
export function poseSurvivor(rig, phase, speed, crouch, dead) {
  const n = rig.nodes;
  if (dead) {
    rig.root.rotation.x = -PI / 2;
    n.hips.position.y = 0.2;
    n.chest.rotation.set(0, 0, 0);
    n.head.rotation.set(0, 0, 0.6);
    n.shL.rotation.set(-2.6, 0, -0.3); n.shR.rotation.set(-0.4, 0, 0.5);
    n.elL.rotation.x = -0.2; n.elR.rotation.x = -0.35;
    n.thL.rotation.set(0.2, 0, 0); n.thR.rotation.set(-0.15, 0, 0);
    n.knL.rotation.x = 0.4; n.knR.rotation.x = 0.1;
    return;
  }
  rig.root.rotation.x = 0;
  const amp = clamp(speed / 3.2, 0, 1.4);
  const s = Math.sin(phase);
  n.hips.position.y = crouch ? 0.62 : 0.94 - Math.abs(Math.cos(phase)) * 0.03 * amp;
  n.chest.rotation.x = crouch ? 0.55 : 0.08 * amp;
  n.head.rotation.set(crouch ? -0.35 : 0, 0, 0);
  n.thL.rotation.set(s * 0.55 * amp - (crouch ? 1.1 : 0), 0, 0);
  n.thR.rotation.set(-s * 0.55 * amp - (crouch ? 1.1 : 0), 0, 0);
  n.knL.rotation.x = Math.max(0, -s) * 0.7 * amp + (crouch ? 1.6 : 0);
  n.knR.rotation.x = Math.max(0, s) * 0.7 * amp + (crouch ? 1.6 : 0);
  n.shL.rotation.set(-s * 0.45 * amp, 0, -0.06);
  n.shR.rotation.set(s * 0.45 * amp, 0, 0.06);
  n.elL.rotation.x = -0.25 - amp * 0.2;
  n.elR.rotation.x = -0.25 - amp * 0.2;
}

// slung over a friend's shoulder (a fireman's carry): folded at the waist on their shoulder — legs hanging
// down in front of them, the body and arms hanging down their back. The caller puts the root (the hips) on
// the shoulder, rotation (0, carrier's yaw, 0): the body faces the carrier.
export function poseCarried(rig, sway = 0) {
  const n = rig.nodes;
  rig.root.rotation.x = 0;
  n.hips.position.y = 0;
  n.chest.rotation.set(2.72 + sway * 0.06, 0, 0);
  n.head.rotation.set(0.3, 0, 0.12);
  n.shL.rotation.set(-2.72 + sway * 0.2, 0, -0.08);
  n.shR.rotation.set(-2.86 - sway * 0.2, 0, 0.1);
  n.elL.rotation.x = -0.25;
  n.elR.rotation.x = -0.12;
  n.thL.rotation.set(0.3 + sway * 0.12, 0, 0.04);
  n.thR.rotation.set(0.16 - sway * 0.12, 0, -0.04);
  n.knL.rotation.x = 0.32;
  n.knR.rotation.x = 0.5;
}

// laid out on the cot: on the back, arms by the sides (the caller places and turns the root)
export function poseLying(rig) {
  const n = rig.nodes;
  rig.root.rotation.x = -PI / 2;
  n.hips.position.y = 0.2;
  n.chest.rotation.set(0, 0, 0);
  n.head.rotation.set(-0.12, 0, 0.18);
  n.shL.rotation.set(0.12, 0, -0.1); n.shR.rotation.set(0.18, 0, 0.14);
  n.elL.rotation.x = -0.35; n.elR.rotation.x = -0.2;
  n.thL.rotation.set(0.04, 0, 0.03); n.thR.rotation.set(-0.02, 0, -0.04);
  n.knL.rotation.x = 0.08; n.knR.rotation.x = 0.15;
}

// carrying someone that way: the near arm wraps their legs, a lean under the weight (after poseSurvivor)
export function poseCarrier(rig) {
  const n = rig.nodes;
  n.chest.rotation.x += 0.16;
  n.shR.rotation.set(-0.62, 0, 0.32);
  n.elR.rotation.x = -1.25;
}

// a part for the УАЗ carried in both arms in front (after poseSurvivor): a lean back under the weight,
// forearms under it. heavy: the battery, the wheel, the can (the carburettor is light)
export function poseCarryPart(rig, heavy = true) {
  const n = rig.nodes;
  n.chest.rotation.x += heavy ? -0.1 : 0.02;
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['sh' + A].rotation.set(heavy ? -0.55 : -0.75, 0, s * 0.32);
    n['el' + A].rotation.x = heavy ? -1.05 : -1.2;
  }
}

// sitting in the УАЗ: the caller puts the root at the seat (the hips) and turns it the way the car faces.
// driver: hands up on the wheel (steer turns them a little); t breathes
export function poseSeated(rig, driver = false, t = 0, steer = 0) {
  const n = rig.nodes;
  rig.root.rotation.x = 0;
  n.hips.position.set(0, 0, 0);
  n.hips.rotation.set(0, 0, 0);
  n.chest.rotation.set(-0.08 + Math.sin(t * 1.6) * 0.012, 0, 0);
  n.head.rotation.set(0.05, 0, 0);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['th' + A].rotation.set(-1.48, 0, s * 0.08);
    n['kn' + A].rotation.x = 1.42;
    if (driver) {
      n['sh' + A].rotation.set(-1.05 + s * steer * 0.25, 0, s * 0.18);
      n['el' + A].rotation.x = -0.75;
    } else {
      n['sh' + A].rotation.set(-0.35, 0, s * 0.12);
      n['el' + A].rotation.x = -0.95;
    }
  }
}

// down, propped in a seat: slumped sideways, head lolling (the caller places the root as for poseSeated)
export function poseSlumped(rig, t = 0) {
  poseSeated(rig, false, 0);
  const n = rig.nodes;
  n.chest.rotation.set(0.3, 0, 0.32);
  n.head.rotation.set(0.55 + Math.sin(t * 0.7) * 0.03, 0, 0.4);
  n.shL.rotation.set(0.1, 0, -0.15);
  n.shR.rotation.set(0.05, 0, 0.3);
  n.elL.rotation.x = -0.2;
  n.elR.rotation.x = -0.3;
}

// caught by the шкафандр: dragged in up to the waist, bent out of its doors, arms reaching — or held out stiff to
// the hands that hold them (hands = [left holder, right holder]). out: 0..1 yanked free (a stumble forward)
export function poseGrabbed(rig, t, hands = [null, null], out = 0) {
  const n = rig.nodes;
  rig.root.rotation.x = 0;
  n.hips.position.set(0, lerp(0.78, 0.9, out), 0);
  n.hips.rotation.set(0, 0, 0);
  n.chest.rotation.set(lerp(0.55 + Math.sin(t * 9) * 0.06, 0.25, out), Math.sin(t * 6.3) * 0.12 * (1 - out), Math.sin(t * 11) * 0.06);
  n.head.rotation.set(lerp(-0.55, -0.1, out), 0, Math.sin(t * 13) * 0.12 * (1 - out));
  for (const [A, s, k] of [['L', -1, 0], ['R', 1, 1]]) {
    const held = !!hands[k];
    if (held || out > 0) {
      n['sh' + A].rotation.set(-1.62 + Math.sin(t * 17 + k) * 0.04, 0, s * 0.08);
      n['el' + A].rotation.x = -0.1;
    } else {
      n['sh' + A].rotation.set(-1.25 + Math.sin(t * 8.5 + k * 1.7) * 0.55, 0, s * (0.15 + Math.sin(t * 6 + k) * 0.15));
      n['el' + A].rotation.x = -0.45 + Math.sin(t * 7.2 + k) * 0.4;
    }
    n['th' + A].rotation.set(lerp(0.75, 0.2, out) + Math.sin(t * 10 + k * 3) * 0.08, 0, s * 0.06);
    n['kn' + A].rotation.x = lerp(0.95, 0.4, out);
  }
}

// pulling someone out by one hand: feet braced, leaning back, both arms out to the hand (s: −1 left, +1 right).
// effort 0..1 — a heave
export function poseRescuer(rig, s, effort = 0.5) {
  const n = rig.nodes;
  rig.root.rotation.x = 0;
  n.hips.position.set(0, 0.86 - effort * 0.04, 0);
  n.hips.rotation.set(0, 0, 0);
  n.chest.rotation.set(-0.3 - effort * 0.18, s * 0.12, 0);
  n.head.rotation.set(0.25 + effort * 0.1, -s * 0.15, 0);
  n.thL.rotation.set(-0.55, 0, -0.06);
  n.knL.rotation.x = 0.55;
  n.thR.rotation.set(0.35, 0, 0.06);
  n.knR.rotation.x = 0.2;
  for (const [A, k] of [['L', -1], ['R', 1]]) {
    n['sh' + A].rotation.set(-1.32 - effort * 0.08, 0, -k * 0.12 + s * 0.08);
    n['el' + A].rotation.x = -0.12;
  }
}

// knocked onto your backside when it lets go (k 0..1)
export function poseSprawled(rig, k = 1) {
  const n = rig.nodes;
  rig.root.rotation.x = 0;
  n.hips.position.set(0, lerp(0.86, 0.3, k), lerp(0, 0.12, k));
  n.hips.rotation.set(0, 0, 0);
  n.chest.rotation.set(lerp(-0.4, -0.75, k), 0, 0);
  n.head.rotation.set(lerp(0.2, 0.55, k), 0, 0);
  for (const [A, s] of [['L', -1], ['R', 1]]) {
    n['th' + A].rotation.set(lerp(-0.3, -1.45, k), 0, s * lerp(0.05, 0.25, k));
    n['kn' + A].rotation.x = lerp(0.4, 0.35, k);
    n['sh' + A].rotation.set(lerp(-1.3, 0.75, k), 0, s * lerp(0.1, 0.35, k));
    n['el' + A].rotation.x = lerp(-0.12, -0.35, k);
  }
}

// a glow stick held up in the other hand (after poseSurvivor)
export function poseGlowHand(rig) {
  const n = rig.nodes;
  n.shL.rotation.set(-0.95, 0, -0.18);
  n.elL.rotation.x = -0.85;
}

// how many vertices an outfit costs (the echo ghosts hold up to 3200)
export function rigVerts(rig) {
  let n = 0;
  for (const p of rig.parts) n += p.arr.count;
  return n;
}
