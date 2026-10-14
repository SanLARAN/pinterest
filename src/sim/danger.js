// How close the knight is to death, 0..1. The crest starts to glow below 35% health and is
// fully aflame at 15% and under. Pure, so it runs under node:test.
export const DANGER_START = 0.35;
export const DANGER_FULL = 0.15;

export function dangerLevel(hp, maxHp) {
  if (!(maxHp > 0)) return 0;
  const frac = Math.max(0, hp) / maxHp;
  const t = (DANGER_START - frac) / (DANGER_START - DANGER_FULL);
  return Math.max(0, Math.min(1, t));
}
