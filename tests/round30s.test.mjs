// 3.0s: the bog is earned, and a room asks before it goes there.
//
// Solo, the peat works open once a shift on the forestry has been won (the atlas counts wins, and now the bog's
// own wins apart, so «cleared» is a win that was not a bog win). In a room the host may pick the bog only if
// someone in it has cleared the forest, and every player who has not is asked (`mq`) and has to say yes (`ma`)
// before the rule changes; one «no» keeps the room on the forest. This drives real `Coop` objects over a
// pretend wire, so the whole question-and-answer runs the way it does between browsers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } clear() { this.m.clear(); } }
globalThis.localStorage = globalThis.localStorage || new Mem();
globalThis.document = globalThis.document || { documentElement: {}, addEventListener() {} };

const { forestCleared, mapOpen, mapAskList, roomMapOpen } = await import('../src/core/mapUnlock.js');
const { recordNight, freshAtlas, atlasLog } = await import('../src/core/storage.js');
const { Coop } = await import('../src/net/coop.js');
const { t, setLang } = await import('../src/core/i18n.js');
const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');

// ---------------------------------------------------------------- a room on a pretend wire
function room(flags) {
  const peers = [];
  const json = (d) => (d === undefined ? undefined : JSON.parse(JSON.stringify(d)));
  const make = (i) => {
    const c = new Coop({ audio: { voiceDetach() {}, voiceDetachAll() {}, voiceAttach() {} }, mic: { state: 'off' } });
    const id = `p${i}`;
    c.net = {
      selfId: id, connected: true,
      send: (type, d, target) => { for (const q of peers) if (q !== c && q.active && (!target || q.selfId === target)) q._onMessage(type, json(d), id); },
      leave: async () => {}, setStream() {}, rtt: () => 0, relayStatus: () => '',
    };
    const base = c._hello.bind(c);
    c._hello = () => ({ ...base(), name: `P${i}`, cleared: !!flags[i] });
    c.active = true;
    c.code = 'ROOM';
    c.isHost = i === 0;
    c.phase = 'lobby';
    c.status = c.isHost ? 'waiting' : 'searching';
    c.hostId = c.isHost ? id : null;
    c.roster.set(id, { id, name: `P${i}`, slot: c.isHost ? 0 : -1, host: c.isHost, mic: false, inRun: false, self: true, fit: null, cleared: !!flags[i] });
    peers.push(c);
    return c;
  };
  const join = (i) => {
    const c = make(i);
    const host = peers[0];
    if (c !== host) { host._onPeerJoin(c.selfId); c._onPeerJoin(host.selfId); }
    return c;
  };
  flags.forEach((_, i) => join(i));
  const leave = (c) => { c.active = false; for (const q of peers) if (q !== c && q.active) q._onPeerLeave(c.selfId); };
  return { peers, host: peers[0], join, leave, flags };
}

// ---------------------------------------------------------------- the rule
test('the forest is cleared by a won shift that was not won on the bog (old wins count as the forest)', () => {
  assert.equal(forestCleared({ wins: 0, bogWins: 0 }), false);
  assert.equal(forestCleared({ wins: 1, bogWins: 0 }), true); // a 3.0r-and-earlier win: the forest
  assert.equal(forestCleared({ wins: 2, bogWins: 2 }), false); // every win was on the bog (only with ?unlock)
  assert.equal(forestCleared({ wins: 3, bogWins: 2 }), true);
  assert.equal(forestCleared({}), false);
  assert.equal(mapOpen('forest', { wins: 0 }), true, 'the forest is always open');
  assert.equal(mapOpen('bog', { wins: 0 }), false);
  assert.equal(mapOpen('bog', { wins: 1 }), true);
  const ps = [{ id: 'h', cleared: false }, { id: 'a', cleared: true }, { id: 'b', cleared: false }];
  assert.deepEqual(mapAskList('bog', ps, 'h'), ['b'], 'the host\'s own pick is their yes');
  assert.deepEqual(mapAskList('forest', ps, 'h'), []);
  assert.equal(roomMapOpen('bog', ps), true);
  assert.equal(roomMapOpen('bog', [{ cleared: false }, { cleared: false }]), false);
});

test('the atlas counts bog wins apart, a field the cloud already carries', () => {
  assert.equal(freshAtlas().bogWins, 0, 'cleanAtlas (cloud) is driven by freshAtlas: a new key syncs by itself');
  const before = { wins: atlasLog.wins, bogWins: atlasLog.bogWins };
  recordNight({ time: 10, seen: {} }, { won: true, map: 'bog' });
  recordNight({ time: 10, seen: {} }, { won: true, map: 'forest' });
  recordNight({ time: 10, seen: {} }, { won: false, map: 'bog' });
  assert.equal(atlasLog.wins - before.wins, 2);
  assert.equal(atlasLog.bogWins - before.bogWins, 1);
  // and main.js tells it which ground the shift was on
  assert.match(src('main.js'), /res = \{ map: game\.map, \.\.\.res \}/);
});

test('solo: a locked bog card says what opens it, and a shift asked for on it starts on the forest', () => {
  const menus = src('ui/menus.js'), main = src('main.js');
  assert.match(menus, /if \(!mapOpen\(cleanMap\(b\.dataset\.map\)\) && !this\.h\.unlockAll\?\.\(\)\)/, 'a click on a locked card does not pick it');
  assert.match(menus, /classList\.toggle\('locked', locked\)/);
  assert.match(menus, /t\(locked \? 'mapBogLocked'/);
  assert.match(main, /if \(!opts\.coop && !mapOpen\(wantMap\) && !DEBUG\.unlock\) wantMap = 'forest';/, 'and a remembered or typed ?map=bog goes back to the forest');
  assert.match(main, /unlock: params\.has\('unlock'\)/);
});

// ---------------------------------------------------------------- the room
test('a room where everyone has cleared the forest just goes to the bog', () => {
  const { host, peers } = room([true, true, true]);
  assert.equal(host.setMap('bog'), true);
  assert.equal(host.ask, null);
  for (const c of peers) assert.equal(c.rules.map, 'bog');
});

test('nobody in the room has cleared the forest: the bog is locked for the room', () => {
  const { host, peers } = room([false, false]);
  assert.equal(host.setMap('bog'), false);
  assert.equal(host.ask, null);
  for (const c of peers) assert.equal(c.rules.map, 'forest');
});

test('a player who has not cleared it is asked; the rule changes on the last yes, and the night waits until then', () => {
  const { host, peers } = room([true, false, true, false]);
  const [, a, , b] = peers;
  assert.equal(host.setMap('bog'), true);
  assert.deepEqual([...host.ask.wait].sort(), [a.selfId, b.selfId]);
  for (const c of peers) assert.equal(c.rules.map, 'forest', 'nothing moves before they agree');
  assert.deepEqual(a.question?.map, 'bog');
  assert.deepEqual(b.question?.map, 'bog');
  assert.equal(peers[2].question, null, 'a player who cleared it is not asked');
  assert.deepEqual(host.askNames().sort(), ['P1', 'P3']);
  assert.equal(host.startRun({ cut: true }), null, 'the night does not start while the room is asking');
  assert.equal(a.answerMap(true), true);
  assert.equal(host.rules.map, 'forest', 'one yes is not all of them');
  assert.deepEqual([...peers[2].ask.wait], [b.selfId], 'everyone sees who is left');
  assert.equal(b.answerMap(true), true);
  for (const c of peers) assert.equal(c.rules.map, 'bog');
  assert.equal(host.ask, null);
  assert.ok(host.startRun({ cut: true }), 'and now the night starts');
});

test('one «no» keeps the room on the forest, and everyone sees who said it', () => {
  const { host, peers } = room([true, false, false]);
  const seen = [];
  for (const c of peers) c.on('mapRefused', (n) => seen.push(n));
  host.setMap('bog');
  peers[1].answerMap(true);
  peers[2].answerMap(false);
  for (const c of peers) assert.equal(c.rules.map, 'forest');
  assert.equal(host.ask, null);
  assert.equal(host.refused?.name, 'P2');
  assert.equal(peers[1].refused?.name, 'P2', 'the others learn the name from the roster');
  assert.ok(seen.includes('P2'));
});

test('the host may pick the bog without having cleared it, if someone in the room has', () => {
  const { host, peers } = room([false, true]);
  assert.equal(host.setMap('bog'), true);
  assert.equal(host.ask, null);
  assert.equal(peers[1].rules.map, 'bog');
});

test('someone joins a room already on the bog without having cleared it: they are asked too', () => {
  const r = room([true, true]);
  r.host.setMap('bog');
  r.flags.push(false);
  const late = r.join(2);
  assert.equal(late.question?.map, 'bog');
  assert.equal(r.host.startRun({ cut: true }), null);
  late.answerMap(false);
  for (const c of r.peers) assert.equal(c.rules.map, 'forest', 'their «no» takes the room back to the forest');
});

test('an asked player who leaves does not hold the room hostage; picking the forest withdraws the question', () => {
  const r = room([true, false, false]);
  r.host.setMap('bog');
  r.peers[1].answerMap(true);
  r.leave(r.peers[2]);
  assert.equal(r.host.rules.map, 'bog');
  const r2 = room([true, false]);
  r2.host.setMap('bog');
  assert.ok(r2.peers[1].question);
  r2.host.setMap('forest');
  assert.equal(r2.host.ask, null);
  assert.equal(r2.peers[1].question, null, 'the question is gone from their screen');
  assert.equal(r2.peers[1].answerMap(true), false);
});

test('a guest cannot move the room or answer for someone else', () => {
  const { host, peers } = room([true, false, false]);
  assert.equal(peers[1].setMap('bog'), false);
  host.setMap('bog');
  // a forged yes from a player who was not asked, and one with a stale question id
  host._onMapAnswer('p9', { id: host.ask.id, yes: true });
  host._onMapAnswer(peers[1].selfId, { id: host.ask.id + 1, yes: true });
  assert.equal(host.ask.wait.size, 2);
  assert.equal(host.rules.map, 'forest');
});

test('the lobby shows the question, the waiting note and holds the start button; the words exist in both languages', () => {
  const lobby = src('ui/lobby.js');
  assert.match(lobby, /this\.coop\.answerMap\(button\.dataset\.ans==='yes'\)/);
  assert.match(lobby, /start\.disabled = .*\|\| !!c\.ask;/);
  assert.match(lobby, /roomMapOpen\('bog', c\.players\(\)\)/);
  for (const lang of ['ru', 'en']) {
    setLang(lang);
    for (const k of ['mapBogLocked', 'ruleMapLocked', 'ruleMapWait', 'ruleMapRefused', 'mapAskKicker', 'mapAskBody', 'mapAskYes', 'mapAskNo', 'loadingBog', 'howtoBog']) {
      assert.notEqual(t(k), k, `${lang}.${k}`);
    }
    assert.match(t('ruleMapWait'), /\{names\}/);
    assert.match(t('ruleMapRefused'), /\{name\}/);
    assert.doesNotMatch(t('loadingBog'), /лес|forest/i);
  }
  setLang('ru');
  // the loading line and the rules page know the bog
  assert.match(src('ui/menus.js'), /'loadingBog' : 'loading'/);
  assert.match(src('ui/menus.js'), /t\('howtoBody'\) \+ t\('howtoBog'\)/);
});

test('the wire changed, so the protocol did', async () => {
  const { PROTOCOL } = await import('../src/net/net.js');
  assert.equal(PROTOCOL, 19);
  assert.match(src('net/coop.js'), /'mq', 'ma'/);
});
