// Central tuning knobs. Keep gameplay numbers here so they are easy to balance.

export const FIXED_DT = 1 / 120; // simulation step (seconds)
export const MAX_STEPS_PER_FRAME = 12;

export const WORLD = {
  half: 60, // terrain spans [-half, half] in both axes
  playRadius: 40, // hard limit for hero and enemies
  riftCount: 10,
  riftMinR: 27,
  riftMaxR: 33,
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
  scores: 'hollowkeep.highscores.v1',
  muted: 'hollowkeep.muted.v1',
  name: 'hollowkeep.name.v1',
};

export const xpForLevel = (level) => 8 + (level - 1) * 6;
