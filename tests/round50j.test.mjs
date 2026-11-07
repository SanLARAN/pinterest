// 5.0j: «🎧 Слушает: трек — исполнитель». A Justify account is the game's account (one Supabase project); Justify
// writes what is playing into justify_now_playing, the game reads friends' rows through justify_friends_listening().
// These pin the cleaning of someone else's text (clipped, stripped, https-only links and covers), the clock, the
// asking (only while a list of friends is on screen, every 45 s, never twice at once, never marking the cloud
// offline), and where the line is drawn: the corner list, the friends tab (with a link to the player's own
// browser) and a friend's profile. Supabase is a stub here — nothing leaves this machine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

class MemoryStorage { constructor() { this.map = new Map(); } get length() { return this.map.size; } key(i) { return [...this.map.keys()][i] ?? null; } getItem(k) { return this.map.get(k) ?? null; } setItem(k, v) { this.map.set(k, String(v)); } removeItem(k) { this.map.delete(k); } clear() { this.map.clear(); } }
globalThis.localStorage = new MemoryStorage();

// a DOM just deep enough for the corner list and the profile: every selector answers with its own element
class El {
  constructor(tag = 'div') { this.tag = tag; this.kids = new Map(); this.dataset = {}; this.attrs = {}; this.style = { props: {}, setProperty(k, v) { this.props[k] = v; } }; this.hidden = false; this.innerHTML = ''; this.textContent = ''; this.scrollTop = 0; this.rects = 1; this.on = {}; this.classList = { add() {}, remove() {}, toggle() {}, contains: () => false }; }
  querySelector(sel) { if (!this.kids.has(sel)) this.kids.set(sel, new El()); return this.kids.get(sel); }
  querySelectorAll() { return []; }
  addEventListener(t, f) { (this.on[t] ||= []).push(f); }
  removeEventListener() {}
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }
  getClientRects() { return this.rects ? [{}] : []; }
  append() {}
  replaceChildren() {}
  focus() {}
}
const byId = new Map();
globalThis.document = {
  hidden: false, documentElement: {}, body: Object.assign(new El('body'), { classList: { add() {}, remove() {} } }), activeElement: null,
  getElementById: (id) => { if (!byId.has(id)) byId.set(id, new El()); return byId.get(id); },
  createElement: (tag) => new El(tag), addEventListener() {}, removeEventListener() {},
};
globalThis.requestAnimationFrame = () => 0;

const { cleanListening, listeningKey, listenPosition, clock, listenLine, httpsOnly, clipText, LISTEN_POLL, LISTEN_MIN, LISTEN_STALE } = await import('../src/cloud/listening.js');
const { setLang } = await import('../src/core/i18n.js');
const { CloudController } = await import('../src/cloud/controller.js');
const { listenHTML } = await import('../src/ui/account.js');
const { SocialDock } = await import('../src/ui/socialDock.js');
const { ProfileScreen } = await import('../src/ui/profile.js');

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const tick = () => new Promise((r) => setTimeout(r, 0));
const ch = (hex) => String.fromCharCode(parseInt(hex, 16));
const row = (o = {}) => ({ user_id: 'f1', state: 'playing', title: 'Вайфуу', artist: 'CUPSIZE', album: 'Сингл', cover: 'https://i.ytimg.com/vi/x/hq.jpg', link: 'https://www.youtube.com/watch?v=x', source: 'youtube', duration: 210, position: 65, updated_at: '2026-11-07T10:00:00Z', ...o });

test('someone else\'s track is clipped and stripped; only plain https links and covers are kept', () => {
  const rows = [
    row(),
    row({ user_id: 'f2', state: 'paused', title: '  <b>Шум</b>' + ch('202e') + 'evil' + ch('0007') + '  ', artist: '', cover: 'http://x.example/c.jpg', link: 'javascript:alert(1)' }),
    row({ user_id: 'stranger' }), // the server lets only friends through; this is the second lock
    row({ user_id: 'f3', state: 'stopped' }),
    row({ user_id: 'f4', title: '   ' }),
    row({ user_id: 'f5', title: 'x'.repeat(500), cover: 'https://user:pw@evil.example/c.jpg', link: 'data:text/html,hi', duration: -4, position: 1e9 }),
    row({ user_id: 'f1', title: 'второй раз' }),
    null, 7, 'junk',
  ];
  const m = cleanListening(rows, ['f1', 'f2', 'f3', 'f4', 'f5'], 1000);
  assert.deepEqual([...m.keys()], ['f1', 'f2', 'f5']);
  assert.equal(m.get('f1').title, 'Вайфуу', 'the first row of a friend wins');
  assert.equal(m.get('f1').cover, 'https://i.ytimg.com/vi/x/hq.jpg');
  assert.equal(m.get('f1').at, 1000);
  const f2 = m.get('f2');
  assert.equal(f2.title, '<b>Шум</b>evil', 'control characters and the marks that turn text around are gone (escaping is the drawing\'s job)');
  assert.equal(f2.artist, null);
  assert.equal(f2.cover, null, 'http is not drawn');
  assert.equal(f2.link, null, 'javascript: is not a link');
  const f5 = m.get('f5');
  assert.equal(f5.title.length, 200);
  assert.equal(f5.cover, null, 'an address with a login in it is refused');
  assert.equal(f5.link, null);
  assert.equal(f5.duration, null);
  assert.equal(f5.position, 86400, 'a position is clamped');
  assert.equal(httpsOnly('https://music.youtube.com/watch?v=1'), 'https://music.youtube.com/watch?v=1');
  assert.equal(httpsOnly('https://' + 'a'.repeat(1000) + '.ru'), null, 'too long');
  assert.equal(httpsOnly(42), null);
  assert.equal(clipText('  a\n\tb  '), 'a b');
  assert.equal(cleanListening(null).size, 0);
  assert.equal(cleanListening({ user_id: 'f1' }).size, 0);
});

test('the clock keeps counting a playing track between two asks and stops at its end; a pause stands still', () => {
  const [play] = [...cleanListening([row()], null, 0).values()];
  assert.equal(listenPosition(play, 0), 65);
  assert.equal(listenPosition(play, 10500), 75);
  assert.equal(listenPosition(play, 999999), 210, 'not past the end');
  const [pause] = [...cleanListening([row({ state: 'paused' })], null, 0).values()];
  assert.equal(listenPosition(pause, 60000), 65);
  assert.equal(clock(65), '1:05');
  assert.equal(clock(3725), '1:02:05');
  assert.equal(clock(-3), '0:00');
  // a moving clock is not a change on screen; a new track or a pause is
  const a = cleanListening([row()], null, 0), b = cleanListening([row({ position: 90 })], null, 5000), c = cleanListening([row({ state: 'paused' })], null, 5000);
  assert.equal(listeningKey(a), listeningKey(b));
  assert.notEqual(listeningKey(a), listeningKey(c));
});

test('the line reads «🎧 Слушает: трек — исполнитель» and «на паузе», in Russian and in English', () => {
  const [p] = [...cleanListening([row()]).values()];
  const [q] = [...cleanListening([row({ state: 'paused', artist: null })]).values()];
  setLang('ru');
  assert.equal(listenLine(p), '🎧 Слушает: Вайфуу — CUPSIZE');
  assert.equal(listenLine(q), '🎧 На паузе: Вайфуу');
  setLang('en');
  assert.equal(listenLine(p), '🎧 Listening: Вайфуу — CUPSIZE');
  assert.equal(listenLine(q), '🎧 Paused: Вайфуу');
  setLang('ru');
  const i18n = src('src/core/i18n.js');
  for (const k of ['listenNow', 'listenPaused', 'listenHead', 'listenHeadPaused', 'listenOpen', 'listenOpenHint']) assert.equal(i18n.match(new RegExp(`^\\s+${k}: `, 'gm'))?.length, 2, `${k} in ru and en`);
});

// a stub Supabase: answers justify_friends_listening with whatever the test sets, counts the asks
function stubCloud(friends = ['f1', 'f2']) {
  const asks = [];
  const api = { answer: { data: [row(), row({ user_id: 'f2', state: 'paused' }), row({ user_id: 'stranger' })], error: null }, asks };
  const client = {
    async rpc(name) { asks.push(name); const a = typeof api.answer === 'function' ? api.answer() : api.answer; if (a instanceof Error) throw a; return a; },
    auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), async getSession() { return { data: { session: null }, error: null }; } },
    channel() { const c = { on: () => c, subscribe: () => c }; return c; }, removeChannel: async () => {},
  };
  const c = new CloudController({ clientFactory: async () => client });
  c.client = client;
  c.user = { id: 'me' };
  c.social = { friends: friends.map((id) => ({ id, display_name: id.toUpperCase(), handle: id })), requests: [], invites: [], blocked: [] };
  api.cloud = c;
  return api;
}

test('it is asked for only while someone watches, once for several screens, every 45 s', async () => {
  assert.ok(LISTEN_POLL >= 30000 && LISTEN_POLL <= 60000, 'Justify asks for 30–60 s');
  assert.equal(LISTEN_MIN, 10000);
  const s = stubCloud(), c = s.cloud;
  let emits = 0;
  c.on(() => emits++);
  assert.equal(c.listenTimer, undefined, 'nobody watches: nothing is asked');
  c.watchListening('dock', true);
  await tick();
  assert.deepEqual(s.asks, ['justify_friends_listening']);
  assert.ok(c.listenTimer, 'a timer while watched');
  assert.equal(c.listeningOf('f1').title, 'Вайфуу');
  assert.equal(c.listeningOf('f2').state, 'paused');
  assert.equal(c.listeningOf('stranger'), null);
  assert.equal(emits, 1);
  c.watchListening('account', true); // a second screen: no second ask
  c.watchListening('profile', true);
  await c.refreshListening(); // and not again within 10 s
  assert.equal(s.asks.length, 1);
  // the same tracks with the clock moved on: asked, stored, not redrawn
  s.answer = { data: [row({ position: 99 }), row({ user_id: 'f2', state: 'paused' })], error: null };
  assert.equal(await c.refreshListening(true), true);
  assert.equal(s.asks.length, 2);
  assert.equal(c.listeningOf('f1').position, 99);
  assert.equal(emits, 1);
  // a pause is a change
  s.answer = { data: [row({ state: 'paused' })], error: null };
  await c.refreshListening(true);
  assert.equal(emits, 2);
  assert.equal(c.listeningOf('f2'), null, 'a friend who stopped is gone');
  // what was heard long ago is not shown
  assert.equal(c.listeningOf('f1', Date.now() + LISTEN_STALE + 1), null);
  // a hidden window does not ask (unless forced)
  document.hidden = true;
  c.listenAt = 0;
  assert.equal(await c.refreshListening(), false);
  document.hidden = false;
  // the last screen leaves: the timer goes
  c.watchListening('dock', false);
  c.watchListening('account', false);
  assert.ok(c.listenTimer);
  c.watchListening('profile', false);
  assert.equal(c.listenTimer, null);
  c.destroy();
});

test('a failure is a missing line, not an offline cloud; an account change drops the answer in flight', async () => {
  const s = stubCloud(), c = s.cloud;
  c.status = 'synced';
  await c.refreshListening(true);
  s.answer = { data: null, error: { message: 'Could not find the function public.justify_friends_listening', code: 'PGRST202' } };
  assert.equal(await c.refreshListening(true), false);
  s.answer = new Error('network down');
  assert.equal(await c.refreshListening(true), false);
  assert.equal(c.status, 'synced', 'the cloud is not marked offline');
  assert.equal(c.lastError, null);
  assert.equal(c.retryTimer, undefined, 'no retry storm');
  assert.equal(c.listeningOf('f1').title, 'Вайфуу', 'the last good answer stays until it is stale');
  // no friends: nothing to ask, and what was there is cleared
  c.social.friends = [];
  const before = s.asks.length;
  assert.equal(await c.refreshListening(true), false);
  assert.equal(s.asks.length, before);
  assert.equal(c.listening.size, 0);
  // an answer that arrives after the account changed is thrown away
  c.social.friends = [{ id: 'f1' }];
  let release;
  s.answer = () => new Promise((r) => { release = r; });
  const pending = c.refreshListening(true);
  await tick();
  assert.equal(c.listenBusy, true);
  assert.equal(await c.refreshListening(true), false, 'never two at once');
  await c.sessionChanged(null); // signed out
  assert.equal(c.listenBusy, false, 'a new account can ask at once');
  release({ data: [row()], error: null });
  assert.equal(await pending, false);
  assert.equal(c.listening.size, 0);
  assert.equal(await c.refreshListening(true), false, 'signed out: nothing is asked');
  c.destroy();
});

test('the friends tab: the line under a friend, escaped, its link opening in the player\'s own browser', () => {
  setLang('ru');
  const [l] = [...cleanListening([row({ title: '<img src=x onerror=alert(1)>', link: 'https://soundcloud.com/a/b?x="1"&y=2' })]).values()];
  const html = listenHTML(l);
  assert.match(html, /^<a class="friend-listen playing" href="https:\/\/soundcloud\.com\/a\/b\?x=%221%22&amp;y=2" target="_blank" rel="noopener noreferrer" title="Откроется в браузере">/);
  assert.ok(!html.includes('<img'), 'a title is text');
  assert.match(html, /🎧 Слушает: &lt;img src=x onerror=alert\(1\)&gt; — CUPSIZE ↗<\/a>$/);
  const [q] = [...cleanListening([row({ state: 'paused', link: null })]).values()];
  assert.equal(listenHTML(q), '<small class="friend-listen paused">🎧 На паузе: Вайфуу — CUPSIZE</small>');
  assert.equal(listenHTML(null), '');
  const acc = src('src/ui/account.js');
  assert.match(acc, /c\.watchListening\?\.\('account',this\.opened&&this\.view==='friends'&&!!c\.user\)/, 'asked for while the friends tab is open');
  assert.match(acc, /close\(\)\{if\(!this\.opened\)return;this\.opened=false;this\.cloud\.watchListening\?\.\('account',false\);/);
  assert.match(acc, /querySelectorAll\('button,input,textarea,a\[href\]'\)/, 'the focus trap reaches the link');
  // the desktop shell sends every new window to the system browser
  assert.match(src('electron/main.cjs'), /setWindowOpenHandler\(\(\{ url \}\) => \{\n\s+if \(\/\^https\?:\/i\.test\(url\)\) shell\.openExternal\(url\);\n\s+return \{ action: 'deny' \};/);
});

test('the corner list on the title screen shows the line and asks only while it is on screen', async () => {
  setLang('ru');
  const s = stubCloud(), c = s.cloud;
  c.profile = { handle: 'me' };
  const dock = new SocialDock({ cloud: c, account: { open() {}, action() {}, el: new El() }, portrait: () => true });
  await tick();
  assert.ok(c.listenWatch.has('dock'));
  dock.update();
  const list = dock.list.innerHTML;
  assert.match(list, /<small class="social-listen playing" title="🎧 Слушает: Вайфуу — CUPSIZE">🎧 Слушает: Вайфуу — CUPSIZE<\/small>/);
  assert.match(list, /<small class="social-listen paused" title="🎧 На паузе: Вайфуу — CUPSIZE">/);
  assert.equal((list.match(/social-listen/g) || []).length, 2);
  // the menu is hidden (a run, a narrow screen that folds the list): no more asking for it
  dock.list.rects = 0;
  dock.update();
  assert.equal(c.listenWatch.has('dock'), false);
  assert.equal(c.listenTimer, null);
  dock.list.rects = 1;
  dock.update();
  assert.ok(c.listenWatch.has('dock'));
  dock.destroy();
  assert.equal(c.listenWatch.size, 0);
  c.destroy();
});

test('a friend\'s profile: cover, track, artist · album, the clock, a link; asked for while it is open', async () => {
  setLang('ru');
  const s = stubCloud(), c = s.cloud;
  c.profileView = async (id) => ({ id, display_name: 'Ф1', handle: 'f1', created_at: null, card: {}, banner: null });
  await c.refreshListening(true);
  c.listening.get('f1').state = 'paused'; // a still clock for an exact reading
  const p = new ProfileScreen({ cloud: c });
  p.open({ id: 'f1', name: 'Ф1' });
  assert.ok(c.listenWatch.has('profile'));
  assert.ok(p.listenTick, 'the clock ticks while it is open');
  await tick(); await tick();
  const box = p.el.querySelector('.pf-listen');
  assert.equal(box.hidden, false);
  assert.equal(box.dataset.state, 'paused');
  assert.match(box.innerHTML, /<img class="pf-listen-cover" src="https:\/\/i\.ytimg\.com\/vi\/x\/hq\.jpg" alt="" width="72" height="72" referrerpolicy="no-referrer" loading="lazy" decoding="async">/);
  assert.match(box.innerHTML, /🎧 Justify на паузе/);
  assert.match(box.innerHTML, /<p class="pf-listen-title" title="Вайфуу">Вайфуу<\/p><p class="pf-listen-artist" title="CUPSIZE · Сингл">CUPSIZE · Сингл<\/p>/);
  assert.match(box.innerHTML, /<a class="pf-listen-link" href="https:\/\/www\.youtube\.com\/watch\?v=x" target="_blank" rel="noopener noreferrer" title="Откроется в браузере">Открыть трек ↗<\/a>/);
  const time = p.el.querySelector('.pf-listen-time');
  assert.equal(time.querySelector('span').textContent, '1:05 / 3:30');
  assert.equal(time.querySelector('i').style.props['--w'], '31%');
  // the friend stops: the strip goes on the next answer
  s.answer = { data: [], error: null };
  await c.refreshListening(true);
  assert.equal(box.hidden, true);
  assert.equal(box.innerHTML, '');
  p.close();
  assert.equal(c.listenWatch.has('profile'), false);
  assert.equal(p.listenTick, 0);
  // your own profile does not ask
  p.open({ self: true });
  assert.equal(c.listenWatch.has('profile'), false);
  p.close();
  assert.match(src('src/ui/profile.js'), /querySelectorAll\('button, a\[href\]'\)/, 'the focus trap reaches the link');
  c.destroy();
});

test('the database side came with Justify: friends only, stale rows dropped, the game\'s own tables untouched', () => {
  const a = 'supabase/migrations/20261107120000_justify_sync_and_now_playing.sql', b = 'supabase/migrations/20261107121000_justify_now_playing_url_check_fix.sql';
  assert.ok(existsSync(new URL('../' + a, import.meta.url)) && existsSync(new URL('../' + b, import.meta.url)), 'the history matches the live database');
  const sql = src(a);
  assert.match(sql, /create policy justify_np_read on public\.justify_now_playing for select to authenticated\s+using \(user_id = \(select auth\.uid\(\)\) or public\.hush_is_friend\(user_id\)\);/);
  assert.match(sql, /create or replace function public\.justify_friends_listening\(\)\s+returns table \(user_id uuid, state text, title text, artist text, album text, cover text, link text, source text,\s+duration integer, "position" integer, updated_at timestamptz\)\s+language sql stable security invoker/, 'invoker: the row rules apply');
  assert.match(sql, /n\.state = 'playing' and n\.updated_at > now\(\) - interval '3 minutes'/);
  assert.match(sql, /n\.state = 'paused' and n\.updated_at > now\(\) - interval '30 minutes'/);
  assert.match(sql, /revoke all on function public\.justify_friends_listening\(\) from public, anon;\s+grant execute on function public\.justify_friends_listening\(\) to authenticated;/);
  for (const f of [sql, src(b)]) {
    assert.doesNotMatch(f, /\b(alter|drop|create)\s+(or\s+replace\s+)?(table|function|policy|view|trigger|index|type)\s+(if\s+(not\s+)?exists\s+)?public\.hush_/i, 'no hush_* object is made or changed');
    assert.doesNotMatch(f, /\bon\s+public\.hush_|\b(insert\s+into|update|delete\s+from)\s+public\.hush_/i, 'no hush_* policy, trigger or row is touched');
  }
  // the client asks only through the one function
  assert.match(src('src/cloud/controller.js'), /this\.client\.rpc\('justify_friends_listening'\)/);
  assert.doesNotMatch(src('src/cloud/controller.js'), /justify_now_playing_set|justify_library/, 'the game never writes Justify\'s rows');
});
