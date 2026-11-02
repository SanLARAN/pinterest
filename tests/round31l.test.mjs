// 3.1l: «переделай часы на TAB, они на часы не похожи». The face was a tall card of small text (a phone more than
// a watch): HUSH / WR 50M / ILLUMINATOR, then nine lines of readouts and the task wrapped over three lines. Now a
// digital watch: the time in seven big slanted segments with the unlit ones faintly behind them, what it counts to
// (to dawn / to dark), two short readout lines, the task walking through one line a character at a time, and at
// night the window glows like an electroluminescent backlight. The canvas has the face's own proportions.
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
  getContext: () => new Proxy({}, { get: (o, k) => (k === 'measureText' ? () => ({ width: 10 }) : k.startsWith?.('create') ? () => ({ addColorStop() {} }) : () => {}), set: () => true }),
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

const { drawDigit, marquee } = await import('../src/game/fieldView.js');
const { World } = await import('../src/world/world.js');
const { Game } = await import('../src/game/game.js');
const { t, setLang } = await import('../src/core/i18n.js');
const anyFn = new Proxy(function () {}, { get: () => anyFn, apply: () => undefined });
function mkGame(mapId) {
  const scene = new THREE.Scene();
  const world = new World(scene, new THREE.MeshBasicMaterial(), mapId).generate();
  const camera = new THREE.PerspectiveCamera(70, 1.6, 0.05, 400);
  const game = new Game({
    scene, camera, world,
    pulses: { emit() {}, emitStep() {}, update() {}, clear() {}, fronts: () => [] },
    ghosts: { clear() {}, spawn() { return { count: 0 }; }, release() {} }, eyes: { add() {}, clear() {} }, particles: { burst() {}, clear() {} },
    audio: anyFn, input: anyFn, hud: anyFn, radar: anyFn, post: anyFn, shadows: anyFn,
    mic: { update: () => ({ loud: 0, pulse: 0, scream: false }), state: 'off', inIframe: () => false },
  });
  return game;
}
// a canvas that remembers what was written and which colour every filled shape had
function recorder() {
  const out = { text: [], fills: [] };
  let fill = '';
  const ctx = new Proxy({}, {
    get: (o, k) => (k === 'fillText' ? (s) => out.text.push(String(s)) : k === 'fill' ? () => out.fills.push(fill)
      : k === 'measureText' ? () => ({ width: 10 }) : String(k).startsWith('create') ? () => ({ addColorStop() {} }) : () => {}),
    set: (o, k, v) => { if (k === 'fillStyle') fill = v; return true; },
  });
  return { ctx, out };
}

test('seven segments: each digit lights its own and leaves the rest as a faint ghost', () => {
  const want = { 0: 6, 1: 2, 7: 3, 8: 7, 4: 4 };
  for (const [d, lit] of Object.entries(want)) {
    const { ctx, out } = recorder();
    drawDigit(ctx, d, 0, 0, 78, 128, 15, 'ON', 'GHOST');
    assert.equal(out.fills.length, 7, `${d}: all seven are drawn`);
    assert.equal(out.fills.filter((f) => f === 'ON').length, lit, `${d}: lit segments`);
  }
});

test('the task walks through one line a character at a time, and loops', () => {
  assert.equal(marquee('КОРОТКО', 30, 99), 'КОРОТКО', 'a short task just stands');
  const long = 'ГЕНЕРАТОР В ЛАГЕРЕ ЗАГЛОХ — НАЙДИ, ЧЕМ ЕГО ЗАПРАВИТЬ';
  const a = marquee(long, 30, 0), b = marquee(long, 30, 1);
  assert.equal(a.length, 30);
  assert.equal(b, a.slice(1) + long[30], 'one character per step');
  const period = (long + '   ·   ').length;
  assert.equal(marquee(long, 30, period), a, 'and round again');
});

test('the face: the time is segments, the canvas is the face\'s shape, the words say what the digits count to', () => {
  setLang('ru');
  const game = mkGame('forest');
  game.setupSolo(); game.reset({ days: 4 }); game.startNight();
  const fv = game.fieldView;
  const { ctx, out } = recorder();
  fv.lcd = ctx; fv.lcdKey = '';
  game.objectives.count = 2;
  fv.drawLCD();
  const all = out.text.join(' | ');
  assert.match(all, /ГЕН 2\/5/);
  assert.match(all, /УАЗ 0\/4/);
  assert.match(all, /ДО РАССВЕТА/);
  assert.match(all, /НОЧЬ 1\/4/);
  assert.doesNotMatch(all, /\d\d:\d\d/, 'the time is not typed: it is drawn in segments');
  assert.ok(out.fills.length >= 28, 'four digits of seven segments');
  const src = readFileSync(new URL('../src/game/fieldView.js', import.meta.url), 'utf8');
  assert.match(src, /c\.width=512;c\.height=536;/);
  assert.ok(Math.abs(512 / 536 - 0.143 / 0.15) < 0.01, 'no stretch on the .143 × .15 face');
  assert.match(src, /new THREE\.PlaneGeometry\(\.143,\.15\)/);
  // by day the same face counts to dark, and the window is not backlit
  game.state = 'morning'; game.morningT = 30; fv.lcdKey = '';
  const day = recorder(); fv.lcd = day.ctx; fv.drawLCD();
  assert.match(day.out.text.join(' | '), /ДО ТЕМНОТЫ/);
  assert.match(src, /night=state!=='morning'/);
  for (const lang of ['ru', 'en']) { setLang(lang); for (const k of ['watchToDawn', 'watchToDusk']) assert.notEqual(t(k), k, `${lang}.${k}`); }
  setLang('ru');
});
