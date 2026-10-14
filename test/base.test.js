import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLayout, BASE, GATE_BOSSES } from '../src/sim/layout.js';
import { FlowField } from '../src/sim/nav.js';
import { HALF, SIZE } from '../src/sim/layout.js';

const idx = (x, z) => (Math.round(z) + HALF) * SIZE + (Math.round(x) + HALF);

test('stronghold: gates are sealed by default and the throne is out of reach', () => {
  const L = buildLayout(1234);
  assert.equal(GATE_BOSSES, 6);
  assert.ok(L.base.gateCells.length > 0, 'gates block some cells');
  for (const k of L.base.gateCells) assert.equal(L.blocked[k], 1);
  const flow = new FlowField(L.blocked);
  flow.setGoal(L.start.x, L.start.z);
  // a cell just inside the gate, between the walls and the throne
  const inside = flow.dist[idx(BASE.x + 3.6, BASE.z + 2.8)];
  assert.equal(inside, -1, 'sealed interior is unreachable');
});

test('stronghold: opening the gates makes the throne reachable from the keep', () => {
  const L = buildLayout(1234);
  for (const k of L.base.gateCells) L.blocked[k] = 0;
  const flow = new FlowField(L.blocked);
  flow.setGoal(L.start.x, L.start.z);
  const inside = flow.dist[idx(BASE.x + 3.6, BASE.z + 2.8)];
  assert.ok(inside >= 0, 'interior reachable after opening');
  const throneSide = flow.dist[idx(BASE.x, BASE.z + 2.2)];
  assert.ok(throneSide >= 0, 'cell next to the throne is reachable');
});

test('stronghold: no outer rift or prop sits inside its zone', () => {
  for (const seed of [7, 99, 4242]) {
    const L = buildLayout(seed);
    for (const rf of L.rifts) {
      const d = Math.max(Math.abs(rf.x - BASE.x), Math.abs(rf.z - BASE.z));
      assert.ok(d >= BASE.half + 6, 'rift clear of the stronghold');
    }
    for (const p of L.props) {
      const d = Math.max(Math.abs(p.x - BASE.x), Math.abs(p.z - BASE.z));
      assert.ok(d >= BASE.half + 3.2, 'prop clear of the stronghold');
    }
    assert.equal(L.base.rifts.length, 2);
  }
});
