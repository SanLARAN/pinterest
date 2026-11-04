// The landing page (site/, built to /pinterest/site/): its strings, its ballot box client, its timeline and its
// specimens — everything that runs without a browser. The page itself is checked by hand in a browser (see
// docs/CONTEXT.md §5); no test here ever reaches Supabase: the ballot box is driven through a fake fetch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';

globalThis.document = globalThis.document || { createElement: () => ({ getContext: () => null, style: {} }) };
globalThis.window = globalThis.window || { location: { search: '' }, addEventListener() {}, removeEventListener() {} };

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const { STR, leafPaths, plural, fmt } = await import('../site/i18n.js');
const TL = await import('../site/timeline.js');
const { VoteClient, MOB_IDS, VOTE_KEY, shares, classify, loadState } = await import('../site/voteClient.js');
const { MOBS, mobText, buildMob } = await import('../site/mobs.js');
const { majorOf, majors, spanDays } = await import('../site/patches.js');
const { NEWS } = await import('../src/ui/news.js');
const { CFG } = await import('../src/core/config.js');
const { PROJECT_REF } = await import('../src/cloud/client.js');

const get = (o, path) => path.split('.').reduce((v, k) => v?.[k], o);

test('site strings: every key exists in RU and EN, nothing is empty', () => {
  const ru = leafPaths(STR.ru).sort(), en = leafPaths(STR.en).sort();
  assert.deepEqual(ru, en);
  assert.ok(ru.length > 150, `${ru.length} keys`);
  for (const L of ['ru', 'en']) {
    for (const p of ru) {
      const v = get(STR[L], p);
      if (Array.isArray(v)) {
        assert.ok(v.length && v.every((x) => typeof x === 'string' && x.trim()), `${L}.${p}`);
        // plural forms: ru [1, 2–4, 5+], en [1, many]
        assert.equal(v.length, L === 'ru' ? 3 : 2, `${L}.${p} forms`);
      } else assert.ok(typeof v === 'string' && v.trim(), `${L}.${p}`);
    }
  }
  // the same {placeholders} on both sides
  for (const p of ru) {
    const ph = (L) => [...String(get(STR[L], p)).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    assert.equal(ph('ru'), ph('en'), p);
  }
});

test('site strings: the page and the modules only ask for keys that exist', () => {
  const html = src('site/index.html');
  const keys = new Set([...html.matchAll(/data-i18n="([\w.]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(',')) keys.add(pair.split(':')[1].trim());
  for (const f of ['main.js', 'atlas.js', 'votes.js', 'album.js', 'patches.js']) for (const m of src('site/' + f).matchAll(/\bt\('([\w.]+)'/g)) keys.add(m[1]);
  assert.ok(keys.size > 120, `${keys.size} keys asked for`);
  for (const k of keys) {
    assert.notEqual(get(STR.ru, k), undefined, `ru: ${k}`);
    assert.notEqual(get(STR.en, k), undefined, `en: ${k}`);
  }
});

test('plural: the Russian three forms and the English two', () => {
  const ru = ['минута', 'минуты', 'минут'], en = ['minute', 'minutes'];
  const cases = [[1, 'минута'], [2, 'минуты'], [4, 'минуты'], [5, 'минут'], [11, 'минут'], [12, 'минут'], [14, 'минут'], [21, 'минута'], [22, 'минуты'], [73, 'минуты'], [100, 'минут'], [111, 'минут']];
  for (const [n, w] of cases) assert.equal(plural(n, ru, 'ru'), `${n} ${w}`);
  assert.equal(plural(1, en, 'en'), '1 minute');
  assert.equal(plural(8, en, 'en'), '8 minutes');
  assert.equal(fmt('{a} и {b}', { a: 1 }), '1 и {b}');
});

test('the ballot: six candidates, the same in the page, the client and the SQL', () => {
  assert.deepEqual(MOBS.map((m) => m.id), MOB_IDS);
  const sql = src('supabase/migrations/20261103180000_hush_mob_votes.sql');
  const lists = [...sql.matchAll(/in \(('[a-z]+'(?:, '[a-z]+')*)\)/g)].map((m) => m[1].replace(/'/g, '').split(', '));
  assert.ok(lists.length >= 2, 'the table check and the RPC check');
  for (const l of lists) assert.deepEqual(l, MOB_IDS);
  // the RPCs the client calls are the ones the migration creates, and the anon role may call them
  for (const fn of ['hush_mob_tally', 'hush_mob_vote']) {
    assert.match(sql, new RegExp(`create or replace function public\\.${fn}\\(`));
    assert.match(sql, new RegExp(`grant execute on function [^;]*public\\.${fn}\\([^)]*\\)[^;]* to anon`));
  }
  assert.match(sql, /enable row level security/);
});

test('the ballot: every creature reads the same in RU and EN', () => {
  for (const m of MOBS) {
    assert.equal(m.rate.length, 4, m.id);
    // hearing, speed, scent, threat: 0..5 pips (a mycelium does not walk: its speed is 0)
    for (const r of m.rate) assert.ok(Number.isInteger(r) && r >= 0 && r <= 5, `${m.id} rate ${r}`);
    for (const k of ['name', 'latin', 'where', 'pitch', 'quote']) {
      assert.ok(m.ru[k]?.trim() && m.en[k]?.trim(), `${m.id}.${k}`);
    }
    assert.equal(m.ru.latin, m.en.latin, m.id);
    assert.equal(m.ru.mech.length, m.en.mech.length, `${m.id} mech`);
    assert.ok(m.ru.mech.length >= 3, `${m.id} mech`);
    assert.equal(mobText(m.id, 'en').name, m.en.name);
  }
  assert.equal(mobText('nobody', 'ru'), null);
});

test('the ballot: the six specimens build and move without a browser', () => {
  const mat = new THREE.MeshBasicMaterial();
  for (const id of MOB_IDS) {
    const m = buildMob(id, mat);
    assert.ok(m && m.root instanceof THREE.Object3D, id);
    let tris = 0;
    m.root.traverse((o) => { if (o.isMesh) tris += o.geometry.getAttribute('position').count / 3; });
    assert.ok(tris > 60, `${id}: ${tris} triangles`);
    assert.ok(m.view && m.view.fit > 0, `${id} view`);
    for (let i = 0; i < 240; i++) m.tick({ t: i / 60, dt: 1 / 60, react: i < 120 ? i / 60 : 9, lit: (i % 90) / 90, camAz: Math.sin(i / 40) * 2 });
    m.root.traverse((o) => {
      for (const v of [o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.y, o.rotation.z, o.scale.x, o.scale.y, o.scale.z]) assert.ok(Number.isFinite(v), `${id}: a NaN in ${o.type}`);
    });
  }
  assert.equal(buildMob('nobody', mat), null);
});

test('the shift on the page: the real durations, segments that tile the scroll', () => {
  const S = CFG.SHIFT, seg = TL.SHIFT_SEGMENTS;
  assert.deepEqual(seg.map((s) => s.kind), [...Array(S.DAYS)].flatMap((_, i) => (i < S.DAYS - 1 ? ['night', 'morning'] : ['night'])).concat('finale'));
  assert.ok(Math.abs(seg.reduce((a, s) => a + s.w, 0) - 1) < 1e-9);
  assert.equal(seg[0].a, 0);
  for (let i = 1; i < seg.length; i++) assert.ok(Math.abs(seg[i].a - seg[i - 1].b) < 1e-12);
  assert.ok(Math.abs(seg[seg.length - 1].b - 1) < 1e-9);
  for (const s of seg) assert.equal(s.dur, s.kind === 'night' ? S.NIGHT : s.kind === 'morning' ? S.MORNING : S.FINALE);
  // the clock: 0:00 at the start, the last dawn at the end, and the forest wakes in the last night's 4th minute
  assert.deepEqual([TL.shiftAt(0).seg.kind, TL.shiftAt(0).seg.n, TL.shiftAt(0).clock], ['night', 1, 0]);
  assert.equal(TL.shiftAt(1).seg.kind, 'finale');
  const last = seg.filter((s) => s.kind === 'night').pop();
  const at = (sec) => last.a + last.w * (sec / last.dur);
  assert.equal(TL.shiftAt(at(S.LAST_WAKE - 2)).woke, false);
  assert.equal(TL.shiftAt(at(S.LAST_WAKE + 2)).woke, true);
  assert.equal(TL.clockText(0), '0:00');
  assert.equal(TL.clockText(105), '1:45');
  assert.equal(TL.clockText(479.9), '7:59');
});

test('the shift on the page: the light stays in range and the lamps only come on', () => {
  let prev = -1;
  for (let i = 0; i <= 2000; i++) {
    const p = i / 2000, L = TL.lightAt(p);
    for (const k of ['dawn', 'morning', 'fog', 'fear', 'hit']) assert.ok(L[k] >= 0 && L[k] <= 1, `${k} at ${p}`);
    assert.ok(Math.abs(Math.hypot(...L.sun) - 1) < 1e-9);
    const n = TL.gensLitAt(p).lit.filter(Boolean).length;
    assert.ok(n >= prev, `a lamp went out at ${p}`);
    prev = n;
  }
  assert.equal(TL.gensLitAt(0).lit.filter(Boolean).length, 0);
  assert.equal(TL.gensLitAt(1).lit.filter(Boolean).length, 5);
  // a morning is lit in its middle and dark at its edges (the bulb dies the way the game's dusk does)
  const m = TL.SHIFT_SEGMENTS.find((s) => s.kind === 'morning');
  assert.ok(TL.lightAt(m.a + m.w * 0.5).dawn > 0.8);
  assert.ok(TL.lightAt(m.a + m.w * 0.995).dawn < 0.05);
  // the fifth generator lights after the forest wakes
  const wakeP = (() => { const s = TL.SHIFT_SEGMENTS.filter((x) => x.kind === 'night').pop(); return s.a + s.w * (CFG.SHIFT.LAST_WAKE / s.dur); })();
  assert.ok(TL.gensLitAt(1).marks[4] > wakeP);
});

test('the camera track: forward-only over the scroll, through its keyframes', () => {
  const vh = 800, secs = [{ id: 'top', top: 0, height: 800 }, { id: 'echo', top: 800, height: 1200 }, { id: 'shift', top: 2000, height: 3680 }, { id: 'coop', top: 5680, height: 1400 }];
  let prev = -1;
  for (let y = 0; y <= 7200; y += 25) {
    const u = TL.trackU(secs, y, vh);
    assert.ok(u >= prev - 1e-12 && u >= 0 && u <= 1, `u ${u} at ${y}`);
    prev = u;
  }
  assert.equal(TL.trackU(secs, 0, vh), 0);
  assert.equal(TL.trackU(secs, 99999, vh), 1);
  for (const k of [TL.KEYS[0], TL.KEYS[TL.KEYS.length - 1]]) {
    const at = TL.trackAt(k.u);
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(at.pos[i] - k.pos[i]) < 1e-9);
  }
  assert.equal(TL.pinProgress(1000, 3000, 1000, 800), 0);
  assert.equal(TL.pinProgress(1000, 3000, 3200, 800), 1);
});

// a fake PostgREST: answers by RPC name, records what was asked
function fakeBox(handler) {
  const calls = [];
  const fetch = async (url, init) => {
    const c = { url, name: url.split('/rpc/')[1], headers: init.headers, body: JSON.parse(init.body) };
    calls.push(c);
    const [status, body] = handler(c, calls.length);
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  return { fetch, calls };
}
function memStore(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}
const COUNTS = { gluhar: 3, kukushka: 1, gribnica: 0, shatun: 5, poludnica: 2, pyaty: 1 };

test('ballot client: a vote goes out with the device id and comes back as the tally', async () => {
  const box = fakeBox((c) => [200, { counts: { ...COUNTS, [c.body.p_mob]: (COUNTS[c.body.p_mob] || 0) + 1 }, total: 13, mine: c.body.p_mob }]);
  const store = memStore();
  const vc = new VoteClient({ fetch: box.fetch, store, url: 'https://x.test', key: 'k' });
  const r = await vc.vote('shatun');
  assert.equal(r.ok, true);
  assert.equal(r.mine, 'shatun');
  assert.equal(r.counts.shatun, 6);
  assert.equal(r.total, MOB_IDS.reduce((a, id) => a + r.counts[id], 0));
  const c = box.calls[0];
  assert.equal(c.url, 'https://x.test/rest/v1/rpc/hush_mob_vote');
  assert.equal(c.headers.apikey, 'k');
  assert.equal(c.headers.Authorization, undefined);
  assert.match(c.body.p_device, /^[0-9a-f]{32}$/);
  const saved = JSON.parse(store.getItem(VOTE_KEY));
  assert.equal(saved.mob, 'shatun');
  assert.equal(saved.pending, null);
  assert.equal(saved.device, c.body.p_device);
  // the same device on the next visit
  assert.equal(new VoteClient({ fetch: box.fetch, store }).st.device, c.body.p_device);
  // a name that is not on the ballot never leaves the page
  assert.deepEqual(await vc.vote('medved'), { ok: false, why: 'bad' });
  assert.equal(box.calls.length, 1);
});

test('ballot client: before the migration the vote waits on the device and goes out later', async () => {
  const store = memStore();
  const down = fakeBox(() => [404, { code: 'PGRST202', message: 'Could not find the function' }]);
  const vc = new VoteClient({ fetch: down.fetch, store });
  const r = await vc.vote('pyaty');
  assert.deepEqual([r.ok, r.why, r.mine], [false, 'missing', 'pyaty']);
  assert.equal(JSON.parse(store.getItem(VOTE_KEY)).pending, 'pyaty');
  const t = await vc.tally();
  assert.deepEqual([t.ok, t.why, t.mine], [false, 'missing', 'pyaty']);
  // next visit, the box is up: flush sends it by itself
  const up = fakeBox((c) => [200, { counts: COUNTS, total: 12, mine: c.body.p_mob }]);
  const vc2 = new VoteClient({ fetch: up.fetch, store });
  assert.equal(vc2.pending, 'pyaty');
  const f = await vc2.flush();
  assert.equal(f.ok, true);
  assert.equal(up.calls[0].body.p_mob, 'pyaty');
  assert.equal(vc2.pending, null);
  assert.equal(JSON.parse(store.getItem(VOTE_KEY)).mob, 'pyaty');
  assert.equal(await vc2.flush(), null);
});

test('ballot client: the rate limit is reported and not queued; a dead token falls back to the device', async () => {
  const lim = fakeBox(() => [400, { code: 'P0001', message: 'rate_limited' }]);
  const store = memStore();
  const vc = new VoteClient({ fetch: lim.fetch, store });
  const r = await vc.vote('gluhar');
  assert.deepEqual([r.ok, r.why], [false, 'limited']);
  assert.equal(JSON.parse(store.getItem(VOTE_KEY)).pending, null);

  const now = Date.parse('2026-11-03T20:00:00Z');
  const signed = memStore({ [`sb-${PROJECT_REF}-auth-token`]: JSON.stringify({ access_token: 'tok', expires_at: now / 1000 + 3600 }) });
  const box = fakeBox((c, n) => (n === 1 ? [401, { code: 'PGRST301', message: 'JWT expired' }] : [200, { counts: COUNTS, total: 12, mine: null }]));
  const vc2 = new VoteClient({ fetch: box.fetch, store: signed, now: () => now });
  const t = await vc2.tally();
  assert.equal(t.ok, true);
  assert.equal(box.calls.length, 2);
  assert.equal(box.calls[0].headers.Authorization, 'Bearer tok');
  assert.equal(box.calls[1].headers.Authorization, undefined);
  // an expired session is never sent at all
  const old = memStore({ [`sb-${PROJECT_REF}-auth-token`]: JSON.stringify({ access_token: 'old', expires_at: now / 1000 - 10 }) });
  const box3 = fakeBox(() => [200, { counts: COUNTS, total: 12, mine: null }]);
  await new VoteClient({ fetch: box3.fetch, store: old, now: () => now }).tally();
  assert.equal(box3.calls[0].headers.Authorization, undefined);
  // and a network failure is an error, not a crash
  const vc4 = new VoteClient({ fetch: async () => { throw new Error('offline'); }, store: memStore() });
  assert.deepEqual([(await vc4.tally()).ok, (await vc4.tally()).why], [false, 'error']);
});

test('ballot client: the server remembers your vote better than the device does', async () => {
  const store = memStore({ [VOTE_KEY]: JSON.stringify({ device: 'a'.repeat(32), mob: 'gluhar' }) });
  const box = fakeBox(() => [200, { counts: COUNTS, total: 12, mine: 'shatun' }]);
  const vc = new VoteClient({ fetch: box.fetch, store });
  const t = await vc.tally();
  assert.equal(t.mine, 'shatun');
  assert.equal(JSON.parse(store.getItem(VOTE_KEY)).mob, 'shatun');
  assert.equal(box.calls[0].body.p_device, 'a'.repeat(32));
  // junk in the store is cleaned up instead of sent
  const st = loadState(memStore({ [VOTE_KEY]: '{"device":"nope","mob":"medved","pending":"x"}' }));
  assert.match(st.device, /^[0-9a-f]{32}$/);
  assert.equal(st.mob, null);
  assert.equal(st.pending, null);
  assert.equal(classify(404, null), 'missing');
  assert.equal(classify(400, { code: '42883' }), 'missing');
  assert.equal(classify(500, { message: 'boom' }), 'error');
});

test('ballot bars: whole percents that add up to 100', () => {
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  assert.equal(sum(shares(COUNTS)), 100);
  assert.deepEqual(Object.values(shares({ gluhar: 1, kukushka: 1, gribnica: 1, shatun: 0, poludnica: 0, pyaty: 0 })), [34, 33, 33, 0, 0, 0]);
  assert.ok(Object.values(shares({})).every((v) => v === 0));
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 300; i++) {
    const c = Object.fromEntries(MOB_IDS.map((id) => [id, rnd() < 0.2 ? 0 : Math.floor(rnd() * 5000)]));
    const s = shares(c);
    if (sum(c)) assert.equal(sum(s), 100, JSON.stringify(c));
    for (const id of MOB_IDS) if (!c[id]) assert.equal(s[id], 0);
  }
});

test('patches: the lines, the days and every version once', () => {
  assert.equal(majorOf('3.1r'), '3.1');
  assert.equal(majorOf('2.0'), '2.0');
  assert.equal(majorOf('1.9b'), '1.x');
  assert.equal(majorOf('nonsense'), '1.x');
  const g = majors();
  assert.equal(g.reduce((a, x) => a + x.n, 0), NEWS.length);
  assert.equal(g[0].id, majorOf(NEWS[0].v));
  assert.equal(new Set(NEWS.map((n) => n.v)).size, NEWS.length, 'a version twice: its #v link would be ambiguous');
  assert.equal(spanDays([{ date: '2026-11-01' }, { date: '2026-11-03' }]), 3);
  assert.equal(spanDays([]), 0);
  assert.ok(spanDays() >= 1);
});

test('the site build: its own entry, its own folder, deployed with the game', () => {
  const cfg = src('vite.site.config.js');
  assert.match(cfg, /outDir:[^\n]*dist\/site/);
  assert.match(cfg, /base:\s*'\.\/'/);
  const pkg = JSON.parse(src('package.json'));
  assert.equal(pkg.scripts['build:site'], 'vite build --config vite.site.config.js');
  const wf = src('.github/workflows/pages.yml');
  const iBuild = wf.indexOf('run: npm run build\n'), iSite = wf.indexOf('run: npm run build:site'), iUp = wf.indexOf('upload-pages-artifact');
  assert.ok(iBuild > 0 && iSite > iBuild && iUp > iSite, 'build:site runs after the game build and before the upload');
  // the page is a sibling of the game: its links back to it are relative
  const html = src('site/index.html');
  assert.match(html, /href="\.\.\/"/);
  assert.doesNotMatch(html, /href="\/pinterest\//);
});

test('the site keeps the house style: radii, fonts, palette', () => {
  const css = src('site/site.css');
  for (const m of css.matchAll(/border-radius:\s*([^;]+);/g)) {
    for (const v of m[1].trim().split(/\s+/)) assert.ok(v === '50%' || v === '0' || parseFloat(v) <= 4, `border-radius ${m[1]}`);
  }
  for (const m of css.matchAll(/font-family:\s*([^;]+);/g)) assert.match(m[1], /var\(--(mono|horror)\)|JetBrains Mono|Rubik Wet Paint|inherit/, m[1]);
  for (const c of ['#a7b4b6', '#d6cdc0', '#e0362c', '#a3170f', '#d6a04c']) assert.ok(css.toLowerCase().includes(c), c);
});

test('the phone layout is never wider than the phone', () => {
  // a wrapping column flex sizes its line by the widest child: the 478 px chapter strip once stretched the page to
  // 496 px on a 390 px phone, and the browser zoomed the whole site out by a fifth
  const css = src('site/site.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sels: m[1].split(',').map((x) => x.trim()), body: m[2] }));
  const wraps = new Set(rules.filter((r) => /flex-wrap:\s*wrap\b/.test(r.body)).flatMap((r) => r.sels));
  const seen = [];
  for (const r of rules.filter((x) => /flex-direction:\s*column\b/.test(x.body))) {
    for (const sel of r.sels.filter((x) => wraps.has(x))) {
      seen.push(sel);
      assert.match(r.body, /flex-wrap:\s*nowrap\b/, `${sel} turns into a column but still wraps`);
    }
  }
  for (const sel of ['.atl-top', '.pt-tools']) assert.ok(seen.includes(sel), sel);
});
