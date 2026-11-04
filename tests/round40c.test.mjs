// 4.0 ULTRA (3/3) — the camera: «предмет фотоаппарат на 5 зарядов: прогоняет Смотрителя, вспышку видно издалека,
// фото — в альбом на сайте или в zip». The flash and the host's word on the Watcher run on a stub game; the film's
// store runs on an in-memory IndexedDB; the .zip is read back byte by byte; the site's album groups what it finds.
// And the release itself: the patch note, the protocol, the strings.
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

const { RNG } = await import('../src/core/rng.js');
const { setLang, t } = await import('../src/core/i18n.js');
const { World, LANDMARKS } = await import('../src/world/world.js');
const { BAG_KINDS, BAG_LIMIT, CAMERA_SHOTS, cleanParcel, kindIndex, BAG_ICON } = await import('../src/game/backpackData.js');
const { PHOTO, SPOTS, cameraCount, flashFrom, inFlash, PhotoCamera } = await import('../src/game/photo.js');
const PS = await import('../src/core/photoStore.js');
const { albumUrl, frameCaption } = await import('../src/ui/film.js');
const SITE = await import('../site/i18n.js');
const { clock, caption, groupShifts } = await import('../site/album.js');
const { NEWS } = await import('../src/ui/news.js');
const { PROTOCOL } = await import('../src/net/net.js');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

let _w = null;
const forest = () => (_w ||= new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'forest').generate());

// ---------------------------------------------------------------- the item
test('the camera is a pocket of its own: kind 9 (the old kinds keep their numbers), one, with 0…5 flashes', () => {
  assert.deepEqual(BAG_KINDS.slice(0, 9), ['stones', 'glow', 'torch', 'flare', 'battery', 'tape', 'crowbar', 'map', 'syringe']);
  assert.equal(BAG_KINDS[9], 'camera');
  assert.equal(kindIndex('camera'), 9);
  assert.equal(BAG_LIMIT.camera, 1);
  assert.equal(CAMERA_SHOTS, 5);
  assert.equal(PHOTO.shots, CAMERA_SHOTS);
  assert.ok(BAG_ICON.camera);
  assert.deepEqual(cleanParcel({ kind: 'camera', n: 1, shots: 3 }), { kind: 'camera', n: 1, shots: 3 });
  assert.deepEqual(cleanParcel({ kind: 'camera', n: 1, shots: 0 }), { kind: 'camera', n: 1, shots: 0 }, 'an empty one can still change hands');
  for (const bad of [{ shots: 6 }, { shots: -1 }, { shots: 2.5 }, { shots: '3' }, {}, { n: 2, shots: 1 }, { n: 0, shots: 1 }]) {
    assert.equal(cleanParcel({ kind: 'camera', n: 1, ...bad }), null, JSON.stringify(bad));
  }
  assert.deepEqual(cleanParcel({ kind: 'torch', n: 1, charge: 0.5, shots: 4 }), { kind: 'torch', n: 1, charge: 0.5 }, 'only a camera carries shots');
});

function stubGame(over = {}) {
  const log = { popups: [], noise: [], ev: [], pulses: [] };
  const g = {
    world: forest(), scene: new THREE.Scene(), tools: null, camera: { position: new THREE.Vector3(0, 1.6, 0) },
    player: { id: 'me', x: 0, y: 0, z: 0, eyeCur: 1.6, yaw: 0, pitch: 0, alive: true },
    hud: { popup: (m) => log.popups.push(m) }, audio: { ready: false }, fx: { white: 0 },
    state: 'play', day: 2, daysTotal: 4, time: 221, map: 'forest', online: false, remotes: new Map(),
    playerNoise: (x, z, loud, kind) => log.noise.push([loud, kind]), sync: null, auth: true, monsters: [],
    pulses: { emit: (x, y, z, t, o) => log.pulses.push(o) }, stats: {}, addTrauma() {},
    ...over,
  };
  return { g, log };
}
const watcher = (x, z, state = 'stalk') => ({
  type: 'watcher', x, y: 0, z, state, seizing: true, vanished: 0,
  endSeize() { this.seizing = false; },
  vanish(sec) { this.vanished = sec; this.state = 'lurk'; },
});

test('where they lie: one a shift, two in co-op, by a cabin, the tower or the stones — the same for the room', () => {
  assert.equal(cameraCount(false), 1);
  assert.equal(cameraCount(true), 2);
  for (const id of SPOTS) assert.ok(LANDMARKS.some((l) => l.id === id), id);
  const { g } = stubGame();
  const a = new PhotoCamera(g), b = new PhotoCamera(g);
  a.reset(new RNG(77), true);
  b.reset(new RNG(77), true);
  assert.equal(a.items.length, 2);
  assert.deepEqual(a.items.map((i) => [i.x, i.z, i.site]), b.items.map((i) => [i.x, i.z, i.site]));
  assert.notEqual(a.items[0].site, a.items[1].site);
  for (const it of a.items) {
    const L = LANDMARKS.find((l) => l.id === it.site);
    assert.ok(Math.hypot(it.x - L.x, it.z - L.z) < 3 + Math.max(2.5, L.r * 0.5) + 0.01, `${it.site}: ${Math.hypot(it.x - L.x, it.z - L.z).toFixed(1)} m off`);
    assert.ok(it.halo, 'the red lamp you see before you find it');
  }
  a.reset(new RNG(77), false);
  assert.equal(a.items.length, 1);
  // a camera is picked up like the rest: claimed through the host
  assert.match(src('src/game/inventory.js'), /source==='camera'\) \{ obj=g\.camItem\.items\?\.\[a\]/);
});

test('LMB: a flash, a noise, a frame to take — then the whine of the capacitor, and five is all there is', () => {
  const { g, log } = stubGame();
  const c = new PhotoCamera(g);
  c.reset(new RNG(1), false);
  assert.equal(c.shoot(), false, 'nothing to shoot with yet');
  c.got();
  assert.equal(c.has, true);
  assert.equal(c.shots, 5);
  assert.equal(c.label, '5 / 5');
  assert.equal(c.shoot(), true);
  assert.equal(c.shots, 4);
  assert.ok(Math.abs(c.flashT - PHOTO.flash) < 1e-9);
  assert.deepEqual(log.noise.at(-1), [PHOTO.loud, 'camera']);
  assert.equal(c.wantShot.day, 2);
  assert.equal(c.wantShot.t, 221);
  assert.equal(c.wantShot.phase, 'night');
  assert.equal(c.wantShot.shift, c.shift);
  // its light: a wide, short, strong beam from the lens
  const L = c.lightSources([]);
  assert.equal(L.length, 1);
  assert.equal(L[0].R, PHOTO.radius);
  assert.ok(L[0].I > 2.1 * 3, 'far brighter than a flashlight');
  assert.equal(c.shoot(), false, 'charging');
  assert.equal(log.popups.at(-1), t('cameraCharging'));
  for (let i = 0; i < 4; i++) {
    c.update(PHOTO.recycle + 0.01);
    assert.equal(c.shoot(), true);
  }
  assert.equal(c.shots, 0);
  c.update(PHOTO.recycle + 0.01);
  assert.equal(c.shoot(), false);
  assert.equal(log.popups.at(-1), t('cameraEmpty'));
  assert.equal(c.lightSources([]).length, 0, 'the flash is long over');
});

test('inFlash: in front of the lens, near enough — or right in your face', () => {
  const F = flashFrom(0, 1.6, 0, 0, 0); // looking down −z
  assert.ok(Math.abs(Math.hypot(...F.dir) - 1) < 1e-9);
  assert.ok(Math.abs(F.z + 0.3) < 1e-9, 'it comes from a little in front of the eyes');
  assert.equal(inFlash(F, 0, 2.2, -10), true);
  assert.equal(inFlash(F, 0, 2.2, -(PHOTO.scare + 1)), false, 'too far');
  assert.equal(inFlash(F, 0, 2.2, 10), false, 'behind you');
  assert.equal(inFlash(F, 0, 2.2, 2.5), true, 'right next to you, whichever way you point');
  assert.equal(inFlash(F, 10, 2.2, -10), true, '45° off: in the frame');
  assert.equal(inFlash(F, 10, 2.2, -1), false, 'off to the side');
});

test('the host: a Watcher caught in the flash lets go, is still in the picture, and is gone the frame after', () => {
  const { g, log } = stubGame();
  const c = new PhotoCamera(g);
  c.reset(new RNG(1), false);
  c.got();
  const front = watcher(0, -12), behind = watcher(0, 12), far = watcher(0, -40), lurking = watcher(2, -10, 'lurk');
  g.monsters = [front, behind, far, lurking, { type: 'listener', x: 0, y: 0, z: -8 }];
  g.sync = { ev: (...a) => log.ev.push(a) };
  g.world = Object.assign(Object.create(forest()), { losBlocked: () => false });
  c.shoot();
  assert.equal(front.seizing, false, 'it lets go at once');
  assert.equal(front.vanished, 0, '...but it is still there for the picture');
  assert.equal(c.wantShot.watcher, true, 'the frame knows');
  assert.ok(behind.seizing && far.seizing && !behind.vanished && !far.vanished);
  assert.equal(log.ev.filter((e) => e[0] === 'cw').length, 1);
  assert.deepEqual(log.ev.find((e) => e[0] === 'cf').length, 6, 'cf: x, y, z, yaw, pitch');
  c.update(1 / 60);
  assert.equal(front.vanished, 0);
  c.update(1 / 60);
  assert.ok(front.vanished >= PHOTO.away[0] && front.vanished <= PHOTO.away[1], `gone for ${front.vanished.toFixed(0)} s`);
  assert.equal(log.pulses.at(-1).kind, 'seize', 'the white after-image where it stood');
  assert.equal(g.stats.watcherFlashed, 1);
  assert.equal(log.popups.includes(t('cameraScared')), true);
  // with a trunk in between, the flash does not reach it
  const hidden = watcher(0, -8);
  g.monsters = [hidden];
  g.world = Object.assign(Object.create(forest()), { losBlocked: () => true });
  c.update(PHOTO.recycle + 0.01);
  c.shoot();
  c.update(1 / 60);
  c.update(1 / 60);
  assert.equal(hidden.vanished, 0);
  assert.equal(hidden.seizing, true);
});

test('a friend\'s flash: a burst you see a long way off, its light, and on the host the Watcher in front of them', () => {
  const { g, log } = stubGame();
  const c = new PhotoCamera(g);
  c.reset(new RNG(1), false);
  g.sync = { ev: (...a) => log.ev.push(a) };
  g.world = Object.assign(Object.create(forest()), { losBlocked: () => false });
  const w = watcher(60, -20);
  g.monsters = [w];
  const friend = { id: 'f1', x: 60, y: 0, z: 0, eyeCur: 1.6 };
  assert.equal(c.netFlash(friend, 80, 1.6, 0, 0, 0), null, 'a flash where they are not is not theirs');
  const F = c.netFlash(friend, 60, 1.6, -0.3, 0, 0);
  assert.ok(F);
  const b = c.bursts[0];
  assert.equal(b.sprite.visible, true);
  assert.ok(b.sprite.scale.x > 0.9 + 55 * 0.055, 'sized for how far it is: a few degrees across');
  assert.equal(c.lightSources([]).length, 1, 'it lights the forest round them');
  assert.deepEqual(log.ev.find((e) => e[0] === 'cw'), ['cw', 'f1', 60, 0, -20], 'the host tells the room whose flash it was');
  assert.equal(w.seizing, false);
  c.update(0.2);
  assert.equal(c.lightSources([]).length, 0, 'the light is over...');
  assert.equal(b.sprite.visible, true, '...the glare is still in your eye');
  c.update(0.4);
  assert.equal(b.sprite.visible, false);
  // seen from within 140 m only
  g.camera.position.set(60, 1.6, PHOTO.seen + 20);
  c.netFlash(friend, 60, 1.6, -0.3, 0, 0);
  c.update(0.01);
  assert.equal(c.bursts[0].sprite.visible, false);
});

// ---------------------------------------------------------------- the film's store
test('crc32 and a stored .zip that any unzip reads: headers, names, data, central directory, end record', () => {
  assert.equal(PS.crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  assert.equal(PS.crc32(new Uint8Array(0)), 0);
  const files = [
    { name: 'hush-a.jpg', data: new Uint8Array([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9]), date: new Date(2026, 10, 4, 3, 41, 20) },
    { name: 'ночь-2.jpg', data: new Uint8Array(1000).map((_, i) => i & 255), date: new Date(2026, 10, 4, 3, 42, 0) },
  ];
  const z = PS.zipStore(files), dv = new DataView(z.buffer), dec = new TextDecoder();
  let off = 0;
  for (const f of files) {
    assert.equal(dv.getUint32(off, true), 0x04034b50, 'a local header');
    assert.equal(dv.getUint16(off + 6, true) & 0x0800, 0x0800, 'UTF-8 names');
    assert.equal(dv.getUint16(off + 8, true), 0, 'stored');
    assert.equal(dv.getUint32(off + 14, true), PS.crc32(f.data));
    const n = dv.getUint16(off + 26, true), size = dv.getUint32(off + 18, true);
    assert.equal(dec.decode(z.subarray(off + 30, off + 30 + n)), f.name);
    assert.deepEqual(z.subarray(off + 30 + n, off + 30 + n + size), f.data);
    // the DOS time: 03:41:20 → 3 << 11 | 41 << 5 | 10
    if (f === files[0]) assert.equal(dv.getUint16(off + 10, true), (3 << 11) | (41 << 5) | 10);
    off += 30 + n + size;
  }
  const end = z.length - 22;
  assert.equal(dv.getUint32(end, true), 0x06054b50);
  assert.equal(dv.getUint16(end + 8, true), 2);
  assert.equal(dv.getUint16(end + 10, true), 2);
  assert.equal(dv.getUint32(end + 16, true), off, 'the central directory starts where the files end');
  assert.equal(dv.getUint32(end + 12, true), end - off);
  let cd = off;
  for (const f of files) {
    assert.equal(dv.getUint32(cd, true), 0x02014b50);
    const n = dv.getUint16(cd + 28, true);
    assert.equal(dec.decode(z.subarray(cd + 46, cd + 46 + n)), f.name);
    cd += 46 + n;
  }
  assert.equal(cd, end);
  assert.equal(PS.zipStore([]).length, 22, 'an empty film is an empty zip');
});

test('cleanMeta: a stored frame is never trusted blindly; the names a frame and a film are saved under', () => {
  const m = PS.cleanMeta({ at: 'x', day: 500, days: -3, t: 1e9, map: 'moon', phase: 'party', w: 0, h: 99999, watcher: 'yes', coop: 77, junk: '<script>' });
  assert.ok(Math.abs(m.at - Date.now()) < 5000);
  assert.equal(m.day, 99);
  assert.equal(m.days, 1);
  assert.equal(m.t, 36000);
  assert.equal(m.map, 'forest');
  assert.equal(m.phase, 'night');
  assert.equal(m.w, 1);
  assert.equal(m.h, 8192);
  assert.equal(m.watcher, true);
  assert.equal(m.coop, 8);
  assert.equal('junk' in m, false);
  assert.equal(PS.cleanMeta({ map: 'bog', phase: 'morning' }).map, 'bog');
  const at = new Date(2026, 10, 4, 3, 5).getTime();
  assert.equal(PS.photoName({ at, day: 2, t: 221 }, 3), 'hush-2026-11-04-n2-0341-3.jpg');
  assert.equal(PS.photoName({ at, day: 1, t: 5, map: 'bog' }), 'hush-2026-11-04-bog-n1-0005-1.jpg');
  assert.equal(PS.zipName(at), 'hush-shift-2026-11-04-0305.zip');
  assert.equal(PS.dateStamp(at), "'26 11 04");
});

// a little IndexedDB: enough of it for the store (requests and transactions complete later, in order)
function fakeIDB() {
  const dbs = new Map(), later = (f) => setTimeout(f, 0);
  return {
    open(name) {
      const req = {};
      later(() => {
        let d = dbs.get(name);
        const fresh = !d;
        if (!d) dbs.set(name, (d = new Map()));
        req.result = {
          objectStoreNames: { contains: (n) => d.has(n) },
          createObjectStore(n) { d.set(n, { rows: new Map(), next: 1 }); return { createIndex() {} }; },
          transaction(n) {
            const st = d.get(n), tx = {};
            const ask = (fn) => { const r = {}; later(() => { r.result = fn(); r.onsuccess?.(); }); return r; };
            tx.objectStore = () => ({
              add: (row) => { const id = st.next++; st.rows.set(id, { ...row, id }); return ask(() => id); },
              getAll: () => ask(() => [...st.rows.values()]),
              delete: (id) => ask(() => st.rows.delete(id)),
              clear: () => ask(() => st.rows.clear()),
            });
            later(() => later(() => tx.oncomplete?.()));
            return tx;
          },
          close() {},
        };
        if (fresh) req.onupgradeneeded?.();
        req.onsuccess?.();
      });
      return req;
    },
  };
}

test('the album\'s store: a film goes in whole, comes out newest first and cleaned, and keeps its last 400', async () => {
  await assert.rejects(PS.openPhotos(null), /no IndexedDB/);
  const keep = globalThis.indexedDB;
  globalThis.indexedDB = fakeIDB();
  try {
    const jpg = (i) => new Blob([new Uint8Array([0xff, 0xd8, i & 255, 0xff, 0xd9])], { type: 'image/jpeg' });
    const ids = await PS.savePhotos([
      { blob: jpg(1), meta: { at: 1000, shift: 900, day: 1, t: 30 } },
      { blob: 'not a blob', meta: {} },
      { blob: jpg(2), meta: { at: 2000, shift: 900, day: 1, t: 95, watcher: true } },
    ]);
    assert.deepEqual(ids, [1, 2]);
    let list = await PS.listPhotos();
    assert.deepEqual(list.map((p) => p.id), [2, 1]);
    assert.equal(list[0].meta.watcher, true);
    assert.equal(list[0].meta.map, 'forest');
    assert.ok(list[0].blob instanceof Blob);
    await PS.deletePhoto(1);
    assert.deepEqual((await PS.listPhotos()).map((p) => p.id), [2]);
    await PS.clearPhotos();
    assert.equal((await PS.listPhotos()).length, 0);
    // the oldest go first past ALBUM_MAX
    const many = Array.from({ length: PS.ALBUM_MAX + 3 }, (_, i) => ({ blob: jpg(i), meta: { at: 10000 + i, shift: 1 } }));
    await PS.savePhotos(many);
    for (let i = 0; i < 100 && (await PS.listPhotos()).length > PS.ALBUM_MAX; i++) await new Promise((r) => setTimeout(r, 10));
    list = await PS.listPhotos();
    assert.equal(list.length, PS.ALBUM_MAX);
    assert.equal(Math.min(...list.map((p) => p.meta.at)), 10003);
    // and the .zip of a film: its frames under their own names
    const zip = await PS.zipPhotos(list.slice(0, 2));
    assert.equal(zip.type, 'application/zip');
    const u8 = new Uint8Array(await zip.arrayBuffer()), dv = new DataView(u8.buffer);
    assert.equal(dv.getUint16(u8.length - 22 + 8, true), 2);
    const n = dv.getUint16(26, true);
    assert.equal(new TextDecoder().decode(u8.subarray(30, 30 + n)), PS.photoName(list[0].meta, 1));
  } finally {
    globalThis.indexedDB = keep;
  }
});

// ---------------------------------------------------------------- the film and the album
test('the results screen\'s film: captions, and the way to the site\'s album from wherever the game is', () => {
  const at = (href) => albumUrl(new URL(href));
  assert.equal(at('https://sanlaran.github.io/pinterest/'), 'https://sanlaran.github.io/pinterest/site/#album');
  assert.equal(at('https://sanlaran.github.io/pinterest/index.html?x=1'), 'https://sanlaran.github.io/pinterest/site/#album');
  assert.equal(at('https://sanlaran.github.io/pinterest/play/'), 'https://sanlaran.github.io/pinterest/site/#album');
  assert.equal(at('http://localhost:5173/'), 'http://localhost:5173/site/#album');
  setLang('ru');
  assert.match(frameCaption({ day: 2, t: 221, phase: 'night' }), /^ночь 2 · /);
  assert.match(frameCaption({ day: 3, t: 20, phase: 'morning' }), /^утро 3 · /);
  setLang('en');
  assert.match(frameCaption({ day: 2, t: 221 }), /^night 2 · /);
  setLang('ru');
});

test('the site\'s album: the film as shifts, newest first, each in the order it was taken', () => {
  assert.equal(clock(221), '03:41');
  assert.equal(clock(0), '00:00');
  SITE.setLang('ru');
  assert.equal(caption({ day: 2, t: 221, phase: 'night' }), SITE.t('album.night', { n: 2, t: '03:41' }));
  assert.match(caption({ day: 2, t: 221, phase: 'night' }), /2/);
  assert.notEqual(caption({ day: 1, t: 5, phase: 'training' }), caption({ day: 1, t: 5, phase: 'night' }));
  const f = (id, shift, at) => ({ id, meta: { shift, at } });
  const g = groupShifts([f(1, 100, 150), f(2, 100, 120), f(3, 500, 600), f(4, 0, 50), f(5, 500, 550)]);
  assert.deepEqual(g.map((s) => s.shift), [500, 100, 50], 'a frame with no shift is a shift of its own');
  assert.deepEqual(g[0].frames.map((p) => p.id), [5, 3]);
  assert.deepEqual(g[1].frames.map((p) => p.id), [2, 1]);
  assert.equal(g[0].at, 550);
  assert.deepEqual(groupShifts(null), []);
  // the page has the section, the nav has the link, both languages have the words
  const html = src('site/index.html');
  assert.match(html, /id="album"/);
  assert.match(html, /href="#album"/);
  for (const L of ['ru', 'en']) assert.ok(SITE.STR[L].album && SITE.STR[L].nav.album, L);
});

// ---------------------------------------------------------------- the release
test('4.0: the patch note leads, in both languages; the protocol is 21; every new string exists twice', () => {
  const n = NEWS.find((x) => x.v === '4.0');
  assert.ok(n && NEWS.indexOf(n) <= 1, '4.0 leads (or sits under its own hotfix)');
  assert.match(n.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(n.ru.items.length, n.en.items.length);
  assert.ok(n.ru.items.length >= 8);
  assert.equal(PROTOCOL, 21, 'a 3.x build in the room would not know the camera, the jump or the arms');
  const keys = ['cameraItem', 'cameraGot', 'cameraShot', 'cameraLast', 'cameraEmpty', 'cameraCharging', 'cameraScared', 'useCamera', 'useCameraT',
    'bagShots', 'bagAbout_camera', 'bagSub_camera', 'filmTitle', 'filmCount', 'filmSave', 'filmSaving', 'filmSaved', 'filmOpen', 'filmZip', 'filmFail',
    'filmHint', 'filmNight', 'filmMorning', 'filmWatcher', 'touchJump'];
  for (const L of ['ru', 'en']) {
    setLang(L);
    for (const k of keys) assert.ok(t(k) && t(k) !== k, `${L}.${k}`);
    assert.ok(t('kbAct').jump, `${L}: the jump in the keys list`);
  }
  setLang('ru');
  // the code says them through t(), never in Russian of its own
  for (const f of ['src/game/photo.js', 'src/ui/film.js']) assert.doesNotMatch(src(f).replace(/\/\/.*$/gm, ''), /['"`][^'"`\n]*[а-яё][^'"`\n]*['"`]/i, f);
});
