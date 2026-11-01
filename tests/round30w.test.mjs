// 3.0w: «тепаюсь, а не хожу» — the micro-teleports. Measured in node first: walking with uneven frames, the player
// and the camera move exactly in proportion to dt (3.1 m/s on every frame on the bog), so the game's own step is
// smooth; the hitch was in the browser's frame. The reel's eye (2.1u) copied the WebGL canvas into a 2D canvas with
// drawImage, ten times a second, inside the frame — a synchronous read of the GPU's picture that stalls until the
// GPU has finished, longer the heavier the frame (lamps, daylight). Now createImageBitmap takes the snapshot
// without waiting, and the shrink and the JPEG happen off the frame. The Stray's 3.0t stop-motion gait read as the
// same hitch, so she walks smoothly again, and her afterimage under a lamp shakes less. ?perf draws a frame strip.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p) => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');

test('the reel takes its snapshot without stopping the frame for the GPU', () => {
  const main = src('main.js');
  const fn = main.slice(main.indexOf('function highlightFrame(t) {'), main.indexOf('// ---------------- ?perf (3.0w)'));
  const bitmap = fn.indexOf('createImageBitmap(src');
  const sync = fn.indexOf('ctx.drawImage(src,');
  assert.ok(bitmap > 0, 'createImageBitmap is the way in');
  assert.ok(sync > bitmap, 'the synchronous drawImage of the GL canvas is only the fallback, after it');
  assert.match(fn, /if \(typeof createImageBitmap === 'function'\) \{/);
  assert.match(fn, /hlGrabber\.busy > 3\) return null/, 'a slow encoder skips frames instead of queueing them');
  assert.match(fn, /\.then\(\(bmp\) => \{\s*ctx\.drawImage\(bmp,/, 'the 2D copy happens later, from the bitmap');
  assert.match(src('ui/reel.js'), /if \(!b\) \{ this\.cache\.set\(f, null\); return; \}/, 'and the reel survives a frame with no picture');
});

test('?perf draws the frame strip and names what the longest frame was doing', () => {
  const main = src('main.js');
  assert.match(main, /perfGraph: params\.has\('perf'\)/);
  assert.match(main, /if \(DEBUG\.perfGraph\) perfGraph\(now, \{ faces: shadows\.faces \|\| 0, grab: hlGrabs !== grabsBefore, resized: perf\.resizedAt === perf\.frameNo/);
  assert.match(main, /PG\.flags\[\(worst - 1 \+ PG\.n\) % PG\.n\]/, 'a long interval is blamed on the frame before it');
});

test('the Stray walks smoothly again, and her afterimage under a lamp barely shakes', () => {
  const body = src('game/strayBody.js');
  assert.doesNotMatch(body, /function jerk\(/);
  assert.match(body, /const ph = P\.ph;/);
  assert.match(src('game/stray.js'), /color: 0xcdbf9f, jitter: 0\.15 \}/);
});
