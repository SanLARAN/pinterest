// 3.1a: «Войти через Google» that works in the desktop build too. On the site the existing redirect flow stays; the
// provider itself has to be switched on in Supabase (it reported `google: false`), which only the owner can do.
// In the .exe Google refuses the embedded window, so the sign-in opens in the player's own browser and returns to a
// one-shot loopback server (electron/oauth.cjs) that hands the tokens to the game.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { CloudController } from '../src/cloud/controller.js';
import { SUPABASE_URL } from '../src/cloud/client.js';

const require = createRequire(import.meta.url);
const oauth = require('../electron/oauth.cjs');
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const PORT = 47690;

test('the loopback serves its page only on the secret path, takes one answer, and closes', async () => {
  const b = oauth.begin({ port: PORT, waitMs: 5000 });
  await b.listening;
  assert.match(b.redirect, new RegExp(`^http://127\\.0\\.0\\.1:${PORT}/hush-auth/[0-9a-f]{36}$`));
  const page = await fetch(b.redirect);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /location\.hash/);
  assert.equal((await fetch(`http://127.0.0.1:${PORT}/hush-auth/guess`)).status, 404, 'another path gets nothing');
  const tok = { access_token: 'aaa.bbb.ccc', refresh_token: 'refresh123' };
  assert.equal((await fetch(b.redirect + '/done', { method: 'POST', body: JSON.stringify(tok) })).status, 200);
  assert.deepEqual(await b.result, tok);
  await assert.rejects(fetch(b.redirect), 'the server is gone after one answer');
});

test('errors, junk, a timeout and a second sign-in all settle the first one', async () => {
  assert.deepEqual(oauth.cleanResult({ error: 'access_denied' }), { error: 'access_denied' });
  assert.deepEqual(oauth.cleanResult({ access_token: '<script>', refresh_token: 'x' }), { error: 'no_tokens' });
  assert.deepEqual(oauth.cleanResult(null), { error: 'no_tokens' });
  const slow = oauth.begin({ port: PORT, waitMs: 40 });
  await slow.listening;
  assert.deepEqual(await slow.result, { error: 'timeout' });
  const a = oauth.begin({ port: PORT, waitMs: 5000 });
  await a.listening;
  const aDone = a.result;
  const b = oauth.begin({ port: PORT + 1, waitMs: 5000 });
  assert.deepEqual(await aDone, { error: 'replaced' });
  await b.listening;
  oauth.cancel();
  assert.deepEqual(await b.result, { error: 'cancelled' });
});

test('the shell opens only Supabase\'s own Google URL that comes back to this loopback', () => {
  const r = 'http://127.0.0.1:47615/hush-auth/abc';
  const good = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(r)}`;
  assert.equal(oauth.safeAuthorizeUrl(good, r), true);
  assert.equal(oauth.safeAuthorizeUrl(good.replace('supabase.co', 'supabase.co.evil.io'), r), false);
  assert.equal(oauth.safeAuthorizeUrl(good.replace('google', 'github'), r), false);
  assert.equal(oauth.safeAuthorizeUrl(good, 'http://127.0.0.1:47615/hush-auth/other'), false);
  assert.equal(oauth.safeAuthorizeUrl('javascript:alert(1)', r), false);
});

function client(calls) {
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithOAuth: async ({ options }) => { calls.push(['oauth', options.redirectTo]); return { data: { url: `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(options.redirectTo)}` } }; },
      setSession: async (s) => { calls.push(['session', s]); return { error: null }; },
    },
    removeChannel: async () => {},
  };
}

test('desktop: the game asks the shell for a loopback, opens Google there, and signs in with what comes back', async () => {
  const calls = [];
  let navigated = null;
  const desk = {
    oauthBegin: async () => ({ redirect: 'http://127.0.0.1:47615/hush-auth/s1' }),
    oauthFinish: async (url) => { calls.push(['open', new URL(url).searchParams.get('redirect_to')]); return { access_token: 'a.b.c', refresh_token: 'r1' }; },
  };
  const c = new CloudController({ clientFactory: async () => client(calls), providers: async () => ({ external: { google: true } }), navigate: (u) => { navigated = u; }, desktopAuth: desk });
  try {
    await c.googleLogin();
    assert.equal(navigated, null, 'the game window never leaves the game');
    assert.deepEqual(calls, [
      ['oauth', 'http://127.0.0.1:47615/hush-auth/s1'],
      ['open', 'http://127.0.0.1:47615/hush-auth/s1'],
      ['session', { access_token: 'a.b.c', refresh_token: 'r1' }],
    ]);
    desk.oauthFinish = async () => ({ error: 'timeout' });
    await assert.rejects(c.googleLogin(), /google_cancelled/);
    desk.oauthBegin = async () => ({ error: 'port_busy' });
    await assert.rejects(c.googleLogin(), /google_port/);
  } finally { c.destroy(); }
});

test('the site keeps its redirect flow; the shell wires the bridge and ships the file', () => {
  const ctl = read('src/cloud/controller.js');
  assert.match(ctl, /if\(!desk\)\{this\.navigate\(url\.href\);return;\}/);
  assert.match(read('electron/preload.cjs'), /oauthBegin: \(lang\) => ipcRenderer\.invoke\('hush:oauth:begin', lang\)/);
  const main = read('electron/main.cjs');
  assert.match(main, /oauth\.safeAuthorizeUrl\(url, b\.redirect\)/);
  assert.match(main, /shell\.openExternal\(url\)/);
  assert.match(main, /wireOAuthIpc\(\);/);
  assert.match(read('electron-builder.yml'), /- electron\/oauth\.cjs/);
  for (const w of ['google_port', 'google_desktop', 'google_cancelled']) assert.equal(read('src/cloud/words.js').split(w + ':').length, 3, w);
});
