import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BerserkAbilities, BERSERKER_SKILLS, BERSERK, STEED } from '../src/sim/berserker.js';
import { CHARACTERS, modsFor, skillDefsFor } from '../src/sim/modes.js';
import { Psi, PSI } from '../src/sim/psi.js';
import * as THREE from 'three';
import { Hero } from '../src/game/hero.js';
import { HERO_BASE } from '../src/config.js';

const run = (book, seconds, step = 0.1) => {
  const ended = [];
  for (let t = 0; t < seconds - 1e-9; t += step) ended.push(...book.update(step));
  return ended;
};

test('berserker: the hero is selectable and uses the three berserker abilities', () => {
  const b = CHARACTERS.find((c) => c.id === 'berserker');
  assert.ok(b, 'berserker is in CHARACTERS');
  assert.deepEqual(b.skills, ['skill1', 'skill2', 'skill3']);
  assert.deepEqual(b.moves.map((m) => m.name), ['Frost thrust', 'Dash']);
  assert.equal(skillDefsFor('berserker'), BERSERKER_SKILLS);
  assert.equal(skillDefsFor('knight'), PSI.skills);
});

test('berserker: the sword hits harder but swings more slowly than the knight\'s', () => {
  const knight = modsFor('knight');
  const b = modsFor('berserker');
  assert.equal(knight.damageMul, 1);
  assert.equal(knight.swingCooldownMul, 1);
  assert.equal(knight.swingTimeMul, 1);
  assert.ok(b.damageMul > 1, 'more damage');
  assert.ok(b.swingCooldownMul > 1, 'longer interval between swings');
  assert.ok(b.swingTimeMul > 1, 'slower thrust');
});

test('berserker: Frost Whirl has a 4 s cooldown', () => {
  const book = new BerserkAbilities();
  assert.equal(book.cast('skill1'), true);
  assert.equal(book.canCast('skill1'), false);
  run(book, 3.9);
  assert.equal(book.canCast('skill1'), false, 'still cooling at 3.9 s');
  run(book, 0.2);
  assert.equal(book.canCast('skill1'), true, 'ready after 4 s');
});

test('berserker: the steed rides for 30 s, and its cooldown starts only when the ride ends', () => {
  const book = new BerserkAbilities();
  assert.equal(book.cast('skill2'), true);
  assert.equal(book.cooldownFrac('skill2'), 1, 'shown as spent while riding');
  assert.equal(book.canCast('skill2'), false, 'cannot summon a second steed mid-ride');
  assert.equal(book.elapsed('skill2'), 0);

  const ended = run(book, 29.5);
  assert.deepEqual(ended, [], 'still riding at 29.5 s');
  assert.equal(book.cd.skill2, 0, 'no cooldown while the ride runs');
  assert.equal(book.elapsed('skill2') > 29, true);

  const end = run(book, 0.6);
  assert.deepEqual(end, ['skill2'], 'the ride ends at 30 s');
  assert.ok(Math.abs(book.cd.skill2 - BERSERKER_SKILLS.skill2.cooldown) < 0.15, 'the 150 s cooldown starts at the end of the ride');
  assert.equal(book.canCast('skill2'), false);
  assert.equal(book.elapsed('skill2'), null);
});

test('berserker: the steed cooldown is 150 s from the end of the ride, not from the cast', () => {
  const book = new BerserkAbilities();
  book.cast('skill2');
  run(book, 30.2);
  assert.equal(book.canCast('skill2'), false);
  run(book, 149);
  assert.equal(book.canCast('skill2'), false, 'still cooling 149 s after the ride ended');
  run(book, 1.2);
  assert.equal(book.canCast('skill2'), true, 'ready 150 s after the ride ended');
});

test('berserker: Berserk lasts 7 s with a 35 s cooldown that starts on cast', () => {
  const book = new BerserkAbilities();
  assert.equal(book.cast('skill3'), true);
  assert.equal(book.elapsed('skill3'), 0);
  assert.equal(book.cd.skill3, 35, 'cooldown starts at the cast');
  assert.deepEqual(run(book, 6.9), []);
  assert.deepEqual(run(book, 0.2), ['skill3'], 'berserk ends at 7 s');
  assert.equal(book.elapsed('skill3'), null);
  assert.equal(book.canCast('skill3'), false, 'still on cooldown after berserk ends');
  run(book, 27.5);
  assert.equal(book.canCast('skill3'), false);
  run(book, 0.8);
  assert.equal(book.canCast('skill3'), true, 'ready 35 s after the cast');
});

test('berserker: psi cooldown items do not apply to the berserker\'s abilities', () => {
  const book = new BerserkAbilities();
  book.cdMul = 0.5; // what passiveTotals would set for a cooldown item
  book.cast('skill1');
  assert.equal(book.cd.skill1, BERSERKER_SKILLS.skill1.cooldown);
  book.cast('skill3');
  assert.equal(book.cd.skill3, BERSERKER_SKILLS.skill3.cooldown);
});

test('berserker: no energy, no upgrades, and the HUD gets its own names and labels', () => {
  const book = new BerserkAbilities();
  assert.equal(book.noEnergy, true);
  assert.equal(book.costOf('skill1'), 0);
  assert.deepEqual(book.upgradeOptions(), []);
  assert.equal(book.canUpgrade('skill1'), false);
  book.gain(50);
  assert.equal(book.energy, 0, 'kills give no energy');
  assert.equal(book.costLabel('skill1'), '4s');
  assert.equal(book.costLabel('skill2'), '30s');
  assert.equal(book.costLabel('skill3'), '7s');
  assert.equal(book.defs.skill2.name, 'Summon Steed');
  assert.ok(book.summary('skill2').includes('150s'));
});

test('berserker: a psi book keeps the same HUD interface', () => {
  const psi = new Psi();
  assert.equal(psi.noEnergy, false);
  assert.equal(psi.defs.skill1.name, PSI.skills.skill1.name);
  assert.equal(psi.costLabel('skill1'), String(psi.costOf('skill1')));
  assert.equal(typeof psi.summary('skill1'), 'string');
});

test('berserker: the berserk drain is per second and cannot go below the floor', () => {
  assert.equal(BERSERK.floorHp, 1);
  assert.ok(BERSERK.drainPerSec > 0);
  const hp = 10;
  assert.equal(Math.max(BERSERK.floorHp, hp - BERSERK.drainPerSec * 7), BERSERK.floorHp, 'a full berserk drains to the floor');
});

test('berserker: berserk raises damage; the steed\'s trample grows with speed', () => {
  assert.ok(BERSERK.damageMul > 1);
  const slow = STEED.trampleBase + 4 * STEED.trampleSpeed;
  const fast = STEED.trampleBase + 14 * STEED.trampleSpeed;
  assert.ok(fast > slow, 'faster riding tramples harder');
  assert.ok(STEED.speedMul > 1, 'the steed is faster than on foot');
  assert.ok(STEED.minSpeed > 0, 'no trample while standing still');
});

test('berserker hero: berserk keeps the hero at 1 HP; a hit at 0 HP kills him otherwise', () => {
  const h = new Hero(new THREE.Scene());
  h.reset(0, 0);
  h.berserk = true;
  h.takeHit(999, 0, 0);
  assert.equal(h.hp, BERSERK.floorHp);
  assert.equal(h.dead, false);
  h.invT = 0;
  h.takeHit(999, 0, 0);
  assert.equal(h.hp, BERSERK.floorHp, 'still standing on the next hit');
  assert.equal(h.dead, false);
  h.berserk = false;
  h.invT = 0;
  h.takeHit(999, 0, 0);
  assert.equal(h.hp, 0, 'without berserk the same hit is lethal');
});

test('berserker hero: the berserker swaps the sword and the body; the sword numbers follow the hero', () => {
  const scene = new THREE.Scene();
  const h = new Hero(scene);
  h.reset(0, 0);
  const knightDamage = h.stats.damage;
  const knightSwing = h.swingTime;
  assert.equal(h.useCharacter('knight'), false, 'same hero: no swap');
  assert.equal(h.useCharacter('berserker'), true, 'new hero: model swapped');
  assert.equal(h.characterId, 'berserker');
  assert.equal(scene.children.includes(h.model.root), true, 'new model is in the scene');
  h.reset(0, 0);
  assert.ok(Math.abs(h.stats.damage - knightDamage * modsFor('berserker').damageMul) < 1e-6, 'more damage');
  assert.ok(h.swingTime > knightSwing, 'slower thrust');
  assert.equal(h.swingTime, HERO_BASE.swingTime * modsFor('berserker').swingTimeMul);
  assert.equal(h.useCharacter('knight'), true);
  h.reset(0, 0);
  assert.equal(h.stats.damage, knightDamage, 'the knight is back to his own numbers');
  assert.equal(h.swingTime, knightSwing);
});
