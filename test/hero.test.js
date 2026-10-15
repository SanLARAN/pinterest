import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS } from '../src/sim/modes.js';
import { PSI, SKILL_TABLES } from '../src/sim/psi.js';

test('hero: every hero has a name, a blurb and at least one move', () => {
  for (const c of CHARACTERS) {
    assert.ok(c.id && c.name && c.blurb, c.id);
    assert.ok(c.moves.length >= 1, c.id);
    for (const m of c.moves) assert.ok(m.key && m.name && m.desc, `${c.id} move ${m.name}`);
  }
});

test('hero: listed psi skills exist and have a description and level-1 numbers', () => {
  for (const c of CHARACTERS) {
    for (const sid of c.skills) {
      assert.ok(PSI.skills[sid], sid);
      assert.ok(PSI.skills[sid].desc, `${sid} desc`);
      assert.ok(SKILL_TABLES[sid].cost[0] > 0 && SKILL_TABLES[sid].cooldown[0] > 0, sid);
    }
  }
});

test('hero: the knight has the three psi skills and the swing and dash moves', () => {
  const knight = CHARACTERS.find((c) => c.id === 'knight');
  assert.deepEqual(knight.skills, ['skill1', 'skill2', 'skill3']);
  assert.deepEqual(knight.moves.map((m) => m.name), ['Swing', 'Dash']);
});
