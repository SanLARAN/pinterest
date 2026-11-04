// (4.0) The camera. An old point-and-shoot with a flash, left out there by whoever came before you — one a shift
// (two on a co-op night), its charge lamp still blinking red in the dark: you see it before you find it. Take it
// (E); in your hands, LMB fires it. Five flashes in the capacitor and nothing to charge it with out here.
//
// The flash is a light like no other in the game: for a sixth of a second it lights everything in front of you for
// thirty-odd metres — the trees as they are, and whatever stands between them — and it is seen a long way off. Your
// friends see it as a white burst wherever you are; so does anything out there with nothing in the way (the click
// and the light are a noise: things come to look).
// The Watcher cannot stand it. Caught in the flash — in front of the lens, near enough, nothing between — it lets go
// of whoever it holds and is gone into the dark for most of a minute. The host decides that (the flash is an event,
// 'cf'; the host answers 'cw' for every Watcher it drove off).
//
// Every flash is a photograph: the finished frame, without the HUD, a date in the corner the way those cameras
// printed it (main.js grabs it right after the frame is drawn: see takePhoto there). At the end of the shift the
// film is shown with the results (ui/film.js): into the album the site keeps (core/photoStore.js), or to disk.
import * as THREE from 'three';
import { MeshBuilder } from '../world/builder.js';
import { LANDMARKS } from '../world/world.js';
import { haloMaterial } from './glowsticks.js';
import { geometryOf } from './uaz.js';
import { t } from '../core/i18n.js';
import { CAMERA_SHOTS } from './backpackData.js';

export const PHOTO = {
  shots: CAMERA_SHOTS, // flashes in a camera (5)
  flash: 0.16, // s the flash burns
  light: 9, // its strength as a small light (a flashlight in the hand is 2.1)
  radius: 34, // m it reaches
  cone: 0.42, // cos of its edge (~65°: far wider than a flashlight's)
  recycle: 1.7, // s for the capacitor to charge again (the whine)
  scare: 24, // m: a Watcher this close in front of the lens with nothing between...
  scareCone: 0.5, // ...within this cos of where it points (~60°; right in your face it goes whichever way)...
  away: [40, 60], // ...is gone for this long (s); the ordinary light only freezes it
  loud: 0.3, // the shutter and the flash, as a noise where you stand
  seen: 140, // m: a friend's flash is drawn as a burst from this far
  glare: 0.34, // s the burst lingers in your eye after their flash is over
  pickR: 1.7,
  h: 540, // the picture's height in pixels (its width follows the screen)
  q: 0.86, // JPEG quality
  keep: 30, // frames a shift keeps (two cameras of five, a dropped one picked up — never more than this)
};
// where they lie: a hunter's cabin, the fire tower, the stones — places someone would have stopped to look
export const SPOTS = ['cabin4', 'cabin5', 'cabin3', 'firetower', 'stones', 'cabin2', 'cabin'];
export const cameraCount = (online) => (online ? 2 : 1);
const PI = Math.PI;

// black plastic, a chrome strip, the lens, the flash window, the shutter button and the charge lamp (kinds 19…49)
export function cameraArrays() {
  const b = new MeshBuilder(256);
  b.place(0, 0.036, 0);
  b.box(0.118, 0.066, 0.042, 24); // the body
  b.place(0, 0.052, -0.0215);
  b.box(0.118, 0.012, 0.002, 23); // the chrome strip along the front
  b.place(0.016, 0.03, -0.021, -PI / 2, 0, 0);
  b.cylinder(10, 0.025, 0.022, 0.024, 25, { capBottom: true }); // the lens barrel
  b.place(0.016, 0.03, -0.0455, -PI / 2, 0, 0);
  b.cylinder(10, 0.017, 0.017, 0.002, 45); // the glass
  b.place(-0.036, 0.055, -0.0225);
  b.box(0.03, 0.013, 0.003, 26); // the flash window
  b.place(0.038, 0.072, 0.004);
  b.box(0.016, 0.006, 0.012, 23); // the shutter button
  b.place(-0.046, 0.072, 0.012);
  b.box(0.006, 0.004, 0.006, 47); // the charge lamp
  return b.toArrays();
}

const round = (v) => Math.round(v * 100) / 100;

// a flash seen from off to the side: a white-hot point, a cold haze, and the four streaks a lens throws off it
let _flashTex = null;
function flashTexture() {
  if (_flashTex) return _flashTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.1, 'rgba(244,248,255,0.85)');
  gr.addColorStop(0.32, 'rgba(214,226,255,0.2)');
  gr.addColorStop(1, 'rgba(200,215,255,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  for (const [w, h] of [[128, 3], [3, 128]]) {
    const st = w > h ? x.createLinearGradient(0, 0, 128, 0) : x.createLinearGradient(0, 0, 0, 128);
    st.addColorStop(0, 'rgba(255,255,255,0)');
    st.addColorStop(0.5, 'rgba(255,255,255,0.75)');
    st.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = st;
    x.fillRect(64 - w / 2, 64 - h / 2, w, h);
  }
  _flashTex = new THREE.CanvasTexture(c);
  return _flashTex;
}
const _v = new THREE.Vector3();

// which way a lens points, and where the flash comes from (a little in front of the eyes)
export function flashFrom(x, eyeY, z, yaw, pitch) {
  const cp = Math.cos(pitch);
  const dir = [-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
  return { x: x + dir[0] * 0.3, y: eyeY - 0.05 + dir[1] * 0.3, z: z + dir[2] * 0.3, dir };
}

// is a Watcher at (mx, my, mz) caught by a flash from F? (pure: tests/round40c)
export function inFlash(F, mx, my, mz) {
  const dx = mx - F.x, dy = my - F.y, dz = mz - F.z, d = Math.hypot(dx, dy, dz);
  if (d > PHOTO.scare) return false;
  if (d < 3.5) return true;
  return (dx * F.dir[0] + dy * F.dir[1] + dz * F.dir[2]) / d >= PHOTO.scareCone;
}

export class PhotoCamera {
  constructor(game) {
    this.g = game;
    this.geo = geometryOf(cameraArrays());
    this.mat = game.world.material;
    this.items = [];
    this.has = false;
    this.shots = 0;
    this.flashT = 0; // your flash, burning
    this.recycleT = 0;
    this.t = 0;
    this.film = []; // this shift's frames: { blob, url, meta }
    this.shift = Date.now();
    this.wantShot = null; // a frame main.js is to take after this frame is drawn (its meta)
    this.lastMeta = null; // the last frame's meta (still marked if the host says it caught the Watcher)
    this.shotFrame = -1;
    this.vanishQ = []; // Watchers the host's flash caught, gone after the frame that pictured them
    this.bursts = []; // friends' flashes: { x, y, z, dir, t, sprite, id }
    this.kick = 0; // the camera jumps in your hand
  }

  // a new shift: where they lie (rng: the same on every machine)
  reset(rng, online = false) {
    const g = this.g, w = g.world;
    for (const it of this.items) {
      if (it.mesh.parent) it.mesh.parent.remove(it.mesh);
      if (it.halo?.parent) it.halo.parent.remove(it.halo);
    }
    for (const b of this.bursts) if (b.sprite.parent) b.sprite.parent.remove(b.sprite);
    this.bursts = [];
    this.vanishQ = [];
    this.items = [];
    this.has = false;
    this.shots = 0;
    this.flashT = 0;
    this.recycleT = 0;
    this.wantShot = null;
    this.lastMeta = null;
    this.shotFrame = -1;
    this.kick = 0;
    for (const f of this.film) if (f.url) URL.revokeObjectURL(f.url);
    this.film = [];
    this.shift = Date.now();
    const pool = SPOTS.slice();
    const n = cameraCount(online);
    for (let i = 0; i < n && pool.length; i++) {
      const id = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
      const L = LANDMARKS.find((l) => l.id === id);
      if (!L) continue;
      let x = L.x + 3, z = L.z;
      for (let k = 0; k < 40; k++) {
        const a = rng.next() * PI * 2, d = 2.5 + rng.next() * Math.max(2.5, L.r * 0.5);
        const cx = L.x + Math.cos(a) * d, cz = L.z + Math.sin(a) * d;
        if (w.col.free(cx, cz, 0.7) && !(w.lake && Math.hypot(cx - w.lake.x, cz - w.lake.z) < w.lake.r + 2)) {
          x = cx;
          z = cz;
          break;
        }
      }
      const y = (g.tools?.groundHeight ? g.tools.groundHeight(x, z) : w.terrain.height(x, z)) + 0.005;
      const yaw = rng.next() * PI * 2;
      const mesh = new THREE.Mesh(this.geo, this.mat);
      mesh.position.set(x, y, z);
      mesh.rotation.set(0, yaw, 0);
      mesh.frustumCulled = false;
      g.scene.add(mesh);
      // the charge lamp: a red point that blinks — the thing you notice in the dark
      const halo = new THREE.Sprite(haloMaterial(0xff3a26));
      halo.position.set(x, y + 0.08, z);
      halo.scale.setScalar(0.5);
      halo.renderOrder = 7;
      g.scene.add(halo);
      this.items.push({ i: this.items.length, x, y, z, yaw, taken: false, mesh, halo, site: id }); // (i: its index here)
    }
  }

  // the E prompt can find one lying there
  consider(fn) {
    for (const it of this.items) if (!it.taken) fn(it, it.x, it.z, PHOTO.pickR, 'camera');
  }

  take(it) {
    if (!it || it.taken) return;
    return this.g.inventory.claim('camera', it.i);
  }

  _taken(it) {
    it.taken = true;
    it.mesh.visible = false;
    if (it.halo) it.halo.visible = false;
  }

  // the claim came through: it is yours, with however many flashes it has
  got(shots = PHOTO.shots) {
    this.has = true;
    this.shots = Math.max(0, Math.min(PHOTO.shots, shots | 0));
    const g = this.g;
    if (g.audio.ready) g.audio.cabinetItem('flare');
    g.hud.popup(t('cameraGot').replace('{n}', this.shots), 'amber');
  }

  // LMB with it in your hands
  shoot() {
    const g = this.g, p = g.player;
    if (!this.has || !p.alive) return false;
    if (this.recycleT > 0) {
      g.hud.popup(t('cameraCharging'), 'dim');
      return false;
    }
    if (this.shots <= 0) {
      g.hud.popup(t('cameraEmpty'), 'dim');
      if (g.audio.ready) g.audio.cameraShot?.(0, 0, 0, true, true);
      return false;
    }
    this.shots--;
    this.flashT = PHOTO.flash;
    this.recycleT = PHOTO.recycle;
    this.kick = 1;
    const F = flashFrom(p.x, p.y + p.eyeCur, p.z, p.yaw, p.pitch);
    if (g.audio.ready) g.audio.cameraShot?.(F.x, F.y, F.z, true);
    if (this.film.length < PHOTO.keep) {
      const phase = g.state === 'play' || g.state === 'dying' ? 'night' : g.state === 'training' ? 'training' : g.state;
      this.wantShot = { at: Date.now(), shift: this.shift, day: g.day, days: g.daysTotal, t: g.time, map: g.map, phase, coop: g.online ? 1 + g.remotes.size : 0 };
      this.lastMeta = this.wantShot; // (the same object ends up on the film: a later word from the host still marks it)
      this.shotFrame = 0;
    } else this.shotFrame = 0;
    g.playerNoise(p.x, p.z, PHOTO.loud, 'camera');
    if (g.sync) g.sync.ev('cf', round(F.x), round(F.y), round(F.z), round(p.yaw), round(p.pitch));
    if (g.auth) {
      const n = this.hostFlash(F);
      if (n) this.scared(n);
    }
    g.hud.popup(this.shots ? t('cameraShot').replace('{n}', this.shots) : t('cameraLast'), 'dim');
    return true;
  }

  // the host: did that flash catch a Watcher? It lets go of whoever it held at once — and is gone a frame later,
  // so the picture the flash took still has it in it (see update: vanishQ)
  hostFlash(F, pid = this.g.player.id) {
    const g = this.g;
    let n = 0;
    for (const m of g.monsters) {
      if (m.type !== 'watcher' || m.state === 'lurk' || (m.alive === false) || this.vanishQ.some((q) => q.m === m)) continue;
      const my = (m.y || 0) + 2.2;
      if (!inFlash(F, m.x, my, m.z)) continue;
      if (g.world.losBlocked && g.world.losBlocked(F.x, F.y, F.z, m.x, my, m.z, 0.2)) continue;
      if (m.seizing) m.endSeize(false);
      m.speedCur = 0;
      this.vanishQ.push({ m, n: 2, sec: PHOTO.away[0] + Math.random() * (PHOTO.away[1] - PHOTO.away[0]) });
      if (g.sync) g.sync.ev('cw', pid, round(m.x), round(m.y || 0), round(m.z));
      if (this.wantShot && pid === g.player.id) this.wantShot.watcher = true;
      n++;
    }
    return n;
  }

  // where a Watcher was when the flash drove it off: the bones folding up, a white after-image of it
  driven(x, y, z) {
    const g = this.g;
    if (g.pulses) g.pulses.emit(x, y + 2.3, z, g.time, { radius: 7, strength: 0.9, decay: 1.4, color: [0.9, 0.95, 1.0], kind: 'seize' });
    if (g.audio.ready) for (let i = 0; i < 3; i++) setTimeout(() => g.audio.crack?.(x, y + 1 + Math.random() * 2, z, 0.85), i * 70);
  }

  // you drove it off (on the host's word, if you are a guest)
  scared(n = 1) {
    const g = this.g;
    // (the frame of it: a guest hears from the host a moment after the picture was taken — maybe still being encoded)
    const m = this.lastMeta;
    if (m && Date.now() - m.at < 4000) m.watcher = true;
    g.hud.popup(t('cameraScared'), 'amber');
    g.addTrauma(0.15);
    if (g.stats) g.stats.watcherFlashed = (g.stats.watcherFlashed | 0) + n;
  }

  // a friend's flash: a burst where they are (seen from far off), its light on the forest around them, the click
  netFlash(r, x, y, z, yaw, pitch) {
    const g = this.g;
    if (!r || ![x, y, z, yaw, pitch].every(Number.isFinite) || Math.hypot(x - r.x, z - r.z) > 4) return null;
    const F = flashFrom(r.x, r.y + (r.eyeCur || 1.6), r.z, yaw, pitch);
    F.x = x; F.y = y; F.z = z;
    let b = this.bursts.find((q) => q.t <= 0);
    if (!b) {
      if (this.bursts.length >= 6) b = this.bursts[0];
      else {
        const sprite = new THREE.Sprite(haloMaterial(0xf2f6ff, flashTexture()));
        sprite.renderOrder = 8;
        g.scene.add(sprite);
        b = { sprite };
        this.bursts.push(b);
      }
    }
    Object.assign(b, { x, y, z, dir: F.dir, t: PHOTO.flash + PHOTO.glare, id: b.id || {} });
    b.sprite.position.set(x, y, z);
    b.sprite.visible = true;
    b.sprite.material.opacity = 1; // (from this very frame: update() fades it)
    const eye = g.camera?.position;
    b.sprite.scale.setScalar(0.9 + (eye ? Math.hypot(x - eye.x, y - eye.y, z - eye.z) : 10) * 0.055);
    if (g.audio.ready) g.audio.cameraShot?.(x, y, z, false);
    if (g.auth) this.hostFlash(F, r.id);
    return F;
  }

  update(dt) {
    const g = this.g;
    this.t += dt;
    this.flashT = Math.max(0, this.flashT - dt);
    this.recycleT = Math.max(0, this.recycleT - dt);
    this.kick = Math.max(0, this.kick - dt * 5);
    // the blink of white comes the frame AFTER the photo was taken (the picture is the flash, not the glare)
    if (this.shotFrame >= 0 && ++this.shotFrame >= 2) {
      g.fx.white = Math.max(g.fx.white, 0.42);
      this.shotFrame = -1;
    }
    if (this.has && !g.player.alive) this.flashT = 0;
    for (let i = this.vanishQ.length - 1; i >= 0; i--) {
      const q = this.vanishQ[i];
      if (--q.n > 0) continue;
      this.vanishQ.splice(i, 1);
      const m = q.m;
      if (!g.monsters.includes(m) || m.state === 'lurk') continue;
      const x = m.x, y = m.y || 0, z = m.z;
      m.vanish(q.sec);
      this.driven(x, y, z);
    }
    for (const it of this.items) {
      if (it.taken || !it.halo) continue;
      const k = (this.t + it.i * 0.7) % 2.2;
      it.halo.material.opacity = k < 0.18 ? 0.85 : 0.08; // blink… blink…
    }
    const eye = g.camera?.position;
    for (const b of this.bursts) {
      if (b.t <= 0) continue;
      b.t -= dt;
      const k = Math.max(0, b.t / (PHOTO.flash + PHOTO.glare));
      const d = eye ? Math.hypot(b.x - eye.x, b.y - eye.y, b.z - eye.z) : 10;
      b.sprite.visible = b.t > 0 && d < PHOTO.seen;
      b.sprite.material.opacity = Math.pow(k, 1.6);
      b.sprite.scale.setScalar(0.9 + d * 0.055); // a few degrees across however far: you notice it
    }
  }

  // small lights for GlowSticks: your flash, your friends' (a light with a direction, like a flashlight's beam)
  lightSources(out) {
    const g = this.g, p = g.player;
    if (this.flashT > 0 && p.alive) {
      const F = flashFrom(p.x, p.y + p.eyeCur, p.z, p.yaw, p.pitch);
      out.push({ x: F.x, y: F.y, z: F.z, I: PHOTO.light * Math.min(1, this.flashT / (PHOTO.flash * 0.5)), c: [1, 0.98, 0.94], R: PHOTO.radius, prio: 5, near: 0.3, id: this, dir: F.dir, cone: PHOTO.cone });
    }
    for (const b of this.bursts) {
      if (b.t <= PHOTO.glare) continue; // (the light is the flash's; the glare lingers in the eye)
      out.push({ x: b.x, y: b.y, z: b.z, I: PHOTO.light, c: [1, 0.98, 0.94], R: PHOTO.radius, prio: 4, near: 0.3, id: b.id, dir: b.dir, cone: PHOTO.cone });
    }
    return out;
  }

  // a frame main.js took: on the film
  addPhoto(blob, meta) {
    if (!blob || this.film.length >= PHOTO.keep) return;
    this.film.push({ blob, url: URL.createObjectURL(blob), meta });
  }

  // the state that goes into the pack's page and the wheel
  get label() { return `${this.shots} / ${PHOTO.shots}`; }
}
