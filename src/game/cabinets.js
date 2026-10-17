// Cupboards in the buildings: a wardrobe and a low cupboard in each hunting cabin, the first-aid cabinet on the
// wall of the scouts' hut, a tool locker in the forestry yard. E opens one; inside there may be nothing — or up
// to three things worth having: a glow stick, a handful of nuts to throw, an amber shard, a flare cartridge.
//
// And very rarely one of the big ones isn't a cupboard. The шкафандр is a machine that waits: whoever opens it
// is caught by the rollers and dragged in. Fifteen seconds. One or two friends can grab a hand (E) and pull —
// on the beat: a key comes down the track, press it as it hits the line. Two of you, one hand each: you have to
// pull on the same beat, or you're only tearing at each other. Alone in the forest, you can only fight it
// yourself — and that rarely works. Whatever happens, it never works again.
//
// Co-op: anyone opens / takes ('co' / 'ct'); whoever opens the шкафандр says so ('zs'). The host judges: who
// holds which hand ('zg' → 'zh'), every beat (each player times their own presses against their own clock and
// reports the beat they hit: 'zp' → 'zb' — "the same beat" survives network lag), and the end ('zr' / 'zd').
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { t } from '../core/i18n.js';
import { RNG, clamp, lerp, smoothstep, damp } from '../core/rng.js';
import { MeshBuilder, KIND } from '../world/builder.js';
import { CABINET_DIMS } from '../world/world.js';
import { GK, boxAt } from '../ui/garageSet.js';
import { geometryOf } from './uaz.js';
import { createPersonMaterial } from '../render/people.js';
import { dyeColors, poseGrabbed, poseRescuer, poseSprawled } from './survivor.js';
import { myFit } from './outfit.js';

const PI = Math.PI;
export const TRAP = { time: 15, lead: 1.4, period: 0.74, window: 0.17, perfect: 0.075, grace: 0.34 };
// how much one beat pulls (progress 1 = out)
const PULL = { sync: 0.27, syncPerfect: 0.05, off: 0.05, single: 0.125, singlePerfect: 0.03, miss: -0.03, victim: 0.035, self: 0.075 };
const DIRS = ['U', 'L', 'D', 'R'];
export const KEY_LABEL = { U: 'W', L: 'A', D: 'S', R: 'D' };
const OPEN_R = 1.7;
const GRAB_R = 2.4;
const MIMIC_CHANCE = 0.3;
const ITEMS = ['glow', 'nuts', 'shard', 'flare', 'battery'];
const ITEM_W = [0.27, 0.27, 0.22, 0.12, 0.12];
const RES = { NONE: 0, PULL: 1, SYNC: 2, OFF: 3, STRUGGLE: 4, PERFECT: 5 };
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _u = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);

// a stable pseudo-random key for beat k of trap seed s
const keyFor = (seed, k) => DIRS[(Math.imul((seed ^ (k * 2654435761)) >>> 0, 1103515245) >>> 28) & 3];

// ---------------- models (cabinet-local: floor at y = 0, centred, front at z = +d/2) ----------------
function shell(b, D, mat, plinth = KIND.BARK) {
  const { w, h, d } = D, T = 0.03;
  for (const s of [-1, 1]) boxAt(b, s * (w / 2 - T / 2), h / 2, 0, T, h, d, mat);
  boxAt(b, 0, h / 2, -d / 2 + T / 2, w - 2 * T, h, T, mat);
  boxAt(b, 0, h - T / 2, 0, w, T, d, mat);
  boxAt(b, 0, 0.06, 0, w - 2 * T, 0.03, d - T, mat);
  if (plinth !== null) boxAt(b, 0, 0.025, 0.01, w - 0.06, 0.05, d - 0.06, plinth);
}

function bodyOf(kind, D) {
  const b = new MeshBuilder(1024);
  if (kind === 'wardrobe') {
    shell(b, D, KIND.WOOD);
    boxAt(b, 0, D.h + 0.025, 0.01, D.w + 0.07, 0.05, D.d + 0.05, KIND.WOOD); // cornice
    boxAt(b, 0, D.h + 0.07, 0.0, D.w + 0.02, 0.04, D.d + 0.0, KIND.WOOD);
  } else if (kind === 'cupboard') {
    shell(b, D, KIND.WOOD);
    boxAt(b, 0, D.h + 0.015, 0.02, D.w + 0.06, 0.03, D.d + 0.05, KIND.WOOD); // its top board
  } else if (kind === 'firstaid') {
    shell(b, D, KIND.BONE, null);
  } else {
    shell(b, D, GK.GATE, GK.DARK);
    for (let i = 0; i < 3; i++) boxAt(b, -D.w / 2 + 0.004, 0.4 + i * 0.5, 0, 0.012, 0.02, D.d - 0.08, GK.DARK); // ribs on its side
  }
  return b.toArrays();
}

function shelvesOf(kind, D) {
  const b = new MeshBuilder(256);
  for (const y of SHELF_Y[kind]) if (y > 0.1) boxAt(b, 0, y - 0.012, 0, D.w - 0.07, 0.024, D.d - 0.06, kind === 'locker' ? GK.GATE : kind === 'firstaid' ? KIND.BONE : KIND.WOOD);
  if (kind === 'wardrobe') {
    b.place(0, 1.78, 0.02, 0, 0, PI / 2);
    b.cylinder(5, 0.012, 0.012, D.w - 0.08, GK.CHROME, { y0: -(D.w - 0.08) / 2 }); // a rail with two empty hangers
    for (const x of [-0.18, 0.12]) {
      b.identity();
      b.limb([x - 0.16, 1.62, 0.02], [x, 1.71, 0.02], 0.006, 0.006, GK.CHROME, 3);
      b.limb([x, 1.71, 0.02], [x + 0.16, 1.62, 0.02], 0.006, 0.006, GK.CHROME, 3);
      b.limb([x, 1.71, 0.02], [x, 1.78, 0.02], 0.005, 0.005, GK.CHROME, 3);
    }
  }
  return b.toArrays();
}
// where things sit (y of each shelf, the floor of the cupboard counting) and the x of the slots
const SHELF_Y = { wardrobe: [0.075, 0.6, 1.12], cupboard: [0.075, 0.45, 0.45], firstaid: [0.045, 0.37, 0.37], locker: [0.075, 0.62, 1.25] };
const SLOT_X = { wardrobe: [0.12, -0.15, 0.1], cupboard: [-0.18, -0.12, 0.2], firstaid: [0.0, -0.14, 0.13], locker: [0.05, -0.12, 0.1] };

// a door leaf, hinge at the origin, the leaf running toward +x (sx = +1) or −x (sx = −1), its face at z = 0
function leafOf(kind, D, wLeaf, sx) {
  const b = new MeshBuilder(256);
  const h = kind === 'firstaid' ? D.h - 0.02 : D.h - 0.13;
  const y0 = kind === 'firstaid' ? 0.01 : 0.1;
  const mat = kind === 'firstaid' ? KIND.BONE : kind === 'locker' ? GK.GATE : KIND.WOOD;
  boxAt(b, sx * wLeaf / 2, y0 + h / 2, -0.012, wLeaf - 0.006, h, 0.024, mat);
  if (kind === 'wardrobe' || kind === 'cupboard') {
    // a raised panel, a little knob by the free edge
    boxAt(b, sx * wLeaf / 2, y0 + h * 0.62, 0.004, wLeaf - 0.12, h * 0.42, 0.012, mat);
    if (kind === 'wardrobe') boxAt(b, sx * wLeaf / 2, y0 + h * 0.22, 0.004, wLeaf - 0.12, h * 0.25, 0.012, mat);
    b.place(sx * (wLeaf - 0.06), y0 + (kind === 'wardrobe' ? h * 0.5 : h * 0.75), 0.022);
    b.octa(0.018, 0.018, GK.DARK);
  } else if (kind === 'firstaid') {
    boxAt(b, sx * wLeaf / 2, y0 + h / 2, 0.003, 0.3, 0.09, 0.008, KIND.FLESH); // the red cross
    boxAt(b, sx * wLeaf / 2, y0 + h / 2, 0.003, 0.09, 0.3, 0.008, KIND.FLESH);
    b.place(sx * (wLeaf - 0.05), y0 + h / 2, 0.018);
    b.octa(0.014, 0.016, GK.CHROME);
  } else {
    for (let i = 0; i < 4; i++) boxAt(b, sx * wLeaf / 2, y0 + h - 0.12 - i * 0.05, 0.004, wLeaf * 0.55, 0.014, 0.008, GK.DARK); // vents
    boxAt(b, sx * (wLeaf - 0.07), y0 + h * 0.5, 0.02, 0.025, 0.14, 0.025, GK.CHROME); // the handle
    boxAt(b, sx * wLeaf / 2, y0 + h * 0.72, 0.004, 0.12, 0.07, 0.006, KIND.BONE); // a name card, blank
  }
  return b.toArrays();
}

// what waits behind the doors of the шкафандр: a red throat, jaws of teeth, two rollers bristling with them
function grinderOf(D) {
  const b = new MeshBuilder(4096);
  const { w, h, d } = D;
  // the throat: wet, ridged, red
  boxAt(b, 0, h / 2, -d / 2 + 0.05, w - 0.08, h - 0.16, 0.02, KIND.FLESH);
  for (let i = 0; i < 9; i++) boxAt(b, 0, 0.25 + i * ((h - 0.5) / 8), -d / 2 + 0.065, w - 0.14, 0.03, 0.02, KIND.EFFIGY);
  // the jaws: rows of teeth along the top and the floor, pointing in
  const n = Math.max(5, Math.round((w - 0.12) / 0.09));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.08 + (i / (n - 1)) * (w - 0.16);
    b.place(x, h - 0.06, d / 2 - 0.08, PI, 0, 0);
    b.cone(4, 0.035, 0.12 + (i % 2) * 0.05, KIND.BONE);
    b.place(x + 0.04, 0.1, d / 2 - 0.08, 0, 0, 0);
    b.cone(4, 0.035, 0.1 + ((i + 1) % 2) * 0.05, KIND.BONE);
  }
  // the grinding plate at the bottom, hoses
  b.place(0, 0.08, -0.04);
  b.cylinder(10, Math.min(0.2, w * 0.24), Math.min(0.2, w * 0.24), 0.03, GK.CHROME, { capTop: true });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2;
    b.place(Math.cos(a) * 0.1, 0.112, -0.04 + Math.sin(a) * 0.1);
    b.cylinder(5, 0.018, 0.018, 0.004, GK.DARK);
  }
  b.identity();
  b.limb([-w / 2 + 0.06, h - 0.2, -d / 2 + 0.08], [-w / 2 + 0.1, 0.3, d / 2 - 0.25], 0.025, 0.02, GK.DARK, 5);
  b.limb([w / 2 - 0.06, h - 0.35, -d / 2 + 0.08], [w / 2 - 0.12, 0.5, -0.05], 0.02, 0.02, GK.RUST, 5);
  return b.toArrays();
}

function rollerOf(D) {
  const b = new MeshBuilder(2048);
  const r = Math.min(0.12, D.w * 0.13), y0 = 0.15, y1 = D.h - 0.22;
  b.place(0, y0, 0);
  b.cylinder(8, r, r, y1 - y0, GK.RUST, { capTop: true, capBottom: true });
  for (let y = y0 + 0.06, k = 0; y < y1 - 0.02; y += 0.11, k++) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2 + k * 0.5;
      b.place(Math.cos(a) * r * 0.92, y, Math.sin(a) * r * 0.92, 0, -a, -PI / 2);
      b.cone(4, 0.022, 0.075, KIND.BONE);
    }
  }
  return b.toArrays();
}

function itemOf(kind) {
  const b = new MeshBuilder(256);
  if (kind === 'glow') {
    b.place(0, 0.014, 0, 0, 0.4, PI / 2);
    b.cylinder(6, 0.013, 0.013, 0.17, KIND.LEAF, { y0: -0.085, capBottom: true });
  } else if (kind === 'nuts') {
    for (const [x, z, s] of [[0, 0, 1], [0.035, 0.02, 0.8], [-0.03, 0.025, 0.9], [0.01, -0.035, 0.85], [-0.025, -0.02, 0.75]]) {
      b.place(x, 0.012 * s, z, 0, x * 40, 0);
      b.cylinder(6, 0.016 * s, 0.016 * s, 0.014 * s, GK.CHROME, { capBottom: true });
    }
  } else if (kind === 'shard') {
    b.place(0, 0.05, 0, 0.2, 0.3, 0.15);
    b.octa(0.03, 0.05, KIND.SHARD);
  } else if (kind === 'battery') {
    for (const [x, z] of [[0, 0], [0.032, 0.01]]) { // two of them, standing
      b.place(x, 0, z);
      b.cylinder(8, 0.014, 0.014, 0.05, GK.YELLOW, { capBottom: true });
      b.place(x, 0.05, z);
      b.cylinder(6, 0.005, 0.005, 0.005, GK.CHROME);
    }
  } else {
    b.place(0, 0.016, 0, 0, 0.8, PI / 2);
    b.cylinder(7, 0.016, 0.016, 0.075, KIND.FLESH, { y0: -0.035, capBottom: true });
    b.place(0, 0.016, 0, 0, 0.8, PI / 2);
    b.cylinder(7, 0.019, 0.019, 0.01, GK.YELLOW, { y0: 0.04 });
  }
  return geometryOf(b.toArrays());
}

// your own arms, for the first-person view while you're caught / pulling: a forearm (unit length along −z)
function armGeometry() {
  const b = new MeshBuilder(512);
  b.identity();
  b.limb([0, 0, 0], [0, 0, -1], 0.047, 0.038, 15, 6); // the sleeve (outfit main dye)
  return geometryOf(b.toArrays());
}
function handGeometry() {
  const b = new MeshBuilder(128);
  b.place(0, 0, 0, PI / 2, 0, 0);
  b.octa(0.045, 0.065, KIND.FLESH);
  return geometryOf(b.toArrays());
}

// a standalone cupboard (the atlas): doors open by `open` radians, the machine inside when `machine`
export function cabinetGroup(kind, mat, { open = 0, machine = false } = {}) {
  const D = CABINET_DIMS[kind];
  const group = new THREE.Group();
  const add = (arr, parent = group) => {
    const m = new THREE.Mesh(geometryOf(arr), mat);
    m.frustumCulled = false;
    parent.add(m);
    return m;
  };
  add(bodyOf(kind, D));
  if (!machine) add(shelvesOf(kind, D));
  const leaves = kind === 'wardrobe' ? [[-1, D.w / 2 - 0.005], [1, D.w / 2 - 0.005]] : [[-1, D.w - 0.01]];
  const doors = leaves.map(([side, wl]) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * (D.w / 2 - 0.003), 0, D.d / 2);
    pivot.rotation.y = side * open;
    add(leafOf(kind, D, wl, -side), pivot);
    group.add(pivot);
    return { pivot, side };
  });
  const rollers = [];
  if (machine) {
    add(grinderOf(D));
    const r = Math.min(0.12, D.w * 0.13);
    for (const s of [-1, 1]) {
      const m = add(rollerOf(D));
      m.position.set(s * (D.w / 2 - r - 0.07), 0, D.d / 2 - 0.17);
      rollers.push(m);
    }
  }
  return { group, doors, rollers, D };
}

// ---------------- the QTE track (DOM) ----------------// ---------------- the QTE track (DOM) ----------------
class QteUI {
  constructor() {
    const $ = (id) => document.getElementById(id);
    this.el = $('qte');
    this.track = $('qteTrack');
    this.line = this.track ? this.track.querySelector('.qline') : null;
    this.timeBar = $('qteTime');
    this.pullBar = $('qtePull');
    this.word = $('qteWord');
    this.hint = $('qteHint');
    this.marks = new Map(); // beat -> element
    this.on = false;
    this.wordT = 0;
    this.half = 0;
    if (typeof window !== 'undefined') window.addEventListener('resize', () => { this.half = 0; });
  }

  show(on, hint = '') {
    if (!this.el) return;
    if (on !== this.on) {
      this.on = on;
      this.half = 0;
      this.el.classList.toggle('show', on);
      document.body.classList.toggle('qte', on);
      if (!on) {
        for (const m of this.marks.values()) m.remove();
        this.marks.clear();
      }
    }
    if (on && this.hint.textContent !== hint) this.hint.textContent = hint;
  }

  // beats near now: [{ k, dt (s until it hits the line), key, state }]
  draw(beats, timeLeft, progress, span = 2.2) {
    if (!this.el || !this.on) return;
    if (!this.half) this.half = (this.track.getBoundingClientRect().width / 2) || 240;
    const seen = new Set();
    for (const b of beats) {
      seen.add(b.k);
      let m = this.marks.get(b.k);
      if (!m) {
        m = document.createElement('i');
        m.className = 'qmark';
        m.textContent = b.label;
        this.track.appendChild(m);
        this.marks.set(b.k, m);
      }
      const x = clamp(b.dt / span, -0.25, 1.05);
      m.style.transform = `translate(calc(${(x * (this.half - 24)).toFixed(1)}px - 50%), -50%) scale(${b.state === 'perfect' ? 1.2 : b.state ? 1.1 : 1})`;
      m.style.opacity = String(x < 0 ? Math.max(0, 1 + x * 4) : 1 - smoothstep(0.85, 1.05, x));
      const cls = 'qmark' + (b.state ? ' ' + b.state : '') + (b.team ? ' t-' + b.team : '');
      if (m.className !== cls) m.className = cls;
    }
    for (const [k, m] of this.marks) {
      if (!seen.has(k)) {
        m.remove();
        this.marks.delete(k);
      }
    }
    this.timeBar.style.transform = `scaleX(${clamp(timeLeft, 0, 1).toFixed(3)})`;
    this.pullBar.style.transform = `scaleX(${clamp(progress, 0, 1).toFixed(3)})`;
  }

  // the line flashes on every beat
  beat() {
    if (!this.line) return;
    this.line.classList.remove('b');
    void this.line.offsetWidth;
    this.line.classList.add('b');
  }

  say(text, cls = '') {
    if (!this.word) return;
    this.word.textContent = text;
    this.word.className = 'show ' + cls;
    void this.word.offsetWidth;
    this.word.classList.add('go');
  }
}

export class Cabinets {
  constructor(game) {
    this.g = game;
    const world = game.world;
    this.force = typeof location !== 'undefined' && new URLSearchParams(location.search).has('shkaf');
    this.mat = world.material;
    const shared = new Map();
    const geo = (key, make) => shared.get(key) || (shared.set(key, geometryOf(make())), shared.get(key));
    this.itemGeo = Object.fromEntries(ITEMS.map((k) => [k, itemOf(k)]));
    this.list = (world.cabinets || []).map((spec, i) => {
      const D = CABINET_DIMS[spec.kind];
      const group = new THREE.Group();
      group.position.set(spec.x, spec.y + (D.lift || 0), spec.z);
      group.rotation.y = spec.yaw;
      const body = new THREE.Mesh(geo('body:' + spec.kind, () => bodyOf(spec.kind, D)), this.mat);
      const shelves = new THREE.Mesh(geo('shelves:' + spec.kind, () => shelvesOf(spec.kind, D)), this.mat);
      group.add(body, shelves);
      // doors: a pair on the wardrobe, one on the rest (hinged on the left)
      const leaves = spec.kind === 'wardrobe' ? [[-1, D.w / 2 - 0.005], [1, D.w / 2 - 0.005]] : [[-1, D.w - 0.01]];
      const doors = leaves.map(([side, wl]) => {
        const pivot = new THREE.Group();
        pivot.position.set(side * (D.w / 2 - 0.003), 0, D.d / 2);
        const m = new THREE.Mesh(geo(`leaf:${spec.kind}:${side}`, () => leafOf(spec.kind, D, wl, -side)), this.mat);
        pivot.add(m);
        group.add(pivot);
        return { pivot, mesh: m, side, ang: 0, vel: 0, target: 0 };
      });
      const c = { i, spec, kind: spec.kind, D, group, body, shelves, doors, items: [], opened: false, mimic: false, spent: false, candidate: !!spec.mimic, tellT: 4 + i };
      // the machine inside (only built where a big cupboard could be one)
      if (c.candidate) {
        c.grinder = new THREE.Mesh(geo('grinder:' + spec.kind, () => grinderOf(D)), this.mat);
        const rg = geo('roller:' + spec.kind, () => rollerOf(D));
        c.rollers = [-1, 1].map((s) => {
          const r = new THREE.Mesh(rg, this.mat);
          r.position.set(s * (D.w / 2 - Math.min(0.12, D.w * 0.13) - 0.07), 0, D.d / 2 - 0.17);
          group.add(r);
          return r;
        });
        // the tell: a dark trickle from under its doors
        const tb = new MeshBuilder(64);
        boxAt(tb, 0.08, 0.004, D.d / 2 + 0.13, 0.1, 0.008, 0.26, KIND.FLESH);
        boxAt(tb, -0.05, 0.004, D.d / 2 + 0.05, 0.05, 0.008, 0.1, KIND.FLESH);
        c.trickle = new THREE.Mesh(geometryOf(tb.toArrays()), this.mat);
        group.add(c.grinder, c.trickle);
      }
      game.scene.add(group);
      if (game.shadows) for (const d of doors) game.shadows.addDynamic(d.mesh, D.w);
      // world positions: in front of it (where you stand to open it)
      const fwd = new THREE.Vector3(Math.sin(spec.yaw), 0, Math.cos(spec.yaw));
      c.front = { x: spec.x + fwd.x * (D.d / 2 + 0.55), z: spec.z + fwd.z * (D.d / 2 + 0.55) };
      c.fwd = fwd;
      return c;
    });
    this.trap = null;
    this.askT = 0;
    this.nightSeed = 1;
    this.ui = new QteUI();
    // your arms (first person, while caught or pulling)
    this.armMat = null;
    this.armGeo = armGeometry();
    this.handGeo = handGeometry();
    this.arms = [-1, 1].map((s) => {
      const g = new THREE.Group();
      const fore = new THREE.Mesh(this.armGeo, this.mat);
      const hand = new THREE.Mesh(this.handGeo, this.mat);
      fore.frustumCulled = hand.frustumCulled = false;
      g.add(fore);
      game.scene.add(g, hand);
      g.visible = hand.visible = false;
      return { s, g, fore, hand };
    });
    this.reset(new RNG(5));
  }

  // ---------------- a new night ----------------
  reset(rng) {
    const g = this.g;
    this._endTrap(true);
    const cands = this.list.filter((c) => c.candidate);
    this.nightSeed = (rng.next() * 4294967296) >>> 0; // (the keys of its beat: the same for everyone)
    this.hintedHelp = false;
    let mimic = null;
    const roll = rng.next(), pick = rng.next();
    if (cands.length && (roll < MIMIC_CHANCE || this.force)) mimic = this.force ? cands[0] : cands[Math.floor(pick * cands.length)];
    for (const c of this.list) {
      c.opened = false;
      c.spent = false;
      c.mimic = c === mimic;
      c.tellT = 5 + rng.next() * 8;
      for (const d of c.doors) {
        d.ang = d.target = c.mimic ? 0.035 : 0; // (it never quite shuts)
        d.vel = 0;
      }
      c.shelves.visible = !c.mimic;
      if (c.grinder) {
        c.grinder.visible = c.trickle.visible = c.mimic;
        for (const r of c.rollers) { r.visible = c.mimic; r.rotation.y = 0; }
      }
      for (const it of c.items) c.group.remove(it.mesh);
      c.items = [];
      // what's inside (the same on every machine: the night's seed)
      let n = 0;
      const r = rng.next();
      if (c.kind === 'firstaid') n = r < 0.5 ? 1 : 2;
      else n = r < 0.25 ? 0 : r < 0.6 ? 1 : r < 0.85 ? 2 : 3;
      if (c.mimic) n = 0;
      for (let k = 0; k < n; k++) {
        let x = rng.next(), kind = ITEMS[0];
        for (let j = 0; j < ITEMS.length; j++) {
          if (x < ITEM_W[j]) { kind = ITEMS[j]; break; }
          x -= ITEM_W[j];
        }
        if (c.kind === 'firstaid' && k === 0) kind = 'glow';
        const mesh = new THREE.Mesh(this.itemGeo[kind], this.mat);
        const y = SHELF_Y[c.kind][k] + (c.kind === 'firstaid' ? 0 : 0);
        mesh.position.set(SLOT_X[c.kind][k], y, -0.02 + (k % 2) * 0.05);
        mesh.rotation.y = rng.next() * PI;
        c.group.add(mesh);
        c.items.push({ kind, mesh, taken: false });
      }
      this._placeDoors(c);
    }
  }

  silence() {
    this._endTrap(true);
  }

  // ---------------- queries ----------------
  _placeDoors(c) {
    for (const d of c.doors) d.pivot.rotation.y = d.side * d.ang; // (both swing out, toward the room)
  }

  // is this player caught, or holding someone who is? (their movement is the trap's, not theirs)
  locked(pid) {
    const tr = this.trap;
    if (!tr || tr.free) return false;
    return tr.victim === pid || tr.hands.includes(pid);
  }
  get busy() {
    return this.locked(this.g.player.id);
  }

  // ---------------- the E prompt ----------------
  consider(fn, hands = true) {
    const g = this.g, me = g.player;
    if (this.busy) {
      fn({ trap: true }, me.x, me.z, 99, 'trapSelf');
      return;
    }
    for (const c of this.list) {
      if (c.spent) continue;
      if (!c.opened) {
        if (hands) fn(c, c.front.x, c.front.z, OPEN_R, 'cabinet');
      } else if (hands && c.items.some((it) => !it.taken)) fn(c, c.front.x, c.front.z, OPEN_R, 'cabinetItem');
    }
    // someone caught: a free hand to grab
    const tr = this.trap;
    if (tr && !tr.free && !tr.out && tr.victim !== me.id && hands && tr.hands.includes(null)) {
      const c = this.list[tr.ci];
      fn({ trap: true, grab: true }, c.front.x, c.front.z, GRAB_R, 'trapGrab');
    }
  }

  // the next thing you can take out of it (the nuts only with room in your pockets)
  _nextItem(c) {
    const p = this.g.player;
    let full = null;
    for (const it of c.items) {
      if (it.taken) continue;
      if (it.kind === 'nuts' && p.stones >= CFG.PLAYER.maxStones) {
        full = full || it;
        continue;
      }
      return { it, full: false };
    }
    return full ? { it: full, full: true } : null;
  }

  interact(best, dt, held, pressed, T) {
    const g = this.g, hud = g.hud, o = best.obj;
    if (best.kind === 'cabinet') {
      hud.setUse(T('useCabinet').replace('{what}', t('cabNames')[o.kind]), 0, true);
      if (pressed) this.open(o);
      return;
    }
    if (best.kind === 'cabinetItem') {
      const n = this._nextItem(o);
      if (!n) { hud.setUse(null); return; }
      if (n.full) {
        hud.setUse(`${t('cabItems')[n.it.kind]} · ${t('aPocketsFull')}`, 0, false, true);
        return;
      }
      hud.setUse(`${T('useTake')} ${t('cabItems')[n.it.kind]}`, 0, true);
      if (pressed) this.take(o, o.items.indexOf(n.it));
      return;
    }
    if (best.kind === 'trapGrab') {
      hud.setUse(T('useGrabHand'), 0, true);
      if (pressed) this.grab();
      return;
    }
    if (best.kind === 'trapSelf') hud.setUse(null);
  }

  // ---------------- opening, taking ----------------
  open(c) {
    const g = this.g, me = g.player;
    if (c.opened || c.spent) return;
    if (c.mimic && g.state === 'play') {
      // it was never a cupboard
      this.spring(c.i, me.id, true);
      if (g.sync) g.sync.ev('zs', c.i);
      return;
    }
    this.openFx(c, true);
    if (g.sync) g.sync.ev('co', c.i);
  }

  netOpen(i) {
    const c = this.list[i | 0];
    if (c && !c.opened && !c.spent && !c.mimic) this.openFx(c, false);
  }

  openFx(c, mine) {
    const g = this.g;
    c.opened = true;
    for (const d of c.doors) d.target = c.kind === 'firstaid' ? 1.9 : 1.75 + (d.side > 0 ? 0.12 : 0);
    const p = c.group.position;
    if (g.audio.ready && g.audio.cabinetOpen) g.audio.cabinetOpen(p.x, p.y + (c.D.h * 0.5), p.z, c.kind);
    if (mine) g.playerNoise(c.front.x, c.front.z, 0.06, 'door');
  }

  take(c, k) {
    const g = this.g, p = g.player;
    const it = c.items[k];
    if (!it || it.taken) return;
    // nuts only fit if your pockets have room for them
    if (it.kind === 'nuts' && p.stones >= CFG.PLAYER.maxStones) {
      g.hud.popup(t('aPocketsFull'), 'dim');
      return;
    }
    this._taken(c, k);
    if (g.sync) g.sync.ev('ct', c.i, k);
    this._give(it.kind);
  }

  netTake(i, k) {
    const c = this.list[i | 0];
    if (c) this._taken(c, k | 0);
  }

  _taken(c, k) {
    const it = c.items[k];
    if (!it || it.taken) return;
    it.taken = true;
    it.mesh.visible = false;
    c.opened = true;
    for (const d of c.doors) if (d.target < 1) d.target = 1.75;
  }

  // what it does for you
  _give(kind) {
    const g = this.g, p = g.player, a = g.audio;
    const name = t('cabGot')[kind];
    if (kind === 'glow') {
      g.glows.count = Math.min(3, g.glows.count + 1);
      g.hud.flashGlows();
      if (a.ready) a.glowPick();
      g.hud.popup(`+ ${name}`, 'cyan');
    } else if (kind === 'nuts') {
      p.stones = Math.min(CFG.PLAYER.maxStones, p.stones + 2);
      g.hud.flashStones();
      if (a.ready && a.cabinetItem) a.cabinetItem('nuts');
      g.hud.popup(`+ ${name}`, 'dim');
    } else if (kind === 'shard') {
      if (g.earnShards) g.earnShards(1);
      g.stats.shards++;
      const pts = Math.round(CFG.SCORE.shard * g.mult);
      g.score += pts;
      if (p.stones < CFG.PLAYER.maxStones) p.stones++;
      if (a.ready) a.shardPickup(g.stats.shards);
      g.hud.popup(`+${pts} ${t('aShard')}`, 'amber');
    } else if (kind === 'battery') {
      if (g.torch) g.torch.addBattery();
      if (a.ready && a.cabinetItem) a.cabinetItem('nuts');
    } else {
      g.setFlares((p.flares | 0) + 1, !!p.hasFlare);
      if (a.ready && a.cabinetItem) a.cabinetItem('flare');
      g.hud.popup(p.hasFlare ? `+ ${name}` : `+ ${name} · ${t('aFlareNoGun')}`, 'amber');
      if (p.hasFlare) g.hud.flashFlares();
    }
    g.stats.looted = (g.stats.looted | 0) + 1;
  }

  // ---------------- the шкафандр ----------------
  // (every machine) it has someone. mine: it's me
  spring(i, victimId, mine = false) {
    const g = this.g;
    const c = this.list[i | 0];
    if (!c || !c.mimic || c.spent) return;
    if (this.trap && !this.trap.free) return; // (one at a time: the first word wins, the host's snapshot settles it)
    const seed = (Math.imul(i + 1, 2246822519) ^ this.nightSeed) >>> 0;
    c.opened = true;
    this.trap = {
      ci: c.i, victim: victimId, t: 0, seed, hands: [null, null], progress: 0,
      my: new Map(), // beat -> 'hit' | 'perfect' | 'miss' (what I did)
      team: new Map(), // beat -> result (what the host said)
      rep: new Map(), // host: beat -> { r: Map(pid -> q), v: q }
      next: 0, // host: the next beat to judge
      free: false, out: null, outT: 0, noiseT: 0.4, chompT: 0, screamT: 1.2, pullT: 0, sink: 0,
    };
    for (const d of c.doors) { d.target = 2.0; d.vel = 9; }
    g.stats.seen.shkaf = 1;
    const p = c.group.position;
    const a = g.audio;
    if (a.ready) {
      a.shkafSpring && a.shkafSpring(p.x, p.y + 1.1, p.z, mine);
      this.grind = a.shkafGrind ? a.shkafGrind(p.x, p.y + 0.9, p.z) : null;
    }
    // its maw lights up: a red furnace glow (the only light here now)
    this.light = { x: p.x + c.fwd.x * 0.05, y: p.y + c.D.h * 0.55, z: p.z + c.fwd.z * 0.05, I: 0, c: [1.0, 0.24, 0.1], R: 6.5, near: 0.35 };
    g.glows.lanterns.push(this.light);
    g.particles.burst(p.x + c.fwd.x * 0.4, p.y + 1, p.z + c.fwd.z * 0.4, 30, { color: [0.6, 0.55, 0.5], speed: 3, up: 1, life: 0.9, size: 0.06, gravity: -5, drag: 1.5 });
    g.pulses.emit(p.x, p.y + 1.2, p.z, g.time, { radius: 14, strength: 1.0, decay: 0.8, color: [1.0, 0.2, 0.12], kind: 'monster' });
    g.noise(c.front.x, c.front.z, 0.55, 'repair');
    const me = g.player;
    if (victimId === me.id) {
      g.addTrauma(0.75);
      g.fx.red = Math.max(g.fx.red, 0.6);
      g.fx.glitch = Math.max(g.fx.glitch, 0.8);
      g.fx.white = Math.max(g.fx.white, 0.2);
      g.hud.flashAlert(t('aShkaf'), 'danger', 2.4);
      g.hud.setUse(null);
      g.objectives.closeNote();
      this.ui.show(true, t(g.online ? 'qteVictim' : 'qteSelf'));
    } else {
      const who = g.playerById(victimId);
      if (who) g.hud.flashAlert(t('aShkafMate').replace('{name}', who.name), 'danger', 2.6);
      const near = Math.max(0, 1 - g.distToEars(c.front.x, c.front.z) / 25);
      g.addTrauma(0.3 * near);
      if (g.player.alive && !this.hintedHelp) {
        this.hintedHelp = true;
        g.timeline.push({ at: g.time + 0.8, fn: () => {
          const tr = this.trap;
          if (tr && !tr.out && g.player.alive && !tr.hands.includes(g.player.id)) g.hud.setHint(t(g.input.touch ? 'hintShkafHelpTouch' : 'hintShkafHelp'));
        } });
        g.timeline.push({ at: g.time + 9, fn: () => this._dropHint() });
      }
    }
  }

  netSpring(pid, i) {
    this.spring(i | 0, pid, false);
  }

  // E by someone caught: a free hand (the host says which)
  grab() {
    const g = this.g, me = g.player;
    const tr = this.trap;
    if (!tr || tr.free || tr.out || !me.alive) return;
    if (g.auth) this.hostGrab(me.id);
    else if (!this.askT || this.askT <= 0) {
      g.coop.toHost('zg', tr.ci);
      this.askT = 0.6;
    }
  }

  hostGrab(pid) {
    const g = this.g;
    const tr = this.trap;
    const who = g.playerById(pid);
    if (!tr || tr.free || tr.out || !who || !who.alive || pid === tr.victim || tr.hands.includes(pid)) return;
    const c = this.list[tr.ci];
    if (Math.hypot(who.x - c.front.x, who.z - c.front.z) > GRAB_R + 2) return;
    // the hand on your side
    const right = new THREE.Vector3(Math.cos(c.spec.yaw), 0, -Math.sin(c.spec.yaw));
    const side = (who.x - c.front.x) * right.x + (who.z - c.front.z) * right.z;
    let k = side >= 0 ? 1 : 0;
    if (tr.hands[k]) k = 1 - k;
    if (tr.hands[k]) return;
    tr.hands[k] = pid;
    this._handsChanged();
    if (g.sync) g.sync.ev('zh', tr.ci, tr.hands[0] || 0, tr.hands[1] || 0);
  }

  netHands(i, a, b) {
    const tr = this.trap;
    if (!tr || tr.ci !== (i | 0)) return;
    tr.hands = [typeof a === 'string' ? a : null, typeof b === 'string' ? b : null];
    this._handsChanged();
  }

  // the "go and help" hint, once it's done its job
  _dropHint() {
    const h = this.g.hud;
    if (h.hintKey === t('hintShkafHelp') || h.hintKey === t('hintShkafHelpTouch')) h.setHint(null);
  }

  _handsChanged() {
    const g = this.g, tr = this.trap, me = g.player;
    if (tr.hands.includes(me.id) && !tr.iHold) {
      tr.iHold = true;
      this._dropHint();
      this.ui.show(true, t(tr.hands.every(Boolean) ? 'qteDuo' : 'qteSolo'));
      if (g.audio.ready && g.audio.grabHand) g.audio.grabHand();
      g.addTrauma(0.15);
    }
    if (tr.iHold) this.ui.show(true, t(tr.hands.every(Boolean) ? 'qteDuo' : 'qteSolo'));
    else if (tr.victim === me.id && !tr.out) {
      const held = tr.hands.some(Boolean);
      this.ui.show(true, t(held ? 'qteVictimHeld' : g.online ? 'qteVictim' : 'qteSelf'));
      if (held && !tr.feltHands) {
        tr.feltHands = true; // (someone has you)
        if (g.audio.ready && g.audio.grabHand) g.audio.grabHand();
        g.addTrauma(0.12);
      }
    }
  }

  // ---------------- the beat ----------------
  beatTime(k) {
    return TRAP.lead + k * TRAP.period;
  }

  // my press: which beat it was, how close, the right key?
  _press(dir) {
    const g = this.g, tr = this.trap;
    if (!tr || tr.free || tr.out) return;
    const me = g.player.id;
    const role = tr.victim === me ? 'victim' : tr.hands.includes(me) ? 'rescuer' : null;
    if (!role) return;
    const k = Math.round((tr.t - TRAP.lead) / TRAP.period);
    if (k < 0) return;
    const dt = tr.t - this.beatTime(k);
    const key = keyFor(tr.seed, k);
    if (tr.my.has(k)) return; // (one press a beat counts)
    let q = 0;
    if (Math.abs(dt) <= TRAP.window && (dir === key || dir === 'X')) q = Math.abs(dt) <= TRAP.perfect ? 2 : 1;
    tr.my.set(k, q === 2 ? 'perfect' : q === 1 ? 'hit' : 'miss');
    const a = g.audio;
    if (q) {
      if (a.ready && a.qteHit) a.qteHit(q === 2, role === 'victim');
      this.ui.say(q === 2 ? t('qtePerfect') : t('qteHit'), q === 2 ? 'perfect' : 'hit');
      if (role === 'rescuer') tr.pullT = 0.22;
    } else {
      if (a.ready && a.qteMiss) a.qteMiss();
      this.ui.say(t('qteMiss'), 'miss');
    }
    this._report(k, q);
  }

  _report(k, q) {
    const g = this.g, tr = this.trap;
    if (g.auth) this.hostPress(g.player.id, tr.ci, k, q);
    else g.coop.toHost('zp', [tr.ci, k, q]);
  }

  hostPress(pid, i, k, q) {
    const tr = this.trap;
    if (!tr || tr.ci !== (i | 0) || tr.free || tr.out || k < tr.next) return;
    let r = tr.rep.get(k);
    if (!r) tr.rep.set(k, (r = { r: new Map(), v: 0 }));
    if (pid === tr.victim) r.v = Math.max(r.v, q | 0);
    else if (tr.hands.includes(pid)) r.r.set(pid, q | 0);
  }

  // host: every beat whose window (and the time for the presses to arrive) has passed
  _judge() {
    const g = this.g, tr = this.trap;
    while (tr.t >= this.beatTime(tr.next) + TRAP.window + TRAP.grace) {
      const k = tr.next++;
      const r = tr.rep.get(k) || { r: new Map(), v: 0 };
      tr.rep.delete(k);
      const holders = tr.hands.filter(Boolean);
      const hits = holders.filter((pid) => (r.r.get(pid) | 0) > 0);
      const perfect = holders.length && holders.every((pid) => r.r.get(pid) === 2);
      let d = 0, res = RES.NONE;
      if (holders.length === 2) {
        if (hits.length === 2) { d = PULL.sync + (perfect ? PULL.syncPerfect : 0); res = perfect ? RES.PERFECT : RES.SYNC; }
        else if (hits.length === 1) { d = PULL.off; res = RES.OFF; }
        else d = PULL.miss;
      } else if (holders.length === 1) {
        if (hits.length) { d = PULL.single + (perfect ? PULL.singlePerfect : 0); res = perfect ? RES.PERFECT : RES.PULL; }
        else d = PULL.miss;
      }
      if (r.v) {
        d += holders.length ? PULL.victim : PULL.self;
        if (res === RES.NONE) res = RES.STRUGGLE;
      } else if (!holders.length) d += PULL.miss * 0.5;
      tr.progress = clamp(tr.progress + d, 0, 1);
      if (g.sync) g.sync.ev('zb', tr.ci, k, res, Math.round(tr.progress * 1000) / 1000);
      this._beat(k, res, tr.progress);
      if (tr.progress >= 1) {
        this.finish('rescued');
        return;
      }
    }
  }

  netBeat(i, k, res, progress) {
    const tr = this.trap;
    if (!tr || tr.ci !== (i | 0) || tr.out) return;
    tr.progress = clamp(+progress || 0, 0, 1);
    this._beat(k | 0, res | 0, tr.progress);
  }

  // (every machine) what the beat did: a pull (or a tear), a sound, a shake
  _beat(k, res, progress) {
    const g = this.g, tr = this.trap;
    tr.team.set(k, res);
    const c = this.list[tr.ci];
    const p = c.group.position;
    const me = g.player.id;
    const involved = tr.victim === me || tr.hands.includes(me);
    const a = g.audio;
    if (res === RES.SYNC || res === RES.PERFECT || res === RES.PULL) {
      tr.yank = 0.3;
      if (a.ready && a.trapPull) a.trapPull(p.x, p.y + 1, p.z, res !== RES.PULL);
      if (involved) {
        g.addTrauma(res === RES.PULL ? 0.12 : 0.22);
        if (tr.hands.filter(Boolean).length === 2) this.ui.say(res === RES.PERFECT ? t('qteSyncPerfect') : t('qteSync'), 'sync');
      }
    } else if (res === RES.OFF) {
      if (involved) this.ui.say(t('qteOff'), 'off');
      if (a.ready && a.trapPull) a.trapPull(p.x, p.y + 1, p.z, false, true);
    }
  }

  // ---------------- the end ----------------
  // host: how it ended (rescued / died) — everyone hears it
  finish(how) {
    const g = this.g, tr = this.trap;
    if (!tr || tr.out) return;
    if (g.sync && g.auth) g.sync.ev(how === 'rescued' ? 'zr' : 'zd', tr.ci);
    this._outcome(how);
  }

  netEnd(i, how) {
    const tr = this.trap;
    if (!tr || tr.ci !== (i | 0) || tr.out) return;
    this._outcome(how);
  }

  _outcome(how) {
    const g = this.g, tr = this.trap;
    tr.out = how;
    tr.outT = 0;
    const c = this.list[tr.ci];
    const p = c.group.position;
    const a = g.audio;
    const me = g.player;
    c.spent = true;
    this.ui.show(false);
    this._dropHint();
    if (how === 'rescued') {
      tr.progress = 1;
      if (a.ready && a.trapRescue) a.trapRescue(p.x, p.y + 1, p.z);
      // it chokes on them: sparks off both rollers, a burst from the throat
      const rx = Math.cos(c.spec.yaw), rz = -Math.sin(c.spec.yaw);
      for (const s of [-1, 1]) g.particles.burst(p.x + c.fwd.x * 0.22 + rx * s * c.D.w * 0.32, p.y + 0.95, p.z + c.fwd.z * 0.22 + rz * s * c.D.w * 0.32, 34, { color: [1.3, 0.9, 0.45], speed: 7, up: 2.4, life: 0.7, size: 0.045, gravity: -9.8, drag: 1.0, spread: 0.5 });
      g.particles.burst(p.x + c.fwd.x * 0.3, p.y + 1.1, p.z + c.fwd.z * 0.3, 30, { color: [1, 0.8, 0.45], speed: 5, up: 2, life: 0.6, size: 0.05, gravity: -9, drag: 1.1 });
      g.particles.burst(p.x, p.y + 1.6, p.z, 26, { color: [0.4, 0.4, 0.42], speed: 1.2, up: 1.4, life: 2.2, size: 0.14, gravity: 0.6, drag: 1.4 });
      g.pulses.emit(p.x, p.y + 1, p.z, g.time, { radius: 12, strength: 0.9, decay: 1, color: [0.9, 0.95, 1], kind: 'stone' });
      if (tr.victim === me.id) {
        g.hud.flashAlert(t(tr.hands.some(Boolean) ? 'aFreedBy' : 'aFreed'), 'dawn', 2.4);
        g.addTrauma(0.5);
        g.fx.white = Math.max(g.fx.white, 0.3);
      } else if (tr.hands.includes(me.id)) {
        const pts = Math.round(1000 * g.mult);
        g.score += pts;
        g.stats.saves = (g.stats.saves | 0) + 1;
        g.hud.popup(`+${pts} ${t('popPulled')}`, 'amber');
        g.addTrauma(0.45);
      } else {
        const who = g.playerById(tr.victim);
        if (who) g.hud.popup(t('mateFreed').replace('{name}', who.name), 'cyan');
      }
    } else {
      if (a.ready && a.trapKill) a.trapKill(p.x, p.y + 1, p.z, tr.victim === me.id);
      g.particles.burst(p.x + c.fwd.x * 0.3, p.y + 1.0, p.z + c.fwd.z * 0.3, 60, { color: [0.62, 0.04, 0.03], speed: 4, up: 1.6, life: 1.1, size: 0.06, gravity: -8, drag: 1.2 });
      g.pulses.emit(p.x, p.y + 1, p.z, g.time, { radius: 16, strength: 1.0, decay: 0.8, color: [1.0, 0.13, 0.08], kind: 'monster' });
      for (const d of c.doors) { d.target = 0.02; d.vel = -10; } // it slams shut on them
      const v = g.playerById(tr.victim);
      if (v === me) g.shkafDeath(c);
      else if (v) {
        g.shkafTook(v, c);
      }
    }
    if (this.grind) {
      this.grind.stop(how === 'rescued' ? 0.6 : 1.4);
      this.grind = null;
    }
  }

  // the trap is over and its scene played out: everyone goes free, the light goes out
  _endTrap(now = false) {
    const g = this.g;
    if (this.grind) { this.grind.stop(0.2); this.grind = null; }
    if (this.light) {
      const i = g.glows.lanterns.indexOf(this.light);
      if (i >= 0) g.glows.lanterns.splice(i, 1);
      this.light = null;
    }
    if (this.trap) this.trap.free = true;
    this.trap = null;
    this.ui.show(false);
    for (const a of this.arms) a.g.visible = a.hand.visible = false;
    if (now) return;
  }

  // someone left (or went down another way): the host lets go of their hand, or ends it
  left(pid) {
    const g = this.g, tr = this.trap;
    if (!tr || tr.out) return;
    if (tr.victim === pid) {
      if (g.auth) this.finish('died');
      return;
    }
    const k = tr.hands.indexOf(pid);
    if (k >= 0) {
      tr.hands[k] = null;
      if (g.auth && g.sync) g.sync.ev('zh', tr.ci, tr.hands[0] || 0, tr.hands[1] || 0);
    }
  }

  // ---------------- co-op: the snapshot ----------------
  netState() {
    const tr = this.trap;
    return {
      c: this.list.map((c) => [c.opened ? 1 : 0, c.items.reduce((m, it, k) => m | (it.taken ? 1 << k : 0), 0), c.spent ? 1 : 0]),
      t: tr && !tr.out && this.g.auth ? [tr.ci, tr.victim, tr.hands[0] || 0, tr.hands[1] || 0, Math.round(tr.progress * 1000) / 1000, Math.round(tr.t * 100) / 100] : null,
    };
  }

  netMerge(s, fromHost) {
    if (!s || !Array.isArray(s.c)) return;
    s.c.forEach((a, i) => {
      const c = this.list[i];
      if (!c || !Array.isArray(a)) return;
      if (a[0] && !c.opened && !c.mimic) this.openFx(c, false);
      const m = a[1] | 0;
      c.items.forEach((it, k) => {
        if (m & (1 << k) && !it.taken) this._taken(c, k);
      });
      if (a[2] && !c.spent && !(this.trap && this.trap.ci === i)) {
        c.spent = true;
        c.opened = true;
        for (const d of c.doors) d.target = 0.9;
      }
    });
    if (fromHost && Array.isArray(s.t) && !this.g.auth) {
      const [ci, v, h0, h1, prog, tt] = s.t;
      if (!this.trap || this.trap.free) {
        if (typeof v === 'string') {
          this.spring(ci, v, false);
          if (this.trap) this.trap.t = Math.max(this.trap.t, +tt || 0);
        }
      } else if (this.trap.ci === ci) {
        if (typeof v === 'string' && this.trap.victim !== v) this.trap.victim = v;
        this.trap.hands = [typeof h0 === 'string' ? h0 : null, typeof h1 === 'string' ? h1 : null];
        if (!this.trap.team.size) this.trap.progress = Math.max(0, Math.min(1, +prog || 0)); // (the beats carry it from then on)
        this._handsChanged();
      }
    }
  }

  // ---------------- per frame ----------------
  update(dt) {
    const g = this.g;
    if (this.askT > 0) this.askT -= dt;
    for (const c of this.list) {
      // the doors: a spring toward where they should be (a chomp while it feeds)
      for (const d of c.doors) {
        let target = d.target;
        const tr = this.trap;
        if (tr && tr.ci === c.i && !tr.out) target = 1.25 + Math.sin(tr.t * 8.5 + d.side) * 0.55;
        d.vel += ((target - d.ang) * 60 - d.vel * 9) * dt;
        d.ang += d.vel * dt;
        if (d.ang < 0) { d.ang = 0; d.vel = Math.abs(d.vel) * 0.2; }
      }
      this._placeDoors(c);
      // the tell: now and then, close to it, something inside ticks and breathes
      if (c.mimic && !c.spent && !(this.trap && this.trap.ci === c.i)) {
        c.tellT -= dt;
        if (c.tellT <= 0) {
          c.tellT = 7 + Math.random() * 8;
          if (g.distToEars(c.front.x, c.front.z) < 7 && g.audio.ready && g.audio.shkafTell) {
            const p = c.group.position;
            g.audio.shkafTell(p.x, p.y + 1, p.z);
          }
        }
      }
    }
    const tr = this.trap;
    if (!tr) return;
    tr.t += dt;
    const c = this.list[tr.ci];
    const p = c.group.position;
    // the machine: rollers, light, blood
    const spin = tr.out === 'rescued' ? Math.max(0, 1 - tr.outT * 1.2) : 1;
    for (const [i, r] of (c.rollers || []).entries()) r.rotation.y += (i ? -1 : 1) * dt * 9 * spin;
    if (this.light) {
      const fl = 0.85 + 0.15 * Math.sin(tr.t * 23) * Math.sin(tr.t * 7.1);
      this.light.I = (tr.out ? Math.max(0, 1 - tr.outT * 0.8) : Math.min(1, tr.t * 3)) * 1.55 * fl;
    }
    if (tr.yank > 0) tr.yank -= dt;
    if (tr.pullT > 0) tr.pullT -= dt;
    if (this.grind && this.grind.rate) this.grind.rate(tr.out ? 0 : 0.6 + 0.4 * Math.sin(tr.t * 2.1));
    if (!tr.out) {
      tr.chompT -= dt;
      if (tr.chompT <= 0) {
        tr.chompT = 0.62 + Math.random() * 0.25;
        g.particles.burst(p.x + c.fwd.x * 0.35, p.y + 0.9 + Math.random() * 0.4, p.z + c.fwd.z * 0.35, 6, { color: [0.6, 0.05, 0.03], speed: 2.2, up: 1.2, life: 0.7, size: 0.04, gravity: -9, drag: 1.4 });
      }
      tr.screamT -= dt;
      const victim = g.playerById(tr.victim);
      if (tr.screamT <= 0) {
        tr.screamT = 1.6 + Math.random() * 1.4;
        if (victim && g.audio.ready && g.audio.humanScream) g.audio.humanScream(p.x + c.fwd.x * 0.3, p.y + 1.3, p.z + c.fwd.z * 0.3, victim === g.player, clamp(tr.t / TRAP.time, 0, 1));
      }
      // the host: noise that carries, the beats, the clock
      if (g.auth) {
        tr.noiseT -= dt;
        if (tr.noiseT <= 0) {
          tr.noiseT = 2;
          g.noise(c.front.x, c.front.z, 0.42, 'repair');
        }
        if (!victim || !victim.alive) this.finish('died');
        else {
          // anyone holding a hand who went down lets go
          for (let k = 0; k < 2; k++) {
            const h = tr.hands[k] && g.playerById(tr.hands[k]);
            if (tr.hands[k] && (!h || !h.alive)) {
              tr.hands[k] = null;
              if (g.sync) g.sync.ev('zh', tr.ci, tr.hands[0] || 0, tr.hands[1] || 0);
            }
          }
          this._judge();
          if (!tr.out && tr.t >= TRAP.time) this.finish('died');
        }
      }
      // me in it: the keys, the track
      if (!tr.out) this._local(dt);
    } else {
      tr.outT += dt;
      if (tr.outT > (tr.out === 'rescued' ? 1.6 : 2.2)) {
        for (const d of c.doors) d.target = tr.out === 'rescued' ? 1.1 : 0.55; // and it hangs there, dead
        this._endTrap();
        return;
      }
    }
    this._lockBodies(dt);
  }

  // my keys this frame, and the track
  _local() {
    const g = this.g, tr = this.trap;
    const me = g.player.id;
    const role = tr.victim === me ? 'victim' : tr.hands.includes(me) ? 'rescuer' : null;
    if (!role) {
      if (this.ui.on) this.ui.show(false);
      return;
    }
    for (const e of g.events) {
      if (e === 'qU' || e === 'qL' || e === 'qD' || e === 'qR' || e === 'qX') this._press(e[1]);
    }
    // beats that slipped by without a press
    const kNow = Math.floor((tr.t - TRAP.lead - TRAP.window) / TRAP.period);
    for (let k = Math.max(0, kNow - 2); k <= kNow; k++) {
      if (!tr.my.has(k)) {
        tr.my.set(k, 'miss');
        this._report(k, 0);
      }
    }
    // a soft tick on every beat
    const kb = Math.floor((tr.t - TRAP.lead) / TRAP.period);
    if (kb >= 0 && kb !== tr.lastTick) {
      tr.lastTick = kb;
      if (g.audio.ready && g.audio.qteTick) g.audio.qteTick();
      this.ui.beat();
    }
    const beats = [];
    const k0 = Math.max(0, Math.floor((tr.t - TRAP.lead) / TRAP.period) - 1);
    for (let k = k0; k < k0 + 5; k++) {
      const dt = this.beatTime(k) - tr.t;
      if (dt > 2.6) break;
      const mine = tr.my.get(k);
      const team = tr.team.get(k);
      beats.push({ k, dt, label: g.input.touch ? '●' : KEY_LABEL[keyFor(tr.seed, k)], state: mine || '', team: team === RES.SYNC || team === RES.PERFECT ? 'sync' : team === RES.OFF ? 'off' : '' });
    }
    this.ui.draw(beats, 1 - tr.t / TRAP.time, tr.progress);
  }

  // the caught and the pulling: placed by the machine, not by their legs
  _lockBodies(dt) {
    const g = this.g, tr = this.trap;
    const c = this.list[tr.ci];
    const me = g.player;
    const yaw = c.spec.yaw;
    const fwd = c.fwd;
    const right = _u.set(Math.cos(yaw), 0, -Math.sin(yaw));
    const base = c.group.position;
    const floor = base.y - (c.D.lift || 0);
    const pull = tr.out === 'rescued' ? smoothstep(0, 0.45, tr.outT) : 0;
    const eat = tr.out === 'died' ? smoothstep(0, 0.5, tr.outT) : 0;
    // how deep they're in: it drags, every good pull drags them back out
    tr.sink = damp(tr.sink, clamp(0.25 + tr.t / TRAP.time * 0.5 - tr.progress * 0.6, 0, 0.8), 2, dt);
    const depth = lerp(tr.sink, -1.1, pull) + eat * 0.6 - (tr.yank > 0 ? 0.08 : 0);
    const vx = base.x + fwd.x * (c.D.d / 2 - depth * 0.45), vz = base.z + fwd.z * (c.D.d / 2 - depth * 0.45);
    if (tr.victim === me.id && me.alive && tr.out !== 'died') { // (dying: the death camera has you)
      me.x = vx;
      me.z = vz;
      me.vx = me.vz = 0;
      me.speed = 0;
      me.y = floor;
      me.eyeCur = lerp(1.25 - depth * 0.3, 1.0, pull);
      const shake = tr.out ? 0 : 0.05;
      me.yaw = yaw + PI + Math.sin(tr.t * 13) * shake + Math.sin(tr.t * 5.3) * 0.08; // (out of it: at the hands)
      me.pitch = -0.12 + Math.sin(tr.t * 11) * shake * 0.6 + (tr.out === 'rescued' ? pull * 0.35 : 0);
    }
    for (let k = 0; k < 2; k++) {
      if (tr.hands[k] !== me.id || !me.alive) continue;
      const s = k ? 1 : -1;
      const back = 1.0 + (tr.pullT > 0 ? 0.12 : 0) + (tr.out === 'rescued' ? pull * 0.55 : 0);
      me.x = base.x + fwd.x * (c.D.d / 2 + back) + right.x * s * 0.42;
      me.z = base.z + fwd.z * (c.D.d / 2 + back) + right.z * s * 0.42;
      me.vx = me.vz = 0;
      me.speed = 0;
      me.y = g.world.terrain.height(me.x, me.z) + (floor - g.world.terrain.height(base.x, base.z));
      me.eyeCur = lerp(1.45, 0.75, pull);
      me.yaw = yaw + s * 0.36; // (at the doors, turned in toward the one between you)
      me.pitch = -0.28 + (tr.out === 'rescued' ? pull * 0.5 : 0);
    }
  }

  // ---------------- remote bodies ----------------
  // a body the шкафандр has finished with (for half a second you still see it go in)
  hides(r) {
    if (!r.consumed) return false;
    const tr = this.trap;
    return !(tr && tr.victim === r.id && tr.out === 'died' && tr.outT < 0.5);
  }

  poseRemote(r) {
    const tr = this.trap;
    if (!tr) return false;
    const c = this.list[tr.ci];
    const yaw = c.spec.yaw;
    const fwd = c.fwd;
    const base = c.group.position;
    const floor = base.y - (c.D.lift || 0);
    const pull = tr.out === 'rescued' ? smoothstep(0, 0.45, tr.outT) : 0;
    if (tr.victim === r.id && (r.alive || tr.out === 'died')) {
      if (tr.out === 'died' && tr.outT > 0.5) {
        r.rig.root.visible = false;
        return true;
      }
      const depth = lerp(tr.sink, -1.1, pull) + (tr.out === 'died' ? smoothstep(0, 0.5, tr.outT) * 0.6 : 0);
      poseGrabbed(r.rig, tr.t, tr.hands, pull);
      r.rig.root.position.set(base.x + fwd.x * (c.D.d / 2 - depth * 0.45 - 0.05), floor, base.z + fwd.z * (c.D.d / 2 - depth * 0.45 - 0.05));
      r.rig.root.rotation.set(0, yaw, 0);
      return true;
    }
    const k = tr.hands.indexOf(r.id);
    if (k >= 0 && r.alive) {
      const s = k ? 1 : -1;
      const right = _u.set(Math.cos(yaw), 0, -Math.sin(yaw));
      const back = 1.0 + (tr.yank > 0 ? 0.1 : 0) + pull * 0.55;
      const x = base.x + fwd.x * (c.D.d / 2 + back) + right.x * s * 0.42;
      const z = base.z + fwd.z * (c.D.d / 2 + back) + right.z * s * 0.42;
      if (pull > 0.05) poseSprawled(r.rig, pull);
      else poseRescuer(r.rig, s, tr.yank > 0 ? 1 : 0.4 + 0.15 * Math.sin(tr.t * 9));
      r.rig.root.position.set(x, g_height(this.g, x, z, floor, base), z);
      r.rig.root.rotation.set(0, yaw + PI + s * 0.36, 0);
      return true;
    }
    return false;
  }

  // ---------------- first person: your arms ----------------
  placeView(camera, show) {
    const tr = this.trap;
    const me = this.g.player;
    const role = show && tr && !tr.free && me.alive ? (tr.victim === me.id ? 'victim' : tr.hands.includes(me.id) ? 'rescuer' : null) : null;
    if (!role) {
      for (const a of this.arms) a.g.visible = a.hand.visible = false;
      return;
    }
    if (!this.armMat) {
      this.armMat = createPersonMaterial(dyeColors(myFit()), 0xffffff);
      for (const a of this.arms) a.fore.material = a.hand.material = this.armMat;
    }
    const c = this.list[tr.ci];
    const tt = tr.t;
    for (const a of this.arms) {
      // the shoulder, in camera space → world
      const sh = _v.set(a.s * 0.21, -0.3, 0.02).applyMatrix4(camera.matrixWorld);
      let target;
      if (role === 'victim') {
        // reaching out of it — to the hand that holds yours, or at nothing
        const k = a.s < 0 ? 1 : 0; // (you face out of it: hand 1 is the one on your left)
        const holder = tr.hands[k] && this.g.playerById(tr.hands[k]);
        if (holder && !tr.out) target = _w.set(holder.x, holder.y + 1.05, holder.z).lerp(sh, 0.35);
        else target = _w.set(a.s * 0.26 + Math.sin(tt * 9 + a.s) * 0.08, -0.1 + Math.sin(tt * 7 + a.s * 2) * 0.1, -0.55).applyMatrix4(camera.matrixWorld);
      } else {
        // both hands on the one you're pulling
        const p = c.group.position;
        target = _w.set(p.x + c.fwd.x * (c.D.d / 2 + 0.25), p.y + 1.05 - (c.D.lift || 0), p.z + c.fwd.z * (c.D.d / 2 + 0.25));
        _v.copy(target).sub(sh);
        const len = _v.length();
        if (len > 0.62) target.copy(sh).addScaledVector(_v.divideScalar(len), 0.62);
        target.y += a.s * 0.015;
      }
      const len = Math.max(0.1, sh.distanceTo(target));
      a.g.position.copy(sh);
      a.g.lookAt(target);
      a.g.rotateY(PI); // (the forearm runs along −z from the shoulder)
      a.fore.scale.set(1, 1, len - 0.04);
      a.hand.position.copy(target);
      a.hand.quaternion.copy(a.g.quaternion);
      a.g.visible = a.hand.visible = true;
    }
  }
}

function g_height(g, x, z, floor, base) {
  return g.world.terrain.height(x, z) + (floor - g.world.terrain.height(base.x, base.z));
}
