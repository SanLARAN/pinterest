import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLayout, BASE } from '../src/sim/layout.js';
import { resolveStatic, overlapsStatic, removeStaticKind } from '../src/sim/collision.js';

// the stronghold's north wall runs along x at z = BASE.z - BASE.half; its gate is the middle of it
const WALL_Z = BASE.z - BASE.half;

test('stronghold: walls block the knight', () => {
  const L = buildLayout(1234);
  const body = { x: BASE.x - 5, z: WALL_Z, radius: 0.4 };
  assert.equal(overlapsStatic(L, body.x, body.z, body.radius), true);
  for (let i = 0; i < 4; i++) resolveStatic(L, body);
  // resolveStatic stops exactly on the face, so test with a hair less radius to ignore float noise
  assert.equal(overlapsStatic(L, body.x, body.z, body.radius - 0.01), false, 'pushed out of the wall');
});

test('stronghold: towers block the knight', () => {
  const L = buildLayout(1234);
  const corner = { x: BASE.x - BASE.half, z: BASE.z - BASE.half };
  assert.equal(overlapsStatic(L, corner.x, corner.z, 0.4), true);
});

test('stronghold: sealed gates block, open gates let the knight through', () => {
  const L = buildLayout(1234);
  assert.equal(overlapsStatic(L, BASE.x, WALL_Z, 0.4), true, 'sealed gate blocks');
  removeStaticKind(L, 'gate');
  assert.equal(overlapsStatic(L, BASE.x, WALL_Z, 0.4), false, 'open gate is passable');
});

test('stronghold: the throne blocks until it falls', () => {
  const L = buildLayout(1234);
  assert.equal(overlapsStatic(L, BASE.x, BASE.z, 0.4), true);
  removeStaticKind(L, 'throne');
  assert.equal(overlapsStatic(L, BASE.x, BASE.z, 0.4), false);
});

test('stronghold: removing one kind leaves the walls standing', () => {
  const L = buildLayout(1234);
  removeStaticKind(L, 'gate');
  removeStaticKind(L, 'throne');
  assert.equal(overlapsStatic(L, BASE.x - 5, WALL_Z, 0.4), true, 'wall still blocks');
});
