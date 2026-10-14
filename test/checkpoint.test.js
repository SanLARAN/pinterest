import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureCheckpoint } from '../src/sim/checkpoint.js';

const live = () => ({
  wave: 5,
  bossesSlain: 1,
  gatesOpen: false,
  throneHp: 300,
  score: 1200,
  kills: 40,
  coins: 15,
  level: 4,
  xp: 3,
  xpNext: 30,
  stats: { maxHp: 12, damage: 4 },
  inv: ['quartz', null, 'hourglass'],
  psiLevels: { skill1: 2, skill2: 1, skill3: 1 },
});

test('checkpoint: captures the carried fields of the run', () => {
  const cp = captureCheckpoint(live());
  assert.equal(cp.wave, 5);
  assert.equal(cp.bossesSlain, 1);
  assert.equal(cp.gatesOpen, false);
  assert.equal(cp.score, 1200);
  assert.equal(cp.level, 4);
  assert.deepEqual(cp.stats, { maxHp: 12, damage: 4 });
  assert.deepEqual(cp.inv, ['quartz', null, 'hourglass']);
  assert.deepEqual(cp.psiLevels, { skill1: 2, skill2: 1, skill3: 1 });
});

test('checkpoint: is a copy, later changes to the live run do not leak in', () => {
  const src = live();
  const cp = captureCheckpoint(src);
  src.stats.maxHp = 99;
  src.inv[0] = 'boots';
  src.psiLevels.skill1 = 6;
  src.score = 0;
  assert.equal(cp.stats.maxHp, 12);
  assert.equal(cp.inv[0], 'quartz');
  assert.equal(cp.psiLevels.skill1, 2);
  assert.equal(cp.score, 1200);
});

test('checkpoint: gatesOpen is stored as a boolean', () => {
  assert.equal(captureCheckpoint({ ...live(), gatesOpen: 1 }).gatesOpen, true);
  assert.equal(captureCheckpoint({ ...live(), gatesOpen: undefined }).gatesOpen, false);
});
