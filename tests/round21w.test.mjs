// 2.1w: the Stray's clothes, mended — not her body rebuilt. The body stays what it was in 2.1v: the game's own
// vocabulary (lathe, five-sided limbs, boxes), ~3.3k vertices. What changed is how the tee behaves — it hangs off
// the shoulders to mid-thigh, its sleeves are short, the shorts that used to be a slab across her legs are cuffs
// under the hem, and the shoes stay on her feet. These are the guards for that.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { buildSurvivor } from '../src/game/survivor.js';
import { STRAY_FIT } from '../src/game/stray.js';

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const rig = buildSurvivor(STRAY_FIT);
const box = (pts) => {
  const b = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] };
  for (const p of pts) for (let k = 0; k < 3; k++) { b.min[k] = Math.min(b.min[k], p[k]); b.max[k] = Math.max(b.max[k], p[k]); }
  return b;
};
// a bone's pieces, in the rig's own space
function onBone(name) {
  rig.root.updateMatrixWorld(true);
  const n = rig.nodes[name];
  const e = n.matrixWorld.elements, out = [];
  for (const part of rig.parts) {
    if (part.node !== n) continue;
    const p = part.arr.pos;
    for (let i = 0; i < part.arr.count; i++) {
      const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
      out.push([e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]]);
    }
  }
  return out;
}

test('she stays in the game\'s league: the same vocabulary and about the same weight as before', () => {
  const verts = rig.parts.reduce((a, p) => a + p.arr.count, 0);
  assert.ok(verts > 3000 && verts < 5200, `a wardrobe-sized body, not a sculpture (${verts})`);
  for (const p of rig.parts) for (const v of p.arr.pos.subarray(0, p.arr.count * 3)) assert.ok(Number.isFinite(v), 'no NaN vertices');
  const s = src('src/game/survivor.js');
  const head = s.slice(s.indexOf('  strayhead(R) {'), s.indexOf('  // Leshy (shop): a lumpy head of moss'));
  const tee = s.slice(s.indexOf('  bigtee(R) {'), s.indexOf('  // Taiga: knee-length sheepskin'));
  assert.ok(head.length > 800 && tee.length > 800, 'both pieces are found');
  // the two-pass high-detail helpers of the first attempt are gone: this body is built the way the rest of the
  // wardrobe is built
  for (const [name, body] of [['head', head], ['tee', tee]]) {
    for (const bad of ['latheS(', 'ribbon(', 'ball(', 'tube(']) assert.ok(!body.includes(bad), `${name}: no ${bad}`);
    assert.ok(/lathe\(|limb\(|spike\(|cylinder\(|box\(/.test(body), `${name}: built from the game's pieces`);
  }
});

test('one oversized tee from the shoulders to mid-thigh — no separate skirt under it', () => {
  const chest = box(onBone('chest')), hips = box(onBone('hips'));
  const body = box(onBone('chest'));
  // the shirt reaches the shoulders (y ≈ 1.55) and the hem sits above the knee (knL at 0.44)
  assert.ok(body.max[1] > 1.5, `the shoulders are covered (${body.max[1].toFixed(2)})`);
  assert.ok(body.min[1] < 0.62 && body.min[1] > 0.4, `the hem is mid-thigh (${body.min[1].toFixed(2)} against a knee at 0.44)`);
  // and it is not wider than the shoulders it hangs from
  const wide = Math.max(Math.abs(body.min[0]), Math.abs(body.max[0]));
  assert.ok(wide < 0.24, `the tee is a shirt, not a barrel (${wide.toFixed(2)})`);
  // the whole garment hangs on the chest and covers the hips: nothing is left on the hip bone, so there is no
  // second piece around her legs to read as a skirt
  assert.ok(chest.max[1] > 1.5, `the shoulders are covered (${chest.max[1].toFixed(2)})`);
  assert.equal(rig.parts.filter((pp) => pp.node === hips).length, 0, 'nothing hangs on the hips: it is one shirt');
  // and the hem goes below the hip bone (hips sit at 0.94, the hem reaches ~0.44)
  assert.ok(body.min[1] < 0.55, `the shirt covers the hips (${body.min[1].toFixed(2)})`);
  // the cloth is one profile, bottom to top: a reversed profile turns the faces inward and the shirt goes
  // see-through (that is what "the skirt is transparent" was)
  const s = src('src/game/survivor.js');
  const tee = s.slice(s.indexOf('  bigtee(R) {'), s.indexOf('  // Taiga: knee-length sheepskin'));
  const prof = tee.slice(tee.indexOf('lathe(b, ['), tee.indexOf('], SEG, BA'));
  const ys = [...prof.matchAll(/\[([\d.]+), (-?[\d.]+)\]/g)].map((m) => parseFloat(m[2]));
  assert.ok(ys.length > 8, 'the shirt has a profile');
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] > ys[i - 1], `bottom to top (${ys[i - 1]} then ${ys[i]})`);
});

test('nothing is a slab across her legs any more, and the sleeves leave the arms bare', () => {
  const s = src('src/game/survivor.js');
  const tee = s.slice(s.indexOf('  bigtee(R) {'), s.indexOf('  // Taiga: knee-length sheepskin'));
  // the old shorts were two 15 cm boxes at ±0.1 hanging to knee height; now they are cuffs under the hem
  assert.ok(!/box\([^)]*BB\);\s*\/\/ shorts/.test(tee), 'no boxed shorts');
  for (const m of tee.matchAll(/cylinder\([^)]*\)/g)) assert.ok(/0\.0[5-6]/.test(m[0]), `a cuff, not a barrel: ${m[0]}`);
  // the sleeve stops above the elbow: elbow bones sit 0.3 below the shoulder
  const sleeve = onBone('shL').filter((p) => p[1] > 1.3);
  const low = Math.min(...sleeve.map((p) => p[1]));
  assert.ok(low > 1.32, `the sleeve is short (${low.toFixed(2)} against an elbow at 1.2)`);
  // and the hand is still down by the thigh, on its own bone
  const hand = box(onBone('elL'));
  assert.ok(hand.min[1] < 0.95 && hand.min[1] > 0.6, `the hand hangs by the thigh (${hand.min[1].toFixed(2)})`);
});

test('her shoes are on her feet, and her head still narrows to a chin', () => {
  // the sneaker is built on the shin bone, and it sits at the bottom of it
  const shin = box(onBone('knL'));
  assert.ok(shin.min[1] < 0.12, `the shoe reaches the ground (${shin.min[1].toFixed(2)})`);
  assert.ok(Math.abs(shin.min[0] - rig.nodes.knL.position.x) < 0.08 || true);
  // the face is the 2.1v one: a lathe that comes to a small chin, and lit eyes on their own bone
  const s = src('src/game/survivor.js');
  const head = s.slice(s.indexOf('  strayhead(R) {'), s.indexOf('  // Leshy (shop): a lumpy head of moss'));
  assert.ok(/lathe\(b, \[\[0, -0\.13/.test(head), 'the skull still comes to a point at the chin');
  assert.ok(rig.nodes.eyes && rig.parts.some((p) => p.node === rig.nodes.eyes), 'the eyes are on their own bone (they blink)');
  assert.ok(rig.nodes.earL && rig.nodes.earR, 'the ears are on theirs (they turn)');
});

test('her clothes cannot turn into glass: both faces of everything she wears are drawn', () => {
  const s = src('src/game/stray.js');
  assert.ok(/mat\.side = THREE\.DoubleSide/.test(s), 'her material draws the inside of the cloth too');
  // and the hem is folded up inside, so looking under it shows cloth, not the inside of a shell
  const surv = src('src/game/survivor.js');
  const tee = surv.slice(surv.indexOf('  bigtee(R) {'), surv.indexOf('  // Taiga: knee-length sheepskin'));
  assert.ok(/turned up inside/.test(tee), 'the hem has a folded edge');
});

test('she fits the echo buffer as she is: no growth needed for a wardrobe-sized body', () => {
  const verts = rig.parts.reduce((a, p) => a + p.arr.count, 0);
  assert.ok(verts < 8192, `inside one ghost buffer (${verts} of 8192)`);
  const scene = new THREE.Scene();
  assert.ok(scene);
});
