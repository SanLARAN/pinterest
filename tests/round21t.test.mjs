// 2.1t: the pigeon in the doctor's coat (a free set with an idle life of its own), and the solo
// shift length moved off the title screen into its own panel behind ОДНОМУ.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ITEMS, THEMES, item, owns, cleanFit, shapeKey, fitKey, fullSet, wt } from '../src/game/outfit.js';
import { buildSurvivor, poseFur, poseSurvivor } from '../src/game/survivor.js';
import { t, setLang } from '../src/core/i18n.js';

const fit = () => cleanFit({ head: 'pigeonhead', body: 'doctorcoat' });
const verts = (rig) => rig.parts.reduce((n, p) => n + p.arr.count, 0);

test('the pigeon is a free set of two pieces in one theme, and survives a round trip through the wire', () => {
  assert.ok(THEMES.includes('pigeon'));
  assert.ok(ITEMS.head.some((i) => i.id === 'pigeonhead') && ITEMS.body.some((i) => i.id === 'doctorcoat'));
  assert.equal(item('pigeonhead').slot, 'head');
  assert.equal(item('doctorcoat').slot, 'body');
  for (const id of ['pigeonhead', 'doctorcoat']) {
    assert.equal(owns(id), true, 'free: not behind the shop');
    assert.equal(item(id).shop, undefined);
  }
  const f = fit();
  assert.equal(f.head, 'pigeonhead');
  assert.equal(f.body, 'doctorcoat');
  assert.equal(fullSet(f), 'pigeon', 'the two pieces read as one set in the wardrobe');
  assert.equal(cleanFit(f).head, 'pigeonhead', 'a saved outfit keeps it');
  assert.notEqual(shapeKey(f), shapeKey(cleanFit(null)), 'it changes the geometry, not just the dye');
  assert.notEqual(fitKey(f), fitKey(cleanFit({ head: 'pigeonhead', body: 'doctorcoat', hc: ['#112233', '#445566'] })));
  // the hat alone still builds a whole survivor
  assert.equal(cleanFit({ head: 'pigeonhead' }).head, 'pigeonhead');
});

test('the pigeon is named in both languages, and the doctor is a doctor', () => {
  const oldDoc = globalThis.document;
  globalThis.document = { documentElement: {} };
  try {
    setLang('ru');
    assert.equal(wt().theme.pigeon, 'Голубь');
    assert.equal(wt().items.pigeonhead.parts.length, 2);
    assert.match(wt().items.doctorcoat.name, /Халат/);
    setLang('en');
    assert.equal(wt().theme.pigeon, 'Pigeon');
    assert.match(wt().items.doctorcoat.name, /coat/i);
    assert.ok(wt().items.pigeonhead.desc.length > 40);
  } finally {
    setLang('ru');
    globalThis.document = oldDoc;
  }
});

test('the pigeon fits the echo budget and carries the bones its idle life needs', () => {
  const rig = buildSurvivor(fit());
  assert.ok(rig.parts.length > 8);
  assert.ok(verts(rig) < 8192, 'the fullest survivor still fits the echo buffers');
  assert.ok(rig.parts.every((p) => p.arr.pos.every(Number.isFinite)));
  for (const n of ['phead', 'eyes', 'ptail0', 'ptail1', 'pwingL', 'pwingR']) assert.ok(rig.nodes[n], n);
  // the skull rides on the head, the eyes on the skull, the wing feathers on the elbows
  assert.equal(rig.nodes.phead.parent, rig.nodes.head);
  assert.equal(rig.nodes.eyes.parent, rig.nodes.phead);
  assert.equal(rig.nodes.pwingL.parent, rig.nodes.elL);
  assert.equal(rig.nodes.ptail0.parent, rig.nodes.hips);
});

test('a walking pigeon bobs its head against the body; a standing one snaps it round to look', () => {
  const rig = buildSurvivor(fit());
  const ph = rig.nodes.phead;
  // walking: the skull thrusts forward and back, never just sitting there
  const zs = [];
  for (let i = 0; i < 180; i++) { poseSurvivor(rig, i * 0.3, 2.2, false, false); poseFur(rig, 1 / 60, 2.2); zs.push(ph.position.z); }
  assert.ok(Math.max(...zs) - Math.min(...zs) > 0.055, 'the head moves a visible amount');
  assert.ok(Math.max(...zs) < 0.08, 'and stays on the neck');
  // standing: the head scans — over enough seconds it points more than one way
  const seen = new Set();
  for (let i = 0; i < 600; i++) { poseFur(rig, 1 / 60, 0); seen.add(Math.round(ph.rotation.y * 4) / 4); }
  assert.ok(seen.size > 1, 'it looks around');
  assert.ok(Math.max(...[...seen].map(Math.abs)) > 0, 'and not only straight ahead');
});

test('the tail flicks, the wing feathers ruffle and the eye blinks', () => {
  const rig = buildSurvivor(fit());
  const { ptail0, pwingL, eyes } = rig.nodes;
  let tail = 0, wing = 0, blink = 0;
  for (let i = 0; i < 900; i++) {
    poseFur(rig, 1 / 60, 0);
    tail = Math.max(tail, Math.abs(ptail0.rotation.x - 0.12));
    wing = Math.max(wing, Math.abs(pwingL.rotation.z));
    blink = Math.max(blink, 1 - eyes.scale.y);
  }
  assert.ok(tail > 0.15, 'the tail flicks now and then');
  assert.ok(wing > 0.2, 'the feathers ruffle');
  assert.ok(blink > 0.5, 'the eye shuts and opens');
  for (let i = 0; i < 600 && eyes.scale.y < 0.99; i++) poseFur(rig, 1 / 60, 0); // let the last blink finish
  assert.ok(eyes.scale.y <= 1.0001 && eyes.scale.y > 0.95, 'and comes back open');
});

test('the shift length is asked after ОДНОМУ, and the title screen no longer carries the row', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="btnPlay"/);
  assert.match(html, /id="soloPanel"/);
  assert.doesNotMatch(html, /id="soloDays"/, 'the days row left the menu');
  assert.doesNotMatch(html, /class="shift-days"/);
  for (const n of [2, 4, 6]) assert.match(html, new RegExp(`class="solo-night" type="button" data-days="${n}"`));
  const menus = readFileSync(new URL('../src/ui/menus.js', import.meta.url), 'utf8');
  assert.match(menus, /click\('btnPlay', \(\) => this\.openSolo\(\)\)/);
  assert.match(menus, /openSolo\(\)/);
  assert.match(menus, /settings\.shiftDays = \+b\.dataset\.days/, 'the card you press is the shift');
});

test('the title screen never opens the gates: only the lobby does', () => {
  const garage = readFileSync(new URL('../src/ui/garage.js', import.meta.url), 'utf8');
  assert.match(garage, /pointer\(clientX, clientY, on = true, gates = true\)/);
  assert.match(garage, /const over = gates && on/);
  const home = readFileSync(new URL('../src/ui/garageHome.js', import.meta.url), 'utf8');
  assert.match(home, /pointer\(e\.clientX,e\.clientY,true,false\)/, 'the menu passes gates: false');
});
