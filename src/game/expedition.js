// Fire lookout: a physical, noisy climb and a fixed observation platform. The binoculars amplify the
// image for ten seconds, not the world's light: they do NOT freeze the Watcher or reveal through walls.
// The camp's horn is a world lure: only the host runs its hearing; everyone hears the same broadcast.
import * as THREE from 'three';
import { CFG } from '../core/config.js';
import { t } from '../core/i18n.js';
import { shared } from '../render/sonar.js';
import { FIRETOWER, ZARYA, buildBinoculars } from '../world/expedition.js';
import { geometryOf } from './uaz.js';

const _v = new THREE.Vector3();
export class Expedition {
  constructor(game) {
    this.g = game;
    this.F = game.world.firetower;
    this.C = game.world.zarya;
    this.optic = new THREE.Mesh(geometryOf(buildBinoculars().toArrays()), game.world.material);
    this.optic.position.set(this.F.x, this.F.y + FIRETOWER.deck + 1.32, this.F.z - 0.7);
    this.optic.frustumCulled = false;
    game.scene.add(this.optic);
    this.el = document.createElement('div');
    this.el.id = 'binoculars';
    this.el.innerHTML = `<div class="bino-markers"></div><svg viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><defs><mask id="binoMask"><rect width="1000" height="600" fill="white"/><ellipse cx="360" cy="300" rx="285" ry="245" fill="black"/><ellipse cx="640" cy="300" rx="285" ry="245" fill="black"/></mask></defs><rect width="1000" height="600" fill="#020403" mask="url(#binoMask)"/><path d="M460 300h25m30 0h25M500 260v24m0 32v24" stroke="#a2c79c" stroke-width="0.8" fill="none" opacity=".55"/></svg><div class="bino-head"></div><div class="bino-time"></div><div class="bino-exit"></div>`;
    document.getElementById('hud').append(this.el);
    this.markers = this.el.querySelector('.bino-markers');
    this.head = this.el.querySelector('.bino-head');
    this.timer = this.el.querySelector('.bino-time');
    this.exit = this.el.querySelector('.bino-exit');
    this.ghosts = new Map();
    this.reset();
  }
  get onTower() { return this.tower !== null; }
  get viewing() { return this.viewT > 0 && this.tower?.phase === 'top'; }
  get clock() { return this.g.auth ? this.g.time : this.g.netT; }

  reset() {
    this.silence();
    this.tower = null;
    this.viewT = this.cooldown = this.climbT = this.stepT = 0;
    this.speaker = { rev: 0, used: false, end: 0 };
    this.speakerNoiseT = 0;
    this.discovered = new Set();
  }
  silence() {
    this.closeView();
    if (this.sound) this.sound.stop();
    this.sound = null;
    document.body.classList.remove('on-tower', 'binocular-view');
    this.el.classList.remove('show');
  }
  closeView() {
    if (this.viewT > 0) {
      this.cooldown = FIRETOWER.cooldown;
      const cam = this.g.camera;
      if (cam) { cam.fov = CFG.FOV; cam.far = CFG.CAMERA_FAR; cam.updateProjectionMatrix(); }
    }
    this.viewT = 0;
    shared.uSurvey.value = 0;
    this.el.classList.remove('show');
    for (const gh of this.ghosts.values()) this.g.ghosts.release(gh);
    this.ghosts.clear();
  }

  consider(fn) {
    const g = this.g;
    if (this.onTower || !g.player.alive || g.inputMuted || g.player.carrying || g.escape.held || g.escape.mySeat >= 0 || g.cabinets.busy) return;
    fn(this.F, this.F.ladder.x, this.F.ladder.z, 1.9, 'lookout');
    const S = this.C.switch;
    fn(this.C, S.x, S.z, 1.7, 'campSpeaker');
  }
  interact(best, dt, held, pressed, T) {
    const g = this.g;
    if (best.kind === 'lookout') {
      g.hud.setUse(T('useLookout'), this.climbT / 0.35, true);
      if (held && g.player.speed < 0.6 && !g.inputMuted) this.climbT += dt;
      else this.climbT = 0;
      if (this.climbT >= 0.35) {
        this.tower = { phase: 'up', h: 0 };
        this.climbT = 0;
        g.tools.cancelRecord();
        g.hud.popup(t('lookoutCreak'), 'dim');
      }
    } else {
      const active = this.speaker.end > this.clock;
      g.hud.setUse(this.speaker.used && !active ? t('speakerSpent') : T(active ? 'useSpeakerOff' : 'useSpeaker'), 0, !this.speaker.used || active, this.speaker.used && !active);
      if (pressed && (!this.speaker.used || active)) {
        if (g.auth) this.switchSpeaker(g.player.id, !active);
        else g.coop.toHost('su', active ? 0 : 1);
      }
    }
  }
  idle() { this.climbT = 0; }
  ladderFx(x, y, z) {
    const g = this.g;
    if (g.audio.ready) g.audio.ladderStep(x, y + 0.3, z);
    g.pulses.emit(x, y + 0.3, z, g.time, { radius: 9, strength: 0.6, decay: 1.4, color: [0.75, 0.7, 0.6], kind: 'ladder' });
  }

  towerPrompt() {
    const g = this.g, tw = this.tower;
    if (!tw) return;
    const T = (k) => t(g.input.touch ? k + 'T' : k);
    if (tw.phase === 'up') g.hud.setUse(T('useClimbing'), tw.h / FIRETOWER.deck, true);
    else if (tw.phase === 'down') g.hud.setUse(t('lookoutDescending'), 1 - tw.h / FIRETOWER.deck, false);
    else {
      const line = this.cooldown > 0 && !this.viewing ? t('binoCooldown').replace('{n}', Math.ceil(this.cooldown)) : T(this.viewing ? 'useBinoOff' : 'useBino');
      g.hud.setUse(line, this.viewing ? this.viewT / FIRETOWER.look : 0, this.cooldown <= 0 || this.viewing);
      if (!g.inputMuted && g.events.includes('useDown')) this.toggleView();
    }
  }
  descend() {
    if (!this.tower) return;
    this.closeView();
    this.tower.phase = 'down';
  }
  toggleView() {
    const g = this.g;
    if (this.viewing) { this.cooldown = FIRETOWER.cooldown; this.closeView(); return; }
    if (this.tower?.phase !== 'top' || this.cooldown > 0) return;
    this.viewT = FIRETOWER.look;
    this.surveyT = 0;
    const p = g.player;
    this.genLOS = new Set(g.objectives.gens.filter((gen) => !g.world.losBlocked(p.x, p.y + p.eyeCur, p.z, gen.x, gen.y + 3, gen.z, 1)));
    this.head.textContent = t('binoTitle');
    this.exit.textContent = t(g.input.touch ? 'binoExitT' : 'binoExit');
    if (g.audio.ready) g.audio.torchClick(true);
    g.stats.surveys = (g.stats.surveys | 0) + 1;
  }

  switchSpeaker(pid, on) {
    const g = this.g, p = g.playerById(pid), S = this.C.switch;
    if (!g.auth || g.state !== 'play' || !p?.alive || Math.hypot(p.x - S.x, p.z - S.z) > 2.6 || Math.abs(p.y - this.C.y) > 2) return false;
    const active = this.speaker.end > g.time;
    if (on ? this.speaker.used : !active) return false;
    this.speaker.used = true;
    this.speaker.end = on ? g.time + ZARYA.duration : 0;
    this.speaker.rev++;
    this.speakerNoiseT = 0;
    if (g.sync) g.sync.ev('spe', this.netState());
    return true;
  }
  netState() { const s = this.speaker; return [s.rev, s.used ? 1 : 0, Math.round(s.end * 100) / 100]; }
  netMerge(a) {
    if (!Array.isArray(a) || a.length !== 3 || !a.every(Number.isFinite) || a[0] <= this.speaker.rev) return;
    this.speaker = { rev: a[0], used: !!a[1], end: a[2] };
    this.speakerNoiseT = 0;
  }

  update(dt) {
    const g = this.g, p = g.player, tw = this.tower;
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (tw) {
      if (g.state !== 'play' || !p.alive || g.cabinets.busy) {
        this.closeView();
        p.y = g.world.terrain.height(p.x, p.z);
        this.tower = null;
      } else {
        if (tw.phase === 'up') {
          if (!g.input.useHeld || g.inputMuted) tw.phase = 'down';
          else tw.h = Math.min(FIRETOWER.deck, tw.h + FIRETOWER.deck / FIRETOWER.climb * dt);
          if (tw.h >= FIRETOWER.deck) {
            tw.phase = 'top';
            g.hud.popup(t(g.input.touch ? 'lookoutTopT' : 'lookoutTop'), 'dim');
          }
        } else if (tw.phase === 'down') {
          tw.h = Math.max(0, tw.h - FIRETOWER.deck / FIRETOWER.descend * dt);
          if (tw.h <= 0) {
            this.tower = null;
            p.x = this.F.ladder.x; p.z = this.F.ladder.z + 0.6;
            p.y = g.world.terrain.height(p.x, p.z);
          }
        }
        if (this.tower) {
          p.x = this.F.x;
          p.z = this.F.ladder.z + (this.F.top.z - this.F.ladder.z) * (tw.h / FIRETOWER.deck);
          p.y = this.F.y + tw.h;
          p.vx = p.vz = p.speed = p.bobY = 0;
          p.eyeCur = CFG.PLAYER.eye;
          if (!g.inputMuted) p.yaw -= g.input.turn * dt * (this.viewing ? 0.45 : 1.6);
          if (tw.phase !== 'top') {
            this.stepT -= dt;
            if (this.stepT <= 0) {
              this.stepT = 0.65;
              this.ladderFx(p.x, p.y, p.z);
              g.playerNoise(p.x, p.z, 0.3, 'ladder');
              if (g.sync) g.sync.ev('ls', Math.round(p.y * 100) / 100);
            }
          }
        }
      }
    }
    if (this.viewing) {
      if (g.inputMuted) this.closeView();
      else {
        this.viewT = Math.max(0, this.viewT - dt);
        shared.uSurvey.value = Math.min(1, this.viewT / 0.5);
        if (this.viewT <= 0) { this.cooldown = FIRETOWER.cooldown; this.closeView(); }
        else this.survey(dt);
      }
    } else shared.uSurvey.value = 0;
    document.body.classList.toggle('on-tower', this.onTower);
    document.body.classList.toggle('binocular-view', this.viewing);
    this.el.classList.toggle('show', this.viewing);
    if (this.viewing) this.timer.textContent = `${Math.ceil(this.viewT)} s`;
    const active = this.speaker.end > this.clock && g.state === 'play';
    if (active) {
      const S = this.C.speaker;
      if (!this.sound && g.audio.ready && g.distToEars(S.x, S.z) < 145) this.sound = g.audio.campSpeaker(S.x, S.y, S.z);
      this.speakerNoiseT -= dt;
      if (this.speakerNoiseT <= 0) {
        this.speakerNoiseT = 2.5;
        g.noise(S.x, S.z, ZARYA.loud, 'speaker');
        g.pulses.emit(S.x, S.y, S.z, g.time, { radius: 28, strength: 0.85, decay: 1, color: [0.8,0.58,0.4], kind: 'speaker' });
      }
    } else if (this.sound) { this.sound.stop(); this.sound = null; }
    // Optional landmarks get a single discreet arrival toast, not persistent HUD clutter.
    if (p.alive && g.state === 'play') for (const [key, L, radius] of [['zarya', this.C, 33], ['firetower', this.F, 13]]) {
      if (!this.discovered.has(key) && Math.hypot(p.x - L.x, p.z - L.z) < radius) {
        this.discovered.add(key);
        g.stats[key === 'zarya' ? 'camps' : 'lookouts'] = 1;
        g.hud.popup(t(key === 'zarya' ? 'zaryaArrival' : 'lookoutArrival'), 'dim');
      }
    }
  }

  // Moving things in the amplified image: real, refreshed poses, not radar dots through walls.
  survey(dt) {
    this.surveyT -= dt;
    const check = this.surveyT <= 0;
    if (check) this.surveyT = 0.12;
    const g = this.g, p = g.player;
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    for (const m of g.monsters) {
      let gh = this.ghosts.get(m);
      if (!check) { if (gh) g.ghosts.refresh(gh, m.rig); continue; }
      const dx = m.x - p.x, dz = m.z - p.z, d = Math.hypot(dx, dz);
      const seen = m.alive && m.state !== 'lurk' && m.speedCur > 0.12 && d < FIRETOWER.far && d > 0.1 && (dx * fx + dz * fz) / d > 0.88 && !g.world.losBlocked(p.x, p.y + p.eyeCur, p.z, m.x, m.y + 1.4, m.z, 1);
      if (seen) {
        if (!gh) { gh = g.ghosts.spawn(m.rig, g.time, { sticky: true, strength: 0.65, full: 0.08, body: 0.65, color: 0xe18861, jitter: 0.3 }); this.ghosts.set(m, gh); }
        else g.ghosts.refresh(gh, m.rig);
        g.stats.seen[m.type] = 1;
      } else if (gh) { g.ghosts.release(gh); this.ghosts.delete(m); }
    }
    for (const [m, gh] of this.ghosts) if (!g.monsters.includes(m)) { g.ghosts.release(gh); this.ghosts.delete(m); }
  }

  applyView(camera) {
    const g = this.g, active = this.viewing && g.player.alive;
    const far = active ? FIRETOWER.far : CFG.CAMERA_FAR;
    if (camera.far !== far) { camera.far = far; camera.updateProjectionMatrix(); }
    this.optic.visible = !this.onTower;
    if (!active) {
      if (this.markerHTML) { this.markers.replaceChildren(); this.markerHTML = ''; }
      return;
    }
    const markers = [];
    for (const gen of g.objectives.gens) {
      _v.set(gen.x, gen.y + 3, gen.z);
      const d = _v.distanceTo(camera.position);
      if (d > FIRETOWER.far || !this.genLOS?.has(gen)) continue;
      _v.project(camera);
      if (_v.z < -1 || _v.z > 1 || Math.abs(_v.x) > 0.85 || Math.abs(_v.y) > 0.7) continue;
      const sx = (0.5 + _v.x * 0.5) * 100, sy = (0.5 - _v.y * 0.5) * 100;
      // Built-in names / numbers only, no peer-provided HTML.
      markers.push(`<span class="bino-mark${gen.running ? ' running' : ''}" style="left:${sx.toFixed(2)}%;top:${sy.toFixed(2)}%">G${gen.k + 1}<small>${Math.round(d)} ${t('fieldMetres')}</small></span>`);
      gen.known = true;
    }
    const html = markers.join('');
    if (html !== this.markerHTML) { this.markers.innerHTML = html; this.markerHTML = html; }
  }
}
