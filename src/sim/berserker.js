// The berserker: a long-haired ash-grey knight with a massive frost blade.
// His three abilities are not psi: they have no energy cost, and cooldown items do not touch them.
// Pure logic (no rendering), so it runs under node:test.

export const BERSERKER_SKILLS = {
  skill1: {
    id: 'skill1',
    key: 'Q',
    name: 'Frost Whirl',
    short: 'WHIRL',
    icon: 'whirl',
    desc: 'A full sword spin around you: heavy frost damage and knockback',
    meta: '4s cooldown',
    cooldown: 4,
  },
  skill2: {
    id: 'skill2',
    key: 'E',
    name: 'Summon Steed',
    short: 'STEED',
    icon: 'steed',
    desc: 'Leap onto a steed for 30 s. Much faster, tramples foes for damage that grows with speed. No attacks while riding. The cooldown starts only when the ride ends',
    meta: '30s ride · 150s cooldown after',
    duration: 30,
    cooldown: 150,
  },
  skill3: {
    id: 'skill3',
    key: 'C',
    name: 'Berserk',
    short: 'BERSERK',
    icon: 'berserk',
    desc: 'For 7 s: more damage, but you lose HP every second. You cannot die while it lasts (1 HP minimum), and your sight shrinks',
    meta: '7s · 35s cooldown',
    duration: 7,
    cooldown: 35,
  },
};

/** Whirl: multiplier on the sword damage, radius and knockback. */
export const WHIRL = { damageMul: 1.3, radius: 3.3, knock: 7 };

/** Steed: speed multiplier, trample damage (base + speed * k), per-foe tick and reach. */
export const STEED = {
  speedMul: 1.9,
  trampleBase: 6,
  trampleSpeed: 1.4,
  tickEvery: 0.4, // seconds between trample hits on the same foe
  knock: 5,
  reach: 1.25,
  minSpeed: 3, // below this speed the steed tramples nothing
  mountTime: 0.9, // seconds for the leap onto the steed
  dismountTime: 0.5, // seconds for the jump off at the end
};

/** Berserk: damage multiplier, HP lost per second, and the HP it never goes below. */
export const BERSERK = { damageMul: 1.35, drainPerSec: 5, floorHp: 1 };

const IDS = ['skill1', 'skill2', 'skill3'];

export class BerserkAbilities {
  constructor() {
    this.noEnergy = true; // the HUD hides the psi energy bar
    this.defs = BERSERKER_SKILLS;
    this.energy = 0;
    this.cdMul = 1; // cooldown items do not apply to these abilities
    this.reset();
  }

  reset() {
    this.cd = { skill1: 0, skill2: 0, skill3: 0 };
    this.active = { skill2: 0, skill3: 0 }; // seconds left in the ride and in berserk
    this.energy = 0;
  }

  /** Counts cooldowns and active times down. Returns the ids whose active time just ended. */
  update(dt) {
    const ended = [];
    for (const id of IDS) this.cd[id] = Math.max(0, this.cd[id] - dt);
    for (const id of ['skill2', 'skill3']) {
      if (this.active[id] <= 0) continue;
      this.active[id] = Math.max(0, this.active[id] - dt);
      if (this.active[id] === 0) {
        ended.push(id);
        // the steed's cooldown starts only when the ride ends
        if (id === 'skill2') this.cd.skill2 = BERSERKER_SKILLS.skill2.cooldown;
      }
    }
    return ended;
  }

  /** Seconds since the ride or berserk started, or null if it is not active. */
  elapsed(id) {
    if (!(this.active[id] > 0)) return null;
    return BERSERKER_SKILLS[id].duration - this.active[id];
  }

  gain() {
    // no energy to gain: kills restore nothing here
  }

  level() {
    return 1;
  }

  stats() {
    return null;
  }

  costOf() {
    return 0;
  }

  cooldownOf(id) {
    return BERSERKER_SKILLS[id]?.cooldown ?? 0;
  }

  canUpgrade() {
    return false;
  }

  upgradeOptions() {
    return []; // psi upgrades do not apply to this hero
  }

  upgrade() {
    return false;
  }

  canCast(id) {
    if (!BERSERKER_SKILLS[id]) return false;
    if (this.cd[id] > 0) return false;
    if (id in this.active && this.active[id] > 0) return false;
    return true;
  }

  /** Starts the ability. Returns false if it is not ready. */
  cast(id) {
    if (!this.canCast(id)) return false;
    if (id === 'skill1') this.cd.skill1 = BERSERKER_SKILLS.skill1.cooldown;
    if (id === 'skill2') this.active.skill2 = BERSERKER_SKILLS.skill2.duration;
    if (id === 'skill3') {
      this.active.skill3 = BERSERKER_SKILLS.skill3.duration;
      this.cd.skill3 = BERSERKER_SKILLS.skill3.cooldown;
    }
    return true;
  }

  /** 0 = ready. While a ride or berserk is running the chip reads as fully spent. */
  cooldownFrac(id) {
    if (!BERSERKER_SKILLS[id]) return 0;
    if (id in this.active && this.active[id] > 0) return 1;
    const cd = BERSERKER_SKILLS[id].cooldown;
    return cd > 0 ? Math.min(1, this.cd[id] / cd) : 0;
  }

  /** Short label for the chip: how long the ability lasts, or how long its cooldown is. */
  costLabel(id) {
    const s = BERSERKER_SKILLS[id];
    if (!s) return '';
    return s.duration ? `${s.duration}s` : `${s.cooldown}s`;
  }

  summary(id) {
    return BERSERKER_SKILLS[id]?.meta ?? '';
  }
}
