// Psi (psychic energy) abilities. Pure logic: no rendering, so it runs under node:test.
export const PSI = {
  max: 100,
  start: 60,
  regen: 3, // base energy per second (bonus regen comes from boons and items)
  killGain: 5, // energy restored per kill
  skills: {
    skill1: { id: 'skill1', key: 'Q', name: 'Psi Burst', cost: 35, cooldown: 0.7 },
    skill2: { id: 'skill2', key: 'E', name: 'Mind Lance', cost: 25, cooldown: 0.8 },
    skill3: { id: 'skill3', key: 'C', name: 'Telekinetic Pull', cost: 40, cooldown: 1.5 },
  },
  burst: { radius: 4.6, damage: 26, knock: 9, stun: 0.5 },
  lance: { speed: 26, range: 13, width: 0.7, damage: 20 },
  pull: { radius: 7.5, speed: 13, stun: 1.4 },
};

export const SKILL_IDS = Object.keys(PSI.skills);

export class Psi {
  constructor() {
    this.reset();
  }

  reset() {
    this.energy = PSI.start;
    this.cd = { skill1: 0, skill2: 0, skill3: 0 };
  }

  /** `bonus` is extra regen per second from boons and items (hero.stats.psiRegen). */
  update(dt, bonus = 0) {
    this.energy = Math.min(PSI.max, this.energy + (PSI.regen + bonus) * dt);
    for (const id of SKILL_IDS) this.cd[id] = Math.max(0, this.cd[id] - dt);
  }

  gain(n) {
    this.energy = Math.min(PSI.max, this.energy + n);
  }

  canCast(id) {
    const s = PSI.skills[id];
    return !!s && this.cd[id] <= 0 && this.energy >= s.cost;
  }

  /** Spends energy and starts the cooldown. Returns false if the skill is not ready. */
  cast(id) {
    if (!this.canCast(id)) return false;
    const s = PSI.skills[id];
    this.energy -= s.cost;
    this.cd[id] = s.cooldown;
    return true;
  }

  /** 0 = ready, 1 = just cast. */
  cooldownFrac(id) {
    const s = PSI.skills[id];
    return s ? Math.min(1, this.cd[id] / s.cooldown) : 0;
  }
}
