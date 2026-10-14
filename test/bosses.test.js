import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_DEFS, BOSS_SKILLS, BOSS_ORDER, bossForWave } from '../src/sim/bosses.js';
import { waveSpec, chapterFor } from '../src/sim/waves.js';

test('bosses: four unique bosses, each with three known skills', () => {
  assert.equal(BOSS_ORDER.length, 4);
  const names = new Set();
  for (const id of BOSS_ORDER) {
    const b = BOSS_DEFS[id];
    assert.ok(b, id);
    assert.equal(b.skills.length, 3, `${id} has three skills`);
    for (const s of b.skills) assert.ok(BOSS_SKILLS[s], `${id}.${s} is defined`);
    assert.equal(new Set(b.skills).size, 3, `${id} skills are distinct`);
    names.add(b.name);
    assert.ok(b.hp > 0 && b.armor >= 0 && b.armor < 1);
  }
  assert.equal(names.size, 4, 'names are unique');
});

test('bosses: the roster cycles across boss chapters 5, 10, 15, 20, 25', () => {
  assert.equal(bossForWave(5).id, 'champion');
  assert.equal(bossForWave(10).id, 'witch');
  assert.equal(bossForWave(15).id, 'colossus');
  assert.equal(bossForWave(20).id, 'wraith');
  assert.equal(bossForWave(25).id, 'champion');
});

test('bosses: boss chapters carry the boss name and the spec knows its boss', () => {
  const spec = waveSpec(10);
  assert.equal(spec.isBoss, true);
  assert.equal(spec.bossId, 'witch');
  assert.equal(chapterFor(10).title, BOSS_DEFS.witch.title);
  assert.equal(waveSpec(7).bossId, null);
});
