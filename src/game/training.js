// The driving school behind the forestry gates: a rack of every field item, in daylight, with nothing
// hunting you. Take what you like, try it on the trees, put it back by dropping it — the rack never runs
// out. Four enduro bikes wait by the pad (see Moto).
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { clamp } from '../core/rng.js';
import { t } from '../core/i18n.js';
import { KIND, MeshBuilder } from '../world/builder.js';
import { geometryOf } from './uaz.js';
import { bagName } from './inventory.js';

const KINDS = ['stones', 'glow', 'torch', 'flare', 'battery', 'tape', 'crowbar', 'map', 'adrenaline'];
const TINT = {
  stones: 0x9aa3a8, glow: 0x84c48b, torch: 0xc9c0a0, flare: 0xb45a3f, battery: 0x6d7f6a,
  tape: 0x8a7954, crowbar: 0x8f3f36, map: 0xc8bd93, adrenaline: 0xd8c7a0,
};

function itemMat(hex) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(hex) } },
    vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; varying vec3 vN; void main(){
      float sh = .5 + .5 * max(0.0, dot(normalize(vN), normalize(vec3(-.35,.85,.4))));
      gl_FragColor = vec4(uColor * sh * 1.05, 1.0); }`,
  });
}

export class Training {
  constructor(game) {
    this.g = game;
    this.root = null;
    this.items = [];
    this.useWas = false;
    this.t = 0;
    this.flash = 0;
  }

  reset(show = true) {
    // a normal night never builds the school: it is only geometry when you are out there
    if (!show) { if (this.root) { this.root.visible = false; this.items = []; } return; }
    if (this.root) {
      this.g.scene.remove(this.root);
      this.root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material?.map) o.material.map.dispose();
        if (o.material?.dispose) o.material.dispose();
      });
    }
    this.root = new THREE.Group();
    this.items = [];
    this.root.visible = !!show;
    this.g.scene.add(this.root);
    const { rack } = CFG.TRAINING;
    const y = this.g.world.terrain.height(rack.x, rack.z);
    // the bench: planks on two trestles, with a back rail
    const benchMat = itemMat(0x6b5136);
    const postMat = itemMat(0x4a3a28);
    const add = (geo, mat, x, yy, z, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, yy, z);
      m.rotation.set(rx, ry, rz);
      this.root.add(m);
      return m;
    };
    const boxGeo = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const span = 5.4;
    add(boxGeo(span, 0.1, 0.85), benchMat, rack.x, y + 0.95, rack.z);
    add(boxGeo(span, 0.08, 0.08), postMat, rack.x, y + 1.55, rack.z - 0.36);
    for (const x of [-span / 2 + 0.2, span / 2 - 0.2]) {
      for (const z of [-0.3, 0.3]) add(boxGeo(0.12, 0.95, 0.12), postMat, rack.x + x, y + 0.475, rack.z + z);
    }
    add(boxGeo(span, 0.05, 0.3), postMat, rack.x, y + 0.62, rack.z);
    // a lamp over the bench: the morning is honest daylight, but a work light reads well under the trees
    add(new THREE.CylinderGeometry(0.22, 0.26, 0.16, 10), itemMat(0x2b2f28), rack.x, y + 2.25, rack.z);
    // one pedestal per kind, with the name on a little board
    const geoCache = {};
    KINDS.forEach((kind, i) => {
      const x = rack.x - span / 2 + 0.55 + i * ((span - 1.1) / (KINDS.length - 1));
      const z = rack.z + 0.02;
      const board = this.board(bagName(kind));
      board.position.set(x, y + 1.18, rack.z - 0.38);
      this.root.add(board);
      let geo = geoCache[kind];
      if (!geo) {
        if (kind === 'torch') geo = this.g.torch.geo;
        else if (kind === 'tape' || kind === 'crowbar') geo = this.g.tools.geo?.[kind];
        else geo = this.g.inventory.geo?.[kind];
        if (!geo) geo = new THREE.BoxGeometry(0.14, 0.1, 0.24);
        geo.computeVertexNormals?.();
        geoCache[kind] = geo;
      }
      const mesh = new THREE.Mesh(geo, itemMat(TINT[kind] || 0xaaaaaa));
      mesh.scale.setScalar(kind === 'map' ? 2.4 : 2.0);
      mesh.position.set(x, y + 1.28, z);
      mesh.userData.kind = kind;
      this.root.add(mesh);
      this.items.push({ kind, mesh, x, z, y: y + 0.98, taken: 0 });
    });
    // a sign on two posts, so you know what this place is
    const sign = this.board(t('trainingTitle'), 2.6, 0.7);
    sign.position.set(rack.x, y + 2.0, rack.z + 1.6);
    this.root.add(sign);
    for (const x of [-1, 1]) add(boxGeo(0.1, 2.0, 0.1), postMat, rack.x + x, y + 1.0, rack.z + 1.6);
  }

  // a small canvas board with a caption
  board(text, w = 1.0, h = 0.28) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = Math.round((512 * h) / w);
    const x = c.getContext('2d');
    x.fillStyle = '#1b1d16'; x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = '#8b8b63'; x.lineWidth = 8; x.strokeRect(6, 6, c.width - 12, c.height - 12);
    x.fillStyle = '#d6d1ac';
    x.font = `bold ${Math.round(c.height * 0.34)}px 'JetBrains Mono', monospace`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(String(text), c.width / 2, c.height / 2, c.width - 40);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
    return mesh;
  }

  update(dt, raw) {
    const g = this.g, p = g.player;
    this.t += dt;
    for (const it of this.items) {
      it.mesh.rotation.y += dt * 0.7;
      it.mesh.position.y = it.y + 0.3 + Math.sin(this.t * 1.6 + it.x) * 0.035;
      it.taken = Math.max(0, it.taken - dt);
    }
    if (g.inventory.active || g.moto?.riding || !p.alive) return false;
    // the nearest pedestal in front of you
    const f = p.forward();
    let best = null, bd = 2.4;
    for (const it of this.items) {
      const dx = it.x - p.x, dz = it.z - p.z, d = Math.hypot(dx, dz);
      if (d > bd) continue;
      if (d > 0.9 && (dx * f.x + dz * f.z) / d < 0.2) continue;
      bd = d; best = it;
    }
    if (!best) return false;
    g.hud.setUse(`${t(g.input.touch ? 'rackTakeT' : 'rackTake')} · ${bagName(best.kind)}`, 0, true);
    if (raw.events.includes('useDown')) this.give(best.kind);
    return true;
  }

  // (nothing near the rack)
  idle() { return false; }

  give(kind) {
    const g = this.g, inv = g.inventory;
    if (kind === 'tape' || kind === 'crowbar') {
      const it = g.tools.items.find((q) => q.kind === kind && q.state !== 'held');
      if (!it) { g.hud.popup(t('rackHeld'), 'dim'); return; }
      if (!inv.reserve(g.player.id, kind)) { inv.full(); return; }
      it.state = 'held'; it.owner = g.player.id; it.rev++;
      g.tools.apply(g.tools.pack(it), true);
      g.tools._got(it);
      inv.reconcile();
      return;
    }
    const d = { kind, n: 1 };
    if (kind === 'torch') d.charge = 1;
    if (kind === 'flare') { d.n = 2; d.gun = true; }
    inv.gain(d);
    g.hud.popup(`+ ${bagName(kind)}`, 'amber');
    if (g.audio.ready) g.audio.cabinetItem('nuts');
    const item = this.items.find((q) => q.kind === kind);
    if (item) item.taken = 0.5;
  }
}
