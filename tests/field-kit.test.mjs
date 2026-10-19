// Fast, deterministic regressions: no browser, microphone permissions or public relays required.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TAPE, CLIP_LIMIT, encodeTape, decodeTape, validClip } from '../src/game/tapeCodec.js';
import { Mic } from '../src/audio/mic.js';
import { ForestTools } from '../src/game/tools.js';
import { Expedition } from '../src/game/expedition.js';
import { FIRETOWER, ZARYA, buildFiretower, buildZarya, buildBinoculars, buildWaymarks } from '../src/world/expedition.js';
import { MeshBuilder } from '../src/world/builder.js';
import { World, LANDMARKS } from '../src/world/world.js';
import { buildTape, buildCrowbar, buildPadlock } from '../src/game/toolModels.js';
import { atlasText, ENTRIES, pageList } from '../src/ui/atlasData.js';

const tone = (hz = 48000) => Float32Array.from({ length: hz * 2 }, (_, i) => 0.17 * Math.sin(i * 2 * Math.PI * 330 / hz));
const context = { createBuffer: (channels, n, hz) => {
  const a = new Float32Array(n);
  return { duration: n / hz, sampleRate: hz, numberOfChannels: channels, getChannelData: () => a };
} };

test('tape is a bounded two-second mono PCM clip, with faded ends and audible content', () => {
  for (const hz of [6000, 44100, 48000, 96000]) {
    const s = encodeTape(tone(hz), hz);
    assert.equal(s.length, 16000);
    assert.equal(s.length, CLIP_LIMIT);
    assert.ok(validClip(s));
    const b = decodeTape(s, context), a = b.getChannelData(0);
    assert.equal(b.duration, 2);
    assert.equal(b.sampleRate, TAPE.hz);
    assert.equal(b.numberOfChannels, 1);
    assert.equal(a[0], 0);
    assert.equal(a.at(-1), 0);
    assert.ok(Math.max(...a) > 0.65);
    assert.ok(a.every(Number.isFinite));
  }
});

test('silence, malformed clips and unsupported source rates are rejected', () => {
  for (const raw of [null, [], new Float32Array(96000), new Float32Array(12000).fill(0.00001)]) assert.equal(encodeTape(raw, 48000), null);
  for (const hz of [0, NaN, Infinity, 5999, 192001]) assert.equal(encodeTape(tone(), hz), null);
  for (const s of [null, '', 3, 'A'.repeat(CLIP_LIMIT - 1), 'A'.repeat(CLIP_LIMIT + 1), '!'.repeat(CLIP_LIMIT), '='.repeat(CLIP_LIMIT)]) {
    assert.equal(validClip(s), false);
    assert.equal(decodeTape(s, context), null);
  }
  const a = tone(); a[1000] = NaN; a[1001] = Infinity;
  assert.ok(decodeTape(encodeTape(a, 48000), context).getChannelData(0).every(Number.isFinite));
});

test('explicit mic capture keeps exactly two seconds, completes once, and cancels without a callback', () => {
  const mic = new Mic(); let done = 0, data;
  mic.engine = { ready: true, ctx: { sampleRate: 48000 } };
  mic.state = 'on'; mic.rec = {};
  assert.equal(mic.beginTape(2, (a, hz) => { done++; data = [a, hz]; }), true);
  for (let k = 0; k < 50; k++) mic._push(new Float32Array(2048).fill(0.12));
  assert.equal(done, 1);
  assert.equal(data[0].length, 96000);
  assert.equal(data[1], 48000);
  assert.equal(mic.tapeCapture, null);
  mic.beginTape(2, () => done++); mic._push(new Float32Array(2048)); mic.cancelTape();
  mic._push(new Float32Array(96000));
  assert.equal(done, 1);
  mic.state = 'off'; assert.equal(mic.beginTape(2, () => done++), false);
});

function kit() {
  const a = { id: 'a', alive: true, x: 0, y: 0, z: 0, yaw: 0, eyeCur: 1.65, forward: () => ({ x: 0, z: -1 }) };
  const b = { ...a, id: 'b' }, players = new Map([['a', a], ['b', b]]), events = [], noises = [];
  const g = {
    auth: true, state: 'play', time: 40, player: a, playerById: (id) => players.get(id),
    input: { peekHeld: false }, stats: {}, mic: { state: 'off', cancelTape() {} },
    escape: { mySeat: -1, load: () => null, seatOf: () => -1 },
    cabinets: { busy: false, locked: () => false, list: [] },
    world: { col: { free: () => true }, terrain: { height: () => 0 }, losBlocked: () => false },
    hud: { popup() {} }, audio: { ready: false }, sync: { ev: (...e) => events.push(e) },
    pulses: { emit() {} }, noise: (...n) => noises.push(n), distToEars: () => 0,
  };
  const tools = Object.create(ForestTools.prototype);
  tools.g = g; tools.askT = 0; tools.views = {};
  tools.recEl = { textContent: '' }; tools.kitEl = { textContent: '' };
  tools.items = ['tape', 'crowbar', 'tape', 'crowbar'].map((kind, i) => ({
    i, kind, mesh: new THREE.Object3D(), state: 'ground', owner: null, x: 0, y: 0, z: 0, yaw: 0,
    rev: 0, charges: TAPE.charges, start: 0, end: 0, noiseT: 0, sound: null, clip: null, buffer: null,
  }));
  return { tools, g, a, b, events, noises };
}
// Only the tiny classList API used by the HUD, not a browser/DOM implementation.
const classes = new Set();
globalThis.document = { body: { classList: {
  remove: (...cs) => cs.forEach((c) => classes.delete(c)),
  toggle: (c, yes) => yes ? classes.add(c) : classes.delete(c),
} } };

test('host pickup arbitration: one owner, one per kind, range, wall, height and alive checks', () => {
  const { tools: k, g, a, b } = kit();
  assert.equal(k.grant('take', 0, a.id), true);
  assert.equal(k.grant('take', 0, b.id), false);
  assert.equal(k.grant('take', 2, a.id), false);
  assert.equal(k.grant('take', 2, b.id), true);
  a.x = 10; assert.equal(k.grant('take', 1, a.id), false); a.x = 0;
  a.y = 16; assert.equal(k.grant('take', 1, a.id), false); a.y = 0;
  g.world.losBlocked = () => true; assert.equal(k.grant('take', 1, a.id), false);
  g.world.losBlocked = () => false; a.alive = false; assert.equal(k.grant('take', 1, a.id), false);
  a.alive = true; a.carrying = 'friend'; assert.equal(k.grant('take', 1, a.id), false); a.carrying = null;
  for (const i of [NaN, null, '1', -1, 1.1, 99]) assert.equal(k.grant('take', i, a.id), false);
  g.auth = false; assert.equal(k.grant('take', 1, a.id), false);
});

test('only the holder can play; delay, two charges, world noise and flat-battery ground state', () => {
  const { tools: k, g, a, b, noises, events } = kit(), clip = encodeTape(tone(), 48000);
  k.grant('take', 0, a.id);
  assert.equal(k.grant('play', 0, b.id, clip), false);
  assert.equal(k.grant('play', 0, a.id, clip), true);
  const it = k.items[0];
  assert.equal(it.owner, null); assert.equal(it.charges, 1); assert.equal(it.start, 43); assert.equal(it.end, 63);
  assert.equal(it.clip, clip); assert.ok(events.some(([n]) => n === 'itape'));
  g.time = 42; k.update(0.05); assert.equal(noises.length, 0);
  g.time = 43; k.update(0.05); assert.equal(noises.length, 1); assert.equal(noises[0][3], 'tape');
  g.time = 63; k.update(20); assert.equal(it.state, 'ground');
  assert.equal(k.grant('take', 0, b.id), true); assert.equal(k.grant('play', 0, b.id), true);
  assert.equal(it.charges, 0); assert.equal(it.state, 'playing');
  g.time = it.end; k.update(21); assert.equal(it.state, 'ground');
  assert.equal(k.grant('take', 0, a.id), true); assert.equal(k.grant('play', 0, a.id), true);
  assert.equal(it.charges, 0); assert.equal(it.state, 'ground');
});

test('a locked cabinet needs the actual nearby owner of a crowbar', () => {
  const { tools: k, g, a, b } = kit();
  const c = { i: 0, locked: true, front: { x: 0, z: 0 }, spec: { y: 0 } };
  g.cabinets.list = [c]; g.cabinets.netUnlock = () => { c.locked = false; };
  assert.equal(k.grant('pry', 0, a.id), false);
  assert.equal(k.grant('take', 1, a.id), true);
  assert.equal(k.grant('pry', 0, b.id), false);
  a.x = 10; assert.equal(k.grant('pry', 0, a.id), false); a.x = 0;
  assert.equal(k.grant('pry', 0, a.id), true);
  assert.equal(c.locked, false);
  assert.equal(k.grant('pry', 0, a.id), false);
});

test('revisioned snapshots never restore an old owner; downed/disconnected kit drops, not duplicates', () => {
  const { tools: k, g, a } = kit();
  k.grant('take', 0, a.id); const held = k.pack(k.items[0]);
  k.dropFor(a.id, 6, 7);
  const dropped = k.pack(k.items[0]);
  k.apply(held);
  assert.deepEqual(k.pack(k.items[0]), dropped);
  assert.equal(k.tapeHeld, null);
  a.x = 6; a.z = 7; k.grant('take', 0, a.id); a.alive = false; k.update(0.05);
  assert.equal(k.items[0].state, 'ground'); assert.equal(k.items[0].owner, null);
  assert.equal(k.items[0].charges, 2);
  assert.equal(g.stats.tapes, 2);
});

test('tools sit on the camp floor instead of sinking into it', () => {
  const { tools: k, g, a } = kit();
  g.world.zarya = { floors: [{ x: 0, z: 0, w: 8, d: 11, y: 0.18 }] };
  assert.equal(k.groundHeight(1, 1), 0.18); assert.equal(k.groundHeight(10, 10), 0);
  k.grant('take', 0, a.id); k.grant('play', 0, a.id);
  assert.ok(Math.abs(k.items[0].y - 0.2) < 1e-6);
});

test('ending/leaving a night stops audio and erases the recorded voice from RAM', () => {
  const { tools: k } = kit(); let stopped = false;
  const it = k.items[0]; it.clip = encodeTape(tone(), 48000); it.buffer = {}; it.sound = { stop: () => { stopped = true; } };
  k.silence(true);
  assert.equal(stopped, true); assert.equal(it.sound, null); assert.equal(it.clip, null); assert.equal(it.buffer, null);
});

test('camp loudspeaker is authoritative, nearby, once per night, and revisioned', () => {
  const { g, a } = kit(), e = Object.create(Expedition.prototype);
  e.g = g; e.C = { y: 0, switch: { x: 0, z: 0 } }; e.speaker = { rev: 0, used: false, end: 0 };
  a.x = 9; assert.equal(e.switchSpeaker(a.id, true), false); a.x = 0;
  g.auth = false; assert.equal(e.switchSpeaker(a.id, true), false); g.auth = true;
  assert.equal(e.switchSpeaker(a.id, true), true); assert.equal(e.speaker.end, g.time + ZARYA.duration);
  assert.equal(e.switchSpeaker(a.id, true), false);
  const active = e.netState();
  assert.equal(e.switchSpeaker(a.id, false), true); e.netMerge(active);
  assert.equal(e.speaker.end, 0); assert.equal(e.speaker.used, true);
  assert.equal(e.switchSpeaker(a.id, true), false);
});

test('both detours have real collision, eight camp cabinets (three locked), fixed loot and traversable doors', () => {
  const w = new World(new THREE.Scene(), new THREE.MeshBasicMaterial());
  buildFiretower(w, FIRETOWER); buildZarya(w, ZARYA); buildWaymarks(w);
  assert.equal(w.firetower.top.y - w.firetower.y, FIRETOWER.deck);
  assert.equal(w.cabinets.filter((c) => c.id.startsWith('zarya')).length, 8);
  assert.equal(w.cabinets.filter((c) => c.locked).length, 3);
  assert.ok(w.cabinets.some((c) => c.loot?.includes('battery')));
  assert.ok(w.col.free(w.firetower.ladder.x, w.firetower.ladder.z, 0.3));
  for (const sx of [-1, 1]) {
    assert.ok(w.col.free(ZARYA.x + sx * 14, ZARYA.z - 0.5, 0.3)); // dorm entrance
    assert.equal(w.col.free(ZARYA.x + sx * 14, ZARYA.z - 11.5, 0.3), false); // back wall
  }
  assert.ok(w.col.free(ZARYA.x, ZARYA.z + 20, 0.3)); // gate
  for (const p of w.props) {
    const b = new MeshBuilder(512); p.build(b); const a = b.toArrays();
    assert.ok(a.count > 0); assert.ok(a.pos.every(Number.isFinite)); assert.ok(a.dat.every(Number.isFinite));
  }
  assert.deepEqual(LANDMARKS.slice(0, 5).map((l) => l.id), ['camp', 'cabin', 'tower', 'stones', 'wreck']);
});

test('shared tool models and all six atlas articles are present in RU and EN', () => {
  for (const make of [buildTape, buildCrowbar, buildPadlock, buildBinoculars]) {
    const a = make().toArrays(); assert.ok(a.count > 0); assert.ok(a.pos.every(Number.isFinite));
  }
  for (const id of ['flashlight', 'tape', 'crowbar', 'binoculars', 'firetower', 'zarya']) {
    assert.ok(ENTRIES[id]?.model); assert.equal(pageList().filter((p) => p.id === id).length, 1);
    for (const lang of ['ru', 'en']) {
      const d = atlasText(lang).entries[id];
      assert.ok(d.name); assert.ok(d.text.length); assert.ok(d.tips.length); assert.ok(d.facts.length);
    }
  }
});
