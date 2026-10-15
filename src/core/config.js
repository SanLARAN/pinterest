// Global tunables. Everything gameplay-relevant lives here so balancing is easy.
export const CFG = {
  WORLD_SEED: 1337,
  WORLD_HALF: 300, // world spans [-HALF, HALF] on X and Z
  WORLD_WALL: 286, // player / monsters can't go past this
  CHUNK: 40,
  TERRAIN_CELL: 2.5,
  RUN_SECONDS: 30 * 60, // survive until dawn
  GRACE_SECONDS: 12, // at the start monsters can't hunt you

  CAMERA_FAR: 150,
  FOV: 72,

  PLAYER: {
    radius: 0.35,
    eye: 1.62,
    crouchEye: 1.02,
    walk: 3.1,
    sprint: 5.7,
    crouch: 1.45,
    accel: 16,
    decel: 20,
    stamina: 100,
    sprintDrain: 21,
    staminaRegen: 16,
    exhaustedUntil: 35,
    stepWalk: 0.78,
    stepSprint: 1.15,
    stepCrouch: 0.62,
    maxStones: 3,
    stoneRegen: 55,
  },

  PULSE: {
    slots: 16, // total uniform slots (main + footsteps)
    stepSlots: 3,
    speed: 30, // m/s visual wavefront
    stepSpeed: 18,
  },

  // loudness (0..1) -> what the player sees / what monsters hear
  revealRadius: (loud) => 12 + 54 * loud,
  hearRadius: (loud) => 3 + 72 * Math.pow(Math.max(loud, 0), 1.35),
  SCREAM: 0.78, // loudness at/above which it's a scream (instant hunt)

  MONSTER: {
    listener: { wander: 1.05, investigate: 2.1, hunt: 4.7, hearing: 1.0, lock: 6.0, radius: 0.45 },
    crawler: { wander: 1.6, investigate: 3.2, hunt: 6.1, hearing: 0.62, stepHearing: 2.2, lock: 3.2, radius: 0.45 },
    killDist: 1.35,
  },

  SCORE: {
    perSecond: 10,
    shard: 250,
    closeCall: 300,
    escape: 500,
    dawn: 25000,
  },

  SHARDS: 46,
};

// difficulty multiplier steps every 5 minutes
export function dangerMultiplier(t) {
  return 1 + Math.floor(t / 300) * 0.5;
}

// how many of each monster should exist at time t (seconds)
export function monsterTargets(t) {
  const m = t / 60;
  let listeners = 2, crawlers = 0;
  if (m >= 2) listeners = 3;
  if (m >= 4) crawlers = 1;
  if (m >= 7) listeners = 4;
  if (m >= 10) crawlers = 2;
  if (m >= 15) listeners = 5;
  if (m >= 20) crawlers = 3;
  if (m >= 25) listeners = 6;
  return { listeners, crawlers };
}

export const PALETTE = {
  sonar: [0.62, 0.93, 1.0],
  danger: [1.0, 0.16, 0.12],
  amber: [1.0, 0.68, 0.22],
  stone: [0.86, 0.95, 1.0],
};
