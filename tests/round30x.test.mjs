// 3.0x: full-screen profiles. A personal file over a half-seen backdrop (PNG/JPG/GIF/silent MP4, up to 20 MB),
// opened from your own name or a friend's. The server side (supabase/migrations/20261101120000_hush_profile_cards.sql)
// keeps it to yourself and your friends; supabase/tests/profile_cards.sql checks that against the live rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCard, cleanCard, cardForest, cardCreatures } from '../src/core/profileCard.js';
import { bannerKind, bannerProblem, BANNER_MAX, BANNER_EXT, BANNER_BUCKET } from '../src/cloud/banner.js';

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('the card is built from what this machine keeps, and stays small and clean whatever arrives', () => {
  const card = buildCard({
    atlas: { nights: 31, wins: 4, bogWins: 1, escapes: 2, best: 512, gens: 77, bodies: 40, revives: 3, kills: { listener: 9, crawler: 4, stray: 2, angler: 1, nonsense: 50 }, seen: { listener: 5, stray: 1, drowned: 2 } },
    scores: [{ score: 1200 }, { score: 4300 }], wallet: { total: 999 }, strayMet: 7, fit: { head: 'hood' }, now: 1,
  });
  assert.equal(card.nights, 31);
  assert.equal(card.score, 4300, 'the best score of the table');
  assert.equal(card.met, 3, 'three kinds met');
  assert.deepEqual(Object.keys(card.kills), ['listener', 'crawler', 'stray', 'angler'], 'the four that killed most, unknown causes dropped');
  assert.equal(cardForest(card), true);
  assert.equal(cardForest(buildCard({ atlas: { wins: 2, bogWins: 2 } })), false);
  assert.ok(JSON.stringify(card).length < 4096, 'under the server limit');
  // anything from the network is clamped before it is drawn
  const dirty = cleanCard({ nights: -5, wins: 'x', stray: 99, met: 99, kills: { listener: 1e12, '<script>': 4 }, fit: { blob: 'z'.repeat(2000) }, extra: 1 });
  assert.equal(dirty.nights, 0);
  assert.equal(dirty.stray, 10);
  assert.equal(dirty.met, cardCreatures);
  assert.deepEqual(Object.keys(dirty.kills), ['listener']);
  assert.equal(dirty.fit, null, 'an oversized outfit is not drawn');
  assert.equal('extra' in dirty, false);
});

test('a banner is a PNG, a JPG, a GIF or an MP4, up to 20 MB — refused before it is uploaded otherwise', () => {
  assert.equal(BANNER_MAX, 20 * 1024 * 1024);
  assert.deepEqual(Object.keys(BANNER_EXT).sort(), ['image/gif', 'image/jpeg', 'image/png', 'video/mp4']);
  assert.equal(bannerKind({ type: 'video/mp4' }), 'video');
  assert.equal(bannerKind({ type: 'image/gif' }), 'image');
  assert.equal(bannerKind({ type: 'image/webp' }), null);
  assert.equal(bannerProblem(null), 'banner_none');
  assert.equal(bannerProblem({ type: 'application/x-msdownload', size: 10 }), 'banner_type');
  assert.equal(bannerProblem({ type: 'video/mp4', size: BANNER_MAX + 1 }), 'banner_size');
  assert.equal(bannerProblem({ type: 'image/jpeg', size: 1024 }), null);
  // the bucket says the same, and is private
  const sql = src('supabase/migrations/20261101120000_hush_profile_cards.sql');
  assert.match(sql, new RegExp(`'${BANNER_BUCKET}', '${BANNER_BUCKET}', false, 20971520, array\\['image/png', 'image/jpeg', 'image/gif', 'video/mp4'\\]`));
  assert.match(sql, /hush_is_friend\(\(\(storage\.foldername\(name\)\)\[1\]\)::uuid\)/, 'friends read the owner folder');
  assert.match(sql, /if p_id is null or \(p_id <> u and not public\.hush_is_friend\(p_id\)\) then raise exception 'not_friend'/);
  assert.match(src('supabase/tests/profile_cards.sql'), /stranger saw the profile/);
});

test('the cloud uploads into the owner folder, points the profile at it, and reads friends through signed links', () => {
  const ctl = src('src/cloud/controller.js');
  assert.match(ctl, /const path=`\$\{owner\}\/banner-/);
  assert.match(ctl, /rpc\('hush_banner_set',\{p_owner:owner,p_path:path,p_kind:kind\}\)/);
  assert.match(ctl, /createSignedUrl\(path,3600\)/);
  assert.match(ctl, /rpc\('hush_profile_view',\{p_id:id\}\)/);
  assert.match(ctl, /if\(file\.size>BANNER_MAX\)throw new Error\('banner_size'\)/);
});

test('names open profiles: your portrait and name, a friend in the list, a player in the lobby', () => {
  const main = src('src/main.js');
  assert.match(main, /account\.onNav=\(\)=>profile\.open\(\{self:true\}\)/);
  assert.match(main, /onProfile: \(peer\) => \{ const r = coop\.roster\.get\(peer\);/);
  assert.match(main, /publishCard\(\); \/\/ \(3\.0x\) the night is in the card friends see/);
  assert.match(src('src/ui/socialDock.js'), /me\.dataset\.profile='self'/);
  assert.match(src('src/ui/account.js'), /data-action="viewProfile"/);
  assert.match(src('src/ui/lobby.js'), /this\.onProfile\(row\.dataset\.id\)/);
});

test('the room carries each player\'s cloud id (checked), so a lobby name can find the profile', async () => {
  const { cleanUid } = await import('../src/net/coop.js');
  assert.equal(cleanUid('5b0b1f0e-1c2d-4a3b-9c8d-7e6f5a4b3c2d'), '5b0b1f0e-1c2d-4a3b-9c8d-7e6f5a4b3c2d');
  assert.equal(cleanUid('<img src=x>'), null);
  assert.equal(cleanUid(42), null);
  const coop = src('src/net/coop.js');
  assert.match(coop, /cleared: forestCleared\(\), uid: this\.uid \};/);
  assert.match(coop, /r\.uid = cleanUid\(d\.uid\);/);
});

test('the profile respects motion and keyboard: no autoplay under reduced motion, a pause, Esc and a focus trap', () => {
  const ui = src('src/ui/profile.js');
  assert.match(ui, /this\.paused = reducedMotion\(\);/);
  assert.match(ui, /muted: true, loop: true, playsInline: true, autoplay: !this\.paused/);
  assert.match(ui, /freezeGif\(img\)/, 'a GIF is frozen on its first frame');
  assert.match(ui, /if \(e\.code === 'Escape'\) \{ e\.preventDefault\(\); this\.close\(\); return; \}/);
  assert.match(ui, /the focus stays inside the profile/);
  const css = src('src/profile.css');
  assert.match(css, /\.pf-banner\.on \{ opacity: \.42; \}/, 'the backdrop is half there');
  assert.match(css, /button:focus-visible \{ outline: 2px solid/);
  assert.match(css, /min-height: 44px/, 'targets big enough to hit');
  for (const k of ['pfBanner', 'pfNotFriend', 'pfBannerHint', 'pfOpen']) assert.equal(src('src/core/i18n.js').split(`${k}:`).length - 1, 2, `${k} in both languages`);
});
