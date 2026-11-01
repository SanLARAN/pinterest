// 3.1c: Сороки, the quick wheel and the battery preview.
//
// Magpies sit in tonight's dead trees (chosen from the world's perches by the night's seed, so every machine has
// the same flocks) and go up rattling when someone runs under them, walks up to the trunk, or makes a loud noise
// beside the tree: the host tells everyone ('mp') and the monsters hear it as the spooker's own noise.
// Holding the backpack key opens four pockets around the crosshair: point and let go to take one in hand.
// A battery says what the flashlight will be after it, in the pack and on the wheel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } clear() { this.m.clear(); } }
globalThis.localStorage = globalThis.localStorage || new Mem();

const { World } = await import('../src/world/world.js');
const { RNG } = await import('../src/core/rng.js');
const { MAGPIE, Magpies, pickPerches, spooker } = await import('../src/game/magpies.js');
const { sectorOf } = await import('../src/ui/quickWheel.js');
const { Backpack } = await import('../src/game/inventory.js');
const src = (p) => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');

let forest = null;
const world = () => forest || (forest = new World(new T.Scene(), new T.MeshBasicMaterial()).generate());

// ---------------------------------------------------------------- where they sit
test('the forest\'s dead trees are perches with branch spots at a bird\'s height', () => {
  const w = world();
  assert.ok(w.perches.length > 500, `${w.perches.length} perches`);
  for (const p of w.perches.slice(0, 200)) {
    assert.ok(p.spots.length >= 3, 'each branch and the broken top');
    for (const [x, y, z] of p.spots) {
      const h = y - w.terrain.height(p.x, p.z);
      assert.ok(h > 1 && h < 14, `height ${h}`);
      assert.ok(Math.hypot(x - p.x, z - p.z) < 3.5, 'on the tree, not beside it');
    }
  }
});

test('tonight\'s trees: the same for the same seed, spread out, away from the start, by the trails', () => {
  const w = world();
  const prefer = (p) => w.trails.near(p.x, p.z, MAGPIE.trailR);
  const a = pickPerches(w.perches, new RNG(99), { avoid: [w.spawn], prefer });
  const b = pickPerches(w.perches, new RNG(99), { avoid: [w.spawn], prefer });
  assert.equal(a.length, MAGPIE.flocks);
  assert.deepEqual(a.map((p) => [p.x, p.z]), b.map((p) => [p.x, p.z]), 'every machine sits them on the same trees');
  for (const p of a) {
    assert.ok(Math.hypot(p.x - w.spawn.x, p.z - w.spawn.z) >= MAGPIE.keepOff);
    assert.ok(prefer(p), 'by a trail');
    for (const q of a) if (q !== p) assert.ok(Math.hypot(p.x - q.x, p.z - q.z) >= MAGPIE.spread);
  }
  assert.notDeepEqual(pickPerches(w.perches, new RNG(100), { prefer }).map((p) => p.x), a.map((p) => p.x), 'another night, other trees');
});

test('who sends them up: a runner under the tree or anyone at the trunk — never a crouching one', () => {
  const f = { x: 0, z: 0 };
  const P = (o) => ({ alive: true, crouching: false, sprinting: false, speed: 3, x: 0, z: 0, ...o });
  assert.equal(spooker(f, [P({ x: 5 })]), null, 'walking past at five metres');
  assert.ok(spooker(f, [P({ x: 5, sprinting: true, speed: 5.7 })]), 'running past at five metres');
  assert.equal(spooker(f, [P({ x: 9, sprinting: true, speed: 5.7 })]), null);
  assert.ok(spooker(f, [P({ x: 1.5 })]), 'walking up to the trunk');
  assert.equal(spooker(f, [P({ x: 1, crouching: true })]), null, 'sneaking up to it');
  assert.equal(spooker(f, [P({ x: 1, alive: false })]), null);
});

// ---------------------------------------------------------------- the flock
function stubGame({ auth = true } = {}) {
  const w = world();
  const evs = [], noises = [], alerts = [];
  const g = {
    map: 'forest', state: 'play', auth, day: 1, baseSeed: 42, time: 0,
    world: { perches: w.perches, terrain: w.terrain, material: new T.MeshBasicMaterial(), spawn: w.spawn, trails: w.trails },
    scene: new T.Scene(),
    players: [{ id: 'me', alive: true, crouching: false, sprinting: false, speed: 0, x: 999, z: 999 }],
    livePlayers() { return this.players; },
    get player() { return this.players[0]; },
    pulses: { emit: () => ({}) }, echoTicks() {}, radar: { blip() {} },
    hud: { flashAlert: (txt) => alerts.push(txt) },
    sync: { ev: (...a) => evs.push(a) },
    noise: (...a) => noises.push(a),
  };
  return { g, evs, noises, alerts };
}

test('the host: running under a flock sends it up, tells everyone, and the monsters hear it as yours', () => {
  const { g, evs, noises, alerts } = stubGame();
  const m = new Magpies(g);
  m.startNight();
  assert.equal(m.list.length, MAGPIE.flocks);
  assert.ok(m.list.every((f) => f.birds.length >= MAGPIE.birds[0] && f.birds.length <= MAGPIE.birds[1]));
  const f = m.list[0];
  Object.assign(g.players[0], { x: f.x + 4, z: f.z, sprinting: true, speed: 5.7 });
  m.update(0.05);
  assert.equal(f.state, 'flying');
  assert.deepEqual(evs[0].slice(0, 2), ['mp', 0]);
  assert.equal(evs[0][3], 'me', 'whose fault it was travels with it');
  assert.deepEqual(noises[0], [f.x, f.z, MAGPIE.loud, 'magpie', false, 'me']);
  g.players[0].x = f.x + 30; g.players[0].sprinting = false; // walk a little away: still near enough to be warned
  assert.equal(alerts.length, 1);
  for (let i = 0; i < 100; i++) m.update(0.05);
  assert.equal(f.state, 'away');
  assert.ok(f.birds.every((b) => !b.m.visible), 'gone over the trees');
  for (let i = 0; i < (MAGPIE.away[1] + 2) * 20; i++) m.update(0.05);
  assert.equal(f.state, 'perched', 'back on the branches');
  assert.ok(f.birds.every((b) => b.m.visible && b.m.position.equals(b.home)));
});

test('a loud noise by the tree sends them up (a stone thrown into them is an alarm somewhere else); quiet ones do not', () => {
  const { g, noises } = stubGame();
  const m = new Magpies(g);
  m.startNight();
  const [a, b] = m.list;
  m.hear(a.x + 10, a.z, 0.3, 'step', 'me');
  assert.equal(a.state, 'perched');
  m.hear(a.x + 10, a.z, 0.46, 'stone', 'me');
  assert.equal(a.state, 'flying');
  assert.equal(noises.at(-1)[3], 'magpie');
  m.hear(b.x + 20, b.z, 0.9, 'voice', 'me');
  assert.equal(b.state, 'perched', 'too far from the tree');
  const n = noises.length;
  m.hear(a.x, a.z, 0.9, 'magpie', null);
  assert.equal(noises.length, n, 'their own rattle does not set off the next flock in a chain');
});

test('a guest only plays what the host said: no deciding, no noise of its own', () => {
  const { g, evs, noises } = stubGame({ auth: false });
  const m = new Magpies(g);
  m.startNight();
  const f = m.list[2];
  Object.assign(g.players[0], { x: f.x + 1, z: f.z });
  m.update(0.05);
  assert.equal(f.state, 'perched', 'standing at the trunk on a guest: the host decides');
  assert.equal(m.netTakeoff(2, 1.2, 'host'), true);
  assert.equal(f.state, 'flying');
  assert.equal(evs.length + noises.length, 0);
  assert.match(src('game/netsync.js'), /case 'mp': if \(isHostMsg && Number\.isInteger\(a\)\) g\.magpies\?\.netTakeoff\(a, b, c\)/);
});

test('the game wires them in: the forest only, every night, in the sound funnel', () => {
  const game = src('game/game.js');
  assert.match(game, /if \(this\.map === 'forest' && this\.magpies\) this\.magpies\.startNight\(this\.day, this\.baseSeed\)/);
  assert.match(game, /if \(this\.map === 'forest'\) this\.magpies\.hear\(x, z, loud, source, pid\)/);
  assert.match(game, /this\.magpies\.update\(dt\)/);
  assert.match(game, /this\.magpies\.reset\(\)/);
  const audio = src('audio/audio.js');
  assert.match(audio, /magpieFlight\(x, y, z\) \{/);
  assert.match(audio, /magpieChatter\(x, y, z, gain = 0\.22\) \{/);
});

// ---------------------------------------------------------------- the wheel
test('the wheel: which pocket the mouse points at', () => {
  assert.equal(sectorOf(0, 0), -1, 'the middle keeps things as they are');
  assert.equal(sectorOf(10, -10), -1, 'a twitch is still the middle');
  assert.equal(sectorOf(0, -80), 0, 'up');
  assert.equal(sectorOf(80, 0), 1, 'right');
  assert.equal(sectorOf(0, 80), 2, 'down');
  assert.equal(sectorOf(-80, 0), 3, 'left');
  assert.equal(sectorOf(70, -40), 1, 'nearer right than up');
});

function pack({ torch = true, charge = 0.4, cells = 2 } = {}) {
  const b = Object.create(Backpack.prototype);
  b.g = {
    state: 'play', inputMuted: false,
    player: { alive: true, carrying: null },
    escape: { held: null, mySeat: -1 }, cabinets: { busy: false }, expedition: { onTower: false },
    torch: { has: torch, charge, on: false, toggle() {} },
    tools: { cancelRecord() {} }, partMap: { fold() {} }, input: { reset() {}, requestLock() {} },
    audio: { ready: false },
  };
  Object.assign(b, { opened: false, pending: new Map(), cells, slots: ['stones', 'glow', 'torch', 'battery'], equipped: null, el: { hidden: true, classList: { remove() {} }, contains: () => false } });
  globalThis.document = globalThis.document || { body: { classList: { remove() {}, add() {} } }, activeElement: null };
  return b;
}

test('quick equip takes a pocket into your hands without opening the pack; never while your hands are busy', () => {
  const b = pack();
  assert.equal(b.canQuick(), true);
  assert.equal(b.quickEquip(2), true);
  assert.equal(b.equipped, 'torch');
  assert.equal(b.opened, false);
  assert.equal(b.quickEquip(2), true);
  assert.equal(b.equipped, null, 'the same pocket again puts it away');
  b.g.player.carrying = 'friend';
  assert.equal(b.canQuick(), false, 'carrying a friend');
  assert.equal(b.quickEquip(0), false);
  b.g.player.carrying = null;
  b.opened = true;
  assert.equal(b.canQuick(), false, 'the full pack is already open');
});

test('the battery preview: what the flashlight will be after it', () => {
  assert.deepEqual(pack({ charge: 0.4 }).batteryPreview(), { from: 40, to: 85, full: false }, '+45%, and 0.4 + 0.45 is not 86');
  assert.deepEqual(pack({ charge: 0.8 }).batteryPreview(), { from: 80, to: 100, full: false });
  assert.equal(pack({ charge: 0.995 }).batteryPreview().full, true);
  assert.equal(pack({ torch: false }).batteryPreview(), null, 'no flashlight to charge');
  assert.equal(pack({ cells: 0 }).batteryPreview(), null);
  assert.match(src('game/inventory.js'), /chips\.push\(\[t\('bagTorchAfter'\)/);
});

test('input: a held backpack key, and the mouse steering the wheel instead of the head', async () => {
  const on = {};
  const add = (k) => (type, fn) => { (on[k + ':' + type] ||= []).push(fn); };
  globalThis.window = { addEventListener: add('win') };
  window.self = window; window.top = window;
  globalThis.document = { documentElement: {}, addEventListener: add('doc'), pointerLockElement: null, exitPointerLock() {}, body: { classList: { toggle() {}, add() {}, remove() {} } } };
  globalThis.location = { search: '' };
  globalThis.innerWidth = 800; globalThis.innerHeight = 600;
  const { Input } = await import('../src/input/input.js?wheel');
  const input = new Input({ addEventListener: add('canvas'), requestPointerLock: () => Promise.resolve() });
  const fire = (k, e) => { for (const fn of on[k] || []) fn({ preventDefault() {}, repeat: false, ...e }); };
  fire('win:keydown', { code: 'KeyI' });
  assert.equal(input.bagHeld(), true);
  input.wheel = { dx: 0, dy: 0 };
  fire('win:mousemove', { clientX: 500, clientY: 300, movementX: 0, movementY: 0 });
  assert.deepEqual(input.wheel, { dx: 100, dy: 0 });
  assert.equal(input.lookDX, 0, 'the head did not turn');
  fire('win:keyup', { code: 'KeyI' });
  assert.equal(input.bagHeld(), false);
});

test('main: a short press is the pack, a hold the wheel; Esc closes it; the words exist in both languages', async () => {
  const main = src('main.js');
  assert.match(main, /case 'bag':\s*if \(state === 'playing'\) quickWheel\.press\(\);/);
  assert.match(main, /if \(state === 'playing' && game\) quickWheel\.frame\(now\);/);
  assert.match(main, /if \(state === 'playing' && quickWheel\.open\) \{ quickWheel\.close\(\); break; \}/);
  const { t, setLang } = await import('../src/core/i18n.js');
  for (const lang of ['ru', 'en']) {
    setLang(lang);
    for (const k of ['aMagpies', 'aMagpiesShort', 'bagTorchAfter', 'bagTorchFullShort', 'bagNoTorchShort', 'qwKeep', 'qwStow', 'qwTake', 'qwEmpty', 'qwHint', 'qwHintT', 'qwTorchAfter']) assert.notEqual(t(k), k, `${lang}.${k}`);
    assert.match(t('qwHint'), /\{key\}/);
  }
  setLang('ru');
});
