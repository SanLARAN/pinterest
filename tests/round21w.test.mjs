// 2.1w: the Stray's model, remade. Not a stack of boxes any more — one skull that narrows into a jaw, hair
// that hangs in locks, a tee that falls off the shoulders, arms and legs that are round all the way round.
// The numbers here are shape guards (density, proportions, no flat-sided limbs left) plus the echo buffer,
// which has to be able to hold a body this heavy instead of cutting it in half.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { buildSurvivor } from '../src/game/survivor.js';
import { STRAY_FIT } from '../src/game/stray.js';
import { Ghosts } from '../src/render/ghosts.js';

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const rig = buildSurvivor(STRAY_FIT);

// every vertex of the outfit, in the root's space, so the shape can be measured
function bake(model) {
  model.root.updateMatrixWorld(true);
  const out = [];
  for (const part of model.parts) {
    const e = part.node.matrixWorld.elements, p = part.arr.pos;
    for (let i = 0; i < part.arr.count; i++) {
      out.push([
        e[0] * p[i * 3] + e[4] * p[i * 3 + 1] + e[8] * p[i * 3 + 2] + e[12],
        e[1] * p[i * 3] + e[5] * p[i * 3 + 1] + e[9] * p[i * 3 + 2] + e[13],
        e[2] * p[i * 3] + e[6] * p[i * 3 + 1] + e[10] * p[i * 3 + 2] + e[14],
      ]);
    }
  }
  return out;
}

test('her body sits inside the game\'s own budget: denser than a coat, lighter than a showcase', () => {
  const verts = rig.parts.reduce((a, p) => a + p.arr.count, 0);
  assert.ok(verts > 5000, `dense enough for a round silhouette (${verts})`);
  assert.ok(verts < 10000, `and still in the wardrobe's league, not a sculpt (${verts})`);
  // the two pieces she is made of, on their own
  const head = rig.parts.filter((pp) => pp.node === rig.nodes.head || pp.node === rig.nodes.eyes
    || pp.node === rig.nodes.earL || pp.node === rig.nodes.earR).reduce((a, pp) => a + pp.arr.count, 0);
  assert.ok(head > 2000 && head < 4500, `a head with a face and hair, at game density (${head})`);
  for (const p of rig.parts) {
    for (const v of p.arr.pos.subarray(0, p.arr.count * 3)) assert.ok(Number.isFinite(v), 'no NaN vertices');
  }
});

test('she stands like a person: 1.8–2 m to the tips of her ears, hands at hand height', () => {
  const v = bake(rig);
  const ys = v.map((p) => p[1]);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  assert.ok(maxY - minY > 1.8 && maxY - minY < 2.0, `height ${(maxY - minY).toFixed(2)} m`);
  const maxX = Math.max(...v.map((p) => Math.abs(p[0])));
  assert.ok(maxX < 0.45, `nothing sticks out sideways past the hands (${maxX.toFixed(2)})`);
  // her hands hang by the thigh: there is body below the waist, and nothing wider than the sleeves down there
  const low = v.filter((p) => p[1] < 1.05);
  assert.ok(low.length > 2500, 'legs and hands are a real part of the body');
  const widest = Math.max(...low.map((p) => Math.abs(p[0])));
  assert.ok(widest < 0.36, `below the waist she is narrower than her shoulders (${widest.toFixed(2)})`);
});

test('the face has a jaw: the skull narrows towards the chin instead of staying a ball', () => {
  // the skull alone: the biggest piece hung on the head bone, measured in its own space
  const skullPart = rig.parts.filter((p) => p.node === rig.nodes.head).sort((a, b) => b.arr.count - a.arr.count)[0];
  const skull = [];
  for (let i = 0; i < skullPart.arr.count; i++) {
    skull.push([skullPart.arr.pos[i * 3], skullPart.arr.pos[i * 3 + 1], skullPart.arr.pos[i * 3 + 2]]);
  }
  const widthAt = (y0, y1) => {
    const row = skull.filter((q) => q[1] >= y0 && q[1] <= y1);
    return row.length ? Math.max(...row.map((q) => Math.abs(q[0]))) : 0;
  };
  const chin = widthAt(-0.132, -0.112);
  const cheeks = widthAt(-0.03, 0.012);
  const crown = widthAt(0.08, 0.12);
  assert.ok(chin > 0.02 && cheeks > 0.05 && crown > 0.03, 'the whole head is there');
  assert.ok(chin < cheeks * 0.8, `the chin is narrow (${chin.toFixed(3)} vs ${cheeks.toFixed(3)})`);
  assert.ok(crown < cheeks * 1.02, `and the crown is not wider than the cheekbones (${crown.toFixed(3)})`);
});

test('nothing on her is built out of boxes any more', () => {
  const s = src('src/game/survivor.js');
  const head = s.slice(s.indexOf('  strayhead(R) {'), s.indexOf('  // Leshy (shop): a lumpy head of moss'));
  const tee = s.slice(s.indexOf('  bigtee(R) {'), s.indexOf('  // Taiga: knee-length sheepskin'));
  assert.ok(head.length > 2000 && tee.length > 2000, 'both pieces are found');
  for (const [name, body] of [['head', head], ['tee', tee]]) {
    assert.ok(!/b\.box\(/.test(body), `${name}: no boxes`);
    assert.ok(!/b\.limb\(/.test(body), `${name}: no 4-sided limbs`);
    assert.ok(!/b\.octa\(/.test(body), `${name}: no octahedra for flesh`);
    assert.ok(/latheS\(|ribbon\(|tube\(|ball\(/.test(body), `${name}: made of surfaces`);
  }
});

test('the echo can hold her: a dense body grows its own afterimage buffer instead of being cut off', () => {
  const scene = new THREE.Scene();
  const ghosts = new Ghosts(scene, 2, 64); // a deliberately tiny pool, so the growth is the thing being tested
  const model = {
    key: 'probe',
    root: new THREE.Object3D(),
    parts: rig.parts.map((p) => ({ node: new THREE.Object3D(), arr: p.arr })),
  };
  model.root.add(...model.parts.map((p) => p.node));
  const need = rig.parts.reduce((a, p) => a + p.arr.count, 0);
  const g = ghosts.spawn(model, 0, {});
  assert.equal(g.count, need, 'every vertex made it into the echo');
  assert.ok(g.capacity >= need, 'the buffer grew to fit');
  assert.equal(g.geo.drawRange.count, need);
  // and re-using it keeps the whole body
  ghosts.refresh(g, model);
  assert.equal(g.count, need);
});
