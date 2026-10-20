// A soft pool of shade on the meadow where something solid meets it. The forest has no shadow maps, so
// a prop without a base reads as a picture pasted on the grass: you cannot tell whether it stands on
// the ground or floats a hand above it. The pool is not a mesh — a decal under the grass would fight
// the blades for the depth buffer — it is a slot in the world shader's own uniforms (`shared.uDisc`),
// so the ground *and* the grass that pokes through it are darkened together, on both sides of the
// slope, and at no extra draw call. See render/sonar.js, where the shader reads the slots.
import { shared, DISC_SLOTS } from '../render/sonar.js';

const free = []; // slot indices nobody holds right now
const taken = new Set();
for (let i = DISC_SLOTS - 1; i >= 0; i--) free.push(i);

export class GroundShade {
  // rx/rz: the pool's half-axes in the owner's own frame (a bike is long and narrow, the rack is wide);
  // strength: how dark its middle gets (0.35 is a soft contact shadow, 1 is black)
  constructor({ rx = 0.8, rz = 0.8, strength = 0.4 } = {}) {
    this.i = free.pop() ?? -1; // more props than slots: the extra ones simply go without a pool
    if (this.i >= 0) taken.add(this.i);
    this.rx = rx;
    this.rz = rz;
    this.strength = strength;
    this.x = NaN; this.z = NaN; this.yaw = NaN;
    if (this.i < 0) return;
    const A = shared.uDisc.value[this.i], B = shared.uDiscR.value[this.i];
    A.set(0, 0, 1, 0);
    B.set(rx, rz, 0, 0); // strength 0 = free: the shader skips it
  }

  // under (x, z), turned with its owner; a no-op when it has not really moved
  place(x, z, yaw = 0, force = false) {
    if (this.i < 0) return;
    if (!force && Math.abs(x - this.x) < 0.04 && Math.abs(z - this.z) < 0.04 && Math.abs(yaw - this.yaw) < 0.04) return;
    this.x = x; this.z = z; this.yaw = yaw;
    shared.uDisc.value[this.i].set(x, z, Math.cos(yaw), Math.sin(yaw));
    shared.uDiscR.value[this.i].set(this.rx, this.rz, this.strength, 0);
  }

  dispose() {
    if (this.i < 0) return;
    shared.uDiscR.value[this.i].set(this.rx, this.rz, 0, 0); // the slot is free again
    taken.delete(this.i);
    free.push(this.i);
    this.i = -1;
  }
}

