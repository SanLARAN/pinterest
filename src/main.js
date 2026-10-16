// ============================================================
// ЭХО-30 / ECHO-30 — main application
// ============================================================
import './style.css';
import * as THREE from 'three';
import { Game, DAY_LEN, DUSK_LEN } from './sim/game.js';
import { Player, NOISE } from './sim/player.js';
import { createEchoUniforms, syncEchoUniforms } from './render/echo.js';
import { buildPointCloud, Auras, monsterAura, playerAura } from './render/points.js';
import { Scene3D } from './render/scene.js';
import { MonsterViews } from './render/mview.js';
import { CameraRig, Particles, makeComposer, makeFace } from './render/fx.js';
import { AudioEngine } from './audio/audio.js';
import { MicInput, MIC_STATE } from './audio/mic.js';
import { Input } from './input/input.js';
import { HUD } from './ui/hud.js';
import { Screens, loadCfg, saveCfg, DEFAULT_CFG } from './ui/screens.js';
import { I18n } from './ui/i18n.js';
import { Coop } from './net/coop.js';
import { NOTES } from './sim/content.js';
import { clamp, damp, dist2, fmtTime, lerp, TAU } from './core/util.js';

const $ = (id) => document.getElementById(id);
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

class App {
  constructor() {
    this.cfg = loadCfg();
    this.i18n = new I18n(this.cfg.lang || 'ru');
    this.state = 'boot';
    this.audio = new AudioEngine();
    this.mic = new MicInput();
    this.coop = new Coop();
    this.netEvents = [];
    this.faces = {};
    this.fxState = { damage: 0, flash: 0, flashCol: [1, 1, 1], breath: 0, aberr: 0, wail: 0, vig: 1 };
    this.perf = { acc: 0, n: 0, level: 2, t: 0, fps: 60, worst: 0 };
    this.pingHold = 0;
    this.pingHeld = false;
    this.lastHeldPing = 0;
    this.screamLatch = false;
    this.jumpT = 0;
    this.menuT = 0;
    this.menuPing = 0;
    this.jumping = false;
    this.autoPinged = 0;
    this.version = '1.0.0';
  }

  // ------------------------------------------------------------------ boot
  async boot() {
    const screens = this.screens = new Screens(this.i18n, this.cfg);
    screens.show('boot');
    screens.boot(0.05, this.i18n.lang === 'en' ? 'waking the sonar…' : 'инициализация сонара…');
    $('menuVersion').textContent = 'v' + this.version;
    this.i18n.apply(document);
    await nextFrame();

    this.U = createEchoUniforms();
    this.game = new Game({
      seed: (Math.random() * 1e9) | 0,
      nightLength: this.cfg.nightLength,
      lang: this.cfg.lang,
      scares: this.cfg.scares,
      localId: 0,
      host: true,
    });
    screens.boot(0.25, this.i18n.lang === 'en' ? 'growing the forest…' : 'лес растёт…');
    await nextFrame();
    this.game.reset({ seed: this.game.seed });
    this.game.paused = true;

    screens.boot(0.45, this.i18n.lang === 'en' ? 'cutting polygons…' : 'режем полигоны…');
    await nextFrame();
    const canvas = $('gl');
    this.scene = new Scene3D(canvas, this.game.world, this.U, { quality: this.cfg.quality });
    this.particles = new Particles(this.cfg.quality === 'high' ? 1800 : 900);
    this.scene.scene.add(this.particles.points);
    this.auras = new Auras(1100);
    this.scene.scene.add(this.auras.points);
    this.mviews = new MonsterViews(this.U);
    this.mviews.attach(this.scene.scene);

    screens.boot(0.62, this.i18n.lang === 'en' ? 'scattering echo dust…' : 'пыль для эха…');
    await nextFrame();
    this.buildPoints();

    screens.boot(0.74, this.i18n.lang === 'en' ? 'tuning the air…' : 'настраиваем воздух…');
    await nextFrame();
    this.rig = new CameraRig(this.scene.camera);
    this.input = new Input(canvas, {
      sens: this.cfg.sens,
      onLockChange: (locked) => { if (!locked && this.state === 'playing' && this.input.lookMode === 'lock') this.pause(true); },
      onLookMode: (mode) => {
        if (mode !== 'drag') return;
        this.hud.hint(this.i18n.lang === 'en' ? 'Mouse look is blocked here — hold and drag to look around' : 'Захват мыши недоступен — зажми и тяни, чтобы смотреть', 6);
      },
    });
    this.fxEl = {
      flash: $('fxFlash'), damage: $('fxDamage'), breath: $('fxBreath'),
      aberr: $('fxAberr'), vig: $('fxVignette'), gl: $('gl'),
    };
    this.hud = new HUD(this.game, this.i18n);
    this.hud.setTouch(this.input.detectTouch());
    this.bindGameEvents();
    this.bindUI();

    screens.boot(0.88, this.i18n.lang === 'en' ? 'listening…' : 'слушаем…');
    await nextFrame();
    if (this.cfg.quality === 'high') {
      this.composer = await makeComposer(this.scene.renderer, this.scene.scene, this.scene.camera, true);
      if (this.composer) {
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setPixelRatio(this.scene.renderer.getPixelRatio());
        this.particles.mat.uniforms.uPix.value = this.scene.renderer.getPixelRatio();
      }
    }
    window.addEventListener('resize', () => this.onResize());
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'playing') this.pause(true); });

    screens.boot(1, this.i18n.lang === 'en' ? 'the forest is waiting' : 'лес ждёт');
    this.state = 'menu';
    this.setMenuVisuals();
    setTimeout(() => {
      screens.show('menu');
      this.screens.renderHS($('hsTable'));
      this.applyCfgToUI();
    }, 260);
    setTimeout(() => this.buildFaces(), 900);
    this.last = performance.now();
    this.scene.renderer.setAnimationLoop((t) => this.loop(t));
  }

  buildPoints() {
    if (this.pointsObj) { this.scene.scene.remove(this.pointsObj); this.pointsObj.geometry.dispose(); this.pointsObj.material.dispose(); }
    const r = buildPointCloud(this.game.world, this.U, this.perf.level >= 1 ? this.cfg.quality : 'low');
    this.pointsObj = r.points;
    this.pointCount = r.count;
    this.scene.scene.add(this.pointsObj);
  }

  buildFaces() {
    try {
      for (const k of ['whisperer', 'tall', 'weeper']) this.faces[k] = makeFace(k);
    } catch (e) { console.warn('faces', e); }
  }

  setMenuVisuals() {
    this.game.skyT = 0;
    this.game.globalEcho = 1;
    this.game.phase = 'menu';
    const p = this.game.local;
    if (p) { p.x = this.game.world.start.x; p.z = this.game.world.start.z; p.y = this.game.world.heightAt(p.x, p.z); }
  }

  // ------------------------------------------------------------------ UI wiring
  applyCfgToUI() {
    const c = this.cfg;
    const seg = (id, val) => {
      const box = $(id); if (!box) return;
      [...box.children].forEach((b) => b.classList.toggle('on', String(b.dataset.v) === String(val)));
    };
    seg('segNight', c.nightLength);
    seg('segMic', c.mic);
    seg('segQ', c.quality);
    $('chkShake').checked = !!c.shake;
    $('chkScares').checked = !!c.scares;
    $('chkVoice').checked = !!c.voiceChat;
    if ($('hsName') && c.name) $('hsName').value = c.name;
  }

  bindUI() {
    const click = (id, fn) => { const e = $(id); if (e) e.addEventListener('click', (ev) => { ev.preventDefault(); this.audio.ui('click'); fn(ev); }); };
    const seg = (id, fn) => {
      const box = $(id); if (!box) return;
      [...box.children].forEach((b) => b.addEventListener('click', () => {
        [...box.children].forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        this.audio.ui('click');
        fn(b.dataset.v, b);
      }));
    };
    seg('segNight', (v) => { this.cfg.nightLength = +v; saveCfg(this.cfg); });
    seg('segMic', async (v) => {
      this.cfg.mic = v; saveCfg(this.cfg);
      if (v === 'mic') await this.enableMic();
      else { this.mic.disable(); this.setMicHint(); }
    });
    seg('segQ', (v) => { this.cfg.quality = v; saveCfg(this.cfg); this.applyQuality(); });
    click('chkShake', () => { this.cfg.shake = $('chkShake').checked; saveCfg(this.cfg); });
    click('chkScares', () => { this.cfg.scares = $('chkScares').checked; this.game.scaresEnabled = this.cfg.scares; saveCfg(this.cfg); });
    click('chkVoice', () => {
      this.cfg.voiceChat = $('chkVoice').checked; saveCfg(this.cfg);
      this.coop.setVoice(this.cfg.voiceChat, this.mic.stream);
      this.coopStatus(this.cfg.voiceChat ? 'voice-on' : 'voice-off');
    });
    click('btnLang', () => {
      this.cfg.lang = this.cfg.lang === 'ru' ? 'en' : 'ru';
      saveCfg(this.cfg);
      this.i18n.set(this.cfg.lang);
      this.game.lang = this.cfg.lang;
      $('btnLang').textContent = this.cfg.lang === 'ru' ? 'EN' : 'RU';
      document.documentElement.lang = this.cfg.lang;
      this.screens.renderHS($('hsTable'));
      this.setMicHint();
    });
    click('btnClearHs', () => {
      try { localStorage.removeItem('echo30.highscores.v2'); } catch (e) {}
      this.screens.renderHS($('hsTable'));
      this.screens.renderHS($('hsTableOver'));
    });
    click('btnCalib', () => this.runCalibration());

    click('btnStart', () => this.onStart());
    click('btnResume', () => this.resume());
    click('btnRestart', () => this.restart());
    click('btnMenu', () => this.toMenu());
    click('btnAgain', () => this.restart());
    click('btnOverMenu', () => this.toMenu());
    click('btnSaveHs', () => {
      const r = this.screens.saveScore($('hsName').value);
      $('btnSaveHs').disabled = true;
      if (r) this.toast(this.i18n.lang === 'en' ? `saved at #${r.rank + 1}` : `записано: место ${r.rank + 1}`, 'good');
    });
    click('btnHost', async () => {
      await this.ensureAudio();
      $('btnHost').disabled = true;
      const code = await this.coop.host(this.mic.stream);
      $('btnHost').disabled = false;
      if (code) {
        $('roomCode').textContent = code;
        this.coopStatus('hosting');
        if (this.cfg.voiceChat) this.coop.setVoice(true, this.mic.stream);
      } else this.coopStatus('error');
    });
    click('btnJoin', async () => {
      await this.ensureAudio();
      const code = $('joinCode').value;
      $('btnJoin').disabled = true;
      const ok = await this.coop.join(code, this.mic.stream);
      $('btnJoin').disabled = false;
      if (ok) { this.coopStatus('joining'); }
      else this.coopStatus('error');
    });
    this.bindCoop();
    this.bindTouchButtons();
  }

  bindTouchButtons() {
    // touch buttons are already bound inside Input; nothing extra needed
  }

  bindCoop() {
    const c = this.coop;
    c.on('status', (s, msg) => this.coopStatus(s, msg));
    c.on('hello', (msg, from) => {
      if (this.coop.mode === 'guest') {
        // build the host's forest and wait for the run to start
        this.remoteHost = true;
        this.myId = msg.yourId ?? 1;
        this.game.isHost = false;
        this.game.localId = this.myId;
        $('btnStart').disabled = true;
        $('btnStart').textContent = this.i18n.lang === 'en' ? 'WAITING FOR HOST…' : 'ЖДЁМ ХОСТА…';
        this.coopStatus('joined');
        if (msg.cfg) {
          Object.assign(this.cfg, { nightLength: msg.cfg.nightLength, scares: msg.cfg.scares, quality: this.cfg.quality });
          this.applyCfgToUI();
        }
        if (msg.seed) this.startRun({ seed: msg.seed, nightLength: msg.nightLength ?? this.cfg.nightLength, asGuest: true });
      }
    });
    c.on('peerJoined', (peerId) => {
      if (this.coop.mode !== 'host') return;
      const id = this.peerToId(peerId);
      const p = this.game.addPlayer(id, 'P' + (id + 1));
      this.peerMap.set(peerId, id);
      this.idToPeer.set(id, peerId);
      this.toast(this.i18n.lang === 'en' ? 'a partner entered the forest' : 'напарник вошёл в лес', 'good');
      this.audio.ui('win');
      c.sendHello({
        t: 'hello', yourId: id, seed: this.game.seed, nightLength: this.game.nightLen, lang: this.cfg.lang,
        cfg: { nightLength: this.game.nightLen, scares: this.cfg.scares },
      });
      if (this.state === 'playing') {
        this.pushNet({ k: 'start', seed: this.game.seed, nightLength: this.game.nightLen, id });
      }
      this.updateCoopBadge();
    });
    c.on('peerLeft', (peerId) => {
      const id = this.peerMap.get(peerId);
      if (id !== undefined) { this.game.removePlayer(id); this.peerMap.delete(peerId); this.idToPeer.delete(id); }
      this.toast(this.i18n.lang === 'en' ? 'your partner is gone' : 'напарник пропал', 'bad');
      this.updateCoopBadge();
    });
    c.on('hostLeft', () => {
      this.toast(this.i18n.lang === 'en' ? 'the host left the forest' : 'хост вышел из леса', 'bad');
      this.remoteHost = false;
      this.game.isHost = true;
      $('btnStart').disabled = false;
      this.updateCoopBadge();
    });
    c.on('input', (id, p, from) => {
      if (this.coop.mode !== 'host') return;
      let pl = this.game.players.find((x) => x.id === id);
      if (!pl) pl = this.game.addPlayer(id, p.nm || 'P' + (id + 1));
      pl.remote = true;
      pl.name = p.nm || pl.name;
      pl._target = p;
      pl.nerve = p.n; pl.fuses = p.f; pl.score = p.sc || pl.score;
      if (!pl.alive && p.a) pl.alive = true;
      if (p.e) for (const ev of p.e) this.applyNetEvent(ev, pl);
    });
    c.on('ev', (id, ev, from) => {
      if (this.coop.mode === 'host') {
        const pl = this.game.players.find((x) => x.id === id) || this.game.local;
        this.applyNetEvent(ev, pl);
      } else {
        this.applyNetEvent(ev, this.game.local, true);
      }
    });
    c.on('state', (snap, events) => {
      if (this.coop.mode !== 'guest' || !snap) return;
      this.pendingSnap = snap;
      if (events) for (const ev of events) this.applyNetEvent(ev, null, true);
    });
    c.on('voiceOn', () => this.toast(this.i18n.t('voice_on'), 'good'));
    this.peerMap = new Map();
    this.idToPeer = new Map();
    this.peerCounter = 1;
  }
  peerToId(peerId) {
    if (this.peerMap.has(peerId)) return this.peerMap.get(peerId);
    const id = this.peerCounter++;
    this.peerMap.set(peerId, id);
    this.idToPeer.set(id, peerId);
    return id;
  }

  updateCoopBadge() {
    let b = $('coopBadge');
    const on = this.coop.mode !== 'solo';
    if (on && !b) {
      b = document.createElement('div');
      b.id = 'coopBadge';
      b.className = 'coop-badge';
      b.innerHTML = '<span class="dot"></span><span class="txt"></span>';
      $('hud').appendChild(b);
    }
    if (!on && b) { b.remove(); return; }
    if (b) {
      const n = this.coop.peerCount;
      b.querySelector('.dot').classList.toggle('off', n === 0);
      b.querySelector('.txt').textContent = this.coop.mode === 'host'
        ? `${this.i18n.lang === 'en' ? 'ROOM' : 'КОМНАТА'} ${this.coop.code} · ${n}`
        : `${this.i18n.lang === 'en' ? 'HOST' : 'ХОСТ'} ${this.coop.code}`;
    }
  }

  coopStatus(s, msg = '') {
    const el = $('coopState'), m = $('coopMsg'), code = $('roomCode');
    const t = (ru, en) => this.i18n.lang === 'en' ? en : ru;
    if (!el) return;
    el.className = 'tag';
    switch (s) {
      case 'hosting': el.textContent = t('создаём…', 'hosting…'); el.classList.add('wait'); break;
      case 'hosted': el.textContent = t('комната открыта', 'room open'); el.classList.add('ok'); if (code) code.textContent = this.coop.code; m.textContent = t('Код комнаты выше. Скажи его напарнику — он вводит его и жмёт ВОЙТИ.', 'The room code is above. Give it to your partner — they type it and press JOIN.'); break;
      case 'joining': el.textContent = t('подключение…', 'connecting…'); el.classList.add('wait'); break;
      case 'joined': el.textContent = t('в комнате', 'in room'); el.classList.add('ok'); break;
      case 'peer-joined': el.textContent = t('напарник в лесу', 'partner connected'); el.classList.add('ok'); this.updateCoopBadge(); break;
      case 'peer-left': el.textContent = t('напарник вышел', 'partner left'); break;
      case 'closed': el.textContent = t('связь потеряна', 'link lost'); el.classList.add('err'); break;
      case 'reconnect': el.textContent = t('переподключение…', 'reconnecting…'); el.classList.add('wait'); break;
      case 'voice-on': m.textContent = t('Голосовой чат включён. Твой напарник услышит каждый твой вздох — и каждый крик.', 'Voice chat on. Your partner hears every breath — and every scream.'); break;
      case 'voice-off': m.textContent = this.i18n.t('coop_msg'); break;
      case 'error': {
        el.textContent = t('ошибка', 'error'); el.classList.add('err');
        const why = msg === 'no-room' ? t('комнаты с таким кодом нет', 'no room with that code')
          : msg === 'timeout' ? t('брокер не отвечает — нужен интернет', 'broker not responding — check your connection')
          : msg === 'bad-code' ? t('введи код комнаты', 'enter a room code')
          : t('не вышло: ' + msg, 'failed: ' + msg);
        m.textContent = why;
        break;
      }
      default: el.textContent = 'offline';
    }
  }

  // ------------------------------------------------------------------ net events
  pushNet(ev) {
    if (this.coop.mode === 'solo') return;
    if (ev.o === undefined) ev.o = this.game.localId;
    this.netEvents.push(ev);
    if (this.netEvents.length > 30) this.netEvents.shift();
  }
  applyNetEvent(ev, player, inbound = false) {
    if (!ev) return;
    // never replay my own events back at me
    if (this.coop.mode === 'guest' && ev.o !== undefined && ev.o === this.game.localId) return;
    switch (ev.k) {
      case 'start':
        if (this.coop.mode === 'guest') {
          if (ev.id !== undefined) { this.myId = ev.id; this.game.localId = ev.id; }
          this.game.isHost = false;
          if (this.state !== 'playing') this.startRun({ seed: ev.seed, nightLength: ev.nightLength, asGuest: true });
        }
        break;
      case 'ping': {
        if (this.coop.mode === 'host') {
          if (player && player.alive) this.game.ping(player, ev.s || 0.4);
        } else if (ev.x !== undefined) {
          this.game.waves.push({ x: ev.x, y: ev.y, z: ev.z, r: 0.6, maxR: lerp(44, 132, ev.s), speed: lerp(52, 78, ev.s), str: ev.s, str0: ev.s, life: 2.2, maxLife: 2.2, owner: ev.o ?? -1, loud: ev.s > 0.72, kind: 'ping', color: 0, t0: this.game.t });
          if (this.game.waves.length > 8) this.game.waves.shift();
          const d = this.game.local ? Math.hypot(ev.x - this.game.local.x, ev.z - this.game.local.z) : 0;
          if (d < 120) this.audio.ping(ev.s * clamp(1 - d / 130, 0.1, 1));
        }
        break;
      }
      case 'noise':
        if (this.coop.mode === 'host') this.game.noise(ev.x, ev.z, ev.r, 'remote', player, !!ev.l);
        break;
      case 'scream':
        if (this.coop.mode === 'host' && player) { this.game.scream(player, ev.l || 1); }
        else { this.addShake(0.35); this.flash([1, 0.25, 0.3], 0.25); }
        break;
      case 'toast': this.toast(ev.x, ev.c || '', ev.d || 3); break;
      case 'announce': this.announce(ev.x, ev.d || 5); break;
      case 'hint': this.hud.hint(ev.x, ev.d || 5); break;
      case 'note': this.showNote(NOTES[(ev.i | 0) % NOTES.length]); break;
      case 'gen': this.audio.generatorDone(); this.flash([1, 0.75, 0.3], 0.5); this.addShake(0.5); break;
      case 'scare': this.doScare({ kind: ev.kind }, ev.x); break;
      case 'sting': this.audio.sting(ev.kind); this.addShake(0.5); break;
      case 'wail': this.fxState.wail = 1; break;
      case 'hit': this.addShake(0.2); break;
      case 'death': this.onDeathRemote(ev.cause, ev.mon); break;
      case 'win': if (this.coop.mode === 'guest' && this.state === 'playing') this.onGameOver(this.game.summary(), true); break;
      case 'restart_req': if (this.coop.mode === 'host') this.restart(); break;
      default: break;
    }
  }

  // ------------------------------------------------------------------ game events
  bindGameEvents() {
    const g = this.game;
    g.on('reset', () => {
      this.particles.clear();
      this.mviews.clear();
      this.hud.blips.length = 0;
      this.hud.waveRings.length = 0;
      this.rig.shake = 0; this.rig.kick = 0; this.rig.deathT = -1;
      this.fxState.damage = 0; this.fxState.aberr = 0; this.fxState.wail = 0; this.fxState.breath = 0;
      this.netEvents.length = 0;
      this.screamLatch = false;
      this.pingHold = 0;
      this.game.interact = null;
    });
    g.on('ping', (p, w) => {
      const mine = p === g.local;
      const d = mine ? 0 : Math.hypot(p.x - g.local.x, p.z - g.local.z);
      if (d < 130) this.audio.ping(w.str0 * clamp(1 - d / 140, 0.12, 1));
      if (mine) this.hud.pingPulse();
      this.rig.addKick((0.12 + w.str0 * 0.4) * (mine ? 1 : 0.3));
      this.addShake((0.06 + w.str0 * 0.2) * (mine ? 1 : 0.25));
      if (mine) this.flash([0.5, 1, 0.86], 0.05 + w.str0 * 0.12);
      const gy = g.world.heightAt(p.x, p.z);
      if (d < 60) this.particles.ring(p.x, gy + 0.1, p.z, 1.6 + w.str0 * 2.4, w.loud ? [1, 0.3, 0.35] : [0.45, 1, 0.85], 26 + Math.round(w.str0 * 26), g.world.heightAt);
      if (mine) this.pushNet({ k: 'ping', s: +w.str0.toFixed(2), x: +p.x.toFixed(1), y: +(p.eye - 0.15).toFixed(1), z: +p.z.toFixed(1) });
    });
    g.on('returns', (returns, w) => { if (w.owner === (g.local ? g.local.id : 0) || this.coop.mode === 'solo') this.hud.addReturns(returns, w); else this.hud.addReturns(returns, w); });
    g.on('return', (r) => {
      if (r.owner !== -1 && g.local && r.owner !== g.local.id && this.coop.mode !== 'solo') return;
      const sp = this.audio.spatial(r.x, r.z, 1, 150);
      this.audio.echoReturn(r.kind, r.gain, sp.pan, r.d);
      if (r.kind === 'monster' || r.kind === 'gen' || r.kind === 'corpse' || r.kind === 'player' || r.kind === 'stone') {
        const col = r.kind === 'monster' ? [1, 0.2, 0.28] : r.kind === 'gen' ? [1, 0.72, 0.3] : r.kind === 'corpse' ? [0.95, 0.93, 0.86] : r.kind === 'player' ? [0.35, 0.9, 1] : [0.8, 0.9, 1];
        this.particles.burst(r.x, r.y, r.z, { count: r.kind === 'monster' ? 9 : 5, speed: 1.4, life: 0.6, color: col, size: 2.2, grav: -0.6, drag: 3 });
      }
    });
    g.on('noise', (p, r, kind) => {
      if (p !== g.local) return;
      if (kind === 'move' && r > 12) this.hud.noisePulse(r > 28);
    });
    g.on('noiseEvent', (ev) => { if (this.coop.mode === 'host') this.pushNet({ k: 'noise', x: +ev.x.toFixed(1), z: +ev.z.toFixed(1), r: Math.round(ev.r), l: ev.loud ? 1 : 0 }); });
    g.on('step', (p, kind) => {
      if (p !== g.local) return;
      this.audio.footstep(kind, p.wet);
      const gy = g.world.heightAt(p.x, p.z);
      const col = p.wet > 0.15 ? [0.4, 0.8, 1] : [0.42, 0.4, 0.32];
      this.particles.burst(p.x, gy + 0.08, p.z, { count: kind === 2 ? 9 : 5, speed: kind === 2 ? 1.7 : 0.9, life: 0.5, color: col, size: 1.6, grav: -1.6, up: 0.4 });
      if (kind === 2) this.rig.addShake(0.035);
    });
    g.on('bump', (p, impact) => {
      if (p !== g.local) return;
      this.audio.bump(clamp(impact / 5, 0.3, 1.4));
      this.addShake(clamp(impact * 0.06, 0.05, 0.35));
      this.rig.punchDir(-Math.sin(p.yaw), 0, -Math.cos(p.yaw), -clamp(impact * 0.02, 0.02, 0.12));
      this.particles.burst(p.x, p.y + 1.2, p.z, { count: 6, speed: 1.2, life: 0.45, color: [0.4, 0.5, 0.35], size: 1.4 });
    });
    g.on('bounds', (p) => {
      if (p !== g.local || this.boundsT > g.t) return;
      this.boundsT = g.t + 6;
      this.toast(this.i18n.lang === 'en' ? 'The forest does not let you leave.' : 'Лес не выпускает.', 'bad', 3);
      this.audio.tone ? this.audio.tone(70, 1.2, 'sine', 0.14, { to: 40, rev: 0.7 }) : 0;
    });
    g.on('heartbeat', (p, lvl) => { if (p === g.local) this.audio.heartbeat(lvl); });
    g.on('scream', (p, lvl) => {
      if (p === g.local) {
        this.audio.playerScream(lvl);
        this.pushNet({ k: 'scream', l: lvl });
      }
      this.addShake(0.8);
      this.flash([1, 0.2, 0.28], 0.55);
      this.particles.ring(p.x, g.world.heightAt(p.x, p.z) + 0.2, p.z, 3, [1, 0.2, 0.3], 60, g.world.heightAt);
      this.rig.addKick(0.5);
    });
    g.on('monsterSound', (m, kind) => {
      if (g.local) this.audio.monsterSound(m, kind, g.local);
      if (kind === 'step' && g.local) {
        const gy = g.world.heightAt(m.x, m.z);
        this.particles.burst(m.x, gy + 0.1, m.z, { count: 4, speed: 0.8, life: 0.5, color: [0.35, 0.4, 0.35], size: 1.3 });
      }
    });
    g.on('wail', (m) => {
      this.fxState.wail = 1;
      this.addShake(0.5);
      if (g.local) this.audio.weeperWail(clamp(1 - dist2(m.x, m.z, g.local.x, g.local.z) / 90, 0.2, 1.2), 0);
      this.pushNet({ k: 'wail' });
    });
    g.on('spawn', (m) => {
      if (m.type === 'tall' || m.type === 'weeper') this.addShake(0.3);
    });
    g.on('monsterSpawned', (m) => {
      if (!g.local) return;
      const d = dist2(m.x, m.z, g.local.x, g.local.z);
      if (d < 70) {
        this.particles.burst(m.x, g.world.heightAt(m.x, m.z) + 0.4, m.z, { count: 26, speed: 2.4, life: 1.4, color: [0.3, 0.34, 0.3], size: 2.2, grav: 1.2, up: 1.6 });
        this.audio.noiseHit(1.1, 0.16, { type: 'lowpass', f0: 700, f1: 120, rev: 1.1, attack: 0.1, linear: true });
      }
    });
    g.on('attack', (m, p) => {
      if (p !== g.local) return;
      this.audio.hurt();
      this.addShake(1.1);
      this.rig.addKick(0.9);
      this.fxState.damage = 1;
      this.flash([0.7, 0.05, 0.1], 0.4);
      this.rig.punchDir(m.x - p.x, 0.2, m.z - p.z, 0.22);
      this.particles.burst(p.x, p.y + 1.2, p.z, { count: 26, speed: 4.5, life: 0.9, color: [0.7, 0.05, 0.09], size: 2.6, grav: -6, jitter: 0.6 });
      this.pushNet({ k: 'hit', i: p.id });
    });
    g.on('hurt', (p, amount, cause) => { if (p === g.local) this.hud.setNerve(p.nerve, p.maxNerve); });
    g.on('earplugs', (p) => {
      this.toast(this.i18n.lang === 'en' ? 'The earplugs saved you. Once.' : 'Беруши спасли тебя. Один раз.', 'good', 3.5);
      this.flash([1, 0.9, 0.6], 0.35);
    });
    g.on('died', (p, cause, monster) => { if (p === g.local) this.onDeath(cause, monster); });
    g.on('gameover', (summary) => this.onGameOver(summary, false));
    g.on('win', (summary) => this.onGameOver(summary, true));

    g.on('generator', (gen, cut) => {
      this.audio.generatorDone();
      this.flash([1, 0.78, 0.36], 0.6);
      this.addShake(0.55);
      this.rig.addKick(0.4);
      this.particles.burst(gen.x, gen.y + 2.4, gen.z, { count: 60, speed: 7, life: 1.6, color: [1, 0.75, 0.3], size: 3, grav: -3, jitter: 1.2 });
      this.particles.ring(gen.x, gen.y + 0.2, gen.z, 5, [1, 0.72, 0.3], 70, g.world.heightAt);
      this.toast(`${this.i18n.t('gen_done')} · ${this.i18n.t('gen_short')} ${Math.round(cut)}с`, 'good', 4);
      this.hud.bumpScore();
      this.pushNet({ k: 'gen', i: gen.id });
      this.hud.renderObjectives();
    });
    g.on('fuse', (n) => {
      this.audio.fusePickup();
      this.toast(`${this.i18n.t('fuse_got')} ×${n}`, 'good', 2.6);
      this.hud.bumpScore();
    });
    g.on('note', (note, corpse) => {
      this.audio.noteRead();
      this.showNote(note);
      this.pushNet({ k: 'note', i: corpse.note });
      this.hud.renderObjectives();
      this.hud.renderNotes();
    });
    g.on('item', (kind) => {
      this.toast(kind === 'earplugs' ? (this.i18n.lang === 'en' ? 'EARPLUGS — one scream forgiven' : 'БЕРУШИ — один крик простят') : (this.i18n.lang === 'en' ? 'ADRENALINE — run without gasping' : 'АДРЕНАЛИН — беги без одышки'), 'good', 4);
      this.flash([0.6, 1, 0.8], 0.3);
    });
    g.on('adrenaline', (pl) => {
      const near = pl === this.game.local;
      this.toast(this.i18n.lang === 'en' ? 'ADRENALINE SHOT — RUN' : 'АДРЕНАЛИН — БЕГИ', 'good', 2.6);
      if (near) {
        this.audio.sting('adrenaline');
        this.flash([0.55, 1, 0.75], 0.42);
        this.rig.addKick(0.5);
        this.particles.burst(pl.x, pl.y + 1.1, pl.z, 0.7, [0.55, 1, 0.78], 26);
        this.game.shake = Math.max(this.game.shake, 0.5);
      }
    });
    g.on('sonarFound', (kind, obj) => {
      if (kind !== 'gen') return;
      this.audio.ui('mark');
      if (this.game.local) this.hud.toast(this.i18n.lang === 'en' ? `SONAR — generator #${obj.id + 1} marked` : `СОНАР — генератор №${obj.id + 1} отмечен`, 'good', 2.6);
    });
    g.on('discovered', (kind, obj) => {
      if (kind === 'gen') this.toast(this.i18n.lang === 'en' ? `Generator #${obj.id + 1} marked on the sonar` : `Генератор №${obj.id + 1} отмечен на сонаре`, '', 3);
      else if (kind === 'corpse') this.toast(this.i18n.lang === 'en' ? 'A body. Marked.' : 'Тело. Отмечено.', '', 2.4);
      else if (kind === 'circle') this.toast(this.i18n.lang === 'en' ? 'The stone circle marked — sound dies inside it' : 'Каменный круг отмечен — внутри звук глохнет', '', 3.4);
      else if (kind === 'cabin') this.toast(this.i18n.lang === 'en' ? 'The cabin by the lake marked' : 'Сторожка у озера отмечена', '', 3);
      this.audio.ui('hover');
    });
    g.on('announce', (text, dur) => { this.announce(text, dur); this.pushNet({ k: 'announce', x: text, d: dur }); });
    g.on('sting', (kind) => { this.audio.sting(kind); this.addShake(0.55); this.flash([0.9, 0.1, 0.2], 0.22); this.pushNet({ k: 'sting', kind }); });
    g.on('scare', (s, text) => { this.doScare(s, text); this.pushNet({ k: 'scare', kind: s.kind, x: text }); });
    g.on('hint', (text, dur) => { this.hud.hint(text, dur); this.pushNet({ k: 'hint', x: text, d: dur }); });
    g.on('toast', (text, kind, dur) => { this.toast(text, kind, dur); this.pushNet({ k: 'toast', x: text, c: kind, d: dur }); });
    g.on('phase', (p) => this.onPhase(p));
    g.on('duskBeat', (b) => this.onDuskBeat(b));
    g.on('nightStart', () => {
      this.flash([0.05, 0.1, 0.12], 0.9);
      this.addShake(0.9);
      this.audio.thunder();
    });
    g.on('useStart', (p, target) => {
      if (target.kind === 'gen') { this.audio.repair(true); }
      else this.audio.noiseHit(0.3, 0.07, { type: 'bandpass', f0: 1800, f1: 600, q: 2, rev: 0.5 });
    });
    g.on('useStop', () => this.audio.repair(false));
    g.on('spark', (x, z) => {
      this.audio.spark();
      this.particles.burst(x, this.game.world.heightAt(x, z) + 1.5, z, { count: 6, speed: 3.2, life: 0.5, color: [1, 0.85, 0.35], size: 1.8, grav: -7, jitter: 0.5 });
    });
    g.on('playerJoined', () => this.updateCoopBadge());
    g.on('playerLeft', () => this.updateCoopBadge());
  }

  onPhase(p) {
    if (p === 'day') { this.audio.enabled = true; }
    if (p === 'night') {
      this.hud.renderObjectives();
      this.announce(this.i18n.t('night_start'), 4.5);
    }
    if (p === 'dawn') { this.audio.dawn(); this.flash([1, 0.9, 0.7], 0.9); }
  }

  onDuskBeat(b) {
    if (b === 0.05) { this.audio.thunder(); this.addShake(0.35); }
    if (b === 0.28) { this.audio.thunder(); this.flash([0.5, 0.35, 0.3], 0.35); this.addShake(0.5); this.toast(this.i18n.lang === 'en' ? 'Something is walking through the forest.' : 'Что-то идёт по лесу.', 'bad', 4); }
    if (b === 0.5) { this.audio.sting('horde'); this.addShake(0.4); }
    if (b === 0.72) { this.audio.thunder(); this.addShake(0.7); this.flash([0.1, 0.16, 0.2], 0.6); }
    if (b === 0.9) { this.audio.tone(38, 3.2, 'sine', 0.34, { to: 24, rev: 1.2, attack: 0.3 }); }
  }

  showNote(note) {
    if (!note) return;
    const en = this.i18n.lang === 'en';
    this.announce(`«${en ? note.textEn : note.text}»`, 7.5);
    setTimeout(() => this.toast(`▸ ${en ? note.hintEn : note.hint}`, 'good', 6), 900);
  }

  doScare(s, text) {
    this.stats && this.stats.scares++;
    const kind = s.kind;
    this.audio.scare(kind);
    if (kind === 'bang' || kind === 'grab') {
      this.addShake(kind === 'bang' ? 1.0 : 0.75);
      this.flash([0.9, 0.9, 1], kind === 'bang' ? 0.5 : 0.22);
    }
    if (kind === 'face' && this.cfg.scares) {
      const face = this.faces.whisperer;
      if (face) this.jumpscare('whisperer', 0.3, 0.55);
      this.addShake(0.7);
    }
    if (kind === 'grab' && this.game.local) {
      const p = this.game.local;
      const a = Math.random() * TAU;
      this.particles.burst(p.x + Math.cos(a) * 0.6, this.game.world.heightAt(p.x, p.z) + 0.3, p.z + Math.sin(a) * 0.6, { count: 14, speed: 2.2, life: 0.8, color: [0.6, 0.6, 0.55], size: 2 });
      this.rig.punchDir(Math.cos(a), -0.3, Math.sin(a), 0.18);
    }
    if (kind === 'crow') {
      for (let i = 0; i < 22; i++) {
        const p = this.game.local;
        if (!p) break;
        const a = Math.random() * TAU, r = 6 + Math.random() * 22;
        this.particles.spawn(p.x + Math.cos(a) * r, this.game.world.heightAt(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r) + 6 + Math.random() * 10, p.z + Math.sin(a) * r,
          Math.cos(a) * 3, 3 + Math.random() * 3, Math.sin(a) * 3, 2.4, 1.6, 0.1, 0.12, 0.14, 0.4, 0.4);
      }
    }
    if (text) this.toast(text, 'bad', 3.5);
  }

  onDeath(cause, monster) {
    this.audio.repair(false);
    this.input.enabled = false;
    const kind = monster ? monster.type : cause === 'scream_close' ? 'whisperer' : 'whisperer';
    this.jumpscare(kind, 1.9, 1);
    this.addShake(1.8);
    this.state = 'dead';
    this.hud.setNerve(0, 3);
  }
  onDeathRemote(cause, mon) {
    this.toast(this.i18n.lang === 'en' ? 'your partner screamed' : 'напарник закричал', 'bad', 3);
  }

  jumpscare(kind = 'whisperer', dur = 1.6, scale = 1) {
    if (!this.faces[kind]) this.buildFaces();
    const el = $('jumpscare'), img = $('jumpscareImg');
    if (!el || !img) return;
    img.src = this.faces[kind] || this.faces.whisperer || '';
    img.style.animationDuration = (dur * 0.55).toFixed(2) + 's';
    img.style.opacity = scale >= 1 ? '1' : '0.85';
    el.classList.remove('hidden');
    if (this.cfg.shake && scale >= 0.8) el.classList.add('shake');
    if (scale >= 1) this.audio.jumpscare(kind);
    else this.audio.scare('bang');
    clearTimeout(this._jsT);
    this._jsT = setTimeout(() => {
      el.classList.remove('shake');
      el.classList.add('hidden');
    }, dur * 1000);
  }

  onGameOver(summary, win) {
    this.state = 'over';
    this.audio.repair(false);
    this.input.exitLock();
    this.input.enabled = true;
    this.game.paused = true;
    this.screens.fillOver(summary, this.cfg.lang);
    $('btnSaveHs').disabled = false;
    this.screens.show('over');
    if (win) this.audio.ui('win');
    this.hud.show(false);
    if (this.coop.mode === 'host') this.pushNet({ k: win ? 'win' : 'death', cause: summary.cause });
  }

  // ------------------------------------------------------------------ run control
  async ensureAudio() {
    if (!this.audio.ok) await this.audio.init();
    this.audio.resume();
    this.audio.setVolume(this.cfg.volume ?? 0.85);
    return this.audio.ok;
  }

  async enableMic() {
    await this.ensureAudio();
    const ok = await this.mic.enable(this.audio.ctx);
    this.setMicHint();
    if (ok && this.cfg.voiceChat) this.coop.setVoice(true, this.mic.stream);
    return ok;
  }
  setMicHint() {
    const m = $('coopMsg');
    const st = this.mic.state;
    const t = (ru, en) => this.i18n.lang === 'en' ? en : ru;
    if (st === MIC_STATE.ON) this.toast(t('микрофон жив — щёлкай языком', 'mic live — click your tongue'), 'good', 3);
    else if (st === MIC_STATE.DENIED) this.toast(t('микрофон не дан — играем на клавишах (SPACE)', 'mic denied — playing on keyboard (SPACE)'), 'bad', 4);
  }

  async runCalibration() {
    if (this.mic.state !== MIC_STATE.ON) {
      const ok = await this.enableMic();
      if (!ok) { this.toast(this.i18n.lang === 'en' ? 'no microphone' : 'микрофон недоступен', 'bad'); return; }
      [...$('segMic').children].forEach((b) => b.classList.toggle('on', b.dataset.v === 'mic'));
      this.cfg.mic = 'mic'; saveCfg(this.cfg);
    }
    const t = (k) => this.i18n.t(k);
    const bar = $('calibBar'), m1 = $('calibMark1'), m2 = $('calibMark2');
    const steps = [
      [t('calib0'), 0], [t('calib1'), 1], [t('calib2'), 2],
    ];
    for (let i = 0; i < steps.length; i++) {
      this.calibMsg = steps[i][0];
      $('btnCalib').textContent = steps[i][0];
      this.mic.startCalibration(i);
      await new Promise((res) => {
        this.mic.onCalibStep = (step) => { if (step === i) { this.mic.onCalibStep = null; res(); } };
        const tick = () => {
          const n = clamp(this.mic.norm, 0, 1.25) / 1.25;
          bar.style.width = (n * 100).toFixed(0) + '%';
          m1.style.left = (clamp(this.mic.voiceTh / (this.mic.screamTh * 1.15), 0, 1) * 100).toFixed(0) + '%';
          m2.style.left = (clamp(1 / 1.15, 0, 1) * 100).toFixed(0) + '%';
          if (this.mic.calibrating) requestAnimationFrame(tick);
        };
        tick();
      });
      this.audio.ui('click');
    }
    bar.style.width = '0%';
    $('btnCalib').textContent = t('calibrate');
    this.toast(`${t('calibDone')}: voice ${this.mic.voiceTh.toFixed(3)} · scream ${this.mic.screamTh.toFixed(3)}`, 'good', 4);
    this.calibMsg = null;
  }

  async onStart() {
    if (this.coop.mode === 'guest') {
      this.toast(this.i18n.lang === 'en' ? 'the host starts the run' : 'запуск у хоста', 'bad', 3);
      return;
    }
    await this.ensureAudio();
    if (this.cfg.mic === 'mic' && this.mic.state !== MIC_STATE.ON) await this.enableMic();
    this.audio.ui('start');
    await this.startRun({ seed: (Math.random() * 1e9) | 0, nightLength: this.cfg.nightLength });
    if (this.coop.mode === 'host') {
      this.pushNet({ k: 'start', seed: this.game.seed, nightLength: this.game.nightLen, id: 0 });
      this.coop.sendHello({ t: 'hello', yourId: 0, seed: this.game.seed, nightLength: this.game.nightLen, cfg: { nightLength: this.game.nightLen, scares: this.cfg.scares } });
    }
  }

  async startRun({ seed, nightLength, asGuest = false }) {
    this.screens.show('boot');
    this.screens.boot(0.2, this.i18n.lang === 'en' ? 'the forest is growing…' : 'лес растёт…');
    await nextFrame();
    this.game.isHost = !asGuest;
    this.game.localId = asGuest ? (this.myId ?? 1) : 0;
    this.game.lang = this.cfg.lang;
    this.game.scaresEnabled = this.cfg.scares;
    const sameWorld = this.game.seed === seed && this.game.nightLen === nightLength;
    this.game.reset({ seed, nightLength, lang: this.cfg.lang, scares: this.cfg.scares });
    if (!sameWorld) {
      this.scene.rebuild(this.game.world);
      this.buildPoints();
      this.screens.boot(0.7, this.i18n.lang === 'en' ? 'scattering echo dust…' : 'пыль для эха…');
      await nextFrame();
    }
    this.particles.clear();
    this.mviews.clear();
    this.hud.blips.length = 0;
    this.hud.renderObjectives();
    this.rig.smooth.set(this.game.local.x, this.game.local.eye, this.game.local.z);
    this.screens.boot(1, this.i18n.lang === 'en' ? 'breathe in' : 'вдох');
    await nextFrame();
    this.game.paused = asGuest ? false : false;
    this.state = 'playing';
    this.screens.show('game');
    this.hud.show(true);
    this.hud.setTouch(this.input.s.touch);
    this.input.enabled = true;
    if (!this.input.s.touch) this.input.requestLock();
    $('btnSaveHs').disabled = false;
    this.updateCoopBadge();
  }

  async restart() {
    if (this.coop.mode === 'guest') {
      this.coop.sendEvent(this.game.localId, { k: 'restart_req', o: this.game.localId });
      this.toast(this.i18n.lang === 'en' ? 'waiting for the host to restart' : 'ждём перезапуска у хоста', '', 3);
      return;
    }
    this.audio.ui('start');
    this.game.paused = false;
    this.state = 'playing';
    $('jumpscare').classList.add('hidden');
    await this.startRun({ seed: (Math.random() * 1e9) | 0, nightLength: this.cfg.nightLength, asGuest: this.coop.mode === 'guest' });
    if (this.coop.mode === 'host') {
      this.pushNet({ k: 'start', seed: this.game.seed, nightLength: this.game.nightLen, id: 0 });
    }
  }

  toMenu() {
    this.state = 'menu';
    this.game.paused = true;
    this.audio.repair(false);
    this.input.exitLock();
    this.input.enabled = false;
    this.setMenuVisuals();
    this.screens.show('menu');
    this.screens.renderHS($('hsTable'));
    this.hud.show(false);
    $('jumpscare').classList.add('hidden');
    this.coop.close();
    this.coopStatus('default');
    $('roomCode').textContent = '';
    $('btnStart').disabled = false;
    $('btnStart').textContent = this.i18n.t('start');
    this.updateCoopBadge();
  }

  pause(auto = false) {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.game.paused = true;
    this.audio.repair(false);
    this.audio.suspend();
    this.input.exitLock();
    this.input.enabled = false;
    this.screens.fillPause(this.game);
    this.screens.show('pause');
  }
  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.game.paused = false;
    this.audio.resume();
    this.input.enabled = true;
    this.screens.show('game');
    this.hud.show(true);
    if (!this.input.s.touch) this.input.requestLock();
  }

  applyQuality() {
    const q = this.cfg.quality;
    this.perf.level = q === 'high' ? 2 : 0;
    this.scene.quality = q;
    this.setPerfLevel(this.perf.level, true);
    this.scene.rebuild(this.game.world);
    this.buildPoints();
  }
  setPerfLevel(level, force = false) {
    if (level === this.perf.level && !force) return;
    this.perf.level = level;
    const r = this.scene.renderer;
    if (level >= 2) {
      this.scene.setPixelRatio(this.cfg.quality === 'high' ? 2 : 1.15);
      if (!this.composer && this.cfg.quality === 'high') {
        makeComposer(r, this.scene.scene, this.scene.camera, true).then((c) => {
          this.composer = c;
          if (c) { c.setSize(window.innerWidth, window.innerHeight); c.setPixelRatio(r.getPixelRatio()); }
        });
      }
      if (this.composer) this.composer.bloom.strength = 0.72;
    } else if (level === 1) {
      this.scene.setPixelRatio(1.25);
      if (this.composer) this.composer.bloom.strength = 0.4;
    } else {
      this.scene.setPixelRatio(1);
      this.composer = null;
    }
    if (this.composer) this.composer.setPixelRatio(r.getPixelRatio());
    this.particles.setPixelRatio(r.getPixelRatio());
    this.auras.mat.uniforms.uPix.value = r.getPixelRatio();
    if (this.pointsObj) this.pointsObj.material.uniforms.uPix.value = r.getPixelRatio();
  }

  onResize() {
    this.scene.resize();
    if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
    this.hud.setupRadar();
    this.hud.setupCompass();
  }

  toast(text, kind = '', dur = 3) { if (this.hud) this.hud.toast(text, kind, dur); }
  announce(text, dur = 5) {
    if (!this.hud) return;
    this.hud.hint(text, dur);
    this.addShake(0.25);
  }
  addShake(v) { if (this.cfg.shake !== false && this.rig) this.rig.addShake(v); }
  flash(rgb, amt) {
    this.fxState.flash = Math.max(this.fxState.flash, amt);
    this.fxState.flashCol = rgb;
  }

  // ------------------------------------------------------------------ main loop
  loop(now) {
    const dtRaw = (now - (this.last || now)) / 1000;
    this.last = now;
    const dt = clamp(dtRaw, 0.0005, 0.05);
    this.frame(dt);
    this.input.endFrame();
    // perf
    const p = this.perf;
    p.acc += dtRaw; p.n++;
    if (p.acc > 1.0) { p.fps = p.n / p.acc; p.acc = 0; p.n = 0; this.adaptQuality(p.fps); }
  }

  adaptQuality(fps) {
    if (this.state === 'menu') return;
    const max = this.cfg.quality === 'high' ? 2 : 0;
    if (fps < 47 && this.perf.level > 0) { this.setPerfLevel(Math.max(0, this.perf.level - 1)); this.perf.cool = 6; }
    else if (fps > 58 && this.perf.level < max && (this.perf.cool || 0) <= 0) { this.setPerfLevel(this.perf.level + 1); this.perf.cool = 12; }
    if (this.perf.cool > 0) this.perf.cool--;
  }

  frame(dt) {
    const g = this.game, p = g.local;
    const playing = this.state === 'playing';
    const paused = this.state === 'paused';

    // -------- input --------
    if (playing && p && this.input.enabled) {
      this.input.apply(p, {});
      const s = this.input.s;
      const pressed = s.pressed;
      if (pressed.pause) this.pause();
      if (pressed.notes) this.notesOpen = !this.notesOpen, this.hud.setNotesVisible(this.notesOpen);
      if (pressed.restart && (this.state === 'over')) this.restart();
      if (pressed.skip && g.phase === 'day') { g.phaseT = DAY_LEN; }
      if (pressed.shout || s.shout) { this.doShout(1); s.shout = false; }
      if (pressed.mute) this.toggleMute();
      // ping: tap = instant light pulse, hold = charged pulses
      if (pressed.ping || (s.ping && !this.pingHeld)) { this.pingHeld = true; this.pingHold = 0; this.tryPing(0.3); }
      if (!s.ping && !this.input.keys.ping) { this.pingHeld = false; this.pingHold = 0; }
      else if (this.pingHeld) {
        this.pingHold += dt;
        if (this.pingHold > 0.42 && g.t - this.lastHeldPing > 0.85) {
          this.lastHeldPing = g.t;
          this.tryPing(clamp(0.35 + (this.pingHold - 0.42) * 0.5, 0.35, 1));
        }
      }
      g.setUse(this.input.useHeld);
    } else if (!playing) {
      if (this.input.s.pressed.notes) this.notesOpen = false, this.hud.setNotesVisible(false);
      if (this.input.s.pressed.pause && this.state === 'paused') this.resume();
      if ((this.input.s.pressed.restart || this.input.s.pressed.confirm) && this.state === 'over') this.restart();
      if (this.input.s.pressed.confirm && this.state === 'menu') this.onStart();
    }

    // -------- mic --------
    if (this.mic.state === MIC_STATE.ON && (playing || this.state === 'menu')) {
      this.mic.update(dt);
      if (playing && p && p.alive && this.cfg.mic === 'mic') {
        if (this.mic.onset) this.tryPing(this.mic.onsetStrength, true);
        const sc = this.mic.takeScream();
        if (sc > 0 && !this.screamLatch && g.phase !== 'day') { this.screamLatch = true; this.doShout(sc); }
        this.mic.resetScreamLatch();
      }
    } else if (playing) {
      this.mic.update(dt);
    }

    // -------- simulation --------
    if (playing && !paused) {
      g.update(dt);
      this.updateNet(dt);
    } else if (this.state === 'menu') {
      this.menuT += dt * 0.06;
      g.t += dt;
      // decorative sonar pulses behind the title
      this.menuPing -= dt;
      if (this.menuPing <= 0) {
        this.menuPing = 3.4 + Math.random() * 2.2;
        const c = this.game.world.start;
        g.waves.push({ x: c.x, y: c.y + 1.6, z: c.z, r: 1, maxR: 120, speed: 46, str: 0.65, str0: 0.65, life: 3.2, maxLife: 3.2, owner: -1, loud: false, kind: 'ping', color: 0, t0: g.t });
        if (g.waves.length > 6) g.waves.shift();
      }
      for (let i = g.waves.length - 1; i >= 0; i--) {
        const w = g.waves[i];
        w.r += w.speed * dt; w.life -= dt;
        const k = w.r / w.maxR;
        w.str = w.str0 * (1 - k) * (1 - k);
        if (w.r > w.maxR || w.str < 0.01) g.waves.splice(i, 1);
      }
    } else if (this.state === 'dead' || this.state === 'over') {
      g.update(dt);
    }

    // -------- audio state --------
    if (this.audio.ok) {
      this.audio.setPhase(g.skyT, dt);
      if (p) this.audio.setListener(p.x, p.z, p.yaw);
      if (this.coop.mode !== 'solo' && this.coop.mode === 'host') this.remoteVoiceNoise(dt);
    }

    // -------- fx state --------
    const fx = this.fxState;
    fx.damage = Math.max(0, fx.damage - dt * 1.6);
    fx.flash = Math.max(0, fx.flash - dt * 3.4);
    fx.breath = p ? clamp(Math.max(p.breath ? 1 : 0, (1 - p.stamina) * 0.85), 0, 1) : 0;
    const threat = p ? p.heart : 0;
    fx.aberr = damp(fx.aberr, clamp(threat * 0.85 + fx.damage * 0.6 + fx.wail * 0.9, 0, 1), 8, dt);
    fx.wail = Math.max(0, fx.wail - dt * 0.55);
    fx.vig = clamp(0.55 + (1 - g.globalEcho) * 0.45 + threat * 0.35 + fx.breath * 0.5 - g.skyT * 0.0, 0.3, 1.6);
    this.applyFx(dt);

    // -------- world visuals --------
    if (this.scene && p) {
      syncEchoUniforms(this.U, g, this.scene.camera);
      this.scene.update(g, dt, p);
      if (playing || this.state === 'dead') this.rig.update(dt, p, g, { shakeEnabled: this.cfg.shake });
      else this.menuCamera(dt);
      this.particles.setPixelRatio(this.scene.renderer.getPixelRatio());
      this.auras.mat.uniforms.uPix.value = this.scene.renderer.getPixelRatio();
      if (this.pointsObj) this.pointsObj.material.uniforms.uPix.value = this.scene.renderer.getPixelRatio();
      // auras
      this.auras.reset();
      const near = (x, z) => Math.hypot(p.x - x, p.z - z) < 90;
      for (const m of g.monsters) if (m.alive && near(m.x, m.z)) monsterAura(this.auras, m, g.t, p);
      for (const pl of g.players) if (pl !== p && pl.alive && near(pl.x, pl.z)) playerAura(this.auras, pl, g.t);
      this.auras.flush();
      this.mviews.sync(g.monsters, dt, g.t, p);
      this.particles.update(dt);
      // ambient night motes
      if (g.skyT > 0.6 && Math.random() < dt * 12) {
        const a = Math.random() * TAU, r = 6 + Math.random() * 26;
        const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
        this.particles.spawn(x, g.world.heightAt(x, z) + 0.4 + Math.random() * 4, z, (Math.random() - 0.5) * 0.3, 0.12, (Math.random() - 0.5) * 0.3, 3 + Math.random() * 3, 1.1, 0.3, 0.75, 0.6, 0.15, 0.05);
      }
      if (g.skyT < 0.35 && Math.random() < dt * 6) {   // fireflies / pollen by day
        const a = Math.random() * TAU, r = 4 + Math.random() * 22;
        const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
        this.particles.spawn(x, g.world.heightAt(x, z) + 0.6 + Math.random() * 2.4, z, (Math.random() - 0.5) * 0.6, 0.25, (Math.random() - 0.5) * 0.6, 2.4 + Math.random() * 2, 1.5, 1, 0.95, 0.5, 0.5, 0.1);
      }
    }

    // -------- hud --------
    if (this.hud && p && (this.state === 'playing' || this.state === 'paused' || this.state === 'dead')) {
      this.hud.update(dt, p, this.mic, { touch: this.input.s.touch });
      if (this.notesOpen) this.hud.renderObjectives();
    }
    if (this.calibMsg) $('btnCalib').textContent = this.calibMsg;

    // -------- render --------
    if (this.composer && this.perf.level >= 2) this.composer.render(dt);
    else this.scene.renderer.render(this.scene.scene, this.scene.camera);
  }

  tryPing(strength, fromMic = false) {
    const g = this.game, p = g.local;
    if (!p || !p.alive || this.state !== 'playing') return;
    if (p.pingCd > 0 && !fromMic) return;
    if (p.pingCd > 0 && fromMic && strength < 0.5) return;
    g.ping(p, strength);
  }

  doShout(level = 1) {
    const g = this.game, p = g.local;
    if (!p || !p.alive || this.state !== 'playing') return;
    g.scream(p, level);
  }

  menuCamera(dt) {
    const cam = this.scene.camera;
    const w = this.game.world;
    const r = 34;
    const a = this.menuT * 0.55;
    const cx = w.start.x + Math.cos(a) * r;
    const cz = w.start.z + Math.sin(a) * r;
    const cy = w.heightAt(cx, cz) + 12 + Math.sin(this.menuT * 1.7) * 2.2;
    cam.position.set(cx, cy, cz);
    cam.lookAt(w.start.x, w.heightAt(w.start.x, w.start.z) + 2.2, w.start.z);
    this.rig.smooth.copy(cam.position);
  }

  toggleMute() {
    this.audio.enabled = !this.audio.enabled;
    this.cfg.volume = this.audio.enabled ? 0.85 : 0;
    this.audio.setVolume(this.cfg.volume);
    saveCfg(this.cfg);
    this.toast(this.audio.enabled ? (this.i18n.lang === 'en' ? 'sound on' : 'звук включён') : (this.i18n.lang === 'en' ? 'sound off — brave' : 'звук выключен — храбро'), '', 2);
  }

  applyFx(dt) {
    const fx = this.fxState;
    const E = this.fxEl || {};
    const fl = E.flash, dm = E.damage, br = E.breath, ab = E.aberr, vg = E.vig, gl = E.gl;
    if (fl) fl.style.opacity = (fx.flash * 0.6).toFixed(3), fl.style.background = `rgb(${(fx.flashCol[0] * 255) | 0},${(fx.flashCol[1] * 255) | 0},${(fx.flashCol[2] * 255) | 0})`;
    if (dm) dm.style.opacity = (fx.damage * 0.85).toFixed(3);
    if (br) br.style.opacity = (fx.breath * 0.5).toFixed(3);
    if (ab) ab.style.opacity = (fx.aberr * 0.55).toFixed(3);
    if (vg) vg.style.setProperty('--vig', (0.6 + fx.vig * 0.4).toFixed(2));
    const wail = fx.wail;
    if (gl) {
      if (wail > 0.05) {
        gl.style.filter = `saturate(${(1 + wail * 0.8).toFixed(2)}) contrast(${(1 + wail * 0.35).toFixed(2)}) hue-rotate(${(-wail * 14).toFixed(1)}deg) blur(${(wail * 1.4).toFixed(2)}px)`;
        gl.style.transform = `scale(${(1 + wail * 0.02).toFixed(4)}) rotate(${(Math.sin(this.game.t * 9) * wail * 0.7).toFixed(2)}deg)`;
      } else if (gl.style.filter) { gl.style.filter = ''; gl.style.transform = ''; }
    }
  }

  // ------------------------------------------------------------------ net loop
  updateNet(dt) {
    const c = this.coop;
    if (c.mode === 'solo') { this.netEvents.length = 0; return; }
    if (c.mode === 'host') {
      for (const pl of this.game.players) {
        if (pl.remote && pl._target) pl.applyNet(pl._target, dt);
      }
    }
    if (c.mode === 'host') {
      c.stateAcc += dt;
      if (c.stateAcc > 1 / 12) {
        c.stateAcc = 0;
        c.sendState(this.game.snapshot(), this.netEvents);
        this.netEvents.length = 0;
      }
    } else {
      c.inputAcc += dt;
      if (c.inputAcc > 1 / 20) {
        c.inputAcc = 0;
        const p = this.game.local;
        c.sendInput(this.game.localId, p.serialize(), this.netEvents);
        this.netEvents.length = 0;
      }
    }
    if (this.pendingSnap && this.state === 'playing') {
      this.game.applySnapshot(this.pendingSnap, dt);
    }
    this.pendingSnap = null;
  }

  remoteVoiceNoise(dt) {
    const c = this.coop;
    c.updateRemoteLevels(dt);
    for (const [peerId, level] of c.remoteLevels) {
      const id = this.peerMap.get(peerId.replace('eh30-', '')) ?? this.peerMap.get(peerId);
      if (id === undefined) continue;
      const pl = this.game.players.find((x) => x.id === id);
      if (!pl || !pl.alive) continue;
      if (level > 0.3) {
        const key = 'v' + id;
        this._vT = this._vT || {};
        if ((this._vT[key] || 0) < this.game.t) {
          this._vT[key] = this.game.t + 1.4;
          this.game.scream(pl, clamp(level * 1.4, 0.8, 1.6));
          this.toast(this.i18n.t('voice_remote_loud'), 'bad', 2.5);
        }
      } else if (level > 0.06) {
        this.game.noise(pl.x, pl.z, 12 + level * 60, 'voice', pl, false);
      }
    }
  }
}

// ------------------------------------------------------------------ keyboard shortcuts that live outside the game loop
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  window.__ECHO30 = app;
  app.boot().catch((e) => {
    console.error(e);
    const b = document.getElementById('bootMsg');
    if (b) b.textContent = 'error: ' + (e && e.message ? e.message : e) + ' — WebGL required';
  });
});
