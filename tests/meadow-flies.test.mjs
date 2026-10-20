// The sound over a corpse is a recording now (audio/meadow.mp3), looped on the ambience bus with a
// panner like every other voice in the forest. While it decodes — or if it never arrives — the old
// synthesized buzz still has to be there, and the game has to keep asking until the loop is ready.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine } from '../src/audio/audio.js';

const conn = (extra = {}) => ({ connect(d) { return d; }, disconnect() {}, ...extra });
const eng = () => {
  const a = Object.create(AudioEngine.prototype);
  a.ctx = { state: 'running', currentTime: 2 };
  a.amb = conn();
  a.sfx = conn();
  a._panner = () => conn();
  a._filter = () => conn();
  a._gain = () => conn({ gain: { value: 0, setTargetAtTime() {}, setValueAtTime() {} } });
  a._meadowState = 'idle';
  a._meadowBuf = null;
  a._samples = new Map();
  return a;
};

test('the meadow loops on the ambience bus with its own pan, and stops on request', () => {
  const a = eng();
  const buf = { duration: 58.5 };
  a._meadowBuf = buf;
  a._meadowState = 'ok';
  let started = null;
  let stopped = null;
  a.ctx.createBufferSource = () => ({
    connect() {}, start(t, offset) { started = { t, offset }; }, stop(t) { stopped = t; },
    playbackRate: { value: 1 }, buffer: null, loop: false,
  });
  const h = a._meadowVoice(3, 1, -2, { gain: 0.32 });
  assert.ok(h && typeof h.stop === 'function');
  assert.ok(started, 'the recording is playing');
  assert.ok(started.offset >= 0 && started.offset < buf.duration, 'from an arbitrary point, so every body sounds different');
  h.stop();
  assert.ok(stopped > a.ctx.currentTime, 'it is allowed to fade before it ends');
});

test('while the file is decoding the game is told to ask again, not handed a silent handle', () => {
  const a = eng();
  let loads = 0;
  a._loadMeadow = () => { loads++; a._meadowState = 'loading'; };
  assert.equal(a.flies(0, 0, 0), null);
  assert.equal(loads, 1);
  assert.equal(a.flies(0, 0, 0), null, 'still loading');
  assert.equal(loads, 1, 'one fetch, however many bodies call');
});

test('a failed fetch falls back to the old synthesized buzz', () => {
  const a = eng();
  a._meadowState = 'fail';
  const marker = { stop() {} };
  a._fliesSynth = () => marker;
  assert.equal(a.flies(0, 0, 0), marker);
});

test('the meadow is fetched once and the same bytes are reused', async () => {
  const a = eng();
  let fetches = 0;
  const bytes = new ArrayBuffer(8);
  globalThis.document = { baseURI: 'https://hush.test/play/index.html' };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    fetches++;
    assert.equal(url, 'https://hush.test/play/audio/meadow.mp3');
    return { ok: true, arrayBuffer: async () => bytes };
  };
  a.ctx.decodeAudioData = async (data) => ({ bytes: data.byteLength });
  try {
    const one = await a._sample('audio/meadow.mp3');
    const two = await a._sample('audio/meadow.mp3');
    assert.equal(fetches, 1);
    assert.equal(one, two);
    assert.equal(one.bytes, 8);
  } finally {
    globalThis.fetch = realFetch;
    delete globalThis.document;
  }
});
