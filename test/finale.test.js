import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dawnProgress, spawnInterval, hpScaleAt, dmgScaleAt, sunBurn, finaleTypeAt, FINALE_SECONDS, ALIVE_CAP } from '../src/sim/finale.js';

test('dawn progresses from 0 to 1 over five minutes and stays clamped', () => {
  assert.equal(FINALE_SECONDS, 300);
  assert.equal(dawnProgress(0), 0);
  assert.equal(dawnProgress(150), 0.5);
  assert.equal(dawnProgress(300), 1);
  assert.equal(dawnProgress(999), 1);
  assert.equal(dawnProgress(-5), 0);
});

test('the night gets harder: spawns speed up and foes grow tougher', () => {
  assert.ok(spawnInterval(1) < spawnInterval(0));
  assert.ok(hpScaleAt(1) > hpScaleAt(0));
  assert.ok(dmgScaleAt(1) > dmgScaleAt(0));
  assert.ok(spawnInterval(0) > 0 && spawnInterval(1) > 0);
});

test('the sun burns nothing in the first half of the night, then more and more', () => {
  assert.equal(sunBurn(0), 0);
  assert.equal(sunBurn(0.5), 0);
  assert.ok(sunBurn(0.75) > 0);
  assert.ok(sunBurn(1) > sunBurn(0.75));
});

test('early night spawns only the weak foes; late night brings archers and ogres', () => {
  const early = new Set();
  const late = new Set();
  for (let i = 0; i < 200; i++) {
    const r = i / 200;
    early.add(finaleTypeAt(0, r));
    late.add(finaleTypeAt(1, r));
  }
  assert.ok(!early.has('brute') && !early.has('archer'));
  assert.ok(late.has('brute') && late.has('archer'));
  assert.ok(ALIVE_CAP > 0);
});
