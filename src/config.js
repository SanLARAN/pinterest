// Central tuning knobs. Keep gameplay numbers here so they are easy to balance.

export const FIXED_DT = 1 / 120; // simulation step (seconds)
export const MAX_STEPS_PER_FRAME = 12;

export const WORLD = {
  half: 88, // terrain spans [-half, half] in both axes (was 60: map is ~1.45x larger)
  playRadius: 58, // hard limit for hero and enemies
  riftCount: 12,
  riftMinR: 40,
  riftMaxR: 49,
};

// Bitmap look: the 3D world is rendered at 1/pixelScale resolution and upscaled
// with nearest-neighbour filtering. The scale relaxes if frames run long.
export const RENDER = {
  pixelScale: 2.5,
  touchPixelScale: 3,
  maxPixelScale: 4.5,
};

export const HERO_BASE = {
  maxHp: 100,
  radius: 0.5,
  speed: 7.4,
  accel: 16, // how quickly velocity chases input (higher = snappier)
  friction: 24,
  dashSpeed: 20,
  dashTime: 0.2,
  dashCooldown: 0.9,
  dashIframes: 0.24,
  hurtIframes: 0.75,
  swingCooldown: 0.36,
  swingTime: 0.26,
  swingReach: 2.25,
  swingArc: 2.2, // radians (~126 degrees)
  swingDamage: 12,
  swingSlowdown: 0.55,
  inputBuffer: 0.14,
  magnet: 3.2,
  lifesteal: 0,
};

export const CAMERA = {
  offset: [0, 15.5, 9.8], // relative to target; gives a 3/4 top-down view
  baseFov: 44,
  lookAhead: 2.4,
  damping: 9,
};

export const STORAGE = {
  scores: 'hollowkeep.highscores.v1', // classic mode table (kept under its original key)
  scoresCheckpoint: 'hollowkeep.highscores.checkpoint.v1', // table for runs with checkpoints
  checkpoints: 'hollowkeep.checkpoints.v1', // '1' = checkpoint after each boss, default off
  scoresEndless: 'hollowkeep.highscores.endless.v1', // endless mode table
  mode: 'hollowkeep.mode.v1', // last chosen mode on the title screen
  character: 'hollowkeep.character.v1', // last chosen hero
  muted: 'hollowkeep.muted.v1',
  name: 'hollowkeep.name.v1',
  translucency: 'hollowkeep.translucency.v1',
  atlas: 'hollowkeep.atlas.v1',
};

export const xpForLevel = (level) => 8 + (level - 1) * 6;
