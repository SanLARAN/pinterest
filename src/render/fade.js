// Building translucency: a building that stands between the camera and the hero fades out,
// so the knight stays visible. Pure geometry tests live here so they stay easy to reason about.
import { damp } from '../util/math.js';

/** True when the segment a->b (3D) passes through the axis-aligned box. Slab test. */
export function segmentHitsBox(a, b, box) {
  let tMin = 0;
  let tMax = 1;
  const axes = [
    ['x', box.minX, box.maxX],
    ['y', box.minY, box.maxY],
    ['z', box.minZ, box.maxZ],
  ];
  for (const [k, lo, hi] of axes) {
    const d = b[k] - a[k];
    if (Math.abs(d) < 1e-9) {
      if (a[k] < lo || a[k] > hi) return false;
      continue;
    }
    let t1 = (lo - a[k]) / d;
    let t2 = (hi - a[k]) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

const _from = { x: 0, y: 0, z: 0 };
const _to = { x: 0, y: 0, z: 0 };

/**
 * One fade unit: a mesh (or several) that shares a bitmap material and a bounding box.
 * `amount` is the user's translucency setting in [0, 1]; 1 means the building can vanish
 * almost completely behind the knight.
 */
export class Fader {
  constructor(materials, box) {
    this.materials = materials;
    this.box = box;
    this.alpha = 1;
  }

  update(dt, camera, hero, amount) {
    _from.x = camera.x;
    _from.y = camera.y;
    _from.z = camera.z;
    _to.x = hero.x;
    _to.y = hero.y + 1;
    _to.z = hero.z;
    const hidden = amount > 0 && segmentHitsBox(_from, _to, this.box);
    const target = hidden ? 1 - amount * 0.85 : 1;
    this.alpha = damp(this.alpha, target, 10, dt);
    const a = this.alpha;
    for (const m of this.materials) {
      m.opacity = a;
      m.transparent = a < 0.999;
      m.depthWrite = a >= 0.999;
    }
  }

  reset() {
    this.alpha = 1;
    for (const m of this.materials) {
      m.opacity = 1;
      m.transparent = false;
      m.depthWrite = true;
    }
  }
}
