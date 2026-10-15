import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addScore, MAX_SCORES } from '../src/sim/highscores.js';
import { runSetup, tableOf, TABLE_LABELS, MODES, CHARACTERS } from '../src/sim/modes.js';

test('tables: story keeps two tables, endless has its own', () => {
  assert.equal(tableOf('story', false), 'classic');
  assert.equal(tableOf('story', true), 'checkpoint');
  assert.equal(tableOf('endless', false), 'endless');
  assert.equal(tableOf('endless', true), 'endless', 'endless ignores the checkpoint flag');
  assert.equal(new Set([tableOf('story', false), tableOf('story', true), tableOf('endless', false)]).size, 3);
});

test('tables: every table has a label', () => {
  for (const id of ['classic', 'checkpoint', 'endless']) assert.ok(TABLE_LABELS[id], id);
});

test('tables: entries are independent lists, each capped at MAX_SCORES', () => {
  const entry = (score) => ({ name: 'A', score, wave: 1, kills: 0, level: 1, time: 0, seed: 'x' });
  let endless = [];
  let story = [];
  endless = addScore(endless, entry(500)).list;
  story = addScore(story, entry(900)).list;
  assert.equal(endless.length, 1);
  assert.equal(endless[0].score, 500);
  assert.equal(story[0].score, 900);
  for (let i = 0; i < MAX_SCORES + 3; i++) endless = addScore(endless, entry(i)).list;
  assert.equal(endless.length, MAX_SCORES);
  assert.equal(story.length, 1, 'filling one table leaves the other alone');
});

test('runSetup: endless is one life with no checkpoints', () => {
  const s = runSetup('endless', true);
  assert.equal(s.mode, 'endless');
  assert.equal(s.checkpoints, false);
  assert.equal(s.table, 'endless');
});

test('runSetup: story follows the checkpoint setting', () => {
  assert.deepEqual(runSetup('story', false), { mode: 'story', checkpoints: false, table: 'classic' });
  assert.deepEqual(runSetup('story', true), { mode: 'story', checkpoints: true, table: 'checkpoint' });
});

test('runSetup: an unknown mode falls back to story', () => {
  assert.equal(runSetup('nonsense', false).mode, 'story');
});

test('modes and heroes: the picker has story and endless, and at least one hero', () => {
  assert.deepEqual(Object.keys(MODES).sort(), ['endless', 'story']);
  assert.ok(CHARACTERS.length >= 1);
  assert.equal(CHARACTERS[0].id, 'knight');
});
