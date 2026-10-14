import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Psi, PSI, SKILL_IDS, SKILL_TABLES, skillStats, skillOffers, isSkillLevel } from '../src/sim/psi.js';

test('psi: casting spends energy and starts a cooldown', () => {
  const p = new Psi();
  assert.equal(p.canCast('skill1'), true);
  assert.equal(p.cast('skill1'), true);
  assert.equal(p.energy, PSI.start - p.stats('skill1').cost);
  assert.equal(p.canCast('skill1'), false, 'still on cooldown');
  p.update(p.stats('skill1').cooldown + 0.01);
  p.energy = PSI.max; // isolate the cooldown from energy
  assert.equal(p.canCast('skill1'), true, 'ready after cooldown');
});

test('psi: insufficient energy blocks casting', () => {
  const p = new Psi();
  p.energy = p.costOf('skill3') - 1;
  assert.equal(p.cast('skill3'), false);
  assert.equal(p.energy, p.costOf('skill3') - 1, 'no energy spent on a failed cast');
});

test('psi: energy regenerates and is capped', () => {
  const p = new Psi();
  p.update(1000);
  assert.equal(p.energy, PSI.max);
  p.energy = 0;
  p.update(1);
  assert.equal(p.energy, PSI.regen);
});

test('psi: kills restore energy without exceeding the cap', () => {
  const p = new Psi();
  p.energy = PSI.max - 1;
  p.gain(PSI.killGain);
  assert.equal(p.energy, PSI.max);
});

test('psi: unknown skill ids are never castable', () => {
  const p = new Psi();
  assert.equal(p.canCast('nope'), false);
  assert.equal(p.cast('nope'), false);
});

test('psi: every skill table has six levels and never gets worse', () => {
  for (const id of SKILL_IDS) {
    for (const [key, row] of Object.entries(SKILL_TABLES[id])) {
      assert.equal(row.length, PSI.maxLevel, `${id}.${key} has 6 levels`);
      if (key === 'cost' || key === 'cooldown') {
        for (let i = 1; i < row.length; i++) assert.ok(row[i] <= row[i - 1], `${id}.${key} does not rise`);
      } else {
        for (let i = 1; i < row.length; i++) assert.ok(row[i] >= row[i - 1], `${id}.${key} does not fall`);
      }
    }
  }
});

test('psi: skills start at level 1 and stop at level 6', () => {
  const p = new Psi();
  for (const id of SKILL_IDS) assert.equal(p.level(id), 1);
  for (let i = 0; i < 10; i++) p.upgrade('skill2');
  assert.equal(p.level('skill2'), PSI.maxLevel);
  assert.equal(p.upgrade('skill2'), false, 'capped at level 6');
  assert.equal(p.canUpgrade('skill2'), false);
  assert.deepEqual(p.upgradeOptions(), ['skill1', 'skill3']);
});

test('psi: a higher level makes the skill stronger and changes its numbers', () => {
  const p = new Psi();
  const before = p.stats('skill1');
  p.upgrade('skill1');
  const after = p.stats('skill1');
  assert.ok(after.damage > before.damage);
  assert.ok(after.radius > before.radius);
  assert.ok(after.cost <= before.cost);
  assert.deepEqual(skillStats('skill1', 1), before);
});

test('psi: cooldown and cost follow the current level', () => {
  const p = new Psi();
  p.upgrade('skill3');
  assert.equal(p.costOf('skill3'), skillStats('skill3', 2).cost);
  assert.equal(p.cast('skill3'), true);
  assert.equal(p.cd.skill3, skillStats('skill3', 2).cooldown);
});

test('psi: every third hero level is a skill level', () => {
  assert.equal(isSkillLevel(1), false);
  assert.equal(isSkillLevel(2), false);
  assert.equal(isSkillLevel(3), true);
  assert.equal(isSkillLevel(6), true);
  assert.equal(isSkillLevel(4), false);
});

test('psi: skill offers list the next level and drop maxed skills', () => {
  const p = new Psi();
  const offers = skillOffers(p);
  assert.equal(offers.length, 3);
  assert.equal(offers[0].kind, 'skill');
  assert.equal(offers[0].from, 1);
  assert.equal(offers[0].to, 2);
  for (let i = 0; i < 5; i++) p.upgrade('skill1');
  assert.equal(skillOffers(p).some((o) => o.id === 'skill1'), false);
  assert.equal(skillOffers(p).length, 2);
});

test('psi: reset puts every skill back to level 1', () => {
  const p = new Psi();
  p.upgrade('skill1');
  p.reset();
  assert.equal(p.level('skill1'), 1);
});
