// 3.1b: pages Google's OAuth review can read. The verification refused the homepage (a WebGL game with nothing to
// read before the boot) and found no privacy policy at all (privacy.html was a 404). Now public/privacy.html and
// public/about.html are plain static pages in both languages, the menu links the policy, and a <noscript> block
// describes the game to anything that does not run it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('the privacy policy says what is collected, why, who gets it and how to delete it — in both languages', () => {
  const p = read('public/privacy.html');
  for (const id of ['id="ru"', 'id="en"']) assert.ok(p.includes(id));
  for (const must of ['Supabase', 'openid', 'WebRTC', 'Nostr', 'localStorage', '30 дней', 'within 30 days', 'младше 13', 'under 13', 'https://github.com/SanLARAN/pinterest/issues']) {
    assert.ok(p.includes(must), must);
  }
  assert.match(p, /Google API Services User Data Policy<\/a>, including the Limited Use requirements/);
  assert.doesNotMatch(p, /<script/i, 'a static page: nothing to wait for');
});

test('the about page identifies the game and links the policy; the game links it too', () => {
  const a = read('public/about.html');
  assert.match(a, /href="\.\/privacy\.html"/);
  assert.match(a, /href="\.\/"/);
  assert.doesNotMatch(a, /<script/i);
  const index = read('index.html');
  assert.match(index, /<a class="link" id="lnkPrivacy" href="\.\/privacy\.html" target="_blank" rel="noopener">/);
  assert.match(index, /<noscript>[\s\S]*about\.html[\s\S]*privacy\.html[\s\S]*<\/noscript>/);
  const i18n = read('src/core/i18n.js');
  assert.equal(i18n.split('privacyLink:').length, 3, 'ru and en');
});
