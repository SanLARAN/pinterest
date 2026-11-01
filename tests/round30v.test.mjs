// 3.0v: «рывками и с зажатой ЛКМ». The author reported the camera and the walk going in jerks, «as if only in the
// light», and the camera sometimes wanting the left button held. The game's own frame did not get heavier
// (measured: ~0.1 ms a frame in game.update before and after 3.0s/3.0t, forest and bog, night and morning); what
// was wrong was around it:
//  - two refused pointer-lock requests turned the mouse into drag-to-look for the rest of the session — and the
//    browser refuses for ordinary reasons (Esc closing the backpack is never a gesture; the second after leaving
//    the lock; a request after a film with no click behind it);
//  - the lock asked for raw, unaccelerated movement, which on Windows Chrome arrives in uneven bursts;
//  - the automatic resolution stepped down on one slow second and back up five seconds later, a resize each time.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p) => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');

// a browser just big enough for Input: listeners recorded, pointer lock under the test's control
function browser({ framed = false, search = '' } = {}) {
  const on = {};
  const add = (target) => (type, fn) => { (on[target + ':' + type] ||= []).push(fn); };
  const doc = { addEventListener: add('doc'), pointerLockElement: null, exitPointerLock() { doc.pointerLockElement = null; }, body: { classList: { toggle() {} } } };
  const win = { addEventListener: add('win') };
  win.self = win;
  win.top = framed ? {} : win;
  globalThis.window = win;
  globalThis.document = doc;
  globalThis.location = { search };
  const canvas = {
    addEventListener: add('canvas'),
    requests: [],
    refuse: true,
    requestPointerLock(opts) {
      canvas.requests.push(opts || null);
      if (canvas.refuse) return Promise.reject(Object.assign(new Error('refused'), { name: 'NotAllowedError' }));
      doc.pointerLockElement = canvas;
      for (const fn of on['doc:pointerlockchange'] || []) fn();
      return Promise.resolve();
    },
  };
  const fire = (key, e = {}) => { for (const fn of on[key] || []) fn({ button: 0, clientX: 0, clientY: 0, movementX: 0, movementY: 0, preventDefault() {}, ...e }); };
  return { canvas, fire, doc };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

test('refused locks never turn the mouse into drag-to-look on a page of its own — the next click just asks again', async () => {
  const b = browser();
  const { Input } = await import('../src/input/input.js');
  const input = new Input(b.canvas);
  input.gameActive = true;
  for (let i = 0; i < 5; i++) { b.fire('canvas:mousedown'); await tick(); } // Esc-closed backpacks, cooldowns, film starts…
  assert.equal(input.lockFailed, false, 'still asking for the lock, not dragging');
  assert.equal(b.canvas.requests.length, 5, 'every click asks again');
  b.canvas.refuse = false;
  b.fire('canvas:mousedown');
  await tick();
  assert.equal(input.locked, true, 'and the sixth click gets it: the ordinary mouse look');
});

test('only a page inside someone else\'s frame, refused twice, falls back to dragging', async () => {
  const b = browser({ framed: true });
  const { Input } = await import('../src/input/input.js?framed');
  const input = new Input(b.canvas);
  input.gameActive = true;
  b.fire('canvas:mousedown'); await tick();
  assert.equal(input.lockFailed, false);
  b.fire('canvas:mousedown'); await tick();
  assert.equal(input.lockFailed, true);
});

test('raw, unaccelerated mouse movement is opt-in (?rawmouse)', async () => {
  const plain = browser();
  const { Input } = await import('../src/input/input.js?plain');
  const a = new Input(plain.canvas);
  a.gameActive = true;
  plain.fire('canvas:mousedown'); await tick();
  assert.equal(plain.canvas.requests[0], null, 'a plain request by default');
  const raw = browser({ search: '?rawmouse' });
  const { Input: Input2 } = await import('../src/input/input.js?raw');
  const c = new Input2(raw.canvas);
  c.gameActive = true;
  raw.fire('canvas:mousedown'); await tick();
  assert.deepEqual(raw.canvas.requests[0], { unadjustedMovement: true });
});

test('the garage film takes the mouse on the click that started it, and the automatic resolution stops seesawing', () => {
  const main = src('main.js');
  const film = main.slice(main.indexOf('function playGarageFilm(done) {'), main.indexOf('function ensureSoloFig()'));
  assert.ok(film.indexOf('input.requestLock(true)') > -1 && film.indexOf('input.requestLock(true)') < film.indexOf('garage.open('), 'before the film, while the click still counts');
  const perf = main.slice(main.indexOf('function perfTick(dt) {'), main.indexOf('function measureFPS('));
  assert.match(perf, /if \(slow && \(perf\.slow >= 2 \|\| awful\)/, 'two slow seconds (or one awful one) before stepping down');
  assert.match(perf, /perf\.ceilT = 60;/, 'and a step down holds for a minute');
  assert.match(perf, /perf\.cool = 8;/, 'stepping back up waits longer');
  assert.doesNotMatch(src('input/input.js'), /if \(this\.lockFails >= 2\) this\.lockFailed = true;/, 'the old two-strikes rule is gone');
});
