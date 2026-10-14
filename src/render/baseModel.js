// The enemy stronghold: walls with sealed gates, corner towers, scaffolding on the outer
// walls, a throne with a glowing crystal, and a violet beacon that marks the objective.
import * as THREE from 'three';
import { GeoAccumulator, G, part } from './geo.js';
import { bitmapMaterial } from './bitmap.js';
import { Fader } from './fade.js';
import { BASE } from '../sim/layout.js';

const STONE = 0x8a7f8f;
const STONE_DARK = 0x5c5366;
const WOOD = 0x9a6a3e;
const WOOD_DARK = 0x6a4428;
const IRON = 0x3a3440;
const VIOLET = 0xb070ff;
const GATE_LIFT = 3.3;

export function buildBaseModel(layout) {
  const B = layout.base;
  const H = BASE.half;
  const T = BASE.wallT;
  const group = new THREE.Group();
  const fadeUnits = [];
  const mats = [];
  const geos = [];

  // ---- walls, towers and scaffolding, per side (each side fades on its own) ----------
  const sideAcc = { N: new GeoAccumulator(), S: new GeoAccumulator(), E: new GeoAccumulator(), W: new GeoAccumulator() };
  for (const w of B.walls) {
    const sx = w.maxX - w.minX;
    const sz = w.maxZ - w.minZ;
    const cx = (w.minX + w.maxX) / 2;
    const cz = (w.minZ + w.maxZ) / 2;
    const acc = sideAcc[w.side];
    part(acc, G.box(sx, BASE.wallH, sz), STONE, mat4(cx, BASE.wallH / 2, cz));
    part(acc, G.box(sx + 0.2, 0.5, sz + 0.2), STONE_DARK, mat4(cx, 0.25, cz));
    // course bands: stone rows that stand proud of the face, so the wall reads as solid masonry
    for (const y of [0.95, 2.35]) {
      const band = sx > sz ? G.box(sx + 0.06, 0.09, sz + 0.12) : G.box(sx + 0.12, 0.09, sz + 0.06);
      part(acc, band, STONE_DARK, mat4(cx, y, cz));
      geos.push(band);
    }
    // crenellations along the wall run
    const along = Math.max(sx, sz);
    const n = Math.max(1, Math.floor(along / 1.0));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n - 0.5;
      const mx = sx > sz ? cx + t * along : cx;
      const mz = sx > sz ? cz : cz + t * along;
      part(acc, G.box(sx > sz ? 0.5 : sx, 0.55, sx > sz ? sz : 0.5), STONE, mat4(mx, BASE.wallH + 0.27, mz));
    }
  }
  for (const t of B.towers) {
    const acc = sideAcc[t.z < BASE.z ? 'N' : 'S'];
    part(acc, G.cyl(1.2, 1.3, 5.2, 8), STONE, mat4(t.x, 2.6, t.z));
    part(acc, G.cone(1.5, 2.2, 8), VIOLET, mat4(t.x, 6.3, t.z));
    part(acc, G.cyl(0.03, 0.03, 1.4, 4), IRON, mat4(t.x, 7.7, t.z));
    part(acc, G.box(0.02, 0.45, 0.7), 0x7a1f3a, mat4(t.x + 0.36, 7.9, t.z));
  }
  // scaffolding on the outer faces of the north and east walls: poles and planks
  const scaffold = (acc, x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.round(len / 2.2));
    const ang = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const px = x0 + (x1 - x0) * t;
      const pz = z0 + (z1 - z0) * t;
      part(acc, G.cyl(0.08, 0.1, 4.6, 5), WOOD_DARK, mat4(px, 2.3, pz));
    }
    for (const y of [1.2, 2.5, 3.8]) {
      part(acc, G.box(0.14, 0.14, len), WOOD, { x: (x0 + x1) / 2, y, z: (z0 + z1) / 2, ry: ang });
    }
  };
  const off = 1.1;
  scaffold(sideAcc.N, BASE.x - H - 0.3, BASE.z - H - off, BASE.x + H + 0.3, BASE.z - H - off);
  scaffold(sideAcc.E, BASE.x + H + off, BASE.z - H - 0.3, BASE.x + H + off, BASE.z + H + 0.3);

  const sideBox = {
    N: { minX: BASE.x - H - 2.2, maxX: BASE.x + H + 2.2, minY: 0, maxY: 9, minZ: BASE.z - H - 2.4, maxZ: BASE.z - H + 1.8 },
    S: { minX: BASE.x - H - 2.2, maxX: BASE.x + H + 2.2, minY: 0, maxY: 9, minZ: BASE.z + H - 1.8, maxZ: BASE.z + H + 2.2 },
    W: { minX: BASE.x - H - 1.8, maxX: BASE.x - H + 1.8, minY: 0, maxY: 9, minZ: BASE.z - H - 2.2, maxZ: BASE.z + H + 2.2 },
    E: { minX: BASE.x + H - 1.8, maxX: BASE.x + H + 2.4, minY: 0, maxY: 9, minZ: BASE.z - H - 2.2, maxZ: BASE.z + H + 2.2 },
  };
  for (const k of ['N', 'S', 'E', 'W']) {
    const mat = bitmapMaterial();
    mats.push(mat);
    const geo = sideAcc[k].build();
    geos.push(geo);
    group.add(new THREE.Mesh(geo, mat));
    fadeUnits.push(new Fader([mat], sideBox[k]));
  }

  // ---- throne -----------------------------------------------------------------------
  const throneAcc = new GeoAccumulator();
  const tx = B.throne.x;
  const tz = B.throne.z;
  part(throneAcc, G.box(2.4, 0.5, 2.4), STONE_DARK, mat4(tx, 0.25, tz));
  part(throneAcc, G.box(1.5, 0.7, 1.2), STONE, mat4(tx, 0.85, tz));
  part(throneAcc, G.box(1.6, 2.6, 0.32), STONE, mat4(tx, 2.1, tz - 0.5));
  for (const s of [-1, 1]) {
    part(throneAcc, G.cone(0.14, 0.9, 5), IRON, mat4(tx + s * 0.7, 3.2, tz - 0.5));
  }
  part(throneAcc, G.cone(0.2, 0.6, 5), VIOLET, mat4(tx, 3.6, tz - 0.5));
  const throneMat = bitmapMaterial();
  mats.push(throneMat);
  const throneGeo = throneAcc.build();
  geos.push(throneGeo);
  const throneMesh = new THREE.Mesh(throneGeo, throneMat);
  group.add(throneMesh);
  fadeUnits.push(new Fader([throneMat], { minX: tx - 1.6, maxX: tx + 1.6, minY: 0, maxY: 4.2, minZ: tz - 1.6, maxZ: tz + 1.6 }));

  // glowing crystal above the seat (its own material so it can pulse)
  const crystalGeo = G.ico(0.42, 0);
  const crystalMat = new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.95 });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.set(tx, 2.6, tz - 0.05);
  group.add(crystal);
  geos.push(crystalGeo);
  mats.push(crystalMat);

  const haloGeo = new THREE.RingGeometry(1.9, 2.3, 32).rotateX(-Math.PI / 2);
  const haloMat = new THREE.MeshBasicMaterial({
    color: VIOLET, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.set(tx, 0.06, tz);
  group.add(halo);
  geos.push(haloGeo);
  mats.push(haloMat);

  // beacon: a tall translucent pillar so the objective can be spotted from far away
  const beamGeo = new THREE.CylinderGeometry(0.5, 1.2, 22, 8, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: VIOLET, transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(tx, 11, tz);
  group.add(beam);
  geos.push(beamGeo);
  mats.push(beamMat);

  // ---- portcullis gates (dark iron bars, lift when the gates open) ------------------
  const gates = [];
  for (const g of B.gates) {
    const w = g.box.maxX - g.box.minX;
    const d = g.box.maxZ - g.box.minZ;
    const cx = (g.box.minX + g.box.maxX) / 2;
    const cz = (g.box.minZ + g.box.maxZ) / 2;
    const span = Math.max(w, d);
    const horiz = w > d; // gate runs along x
    const acc = new GeoAccumulator();
    for (let i = 0; i <= 4; i++) {
      const t = -span / 2 + (i * span) / 4;
      const bx = horiz ? t : 0;
      const bz = horiz ? 0 : t;
      part(acc, G.box(0.12, BASE.wallH - 0.2, 0.12), IRON, mat4(bx, (BASE.wallH - 0.2) / 2, bz));
    }
    for (const y of [0.9, 2.1, 3.1]) {
      part(acc, G.box(horiz ? span : 0.12, 0.12, horiz ? 0.12 : span), IRON, mat4(0, y, 0));
    }
    // a solid oak door behind the bars, with iron straps: the sealed gate is a real barrier
    const door = horiz ? G.box(span, BASE.wallH - 0.4, 0.16) : G.box(0.16, BASE.wallH - 0.4, span);
    part(acc, door, WOOD_DARK, mat4(0, (BASE.wallH - 0.4) / 2, 0));
    for (const y of [0.7, 1.9, 3.0]) {
      part(acc, G.box(horiz ? span : 0.22, 0.14, horiz ? 0.22 : span), IRON, mat4(0, y, 0));
    }
    const mat = bitmapMaterial();
    mats.push(mat);
    const geo = acc.build();
    geos.push(geo);
    const mesh = new THREE.Mesh(geo, mat);
    const pivot = new THREE.Group();
    pivot.position.set(cx, 0, cz);
    pivot.add(mesh);
    group.add(pivot);
    gates.push({ pivot, lift: 0 });
  }

  // ---- cellar: a pit under the throne, closed by two stone hatches until the throne falls ----
  const pitGeo = new THREE.BoxGeometry(2.4, 0.02, 2.4);
  const pitMat = new THREE.MeshBasicMaterial({ color: 0x07040d });
  const pit = new THREE.Mesh(pitGeo, pitMat);
  pit.position.set(tx, 0.09, tz);
  const glowGeo = new THREE.BoxGeometry(2.0, 0.02, 2.0);
  const glowMat = new THREE.MeshBasicMaterial({
    color: VIOLET, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(tx, 0.12, tz);
  const hatchMat = bitmapMaterial();
  const hatchGeos = [0, 1].map(() => {
    const acc = new GeoAccumulator();
    part(acc, G.box(1.2, 0.22, 2.4), STONE_DARK, { x: 0, y: 0, z: 0 });
    return acc.build();
  });
  const hatchL = new THREE.Mesh(hatchGeos[0], hatchMat);
  const hatchR = new THREE.Mesh(hatchGeos[1], hatchMat);
  hatchL.position.set(tx - 0.6, 0.2, tz);
  hatchR.position.set(tx + 0.6, 0.2, tz);
  group.add(pit, glow, hatchL, hatchR);
  geos.push(pitGeo, glowGeo, ...hatchGeos);
  mats.push(pitMat, glowMat, hatchMat);

  // ---- state ------------------------------------------------------------------------
  let open = 0; // 0 sealed .. 1 open (eased)
  let openTarget = 0;
  let flashT = 0;
  let downT = -1; // >= 0 while the throne is falling
  let cellarP = 0; // 0 hatches closed .. 1 hatches slid aside
  const update = (t, dt) => {
    open += (openTarget - open) * (1 - Math.exp(-2.4 * dt));
    for (const g of gates) g.pivot.position.y = open * GATE_LIFT;
    const pulse = 0.85 + 0.15 * Math.sin(t * 3.2);
    flashT = Math.max(0, flashT - dt);
    crystal.rotation.y = t * 0.8;
    crystal.scale.setScalar(pulse + flashT * 1.6);
    crystalMat.color.setHex(flashT > 0 ? 0xffffff : VIOLET);
    beam.material.opacity = 0.1 + 0.05 * Math.sin(t * 2.1);
    haloMat.opacity = 0.3 + 0.2 * pulse;
    // the hatches slide apart and the violet light rises from the pit
    const cp = cellarP;
    hatchL.position.x = tx - 0.6 - cp * 1.3;
    hatchR.position.x = tx + 0.6 + cp * 1.3;
    glowMat.opacity = cp * (0.75 + 0.15 * Math.sin(t * 5));
    if (downT >= 0) {
      downT += dt;
      const k = Math.min(1, downT / 1.6);
      throneMesh.rotation.z = k * 0.5;
      throneMesh.position.y = -k * 1.2;
      crystal.visible = k < 0.5;
      halo.visible = k < 0.5;
      beam.visible = k < 0.5;
    }
  };

  return {
    group,
    fadeUnits,
    throne: { x: tx, z: tz },
    setOpen(v) {
      openTarget = v ? 1 : 0;
    },
    isOpen: () => openTarget > 0.5,
    hitThrone() {
      flashT = 0.15;
    },
    throneDown() {
      downT = 0;
    },
    /** 0..1: how far the cellar hatches have opened. */
    setCellar(p) {
      cellarP = Math.max(0, Math.min(1, p));
    },
    cellarAt: () => ({ x: tx, z: tz }),
    update,
    dispose() {
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    },
  };
}

/** Transform in the shape part() expects. */
function mat4(x, y, z) {
  return { x, y, z };
}
