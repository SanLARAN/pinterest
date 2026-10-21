// One source for the tent mesh and the film's doorway. Local +Z is OPEN; -Z is sewn shut.
export const CAMP_TENT = Object.freeze({ x: -4.2, z: 2.6, yaw: 0.4, halfWidth: 1.1, halfLength: 1.2, height: 1.2 });
export function tentPoint(x, z) {
  const t = CAMP_TENT, c = Math.cos(t.yaw), s = Math.sin(t.yaw);
  return { x: t.x + x * c + z * s, z: t.z - x * s + z * c };
}
