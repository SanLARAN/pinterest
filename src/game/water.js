// Water, as the rest of the game asks about it. The map (world/swamp.js) owns the water; this file owns what
// water *means* — and it is deliberately a set of small functions of (world, x, z) so every one of them can be
// checked without a renderer.
//
// The rule of the участок, in one line: **in water you hear worse and are seen better.** Your echo is shorter
// and slower (×0.6 radius, 18 m/s instead of 30), but each step sends a ring across the surface that carries
// further than a footstep ever did (×1.8 to anything listening). Planks are the other half of the bargain:
// dry, full speed, and loud.
import { CFG } from '../core/config.js';

export const WATER = {
  wadeSpeed: 0.55, // walking in the water: just over half speed
  plankLoud: 0.35, // a board creaks, and it carries
  waterStepLoud: 1.8, // a splash is heard this much further than a footstep on peat
  echoScale: 0.6, // the wave is shorter in the water
  echoSpeed: 18, // ...and slower (CFG.PULSE.speed is 30)
  ringRadius: 8, // the ring a step draws on the surface, visible from here
  mistScale: 0.35, // inside a vapour patch the echo does not come back
  depthWade: 0.25, // knee-deep: the speed and the echo are affected from here
  depthSwim: 1.25, // a lake deep enough to float in (the bog keeps its own drowning rules)
  swimSpeed: 0.48,
  depthWet: 0.06, // ankle-deep: a step splashes
};

// is this player standing on the planks? (the deck answers for the ground under it)
export function onPlanks(world, x, z) {
  return !!world?.onWalk?.(x, z, 0);
}

// the water on the map, or nothing (a forest has one local lake; a bog owns its whole water table)
export function waterOf(world) {
  return world?.water || null;
}

export function depthOf(world, x, z) {
  const w = waterOf(world);
  if (!w || onPlanks(world, x, z)) return 0;
  const d = w.depth(x, z);
  return Number.isFinite(d) ? Math.max(0, d) : 0;
}

export function swimming(world, x, z) {
  return !!waterOf(world)?.swim && depthOf(world, x, z) > WATER.depthSwim;
}

export function wading(world, x, z) {
  const w = waterOf(world);
  if (!w || onPlanks(world, x, z)) return false;
  return w.depth(x, z) > WATER.depthWade;
}

export function wet(world, x, z) {
  const w = waterOf(world);
  if (!w || onPlanks(world, x, z)) return false;
  return w.depth(x, z) > WATER.depthWet;
}

export function inMist(world, x, z) {
  const w = waterOf(world);
  return !!w && w.misted(x, z);
}

// speed multiplier for a player standing here (crouching, carrying and all the rest are applied on top)
export function speedScale(world, x, z) {
  return swimming(world, x, z) ? WATER.swimSpeed : wading(world, x, z) ? WATER.wadeSpeed : 1;
}

// the echo a player at (x, z) is about to make: how much of the wave survives the water, and how fast it runs
export function echoOf(world, x, z) {
  const scale = wading(world, x, z) ? WATER.echoScale : 1;
  return { scale, speed: wading(world, x, z) ? WATER.echoSpeed : CFG.PULSE.speed };
}

// the vapour: inside it the wave leaves you but nothing comes back
export function mistScale(world, x, z) {
  return inMist(world, x, z) ? WATER.mistScale : 1;
}

// what a footstep in this spot is worth: a splash carries, a board creaks, dry peat is quiet
export function stepOf(world, x, z, loud) {
  if (onPlanks(world, x, z)) return { loud: Math.max(loud, WATER.plankLoud), plank: true, water: false, ring: 0, depth: 0 };
  if (wet(world, x, z)) {
    // (3.0k) how deep the foot went: an ankle and a knee do not sound the same, and the sound is the one
    // thing that tells you what you have walked into before the echo comes back
    const depth = waterOf(world).depth(x, z);
    return { loud: Math.min(1, Math.max(loud, 0.1) * WATER.waterStepLoud), plank: false, water: true, ring: WATER.ringRadius, depth };
  }
  return { loud, plank: false, water: false, ring: 0, depth: 0 };
}
