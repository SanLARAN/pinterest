// ---------------------------------------------------------------------------
//  NOISE RALLY — tuning constants
// ---------------------------------------------------------------------------

export const CFG = {
  LAPS: 3,
  HW: 9, // track half width (world units ~ metres)

  // The Mullet-style life timer: it never stops. Kills buy you time.
  START_TIME: 10,
  MAX_TIME: 20,
  CP_PER_LAP: 6,
  CP_TIME: 2,
  KILL_TIME_RIVAL: 3.5,
  KILL_TIME_GOON: 1.5,
  COMBO_WINDOW: 3.6,
  COMBO_MAX: 10,

  GRAVITY: 34,
  RIVAL_RESPAWN: 3.4,
  GOON_LINGER: 2.2,
  MAX_GOONS: 8,

  // Damage -> seconds lost (the timer IS your health)
  BOLT_PENALTY: 0.7,
  RAM_PENALTY_SCALE: 0.011,
  BARREL_PENALTY: 1.2,
};

// Per vehicle class physics. Units: u/s, u/s^2, rad/s.
export const KIND_STATS = {
  player: {
    maxSpeed: 50, accel: 31, brake: 46, driftBrake: 5, reverseAccel: 20, reverseSpeed: 15,
    drag: 0.1, coast: 5, grip: 9.5, driftGrip: 0.24, turnRate: 2.45, turnFall: 0.45,
    driftYaw: 1.5, yawResp: 12, boostSpeed: 70, boostAccel: 40, nitroBurn: 0.33,
    mass: 1.7, ramPower: 1.35, radius: 1.05, axle: 1.1, maxLaunch: 14, hp: 100,
  },
  rival: {
    maxSpeed: 50.5, accel: 30, brake: 42, driftBrake: 5, reverseAccel: 18, reverseSpeed: 14,
    drag: 0.1, coast: 5, grip: 9.5, driftGrip: 0.3, turnRate: 2.35, turnFall: 0.45,
    driftYaw: 1.4, yawResp: 10, boostSpeed: 62, boostAccel: 30, nitroBurn: 0.35,
    mass: 1.0, ramPower: 1.0, radius: 1.05, axle: 1.1, maxLaunch: 14, hp: 100,
  },
  goon: {
    maxSpeed: 44, accel: 26, brake: 40, driftBrake: 5, reverseAccel: 18, reverseSpeed: 14,
    drag: 0.1, coast: 5, grip: 8.5, driftGrip: 0.3, turnRate: 2.5, turnFall: 0.4,
    driftYaw: 1.4, yawResp: 10, boostSpeed: 56, boostAccel: 28, nitroBurn: 0.35,
    mass: 0.7, ramPower: 0.8, radius: 1.0, axle: 0.9, maxLaunch: 14, hp: 34,
  },
};

export const PLAYER_DEF = {
  kind: 'player', name: 'YOU', color: 0xff2e88, color2: 0x29f3ff, lights: 0xfff1a8,
};

export const RIVALS = [
  { name: 'VIPER', color: 0x3dff8b, color2: 0x10302a, skill: 1.0, aggro: 0.75 },
  { name: 'NEON', color: 0x2bd9ff, color2: 0x1c1648, skill: 0.99, aggro: 0.45 },
  { name: 'MAD DOG', color: 0xffd23d, color2: 0x2a2a2a, skill: 0.98, aggro: 0.95 },
  { name: 'RAZOR', color: 0xb44bff, color2: 0xffe14b, skill: 0.97, aggro: 0.8 },
  { name: 'JINX', color: 0xf4f0ff, color2: 0xff2b5a, skill: 0.96, aggro: 0.6 },
  { name: 'BRICK', color: 0xff6a2b, color2: 0xfff4e0, skill: 0.95, aggro: 0.55 },
  { name: 'DUSTY', color: 0xc9b089, color2: 0x5a3b22, skill: 0.94, aggro: 0.35 },
];

export const TRACKS = [
  { name: 'SUNSET MESA', seed: 7 },
  { name: 'DUST DEVIL', seed: 23 },
  { name: 'RED CANYON', seed: 41 },
];

export const COMBO_NAMES = ['', '', 'NICE', 'SICK', 'BRUTAL', 'RAMPAGE', 'MASSACRE', 'MASSACRE', 'UNSTOPPABLE', 'UNSTOPPABLE', 'GODLIKE'];

// Synthwave desert palette (sRGB hex)
export const PAL = {
  skyTop: 0x2a0f52,
  skyMid: 0xb8338a,
  skyHorizon: 0xff9a6b,
  fog: 0xf7a08c,
  sun: 0xffe08a,
  sunLight: 0xffd6a8,
  hemiSky: 0xb08cff,
  hemiGround: 0xff9a5a,
  sand: 0xf2b46c,
  terracotta: 0xe0864f,
  redRock: 0xb8524a,
  cliff: 0x7d3346,
  scrub: 0xa59c52,
  dust: 0xe8b98a,
  road: 0xf0d3a8,
  roadDark: 0xd2a77a,
  roadEdge: 0xfff0d8,
  neonPink: 0xff2e88,
  neonCyan: 0x29f3ff,
  neonYellow: 0xffe23d,
};
