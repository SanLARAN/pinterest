// Shared pickup / first-person / atlas geometry. All dimensions are metres.
import { MeshBuilder, KIND } from '../world/builder.js';
import { GK, boxAt } from '../ui/garageSet.js';
const PI = Math.PI;

export function buildTape(b = new MeshBuilder(1024)) {
  boxAt(b, 0, 0.105, 0, 0.34, 0.21, 0.13, GK.DARK);
  boxAt(b, 0, 0.105, 0.07, 0.325, 0.19, 0.012, GK.TIN);
  // tape door / two visible reels behind the window
  boxAt(b, -0.045, 0.115, 0.08, 0.2, 0.11, 0.014, GK.RUBBER);
  for (const x of [-0.1, 0.012]) {
    b.place(x, 0.12, 0.09, PI / 2, 0, 0);
    b.cylinder(10, 0.031, 0.031, 0.008, KIND.BONE, { capBottom: true });
    b.place(x, 0.12, 0.096, PI / 2, 0, 0);
    b.cylinder(6, 0.009, 0.009, 0.004, GK.DARK);
  }
  // speaker grille and five piano keys (the REC key red)
  for (let i = 0; i < 7; i++) boxAt(b, 0.109, 0.045 + i * 0.019, 0.079, 0.07, 0.006, 0.012, GK.DARK);
  for (let i = 0; i < 5; i++) boxAt(b, -0.13 + i * 0.047, 0.217, 0.018, 0.038, 0.018, 0.05, i === 0 ? GK.REDPAINT : KIND.BONE);
  // carry handle, raised over the back
  boxAt(b, 0, 0.265, -0.035, 0.235, 0.017, 0.018, GK.DARK);
  for (const s of [-1, 1]) boxAt(b, s * 0.115, 0.237, -0.035, 0.018, 0.055, 0.018, GK.DARK);
  boxAt(b, 0.139, 0.186, 0.084, 0.016, 0.008, 0.008, GK.REDPAINT);
  return b;
}

export function buildCrowbar(b = new MeshBuilder(512)) {
  b.identity();
  // hexagonal shaft, curved hook, split flattened toe; lies lengthwise on the ground
  b.limb([0, 0.025, -0.34], [0, 0.025, 0.28], 0.016, 0.016, GK.RUST, 6);
  b.limb([0, 0.025, -0.34], [0, 0.085, -0.405], 0.016, 0.016, GK.RUST, 6);
  b.limb([0, 0.085, -0.405], [0, 0.14, -0.37], 0.016, 0.014, GK.RUST, 6);
  b.limb([0, 0.14, -0.37], [0, 0.14, -0.315], 0.014, 0.01, GK.CHROME, 5);
  for (const s of [-1, 1]) boxAt(b, s * 0.011, 0.019, 0.31, 0.015, 0.012, 0.09, GK.CHROME);
  for (let i = 0; i < 4; i++) boxAt(b, 0, 0.026, -0.18 + i * 0.06, 0.036, 0.036, 0.045, GK.REDPAINT);
  return b;
}

export function buildPadlock(b = new MeshBuilder(128)) {
  boxAt(b, 0, 0, 0, 0.08, 0.07, 0.035, GK.RUST);
  b.identity();
  b.limb([-0.024, 0.03, 0], [-0.024, 0.073, 0], 0.007, 0.007, GK.CHROME, 4);
  b.limb([0.024, 0.03, 0], [0.024, 0.073, 0], 0.007, 0.007, GK.CHROME, 4);
  b.limb([-0.024, 0.073, 0], [0.024, 0.073, 0], 0.007, 0.007, GK.CHROME, 4);
  return b;
}
