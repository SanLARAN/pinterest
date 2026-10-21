// 2.1p: the sovkhoz — a cowshed and a silo tower at (-60,-40), its cupboards,
// its atlas page, and the paths a monster can take to reach you inside.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { World, LANDMARKS } from '../src/world/world.js';
import { CHAPTERS, ENTRIES, atlasText, pageList } from '../src/ui/atlasData.js';
import { buildModel } from '../src/ui/atlasModels.js';
import { freshAtlas } from '../src/core/storage.js';
import { cleanAtlas } from '../src/cloud/snapshot.js';

let world;
const realWorld = () => world || (world = new World(new THREE.Scene(), new THREE.MeshBasicMaterial()).generate());
// landmark-local -> world (the same rot the builders use)
const RY = 0.45, C = Math.cos(RY), S = Math.sin(RY);
const W = (lx, lz) => ({ x: -60 + lx * C + lz * S, z: -40 - lx * S + lz * C });

test('the sovkhoz stands clear of every other landmark', () => {
  const L = LANDMARKS.find((l) => l.id === 'sovkhoz');
  assert.ok(L, 'landmark exists');
  assert.equal(L.x, -60); assert.equal(L.z, -40); assert.equal(L.r, 20);
  for (const o of LANDMARKS) {
    if (o === L) continue;
    const d = Math.hypot(L.x - o.x, L.z - o.z);
    assert.ok(d > (L.r + o.r) * 1.25, `flats overlap with ${o.id}: ${d.toFixed(1)} m`);
  }
  // appended last: the first five (camp + the atlas generator sites) stay untouched
  assert.deepEqual(LANDMARKS.slice(0, 5).map((l) => l.id), ['camp', 'cabin', 'tower', 'stones', 'wreck']);
});

test('the world builds the farm: centre, three cupboards, a door portal for the silo', () => {
  const w = realWorld();
  assert.deepEqual(w.sovkhoz, { x: -60, z: -40 });
  const byId = Object.fromEntries(w.cabinets.map((c) => [c.id, c]));
  assert.equal(byId['sovkhoz:wardrobe'].kind, 'wardrobe');
  assert.equal(byId['sovkhoz:wardrobe'].mimic, true, 'the wardrobe may not be a wardrobe');
  assert.equal(byId['sovkhoz:stall'].kind, 'cupboard');
  assert.equal(byId['sovkhoz:silo'].kind, 'locker');
  const portal = w.navBuildings.find((b) => b.id === 'sovkhoz:silo');
  assert.ok(portal, 'silo portal registered');
  const silo = W(11, -5);
  assert.ok(Math.abs(portal.x - silo.x) < 0.01 && Math.abs(portal.z - silo.z) < 0.01, 'portal sits on the silo');
});

test('the gates are open, the walls are not, and the silo is hollow', () => {
  const w = realWorld(), col = w.col;
  const free = (lx, lz) => { const p = W(lx, lz); return col.free(p.x, p.z, 0.35); };
  assert.ok(free(-10.5, 4.5), 'west gate of the cowshed is passable');
  assert.ok(free(0.5, 4.5), 'east gate of the cowshed is passable');
  assert.ok(!free(-4.5, 4.5), 'the south wall between the gates blocks');
  assert.ok(!free(-4.5, -4.5), 'the north wall blocks');
  assert.ok(free(-4.5, -0.8), 'the middle of the cowshed is walkable');
  assert.ok(!free(13.51, -4.33), 'the silo wall blocks');
  assert.ok(free(8.48, -4.33), 'the silo doorway is open');
  assert.ok(free(12.2, -4.4), 'inside the silo is walkable');
});

test('a monster can path into the cowshed and into the silo (nowhere is a safe room)', () => {
  const w = realWorld(), nav = w.navigation;
  const intoBarn = nav.path(W(2, 16), W(-4.5, -0.8), 0.5);
  assert.ok(intoBarn && intoBarn.length > 2, 'path through the fence gap and a gate into the barn');
  const intoSilo = nav.path(W(4, -2), W(12.2, -4.4), 0.5);
  assert.ok(intoSilo && intoSilo.length > 2, 'path through the silo doorway');
});

test('visiting the farm is counted in the atlas log — and survives the cloud cleaner', () => {
  assert.equal(freshAtlas().farms, 0);
  assert.equal(cleanAtlas({ farms: 3 }).farms, 3);
  assert.deepEqual(ENTRIES.sovkhoz.log, [['visited', 'farms']]);
});

test('the atlas has the farm: chapter III, both languages, a plate that builds', () => {
  const places = CHAPTERS.find((c) => c.id === 'places');
  assert.ok(places.entries.includes('sovkhoz'));
  assert.equal(ENTRIES.sovkhoz.kind, 'place');
  for (const lang of ['ru', 'en']) {
    const e = atlasText(lang).entries.sovkhoz;
    assert.ok(e && e.name && e.latin, `${lang}: name + latin`);
    assert.ok(e.text.length >= 2 && e.tips.length >= 3 && e.facts.length >= 4 && e.quote, `${lang}: full page`);
  }
  assert.equal(atlasText('ru').entries.sovkhoz.name, 'Совхоз');
  assert.equal(atlasText('en').entries.sovkhoz.name, 'The Sovkhoz');
  assert.ok(pageList().some((p) => p.id === 'sovkhoz' && p.chapter === 'places'));
  const mat = new THREE.MeshBasicMaterial();
  const model = buildModel('sovkhoz', mat, { world: realWorld() });
  assert.ok(model.root.children.length > 0);
  let meshes = 0;
  model.root.traverse((o) => {
    if (o.geometry) { meshes++; assert.ok(o.geometry.attributes.position.array.every(Number.isFinite)); o.geometry.dispose(); }
  });
  assert.ok(meshes >= 2, 'the place itself plus its cupboards');
  mat.dispose();
});
