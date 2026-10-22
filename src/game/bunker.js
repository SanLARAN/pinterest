// 3.0q — what happens in the shelter, once you are down there.
//
// The place itself (the concrete, the corridor, the void where the wall came apart) is built by the yard:
// see world/bunker.js, which also holds the script — the order of the beats, the three minutes, the lamps going
// out one by one. This file is the part that can be seen and heard: the cap's door in the yard, the lamps, the
// breaker's lever, the blast door coming down in its slot, the red in the crack, and the ones that come out of
// it.
//
// The order of the whole thing, and there is nothing the player can do about any of it:
//
//   the five generators run → the yard has power → the cap's lock clicks
//   she goes down the ladder, along the corridor, past the ribs, to the breaker at the far end
//   the breaker: the gate above starts rolling, the wall answers, the lamps die from the far end back
//   the alarm, the blast door starts down (three minutes), and the crack lets everything out
//   she runs. The ladder is at the other end of the corridor. If the slab is down before she is through, it is
//   the shelter's.
//
// Everything here is local: a friend who comes down has their own shelter, their own alarm, their own three
// minutes. (The gate itself is the host's — the breaker asks Escape for it, as powerOn always did.)
import * as THREE from 'three';
import { DOOR_TIME, HORDE_MAX, ShelterScript, T_ALARM } from '../world/bunker.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { GK } from '../ui/garageSet.js';
import { shared, shadowLights, createWorldMaterial } from '../render/sonar.js';
import { RNG, clamp, damp } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { haloMaterial } from './glowsticks.js';

const LAMP_SLOT0 = 6; // 0..4 the generators, 5 the yard's floodlight, 6..12 Zarya (game/campPower.js)
const LAMP_I = 1.0;
const FADE_TO = 0.55; // s of black on the way down (and up)
const FADE_FROM = 0.7; // ...and coming out of it
const CINE = FADE_TO + FADE_FROM;
const CATCH = 1.15; // how close one of them has to be
const PI = Math.PI;

function boxAt(b, x, y, z, w, h, d, kind, rx = 0, ry = 0, rz = 0) {
  b.place(x, y, z, rx, ry, rz);
  b.box(w, h, d, kind);
}

export class Bunker {
  constructor(game) {
    this.g = game;
    this.world = game.world;
    this.B = this.world.bunker || null; // the bog has no shelter
    this.script = new ShelterScript();
    this.gate = false;
    this._inside = false;
    this.cine = null;
    this.fade = 0;
    this.horde = [];
    this.alarm = null;
    this.doorsSnd = null;
    this.seen = {};
    this.beatT = 0;
    this.cineScare = 0;
    this.alarmCall = DOOR_TIME;
    this.after = null; // s since she came back up, while the cap answers
    this.dead = false;
    this._hit = 0;
    this.wasInside = false;
    this.rng = new RNG(9931);
    if (!this.B) return;
    this.B = this.world.bunker;
    this.fy = this.B.y;
    this._materials();
    this._buildCap();
    this._buildInside();
  }

  // ---------------- the materials ----------------
  _materials() {
    this.mat = this.world.material; // concrete and steel read like the rest of the world
    // the ones out of the crack: their own faint light, so a shape can be made out in the dark
    this.hordeMat = createWorldMaterial();
    this.hordeMat.uniforms.uSelfLit = { value: 0.42 };
    this.hordeMat.defines = { SELF_LIT: 1 };
    this.hordeMat.needsUpdate = true;
    // unlit things: the red in the crack, the eyes, the sign over the exit
    this.glowMat = new THREE.MeshBasicMaterial({ color: 0xff2a14, transparent: true, opacity: 0, depthWrite: false });
    this.bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe6bc, transparent: true, opacity: 1 });
  }

  // ---------------- the cap in the yard ----------------
  _buildCap() {
    const g = this.g, B = this.B, H = B.hatch;
    const gy = this.world.terrain.height(H.x, H.z);
    this.capY = gy;
    // the steel door: hinged on its left edge, so it swings out into the yard
    const b = new MeshBuilder(512);
    boxAt(b, 0.52, 0, 0, 1.04, 2.0, 0.09, GK.DARK); // the leaf
    boxAt(b, 0.52, 0.62, 0.05, 0.9, 0.06, 0.03, GK.RUST); // a batten across it
    boxAt(b, 0.52, -0.5, 0.05, 0.9, 0.06, 0.03, GK.RUST);
    boxAt(b, 0.9, -0.05, 0.06, 0.14, 0.16, 0.04, GK.CHROME); // the lock plate
    b.place(0.9, -0.05, 0.1);
    b.cylinder(6, 0.02, 0.02, 0.12, GK.CHROME); // the handle
    this.capDoor = new THREE.Mesh(b.toGeometry(), this.mat);
    this.capDoor.position.set(H.x - 0.52, gy + 1.06, H.z - H.d / 2 - 0.05);
    this.capDoor.rotation.y = 0;
    g.scene.add(this.capDoor);
    if (g.shadows) g.shadows.addDynamic(this.capDoor, 1.4);
    // the lamp over the door: red while it is locked, green once the yard has power
    this.capLamp = new THREE.Sprite(haloMaterial(0xff3020));
    this.capLamp.position.set(H.x + 0.85, gy + H.h - 0.4, H.z - H.d / 2 - 0.42);
    this.capLamp.scale.setScalar(0.5);
    this.capLamp.material.opacity = 0.5;
    g.scene.add(this.capLamp);
    this.capFront = { x: H.x, z: H.z - H.d / 2 - 1.1 };
  }

  // ---------------- under the concrete ----------------
  _buildInside() {
    const g = this.g, B = this.B;
    const fy = this.fy;
    // ---- the blast door: a slab that lives up in the ceiling until the alarm sends it down ----
    const db = new MeshBuilder(768);
    boxAt(db, 0, 0, 0, B.door.x1 - B.door.x0 + 0.2, 2.6, 0.2, GK.TIN);
    for (let i = 0; i < 5; i++) boxAt(db, 0, -1.0 + i * 0.5, 0.12, B.door.x1 - B.door.x0 - 0.1, 0.08, 0.03, GK.RUST);
    for (const s of [-1, 1]) boxAt(db, s * (B.door.x1 - B.door.x0) / 2 * 0.78, 0, -0.12, 0.18, 2.4, 0.12, GK.DARK);
    boxAt(db, 0, 1.22, 0.13, 1.2, 0.28, 0.02, GK.YELLOW);
    this.doorMesh = new THREE.Mesh(db.toGeometry(), this.mat);
    this.doorMesh.position.set((B.door.x0 + B.door.x1) / 2, fy + 1.3 + B.door.h, B.door.z);
    g.scene.add(this.doorMesh);
    if (g.shadows) g.shadows.addDynamic(this.doorMesh, 4);
    // the red beacon over the doorway: it starts blinking with the alarm
    this.beacon = new THREE.Sprite(haloMaterial(0xff2a10));
    this.beacon.position.set((B.door.x0 + B.door.x1) / 2, fy + B.door.h - 0.45, B.door.z + 0.35);
    this.beacon.scale.setScalar(1.1);
    this.beacon.material.opacity = 0;
    g.scene.add(this.beacon);

    // ---- the lamps: a housing on a stem, a bulb, and a halo. Six of them, landing to vault ----
    const lb = new MeshBuilder(256);
    boxAt(lb, 0, 0.06, 0, 0.46, 0.12, 0.18, GK.TIN);
    lb.identity();
    lb.limb([0, 0.1, 0], [0, 0.34, 0], 0.02, 0.02, GK.TIN, 4);
    const lampGeo = lb.toGeometry();
    this.lamps = B.lamps.map((z, i) => {
      const x = (B.hall.x0 + B.hall.x1) / 2;
      const room = z > B.hall.z1 ? B.landing : z < B.vault.z1 ? B.vault : B.hall;
      const y = fy + room.h - 0.4;
      const housing = new THREE.Mesh(lampGeo, this.mat);
      housing.position.set(x, y, z);
      g.scene.add(housing);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), this.bulbMat);
      bulb.position.set(x, y - 0.04, z);
      g.scene.add(bulb);
      const halo = new THREE.Sprite(haloMaterial(0xffdca8));
      halo.position.set(x, y - 0.05, z);
      halo.scale.setScalar(2.6);
      halo.material.opacity = 0;
      g.scene.add(halo);
      return { i, x, y, z, housing, bulb, halo, on: 1 };
    });

    // ---- the exit over the doorway: a green sign you can find in the dark ----
    const sb = new MeshBuilder(128);
    boxAt(sb, 0, 0, 0, 0.9, 0.26, 0.05, GK.DARK);
    boxAt(sb, 0, 0, 0.03, 0.8, 0.18, 0.02, GK.GATE);
    // unlit on purpose: this is the one thing in here that is always visible, and that is the point of it
    this.sign = new THREE.Mesh(sb.toGeometry(), new THREE.MeshBasicMaterial({ color: 0x2f7a4c }));
    this.sign.position.set((B.door.x0 + B.door.x1) / 2, fy + 2.62, B.door.z - 0.32);
    g.scene.add(this.sign);
    this.signGlow = new THREE.Sprite(haloMaterial(0x54ff92));
    this.signGlow.position.copy(this.sign.position);
    this.signGlow.scale.setScalar(1.5);
    this.signGlow.material.opacity = 0.55;
    g.scene.add(this.signGlow);

    // ---- the breaker's lever (the panel itself is part of the wall, in world/bunker.js) ----
    const kb = new MeshBuilder(320);
    kb.identity();
    kb.limb([0, 0, 0], [0, -0.42, 0.3], 0.035, 0.028, GK.CHROME, 5); // the arm
    boxAt(kb, 0, -0.44, 0.32, 0.1, 0.1, 0.16, GK.RUST);
    kb.place(0, -0.53, 0.38);
    kb.cylinder(7, 0.06, 0.05, 0.2, GK.DARK, { capTop: true }); // the porcelain grip
    this.lever = new THREE.Mesh(kb.toGeometry(), this.mat);
    this.lever.position.set(B.breaker.x - 0.26, fy + 1.62, B.breaker.z);
    this.lever.rotation.z = 0;
    g.scene.add(this.lever);
    this.leverGlow = new THREE.Sprite(haloMaterial(0xff3a20));
    this.leverGlow.position.set(B.breaker.x - 0.5, fy + 1.9, B.breaker.z);
    this.leverGlow.scale.setScalar(0.6);
    this.leverGlow.material.opacity = 0.35;
    g.scene.add(this.leverGlow);

    // ---- the crack: red, deep, and breathing ----
    const R = B.rift;
    const rb = new MeshBuilder(256);
    rb.place(R.x, fy + 1.7, R.z + 0.05);
    rb.box(1.9, 3.2, 0.04, GK.NIGHT);
    this.riftPlate = new THREE.Mesh(rb.toGeometry(), this.glowMat);
    this.riftPlate.position.set(0, 0, 0);
    g.scene.add(this.riftPlate);
    this.riftHalo = new THREE.Sprite(haloMaterial(0xff2a12));
    this.riftHalo.position.set(R.x, fy + 1.6, R.z + 0.5);
    this.riftHalo.scale.setScalar(6);
    this.riftHalo.material.opacity = 0;
    g.scene.add(this.riftHalo);
    this.riftCore = new THREE.Sprite(haloMaterial(0xff6a30));
    this.riftCore.position.set(R.x, fy + 1.5, R.z + 0.4);
    this.riftCore.scale.setScalar(2.2);
    this.riftCore.material.opacity = 0;
    g.scene.add(this.riftCore);
    // eyes in the dark: they are only lit when it is awake
    this.eyes = [];
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Sprite(haloMaterial(0xff2412));
      s.scale.setScalar(0.19);
      s.material.opacity = 0;
      g.scene.add(s);
      this.eyes.push({ s, x: R.x + this.rng.float(-2.4, 2.4), y: fy + this.rng.float(0.25, 2.9), z: R.z + this.rng.float(-0.4, 0.5), ph: this.rng.float(0, 6) });
    }

    // ---- the ones that come out of it: one rig, shared ----
    const crawler = buildCrawlerRig();
    this.hordeGeo = crawler.tris;
    this.hordeLimb = crawler.limbs;
  }

  // ---------------- state ----------------
  reset() {
    this.silence();
    this.script.reset();
    this.gate = false;
    this._inside = false;
    this.wasInside = false;
    this.cine = null;
    this.fade = 0;
    this.seen = {};
    this.cineScare = 0;
    this.alarmCall = DOOR_TIME;
    this.after = null;
    this.dead = false;
    this.beatT = 0;
    this._hit = 0;
    this.rng = new RNG(9931);
    if (!this.B) return;
    for (const h of this.horde) this.g.scene.remove(h.group);
    this.horde = [];
    this.lever.rotation.z = 0;
    this.leverGlow.material.opacity = 0.35;
    this.capDoor.rotation.y = 0;
    this.capDoor.position.z = this.B.hatch.z - this.B.hatch.d / 2 - 0.05;
    this.capLamp.material.color.setHex(0xff3020);
    this.capLamp.material.opacity = 0.5;
    this.doorMesh.position.y = this.fy + 1.3 + this.B.door.h;
    this.beacon.material.opacity = 0;
    this.riftPlate.visible = true;
    this.glowMat.opacity = 0;
    for (const L of this.lamps) {
      L.on = 1;
      L.halo.material.opacity = 0;
      L.bulb.visible = false;
    }
    for (const e of this.eyes) e.s.material.opacity = 0;
    this.riftHalo.material.opacity = this.riftCore.material.opacity = 0;
    for (let i = 0; i < 5; i++) if (LAMP_SLOT0 + i < 13) shared.uLamp.value[LAMP_SLOT0 + i].w = 0;
    const p = this.g.player;
    if (p) {
      if (this._hadCol) { p.col = null; p.floorY = null; }
      p.underground = false;
      this._hadCol = false;
    }
  }

  // every sound off (back to the menu, or the night ended)
  silence() {
    for (const s of [this.alarm, this.doorsSnd]) if (s) s.stop(0.2);
    this.alarm = this.doorsSnd = null;
  }

  // the yard has power: the cap's lock lets go
  onPower() {
    if (!this.B || this.dead) return;
    const ev = this.script.power();
    if (ev !== 'unlock') return;
    const g = this.g, H = this.B.hatch;
    this.capLamp.material.color.setHex(0x5cff88);
    this.capLamp.material.opacity = 0.85;
    if (g.audio.ready && g.audio.clank) g.audio.clank(H.x, this.capY + 1.0, H.z - H.d / 2, 0.8);
    g.hud.flashAlert(t('aShelterUnlocked'), 'dawn', 3.4);
    g.hud.peek(5);
    if (g.player.alive && !this.seen.hintLock) {
      this.seen.hintLock = true;
      g.timeline.push({ at: g.time + 2.6, fn: () => g.hud.setHint(t('hintShelter')) });
      g.timeline.push({ at: g.time + 11, fn: () => g.hud.setHint(null) });
    }
  }

  // the night is over (dawn, the host ended it): nobody is left standing in the dark under the yard
  evacuate() {
    if (!this.B || !this._inside) return;
    this.cine = null;
    this.fade = 0;
    this._up();
    this.g.hud?.setHint?.(null);
  }

  // ---------------- the E prompt ----------------
  consider(fn) {
    if (!this.B || this.dead) return;
    const g = this.g, p = g.player, B = this.B;
    if (this.cine) return;
    if (this._inside) {
      const lad = B.ladder;
      fn({ kind: 'shelterUp' }, lad.x, lad.z, 2.2, 'shelterUp');
      if (this.script.canThrow) fn({ kind: 'shelterBreaker' }, B.breaker.x - 0.4, B.breaker.z, 2.4, 'shelterBreaker');
      return;
    }
    // the cap in the yard: only worth pointing at once you are close
    if (Math.hypot(p.x - this.capFront.x, p.z - this.capFront.z) < 3.2) fn({ kind: 'shelterCap' }, this.capFront.x, this.capFront.z, 2.4, 'shelterCap');
  }

  interact(best, pressed, T) {
    const g = this.g, hud = g.hud, k = best.kind;
    if (k === 'shelterCap') {
      const st = this.script.state;
      if (st === 'sealed') {
        hud.setUse(T('useShelterLocked'), 0, false, true);
        return;
      }
      if (st === 'unlocked') {
        hud.setUse(T('useShelterUnlock'), 0, true);
        if (pressed) this.unlock();
        return;
      }
      hud.setUse(T('useShelterDown'), 0, true);
      if (pressed) this.descend();
      return;
    }
    if (k === 'shelterUp') {
      hud.setUse(T('useShelterUp'), 0, true);
      if (pressed) this.ascend();
      return;
    }
    if (k === 'shelterBreaker') {
      hud.setUse(T('useBreaker'), 0, true);
      if (pressed) this.throwBreaker();
    }
  }

  // the bolt goes back: the door stands ajar (you don't walk in — the ladder is straight down)
  unlock() {
    const g = this.g, B = this.B;
    if (!this.script.open()) return;
    this.capDoor.rotation.y = 0.62;
    g.audio.ready && g.audio.clank && g.audio.clank(B.hatch.x, this.capY + 1.1, B.hatch.z - B.hatch.d / 2, 0.7);
    g.hud.flashAlert(t('aShelterOpen'), 'warn', 2.6);
    g.hud.peek(4);
  }

  // ---------------- the way down, and back up ----------------
  descend() {
    if (this.cine || !this.B) return;
    if (!this.script.open()) return;
    this.cine = { mode: 'down', t: 0, moved: false };
    this.fade = 0;
  }

  ascend() {
    if (this.cine || !this.B) return;
    this.cine = { mode: 'up', t: 0, moved: false };
    this.fade = 0;
  }

  _down() {
    const g = this.g, p = g.player, B = this.B, S = B.spawn;
    p.x = S.x;
    p.z = S.z;
    p.y = this.fy;
    p.vx = p.vz = 0;
    p.yaw = S.yaw;
    p.pitch = -0.05;
    p.floorY = this.fy;
    p.col = B.col;
    this._hadCol = true;
    this._inside = true;
    p.underground = true;
    this.wasInside = true;
    this.script.enter();
    g.audio.ready && g.audio.clank && g.audio.clank(S.x, this.fy + 1.2, S.z, 0.85);
    g.audio.ready && g.audio.footstep && g.audio.footstep(0.5);
  }

  _up() {
    const g = this.g, p = g.player, B = this.B, F = this.capFront;
    p.x = F.x;
    p.z = F.z;
    p.y = this.world.terrain.height(F.x, F.z);
    p.vx = p.vz = 0;
    p.yaw = 0; // facing out into the yard
    p.pitch = -0.04;
    p.floorY = null;
    p.col = null;
    this._hadCol = false;
    this._inside = false;
    g.player.underground = false;
    const wasAwake = this.script.awake;
    this.script.leave();
    // the cap comes down on its own, hard, and then something hits it from the inside
    this.capDoor.rotation.y = 0;
    this.after = { t: 0, hits: wasAwake ? 3 : 0 };
    g.audio.ready && g.audio.clank && g.audio.clank(B.hatch.x, this.capY + 1.1, B.hatch.z, 1);
    if (wasAwake) {
      this.capLamp.material.color.setHex(0xff3020);
      g.hud.flashAlert(t('aShelterShut'), 'danger', 3);
    }
    if (this.alarm) { this.alarm.stop(2.6); this.alarm = null; }
    for (let i = 0; i < 5; i++) if (LAMP_SLOT0 + i < 13) shared.uLamp.value[LAMP_SLOT0 + i].w = 0;
  }

  // ---------------- the breaker ----------------
  throwBreaker() {
    if (!this.script.throwBreaker()) return;
    const g = this.g, B = this.B, R = B.rift;
    this.lever.rotation.z = -1.15; // the arm goes over with a bang
    this.leverGlow.material.color.setHex(0xff2a10);
    this.leverGlow.material.opacity = 1;
    if (g.audio.ready) {
      g.audio.bunkerBreaker ? g.audio.bunkerBreaker(B.breaker.x - 0.4, this.fy + 1.6, B.breaker.z) : g.audio.clank(B.breaker.x, this.fy + 1.6, B.breaker.z, 1);
    }
    g.addTrauma(0.3);
    g.particles.burst(B.breaker.x - 0.5, this.fy + 1.7, B.breaker.z, 18, { color: [1, 0.72, 0.4], speed: 3.2, life: 0.5, size: 0.02, gravity: -7, drag: 1.4 });
    this.beatT = 0;
  }

  // ---------------- the beats the script hands us ----------------
  _beat(ev) {
    const g = this.g, B = this.B, R = B.rift;
    if (ev === 'gate') {
      g.escape?.openGate?.(); // the gate above: motor, siren, the forest hears it
      this.gate = true;
      g.hud.flashAlert(t('aGateOpen'), 'dawn', 3.2);
      g.hud.peek(4);
      return;
    }
    if (ev === 'stir') {
      if (g.audio.ready && g.audio.riftWake) g.audio.riftWake(R.x, this.fy + 1.7, R.z);
      g.addTrauma(0.35);
      g.particles.burst(R.x, this.fy + 2.4, R.z + 0.6, 26, { color: [0.5, 0.46, 0.42], speed: 2.4, life: 1.6, size: 0.05, gravity: -2.2, drag: 1.1, dir: { x: 0, y: 0.2, z: 1 }, cone: 1.1 });
      g.hud.flashAlert(t('aStir'), 'danger', 2.8);
      return;
    }
    if (ev === 'blackout') {
      if (g.audio.ready && g.audio.bunkerBlackout) g.audio.bunkerBlackout(R.x, this.fy + 2.2, R.z);
      g.fx.fovKick = -10;
      g.addTrauma(0.25);
      return;
    }
    if (ev === 'alarm') {
      if (g.audio.ready) {
        this.alarm = g.audio.bunkerAlarm ? g.audio.bunkerAlarm((B.door.x0 + B.door.x1) / 2, this.fy + 2.4, B.door.z, DOOR_TIME + 2) : null;
        this.doorsSnd = g.audio.bunkerDoors ? g.audio.bunkerDoors((B.door.x0 + B.door.x1) / 2, this.fy + 2.2, B.door.z, DOOR_TIME + 2) : null;
      }
      g.hud.flashAlert(t('aDoorsClose'), 'danger', 4);
      g.hud.popup(t('aRun'), 'amber');
      g.hud.peek(6);
      g.hud.setHint(t('hintRun'));
      this.alarmCall = DOOR_TIME;
      return;
    }
    if (ev === 'out') this._spawn();
    if (ev === 'sealed') this.kill('razlom');
  }

  // ---------------- the horde ----------------
  _spawn() {
    const g = this.g, B = this.B, R = B.rift;
    if (this.horde.length >= HORDE_MAX) return;
    const group = new THREE.Group();
    const body = new THREE.Mesh(this.hordeGeo, this.hordeMat);
    group.add(body);
    const arms = [];
    for (const s of [-1, 1]) {
      const a = new THREE.Mesh(this.hordeLimb, this.hordeMat);
      a.position.set(s * 0.19, 0.42, 0.16);
      a.rotation.x = -0.5;
      group.add(a);
      arms.push(a);
    }
    const legs = [];
    for (const s of [-1, 1]) {
      const l = new THREE.Mesh(this.hordeLimb, this.hordeMat);
      l.position.set(s * 0.14, 0.3, -0.28);
      l.rotation.set(0.9, 0, s * 0.12);
      group.add(l);
      legs.push(l);
    }
    const x = R.x + this.rng.float(-1.1, 1.1), z = R.z + this.rng.float(0.3, 1.0);
    group.position.set(x, this.fy - 0.55, z);
    g.scene.add(group);
    this.horde.push({
      group, body, arms, legs,
      x, z,
      speed: this.rng.float(2.55, 3.05),
      rise: 0, riseT: this.rng.float(0.9, 2.1),
      ph: this.rng.float(0, 6.28),
      yaw: 0,
      alive: true,
    });
    if (g.audio.ready && g.audio.razlomScreech) g.audio.razlomScreech(R.x, this.fy + 1.5, R.z);
  }

  _updateHorde(dt) {
    const g = this.g, p = g.player, B = this.B;
    const hall = B.hall;
    for (const h of this.horde) {
      const dx = p.x - h.x, dz = p.z - h.z;
      const d = Math.hypot(dx, dz) || 1;
      h.riseT -= dt;
      const rising = h.riseT > 0;
      if (!rising) {
        const v = h.speed * clamp((2.1 - h.riseT) / 2.1, 0, 1) * (this.script.alarmT > 6 ? 1 : 0.55);
        h.x += (dx / d) * v * dt;
        h.z += (dz / d) * v * dt;
      }
      // they keep to the corridor (wider in the vault), and stop at the slab once it is down
      const inVault = h.z < B.vault.z1;
      h.x = inVault ? clamp(h.x, B.vault.x0 + 0.8, B.vault.x1 - 0.8) : clamp(h.x, hall.x0 + 0.42, hall.x1 - 0.42);
      const zMax = this.script.doorK > 0.28 ? B.landing.z1 - 0.7 : B.door.z - 0.5;
      h.z = clamp(h.z, B.vault.z0 + 1.2, zMax);
      h.yaw = Math.atan2(dx, dz);
      const t = g.time + h.ph;
      const rise = clamp(h.riseT / 2.1, 0, 1); // still coming up out of the crack
      h.group.rotation.y = h.yaw;
      h.group.position.set(h.x, this.fy - 0.55 * rise + (rising ? 0 : Math.sin(t * 3.1) * 0.015), h.z);
      h.body.rotation.x = Math.sin(t * 3.1) * 0.05;
      h.arms[0].rotation.x = -0.5 + Math.sin(t * 5.2) * 0.55;
      h.arms[1].rotation.x = -0.5 + Math.sin(t * 5.2 + PI) * 0.55;
      h.legs[0].rotation.x = 0.9 + Math.sin(t * 4.4 + PI) * 0.3;
      h.legs[1].rotation.x = 0.9 + Math.sin(t * 4.4) * 0.3;
      if (!rising && d < CATCH && p.alive) {
        this.kill('razlom', h);
        return;
      }
    }
  }

  // it has you: the death is the crawler's (the same one that comes out of the crack, which is what it is)
  kill(cause = 'razlom', near = null) {
    const g = this.g;
    if (this.dead || !g.player.alive) return;
    this.dead = true;
    const h = near || this.horde.reduce((a, b) => {
      const da = Math.hypot(a.x - g.player.x, a.z - g.player.z), db = Math.hypot(b.x - g.player.x, b.z - g.player.z);
      return db < da ? b : a;
    }, this.horde[0] || { x: g.player.x, z: g.player.z });
    this.silence();
    if (this.alarm) { this.alarm.stop(0.2); this.alarm = null; }
    const m = { type: 'crawler', x: h.x, z: h.z, y: this.fy, id: -1 };
    g.hlNote?.('death', { cause });
    if (g.online) {
      // co-op: down is not dead — a friend could still get you out (the same bargain as anywhere else)
      g.localDie(m, cause);
      g.rescue?.down?.(g.player, g.rescue.bleedFor(g.player));
      return;
    }
    g.state = 'dying';
    g.beginDeath(m, cause);
  }

  // ---------------- per frame ----------------
  update(dt) {
    if (!this.B) return;
    const g = this.g, p = g.player, B = this.B;
    // the cap's lamp breathes while it is worth looking at
    if (!this._inside) {
      const on = this.script.state !== 'sealed';
      this.capLamp.material.opacity = on ? 0.55 + 0.35 * Math.sin(g.time * 3.4) : 0.35 + 0.15 * Math.sin(g.time * 1.1);
    }
    // the way down, and the way back
    if (this.cine) this._cine(dt);
    else if (this.fade > 0) this.fade = Math.max(0, this.fade - dt * 2.2);
    if (this.cine || this.fade > 0) g.fx.fade = Math.max(g.fx.fade, this.fade);
    if (!this._inside) {
      if (this.after) this._after(dt);
      return;
    }
    // the floor under your boots, and the walls of the corridor (not the yard's)
    p.floorY = this.fy;
    p.underground = true; // (nothing above can hear, see or reach you: see monsters.nearestTo)
    if (this._hadCol !== true) { p.col = B.col; this._hadCol = true; }
    // the script
    const ev = this.script.step(dt);
    for (const e of ev) this._beat(e);
    if (this.dead) return;
    // the lights
    this._lamps(dt);
    // the red in the crack, and the eyes
    const wake = this.script.wake;
    const pulse = 0.6 + 0.4 * Math.sin(g.time * 2.2);
    this.riftHalo.material.opacity = wake * 0.55 * pulse;
    this.riftCore.material.opacity = wake * 0.85 * (0.7 + 0.3 * Math.sin(g.time * 5.1));
    this.riftHalo.scale.setScalar(5 + wake * 2.5 * pulse);
    this.glowMat.opacity = wake * (0.35 + 0.5 * pulse);
    for (const e of this.eyes) {
      const lit = wake > 0.35;
      e.s.position.set(e.x, e.y, e.z);
      e.s.material.opacity = lit ? clamp((wake - 0.35) * 1.6, 0, 1) * (0.55 + 0.45 * Math.sin(g.time * 2.6 + e.ph)) : 0;
    }
    // the blast door comes down in its slot: 1 = up above the ceiling, 0 = on the floor
    const gap = this.script.doorK;
    this.doorMesh.position.y = this.fy + 1.3 + gap * B.door.h;
    // ...and its collider goes with it: from the moment the gap under it is too low to walk through
    if (gap < 0.78) B.col.setSeg(B.doorCap, B.door.x0 + 0.2, B.door.z, B.door.x1 - 0.2, B.door.z);
    else B.col.setSeg(B.doorCap, B.door.x0, 300, B.door.x1, 300);
    // the beacon over the doorway
    const alarm = this.script.alarmT >= 0;
    this.beacon.material.opacity = alarm ? (Math.sin(g.time * 7.4) > 0 ? 1 : 0.06) : 0;
    this.beacon.scale.setScalar(alarm ? 1.1 + 0.5 * Math.abs(Math.sin(g.time * 7.4)) : 0.8);
    if (alarm) this._calls();
    // the horde
    this._updateHorde(dt);
    // the scripted frights of the way down (before any of this)
    this._scares(dt);
  }

  _calls() {
    const g = this.g;
    const left = DOOR_TIME - this.script.alarmT;
    const marks = [120, 60, 30, 10];
    for (const m of marks) {
      if (this.alarmCall > m && left <= m) {
        this.alarmCall = m;
        g.hud.flashAlert(t('aDoorLeft').replace('{t}', `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`), 'danger', 2.2);
        break;
      }
    }
  }

  _cine(dt) {
    const c = this.cine;
    c.t += dt;
    if (!c.moved && c.t >= FADE_TO) {
      c.moved = true;
      if (c.mode === 'down') this._down();
      else this._up();
    }
    this.fade = c.moved ? clamp(1 - (c.t - FADE_TO) / FADE_FROM, 0, 1) : clamp(c.t / FADE_TO, 0, 1);
    if (c.t >= CINE) {
      this.cine = null;
      this.fade = 0;
      const g = this.g;
      if (c.mode === 'down') {
        g.hud.peek(5);
        g.hud.popup(t('aShelterIn'), 'dim');
      } else {
        g.hud.peek(4);
      }
    }
  }

  // the lamps: the far end goes first, then the next, back toward the landing
  _lamps(dt) {
    const g = this.g, B = this.B;
    const lit = this.script.lampsLit(); // 6 = all, 0 = none
    const flicker = this.script.thrown && this.script.t < T_ALARM ? (Math.random() < 0.25 ? 0.35 : 1) : 1;
    const near = g.player;
    // the two nearest burning lamps get a real shadow: the rest light through the wall (they are 4 m away)
    const shadowSlots = [];
    for (const L of this.lamps) {
      const on = L.i < lit;
      L.on = damp(L.on, on ? 1 : 0, on ? 12 : 22, dt);
      const I = L.on * flicker * (on ? 1 : 0.2);
      L.bulb.visible = I > 0.03;
      L.bulb.material = this.bulbMat;
      L.halo.material.opacity = I * 0.5;
      L.halo.scale.setScalar(2.2 + I * 0.8);
      const slot = LAMP_SLOT0 + L.i;
      if (slot < 13) {
        shared.uLamp.value[slot].set(L.x, L.y - 0.1, L.z, I * LAMP_I);
        const d = Math.hypot(L.x - near.x, L.z - near.z);
        if (I > 0.02 && d < 26) shadowSlots.push({ slot, L, d, I });
      }
    }
    shadowSlots.sort((a, b) => a.d - b.d);
    for (let k = 0; k < 5; k++) {
      const slot = LAMP_SLOT0 + k;
      if (slot < 13) shadowLights.lamp[slot] = null;
    }
    for (let k = 0; k < 2 && k < shadowSlots.length; k++) {
      const s = shadowSlots[k];
      shadowLights.lamp[s.slot] = { x: s.L.x, y: s.L.y - 0.12, z: s.L.z, R: 9, near: 0.22 };
    }
    // the breaker's little indicator, and the sign over the door
    this.leverGlow.material.opacity = this.script.thrown ? 0.9 + 0.1 * Math.sin(g.time * 9) : 0.3 + 0.2 * Math.sin(g.time * 1.7);
    this.signGlow.material.opacity = lit > 0 ? 0.5 : 0.22 + 0.1 * Math.sin(g.time * 1.3);
  }

  // the frights on the way down: none of them are the horde (that comes later, and is real)
  _scares(dt) {
    const g = this.g, p = g.player, B = this.B;
    const z = p.z;
    if (!this.script.thrown) {
      // a figure crosses the corridor ahead of you, at the edge of the light, once
      if (!this.seen.cross && z < B.hall.z1 - 3.5 && z > B.hall.z0 + 4) {
        this.seen.cross = true;
        const zb = B.door.z - 11;
        const cross = new THREE.Mesh(this.hordeGeo, this.hordeMat);
        cross.position.set(B.hall.x0 + 0.7, this.fy, zb);
        cross.rotation.y = -PI / 2; // across the corridor, left to right
        g.scene.add(cross);
        this.crossT = { mesh: cross, t: 0, x: B.hall.x0 + 0.6 };
        if (g.audio.ready && g.audio.razlomScreech) g.audio.razlomScreech(B.hall.x0 + 0.6, this.fy + 1.2, zb);
        g.audio.ready && g.audio.footstep && g.audio.footstep(0.7);
        g.addTrauma(0.16);
      }
      // the vault threshold: the crack breathes at you
      if (!this.seen.breathe && z < B.vault.z1 + 1.2) {
        this.seen.breathe = true;
        if (g.audio.ready && g.audio.riftWake) g.audio.riftWake(B.rift.x, this.fy + 1.6, B.rift.z);
        g.hud.flashAlert(t('aBreath'), 'danger', 2.4);
        g.addTrauma(0.22);
        this.riftHalo.material.opacity = 0.5;
        this.riftCore.material.opacity = 0.8;
      }
    }
    if (this.crossT) {
      const c = this.crossT;
      c.t += dt;
      c.mesh.position.x += dt * 4.2;
      c.mesh.position.y = this.fy + Math.abs(Math.sin(c.t * 9)) * 0.05;
      if (c.t > 0.62) { // it is through the wall opposite by then
        g.scene.remove(c.mesh);
        this.crossT = null;
      }
    }
  }

  // back in the yard, with the cap shut: it bangs, three times, and gives up
  _after(dt) {
    const a = this.after, g = this.g, B = this.B;
    a.t += dt;
    if (a.hits > 0 && a.t > 1.0 && a.t < 1.0 + a.hits * 0.62) {
      const k = Math.floor((a.t - 1.0) / 0.62);
      if (k >= this._hit) {
        this._hit = k + 1;
        const H = B.hatch;
        g.audio.ready && g.audio.clank && g.audio.clank(H.x, this.capY + 0.9, H.z, 1.1);
        g.addTrauma(0.2);
      }
    }
    if (a.t > 1.0 + a.hits * 0.62 + 1.6) {
      this.after = null;
      this._hit = 0;
      if (this.alarm) { this.alarm.stop(1.2); this.alarm = null; }
      for (let i = 0; i < 5; i++) if (LAMP_SLOT0 + i < 13) shared.uLamp.value[LAMP_SLOT0 + i].w = 0;
    }
  }

  // ---------------- for the HUD / the task line ----------------
  get inside() {
    return !!this._inside;
  }
  get state() {
    return this.script.state;
  }
  get awake() {
    return this.script.thrown;
  }
  get remaining() {
    return this.script.alarmT < 0 ? null : Math.max(0, DOOR_TIME - this.script.alarmT);
  }
}

// ---------------- the thing in the crack ----------------
// A body on its hands and knees: shoulders up, head down, the arms long. Two extra limbs (shared geometry,
// one mesh each) are swung in the game so it reads as coming at you rather than sliding.
function buildCrawlerRig() {
  const b = new MeshBuilder(1024);
  // torso, tipped forward
  b.place(0, 0.46, -0.02, 0.32, 0, 0);
  b.taper(0.46, 0.62, 0.3, 0.4, 0.62, KIND.FLESH, 0.05);
  // hips and the stumps of the legs
  b.place(0, 0.36, -0.42, 0.5, 0, 0);
  b.box(0.36, 0.2, 0.24, KIND.WOOD);
  // shoulders
  b.place(0, 0.62, 0.28);
  b.box(0.5, 0.16, 0.22, KIND.FLESH);
  // neck and head, hanging
  b.identity();
  b.limb([0, 0.64, 0.34], [0, 0.5, 0.56], 0.08, 0.06, KIND.FLESH, 4);
  b.place(0, 0.46, 0.62, 0.5, 0, 0);
  b.rock(0.17, () => 0.5, KIND.BONE, 0.2, 0.85);
  // the jaw, open
  b.place(0, 0.36, 0.72, 0.7, 0, 0);
  b.box(0.16, 0.06, 0.2, KIND.BONE);
  // a spine of bone through the back
  for (let k = 0; k < 5; k++) {
    b.place(0, 0.58 + k * 0.03, -0.3 + k * 0.16, -1.1, 0, 0);
    b.cone(4, 0.03, 0.1, KIND.BONE);
  }
  // rags
  b.place(0, 0.32, -0.2, 0.3, 0.4, 0);
  b.box(0.34, 0.14, 0.3, KIND.WOOD);
  const tris = b.toGeometry();
  // one limb, from the shoulder to the hand: the same mesh for arms and legs
  const l = new MeshBuilder(160);
  l.identity();
  l.limb([0, 0, 0], [0, -0.08, 0.42], 0.06, 0.042, KIND.FLESH, 4);
  l.limb([0, -0.08, 0.42], [0, -0.14, 0.74], 0.042, 0.026, KIND.FLESH, 4);
  l.identity();
  for (let f = 0; f < 3; f++) l.limb([0, -0.14, 0.74], [(f - 1) * 0.06, -0.18, 0.9], 0.014, 0.006, KIND.BONE, 3);
  return { tris, limbs: l.toGeometry() };
}
