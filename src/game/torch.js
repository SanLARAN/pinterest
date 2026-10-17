// The flashlight. One lies out there every night (two on a co-op night) — by a wrecked car, at the foot of a
// tower, among the graves — still switched on, its beam weak across the ground: you see it before you find
// it. Take it (E), and T switches it: a cone of real light wherever you look, for as long as the battery
// lasts (it flickers when it's nearly gone; spare batteries turn up in cupboards).
//
// Light is a two-edged thing here — and in a game about being blind it mustn't be a way out of it: it's
// for a quick look. What the beam shows, you see as it is, but a lit flashlight is a beacon in the dark:
// a thing caught in the beam comes to look, and so does any thing near enough that nothing stands between
// it and you. The battery is short. And when it's nearly flat the light stutters and goes out for moments
// at a time — the Watcher moves in those moments (the dark between two flickers is all it needs).
// On a co-op night your friends see your beam, and you theirs (the 'ps' state carries it, and its dips;
// the light itself is one of the small lights: see GlowSticks.lightSources — a beam is a small light with
// a direction).
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { createWorldMaterial } from '../render/sonar.js';
import { LANDMARKS } from '../world/world.js';
import { haloMaterial } from './glowsticks.js';
import { t } from '../core/i18n.js';

export const TORCH = {
  battery: 60, // s of light on a full battery
  light: 1.65, // intensity in the hand
  radius: 14, // m
  cone: 0.88, // cos of the beam's edge (~28°)
  color: [1.0, 0.93, 0.8],
  found: 0.5, // charge it's found with
  spare: 0.3, // a spare battery from a cupboard
  low: 0.25, // below this it stutters, and goes out for moments
  dipI: 0.015, // ...this bright, in one of those moments
  see: 13, // a thing in the beam this close (and in the clear) notices it...
  every: 1.4, // ...checked this often (s)
  loud: 0.42, // ...and comes as if to a noise this loud, where you stand (heard ~25 m)
  beacon: 25, // and a lit flashlight is seen from this far by anything with nothing in the way...
  beaconEvery: 2.2, // ...checked this often
  pickR: 1.7,
  lying: 0.85, // the one lying out there: still on, weakly
  lyingR: 10,
};
// where they lie (not at the five generator sites: those have their own reasons to go to)
const SPOTS = ['wreck2', 'tower2', 'graves', 'graves2', 'stones2', 'wreck', 'tower'];
const PI = Math.PI;

function torchArrays() {
  const b = new MeshBuilder(256);
  b.place(0, 0, 0.09, -PI / 2, 0, 0);
  b.cylinder(8, 0.019, 0.019, 0.15, KIND.ROCK, { capBottom: true }); // the grip
  b.place(0, 0, -0.06, -PI / 2, 0, 0);
  b.cylinder(8, 0.021, 0.031, 0.05, KIND.METAL); // the head
  b.place(0, 0, -0.11, -PI / 2, 0, 0);
  b.cylinder(8, 0.027, 0.027, 0.006, KIND.EYE); // the lens
  b.place(0, 0.021, 0.02);
  b.box(0.012, 0.008, 0.03, KIND.EFFIGY); // the switch
  return b.toArrays();
}
function geometryOf(arr) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(arr.dat, 4, true));
  g.computeBoundingSphere();
  return g;
}

const _off = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _ax = new THREE.Vector3();

// where a player's flashlight is and which way it points: from the eyes, a little down and to the right
// (yours is in your left hand on screen: the light itself still comes from about where your hands are)
export function beamFrom(x, eyeY, z, yaw, pitch) {
  const cp = Math.cos(pitch);
  const f = [-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
  const r = [Math.cos(yaw), 0, -Math.sin(yaw)];
  return {
    x: x + r[0] * -0.16 + f[0] * 0.3,
    y: eyeY - 0.2 + f[1] * 0.3,
    z: z + r[2] * -0.16 + f[2] * 0.3,
    dir: f,
  };
}

export class Torches {
  constructor(game) {
    this.g = game;
    this.geo = geometryOf(torchArrays());
    this.mat = game.world.material;
    this.items = [];
    this.has = false;
    this.on = false;
    this.charge = 0;
    this.spare = 0;
    this.flick = 1;
    this.dip = false; // gone out for a moment (a nearly flat battery)
    this.dipT = 0;
    this.noiseT = 0;
    this.beaconT = 0;
    this.t = 0;
    // the view model: in your left hand, the world's material with a breath of light of its own
    this.viewMat = createWorldMaterial();
    this.viewMat.uniforms.uSelfLit = { value: 0.3 };
    this.viewMat.defines = { SELF_LIT: 1 };
    this.viewMat.needsUpdate = true;
    this.view = new THREE.Mesh(this.geo, this.viewMat);
    this.view.frustumCulled = false;
    this.view.visible = false;
    this.view.renderOrder = 4;
    game.scene.add(this.view);
  }

  // a new night: where they lie (rng: the same on every machine)
  reset(rng, online = false) {
    const g = this.g, w = g.world;
    for (const it of this.items) {
      if (it.mesh.parent) it.mesh.parent.remove(it.mesh);
      if (it.halo && it.halo.parent) it.halo.parent.remove(it.halo);
    }
    this.items = [];
    this.has = false;
    this.on = false;
    this.charge = 0;
    this.spare = 0;
    this.flick = 1;
    this.dip = false;
    this.beaconT = TORCH.beaconEvery;
    const pool = SPOTS.slice();
    const n = online ? 2 : 1;
    for (let i = 0; i < n && pool.length; i++) {
      const id = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
      const L = LANDMARKS.find((l) => l.id === id);
      if (!L) continue;
      let x = L.x + 3, z = L.z;
      for (let k = 0; k < 40; k++) {
        const a = rng.next() * PI * 2, d = 2 + rng.next() * Math.max(2.5, L.r * 0.5);
        const cx = L.x + Math.cos(a) * d, cz = L.z + Math.sin(a) * d;
        if (w.col.free(cx, cz, 0.7)) {
          x = cx;
          z = cz;
          break;
        }
      }
      const y = w.terrain.height(x, z) + 0.03;
      const yaw = rng.next() * PI * 2;
      const mesh = new THREE.Mesh(this.geo, this.mat);
      mesh.position.set(x, y, z);
      mesh.rotation.set(0, yaw, 0);
      mesh.frustumCulled = false;
      g.scene.add(mesh);
      // the lens, glowing: a faint point of light you can see from a way off
      const halo = new THREE.Sprite(haloMaterial(0xfff0cc));
      halo.position.set(x - Math.sin(yaw) * 0.12, y + 0.01, z - Math.cos(yaw) * 0.12);
      halo.scale.setScalar(0.5);
      halo.material.opacity = 0.55;
      halo.renderOrder = 7;
      g.scene.add(halo);
      mesh.userData.halo = halo;
      this.items.push({ i, x, y, z, yaw, taken: false, mesh, halo, site: id });
    }
  }

  // the E prompt can find one lying there
  consider(fn) {
    for (const it of this.items) if (!it.taken) fn(it, it.x, it.z, TORCH.pickR, 'torch');
  }

  take(it) {
    if (!it || it.taken) return;
    this._taken(it);
    const g = this.g;
    if (g.sync) g.sync.ev('tq', it.i);
    const had = this.has;
    this.has = true;
    this.charge = Math.min(1, (had ? this.charge + 0.5 : TORCH.found) + this.spare);
    this.spare = 0;
    if (g.audio.ready) {
      if (g.audio.cabinetItem) g.audio.cabinetItem('flare');
      this._click(true);
    }
    g.hud.popup(had ? t('torchMore') : t(g.input.touch ? 'torchGotT' : 'torchGot'), 'amber');
    g.stats.torch = 1;
  }

  // someone else took it
  netTake(i) {
    const it = this.items.find((q) => q.i === (i | 0));
    if (it) this._taken(it);
  }

  _taken(it) {
    it.taken = true;
    it.mesh.visible = false;
    if (it.halo) it.halo.visible = false;
  }

  // T (the LIGHT button)
  toggle() {
    const g = this.g;
    if (!this.has) {
      g.hud.popup(t('torchNone'), 'dim');
      return;
    }
    if (this.charge <= 0.001) {
      this.on = false;
      g.hud.popup(t('torchDead'), 'dim');
      this._click(false, true);
      return;
    }
    this.on = !this.on;
    this._click(this.on);
    g.playerNoise(g.player.x, g.player.z, 0.06, 'torch');
  }

  // a spare from a cupboard
  addBattery() {
    const g = this.g;
    if (this.has) this.charge = Math.min(1, this.charge + TORCH.spare);
    else this.spare = Math.min(1, this.spare + TORCH.spare);
    g.hud.popup(this.has ? t('torchBattery') : t('torchBatterySpare'), 'amber');
  }

  _click(on, dead = false) {
    const a = this.g.audio;
    if (a.ready && a.torchClick) a.torchClick(on, dead);
  }

  update(dt) {
    const g = this.g, p = g.player;
    this.t += dt;
    if (this.on && (!p.alive || g.state === 'over' || g.state === 'idle')) this.on = false;
    if (this.on) {
      this.charge = Math.max(0, this.charge - dt / TORCH.battery);
      if (this.charge <= 0) {
        this.on = false;
        g.hud.popup(t('torchDied'), 'dim');
        this._click(false, true);
      }
    }
    // nearly flat: it stutters — and every so often it goes out altogether for a moment (longer and more
    // often the flatter it gets). Those moments are real dark: the Watcher moves in them.
    if (this.on && this.charge < TORCH.low) {
      const k = this.charge / TORCH.low; // 1 → 0
      this.dipT -= dt;
      if (this.dipT <= 0) {
        this.dip = !this.dip;
        this.dipT = this.dip ? 0.14 + Math.random() * (0.18 + 0.3 * (1 - k)) : 0.45 + Math.random() * (0.5 + 2.2 * k);
      }
      this.flick = this.dip ? TORCH.dipI : (0.6 + 0.4 * Math.random()) * (0.5 + 0.5 * k);
    } else {
      this.flick = 1;
      this.dip = false;
      this.dipT = 0.6;
    }
    // what the beam shows can see it; and anything near enough with nothing in the way sees the light
    if (this.on && !this.dip && g.state === 'play') {
      this.noiseT -= dt;
      this.beaconT -= dt;
      const beam = this.noiseT <= 0, beacon = this.beaconT <= 0;
      if (beam) this.noiseT = TORCH.every;
      if (beacon) this.beaconT = TORCH.beaconEvery;
      if ((beam || beacon) && this._seen(beam, beacon)) g.playerNoise(p.x, p.z, TORCH.loud, 'torch');
    }
  }

  // is there a thing that sees your light? (beam: one caught in the beam; beacon: one near, nothing in the way)
  _seen(beam, beacon) {
    const g = this.g, p = g.player;
    const B = beamFrom(p.x, p.y + p.eyeCur, p.z, p.yaw, p.pitch);
    for (const m of g.monsters) {
      if (!m.alive && m.alive !== undefined) continue;
      if (m.state === 'lurk') continue;
      if (m.cfg && m.cfg.hearing === 0) continue; // (the Watcher has its own way with light: it freezes in it)
      const dx = m.x - B.x, dy = (m.y || 0) + 1.2 - B.y, dz = m.z - B.z;
      const d = Math.hypot(dx, dy, dz);
      if (d < 0.5 || d > Math.max(TORCH.beacon, TORCH.see)) continue;
      const inBeam = d <= TORCH.see && (dx * B.dir[0] + dy * B.dir[1] + dz * B.dir[2]) / d >= TORCH.cone - 0.04;
      if (!(beam && inBeam) && !(beacon && d <= TORCH.beacon)) continue;
      if (g.world.losBlocked && g.world.losBlocked(B.x, B.y, B.z, m.x, (m.y || 0) + 1.2, m.z, 0.3)) continue;
      return true;
    }
    return false;
  }

  // is any flashlight out there in one of its dark moments right now? (yours, or a friend's: the Watcher's chance)
  get dipping() {
    if (this.on && this.dip) return true;
    for (const r of this.g.remotes.values()) if (r.alive && r.torchOn && r.torchDip) return true;
    return false;
  }

  // small lights for GlowSticks: the ones lying out there, yours, your friends'
  lightSources(out) {
    const g = this.g;
    const C = TORCH.color;
    for (const it of this.items) {
      if (it.taken) continue;
      const fl = 0.8 + 0.2 * Math.sin(this.t * 13 + it.i * 3) * Math.sin(this.t * 7.1);
      out.push({ x: it.x, y: it.y + 0.14, z: it.z, I: TORCH.lying * fl, c: C, R: TORCH.lyingR, prio: 0, near: 0.12, id: it, dir: [-Math.sin(it.yaw) * 0.97, -0.24, -Math.cos(it.yaw) * 0.97], cone: 0.72 });
      if (it.halo) it.halo.material.opacity = 0.42 * fl;
    }
    const p = g.player;
    if (this.on && p.alive) {
      const B = beamFrom(p.x, p.y + p.eyeCur, p.z, p.yaw, p.pitch);
      out.push({ x: B.x, y: B.y, z: B.z, I: TORCH.light * this.flick, c: C, R: TORCH.radius, prio: 3, near: 0.3, id: this, dir: B.dir, cone: TORCH.cone });
    }
    for (const r of g.remotes.values()) {
      if (!r.alive || !r.torchOn) continue;
      const B = beamFrom(r.x, r.y + r.eyeCur, r.z, r.yaw, r.pitch);
      const low = r.torchDip ? TORCH.dipI : (r.torchCharge ?? 1) < TORCH.low ? 0.5 + 0.5 * Math.random() : 1;
      out.push({ x: B.x, y: B.y, z: B.z, I: TORCH.light * low, c: C, R: TORCH.radius, prio: 1, near: 0.3, id: r, dir: B.dir, cone: TORCH.cone });
    }
    return out;
  }

  // in your left hand, while it's on
  placeView(camera, show) {
    const m = this.view;
    m.visible = !!show && this.on;
    if (!m.visible) return;
    _off.set(-0.2, -0.2, -0.4).applyMatrix4(camera.matrixWorld);
    m.position.copy(_off);
    m.quaternion.copy(camera.quaternion).multiply(_q.setFromAxisAngle(_ax.set(0.25, 1, 0).normalize(), -0.22));
  }

  // the state that goes over the network with yours
  state() {
    return { on: this.on, charge: this.charge, dip: this.dip };
  }
}
