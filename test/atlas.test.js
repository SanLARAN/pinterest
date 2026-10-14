import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog, emptyAtlas, normalizeAtlas, isKnown, discover, ATLAS_TABS } from '../src/sim/atlas.js';
import { ITEM_IDS } from '../src/sim/items.js';
import { ENEMY_DEFS } from '../src/sim/defs.js';
import { BOSS_DEFS } from '../src/sim/bosses.js';

test('the catalog lists every monster, boss and item with a name and text', () => {
  const c = catalog();
  assert.equal(c.monster.length, Object.keys(ENEMY_DEFS).length - 1, 'the generic boss spawn type is not a monster entry');
  assert.equal(c.boss.length, Object.keys(BOSS_DEFS).length);
  assert.equal(c.item.length, ITEM_IDS.length);
  for (const kind of ATLAS_TABS) {
    for (const e of c[kind]) {
      assert.ok(e.name && e.desc, `${kind}:${e.id} needs a name and description`);
    }
  }
});

test('discovering an entry is idempotent and leaves other kinds alone', () => {
  let a = emptyAtlas();
  a = discover(a, 'monster', 'slime');
  const same = discover(a, 'monster', 'slime');
  assert.equal(same, a, 'second discovery returns the same object');
  assert.ok(isKnown(a, 'monster', 'slime'));
  assert.ok(!isKnown(a, 'monster', 'imp'));
  assert.deepEqual(a.item, []);
});

test('normalize keeps only valid unique ids from untrusted storage', () => {
  const a = normalizeAtlas({ monster: ['slime', 'slime', 'dragon'], boss: ['champion'], item: 'bogus' });
  assert.deepEqual(a.monster, ['slime']);
  assert.deepEqual(a.boss, ['champion']);
  assert.deepEqual(a.item, []);
  assert.deepEqual(normalizeAtlas(null), emptyAtlas());
});
