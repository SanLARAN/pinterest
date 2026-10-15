import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waveSpec, WaveDirector } from '../src/sim/waves.js';

test('endless: story waves keep the 90-spawn cap', () => {
  assert.equal(waveSpec(30).total, 90);
  assert.equal(waveSpec(60).total, 90);
});

test('endless: the spawn total keeps growing past the story cap', () => {
  const totals = [30, 60, 120, 400].map((n) => waveSpec(n, true).total);
  assert.ok(totals[0] > 90 && totals[1] > totals[0] && totals[2] > totals[1] && totals[3] > totals[2], totals.join(','));
});

test('endless: foe health and damage keep rising every wave', () => {
  let prev = waveSpec(1, true);
  for (let n = 2; n <= 200; n++) {
    const cur = waveSpec(n, true);
    assert.ok(cur.hpScale > prev.hpScale, `hp at ${n}`);
    assert.ok(cur.dmgScale > prev.dmgScale, `dmg at ${n}`);
    prev = cur;
  }
});

test('endless: boss every fifth wave, forever', () => {
  for (const n of [5, 10, 25, 50, 105]) {
    const spec = waveSpec(n, true);
    assert.equal(spec.isBoss, true);
    assert.ok(spec.bossId, `boss id at ${n}`);
  }
  assert.equal(waveSpec(7, true).isBoss, false);
});

test('endless: pace and alive cap stay bounded for performance', () => {
  const spec = waveSpec(500, true);
  assert.ok(spec.interval >= 0.32);
  assert.ok(spec.maxAlive <= 40);
});

test('director: endless flag is passed to each wave spec', () => {
  const env = { onChapter() {}, spawn() {}, alive: () => 0, onCleared() {} };
  const rng = { weighted: () => 'slime', next: () => 0.5 };
  const story = new WaveDirector(rng, false);
  const endless = new WaveDirector(rng, true);
  for (let i = 0; i < 40; i++) {
    story.nextWave(env);
    endless.nextWave(env);
  }
  assert.equal(story.spec.total, 90);
  assert.ok(endless.spec.total > 90);
});
