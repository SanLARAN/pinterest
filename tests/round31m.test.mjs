// 3.1m: the forest, balanced toward its real goal. «Суть победы — сделать уазик и уехать; просто переждать ~40 минут
// не = выиграть.» So:
//   • the last dawn is not the win in the forest (it already was not on the bog): it opens THE LAST MORNING —
//     daylight, nothing hunting, the engines and parts as the nights left them, CFG.SHIFT.FINALE s to finish the
//     УАЗ and drive out. It runs out → «СМЕНА КОНЧИЛАСЬ», not a win, no win bonus (only the drive pays it);
//   • one new thing a night: night 1 has no crawler, night 2 brings one, the Angler keeps night 3, the beaten
//     engines move to night 4;
//   • a crawler chase you can live through: 5.4 m/s (your sprint is 5.7), the lunge only in the last 3 m.
// Measured on the real Game below (forest, four nights): the finale runs without a single monster for its whole
// length, the УАЗ can leave during it, and its end is a loss with its own words.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';

const stubEl = () => ({
  style: {}, dataset: {}, hidden: false, textContent: '', innerHTML: '', value: '', src: '', width: 8, height: 8,
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  appendChild() {}, append() {}, prepend() {}, removeChild() {}, remove() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  setAttribute() {}, getAttribute: () => null, removeAttribute() {}, querySelector: () => stubEl(), querySelectorAll: () => [],
  contains: () => false, focus() {}, blur() {}, closest: () => null, matches: () => false,
  getBoundingClientRect: () => ({ x: 0, y: 0, width: 100, height: 100, left: 0, top: 0 }),
  getContext: () => new Proxy({}, { get: (o, k) => (k === 'measureText' ? () => ({ width: 10 }) : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}), set: () => true }),
});
globalThis.document = globalThis.document || {
  documentElement: stubEl(), body: stubEl(), head: stubEl(), getElementById: () => stubEl(), querySelector: () => stubEl(), querySelectorAll: () => [],
  createElement: () => stubEl(), createElementNS: () => stubEl(), addEventListener() {}, removeEventListener() {},
};
globalThis.window = globalThis.window || {
  addEventListener() {}, removeEventListener() {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  matchMedia: () => ({ matches: false, addEventListener() {} }), location: { search: '', href: 'http://localhost/' },
};
globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem() {}, removeItem() {} };

const { CFG, monsterTargets } = await import('../src/core/config.js');
const { World } = await import('../src/world/world.js');
const { Game } = await import('../src/game/game.js');
const { t, setLang } = await import('../src/core/i18n.js');
const anyFn = new Proxy(function () {}, { get: () => anyFn, apply: () => undefined });
function mkGame(mapId) {
  const scene = new THREE.Scene();
  const world = new World(scene, new THREE.MeshBasicMaterial(), mapId).generate();
  const camera = new THREE.PerspectiveCamera(70, 1.6, 0.05, 400);
  return new Game({
    scene, camera, world,
    pulses: { emit() {}, emitStep() {}, update() {}, clear() {}, fronts: () => [] },
    ghosts: { clear() {}, spawn() { return { count: 0 }; }, release() {} }, eyes: { add() {}, clear() {} }, particles: { burst() {}, clear() {} },
    audio: anyFn, input: anyFn, hud: anyFn, radar: anyFn, post: anyFn, shadows: anyFn,
    mic: { update: () => ({ loud: 0, pulse: 0, scream: false }), state: 'off', inIframe: () => false },
  });
}
const frame = (g, dt) => g.update(dt, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('one new thing a night: no crawler on the first, one on the second, sabotage from the fourth', () => {
  for (let s = 0; s <= CFG.SHIFT.NIGHT; s += 30) assert.equal(monsterTargets(s, 1).crawlers, 0, `night 1, ${s}s`);
  assert.equal(monsterTargets(239, 2).crawlers, 0);
  assert.equal(monsterTargets(240, 2).crawlers, 1);
  assert.equal(monsterTargets(0, 3).crawlers, 2);
  assert.equal(CFG.ANGLER.fromDay, 3);
  assert.equal(CFG.GEN_BREAK.fromDay, 4);
  assert.equal(CFG.STRAY.fromDay, 4);
});

test('a crawler chase can be outrun: slower than your sprint, the lunge only at the very end', () => {
  const c = CFG.MONSTER.crawler, P = CFG.PLAYER;
  assert.ok(c.hunt < P.sprint, `${c.hunt} < ${P.sprint}`);
  assert.ok(c.hunt > P.walk, 'but walking away does not work');
  assert.equal(c.lunge, 3);
  assert.ok(c.lock <= 3.5, 'and going quiet loses it in a few seconds');
  assert.match(src('src/game/monsters.js'), /speed = cfg\.hunt \* \(pd < \(cfg\.lunge \|\| 7\) \? 1\.18 : 1\);/, 'the others keep their old reach');
});

test('the forest\'s last dawn opens the last morning: no monsters, the УАЗ can still go, the end is a loss', () => {
  setLang('ru');
  const g = mkGame('forest');
  g.setupSolo(); g.reset({ days: 4 });
  g.day = 4; g.startNight();
  let ended = null;
  g.onEnd = (r) => (ended = r);
  g.time = CFG.SHIFT.NIGHT - 0.05;
  const before = g.score;
  for (let i = 0; i < 6 && g.state === 'play'; i++) frame(g, 0.05);
  assert.equal(g.state, 'dawn');
  assert.ok(g.score - before >= CFG.SCORE.night && g.score - before < CFG.SCORE.win, 'the night bonus, not the win');
  for (let i = 0; i < 400 && g.state === 'dawn'; i++) frame(g, 0.05);
  assert.equal(g.state, 'play');
  assert.equal(g.finale, true);
  assert.equal(ended, null, 'outlasting the shift is not a win');
  // a whole minute of the last morning, frame by frame: nobody comes
  for (let i = 0; i < 600; i++) frame(g, 0.1);
  assert.equal(g.monsters.length, 0, 'nothing hunts in the last morning');
  assert.equal(g.state, 'play');
  assert.ok(Math.abs(g.shiftLeft() - (CFG.SHIFT.FINALE - g.time)) < 1e-6);
  // the watch counts to the end of the shift
  const drawn = [];
  g.fieldView.lcd = new Proxy({}, { get: (o, k) => (k === 'fillText' ? (s) => drawn.push(String(s)) : k === 'measureText' ? () => ({ width: 10 }) : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
  g.fieldView.lcdKey = ''; g.fieldView.drawLCD();
  assert.match(drawn.join(' | '), /ДО КОНЦА СМЕНЫ/);
  // the drive is still allowed (the whole way out belongs to the play state)
  const esc = mkGame('forest');
  esc.setupSolo(); esc.reset({ days: 4 }); esc.day = 4; esc.startNight(); esc.startFinale();
  esc.startEscape(true);
  assert.equal(esc.state, 'escape', 'the УАЗ can leave during the last morning');
  // run the clock out
  g.time = CFG.SHIFT.FINALE - 0.05;
  for (let i = 0; i < 4 && g.state === 'play'; i++) frame(g, 0.05);
  assert.equal(g.state, 'over');
  assert.deepEqual(ended, { won: false, cause: 'shiftEnd' });
});

test('the bog keeps its own finale; the end screen and the words for the forest\'s', () => {
  const game = src('src/game/game.js');
  assert.match(game, /if \(this\.map === 'bog' && this\.winch && !this\.winch\.driven\) \{ this\.winch\.finale\(\); return; \}\n\s+if \(this\.map !== 'bog'\) \{ this\.startFinale\(\); return; \}/);
  assert.match(game, /if \(!this\.finale\) this\.updateDirector\(dt\);/);
  assert.match(game, /if \(!this\.finale && this\.day >= this\.daysTotal && this\.time >= CFG\.SHIFT\.LAST_WAKE && this\.auth\)/);
  const menus = src('src/ui/menus.js');
  assert.match(menus, /shiftEnd: 'deadShiftEnd'/);
  assert.match(menus, /if \(res\.cause === 'shiftEnd' && !won\) \{/);
  assert.match(src('src/main.js'), /if \(res\.cause !== 'shiftEnd'\) highlights\.note/);
  for (const lang of ['ru', 'en']) {
    setLang(lang);
    for (const k of ['finaleDawn', 'finaleBig', 'finaleSmall', 'deadShiftEnd', 'shiftEndSub', 'watchToEnd']) assert.notEqual(t(k), k, `${lang}.${k}`);
    assert.match(t('finaleSmall'), /\{m\}/);
  }
  setLang('ru');
});
