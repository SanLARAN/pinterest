// 3.0e: the Гнус — a swarm that does not kill you, it eats your echo.
//
// It exists to make the bog's other half honest: water cuts your reach, and the midges cut your rate. Three
// seconds inside the cloud and every echo takes twice as long to come back for twenty seconds — with no other
// punishment, because being blind in the dark on the участок is already the worst thing that can happen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { World } from '../src/world/world.js';
import { RNG } from '../src/core/rng.js';
import { CFG } from '../src/core/config.js';
import { GNAT, Gnats } from '../src/game/gnat.js';

let bog = null;
const bogWorld = () => bog || (bog = new World(new THREE.Scene(), new THREE.MeshBasicMaterial(), 'bog').generate());

function stubGame(world, player) {
  const g = {
    world, scene: world.scene, map: 'bog', state: 'play', time: 0, auth: true, role: 'solo',
    rng: new RNG(777), player, remotes: new Map(), monsters: [],
    hud: { flashAlert() {}, peek() {}, popup() {} },
    audio: new Proxy({}, { get: () => () => {} }),
    sync: null, fire: null, flares: { list: [] },
    addTrauma() {},
    echoMul: 1, echoMulT: 0,
    livePlayers() { return [g.player, ...[...g.remotes.values()]].filter((p) => p.alive); },
    playerById(id) { return id === g.player.id ? g.player : g.remotes.get(id) || null; },
  };
  return g;
}
const mkPlayer = (id, x, z) => ({ id, alive: true, held: false, x, z, y: 0, yaw: 0, pitch: 0, speed: 0 });

// a swarm far from the camp and over water, so nothing in the smoke rules interferes
function quietSpot(w) {
  for (let z = -120; z < 140; z += 5) {
    for (let x = -140; x < 140; x += 5) {
      if (w.water.depth(x, z) > 0.3 && !w.onWalk(x, z, 1) && Math.hypot(x, z) > 40) return { x, z };
    }
  }
  throw new Error('no quiet water');
}

test('the swarm hears only what is loud, and comes at a walk-and-a-half', () => {
  const w = bogWorld();
  const at = quietSpot(w);
  const g = stubGame(w, mkPlayer('a', 0, 0));
  g.gnats = new Gnats(g);
  g.gnats.list.push(new g.gnats.list.constructor ? null : null); // (no-op: the class is internal)
  g.gnats.list = g.gnats.list.filter(Boolean);
  // one swarm, made the way the night makes them
  g.player.x = at.x; g.player.z = at.z;
  g.gnats.nextT = 0;
  g.gnats.update(0.016);
  assert.equal(g.gnats.list.length, 1, 'a swarm exists');
  const s = g.gnats.list[0];
  assert.equal(g.scene.children.includes(s.mesh), true, 'and it is drawn');
  assert.ok(GNAT.speed > CFG.PLAYER.walk && GNAT.speed < CFG.PLAYER.sprint,
    `faster than a walk, slower than a run: ${GNAT.speed}`);
  assert.ok(GNAT.r >= 5 && GNAT.r <= 8, 'a room-sized cloud');

  // a quiet footstep is nothing to it
  s.mode = 'drift';
  s.x = at.x + 30; s.z = at.z;
  g.gnats.hear(at.x, at.z, 0.085, 'step');
  assert.equal(s.mode, 'drift', 'a walk across dry peat is not worth crossing the bog for');
  // a shout is
  g.gnats.hear(at.x + 4, at.z, 0.8, 'voice');
  assert.equal(s.mode, 'fly');
  assert.equal(s.tx, at.x + 4);
  // ...but not from the next участок
  s.mode = 'drift';
  g.gnats.hear(at.x + 200, at.z + 200, 1, 'voice');
  assert.equal(s.mode, 'drift', 'it will not cross the whole bog for a sound');
});

test('three seconds inside the cloud, and the echo takes twice as long for twenty', () => {
  const w = bogWorld();
  const at = quietSpot(w);
  const p = mkPlayer('a', at.x, at.z);
  const g = stubGame(w, p);
  g.gnats = new Gnats(g);
  g.gnats.nextT = 0;
  g.gnats.update(0.016);
  const s = g.gnats.list[0];
  s.x = p.x; s.z = p.z; s.mode = 'feed';

  g.gnats.update(1.0);
  assert.equal(g.echoMul, 1, 'one second in: nothing yet');
  g.gnats.update(1.0);
  assert.equal(g.echoMul, 1, 'two seconds in: still your own eyes');
  g.gnats.update(1.2);
  assert.equal(g.echoMul, GNAT.blindMul, 'three seconds in: blinded');
  assert.equal(g.echoMulT, GNAT.blindFor);
  assert.equal(GNAT.blindMul, 2);

  // ...and it wears off by itself
  g.echoMulT = 0.5;
  g.gnats.update(0); // (the game ticks this, not the swarm — checked below)
  // (4.0) the echolocator's 30 s refill is what slows: at half speed while blinded (it used to be the cooldown that doubled)
  assert.match(readFileSync(new URL('../src/game/game.js', import.meta.url), 'utf8'),
    /this\.pingCD = Math\.max\(0, this\.pingCD - dt \/ \(this\.echoMul \|\| 1\)\)/,
    'the refill is what slows down');
});

test('walking out of the cloud does not blind you, and the clock drains', () => {
  const w = bogWorld();
  const at = quietSpot(w);
  const p = mkPlayer('a', at.x, at.z);
  const g = stubGame(w, p);
  g.gnats = new Gnats(g);
  g.gnats.nextT = 0;
  g.gnats.update(0.016);
  const s = g.gnats.list[0];
  s.x = p.x; s.z = p.z;
  g.gnats.update(1.5);
  assert.equal(s.blind.get('a') > 1, true, 'the clock is running');
  // you step out: it follows you down
  p.x = at.x + 40;
  g.gnats.update(0.5);
  const left = s.blind.get('a');
  p.x = at.x;
  g.gnats.update(0.1);
  assert.ok(left < 1.5, 'and it drains while you are out');
  assert.equal(g.echoMul, 1, 'out of the cloud, nothing happens');
});

test('smoke turns it: a burning flare pushes the swarm away, and so does the fire', () => {
  const w = bogWorld();
  const at = quietSpot(w);
  const g = stubGame(w, mkPlayer('a', 0, 0));
  g.gnats = new Gnats(g);
  g.gnats.nextT = 0;
  g.gnats.update(0.016);
  const s = g.gnats.list[0];
  s.x = at.x; s.z = at.z;
  // a flare lands beside it
  g.flares.list.push({ x: at.x + 2, z: at.z, lit: true, dead: false });
  const away0 = Math.hypot(s.x - (at.x + 2), s.z - at.z);
  g.gnats.update(0.5);
  const away1 = Math.hypot(s.x - (at.x + 2), s.z - at.z);
  assert.ok(away1 > away0, 'it backs off the smoke');
  assert.equal(s.repelT > 0, true);

  // and the camp fire holds it off its own ground
  g.fires = null;
  g.fire = { x: at.x, z: at.z, lit: 1 };
  assert.equal(g.gnats.smokeAt(at.x, at.z), true);
  assert.equal(g.gnats.smokeAt(at.x + 40, at.z), false);
  assert.equal(GNAT.repelR, 8);
  assert.equal(GNAT.repelT, 8);
});

test('never more than four swarms a night, and none in the forest', () => {
  const w = bogWorld();
  const g = stubGame(w, mkPlayer('a', 0, 0));
  g.gnats = new Gnats(g);
  for (let i = 0; i < 40; i++) {
    g.gnats.nextT = 0;
    g.gnats.update(0.05);
  }
  assert.ok(g.gnats.list.length <= GNAT.maxSwarms, `${g.gnats.list.length} swarms`);
  assert.equal(GNAT.maxSwarms, 4);

  const f = stubGame(bogWorld(), mkPlayer('a', 0, 0));
  f.map = 'forest';
  f.gnats = new Gnats(f);
  assert.equal(f.gnats.onBog, false);
  for (let i = 0; i < 20; i++) { f.gnats.nextT = 0; f.gnats.update(0.05); }
  assert.equal(f.gnats.list.length, 0, 'the forest has no midges');
  assert.doesNotThrow(() => f.gnats.hear(0, 0, 1, 'voice'));
});

test('in a room the host decides who is blinded, and the word carries', () => {
  const w = bogWorld();
  const ev = [];
  const p = mkPlayer('a', 0, 0);
  const g = stubGame(w, p);
  g.sync = { ev: (...a) => ev.push(a) };
  g.gnats = new Gnats(g);
  g.gnats.blind('a');
  assert.deepEqual(ev[0], ['gb', 'a', GNAT.blindFor], 'the host announces it once');
  assert.equal(g.echoMul, 2, 'and it lands here too');

  // a guest takes the host's word for it, and applies it to itself
  const q = mkPlayer('guest', 0, 0);
  const h = stubGame(w, q);
  h.role = 'client';
  h.auth = false;
  h.gnats = new Gnats(h);
  h.gnats.apply('guest', 12);
  assert.equal(h.echoMul, 2);
  assert.equal(h.echoMulT, 12);

  // the message is wired into the network
  const net = readFileSync(new URL('../src/game/netsync.js', import.meta.url), 'utf8');
  assert.match(net, /case 'gb': if \(isHostMsg && typeof a === 'string'\) g\.gnats\?\.apply\(a, \+b\)/);
  const game = readFileSync(new URL('../src/game/game.js', import.meta.url), 'utf8');
  assert.match(game, /this\.gnats = new Gnats\(this\)/);
  assert.match(game, /if \(this\.map === 'bog'\) this\.gnats\.hear\(x, z, loud, source\)/);
  assert.match(game, /this\.gnats\.update\(dt\)/);
  // and it has a voice in both languages
  const i18n = readFileSync(new URL('../src/core/i18n.js', import.meta.url), 'utf8');
  assert.match(i18n, /aGnatBlind: 'ГНУС В ГЛАЗАХ/);
  assert.match(i18n, /aGnatBlind: 'MIDGES IN YOUR EYES/);
});
