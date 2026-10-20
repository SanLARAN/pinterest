// The menu's record: a real file, two players taking turns so the loop has no seam, and a volume of
// its own. The browser blocks playback until a gesture — the player must stay armed and pick it up on
// the next tap instead of going quiet for the rest of the session.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MenuMusic } from '../src/audio/music.js';

class FakeAudio {
  constructor(src) {
    this.src = src;
    this.volume = 0;
    this.currentTime = 0;
    this.duration = 30;
    this.paused = true;
    this.plays = 0;
    this.listeners = {};
    this.fail = false;
    FakeAudio.said = false;
  }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
  play() {
    if (this.fail) return Promise.reject(new Error('blocked by the autoplay policy'));
    this.paused = false;
    this.plays++;
    return Promise.resolve();
  }
  pause() { this.paused = true; }
  emit(t) { for (const f of this.listeners[t] || []) f(); }
}

const build = (overrides = {}) => {
  const made = [];
  const el = { now: 0 };
  const m = new MenuMusic({
    src: 'audio/knock-at-the-door.mp3',
    makeAudio: (src) => { const a = new FakeAudio(src); made.push(a); return a; },
    readVolume: () => 0.5,
    autoTick: false,
    clock: () => el.now,
    ...overrides,
  });
  return { m, made, el };
};
const settle = async () => { for (let i = 0; i < 4; i++) await Promise.resolve(); };

test('the record starts on the first tap, fades in, and plays at the music setting', async () => {
  const { m, made, el } = build();
  assert.equal(m.start(), true);
  await settle();
  assert.equal(made.length, 2, 'two players: one plays, one waits for the seam');
  assert.equal(made[0].plays, 1);
  assert.equal(m.active, 0);
  m.update(el.now);
  assert.equal(made[0].volume, 0, 'silent at the first frame');
  el.now += 2600;
  m.update(el.now);
  assert.equal(made[0].volume, 0.5, 'at full music level after the fade');
  assert.equal(m.playing, true);
});

test('the loop hands over to the second player before the end, without a gap', async () => {
  const { m, made, el } = build();
  m.start();
  await settle();
  el.now += 2600;
  m.update(el.now);
  const first = made[0], second = made[1];
  first.currentTime = first.duration - 3.0; // inside the crossfade window
  el.now += 100;
  m.update(el.now);
  assert.equal(second.plays, 1, 'the next pass is already playing');
  assert.ok(m.cross, 'the hand-over is in progress');
  el.now += 1700;
  m.update(el.now);
  assert.ok(second.volume > 0 && first.volume > 0, 'both are audible in the middle');
  el.now += 1800;
  m.update(el.now);
  assert.equal(m.active, 1, 'the second player is now the record');
  assert.equal(first.paused, true);
  assert.equal(second.volume, 0.5);
  assert.equal(m.cross, null);
});

test('a blocked play stays armed and resumes on the next gesture', async () => {
  const made = [];
  const blocked = new MenuMusic({
    src: 'audio/knock-at-the-door.mp3',
    makeAudio: (src) => { const a = new FakeAudio(src); a.fail = true; made.push(a); return a; },
    readVolume: () => 0.5,
    autoTick: false,
    clock: () => 0,
  });
  blocked.start();
  await settle();
  assert.equal(blocked.blocked, true, 'the browser said no');
  assert.equal(blocked.active, -1, 'nothing pretends to play');
  assert.equal(blocked.wanted, true, 'but the menu still wants its music');
  made[0].fail = false;
  blocked.retry();
  await settle();
  assert.equal(made[0].plays, 1);
  assert.equal(blocked.playing, true);
});

test('leaving the menu fades the record out and parks both players', async () => {
  const { m, made, el } = build();
  m.start();
  await settle();
  el.now += 2600;
  m.update(el.now);
  m.stop();
  el.now += 800;
  m.update(el.now);
  assert.ok(made[0].volume > 0 && made[0].volume < 0.5, 'it is on its way out');
  el.now += 1000;
  m.update(el.now);
  assert.equal(m.active, -1);
  assert.equal(made.every((a) => a.paused), true);
  assert.equal(m.playing, false);
  // and the menu can have it back
  m.start();
  await settle();
  assert.equal(m.playing, true);
});

test('the end of a pass with no hand-over (a throttled tab) starts the same player again', async () => {
  const { m, made, el } = build();
  m.start();
  await settle();
  el.now += 2600;
  m.update(el.now);
  made[0].currentTime = 0; // as if the tab had been frozen through the whole crossfade
  made[0].emit('ended');
  await settle();
  assert.equal(made[0].plays, 2);
  assert.equal(m.active, 0);
});
