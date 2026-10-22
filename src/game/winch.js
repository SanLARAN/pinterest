// The way out of the bog — 3.0f. The УАЗ is not stripped; it is stuck. It went down the old causeway and the
// water came up round its hubs, and there is exactly one thing that will move it: the winch on its nose, the
// cable run out to a leaning post, and forty seconds of turning the drum by hand.
//
// The catch is the water. Every pump that is not running gives it back — stop cranking and the winch slips
// backwards while the bog climbs back over the wings. The drum has a ratchet, so you never lose the whole
// thing at once; you only lose the seconds you did not spend turning it.
//
// Hold E at the drum: the drum turns, the cable tightens, the car climbs out of the hole onto the planks.
// Then hold E at the driver's door: the starter catches, the engine runs, and everything on the участок hears it.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { t } from '../core/i18n.js';
import { clamp } from '../core/rng.js';

export const WINCH = {
  reelT: 40, // seconds of turning, in total
  attachR: 2.4, // where the drum can be reached (from the nose of the car)
  carR: 2.8, // ...and the driver's door
  crankT: 3.0, // the starter, once the car is up on the planks
  // every dead pump costs 0.6% of the drum a second, against the 2.5% a second of turning: one or two down and
  // you get there slowly, three down and it is a crawl, all five down and no amount of turning gets ahead of it
  slipPerPump: 0.006,
  lift: 1.15, // metres of car that come out of the water, nose first
  nose: 2.6, // the drum sits this far ahead of the car's centre
  postTop: 0.35, // the cable runs to the post a little below its top
  ringR: 6, // the splash ring the cable throws, every metre it comes in
};

export class Winch {
  constructor(game) {
    this.g = game;
    this.cable = null;
    this.reset();
  }

  reset() {
    this.p = 0; // 0..1 — how far the car has been dragged out
    this.crank = 0;
    this.done = false;
    this.driven = false;
    this.said = {}; // one-shot lines
    if (this.cable && this.g.scene) this.g.scene.remove(this.cable); // a new shift, a new cable
    this.cable = null;
    this.car = null;
    this.post = null;
    if (this.g.map !== 'bog' || !this.g.world || !this.g.world.car) return;
    this.car = this.g.world.car;
    this.post = this.car.post;
    this._buildCable();
  }

  _buildCable() {
    const g = this.g;
    if (!g.scene || !this.car) return;
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    // (the colour of wet steel: it reads in an echo like everything else)
    this.cable = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x8d8d86 }));
    this.cable.frustumCulled = false;
    g.scene.add(this.cable);
    this._tighten();
  }

  drum() {
    const c = this.car;
    if (!c) return { x: 0, y: 0, z: 0 };
    const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
    const x = c.x + fx * WINCH.nose, z = c.z + fz * WINCH.nose;
    return { x, y: this.carY() + 0.5, z };
  }

  carY() {
    const c = this.car;
    if (!c) return 0;
    return (c.baseY ?? c.y ?? 0) + WINCH.lift * clamp(this.p, 0, 1);
  }

  _tighten() {
    if (!this.cable) return;
    const a = this.drum(), b = this.post;
    if (!b) return;
    const pos = this.cable.geometry.attributes.position;
    pos.setXYZ(0, a.x, a.y, a.z);
    pos.setXYZ(1, b.x, (b.y ?? 0) + WINCH.postTop, b.z);
    pos.needsUpdate = true;
    this.cable.geometry.computeBoundingSphere();
  }

  // what is holding the car back right now
  slip() {
    const gens = (this.g.objectives && this.g.objectives.gens) || [];
    let off = 0;
    for (const x of gens) if (!x.running) off++;
    return off * WINCH.slipPerPump;
  }

  // the drum and the door, as things in front of you
  consider(consider) {
    if (this.g.map !== 'bog' || !this.car || this.driven) return;
    const d = this.drum();
    consider(this, d.x, d.z, WINCH.attachR, 'winch');
    if (this.done) consider(this, this.car.x, this.car.z, WINCH.carR, 'bogCar');
  }

  prompt(kind, T) {
    if (kind === 'bogCar') {
      return this.crank > 0
        ? `${t('winchCranking')} ${Math.round((100 * this.crank) / WINCH.crankT)}%`
        : T('winchStart');
    }
    const pct = Math.round(this.p * 100);
    if (this.slip() > 0) return `${T('winchTurn')} ${pct}% · ${t('winchSlip').replace('{n}', String(100 - pct))}`;
    return `${T('winchTurn')} ${pct}%`;
  }

  // E, held, at one of the two places
  interact(best, dt, held, still, T) {
    const g = this.g;
    if (!g.hud) return;
    if (best.kind === 'winch') {
      const ok = !this.done && still;
      g.hud.setUse(this.prompt('winch', T), this.p, ok);
      if (!ok || !held) return;
      const was = this.p;
      this.p = clamp(this.p + dt / WINCH.reelT, 0, 1);
      // every metre of cable that comes in throws a ring into the water
      const step = 1 / WINCH.reelT;
      if (g.pulses && Math.floor(this.p / step) !== Math.floor(was / step)) {
        const d = this.drum();
        const lvl = (g.world && g.world.water && g.world.water.level != null) ? g.world.water.level : d.y;
        g.pulses.emitStep(d.x, lvl, d.z, g.time || 0, { radius: WINCH.ringR, strength: 0.6, speed: 12, decay: 1.6, kind: 'step' });
      }
      if (!this.said.first) {
        this.said.first = true;
        g.hud.setHint(t('winchHint'));
      }
      if (this.p >= 1 && !this.done) this._freed();
      return;
    }
    if (best.kind === 'bogCar') {
      if (!this.done) { g.hud.setUse(t('winchNeedFirst'), 0, false); return; } // in the water is not in the car
      g.hud.setUse(this.prompt('bogCar', T), this.crank / WINCH.crankT, true);
      if (!held || !still) return;
      this.crank = Math.min(WINCH.crankT, this.crank + dt);
      if (this.crank >= WINCH.crankT) this._drive();
    }
  }

  // the car is out of the hole: it stands on the planks, and only the engine is left
  _freed() {
    const g = this.g;
    this.done = true;
    g.hud && g.hud.flashAlert(t('winchOut'), 'dawn', 3);
    g.hud && g.hud.setHint(t('winchNeedsStart'));
    g.audio && g.audio.winchClank && g.audio.winchClank();
    g.addTrauma && g.addTrauma(0.2);
    if (g.sync && g.auth) g.sync.ev('wn', 1);
    g.hlNote && g.hlNote('winch');
  }

  _drive() {
    const g = this.g;
    if (this.driven) return;
    this.driven = true;
    if (typeof document !== 'undefined') document.body.classList.add('cutscene');
    g.audio && g.audio.genStart && g.audio.genStart(this.car.x, this.carY(), this.car.z);
    // an engine in the bog: the whole участок hears it, and it does not care
    if (g.noise) g.noise(this.car.x, this.car.z, 1.6, 'engine');
    const bonus = CFG.SCORE.win + Math.max(0, Math.round(g.shiftLeft ? g.shiftLeft() : 0)) * CFG.SCORE.speedBonus;
    g.winBonus = bonus;
    g.score = (g.score || 0) + bonus;
    if (g.stats) g.stats.escaped = 1;
    g.escaped = true;
    g.state = 'won';
    if (g.onEnd) g.onEnd({ won: true, escaped: true, coop: g.online, alive: g.player ? g.player.alive : true, map: 'bog' });
  }

  // the last dawn does not end the shift by itself on the bog: the car does (see game.js updateDawn)
  finale() {
    const g = this.g;
    if (this.driven) return;
    if (!this.said.finale) {
      this.said.finale = true;
      g.hud && g.hud.flashAlert(t('winchFinale'), 'dawn', 4);
      g.hud && g.hud.setHint(t('winchHint'));
      // a beacon you can see from anywhere with the cable still on the drum
      g.radar && g.radar.blip && g.radar.blip(this.car.x, this.car.z, 'beacon');
    }
  }

  update(dt) {
    const g = this.g;
    if (g.map !== 'bog' || !this.car) return;
    // the bog comes back while the drum is still
    if (!this.done && this.p > 0) {
      const slip = this.slip();
      if (slip > 0) this.p = clamp(this.p - slip * dt, 0, 1);
    }
    const y = this.carY();
    if (this.car.node) this.car.node.position.y = y;
    this.car.y = y;
    this._tighten();
  }
}
