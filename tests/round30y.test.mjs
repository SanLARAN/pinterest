// 3.0y: a room that waits for everyone, keys of one's own, and an account panel you can read.
//
// Every guest in a room ticks «ready» (`rd` to the host, who puts it in the roster); the host's START waits for
// all of them, and the tick resets whenever the terms change (days, the ground, the end of a night). A player who
// has won a shift on the forestry wears a «Лесхоз» badge in the list. The keyboard is read as actions now
// (core/keybinds.js), so the settings can rebind them; the arrows, Esc and Enter stay put as the way back. And the
// account and friends panels were redrawn on the game's own tokens with nothing under 11–12 px.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } clear() { this.m.clear(); } }
globalThis.localStorage = globalThis.localStorage || new Mem();

const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
const { ACTIONS, DEFAULT_KEYS, FIXED, bindable, cleanKeys, keysToSave, rebind, actionMap, keyLabel } = await import('../src/core/keybinds.js');

// ---------------------------------------------------------------- keys
test('bindings: defaults are whole, a saved map is cleaned, the fixed keys cannot be taken', () => {
  assert.deepEqual(Object.keys(DEFAULT_KEYS).sort(), [...ACTIONS].sort());
  assert.equal(new Set(Object.values(DEFAULT_KEYS)).size, ACTIONS.length, 'no default key does two things');
  assert.deepEqual(cleanKeys(null), DEFAULT_KEYS);
  assert.deepEqual(cleanKeys({ forward: 'ArrowUp', ping: 'Escape', use: 'NotAKey', wat: 'KeyQ' }), DEFAULT_KEYS, 'fixed keys, junk and unknown actions are dropped');
  assert.equal(cleanKeys({ forward: 'KeyZ' }).forward, 'KeyZ');
  for (const code of Object.keys(FIXED)) assert.equal(bindable(code), false, code);
  // a hand-edited map with one key twice: the second action falls back to its own default
  const m = cleanKeys({ forward: 'KeyE' });
  assert.equal(m.forward, 'KeyE');
  assert.equal(m.use, null, 'use had E and its default is the key forward now has: unbound, not doubled');
  const vals = Object.values(m).filter(Boolean);
  assert.equal(new Set(vals).size, vals.length);
});

test('rebinding swaps instead of leaving a hole, and only the changes are saved', () => {
  const m = rebind(DEFAULT_KEYS, 'ping', 'KeyE'); // E was «use»
  assert.equal(m.ping, 'KeyE');
  assert.equal(m.use, 'Space', 'use takes the key ping gave up');
  assert.deepEqual(keysToSave(m), { ping: 'KeyE', use: 'Space' });
  assert.deepEqual(keysToSave(DEFAULT_KEYS), {});
  assert.equal(rebind(DEFAULT_KEYS, 'ping', 'Escape'), DEFAULT_KEYS, 'Esc stays the pause');
  assert.equal(rebind(DEFAULT_KEYS, 'nope', 'KeyQ'), DEFAULT_KEYS);
  const am = actionMap(m);
  assert.equal(am.get('KeyE'), 'ping');
  assert.equal(am.get('ArrowUp'), 'forward', 'the arrows always walk');
  assert.equal(am.get('Escape'), 'pause');
  assert.equal(keyLabel('KeyQ'), 'Q');
  assert.equal(keyLabel('ShiftLeft'), 'Shift');
  assert.equal(keyLabel(null), '—');
});

function browser() {
  const on = {};
  const add = (target) => (type, fn) => { (on[target + ':' + type] ||= []).push(fn); };
  const doc = { documentElement: {}, addEventListener: add('doc'), pointerLockElement: null, exitPointerLock() {}, body: { classList: { toggle() {} } } };
  const win = { addEventListener: add('win') };
  win.self = win; win.top = win;
  globalThis.window = win;
  globalThis.document = doc;
  globalThis.location = { search: '' };
  const canvas = { addEventListener: add('canvas'), requestPointerLock: () => Promise.resolve() };
  const key = (type, code, e = {}) => { for (const fn of on['win:' + type] || []) fn({ code, repeat: false, preventDefault() {}, ...e }); };
  return { canvas, key };
}

test('the game reads actions: a rebound key walks, the old one does nothing, the arrows still work', async () => {
  const b = browser();
  const { Input } = await import('../src/input/input.js?keys');
  const input = new Input(b.canvas);
  input.gameActive = true;
  const seen = [];
  input.on?.('pingDown', () => seen.push('ping'));
  input.setKeys({ forward: 'KeyZ', ping: 'KeyE', use: 'Space' });
  b.key('keydown', 'KeyZ');
  assert.equal(input.held('forward'), true);
  b.key('keyup', 'KeyZ');
  b.key('keydown', 'KeyW');
  assert.equal(input.held('forward'), false, 'W is free now');
  b.key('keyup', 'KeyW');
  b.key('keydown', 'ArrowUp');
  assert.equal(input.held('forward'), true);
  b.key('keyup', 'ArrowUp');
  b.key('keydown', 'KeyE');
  assert.equal(input.pingHeld, true, 'E echoes');
  b.key('keyup', 'KeyE');
  assert.equal(input.pingHeld, false);
  // while the settings listen for a key, the game does not act on it
  input.capturing = true;
  b.key('keydown', 'KeyE');
  assert.equal(input.pingHeld, false);
  input.capturing = false;
});

test('bindings are a device setting (cloud sync leaves them alone) and the settings screen has the panel', () => {
  assert.match(src('core/persistence.js'), /DEVICE_KEYS[^;]*'keys'/s);
  assert.match(src('core/storage.js'), /keys: \{\}/);
  const panel = src('ui/keysPanel.js');
  assert.match(panel, /input\.capturing = true/);
  assert.match(panel, /keysToSave/);
  assert.match(panel, /saveSettings/);
  assert.match(src('main.js'), /new KeysPanel\(/);
});

// ---------------------------------------------------------------- the room
function room(n, cleared = []) {
  return (async () => {
    const { Coop } = await import('../src/net/coop.js');
    const peers = [];
    const json = (d) => (d === undefined ? undefined : JSON.parse(JSON.stringify(d)));
    for (let i = 0; i < n; i++) {
      const c = new Coop({ audio: { voiceDetach() {}, voiceDetachAll() {}, voiceAttach() {} }, mic: { state: 'off' } });
      const id = `p${i}`;
      c.net = { selfId: id, connected: true, send: (type, d, target) => { for (const q of peers) if (q !== c && q.active && (!target || q.selfId === target)) q._onMessage(type, json(d), id); }, leave: async () => {}, setStream() {}, rtt: () => 0, relayStatus: () => '' };
      const base = c._hello.bind(c);
      c._hello = () => ({ ...base(), name: `P${i}`, cleared: !!cleared[i] });
      Object.assign(c, { active: true, code: 'ROOM', isHost: i === 0, phase: 'lobby', status: i ? 'searching' : 'waiting', hostId: i ? null : id });
      c.roster.set(id, { id, name: `P${i}`, slot: i ? -1 : 0, host: i === 0, mic: false, inRun: false, self: true, fit: null, cleared: !!cleared[i] });
      peers.push(c);
      if (i) { peers[0]._onPeerJoin(id); c._onPeerJoin('p0'); }
    }
    return peers;
  })();
}

test('the night waits for every guest\'s tick, and everyone sees who is ready', async () => {
  const [host, a, b] = await room(3, [true, false, true]);
  assert.deepEqual(host.notReady().sort(), ['P1', 'P2']);
  assert.equal(host.startRun({ cut: true }), null);
  assert.equal(a.setReady(true), true);
  assert.deepEqual(host.notReady(), ['P2']);
  assert.equal(b.players().find((p) => p.name === 'P1').ready, true, 'the tick reaches the other guests through the roster');
  assert.equal(host.startRun({ cut: true }), null);
  b.setReady(true);
  b.setReady(false);
  assert.deepEqual(host.notReady(), ['P2'], 'and can be taken back');
  b.setReady(true);
  assert.deepEqual(host.notReady(), []);
  assert.equal(a.players().find((p) => p.name === 'P2').cleared, true, 'the forestry badge travels with the roster');
  assert.ok(host.startRun({ cut: true }));
});

test('ticks reset when the terms change and when the night ends; a guest cannot tick for someone else', async () => {
  const [host, a] = await room(2, [true, true]);
  a.setReady(true);
  assert.equal(host.setDays(host.rules.days === 2 ? 4 : 2), true);
  assert.deepEqual(host.notReady(), ['P1'], 'new days, a new yes');
  a.setReady(true);
  host.setMap('bog');
  assert.equal(host.rules.map, 'bog');
  assert.deepEqual(host.notReady(), ['P1'], 'new ground, a new yes');
  a.setReady(true);
  host.setMap('bog');
  assert.deepEqual(host.notReady(), [], 'the same ground again changes nothing');
  assert.ok(host.startRun({ cut: true }));
  host.endRun();
  assert.deepEqual(host.notReady(), ['P1'], 'back in the garage, everyone ticks again');
  assert.equal(a.players().find((p) => p.name === 'P1').ready, false);
  // a forged tick: only from the player themself, only in the lobby
  host._onMessage('rd', { ready: true }, 'p9');
  assert.deepEqual(host.notReady(), ['P1']);
});

test('the lobby: a ready button for guests, badges in the list, START held with the names; the wire moved to 20', async () => {
  const lobby = src('ui/lobby.js');
  assert.match(lobby, /this\.readyBtn\.id = 'btnReady'/);
  assert.match(lobby, /me\.host \|\| me\.slot < 0/, 'the host\'s ready is START itself');
  assert.match(lobby, /tag-ready/);
  assert.match(lobby, /tag-forest/);
  assert.match(lobby, /coopWaitReady/);
  assert.match(src('net/coop.js'), /'rd'/);
  const { PROTOCOL } = await import('../src/net/net.js');
  assert.equal(PROTOCOL >= 20, true); // (4.0 moved it to 21: the camera, the arms)
});

// ---------------------------------------------------------------- readable panels
test('account and friends panels: game tokens, no tiny text, 44 px buttons', () => {
  for (const f of ['cloud.css', 'social.css']) {
    const css = src(f);
    const sizes = [...css.matchAll(/font(?:-size)?:[^;]*?(\d+(?:\.\d+)?)px/g)].map((m) => +m[1]);
    assert.ok(sizes.length > 5, f);
    assert.ok(Math.min(...sizes) >= 11, `${f}: smallest font ${Math.min(...sizes)}px`);
    assert.match(css, /var\(--bone\)/, `${f} uses the game's palette`);
  }
  assert.match(src('cloud.css'), /min-height: 44px/);
});

test('the new words exist in both languages', async () => {
  const { t, setLang } = await import('../src/core/i18n.js');
  const keys = ['coopReadyOff', 'coopReadyOn', 'coopTagReady', 'coopTagNotReady', 'coopTagForest', 'coopTagForestTitle', 'coopWaitReady', 'kbTitle', 'kbHint', 'kbPress', 'kbReset', 'kbFixed'];
  for (const lang of ['ru', 'en']) {
    setLang(lang);
    for (const k of keys) assert.notEqual(t(k), k, `${lang}.${k}`);
    assert.match(t('coopWaitReady'), /\{names\}/);
    for (const a of ACTIONS) assert.ok(t('kbAct')[a], `${lang}.kbAct.${a}`);
  }
  setLang('ru');
});
