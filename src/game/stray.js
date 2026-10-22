// The Stray (Дворняжка, 2.1v): a girl in a tee two sizes too big, white hair, wolf ears, and one pink eye
// behind the fringe. She is the fourth night's answer to a forest that has taught you to read silhouettes:
// for once the shape in the echo is a person.
//
// She does not hunt by sound and she does not tear or eat. She follows — walking, at a pace slower than your
// own — and she only ever wakes up if you RUN near her. Walking past her is allowed; that is the whole rule.
// Angry, she comes at a chase speed just under a sprint, and if her hand closes it is 1.4 seconds. Alone, that
// is the end of you. In co-op she does not kill: she wears you. Your friends keep hearing a figure with
// your shape walk up to them and answer them in your voice, while your own microphone is dead to them.
//
// The whole body is an ordinary survivor rig in the two pieces her skin is made of (see outfit.js), so the
// echo, the lamp ghosts and daylight need nothing new. The decisions are host-side (solo: the only machine);
// guests replay her from the host's 'sy' state and her 'sw' wear messages.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { clamp } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { buildSurvivor, poseSurvivor } from './survivor.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { noteStrayMeeting, STRAY_MEET } from '../core/strayLog.js';

const S = () => CFG.STRAY;
export const STRAY_PHASES = ['away', 'follow', 'anger', 'chase', 'grab', 'wear', 'leave'];
export const STRAY_FIT = { head: 'strayhead', body: 'bigtee', hc: ['#e9e6df', '#e8a0b4'], bc: ['#d9d5c8', '#8a8a86'], car: 'uaz', cc: ['#4e6b3c', '#8a6a48'] };

// ---------------- pure pieces (the tests ride on these) ----------------

// How angry she is at the end of this frame. Running inside runR fills it; not running drains it faster than
// it filled, so a single sprint past her is survivable and a panicked loop around her is not.
export function angerStep(anger, dt, { running = false, d = 99 } = {}, s = S()) {
  const near = d <= s.runR;
  const k = near && running ? dt / s.angerT : -dt / (s.angerT * 2.6);
  return clamp(anger + k, 0, 1);
}

// what she does with a given distance and how loud your feet are. `calm` is how long you have gone
// without running since she started chasing: a chase ends when you stop, not when a number decays.
export function strayPhaseFor(phase, { d = 99, running = false, anger = 0, held = false, calm = 0 } = {}, s = S()) {
  if (held) return 'grab';
  if (phase === 'grab') return 'grab';
  if (phase === 'chase') return calm >= s.calmT || d > s.chaseR ? 'follow' : 'chase';
  if (phase === 'anger') return anger >= 1 ? 'chase' : anger > 0.02 ? 'anger' : 'follow';
  if (phase === 'follow') {
    if (anger >= 1) return 'chase';
    if (anger > 0.02) return 'anger';
    if (d > s.leaveR) return 'leave';
  }
  return phase;
}

// her walking speed at distance d: keeps about `keep` metres off and never crowds you
export function straySpeed(d, phase, s = S()) {
  if (phase === 'chase') return s.chase;
  if (phase === 'grab' || phase === 'away') return 0;
  if (phase === 'leave') return s.walk * 1.2;
  if (d > s.keep + 1.5) return Math.min(s.walk, 0.5 + (d - s.keep) * 0.22);
  return 0;
}

// a meeting is counted once a night, the first time she is this close
export function isMeeting(d, s = S()) {
  return d <= s.meetR;
}

// how the ten-meeting unlock reads: { met, need, done, justNow }
export function meetState(met, fresh = false, need = STRAY_MEET) {
  const m = Math.max(0, Math.min(need, Math.floor(met)));
  return { met: m, need, done: m >= need, justNow: !!fresh };
}

// which short line she says in your voice (index into the i18n list); the host picks, everyone hears the same
export function wearLine(rng) {
  return Math.floor((rng?.next ? rng.next() : Math.random()) * 3) % 3;
}

// ---------------- the thing itself ----------------
export class Stray {
  constructor(game) {
    this.g = game;
    this.phase = 'away';
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.yaw = 0;
    this.speed = 0;
    this.phaseT = 0;
    this.anger = 0;
    this.calm = 0;
    this.grabT = 0;
    this.coolT = 20;
    this.rig = null;
    this.meshes = [];
    this.mat = null;
    this.lampGhost = null;
    this.lastGhostT = -99;
    this.metTonight = false;
    this.wear = null; // { pid, t, x, z, yaw, line, name }
    this.worn = false; // this machine's player is the one being worn
    this.wornBy = null;
    this.earTurn = 0;
    this.earTwitch = 0;
    this.lastEarT = 0;
    this.reset();
  }

  reset() {
    this.phase = 'away';
    this.phaseT = 0;
    this.anger = 0;
    this.calm = 0;
    this.grabT = 0;
    this.coolT = 22;
    this.metTonight = false;
    this.wear = null;
    this.worn = false;
    this.wornBy = null;
    this.speed = 0;
    if (this.g.player) this.g.player.heldByStray = false;
    if (this.lampGhost) { this.g.ghosts.release(this.lampGhost); this.lampGhost = null; }
    this.hide();
  }

  // ---------------- the body ----------------
  ensureRig() {
    if (this.rig) return;
    const g = this.g;
    const rig = buildSurvivor(STRAY_FIT);
    const mat = createPersonMaterial(rig.dyes, 0xe9e6df);
    // no culling on her: a garment that is a single piece of cloth (a tee over the hips, the hem folded up
    // inside) must read as solid from any angle, and a reversed triangle must never turn into a hole in her
    mat.side = THREE.DoubleSide;
    mat.uniforms.uEcho.value = 1; // she is seen the way everything else is: as an echo, and in real light
    const meshes = dressPerson(rig, mat);
    rig.root.position.set(this.x, this.y, this.z);
    rig.root.visible = false;
    g.scene.add(rig.root);
    this.rig = rig;
    this.mat = mat;
    this.meshes = meshes;
  }

  dispose() {
    if (this.rig) {
      this.g.scene.remove(this.rig.root);
      undressPerson(this.meshes);
      this.mat?.dispose();
    }
    this.rig = null;
    this.meshes = [];
    this.mat = null;
    if (this.lampGhost) { this.g.ghosts.release(this.lampGhost); this.lampGhost = null; }
  }

  hide() {
    if (this.rig) this.rig.root.visible = false;
  }

  get present() {
    return this.phase !== 'away' && this.phase !== 'leave';
  }

  // ---------------- the host decides ----------------
  update(dt) {
    const g = this.g;
    if (!this.rig && !g.auth) return; // a guest makes the body only when the host sends a state
    if (g.state !== 'play') { this._onIdle(dt); return; }
    if (g.auth) this._host(dt);
    else this._guest(dt);
    this._present(dt);
  }

  _onIdle(dt) {
    // dawn and morning: she is gone with the rest of them
    if (this.phase !== 'away') {
      this.phase = 'away';
      this.anger = 0;
      this.wear = null;
      this.hide();
    }
    this._present(dt);
  }

  _host(dt) {
    const g = this.g, s = S();
    this.phaseT += dt;
    if (this.wear) { this._hostWear(dt); return; }
    if (g.diffDay() < s.fromDay || !g.awake) { if (this.phase !== 'away') this._leave(); return; }
    if (this.phase === 'away') {
      this.coolT -= dt;
      if (this.coolT <= 0 && g.time >= s.appearAt) this._appear();
      return;
    }
    if (this.phase === 'leave') {
      this.x += Math.sin(this.yaw) * s.walk * 1.2 * dt;
      this.z += Math.cos(this.yaw) * s.walk * 1.2 * dt;
      const p = g.player;
      if (Math.hypot(p.x - this.x, p.z - this.z) > s.leaveR + 12) this._away();
      return;
    }
    const p = g.player;
    if (!p.alive) { this._leave(); return; }
    const d = Math.hypot(p.x - this.x, p.z - this.z);
    const running = !!p.sprinting && p.speed > 2.2;
    this.anger = angerStep(this.anger, dt, { running, d }, s);
    if (this.phase === 'chase') this.calm = running ? 0 : this.calm + dt;
    else this.calm = 0;
    const next = strayPhaseFor(this.phase, { d, running, anger: this.anger, held: this.phase === 'grab', calm: this.calm }, s);
    if (next !== this.phase) this._setPhase(next);
    // a meeting, once a night (the skin is earned by ten of them, see strayLog)
    if (!this.metTonight && isMeeting(d, s)) this._meet();
    if (this.phase === 'grab') {
      this.grabT += dt;
      if (this.grabT >= s.grabT) this._take(p);
      return;
    }
    if (this.phase === 'chase' && d > s.chaseR) { this._setPhase('follow'); this.anger = 0; this.calm = 0; }
    // walk toward the player (she keeps her distance) or straight at them
    const sp = straySpeed(d, this.phase, s);
    this.speed = sp;
    if (sp > 0) {
      const want = Math.atan2(p.x - this.x, p.z - this.z);
      this.yaw = angleTo(this.yaw, want, Math.min(1, dt * (this.phase === 'chase' ? 6 : 2.2)));
      const step = Math.min(sp * dt, Math.max(0, d - (this.phase === 'chase' ? s.grabR * 0.7 : s.keep - 0.6)));
      this.x += Math.sin(this.yaw) * step;
      this.z += Math.cos(this.yaw) * step;
      this._walkStep(dt, sp);
    }
    this.y = this.g.world.terrain.height(this.x, this.z);
    // the hand closes
    if (this.phase === 'chase' && d < s.grabR) this._grab(p);
  }

  _appear() {
    const g = this.g, s = S();
    const p = g.player;
    const w = CFG.WORLD_WALL - 8;
    for (let k = 0; k < 30; k++) {
      const a = g.rng.float(0, Math.PI * 2), d = g.rng.float(s.appearFar[0], s.appearFar[1]);
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      if (Math.abs(x) > w || Math.abs(z) > w) continue;
      if (!g.world.col.free(x, z, 1) || g.world.inYard(x, z, 1.5)) continue;
      const L = g.world.lake;
      if (L && Math.hypot(x - L.x, z - L.z) < L.r + 3) continue;
      this.ensureRig();
      this.x = x;
      this.z = z;
      this.y = g.world.terrain.height(x, z);
      this.yaw = Math.atan2(p.x - x, p.z - z);
      this._setPhase('follow');
      this.anger = 0;
      this.metTonight = false;
      g.audio?.strayHum(this.x, this.y + 1.5, this.z, 0.75);
      return;
    }
    this.coolT = 6;
  }

  _setPhase(phase) {
    if (phase === this.phase) return;
    const g = this.g;
    this.phase = phase;
    this.phaseT = 0;
    if (phase === 'anger') {
      g.audio?.strayAnger(this.x, this.y + 1.6, this.z);
      g.hud?.flashAlert(t('strayRun'), 'warn', 2.6);
      g.addTrauma(0.22);
    } else if (phase === 'chase') {
      this.calm = 0;
      g.audio?.strayAnger(this.x, this.y + 1.6, this.z, 1.2);
      g.hud?.flashAlert(t('strayChase'), 'danger', 2.2);
    } else if (phase === 'follow') {
      this.anger = 0;
      this.calm = 0;
    } else if (phase === 'leave') {
      g.audio?.strayLeave(this.x, this.y + 1.4, this.z);
    }
  }

  _grab(p) {
    const g = this.g;
    if (g.doors?.blocks(this.x, this.z, p.x, p.z)) return;
    if (g.escape?.blocks(this.x, this.z, p.x, p.z)) return;
    if (g.world.losBlocked(this.x, this.y + 1.2, this.z, p.x, p.y + 1.1, p.z, 0.15)) return;
    this.grabT = 0;
    this._setPhase('grab');
    g.audio?.strayTake(this.x, this.y + 1.5, this.z);
    g.addTrauma(0.5);
    g.fx.glitch = Math.max(g.fx.glitch, 0.5);
    p.heldByStray = true;
    if (g.online) this._startWear(p);
  }

  // 1.4 s in her hands: solo, that is the end; the reel will want to see it, so it goes through g.kill
  _take(p) {
    const g = this.g, s = S();
    this.grabT = 0;
    p.heldByStray = false;
    if (g.online && this.wear) return; // already wearing them
    g.kill({ type: 'stray', x: this.x, y: this.y, z: this.z, feed() {}, huntCause: null }, p);
    this._away();
    this.coolT = g.rng.float(s.gap[0], s.gap[1]);
  }

  // ---------------- co-op: wearing someone ----------------
  _startWear(p) {
    const g = this.g, s = S();
    const name = p.name || g.nameOf?.(p) || '';
    const line = wearLine(g.rng);
    this.wear = { pid: p.id, t: 0, x: p.x, z: p.z, yaw: p.yaw || 0, line, name };
    this._setPhase('wear');
    p.heldByStray = false;
    g.sync?.ev('sw', p.id, 'start', line);
    if (p === g.player) this._becomeWorn(true, line); // the host is a player too
    g.hud?.flashAlert(t('strayWearMate').replace('{name}', name), 'danger', 3.4);
    this.coolT = 0;
    // her voice in place of theirs: the recorded phrase, if the shade ever learned one from them
    if (g.voiceMimic?.available) g.voiceMimic.speakAs?.(p.id, this.x, this.y, this.z);
  }

  _hostWear(dt) {
    const g = this.g, s = S();
    const w = this.wear;
    if (!w) return;
    w.t += dt;
    const victim = g.playerById(w.pid);
    if (!victim || !victim.alive || w.t > s.wear) { this._endWear(); return; }
    // the impostor walks toward the nearest friend
    let best = null, bd = 1e9;
    for (const q of g.livePlayers()) {
      if (q.id === w.pid || !q.alive) continue;
      const d = Math.hypot(q.x - this.x, q.z - this.z);
      if (d < bd) { bd = d; best = q; }
    }
    if (best) {
      const want = Math.atan2(best.x - this.x, best.z - this.z);
      this.yaw = angleTo(this.yaw, want, Math.min(1, dt * 2.4));
      if (bd > 3.5) {
        this.x += Math.sin(this.yaw) * s.wearSpeed * dt;
        this.z += Math.cos(this.yaw) * s.wearSpeed * dt;
        this.speed = s.wearSpeed;
      } else this.speed = 0;
      this.y = g.world.terrain.height(this.x, this.z);
      this._walkStep(dt, this.speed);
    }
    w.x = this.x; w.z = this.z; w.yaw = this.yaw;
    // her shorts breaths, once every few seconds, in their friend's place
    if (g.time - (this._sayT || -99) > 9) {
      this._sayT = g.time;
      g.sync?.ev('sw', w.pid, 'say', w.line);
    }
  }

  _endWear() {
    const g = this.g, w = this.wear;
    this.wear = null;
    this.worn = false;
    if (w) g.sync?.ev('sw', w.pid, 'end');
    this._leave();
  }

  // what a guest does with the host's word
  netWear(pid, what, line) {
    const g = this.g;
    if (what === 'start') {
      const r = g.remotes.get(pid);
      this.wear = { pid, t: 0, line: line | 0, name: r?.name || '' };
      this._setPhase('wear');
      if (pid === g.player.id) this._becomeWorn(true, line | 0);
      else g.hud?.flashAlert(t('strayWearMate').replace('{name}', r?.name || '?'), 'danger', 3.4);
    } else if (what === 'end') {
      const mine = this.wear && this.wear.pid === g.player.id;
      this.wear = null;
      if (mine) this._becomeWorn(false);
      this._leave();
    } else if (what === 'say') {
      const r = g.remotes.get(pid);
      const name = pid === g.player.id ? (g.coop?.me?.()?.name || '') : r?.name || '';
      g.hud?.flashAlert(`${name}: ${t(`strayLine${(line | 0) + 1}`)}`, 'warn', 3);
      g.audio?.strayRadio?.();
    }
  }

  // this machine's player is the one she is wearing: hands off the keys, and the mic goes dead to the team
  _becomeWorn(on, line = 0) {
    const g = this.g;
    this.worn = !!on;
    g.strayWorn = !!on;
    g.wornLine = line;
    if (on) {
      g.audio?.strayTake(g.player.x, g.player.y + 1.4, g.player.z);
      g.fx.glitch = Math.max(g.fx.glitch, 0.9);
      g.addTrauma(0.6);
      g.hud?.flashAlert(t('strayWornSelf'), 'danger', 4);
      g.hud?.flashAlert(t('strayMicDead'), 'warn', 4);
    } else {
      g.hud?.flashAlert(t('strayVoiceBack'), 'dawn', 3);
    }
    muteOwnVoice(g, !!on);
  }

  // ---------------- the guest replays her ----------------
  applyNet(d) {
    if (!Array.isArray(d) || this.g.auth) return;
    const [x, z, yaw, ph] = d;
    if (![x, z, yaw].every(Number.isFinite)) return;
    const phase = STRAY_PHASES[ph | 0] || 'away';
    if (phase === 'away') { this.phase = 'away'; this.hide(); return; }
    this.ensureRig();
    this.x = x;
    this.z = z;
    this.yaw = yaw;
    this.y = this.g.world.terrain.height(x, z);
    const moved = Math.hypot(x - (this._px ?? x), z - (this._pz ?? z));
    this.speed = moved * 6; // (the host sends 6 a second: a fair guess for the walk cycle)
    this._px = x;
    this._pz = z;
    if (phase !== this.phase) this.phase = phase;
  }

  netState() {
    return [+this.x.toFixed(2), +this.z.toFixed(2), +this.yaw.toFixed(3), STRAY_PHASES.indexOf(this.phase)];
  }

  _guest(dt) {
    if (this.phase === 'away') { this.hide(); return; }
    this.phaseT += dt;
    // a host who left mid-wear must not leave this machine frozen: the voice comes back on its own
    if (this.worn && this.phaseT > S().wear + 6) this._becomeWorn(false);
  }

  _walkStep(dt, sp) {
    const g = this.g;
    this._stepT = (this._stepT || 0) + dt * sp;
    if (this._stepT > 0.72 && sp > 0.25) {
      this._stepT = 0;
      const d = g.distToEars(this.x, this.z);
      if (d < 22) g.audio?.strayStep(this.x, this.y + 0.1, this.z, 0.55);
    }
  }

  _leave() {
    if (this.phase === 'away') return;
    this.phase = 'leave';
    this.anger = 0;
    this.grabT = 0;
    if (this.g.player) this.g.player.heldByStray = false;
  }

  _away() {
    this.phase = 'away';
    this.anger = 0;
    this.speed = 0;
    if (this.g.player) this.g.player.heldByStray = false; // (never leave a player stuck in a hand that let go)
    this.hide();
  }

  _meet() {
    const g = this.g;
    this.metTonight = true;
    const r = noteStrayMeeting(1);
    const st = meetState(r.met, r.fresh);
    g.stats.seen.stray = 1;
    if (st.justNow) {
      g.hud?.flashAlert(t('strayMetTen').replace('{n}', st.need), 'dawn', 5);
      g.audio?.strayMet(this.x, this.y + 1.6, this.z);
    } else {
      g.hud?.flashAlert(t('strayMet').replace('{n}', st.met).replace('{need}', st.need), 'dim', 2.6);
      g.audio?.strayHum(this.x, this.y + 1.5, this.z, 0.55);
    }
  }

  // ---------------- what everyone sees ----------------
  _present(dt) {
    const g = this.g;
    if (!this.rig) return;
    const show = this.phase !== 'away';
    this.rig.root.position.set(this.x, this.y, this.z);
    this.rig.root.rotation.y = this.yaw;
    const day = ['dawn', 'morning', 'dusk', 'training', 'won'].includes(g.state);
    const lit = day || g.glowAt(this.x, this.y + 1.1, this.z) > 0.03;
    this.rig.root.visible = show && lit && g.state === 'play';
    if (show) {
      poseSurvivor(this.rig, g.time * 0.9, this.phase === 'grab' ? 0 : this.speed, false, this.phase === 'grab');
      this._ears(dt);
    }
    // in a lamp's light: a sticky afterimage, the way a teammate in the dark is drawn
    if (this.rig.root.visible) {
      const str = Math.min(0.85, 0.25 + g.glowAt(this.x, this.y + 1.2, this.z) * 1.2);
      if (!this.lampGhost) this.lampGhost = g.ghosts.spawn(this.rig, g.time, { sticky: true, strength: str, full: 0.25, color: 0xe9e6df, jitter: 0.5 });
      else { g.ghosts.refresh(this.lampGhost, this.rig); this.lampGhost.strength = str; }
    } else if (this.lampGhost) { g.ghosts.release(this.lampGhost); this.lampGhost = null; }
  }

  // her ears: they turn toward you while she is close, and twitch now and then
  _ears(dt) {
    const n = this.rig?.nodes;
    if (!n || !n.earL || !n.earR) return;
    const g = this.g;
    const d = Math.hypot(g.player.x - this.x, g.player.z - this.z);
    const want = d < 16 ? clamp(Math.atan2(g.player.x - this.x, g.player.z - this.z) - this.yaw, -0.6, 0.6) : Math.sin(g.time * 0.6) * 0.25;
    this.earTurn += (want - this.earTurn) * Math.min(1, dt * 4);
    this.earTwitch = Math.max(0, this.earTwitch - dt);
    if (g.time - this.lastEarT > 1.6 + (this.x % 1) * 2) { this.lastEarT = g.time; if (Math.random() < 0.45) this.earTwitch = 0.16; }
    const tw = this.earTwitch > 0 ? Math.sin(this.earTwitch * 90) * 0.22 : 0;
    n.earL.rotation.y = this.earTurn - tw;
    n.earR.rotation.y = this.earTurn + tw;
    if (n.head) n.head.rotation.y = this.earTurn * 0.35;
  }

  // a sound wave reached her: she answers with a shape in the echo, like everything else does
  reveal(front) {
    const g = this.g;
    if (!this.rig || this.phase === 'away') return;
    const d = Math.hypot(this.x - front.x, this.y + 1.4 - front.y, this.z - front.z);
    if (d > front.prevR && d <= front.curR && d <= front.radius) {
      const fall = 1 - Math.min(1, d / Math.max(1, front.radius));
      g.ghosts.spawn(this.rig, g.time, { strength: clamp(0.6 + fall * 0.8, 0.6, 1.5), color: 0xe9e6df, life: 2.9, decay: 0.85 });
      g.stats.seen.stray = 1;
    }
  }
}

// the shortest way round from a to b, a step
function angleTo(a, b, k) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

// her voice takes yours: the outgoing microphone track goes dead for as long as she wears you
export function muteOwnVoice(g, on) {
  const stream = g?.coop?.net?.stream || g?.coop?.net?.stream?.stream;
  const tracks = stream?.getAudioTracks?.() || [];
  for (const tr of tracks) {
    try { tr.enabled = !on; } catch { /* a track that will not listen is still a track */ }
  }
  g.micDeadByStray = !!on;
  return tracks.length;
}
