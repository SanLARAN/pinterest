// ============================================================
// CO-OP TEST — exercises the whole networked path headlessly in node.
// A tiny in-process stand-in replaces the PeerJS cloud broker and the
// WebRTC transport, so two real Coop objects (and two real Game sims)
// talk to each other exactly as two browsers would: same message shapes,
// same async delivery, same handlers main.js installs.
//   node tools/cooptest.mjs [--quiet]
// What this CAN'T prove: that 0.peerjs.com is reachable and that two
// browsers can negotiate ICE through a given NAT. Those need a browser.
// ============================================================
import { Coop, makeCode } from '../src/net/coop.js';
import { Game } from '../src/sim/game.js';
import { Emitter } from '../src/core/util.js';

const QUIET = process.argv.includes('--quiet');
const log = (...a) => { if (!QUIET) console.log(...a); };
let failures = 0;
const fails = [];
function check(name, cond, extra = '') {
  if (cond) log(`  ✓ ${name}`);
  else { failures++; fails.push(`${name} ${extra}`); log(`  ✗ ${name} ${extra}`); }
}
const tick = (n = 1) => new Promise((res) => { let i = 0; const f = () => (++i >= n ? res() : setTimeout(f, 0)); setTimeout(f, 0); });
const STEP = 1 / 60;

// ---------------------------------------------------------------- fake broker
const BROKER = new Map();
let blockNextId = false;        // forces one 'unavailable-id' to test the retry path
const takenIds = new Set();

class FConn extends Emitter {
  constructor(peer) { super(); this.peer = peer; this.open = false; this.pair = null; this.type = 'data'; }
  send(msg) {
    const o = this.pair;
    if (!this.open || !o) return;
    // structured-clone-ish: the wire only ever carries plain JSON data
    queueMicrotask(() => { if (o.open) o.emit('data', JSON.parse(JSON.stringify(msg))); });
  }
  close() {
    if (!this.open) return;
    this.open = false;
    const o = this.pair; if (o) o.open = false;
    queueMicrotask(() => { this.emit('close'); if (o) o.emit('close'); });
  }
}

class FPeer extends Emitter {
  constructor(a, b) {
    super();
    this.destroyed = false; this.open = false; this.conns = [];
    this.id = typeof a === 'string' ? a : 'anon-' + Math.random().toString(36).slice(2, 10);
    queueMicrotask(() => {
      if (this.destroyed) return;
      if (blockNextId || BROKER.has(this.id) || takenIds.has(this.id)) {
        blockNextId = false;
        this.emit('error', { type: 'unavailable-id' });
        return;
      }
      BROKER.set(this.id, this);
      this.open = true;
      this.emit('open', this.id);
    });
  }
  on(ev, cb) { super.on(ev, cb); return this; }
  connect(remoteId) {
    const conn = new FConn(remoteId);
    this.conns.push(conn);
    queueMicrotask(() => {
      if (this.destroyed) return;
      const t = BROKER.get(remoteId);
      if (!t || t.destroyed) { this.emit('error', { type: 'peer-unavailable' }); return; }
      const rc = new FConn(this.id);
      conn.pair = rc; rc.pair = conn;
      t.conns.push(rc);
      t.emit('connection', rc);
      conn.open = true; rc.open = true;
      queueMicrotask(() => { conn.emit('open'); rc.emit('open'); });
    });
    return conn;
  }
  call() { return null; }
  disconnect() { this.open = false; }
  reconnect() { this.open = true; }
  destroy() {
    this.destroyed = true; this.open = false;
    BROKER.delete(this.id);
    for (const c of this.conns) c.close();
  }
}

const mkCoop = () => { const c = new Coop(); c.Peer = FPeer; return c; };

// ---------------------------------------------------------------- room lifecycle
log('\n== CO-OP: ROOM ==');
{
  const c = mkCoop();
  const seen = [];
  c.on('status', (s, m) => seen.push(`${s}${m ? ':' + m : ''}`));
  check('makeCode gives 5 unambiguous characters', /^[A-HJ-NP-Z2-9]{5}$/.test(makeCode()), makeCode());

  blockNextId = true;                       // first attempt collides -> must retry
  const code = await c.host(null);
  check('host() survives a room-code collision', typeof code === 'string' && code.length === 5, String(code));
  check('host reports hosting then hosted', seen.includes('hosting:' + code) && seen.some((s) => s.startsWith('hosted')), seen.join(' '));
  check('the room id is registered with the prefix', BROKER.has('eh30-' + code), [...BROKER.keys()].join(','));

  const g1 = mkCoop();
  const s1 = [];
  g1.on('status', (s, m) => s1.push(`${s}${m ? ':' + m : ''}`));
  check('a too-short code is refused', (await g1.join('AB', null)) === false && s1.includes('error:bad-code'), s1.join(' '));

  const g2 = mkCoop();
  const s2 = [];
  g2.on('status', (s, m) => s2.push(`${s}${m ? ':' + m : ''}`));
  const dead = 'QQQQQ';
  check('joining an empty room reports no-room', (await g2.join(dead, null)) === false && s2.includes('error:no-room'), s2.join(' '));

  const ok = await g1.join(code, null);
  await tick(3);
  check('guest joins a live room', ok === true && g1.connected, String(ok));
  check('host counts the peer', c.peerCount === 1 && c.connected, String(c.peerCount));
  check('both sides report joined', s1.includes('joined:' + code), s1.join(' '));
  takenIds.add('eh30-' + code);
  c.close(); g1.close(); g2.close();
  await tick(2);
  check('close() drops the room', c.peerCount === 0 && !BROKER.has('eh30-' + code), String(c.peerCount));
}

// ---------------------------------------------------------------- a real session
log('\n== CO-OP: TWO SIMS IN ONE FOREST ==');
{
  const SEED = 90210, NIGHT = 900;
  const hostC = mkCoop(), guestC = mkCoop();
  const hg = new Game({ seed: SEED, nightLength: NIGHT, headless: true, host: true, localId: 0, scares: false }).reset();
  const gg = new Game({ seed: SEED, nightLength: NIGHT, headless: true, host: false, localId: 9, scares: false }).reset();

  // ---- host side wiring (mirrors App.bindCoop) ----
  let peerCounter = 1;
  const hostEvents = [];
  const peerIds = [];
  const guestPings = [];
  hg.on('ping', (p) => guestPings.push(p.id));
  hostC.on('peerJoined', (peerId) => {
    const id = peerCounter++;
    peerIds.push([peerId, id]);
    hg.addPlayer(id, 'P' + (id + 1));
    hostC.sendHello({ yourId: id, seed: hg.seed, nightLength: hg.nightLen }, peerId);
  });
  hostC.on('input', (id, p, events) => {
    let pl = hg.players.find((x) => x.id === id);
    if (!pl) pl = hg.addPlayer(id, p.nm || 'P' + (id + 1));
    pl.remote = true; pl.name = p.nm || pl.name; pl._target = p;
    pl.nerve = p.n; pl.fuses = p.f;
    if (!pl.alive && p.a) pl.alive = true;
    const evs = events && events.length ? events : (p.e || null);
    if (evs) for (const ev of evs) {
      if (ev.k === 'ping' && pl.alive) hg.ping(pl, ev.s || 0.4);
      else if (ev.k === 'scream') hg.scream(pl, ev.l || 1);
      else if (ev.k === 'noise') hg.noise(ev.x, ev.z, ev.r, 'remote', pl, !!ev.l);
      else if (ev.k === 'gen') hostEvents.push(ev.k);
    }
  });
  hostC.on('peerLeft', (peerId) => {
    const hit = peerIds.find(([, , pid]) => pid === peerId) || peerIds.find(([pid]) => pid === peerId);
    if (hit) hg.removePlayer(hit[1]);
  });

  // ---- guest side wiring ----
  const guestEvents = [];
  const inbox = [];
  guestC.on('hello', (msg) => {
    gg.localId = msg.yourId; gg.isHost = false;
    if (msg.seed) gg.reset({ seed: msg.seed });
    inbox.push('hello:' + msg.yourId);
  });
  guestC.on('state', (snap, events) => { gg.applySnapshot(snap, STEP); if (events && events.length) for (const ev of events) inbox.push('s:' + ev.k); });
  guestC.on('ev', (id, ev) => inbox.push('ev:' + ev.k));
  let guestLeft = 0;
  guestC.on('hostLeft', () => guestLeft++);

  const code = await hostC.host(null);
  const joined = await guestC.join(code, null);
  await tick(4);
  check('guest joined the host room', joined === true && hostC.peerCount === 1, `${joined}/${hostC.peerCount}`);
  check('the guest adopted the id the host assigned', gg.localId === 1 && inbox[0] === 'hello:1', `${gg.localId} ${inbox[0]}`);
  check('the guest rebuilt the host forest', gg.seed === hg.seed && gg.world.gens.length === hg.world.gens.length, `${gg.seed} vs ${hg.seed}`);

  // ---- run 100 s of forest: day -> dusk -> night, with a monster on the field
  // events are queued and drained on the next send tick, exactly like App.netEvents
  const guestQ = [], hostQ = [];
  let sAcc = 0, iAcc = 0, sent = 0, received = 0;
  const FRAMES = 6000;
  for (let i = 0; i < FRAMES; i++) {
    // the guest walks north-west and clicks its tongue every ~2 s
    const gl = gg.local;
    gl.inputs.ax = -0.4; gl.inputs.az = 1; gl.inputs.crouch = i % 240 < 120;
    hg.update(STEP); gg.update(STEP);

    if (i === 600) guestQ.push({ k: 'ping', o: gg.localId, s: 0.55 });
    if (i === 1800) guestQ.push({ k: 'ping', o: gg.localId, s: 0.9 });
    if (i === 3000) guestQ.push({ k: 'noise', o: gg.localId, x: gl.x, z: gl.z, r: 30, l: false });
    if (i === 4200) guestQ.push({ k: 'scream', o: gg.localId, l: 1 });
    if (i === 900) hostQ.push({ k: 'toast', o: 0, x: 'host says hi' });

    iAcc += STEP;
    if (iAcc > 1 / 20) {
      iAcc = 0; sent++;
      const evs = guestQ.splice(0, guestQ.length);
      guestC.sendInput(gg.localId, gl.serialize(), evs);
    }
    sAcc += STEP;
    if (sAcc > 1 / 12) {
      sAcc = 0; received++;
      const evs = hostQ.splice(0, hostQ.length);
      hostC.sendState(hg.snapshot(), evs);
      for (const pl of hg.players) if (pl.remote && pl._target) pl.applyNet(pl._target, STEP);
    }
    if (i % 10 === 0) await tick(2);   // let the fake transport drain, like a real event loop
  }
  await tick(4);

  const gp = hg.players.find((p) => p.id === 1);
  const d = gp ? Math.hypot(gp.x - gg.local.x, gp.z - gg.local.z) : 999;
  log(`  ${sent} input packets, ${received} snapshots; guest at ${gg.local.x.toFixed(0)},${gg.local.z.toFixed(0)}; host sees it ${d.toFixed(2)}m away`);
  log(`  host: ${hg.phase} night=${hg.nightT.toFixed(0)} monsters=${hg.monsters.length} pings=${hg.stats.pings} screams=${hg.stats.screams}`);
  log(`  guest: ${gg.phase} night=${gg.nightT.toFixed(0)} monsters=${gg.monsters.length} players=${gg.players.length}`);

  check('the net loop actually ran', sent > 250 && received > 150, `${sent}/${received}`);
  check('guest clock tracks the host', gg.phase === hg.phase && Math.abs(gg.nightT - hg.nightT) < 2, `${gg.phase}/${hg.phase} ${gg.nightT.toFixed(1)} vs ${hg.nightT.toFixed(1)}`);
  check('guest sees the same monsters', gg.monsters.length === hg.monsters.length && hg.monsters.length > 0, `${gg.monsters.length} vs ${hg.monsters.length}`);
  check('guest sees every monster at the same place', gg.monsters.every((m, k) => Math.hypot(m.x - hg.monsters[k].x, m.z - hg.monsters[k].z) < 1.5), '');
  check('host simulates the guest body', !!gp && gp.remote === true && gp.alive, gp ? 'remote=' + gp.remote : 'missing');
  check('host tracks the guest position within 3m', d < 3, d.toFixed(2) + 'm');
  check('the guest moved a real distance on both sides', d < 3 && Math.hypot(gg.local.x, gg.local.z) > 25, Math.hypot(gg.local.x, gg.local.z).toFixed(0) + 'm');
  check('GUEST PINGS REACH THE HOST SIM', hg.stats.pings >= 2 && guestPings.filter((id) => id === 1).length >= 2, `pings=${hg.stats.pings} ids=${guestPings.join(',')}`);
  check('a guest ping makes a wave the host can see', guestPings.includes(1), guestPings.join(','));
  check('GUEST SCREAMS REACH THE HOST SIM', hg.stats.screams >= 1, `screams=${hg.stats.screams}`);
  check('host events reach the guest', inbox.includes('ev:toast') || inbox.includes('s:toast'), inbox.filter((x) => x.includes('toast')).join(',') || 'none');
  check('the guest survived the session or died honestly', gg.phase === 'night' || gg.phase === 'dawn' || gg.phase === 'dead', gg.phase);

  // ---- a third player: hellos must be addressed, not broadcast
  const g3 = mkCoop();
  const inbox3 = [];
  g3.on('hello', (msg) => inbox3.push(msg.yourId));
  const before = inbox.length;
  await g3.join(code, null);
  await tick(4);
  check('a second guest joins', hostC.peerCount === 2, String(hostC.peerCount));
  check('the newcomer got its own id', inbox3.length === 1 && inbox3[0] === 2, inbox3.join(','));
  check('the first guest was NOT re-addressed', inbox.length === before && gg.localId === 1, `${inbox.length} vs ${before}`);
  check('host simulates both guests', hg.players.filter((p) => p.id > 0).length === 2, hg.players.map((p) => p.id).join(','));

  // ---- leaving
  g3.close();
  await tick(4);
  check('host notices a guest leaving', hostC.peerCount === 1, String(hostC.peerCount));
  hostC.close();
  await tick(4);
  check('guest notices the host leaving', guestLeft === 1 && !guestC.connected, String(guestLeft));
  guestC.close();
}

log('\n=========================================');
if (failures) { console.log(`FAILED ${failures} co-op checks:\n - ${fails.join('\n - ')}`); process.exit(1); }
else console.log('CO-OP CHECKS PASSED');
