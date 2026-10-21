// 2.1u: the shift's highlight reel — the director that keeps the seconds around a stupid moment, the
// running order the reel plays, and the way the results screen offers it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Highlights, HL, HL_WEIGHT, reelPlan, reelDuration, reelFileName, frameAt } from '../src/game/highlights.js';
import { Reel, captionFor } from '../src/ui/reel.js';
import { t, setLang } from '../src/core/i18n.js';

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

// a run of `seconds` at `fps`, feeding the director a numbered frame each time
function play(hl, from, to, fps = 10) {
  const dt = 1 / fps;
  const frames = [];
  for (let t = from; t <= to + 1e-9; t += dt) {
    hl.update(+t.toFixed(4), (tt) => { const f = { n: frames.length, t: tt }; frames.push(f); return f; });
  }
  return frames;
}

test('a quiet night makes no reel: nothing is kept without a moment', () => {
  const hl = new Highlights({ fps: 10 });
  play(hl, 0, 20);
  hl.stop();
  assert.equal(hl.count, 0);
  assert.deepEqual(hl.list(), []);
  assert.equal(hl.duration(), 0);
});

test('a moment keeps its run-up and its aftermath, at the director\'s own frame rate', () => {
  const hl = new Highlights({ fps: 10, pre: 3, post: 2 });
  play(hl, 0, 9);
  hl.note('death', { cause: 'watcher' });
  play(hl, 9.1, 16);
  hl.stop();
  assert.equal(hl.count, 1);
  const c = hl.list()[0];
  assert.equal(c.kind, 'death');
  assert.equal(c.meta.cause, 'watcher');
  assert.ok(c.start <= 6.05 && c.start >= 5.9, `the run-up starts about 3 s early (${c.start})`);
  assert.ok(c.end >= 10.8 && c.end <= 11.2, `the tail ends about 2 s late (${c.end})`);
  assert.ok(c.frames.length >= 45, `about 5 s of frames at 10 fps (${c.frames.length})`);
  // the frames are in time order and inside the window
  for (let i = 1; i < c.frames.length; i++) assert.ok(c.frames[i].t > c.frames[i - 1].t);
  assert.ok(c.frames.every((f) => f.t >= c.start - 1e-6 && f.t <= c.end + 1e-6));
  assert.ok(c.frames.some((f) => f.t < 9), 'and the reel shows how it happened, not only that it did');
});

test('the same moment does not open twice; a different one right after joins the same shot', () => {
  const hl = new Highlights({ fps: 10, pre: 2, post: 2, dedupe: 1.8 });
  play(hl, 0, 5);
  hl.note('grab');
  play(hl, 5.1, 5.6);
  hl.note('grab'); // still the same hand
  play(hl, 5.7, 6.4);
  hl.note('death', { cause: 'angler' }); // the hand closes for good
  play(hl, 6.5, 12);
  hl.stop();
  assert.equal(hl.count, 1, 'one continuous shot, not the same second twice');
  const c = hl.list()[0];
  assert.equal(c.kind, 'death', 'the shot is named after the thing that matters most');
  assert.deepEqual(c.kinds.sort(), ['death', 'grab']);
  assert.ok(c.end > 8, 'and it runs to the end of the death');
});

test('a moment with almost no footage is dropped, not shown as a blink', () => {
  const hl = new Highlights({ fps: 10, pre: 2, post: 2, minFrames: 5 });
  hl.update(0, () => ({ frame: 0 }));
  hl.note('chain');
  hl.update(0.1, (t) => ({ t })); // two frames only: not a clip
  hl.update(5, null);
  hl.stop();
  assert.equal(hl.count, 0);
});

test('the reel keeps its six best moments and drops the least interesting', () => {
  const hl = new Highlights({ fps: 8, pre: 1, post: 1, max: 6, dedupe: 0.2 });
  let t = 0;
  const step = (seconds, withFrames = true) => {
    for (let i = 0; i < Math.round(seconds * 8); i++) {
      t += 1 / 8;
      hl.update(+t.toFixed(4), withFrames ? (tt) => ({ t: tt }) : null);
    }
  };
  // five quick, unremarkable chain rings
  for (let i = 0; i < 5; i++) { hl.note('chain'); step(3); }
  // then the big ones
  hl.note('seize'); step(3);
  hl.note('death', { cause: 'watcher' }); step(3);
  hl.note('escape'); step(3);
  hl.stop();
  assert.equal(hl.count, 6);
  const kinds = hl.list().map((c) => c.kind);
  assert.ok(kinds.includes('escape') && kinds.includes('death') && kinds.includes('seize'));
  assert.ok(kinds.filter((k) => k === 'chain').length <= 3, 'the filler went first');
  assert.ok(hl.list().every((c) => HL_WEIGHT[c.kind] >= HL_WEIGHT.chain));
});

test('the reel is told in order, whatever order the moments closed in', () => {
  const hl = new Highlights({ fps: 8, pre: 0.5, post: 0.5, dedupe: 0.1 });
  let t = 0;
  const step = (seconds, frames = true) => {
    for (let i = 0; i < Math.round(seconds * 8); i++) { t += 1 / 8; hl.update(+t.toFixed(4), frames ? (tt) => ({ t: tt }) : null); }
  };
  hl.note('scream'); step(2);
  hl.note('chain'); step(2);
  hl.note('genStart'); step(2);
  hl.stop();
  const starts = hl.list().map((c) => c.start);
  assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
});

test('the frame under the playhead is the last one at or before it', () => {
  const frames = [{ t: 1 }, { t: 2 }, { t: 3.5 }, { t: 9 }];
  assert.equal(frameAt(frames, 0), frames[0]);
  assert.equal(frameAt(frames, 1), frames[0]);
  assert.equal(frameAt(frames, 2.0001), frames[1]);
  assert.equal(frameAt(frames, 7), frames[2]);
  assert.equal(frameAt(frames, 100), frames[3]);
  assert.equal(frameAt([], 5), null);
  assert.equal(frameAt(null, 5), null);
});

test('the running order, its length and the file name are arithmetic, not DOM', () => {
  const clips = [
    { kind: 'chain', start: 10, end: 14, frames: [] },
    { kind: 'death', start: 40, end: 45.5, frames: [] },
  ];
  const plan = reelPlan(clips, { lead: 0.5, tail: 0.5 });
  assert.equal(plan.length, 2);
  assert.deepEqual(plan.map((c) => c.index), [0, 1]);
  assert.equal(plan[0].duration, 5);
  assert.equal(plan[1].duration, 6.5);
  assert.equal(reelDuration(plan), 11.5);
  assert.equal(reelFileName(new Date(2026, 9, 22)), 'hush-highlights-2026-10-22.webm');
  assert.equal(reelFileName(new Date(2026, 0, 3), 'png'), 'hush-highlights-2026-01-03.png');
});

test('every kind of moment has a caption in both languages, and a death names its killer', () => {
  const oldDoc = globalThis.document;
  globalThis.document = { documentElement: {} };
  try {
    for (const kind of Object.keys(HL_WEIGHT)) {
      for (const lang of ['ru', 'en']) {
        setLang(lang);
        const text = captionFor({ kind, meta: { cause: 'watcher' } });
        assert.ok(text && text.length > 2, `${kind} in ${lang}`);
        assert.ok(!text.includes('{'), `${kind} in ${lang} leaves no placeholder`);
      }
    }
    setLang('ru');
    assert.match(captionFor({ kind: 'death', meta: { cause: 'angler' } }), /Удильщик/);
    assert.match(captionFor({ kind: 'death', meta: { cause: 'scream' } }), /КРИК|УБИТ/);
    setLang('en');
    assert.match(captionFor({ kind: 'death', meta: { cause: 'watcher' } }), /WATCHER/i);
    assert.match(captionFor({ kind: 'grab' }), /ANGLER/i);
  } finally {
    setLang('ru');
    globalThis.document = oldDoc;
  }
});

test('the game says what is worth keeping: death, grip, grab, a friend down, a chain, a scream, engines', () => {
  const game = src('src/game/game.js');
  for (const call of ["hlNote('death'", "hlNote('seize')", "hlNote('scream')", "hlNote('down')", "hlNote('revive')", "hlNote('genBroken')", "hlNote('genStart')"]) {
    assert.ok(game.includes(call), call);
  }
  assert.match(src('src/game/expedition.js'), /g\.hlNote\?\.\('chain'\)/);
  assert.match(src('src/game/angler.js'), /g\.hlNote\?\.\('grab'\)/);
});

test('the loop feeds the director, the end closes it, and the results screen offers the reel', () => {
  const main = src('src/main.js');
  assert.match(main, /new Highlights\(\)/);
  assert.match(main, /highlights\.reset\(\)/);
  assert.match(main, /highlights\.update\(game\.time, highlightFrame\)/);
  assert.match(main, /const hlEnd = res\.escaped \? \(res\.won \? 'escape' : 'left'\) : \(res\.won \? 'win' : 'death'\)/);
  assert.match(main, /highlights\.stop\(\)/);
  assert.match(main, /reel\.open\(highlights\.list\(\)\)/);
  const html = src('index.html');
  assert.match(html, /id="btnReel"/);
  assert.match(html, /id="reelPanel"/);
  assert.match(html, /id="reelCanvas"/);
  assert.match(html, /id="btnReelSave"/);
  const i18n = src('src/core/i18n.js');
  for (const key of ['hlOpen', 'hlTitle', 'hlEmpty', 'hlSave', 'hlPlay', 'hlNoRec', 'hlHint']) {
    assert.equal(i18n.split(`${key}:`).length - 1, 2, `${key} in both languages`);
  }
});

// ---------- playback clock (the reel without a browser) ----------
function withDom(fn) {
  const prev = { document: globalThis.document, window: globalThis.window, raf: globalThis.requestAnimationFrame, caf: globalThis.cancelAnimationFrame, perf: globalThis.performance };
  const el = () => ({
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, addEventListener() {}, removeEventListener() {},
    style: {}, children: [], appendChild(c) { this.children.push(c); }, innerHTML: '', textContent: '',
    dataset: {}, hidden: false, disabled: false, getContext: () => null, remove() {}, focus() {},
  });
  globalThis.document = { getElementById: () => el(), createElement: () => el(), body: el(), documentElement: {} };
  globalThis.window = { addEventListener() {} };
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  globalThis.performance = { now: () => 0 };
  try { return fn(); } finally {
    globalThis.document = prev.document; globalThis.window = prev.window;
    globalThis.requestAnimationFrame = prev.raf; globalThis.cancelAnimationFrame = prev.caf;
    globalThis.performance = prev.perf;
  }
}

test('the reel plays clip after clip and stops on the last frame', () => {
  withDom(() => {
    const r = new Reel();
    const clips = [
      { kind: 'chain', start: 10, end: 12.5, weight: 5, frames: [] },
      { kind: 'death', start: 30, end: 33, weight: 10, frames: [], meta: { cause: 'watcher' } },
    ];
    r.open(clips);
    assert.equal(r.isOpen, true);
    assert.equal(r.plan.length, 2);
    assert.equal(r.playing, true);
    assert.equal(r.i, 0);
    r.frame(0.2);
    assert.ok(r.localT > 0.19);
    r.frame(r.plan[0].duration); // over the first clip's edge
    assert.equal(r.i, 1, 'it moved on by itself');
    assert.equal(r.playing, true);
    r.frame(r.plan[1].duration + 1);
    assert.equal(r.playing, false, 'and stops at the end rather than looping');
    r.seekClip(0);
    assert.equal(r.i, 0);
    assert.equal(r.localT, 0);
    r.seekClip(-1);
    assert.equal(r.i, 1, 'the arrows wrap');
    r.close();
    assert.equal(r.isOpen, false);
  });
});

test('an empty reel says so instead of playing nothing', () => {
  withDom(() => {
    const r = new Reel();
    r.open([]);
    assert.equal(r.plan.length, 0);
    r.frame(1);
    assert.equal(r.playing, false);
    r.close();
  });
});
