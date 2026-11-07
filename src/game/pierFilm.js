// (5.0f) The end of «Топь»: the pier, the old fisherman (docs/LEVEL2.md, chapter 7).
//
// Off the cliff, into the black water. A film, like the convoy and the crash: you come up out of it, the far shore
// is a lantern on a pier; you swim; an old man sits at the end of the pier with a rod out over the water and a
// kettle-black lantern by his boot, and he looks up as if he had been waiting the whole night — he had. One line.
// Then the lake from high up, the pier, the lit window of his hut behind it, and the picture goes: the level is won.
//
// The old man is there before the film too: from the top of the cliff his lantern is the one warm light across
// the lake (Fisherman, put out by the chapter).
import * as THREE from 'three';
import { lerp, smoothstep } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { KIND } from '../world/builder.js';
import { part } from './monsters.js';
import { buildSurvivor, poseSeated, poseSwimming } from './survivor.js';
import { createPersonMaterial, dressPerson, undressPerson } from '../render/people.js';
import { haloMaterial } from './glowsticks.js';
import { beaconTexture } from './roadTraffic.js';
import { PIER, LAKE, rot } from '../world/swamp.js';
import { MOON } from './convoyFilm.js';


const _look = new THREE.Vector3();
export const FISHER_FIT = { head: 'ushanka', body: 'tulup', hc: ['#4a4038', '#2a241e'], bc: ['#5a4a38', '#3a3026'] };
export const LEVEL_Y = 0.34; // the water line (world/swamp.js LEVEL)
export const PT = { up: 1.4, swim: [3.2, 9.0], pier: [9.0, 14.6], line: 10.2, wide: [14.6, 18.6], end: 18.6 };

// where the pier's end is, and the bench on it (world/swamp.js buildPier)
export function pierEnd() {
  const ux = -Math.sin(PIER.yaw), uz = -Math.cos(PIER.yaw);
  return { x: PIER.x + ux * PIER.len, z: PIER.z + uz * PIER.len, ux, uz, y: LEVEL_Y + 0.55 };
}
export function benchAt() {
  const e = pierEnd();
  const [ox, oz] = rot(0.6, 0.6, PIER.yaw);
  return { x: e.x + ox, z: e.z + oz, y: e.y + 0.45 };
}
// where the hut's window light is (behind the root of the pier)
export function hutLight() {
  const ux = -Math.sin(PIER.yaw), uz = -Math.cos(PIER.yaw);
  return { x: PIER.x - ux * 8, y: LEVEL_Y + 2.6, z: PIER.z - uz * 8 };
}

// ---------------- the old man ----------------
export class Fisherman {
  constructor(scene) {
    const rig = (this.rig = buildSurvivor(FISHER_FIT));
    rig.root.rotation.order = 'YXZ';
    // the rod, out of his hands over the water (a thin limb with a line hanging off its tip)
    const rod = new THREE.Object3D();
    rod.position.set(0, -0.28, 0.06);
    rig.nodes.elR.add(rod);
    part(rig, rod, (b) => {
      b.identity();
      b.limb([0, 0, 0], [0, 0.9, 2.6], 0.018, 0.006, KIND.WOOD, 3);
      b.limb([0, 0.9, 2.6], [0, -0.8, 2.75], 0.003, 0.003, KIND.BONE, 3);
    });
    this.mat = createPersonMaterial(rig.dyes, 0x8a7350);
    this.mat.uniforms.uShow.value = 1;
    this.meshes = dressPerson(rig, this.mat);
    scene?.add(rig.root);
    // his lantern on the planks by his boot
    const B = benchAt(), e = pierEnd();
    this.lamp = { x: B.x - e.uz * 0.5 + e.ux * 0.3, y: e.y + 0.18, z: B.z + e.ux * 0.5 + e.uz * 0.3 };
    this.halo = new THREE.Sprite(haloMaterial(0xffb060, beaconTexture()));
    this.halo.position.set(this.lamp.x, this.lamp.y, this.lamp.z);
    this.halo.scale.setScalar(1.3);
    this.halo.material.opacity = 1.25;
    scene?.add(this.halo);
    this.window = new THREE.Sprite(haloMaterial(0xffa050, beaconTexture()));
    const H = hutLight();
    this.window.position.set(H.x, H.y, H.z);
    this.window.scale.setScalar(2.2);
    this.window.material.opacity = 0.9;
    scene?.add(this.window);
    this.look = 0;
    this.pose(0);
  }

  // t: the clock; look 0..1: his head up from the float to whoever is coming
  pose(time, look = this.look) {
    const rig = this.rig, n = rig.nodes, B = benchAt();
    poseSeated(rig, false, time, 0, null);
    n.chest.rotation.x += 0.18 - look * 0.15; // hunched over the rod, straightening as he looks up
    n.head.rotation.set(0.35 - look * 0.6, Math.sin(time * 0.3) * 0.08 * (1 - look), 0);
    n.shR.rotation.set(-0.75 + Math.sin(time * 0.7) * 0.02, 0, 0.12);
    n.elR.rotation.x = -0.6;
    n.shL.rotation.set(-0.5, 0, -0.1);
    n.elL.rotation.x = -1.0;
    rig.root.position.set(B.x, B.y, B.z);
    // facing out over the lake, along the pier
    const e = pierEnd();
    rig.root.rotation.set(0, Math.atan2(e.ux, e.uz), 0);
  }

  lights(time, out, near = 1) {
    const fl = 0.9 + 0.06 * Math.sin(time * 9) + 0.04 * Math.sin(time * 21 + 1);
    out.push({ x: this.lamp.x, y: this.lamp.y + 0.1, z: this.lamp.z, I: 1.35 * fl * near, c: [1, 0.68, 0.34], R: 12, prio: 2, near: 0.15, id: this });
    const H = hutLight();
    out.push({ x: H.x, y: H.y, z: H.z, I: 0.9 * near, c: [1, 0.62, 0.3], R: 9, prio: 3, near: 0.3, id: 'hutWindow' });
  }

  dispose() {
    undressPerson(this.meshes);
    this.rig.root.removeFromParent();
    this.mat.dispose();
    for (const s of [this.halo, this.window]) { s.removeFromParent(); s.material.dispose(); }
  }
}

// ---------------- the film ----------------
export class PierFilm {
  // from: where you went into the water; fisher: the old man (the chapter's)
  constructor(game, from, fisher) {
    this.g = game;
    this.from = { x: from.x, z: from.z };
    this.fisher = fisher;
    this.t = 0;
    this.state = 'run';
    this.done = false;
    this.cues = new Set();
    this.dur = PT.end;
    const e = pierEnd();
    this.to = { x: e.x + e.ux * 5, z: e.z + e.uz * 5 }; // where the swim ends: in the water off the pier's end
  }

  shotAt(tt) {
    if (tt < PT.swim[0]) return 'surface';
    if (tt < PT.swim[1]) return 'swim';
    if (tt < PT.pier[1]) return 'pier';
    return 'wide';
  }

  fadeAt(tt) {
    return smoothstep(0, 0.9, tt) * (1 - smoothstep(PT.end - 2.2, PT.end, tt));
  }

  // where the swimmer is: at the splash, across the lake, off the pier's end
  swimmer(tt) {
    const k = smoothstep(PT.swim[0] - 0.4, PT.pier[0] + 1.2, tt);
    return { x: lerp(this.from.x, this.to.x, k), z: lerp(this.from.z, this.to.z, k) };
  }

  update(dt) {
    if (this.state !== 'run') return;
    if (!this.hold) this.t += dt;
    const tt = this.t, g = this.g, au = g.audio;
    this.fisher.look = smoothstep(PT.pier[0] + 0.4, PT.line, tt);
    this.fisher.pose(tt);
    g.fx.fade = this.fadeAt(tt);
    const hit = (key, at, fn) => { if (tt >= at && !this.cues.has(key)) { this.cues.add(key); fn(); } };
    hit('surface', 0.05, () => au?.splash?.(1));
    hit('breath', PT.up, () => au?.splash?.(0.4));
    for (let k = 0; k < 9; k++) hit('stroke' + k, PT.swim[0] + k * 0.62, () => au?.wade?.(0.5, 0.9));
    hit('creak', PT.pier[0] + 0.3, () => { const B = benchAt(); au?.lanternSqueak?.(B.x, B.y, B.z); });
    hit('line', PT.line, () => g.hud.setHint(t('pierLine')));
    hit('lineOff', PT.wide[0] + 1.6, () => g.hud.setHint(null));
    if (tt >= PT.end) {
      this.state = 'done';
      this.done = true;
    }
  }

  cameraAt(tt) {
    const sh = this.shotAt(tt), e = pierEnd(), B = benchAt();
    let p, l, fov = 62, roll = 0;
    if (sh === 'surface') {
      // up out of the black water: under it, then the surface, the far lantern
      const s = this.swimmer(tt), up = smoothstep(0.3, PT.up, tt);
      p = [s.x, LEVEL_Y - 0.5 + up * 0.68, s.z];
      l = [e.x, LEVEL_Y + 0.6 + (1 - up) * 3, e.z];
      roll = (1 - up) * 0.3;
    } else if (sh === 'swim') {
      // swimming for it, low on the water, the strokes in the picture
      const s = this.swimmer(tt);
      p = [s.x, LEVEL_Y + 0.16 + Math.abs(Math.sin(tt * 2.6)) * 0.07, s.z];
      l = [e.x, LEVEL_Y + 1.0, e.z];
      roll = Math.sin(tt * 2.6) * 0.05;
    } else if (sh === 'pier') {
      // off the pier's end, looking up at him
      p = [this.to.x, LEVEL_Y + 0.2, this.to.z];
      l = [B.x, B.y + 0.9, B.z];
      fov = 52;
    } else {
      // the lake from high above the water, pulling back; the pier, his light, the window
      const k = smoothstep(PT.wide[0], PT.end, tt);
      p = [LAKE.x + lerp(-6, -20, k), LEVEL_Y + lerp(10, 22, k), LAKE.z + lerp(-24, 4, k)];
      l = [e.x, e.y, e.z];
      fov = 56;
    }
    return { p, l, fov, roll, kind: sh };
  }

  applyCamera(camera) {
    if (this.state !== 'run') return false;
    const c = this.cameraAt(this.t);
    camera.position.set(c.p[0], c.p[1], c.p[2]);
    _look.set(c.l[0], c.l[1], c.l[2]);
    camera.lookAt(_look);
    camera.rotateZ(c.roll);
    if (Math.abs(camera.fov - c.fov) > 0.01) {
      camera.fov = c.fov;
      camera.updateProjectionMatrix();
    }
    this.camPos = { x: c.p[0], y: c.p[1], z: c.p[2] };
    return true;
  }

  // friends swimming beside you (their rigs; yours is the camera)
  poseSwimmers(rigs) {
    const tt = this.t, s = this.swimmer(tt), e = pierEnd();
    const yaw = Math.atan2(e.x - this.from.x, e.z - this.from.z);
    rigs.forEach((rig, k) => {
      const side = (k + 1) * 1.6 * (k % 2 ? -1 : 1);
      poseSwimming(rig, tt * 2.6 + k);
      rig.root.position.set(s.x + Math.cos(yaw) * side, LEVEL_Y - 0.9, s.z - Math.sin(yaw) * side);
      rig.root.rotation.set(0, yaw, 0);
      rig.root.visible = this.shotAt(tt) !== 'surface';
    });
  }

  lightSources(out) {
    out.push({ x: MOON.x, y: MOON.y, z: MOON.z, I: MOON.I, c: MOON.c, R: MOON.R, prio: 9, near: 2, id: 'moon' });
    this.fisher.lights(this.t, out);
  }
}

