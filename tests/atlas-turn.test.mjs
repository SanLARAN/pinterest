// The atlas is a book you can turn; a page that fails to lay itself down (the syringe's 3D plate did
// exactly that) must not leave the book stuck mid-turn. These keep `busy` honest — the flag every click
// goes through — and check the late-landing watchdog that catches a turn whose timer never fired.
import test from 'node:test';
import assert from 'node:assert/strict';

const el = (extra = {}) => ({ innerHTML: '', className: '', textContent: '', style: {}, ...extra });
const nodes = {};
const mk = (id, v) => (nodes[id] = v);
mk('atlasLeaf', el({ querySelector: (sel) => (sel === '.leaf-front' ? nodes.__front : nodes.__back) }));
mk('atlasRight', el({ querySelector: () => null }));
mk('atlasLeft', el());
mk('atlasPlate', el({ classList: { toggle() {}, add() {}, remove() {} } }));
mk('atlasCap', el());
mk('atlasPnoL', el());
mk('atlasPnoR', el());
mk('atlasTabs', el());
mk('atlasStamp', el({ classList: { toggle() {} } }));
mk('atlasHint', el({ classList: { toggle() {} } }));
mk('atlasClose', el({ setAttribute() {} }));
mk('__front', el({ querySelector: () => null }));
mk('__back', el({ querySelector: () => null }));
globalThis.document = { getElementById: (id) => nodes[id] || null, body: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } } };
globalThis.matchMedia = () => ({ matches: false });
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '0' });

const { Atlas } = await import('../src/ui/atlas.js');

function fakeAtlas() {
  const a = Object.create(Atlas.prototype);
  a.shown = true;
  a.busy = 0;
  a.turnAt = 0;
  a.i = 0;
  a.timers = [];
  a.pages = [{ id: 'contents' }, { id: 'syringe' }, { id: 'flashlight' }];
  a.el = { classList: { contains: () => true, remove() {}, add() {}, toggle() {} }, style: {}, setAttribute() {}, querySelector: () => ({ getPropertyValue: () => '0' }) };
  a.spec = { show() {}, hide() {}, frame() {}, resize() {}, ping() {}, snapshot: () => '', react() {} };
  a._T = () => ({ ui: { page: 'p.' } });
  a._cap = () => ({ cls: '', html: '' });
  a._leftFace = () => '<div></div>';
  a._renderRight = () => {};
  a._renderTabs = () => {};
  a._later = (fn) => fn(); // the page lands at once, as it does after the 640 ms turn
  a._stopSounds = () => {};
  return a;
}

test('a page whose plate throws still lands: the book is never left mid-turn', () => {
  const a = fakeAtlas();
  a._renderLeft = () => {
    throw new Error('the plate would not build');
  };
  a.go(1);
  assert.equal(a.i, 1, 'the turn happened');
  assert.equal(a.busy, 0, 'and the book is free to answer the next click');
  assert.equal(nodes.atlasLeaf.className, 'leaf', 'the leaf is back on the page, not mid-swing');
});

test('a turn whose timer never fired is landed on the next frame (a sleeping tab, a thrown frame)', () => {
  const a = fakeAtlas();
  let rendered = 0;
  a._renderAll = () => rendered++;
  a.busy = 1;
  a.turnAt = performance.now() - 5000; // the timer was lost
  a.frame(1 / 60);
  assert.equal(a.busy, 0, 'the watchdog un-sticks it');
  assert.equal(rendered, 1, 'and the page is drawn again');
  assert.equal(nodes.atlasLeaf.className, 'leaf');
});

test('closing mid-turn lands the page too', () => {
  const a = fakeAtlas();
  let rendered = 0;
  a._renderAll = () => rendered++;
  a.busy = 1;
  a._stopSounds = () => {};
  a.onClose = null;
  a._flushSave = () => {};
  a.close();
  assert.equal(a.busy, 0);
  assert.equal(rendered, 1);
  assert.equal(a.shown, false);
});
