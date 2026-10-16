// Online smoke test over the REAL public signalling networks (run in CI, which has open internet).
// Two separate Chrome processes = two players: one creates a room, the other joins with the invite
// link; they must find each other through public Nostr relays / WebTorrent trackers, open a WebRTC
// link, sit down in the lobby, hear each other (fake mic) and start the same night.
//
//   BASE=http://localhost:4173/ CHROME=/usr/bin/google-chrome NET=default|nostr|torrent node tests/online-smoke.mjs
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://localhost:4173/';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const NET = process.env.NET && process.env.NET !== 'default' ? process.env.NET : null;
const JOIN_TIMEOUT = +(process.env.JOIN_TIMEOUT || 120000);
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = true;
const check = (name, cond, extra = '') => {
  log(cond ? 'PASS' : 'FAIL', name, extra);
  if (!cond) ok = false;
};

const ARGS = [
  '--no-sandbox', '--autoplay-policy=no-user-gesture-required',
  '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
  '--disable-features=WebRtcHideLocalIpsWithMdns',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
];

async function player(tag, url) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ARGS, defaultViewport: { width: 640, height: 360 }, protocolTimeout: 300000 });
  const page = await browser.newPage();
  page.errors = [];
  page.on('pageerror', (e) => { page.errors.push(String(e)); log(`[${tag} pageerror]`, String(e).slice(0, 300)); });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log(`[${tag} ${m.type()}]`, m.text().slice(0, 200)); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__hush && window.__hush.state === 'menu', { timeout: 120000, polling: 250 });
  return { browser, page };
}

const until = async (fn, ms, every = 500) => {
  const end = Date.now() + ms;
  let v;
  while (Date.now() < end) {
    v = await fn();
    if (v) return v;
    await sleep(every);
  }
  return v;
};

const relays = (p) => p.evaluate(() => {
  const n = window.__hush.coop.net;
  return { nostr: n.relayStatus('nostr'), torrent: n.relayStatus('torrent') };
});

let A, B;
try {
  log(`signalling: ${NET || 'nostr + torrent'}`);
  const ua = new URL(BASE);
  if (NET) ua.searchParams.set('net', NET);
  A = await player('A', ua.toString());
  await A.page.evaluate(async () => { const h = window.__hush; h.audio.init(); await h.mic.start(h.audio); });
  const code = await A.page.evaluate(async () => { const h = window.__hush; await h.coop.create(); return h.coop.code; });
  log('room', code);
  await sleep(3000);
  log('A relays', JSON.stringify(await relays(A.page)));
  const link = await A.page.evaluate(() => window.__hush.coop.inviteLink());
  log('invite', link);

  const tJoin = Date.now();
  const ub = new URL(link); // same server as A (the link carries the room, and the signalling choice)
  ub.protocol = ua.protocol;
  ub.host = ua.host;
  B = await player('B', ub.toString());
  await B.page.evaluate(async () => { const h = window.__hush; h.audio.init(); await h.mic.start(h.audio); h.coop.syncVoice(); h.coop.announce(); });
  const seated = await until(async () => {
    const a = await A.page.evaluate(() => window.__hush.coop.players().length);
    const b = await B.page.evaluate(() => { const me = window.__hush.coop.me(); return me && me.slot; });
    return a === 2 && b === 1;
  }, JOIN_TIMEOUT);
  log('B relays', JSON.stringify(await relays(B.page)));
  check(`found each other through public signalling (${NET || 'nostr + torrent'})`, !!seated, seated ? `${((Date.now() - tJoin) / 1000).toFixed(1)} s after B opened the link` : 'timeout');
  if (!seated) throw new Error('no connection');

  const rtt = await until(() => B.page.evaluate(() => window.__hush.coop.rtt(window.__hush.coop.hostId)), 15000);
  log('ping', rtt, 'ms');
  const links = await B.page.evaluate(() => { const n = window.__hush.coop.net; return [...n.peers.values()].map((p) => [...p.links].map((i) => n.links[i].name).join('+')); });
  log('B is linked to the host via', links.join(', '));

  const level = (P, who) => P.evaluate(async (who) => {
    const h = window.__hush;
    const id = who === 'host' ? h.coop.hostId : h.coop.players().find((p) => !p.self)?.id;
    if (!h.audio.voices.has(id)) return 0;
    let mx = 0.0001;
    for (let i = 0; i < 100; i++) { mx = Math.max(mx, h.audio.voiceLevel(id)); await new Promise((r) => setTimeout(r, 20)); }
    return mx;
  }, who);
  let va = 0, vb = 0;
  for (let i = 0; i < 15 && !(va > 0.05 && vb > 0.05); i++) {
    va = await level(A.page, 'other');
    vb = await level(B.page, 'host');
    if (!(va > 0.05 && vb > 0.05)) await sleep(1000);
  }
  check('voice A → B', vb > 0.05, vb.toFixed(3));
  check('voice B → A', va > 0.05, va.toFixed(3));

  await A.page.evaluate(() => window.__hush.coop.startRun());
  const both = await until(async () => {
    const a = await A.page.evaluate(() => `${window.__hush.state}/${window.__hush.game.state}/${window.__hush.game.role}`);
    const b = await B.page.evaluate(() => `${window.__hush.state}/${window.__hush.game.state}/${window.__hush.game.role}`);
    return a === 'playing/morning/host' && b === 'playing/morning/client' ? `${a} ${b}` : null;
  }, 20000);
  check('host starts the night for both', !!both, both || '');
  await A.page.evaluate(() => window.__hush.input.keys.add('KeyW'));
  await sleep(2000);
  await A.page.evaluate(() => window.__hush.input.keys.delete('KeyW'));
  await sleep(1500);
  const pa = await A.page.evaluate(() => { const p = window.__hush.game.player; return [p.x, p.z]; });
  const pb = await B.page.evaluate(() => { const r = [...window.__hush.game.remotes.values()][0]; return r ? [r.x, r.z] : [NaN, NaN]; });
  check('movement syncs', Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) < 0.5, `A (${pa.map((v) => v.toFixed(2))}) seen by B at (${pb.map((v) => v.toFixed(2))})`);
  check('no page errors', A.page.errors.length === 0 && B.page.errors.length === 0);
} catch (e) {
  log('ERROR', e.message);
  ok = false;
} finally {
  if (A) await A.browser.close().catch(() => {});
  if (B) await B.browser.close().catch(() => {});
  log(ok ? 'ALL PASS' : 'SOME FAILED');
  process.exit(ok ? 0 : 1);
}
