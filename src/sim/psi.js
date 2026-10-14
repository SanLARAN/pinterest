// Psi (psychic energy) abilities. Pure logic: no rendering, so it runs under node:test.
// Each skill has six levels. Skills start at level 1; every third hero level the player
// spends the level-up on a skill (see skillOffers / isSkillLevel), up to level 6.
export const PSI = {
  max: 100,
  start: 60,
  regen: 1.2, // base energy per second (bonus regen comes from boons and items)
  killGain: 5, // energy restored per kill
  maxLevel: 6,
  lanceSpeed: 26,
  skills: {
    skill1: { id: 'skill1', key: 'Q', name: 'Psi Burst', icon: 'burst' },
    skill2: { id: 'skill2', key: 'E', name: 'Mind Lance', icon: 'lance' },
    skill3: { id: 'skill3', key: 'C', name: 'Telekinetic Pull', icon: 'pull' },
  },
};

// Per-level tables. Index 0 is level 1, index 5 is level 6.
export const SKILL_TABLES = {
  skill1: { // Psi Burst: shockwave around the knight
    cost: [35, 34, 33, 32, 30, 28],
    cooldown: [0.7, 0.65, 0.6, 0.55, 0.5, 0.45],
    damage: [26, 32, 39, 47, 56, 66],
    radius: [4.6, 5.0, 5.4, 5.8, 6.2, 6.7],
    knock: [9, 10, 11, 12, 13, 14],
    stun: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  },
  skill2: { // Mind Lance: piercing bolt along the aim
    cost: [25, 24, 23, 22, 21, 20],
    cooldown: [0.8, 0.74, 0.68, 0.62, 0.56, 0.5],
    damage: [20, 25, 31, 38, 46, 55],
    range: [13, 14, 15.5, 17, 18.5, 20],
    width: [0.7, 0.75, 0.8, 0.9, 1.0, 1.1],
  },
  skill3: { // Telekinetic Pull: drags foes in and holds them
    cost: [40, 38, 36, 34, 32, 30],
    cooldown: [1.5, 1.4, 1.3, 1.2, 1.1, 1.0],
    damage: [0, 6, 10, 14, 18, 24],
    radius: [7.5, 8.0, 8.6, 9.2, 9.8, 10.5],
    speed: [13, 14, 15, 16, 17, 18],
    stun: [1.4, 1.6, 1.8, 2.0, 2.2, 2.5],
  },
};

export const SKILL_IDS = Object.keys(PSI.skills);
export const SKILL_UPGRADE_EVERY = 3;

/** Numbers for one skill at one level (1..maxLevel). */
export function skillStats(id, level) {
  const t = SKILL_TABLES[id];
  if (!t) return null;
  const i = Math.max(1, Math.min(PSI.maxLevel, level)) - 1;
  const out = {};
  for (const k of Object.keys(t)) out[k] = t[k][i];
  return out;
}

/** One-line summary of the numbers that matter for a skill at a level. */
export function skillSummary(id, level) {
  const s = skillStats(id, level);
  if (!s) return '';
  if (id === 'skill1') return `${s.damage} dmg · ${s.radius} radius · ${s.cost} psi`;
  if (id === 'skill2') return `${s.damage} dmg · ${s.range} reach · ${s.cost} psi`;
  return `${s.stun}s hold · ${s.radius} radius · ${s.cost} psi`;
}

/** True on hero levels 3, 6, 9, ...: those level-ups are spent on psi skills. */
export const isSkillLevel = (heroLevel) => heroLevel > 0 && heroLevel % SKILL_UPGRADE_EVERY === 0;

/** Level-up offers for the skills that can still be raised. Empty when all are maxed. */
export function skillOffers(psi) {
  return psi.upgradeOptions().map((id) => {
    const from = psi.level(id);
    const to = from + 1;
    return {
      kind: 'skill',
      id,
      name: PSI.skills[id].name,
      from,
      to,
      desc: skillSummary(id, to),
    };
  });
}

export class Psi {
  constructor() {
    this.reset();
  }

  reset() {
    this.energy = PSI.start;
    this.cd = { skill1: 0, skill2: 0, skill3: 0 };
    this.levels = { skill1: 1, skill2: 1, skill3: 1 };
  }

  /** `bonus` is extra regen per second from boons and items (hero.stats.psiRegen). */
  update(dt, bonus = 0) {
    this.energy = Math.min(PSI.max, this.energy + (PSI.regen + bonus) * dt);
    for (const id of SKILL_IDS) this.cd[id] = Math.max(0, this.cd[id] - dt);
  }

  gain(n) {
    this.energy = Math.min(PSI.max, this.energy + n);
  }

  level(id) {
    return this.levels[id] ?? 0;
  }

  /** Current numbers for a skill (its level decides them). */
  stats(id) {
    return skillStats(id, this.level(id));
  }

  costOf(id) {
    return this.stats(id)?.cost ?? Infinity;
  }

  cooldownOf(id) {
    return this.stats(id)?.cooldown ?? 0;
  }

  canUpgrade(id) {
    return this.level(id) > 0 && this.level(id) < PSI.maxLevel;
  }

  upgradeOptions() {
    return SKILL_IDS.filter((id) => this.canUpgrade(id));
  }

  /** Raises a skill one level. Returns false if it is unknown or already at the cap. */
  upgrade(id) {
    if (!this.canUpgrade(id)) return false;
    this.levels[id] += 1;
    return true;
  }

  canCast(id) {
    if (!PSI.skills[id]) return false;
    return this.cd[id] <= 0 && this.energy >= this.costOf(id);
  }

  /** Spends energy and starts the cooldown. Returns false if the skill is not ready. */
  cast(id) {
    if (!this.canCast(id)) return false;
    this.energy -= this.costOf(id);
    this.cd[id] = this.cooldownOf(id);
    return true;
  }

  /** 0 = ready, 1 = just cast. */
  cooldownFrac(id) {
    if (!PSI.skills[id]) return 0;
    const cd = this.cooldownOf(id);
    return cd > 0 ? Math.min(1, this.cd[id] / cd) : 0;
  }
}
