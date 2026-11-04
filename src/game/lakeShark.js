// The lake is not a walkable blue floor. In its deep water something comes up from below.
// The host authorises a breach; everybody replays the same rise, bite and dive (no guest-side kills).
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { clamp, lerp, smoothstep, damp, angleDiff } from '../core/rng.js';
import { settings } from '../core/storage.js';
import { t } from '../core/i18n.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { GK } from '../ui/garageSet.js';
import { depthOf } from './water.js';
import { waterKick } from './waves.js';

export const SHARK = { deep: 2, wait: 1.1, bite: 0.86, dive: 2.65, duration: 3.3, shockR: 24 };
const fin = (b, a, c, d, kind) => { b.tri(a, c, d, kind); b.tri(d, c, a, kind); };
// Rounded, faceted mouth plates — no rectangular box hanging from the snout.
function mouthPlate(b, y, z, kind, scale = 1, thickness = 0.12) {
  const edge = [[-0.33, 0], [-0.44, 0.33], [-0.37, 0.72], [-0.2, 0.91], [0, 0.99],
    [0.2, 0.91], [0.37, 0.72], [0.44, 0.33], [0.33, 0]];
  b.identity();
  for (let i = 0; i < edge.length; i++) {
    const a = edge[i], c = edge[(i + 1) % edge.length];
    const p = [a[0] * scale, y, z + a[1] * scale], q = [c[0] * scale, y, z + c[1] * scale];
    b.triN([0, y, z + 0.43 * scale], p, q, [0, 1, 0], kind);
    if (thickness > 0) {
      const d = [p[0], y - thickness, p[2]], e = [q[0], y - thickness, q[2]];
      b.tri(p, d, e, kind); b.tri(p, e, q, kind);
      b.triN([0, y - thickness, z + 0.43 * scale], e, d, [0, -1, 0], kind);
    }
  }
}

export function buildLakeShark(material) {
  const root = new THREE.Group(), tail = new THREE.Group(), jaw = new THREE.Group();
  const b = new MeshBuilder(2048);
  // A spindle, a blunt snout, countershading, gills — a shark silhouette, not a reskinned forest monster.
  b.place(0, 0, -0.25, 0, 0, 0, 1, 0.85, 2.7); b.octa(0.73, 0.7, GK.DARK);
  b.place(0, -0.23, 0.3, 0, 0, 0, 0.9, 0.5, 2.3); b.octa(0.62, 0.62, KIND.BONE);
  b.place(0, 0.05, 1.36, 0, 0, 0, 1, 0.8, 1.35); b.octa(0.61, 0.51, GK.DARK);
  mouthPlate(b, -0.12, 1.15, GK.OIL);
  for (const side of [-1, 1]) {
    b.place(side * 0.49, 0.16, 1.55); b.octa(0.045, 0.045, GK.OIL);
    b.place(side * 0.514, 0.173, 1.574); b.octa(0.013, 0.013, KIND.BONE);
    for (let k = 0; k < 4; k++) {
      b.place(side * (0.65 - k * 0.025), -0.02, 0.8 - k * 0.16, 0, side * 0.25, -side * 0.15);
      b.box(0.018, 0.35, 0.025, GK.OIL);
    }
    b.identity();
    fin(b, [side * 0.45, -0.1, 0.55], [side * 1.65, -0.28, -0.75], [side * 0.56, -0.23, -0.45], GK.DARK);
    fin(b, [side * 0.25, -0.15, -1.14], [side * 0.7, -0.26, -1.75], [0, -0.3, -1.6], GK.DARK);
  }
  b.identity();
  fin(b, [0, 0.35, 0.45], [0, 1.39, -0.7], [0, 0.35, -0.85], GK.DARK);
  // Top row points down into the open mouth, bottom row rides the hinged lower jaw.
  for (let i = -4; i <= 4; i++) {
    b.place(i * 0.085, -0.13, 2.09 - 0.2 * (Math.abs(i) / 4) ** 1.6, Math.PI); b.cone(4, 0.048, 0.16, KIND.BONE);
  }
  const bodyGeo = b.toGeometry(); root.add(new THREE.Mesh(bodyGeo, material));
  const j = new MeshBuilder(512);
  mouthPlate(j, -0.015, 0, KIND.BONE);
  mouthPlate(j, 0.003, 0.045, KIND.FLESH, 0.87, 0);
  for (let i = -4; i <= 4; i++) {
    j.place(i * 0.08, 0.025, 0.91 - 0.2 * (Math.abs(i) / 4) ** 1.6); j.cone(4, 0.045, 0.16, KIND.BONE);
  }
  const jawGeo = j.toGeometry(); jaw.add(new THREE.Mesh(jawGeo, material));
  jaw.position.set(0, -0.3, 1.18); root.add(jaw);
  const tb = new MeshBuilder(256); tb.identity();
  fin(tb, [0, 0, 0.2], [0, 1.12, -0.76], [0, -0.1, -0.62], GK.DARK);
  fin(tb, [0, 0, 0.2], [0, -0.77, -0.48], [0, -0.1, -0.62], GK.DARK);
  const tailGeo = tb.toGeometry(); tail.add(new THREE.Mesh(tailGeo, material));
  tail.position.set(0, 0, -2.07); root.add(tail);
  root.rotation.order = 'YXZ';
  root.traverse((m) => { if (m.isMesh) m.frustumCulled = false; });
  return { root, tail, jaw, dispose() { root.removeFromParent(); for (const g of [bodyGeo, jawGeo, tailGeo]) g.dispose(); } };
}

// Pure trajectory, shared by the scene, the victim's camera and the regression tests.
export function sharkPose(age) {
  const u = clamp(age / SHARK.dive, 0, 1);
  return { advance: lerp(-5.4, 2, smoothstep(0, 1.9, age)),
    height: -1.5 + Math.sin(u * Math.PI) * 3.3,
    pitch: lerp(-0.55, 0.65, u), jaw: 0.8 * (1 - smoothstep(SHARK.bite - 0.1, SHARK.bite + 0.1, age)),
    visible: age < SHARK.dive };
}

export class LakeShark {
  constructor(game) { this.g = game; this.attacks = new Map(); this.deepT = new Map(); this.consumed = new Set(); this.shock = new Map(); }
  reset() {
    for (const a of this.attacks.values()) { a.rig.dispose(); const p = this.g.playerById(a.pid); if (p) p.held = false; }
    this.attacks.clear(); this.deepT.clear(); this.consumed.clear(); this.shock.clear(); this.warned = false;
  }
  holds(pid) { return this.attacks.has(pid) && !this.attacks.get(pid).bitten; }

  start(pid, x, z, yaw) {
    const g = this.g, L = g.world.lake, p = g.playerById(pid);
    if (!L || g.map !== 'forest' || !p?.alive || this.attacks.has(pid) || this.consumed.has(pid)
      || ![x, z, yaw].every(Number.isFinite) || depthOf(g.world, x, z) < SHARK.deep - 0.1) return false;
    const rig = buildLakeShark(g.world.material);
    g.scene.add(rig.root);
    const a = { pid, x, z, yaw, rig, age: 0, bitten: false };
    this.attacks.set(pid, a); p.held = true;
    g.audio.impact?.(x, L.y, z, true);
    g.audio.wade?.(0.9, 2.5);
    waterKick(g.waves, g.world, x, z, g.time, 'brute', 1.5);
    g.pulses.emit(x, L.y + 0.6, z, g.time, { radius: 26, strength: 1.5, speed: 35, decay: 0.6, kind: 'monster' });
    g.hlNote?.('shark', { victim: pid });
    for (const q of g.livePlayers()) if (q.id !== pid && Math.hypot(q.x - x, q.z - z) < SHARK.shockR) this.shock.set(q.id, 1.9);
    if (p !== g.player && g.player.alive && Math.hypot(g.player.x - x, g.player.z - z) < SHARK.shockR) {
      g.addTrauma?.(settings.scares === 'reduced' ? 0.16 : 0.45);
      g.hud.flashAlert(t('lakeMateTaken').replace('{name}', g.nameOf(p)), 'danger', 3);
      g.audio.sting?.(0.35);
    }
    this._pose(a);
    return true;
  }

  update(dt) {
    const g = this.g, L = g.world.lake;
    if (!L || g.map !== 'forest') return;
    if (!['play', 'morning', 'dusk', 'dawn', 'dying'].includes(g.state)) {
      if (this.attacks.size) this.reset();
      return;
    }
    for (const [pid, v] of this.shock) { if (v <= dt) this.shock.delete(pid); else this.shock.set(pid, v - dt); }
    for (const a of this.attacks.values()) {
      a.age += dt;
      const p = g.playerById(a.pid);
      if (p && !a.bitten) { p.x = a.x; p.z = a.z; p.vx = p.vz = 0; }
      this._pose(a);
      if (!a.bitten && a.age >= SHARK.bite) this._bite(a);
      if (a.age >= SHARK.duration) { a.rig.dispose(); this.attacks.delete(a.pid); }
    }
    if (!g.auth || !['play', 'morning'].includes(g.state)) return;
    for (const p of g.livePlayers()) {
      if (this.attacks.has(p.id) || p.held || p.carriedBy || p.floorY != null || p.underground) continue;
      const deep = depthOf(g.world, p.x, p.z) >= SHARK.deep && p.y < L.y - 0.45;
      const age = deep ? (this.deepT.get(p.id) || 0) + dt : 0;
      this.deepT.set(p.id, age);
      if (age >= SHARK.wait) {
        const yaw = Number.isFinite(p.yaw) ? p.yaw : Math.atan2(p.x - L.x, p.z - L.z); // rise in the swimmer's view
        if (this.start(p.id, p.x, p.z, yaw) && g.online) g.sync.ev('lksh', p.id, p.x, p.z, yaw);
      }
    }
    const p = g.player;
    if (!this.warned && p.alive && depthOf(g.world, p.x, p.z) > 0.6) {
      this.warned = true;
      g.hud.flashAlert(t('lakeDeepWarning'), 'warning', 3);
    }
  }

  _pose(a) {
    const p = sharkPose(a.age), L = this.g.world.lake;
    a.rig.root.position.set(a.x + Math.sin(a.yaw) * p.advance, L.y + p.height, a.z + Math.cos(a.yaw) * p.advance);
    a.rig.root.rotation.set(p.pitch, a.yaw, 0);
    a.rig.root.visible = p.visible;
    a.rig.jaw.rotation.x = p.jaw;
    a.rig.tail.rotation.y = Math.sin(a.age * 13) * 0.24;
  }

  _bite(a) {
    const g = this.g, p = g.playerById(a.pid), L = g.world.lake;
    a.bitten = true;
    if (!p?.alive) { if (p) p.held = false; return; }
    this.consumed.add(a.pid);
    p.held = false; p.consumed = true; p.cause = 'shark';
    const m = { type: 'shark', id: -9, x: a.x - Math.sin(a.yaw) * 1.5, y: L.y, z: a.z - Math.cos(a.yaw) * 1.5 };
    if (p === g.player) {
      if (g.online) g.localDie(m, 'shark');
      else { p.alive = false; g.state = 'dying'; g.beginDeath(m, 'shark'); }
      g.hlNote?.('death', { cause: 'shark' });
    } else {
      p.die(a.x, a.z); p.consumed = true; p.cause = 'shark';
      g.audio.mateDeath?.(a.x, L.y, a.z, g.distToEars(a.x, a.z) < 30);
    }
    g.glows.dropFor?.(p.id, a.x, a.z);
    g.escape.dropFor?.(p.id, a.x, a.z);
    waterKick(g.waves, g.world, a.x, a.z, g.time, 'brute', 2);
    g.pulses.emit(a.x, L.y, a.z, g.time, { radius: 24, strength: 1.4, decay: 0.65, kind: 'monster' });
    if (g.auth) {
      g.checkTeam();
      if (g.online && g.state === 'morning' && g.livePlayers().length === 0) g.teamOverAt = g.time + 2.8;
    }
  }

  poseRemote(r) {
    const a = this.attacks.get(r.id);
    if (a && a.age > 0.48 && a.age < 1.65) {
      const k = clamp((a.age - 0.48) / 1.17, 0, 1), root = r.rig.root;
      root.visible = true;
      root.position.set(a.x, this.g.world.lake.y - 0.8 + Math.sin(k * Math.PI) * 1.65 - k * 1.1, a.z);
      root.rotation.set(-0.4, a.yaw + Math.PI, Math.sin(k * 12) * 0.16);
      const n = r.rig.nodes;
      n.shL.rotation.x = -2.4; n.shR.rotation.x = -2.4;
      n.head.rotation.x = -0.3;
      return;
    }
    if (this.consumed.has(r.id)) { r.rig.root.visible = false; return; }
    const shock = this.shock.get(r.id);
    if (shock && r.alive) {
      const k = Math.min(1, shock);
      r.rig.nodes.head.rotation.x -= 0.24 * k;
      r.rig.nodes.chest.rotation.x -= 0.15 * k;
      r.rig.nodes.shL.rotation.x -= 0.7 * k; r.rig.nodes.shR.rotation.x -= 0.7 * k;
    }
  }

  dying(dt) {
    const g = this.g, p = g.player, L = g.world.lake;
    g.deathT += dt;
    const tt = g.deathT, a = this.attacks.get(p.id);
    if (a) {
      const want = a.yaw; // do not whip 180° when the body passes underneath the camera
      p.yaw += angleDiff(p.yaw, want) * Math.min(1, dt * 18);
    }
    p.pitch = damp(p.pitch, lerp(-0.22, 0.45, smoothstep(0.3, 1.5, tt)), 9, dt);
    p.y = damp(p.y, L.y - CFG.PLAYER.eye - 0.65 * smoothstep(0.3, 1.5, tt), 5, dt);
    g.fx.red = Math.max(g.fx.red, 0.6); g.fx.trauma = Math.max(g.fx.trauma, settings.scares === 'reduced' ? 0.18 : 0.5);
    g.fx.fade = 1 - smoothstep(1.1, 1.9, tt);
    if (tt < 1.95) return;
    if (g.online) { g.localDeath = 'done'; g.enterSpectate(); return; }
    g.state = 'over'; g.fx.fade = 0; g.audio.setAmbience(0, 0);
    g.onEnd?.({ won: false, cause: 'shark' });
  }
}
