// Global tunables. Everything gameplay-relevant lives here so balancing is easy.
export const CFG = {
  WORLD_SEED: 1337,
  WORLD_HALF: 300, // world spans [-HALF, HALF] on X and Z
  WORLD_WALL: 286, // player / monsters can't go past this
  CHUNK: 40,
  TERRAIN_CELL: 2.5,
  // the shift: four days instead of a single endless night. Each day is a short morning around the
  // camp and an eight-minute night; the fourth night ends the shift in a win — but four minutes into
  // it the forest wakes up for good, and everything comes looking. Escaping in the УАЗ ends it earlier.
  SHIFT: {
    DAYS: 4, // the default shift; the host picks the real length in the lobby (2.1s)
    OPTIONS: [2, 4, 6],
    NIGHT: 8 * 60, // one night
    MORNING: 105, // 1:45 of daylight between the nights
    LAST_WAKE: 240, // on the last night: the minute the forest stops pretending
    // (3.1m) the forest's shift is won by driving out, not by waiting it through: the last dawn opens one more
    // morning — daylight, nothing hunting — and this long to finish the УАЗ and go. Then the shift is over.
    FINALE: 300,
  },
  GRACE_SECONDS: 12, // at the start of the night monsters can't hunt you
  SPAWN_DELAY: 45, // ...and for the first 45 s the forest sleeps: no monsters at all, look around in peace
  DUSK_SECONDS: 3.6, // ...and then the light dies

  // the way out: a fenced forestry yard by the north edge — a broken УАЗ behind sliding gates that run on the
  // generators' power — and past it a cut through the hills down to the highway
  YARD: { x: 96, z: 256, w: 32, d: 24 }, // centre, width (x) and depth (z) of the fence
  // the cut: centre line, flat half-width, slopes; it begins at z0, and its floor runs down from the yard's
  // level (y0 at zA) to the highway's (at zB)
  PASS: { x: 96, w: 17, slope: 36, z0: 258, zA: 262, zB: 334, y0: -3.0 },
  ROAD: { z: 344, y: -7.0, x0: -90, x1: 262, lampEvery: 32 }, // the highway: centre line, level, how far it's built, its lamps

  CAMERA_FAR: 150,
  FOV: 72,
  // a phone held upright must not look at the forest through a keyhole: below 16:9 the vertical view
  // opens up so the horizontal one keeps at least ~60°, and never past 104° (no fisheye at the edges)
  FOV_PORTRAIT_MIN_H: 60,
  FOV_MAX: 104,

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
  // SPACE (the ECHO button): after each echo a short wait while it comes back — longer after a loud one.
  // Let go during the wait and, if the wait is nearly over, it goes the moment it can
  PING_CD: 0.85,
  PING_CD_LOUD: 0.55,
  PING_QUEUE: 0.35,

  MONSTER: {
    listener: { wander: 1.05, investigate: 2.1, hunt: 4.7, hearing: 1.0, lock: 6.0, radius: 0.45 },
    // (3.1m) a chase you can live through: a hair slower than your sprint (5.7), and its last-moment lunge only
    // in the final three metres — a head start and then going quiet (it loses you in `lock` s) gets you away
    crawler: { wander: 1.6, investigate: 3.2, hunt: 5.4, lunge: 3, hearing: 0.62, stepHearing: 2.2, lock: 3.2, radius: 0.45 },
    // the Watcher: deaf, faceless, moves only while nothing lights it
    watcher: { stalk: 3.5, hearing: 0, lock: 0, radius: 0.4, litThreshold: 0.13, arrive: 240, arriveGens: 2, seize: 1.6 }, // seize: seconds it holds your gaze before the kill — light still saves you (2.1s)
    // the Howler: half-deaf brute that "sees" with its howl — anything moving when it howls gets charged
    howler: { wander: 1.25, investigate: 2.6, hunt: 6.4, hearing: 0.6, minLoud: 0.4, lock: 6.5, radius: 0.6, arrive: 480, arriveGens: 3, howlR: 46 },
    // the Angler's body rides the monster list (snapshots, echo imprints), but its brain is its own
    // (see ANGLER below and game/angler.js): these numbers only keep the shared shell happy
    angler: { wander: 0, investigate: 0, hunt: 0, hearing: 0, lock: 0, radius: 0.55 },
    // the Дrowned (3.0d, the peat bog): its brain is its own too — it is deaf, it stays in the water, and it
    // takes you by the leg and walks you into the deep (see game/drowned.js for the real numbers)
    drowned: { wander: 0, investigate: 0, hunt: 0, hearing: 0, lock: 0, radius: 0.45 },
    killDist: 1.35,
  },

  // the Angler (Удильщик): a big man with a lantern who works the third and fourth nights. He does not
  // hunt noise like the others — he takes whoever has wandered off alone, hauls them by the arm to a
  // tree and ties them to it. Struggle (A/D) on the way and you may tear free; shout and he knocks you
  // out. Tied up, you have five minutes for a friend to find you (alone in the shift you can chew
  // through the rope yourself, slowly and loudly). Then he comes back, and what he takes stays taken:
  // no cot, no syringe, no dawn raises you — gone for the rest of the run.
  ANGLER: {
    fromDay: 3, // the first night he works
    after: 75, // s into the night before the first hunt (the forest wakes at 45)
    isolateR: 32, // m from every other free living player: alone enough to take
    regroupR: 24, // m: get this close to a friend while he stalks you and he loses interest...
    regroupT: 4, // ...after this many seconds of it
    approach: 3.8, // m/s coming for you up close (you walk 3.1, sprint 5.7 — for a while)
    approachFar: 5.3, // m/s while he is still far off (see approachSpeed): distance alone will not save a loner
    farR: 30, // m: beyond this he comes at approachFar, easing down to approach by 12 m
    huntGiveUp: 300, // s of stalking before he lets the matter drop (regrouping is the real way out)
    haul: 1.65, // m/s with you dragging behind him
    grabR: 1.7, // m: his hand closes
    treeMin: 30, treeMax: 60, // m: how far the tree he picks can be from where he took you
    dragGiveUp: 100, // s of hauling without reaching it: he drops you and goes
    tie: 1.6, // s with the rope at the tree
    boundFor: 300, // s tied before he comes back to finish it
    untie: 3, // s a friend holds E at the rope
    untieR: 2.4, // m from the bound player
    voiceLoud: 0.52, // louder than this on the drag and he gets annoyed
    irritate: 2.2, // ∫(loud − voiceLoud)dt that earns a fist: blackout
    irritateDecay: 0.25, // /s he calms down while you're quiet
    ko: 8, // s blacked out (no look, no struggle)
    struggleHit: 0.085, // meter per alternating A/D press on the drag
    struggleDecay: 0.055, // meter/s leaking away
    selfHit: 0.022, // meter per press chewing the rope alone (solo / nobody left to come)
    selfDecay: 0.01,
    cooldown: [50, 85], // s between hunts (after a loss, a drop, a rescue — or a finish)
    finishT: 3.8, // s of the last scene at the tree, from the captive's eyes
    lamp: { I: 1.3, R: 13, c: [1.0, 0.6, 0.28] }, // his lantern: a real small light (see GlowSticks)
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
  // The Stray (2.1v): a girl in an oversized tee who follows you on the fourth night. Walking beside her
  // is allowed — she is only curious. Running near her is not: that is what wakes her up. She does not
  // tear and does not eat. She takes the voice: alone you simply die in her hands; in co-op she wears you,
  // and your friends spend the next minute listening to a figure with your face answer them in your voice.
  STRAY: {
    fromDay: 4, // the finale of any shift: the 4th of 4, the 6th of 6, the 2nd of 2
    appearAt: 130, // s into the night — late enough that the night already has a shape
    appearFar: [22, 30], // m from the player when she steps out of the trees
    keep: 6.5, // m: she closes to this and then just walks along
    walk: 1.45, // m/s — slower than you walk: she is not following you, she is keeping you company
    runR: 9, // m: running inside this starts the anger
    angerT: 0.9, // s of running inside runR before she wakes up (a warning, not a trap)
    calmT: 2.6, // s of not running before the chase turns back into a walk
    chase: 4.5, // m/s once angry (you sprint at 5.7 — enough to reach a friend, not enough to outlast her)
    chaseR: 34, // m: she gives up the chase past this
    grabR: 2.2,
    grabT: 1.4, // s of her hand on your throat (solo: that is the end)
    meetR: 12, // m: a meeting (ten of them unlock her skin)
    meet: 10,
    gap: [95, 150], // s before she comes back after a kill/cooldown
    leaveR: 55, // m: walk this far off and she loses interest for a while
    wear: 45, // s a friend walks around under your name
    wearSpeed: 2.1, // m/s the impostor walks toward your friends
    hushR: 10, // m: the forest goes quiet around her
  },

  GEN_SITES: ['cabin', 'tower', 'stones', 'wreck'], // the camp is always the first one

  // generator sabotage (2.1q): from the third night the things have learned what the humming boxes
  // mean. Up to twice a night one of them is sent to beat a running generator until it stops; the
  // part stays in it, but it wants cranking again (work → cord/spin, as the first time, faster hands).
  GEN_BREAK: {
    fromDay: 4, // (3.1m) one new thing a night: the Angler on the third, the beaten engines on the fourth
    maxPerNight: 2,
    firstAfter: 170, // s into the night before the first errand
    gap: [100, 170], // s between errands
    playerClearR: 18, // m: never under a player's nose — you hear it die from away off
    minRun: 25, // s an engine must have been running before it is worth breaking
    whackTime: 2.4, // s of beating on it before it gives up
    restartDur: 6, // s of hands-on work to crank a broken one back up (then cord/spin as usual)
  },
  LAMP_R: 10, // radius of warm light around a running generator

  // the sovkhoz stall chains (2.1s): brush one going through a stall mouth and it jingles —
  // a free alarm when something else does it, a bell round your own neck when you do
  CHAIN: { loud: 0.5, r: 0.62, cd: 1.2 },

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

  // co-op: a friend who is caught goes down, not out. Check their pulse (it tells you how long they have
  // left), carry them to the scouts' first-aid hut and lay them on the cot — only there can they be brought
  // back — or spend an adrenaline syringe to raise them where they fell (see SYRINGE below)
  REVIVE: {
    bleed: [240, 170, 120], // s they last on the ground: the first time, the second, the third and after
    pulse: 1.3, // s holding E to find a pulse
    revive: 6, // s holding E at the cot
    carry: 1.75, // m/s with someone on your shoulders (no running)
    carryCrouch: 1.0,
    carryStep: 0.12, // heavier steps (a walk is 0.085)
    pick: 1.9, // how close you have to be to lift someone (m)
    cot: 1.9, // ...and to lay them on the cot
    gasp: 0.22, // the first breath of someone brought back
    work: 0.05, // each push on the chest
  },
  // the adrenaline syringe: a field item (co-op only — solo has no one to raise). One jab, a second and a
  // half: your friend is on their feet where they fell, no cot, no carrying — but their legs are rubber for
  // five minutes and the bleed clock did not stop while you fumbled with the cap
  SYRINGE: {
    jab: 1.5, // s holding the use
    reach: 2.2, // m — close enough to press the needle in
    debuff: 300, // s of rubber legs: walk x0.8, sprint x0.72, stamina burns x1.65
    walk: 0.8,
    sprint: 0.72,
    drain: 1.65,
    perShift: 2, // how many exist in the forest over the whole shift (the medhut's wall cabinet keeps one)
  },
  // glow sticks: one each. Crack it (G) and it glows for a while — in your hand, or wherever you throw it (G again)
  GLOW: {
    burn: 150, // s of light
    radius: 10, // how far its light reaches (m) — it's bright for the first five or so
    light: 1.5, // brightness (a work lamp is 1.15, but its pool is much wider)
    color: [0.5, 1.0, 0.62],
    speed: 11, // m/s thrown
    gravity: 15,
    crackLoud: 0.07, // the snap
  },
  MAX_LISTENERS: 3, // never more than this many Listeners in the forest, however long the night or big the team

  SCORE: {
    perSecond: 10,
    shard: 250,
    closeCall: 300,
    escape: 500,
    corpse: 400,
    generator: 2000,
    revive: 1500, // you brought someone back on the cot
    adrenaline: 750, // you raised them with the syringe: fast, but they'll limp
    untie: 750, // you cut someone off the Angler's tree
    night: 3000, // each dawn the whole team lived to see
    win: 25000, // the shift survived (the fourth night's dawn)
    speedBonus: 10, // per second still left in the shift, if you drive out early
  },

  SHARDS: 46,
};

// difficulty steps every four minutes of a night, and again with each dawn survived
export function dangerMultiplier(t, day = 1) {
  return 1 + (day - 1) * 0.5 + Math.floor(t / 240) * 0.5;
}

// how many of each monster should exist at t seconds into the night of the given day
export function monsterTargets(t, day = 1) {
  const m = t / 60;
  let listeners = 2, crawlers = 0;
  if (m >= 2) listeners = 3;
  if (day >= 2) listeners = 3;
  // (3.1m) the first night teaches: no crawler at all. The second brings one, at four minutes; the third, two
  if (day >= 2 && m >= 4) crawlers = 1;
  if (day >= 3) crawlers = 2;
  if (day >= 4 && m >= 2) crawlers = 3;
  return { listeners: Math.min(listeners, CFG.MAX_LISTENERS), crawlers };
}

// a shift may run 2, 4 or 6 nights (2.1s), but the tables above were written for four: a night's
// effective day is where it falls across the whole shift. Night 2 of 2 is a finale; night 2 of 6 is not.
export function diffDay(day, days) {
  const n = CFG.SHIFT.OPTIONS.includes(days) ? days : CFG.SHIFT.DAYS;
  return Math.max(1, Math.min(4, Math.ceil((day * 4) / n)));
}

export const PALETTE = {
  sonar: [0.62, 0.93, 1.0],
  danger: [1.0, 0.16, 0.12],
  amber: [1.0, 0.68, 0.22],
  stone: [0.86, 0.95, 1.0],
};

// the vertical field of view for a viewport's aspect ratio (width / height)
export function fovFor(aspect) {
  if (!(aspect > 0) || aspect >= 16 / 9) return CFG.FOV;
  const h = (CFG.FOV_PORTRAIT_MIN_H * Math.PI) / 360;
  const v = (2 * Math.atan(Math.tan(h) / aspect) * 180) / Math.PI;
  return Math.min(CFG.FOV_MAX, Math.max(CFG.FOV, v));
}
