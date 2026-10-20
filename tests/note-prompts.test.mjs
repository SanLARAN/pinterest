// The page found on a body owns the screen. While it is open nothing underneath may show a prompt:
// the "hold E" line used to come back the moment the page closed (and the hint kept its own life).
// These drive the real HUD methods and the objectives' interaction pass over a stub DOM.
import test from 'node:test';
import assert from 'node:assert/strict';

class El {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.parent = null;
    this.dataset = {};
    this.style = { setProperty() {} };
    this._cls = new Set();
    this._on = {};
    this.textContent = '';
    this.innerHTML = '';
    this.hidden = false;
    this.disabled = false;
    this.attrs = {};
    this.offsetWidth = 10;
    this.classList = {
      add: (...c) => c.forEach((x) => this._cls.add(x)),
      remove: (...c) => c.forEach((x) => this._cls.delete(x)),
      toggle: (c, on) => {
        const v = on === undefined ? !this._cls.has(c) : !!on;
        if (v) this._cls.add(c); else this._cls.delete(c);
        return v;
      },
      contains: (c) => this._cls.has(c),
    };
  }
  set className(v) {
    this._cls = new Set(String(v).split(/\s+/).filter(Boolean));
  }
  get className() {
    return [...this._cls].join(' ');
  }
  append(...kids) {
    for (const k of kids) { k.parent = this; this.children.push(k); }
  }
  appendChild(k) { this.append(k); return k; }
  remove() {
    if (!this.parent) return;
    const i = this.parent.children.indexOf(this);
    if (i >= 0) this.parent.children.splice(i, 1);
    this.parent = null;
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(t, f) { (this._on[t] ||= []).push(f); }
  matches(sel) {
    if (sel === 'button') return this.tag === 'button';
    if (sel.startsWith('.')) return this._cls.has(sel.slice(1));
    const m = sel.match(/^\[data-action="(.+)"\]$/);
    if (m) return this.dataset.action === m[1];
    return false;
  }
  find(sel) {
    for (const c of this.children) {
      if (c.matches(sel)) return c;
      const d = c.find(sel);
      if (d) return d;
    }
    return null;
  }
  querySelector(sel) { return this.find(sel); }
  querySelectorAll() { return []; }
  closest(sel) {
    let n = this;
    while (n) { if (n.matches(sel)) return n; n = n.parent; }
    return null;
  }
}

const body = new El('body');
globalThis.document = {
  body,
  createElement: (tag) => new El(tag),
  getElementById: () => null,
  addEventListener() {},
  removeEventListener() {},
};

const { HUD } = await import('../src/ui/hud.js');
const { Objectives } = await import('../src/game/objectives.js');

const fakeHud = () => {
  const h = Object.create(HUD.prototype);
  h.cache = {};
  h.hintKey = null;
  h.noteOpen = false;
  h.useEl = new El();
  h.useRing = new El();
  h.hint = new El();
  h.noteEl = new El();
  for (const c of ['k', 't', 'f']) {
    const n = new El();
    n.className = c;
    h.noteEl.append(n);
  }
  return h;
};

test('an open page puts the prompt and the hint away, and keeps them away', () => {
  const h = fakeHud();
  h.setUse('E · обыскать', 0.4, true);
  h.setHint('у тела — удерживай E');
  assert.equal(h.useEl.classList.contains('show'), true);
  assert.equal(h.hint.classList.contains('show'), true);

  h.showNote('у лагеря · карбюратор', 'текст записки');
  assert.equal(h.noteOpen, true);
  assert.equal(body.classList.contains('note-open'), true);
  assert.equal(h.useEl.classList.contains('show'), false);
  assert.equal(h.hint.classList.contains('show'), false);
  assert.equal(body.classList.contains('can-use'), false);

  // anything asking for a hand while the page lies open stays hidden
  h.setUse('E · взять ракетницу', 0, true);
  h.setHint('у тела — удерживай E');
  assert.equal(h.useEl.classList.contains('show'), false);
  assert.equal(h.hint.classList.contains('show'), false);
  assert.equal(h.hintKey, null);

  h.showNote(null);
  assert.equal(h.noteOpen, false);
  assert.equal(body.classList.contains('note-open'), false);
  assert.equal(h.hint.classList.contains('show'), false);

  // and the world may ask again, from a clean slate
  h.setUse('E · взять ракетницу', 0, true);
  assert.equal(h.useEl.classList.contains('show'), true);
  h.setHint('у тела — удерживай E');
  assert.equal(h.hint.classList.contains('show'), true);
});

test('while the page is open the interaction pass asks for nothing', () => {
  const calls = [];
  const o = Object.create(Objectives.prototype);
  o.note = { t: 5 };
  o.target = { kind: 'body' };
  o.searchT = 0.8;
  o.g = { hud: { setUse: (t) => calls.push(t) } };
  o._interact(1 / 60);
  assert.deepEqual(calls, [null], 'the prompt is cleared, not re-aimed at a corpse under the page');
  assert.equal(o.target, null);
  assert.equal(o.searchT, 0);

  // closing the page resets the aim too, so the next frame looks for a target afresh
  o.note = { t: 1 };
  const seen = [];
  o.g.hud.showNote = (k) => seen.push(k);
  o._interact = Objectives.prototype._interact;
  o.closeNote();
  assert.deepEqual(seen, [null]);
  assert.equal(o.target, null);
  assert.equal(o.searchT, 0);
});
