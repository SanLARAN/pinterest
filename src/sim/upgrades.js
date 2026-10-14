// Level-up boons. Each one mutates the hero's stat block.
export const UPGRADES = [
  { id: 'steel', icon: '⚔️', name: 'Sharpened Steel', desc: '+20% swing damage', apply: (s) => { s.damage *= 1.2; } },
  { id: 'reach', icon: '🌙', name: 'Longer Reach', desc: '+15% swing reach', apply: (s) => { s.reach *= 1.15; } },
  { id: 'arc', icon: '🌀', name: 'Wide Arc', desc: '+25% swing arc', apply: (s) => { s.arc *= 1.25; } },
  { id: 'quick', icon: '🗡️', name: 'Quick Hands', desc: '-15% swing cooldown', apply: (s) => { s.swingCooldown *= 0.85; } },
  { id: 'boots', icon: '👢', name: 'Swift Boots', desc: '+12% move speed', apply: (s) => { s.speed *= 1.12; } },
  {
    id: 'heart', icon: '❤️', name: 'Iron Heart', desc: '+20 max HP and heal 20',
    apply: (s, hero) => { s.maxHp += 20; hero.heal(20); },
  },
  { id: 'wind', icon: '💨', name: 'Second Wind', desc: '-25% dash cooldown', apply: (s) => { s.dashCooldown *= 0.75; } },
  { id: 'vamp', icon: '🩸', name: 'Vampire Edge', desc: 'Heal 2 HP per kill', apply: (s) => { s.lifesteal += 2; } },
  { id: 'magnet', icon: '🧲', name: 'Ember Magnet', desc: 'Embers are pulled in from further away', apply: (s) => { s.magnet *= 1.5; } },
  { id: 'mind', icon: '🔮', name: 'Mind Spring', desc: '+1.5 psi energy regen per second', apply: (s) => { s.psiRegen += 1.5; } },
];

/** Picks `count` distinct boons at random. */
export function drawUpgrades(rng, count = 3) {
  const pool = [...UPGRADES];
  const out = [];
  while (out.length < count && pool.length) {
    const i = Math.floor(rng.next() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}
