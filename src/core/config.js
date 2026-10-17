// Global tunables. Everything gameplay-relevant lives here so balancing is easy.
export const CFG = {
  WORLD_SEED: 1337,
  WORLD_HALF: 300, // world spans [-HALF, HALF] on X and Z
  WORLD_WALL: 286, // player / monsters can't go past this
  CHUNK: 40,
  TERRAIN_CELL: 2.5,
  RUN_SECONDS: 30 * 60, // after this the forest wakes up: everything starts closing in on you
  GRACE_SECONDS: 12, // at the start of the night monsters can't hunt you
  SPAWN_DELAY: 45, // ...and for the first 45 s the forest sleeps: no monsters at all, look around in peace
  MORNING_SECONDS: 32, // the calm before: daylight, birds, a humming generator
  DUSK_SECONDS: 3.6, // ...and then the light dies
  CAMP_LEASH: 26, // in the morning you stay around the camp

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
  // your own voice (the microphone) has a curve of its own: ordinary talking (loudness up to ~0.3) carries
  // a few metres, so you can talk to the friend next to you; raised voices carry much further, and a scream
  // as far as a scream does anywhere
  voiceHearRadius: (loud) => (loud >= 0.78 ? 54.5 + ((loud - 0.78) / 0.22) * 20.5 : 2.5 + 52 * Math.pow(Math.max(0, loud - 0.1) / 0.68, 1.8)),
  voiceRevealRadius: (loud) => 14 + 54 * Math.pow(Math.max(loud, 0), 0.8),
  SCREAM: 0.78, // loudness at/above which it's a scream (instant hunt)
  TALK: 0.3, // loudness of ordinary talking into the microphone (its upper end)

  MONSTER: {
    listener: { wander: 1.05, investigate: 2.1, hunt: 4.7, hearing: 1.0, lock: 6.0, radius: 0.45 },
    crawler: { wander: 1.6, investigate: 3.2, hunt: 6.1, hearing: 0.62, stepHearing: 2.2, lock: 3.2, radius: 0.45 },
    // the Watcher: deaf, faceless, moves only while nothing lights it
    watcher: { stalk: 3.5, hearing: 0, lock: 0, radius: 0.4, litThreshold: 0.13, arrive: 240, arriveGens: 2 },
    // the Howler: half-deaf brute that "sees" with its howl — anything moving when it howls gets charged
    howler: { wander: 1.25, investigate: 2.6, hunt: 6.4, hearing: 0.6, minLoud: 0.4, lock: 6.5, radius: 0.6, arrive: 480, arriveGens: 3, howlR: 46 },
    killDist: 1.35,
  },

  // the five generators, in the order the chain leads you to them.
  // mode: hold = just work; cord = then pull the starter cord; spark = it shorts out while you work;
  //       clank = loud metal work; spinup = after the work it takes a while (and a lot of noise) to start
  GENERATORS: [
    { part: 'fuel', mode: 'cord', dur: 4, clank: [1.0, 1.5], clankLoud: 0.12, pulls: 3, pullLoud: 0.34, startLoud: 0.6 },
    { part: 'plug', mode: 'hold', dur: 7, clank: [0.9, 1.4], clankLoud: 0.15, startLoud: 0.62 },
    { part: 'fuses', mode: 'spark', dur: 9, clank: [1.0, 1.6], clankLoud: 0.16, spark: [1.3, 3.0], sparkLoud: 0.5, startLoud: 0.64 },
    { part: 'belt', mode: 'clank', dur: 10, clank: [0.55, 0.95], clankLoud: 0.3, startLoud: 0.66 },
    { part: 'battery', mode: 'spinup', dur: 8, clank: [1.0, 1.5], clankLoud: 0.15, spin: 9, spinLoud: 0.42, startLoud: 0.72 },
  ],
  GEN_SITES: ['cabin', 'tower', 'stones', 'wreck'], // the camp is always the first one
  LAMP_R: 10, // radius of warm light around a running generator

  // the flare gun: one per night, lying by one of the bodies (never the camp's). Two shots.
  FLARE: {
    charges: 2,
    speed: 33, // m/s out of the barrel
    gravity: 9.8,
    burn: 15, // seconds of light once it catches
    radius: 115, // how far its light reaches (m) — hanging 30 m up, it lights ~80 m of forest around
    light: 1.8, // brightness (a work lamp is 1.15)
    lure: 140, // monsters this far from it come to see
    lureEvery: 2.6, // ...and keep being called while it burns
    launchLoud: 0.5, // the pistol's pop, where you stand
  },
  // cabin doors: how loud they are, and how long a shut one holds
  DOOR: { loud: 0.12, shutLoud: 0.2, bashes: 3, bashEvery: 0.55, calmPush: 1.1 },

  SCORE: {
    perSecond: 10,
    shard: 250,
    closeCall: 300,
    escape: 500,
    corpse: 400,
    generator: 2000,
    win: 25000, // + speedBonus for every second left before RUN_SECONDS
    speedBonus: 10,
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
