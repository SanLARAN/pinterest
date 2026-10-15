import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BerserkAbilities, BERSERKER_SKILLS, BERSERKER_TABLES, BERSERK, STEED } from '../src/sim/berserker.js';
import { CHARACTERS, modsFor, skillDefsFor, kitFor } from '../src/sim/modes.js';
import { Psi, PSI, skillOffers } from '../src/sim/psi.js';
import * as THREE from 'three';
import { Hero } from '../src/game/hero.js';
import { HERO_BASE } from '../src/config.js';

// advance the book by `seconds` in small steps, collecting the ids of timers that ran out
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
  assert.equal(kitFor('knight').skills.skill1.name, 'Psi Burst');
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

test('berserker: the abilities cost psi energy and are like the knight\'s psi book', () => {
  const book = new BerserkAbilities();
  assert.equal(book.noEnergy, undefined, 'the energy bar is shown');
  assert.equal(book.energy, PSI.start);
  assert.equal(book.costOf('skill1'), BERSERKER_TABLES.skill1.cost[0]);
  assert.equal(book.costOf('skill2'), BERSERKER_TABLES.skill2.cost[0]);
  assert.equal(book.costOf('skill3'), BERSERKER_TABLES.skill3.cost[0]);
  assert.equal(book.costLabel('skill1'), String(book.costOf('skill1')));
  assert.ok(book instanceof Psi, 'same base class as the knight');
});

test('berserker: casting spends energy and cannot be done without enough', () => {
  const book = new BerserkAbilities();
  book.energy = book.costOf('skill1') - 1;
  assert.equal(book.canCast('skill1'), false, 'not enough energy');
  assert.equal(book.cast('skill1'), false);
  book.energy = 100;
  assert.equal(book.cast('skill1'), true);
  assert.equal(book.energy, 100 - book.costOf('skill1'), 'the cost is taken');
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

  assert.deepEqual(run(book, 29.5), [], 'still riding at 29.5 s');
  assert.equal(book.cd.skill2, 0, 'no cooldown while the ride runs');
  assert.ok(book.elapsed('skill2') > 29);

  const end = run(book, 0.6);
  assert.deepEqual(end, ['skill2'], 'the ride ends at 30 s');
  assert.ok(Math.abs(book.cd.skill2 - 150) < 0.15, 'the 150 s cooldown starts at the end of the ride');
  assert.equal(book.canCast('skill2'), false);
  assert.equal(book.elapsed('skill2'), null);
});

test('berserker: the steed is 150 s from the end of the ride, not from the cast', () => {
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

test('berserker: psi cooldown items shorten the berserker\'s abilities too', () => {
  const book = new BerserkAbilities();
  book.cdMul = 0.5; // what passiveTotals sets for a cooldown item
  book.energy = 100;
  book.cast('skill1');
  assert.equal(book.cd.skill1, BERSERKER_TABLES.skill1.cooldown[0] * 0.5);
  book.energy = 100;
  book.cast('skill3');
  assert.equal(book.cd.skill3, 35 * 0.5);
  run(book, 40); // the steed's cooldown uses the same multiplier once its ride ends
  book.energy = 100;
  book.cast('skill2');
  run(book, 31);
  assert.ok(Math.abs(book.cd.skill2 - 150 * 0.5) < 1.2, 'about 75 s, counted from the end of the ride');
});

test('berserker: the abilities level up like the knight\'s, through the same offers', () => {
  const book = new BerserkAbilities();
  assert.deepEqual(book.upgradeOptions(), ['skill1', 'skill2', 'skill3'], 'all three can be raised');
  const offers = skillOffers(book);
  assert.deepEqual(offers.map((o) => o.name), ['Frost Whirl', 'Summon Steed', 'Berserk']);
  assert.ok(offers.every((o) => o.kind === 'skill' && o.from === 1 && o.to === 2));
  assert.equal(book.upgrade('skill2'), true);
  assert.equal(book.level('skill2'), 2);
  assert.equal(book.stats('skill2').duration, BERSERKER_TABLES.skill2.duration[1]);
  assert.ok(book.summary('skill2').includes('ride'), 'the summary follows the level');
  for (let i = 0; i < 10; i++) book.upgrade('skill1');
  assert.equal(book.level('skill1'), 6, 'capped at level 6');
});

test('berserker: higher levels ride longer and faster, and the trample hits harder', () => {
  const book = new BerserkAbilities();
  const first = book.statsAt('skill2', 1);
  const last = book.statsAt('skill2', 6);
  assert.equal(first.duration, 30, 'level 1 is the 30 s ride');
  assert.equal(first.cooldown, 150, 'level 1 is the 150 s cooldown');
  assert.ok(last.duration > first.duration);
  assert.ok(last.speed > first.speed);
  assert.ok(last.trample > first.trample && last.tramplePerSpeed > first.tramplePerSpeed);
});

test('berserker: the steed is slower than the old 1.9x and the same speed on every level', () => {
  const s = new BerserkAbilities().stats('skill2');
  assert.ok(s.speed > 1 && s.speed < 1.6, `steed speed ${s.speed} is a moderate boost`);
  assert.ok(STEED.minSpeed > 0, 'no trample while standing still');
});

test('berserker: Berserk raises damage and drains HP per second, by level', () => {
  const book = new BerserkAbilities();
  const s = book.stats('skill3');
  assert.equal(s.damageMul, 1.35, 'level 1 is +35 %');
  assert.equal(s.drain, 5, 'level 1 drains 5 HP per second');
  assert.equal(BERSERK.floorHp, 1);
  const hp = 10;
  assert.equal(Math.max(BERSERK.floorHp, hp - s.drain * 7), BERSERK.floorHp, 'a full berserk drains to the floor');
});

test('berserker: the HUD gets names, short labels, icons and summaries', () => {
  const book = new BerserkAbilities();
  assert.equal(book.defs.skill2.name, 'Summon Steed');
  assert.equal(book.defs.skill1.short, 'WHIRL');
  assert.equal(book.defs.skill3.icon, 'berserk');
  assert.ok(book.summary('skill2').includes('150'), 'the summary mentions the cooldown');
  assert.equal(typeof book.summaryAt('skill3', 6), 'string');
});

test('berserker: a berserker book and a knight book both read the same HUD fields', () => {
  for (const psi of [new Psi(), new BerserkAbilities()]) {
    for (const id of ['skill1', 'skill2', 'skill3']) {
      assert.ok(psi.defs[id].name, id);
      assert.equal(typeof psi.costLabel(id), 'string');
      assert.equal(typeof psi.summary(id), 'string');
      assert.equal(typeof psi.canCast(id), 'boolean');
      assert.ok(psi.cooldownFrac(id) >= 0 && psi.cooldownFrac(id) <= 1);
    }
  }
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

test('berserker hero: the berserker has hair and no shield; the knight has no hair', () => {
  const scene = new THREE.Scene();
  const h = new Hero(scene);
  assert.equal(h.model.hair, null, 'the knight has no hair');
  h.useCharacter('berserker');
  assert.ok(h.model.hair && typeof h.model.hair.update === 'function', 'berserker hair moves');
  h.model.hair.update(0.1, 3, 0, 0); // running forward: must not throw
  h.model.hair.update(0.1, 0, 3, 0); // sideways
});
