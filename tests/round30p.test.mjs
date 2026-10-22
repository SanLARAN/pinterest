// 3.0p: the map on the garage wall shows the участок the room is playing.
//
// It was a paper-coloured box with five pencil rings, which on a dark wall read as a blank sheet. Now it is a
// board that prints the real plate of the chosen ground (public/maps/<id>.png). These tests draw it into a
// recording 2D context — no browser, no GPU — and check what actually lands on the canvas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { MAP_BOARD, paintMapBoard } from '../src/ui/mapBoard.js';

function recorder() {
  const calls = { drawImage: [], fillText: [], fillRect: 0, strokeRect: 0, moveTo: 0 };
  const ctx = {
    calls,
    canvas: { width: MAP_BOARD.w, height: MAP_BOARD.h },
    globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: 'left',
    setTransform() {}, beginPath() { calls.moveTo++; }, moveTo() {}, lineTo() {}, stroke() {},
    arc() {}, fill() {},
    fillRect() { calls.fillRect++; },
    strokeRect() { calls.strokeRect++; },
    fillText(text, x, y) { calls.fillText.push({ text: String(text), x, y }); },
    drawImage(img, x, y, w, h) { calls.drawImage.push({ img, x, y, w, h }); },
  };
  return ctx;
}

const plate = (w = 440, h = 560) => ({ naturalWidth: w, naturalHeight: h, complete: true, src: 'maps/x.png' });
const ru = { title: 'ПЛАН УЧАСТКА', ground: 'ЛЕСХОЗ', foot: 'лесхоз · 5 генераторов · детали УАЗа', empty: 'план не отпечатан' };

test('the board prints the real plate, whole, inside its frame', () => {
  const ctx = recorder();
  const out = paintMapBoard(ctx, { id: 'forest', img: plate(), ...ru });
  assert.equal(ctx.calls.drawImage.length, 1, 'the plate is actually drawn, not just framed');
  const d = ctx.calls.drawImage[0];
  // aspect is kept: the plate is portrait and must not be squashed
  assert.ok(Math.abs(d.w / d.h - 440 / 560) < 1e-6, 'the plate keeps its proportions');
  // and it fills its box: the fitted side touches the box, the other is centred
  const box = out.box;
  assert.ok(d.w <= box.w + 1e-6 && d.h <= box.h + 1e-6, 'it fits');
  assert.ok(Math.abs(d.w - box.w) < 0.5 || Math.abs(d.h - box.h) < 0.5, 'it uses the space it has');
  assert.ok(d.x > 0 && d.y > 0 && d.x + d.w < MAP_BOARD.w && d.y + d.h < MAP_BOARD.h, 'nothing hangs off the board');
  assert.equal(out.empty, false);
});

test('the board says which ground it is, and where you would be', () => {
  const forest = recorder();
  paintMapBoard(forest, { id: 'forest', img: plate(), ...ru });
  const bog = recorder();
  paintMapBoard(bog, { id: 'bog', img: plate(), title: ru.title, ground: 'ТОРФЯНИК', foot: '38% под водой · 5 насосов · лебёдка', empty: ru.empty });
  const texts = (r) => r.calls.fillText.map((t) => t.text);
  assert.deepEqual(texts(forest), ['ПЛАН УЧАСТКА', 'ЛЕСХОЗ', 'лесхоз · 5 генераторов · детали УАЗа']);
  assert.deepEqual(texts(bog), ['ПЛАН УЧАСТКА', 'ТОРФЯНИК', '38% под водой · 5 насосов · лебёдка']);
  // the header is at the top, the footnote at the bottom: the plate has the middle to itself
  const [title, ground, foot] = forest.calls.fillText;
  assert.ok(title.y < 60 && ground.y < 60 && foot.y > MAP_BOARD.h - 40, 'header up, footnote down');
});

test('a board with no plate is still a board, and it says so', () => {
  const ctx = recorder();
  const out = paintMapBoard(ctx, { id: 'bog', img: null, title: ru.title, ground: 'ТОРФЯНИК', foot: '—', empty: 'план не отпечатан' });
  assert.equal(ctx.calls.drawImage.length, 0);
  assert.equal(out.empty, true);
  assert.ok(ctx.calls.fillText.some((t) => t.text === 'план не отпечатан'), 'the empty board is not silent');
  assert.ok(ctx.calls.strokeRect >= 1, 'the frame is there');
});

test('the plane on the wall has the canvas proportions, so the print is not stretched', () => {
  const k = MAP_BOARD.plane.w / MAP_BOARD.plane.h;
  const c = MAP_BOARD.w / MAP_BOARD.h;
  assert.ok(Math.abs(k - c) < 0.01, `plane ${k.toFixed(3)} vs canvas ${c.toFixed(3)}`);
  // big enough to read from across the garage, small enough to fit between the window and the calendar
  assert.ok(MAP_BOARD.plane.w >= 0.9 && MAP_BOARD.plane.h >= 1.1, 'a metre tall: readable from across the room');
  assert.ok(-1.02 - MAP_BOARD.plane.w / 2 > -2.05 + 0.1, 'clear of the window');
  assert.ok(-1.02 + MAP_BOARD.plane.w / 2 < 0.25 - 0.2, 'clear of the calendar');
});

test('the garage shows the ground the room is playing, on every machine', () => {
  const garage = readFileSync(new URL('../src/ui/garage.js', import.meta.url), 'utf8');
  assert.match(garage, /_buildMapBoard\(\)/, 'the board is built with the room');
  assert.match(garage, /setMap\(this\.requestedMap \|\| settings\?\.shiftMap/, 'the rules carry the ground to it');
  assert.match(garage, /if \(rules && \(rules\.map === 'bog' \|\| rules\.map === 'forest'\)\) this\.requestedMap = rules\.map/);
  assert.match(garage, /maps\/\$\{want\}\.png/, 'and the plate is the same PNG the solo panel shows');
  assert.match(garage, /intersectObjects\(targets\)/, 'a click on it opens the room settings');
  // the plates are in the build
  for (const id of ['forest', 'bog']) {
    const p = new URL(`../public/maps/${id}.png`, import.meta.url);
    assert.ok(existsSync(p), `public/maps/${id}.png is there`);
    assert.ok(readFileSync(p).length > 20000, `${id}.png is a real plate`);
  }
  // the old paper map is gone from the room mesh: no second, blank "map" on the same wall
  const set = readFileSync(new URL('../src/ui/garageSet.js', import.meta.url), 'utf8');
  assert.ok(!/boxAt\(b, -0\.95, 1\.85, mz/.test(set), 'the paper box is gone from the room mesh');
  assert.ok(!/GK\.MARK, 0, 0, a \+ PI \/ 2/.test(set), 'and so are the five pencil rings');
  // the lobby hands the rules (with the map) to the garage on every change
  const lobbySrc = readFileSync(new URL('../src/ui/lobby.js', import.meta.url), 'utf8');
  assert.match(lobbySrc, /this\.garage\?\.setRules\(r\)/);
});
