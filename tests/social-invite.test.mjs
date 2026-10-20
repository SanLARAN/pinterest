// A room invitation is answered where it arrives. It must carry two readable keys — «Присоединиться»
// and «Отказаться» — and the row may only leave once the answer has actually gone through.
// (The decline key used to read a word that did not exist, so the toast looked like it had none.)
import test from 'node:test';
import assert from 'node:assert/strict';

class El {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.parent = null;
    this.dataset = {};
    this.attrs = {};
    this.style = { setProperty() {} };
    this._cls = new Set();
    this._on = {};
    this.textContent = '';
    this.innerHTML = '';
    this.hidden = false;
    this.disabled = false;
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
  set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this._cls].join(' '); }
  append(...kids) { for (const k of kids) { k.parent = this; this.children.push(k); } }
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
    if (/^\[data-action\]$/.test(sel)) return this.dataset.action != null;
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

const { SocialToasts } = await import('../src/ui/socialToasts.js');
const { socialWords } = await import('../src/ui/socialWords.js');

const cloud = { user: { id: 'u1' }, on: () => () => {} };
const account = (answer = true) => {
  const calls = [];
  return {
    calls,
    canOpen: () => true,
    toastInvite: async (id, accept) => {
      calls.push([id, accept]);
      return answer;
    },
  };
};
const tick = () => new Promise((r) => setTimeout(r, 0));

test('a room invitation shows «Присоединиться» and «Отказаться»', () => {
  const acc = account();
  const t = new SocialToasts({ cloud, account: acc });
  t.push({ type: 'room_invite', item: { id: 'inv1', display_name: 'Пилот', room_code: 'ABCD' } });
  const row = t.rows.get('u1:room_invite:inv1');
  assert.ok(row, 'the invitation is on screen');
  const accept = row.el.querySelector('[data-action="accept"]');
  const decline = row.el.querySelector('[data-action="decline"]');
  const S = socialWords();
  assert.equal(accept.textContent, S.joinRoom);
  assert.equal(decline.textContent, S.decline);
  assert.equal(S.joinRoom, 'Присоединиться');
  assert.equal(S.decline, 'Отказаться');
  assert.ok(row.el.querySelector('[data-action="dismiss"]'), 'and a way to put it away unanswered');
  t.destroy();
});

test('answering in the toast goes straight to the cloud and closes the row', async () => {
  const acc = account(true);
  const t = new SocialToasts({ cloud, account: acc });
  t.push({ type: 'room_invite', item: { id: 'inv2', display_name: 'Пилот', room_code: 'ABCD' } });
  const row = t.rows.get('u1:room_invite:inv2');
  t.click({ target: row.el.querySelector('[data-action="accept"]') });
  assert.equal(row.el.querySelector('[data-action="accept"]').disabled, true, 'the keys go quiet while it thinks');
  await tick();
  assert.deepEqual(acc.calls, [['inv2', true]]);
  assert.equal(t.rows.has('u1:room_invite:inv2'), false, 'the row leaves after a yes');
  t.destroy();
});

test('a decline is an answer too, and a failed one keeps the row and says so', async () => {
  const no = account(false);
  const t = new SocialToasts({ cloud, account: no });
  t.push({ type: 'room_invite', item: { id: 'inv3', display_name: 'Пилот', room_code: 'ABCD' } });
  const row = t.rows.get('u1:room_invite:inv3');
  t.click({ target: row.el.querySelector('[data-action="decline"]') });
  await tick();
  assert.deepEqual(no.calls, [['inv3', false]]);
  assert.ok(t.rows.has('u1:room_invite:inv3'), 'a refusal the wire did not take stays on screen');
  assert.equal(row.el.querySelector('[data-action="decline"]').disabled, false, 'and can be tried again');
  assert.equal(row.el.querySelector('.social-toast-err').hidden, false);
  assert.ok(row.el.querySelector('.social-toast-err').textContent.length > 0);
  t.destroy();
});
