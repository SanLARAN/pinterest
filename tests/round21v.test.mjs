// 2.1v: the Stray — a fourth-night thing that follows you, wakes up only if you run, and takes the voice.
// The rules are checked as arithmetic (anger, phases, the walk, the ten meetings), the wiring as text:
// she has to be on the frame loop, in the echo, on the wire, in the atlas, in the wardrobe and in the audio.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CFG } from '../src/core/config.js';
import { Stray, angerStep, strayPhaseFor, straySpeed, isMeeting, meetState, wearLine, muteOwnVoice, STRAY_PHASES, STRAY_FIT } from '../src/game/stray.js';
import { strayLog, strayMet, straySkinUnlocked, noteStrayMeeting, clearStrayLog, STRAY_MEET } from '../src/core/strayLog.js';
import { owns, lockProgress, item, ITEMS } from '../src/game/outfit.js';
import { PROTOCOL } from '../src/net/net.js';

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const S = CFG.STRAY;

// a bare-bones localStorage so the tally survives a reload inside one test
function withStorage(fn) {
  const prev = globalThis.localStorage;
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
  try { return fn(); } finally {
    if (prev === undefined) delete globalThis.localStorage; else globalThis.localStorage = prev;
  }
}

test('she is the fourth night, and her numbers are what the game says they are', () => {
  assert.equal(S.fromDay, 4);
  assert.equal(S.grabR, 2.2);
  assert.equal(S.grabT, 1.4);
  assert.equal(S.meet, 10);
  assert.equal(STRAY_MEET, 10);
  assert.equal(S.wear, 45);
  assert.ok(S.walk < 3.1, 'she walks slower than you: following is not hunting');
  assert.ok(S.chase < 5.7 && S.chase > 3.1, 'angry she is between your walk and your sprint');
  assert.ok(S.angerT >= 0.5, 'a warning, not a trap');
  assert.deepEqual(STRAY_FIT.head, 'strayhead');
  assert.deepEqual(STRAY_FIT.body, 'bigtee');
  assert.deepEqual(STRAY_PHASES, ['away', 'follow', 'anger', 'chase', 'grab', 'wear', 'leave']);
});

test('running near her is the only thing that wakes her, and it takes the warning time', () => {
  let a = 0;
  // far away, running: nothing
  for (let i = 0; i < 100; i++) a = angerStep(a, 0.1, { running: true, d: 40 });
  assert.equal(a, 0);
  // walking right beside her: nothing, and any anger drains
  a = 0.6;
  for (let i = 0; i < 20; i++) a = angerStep(a, 0.1, { running: false, d: 3 });
  assert.equal(a, 0);
  // running inside the ring: it fills in about the warning time, not in one frame
  a = 0;
  let frames = 0;
  while (a < 1 && frames < 200) { a = angerStep(a, 1 / 60, { running: true, d: S.runR - 1 }); frames++; }
  const seconds = frames / 60;
  assert.ok(seconds > S.angerT * 0.9 && seconds < S.angerT * 1.15, `about ${S.angerT} s of running (${seconds.toFixed(2)})`);
  // a sprint straight past her (0.3 s in the ring) does not wake her
  let b = 0;
  for (let i = 0; i < 18; i++) b = angerStep(b, 1 / 60, { running: true, d: S.runR - 1 });
  assert.ok(b < 1 && b > 0.2);
});

test('the phases go follow → anger → chase, and back to a walk when you stop running', () => {
  assert.equal(strayPhaseFor('follow', { d: 8, anger: 0.4 }), 'anger');
  assert.equal(strayPhaseFor('follow', { d: 8, anger: 1 }), 'chase');
  assert.equal(strayPhaseFor('anger', { d: 8, anger: 0.99 }), 'anger', 'not until it is full');
  assert.equal(strayPhaseFor('anger', { d: 8, anger: 1 }), 'chase');
  assert.equal(strayPhaseFor('chase', { d: 8, anger: 0, calm: 0.5 }), 'chase', 'a chase is not ended by a number');
  assert.equal(strayPhaseFor('chase', { d: 8, anger: 0, calm: S.calmT }), 'follow', 'it ends when you have stopped running');
  assert.equal(strayPhaseFor('chase', { d: S.chaseR + 1, anger: 1 }), 'follow', 'or when you are far enough away');
  assert.equal(strayPhaseFor('follow', { d: S.leaveR + 5 }), 'leave');
  assert.equal(strayPhaseFor('follow', { d: 4 }), 'follow');
  assert.equal(strayPhaseFor('away', { d: 4 }), 'away', 'she is not there until the night puts her there');
  assert.equal(strayPhaseFor('chase', { d: 4, held: true }), 'grab');
  assert.equal(strayPhaseFor('grab', { d: 4 }), 'grab', 'the hand does not let go by itself');
});

test('she keeps her distance when calm and closes it when angry', () => {
  assert.equal(straySpeed(S.keep - 1, 'follow'), 0, 'never crowds you');
  assert.ok(straySpeed(S.keep + 6, 'follow') > 0);
  assert.ok(straySpeed(S.keep + 30, 'follow') <= S.walk, 'following is a walk, even from far off');
  assert.equal(straySpeed(20, 'chase'), S.chase);
  assert.equal(straySpeed(20, 'away'), 0);
});

test('a meeting is a distance, and ten of them are the skin — not one more than ten', () => {
  assert.equal(isMeeting(S.meetR - 0.5), true);
  assert.equal(isMeeting(S.meetR + 0.5), false);
  assert.deepEqual(meetState(0), { met: 0, need: 10, done: false, justNow: false });
  assert.deepEqual(meetState(9), { met: 9, need: 10, done: false, justNow: false });
  assert.deepEqual(meetState(10, true), { met: 10, need: 10, done: true, justNow: true });

  withStorage(() => {
    clearStrayLog();
    assert.equal(strayMet(), 0);
    assert.equal(straySkinUnlocked(), false);
    for (let i = 1; i <= 9; i++) {
      const r = noteStrayMeeting(1);
      assert.equal(r.met, i);
      assert.equal(r.skin, false, `no skin at ${i}`);
      assert.equal(r.fresh, false);
    }
    const tenth = noteStrayMeeting(1);
    assert.equal(tenth.met, 10);
    assert.equal(tenth.skin, true);
    assert.equal(tenth.fresh, true, 'the tenth one is the one worth a line of its own');
    const eleventh = noteStrayMeeting(1);
    assert.equal(eleventh.met, 10, 'the tally stops at ten');
    assert.equal(eleventh.fresh, false);
    assert.equal(straySkinUnlocked(), true);
    assert.equal(strayLog().met, 10, 'and survives a reload');
  });
});

test('the two pieces are hers alone: free, but locked until the tenth meeting', () => {
  withStorage(() => {
    clearStrayLog();
    assert.equal(item('strayhead').unlock, 'stray');
    assert.equal(item('bigtee').unlock, 'stray');
    assert.equal(owns('strayhead'), false);
    assert.equal(owns('bigtee'), false);
    const lock = lockProgress('strayhead');
    assert.deepEqual(lock, { kind: 'stray', met: 0, need: 10 });
    for (let i = 0; i < 10; i++) noteStrayMeeting(1);
    assert.equal(owns('strayhead'), true);
    assert.equal(owns('bigtee'), true);
    assert.equal(lockProgress('strayhead'), null);
    assert.equal(owns('hood'), true, 'and nothing else changed');
  });
  // both pieces exist in their slots, and the theme is a real one
  assert.ok(ITEMS.head.some((i) => i.id === 'strayhead'));
  assert.ok(ITEMS.body.some((i) => i.id === 'bigtee'));
  const outfit = src('src/game/outfit.js');
  assert.match(outfit, /stray: 'Дворняжка'/);
  assert.match(outfit, /theme: 'stray'/, 'the wardrobe has a theme to group them under');
});

test('her voice takes yours: the outgoing microphone really goes quiet, and comes back', () => {
  const track = { enabled: true };
  const g = { coop: { net: { stream: { getAudioTracks: () => [track] } } }, mic: {} };
  assert.equal(muteOwnVoice(g, true), 1);
  assert.equal(track.enabled, false);
  assert.equal(g.micDeadByStray, true);
  assert.equal(muteOwnVoice(g, false), 1);
  assert.equal(track.enabled, true);
  assert.equal(g.micDeadByStray, false);
  // a machine with no microphone at all must not throw
  assert.equal(muteOwnVoice({ coop: null }, true), 0);
  // the short line she uses: one of three, stable for a given rng
  const rng = { next: () => 0.5 };
  assert.ok([0, 1, 2].includes(wearLine(rng)));
  assert.equal(wearLine({ next: () => 0 }), 0);
  assert.equal(wearLine({ next: () => 0.99 }), 2);
});

test('she is on the frame loop, in the echo, and the host keeps her on the wire', () => {
  const game = src('src/game/game.js');
  assert.match(game, /this\.stray = new Stray\(this\)/);
  assert.match(game, /this\.stray\.reset\(\)/);
  assert.match(game, /this\.stray\.update\(dt\)/);
  assert.match(game, /this\.stray\?\.reveal\(s\)/, 'a sound wave arriving at her shows her, like everything else');
  assert.match(game, /this\.strayWorn \? this\.seatedLook\(look\)/, 'worn: the body stays where it stands');
  assert.match(game, /heldByHim \|\| heldByHer/, 'and her hand on your throat takes the keys away');

  const net = src('src/game/netsync.js');
  assert.match(net, /this\.send\('sy', this\.packStray\(\)\)/);
  assert.match(net, /case 'sy':/);
  assert.match(net, /case 'sw':/, 'the wear goes over the event channel');
  assert.ok(PROTOCOL >= 18, `the wire changed, so the protocol did (${PROTOCOL})`);
  assert.match(src('src/net/net.js'), /PROTOCOL = (18|19|20|21)/); // (3.0s moved it to 19 for the bog question, 3.0y to 20, 4.0 to 21)
});

test('her body is her own rig (3.0t), her skin is two survivor pieces, and the echo and the atlas can both use it', () => {
  const survivor = src('src/game/survivor.js');
  assert.match(survivor, /  strayhead\(R\) \{/);
  assert.match(survivor, /  bigtee\(R\) \{/);
  assert.match(survivor, /earL' : 'earR'/, 'the ears are on their own bones');
  const stray = src('src/game/stray.js');
  assert.match(stray, /buildStrayBody\(\)/); // (2.1v: buildSurvivor(STRAY_FIT) — 3.0t gave her a dog's legs, see round30t)
  assert.match(stray, /uEcho\.value = 1/);
  assert.match(stray, /ghosts\.spawn\(this\.rig/);
  const atlas = src('src/ui/atlasData.js');
  assert.match(atlas, /stray: \{ model: 'stray'/, 'a page in the atlas');
  assert.match(src('src/ui/atlasModels.js'), /function stray\(mat\)/);
});

test('the sounds exist, and the wardrobe says how far along you are instead of a price', () => {
  const audio = src('src/audio/audio.js');
  for (const m of ['strayHum', 'strayAnger', 'strayTake', 'strayLeave', 'strayStep', 'strayMet', 'strayRadio']) {
    assert.match(audio, new RegExp(`  ${m}\\(`), m);
  }
  const wardrobe = src('src/ui/wardrobe.js');
  assert.match(wardrobe, /lockProgress\(it\.id\)/);
  assert.match(wardrobe, /lock\.met\}\/\$\{lock\.need\}/, 'a locked card reads "3/10", not a price');
  assert.match(src('src/core/i18n.js'), /wrStrayLock/);
});

// ---------------- the whole loop, on stubs ----------------
// Not a unit of arithmetic: the real controller, the real rig, the real frame loop — driven with a fake game
// so that "she appears, follows, wakes when you run, closes her hand, and you die" is exercised end to end.
import * as THREE from 'three';

function fakeGame() {
  const g = {
    state: 'play', auth: true, awake: true, time: 0, day: 4, daysTotal: 4,
    rng: { float: (a, b) => (a + b) / 2, next: () => 0.5 },
    scene: new THREE.Scene(),
    world: {
      col: { free: () => true }, inYard: () => false, lake: null,
      terrain: { height: () => 0 }, losBlocked: () => false,
    },
    player: { x: 0, z: 0, y: 0, alive: true, sprinting: false, speed: 0, id: 'me', name: 'me', yaw: 0 },
    kills: [],
    diffDay: () => 4,
    livePlayers() { return [this.player]; },
    playerById(id) { return id === 'me' ? this.player : null; },
    ghosts: { spawn: () => ({ strength: 0, release() {}, refresh() {} }), refresh() {}, release() {} },
    audio: new Proxy({}, { get: () => () => {} }),
    hud: { flashAlert() {} },
    addTrauma() {},
    fx: {},
    glowAt: () => 0,
    distToEars: () => 8,
    doors: null, escape: null,
    stats: { seen: {} },
    online: false, sync: null,
    kill(m, v) { this.kills.push({ type: m.type, who: v.id }); },
  };
  return g;
}

test('the loop itself: she comes out, follows, wakes when you run near her, and the hand closes', () => {
  const g = fakeGame();
  const st = new Stray(g);
  g.stray = st;
  st.coolT = 0;
  const step = (dt) => { g.time += dt; st.update(dt); };

  // nothing for the first couple of minutes — the night has to have a shape first
  g.time = 10;
  step(0.05);
  assert.equal(st.phase, 'away');

  // and then she is there, somewhere 22–30 m off, walking
  g.time = S.appearAt;
  st.coolT = 0;
  step(0.05);
  assert.equal(st.phase, 'follow');
  assert.ok(st.rig, 'she has a body');
  const d0 = Math.hypot(st.x - g.player.x, st.z - g.player.z);
  assert.ok(d0 >= S.appearFar[0] - 1 && d0 <= S.appearFar[1] + 1, `she comes out at a distance (${d0.toFixed(1)} m)`);

  // walking: she closes the gap and then keeps her distance, and never wakes up
  for (let i = 0; i < 900; i++) { g.player.sprinting = false; g.player.speed = 1.4; step(1 / 30); }
  assert.equal(st.phase, 'follow', 'a walk beside her is allowed');
  const d1 = Math.hypot(st.x - g.player.x, st.z - g.player.z);
  assert.ok(d1 < d0, 'she did follow');
  assert.ok(d1 > 2, 'and did not walk into you');

  // now run, right next to her: the warning, the chase, and 1.4 s later it is over
  let grabbed = false;
  for (let i = 0; i < 900 && !g.kills.length; i++) {
    // keep her close enough to be the thing that is happening (inside the grip, not inside you)
    st.x = g.player.x + 2;
    st.z = g.player.z;
    g.player.sprinting = true; g.player.speed = 5.2;
    step(1 / 60);
    if (st.phase === 'grab') grabbed = true;
  }
  assert.ok(grabbed, 'her hand got there');
  assert.equal(g.kills.length, 1, 'one death, not two');
  assert.equal(g.kills[0].type, 'stray');
  assert.equal(g.kills[0].who, 'me');
  assert.equal(st.phase, 'away', 'and then she is gone again');
});

// (3.1p) «когда тебя убивает волчица, ты просто стоишь на месте, а не умираешь»: in co-op her hand used to keep you
// standing, alive and frozen, for 45 s. Now it kills as it does alone — and only then she walks off under your name.
test('in co-op her hand kills too: you go down like anyone else, then she walks to your friends under your name', () => {
  const g = fakeGame();
  g.online = true;
  g.sync = { sent: [], ev(...a) { this.sent.push(a); } };
  g.hud.flashAlert = () => {};
  const mate = { id: 'mate', x: 20, z: 0, y: 0, alive: true };
  g.livePlayers = function () { return [this.player, mate].filter((p) => p.alive); };
  g.playerById = function (id) { return id === 'me' ? this.player : id === 'mate' ? mate : null; };
  g.kill = function (m, v) { this.kills.push({ type: m.type, who: v.id }); v.alive = false; };
  const st = new Stray(g);
  g.stray = st;
  st.x = g.player.x + 1.5; st.z = g.player.z;
  st.phase = 'chase';
  st._grab(g.player);
  assert.equal(st.phase, 'grab', 'the same hold as alone, not «worn» at once');
  assert.equal(g.kills.length, 0);
  for (let i = 0; i < 120 && st.phase === 'grab'; i++) { g.time += 1 / 60; st.update(1 / 60); }
  assert.deepEqual(g.kills, [{ type: 'stray', who: 'me' }], 'the hand kills, in co-op too');
  assert.equal(g.player.heldByStray, false);
  assert.equal(st.phase, 'wear');
  assert.ok(st.wear && st.wear.pid === 'me');
  assert.deepEqual(g.sync.sent.find((e) => e[0] === 'sw').slice(0, 3), ['sw', 'me', 'start']);
  const d0 = Math.hypot(mate.x - st.x, mate.z - st.z);
  for (let i = 0; i < 60; i++) { g.time += 1 / 60; st.update(1 / 60); }
  assert.ok(Math.hypot(mate.x - st.x, mate.z - st.z) < d0 - 0.5, 'she walks toward the one still standing');
  // the cot (or the needle) puts you back on your feet, and the game is up
  g.player.alive = true;
  st.update(1 / 60);
  assert.equal(st.phase, 'leave');
  assert.equal(g.sync.sent.at(-1)[2], 'end');
  // ...and it also ends by itself
  const g2 = fakeGame(); const st2 = new Stray(g2); g2.stray = st2;
  g2.sync = { sent: [], ev(...a) { this.sent.push(a); } };
  g2.player.alive = false;
  st2.wear = { pid: 'me', t: S.wear + 0.1, line: 0 }; st2.phase = 'wear';
  st2._hostWear(0.016);
  assert.equal(st2.phase, 'leave');
  assert.equal(g2.sync.sent.at(-1)[2], 'end');
});
