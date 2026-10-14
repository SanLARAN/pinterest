import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modeOf, MODE_LABELS, addScore, MAX_SCORES } from '../src/sim/highscores.js';

test('modes: checkpoints setting maps to its own table id', () => {
  assert.equal(modeOf(false), 'classic');
  assert.equal(modeOf(true), 'checkpoint');
  assert.notEqual(modeOf(true), modeOf(false));
});

test('modes: every mode has a label', () => {
  for (const id of [modeOf(false), modeOf(true)]) assert.ok(MODE_LABELS[id], id);
});

test('modes: tables are independent lists, each capped at MAX_SCORES', () => {
  const entry = (score) => ({ name: 'A', score, wave: 1, kills: 0, level: 1, time: 0, seed: 'x' });
  let classic = [];
  let checkpoint = [];
  classic = addScore(classic, entry(500)).list;
  checkpoint = addScore(checkpoint, entry(900)).list;
  assert.equal(classic.length, 1);
  assert.equal(classic[0].score, 500);
  assert.equal(checkpoint[0].score, 900);
  for (let i = 0; i < MAX_SCORES + 3; i++) checkpoint = addScore(checkpoint, entry(i)).list;
  assert.equal(checkpoint.length, MAX_SCORES);
  assert.equal(classic.length, 1, 'filling one table leaves the other alone');
});
