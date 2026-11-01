// 3.0z: the reel's eye, once more. The author's ?perf strip (walking up to the garage door under the lamp, ~185 fps)
// showed a yellow 18–25 ms frame about ten times a second and «reel grab YES» on the worst one: 3.0w's
// createImageBitmap(webglCanvas) still makes the browser copy the full-size WebGL canvas inside the frame. Now the
// GPU draws the finished picture again into a small 8-bit target (Post.capture) and three's
// readRenderTargetPixelsAsync reads it through a pixel buffer and a fence: nothing in the frame waits for the GPU
// and the canvas is never read. Checked in the dev build: the grabbed frame matches the canvas drawn in the same
// frame (mean difference 3.7/255 at 64×36, grain included) and is the right way up.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { Post } from '../src/render/post.js';

const src = (p) => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');

test('Post.capture draws the finished picture into a small 8-bit target of its own and gives the screen back', () => {
  const calls = [];
  const p = new Post({ setRenderTarget(t) { calls.push(['target', t]); }, clear() {}, render(scene) { calls.push(['render', scene]); } });
  const rt = p.capture(640, 360);
  assert.equal(rt.width, 640);
  assert.equal(rt.height, 360);
  assert.equal(rt.texture.type, THREE.UnsignedByteType, 'readable without a float conversion');
  assert.equal(rt.depthBuffer, false);
  assert.deepEqual(calls.map((c) => c[0]), ['target', 'render', 'target']);
  assert.equal(calls[0][1], rt);
  assert.equal(p.quad.material, p.comp, 'the same composite the screen gets: grain, colour, vignette');
  assert.equal(calls[2][1], null, 'and the screen is the target again afterwards');
  assert.equal(p.capture(640, 360), rt, 'one target, reused');
  p.capture(840, 360);
  assert.equal(rt.width, 840, 'resized for a wider window, not reallocated');
});

test('the reel reads the small target asynchronously, before any path that touches the canvas', () => {
  const main = src('main.js');
  const fn = main.slice(main.indexOf('function highlightFrame(t) {'), main.indexOf('// ---------------- ?perf (3.0w)'));
  const asyncRead = fn.indexOf('renderer.readRenderTargetPixelsAsync(rt');
  assert.ok(asyncRead > 0);
  assert.ok(asyncRead < fn.indexOf('createImageBitmap(src'), 'the canvas copy is only the fallback now');
  assert.ok(fn.indexOf('post.capture(gw, gh)') < asyncRead);
  assert.ok(fn.indexOf('if (hlGrabber.busy > 3) return null;') < asyncRead, 'a slow encoder still skips shots');
  assert.match(fn, /ctx\.setTransform\(1, 0, 0, -1, 0, HL_H\)/, 'GL rows are bottom-up: flipped when drawn');
  assert.match(fn, /hlGrabber\.bufs\.push\(px\)/, 'pixel buffers are reused, not a megabyte of garbage a shot');
  // the frame loop still grabs right after the picture is finished
  assert.ok(main.indexOf('post.render(scene, camera);') < main.indexOf('highlights.update(game.time, highlightFrame)'));
});
