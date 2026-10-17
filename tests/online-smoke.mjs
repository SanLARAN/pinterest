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
const facts = []; // a one-line summary, also posted as a GitHub annotation
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

async function player(tag, url, seed = null) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ARGS, defaultViewport: { width: 640, height: 360 }, protocolTimeout: 300000 });
  const page = await browser.newPage();
  // (what's already in this browser's storage: a purse, a wardrobe)
  if (seed) await page.evaluateOnNewDocument((seed) => { for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v); }, seed);
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
  // A has bought the Trueno and wears it in the garage (and the boykisser)
  A = await player('A', ua.toString(), {
    'hush.wallet.v1': JSON.stringify({ shards: 0, total: 86, owned: ['trueno'] }),
    'hush.outfit.v1': JSON.stringify({ head: 'boykisser', body: 'fluffy', car: 'trueno', colors: {} }),
  });
  await A.page.evaluate(async () => { const h = window.__hush; h.audio.init(); await h.mic.start(h.audio); });
  // public trackers / relays sometimes just don't pass an offer along: one more try with a fresh room
  // before calling it broken (a real break fails both)
  let seated = false, tJoin = 0, tries = 0;
  for (tries = 1; tries <= 2 && !seated; tries++) {
    if (tries > 1) {
      log('no join — one more try with a fresh room');
      await B.browser.close().catch(() => {});
      B = null;
    }
    const code = await A.page.evaluate(async () => { const h = window.__hush; await h.coop.create(); return h.coop.code; });
    log('room', code);
    await sleep(3000);
    log('A relays', JSON.stringify(await relays(A.page)));
    const link = await A.page.evaluate(() => window.__hush.coop.inviteLink());
    log('invite', link);

    tJoin = Date.now();
    const ub = new URL(link); // same server as A (the link carries the room, and the signalling choice)
    ub.protocol = ua.protocol;
    ub.host = ua.host;
    B = await player('B', ub.toString());
    await B.page.evaluate(async () => { const h = window.__hush; h.audio.init(); await h.mic.start(h.audio); h.coop.syncVoice(); h.coop.announce(); });
    seated = await until(async () => {
      const a = await A.page.evaluate(() => window.__hush.coop.players().length);
      const b = await B.page.evaluate(() => { const me = window.__hush.coop.me(); return me && me.slot; });
      return a === 2 && b === 1;
    }, tries === 1 ? Math.min(JOIN_TIMEOUT, 90000) : JOIN_TIMEOUT);
    log('B relays', JSON.stringify(await relays(B.page)));
  }
  tries--;
  const retry = tries > 1 ? ' (second try)' : '';
  check(`found each other through public signalling (${NET || 'nostr + torrent'})`, !!seated, seated ? `${((Date.now() - tJoin) / 1000).toFixed(1)} s after B opened the link${retry}` : 'timeout, twice');
  facts.push(seated ? `joined in ${((Date.now() - tJoin) / 1000).toFixed(1)} s${retry}` : 'no join (2 tries)');
  const ra = await relays(A.page), rb = await relays(B.page);
  facts.push(`relays A nostr ${ra.nostr.open}/${ra.nostr.total} torrent ${ra.torrent.open}/${ra.torrent.total}; B nostr ${rb.nostr.open}/${rb.nostr.total} torrent ${rb.torrent.open}/${rb.torrent.total}`);
  if (!seated) throw new Error('no connection');

  const rtt = await until(() => B.page.evaluate(() => window.__hush.coop.rtt(window.__hush.coop.hostId)), 15000);
  log('ping', rtt, 'ms');
  const links = await B.page.evaluate(() => { const n = window.__hush.coop.net; return [...n.peers.values()].map((p) => [...p.links].map((i) => n.links[i].name).join('+')); });
  log('B is linked to the host via', links.join(', '));
  facts.push(`ping ${rtt} ms via ${links.join(',')}`);

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
  facts.push(`voice ${vb.toFixed(2)}/${va.toFixed(2)}`);

  // the voice chain on B: the host's voice comes out of the auto-level at a healthy level, and B's own
  // lobby slider for the host (the real UI control) silences it
  const chain = await B.page.evaluate(async () => {
    const h = window.__hush, a = h.audio, id = h.coop.hostId, v = a.voices.get(id);
    const an = a.ctx.createAnalyser();
    an.fftSize = 2048;
    a.voiceBus.connect(an);
    const buf = new Float32Array(an.fftSize);
    const loudest = async (ms) => {
      let mx = -120;
      const end = performance.now() + ms;
      while (performance.now() < end) {
        an.getFloatTimeDomainData(buf);
        let s = 0;
        for (const x of buf) s += x * x;
        mx = Math.max(mx, 10 * Math.log10(s / buf.length + 1e-12));
        await new Promise((r) => setTimeout(r, 20));
      }
      return +mx.toFixed(1);
    };
    const on = await loudest(2500);
    const range = document.querySelector(`#coopList .row[data-id="${id}"] .vol-range`);
    let off = null;
    if (range) {
      range.value = 0;
      range.dispatchEvent(new Event('input'));
      await new Promise((r) => setTimeout(r, 400));
      off = await loudest(2500);
      range.value = 100;
      range.dispatchEvent(new Event('input'));
    }
    a.voiceBus.disconnect(an);
    return { on, off, slider: !!range, agc: v && v.agcDb != null ? +v.agcDb.toFixed(1) : null };
  });
  check('host voice auto-levelled on B', chain.agc != null && chain.on > -40, JSON.stringify(chain));
  check("B's volume slider for the host silences it", chain.slider && chain.off != null && chain.off < -90, JSON.stringify(chain));
  facts.push(`voice bus ${chain.on} dBFS (auto-level ${chain.agc > 0 ? '+' : ''}${chain.agc} dB) · slider 0% → ${chain.off} dBFS`);

  // the wardrobe: B dresses up in the lobby (through the real panel); the host must see it on the roster...
  const fitB = await B.page.evaluate(() => {
    const w = window.__hush.wardrobe;
    w.open(); w.wear('pumpkin'); w.setSlot('body'); w.paint('#2f4f8f'); w.close();
    return JSON.stringify(window.__hush.coop.me().fit);
  });
  const seenFit = await until(() => A.page.evaluate(() => {
    const p = window.__hush.coop.players().find((q) => !q.self);
    return p && p.fit && p.fit.head === 'pumpkin' && p.fit.bc[0] === '#2f4f8f' ? JSON.stringify(p.fit) : null;
  }), 15000);
  check("B's outfit reaches the host", !!seenFit, seenFit || fitB);

  // the lobby is a garage: B (in the room through the link) sees the host at the wheel and itself on the chair
  const seats = await until(() => B.page.evaluate(() => {
    const h = window.__hush, g = h.garage;
    if (!g) return null;
    const s = g.figs.map((f) => (f ? (f.self ? 'me' : f.id === h.coop.hostId ? 'host' : 'mate') : '-')).join(' ');
    return s === 'host me - -' ? s : null;
  }), 15000);
  check('the garage seats the host at the wheel and B on the chair', !!seats, seats || '');
  const carB = await until(() => B.page.evaluate(() => (window.__hush.garage && window.__hush.garage.carId === 'trueno' ? 'trueno' : null)), 15000);
  check("the host's Trueno stands in B's garage", carB === 'trueno', String(carB || (await B.page.evaluate(() => window.__hush.garage && window.__hush.garage.carId))));
  facts.push(`host's car ${carB === 'trueno' ? 'synced' : 'NOT synced'}`);

  // START from the garage: the car starts on both screens, then the night
  const t0 = Date.now();
  await A.page.evaluate(() => window.__hush.coop.startRun({ cut: true }));
  const cut = await until(() => B.page.evaluate(() => window.__hush.lobby.starting || window.__hush.state === 'playing'), 15000);
  check('the car starts for the guest too', !!cut);
  const both = await until(async () => {
    const a = await A.page.evaluate(() => `${window.__hush.state}/${window.__hush.game.state}/${window.__hush.game.role}`);
    const b = await B.page.evaluate(() => `${window.__hush.state}/${window.__hush.game.state}/${window.__hush.game.role}`);
    return a === 'playing/morning/host' && b === 'playing/morning/client' ? `${a} ${b}` : null;
  }, 60000);
  check('host starts the night for both', !!both, `${both || ''} (${((Date.now() - t0) / 1000).toFixed(1)} s with the car)`);
  // ...and on B's body in the night
  const rigKey = await A.page.evaluate(() => { const r = [...window.__hush.game.remotes.values()][0]; return r ? r.rig.key : null; });
  check("the host's teammate wears B's outfit", rigKey === 'survivor:pumpkin+jacket', rigKey || 'no teammate');
  facts.push(`outfit ${seenFit && rigKey === 'survivor:pumpkin+jacket' ? 'synced' : 'NOT synced'}`);
  await A.page.evaluate(() => window.__hush.input.keys.add('KeyW'));
  await sleep(2000);
  await A.page.evaluate(() => window.__hush.input.keys.delete('KeyW'));
  await sleep(1500);
  const pa = await A.page.evaluate(() => { const p = window.__hush.game.player; return [p.x, p.z]; });
  const pb = await B.page.evaluate(() => { const r = [...window.__hush.game.remotes.values()][0]; return r ? [r.x, r.z] : [NaN, NaN]; });
  check('movement syncs', Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) < 0.5, `A (${pa.map((v) => v.toFixed(2))}) seen by B at (${pb.map((v) => v.toFixed(2))})`);

  // a cabin door: B swings it open from outside (it opens away from B: inward); the host sees the same
  const bDoor = await B.page.evaluate(() => {
    const g = window.__hush.game, d = g.doors.list[0], p = g.player;
    p.x = d.out.x; p.z = d.out.z;
    g.doors.use(d);
    return `${d.dir}/${d.seq}`;
  });
  const aDoor = await until(() => A.page.evaluate(() => { const d = window.__hush.game.doors.list[0]; return d.open ? `${d.dir}/${d.seq}` : null; }), 20000);
  check("B's door swing reaches the host", aDoor === bDoor, `${aDoor} vs ${bDoor}`);
  // a cupboard: B opens the cabin's low one and takes something out; the host sees the same
  const bCab = await B.page.evaluate(() => {
    const g = window.__hush.game, cb = g.cabinets, c = cb.list.find((q) => q.kind === 'cupboard');
    cb.open(c);
    const k = c.items.findIndex((q) => !q.taken && q.kind !== 'nuts');
    if (k >= 0) cb.take(c, k);
    return `${c.i}:${c.items.map((q) => (q.taken ? 1 : 0)).join('')}`;
  });
  const aCab = await until(() => A.page.evaluate((want) => {
    const c = window.__hush.game.cabinets.list[+want.split(':')[0]];
    const s = `${c.i}:${c.items.map((q) => (q.taken ? 1 : 0)).join('')}`;
    return c.opened && s === want ? s : null;
  }, bCab), 20000);
  check("B's cupboard (opened, a thing taken) reaches the host", aCab === bCab, `${aCab} vs ${bCab}`);
  // the flare gun: B fires; the flare flies on the host's machine too (owned by B)
  await B.page.evaluate(() => {
    const g = window.__hush.game, was = g.state;
    g.state = 'play'; // (it can only be fired at night; the shot itself is what we're after)
    g.setFlares(2, true);
    g.player.pitch = 0.8;
    g.fireFlare();
    g.state = was;
  });
  const aFlare = await until(() => A.page.evaluate(() => { const g = window.__hush.game, f = g.flares.list[0]; return f ? (f.owner === g.remotes.keys().next().value ? 'B' : 'someone else') : null; }), 20000);
  check("B's flare flies on the host's machine", aFlare === 'B', String(aFlare));
  facts.push(`door ${aDoor === bDoor ? 'synced' : 'NOT synced'} · cupboard ${aCab === bCab ? 'synced' : 'NOT synced'} · flare ${aFlare === 'B' ? 'synced' : 'NOT synced'}`);
  // the night, and one of the UAZ's parts: B asks for it (the host decides), throws it; it lands for the host too
  await A.page.evaluate(() => window.__hush.game.startDusk());
  const night = await until(async () => (await A.page.evaluate(() => window.__hush.game.state)) === 'play' && (await B.page.evaluate(() => window.__hush.game.state)) === 'play', 90000);
  check('the night falls for both', !!night);
  // the host's flashlight: B sees it on (and taken); a shard the host picks up pays B as well
  const torch = await (async () => {
    const hostId = await B.page.evaluate(() => window.__hush.coop.hostId);
    await A.page.evaluate(() => { const g = window.__hush.game; const it = g.torch.items[0]; g.torch.take(it); g.torch.toggle(); });
    const seen = await until(() => B.page.evaluate((id) => { const g = window.__hush.game, r = g.remotes.get(id); return !!(r && r.torchOn && g.torch.items[0].taken); }, hostId), 20000);
    await A.page.evaluate(() => { const g = window.__hush.game; if (g.torch.on) g.torch.toggle(); });
    return seen ? 'ok' : `B: ${await B.page.evaluate((id) => { const g = window.__hush.game, r = g.remotes.get(id); return `torchOn ${r && r.torchOn}, taken ${g.torch.items[0] && g.torch.items[0].taken}`; }, hostId)}`;
  })();
  check("the host's flashlight shines on B's screen", torch === 'ok', torch);
  const purseB = () => B.page.evaluate(() => JSON.parse(localStorage.getItem('hush.wallet.v1') || '{"shards":0}').shards | 0);
  const before = await purseB();
  await A.page.evaluate(() => { const g = window.__hush.game; const k = g.shards.items.findIndex((s) => s.alive); const s = g.shards.items[k]; s.alive = false; g.onShard(s, k); });
  const paid = await until(async () => (await purseB()) === before + 1, 20000);
  check('a shard the host picks up pays B too', !!paid, `${before} → ${await purseB()}`);
  // B's flashlight (a guest's): a thing near B with nothing in the way sees the light, and the host's
  // monster comes to look — the guest's light has to reach the host as a noise
  const lit = await (async () => {
    const spot = await A.page.evaluate(() => {
      const g = window.__hush.game, [bid, r] = [...g.remotes.entries()][0];
      for (let a = 0; a < 360; a += 5) {
        const ang = (a * Math.PI) / 180, x = r.x + Math.sin(ang) * 16, z = r.z + Math.cos(ang) * 16;
        if (!g.world.col.free(x, z, 1) || g.world.losBlocked(r.x, r.y + 1.4, r.z, x, g.world.terrain.height(x, z) + 1.2, z, 0.3)) continue;
        const m = g.spawnMonster('listener', 30, 40);
        if (!m) return null;
        m.spawn(x, z, 'wander');
        window.__litM = m;
        window.__litHeard = false;
        const nz = g.noise.bind(g);
        g.noise = (...q) => { if (q[3] === 'torch' && q[5] === bid) window.__litHeard = true; return nz(...q); };
        return `${x.toFixed(1)},${z.toFixed(1)}`;
      }
      return null;
    });
    if (!spot) return 'no clear spot near B';
    // (B has to know it's there first: the host's monster snapshots)
    await until(() => B.page.evaluate(() => { const g = window.__hush.game, p = g.player; return g.monsters.some((m) => Math.hypot(m.x - p.x, m.z - p.z) < 20); }), 15000);
    await B.page.evaluate(() => { const T = window.__hush.game.torch; T.has = true; T.charge = 1; T.on = true; T.noiseT = 0; T.beaconT = 0; });
    const heard = await until(() => A.page.evaluate(() => (window.__litHeard && ['investigate', 'hunt'].includes(window.__litM.state) ? 'ok' : null)), 30000);
    await B.page.evaluate(() => { window.__hush.game.torch.on = false; });
    const why = heard || (await A.page.evaluate(() => `heard ${window.__litHeard}, monster ${window.__litM.state}`));
    await A.page.evaluate(() => { const g = window.__hush.game, m = window.__litM, i = g.monsters.indexOf(m); if (i >= 0) { m.dispose(); g.monsters.splice(i, 1); } });
    return why;
  })();
  check("a thing near B sees B's flashlight (the host's monster comes to look)", lit === 'ok', lit);
  facts.push(`flashlight ${torch === 'ok' ? 'synced' : 'NOT synced'} · guest's light ${lit === 'ok' ? 'seen' : 'NOT seen'} · shared shard ${paid ? 'ok' : 'NOT ok'}`);
  const partOk = await (async () => {
    const P = await A.page.evaluate(() => { const q = window.__hush.game.escape.parts[2]; return [q.x, q.z]; });
    await B.page.evaluate(([x, z]) => { const g = window.__hush.game; g.player.x = x + 0.8; g.player.z = z; g.player.vx = g.player.vz = 0; }, P);
    // the host has to see B there first (it checks who's close enough to take it)
    const near = await until(() => A.page.evaluate(([x, z]) => { const r = [...window.__hush.game.remotes.values()][0]; return !!r && Math.hypot(r.x - x, r.z - z) < 2.5; }, P), 20000);
    let mine = false;
    for (let i = 0; i < 6 && !mine; i++) {
      await B.page.evaluate(() => { const g = window.__hush.game; g.escape.askT = 0; g.escape.pick(g.escape.parts[2]); });
      mine = await until(() => B.page.evaluate(() => { const h = window.__hush.game.escape.held; return !!h && h.i === 2; }), 3000);
    }
    const diag = await A.page.evaluate(([x, z]) => { const g = window.__hush.game, r = [...g.remotes.values()][0], q = g.escape.parts[2]; return `host ${g.state}, B ${r ? Math.hypot(r.x - x, r.z - z).toFixed(1) : '?'} m off, part ${q.state}/${q.seq}`; }, P);
    if (!mine) return `not granted (${near ? 'seen near' : 'never seen near'}; ${diag})`;
    const hostSees = await A.page.evaluate(() => { const q = window.__hush.game.escape.parts[2]; return q.state === 'held' && q.holder !== window.__hush.game.player.id; });
    if (!hostSees) return `granted, but the host doesn't agree (${diag})`;
    await B.page.evaluate(() => window.__hush.game.escape.throwHeld());
    const landed = await until(() => A.page.evaluate(() => { const q = window.__hush.game.escape.parts[2]; return q.state === 'ground' && !q.settle; }), 45000);
    return landed ? 'ok' : 'no landing';
  })();
  check("B's part: granted by the host, thrown, lands on the host's machine", partOk === 'ok', partOk);
  facts.push(`UAZ part ${partOk === 'ok' ? 'synced' : partOk}`);
  // the other side: the host's monster takes B, then the host. The two dead hear each other from anywhere
  // ('beyond': close, not from where the body lies), and the host's panel lists them both
  const beyond = await (async () => {
    const spawned = await A.page.evaluate(() => {
      const g = window.__hush.game;
      g.teamOverAt = 1e9; // (keeps the night going after the last of them falls: the check needs it)
      const m = g.spawnMonster('listener', 8, 14);
      if (!m) return false;
      window.__smokeM = m;
      g.kill(m, [...g.remotes.values()][0]);
      return true;
    });
    if (!spawned) return 'no room for a monster';
    if (!(await until(() => B.page.evaluate(() => !window.__hush.game.player.alive), 20000))) return 'B never went down';
    await A.page.evaluate(() => { const g = window.__hush.game; g.kill(window.__smokeM, g.player); });
    const modeOnB = () => B.page.evaluate(() => { const h = window.__hush, v = h.audio.voices.get(h.coop.hostId); return v ? v.mode : 'no voice'; });
    if (!(await until(async () => (await modeOnB()) === 'beyond', 20000))) return `B hears the dead host as '${await modeOnB()}'`;
    const lv = await level(B.page, 'host');
    // (the panel waits until the thing that got you is out of your face: the death cam, a few seconds)
    const rows = await until(() => A.page.evaluate(() => document.querySelectorAll('#beyond .by-row').length === 2), 90000);
    const why = rows ? '' : await A.page.evaluate(() => { const g = window.__hush.game; return `host ${g.state}, death cam ${g.localDeath}, ${document.querySelectorAll('#beyond .by-row').length} rows`; });
    return lv > 0.05 && rows ? 'ok' : `level ${lv.toFixed(3)}, ${rows ? 'panel ok' : `the host's panel doesn't list both (${why})`}`;
  })();
  check('the dead hear each other from anywhere; the panel lists both', beyond === 'ok', beyond);
  facts.push(`dead voice ${beyond === 'ok' ? 'ok' : beyond}`);
  check('no page errors', A.page.errors.length === 0 && B.page.errors.length === 0);
} catch (e) {
  log('ERROR', e.message);
  ok = false;
} finally {
  if (A) await A.browser.close().catch(() => {});
  if (B) await B.browser.close().catch(() => {});
  log(ok ? 'ALL PASS' : 'SOME FAILED');
  if (process.env.GITHUB_ACTIONS) console.log(`::notice title=online smoke (${NET || 'nostr+torrent'}) ${ok ? 'PASS' : 'FAIL'}::${facts.join(' · ') || 'no facts'}`);
  process.exit(ok ? 0 : 1);
}
