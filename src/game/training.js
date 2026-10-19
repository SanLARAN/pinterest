// The training ground: the same forest, in daylight, with everything to try and nothing to lose. The
// host's "ПОЛИГОН" (or your own, from the menu) plays the departure film and lands you at the camp
// with a rack of the whole field kit, three targets down the meadow and four enduro bikes — one a
// player. No monsters, no bleed, no score: the forest as a schoolyard. You leave the way you came.
import * as THREE from 'three';
import { damp } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { CFG } from '../core/config.js';
import { BAG_LIMIT } from './backpackData.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { geometryOf } from './uaz.js';

const TARGETS = [
  { d: 9, off: 2.5 },
  { d: 17, off: -3 },
  { d: 26, off: 4 },
];

export class Training {
  constructor(game) {
    this.g = game;
    this.group = null;
    this.targets = [];
    this.rackT = 0;
    this.hits = 0;
    this.cx = 0; this.cz = 3;
  }

  // the camp becomes a school: the rack by the camp generator, the targets down the meadow, the
  // bikes in a row beside it. (The world is already built; this only adds to it.)
  begin() {
    const g = this.g;
    this.end();
    const gen = g.objectives.gens[0]; // the camp generator: the camp's own landmark
    let ox = gen.x - 0, oz = gen.z - 3; // away from the campfire, toward open forest
    const l = Math.hypot(ox, oz) || 1;
    ox /= l; oz /= l;
    const yaw = Math.atan2(-ox, -oz); // a bike's heading (forward = (-sin, -cos))
    this.yaw = yaw;
    const rx = gen.x + ox * 3.2, rz = gen.z + oz * 3.2;
    this.rx = rx; this.rz = rz;
    g.rackX = rx + ox * 4.6; g.rackZ = rz + oz * 4.6; // the bikes park well past the rack: its apron stays clear
    g.trainingYaw = yaw;

    const b = new MeshBuilder(512);
    // the rack: two posts, two shelves, a sign
    for (const s of [-1, 1]) {
      b.place(rx + Math.cos(yaw) * s * 1.1, 0.55, rz - Math.sin(yaw) * s * 1.1, 0, -yaw, 0);
      b.box(0.09, 1.1, 0.09, KIND.WOOD);
    }
    for (const y of [0.42, 0.92]) {
      b.place(rx, y, rz, 0, -yaw, 0);
      b.box(2.35, 0.05, 0.4, y > 0.6 ? KIND.WOOD : KIND.BARK);
    }
    b.place(rx, 1.32, rz, 0, -yaw, 0);
    b.box(2.3, 0.34, 0.03, KIND.BONE); // the sign
    const mesh = new THREE.Mesh(geometryOf(b.toArrays()), g.world.material);
    mesh.frustumCulled = false;
    g.scene.add(mesh);
    this.group = new THREE.Group();
    g.scene.add(this.group);
    this.group.add(mesh);
    // the goods on the shelves (the tape and the crowbar are the real physical ones, moved here)
    const onShelf = ['stones', 'glow', 'flare', 'battery', 'map', 'syringe'];
    onShelf.forEach((kind, i) => {
      const geo = g.inventory.geo[kind];
      if (!geo) return;
      const m = new THREE.Mesh(geo, g.world.material);
      const s = i % 3 - 1;
      m.position.set(rx + Math.cos(yaw) * (s * 0.6), i < 3 ? 0.62 : 1.06, rz - Math.sin(yaw) * (s * 0.6));
      m.rotation.y = -yaw + (i - 2.5) * 0.3;
      m.frustumCulled = false;
      this.group.add(m);
    });
    const tools = g.tools;
    for (const kind of ['tape', 'crowbar']) {
      const it = tools.items.find((q) => q.kind === kind && q.state === 'ground');
      if (!it) continue;
      // at the two ends of the rack, on the ground: from its face E means the whole kit, not one tool
      const s = kind === 'tape' ? -1.55 : 1.55;
      it.x = rx + Math.cos(yaw) * s;
      it.z = rz - Math.sin(yaw) * s;
      it.y = g.world.terrain.height(it.x, it.z) + 0.03;
      it.yaw = -yaw;
      tools._place(it);
    }

    // the targets: three boards down the meadow, a painted ring on each
    this.targets = TARGETS.map((T, i) => {
      const x = gen.x + ox * T.d + Math.cos(yaw) * T.off;
      const z = gen.z + oz * T.d - Math.sin(yaw) * T.off;
      const y = g.world.terrain.height(x, z);
      const bb = new MeshBuilder(128);
      bb.place(0, 0.35, 0); bb.box(0.1, 0.7, 0.1, KIND.WOOD);
      bb.place(0, 0.95, 0); bb.box(0.95, 1.05, 0.05, KIND.WOOD);
      bb.place(0, 0.95, 0.028); bb.box(0.55, 0.62, 0.012, KIND.BONE);
      bb.place(0, 0.95, 0.036); bb.box(0.22, 0.26, 0.01, KIND.EFFIGY);
      const m = new THREE.Mesh(geometryOf(bb.toArrays()), g.world.material);
      m.position.set(x, y, z);
      m.rotation.order = 'YXZ'; // heading first, then the topple tips it backward
      m.rotation.y = Math.atan2(ox, oz) + Math.PI; // facing back at the rack
      m.frustumCulled = false;
      this.group.add(m);
      return { mesh: m, x, y, z, k: 0, up: 1, resetT: 0, i };
    });

    this.rackT = 0;
    this.hits = 0;
    g.motos?.reset();
  }

  // what E can find here (the rack; the bikes consider for themselves)
  consider(fn) {
    if (this.rackT > 0) return;
    fn(this, this.rx, this.rz, 2.1, 'rack');
  }

  interact(best, dt, held, still, T) {
    const g = this.g;
    g.hud.setUse(T('rackUse'), 0, true);
    if (held && still) this.take();
  }

  // the whole field kit, respecting the pockets' limits: try everything, lose nothing
  take() {
    const g = this.g, p = g.player;
    if (this.rackT > 0) return;
    this.rackT = 1.4;
    p.stones = Math.min(CFG.PLAYER.maxStones, Math.max(p.stones | 0, 3));
    g.glows.count = Math.min(3, Math.max(g.glows.count, 3));
    if (!g.torch.has) g.torch.has = true;
    g.torch.charge = 1;
    g.inventory.cells = Math.min(3, Math.max(g.inventory.cells | 0, 3));
    g.setFlares(Math.min(6, Math.max(p.flares | 0, 2)), true);
    g.inventory.syringes = Math.min(BAG_LIMIT.syringe, Math.max(g.inventory.syringes | 0, BAG_LIMIT.syringe));
    if (g.partMap) g.partMap.has = true;
    g.hud.popup(t('rackTaken'), 'amber');
    if (g.audio.ready) g.audio.paper();
    g.inventory.reconcile();
  }

  // targets: a stone or a flare that passes within arm's reach knocks one over; they stand back up
  update(dt) {
    const g = this.g;
    this.rackT = Math.max(0, this.rackT - dt);
    for (const tg of this.targets) {
      if (tg.up < 1 || tg.k > 0) {
        tg.k = Math.max(0, tg.k - dt);
        if (tg.k <= 0 && tg.up < 1) tg.resetT = Math.max(0, tg.resetT - dt);
        if (tg.up < 1 && tg.k <= 0 && tg.resetT <= 0) tg.up = Math.min(1, tg.up + dt * 2.2);
        tg.mesh.rotation.x = -(1 - tg.up) * Math.PI / 2;
        if (tg.up >= 1) tg.mesh.rotation.x = 0;
      }
      if (tg.up < 1 || tg.k > 0) continue;
      const flies = [...g.stones.list, ...g.flares.list];
      for (const s of flies) {
        if (s.dead) continue;
        if (Math.hypot(s.x - tg.x, s.z - tg.z) < 1.15 && s.y - tg.y < 2.2 && s.y > tg.y) {
          tg.up = 0; tg.k = 0.12; tg.resetT = 6; this.hits++;
          tg.mesh.rotation.x = -Math.PI / 2;
          g.hud.popup(`${t('rackHit')} · ${this.hits}`, 'amber');
          g.audio?.clank?.(tg.x, tg.y + 1, tg.z, 1);
          break;
        }
      }
    }
  }

  // leaving: the meshes go, the bikes stay gone with them
  end() {
    const g = this.g;
    if (this.group) {
      g.scene.remove(this.group);
      this.group = null;
    }
    this.targets = [];
  }
}
