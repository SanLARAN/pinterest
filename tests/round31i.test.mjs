// 3.1i: «убери бесячую фичу с "зажми ЛКМ и тяни"». Since 3.0v a page of its own never fell back to dragging, but a
// frame did after two refusals, and since 3.1f so did the .exe — and two refusals are easy to collect without
// anything being wrong (Esc, the second after leaving the lock). Now nowhere: every click asks for the lock again,
// and where it keeps being refused the hint says why instead of switching the mouse to dragging.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

function browser({ framed = false } = {}) {
  const on = {};
  const add = (target) => (type, fn) => { (on[target + ':' + type] ||= []).push(fn); };
  const doc = { documentElement: {}, addEventListener: add('doc'), pointerLockElement: null, exitPointerLock() {}, body: { classList: { toggle() {} } } };
  globalThis.window = { addEventListener: add('win') };
  window.self = window; window.top = framed ? {} : window;
  globalThis.document = doc;
  globalThis.location = { search: '' };
  const canvas = {
    refuse: true,
    addEventListener: add('canvas'),
    requestPointerLock() {
      if (this.refuse) return Promise.reject(Object.assign(new Error('refused'), { name: 'NotAllowedError' }));
      doc.pointerLockElement = canvas;
      for (const fn of on['doc:pointerlockchange'] || []) fn();
      return Promise.resolve();
    },
  };
  const fire = (key) => { for (const fn of on[key] || []) fn({ button: 0, clientX: 0, clientY: 0, movementX: 0, movementY: 0, preventDefault() {} }); };
  return { canvas, fire };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

async function clicks(b, input, n) { for (let i = 0; i < n; i++) { b.fire('canvas:mousedown'); await tick(); } }

test('the .exe never drags: refused clicks keep asking, and the hint says to restart onto the new shell', async () => {
  const b = browser();
  globalThis.hushDesktop = { desktop: true };
  try {
    const { Input, LOCK_STUCK } = await import('../src/input/input.js?desk31i');
    const input = new Input(b.canvas);
    input.gameActive = true;
    await clicks(b, input, LOCK_STUCK - 1);
    assert.equal(input.lockFailed, false);
    assert.equal(input.lockHint(), '', 'a couple of refusals are ordinary: the hint still just says «click»');
    await clicks(b, input, 6);
    assert.equal(input.lockFailed, false, 'no drag-to-look, however many');
    assert.equal(input.lockHint(), 'lockRestart');
    b.canvas.refuse = false;
    await clicks(b, input, 1);
    assert.equal(input.locked, true, 'the next click that is allowed gets the ordinary mouse look');
    assert.equal(input.lockHint(), '', 'and the hint is back to normal');
  } finally { delete globalThis.hushDesktop; }
});

test('a frame never drags either: it tells you to open the game in its own tab', async () => {
  const b = browser({ framed: true });
  const { Input } = await import('../src/input/input.js?frame31i');
  const input = new Input(b.canvas);
  input.gameActive = true;
  await clicks(b, input, 8);
  assert.equal(input.lockFailed, false);
  assert.equal(input.lockHint(), 'lockOwnTab');
});

test('a page of its own keeps saying «click» (the refusals there are the ordinary kind)', async () => {
  const b = browser();
  const { Input } = await import('../src/input/input.js?web31i');
  const input = new Input(b.canvas);
  input.gameActive = true;
  await clicks(b, input, 8);
  assert.equal(input.lockFailed, false);
  assert.equal(input.lockHint(), '');
});

test('only a browser without the pointer-lock API drags; the hint is wired and in both languages', async () => {
  const b = browser();
  delete b.canvas.requestPointerLock;
  const { Input } = await import('../src/input/input.js?noapi31i');
  const input = new Input(b.canvas);
  input.gameActive = true;
  await clicks(b, input, 1);
  assert.equal(input.lockFailed, true, 'no API, no other way to look around');
  const main = src('src/main.js');
  assert.match(main, /lockMsg = t\(input\.lockHint\(\) \|\| 'clickToLook'\)/);
  assert.match(main, /input\.lockFailed \? t\('dragToLook'\) : t\(input\.lockHint\(\) \|\| 'clickToLook'\)/);
  assert.match(src('src/input/input.js'), /_lockRefused\(\) \{\n {4}this\.lockFails\+\+;\n {2}\}/, 'a refusal only counts: it never flips the mouse to dragging');
  globalThis.document ||= { documentElement: {} };
  const { t, setLang } = await import('../src/core/i18n.js');
  for (const lang of ['ru', 'en']) { setLang(lang); for (const k of ['lockRestart', 'lockOwnTab']) assert.notEqual(t(k), k, `${lang}.${k}`); }
  setLang('ru');
});
