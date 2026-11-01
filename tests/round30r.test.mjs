// 3.0h: the участок actually loads.
// 3.0r: the bog speaks its own words, and its stand-ins hold data, not only methods.
//
// The audit after 3.0q stood in the torfyanik and read the screen: «у генератора лежит тело», «генераторы 2/5»,
// «УАЗ 0/4», «ПРОЧЬ ИЗ ЛЕСА… лес остаётся позади» — about a ground with pumps, a winch and no forest. And seven
// English lines carried Russian words («the проезд», «the участок»). Separately, the bog's flashlight stand-in had
// no `items`, so a torch claim reaching the host threw inside `hostClaim` (`undefined[a]`). This holds all three.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
// ---------------------------------------------------------------- the smallest DOM a Game touches
const stubEl = () => ({
  style: {}, dataset: {}, hidden: false, textContent: '', innerHTML: '', value: '', src: '',
  width: 8, height: 8,
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  appendChild() {}, append() {}, prepend() {}, removeChild() {}, remove() {},
  addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  setAttribute() {}, getAttribute: () => null, removeAttribute() {},
  querySelector: () => stubEl(), querySelectorAll: () => [],
  contains: () => false, focus() {}, blur() {}, closest: () => null, matches: () => false,
  getBoundingClientRect: () => ({ x: 0, y: 0, width: 100, height: 100, left: 0, top: 0 }),
  getContext: () => ({
    fillRect() {}, clearRect() {}, strokeRect() {}, drawImage() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, stroke() {}, fill() {}, fillText() {}, arc() {}, ellipse() {},
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, setTransform() {},
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => null,
    measureText: () => ({ width: 10 }),
    getImageData: () => ({ data: new Uint8Array(4) }),
    putImageData() {},
  }),
});
globalThis.document = globalThis.document || {
  documentElement: stubEl(), body: stubEl(), head: stubEl(),
  getElementById: () => stubEl(), querySelector: () => stubEl(), querySelectorAll: () => [],
  createElement: () => stubEl(), createElementNS: () => stubEl(),
  addEventListener() {}, removeEventListener() {},
};
globalThis.window = globalThis.window || {
  addEventListener() {}, removeEventListener() {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  matchMedia: () => ({ matches: false, addEventListener() {} }), location: { search: '', href: 'http://localhost/' },
};
globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem() {}, removeItem() {} };

const { World } = await import('../src/world/world.js');
const { Game } = await import('../src/game/game.js');

// a headset for the Game: everything it is handed at boot, silenced
const anyFn = new Proxy(function () {}, { get: () => anyFn, apply: () => undefined });
function mkGame(mapId, input = anyFn) {
  const scene = new THREE.Scene();
  const world = new World(scene, new THREE.MeshBasicMaterial(), mapId).generate();
  const camera = new THREE.PerspectiveCamera(70, 1.6, 0.05, 400);
  const game = new Game({
    scene, camera, world,
    pulses: { emit() {}, emitStep() {}, update() {}, clear() {}, fronts: () => [] },
    ghosts: { clear() {}, spawn() { return { count: 0 }; }, release() {} },
    eyes: { add() {}, clear() {} },
    particles: { burst() {}, clear() {} },
    audio: anyFn, input, hud: anyFn, radar: anyFn, post: anyFn, shadows: anyFn,
    // the mic answers every frame: a mouth that is silent, not a proxy that returns nothing
    mic: { update: () => ({ loud: 0, pulse: 0, scream: false }), state: 'off', inIframe: () => false },
  });
  return { game, world, scene };
}

const frame = (game, dt = 1 / 60) => game.update(dt, { events: [], move: { x: 0, z: 0 }, look: { dx: 0, dy: 0 } });

const { t, setLang } = await import('../src/core/i18n.js');
const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
const FOREST = /генератор|лес(?![а-я]*ниц)|лесхоз|generator|forest/i;

// a HUD that remembers what it was told to say
function talkingHud() {
  const said = [];
  const rec = (...a) => { for (const x of a) if (typeof x === 'string') said.push(x); return hud; };
  const hud = new Proxy({}, { get: (o, k) => (k === 'said' ? said : rec) });
  return hud;
}

// every locale's own strings, comments stripped (the ru and en tables are the two halves of the file)
function localeLines(which) {
  const s = src('core/i18n.js');
  const ru = s.indexOf('  ru: {'), en = s.indexOf('  en: {'), end = s.indexOf('export function setLang');
  return s.slice(which === 'ru' ? ru : en, which === 'ru' ? en : end).split('\n')
    .map((l, i) => ({ line: l.replace(/^\s*\/\/.*$/, '').replace(/\s\/\/ .*$/, ''), i }));
}

test('the English table has no Russian words in it', () => {
  const bad = localeLines('en').filter(({ line }) => /[\u0400-\u04FF]/.test(line)).map(({ line }) => line.trim().slice(0, 70));
  assert.deepEqual(bad, []);
});

test('every bog twin exists in both languages and says nothing about generators or the forest', () => {
  const keys = ['tutUseBog', 'morningGenBog', 'mateStartedBog', 'genRestartedBog', 'aGenBrokenBog', 'watchGensBog',
    'watchFindBog', 'escTitleBog', 'escKickerBog', 'escSubBog', 'pumps', 'watchWinch'];
  for (const lang of ['ru', 'en']) {
    setLang(lang);
    for (const k of keys) {
      const v = t(k);
      assert.ok(localeLines(lang).some(({ line }) => line.trimStart().startsWith(`${k}:`)), `${lang}.${k} is missing`);
      assert.doesNotMatch(v, FOREST, `${lang}.${k}: «${v}»`);
      if (lang === 'en') assert.doesNotMatch(v, /[\u0400-\u04FF]/, `en.${k}: «${v}»`);
    }
  }
  setLang('ru');
  // the twins are templated like the forest lines they replace
  assert.match(t('mateStartedBog'), /\{name\}/);
  assert.match(t('aGenBrokenBog'), /\{site\}/);
});

test('starting a pump on the bog says «насос», and the forest still says «генератор»', () => {
  setLang('ru');
  for (const [map, want, not] of [['bog', /насос/, /генератор/], ['forest', /генератор/, /насос/]]) {
    const { game } = mkGame(map);
    const hud = talkingHud();
    game.setupSolo(); game.reset({ days: 4 }); game.startNight();
    game.hud = hud;
    const g = game.objectives.gens[0];
    g.paid = true; // a restart: the popup is the words, not the points
    game.onGeneratorStarted(g, 1);
    game.onGenBroken(g, true);
    const said = hud.said.join(' | ');
    assert.match(said, want, `${map}: ${said}`);
    assert.doesNotMatch(said, not, `${map}: ${said}`);
  }
});

test('the wristwatch on the bog counts pumps and the winch cable, not generators and car parts', () => {
  setLang('ru');
  const { game } = mkGame('bog');
  game.setupSolo(); game.reset({ days: 4 }); game.startNight();
  const drawn = [];
  const ctx = new Proxy({}, { get: (o, k) => (k === 'fillText' ? (s) => drawn.push(String(s)) : k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  game.fieldView.lcd = ctx;
  game.fieldView.lcdKey = '';
  game.winch.p = 0.4;
  game.fieldView.drawLCD();
  const all = drawn.join(' | ');
  assert.match(all, /НАС \d\/5/);
  assert.match(all, /ТРОС 40%/);
  assert.doesNotMatch(all, /УАЗ \d\/4/);
  assert.doesNotMatch(all, /ГЕН \d/);
});

test('the call sites pick the bog line by map (tutorial, morning, pause, end screen)', () => {
  const game = src('game/game.js'), menus = src('ui/menus.js'), main = src('main.js'), hud = src('ui/hud.js');
  assert.match(game, /t\(this\.map === 'bog' \? 'tutUseBog' : 'tutUse'\)/);
  assert.match(game, /t\(this\.map === 'bog' \? 'morningGenBog' : 'morningGen'\)/);
  assert.match(main, /t\(game\.map === 'bog' \? 'pumps' : 'generators'\)/);
  assert.match(main, /menus\.showOver\(\{ map: game\.map, \.\.\.res \}/);
  assert.match(hud, /t\(g\.map === 'bog' \? 'pumps' : 'generators'\)/);
  // the end screen: the bog's escape words, no «детали УАЗа» row on a ground that has no parts
  assert.match(menus, /const B = \(k\) => t\(bog \? k \+ 'Bog' : k\)/);
  assert.match(menus, /B\('escTitle'\)/);
  assert.match(menus, /B\('escSub'\)/);
  assert.match(menus, /stats\.gens >= 5 && !bog/);
  // and the winch's own ending already tells the end screen where it happened
  assert.match(src('game/winch.js'), /map: 'bog'/);
});

test('the bog flashlight stand-in holds data: a torch claim is refused, not thrown', () => {
  const { game } = mkGame('bog');
  assert.equal(game.torch.inert, true);
  assert.deepEqual(game.torch.items, []);
  assert.equal(game.torch.spare, 0);
  assert.doesNotThrow(() => {
    const ok = game.inventory.hostClaim(game.player.id, 'torch', 0, 0);
    assert.equal(ok, false);
  });
  assert.doesNotThrow(() => game.inventory.applyClaim({ id: 'torch:0:0', pid: 'guest', source: 'torch', a: 0, b: 0 }));
  assert.equal(game.torch.has, false);
});
