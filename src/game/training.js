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
import { lettering } from '../world/expedition.js';

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
    // Where the four bikes stand: the camp sits on a hillside, and a row parked across it either floats
    // or buries its wheels. Look around the stand for the flattest clear strip that fits four machines
    // abreast, and park them there, noses out toward the open forest.
    const t = g.world.terrain;
    let spot = null;
    for (let a = 0; a < 16; a++) {
      const ang = yaw + (a / 16) * Math.PI * 2;
      const ax = -Math.sin(ang), az = -Math.cos(ang); // the row's facing
      const bx = -az, bz = ax; // across the row
      for (const d of [4.5, 5.5, 6.5, 7.5]) {
        const cx = rx + ax * d, cz = rz + az * d;
        let hi = -1e9, lo = 1e9, blocked = 0;
        for (let i = 0; i < 4; i++) {
          const o = (i - 1.5) * 1.75;
          const x = cx + bx * o, z = cz + bz * o;
          const h = t.height(x, z);
          hi = Math.max(hi, h); lo = Math.min(lo, h);
          const q = { x, z };
          if (g.world.col.resolve(q, 1.1).hit) blocked++;
        }
        const score = (hi - lo) + blocked * 3 - d * 0.05;
        if (!spot || score < spot.score) spot = { x: cx, z: cz, ax, az, score };
      }
    }
    g.rackX = spot.x; g.rackZ = spot.z;
    g.trainingYaw = Math.atan2(-spot.ax, -spot.az); // the bikes face along (ax, az)
    this.side = [-spot.az, spot.ax];

    // The stand: a field rack with a back board, three shelves and a painted header, facing the camp
    // (the player walks up to its open face). Everything is laid out in the stand's own frame first —
    // `at()` is the only thing that knows where that frame is in the world, so a shelf and the kit
    // standing on it can never drift apart. (`place()` replaces the matrix; it does not compose.)
    const b = new MeshBuilder(512);
    const gy = g.world.terrain.height(rx, rz); // the camp meadow is not flat: the stand stands on it
    const R = yaw + Math.PI; // the stand's local -z looks back at the camp
    const cosR = Math.cos(R), sinR = Math.sin(R);
    const world = (x, z) => [rx + cosR * x + sinR * z, rz - sinR * x + cosR * z];
    const at = (x, y, z, ry = 0, rx2 = 0, rz2 = 0) => {
      const [wx, wz] = world(x, z);
      b.place(wx, gy + y, wz, rx2, R + ry, rz2);
    };
    const W = KIND.WOOD, Wd = KIND.BARK, Bn = KIND.BONE;
    for (const x of [-1.15, 1.15]) { // the two end posts, each on a foot
      at(x, 0.77, -0.02); b.box(0.1, 1.54, 0.1, Wd);
      at(x, 0.05, 0.0); b.box(0.16, 0.1, 0.66, Wd);
      at(x, 1.56, -0.02); b.box(0.13, 0.06, 0.13, W);
    }
    at(0, 0.8, -0.22); b.box(2.42, 1.34, 0.035, W); // the back board
    // a plank skyline: boards of unequal width, so the stand reads as built, not extruded
    b.identity(); // (the skyline is drawn as separate planks below)
    for (const [px, pw, py] of [[-0.9, 0.5, 1.5], [0.0, 0.62, 1.53], [0.95, 0.44, 1.49]]) {
      at(px, py, -0.22); b.box(pw, 0.1, 0.05, Wd);
    }
    for (const y of [0.47, 0.93, 1.4]) { // three shelves, each with a front lip
      at(0, y, 0.03); b.box(2.3, 0.05, 0.46, y > 1 ? W : Wd);
      at(0, y - 0.07, 0.24); b.box(2.3, 0.05, 0.04, Wd);
    }
    at(0, 1.5, -0.12); b.box(1.5, 0.26, 0.05, Wd); // the header, dark timber with bone lettering
    {
      const [hx, hz] = world(0, -0.088); // just proud of the header's face, so it reads from the camp
      lettering(b, 'СТАРТ', hx, gy + 1.5, hz, 0.045, Bn, R);
    }
    at(0, 0.16, -0.04); b.box(2.3, 0.08, 0.08, Wd); // a stretcher tying the two posts at the foot
    const mesh = new THREE.Mesh(geometryOf(b.toArrays()), g.world.material);
    mesh.frustumCulled = false;
    g.scene.add(mesh);
    this.group = new THREE.Group();
    g.scene.add(this.group);
    this.group.add(mesh);

    // What stands on the shelves: the whole field kit, laid out to be read at a glance. These are
    // display props, not the pickup parcels — the parcels' geometry is a handful of gold cylinders at
    // pocket scale, which on a shelf reads as gravel. Each prop here is built to be recognised from
    // two metres: a pile of stones, a glow stick, a flare, a battery, the map and the syringe case.
    const pb = new MeshBuilder(256); // the shelf props get their own mesh: `b` is already baked
    const pat = (x, y, z, ry = 0, rx2 = 0, rz2 = 0) => {
      const [wx, wz] = world(x, z);
      pb.place(wx, gy + y, wz, rx2, R + ry, rz2);
    };
    const TOP1 = 0.495, TOP2 = 0.955; // the top faces of the two lower shelves
    for (const [px, pz, pr, py] of [[-0.86, 0.06, 0.052, 1.0], [-0.735, 0.15, 0.062, 2.3], [-0.64, 0.03, 0.046, 4.1]]) {
      pat(px, TOP1 + pr * 0.42, pz, py); pb.cylinder(6, pr, pr * 0.82, pr * 0.85, KIND.ROCK); // a stone
    }
    pat(-0.02, TOP1 + 0.016, 0.1, 0, 0, Math.PI / 2); pb.cylinder(6, 0.015, 0.015, 0.19, KIND.SHARD); // a glow stick
    pat(0.078, TOP1 + 0.016, 0.1); pb.box(0.024, 0.024, 0.026, Wd); // its dark switch cap
    pat(0.68, TOP1 + 0.023, 0.1, 0.16, 0, Math.PI / 2); pb.cylinder(6, 0.022, 0.022, 0.17, KIND.EFFIGY); // a flare
    pat(0.76, TOP1 + 0.023, 0.1, 0.16, 0, Math.PI / 2); pb.box(0.03, 0.03, 0.03, Wd); // its striker cap
    pat(-0.74, TOP2 + 0.045, 0.1); pb.box(0.17, 0.09, 0.1, Wd); // the battery case
    pat(-0.74, TOP2 + 0.098, 0.1); pb.box(0.17, 0.012, 0.1, W); // its lid
    for (const x of [-0.79, -0.69]) { pat(x, TOP2 + 0.115, 0.1); pb.box(0.03, 0.03, 0.03, Bn); } // the posts
    pat(-0.74, TOP2 + 0.05, 0.152); pb.box(0.1, 0.016, 0.012, KIND.EFFIGY); // a red band on the front
    pat(0.0, TOP2 + 0.012, 0.1, 0.1); pb.box(0.24, 0.014, 0.19, Bn); // the folded map
    for (const x of [-0.07, 0.04]) { pat(x, TOP2 + 0.02, 0.1, 0.1); pb.box(0.005, 0.004, 0.17, Wd); } // its creases
    pat(0.76, TOP2 + 0.026, 0.1, -0.12); pb.box(0.15, 0.05, 0.075, Bn); // the syringe case
    pat(0.76, TOP2 + 0.026, 0.1, -0.12); pb.box(0.15, 0.012, 0.077, KIND.EFFIGY); // the red stripe on it
    pat(0.84, TOP2 + 0.026, 0.1, -0.12); pb.box(0.03, 0.03, 0.055, Wd); // its catch

    const props = new THREE.Mesh(geometryOf(pb.toArrays()), g.world.material);
    props.frustumCulled = false;
    this.group.add(props);

    // a crate of stones beside the stand's left foot
    const c = new MeshBuilder(64);
    {
      const [wx, wz] = world(-1.55, 0.5);
      c.place(wx, gy + 0.12, wz, 0, R, 0);
      c.box(0.46, 0.24, 0.34, Wd);
      const [ix, iz] = world(-1.55, 0.5);
      c.place(ix, gy + 0.21, iz, 0, R, 0);
      c.box(0.37, 0.06, 0.26, W); // the dark inside of the crate
    }
    const crate = new THREE.Mesh(geometryOf(c.toArrays()), g.world.material);
    crate.frustumCulled = false;
    this.group.add(crate);

    // The two field tools come to the stand too, lying flat on the ground just past each end — out of
    // the stand's use radius, so E at the shelves still means "take the whole kit". (There are two of
    // each in the world; the stand borrows whichever lies closest.)
    for (const kind of ['tape', 'crowbar']) {
      const it = g.tools.items
        .filter((q) => q.kind === kind && q.state === 'ground')
        .sort((a, b) => Math.hypot(a.x - rx, a.z - rz) - Math.hypot(b.x - rx, b.z - rz))[0];
      if (!it) continue;
      const [tx, tz] = world(kind === 'tape' ? -1.86 : 1.86, 0.66);
      it.x = tx;
      it.z = tz;
      it.y = g.world.terrain.height(tx, tz) + 0.02;
      it.yaw = R + (kind === 'crowbar' ? 0.42 : -0.12);
      it.rev = (it.rev | 0) + 1; // the host tells everyone where they went
      g.tools._place(it);
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
