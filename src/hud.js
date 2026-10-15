import * as THREE from 'three';
import { CFG } from './config.js';

const $ = (id) => document.getElementById(id);
const _v = new THREE.Vector3();

function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
}
const fmtScore = (n) => Math.round(n).toLocaleString('en-US');
const hex = (c) => '#' + c.toString(16).padStart(6, '0');

/** DOM heads-up display. Writes only what changed. */
export class HUD {
  constructor(game) {
    this.g = game;
    this.el = $('hud');
    this.sec = $('h-sec'); this.ms = $('h-ms'); this.timerWrap = $('h-timer-wrap'); this.timer = $('h-timer');
    this.delta = $('h-delta');
    this.pos = $('h-pos'); this.posWrap = $('h-pos-wrap'); this.lap = $('h-lap'); this.laptime = $('h-laptime');
    this.score = $('h-score'); this.combo = $('h-combo'); this.comboWrap = $('h-combo-wrap'); this.comboBar = $('h-combo-bar');
    this.comboName = $('h-combo-name');
    this.speed = $('h-speed'); this.boost = $('h-boost'); this.heat = $('h-heat'); this.heatWrap = $('h-heat-wrap');
    this.boostWrap = $('h-boost-wrap');
    this.center = $('h-center');
    this.feed = $('h-feed');
    this.hitmarker = $('h-hitmarker');
    this.reticle = $('h-reticle');
    this.wrong = $('h-wrong');
    this.od = $('h-od');
    this.fps = $('h-fps');
    this.popLayer = $('popups');
    this.tagLayer = $('tags');
    this.lowFlash = $('low-flash');
    this.pops = [];
    for (let i = 0; i < 20; i++) {
      const d = document.createElement('div');
      d.className = 'pop';
      const s = document.createElement('span');
      d.appendChild(s);
      this.popLayer.appendChild(d);
      this.pops.push({ el: d, span: s, t: 0, life: 0, x: 0, y: 0, z: 0, on: false });
    }
    this.tags = [];
    this.cache = {};
    this.scoreShown = 0;
    this.centerT = 0;
    this.minimap = new Minimap($('minimap'));
    this.frame = 0;
    this.fpsAcc = 0; this.fpsN = 0;
  }

  setTrack(track) { this.minimap.build(track); }

  buildTags(cars) {
    this.tagLayer.innerHTML = '';
    this.tags = cars.map((c) => {
      const d = document.createElement('div');
      d.className = 'tag';
      d.innerHTML = `<b style="color:${hex(c.color)}">${c.name}</b><i><u></u></i>`;
      this.tagLayer.appendChild(d);
      return { car: c, el: d, bar: d.querySelector('u'), shown: false, hp: -1 };
    });
  }

  show(on) { this.el.classList.toggle('hidden', !on); this.tagLayer.classList.toggle('hidden', !on); }

  set(key, el, val, prop = 'textContent') {
    if (this.cache[key] === val) return;
    this.cache[key] = val;
    el[prop] = val;
  }

  cls(key, el, name, on) {
    const k = key + name;
    if (this.cache[k] === on) return;
    this.cache[k] = on;
    el.classList.toggle(name, on);
  }

  // --------------------------------------------------------------- events
  popup(x, y, z, text, cls = '') {
    let p = this.pops.find((q) => !q.on);
    if (!p) p = this.pops[0];
    p.on = true; p.t = 0; p.life = 1.1; p.x = x; p.y = y; p.z = z;
    p.span.textContent = text;
    p.el.className = 'pop show ' + cls;
    // restart css animation
    p.span.style.animation = 'none';
    void p.span.offsetWidth;
    p.span.style.animation = '';
  }

  message(main, subs = [], cls = '', dur = 1.4, hint = '') {
    const c = this.center;
    c.className = 'center-msg ' + cls;
    c.innerHTML = `<div class="cm-main">${main}</div>` + subs.map((s) => `<div class="cm-sub">${s}</div>`).join('') +
      (hint ? `<div class="cm-hint">${hint}</div>` : '');
    void c.offsetWidth;
    c.classList.add('show');
    this.centerT = dur;
  }

  feedLine(html) {
    const d = document.createElement('div');
    d.className = 'feed-line';
    d.innerHTML = html;
    this.feed.prepend(d);
    while (this.feed.children.length > 4) this.feed.lastChild.remove();
    setTimeout(() => d.classList.add('out'), 2600);
    setTimeout(() => d.remove(), 3200);
  }

  timeDelta(v) {
    const d = this.delta;
    d.textContent = (v > 0 ? '+' : '') + v.toFixed(1) + 's';
    d.className = 'timer-delta ' + (v > 0 ? 'gain' : 'loss');
    void d.offsetWidth;
    d.classList.add('show');
    this.timerWrap.classList.remove('bump-gain', 'bump-loss');
    void this.timerWrap.offsetWidth;
    this.timerWrap.classList.add(v > 0 ? 'bump-gain' : 'bump-loss');
  }

  hit(kill = false) {
    const h = this.hitmarker;
    h.className = kill ? 'kill' : '';
    void h.offsetWidth;
    h.classList.add('show');
  }

  bumpCombo() {
    this.comboWrap.classList.remove('bump');
    void this.comboWrap.offsetWidth;
    this.comboWrap.classList.add('bump');
  }

  bumpPos(up) {
    this.posWrap.classList.remove('up', 'down');
    void this.posWrap.offsetWidth;
    this.posWrap.classList.add(up ? 'up' : 'down');
  }

  // --------------------------------------------------------------- update
  update(dt) {
    const g = this.g;
    const P = g.player;
    this.frame++;
    // timer
    const t = Math.max(0, g.timeLeft);
    const secs = Math.floor(t);
    this.set('sec', this.sec, String(secs).padStart(2, '0'));
    this.set('ms', this.ms, String(Math.floor((t - secs) * 100)).padStart(2, '0'));
    this.cls('tw', this.timerWrap, 'low', t < 5 && g.state === 'race');
    this.cls('tw', this.timerWrap, 'crit', t < 3 && g.state === 'race');
    // position / lap
    this.set('pos', this.pos, String(g.playerPos));
    const lapN = Math.min(CFG.LAPS, Math.max(1, P.lap + 1));
    this.set('lap', this.lap, `${lapN}/${CFG.LAPS}`);
    if (this.frame % 6 === 0) this.set('lt', this.laptime, fmtTime(g.raceTime));
    // score (rolling)
    this.scoreShown += (g.score - this.scoreShown) * Math.min(1, dt * 10);
    if (Math.abs(g.score - this.scoreShown) < 1) this.scoreShown = g.score;
    this.set('score', this.score, fmtScore(this.scoreShown));
    // combo
    const cm = g.combo;
    this.set('combo', this.combo, String(Math.max(1, cm)));
    this.cls('cw', this.comboWrap, 'active', cm > 1);
    const ck = cm > 0 ? Math.max(0, g.comboT / CFG.COMBO_WINDOW) : 0;
    this.comboBar.style.transform = `scaleX(${ck.toFixed(3)})`;
    this.set('cname', this.comboName, g.comboName || '');
    // gauges
    if (this.frame % 3 === 0) this.set('spd', this.speed, String(Math.round(Math.max(0, P.fwdSpeed) * 3.6)));
    this.boost.style.transform = `scaleX(${P.nitro.toFixed(3)})`;
    this.heat.style.transform = `scaleX(${P.heat.toFixed(3)})`;
    this.cls('hw', this.heatWrap, 'over', P.overheated);
    this.cls('bw', this.boostWrap, 'full', P.nitro > 0.98);
    this.cls('bw', this.boostWrap, 'on', P.boosting);
    this.cls('od', this.od, 'on', g.overdrive > 0);
    this.cls('ww', this.wrong, 'show', g.wrongWay > 0.8 && g.state === 'race');
    // center message timeout
    if (this.centerT > 0) {
      this.centerT -= dt;
      if (this.centerT <= 0) this.center.classList.remove('show');
    }
    // fps
    if (g.settings.showFps) {
      this.fpsAcc += dt; this.fpsN++;
      if (this.fpsAcc > 0.5) {
        this.fps.textContent = `${Math.round(this.fpsN / this.fpsAcc)} FPS · Q:${g.qualityName}`;
        this.fpsAcc = 0; this.fpsN = 0;
      }
    }
    this.cls('fps', this.fps, 'hidden', !g.settings.showFps);
    this.updatePops(dt);
    this.updateTags();
    this.updateReticle();
    if (this.frame % 2 === 0) this.minimap.draw(g);
  }

  project(x, y, z) {
    _v.set(x, y, z).project(this.g.camera);
    if (_v.z > 1 || _v.z < -1) return false;
    const w = this.g.width, h = this.g.height;
    _v.x = (_v.x * 0.5 + 0.5) * w;
    _v.y = (-_v.y * 0.5 + 0.5) * h;
    return true;
  }

  updatePops(dt) {
    for (const p of this.pops) {
      if (!p.on) continue;
      p.t += dt;
      if (p.t >= p.life) { p.on = false; p.el.className = 'pop'; continue; }
      if (this.project(p.x, p.y + p.t * 3, p.z)) {
        p.el.style.transform = `translate3d(${_v.x.toFixed(1)}px, ${_v.y.toFixed(1)}px, 0)`;
      }
    }
  }

  updateReticle() {
    const g = this.g;
    const t = g.weapons.lockTarget;
    const on = !!t && g.state === 'race' && this.project(t.pos.x, t.pos.y + 0.9, t.pos.z);
    this.cls('ret', this.reticle, 'on', on);
    this.cls('ret', this.reticle, 'od', g.overdrive > 0);
    if (on) this.reticle.style.transform = `translate3d(${_v.x.toFixed(1)}px, ${_v.y.toFixed(1)}px, 0)`;
  }

  updateTags() {
    const g = this.g;
    const P = g.player;
    for (const t of this.tags) {
      const c = t.car;
      let show = c.active && !c.dead && g.state !== 'title';
      if (show) {
        const dx = c.pos.x - P.pos.x, dz = c.pos.z - P.pos.z;
        show = dx * dx + dz * dz < 90 * 90 && this.project(c.pos.x, c.pos.y + 3.2, c.pos.z);
      }
      if (show !== t.shown) { t.shown = show; t.el.style.display = show ? 'block' : 'none'; }
      if (!show) continue;
      t.el.style.transform = `translate3d(${_v.x.toFixed(1)}px, ${_v.y.toFixed(1)}px, 0)`;
      const hp = Math.round((c.hp / c.st.hp) * 100);
      if (hp !== t.hp) {
        t.hp = hp;
        t.bar.style.transform = `scaleX(${hp / 100})`;
        t.el.classList.toggle('hurt', hp < 100);
      }
    }
  }
}

/** Canvas mini-map: track outline + racers. */
class Minimap {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.bg = document.createElement('canvas');
  }

  build(track) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const S = 150;
    this.S = S;
    this.cv.width = this.bg.width = S * dpr;
    this.cv.height = this.bg.height = S * dpr;
    this.dpr = dpr;
    const b = track.bounds;
    const w = b.maxX - b.minX, h = b.maxZ - b.minZ;
    const pad = 12;
    this.scale = (S - pad * 2) / Math.max(w, h);
    this.ox = pad + ((S - pad * 2) - w * this.scale) / 2 - b.minX * this.scale;
    this.oz = pad + ((S - pad * 2) - h * this.scale) / 2 - b.minZ * this.scale;
    const g = this.bg.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, S, S);
    g.lineJoin = 'round';
    const path = () => {
      g.beginPath();
      for (let i = 0; i <= track.n; i++) {
        const k = i % track.n;
        const x = this.ox + track.px[k] * this.scale, y = this.oz + track.pz[k] * this.scale;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
    };
    path(); g.strokeStyle = 'rgba(20,6,30,0.75)'; g.lineWidth = 8; g.stroke();
    path(); g.strokeStyle = 'rgba(255,214,170,0.9)'; g.lineWidth = 3; g.stroke();
    // start line
    const sx = this.ox + track.px[0] * this.scale, sy = this.oz + track.pz[0] * this.scale;
    g.fillStyle = '#ff2e88';
    g.fillRect(sx - 3, sy - 3, 6, 6);
  }

  draw(game) {
    const g = this.ctx, d = this.dpr;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.cv.width, this.cv.height);
    g.drawImage(this.bg, 0, 0);
    g.setTransform(d, 0, 0, d, 0, 0);
    for (const c of game.allCars) {
      if (!c.active || c.isPlayer) continue;
      const x = this.ox + c.pos.x * this.scale, y = this.oz + c.pos.z * this.scale;
      if (c.kind === 'goon') {
        g.fillStyle = c.dead ? 'rgba(80,60,60,0.6)' : '#ff3355';
        g.fillRect(x - 1.5, y - 1.5, 3, 3);
      } else {
        g.fillStyle = c.dead ? 'rgba(40,30,40,0.7)' : hex(c.color);
        g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#1a0f26'; g.lineWidth = 1; g.stroke();
      }
    }
    const P = game.player;
    const x = this.ox + P.pos.x * this.scale, y = this.oz + P.pos.z * this.scale;
    g.save();
    g.translate(x, y);
    // world heading -> canvas angle (x right, z down)
    g.rotate(-P.heading + Math.PI / 2 - Math.PI / 2);
    g.rotate(Math.PI);
    g.beginPath();
    g.moveTo(0, -6); g.lineTo(4.5, 5); g.lineTo(-4.5, 5); g.closePath();
    g.fillStyle = '#fff'; g.fill();
    g.strokeStyle = '#ff2e88'; g.lineWidth = 2; g.stroke();
    g.restore();
  }
}

export { fmtTime, fmtScore };
