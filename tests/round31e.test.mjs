// 3.1e: playing with a friend far away, and two things taken out.
//
// Players connect directly (WebRTC); with STUN only, a friend behind strict NAT (mobile internet, carrier-grade
// NAT — usually what «my friend in another country can't get in» is) never connects. Now the game fetches TURN
// credentials from our own edge function (supabase/functions/hush-turn → Cloudflare) before joining a room, and
// connects exactly as before when there are none. Also: the profile's «pause the backdrop» button is gone, and the
// key bindings no longer show inside the advanced graphics settings.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }
globalThis.localStorage = globalThis.localStorage || new Mem();
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const { cleanIce, getIceServers, relayReady, TURN_URL, _resetIceCache } = await import('../src/net/ice.js');

const CF = {
  iceServers: [{
    urls: ['stun:stun.cloudflare.com:3478', 'turn:turn.cloudflare.com:3478?transport=udp', 'turns:turn.cloudflare.com:5349?transport=tcp'],
    username: 'u'.repeat(40), credential: 'c'.repeat(40),
  }],
  configured: true, ttl: 21600,
};
const reply = (body, ok = true) => async () => ({ ok, json: async () => body });

test('only stun/turn URLs with string credentials reach the browser; TURN without a login is dropped', () => {
  assert.deepEqual(cleanIce(CF.iceServers), CF.iceServers);
  assert.deepEqual(cleanIce([{ urls: 'javascript:alert(1)' }, { urls: ['http://x'] }, null, 5]), []);
  assert.deepEqual(cleanIce([{ urls: 'turn:x.example:3478' }]), [], 'a relay nobody can log in to');
  assert.deepEqual(cleanIce([{ urls: 'stun:x.example:3478' }]), [{ urls: ['stun:x.example:3478'] }]);
  assert.deepEqual(cleanIce('nope'), []);
});

test('the relay is fetched from our own function, kept for hours, and asked for again before it expires', async () => {
  _resetIceCache();
  assert.match(TURN_URL, /^https:\/\/ppylutuhhmvhgqqqnldm\.supabase\.co\/functions\/v1\/hush-turn$/);
  let calls = 0, sent = null;
  const fetchImpl = async (url, opts) => { calls++; sent = opts; return { ok: true, json: async () => CF }; };
  const t0 = 1_000_000;
  const a = await getIceServers({ fetchImpl, now: t0 });
  assert.equal(a.length, 1);
  assert.ok(sent.headers.apikey, 'with the project\'s publishable key');
  assert.equal(relayReady(), true);
  await getIceServers({ fetchImpl, now: t0 + 4 * 3600e3 });
  assert.equal(calls, 1, 'four hours later: still the same credentials');
  await getIceServers({ fetchImpl, now: t0 + 5.5 * 3600e3 });
  assert.equal(calls, 2, 'an hour before they expire: fresh ones');
});

test('no function, no network, or no answer in time: the game joins exactly as before, without waiting long', async () => {
  _resetIceCache();
  assert.deepEqual(await getIceServers({ fetchImpl: reply({ iceServers: [], configured: false }) }), []);
  assert.equal(relayReady(), false);
  _resetIceCache();
  assert.deepEqual(await getIceServers({ fetchImpl: async () => { throw new Error('offline'); } }), []);
  _resetIceCache();
  assert.deepEqual(await getIceServers({ fetchImpl: reply({}, false) }), []);
  _resetIceCache();
  const t = Date.now();
  const hang = (url, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(new Error('aborted'))));
  assert.deepEqual(await getIceServers({ fetchImpl: hang, timeout: 80 }), []);
  assert.ok(Date.now() - t < 1000, 'a hanging function costs the join a moment, not forever');
  _resetIceCache();
});

test('the room uses it: net.join hands the relay to Trystero, the lobby warms it up and says whether there is one', () => {
  const net = src('src/net/net.js');
  assert.match(net, /const turn = ice \?\? \(test \? ICE_SERVERS : await getIceServers\(\)\);/);
  assert.match(net, /if \(turn\.length\) base\.turnConfig = turn;/);
  assert.match(net, /if \(this\.code !== code\) return; \/\/ left while asking/);
  const lobby = src('src/ui/lobby.js');
  assert.match(lobby, /getIceServers\(\)\.catch\(\(\) => \{\}\);/);
  assert.match(lobby, /t\(c\.net\?\.turn \? 'coopTurnOn' : 'coopTurnOff'\)/);
  const fn = src('supabase/functions/hush-turn/index.ts');
  assert.match(fn, /rtc\.live\.cloudflare\.com\/v1\/turn\/keys\/\$\{encodeURIComponent\(keyId\)\}\/credentials\/generate-ice-servers/);
  assert.match(fn, /Deno\.env\.get\('CF_TURN_API_TOKEN'\)/, 'the Cloudflare token lives in the function\'s secrets, never in the game');
  assert.match(fn, /configured: false/);
  assert.match(fn, /!\/:53\(\\\?\|\$\)\/\.test\(u\)/, 'port 53 URLs dropped (browsers refuse them)');
  assert.doesNotMatch(src('src/net/ice.js'), /CF_TURN|Bearer/);
});

test('the backdrop has no pause button; the keys hide with the basic settings when graphics opens', async () => {
  const profile = src('src/ui/profile.js');
  assert.doesNotMatch(profile, /togglePause|'pause'|pfPause|pfPlay/);
  assert.match(profile, /reducedMotion\(\)/, 'reduced motion still keeps it still');
  assert.doesNotMatch(src('src/core/i18n.js'), /pfPause|pfPlay/);
  assert.match(src('src/main.js'), /keysHost\.className='keys-host';\$\('btnSettingsBack'\)\.before\(keysHost\);/);
  assert.match(src('src/graphics.css'), /\.graphics-expanded > \.keys-host \{ display: none; \}|\.graphics-expanded > \.keys-host/);
  globalThis.document ||= { documentElement: {} };
  const { t, setLang } = await import('../src/core/i18n.js');
  for (const lang of ['ru', 'en']) { setLang(lang); for (const k of ['coopTurnOn', 'coopTurnOff']) assert.notEqual(t(k), k); }
  setLang('ru');
});
