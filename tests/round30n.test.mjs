// 3.0n: the water answers. A boot, a friend's boot, a stone, the Дrowned — every one of them pushes the
// surface, and the ring travels. The field is plain numbers (game/waves.js) and the shader reads exactly those
// numbers, so this checks the maths, what the world hands it, and that the shader is wired to the same slots.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { WaveField, WAVES, waterKick } from '../src/game/waves.js';
import { shared, WAVE_SLOTS, createWorldMaterial } from '../src/render/sonar.js';

globalThis.document ||= {
  body: { classList: { add() {}, remove() {} } },
  createElement: () => ({
    width: 0, height: 0,
    getContext: () => ({
      createRadialGradient: () => ({ addColorStop() {} }),
      fillRect() {}, set fillStyle(v) {}, get fillStyle() { return ''; },
    }),
  }),
};

let bog = null;
const bogWorld = () => bog || (bog = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate());
// (5.0a) a knee-deep spot out in the Mire's bog (off the causeway), and a dry one at the gate
const flooded = { x: 120, z: -120 };
const dry = { x: 80, z: -170 };

test('a ring is nothing until it arrives, loudest at its crest, and then it is spent', () => {
  const f = new WaveField();
  const t0 = 100;
  f.add(0, 0, { time: t0, amp: 0.2 });
  assert.ok(Math.abs(f.at(0, 0, t0) - 0.2) < 1e-9, 'at the origin it starts as the amplitude');
  assert.equal(f.at(0, 0, t0 + 15), 0, 'and it is gone long before that');
  const arrive = 2 / WAVES.speed; // the front needs this long to cross 2 m
  assert.equal(f.at(2, 0, t0 + arrive * 0.3), 0, 'the water 2 m away has not moved yet');
  let peak = 0, at = 0;
  for (let t = arrive; t < arrive + 0.6; t += 0.01) { const h = Math.abs(f.at(2, 0, t0 + t)); if (h > peak) { peak = h; at = t; } }
  assert.ok(peak > 0.05 && peak < 0.2, `the crest passes 2 m at about ${arrive.toFixed(2)} s (${peak.toFixed(3)} at ${at.toFixed(2)} s)`);
  // ...and it only lives in a band around the front
  assert.ok(Math.abs(f.at(0.2, 0, t0 + 2.4)) < 0.02, 'inside the ring, the water has already settled');
});

test('rings add up, and the field forgets the ones that ran out', () => {
  const f = new WaveField();
  f.add(0, 0, { time: 0, amp: 0.1, speed: 10, ring: 9 });
  f.add(0, 0, { time: 0, amp: 0.05, speed: 10, ring: 9 });
  const both = f.at(3, 0, 0.3);
  const one = (() => { const g = new WaveField(); g.add(0, 0, { time: 0, amp: 0.1, speed: 10, ring: 9 }); return g.at(3, 0, 0.3); })();
  assert.ok(Math.abs(both - one * 1.5) < 1e-6, 'two rings on the same spot are their sum');
  assert.equal(f.update(0.3), 2);
  assert.equal(f.update(WAVES.life + 0.01), 0, 'after their life they are gone');
  assert.equal(f.at(3, 0, WAVES.life + 0.01), 0);
  // and the field never runs out of slots: the ninth ring takes the oldest one
  for (let i = 0; i < 20; i++) f.add(i, 0, { time: 0, amp: 0.1 });
  assert.equal(f.slots.filter((s) => s.live).length, WAVES.slots);
});

test('the field hands the shader exactly the slots the shader declares', () => {
  assert.equal(WAVES.slots, WAVE_SLOTS, 'the field and the uniforms must not drift apart');
  const f = new WaveField();
  f.add(4, -3, { time: 2, amp: 0.08, speed: 2.7, ring: 6, decay: 1.5, kind: 1 });
  assert.equal(f.write(shared), WAVE_SLOTS);
  assert.deepEqual(shared.uWv.value[0].toArray(), [4, -3, 2, 0.08]);
  assert.deepEqual(shared.uWvR.value[0].toArray(), [2.7, 6, 1.5, 1]);
  f.clear();
  f.write(shared);
  assert.equal(shared.uWv.value[0].w, 0, 'a cleared slot is silent');
  const mat = createWorldMaterial();
  assert.ok(/uniform vec4 uWv\[/.test(mat.vertexShader), 'the vertex shader reads the rings');
  assert.ok(/waveHeight/.test(mat.vertexShader));
  assert.ok(/if \(kd == 10\)/.test(mat.vertexShader.replace(/\s+/g, ' ')), 'and only the water is displaced');
  assert.ok(/vWave/.test(mat.fragmentShader), 'the fragment shader sees the crest');
});

test('wet ground takes the push; dry peat and the planks do not', () => {
  const w = bogWorld();
  const f = new WaveField();
  assert.ok(w.water.depth(flooded.x, flooded.z) > 0.4, 'the проезд is the flooded part');
  assert.ok(w.water.depth(dry.x, dry.z) < 0.05, 'and this is the dry bank');
  assert.equal(waterKick(f, w, dry.x, dry.z, 0, 'step'), 0, 'a boot on dry peat moves nothing');
  assert.equal(f.slots.filter((s) => s.live).length, 0);
  const amp = waterKick(f, w, flooded.x, flooded.z, 0, 'step');
  assert.ok(amp > 0, 'a boot in the flood does');
  assert.equal(f.slots.filter((s) => s.live).length, 1);
  // the planks are dry: they creak, they do not ripple
  const walk = w.walks?.[0];
  if (walk) {
    const px = (walk.a?.[0] ?? walk.x ?? 0), pz = (walk.a?.[2] ?? walk.z ?? 0);
    if (w.onWalk(px, pz, 0)) assert.equal(waterKick(f, w, px, pz, 0, 'step'), 0, 'planks never move the water');
  }
  // the same boot, heavier things: the depth decides, and a body is bigger than a person's foot
  f.clear();
  const stepAmp = waterKick(f, w, flooded.x, flooded.z, 0, 'step');
  f.clear();
  const bruteAmp = waterKick(f, w, flooded.x, flooded.z, 0, 'brute');
  assert.ok(bruteAmp > stepAmp * 2, 'the Дrowned shoves harder than a boot');
  f.clear();
  const tapAmp = waterKick(f, w, flooded.x, flooded.z, 0, 'tap');
  assert.ok(tapAmp < stepAmp, 'and a crouched toe is the quietest');
  // a step's ring is still readable a second after the boot went in — that is the whole point of it
  f.clear();
  const a = waterKick(f, w, flooded.x, flooded.z, 0, 'step');
  let alive = 0;
  for (let t = 0.8; t <= 1.2; t += 0.05) alive = Math.max(alive, Math.abs(f.at(flooded.x + WAVES.speed * t, flooded.z, t)));
  assert.ok(alive > 0.005, `the ring is still there after a second (${alive.toFixed(3)} m, amp ${a.toFixed(3)})`);
});

test('the surface is fine enough to carry a swell, and it is one flat plate underneath', () => {
  const w = bogWorld();
  const LEVEL = w.water.level;
  assert.ok(w.waterTris > 15000, `the water grid is 2 m cells now (${w.waterTris} triangles)`);
  const mesh = w.meshes.find((m) => m.userData.water);
  const pos = mesh.geometry.attributes.position;
  let flat = true;
  for (let i = 1; i < pos.count; i += 97) if (Math.abs(pos.getY(i) - LEVEL) > 1e-4) flat = false;
  assert.ok(flat, 'every water vertex is built at LEVEL: the shape is the shader\'s job');
});

test('the game owns a field and ticks it with the pulses', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/game/game.js', import.meta.url), 'utf8');
  assert.ok(/this\.waves = new WaveField\(\)/.test(src), 'a game has one water field');
  assert.ok(/_waterFrame\(\)/.test(src));
  assert.ok((src.match(/this\._waterFrame\(\)/g) || []).length >= 3, 'ticked wherever the pulses are');
  assert.ok(/waterKick\(this\.waves, this\.world, p\.x, p\.z/.test(src), 'my own boot');
  assert.ok(/waterKick\(this\.waves, this\.world, h\.x, h\.z/.test(src), 'a stone thrown into it');
  const remote = readFileSync(new URL('../src/game/remote.js', import.meta.url), 'utf8');
  assert.ok(/waterKick\(this\.game\.waves/.test(remote), 'a friend walking through it');
});

test('the lobby lets the host pick the участок, and only the host', async () => {
  const { readFileSync } = await import('node:fs');
  const coop = readFileSync(new URL('../src/net/coop.js', import.meta.url), 'utf8');
  const setMap = coop.slice(coop.indexOf('  setMap(value) {'), coop.indexOf('  _broadcastRoster() {'));
  assert.ok(/!this\.isHost/.test(setMap) && /phase !== 'lobby'/.test(setMap), 'a guest cannot move the room');
  assert.ok(/cleanLobbyRules\(\{ \.\.\.this\.rules, map \}\)/.test(setMap), 'and it goes through the same rules as days');
  assert.ok(/settings\.shiftMap = map/.test(setMap), 'the host remembers where it played');
  const lobby = readFileSync(new URL('../src/ui/lobby.js', import.meta.url), 'utf8');
  assert.ok(/data-lmap="forest"/.test(lobby) && /data-lmap="bog"/.test(lobby), 'both grounds are offered');
  assert.ok(/this\.coop\.setMap\(button\.dataset\.lmap\)/.test(lobby), 'and the buttons are wired');
  globalThis.document.documentElement ||= { lang: 'ru' };
  const { t, setLang } = await import('../src/core/i18n.js');
  for (const lang of ['ru', 'en']) {
    setLang(lang);
    assert.ok(t('ruleMapHost').length > 20, `${lang}: the host is told what picking a ground does`);
    assert.ok(t('ruleMapGuest').length > 10, `${lang}: the guest is told who can`);
  }
  setLang('en');
  assert.notEqual(t('ruleMapHost'), 'ruleMapHost', 'the key exists in both languages');
});
