// 3.1g: «звук пропадает на всём ПК» — on Bluetooth headphones, around a generator start, coming back by itself.
// Measured first: the game's own sound is clean (174 sound methods rendered offline, not one non-finite sample,
// peak 0.92), a generator start costs ~4 ms of game step and ~8 ms of render, and the audio graph runs at ~2 % of
// real time. What was left is the buffer: the game asked for the smallest one ('interactive', ~10 ms), where any
// hiccup underruns — and Bluetooth stacks answer an underrun by dropping the stream for seconds, PC-wide.
// Now «Звук: авто / быстрый отклик / Bluetooth»: Bluetooth (and «авто» on a Bluetooth-looking output) uses
// 'playback', a buffer that does not run dry.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }
globalThis.localStorage = globalThis.localStorage || new Mem();
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const { latencyFor, AudioEngine } = await import('../src/audio/audio.js');

test('the buffer: Bluetooth gets the large one, the fast setting the small one, auto looks at the output', () => {
  assert.equal(latencyFor('bt', ''), 'playback');
  assert.equal(latencyFor('fast', 'Headphones (WH-1000XM4 Stereo)'), 'interactive', 'the player said fast: fast');
  for (const name of ['Headphones (WH-1000XM4 Stereo)', 'Headset (AirPods Pro Hands-Free AG Audio)', 'Наушники (Galaxy Buds2)', 'Speakers (JBL Flip 5)', 'Bluetooth Audio']) {
    assert.equal(latencyFor('auto', name), 'playback', name);
  }
  for (const name of ['Speakers (Realtek(R) Audio)', 'Динамики (Realtek High Definition Audio)', 'LG HDR 4K (NVIDIA High Definition Audio)', '']) {
    assert.equal(latencyFor('auto', name), 'interactive', name || '(no name before the mic is allowed)');
  }
});

test('the engine opens its context with that buffer; the choice is a device setting and is in the menu', () => {
  assert.equal(new AudioEngine().latencyHint, 'interactive', 'the default stays the quick one');
  assert.match(src('src/audio/audio.js'), /new AC\(\{ latencyHint: this\.latencyHint \|\| 'interactive' \}\)/);
  assert.match(src('src/core/persistence.js'), /DEVICE_KEYS=\[[^\]]*'audioBuffer'/, 'your headphones, not your account: cloud sync leaves it alone');
  assert.match(src('src/core/storage.js'), /audioBuffer: 'auto'/);
  assert.match(src('index.html'), /<select id="sAudioBuf"><option value="auto"[^>]*><\/option><option value="fast"[^>]*><\/option><option value="bt"/);
  assert.match(src('src/ui/menus.js'), /bindSelect\('sAudioBuf', 'audioBuffer'\)/);
  const main = src('src/main.js');
  assert.match(main, /audio\.latencyHint = latencyFor\(settings\.audioBuffer, label\);/);
  assert.match(main, /if \(key === 'audioBuffer'\) \{ pickAudioBuffer\(\); \$\('sAudioBufNote'\)\.hidden = !audio\.ctx; \}/, 'a running context keeps its buffer: the menu says so');
});

test('the words exist in both languages', async () => {
  globalThis.document ||= { documentElement: {} };
  const { t, setLang } = await import('../src/core/i18n.js');
  for (const lang of ['ru', 'en']) { setLang(lang); for (const k of ['sAudioBuf', 'sABAuto', 'sABFast', 'sABBt', 'sABNote']) assert.notEqual(t(k), k, `${lang}.${k}`); }
  setLang('ru');
});
