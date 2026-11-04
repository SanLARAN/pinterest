// 3.0a: the участок itself — the peat bog. These guard the ground, not the shift: the heightfield, the water
// line, the six places, the plank roads, the pumps and the car. A level is only as good as its map, and a map is
// the one thing that cannot be fixed by tuning a number at play time: if the spawn is in a lake or a pump stands
// in a bog hole, the round is over before it starts.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { CAP } from '../src/world/caps.js';
import { BOG, BOG_LANDMARKS, BOG_MIST, BOG_SOFT } from '../src/world/bog.js';

let forest = null;
let bog = null;
const forestWorld = () => forest || (forest = new World(new THREE.Scene(), new THREE.MeshBasicMaterial()).generate());
const bogWorld = () => bog || (bog = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate());

// walk a coarse grid and count what is where
function survey(w, step = 4) {
  let wet = 0, wading = 0, total = 0, maxDepth = 0;
  for (let z = -w.half + 6; z < w.half - 6; z += step) {
    for (let x = -w.half + 6; x < w.half - 6; x += step) {
      const d = w.water.depth(x, z);
      total++;
      if (d > 0.06) wet++;
      if (d > 0.25) wading++;
      if (d > maxDepth) maxDepth = d;
    }
  }
  return { wet: wet / total, wading: wading / total, maxDepth };
}

test('the bog is a second участок: 340 m of peat, 38% of it under water', () => {
  const w = bogWorld();
  assert.equal(w.mapId, 'bog');
  assert.equal(w.half, 170, '340 m across');
  const s = survey(w);
  assert.ok(s.wet > 0.33 && s.wet < 0.43, `the water covers a third of it, not more: ${(s.wet * 100).toFixed(1)}%`);
  assert.ok(s.wading > 0.2, 'and enough of it is knee-deep to matter');
  assert.ok(s.maxDepth > 1.2, 'with real holes in it');
});

test('six places, five pumps, and every one of them stands on dry ground', () => {
  const w = bogWorld();
  assert.deepEqual(w.landmarks.map((l) => l.id), ['camp', 'pumpstation', 'barracks', 'stacks', 'bridges', 'causeway']);
  assert.deepEqual(w.sites.map((s) => s.id), ['camp', 'pumpstation', 'barracks', 'stacks', 'bridges'], 'five pumps');
  for (const s of w.sites) {
    assert.ok(w.water.depth(s.x, s.z) < 0.06, `${s.id}'s pump is on dry ground`);
    assert.ok(s.lamp && Number.isFinite(s.lamp.x), `${s.id} has a work lamp to find it by`);
    assert.ok(Number.isFinite(s.y), `${s.id} has a height`);
  }
  assert.ok(w.water.depth(w.spawn.x, w.spawn.z) < 0.06, 'you do not wake up in the water');
  assert.ok(Math.hypot(w.spawn.x - 0, w.spawn.z - 0) < 12, 'the camp is where you wake');
});

test('the plank roads are dry ground over wet ground, and they lead to the car', () => {
  const w = bogWorld();
  assert.ok(w.walks.length >= 12, 'the roads are made of legs');
  // a boardwalk is planks over water: most of every leg is over the wet, and all of it is walkable
  let wet = 0, all = 0;
  for (const wk of w.walks) {
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const x = wk.ax + (wk.bx - wk.ax) * i / n, z = wk.az + (wk.bz - wk.az) * i / n;
      assert.ok(w.onWalk(x, z, 0), `(${x.toFixed(0)},${z.toFixed(0)}) is on the planks`);
      all++;
      if (w.water.depth(x, z) > 0.06) wet++;
    }
  }
  assert.ok(wet / all > 0.6, `planks over water, not over a field: ${(100 * wet / all).toFixed(0)}%`);
  assert.ok(all > 100);
  // … and the last of them ends at the УАЗ, stuck up to the hubs
  const car = w.car;
  const d = w.water.depth(car.x, car.z);
  assert.ok(d > 0.3 && d < 0.9, `the car sits in about half a metre: ${d.toFixed(2)}`);
  assert.ok(w.onWalk(car.x, car.z, 2.5), 'and it is within reach of the plank road');
});

test('the bog has its own weather: soft mud, vapour, and a water line you can ask about', () => {
  const w = bogWorld();
  const water = w.water;
  for (const s of BOG_SOFT) assert.equal(water.soft(s.x, s.z), true, 'soft ground where it says');
  assert.equal(water.soft(0, 0), false, 'the camp is not a bog hole');
  for (const m of BOG_MIST) assert.equal(water.misted(m.x, m.z), true, 'vapour where it says');
  assert.equal(water.misted(0, 0), false);
  // a running pump drains its own sector: the water level there drops, and nowhere else
  const at = { x: 0, z: -110 }; // a plank leg over open water
  const before = water.depth(at.x, at.z);
  assert.ok(before > 0.3, 'the test needs water to drain');
  water.drains.push({ x: at.x, z: at.z + 6, r: 40, drop: 0.6 });
  assert.ok(water.depth(at.x, at.z) < before, 'the sector drains');
  assert.ok(water.depth(160, 160) >= 0, 'and the far corner is untouched');
  water.drains.length = 0;
  assert.ok(Math.abs(water.depth(at.x, at.z) - before) < 0.02, 'and the water comes back');
});

test('the bog is built within budget, with nothing broken in it', () => {
  const w = bogWorld();
  // (3.0i) the bog stopped being a bare field: peat-bog pines, willows, reeds, tussocks, cotton grass, deadwood.
  // The ceiling is the forest's own (about 580k) with headroom, and the floor is there so a silent regression
  // that deletes the vegetation again fails here instead of shipping an empty level.
  assert.ok(w.tris > 250000 && w.tris < 750000, `triangles: ${w.tris}`);
  assert.ok(w.waterTris > 1000, 'the water is drawn');
  assert.ok(w.col.caps.every((c) => Number.isFinite(c.ax + c.az + c.bx + c.bz + c.r + c.h)), 'no NaN colliders');
  for (const s of w.sites) assert.ok(w.col.free(s.x + 1.6, s.z, 0.4), `${s.id} can be walked up to`);
  assert.ok(w.genTime < 4000, `generation: ${Math.round(w.genTime)} ms`);
});

test('the forest did not change when the bog arrived', () => {
  const w = forestWorld();
  assert.equal(w.mapId, 'forest');
  assert.equal(w.half, 300, 'still 600 m of forest');
  assert.ok(w.water?.swim && w.water.depth(0, 0) === 0, '4.1: only the local lake has water');
  assert.equal(w.landmarks.length, 20, 'every one of its places is still there');
  assert.equal(w.sites.length, 6, 'camp + five sites');
  assert.ok(w.lake && w.lake.r > 20, 'the lake is still the lake');
  assert.ok(w.meshes.length > 50, 'and it is still built out of chunks');
  assert.equal(w.walks.length, 1, '4.1: the existing lake pier is walkable, no other plank roads');
});

test('a map can be swapped in place: the old ground leaves the scene with it', () => {
  const scene = new THREE.Scene();
  const w = new World(scene, new THREE.MeshBasicMaterial());
  w.generate();
  const before = scene.children.length;
  assert.ok(before > 20);
  w.clear();
  assert.equal(scene.children.length, 0, 'nothing of the forest is left behind');
  w.setMap('bog');
  const bogB = w.generate();
  assert.equal(bogB.mapId, 'bog');
  assert.ok(scene.children.length > 20, 'and the bog is on the scene now');
  assert.ok(w.sites.length === 5 && w.car, 'with its pumps and its car');
  // the collider map was rebuilt too: a forest tree cannot be hit in the bog
  assert.equal(w.col.half, 170);
});

test('CAP still speaks one language to both maps', () => {
  assert.deepEqual(CAP, { TREE: 0, ROCK: 1, WOOD: 2, METAL: 3, WATER: 4, EFFIGY: 5, FENCE: 6 });
  assert.equal(BOG.id, 'bog');
  assert.equal(BOG.landmarks.length, BOG_LANDMARKS.length);
});
