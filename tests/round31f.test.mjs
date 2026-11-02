// 3.1f: the camera in the .exe. Electron sends pointer lock through the same permission handler as the
// microphone, and the shell's list only had sound in it — so every click on «кликни, чтобы управлять взглядом» was
// refused, and since 3.0v a refused lock on a top-level page no longer falls back to dragging. The shell now allows
// 'pointerLock' (and 'fullscreen'); and the game falls back to drag-to-look under a desktop shell that still
// refuses (an install from before 3.1f, until its new shell arrives).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { allowsPermission } = require('../electron/serve.cjs');

test('the shell lets the game have the mouse — and still nothing else beyond sound', () => {
  assert.equal(allowsPermission('pointerLock'), true);
  assert.equal(allowsPermission('fullscreen'), true);
  assert.equal(allowsPermission('media'), true);
  for (const p of ['geolocation', 'notifications', 'clipboard-read', 'midi', 'openExternal', 'display-capture']) assert.equal(allowsPermission(p), false, p);
});

function browser() {
  const on = {};
  const add = (target) => (type, fn) => { (on[target + ':' + type] ||= []).push(fn); };
  const doc = { documentElement: {}, addEventListener: add('doc'), pointerLockElement: null, exitPointerLock() {}, body: { classList: { toggle() {} } } };
  globalThis.window = { addEventListener: add('win') };
  window.self = window; window.top = window; // a page of its own, not a frame
  globalThis.document = doc;
  globalThis.location = { search: '' };
  const canvas = { addEventListener: add('canvas'), requestPointerLock: () => Promise.reject(Object.assign(new Error('refused'), { name: 'NotAllowedError' })) };
  const fire = (key) => { for (const fn of on[key] || []) fn({ button: 0, clientX: 0, clientY: 0, movementX: 0, movementY: 0, preventDefault() {} }); };
  return { canvas, fire };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

test('an old desktop shell that refuses the lock: (3.1i) no drag-to-look, the hint says to restart onto the new shell', async () => {
  const b = browser();
  globalThis.hushDesktop = { desktop: true };
  try {
    const { Input } = await import('../src/input/input.js?desk');
    const input = new Input(b.canvas);
    input.gameActive = true;
    for (let i = 0; i < 4; i++) { b.fire('canvas:mousedown'); await tick(); }
    assert.equal(input.lockFailed, false, 'the 3.1f drag fallback was removed at the player\'s request');
    assert.equal(input.lockHint(), 'lockRestart');
  } finally { delete globalThis.hushDesktop; }
});

test('in a plain browser tab a refusal still never turns the mouse into dragging (3.0v)', async () => {
  const b = browser();
  const { Input } = await import('../src/input/input.js?web');
  const input = new Input(b.canvas);
  input.gameActive = true;
  for (let i = 0; i < 4; i++) { b.fire('canvas:mousedown'); await tick(); }
  assert.equal(input.lockFailed, false);
});
