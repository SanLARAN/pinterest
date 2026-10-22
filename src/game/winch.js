// The way out of the bog — 3.0f, rebuilt for one car in 3.0m.
//
// Before: you arrived in one УАЗ and drove home in another, a wreck at the end of the causeway that had nothing
// to do with the shift. Now there is one car on the участок, the one that brought you, and it is standing where
// the opening film left it: nose into the flooded проезд, wheels in the softened rut.
//
// Two things have to be true before it will take you out, and they are the two things the night is about:
//   · the проезд has to be pumped down. The camp pump drains this sector; with the water still up, the starter
//     turns and the engine floods — «двигатель хлебнул» — and you have to go and start the pump first.
//   · the car has to come out of the rut. The winch drum sits on its own bumper, the cable runs back to a stake
//     on the bank, and it is twenty-five seconds of turning it by hand. Every pump that is not running gives
//     that back (0.6%/s against 4%/s of turning), so the drum and the pumps are the same argument.
//   · (3.0q) and the works' gate on the track out has to be up. Its contactor is in the shelter under the camp,
//     at the end of a corridor, past the crack — five pumps put the camp on the mains, but the road opens on the
//     breaker and on nothing else. Without it there is nowhere to drive to, so there is no point starting her.
//
// Then hold E at the driver's door: three seconds of starter, the engine catches, and the whole участок hears it.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { t } from '../core/i18n.js';
import { clamp } from '../core/rng.js';
import { waterKick } from './waves.js'; // (3.0n) dragging the car out shoves the water too

export const WINCH = {
  reelT: 25, // seconds of turning, in total (it is our own car at our own feet, not the far end of the map)
  attachR: 2.4, // where the drum can be reached (from the nose of the car)
  doorR: 2.9, // ...and the driver's door
  crankT: 3.0, // the starter, once the car is out of the rut and the ford is down
  // every dead pump costs 0.6% of the drum a second, against the 4% a second of turning: one or two down and
  // you get there slowly, three down and it is a crawl, all five down and no amount of turning gets ahead of it
  slipPerPump: 0.006,
  pull: 2.2, // metres of bank the car comes back up, out of the rut
  rise: 0.08, // ...and the little lift as its wheels find the gravel
  nose: 1.5, // the drum sits this far ahead of the car's centre (on the bumper)
  postTop: 0.75, // the cable is hitched round the stake at this height
  ringR: 6, // the splash ring the cable throws, every metre it comes in
  dryDepth: 0.35, // the проезд has to be shallower than this before the engine will take water
};

export class Winch {
  constructor(game) {
    this.g = game;
    this.cable = null;
    this.reset();
  }

  reset() {
    this.p = 0; // 0..1 — how far the car has been dragged out of the rut
    this.crank = 0;
    this.done = false;
    this.driven = false;
    this.said = {}; // one-shot lines
    if (this.cable && this.g.scene) this.g.scene.remove(this.cable); // a new shift, a new cable
    this.cable = null;
    this.car = null;
    this.post = null;
    if (this.g.map !== 'bog' || !this.g.world) return;
    const set = this.g.world.campSet;
    const car = this.g.world.crewCar;
    if (!set || !car) return;
    this.car = car; // (3.0m) the shift's own car: the one the film drove in
    this.home = { x: car.x, z: car.z, y: car.y }; // where it stands with the drum at zero
    this.post = set.anchor || null;
    this._buildCable();
    this._place();
  }

  _buildCable() {
    const g = this.g;
    if (!g.scene || !this.car || !this.post) return;
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    // (the colour of wet steel: it reads in an echo like everything else)
    this.cable = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x8d8d86 }));
    this.cable.frustumCulled = false;
    g.scene.add(this.cable);
    this._tighten();
  }

  // where the car stands for a given reel: it comes back up its own bank, away from the water
  spot(p = this.p) {
    const c = this.car;
    if (!c) return { x: 0, y: 0, z: 0 };
    const back = WINCH.pull * clamp(p, 0, 1);
    const x = this.home.x - c.nose.x * back;
    const z = this.home.z - c.nose.z * back;
    const y = (this.g.world?.terrain?.height(x, z) ?? this.home.y) + WINCH.rise * clamp(p, 0, 1);
    return { x, y, z };
  }

  // the drum on the car's bumper
  drum() {
    const c = this.car;
    if (!c) return { x: 0, y: 0, z: 0 };
    const s = this.spot();
    return { x: s.x + c.nose.x * WINCH.nose, y: s.y + 0.5, z: s.z + c.nose.z * WINCH.nose };
  }

  carY() {
    return this.spot().y;
  }

  // how deep the ford itself still is: the number the starter cares about
  ford() {
    const set = this.g.world?.campSet;
    const w = this.g.world?.water;
    if (!set?.water || !w || !w.depth) return 0;
    return w.depth(set.water.x, set.water.z);
  }

  flooded() {
    return this.ford() > WINCH.dryDepth;
  }

  // the works' gate on the track out: down until the shelter's breaker is thrown (there is no gate to open on
  // any other участок, and a game without a shelter — a test, a training run — is not held up by this)
  shut() {
    const b = this.g.bunker;
    return !!(b && b.B && !b.gateOpen);
  }

  _place() {
    const c = this.car;
    if (!c || !c.node) return;
    const s = this.spot();
    c.node.position.set(s.x, s.y, s.z);
    c.x = s.x;
    c.z = s.z;
    c.y = s.y;
  }

  _tighten() {
    if (!this.cable || !this.post) return;
    const a = this.drum(), b = this.post;
    const pos = this.cable.geometry.attributes.position;
    pos.setXYZ(0, a.x, a.y, a.z);
    pos.setXYZ(1, b.x, (b.y ?? this.g.world.terrain.height(b.x, b.z)) + WINCH.postTop, b.z);
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
    if (this.done) consider(this, this.car.x, this.car.z, WINCH.doorR, 'bogCar');
  }

  prompt(kind, T) {
    if (kind === 'bogCar') {
      if (this.flooded()) return t('winchFlooded');
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
      // every metre of cable that comes in throws a ring into the water at the edge of the bank
      const step = 1 / WINCH.reelT;
      if (g.pulses && Math.floor(this.p / step) !== Math.floor(was / step)) {
        const s = this.spot();
        const lvl = (g.world && g.world.water && g.world.water.level != null) ? g.world.water.level : s.y;
        g.pulses.emitStep(s.x + this.car.nose.x * 1.2, lvl, s.z + this.car.nose.z * 1.2, g.time || 0, { radius: WINCH.ringR, strength: 0.6, speed: 12, decay: 1.6, kind: 'step' });
        // (3.0n) and the winch drags the car through the shallows: the surface feels that too
        if (g.waves) waterKick(g.waves, g.world, s.x + this.car.nose.x * 1.2, s.z + this.car.nose.z * 1.2, g.time || 0, 'body', 1.2);
      }
      if (!this.said.first) {
        this.said.first = true;
        g.hud.setHint(t('winchHint'));
      }
      if (this.p >= 1 && !this.done) this._freed();
      return;
    }
    if (best.kind === 'bogCar') {
      if (!this.done) { g.hud.setUse(t('winchNeedFirst'), 0, false); return; } // in the rut is not out of it
      // (3.0m) the water decides: the проезд is pumped down or the engine floods
      if (this.flooded()) {
        g.hud.setUse(t('winchFlooded'), this.ford(), false);
        if (!this.said.drown) {
          this.said.drown = true;
          g.hud.setHint(t('winchFloodedHint'));
          g.audio && g.audio.clank && g.audio.clank(this.car.x, this.car.y + 0.6, this.car.z, true);
        }
        return;
      }
      // (3.0q) the way out of the участок is a gate on the track, and it is down until the breaker under the camp
      // is thrown. Say so, once, and do not turn the starter into a wall.
      if (this.shut()) {
        g.hud.setUse(t('winchGateShut'), 0, false);
        if (!this.said.gate) {
          this.said.gate = true;
          g.hud.setHint(t('winchGateShutHint'));
          g.audio && g.audio.clank && g.audio.clank(this.car.x, this.car.y + 0.6, this.car.z, true);
        }
        return;
      }
      g.hud.setUse(this.prompt('bogCar', T), this.crank / WINCH.crankT, true);
      if (!held || !still) return;
      this.crank = Math.min(WINCH.crankT, this.crank + dt);
      if (this.crank >= WINCH.crankT) this._drive();
    }
  }

  // the car is out of the rut: it stands on the bank, and only the engine is left
  _freed() {
    const g = this.g;
    this.done = true;
    g.hud && g.hud.flashAlert(t('winchOut'), 'dawn', 3);
    g.hud && g.hud.setHint(this.shut() ? t('winchGateShutHint') : this.flooded() ? t('winchFloodedHint') : t('winchNeedsStart'));
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
    g.audio && g.audio.genStart && g.audio.genStart(this.car.x, this.car.y, this.car.z);
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
    if (this.driven || !this.car) return;
    if (!this.said.finale) {
      this.said.finale = true;
      g.hud && g.hud.flashAlert(t('winchFinale'), 'dawn', 4);
      g.hud && g.hud.setHint(this.shut() ? t('winchGateShutHint') : this.flooded() ? t('winchFloodedHint') : t('winchHint'));
      // a beacon you can see from anywhere, on the car you came in
      g.radar && g.radar.blip && g.radar.blip(this.car.x, this.car.z, 'beacon');
    }
  }

  update(dt) {
    const g = this.g;
    if (g.map !== 'bog' || !this.car) return;
    // the bog comes back into the rut while the drum is still
    if (!this.done && this.p > 0) {
      const slip = this.slip();
      if (slip > 0) this.p = clamp(this.p - slip * dt, 0, 1);
    }
    this._place();
    this._tighten();
  }
}
