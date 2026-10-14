import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dangerLevel } from '../src/sim/danger.js';

test('danger: calm at and above 35% health', () => {
  assert.equal(dangerLevel(100, 100), 0);
  assert.equal(dangerLevel(35, 100), 0);
});

test('danger: rises to full at 15% health and stays there', () => {
  assert.equal(dangerLevel(15, 100), 1);
  assert.equal(dangerLevel(1, 100), 1);
  assert.equal(dangerLevel(0, 100), 1);
});

test('danger: ramps smoothly in between', () => {
  const mid = dangerLevel(25, 100);
  assert.ok(mid > 0.45 && mid < 0.55, `halfway at 25%, got ${mid}`);
  assert.ok(dangerLevel(30, 100) < dangerLevel(20, 100));
});

test('danger: bad max health is treated as calm', () => {
  assert.equal(dangerLevel(5, 0), 0);
});
