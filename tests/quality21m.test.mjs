import test from 'node:test';
import assert from 'node:assert/strict';
import { qualityPlan } from '../src/render/quality.js';
import { Post } from '../src/render/post.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('high restores 2x retina detail, without FXAA blur or adaptive downgrades', () => {
  const p = qualityPlan('high', 1280, 800, 2);
  near(p.maxScale, 2); near(p.outputScale, 2); near(p.minScale, p.maxScale);
  assert.equal(p.adaptive, false); assert.equal(p.fxaa, false);
  const post = new Post({});
  post.setSamples(4); post.setAntialias(p.fxaa); post.setSize(1280, 800, p.maxScale);
  assert.equal(post.rtScene.samples, 0);
  assert.equal(post.u.uAA.value, false);
  assert.equal(post.w, 2560); assert.equal(post.h, 1600);
});

test('on a 1x display high supersamples the scene, not the default framebuffer', () => {
  const p = qualityPlan('high', 1600, 900, 1);
  near(p.maxScale, 1.5); near(p.outputScale, 1);
  assert.ok(p.maxScale > p.outputScale, 'downsampling supplies spatial AA instead of HDR MSAA');
});

test('large monitors respect 4.4 MP for high, including the output canvas', () => {
  for (const [w, h, dpr] of [[1920, 1080, 2], [3840, 2160, 2], [7680, 2160, 3]]) {
    const p = qualityPlan('high', w, h, dpr);
    assert.ok(w * h * p.maxScale ** 2 <= 4.4e6 + .01);
    assert.ok(w * h * p.outputScale ** 2 <= 4.4e6 + .01);
    assert.ok(p.outputScale <= p.maxScale);
    near(p.minScale, p.maxScale);
  }
});

test('auto keeps adaptive resolution and FXAA, with its own 2.9 MP cap', () => {
  const p = qualityPlan('auto', 1280, 720, 2);
  near(p.maxScale, 1.5); near(p.minScale, .5);
  assert.equal(p.adaptive, true); assert.equal(p.fxaa, true);
  const big = qualityPlan('auto', 3840, 2160, 2);
  assert.ok(3840 * 2160 * big.maxScale ** 2 <= 2.9e6 + .01);
});

test('low retains the cheap 0.55 scale without FXAA or oversized output', () => {
  const p = qualityPlan('low', 1280, 720, 2);
  near(p.maxScale, .55); near(p.outputScale, .55);
  assert.equal(p.fxaa, false); assert.equal(p.adaptive, false);
});

test('texture/renderbuffer dimension limits cannot be exceeded on ultrawide windows', () => {
  const p = qualityPlan('high', 6000, 200, 2, 2048);
  assert.ok(6000 * p.maxScale <= 2048);
  assert.ok(6000 * p.outputScale <= 2048);
});

test('context recovery is explicitly bounded, while a fresh high choice can recover detail', () => {
  const fallback = qualityPlan('high', 1280, 800, 2, 16384, true);
  assert.ok(fallback.maxScale <= 1);
  assert.ok(1280 * 800 * fallback.maxScale ** 2 <= 1.2e6 + .01);
  const retry = qualityPlan('high', 1280, 800, 2, 16384, false);
  assert.ok(retry.maxScale > fallback.maxScale);
});

test('invalid settings/dimensions cannot produce NaN or negative buffer sizes', () => {
  for (const [q, w, h, dpr, size] of [['broken', 0, 0, NaN, NaN], ['high', NaN, -50, Infinity, -1]]) {
    const p = qualityPlan(q, w, h, dpr, size);
    for (const k of ['minScale', 'maxScale', 'outputScale']) assert.ok(Number.isFinite(p[k]) && p[k] > 0);
  }
});
