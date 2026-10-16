// ============================================================
// SMOKE TEST — runs the whole simulation headlessly in node and plays
// it with a bot: walks, pings, searches bodies, repairs generators,
// gets hunted. Catches logic crashes and impossible objectives.
//   node tools/smoke.mjs [--night 480] [--runs 3] [--quiet]
// ============================================================
import { Game, DAY_LEN, DUSK_LEN, DAWN_LEN } from '../src/sim/game.js';
import { NOISE } from '../src/sim/player.js';
import { DEFS } from '../src/sim/monsters.js';
import { createWorld } from '../src/sim/world.js';
import { clamp, dist2 } from '../src/core/util.js';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const NIGHT = +arg('night', 1800);
const RUNS = +arg('runs', 2);
const QUIET = argv.includes('--quiet');
const log = (...a) => { if (!QUIET) console.log(...a); };

let failures = 0;
const STEP = 1 / 60;
/** advance the sim `secs` seconds in fixed 60Hz steps */
function advance(g, secs, perStep = null) {
  const n = Math.ceil(secs / STEP);
  for (let i = 0; i < n; i++) { if (perStep) perStep(i); g.update(STEP); }
  return n;
}
const fails = [];
function check(name, cond, extra = '') {
  if (cond) log(`  ✓ ${name}`);
  else { failures++; fails.push(name + ' ' + extra); log(`  ✗ ${name} ${extra}`); }
}

// ---------------------------------------------------------------- world sanity
log('\n== WORLD ==');
{
  const t0 = Date.now();
  const w = createWorld(4242);
  const ms = Date.now() - t0;
  log(`  generated in ${ms}ms`);
  check('generation under 600ms', ms < 600, ms + 'ms');
  check('5 generators', w.gens.length === 5);
  check('8 corpses', w.corpses.length === 8);
  check('5 fuses in the world', w.corpses.filter((c) => c.hasFuse).length === 5, '');
  check('trees placed', w.trees.count > 3000, String(w.trees.count));
  let minG = 1e9;
  for (const g of w.gens) minG = Math.min(minG, Math.hypot(g.x, g.z));
  log(`  nearest generator ${minG.toFixed(0)}m, farthest ${w.gens.map((g) => Math.hypot(g.x, g.z).toFixed(0)).join('/')}`);
  check('a generator is reachable early (<140m)', minG < 140);
  // generators must not be inside the lake or on a cliff
  let bad = 0;
  for (const g of w.gens) { if (w.isWater(g.x, g.z) || w.slopeAt(g.x, g.z) > 0.6) bad++; }
  check('generators on dry flat ground', bad === 0, bad + ' bad');
  // determinism
  const w2 = createWorld(4242);
  let same = w2.trees.count === w.trees.count;
  for (let i = 0; i < 300 && same; i++) if (w.trees.data[i] !== w2.trees.data[i]) same = false;
  check('deterministic for co-op', same);
  // collision resolves
  const tx = w.trees.data[0], tz = w.trees.data[1];
  const r = w.collide(tx + 0.05, tz, 0.42);
  check('collision pushes you out of a trunk', !!r && Math.hypot(r.x - tx, r.z - tz) > 0.4);
}

// ---------------------------------------------------------------- the bot
import { Bot, nearest } from './bot.mjs';

// ---------------------------------------------------------------- full run
function run(seed, nightLen, botOn = true, label = '') {
  log(`\n== RUN ${label} seed=${seed} night=${nightLen}s ==`);
  const g = new Game({ seed, nightLength: nightLen, headless: true, lang: 'ru', scares: true, host: true });
  const events = { phases: [], spawns: [], gens: 0, notes: 0, fuses: 0, deaths: 0, attacks: 0, screams: 0, scares: 0, returns: 0, wins: 0 };
  g.on('phase', (p) => events.phases.push(p));
  g.on('spawn', (m) => events.spawns.push(m.type));
  g.on('generator', () => events.gens++);
  g.on('note', () => events.notes++);
  g.on('fuse', () => events.fuses++);
  g.on('attack', () => events.attacks++);
  g.on('died', () => events.deaths++);
  g.on('scare', () => events.scares++);
  g.on('return', () => events.returns++);
  g.on('win', () => events.wins++);
  g.reset({ seed, nightLength: nightLen });

  const bot = botOn ? new Bot(g, seed) : null;
  const dt = 1 / 60;
  let steps = 0, simMs = 0, maxStep = 0;
  const maxSteps = Math.ceil((DAY_LEN + DUSK_LEN + nightLen + DAWN_LEN + 40) / dt);
  const t0 = Date.now();
  while (steps < maxSteps) {
    const s = process.hrtime.bigint();
    if (bot && g.phase === 'night' || (bot && g.phase === 'day')) bot.step(dt);
    g.update(dt);
    const e = Number(process.hrtime.bigint() - s) / 1e6;
    simMs += e; maxStep = Math.max(maxStep, e);
    steps++;
    if (g.phase === 'over') break;
  }
  const wall = Date.now() - t0;
  log(`  ${steps} steps in ${wall}ms — sim ${(simMs / steps).toFixed(3)}ms/step (max ${maxStep.toFixed(2)}ms) @ ${(steps / (wall / 1000)).toFixed(0)} steps/s`);
  log(`  phases: ${events.phases.join(' -> ')}`);
  log(`  spawns: ${events.spawns.join(',') || 'none'}`);
  log(`  gens ${events.gens}/5, notes ${events.notes}/8, fuses ${events.fuses}, attacks ${events.attacks}, deaths ${events.deaths}, scares ${events.scares}, returns ${events.returns}`);
  log(`  score ${Math.round(g.score)}, survived ${g.nightLen - Math.max(0, g.nightT)}s of ${g.nightLen}s, dist ${Math.round(g.stats.dist)}m`);
  return { g, events, steps, simMs, wall, maxStep };
}

// 1) arcade run with a bot — must reach a terminal state without crashing
const r1 = run(777, 480, true, 'arcade-bot');
check('arcade run terminated', r1.g.phase === 'over', r1.g.phase);
check('phase flow day->dusk->night', r1.events.phases.slice(0, 3).join(',') === 'day,dusk,night', r1.events.phases.join(','));
check('whisperers spawned', r1.events.spawns.includes('whisperer'));
check('echo returns produced', r1.events.returns > 50, String(r1.events.returns));
check('sim step < 1.5ms', r1.simMs / r1.steps < 1.5, (r1.simMs / r1.steps).toFixed(3) + 'ms');
check('bot moved around', r1.g.stats.dist > 100, Math.round(r1.g.stats.dist) + 'm');
check('bot searched bodies', r1.events.notes > 0, String(r1.events.notes));

// 2) COMPLETABILITY — how long does the objective loop take for a competent walker?
//    (a) no monsters: pure travel + repair budget
//    (b) with monsters + god mode: still finishable inside the canon night
log('\n== COMPLETABILITY ==');
function loopRun(seed, nightLen, { monsters, label }) {
  const g = new Game({ seed, nightLength: nightLen, headless: true, host: true });
  g.reset({ seed, nightLength: nightLen });
  g.phase = 'night'; g.phaseT = 0; g.skyT = 1; g.globalEcho = 0; g.nightT = nightLen;
  if (!monsters) g.schedule.length = 0;
  const bot = new Bot(g, seed);
  const dt = 1 / 60;
  let steps = 0;
  const maxSteps = Math.ceil((nightLen + 20) / dt);
  while (steps < maxSteps && g.phase !== 'over' && g.phase !== 'dead') {
    bot.step(dt);
    g.update(dt);
    if (g.stats.gens >= 5) break;
    steps++;
  }
  const mins = steps * dt / 60;
  log(`  ${label}: ${mins.toFixed(1)} min -> gens ${g.stats.gens}/5, notes ${g.stats.notes}/8, fuses ${g.stats.fuses}, walked ${Math.round(g.stats.dist)}m, score ${Math.round(g.score)}`);
  return { g, mins };
}
const a = loopRun(31337, 1800, { monsters: false, label: 'empty forest' });
check('all 5 generators repairable (no monsters)', a.g.stats.gens >= 5, a.g.stats.gens + '/5');
check('objective loop fits in 15 minutes of a 30 minute night', a.mins < 15, a.mins.toFixed(1) + 'min');
check('a full loop reads most of the bodies', a.g.stats.notes >= 5, String(a.g.stats.notes));
check('night shortened by generators', a.g.nightT < 1800 - 4 * 50, a.g.nightT.toFixed(0));
// A mortal bot under the real spawn schedule, averaged over seeds: being hunted is
// supposed to cost you, but a competent player must still get work done.
let hMins = 0, hGens = 0, hNotes = 0;
const HN = 5;
for (let i = 0; i < HN; i++) {
  const r = loopRun(31337 + i * 7919, 1800, { monsters: true, label: `haunted forest #${i + 1} (mortal bot)` });
  hMins += r.mins; hGens += r.g.stats.gens; hNotes += r.g.stats.notes;
}
hMins /= HN; hGens /= HN; hNotes /= HN;
check('a hunted player survives >=6 min on average', hMins >= 6, hMins.toFixed(1) + 'min avg');
check('a hunted player still repairs generators', hGens >= 2, hGens.toFixed(1) + '/5 avg');
check('a hunted player still reads the bodies', hNotes >= 3, hNotes.toFixed(1) + '/8 avg');
check('the empty-forest loop leaves >=18 min of slack', 1800 / 60 - a.mins >= 18, (1800 / 60 - a.mins).toFixed(1) + 'min');

// 2b) walkability: the forest must never pocket you
log('\n== WALKABILITY ==');
{
  const w = createWorld(4242);
  let pinched = 0, dead = 0, minPair = 99;
  const L = 6, n = w.trees.count;
  for (let i = 0; i < n; i++) {
    const o = i * L;
    const r = (w.trees.data[o + 5] === 2 ? 0.22 : 0.34) * (0.6 + w.trees.data[o + 3] * 0.045);
    for (let j = i + 1; j < Math.min(i + 24, n); j++) {
      const q = j * L;
      const d = dist2(w.trees.data[o], w.trees.data[o + 1], w.trees.data[q], w.trees.data[q + 1]);
      const rq = (w.trees.data[q + 5] === 2 ? 0.22 : 0.34) * (0.6 + w.trees.data[q + 3] * 0.045);
      const gap = d - r - rq;
      if (gap < minPair) minPair = gap;
      if (gap > 0 && gap < 0.95) pinched++;
    }
  }
  check('no two trunks leave an unwalkable gap', pinched === 0, pinched + ' pinched, min gap ' + minPair.toFixed(2) + 'm');
  // no closed pockets: from anywhere, some heading is walkable for 5m
  let rngS = 99;
  const rnd = () => { rngS = (rngS * 1103515245 + 12345) & 0x7fffffff; return rngS / 0x7fffffff; };
  for (let i = 0; i < 700; i++) {
    const x = (rnd() * 2 - 1) * w.half * 0.9, z = (rnd() * 2 - 1) * w.half * 0.9;
    if (w.isWater(x, z)) continue;
    if (w.collide(x, z, 0.45)) continue;      // standing inside a solid is not a pocket
    let lanes = 0;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      let ok = true;
      for (let d = 1.2; d <= 5; d += 1.2) if (w.collide(x + Math.sin(a) * d, z + Math.cos(a) * d, 0.45)) { ok = false; break; }
      if (ok) lanes++;
    }
    if (lanes === 0) dead++;
  }
  check('nowhere in the forest is a closed pocket', dead === 0, dead + ' dead spots / 700');
  // and a walking body can always travel: straight-line walk with collision sliding,
  // from a far corner of the map to the camp
  {
    const g = new Game({ seed: 4242, nightLength: 900, headless: true, host: true, scares: false });
    g.reset({ seed: 4242, nightLength: 900 });
    g.phase = 'night'; g.nightT = 900; g.skyT = 1; g.schedule.length = 0;
    const p = g.local;
    p.x = -w.half * 0.8; p.z = -w.half * 0.8; p.y = w.heightAt(p.x, p.z);
    p.inputs.az = 1; p.inputs.sprint = false; p.inputs.crouch = false;
    let stuckWorst = 0, moved = 0;
    for (let i = 0; i < 60 * 400; i++) {
      const tx = 0 - p.x, tz = 0 - p.z, td = Math.hypot(tx, tz) || 1;
      p.yaw = p.tYaw = Math.atan2(-tx / td, -tz / td);
      const before = { x: p.x, z: p.z };
      g.update(STEP);
      p.stamina = 1; p.nerve = 3; p.alive = true;
      moved += dist2(before.x, before.z, p.x, p.z);
      if (dist2(p.x, p.z, 0, 0) < 30) break;
    }
    stuckWorst = dist2(p.x, p.z, 0, 0);
    check('a walker can cross the whole map to camp', stuckWorst < 30, 'ended ' + Math.round(stuckWorst) + 'm out after ' + Math.round(moved) + 'm walked');
  }
  log('  objectives sit in clearings: gen 0 has ' + (() => { let c = 0; for (let i = 0; i < w.trees.count; i++) { const o = i * 6; if (dist2(w.trees.data[o], w.trees.data[o + 1], w.gens[0].x, w.gens[0].z) < 6) c++; } return c; })() + ' trunks within 6m');
}

// 2c) stealth: blind hunters must be escapable
log('\n== STEALTH & ESCAPE ==');
{
  const g = new Game({ seed: 5150, nightLength: 1800, headless: true, host: true, scares: false });
  g.reset({ seed: 5150, nightLength: 1800 });
  g.phase = 'night'; g.nightT = 1800; g.skyT = 1; g.globalEcho = 0; g.schedule.length = 0;
  const p = g.local;
  g.spawn('whisperer', 1, null);
  const m = g.monsters[g.monsters.length - 1];
  m.state = 'hunt'; m.stateT = 0; m.alert = 1; m.lostT = 5;
  m.x = p.x + 14; m.z = p.z + 14; m.y = g.world.heightAt(m.x, m.z);
  // run away, then go quiet: the trail must go cold
  const dt = 1 / 60;
  let t = 0, broke = -1;
  while (t < 40) {
    t += dt;
    if (t < 4) { p.inputs.az = 1; p.inputs.sprint = true; p.inputs.crouch = false; p.inputs.breath = false; }
    else { p.inputs.az = 1; p.inputs.sprint = false; p.inputs.crouch = true; p.inputs.breath = false; }
    p.yaw = p.tYaw = Math.atan2(-(p.x - m.x), -(p.z - m.z));   // forward = (-sin yaw, -cos yaw)
    g.update(dt);
    if (broke < 0 && (m.state === 'search' || m.state === 'roam')) broke = t;
  }
  const dEnd = dist2(p.x, p.z, m.x, m.z);
  check('a silent player breaks the hunt', broke > 0 && broke < 20, broke > 0 ? broke.toFixed(1) + 's' : 'never (' + m.state + ')');
  check('and ends up clear of it', dEnd > 18, dEnd.toFixed(0) + 'm');
  check('the player is still alive', p.alive, 'nerve ' + p.nerve);
}
{
  // sprinting away must not be a permanent escape: it is loud
  const g = new Game({ seed: 5151, nightLength: 1800, headless: true, host: true, scares: false });
  g.reset({ seed: 5151, nightLength: 1800 });
  g.phase = 'night'; g.nightT = 1800; g.skyT = 1; g.schedule.length = 0;
  const p = g.local;
  g.spawn('whisperer', 1, null);
  const m = g.monsters[g.monsters.length - 1];
  m.state = 'hunt'; m.alert = 1; m.lostT = 5; m.x = p.x + 16; m.z = p.z; m.y = g.world.heightAt(m.x, m.z);
  const dt = 1 / 60;
  let t = 0, hits = 0;
  g.on('attack', () => hits++);
  while (t < 30) {
    t += dt;
    p.inputs.az = 1; p.inputs.sprint = true; p.inputs.crouch = false; p.inputs.breath = false;
    p.yaw = p.tYaw = Math.atan2(m.x - p.x, m.z - p.z);
    g.update(dt);
    p.nerve = 3;   // measure the chase, not the damage
  }
  const gap = dist2(p.x, p.z, m.x, m.z);
  check('sprinting never shakes a hunter', m.state === 'hunt' || m.state === 'search' || m.state === 'lunge', m.state);
  check('and never actually gets you away', gap < 46, gap.toFixed(0) + 'm after 30s of sprinting');
}
{
  // the Tall One must charge in bursts, so a walker can survive the stalk phase
  const g = new Game({ seed: 5152, nightLength: 1800, headless: true, host: true, scares: false });
  g.reset({ seed: 5152, nightLength: 1800 });
  g.phase = 'night'; g.nightT = 1800; g.skyT = 1; g.schedule.length = 0;
  const p = g.local;
  g.spawn('tall', 1, null);
  const m = g.monsters[g.monsters.length - 1];
  m.state = 'hunt'; m.alert = 1; m.lostT = 99; m.x = p.x + 40; m.z = p.z; m.y = g.world.heightAt(m.x, m.z);
  const dt = 1 / 60;
  let t = 0, slowT = 0, charges = 0, wasFast = false;
  while (t < 24) {
    t += dt;
    p.inputs.az = 0; p.inputs.sprint = false;
    g.update(dt);
    m.lostT = 99; m.alert = 1;                     // keep it locked on for the measurement
    if (m.speed > 5.0) { charges++; if (!wasFast) wasFast = true; } else { slowT += dt; if (wasFast && m.speed < 4) wasFast = false; }
  }
  check('the Tall One is not permanently charging', slowT > 8, slowT.toFixed(1) + 's of its 24s under sprint speed');
}
{
  // adrenaline must fire when teeth find you
  const g = new Game({ seed: 5153, nightLength: 1800, headless: true, host: true, scares: false });
  g.reset({ seed: 5153, nightLength: 1800 });
  g.phase = 'night'; g.nightT = 1800; g.skyT = 1; g.schedule.length = 0;
  const p = g.local;
  p.items.adrenaline = 1;
  let shot = 0;
  g.on('adrenaline', () => shot++);
  g.spawn('whisperer', 1, null);
  const m = g.monsters[g.monsters.length - 1];
  m.state = 'hunt'; m.alert = 1; m.lostT = 5; m.x = p.x + 1.2; m.z = p.z; m.y = g.world.heightAt(m.x, m.z);
  advance(g, 6);
  check('adrenaline fires when you are hit', shot === 1 && p.adrenaline > 10, 'shots ' + shot + ', timer ' + p.adrenaline.toFixed(1) + 's');
  check('adrenaline is spent', p.items.adrenaline === 0, String(p.items.adrenaline));
  // measured in the camp clearing, running for open ground
  p.x = g.world.start.x; p.z = g.world.start.z; p.y = g.world.start.y;
  p.vx = 0; p.vz = 0; p.yaw = p.tYaw = 0; p.stamina = 1;
  p.inputs.az = 1; p.inputs.sprint = true; p.inputs.crouch = false; p.inputs.breath = false;
  advance(g, 2);
  check('on adrenaline you outrun the hunter', p.speed > DEFS.whisperer.speed.hunt, p.speed.toFixed(2) + ' m/s vs ' + DEFS.whisperer.speed.hunt);
}
{
  // lamp havens: a repaired generator must keep a whisperer off you
  const g = new Game({ seed: 5154, nightLength: 1800, headless: true, host: true, scares: false });
  g.reset({ seed: 5154, nightLength: 1800 });
  g.phase = 'night'; g.nightT = 1800; g.skyT = 1; g.schedule.length = 0;
  const p = g.local, gen = g.world.gens[0];
  gen.fixed = true; gen.progress = 1; gen.lamp = 1;
  p.x = gen.x + 2; p.z = gen.z + 2; p.y = gen.y;
  g.spawn('whisperer', 1, null);
  const m = g.monsters[g.monsters.length - 1];
  m.state = 'hunt'; m.alert = 1; m.lostT = 5; m.x = gen.x + 22; m.z = gen.z; m.y = gen.y;
  let hits = 0;
  g.on('attack', () => hits++);
  p.inputs.az = 0; p.inputs.sprint = false; p.inputs.breath = false;
  advance(g, 30, () => { p.x = gen.x + 2; p.z = gen.z + 2; p.inputs.az = 0; });
  check('the lamp keeps it off you', hits === 0, hits + ' hits in 30s standing in the light');
  check('and pushes it out of the light', dist2(m.x, m.z, gen.x, gen.z) > 20, dist2(m.x, m.z, gen.x, gen.z).toFixed(0) + 'm away');
}

// 3) monster schedule on the canon night
log('\n== SPAWN SCHEDULE (30 min) ==');
{
  const g = new Game({ seed: 99, nightLength: 1800, headless: true, host: true });
  const seen = [];
  g.on('spawn', (m) => seen.push([+(1800 - g.nightT).toFixed(0), m.type]));
  g.reset({ seed: 99, nightLength: 1800 });
  g.local.inputs.ax = 0; g.local.inputs.az = 0;
  const dt = 1 / 60;
  let steps = 0;
  while (steps < Math.ceil((DAY_LEN + DUSK_LEN + 1800 + DAWN_LEN + 30) / dt)) {
    g.update(dt);
    g.local.nerve = 3; g.local.iframe = 99;      // immortal observer
    steps++;
    if (g.phase === 'over') break;
  }
  log('  ' + seen.map(([t, k]) => `${(t / 60).toFixed(1)}m:${k}`).join('  '));
  const types = new Set(seen.map((s) => s[1]));
  check('all three species appear', types.has('whisperer') && types.has('tall') && types.has('weeper'), [...types].join(','));
  check('exactly ONE tall one', seen.filter((s) => s[1] === 'tall').length === 1);
  check('exactly ONE weeper', seen.filter((s) => s[1] === 'weeper').length === 1);
  check('tall appears before the weeper', seen.findIndex((s) => s[1] === 'tall') < seen.findIndex((s) => s[1] === 'weeper'));
  check('dawn reached and the run ends', g.phase === 'over', g.phase);
  check('win fired at dawn', g.winT === 1);
  check('monsters fled at dawn', g.monsters.length === 0 || g.monsters.every((m) => m.state === 'flee' || !m.alive));
  check('win score includes the survival bonus', g.score > 4000, String(Math.round(g.score)));
}

// 4) the scream rule
log('\n== SCREAM RULES ==');
{
  const g = new Game({ seed: 5, nightLength: 900, headless: true, host: true });
  g.reset({ seed: 5, nightLength: 900 });
  g.phase = 'night'; g.phaseT = 0; g.skyT = 1; g.globalEcho = 0;
  const p = g.local;
  // far away scream: nobody dies, everybody hears
  g.spawn('whisperer', 1);
  const m = g.monsters[0];
  m.state = 'roam'; m.spawnT = 99;
  m.x = p.x + 200; m.z = p.z;
  g.scream(p, 1);
  check('a far scream does not kill you', p.alive);
  check('a far scream sends the monster to the noise', m.state !== 'roam' && m.alert > 0.4 && Math.hypot(m.tx - p.x, m.tz - p.z) < 4, `${m.state}/${m.alert.toFixed(2)}`);
  const g1b = new Game({ seed: 5, nightLength: 900, headless: true, host: true });
  g1b.reset({ seed: 5, nightLength: 900 });
  g1b.phase = 'night'; g1b.skyT = 1;
  g1b.spawn('whisperer', 1);
  const m1b = g1b.monsters[0]; m1b.state = 'roam'; m1b.spawnT = 99;
  m1b.x = g1b.local.x + 70; m1b.z = g1b.local.z;
  g1b.scream(g1b.local, 1);
  check('a scream at 70m triggers an instant hunt', m1b.state === 'hunt' && m1b.alert === 1, `${m1b.state}/${m1b.alert}`);
  // close scream = death
  const g2 = new Game({ seed: 5, nightLength: 900, headless: true, host: true });
  g2.reset({ seed: 5, nightLength: 900 });
  g2.phase = 'night'; g2.skyT = 1;
  g2.spawn('whisperer', 1);
  const m2 = g2.monsters[0]; m2.state = 'roam'; m2.spawnT = 99;
  m2.x = g2.local.x + 9; m2.z = g2.local.z;
  g2.scream(g2.local, 1);
  check('screaming next to a monster kills you', !g2.local.alive && g2.deadCause === 'scream_close', String(g2.deadCause));
  check('death emits gameover later', g2.phase === 'dead');
  for (let i = 0; i < 200; i++) g2.update(1 / 60);
  check('gameover fires after the jumpscare beat', g2.phase === 'over', g2.phase);
}

// 5) noise propagation + hearing
log('\n== HEARING ==');
{
  const g = new Game({ seed: 11, nightLength: 900, headless: true, host: true });
  g.reset({ seed: 11, nightLength: 900 });
  g.phase = 'night'; g.skyT = 1;
  g.spawn('whisperer', 1);
  const m = g.monsters[0]; m.state = 'roam'; m.spawnT = 99;
  m.x = g.local.x + 25; m.z = g.local.z + 0;
  const before = m.alert;
  g.noise(g.local.x, g.local.z, NOISE.sprint, 'test', g.local, false);
  check('a sprint is heard at 25m (radius 34m)', m.alert > before, `${before.toFixed(2)}->${m.alert.toFixed(2)}`);
  m.alert = 0; m.x = g.local.x + 60;
  g.noise(g.local.x, g.local.z, NOISE.crouchStep, 'test', g.local, false);
  check('a crouch step is NOT heard at 60m (radius 5.5m)', m.alert === 0);
  const m2alert = m.alert;
  m.x = g.local.x + 400; m.alert = 0; m.state = 'roam';
  g.noise(g.local.x, g.local.z, NOISE.crouchStep, 'test', g.local, false);
  check('a crouch step is NOT heard at 400m', m.alert === 0);
}

// 6) generator light repels whisperers but not the tall one
log('\n== LIGHT RULES ==');
{
  const g = new Game({ seed: 21, nightLength: 900, headless: true, host: true });
  g.reset({ seed: 21, nightLength: 900 });
  g.phase = 'night'; g.skyT = 1;
  g.local.fuses = 1;
  const gen = g.world.gens[0];
  g.local.x = gen.x + 1; g.local.z = gen.z;
  g.setUse(true);
  advance(g, 6.5);
  g.setUse(false);
  check('a generator can be repaired', gen.fixed === true);
  check('repairing burns a fuse', g.local.fuses === 0, String(g.local.fuses));
  gen.lamp = 1;
  g.spawn('whisperer', 1);
  const m = g.monsters.find((x) => x.type === 'whisperer');
  m.state = 'hunt'; m.spawnT = 99; m.alert = 1;
  m.x = gen.x + 8; m.z = gen.z; m.tx = gen.x; m.tz = gen.z;
  for (let i = 0; i < 180; i++) g.update(1 / 60);
  const dOut = dist2(m.x, m.z, gen.x, gen.z);
  check('whisperers are pushed out of lamp light', dOut > 12, dOut.toFixed(1) + 'm');
  const g3 = new Game({ seed: 21, nightLength: 900, headless: true, host: true });
  g3.reset({ seed: 21, nightLength: 900 });
  g3.phase = 'night'; g3.skyT = 1; g3.world.gens[0].fixed = true; g3.world.gens[0].lamp = 1;
  g3.local.x = gen.x; g3.local.z = gen.z; g3.local.y = gen.y;
  g3.spawn('tall', 1);
  const t = g3.monsters[0]; t.state = 'hunt'; t.spawnT = 99; t.alert = 1;
  t.x = gen.x + 26; t.z = gen.z; t.tx = gen.x; t.tz = gen.z;
  advance(g3, 6);
  check('the Tall One walks into the light to reach you', dist2(t.x, t.z, gen.x, gen.z) < 12, dist2(t.x, t.z, gen.x, gen.z).toFixed(1) + 'm');
  // and the whisperer version of the same setup
  const g4 = new Game({ seed: 21, nightLength: 900, headless: true, host: true });
  g4.reset({ seed: 21, nightLength: 900 });
  g4.phase = 'night'; g4.skyT = 1; g4.world.gens[0].fixed = true; g4.world.gens[0].lamp = 1;
  g4.local.x = gen.x; g4.local.z = gen.z; g4.local.y = gen.y;
  g4.spawn('whisperer', 1);
  const w4 = g4.monsters[0]; w4.state = 'hunt'; w4.spawnT = 99; w4.alert = 1;
  w4.x = gen.x + 30; w4.z = gen.z;
  let minD = 1e9;
  advance(g4, 12, () => { minD = Math.min(minD, dist2(w4.x, w4.z, gen.x, gen.z)); });
  check('a whisperer cannot reach you inside the lamp light', minD > 8, minD.toFixed(1) + 'm');
  check('the Tall One damps echoes', g3.dampers.length === 1 && g3.dampers[0].r === DEFS.tall.echoDamp);
}

// 7) notes -> objectives -> radar knowledge
log('\n== NOTES & OBJECTIVES ==');
{
  const g = new Game({ seed: 33, nightLength: 900, headless: true, host: true });
  g.reset({ seed: 33, nightLength: 900 });
  g.phase = 'night'; g.skyT = 1;
  const p = g.local;
  let fuses = 0;
  g.on('fuse', (n) => { fuses = n; });
  for (const c of g.world.corpses) {
    p.x = c.x; p.z = c.z; p.y = c.y;
    g.setUse(true);
    advance(g, 2.2);
    g.setUse(false);
  }
  check('all 8 notes readable', g.notesFound.length === 8, String(g.notesFound.length));
  check('5 fuses collected from bodies', fuses === 5, String(fuses));
  check('notes mark 4 of 5 generators on the sonar', g.known.gens.size >= 4, String(g.known.gens.size));
  // the last one is found by actually pinging next to it
  for (const gen of g.world.gens) {
    if (g.known.gens.has(gen.id)) continue;
    p.x = gen.x + 20; p.z = gen.z; p.y = gen.y;
    p.pingCd = 0;
    g.ping(p, 0.6);
  }
  check('a sonar ping marks every generator in range', g.known.gens.size === 5, String(g.known.gens.size));
  check('the stone circle is known', g.known.circle === true);
  check('the cabin is known', g.known.cabin === true);
  check('earplugs picked up', p.items.earplugs === 1);
  // spare fuse at the cabin
  p.x = g.world.cabin.x; p.z = g.world.cabin.z;
  g.setUse(true);
  advance(g, 1.8);
  g.setUse(false);
  check('spare fuse at the cabin', p.fuses === 6, String(p.fuses));
}

// 8) earplugs save exactly one scream
log('\n== EARPLUGS ==');
{
  const g = new Game({ seed: 41, nightLength: 900, headless: true, host: true });
  g.reset({ seed: 41, nightLength: 900 });
  g.phase = 'night'; g.skyT = 1;
  const p = g.local;
  p.items.earplugs = 1;
  g.spawn('whisperer', 1);
  const m = g.monsters[0]; m.state = 'hunt'; m.spawnT = 99; m.alert = 1;
  m.x = p.x + 8; m.z = p.z;
  g.scream(p, 1);
  check('earplugs absorb the first fatal scream', p.alive && p.items.earplugs === 0);
  p.iframe = 0; p.alive = true;
  g.scream(p, 1);
  check('the second scream kills', !p.alive);
}

// 9) co-op snapshot round trip
log('\n== CO-OP SNAPSHOT ==');
{
  const host = new Game({ seed: 88, nightLength: 900, headless: true, host: true });
  host.reset({ seed: 88, nightLength: 900 });
  host.phase = 'night'; host.skyT = 1; host.nightT = 700;
  host.addPlayer(1, 'GUEST');
  host.spawn('whisperer', 2);
  host.spawn('tall', 1);
  host.local.x = 12; host.local.z = -8;
  host.ping(host.local, 0.6);
  for (let i = 0; i < 120; i++) host.update(1 / 60);
  const snap = host.snapshot();
  const guest = new Game({ seed: 88, nightLength: 900, headless: true, host: false, localId: 1 });
  guest.reset({ seed: 88, nightLength: 900 });
  guest.applySnapshot(snap, 1 / 60);
  check('guest adopts the phase', guest.phase === host.phase, guest.phase);
  check('guest adopts the night clock', Math.abs(guest.nightT - host.nightT) < 1, guest.nightT.toFixed(1));
  check('guest sees all monsters', guest.monsters.length === host.monsters.length, `${guest.monsters.length}/${host.monsters.length}`);
  const gt = guest.monsters.find((m) => m.type === 'tall');
  const ht = host.monsters.find((m) => m.type === 'tall');
  check('tall position synced', gt && Math.hypot(gt.x - ht.x, gt.z - ht.z) < 3);
  check('guest sees both players', guest.players.length === 2, String(guest.players.length));
  check('guest keeps its own body', guest.local.id === 1);
  check('waves synced', guest.waves.length > 0 || host.waves.length === 0, String(guest.waves.length));
  const size = JSON.stringify(snap).length;
  log(`  snapshot size ${size} bytes`);
  check('snapshot under 4KB', size < 4096, size + 'B');
}

// 10) perf: long soak
log('\n== SOAK ==');
{
  const g = new Game({ seed: 1234, nightLength: 1800, headless: true, host: true });
  g.reset({ seed: 1234, nightLength: 1800 });
  const dt = 1 / 60;
  let steps = 0;
  const t0 = Date.now();
  let maxStep = 0;
  while (steps < 60 * 60 * 8 && g.phase !== 'over') {
    g.local.nerve = 3; g.local.iframe = 99;
    g.local.inputs.az = Math.sin(steps / 90) > 0 ? 1 : 0;
    g.local.inputs.ax = Math.cos(steps / 140);
    g.local.tYaw += 0.01;
    if (steps % 150 === 0) g.ping(g.local, 0.3 + (steps % 600) / 900);
    const s = process.hrtime.bigint();
    g.update(dt);
    const e = Number(process.hrtime.bigint() - s) / 1e6;
    if (e > maxStep) maxStep = e;
    steps++;
  }
  const wall = Date.now() - t0;
  log(`  ${steps} steps / ${(wall / 1000).toFixed(1)}s wall = ${(steps / (wall / 1000)).toFixed(0)}x realtime, max step ${maxStep.toFixed(2)}ms`);
  check('8 min of sim in <20s wall', wall < 20000, wall + 'ms');
  check('no single step over 25ms', maxStep < 25, maxStep.toFixed(2) + 'ms');
  check('monsters capped', g.monsters.length <= 8, String(g.monsters.length));
  check('waves capped', g.waves.length <= 8, String(g.waves.length));
  check('no NaN in player', Number.isFinite(g.local.x) && Number.isFinite(g.local.z) && Number.isFinite(g.local.y));
  check('no NaN in monsters', g.monsters.every((m) => Number.isFinite(m.x) && Number.isFinite(m.z)));
  check('player inside bounds', Math.hypot(g.local.x, g.local.z) < g.world.half * 1.05);
}

// 11) multiple seeds must always be solvable-shaped
log('\n== SEED SWEEP ==');
{
  let ok = 0, worst = 0;
  for (let i = 0; i < 12; i++) {
    const w = createWorld(1000 + i * 7919);
    let bad = 0;
    for (const g of w.gens) if (w.isWater(g.x, g.z) || w.slopeAt(g.x, g.z) > 0.75 || Math.hypot(g.x, g.z) > w.half * 0.9) bad++;
    for (const c of w.corpses) if (w.isWater(c.x, c.z)) bad++;
    if (w.corpses.filter((c) => c.hasFuse).length !== 5) bad++;
    const dmin = Math.min(...w.gens.map((g) => Math.hypot(g.x, g.z)));
    worst = Math.max(worst, dmin);
    if (bad === 0) ok++;
  }
  check('12/12 seeds produce a valid map', ok === 12, ok + '/12');
  log(`  farthest "nearest generator" across seeds: ${worst.toFixed(0)}m`);
  check('nearest generator always < 175m', worst < 175, worst.toFixed(0) + 'm');
}

log('\n=========================================');
if (failures) { console.log(`FAILED ${failures} checks:\n - ${fails.join('\n - ')}`); process.exit(1); }
else console.log('ALL CHECKS PASSED');
