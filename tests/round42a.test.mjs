// 4.2 regressions: the rope's «E · untie» prompt, the guest's seat number (the host was dropped from a guest's
// road film), the campfire's doubles, the rarer-than-promised camera (and its atlas page), and the garage's
// tuning — rims, tint, stickers — riding the fit from the wardrobe to the road film's Trueno convertible.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
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
const { CFG } = await import('../src/core/config.js');
const { setLang, t } = await import('../src/core/i18n.js');
const { freshAtlas, recordNight, atlasLog } = await import('../src/core/storage.js');
const { RoadFilm, arrivalPath, TF, TRUENO_STOP } = await import('../src/game/roadFilm.js');
const { CAR_AT, inYard } = await import('../src/world/yard.js');
const { cameraCount, PHOTO } = await import('../src/game/photo.js');
const { LOOT_KIND } = await import('../src/game/backpackData.js');
const { ENTRIES, CHAPTERS, atlasText } = await import('../src/ui/atlasData.js');
const { buildModel } = await import('../src/ui/atlasModels.js');
const L = await import('../src/game/carLook.js');
const { cleanFit, fitKey, cleanTunes, ITEMS } = await import('../src/game/outfit.js');
const { cleanOutfit, fitBudget, CLOUD_BUDGET } = await import('../src/cloud/snapshot.js');
const { CAR_MODELS, CK } = await import('../src/ui/garageSet.js');
const { FILM_CARS, buildFilmCar, disposeFilmCar } = await import('../src/game/filmCar.js');
const { decalShaders, carWorldMaterial, stickerTexture, decalGeometry } = await import('../src/render/carPaint.js');

let world;
const forest = () => world ||= new World(new THREE.Scene(), new THREE.MeshBasicMaterial()).generate();
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const noop = new Proxy(function () {}, { get: () => noop, apply: () => undefined });
function fullGame(hud = noop) {
  const scene = new THREE.Scene(), w = forest();
  const input = { move: { x: 0, y: 0 }, crouch: false, sprint: false, turn: 0, uiMode: false, events: [], useHeld: false, touch: false, consume: () => [] };
  const audio = new Proxy({ ready: false, voices: new Map() }, { get: (o, k) => (k in o ? o[k] : noop) });
  return new Game({ scene, world: w, camera: new THREE.PerspectiveCamera(70, 1.6, 0.05, 400), input, audio, hud, radar: noop, post: noop, shadows: noop,
    pulses: { emit() {}, emitStep() {}, update() {}, clear() {}, fronts: () => [] },
    ghosts: { clear() {}, spawn: () => ({ count: 0 }), release() {} }, eyes: { add() {}, clear() {} }, particles: { burst() {}, clear() {} },
    mic: { state: 'off', update: () => ({ loud: 0, pulse: 0, scream: false }), inIframe: () => false } });
}
const frame = (g, events = []) => g.update(1 / 60, { events, look: { dx: 0, dy: 0 } });
const ROSTER = [{ id: 'host', slot: 0, name: 'Хост' }, { id: 'guest', slot: 1, name: 'Гость' }];
function online(g, self, hud) {
  const coop = { isHost: self === 'host', selfId: self, hostId: 'host', rules: {}, send() {}, toHost() {}, drain: () => [] };
  g.setupOnline(coop, ROSTER);
  g.reset({ seed: 42, slot: self === 'host' ? 0 : 1 });
  g.opening.cancel();
  return g;
}
// a sticker: a red disc with a white ring on clear
function disc() {
  const N = 64, px = new Uint8ClampedArray(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const r = Math.hypot(x - 31.5, y - 31.5), o = (y * N + x) * 4;
    if (r > 30) continue;
    const ring = r > 24;
    px.set(ring ? [250, 250, 250, 255] : [200 + (x & 7), 30, 40 + (y & 3), 255], o);
  }
  return px;
}

// ---------------- the rope ----------------
test('the rope: a friend tied to the tree gets «E · untie» from the interact pass, and holding E frees them', () => {
  setLang('ru');
  const uses = [];
  const hud = new Proxy({ setUse: (...a) => uses.push(a) }, { get: (o, k) => (k in o ? o[k] : noop) });
  const g = online(fullGame(hud), 'host');
  g.startNight();
  const p = g.player, v = g.remotes.get('guest');
  const tree = { x: p.x + 1.7, z: p.z, r: 0.3, ax: p.x + 0.8, az: p.z, fx: p.x, fz: p.z, yaw: 1.5 };
  Object.assign(v, { x: tree.ax, z: tree.az, y: p.y, alive: true });
  g.angler.cap = { pid: 'guest', phase: 'bound', tree, t: 0, dragT: 0, boundLeft: 200, irrit: 0, ko: 0, struggle: 0, returning: false, mid: -1, selfFree: false };
  frame(g);
  const label = uses.filter((u) => typeof u[0] === 'string' && u[0].includes('Гость'));
  assert.ok(label.length, `the prompt shows (last: ${JSON.stringify(uses.at(-1))})`);
  assert.equal(label.at(-1)[2], true, 'as a hold-E prompt');
  assert.ok(String(uses.at(-1)[0]).includes('Гость'), 'and nothing wipes it later in the same frame');
  // hold it
  g.input.useHeld = true;
  let best = 0, n = 0;
  for (; n < 900 && g.angler.cap; n++) {
    frame(g);
    const u = uses.at(-1);
    if (u && typeof u[0] === 'string' && u[0].includes('Гость')) best = Math.max(best, u[1]);
  }
  assert.equal(g.angler.cap, null, 'untied');
  assert.ok(best > 0.5, `the bar filled (${best.toFixed(2)})`);
  assert.ok(n / 60 >= CFG.ANGLER.untie - 0.1, 'and it took the rope its time');
  g._dropRemotes?.();
});

test('the rope: too far, or from a different height, there is no prompt', () => {
  setLang('ru');
  const uses = [];
  const hud = new Proxy({ setUse: (...a) => uses.push(a) }, { get: (o, k) => (k in o ? o[k] : noop) });
  const g = online(fullGame(hud), 'host');
  g.startNight();
  const p = g.player, v = g.remotes.get('guest');
  const tree = { x: p.x + 9, z: p.z, r: 0.3, ax: p.x + 8, az: p.z, fx: p.x, fz: p.z, yaw: 1.5 };
  Object.assign(v, { x: tree.ax, z: tree.az, y: p.y, alive: true });
  g.angler.cap = { pid: 'guest', phase: 'bound', tree, t: 0, dragT: 0, boundLeft: 200, irrit: 0, ko: 0, struggle: 0, returning: false, mid: -1, selfFree: false };
  for (let i = 0; i < 5; i++) frame(g);
  assert.ok(!uses.some((u) => typeof u[0] === 'string' && u[0].includes('Гость')));
  tree.ax = p.x + 0.8; v.x = tree.ax; v.y = p.y + 4;
  frame(g);
  assert.ok(!uses.some((u) => typeof u[0] === 'string' && u[0].includes('Гость')), 'up a slope: not this rope');
  for (const lang of ['ru', 'en']) { setLang(lang); for (const k of ['useUntie', 'useUntieT']) assert.ok(t(k).includes('{name}'), `${lang}.${k}`); }
  setLang('ru');
  g._dropRemotes?.();
});

// ---------------- the films: seats and doubles ----------------
test('a guest keeps their seat: the road film seats the host at the wheel, the guest beside, the car is the host’s', () => {
  const g = online(fullGame(), 'guest');
  assert.equal(g.player.slot, 1, 'player.reset keeps the slot');
  const f = new RoadFilm(g);
  assert.deepEqual(f._players().map((p) => p.slot), [0, 1], 'nobody lost to a slot clash');
  g.remotes.get('host').fit = cleanFit({ car: 'trueno', ct: { rim: 'mesh', rt: 'gold', tint: 2 } });
  const hf = f._hostFit();
  assert.equal(hf.car, 'trueno');
  assert.equal(hf.ct.rim, 'mesh');
  g._dropRemotes?.();
});

test('the opening hides the real rigs: two of every friend round the fire no more', () => {
  const g = online(fullGame(), 'host');
  const r = g.remotes.get('guest');
  Object.assign(r, { x: g.player.x + 2, z: g.player.z, y: g.player.y, alive: true });
  g.state = 'intro';
  g.updateRemotes(1 / 60);
  assert.equal(r.rig.root.visible, false);
  assert.ok(/this\.state !== 'intro'/.test(src('src/game/game.js')));
  g._dropRemotes?.();
});

// ---------------- the camera ----------------
test('cameras: two lie about solo, three in co-op — and one more waits on a cupboard shelf, five frames in it', () => {
  assert.equal(cameraCount(false), 2);
  assert.equal(cameraCount(true), 3);
  assert.equal(LOOT_KIND.camera, 'camera');
  const g = fullGame();
  g.setupSolo();
  g.reset({ seed: 42 });
  g.opening.cancel();
  g.startNight();
  const found = [];
  for (const c of g.cabinets.list) c.items.forEach((it, k) => { if (it.kind === 'camera') found.push([c, k]); });
  assert.equal(found.length, 1, 'one a shift');
  const [c, k] = found[0];
  assert.ok(!c.mimic);
  assert.ok(c.group.children.includes(c.items[k].mesh), 'on the shelf, in the scene');
  // take it (unlocked and opened)
  c.locked = false; c.opened = true;
  const p = g.player;
  p.x = c.front.x; p.z = c.front.z; p.y = c.spec.y;
  assert.equal(g.camItem.has, false);
  g.cabinets.take(c, k);
  assert.equal(c.items[k].taken, true);
  assert.equal(g.camItem.has, true);
  assert.equal(g.camItem.shots, PHOTO.shots);
  assert.equal(g.stats.cameras, 1, 'the atlas counts it');
  for (const lang of ['ru', 'en']) { setLang(lang); assert.ok(t('cabItems').camera && t('cabGot').camera); }
  setLang('ru');
});

test('the atlas has the camera: a page in «tasks», both languages, a model, its stats kept', () => {
  assert.ok(CHAPTERS.find((ch) => ch.id === 'tasks').entries.includes('camera'));
  assert.equal(ENTRIES.camera.model, 'camera');
  for (const lang of ['ru', 'en']) {
    const e = atlasText(lang).entries.camera;
    assert.ok(e && e.name && e.text, lang);
    for (const [label] of ENTRIES.camera.log) assert.ok(atlasText(lang).log?.[label] || atlasText(lang).stats?.[label] || JSON.stringify(atlasText(lang)).includes(`"${label}"`), `${lang}: ${label}`);
  }
  const m = buildModel('camera', new THREE.MeshBasicMaterial());
  assert.ok(m && m.root.children.length > 0);
  const a = freshAtlas();
  for (const k of ['cameras', 'photos', 'syringes']) assert.equal(a[k], 0);
  const before = { c: atlasLog.cameras | 0, p: atlasLog.photos | 0, s: atlasLog.syringes | 0 };
  recordNight({ cameras: 1, photos: 3, syringes: 1 }, {}, []);
  assert.deepEqual([atlasLog.cameras, atlasLog.photos, atlasLog.syringes], [before.c + 1, before.p + 3, before.s + 1], 'the night is written down');
});

// ---------------- the tuning: a look ----------------
test('car looks: junk in, a valid frozen look out; the default is one object', () => {
  assert.equal(L.cleanLook(null), L.DEFAULT_LOOK);
  assert.equal(L.cleanLook({ rim: 'stock', rt: 'stock', tint: 0, st: [] }), L.DEFAULT_LOOK);
  const bad = L.cleanLook({ rim: 'square', rt: '#fff', tint: 9, st: [{ at: 'roof', px: 'x', pal: ['#ff0000'] }, { at: 'door', px: '!'.repeat(L.PX_LEN), pal: ['#ff0000'] }, 'no'] });
  assert.equal(bad.rim, 'stock');
  assert.equal(bad.tint, L.TINTS - 1);
  assert.equal(bad.st.length, 0);
  const q = L.quantize(disc());
  assert.ok(q && q.px.length === L.PX_LEN && q.pal.length >= 2 && q.pal.length <= L.STICKER.colors);
  const look = L.cleanLook({ rim: 'turbine', rt: 'body', tint: 1.4, st: [{ at: 'hood', s: 9, ...q }, { at: 'hood', s: 1, ...q }, { at: 'door', s: 0.1, ...q }] });
  assert.ok(Object.isFrozen(look) && Object.isFrozen(look.st));
  assert.equal(look.tint, 1);
  assert.deepEqual(look.st.map((s) => [s.at, s.s]), [['hood', L.STICKER.sMax], ['door', L.STICKER.sMin]], 'one a place, sizes clamped');
  assert.equal(L.cleanLook(look), look, 'a clean look comes back as it is');
  assert.equal(L.cleanLook(JSON.parse(JSON.stringify(look))).st[0].px, look.st[0].px, 'it survives JSON');
  assert.equal(L.quantize(new Uint8ClampedArray(64 * 64 * 4)), null, 'nothing opaque: no sticker');
  // the pixels: clear stays clear, the ring stays white, and the round trip is exact
  const idx = L.decodeSticker(q.px);
  assert.equal(idx.length, 4096);
  assert.equal(idx[0], 0, 'the corner is clear');
  assert.equal(L.encodeSticker(idx), q.px);
  const ring = q.pal[idx[2 * 64 + 31] - 1];
  assert.ok(parseInt(ring.slice(1, 3), 16) > 240, `the ring is white (${ring})`);
  assert.equal(L.decodeSticker('A'.repeat(L.PX_LEN - 1)), null);
  // the atlas: four quadrants, rows flipped
  const atlas = L.stickerAtlas(look);
  assert.equal(atlas.length, 128 * 128 * 4);
  assert.equal(atlas[3], 0, 'clear corner');
  assert.equal(atlas[(32 * 128 + 31) * 4 + 3], 255, 'the disc, in the first quadrant');
  const half = new Uint8ClampedArray(64 * 64 * 4);
  for (let i = 0; i < 4096; i++) half.set(i < 2048 ? [255, 0, 0, 255] : [0, 0, 255, 255], i * 4); // red on top
  const hl = L.cleanLook({ st: [{ at: 'door', ...L.quantize(half) }] });
  const ha = L.stickerAtlas(hl), at = (x, y) => [...ha.slice((y * 128 + x) * 4, (y * 128 + x) * 4 + 4)];
  assert.deepEqual(at(10, 60), [255, 0, 0, 255], 'texture rows run bottom-up: the picture’s top is v = 1');
  assert.deepEqual(at(10, 3), [0, 0, 255, 255]);
  assert.equal(at(70, 10)[3], 0, 'an empty quadrant is clear');
  // withLook / withSticker never touch the old one
  const l2 = L.withSticker(look, 'door', null);
  assert.deepEqual(l2.st.map((s) => s.at), ['hood']);
  assert.deepEqual(look.st.map((s) => s.at), ['hood', 'door']);
  const l3 = L.withLook(l2, { rim: 'dish' });
  assert.equal(l3.rim, 'dish');
  assert.notEqual(L.lookKey(l3), L.lookKey(l2));
  assert.equal(L.isDefaultLook(L.withLook(L.withSticker(l3, 'hood', null), { rim: 'stock', rt: 'stock', tint: 0 })), true);
});

test('the look rides the fit and the wardrobe: fitKey changes with it, the cloud keeps it within budget', () => {
  const q = L.quantize(disc());
  const ct = { rim: 'mesh', rt: 'gold', tint: 2, st: ['door', 'hood', 'rear', 'tail'].map((at) => ({ at, s: 1, ...q })) };
  const f = cleanFit({ car: 'trueno', cc: ['#ffffff', '#111111'], ct });
  assert.equal(f.ct.rim, 'mesh');
  assert.equal(f.ct.st.length, 4);
  assert.equal(cleanFit(JSON.parse(JSON.stringify(f))).ct.st[3].px, q.px, 'over the wire and back');
  assert.notEqual(fitKey(f), fitKey(cleanFit({ ...f, ct: { ...ct, tint: 1 } })));
  assert.notEqual(fitKey(f), fitKey(cleanFit({ ...f, ct: null })));
  assert.equal(cleanFit({ car: 'uaz' }).ct, L.DEFAULT_LOOK, 'an older client: the factory car');
  // the wardrobe's tunes: by car, only the ones that differ, unknown cars dropped
  const tunes = cleanTunes({ trueno: ct, uaz: {}, zhiguli: ct, __proto__: { trueno: 1 } });
  assert.deepEqual(Object.keys(tunes), ['trueno']);
  assert.ok(ITEMS.car.some((it) => it.id === 'trueno'));
  // the cloud: kept, and the stickers are the first thing left behind on the way up when it would not fit
  const o = cleanOutfit({ car: 'trueno', tune: { trueno: ct } });
  assert.equal(o.tune.trueno.st.length, 4);
  const small = { v: 1, outfit: o, atlas: {} };
  assert.equal(fitBudget(small), small, 'under budget: as it is');
  const big = { v: 1, outfit: o, atlas: { pad: 'x'.repeat(CLOUD_BUDGET) } };
  const cut = fitBudget(big);
  assert.equal(cut.outfit.tune.trueno.st.length, 0);
  assert.equal(cut.outfit.tune.trueno.rim, 'mesh', 'the rims stay');
  assert.equal(big.outfit.tune.trueno.st.length, 4, 'the local copy is untouched');
});

// ---------------- the cars ----------------
test('the Trueno is a convertible now: no roof, no pillars behind the windscreen, a folded top behind the seats', () => {
  const a = CAR_MODELS.trueno.body();
  const n = a.pos.length / 3;
  let maxY = -Infinity, cabin = 0, top = 0;
  for (let i = 0; i < n; i++) {
    const x = a.pos[i * 3], y = a.pos[i * 3 + 1];
    maxY = Math.max(maxY, y);
    if (x > 0.5 && x < 1.15 && y > 1.0) cabin++; // where the roof and the B/C pillars were
    if (x > 1.2 && x < 1.6 && y > 0.8 && y < 1.05) top++;
  }
  assert.ok(a.pos.every(Number.isFinite));
  assert.ok(maxY < 1.26, `nothing above the windscreen's rail (${maxY.toFixed(3)})`);
  assert.equal(cabin, 0, 'the cabin is open');
  assert.ok(top > 20, 'the soft top, folded behind the back seat');
  assert.ok(CAR_MODELS.uaz.body().pos.some((v, i) => i % 3 === 1 && v > 1.6), '(the УАЗ keeps its roof)');
  assert.ok(n < 8192, `fits the buffers (${n})`);
});

test('rims: every style on both cars builds finite, and a body-tone rim wears the paint', () => {
  for (const id of ['uaz', 'trueno']) {
    for (const rim of L.RIMS) {
      for (const rt of ['stock', 'body', 'black']) {
        const w = CAR_MODELS[id].wheels(-1, { rim, rt });
        assert.ok(w.pos.length > 0 && w.pos.every(Number.isFinite), `${id}/${rim}/${rt}`);
        assert.ok(w.pos.length / 3 < 12000, `${id}/${rim}: ${w.pos.length / 3}`);
        if (rt === 'black') assert.ok([...w.dat].some((v, i) => i % 4 === 3 && v === L.RIM_TONES.black), `${id}/${rim} black`);
      }
    }
    const one = CAR_MODELS[id].wheels(0, { rim: 'mesh' });
    const all = CAR_MODELS[id].wheels(-1, { rim: 'mesh' });
    assert.ok(Math.abs(all.pos.length - 4 * one.pos.length) < 1e-9, `${id}: one wheel is a quarter of four`);
  }
});

test('stickers: four places on each car, facing out, a few mm off the panel, never mirrored', () => {
  const q = L.quantize(disc());
  const look = L.cleanLook({ st: L.DECAL_SLOTS.map((at) => ({ at, s: 1, ...q })) });
  for (const id of ['uaz', 'trueno']) {
    const M = CAR_MODELS[id];
    let quads = 0;
    for (const at of L.DECAL_SLOTS) {
      const defs = M.decals[at];
      assert.ok(defs && defs.length, `${id}.${at}`);
      for (const d of defs) {
        const dot = d.n[0] * d.up[0] + d.n[1] * d.up[1] + d.n[2] * d.up[2];
        assert.ok(Math.abs(dot) < 0.05, `${id}.${at}: up ⟂ n`);
        assert.ok(d.s > 0.1 && d.s < 1);
        quads++;
      }
    }
    const a = L.decalArrays(M.decals, look);
    assert.equal(a.count, quads * 6);
    assert.ok(a.pos.every(Number.isFinite) && a.uv.every((u) => u >= 0 && u <= 1));
    // each quad wound to face out (its normal along d.n): right = up × n
    for (let k = 0; k < quads; k++) {
      const P = (j) => new THREE.Vector3().fromArray(a.pos, (k * 6 + j) * 3);
      const nrm = new THREE.Vector3().subVectors(P(1), P(0)).cross(new THREE.Vector3().subVectors(P(2), P(0))).normalize();
      const all = L.DECAL_SLOTS.flatMap((at) => M.decals[at]);
      assert.ok(nrm.dot(new THREE.Vector3(...all[k].n).normalize()) > 0.95, `${id} quad ${k} faces out`);
    }
    const g = decalGeometry(M, look);
    assert.ok(g && g.getAttribute('uv').count === a.count);
  }
  assert.equal(decalGeometry(CAR_MODELS.uaz, L.DEFAULT_LOOK), null);
  assert.ok(stickerTexture(look) === stickerTexture(L.cleanLook(JSON.parse(JSON.stringify(look)))), 'one texture a look');
});

test('the paint and the stickers find their anchors in all three shaders (garage, stills, world)', () => {
  const frag = (file) => {
    const s = src(file);
    const m = /const FRAG = \/\* glsl \*\/ `([\s\S]*?)`;/.exec(s);
    assert.ok(m, file);
    return m[1].replace(/\$\{[^}]*\}/g, '');
  };
  for (const f of ['src/ui/garage.js', 'src/ui/mannequin.js']) {
    const sh = decalShaders('void main() {\n gl_Position = vec4(0.0);\n}', frag(f));
    assert.ok(sh.fragmentShader.includes('uniform sampler2D uDecal') && sh.fragmentShader.includes('texture2D(uDecal, vDUv)'), f);
    assert.ok(sh.vertexShader.includes('vDUv = uv;'));
  }
  const m = carWorldMaterial(['#ffffff', '#000000'], stickerTexture(L.cleanLook({ st: [{ at: 'door', ...L.quantize(disc()) }] })));
  assert.ok(m.fragmentShader.includes('uCarDye') && m.fragmentShader.includes('uDecal') && m.vertexShader.includes('vDUv = uv;'));
  const plain = carWorldMaterial(['#ffffff', '#000000']);
  assert.ok(plain.fragmentShader.includes('k == 52 || k == 53') && !plain.fragmentShader.includes('uDecal'));
});

// ---------------- the road film's car ----------------
test('the film car is the host’s: the Trueno on its own seats, its rims, its tint, its stickers', () => {
  const q = L.quantize(disc());
  const fit = cleanFit({ car: 'trueno', cc: ['#f2f2ee', '#16181a'], ct: { rim: 'spoke5', rt: 'gold', tint: 3, st: [{ at: 'door', ...q }] } });
  const car = buildFilmCar(fit);
  const U = car.userData;
  assert.equal(U.id, 'trueno');
  assert.equal(U.wheels.length, 4);
  assert.equal(U.pods.length, 2, 'the pop-ups');
  assert.ok(U.steer, 'a steering wheel to turn');
  let decal = false, tint = false;
  car.traverse((o) => {
    if (o.isMesh && o.material.uniforms?.uDecal) decal = true;
    if (o.isMesh && o.material.isMeshBasicMaterial && o.material.opacity > 0.7) tint = true;
  });
  assert.ok(decal && tint);
  const F = FILM_CARS.trueno;
  assert.equal(F.seats.length, 4);
  assert.deepEqual(F.seats.map((s) => !!s.over), [false, false, true, true], 'the back seat gets out over the side');
  assert.ok(F.cam < -0.3, 'the cabin is lower than the УАЗ’s: the close shots come down');
  disposeFilmCar(car);
  const uaz = buildFilmCar(cleanFit({ car: 'uaz' }));
  assert.equal(uaz.userData.id, 'uaz');
  assert.equal(uaz.userData.pods.length, 0);
  disposeFilmCar(uaz);
});

test('the Trueno stops outside the back gate (the yard’s УАЗ keeps its spot); they walk in, the shots stay in the open', () => {
  const Y = CFG.YARD, hd = Y.d / 2;
  const tp = arrivalPath('trueno'), up = arrivalPath();
  assert.deepEqual(up.at(-1), [Y.x + CAR_AT.x, Y.z + CAR_AT.z]);
  assert.ok(Math.abs(tp.at(-1)[1] - (Y.z + hd + TRUENO_STOP)) < 1e-9);
  const g = { world: forest(), escape: null };
  const f = new RoadFilm(g);
  f.carId = 'trueno';
  f.fc = FILM_CARS.trueno;
  f._plan();
  const end = f.carAt(f.tStop + 0.5, {});
  assert.ok(end.z > Y.z + hd + 4.5, `the nose short of the open leaves (${(end.z - Y.z - hd).toFixed(2)} m out)`);
  assert.ok(Math.abs(end.x - Y.x) < 1.2);
  assert.ok(f.tStop > TF + 10 && f.tStop < TF + 40);
  for (const w of f.walkTo) assert.ok(inYard(w.x, w.z, 0), 'they walk in');
  for (const w of f.walkVia) assert.ok(Math.abs(w.x - Y.x) < 1.6, 'through the gate');
  for (const k of ['yard', 'out']) {
    const sh = f.shots.find((s) => s.k === k);
    for (const tt of [sh.t0, (sh.t0 + sh.t1) / 2, Math.min(sh.t1, f.dur) - 0.01]) {
      const c = f.cameraAt(tt);
      assert.ok(c.p.every(Number.isFinite) && c.l.every(Number.isFinite), k);
      const uaz = { x: Y.x + CAR_AT.x, z: Y.z + CAR_AT.z };
      assert.ok(Math.hypot(c.p[0] - uaz.x, c.p[2] - uaz.z) > 2.6, `${k}: not inside the yard’s УАЗ`);
    }
  }
  // the in-car shots come down with the cabin
  const ru = new RoadFilm(g);
  const lo = f.cameraAt(10).p[1], hi = ru.cameraAt(10).p[1];
  assert.ok(hi - lo > 0.3, `radio shot lower in the Trueno (${(hi - lo).toFixed(2)})`);
});

test('4.2 strings exist in both languages', () => {
  const keys = ['tuneTitle', 'tuneRims', 'tuneRimColor', 'tuneTint', 'tuneStickers', 'tuneUpload', 'tuneReplace', 'tuneSize', 'tuneRemove', 'tuneNote', 'tuneBad', 'tuneFactory', 'tuneTint0', 'tuneTint3'];
  for (const lang of ['ru', 'en']) {
    setLang(lang);
    for (const k of keys) assert.notEqual(t(k), k, `${lang}.${k}`);
    for (const r of L.RIMS) assert.notEqual(t('tuneRim_' + r), 'tuneRim_' + r);
    for (const r of L.RIM_TONE_IDS) assert.notEqual(t('tuneTone_' + r), 'tuneTone_' + r);
    for (const s of L.DECAL_SLOTS) assert.notEqual(t('tuneSlot_' + s), 'tuneSlot_' + s);
  }
  setLang('ru');
});

test('4.2: the patch note leads its line (only 5.x above it), in both languages', async () => {
  const { NEWS } = await import('../src/ui/news.js');
  const { PROTOCOL } = await import('../src/net/net.js');
  const n = NEWS.find((x) => x.v === '4.2');
  const i = NEWS.indexOf(n);
  assert.ok(NEWS.slice(0, i).every((x) => /^5\./.test(x.v)), 'only the 5.x notes sit above it');
  assert.match(n.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(n.date >= NEWS[i + 1].date, 'not older than 4.1');
  assert.equal(n.ru.items.length, n.en.items.length);
  assert.ok(n.ru.items.length >= 5);
  assert.match(n.ru.items.join(' '), /развязать/);
  assert.match(n.en.items.join(' '), /convertible/);
  assert.equal(PROTOCOL, 27, '(5.0a, 5.0c–5.0f moved it for «Топь») the look rides the existing outfit field; a 4.1 build in the room still plays');
});
