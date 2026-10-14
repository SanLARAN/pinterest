import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Psi, PSI } from '../src/sim/psi.js';

test('psi: casting spends energy and starts a cooldown', () => {
  const p = new Psi();
  assert.equal(p.canCast('skill1'), true);
  assert.equal(p.cast('skill1'), true);
  assert.equal(p.energy, PSI.start - PSI.skills.skill1.cost);
  assert.equal(p.canCast('skill1'), false, 'still on cooldown');
  p.update(PSI.skills.skill1.cooldown + 0.01);
  p.energy = PSI.max; // isolate the cooldown from energy
  assert.equal(p.canCast('skill1'), true, 'ready after cooldown');
});

test('psi: insufficient energy blocks casting', () => {
  const p = new Psi();
  p.energy = PSI.skills.skill3.cost - 1;
  assert.equal(p.cast('skill3'), false);
  assert.equal(p.energy, PSI.skills.skill3.cost - 1, 'no energy spent on a failed cast');
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
