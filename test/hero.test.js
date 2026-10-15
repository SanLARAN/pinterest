import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, skillDefsFor } from '../src/sim/modes.js';
import { PSI, SKILL_TABLES } from '../src/sim/psi.js';

test('hero: every hero has a name, a blurb and at least one move', () => {
  for (const c of CHARACTERS) {
    assert.ok(c.id && c.name && c.blurb, c.id);
    assert.ok(c.moves.length >= 1, c.id);
    for (const m of c.moves) assert.ok(m.key && m.name && m.desc, `${c.id} move ${m.name}`);
  }
});

test('hero: listed skills exist in their hero\'s ability set and have a description', () => {
  for (const c of CHARACTERS) {
    const defs = skillDefsFor(c.id);
    for (const sid of c.skills) {
      assert.ok(defs[sid], `${c.id} ${sid}`);
      assert.ok(defs[sid].desc, `${c.id} ${sid} desc`);
    }
  }
});

test('hero: the knight\'s psi skills have level-1 costs and cooldowns', () => {
  const knight = CHARACTERS.find((c) => c.id === 'knight');
  for (const sid of knight.skills) {
    assert.ok(SKILL_TABLES[sid].cost[0] > 0 && SKILL_TABLES[sid].cooldown[0] > 0, sid);
  }
});

test('hero: the knight has the three psi skills and the swing and dash moves', () => {
  const knight = CHARACTERS.find((c) => c.id === 'knight');
  assert.deepEqual(knight.skills, ['skill1', 'skill2', 'skill3']);
  assert.deepEqual(knight.moves.map((m) => m.name), ['Swing', 'Dash']);
});
