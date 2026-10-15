import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE } from '../src/config.js';

// Minimal in-memory localStorage so core/storage.js can run under node.
const mem = new Map();
globalThis.window = { localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)) } };
const storage = await import('../src/core/storage.js');

const entry = (score) => ({ name: 'A', score, wave: 1, kills: 0, level: 1, time: 0, seed: 'x' });

test('storage: each mode writes to its own key', () => {
  mem.clear();
  storage.saveScores([entry(100)]);
  storage.saveScores([entry(700)], 'checkpoint');
  assert.equal(mem.get(STORAGE.scores), JSON.stringify([entry(100)]));
  assert.equal(mem.get(STORAGE.scoresCheckpoint), JSON.stringify([entry(700)]));
  assert.notEqual(STORAGE.scores, STORAGE.scoresCheckpoint);
  assert.equal(storage.loadScores()[0].score, 100);
  assert.equal(storage.loadScores('classic')[0].score, 100);
  assert.equal(storage.loadScores('checkpoint')[0].score, 700);
});

test('storage: the classic key keeps its original name', () => {
  assert.equal(STORAGE.scores, 'hollowkeep.highscores.v1');
});

test('storage: an unknown mode falls back to the classic table', () => {
  mem.clear();
  storage.saveScores([entry(42)], 'nonsense');
  assert.equal(storage.loadScores('nonsense')[0].score, 42);
  assert.equal(mem.has(STORAGE.scores), true);
});

test('storage: checkpoints setting defaults to off and round-trips', () => {
  mem.clear();
  assert.equal(storage.loadCheckpoints(), false);
  storage.saveCheckpoints(true);
  assert.equal(storage.loadCheckpoints(), true);
  storage.saveCheckpoints(false);
  assert.equal(storage.loadCheckpoints(), false);
});

test('storage: endless has its own key, separate from both story tables', () => {
  mem.clear();
  storage.saveScores([entry(3000)], 'endless');
  assert.equal(mem.get(STORAGE.scoresEndless), JSON.stringify([entry(3000)]));
  assert.equal(mem.has(STORAGE.scores), false);
  assert.equal(mem.has(STORAGE.scoresCheckpoint), false);
  assert.equal(storage.loadScores('endless')[0].score, 3000);
  assert.equal(storage.loadScores('classic').length, 0);
});

test('storage: mode defaults to story and round-trips, unknown values fall back', () => {
  mem.clear();
  assert.equal(storage.loadMode(), 'story');
  storage.saveMode('endless');
  assert.equal(storage.loadMode(), 'endless');
  mem.set(STORAGE.mode, 'garbage');
  assert.equal(storage.loadMode(), 'story');
});

test('storage: hero defaults to knight and round-trips', () => {
  mem.clear();
  assert.equal(storage.loadCharacter(), 'knight');
  storage.saveCharacter('knight');
  assert.equal(storage.loadCharacter(), 'knight');
});
