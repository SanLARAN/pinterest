// The finale: the throne falls, a cellar opens, and the knight must hold until dawn.
// Pure rules only (no three import) so they can be unit tested with node:test.
import { clamp, lerp } from '../util/math.js';

export const CUTSCENE_SECONDS = 6; // flyover + cellar opening, real seconds
export const FINALE_SECONDS = 300; // five minutes of night, then the sun comes up
export const ALIVE_CAP = 48; // never flood the arena beyond this many live foes

/** 0 at the start of the finale, 1 at sunrise. */
export const dawnProgress = (t) => clamp(t / FINALE_SECONDS, 0, 1);

/** Seconds between spawns: starts relaxed, ends frantic. */
export const spawnInterval = (p) => lerp(1.5, 0.55, p);

/** Foe health multiplier: the night gets tougher as dawn approaches. */
export const hpScaleAt = (p) => 1.3 + 1.7 * p;

/** Foe damage multiplier, applied through the chapter damage scale. */
export const dmgScaleAt = (p) => 1.3 + 0.5 * p;

/** Hit points per second the sun burns off every foe. Zero until half the night has passed. */
export const sunBurn = (p) => (p <= 0.5 ? 0 : (p - 0.5) * 2 * 6);

/**
 * Foe type for a spawn. Early night is slimes and imps; archers and ogres join as dawn nears.
 * `r` is a uniform random number in [0, 1).
 */
export function finaleTypeAt(p, r) {
  const pool = ['slime', 'slime', 'imp'];
  if (p > 0.25) pool.push('archer', 'imp');
  if (p > 0.5) pool.push('brute', 'archer');
  return pool[Math.min(pool.length - 1, Math.floor(r * pool.length))];
}
