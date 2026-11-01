// 3.0t: Дворняжка — the Stray remade in the game's own style. Not a girl in a tee: a mongrel that learned to stand
// like the people it followed, in someone else's ватник. Her own rig (game/strayBody.js) with a dog's legs — knee
// forward, hock back, on its toes — arms to the knees, a muzzle with a jaw on its own hinge, hackles, eyeshine;
// a walk on her toes (stop-motion in 3.0t, smooth since 3.0w), stops to smell the air, a gallop on all fours, a grab at the throat. Her player skin is the
// muzzle as a mask and the torn coat; her sounds are a dog's (sniffs, whine, growl, nails) and a person's «эй».
// (Replaces tests/round21w, which guarded the tee.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { KIND } from '../src/world/builder.js';
import { buildStrayBody, poseStray, poseStrayLunge, strayVerts, STRAY_BONES, STRAY_DYES } from '../src/game/strayBody.js';
import { Stray, STRAY_FIT, STRAY_SNIFF } from '../src/game/stray.js';
import { buildSurvivor, rigVerts } from '../src/game/survivor.js';

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const _v = new THREE.Vector3();
const at = (R, name, p = [0, 0, 0]) => { R.root.updateMatrixWorld(true); return _v.set(...p).applyMatrix4(R.nodes[name].matrixWorld).toArray(); };
function span(R) {
  R.root.updateMatrixWorld(true);
  let lo = Infinity, hi = -Infinity;
  for (const p of R.parts) {
    const e = p.node.matrixWorld, a = p.arr.pos;
    for (let i = 0; i < p.arr.count; i++) { _v.set(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]).applyMatrix4(e); lo = Math.min(lo, _v.y); hi = Math.max(hi, _v.y); }
  }
  return [lo, hi];
}
const kinds = (R, filter = () => true) => {
  const set = new Set();
  for (const p of R.parts) if (filter(p)) for (let i = 0; i < p.arr.count; i++) set.add(p.arr.dat[i * 4 + 3]);
  return set;
};
const run = (R, mode, sec, o = {}) => { for (let i = 0; i < sec * 30; i++) poseStray(R, { t: i / 30, dt: 1 / 30, mode, speed: o.speed ?? (mode === 'chase' ? 4.5 : mode === 'grab' ? 0 : 1.2), anger: 1, sniff: o.sniff || 0 }); };

// ---------------------------------------------------------------- the body
test('her own rig, in the shape people.js and ghosts.js read, inside one echo buffer', () => {
  const R = buildStrayBody();
  assert.ok(R.root && R.nodes && Array.isArray(R.parts) && R.dyes?.length === 4);
  for (const p of R.parts) assert.ok(p.node && p.arr?.pos && p.arr?.dat && p.arr.count > 0);
  const verts = strayVerts(R);
  assert.ok(verts > 3000 && verts < 8192, `a creature, not a stick figure, and one ghost buffer holds it (${verts} of 8192)`);
  for (const n of ['hips', 'spine', 'chest', 'neck', 'head', 'jaw', 'hackle', 'earL', 'earR', 'shL', 'elL', 'haL', 'thL', 'knL', 'hkL', 'pwL', 'tail']) assert.ok(R.nodes[n], n);
  // the coat, the fur, the bare skin and the stitching are dyes; the eyes are eyeshine; the nails and teeth are bone
  const k = kinds(R);
  for (const d of [13, 14, 15, 16]) assert.ok(k.has(d), `dyed kind ${d}`);
  assert.ok(k.has(KIND.EYE), 'eyeshine');
  assert.ok(k.has(KIND.BONE));
  // the dyes go in as the survivors' do: the hex as it is, not darkened by an sRGB → linear conversion
  const c = new THREE.Color(); c.setHex(parseInt(STRAY_DYES[2].slice(1), 16), THREE.LinearSRGBColorSpace);
  assert.ok(Math.abs(R.dyes[2].r - c.r) < 1e-6);
});

test('a dog\'s leg: the knee forward of the hip, the hock behind the knee, standing on its toes', () => {
  const R = buildStrayBody();
  const th = at(R, 'thL'), kn = at(R, 'knL'), hk = at(R, 'hkL'), pw = at(R, 'pwL');
  assert.ok(kn[2] > th[2] + 0.08, 'the knee juts forward');
  assert.ok(hk[2] < kn[2] - 0.1, 'the hock goes back');
  assert.ok(hk[1] > 0.15, 'the heel is high off the ground');
  assert.ok(Math.abs(pw[1]) < 0.02, 'the ball of the foot is on the ground');
  assert.equal(STRAY_BONES.hips[1], 0.98);
  const [lo, hi] = span(R);
  assert.ok(lo > -0.02 && hi > 1.75 && hi < 2.1, `a man's height in a coat (${lo.toFixed(2)}..${hi.toFixed(2)})`);
});

test('the arms hang to the knees, the coat hangs to mid-thigh, and the head is a muzzle out in front', () => {
  const R = buildStrayBody();
  run(R, 'follow', 2, { speed: 0 });
  const tip = at(R, 'haL', [0, -0.2, 0.05]), knee = at(R, 'knL');
  assert.ok(tip[1] < knee[1] + 0.2, `fingertips at the knees (${tip[1].toFixed(2)} vs knee ${knee[1].toFixed(2)})`);
  const nose = at(R, 'head', [0, -0.033, 0.245]), skull = at(R, 'head', [0, 0.01, -0.04]);
  assert.ok(nose[2] > skull[2] + 0.2, 'the nose is well in front of the skull');
});

test('nothing sinks into the ground in any gait, and the walk is smooth (3.0w: no more stop-motion)', () => {
  for (const mode of ['follow', 'anger', 'chase', 'grab', 'leave']) {
    const R = buildStrayBody();
    let worst = 9;
    for (let i = 0; i < 150; i++) {
      poseStray(R, { t: i / 30, dt: 1 / 30, mode, speed: mode === 'chase' ? 4.5 : mode === 'grab' ? 0 : 1.2, anger: 1 });
      worst = Math.min(worst, span(R)[0]);
    }
    assert.ok(worst > -0.025, `${mode}: lowest point ${worst.toFixed(3)} m`);
  }
  // the walk: frame-to-frame changes of the thigh stay even — no snaps, no holds (the author read them as hitches)
  const R = buildStrayBody();
  const d = [];
  let prev = null;
  for (let i = 0; i < 240; i++) {
    poseStray(R, { t: i / 60, dt: 1 / 60, mode: 'follow', speed: 1.3 });
    const x = R.nodes.thL.rotation.x;
    if (prev !== null && i > 60) d.push(Math.abs(x - prev));
    prev = x;
  }
  const mean = d.reduce((a, b) => a + b, 0) / d.length, max = Math.max(...d);
  assert.ok(max < mean * 2.5, `smooth: the biggest frame step (${max.toFixed(4)}) is close to the average (${mean.toFixed(4)})`);
});

test('the poses say what it is doing: sniffing, angry, galloping, taking', () => {
  const stand = buildStrayBody(); run(stand, 'follow', 2, { speed: 0 });
  const sniff = buildStrayBody(); run(sniff, 'follow', 2, { speed: 0, sniff: 1 });
  assert.ok(at(sniff, 'head', [0, -0.033, 0.245])[1] > at(stand, 'head', [0, -0.033, 0.245])[1] + 0.05, 'sniffing, the nose goes up');
  const angry = buildStrayBody(); run(angry, 'anger', 2, { speed: 0 });
  assert.ok(angry.nodes.hackle.rotation.x < -0.6, 'the hackles rise');
  assert.ok(angry.nodes.jaw.rotation.x > 0.2, 'the lips come off the teeth');
  const walk = buildStrayBody(); run(walk, 'follow', 2);
  const gallop = buildStrayBody(); run(gallop, 'chase', 2);
  assert.ok(at(gallop, 'chest')[1] < at(walk, 'chest')[1] - 0.15, 'on the chase it drops to all fours');
  const lean = gallop.nodes.spine.rotation.x + gallop.nodes.chest.rotation.x;
  assert.ok(lean > 1.0, `nearly flat (${lean.toFixed(2)} rad forward)`);
  const take = buildStrayBody(); run(take, 'grab', 2);
  const hand = at(take, 'haL'), chest = at(take, 'chest');
  assert.ok(hand[2] > chest[2] + 0.4 && hand[1] > 1.2 && hand[1] < 2.0, `the hands go to a throat in front of it (${hand.map((x) => x.toFixed(2))})`);
  assert.ok(take.nodes.jaw.rotation.x > 0.6, 'the jaw wide open');
  const lunge = buildStrayBody(); poseStrayLunge(lunge, 0.4);
  assert.ok(lunge.nodes.jaw.rotation.x > 0.7 && lunge.nodes.hackle.rotation.x <= -0.9);
});

// ---------------------------------------------------------------- the controller
function fakeGame() {
  const calls = [];
  const g = {
    state: 'play', auth: true, awake: true, time: 0, day: 4, daysTotal: 4,
    rng: { float: (a, b) => (a + b) / 2, next: () => 0.9 },
    scene: new THREE.Scene(),
    world: { col: { free: () => true }, inYard: () => false, lake: null, terrain: { height: () => 0 }, losBlocked: () => false },
    player: { x: 0, z: 0, y: 0, alive: true, sprinting: false, speed: 0, id: 'me', name: 'me', yaw: 0 },
    diffDay: () => 4,
    livePlayers() { return [this.player]; },
    playerById(id) { return id === 'me' ? this.player : null; },
    ghosts: { spawned: 0, spawn() { g.ghosts.spawned++; return { strength: 0 }; }, refresh() {}, release() {} },
    audio: new Proxy({}, { get: (o, k) => (...a) => calls.push(k) }),
    hud: { flashAlert() {} }, addTrauma() {}, fx: {}, glowAt: () => 0.5, distToEars: () => 8,
    doors: null, escape: null, stats: { seen: {} }, online: false, sync: null, kill() {},
  };
  return { g, calls };
}

test('following, she stops to smell the air — and sometimes, instead, says «эй»', () => {
  const { g, calls } = fakeGame();
  const s = new Stray(g);
  s.ensureRig();
  s.x = 0; s.z = 12; s.phase = 'follow'; s.coolT = 0;
  let stopped = 0, walked = 0;
  for (let i = 0; i < 30 * 40; i++) {
    g.time += 1 / 30;
    s.update(1 / 30);
    if (s.phase !== 'follow') { s.phase = 'follow'; }
    s.z = 12; // (she is held at a distance she would walk)
    if (s.speed === 0 && s.sniff > 0.5) stopped++; else if (s.speed > 0) walked++;
  }
  assert.ok(stopped > 30 && walked > 30, `she walks and she stops (${walked} / ${stopped} frames)`);
  assert.ok(calls.includes('straySniff'), 'the sniffs are heard');
  assert.ok(STRAY_SNIFF.hey > 0 && STRAY_SNIFF.hey < 0.5, 'the word is rare');
  const { g: g2, calls: c2 } = fakeGame();
  g2.rng.next = () => 0.05; // a stop where she speaks
  const s2 = new Stray(g2); s2.ensureRig(); s2.x = 0; s2.z = 12; s2.phase = 'follow'; s2.sniffT = 0;
  s2.update(1 / 30);
  assert.ok(c2.includes('strayHey'));
});

test('wearing someone, she is not seen in the light — but the echo still finds her', () => {
  const { g } = fakeGame();
  const s = new Stray(g);
  s.ensureRig();
  s.phase = 'wear';
  s._present(1 / 30);
  assert.equal(s.rig.root.visible, false, 'in the light the friends see their friend');
  const before = g.ghosts.spawned;
  s.reveal({ x: 0, y: 1.4, z: 0, prevR: -1, curR: 5, radius: 20 });
  assert.equal(g.ghosts.spawned, before + 1, 'a wave reaching her draws what she really is');
  s.phase = 'follow';
  s._present(1 / 30);
  assert.equal(s.rig.root.visible, true);
  assert.match(src('src/game/stray.js'), /mat\.side = THREE\.DoubleSide/, 'an open, torn coat and single-sheet ears: both faces drawn');
});

// ---------------------------------------------------------------- the skin
test('her skin for the player: the muzzle worn as a mask and someone else\'s torn coat', () => {
  const R = buildSurvivor(STRAY_FIT);
  const v = rigVerts(R);
  assert.ok(v > 1200 && v < 4500, `a wardrobe-sized outfit (${v})`);
  assert.ok(R.nodes.earL && R.nodes.earR, 'the ears hang on their own bones (poseFur twitches them)');
  const head = kinds(R, (p) => p.node === R.nodes.head);
  assert.ok(head.has(KIND.BONE), 'the dried teeth');
  assert.ok(!head.has(17), 'no glowing eyes: the eyes in the holes are the wearer\'s');
  // the right sleeve is gone at the elbow and the arm under it is bare; the left one is whole
  const flesh = (node) => R.parts.filter((p) => p.node === node).reduce((n, p) => { for (let i = 0; i < p.arr.count; i++) if (p.arr.dat[i * 4 + 3] === KIND.FLESH) n++; return n; }, 0);
  assert.ok(flesh(R.nodes.elR) > flesh(R.nodes.elL) * 2, `the bare right forearm (${flesh(R.nodes.elR)} vs ${flesh(R.nodes.elL)}: the left is only a hand)`);
  // the coat hangs to mid-thigh
  R.root.updateMatrixWorld(true);
  let low = 9;
  for (const p of R.parts) if (p.node === R.nodes.chest) for (let i = 0; i < p.arr.count; i++) { _v.set(p.arr.pos[i * 3], p.arr.pos[i * 3 + 1], p.arr.pos[i * 3 + 2]).applyMatrix4(p.node.matrixWorld); low = Math.min(low, _v.y); }
  assert.ok(low < 0.68 && low > 0.4, `the hem at mid-thigh (${low.toFixed(2)})`);
  const surv = src('src/game/survivor.js');
  assert.ok(!/wolf skull|oversized tee/i.test(surv.slice(surv.indexOf('  bigtee(R) {'), surv.indexOf('  // Taiga'))), 'the tee is gone');
});

// ---------------------------------------------------------------- the voice, the words, the wiring
test('her voice is a dog\'s: sniffs, a whine, a growl that catches, nails — and a person\'s «эй»', () => {
  const audio = src('src/audio/audio.js');
  const block = audio.slice(audio.indexOf("  // ---------- the Stray (2.1v; a dog's voice since 3.0t)"), audio.indexOf('  anglerGrab('));
  for (const m of ['strayHum', 'straySniff', 'strayAnger', 'strayTake', 'strayLeave', 'strayStep', 'strayHey', 'strayMet', 'strayRadio', '_sniffs', '_whine', '_hey']) {
    assert.match(block, new RegExp(`  ${m}\\(`), m);
  }
  assert.doesNotMatch(block, /392, 466\.2, 349\.2/, 'the three hummed notes are gone');
  assert.match(block, /vowel: \[\[0, 'e'\], \[0\.16, 'e'\], \[0\.3, 'i'\]\]/, '«эй»: e gliding to i, in a throat');
  assert.match(block, /strayStep\(x, y, z, I = 0\.6, four = false\)/, 'two feet walking, four on the chase');
  assert.match(src('src/game/stray.js'), /this\.phase === 'chase'\)/);
  assert.match(src('src/ui/sfxtest.js'), /Дворняжка: «эй»/, 'and every one of them can be auditioned with ?sfx');
});

test('the words, the atlas, the close-up and the wardrobe all describe the same thing', () => {
  const atlas = src('src/ui/atlasData.js');
  const ru = atlas.slice(atlas.indexOf("        name: 'Найдёныш'"), atlas.indexOf("        quote: 'Она сказала"));
  const en = atlas.slice(atlas.indexOf("        name: 'The Stray'"), atlas.indexOf("        quote: 'She said"));
  assert.ok(ru.length > 200 && en.length > 200);
  assert.doesNotMatch(ru, /девочк|футболк|волос/i);
  assert.doesNotMatch(en, /girl|tee|hair/i);
  assert.doesNotMatch(en, /[Ѐ-ӿ]/, 'the English page is English');
  assert.doesNotMatch(atlas, /Свет в лицо — три секунды/, 'no tip for a mechanic the game does not have');
  const outfit = src('src/game/outfit.js');
  assert.match(outfit, /strayhead: \{ name: 'Морда'/);
  assert.match(outfit, /bigtee: \{ name: 'Чужой ватник'/);
  assert.doesNotMatch(outfit.slice(outfit.indexOf("strayhead: { name: 'Muzzle'"), outfit.indexOf("strayhead: { name: 'Muzzle'") + 700), /[Ѐ-ӿ]/);
  const game = src('src/game/game.js');
  assert.match(game, /if \(type === 'stray'\) return \(this\.scareRigs\.stray \|\|= buildStrayBody\(\)\);/);
  assert.match(game, /poseStrayLunge\(rig, tt\)/);
  assert.match(src('src/ui/atlasModels.js'), /const rig = buildStrayBody\(\);/);
});
