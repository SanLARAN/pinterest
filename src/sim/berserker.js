// The berserker: a long-haired ash-grey knight with a frost blade.
// His three abilities cost psi energy and level up like the knight's (see psi.js). Only the
// steed and berserk run on timers: a ride lasts `duration` seconds and the steed's cooldown
// starts when the ride ends. Pure logic (no rendering), so it runs under node:test.
import { Psi, statsFrom } from './psi.js';

export const BERSERKER_SKILLS = {
  skill1: {
    id: 'skill1',
    key: 'Q',
    name: 'Frost Whirl',
    short: 'WHIRL',
    icon: 'whirl',
    desc: 'A full sword spin around you: heavy frost damage and knockback',
  },
  skill2: {
    id: 'skill2',
    key: 'E',
    name: 'Summon Steed',
    short: 'STEED',
    icon: 'steed',
    desc: 'Leap onto a steed for a timed ride: faster than on foot, tramples foes for damage that grows with speed. No attacks while riding. The cooldown starts only when the ride ends',
  },
  skill3: {
    id: 'skill3',
    key: 'C',
    name: 'Berserk',
    short: 'BERSERK',
    icon: 'berserk',
    desc: 'More damage, but you lose HP every second. You cannot die while it lasts (1 HP minimum), and your sight shrinks',
  },
};

// Per-level tables, index 0 is level 1. Level 1 matches the base numbers: 4 s whirl cooldown,
// 30 s ride with a 150 s cooldown, 7 s berserk with a 35 s cooldown.
export const BERSERKER_TABLES = {
  skill1: { // Frost Whirl
    cost: [30, 29, 28, 27, 26, 25],
    cooldown: [4.0, 3.8, 3.6, 3.4, 3.2, 3.0],
    damage: [28, 34, 41, 49, 57, 66],
    radius: [3.3, 3.45, 3.6, 3.75, 3.9, 4.05],
    knock: [7, 8, 9, 10, 11, 12],
  },
  skill2: { // Summon Steed
    cost: [40, 38, 36, 34, 32, 30],
    cooldown: [150, 150, 150, 150, 150, 150], // starts when the ride ends
    duration: [30, 32, 34, 36, 38, 40],
    speed: [1.4, 1.43, 1.46, 1.49, 1.52, 1.55], // multiplier on the knight's walking speed
    trample: [6, 7, 8, 9, 10, 11], // base trample damage
    tramplePerSpeed: [1.0, 1.1, 1.2, 1.3, 1.4, 1.5], // extra damage per unit of speed
  },
  skill3: { // Berserk
    cost: [45, 43, 41, 39, 37, 35],
    cooldown: [35, 35, 35, 35, 35, 35], // starts on cast
    duration: [7, 7.5, 8, 8.5, 9, 9.5],
    damageMul: [1.35, 1.4, 1.45, 1.5, 1.55, 1.6],
    drain: [5, 4.6, 4.2, 3.8, 3.4, 3.0], // HP lost per second
  },
};

/** Ride timing and the steed's fixed rules (its speed, damage and duration come from the level). */
export const STEED = {
  tickEvery: 0.4, // seconds between trample hits on the same foe
  knock: 5,
  reach: 1.25,
  minSpeed: 3, // below this speed the steed tramples nothing
  mountTime: 0.9, // seconds for the leap onto the steed
  dismountTime: 0.5, // seconds for the jump off at the end
};

/** Berserk never drops the hero below this many HP. */
export const BERSERK = { floorHp: 1 };

const summary = (id, s) => {
  if (id === 'skill1') return `${s.damage} dmg · ${s.radius} radius · ${s.cost} psi`;
  if (id === 'skill2') return `${s.duration}s ride · ${s.speed}x speed · ${s.cost} psi · ${s.cooldown}s cooldown after`;
  return `${s.duration}s · +${Math.round((s.damageMul - 1) * 100)}% damage · -${s.drain} HP/s · ${s.cost} psi`;
};

export const BERSERKER_KIT = {
  ids: ['skill1', 'skill2', 'skill3'],
  skills: BERSERKER_SKILLS,
  tables: BERSERKER_TABLES,
  summary,
};

const TIMED = ['skill2', 'skill3'];

export class BerserkAbilities extends Psi {
  constructor() {
    super(BERSERKER_KIT);
  }

  reset() {
    super.reset();
    this.active = { skill2: 0, skill3: 0 }; // seconds left in the ride and in berserk
    this.total = { skill2: 0, skill3: 0 }; // their full length, for elapsed()
  }

  /** Counts cooldowns and timers down. Returns the ids whose timer just ran out. */
  update(dt, bonus = 0) {
    super.update(dt, bonus);
    const ended = [];
    for (const id of TIMED) {
      if (this.active[id] <= 0) continue;
      this.active[id] = Math.max(0, this.active[id] - dt);
      if (this.active[id] === 0) {
        ended.push(id);
        // the steed's cooldown starts only when the ride ends
        if (id === 'skill2') this.cd.skill2 = this.cooldownOf('skill2');
      }
    }
    return ended;
  }

  /** Seconds since the ride or berserk started, or null if it is not active. */
  elapsed(id) {
    if (!(this.active[id] > 0)) return null;
    return this.total[id] - this.active[id];
  }

  canCast(id) {
    if (this.active[id] > 0) return false;
    return super.canCast(id);
  }

  /** Spends psi and starts the ability. Returns false if it is not ready. */
  cast(id) {
    if (!this.canCast(id)) return false;
    const s = this.stats(id);
    this.energy -= s.cost;
    if (id === 'skill1') this.cd.skill1 = this.cooldownOf('skill1');
    if (id === 'skill2') this.active.skill2 = this.total.skill2 = s.duration;
    if (id === 'skill3') {
      this.active.skill3 = this.total.skill3 = s.duration;
      this.cd.skill3 = this.cooldownOf('skill3');
    }
    return true;
  }

  /** While a ride or berserk is running the chip reads as fully spent. */
  cooldownFrac(id) {
    if (this.active[id] > 0) return 1;
    return super.cooldownFrac(id);
  }
}

/** Numbers at a level, for places that read the tables directly (e.g. the ability list). */
export function berserkerStats(id, level) {
  return statsFrom(BERSERKER_TABLES, id, level);
}

