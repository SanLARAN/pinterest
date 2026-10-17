// Physical field kit. The host owns every pickup, placement and broken lock. A guest asks; a revisioned
// snapshot settles it, so two players cannot take the same recorder / crowbar. Audio clips travel once,
// when placed; the little heartbeat carries only positions, owners, battery and the playback clock.
import * as THREE from 'three';
import { t } from '../core/i18n.js';
import { createWorldMaterial } from '../render/sonar.js';
import { geometryOf } from './uaz.js';
import { buildTape, buildCrowbar } from './toolModels.js';
import { encodeTape, decodeTape, validClip, TAPE } from './tapeCodec.js';

const R = 1.7;
const r2 = (v) => Math.round(v * 100) / 100;
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

export class ForestTools {
  constructor(game) {
    this.g = game;
    const W = game.world, C = W.zarya, F = W.firetower;
    this.geo = { tape: geometryOf(buildTape().toArrays()), crowbar: geometryOf(buildCrowbar().toArrays()) };
    const specs = [
      { kind: 'tape', x: C.x + 3.9, y: C.y + 0.94, z: C.z - 25.65, yaw: 0.18 },
      { kind: 'crowbar', x: C.x - 2.8, y: C.y + 0.025, z: C.z + 18, yaw: 0.8 },
      { kind: 'tape', x: F.x + 3.4, y: F.y + 0.025, z: F.z + 0.1, yaw: -0.4 },
      { kind: 'crowbar', x: F.x - 3.6, y: F.y + 0.025, z: F.z + 1.1, yaw: 1.4 },
    ];
    this.items = specs.map((spec, i) => {
      const mesh = new THREE.Mesh(this.geo[spec.kind], W.material);
      mesh.frustumCulled = false;
      game.scene.add(mesh);
      return { i, spec, mesh, kind: spec.kind, sound: null, clip: null, buffer: null };
    });
    this.viewMat = createWorldMaterial();
    this.viewMat.uniforms.uSelfLit = { value: 0.32 };
    this.viewMat.defines = { SELF_LIT: 1 };
    this.views = Object.fromEntries(Object.entries(this.geo).map(([k, geo]) => {
      const mesh = new THREE.Mesh(geo, this.viewMat);
      mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = 4;
      game.scene.add(mesh);
      return [k, mesh];
    }));
    this.recEl = document.createElement('div');
    this.recEl.id = 'tapeRec';
    this.kitEl = document.createElement('div');
    this.kitEl.id = 'fieldKit';
    document.getElementById('hud').append(this.recEl, this.kitEl);
    this.reset();
  }

  get tapeHeld() { return this.items.find((it) => it.kind === 'tape' && it.state === 'held' && it.owner === this.g.player.id) || null; }
  get hasCrowbar() { return this.items.some((it) => it.kind === 'crowbar' && it.state === 'held' && it.owner === this.g.player.id); }
  get handsFree() {
    const g = this.g;
    return g.player.alive && g.state === 'play' && !g.inputMuted && !g.player.carrying && !g.escape.held && g.escape.mySeat < 0 && !g.cabinets.busy && !g.expedition?.onTower;
  }
  get clock() { return this.g.auth ? this.g.time : this.g.netT; }
  groundHeight(x, z) {
    let y = this.g.world.terrain.height(x, z);
    for (const f of this.g.world.zarya?.floors || []) {
      if (Math.abs(x - f.x) < f.w / 2 && Math.abs(z - f.z) < f.d / 2) y = Math.max(y, f.y);
    }
    return y;
  }

  reset() {
    this.silence();
    this.askT = 0;
    for (const it of this.items) {
      Object.assign(it, { state: 'ground', owner: null, x: it.spec.x, y: it.spec.y, z: it.spec.z, yaw: it.spec.yaw, rev: 0, charges: TAPE.charges, start: 0, end: 0, noiseT: 0, clip: null, buffer: null });
      this._place(it);
    }
  }
  silence(forget = false) {
    this.cancelRecord();
    for (const it of this.items) {
      this._stop(it);
      if (forget) { it.clip = null; it.buffer = null; }
    }
    for (const v of Object.values(this.views)) v.visible = false;
    this.recEl.textContent = this.kitEl.textContent = '';
    document.body.classList.remove('has-tape', 'recording');
  }
  cancelRecord() {
    this.recording = null;
    if (this.g.mic.cancelTape) this.g.mic.cancelTape();
  }
  _stop(it) {
    if (it.sound) it.sound.stop();
    it.sound = null;
  }
  _place(it) {
    it.mesh.position.set(it.x, it.y, it.z);
    it.mesh.rotation.set(0, it.yaw, 0);
    it.mesh.visible = it.state !== 'held';
  }

  consider(fn) {
    if (!this.handsFree) return;
    const p = this.g.player;
    for (const it of this.items) {
      if (it.state === 'held' || Math.abs(it.y - p.y) > 1.6) continue;
      if ((it.kind === 'tape' && this.tapeHeld) || (it.kind === 'crowbar' && this.hasCrowbar)) continue;
      if (Math.hypot(it.x - p.x, it.z - p.z) > R || this.g.world.losBlocked(p.x, p.y + p.eyeCur, p.z, it.x, it.y + 0.12, it.z, 0.25)) continue;
      fn(it, it.x, it.z, R, 'fieldTool');
    }
  }
  interact(best, pressed, T) {
    const it = best.obj;
    this.g.hud.setUse(`${T('useTake')} ${t(it.kind === 'tape' ? 'tapeName' : 'crowbarName')}`, 0, true);
    if (pressed) this.request('take', it.i);
  }

  request(action, i, clip = null) {
    const g = this.g;
    if (!this.handsFree || this.askT > 0) return false;
    this.askT = 0.28;
    if (g.auth) return this.grant(action, i, g.player.id, clip);
    g.coop.toHost('it', [action, i, clip]);
    return true;
  }

  // Only the host calls this. Validate ownership, reach and free hands on the host's last player state.
  grant(action, i, pid, clip = null) {
    const g = this.g, p = g.playerById(pid);
    if (!Number.isInteger(i) || i < 0 || !g.auth || g.state !== 'play' || !p || !p.alive || p.carrying || g.escape.load(pid) || g.cabinets.locked(pid) || g.escape.seatOf(pid) >= 0) return false;
    if (action === 'pry') {
      const c = g.cabinets.list[i | 0];
      if (!c || !c.locked || Math.hypot(c.front.x - p.x, c.front.z - p.z) > 2.5 || Math.abs(c.spec.y - p.y) > 2) return false;
      if (!this.items.some((q) => q.kind === 'crowbar' && q.state === 'held' && q.owner === pid)) return false;
      g.cabinets.netUnlock(c.i);
      if (g.sync) g.sync.ev('iu', c.i);
      return true;
    }
    const it = this.items[i | 0];
    if (!it) return false;
    if (action === 'take') {
      if (it.state === 'held' || Math.hypot(p.x - it.x, p.z - it.z) > 2.6 || Math.abs(it.y - p.y) > 2) return false;
      if (this.items.some((q) => q.kind === it.kind && q.state === 'held' && q.owner === pid)) return false;
      if (g.world.losBlocked(p.x, p.y + p.eyeCur, p.z, it.x, it.y + 0.12, it.z, 0.25)) return false;
      if (g.inventory && !g.inventory.reserve(pid, it.kind)) { if (pid === g.player.id) g.inventory.full(); return false; }
      it.state = 'held'; it.owner = pid;
    } else if (action === 'drop') {
      if (it.state !== 'held' || it.owner !== pid) return false;
      if (it.kind === 'tape' && validClip(clip)) { this.setClip(it.i, clip); if (g.sync) g.sync.ev('itape', it.i, clip); }
      const f = p.forward();
      it.x = p.x + f.x * 0.4; it.z = p.z + f.z * 0.4; it.y = this.groundHeight(it.x, it.z) + 0.025;
      it.yaw = p.yaw; it.state = 'ground'; it.owner = null; it.start = it.end = 0;
    } else if (action === 'play') {
      if (it.kind !== 'tape' || it.state !== 'held' || it.owner !== pid) return false;
      const f = p.forward();
      let spot = null;
      for (const d of [1.05, 0.8, 0.5, 0]) {
        const x = p.x + f.x * d, z = p.z + f.z * d;
        if (g.world.col.free(x, z, 0.23)) { spot = { x, z }; break; }
      }
      if (!spot) return false;
      it.x = spot.x; it.z = spot.z; it.y = this.groundHeight(it.x, it.z) + 0.02; it.yaw = p.yaw + Math.PI;
      it.owner = null;
      if (validClip(clip)) {
        this.setClip(it.i, clip);
        if (g.sync) g.sync.ev('itape', it.i, clip);
      }
      it.state = it.charges > 0 ? 'playing' : 'ground';
      if (it.charges > 0) {
        it.charges--; it.start = g.time + TAPE.delay; it.end = it.start + TAPE.duration; it.noiseT = 0;
      }
    } else return false;
    it.rev++;
    this.apply(this.pack(it), true);
    if (g.sync) g.sync.ev('ix', this.pack(it));
    if (pid === g.player.id && action === 'take') this._got(it);
    return true;
  }

  pack(it) { return [it.i, it.rev, it.state, it.owner, r2(it.x), r2(it.y), r2(it.z), r2(it.yaw), it.charges, r2(it.start), r2(it.end)]; }
  apply(a, own = false) {
    if (!Array.isArray(a) || a.length !== 11) return;
    const [i, rev, state, owner, x, y, z, yaw, charges, start, end] = a;
    const it = this.items[i | 0];
    if (!it || (!own && rev <= it.rev) || !['ground', 'held', 'playing'].includes(state) || ![rev,x,y,z,yaw,charges,start,end].every(Number.isFinite)) return;
    if (Math.abs(x) > 300 || Math.abs(z) > 300 || Math.abs(y) > 100 || (owner !== null && typeof owner !== 'string')) return;
    const had = it.state === 'held' && it.owner === this.g.player.id;
    if (it.state !== state) this._stop(it);
    Object.assign(it, { rev, state, owner, x, y, z, yaw, charges, start, end });
    this._place(it);
    if (!own && !had && state === 'held' && owner === this.g.player.id) this._got(it);
    if (had && state !== 'held') this.cancelRecord();
  }
  _got(it) {
    const g = this.g;
    if (g.audio.ready) g.audio.cabinetItem('nuts');
    g.hud.popup(t(it.kind === 'crowbar' ? 'crowbarGot' : g.input.touch ? 'tapeGotT' : 'tapeGot'), 'amber');
    if (g.inventory) g.inventory.reconcile();
    g.stats[it.kind === 'crowbar' ? 'crowbars' : 'tapes'] = (g.stats[it.kind === 'crowbar' ? 'crowbars' : 'tapes'] | 0) + 1;
  }
  netState() { return this.items.map((it) => this.pack(it)); }
  netMerge(a) { if (Array.isArray(a)) for (const it of a.slice(0, this.items.length)) this.apply(it); }
  setClip(i, clip) {
    const it = this.items[i | 0];
    if (!it || it.kind !== 'tape' || !validClip(clip)) return;
    it.clip = clip; it.buffer = null;
    this._stop(it); // new tape content may arrive just after the placement packet
  }

  record() {
    const g = this.g, it = this.tapeHeld;
    if (!it || !this.handsFree) return;
    if (this.recording) { this.cancelRecord(); return; }
    const rec = { i: it.i, at: performance.now() };
    if (g.mic.state !== 'on' || !g.mic.beginTape || !g.mic.beginTape(TAPE.seconds, (raw, hz) => {
      if (this.recording !== rec || this.tapeHeld !== it) return;
      const clip = encodeTape(raw, hz);
      if (clip) { it.clip = clip; it.buffer = null; }
      this.recording = null;
      g.hud.popup(t(clip ? 'tapeRecorded' : 'tapeSilent'), clip ? 'amber' : 'dim');
    })) {
      g.hud.popup(t('tapeNoMic'), 'dim');
      return;
    }
    this.recording = rec;
    g.hud.popup(t('tapeRecordWarn'), 'dim');
  }
  play() {
    const it = this.tapeHeld;
    if (!it || !this.handsFree) return;
    this.cancelRecord();
    const charged = it.charges > 0;
    if (this.request('play', it.i, it.clip)) this.g.hud.popup(t(charged ? 'tapePlaced' : 'tapeFlat'), 'amber');
  }

  // The host drops any kit that was on someone who fell or left; a lure already playing keeps playing.
  dropFor(pid, x, z) {
    if (!this.g.auth) return;
    for (const it of this.items) if (it.owner === pid && it.state === 'held') {
      it.state = 'ground'; it.owner = null; it.x = x; it.z = z;
      it.y = this.groundHeight(x, z) + 0.025;
      it.rev++;
      this._place(it);
      if (this.g.sync) this.g.sync.ev('ix', this.pack(it));
    }
  }

  update(dt) {
    const g = this.g, now = this.clock;
    this.askT = Math.max(0, this.askT - dt);
    if (this.recording && (!this.handsFree || !this.tapeHeld || g.mic.state !== 'on' || performance.now() - this.recording.at > 5000)) this.cancelRecord();
    if (g.auth) for (const it of this.items) if (it.state === 'held') {
      const p = g.playerById(it.owner);
      if (!p || !p.alive) this.dropFor(it.owner, p?.x ?? it.x, p?.z ?? it.z);
    }
    for (const it of this.items) {
      const playing = it.state === 'playing' && now >= it.start && now < it.end && g.state === 'play';
      if (!playing) this._stop(it);
      if (playing) {
        if (g.audio.ready && g.distToEars(it.x, it.z) < 85 && !it.sound) {
          if (!it.buffer && it.clip) it.buffer = decodeTape(it.clip, g.audio.ctx);
          it.sound = g.audio.tapeLoop(it.x, it.y + 0.12, it.z, it.buffer);
        }
        it.noiseT -= dt;
        if (it.noiseT <= 0) {
          it.noiseT = TAPE.every;
          g.noise(it.x, it.z, TAPE.loud, 'tape'); // not playerNoise: the device itself, once, on the host
          g.pulses.emit(it.x, it.y + 0.12, it.z, g.time, { radius: 9, strength: 0.6, decay: 1.3, color: [0.85,0.7,0.5], kind: 'tape' });
        }
      }
      if (g.auth && it.state === 'playing' && now >= it.end) {
        it.state = 'ground'; it.rev++;
        this._place(it);
        if (g.sync) g.sync.ev('ix', this.pack(it));
      }
    }
    const held = this.tapeHeld;
    document.body.classList.toggle('has-tape', !!held && g.player.alive && g.state === 'play');
    document.body.classList.toggle('recording', !!this.recording);
    this.recEl.textContent = this.recording ? `● REC  ${Math.min(TAPE.seconds, (performance.now() - this.recording.at) / 1000).toFixed(1)} / ${TAPE.seconds} s` : '';
    this.kitEl.textContent = ''; // equipment lives in the backpack, never a parallel hotkey HUD
  }

  placeView(camera, show) {
    const g = this.g, tape = this.views.tape, bar = this.views.crowbar;
    tape.visible = !!show && !!this.tapeHeld && g.inventory.equipped === 'tape';
    bar.visible = !!show && this.hasCrowbar && g.inventory.equipped === 'crowbar';
    if (tape.visible) {
      _v.set(0.23, -0.25, -0.48).applyMatrix4(camera.matrixWorld);
      tape.position.copy(_v);
      tape.quaternion.copy(camera.quaternion).multiply(_q.setFromEuler(_e.set(-0.15, -0.2, 0.03)));
      tape.scale.setScalar(0.8);
    }
    if (bar.visible) {
      const k = g.cabinets.pry?.t || 0;
      _v.set(0.2, -0.2 + Math.sin(k * 10) * 0.025, -0.48).applyMatrix4(camera.matrixWorld);
      bar.position.copy(_v);
      bar.quaternion.copy(camera.quaternion).multiply(_q.setFromEuler(_e.set(-0.25 + Math.sin(k * 10) * 0.15, -0.35, -0.3)));
      tape.visible = false;
    }
  }
}
