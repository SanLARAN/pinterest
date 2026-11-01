// Atlas portraits: the game's own low-poly models, built standalone (no world, no terrain) and animated
// with the game's own code. Plus a few field-guide extras the forest never shows you up close: the parts
// that wait in the tool bags.
//
// Every model: { root, tick(S), base, view } — root is a THREE.Object3D of meshes carrying the MeshBuilder
// `data` attribute (barycentrics + material kind) for the atlas plate shader. S (per frame, from the plate):
//   { t, dt, lit (0..1 echo light on it right now), pinged (an echo left the viewer this frame),
//     camAz (where the viewer stands around it, radians, 0 = in front), react (s since its sound was played) }
import * as THREE from 'three';
import { MeshBuilder, KIND } from '../world/builder.js';
import { RNG, clamp, lerp, angleDiff } from '../core/rng.js';
import { World, LANDMARKS } from '../world/world.js';
import { buildListener, buildCrawler, buildWatcher, buildHowler, buildAngler, buildShade, ANIMS } from '../game/monsters.js';
import { buildStrayBody, poseStray } from '../game/strayBody.js'; // 3.0t: Дворняжка
import { placer, buildCorpse, buildToolBag, buildFlareGun } from '../game/objectives.js';
import { buildDoorLeaf } from '../game/doors.js';
import { buildForestCar, buildPart, WHEELS, MISSING, HOOD_HINGE, HOOD_OPEN, PARTS } from '../game/uaz.js';
import { buildYard, buildGateLeaf, buildBackLeaf, GATE, BACK, CAR_AT, LAMP_AT } from '../world/yard.js';
import { cabinetGroup } from '../game/cabinets.js';
import { torchArrays } from '../game/torch.js';
import { buildTape, buildCrowbar } from '../game/toolModels.js';
import { FIRETOWER, buildBinoculars } from '../world/expedition.js';
import { BOG_LANDMARKS, PLACES as BOG_PLACES, BOG } from '../world/bog.js';
import { buildDrowned } from '../game/drowned.js';

const BEAM = 12; // a kind past the palette: the faint light pillar over a shard

export function geometryFrom(arr) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr.pos, 3));
  g.setAttribute('data', new THREE.BufferAttribute(arr.dat, 4, true));
  g.computeBoundingSphere();
  return g;
}

function meshOf(b, mat) {
  const m = new THREE.Mesh(geometryFrom(b.toArrays()), mat);
  m.frustumCulled = false;
  return m;
}

// a monster rig: one mesh per body part, parented to its bone, so the game's animation code just works
function rigMeshes(rig, mat) {
  for (const p of rig.parts) {
    const m = new THREE.Mesh(geometryFrom(p.arr), mat);
    m.frustumCulled = false;
    p.node.add(m);
  }
  return rig.root;
}

// ---------------- creatures ----------------
// a stand-in for a Monster: exactly the fields the anim functions read
function puppet(rig, seed) {
  return { rig, state: 'idle', stateT: 0, speedCur: 0, phase: 0, seed, listenT: 0, headYaw: 0, playerDist: 9 };
}
function setState(m, st) {
  if (m.state !== st) {
    m.state = st;
    m.stateT = 0;
  }
}
// turn the head toward whoever is looking (the viewer) for a while after each echo
function attend(m, S, hold, k, max) {
  if (S.pinged) m.attendT = hold;
  m.attendT = Math.max(0, (m.attendT || 0) - S.dt);
  const want = m.attendT > 0 ? clamp(angleDiff(0, S.camAz), -max, max) : 0;
  m.headYaw = lerp(m.headYaw, want, 1 - Math.exp(-k * S.dt));
}

function listener(mat) {
  const rig = buildListener();
  const root = rigMeshes(rig, mat);
  const m = puppet(rig, 2.3);
  return {
    root, base: 0.3, view: { yaw: 0.55, pitch: 0.1 },
    poses: [() => { setState(m, 'hunt'); ANIMS.listener(m, 0, 0); }, () => { setState(m, 'idle'); ANIMS.listener(m, 0, 0); }],
    tick(S) {
      m.stateT += S.dt;
      // its sound: it sniffs the air (search), then the windup screech and the chase (hunt)
      if (S.react < 0.9) setState(m, 'search');
      else if (S.react < 3.4) setState(m, 'hunt');
      else setState(m, 'idle');
      if (S.react < 3.4) m.attendT = 1.2;
      m.listenT = m.state === 'idle' ? 1 : 0;
      attend(m, S, 2.6, 5, 0.9);
      ANIMS.listener(m, S.dt, S.t);
    },
  };
}

function crawler(mat) {
  const rig = buildCrawler();
  const root = rigMeshes(rig, mat);
  const m = puppet(rig, 4.1);
  return {
    root, base: 0.3, view: { yaw: 0.7, pitch: 0.19 },
    poses: [() => { setState(m, 'hunt'); ANIMS.crawler(m, 0, 0); }, () => { setState(m, 'idle'); ANIMS.crawler(m, 0, 0); }],
    tick(S) {
      m.stateT += S.dt;
      setState(m, S.react < 2.6 ? 'hunt' : 'idle');
      // never quite still: the legs keep testing the ground
      const shuffle = m.state === 'hunt' ? 0.9 : 0.22 + 0.18 * Math.max(0, Math.sin(S.t * 0.7));
      m.speedCur = lerp(m.speedCur, shuffle, 1 - Math.exp(-3 * S.dt));
      m.phase += S.dt * (m.state === 'hunt' ? 9 : 2.4);
      attend(m, S, 1.8, 14, 0.7); // it snaps toward a sound
      ANIMS.crawler(m, S.dt, S.t);
      if (m.state === 'search' || (m.attendT > 0 && m.state === 'idle')) rig.nodes.head.rotation.z = Math.sin(S.t * 3 + m.seed) * 0.35;
    },
  };
}

// it moves only while nothing lights it: between your echoes it creeps, and every echo finds it in a new pose
function watcher(mat) {
  const rig = buildWatcher();
  const root = rigMeshes(rig, mat);
  const m = puppet(rig, 7.3); // seed > 5: the head leans the wrong way
  let dark = 0; // time it has spent unseen
  return {
    root, base: 0.07, view: { yaw: 0.35, pitch: 0.06 },
    tick(S) {
      if (S.react >= 0 && S.react < S.dt * 1.5) dark += 2.6; // you made a sound: it took a step
      if (S.lit > 0.2) return; // frozen in the light
      dark += S.dt;
      const creep = 0.5 - 0.5 * Math.cos(dark * 0.33);
      m.playerDist = 15 - 11 * creep;
      m.headYaw = clamp(angleDiff(0, S.camAz), -1.2, 1.2) * creep;
      ANIMS.watcher(m, S.dt, dark * 1.6);
      // the arms rise toward you, a little more every time you look
      rig.nodes.shoulderL.rotation.x = -0.75 * creep;
      rig.nodes.shoulderR.rotation.x = -0.55 * creep - 0.1 * Math.sin(dark * 0.7);
      rig.nodes.spine.rotation.x = 0.12 + 0.2 * creep;
      rig.root.position.z = 0.35 * creep;
    },
  };
}

function howler(mat) {
  const rig = buildHowler();
  const root = rigMeshes(rig, mat);
  const m = puppet(rig, 5.5);
  let cycle = 3; // a silent howl every few breaths, so you know the pose
  const pose = (st, k) => { m.state = st; m.stateT = k; ANIMS.howler(m, 0, 0); };
  return {
    root, base: 0.3, view: { yaw: 0.7, pitch: 0.16 },
    // the frame has to hold it reared up mid-howl, not just on all fours
    poses: [() => pose('inhale', 1.8), () => pose('howl', 0.3), () => pose('howl', 1.0), () => pose('idle', 0)],
    tick(S) {
      cycle -= S.dt;
      if (S.react >= 0 && S.react < S.dt * 1.5) cycle = 0;
      if (cycle <= 0 && m.state !== 'inhale' && m.state !== 'howl') {
        setState(m, 'inhale');
        cycle = 11;
      }
      m.stateT += S.dt;
      if (m.state === 'inhale' && m.stateT >= 1.8) setState(m, 'howl');
      else if (m.state === 'howl' && m.stateT >= 2.0) setState(m, 'idle');
      attend(m, S, 2.2, 4, 0.7);
      ANIMS.howler(m, S.dt, S.t);
      // between howls it breathes like bellows
      if (m.state === 'idle') rig.nodes.chest.scale.setScalar(1 + Math.sin(S.t * 1.4) * 0.025);
    },
  };
}

// a man, and in no hurry: he walks his round with the lantern up. When his sound plays he
// comes and takes — first the stride, then the lean of a man hauling something by the arm
function angler(mat) {
  const rig = buildAngler();
  const root = rigMeshes(rig, mat);
  const m = puppet(rig, 3.7);
  const still = (st, spd, ph) => () => { setState(m, st); m.speedCur = spd; m.phase = ph; ANIMS.angler(m, 0, 0); };
  return {
    root, base: 0.3, view: { yaw: 0.6, pitch: 0.07 },
    poses: [still('hunt', 2.1, 0.9), still('tie', 0, 0)],
    tick(S) {
      m.stateT += S.dt;
      if (S.react < 2.5) setState(m, 'hunt');
      else if (S.react < 4.2) setState(m, 'haul');
      else setState(m, 'idle');
      const stride = m.state === 'hunt' ? 2.1 : m.state === 'haul' ? 1.15 : 0.55 + 0.3 * Math.max(0, Math.sin(S.t * 0.45));
      m.speedCur = lerp(m.speedCur, stride, 1 - Math.exp(-3 * S.dt));
      m.phase += S.dt * m.speedCur * 2.6;
      if (S.react < 4.2) m.attendT = 1.1; // he heard the page turn
      attend(m, S, 2.4, 4, 0.65);
      ANIMS.angler(m, S.dt, S.t);
    },
  };
}

// The Stray (3.0t): Дворняжка — her own body (game/strayBody.js), walking her slow round on her toes. Every few
// seconds she stops and smells the air; the page turn reaches her and she points her muzzle at the reader.
function stray(mat) {
  const rig = buildStrayBody();
  const root = rigMeshes(rig, mat);
  let speed = 0.9, look = 0, sniffT = 3, sniff = 0, t0 = 0;
  return {
    root, base: 0.0, view: { yaw: 0.55, pitch: 0.03 },
    poses: [() => { poseStray(rig, { t: 1.3, dt: 1, mode: 'follow', speed: 0.9 }); }],
    tick(S) {
      const attend = S.react < 5; // (she heard the page)
      sniffT -= S.dt;
      if (sniffT <= 0) { sniff = sniff ? 0 : 1; sniffT = sniff ? 1.6 : 3.4; }
      const stop = attend || sniff;
      speed = lerp(speed, stop ? 0 : 1.1, 1 - Math.exp(-3 * S.dt));
      look = lerp(look, attend ? 0.7 : Math.sin(S.t * 0.4) * 0.2, 1 - Math.exp(-(attend ? 8 : 2.5) * S.dt));
      t0 += S.dt;
      poseStray(rig, { t: t0, dt: S.dt, mode: 'follow', speed, sniff: stop ? 1 : 0, look });
    },
  };
}

function shade(mat) {
  const rig = buildShade();
  const root = rigMeshes(rig, mat);
  const n = rig.nodes;
  let tz = 0.3, tx = 0.1, look = 0;
  return {
    root, base: 0.1, view: { yaw: 0.2, pitch: 0.05 },
    tick(S) {
      // every echo finds its head at another angle. it never moves while you watch
      if (S.pinged) {
        tz = (Math.random() - 0.5) * 0.9;
        tx = (Math.random() - 0.5) * 0.4;
      }
      if (S.react >= 0 && S.react < 2.5) look = Math.min(1, look + S.dt * 6);
      else look = Math.max(0, look - S.dt * 0.8);
      if (S.lit < 0.2 || S.react < 2.5) {
        n.head.rotation.z = lerp(n.head.rotation.z, tz * (1 - look), 1 - Math.exp(-6 * S.dt));
        n.head.rotation.x = lerp(n.head.rotation.x, tx * (1 - look) + 0.15 * look, 1 - Math.exp(-6 * S.dt));
        n.head.rotation.y = clamp(angleDiff(0, S.camAz), -1.1, 1.1) * look;
        n.torso.rotation.z = Math.sin(S.t * 0.4) * 0.03;
      }
    },
  };
}

// ---------------- objects ----------------
function still(root, base = 0.3, view = {}, extra = {}) {
  return { root, base, view, tick() {}, ...extra };
}

// the generator, as it stands at every site; `lamp` = running, with its light on
function generator(mat, lamp) {
  const b = new MeshBuilder(4096);
  World.prototype.genProp.call({ addProp: (x, z, fn) => fn(b) }, { x: 0, y: 0, z: 0, yaw: 0 });
  const root = new THREE.Group();
  const mesh = meshOf(b, mat);
  root.add(mesh);
  return {
    root, base: 0.3, view: { yaw: -0.6, pitch: 0.2 },
    lamp: lamp ? { x: 0.78 + 0.42, y: 2.92, z: -0.32, r: 6 } : null,
    tick(S) {
      // a running engine shivers
      mesh.position.y = lamp ? Math.sin(S.t * 71) * 0.0035 : 0;
    },
  };
}

function corpse(mat) {
  const b = new MeshBuilder(2048);
  const P = placer(b, 0, 0, 0, 0);
  const reach = buildCorpse(b, P, new RNG(424242));
  buildToolBag(b, P, 1, 0.62, 0.5 + reach * 0.4);
  const root = new THREE.Group();
  root.add(meshOf(b, mat));
  // flies: a few specks circling over it
  const N = 9;
  const pos = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const flies = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9aa4a6, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.8, depthWrite: false }));
  flies.frustumCulled = false;
  root.add(flies);
  const ph = Array.from({ length: N }, (_, i) => [Math.random() * 6.28, 0.7 + Math.random() * 1.6, 0.12 + Math.random() * 0.3, Math.random() * 6.28]);
  return {
    root, base: 0.3, view: { yaw: 2.4, pitch: 0.55, fit: 0.86 },
    tick(S) {
      for (let i = 0; i < N; i++) {
        const [a, w, r, p] = ph[i];
        const t = S.t * w * 2.2 + a;
        pos[i * 3] = Math.cos(t) * r + Math.sin(S.t * 3.1 + p) * 0.04;
        pos[i * 3 + 1] = 0.32 + 0.12 * Math.sin(S.t * 1.7 * w + p) + 0.05 * Math.sin(S.t * 9 + i);
        pos[i * 3 + 2] = Math.sin(t * 1.3) * r * 0.8 + 0.05;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// --- the parts in the tool bags (the forest only ever shows you an amber bag) ---
function fuel(mat) {
  const b = new MeshBuilder(1024);
  const M = KIND.METAL, A = KIND.SHARD;
  b.place(0, 0, 0);
  b.box(0.17, 0.42, 0.34, M, { bottom: true });
  // the pressed X on both flanks
  b.identity();
  for (const x of [-0.088, 0.088]) {
    b.limb([x, 0.07, -0.13], [x, 0.35, 0.13], 0.006, 0.006, M, 3);
    b.limb([x, 0.07, 0.13], [x, 0.35, -0.13], 0.006, 0.006, M, 3);
  }
  // three-bar handle at the back
  for (const x of [-0.04, 0, 0.04]) {
    b.limb([x, 0.42, -0.15], [x, 0.485, -0.13], 0.01, 0.01, M, 4);
    b.limb([x, 0.485, -0.13], [x, 0.485, 0.0], 0.01, 0.01, M, 4);
    b.limb([x, 0.485, 0.0], [x, 0.42, 0.03], 0.01, 0.01, M, 4);
  }
  // the spout and its cap
  b.place(0, 0.405, 0.11, 0.55, 0, 0);
  b.cylinder(7, 0.03, 0.028, 0.06, A);
  b.place(0, 0.44, 0.145, 0.55, 0, 0);
  b.cylinder(7, 0.034, 0.034, 0.025, A);
  const root = new THREE.Group();
  root.add(meshOf(b, mat));
  return still(root, 0.32, { yaw: 0.9, pitch: 0.22 });
}

function plug(mat) {
  const b = new MeshBuilder(1024);
  const M = KIND.METAL, C = KIND.BONE, A = KIND.SHARD;
  b.identity();
  b.limb([0, 0, 0], [0, 0.006, 0], 0.0012, 0.0012, M, 4); // centre electrode
  b.limb([0.004, 0.0035, 0], [0.004, 0.009, 0], 0.0012, 0.0012, M, 4); // ground strap
  b.limb([0.004, 0.0035, 0], [0.0, 0.0035, 0], 0.0011, 0.0011, M, 4);
  b.place(0, 0.006, 0);
  b.cylinder(10, 0.0068, 0.0068, 0.019, M); // threads
  for (let i = 0; i < 6; i++) {
    b.place(0, 0.008 + i * 0.003, 0);
    b.cylinder(10, 0.0074, 0.0074, 0.0011, M, { capTop: false });
  }
  b.place(0, 0.025, 0);
  b.cylinder(10, 0.0085, 0.0085, 0.002, M); // the washer
  b.place(0, 0.027, 0);
  b.cylinder(6, 0.0105, 0.0105, 0.009, M); // the hex
  b.place(0, 0.036, 0);
  b.cylinder(10, 0.0068, 0.005, 0.036, C); // the porcelain
  for (let i = 0; i < 4; i++) {
    b.place(0, 0.05 + i * 0.0045, 0);
    b.cylinder(10, 0.0062 - i * 0.0002, 0.0062 - i * 0.0002, 0.0018, C, { capTop: false });
  }
  b.place(0, 0.072, 0);
  b.cylinder(8, 0.0026, 0.0026, 0.008, M);
  b.place(0, 0.08, 0);
  b.cylinder(8, 0.0042, 0.0038, 0.0055, A); // the terminal nut
  const root = new THREE.Group();
  const mesh = meshOf(b, mat);
  root.add(mesh);
  return still(root, 0.32, { yaw: 0.5, pitch: 0.18 });
}

function fuses(mat) {
  const b = new MeshBuilder(2048);
  const M = KIND.METAL, C = KIND.BONE, A = KIND.SHARD, F = KIND.FLESH;
  // a porcelain holder with three cartridges in their clips
  b.place(0, 0, 0);
  b.box(0.17, 0.022, 0.085, C, { bottom: true });
  const cart = (x, y, z, ry, burnt) => {
    b.place(x, y, z, 0, ry, Math.PI / 2);
    b.cylinder(8, 0.0085, 0.0085, 0.05, burnt ? F : A, { y0: -0.025, capBottom: true });
    for (const s of [-1, 1]) {
      b.place(x + Math.cos(ry) * s * 0.026, y, z - Math.sin(ry) * s * 0.026, 0, ry, Math.PI / 2);
      b.cylinder(8, 0.0092, 0.0092, 0.009, M, { y0: -0.0045, capBottom: true });
    }
  };
  for (let i = 0; i < 3; i++) {
    const z = -0.026 + i * 0.026;
    for (const s of [-1, 1]) {
      b.place(s * 0.026, 0.022, z);
      b.box(0.008, 0.016, 0.02, M, { bottom: true }); // spring clips
    }
    cart(0, 0.036, z, 0, false);
  }
  // and the one that blew, lying in front
  cart(0.02, 0.0092, 0.085, 0.5, true);
  const root = new THREE.Group();
  root.add(meshOf(b, mat));
  return still(root, 0.32, { yaw: 0.45, pitch: 0.42 });
}

function belt(mat) {
  const b = new MeshBuilder(2048);
  const W = KIND.WOOD, M = KIND.METAL;
  // a toothed V-belt loop around a pulley, the way it hangs off the hand that carries it
  const N = 40, ax = 0.2, ay = 0.13, cy = 0.15;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const tw = Math.sin(a * 2) * 0.012;
    pts.push([Math.cos(a) * ax, cy + Math.sin(a) * ay, tw]);
  }
  b.identity();
  for (let i = 0; i < N; i++) {
    const p = pts[i], q = pts[(i + 1) % N];
    b.limb(p, q, i % 2 ? 0.011 : 0.0135, i % 2 ? 0.011 : 0.0135, W, 4);
  }
  b.place(-0.07, cy - ay + 0.075, 0, Math.PI / 2, 0, 0);
  b.cylinder(10, 0.062, 0.062, 0.03, M, { y0: -0.015, capBottom: true });
  b.place(-0.07, cy - ay + 0.075, 0, Math.PI / 2, 0, 0);
  b.cylinder(6, 0.012, 0.012, 0.05, M, { y0: -0.025, capBottom: true });
  const root = new THREE.Group();
  root.add(meshOf(b, mat));
  return still(root, 0.32, { yaw: 0.3, pitch: 0.12 });
}

function battery(mat) {
  const b = new MeshBuilder(2048);
  const M = KIND.METAL, A = KIND.SHARD, F = KIND.FLESH, C = KIND.BONE, W = KIND.WOOD;
  b.place(0, 0, 0);
  b.box(0.25, 0.18, 0.17, M, { bottom: true });
  b.place(0, 0.18, 0);
  b.box(0.256, 0.02, 0.176, M, { bottom: true });
  for (const [x, k] of [[0.08, F], [-0.08, M]]) {
    b.place(x, 0.2, -0.045);
    b.cylinder(8, 0.012, 0.01, 0.024, k);
  }
  // + and − pressed into the lid
  b.identity();
  b.limb([0.045, 0.201, -0.045], [0.025, 0.201, -0.045], 0.0025, 0.0025, C, 3);
  b.limb([0.035, 0.201, -0.055], [0.035, 0.201, -0.035], 0.0025, 0.0025, C, 3);
  b.limb([-0.045, 0.201, -0.045], [-0.025, 0.201, -0.045], 0.0025, 0.0025, C, 3);
  // the carry strap
  b.limb([-0.12, 0.2, 0.03], [-0.07, 0.29, 0.03], 0.006, 0.006, W, 4);
  b.limb([-0.07, 0.29, 0.03], [0.07, 0.29, 0.03], 0.006, 0.006, W, 4);
  b.limb([0.07, 0.29, 0.03], [0.12, 0.2, 0.03], 0.006, 0.006, W, 4);
  // a cell cap row
  for (let i = 0; i < 6; i++) {
    b.place(-0.075 + i * 0.03, 0.2, 0.05);
    b.cylinder(6, 0.007, 0.007, 0.004, M);
  }
  // a clamp still on its cable, amber like everything you came for
  b.place(0.17, 0.012, 0.09, 0, 0.7, 0);
  b.box(0.05, 0.022, 0.024, A, { bottom: true });
  b.identity();
  b.limb([0.15, 0.015, 0.075], [0.2, 0.01, -0.06], 0.006, 0.006, F, 4);
  b.limb([0.2, 0.01, -0.06], [0.16, 0.006, -0.14], 0.006, 0.006, F, 4);
  const root = new THREE.Group();
  root.add(meshOf(b, mat));
  return still(root, 0.32, { yaw: 0.7, pitch: 0.3 });
}

function shard(mat) {
  const b = new MeshBuilder(512);
  b.identity();
  b.octa(0.2, 0.36, KIND.SHARD);
  b.place(0, 0, 0, 0, 0.6, 0);
  b.octa(0.12, 0.2, KIND.SHARD);
  b.identity();
  b.limb([0, 0.45, 0], [0, 1.9, 0], 0.012, 0.004, BEAM, 3);
  const root = new THREE.Group();
  const mesh = meshOf(b, mat);
  root.add(mesh);
  return {
    root, base: 0.3, view: { yaw: 0.4, pitch: 0.12, focus: [0, 0.6, 0], fit: 0.42 },
    tick(S) {
      mesh.rotation.y = S.t * 0.6;
      mesh.position.y = 0.52 + Math.sin(S.t * 1.3) * 0.05;
    },
  };
}

function stone(mat) {
  const b = new MeshBuilder(512);
  const r = new RNG(9001);
  b.place(0, 0.045, 0);
  b.rock(0.06, () => r.next(), KIND.ROCK, 0.35, 0.78);
  // a couple of pebbles that weren't good enough
  b.place(0.11, 0.015, 0.05, 0, 1, 0);
  b.rock(0.022, () => r.next(), KIND.ROCK, 0.4, 0.7);
  b.place(-0.09, 0.012, -0.07, 0, 2, 0);
  b.rock(0.017, () => r.next(), KIND.ROCK, 0.4, 0.7);
  const root = new THREE.Group();
  root.add(meshOf(b, mat));
  return still(root, 0.32, { yaw: 0.5, pitch: 0.42 });
}

// the flare gun and its two cartridges, as they lie by one of the bodies
function flare(mat) {
  const b = new MeshBuilder(1024);
  buildFlareGun(b, new THREE.Matrix4().makeRotationY(0.5));
  const root = new THREE.Group();
  root.add(meshOf(b, mat));
  return still(root, 0.32, { yaw: 0.55, pitch: 0.5 });
}

// a glow stick, cracked and glowing, and a spare one beside it
function glowstick(mat) {
  const b = new MeshBuilder(1024);
  const tube = (x, z, yaw, bend) => {
    // a plastic tube in two halves (bent a little where the vial snapped), a cap with a ring at one end
    b.place(x, 0.013, z, 0, yaw, Math.PI / 2);
    b.cylinder(8, 0.012, 0.012, 0.085, KIND.LEAF, { capBottom: true });
    b.cylinder(8, 0.0135, 0.0135, 0.012, KIND.ROCK, { y0: 0.085, capTop: true });
    b.limb([0, 0.097, 0], [0, 0.112, 0.006], 0.003, 0.003, KIND.METAL, 3);
    b.place(x, 0.013, z, bend, yaw, -Math.PI / 2);
    b.cylinder(8, 0.012, 0.012, 0.085, KIND.LEAF, { capBottom: true });
  };
  tube(0, 0, 0.35, 0.08);
  tube(0.03, 0.06, 0.62, 0);
  const root = new THREE.Group();
  root.add(meshOf(b, mat));
  return still(root, 0.32, { yaw: 0.5, pitch: 0.55 }, { lamp: { x: 0, y: 0.03, z: 0, r: 0.35, c: [0.5, 1.0, 0.62], core: 0xd8ffe0, halo: 0x60ff90, s: 0.1 } });
}

function flashlight(mat) {
  const root = new THREE.Group();
  const mesh = new THREE.Mesh(geometryFrom(torchArrays()), mat);
  mesh.position.y = 0.035;
  mesh.rotation.y = 0.35;
  root.add(mesh);
  return still(root, 0.35, { yaw: 1.1, pitch: 0.5 }, { lamp: { x: -0.04, y: 0.035, z: -0.14, r: 0.55, c: [1,0.93,0.8], core: 0xfff1cf, halo: 0xe6cc8e, s: 0.04 } });
}
function syringe(mat) { // the adrenaline dose: a glass barrel with red in it, chrome flange and plunger, a needle
  const root = new THREE.Group();
  const b = new MeshBuilder(256);
  // built standing on its needle (along +Y), then laid down on its side as it lies in the pack
  const R = 0.017, L = 0.13;
  b.place(0, 0.02, 0); b.cylinder(10, R, R, L, KIND.SHARD, { y0: 0 }); // the glass barrel
  b.place(0, 0.022, 0); b.cylinder(10, R * 0.86, R * 0.86, L * 0.42, KIND.EFFIGY, { y0: 0 }); // the dose in it
  b.place(0, 0.02 + L * 0.5, 0); b.box(0.062, 0.008, 0.03, KIND.SHARD); // the finger flange
  b.place(0, 0.02 + L * 0.62, 0); b.cylinder(6, 0.005, 0.005, 0.055, KIND.METAL, { y0: 0 }); // the plunger rod
  b.place(0, 0.02 + L * 0.62 + 0.055, 0); b.box(0.05, 0.008, 0.024, KIND.METAL); // its thumb pad
  b.place(0, 0.02, 0, Math.PI, 0, 0); b.cylinder(8, 0.009, 0.006, 0.022, KIND.METAL, { y0: 0 }); // the needle hub
  b.place(0, -0.004, 0, Math.PI, 0, 0); b.cylinder(6, 0.0045, 0.0022, 0.05, KIND.METAL, { y0: 0 }); // the needle (thin, but not a zero-area sliver)
  for (let i = 0; i < 4; i++) { // graduations down the barrel
    b.place(0.0172, 0.035 + i * 0.024, 0); b.box(0.004, 0.006, 0.014, KIND.BONE);
  }
  const mesh = new THREE.Mesh(geometryFrom(b.toArrays()), mat);
  mesh.rotation.x = Math.PI / 2; // lying along z, needle toward -z
  mesh.position.y = 0.03;
  root.add(mesh);
  return still(root, 0.14, { yaw: 0.9, pitch: 0.5 }, { lamp: { x: 0, y: 0.05, z: -0.09, r: 0.4, c: [1, 0.25, 0.2], core: 0xff6a55, halo: 0xb3271c, s: 0.03 } });
}
function fieldTool(build, view) {
  return (mat) => {
    const root = new THREE.Group(); root.add(meshOf(build(), mat));
    return still(root, 0.34, view);
  };
}

// ---------------- places ----------------
// the landmark builders run against a stand-in world: flat ground, no colliders. Drawing the first five
// landmarks in order with the forest's own seed reproduces exactly the random bits you meet in the game.
let _places = null;
function placeGeometry(id, world) {
  if (!_places) {
    _places = {};
    const rng = new RNG(world ? world.seed : 1337);
    for (const L of [...LANDMARKS.slice(0, 5), ...['medhut', 'firetower', 'zarya', 'sovkhoz'].map((id) => LANDMARKS.find((l) => l.id === id))]) {
      const kind = L.id.replace(/\d+$/, '');
      const props = [];
      const fake = {
        terrain: { height: () => 0, flats: [] }, col: { add() {}, circle() {} }, addProp: (x, z, fn) => props.push(fn), spawn: null, lake: null, effigies: [], doors: [],
        genProp: World.prototype.genProp,
        cabinets: [], addCabinet(id, kind, x, y, z, yaw) { this.cabinets.push({ kind, x, y, z, yaw }); },
      };
      World.prototype['lm_' + kind].call(fake, { ...L, x: 0, z: 0 }, rng);
      _places[L.id] = props;
      props.doors = fake.doors;
      props.cabinets = fake.cabinets; // (its cupboards, shut)
      props.hut = fake.medhut; // (the first-aid hut: where its lantern hangs)
      props.lookout = fake.firetower;
    }
  }
  const b = new MeshBuilder(16384);
  for (const fn of _places[id]) {
    b.identity();
    fn(b);
  }
  // its generator and the body beside it, where the game put them (needs the real world for their spots)
  const L = LANDMARKS.find((l) => l.id === id);
  const site = world && world.sites ? world.sites.find((s) => s.id === id) : null;
  if (site && L) {
    const ly = world.terrain.height(L.x, L.z);
    World.prototype.genProp.call({ addProp: (x, z, fn) => fn(b) }, { x: site.x - L.x, y: site.y - ly, z: site.z - L.z, yaw: site.yaw });
    const c = site.corpse;
    const P = placer(b, c.x - L.x, world.terrain.height(c.x, c.z) - ly, c.z - L.z, c.yaw);
    const reach = buildCorpse(b, P, new RNG(c.seed));
    buildToolBag(b, P, 0, 0.62, 0.5 + reach * 0.4);
  }
  return b;
}

function place(id, view) {
  return (mat, ctx) => {
    const root = new THREE.Group();
    root.add(meshOf(placeGeometry(id, ctx.world), mat));
    // a cabin's door hangs on its own hinges — drawn ajar, the way you find it at night in your worst guess
    for (const d of _places[id].doors || []) {
      const b = new MeshBuilder(512);
      buildDoorLeaf(b, d.w, d.h);
      const leaf = meshOf(b, mat);
      const c = Math.cos(d.ry), s = Math.sin(d.ry);
      leaf.position.set(d.x + d.hx * c + d.hz * s, d.y, d.z - d.hx * s + d.hz * c);
      leaf.rotation.y = d.ry + 0.7;
      root.add(leaf);
    }
    for (const c of _places[id].cabinets || []) {
      const { group, D } = cabinetGroup(c.kind, mat);
      group.position.set(c.x, c.y + (D.lift || 0), c.z);
      group.rotation.y = c.yaw;
      root.add(group);
    }
    if (_places[id].lookout) {
      const optic = meshOf(buildBinoculars(), mat);
      optic.position.set(0, FIRETOWER.deck + 1.32, -0.7);
      root.add(optic);
    }
    // the first-aid hut's lantern still burns
    const hut = _places[id].hut;
    const extra = hut ? { lamp: { x: hut.lamp.x, y: hut.lamp.y, z: hut.lamp.z, r: 5, s: 0.35 } } : {};
    return still(root, 0.3, view, extra);
  };
}

// ---------------- the way out ----------------
// the УАЗ as you find it in the yard: a front wheel gone (its hub on a stump), the hood up over an empty bay
function uazRoot(mat, stripped = true) {
  const C = buildForestCar();
  const car = new THREE.Group();
  const m = (arr, parent = car) => {
    const x = new THREE.Mesh(geometryFrom(arr), mat);
    x.frustumCulled = false;
    parent.add(x);
    return x;
  };
  m(C.body);
  const wg = geometryFrom(C.wheel);
  WHEELS.forEach(([x, y, z], i) => {
    if (stripped && i === MISSING) return;
    const w = new THREE.Mesh(wg, mat);
    w.frustumCulled = false;
    w.position.set(x, y, z);
    w.rotation.set(Math.PI / 2, 0, 0);
    car.add(w);
  });
  const hood = new THREE.Group();
  hood.position.set(...HOOD_HINGE);
  hood.rotation.z = stripped ? HOOD_OPEN : 0;
  car.add(hood);
  m(C.hood, hood);
  const st = m(C.steering);
  st.position.set(-0.42, 1.24, 0.42);
  st.rotation.set(0, 0, -0.45);
  return car;
}

function uaz(mat) {
  const root = new THREE.Group();
  root.add(uazRoot(mat, true));
  return still(root, 0.3, { yaw: 2.35, pitch: 0.3, fit: 0.86, focus: [-0.2, 0.8, 0] });
}

// one of the four parts, resting the way it lies on the ground
function carPart(key, view) {
  return (mat) => {
    const def = PARTS.find((p) => p.key === key);
    const b = buildPart(key);
    const mesh = meshOf(b, mat);
    mesh.position.y = def.half[1];
    const root = new THREE.Group();
    root.add(mesh);
    return still(root, 0.32, view);
  };
}

// the yard itself: its fence and booth on a flat patch, the gate half open, the back gate chained, the car
function yard(mat) {
  const props = [];
  const fake = {
    terrain: { height: () => 0, rawHeight: () => 0 },
    col: { add() { return 0; }, circle() { return 0; }, addDynamic() { return 0; }, setSeg() {} },
    addProp: (x, z, fn) => props.push(fn),
  };
  buildYard(fake, { x: 0, z: 0 });
  const b = new MeshBuilder(65536);
  for (const fn of props) {
    b.identity();
    fn(b);
  }
  const root = new THREE.Group();
  root.add(meshOf(b, mat));
  const gb = new MeshBuilder(4096);
  buildGateLeaf(gb);
  const gate = meshOf(gb, mat);
  gate.position.set(GATE.x0 + GATE.travel * 0.55, 0, GATE.z);
  root.add(gate);
  for (const [lock, s] of [[false, -1], [true, 1]]) {
    const lb = new MeshBuilder(2048);
    buildBackLeaf(lb, lock);
    const leaf = meshOf(lb, mat);
    leaf.position.set(s * BACK.half, 0, BACK.z);
    leaf.rotation.y = s < 0 ? 0 : Math.PI;
    root.add(leaf);
  }
  const car = uazRoot(mat, true);
  car.position.set(CAR_AT.x, 0.08, CAR_AT.z);
  car.rotation.y = Math.PI / 2;
  root.add(car);
  const a = Math.atan2(CAR_AT.x - LAMP_AT.x, CAR_AT.z - LAMP_AT.z);
  return still(root, 0.3, { yaw: 0.75, pitch: 0.62, fit: 0.98 }, { lamp: { x: LAMP_AT.x + Math.sin(a) * 0.3, y: LAMP_AT.h - 0.35, z: LAMP_AT.z + Math.cos(a) * 0.3, r: 12, s: 0.6 } });
}

// the шкафандр: a wardrobe with its doors thrown open on what it really is — the throat, the teeth, the rollers
function shkaf(mat) {
  const { group, doors, rollers, D } = cabinetGroup('wardrobe', mat, { open: 1.45, machine: true });
  const root = new THREE.Group();
  root.add(group);
  let chomp = 0;
  return {
    root, base: 0.3, view: { yaw: 0.42, pitch: 0.14, fit: 0.92, focus: [0, 0.95, 0] },
    lamp: { x: 0, y: D.h * 0.55, z: 0.02, r: 3.2, c: [1.0, 0.24, 0.1], core: 0xff8a70, halo: 0xff3020, s: 0.18 },
    tick(S) {
      // after its sound: it feeds (the rollers race, the doors chew); otherwise it idles, and waits
      if (S.react >= 1.9 && S.react < 4.6) chomp = Math.min(1, chomp + S.dt * 5);
      else chomp = Math.max(0, chomp - S.dt * 1.5);
      const sp = 0.8 + chomp * 8;
      rollers.forEach((r, i) => (r.rotation.y += (i ? -1 : 1) * S.dt * sp));
      for (const d of doors) d.pivot.rotation.y = d.side * (1.45 - chomp * (0.35 + 0.3 * Math.sin(S.t * 8.5 + d.side)));
    },
  };
}

// ---------------- registry ----------------

// ---------------- the bog (chapter V) ----------------
// Everything here lives on the second участок and nowhere else: the drowned forest, the dwarf pines, the reeds,
// the топь, the pumps and the winch. The portraits are built from the same primitives the level itself uses, so
// a page in the book looks like the thing that will kill you at night.

// a small still life out of a bare builder
function specimen(build, view = {}, base = 0.3) {
  return (mat) => {
    const b = new MeshBuilder(2048);
    b.identity();
    build(b);
    const root = new THREE.Group();
    root.add(meshOf(b, mat));
    return still(root, base, view);
  };
}

// a place from the bog, drawn with its own builder: flat stand-in ground, no colliders, the same seed
function bogPlace(id, view = {}) {
  return (mat) => {
    const L = BOG_LANDMARKS.find((l) => l.id === id);
    const props = [];
    const fake = {
      terrain: { height: () => 0 }, col: { add() {}, circle() {} },
      addProp: (x, z, fn) => props.push(fn),
    };
    BOG_PLACES[id](fake, { ...L, x: 0, z: 0 }, new RNG(BOG.seed));
    const b = new MeshBuilder(16384);
    for (const fn of props) {
      b.identity();
      fn(b);
    }
    const root = new THREE.Group();
    root.add(meshOf(b, mat));
    return still(root, 0.26, view);
  };
}

// the drowned forest: a snapped trunk standing in the water, two gaunt limbs, a root flare in the mud
const deadTree = specimen((b) => {
  b.limb([0, -0.55, 0], [0, 0.35, 0], 0.42, 0.28, KIND.BARK, 6); // the flare
  b.limb([0, 0.3, 0], [0.08, 2.2, 0], 0.27, 0.17, KIND.BARK, 6);
  b.limb([0.08, 2.2, 0], [0.35, 4.5, 0.15], 0.17, 0.07, KIND.BARK, 5);
  b.limb([0.1, 2.9, 0], [1.5, 3.7, 0.5], 0.09, 0.02, KIND.BARK, 4);
  b.limb([0.12, 3.4, 0], [-1.2, 4.2, -0.4], 0.075, 0.02, KIND.BARK, 4);
  b.place(0, -0.5, 0);
  b.cylinder(10, 1.35, 1.2, 0.08, KIND.WATER, { capTop: false });
}, { yaw: 0.7, pitch: 0.26, fit: 0.95 }, 0.34);

// a dwarf pine: bent trunk, three squashed skirts of needles
const dwarfPine = specimen((b) => {
  b.limb([0, -0.1, 0], [0.1, 1.5, 0.05], 0.14, 0.1, KIND.BARK, 5);
  b.limb([0.1, 1.5, 0.05], [0.32, 2.9, 0.1], 0.1, 0.045, KIND.BARK, 4);
  const tiers = [[0.5, 1.0, 0.75], [1.05, 0.8, 0.7], [1.65, 0.58, 0.62], [2.2, 0.34, 0.5]];
  for (const [y, r, h] of tiers) {
    b.place(0.1, y, 0.04, 0, r * 3, 0);
    b.cone(7, r, h, KIND.LEAF, { y0: 0, hideRibs: true });
  }
}, { yaw: 0.9, pitch: 0.3, fit: 0.95 }, 0.3);

// willow scrub: whippy stems leaning out of the peat, a head of leaves on each
const willow = specimen((b) => {
  for (let i = 0; i < 6; i++) {
    b.identity();
    const a = (i / 6) * Math.PI * 2 + 0.4, lean = 0.45 + (i % 3) * 0.12, h = 1.5 + (i % 4) * 0.22;
    const tx = Math.cos(a) * lean, tz = Math.sin(a) * lean;
    b.limb([0, 0, 0], [tx, h, tz], 0.045, 0.016, KIND.BARK, 4);
    b.place(tx, h, tz, 0, a, 0.4, 1.9, 1.3, 1.9);
    b.rock(0.26, () => (i % 2 ? 0.6 : 0.4), KIND.LEAF, 0.45, 0.9);
  }
}, { yaw: 0.5, pitch: 0.34, fit: 0.9 }, 0.3);

// reeds: the palisade at the shore, a dozen blades out of one clump
const reeds = specimen((b) => {
  for (let i = 0; i < 14; i++) {
    b.identity();
    const a = (i / 14) * Math.PI * 2, r = (i % 4) * 0.1;
    const x = Math.cos(a) * r, z = Math.sin(a) * r, h = 1.1 + (i % 5) * 0.22;
    b.limb([x, -0.1, z], [x + Math.cos(a) * 0.14, h, z + Math.sin(a) * 0.14], 0.022, 0.006, KIND.LEAF, 3);
  }
}, { yaw: 0.35, pitch: 0.24, fit: 0.95 }, 0.3);

// a tussock: the hummock of peat every metre of a bog is made of, with its blades
const tussock = specimen((b) => {
  b.place(0, -0.16, 0, 0, 0.4, 0, 1, 0.55, 1);
  b.rock(0.62, () => 0.5, KIND.GROUND, 0.32, 0.5);
  for (let i = 0; i < 9; i++) {
    b.identity();
    const a = (i / 9) * Math.PI * 2, lean = 0.22 + (i % 3) * 0.12;
    b.limb([0, 0.16, 0], [Math.cos(a) * lean, 0.62 + (i % 4) * 0.12, Math.sin(a) * lean], 0.026, 0.005, KIND.LEAF, 3);
  }
}, { yaw: 0.6, pitch: 0.42, fit: 0.9 }, 0.3);

// cotton grass: thin stems, a white tuft on every one — what makes a raised bog white in June
const cottonGrass = specimen((b) => {
  for (let i = 0; i < 9; i++) {
    b.identity();
    const a = (i / 9) * Math.PI * 2, r = 0.12 + (i % 3) * 0.1, h = 0.5 + (i % 4) * 0.1;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    b.limb([x, 0, z], [x, h, z], 0.009, 0.007, KIND.LEAF, 3);
    b.place(x, h, z, 0, 0, 0.5, 1.6, 1, 1.6);
    b.rock(0.06, () => 0.5, KIND.BONE, 0.45, 0.9);
  }
}, { yaw: 0.4, pitch: 0.3, fit: 0.95 }, 0.32);

// the топь: a hole in the peat. A boot goes in and does not come out; a hand is already out of sight
const sink = specimen((b) => {
  b.place(0, -0.02, 0, 0, 0, 0, 1, 0.14, 1);
  b.rock(1.5, () => 0.35, KIND.GROUND, 0.22, 0.16); // the wet patch
  b.place(0, 0, 0, 0, 0, 0, 1, 0.05, 1);
  b.rock(0.62, () => 0.7, KIND.WATER, 0.5, 0.2); // the hole itself
  // the leg, going in at an angle, boot and all
  b.place(0.16, 0.0, 0.18, 0, 0.5, 0.9);
  b.limb([0, 0, 0], [0, 0.62, 0], 0.09, 0.11, KIND.WOOD, 5);
  b.place(0.0, 0.6, 0.0, 0, 0.5, 0.9);
  b.box(0.16, 0.14, 0.3, KIND.BARK);
  // and a hand, three fingers above the surface, the rest under it
  b.place(-0.5, 0.02, -0.35, 0.3, 1.1, 0.2);
  b.limb([0, 0, 0], [0, 0.2, 0], 0.05, 0.045, KIND.FLESH, 4);
  for (let i = 0; i < 3; i++) {
    b.place(-0.02 + i * 0.04, 0.18, 0, 0, 0, 0.3);
    b.limb([0, 0, 0], [0, 0.13, 0.02], 0.016, 0.012, KIND.BONE, 3);
  }
}, { yaw: 0.5, pitch: 0.55, fit: 0.82 }, 0.28);

// the гать: a plank road with its edge boards and a pair of posts, three metres wide
const plank = specimen((b) => {
  for (let i = 0; i < 7; i++) {
    const x0 = -3.2 + i * 0.92;
    b.place(0, 0, 0);
    b.quadN([x0, 0.34, -1.5], [x0 + 0.86, 0.34, -1.5], [x0 + 0.86, 0.34, 1.5], [x0, 0.34, 1.5], [0, 1, 0], KIND.WOOD, 15);
    b.tri([x0, 0.34, 1.5], [x0 + 0.86, 0.34, 1.5], [x0 + 0.86, 0.22, 1.5], KIND.WOOD, 6);
    b.tri([x0, 0.34, -1.5], [x0 + 0.86, 0.34, -1.5], [x0 + 0.86, 0.22, -1.5], KIND.WOOD, 6);
  }
  for (const x of [-2.6, 0, 2.6]) {
    for (const z of [-1.3, 1.3]) {
      b.limb([x, 0.3, z], [x, -0.7, z], 0.08, 0.08, KIND.WOOD, 4);
    }
  }
  b.limb([2.6, 0.3, 1.3], [2.6, 1.3, 1.3], 0.05, 0.045, KIND.WOOD, 4);
}, { yaw: 0.7, pitch: 0.42, fit: 0.95 }, 0.3);

// a pump: two columns, a head, a flywheel, and the rising main running off into the bog
const pump = specimen((b) => {
  b.box(1.5, 0.16, 1.1, KIND.METAL, { bottom: true });
  for (const x of [-0.34, 0.34]) {
    b.place(x, 0.16, 0);
    b.cylinder(6, 0.16, 0.13, 1.15, KIND.METAL);
  }
  b.place(0, 1.3, 0);
  b.box(1.15, 0.34, 0.5, KIND.METAL, { bottom: true });
  b.place(-0.62, 1.34, 0, 0, 0, -0.55);
  b.limb([0, 0, 0], [0, 1.5, 0], 0.055, 0.05, KIND.METAL, 4);
  b.place(0.62, 1.36, 0.28, 0, 0, Math.PI / 2);
  b.cylinder(12, 0.36, 0.36, 0.1, KIND.METAL);
  b.place(0, 1.32, -0.25);
  b.limb([0, 0, 0], [0, 0.9, 0], 0.1, 0.1, KIND.METAL, 5);
  b.limb([0, 0.9, 0], [0, 0.9, -1.7], 0.1, 0.1, KIND.METAL, 5);
  b.limb([0, 0.9, -1.7], [0, -0.35, -1.7], 0.1, 0.1, KIND.METAL, 5);
  b.place(-0.95, 0.16, 0.5);
  b.limb([0, 0, 0], [0, 0.85, 0], 0.05, 0.045, KIND.METAL, 4);
  b.place(0, 0.85, 0, 0, 0, Math.PI / 2);
  b.cylinder(10, 0.18, 0.18, 0.06, KIND.METAL);
}, { yaw: 0.75, pitch: 0.36, fit: 0.92 }, 0.32);

// the winch: the nose of the УАЗ, the drum, and the cable run out to a leaning post
const winch = specimen((b) => {
  b.place(0, 0.4, 1.4);
  b.box(1.86, 0.72, 2.6, KIND.METAL);
  b.place(0, 0.8, 0.4);
  b.box(1.7, 0.62, 1.6, KIND.LEAF);
  for (const x of [-0.95, 0.95]) {
    b.place(x, 0.36, -0.4, 0, 0, Math.PI / 2);
    b.cylinder(10, 0.36, 0.36, 0.26, KIND.BARK);
  }
  b.place(0, 0.46, -1.1, 0, 0, Math.PI / 2);
  b.cylinder(8, 0.16, 0.16, 0.42, KIND.METAL);
  b.limb([0, 0.3, -1.4], [0, 0.25, -3.4], 0.03, 0.03, KIND.METAL, 3);
  b.place(-3.4, 0, -0.6, 0.14, 0.6, 0.1);
  b.limb([0, 0, 0], [0, 2.6, 0], 0.15, 0.12, KIND.WOOD, 5);
  b.place(0, 2.2, 0);
  b.box(0.9, 0.12, 0.12, KIND.WOOD);
}, { yaw: 0.9, pitch: 0.3, fit: 0.95 }, 0.32);

// the Дrowned: it hangs just under the surface and lets the water move it
function drowned(mat) {
  const rig = buildDrowned();
  const root = rigMeshes(rig, mat);
  const n = rig.nodes;
  return {
    root, base: 0.24, view: { yaw: 0.45, pitch: 0.12 },
    tick(S) {
      if (!n.hips) return;
      n.hips.position.y = 0.62 + Math.sin(S.t * 0.85) * 0.03;
      n.spine.rotation.x = Math.sin(S.t * 0.6) * 0.04 - 0.05;
      n.spine.rotation.z = Math.sin(S.t * 0.45 + 1) * 0.05;
      const want = S.react < 4 ? clamp(angleDiff(0, S.camAz), -1, 1) : 0;
      n.head.rotation.y = lerp(n.head.rotation.y, want, 1 - Math.exp(-4 * S.dt));
      n.head.rotation.x = -0.15;
      for (const [k, s] of [['armL', 1], ['armR', -1]]) {
        if (!n[k]) continue;
        n[k].rotation.x = -0.12 + Math.sin(S.t * 0.7 + s) * 0.06;
        n[k].rotation.z = s * 0.08;
      }
    },
  };
}

// the Гнус: a cloud of specks the size of a room. In an echo it is a swarm, never a shape
function gnat(mat) {
  const root = new THREE.Group();
  const cloud = [];
  const rng = new RNG(4242);
  for (let i = 0; i < 30; i++) {
    const b = new MeshBuilder(32);
    b.identity();
    b.octa(0.1, 1, KIND.BARK);
    const m = meshOf(b, mat);
    const a = rng.float(0, 6.28), d = 0.2 + rng.float(0, 1.1), y = 0.2 + rng.float(0, 1.5);
    m.position.set(Math.cos(a) * d, y, Math.sin(a) * d);
    m.rotation.set(rng.float(0, 3), rng.float(0, 3), rng.float(0, 3));
    root.add(m);
    cloud.push({ m, a, d, y, ph: rng.float(0, 6.28), sp: 0.4 + rng.float(0, 0.5) });
  }
  return {
    root, base: 0.22, view: { yaw: 0.3, pitch: 0.05, fit: 0.9 },
    tick(S) {
      for (const c of cloud) {
        const a = c.a + S.t * c.sp;
        c.m.position.set(Math.cos(a) * c.d, c.y + Math.sin(S.t * 1.7 + c.ph) * 0.12, Math.sin(a) * c.d);
      }
    },
  };
}

const MODELS = {
  listener, crawler, watcher, howler, angler, shkaf, shade, stray,
  generator: (mat) => generator(mat, true),
  corpse, fuel, plug, fuses, belt, battery, shard, stone, flare, glowstick, flashlight,
  syringe,
  tape: fieldTool(buildTape, { yaw: 0.6, pitch: 0.35 }),
  crowbar: fieldTool(buildCrowbar, { yaw: 0.65, pitch: 0.65 }),
  binoculars: fieldTool(buildBinoculars, { yaw: 0.65, pitch: 0.4 }),
  firetower: place('firetower', { yaw: 0.55, pitch: 0.12, fit: 1.1, focus: [0, 10, 0] }),
  zarya: place('zarya', { yaw: 0.3, pitch: 0.7, fit: 0.95 }),
  sovkhoz: place('sovkhoz', { yaw: 0.8, pitch: 0.32, fit: 0.72 }),
  camp: place('camp', { yaw: 2.6, pitch: 0.62, fit: 0.78 }),
  medhut: place('medhut', { yaw: 3.75, pitch: 0.26, fit: 0.66, focus: [0, 1.5, 0] }),
  cabin: place('cabin', { yaw: 0.9, pitch: 0.34, fit: 0.95 }),
  tower: place('tower', { yaw: 0.6, pitch: 0.16, fit: 1.0 }),
  stones: place('stones', { yaw: 0.4, pitch: 0.5, fit: 0.92 }),
  wreck: place('wreck', { yaw: 1.9, pitch: 0.42, fit: 0.5, focus: [0, 1.0, 0] }),
  yard, uaz,
  wheel: carPart('wheel', { yaw: 0.6, pitch: 0.55 }),
  carbattery: carPart('battery', { yaw: 0.8, pitch: 0.3 }),
  carb: carPart('carb', { yaw: 0.9, pitch: 0.35 }),
  jerrycan: carPart('can', { yaw: 1.1, pitch: 0.2 }),
  // chapter V: the bog
  drowned, gnat, deadtree: deadTree, dwarfpine: dwarfPine, willow, reeds, tussock, cottongrass: cottonGrass,
  sink, plank, pump, winch,
  pumpshed: bogPlace('pumpstation', { yaw: 0.8, pitch: 0.28, fit: 0.85 }),
  barracks: bogPlace('barracks', { yaw: 2.3, pitch: 0.3, fit: 0.9 }),
  peatstacks: bogPlace('stacks', { yaw: 0.6, pitch: 0.42, fit: 0.9 }),
};

export function buildModel(key, mat, ctx = {}) {
  const make = MODELS[key];
  if (!make) return null;
  const m = make(mat, ctx);
  m.key = key;
  return m;
}
