// Circle vs static colliders (trees, rocks, towers, castle walls and keep).
import { PLAY_RADIUS } from './layout.js';

/** Pushes body {x,z,radius} out of all static colliders. Returns true if any contact occurred. */
export function resolveStatic(layout, body) {
  let hit = false;
  const r = body.radius;
  for (const c of layout.circles) {
    const dx = body.x - c.x;
    const dz = body.z - c.z;
    const min = r + c.r;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min) {
      const d = Math.sqrt(d2) || 1e-4;
      const push = min - d;
      body.x += (dx / d) * push;
      body.z += (dz / d) * push;
      hit = true;
    }
  }
  for (const b of layout.boxes) {
    const cx = Math.min(Math.max(body.x, b.minX), b.maxX);
    const cz = Math.min(Math.max(body.z, b.minZ), b.maxZ);
    const dx = body.x - cx;
    const dz = body.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      hit = true;
      if (d2 > 1e-10) {
        const d = Math.sqrt(d2);
        const push = r - d;
        body.x += (dx / d) * push;
        body.z += (dz / d) * push;
      } else {
        // centre inside the box: eject through the nearest face
        const left = body.x - b.minX;
        const right = b.maxX - body.x;
        const top = body.z - b.minZ;
        const bottom = b.maxZ - body.z;
        const m = Math.min(left, right, top, bottom);
        if (m === left) body.x = b.minX - r;
        else if (m === right) body.x = b.maxX + r;
        else if (m === top) body.z = b.minZ - r;
        else body.z = b.maxZ + r;
      }
    }
  }
  return hit;
}

/** Removes every static box of one kind (e.g. 'gate' when the stronghold gates open). */
export function removeStaticKind(layout, kind) {
  for (let i = layout.boxes.length - 1; i >= 0; i--) {
    if (layout.boxes[i].kind === kind) layout.boxes.splice(i, 1);
  }
}

/** Keeps a body inside the playable circle. */
export function clampToArena(body, radius = PLAY_RADIUS) {
  const d = Math.hypot(body.x, body.z);
  const max = radius - body.radius;
  if (d > max) {
    body.x = (body.x / d) * max;
    body.z = (body.z / d) * max;
    return true;
  }
  return false;
}

/** True if a circle at (x,z) with radius r overlaps any static collider. */
export function overlapsStatic(layout, x, z, r) {
  for (const c of layout.circles) {
    const dx = x - c.x;
    const dz = z - c.z;
    const m = r + c.r;
    if (dx * dx + dz * dz < m * m) return true;
  }
  for (const b of layout.boxes) {
    const cx = Math.min(Math.max(x, b.minX), b.maxX);
    const cz = Math.min(Math.max(z, b.minZ), b.maxZ);
    const dx = x - cx;
    const dz = z - cz;
    if (dx * dx + dz * dz < r * r) return true;
  }
  return false;
}
