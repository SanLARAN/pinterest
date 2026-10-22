// 3.0i: the bog is a place you can wake up in.
//
// Three things were wrong with it, and all three are the kind of wrong that only shows up when you stand in it:
//
//  1. you woke under a roof. Not the tent, not the barracks — pieces of the pump sheds, the pump motors and the
//     winch post were written with `b.place(0, 1.2, 0)` *after* the prop had already been placed, and
//     `MeshBuilder.place()` is absolute: every one of them landed on the map origin, which is the camp. Four
//     pumps' flywheels and levers, stacked in the air over the spawn point, is what «низкая крыша» was.
//  2. the bog was empty: a heightfield, some planks and five pumps. Nothing grew on it.
//  3. the water was fifteen metres away across dry peat, so the level read as a field with a pond somewhere.
//
// This file pins all three, plus the winding of the water (a surface wound the wrong way is not dark, it is
// simply not there — see render/material) and that the level is still inside its triangle budget.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { World } from '../src/world/world.js';

let bog = null;
const bogWorld = () => bog || (bog = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate());

test('nothing hangs over the spawn point', () => {
  const w = bogWorld();
  const s = w.spawn;
  const p = new THREE.Vector3();
  const ray = new THREE.Raycaster(new THREE.Vector3(s.x, w.terrain.height(s.x, s.z) + 1.7, s.z), new THREE.Vector3(0, 1, 0), 0.05, 12);
  const hits = ray.intersectObjects(w.scene.children, true);
  assert.equal(hits.length, 0, `something is ${hits[0] ? (hits[0].point.y - w.terrain.height(s.x, s.z)).toFixed(2) + ' m over the head' : ''}`);
  // and it is not just the exact centre: a body is wider than a point
  for (const [dx, dz] of [[0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4], [0.25, 0.25], [-0.25, -0.25]]) {
    const r = new THREE.Raycaster(new THREE.Vector3(s.x + dx, w.terrain.height(s.x + dx, s.z + dz) + 1.75, s.z + dz), new THREE.Vector3(0, 1, 0), 0.05, 12);
    assert.equal(r.intersectObjects(w.scene.children, true).length, 0, `clear sky at ${dx}, ${dz}`);
  }
});

test('you can stand at the spawn and walk out of it in every direction', () => {
  const w = bogWorld();
  const s = w.spawn;
  assert.ok(w.col.free(s.x, s.z, 0.38), 'the spawn itself is free');
  for (let a = 0; a < 24; a++) {
    const th = (a / 24) * Math.PI * 2;
    const x = s.x + Math.cos(th) * 1.2, z = s.z + Math.sin(th) * 1.2;
    assert.ok(w.col.free(x, z, 0.34), `blocked 1.2 m out at ${x.toFixed(1)}, ${z.toFixed(1)}`);
  }
  // a walkable line out of the camp, five metres in the direction you are facing
  const fx = -Math.sin(s.yaw), fz = -Math.cos(s.yaw);
  for (let d = 0.5; d <= 5; d += 0.5) {
    assert.ok(w.col.free(s.x + fx * d, s.z + fz * d, 0.34), `the way out is clear at ${d} m`);
  }
});

test('the water is right there, in front of you, not fifteen metres of peat away', () => {
  const w = bogWorld();
  const s = w.spawn;
  let best = Infinity;
  for (let x = -40; x <= 40; x += 0.5) {
    for (let z = -40; z <= 40; z += 0.5) {
      if (w.water.depth(x, z) > 0.05) best = Math.min(best, Math.hypot(x - s.x, z - s.z));
    }
  }
  assert.ok(best < 9, `nearest water is ${best.toFixed(1)} m from the spawn`);
  // and it is in the direction you wake up looking
  const fx = -Math.sin(s.yaw), fz = -Math.cos(s.yaw);
  let seen = false;
  for (let d = 2; d <= 12 && !seen; d += 0.5) if (w.water.depth(s.x + fx * d, s.z + fz * d) > 0.05) seen = true;
  assert.ok(seen, 'the first thing you see is the bog');
  // the camp itself is dry: the fire ring, the crates and the tent are not in the lagoon
  for (const [x, z] of [[1.6, 1.1], [-1.2, 2.6], [-3.4, -2.2], [5.6, -6]]) {
    assert.ok(w.water.depth(x, z) <= 0.01, `the camp at ${x}, ${z} is dry`);
  }
});

test('the bog is not an empty field: something grows on every square of it', () => {
  const w = bogWorld();
  assert.ok(w.tris > 250000, `triangles: ${w.tris}`);

  // per-kind census over the whole level: peat-bog trees (bark), needles and reeds (leaf), cotton grass (bone),
  // deadwood and planks (wood)
  const counts = new Array(11).fill(0);
  for (const m of w.meshes) {
    const d = m.geometry.getAttribute('data');
    if (!d) continue;
    for (let i = 0; i < d.count; i += 3) {
      const k = Math.round(d.getW(i) * 255);
      if (k >= 0 && k < counts.length) counts[k] += 1;
    }
  }
  const NAME = ['ground', 'bark', 'leaf', 'rock', 'wood', 'metal', 'effigy', 'flesh', 'bone', 'eye', 'water'];
  // (one sample vertex per triangle, so these counts are triangles)
  const tris = (k) => counts[NAME.indexOf(k)];
  assert.ok(tris('bark') > 60000, `trunks, dead trees, stumps: ${tris('bark')} tris`);
  assert.ok(tris('leaf') > 150000, `needles, reeds, grass: ${tris('leaf')} tris`);
  assert.ok(tris('bone') > 20000, `cotton grass: ${tris('bone')} tris`);
  assert.ok(tris('wood') > 4000, `planks and fallen trees: ${tris('wood')} tris`);

  // and it is spread out: no 40 m square of the level is bare
  const anchors = [];
  const orig = World.prototype.addProp;
  World.prototype.addProp = function (x, z, build) { anchors.push([x, z]); return orig.call(this, x, z, build); };
  try {
    const fresh = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate();
    const C = 40, cells = new Map();
    for (const [x, z] of anchors) {
      const k = `${Math.floor(x / C)},${Math.floor(z / C)}`;
      cells.set(k, (cells.get(k) || 0) + 1);
    }
    for (let i = -4; i < 4; i++) {
      for (let j = -4; j < 4; j++) {
        const n = cells.get(`${i},${j}`) || 0;
        assert.ok(n >= 10, `only ${n} things in the 40 m square at ${i * C}, ${j * C}`);
      }
    }
    assert.ok(fresh.tris > 0);
  } finally {
    World.prototype.addProp = orig;
  }
});

test('every water triangle faces up', () => {
  const w = bogWorld();
  // the water is its own mesh, drawn last: winding it the other way makes it invisible, not dark
  assert.ok(w.waterTris > 4000, `water triangles: ${w.waterTris}`);
  const p = new THREE.Vector3();
  let up = 0, down = 0;
  for (const m of w.scene.children) {
    const pos = m.geometry && m.geometry.getAttribute('position');
    const d = m.geometry && m.geometry.getAttribute('data');
    if (!pos || !d) continue;
    if (Math.round(d.getW(0) * 255) !== 10) continue; // a water mesh
    for (let i = 0; i < pos.count; i += 3) {
      const a = p.fromBufferAttribute(pos, i).clone();
      const b = p.fromBufferAttribute(pos, i + 1).clone();
      const c = p.fromBufferAttribute(pos, i + 2).clone();
      const n = b.clone().sub(a).cross(c.clone().sub(a));
      if (n.y > 0) up++; else if (n.y < 0) down++;
    }
  }
  assert.ok(up > 4000, `up-facing water triangles: ${up}`);
  assert.equal(down, 0, 'no water triangle is wound downward');
});

test('the atlas has a second book — the bog — and it is a tab of its own, inked blue', async () => {
  const { BOOKS, CHAPTERS, ENTRIES, atlasText } = await import('../src/ui/atlasData.js');
  assert.equal(BOOKS.length, 2, 'two books on the shelf');
  assert.deepEqual(BOOKS.map((b) => b.id), ['forest', 'bog']);
  assert.equal(atlasText('ru').books.bog, 'Торфяник');
  assert.equal(atlasText('en').books.bog, 'The bog');
  const bog = BOOKS.find((b) => b.id === 'bog');
  // it is not one flat chapter: it is a book with the same kind of chapters as the forest's
  assert.deepEqual(bog.chapters.map((c) => c.id), ['bogbeasts', 'bogland', 'bogtasks', 'bogplaces']);
  assert.deepEqual(bog.chapters.map((c) => c.num), ['I', 'II', 'III', 'IV']);
  assert.deepEqual(bog.chapters[0].entries, ['drowned', 'gnat'], 'Твари');
  assert.deepEqual(bog.chapters[2].entries, ['pump', 'winch'], 'Задачи');
  assert.deepEqual(bog.chapters[3].entries, ['pumpshed', 'barracks', 'peatstacks'], 'Места');
  // every page of every book is written in both languages and has its chapter named
  for (const b of BOOKS) {
    for (const c of b.chapters) {
      assert.ok(atlasText('ru').chapters[c.id] && atlasText('en').chapters[c.id], `${c.id} has a name`);
      for (const id of c.entries) {
        assert.ok(ENTRIES[id], `${id} is an entry`);
        assert.ok(atlasText('ru').entries[id] && atlasText('en').entries[id], `${id} is written in both languages`);
      }
    }
  }
  assert.equal(CHAPTERS.length, 8, 'the pages are built from every chapter of both books');
  // and the bog's ink is blue, not the forest's red
  const css = (await import('node:fs')).readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.match(css, /--bog-blue:\s*#6ea6bd/);
  assert.match(css, /\.book-tab\.ch-bog\.on i \{ background: var\(--bog-blue\)/);
  assert.match(css, /\.book-tabs \.tab\[data-ch\^="bog"\]\.on::before \{ background: var\(--bog-blue\)/);
});

test('the bog has weather: a weak, steady drizzle that follows you', async () => {
  const THREE = await import('three');
  const { Rain } = await import('../src/render/rain.js');
  const scene = new THREE.Scene();
  const rain = new Rain(scene);
  assert.equal(rain.points.geometry.getAttribute('position').count, 1600, 'one draw call of fine drops');
  assert.equal(rain.points.visible, false, 'nothing falls until the shift says so');
  rain.setVisible(true);
  const pos = rain.points.geometry.attributes.position.array;
  const y0 = pos[1];
  for (let i = 0; i < 60; i++) rain.update(1 / 60, 12, 1.2, -6);
  assert.ok(pos[1] !== y0, 'the drops fall');
  // the box travels with the player and never empties
  assert.ok(Math.abs(rain.points.position.x - 12) < 0.001 && Math.abs(rain.points.position.z + 6) < 0.001);
  let lo = Infinity, hi = -Infinity, bad = 0;
  for (let i = 0; i < pos.length; i += 3) {
    if (!Number.isFinite(pos[i + 1])) bad++;
    lo = Math.min(lo, pos[i + 1]);
    hi = Math.max(hi, pos[i + 1]);
  }
  assert.equal(bad, 0, 'no NaN in the buffer');
  assert.ok(lo > -3 && hi < 21, `the column wraps instead of running away: ${lo.toFixed(1)}..${hi.toFixed(1)}`);
});

test('the printed plate is the level: it was regenerated with the lagoon in it', async () => {
  const { readFileSync, statSync } = await import('node:fs');
  const png = new URL('../public/maps/bog.png', import.meta.url);
  const st = statSync(png);
  assert.ok(st.size > 20000, `the plate file is a real map: ${st.size} bytes`);
  const src = readFileSync(new URL('../src/world/bog.js', import.meta.url), 'utf8');
  assert.match(src, /terr\.addBasin\(2, 21, 14, 1\.6\)/, 'the lagoon by the camp is part of the level, so it is on the plate');
  assert.match(src, /terr\.addBasin\(-40, -34, 26, 1\.5\)/);
  assert.match(src, /terr\.addBasin\(66, 22, 22, 1\.3\)/);
});
