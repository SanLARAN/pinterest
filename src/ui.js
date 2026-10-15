import { HighScores, saveSettings } from './storage.js';
import { TRACKS, CFG } from './config.js';
import { fmtTime, fmtScore } from './hud.js';

const $ = (id) => document.getElementById(id);
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Menus & overlays: title, how-to, scores, settings, pause, results. */
export class UI {
  constructor(game) {
    this.g = game;
    this.screens = {};
    document.querySelectorAll('.screen').forEach((s) => { this.screens[s.dataset.screen] = s; });
    this.current = null;
    this.stack = [];
    this.sel = 0;
    this.editing = false;
    this.tag = (game.settings.tag || 'ACE').toUpperCase().slice(0, 3).padEnd(3, 'A');
    this.slot = 0;
    this.entryIndex = -1;
    document.getElementById('screens').addEventListener('click', (e) => {
      const b = e.target.closest('[data-action]');
      if (!b) return;
      e.preventDefault();
      if (b.blur) b.blur();
      this.g.audio.init();
      this.action(b.dataset.action, b);
    });
    this.refreshSettings();
    this.refreshTitle();
  }

  // ---------------------------------------------------------------- screens
  show(name, push = false) {
    if (push && this.current) this.stack.push(this.current);
    else if (!push) this.stack = [];
    for (const k in this.screens) this.screens[k].classList.toggle('active', k === name);
    this.current = name;
    this.sel = 0;
    this.highlight();
    $('screens').classList.toggle('open', !!name);
    if (name === 'title') this.refreshTitle();
    if (name === 'scores') this.renderTable($('s-table'), -1);
    if (name === 'settings') this.refreshSettings();
  }

  hide() {
    for (const k in this.screens) this.screens[k].classList.remove('active');
    this.current = null;
    this.stack = [];
    $('screens').classList.remove('open');
  }

  back() {
    const prev = this.stack.pop();
    if (prev) {
      const rest = this.stack;
      this.show(prev, false);
      this.stack = rest;
    } else if (this.current === 'pause') this.g.resume();
    else if (this.current === 'results') this.g.toTitle();
    else if (this.current !== 'title') this.show('title');
  }

  buttons() {
    if (!this.current) return [];
    return [...this.screens[this.current].querySelectorAll('[data-action]:not([data-nonav])')].filter((b) => b.offsetParent !== null);
  }

  highlight() {
    const bs = this.buttons();
    bs.forEach((b, i) => b.classList.toggle('sel', i === this.sel));
  }

  /** Keyboard / gamepad navigation, called each frame by the game. */
  nav(input) {
    if (!this.current) return;
    if (this.editing) { this.editTag(input); return; }
    const bs = this.buttons();
    if (!bs.length) return;
    if (input.take('nav-down')) { this.sel = (this.sel + 1) % bs.length; this.highlight(); this.g.audio.ui(); }
    if (input.take('nav-up')) { this.sel = (this.sel - 1 + bs.length) % bs.length; this.highlight(); this.g.audio.ui(); }
    const cur = bs[this.sel];
    if (cur && cur.dataset.cycle) {
      if (input.take('nav-right')) this.action(cur.dataset.action, cur, 1);
      if (input.take('nav-left')) this.action(cur.dataset.action, cur, -1);
    }
    if (input.take('confirm') && cur) { this.g.audio.init(); this.action(cur.dataset.action, cur); }
    if (input.take('back')) this.back();
  }

  action(a, el, dir = 1) {
    const g = this.g;
    const s = g.settings;
    switch (a) {
      case 'start': g.audio.ui(true); g.startRace(); break;
      case 'retry': g.audio.ui(true); g.startRace(); break;
      case 'resume': g.resume(); break;
      case 'menu': g.toTitle(); break;
      case 'scores': g.audio.ui(); this.show('scores', true); break;
      case 'howto': g.audio.ui(); this.show('howto', true); break;
      case 'settings': g.audio.ui(); this.show('settings', true); break;
      case 'back': g.audio.ui(); this.back(); break;
      case 'track':
        g.audio.ui();
        s.track = (s.track + dir + TRACKS.length) % TRACKS.length;
        saveSettings(s);
        g.loadTrack(s.track);
        this.refreshTitle();
        break;
      case 'fullscreen': {
        const d = document;
        if (!d.fullscreenElement) (d.documentElement.requestFullscreen?.() || Promise.resolve()).catch(() => {});
        else d.exitFullscreen?.();
        break;
      }
      case 'vol':
        s.volume = Math.round(Math.min(1, Math.max(0, s.volume + 0.1 * dir)) * 10) / 10;
        if (s.volume === 0 && dir > 0) s.volume = 0.1;
        g.audio.setVolume(s.volume); g.audio.ui(); break;
      case 'music': s.music = !s.music; g.audio.setMusic(s.music); g.audio.ui(); break;
      case 'shake': s.shake = [0, 0.5, 1][(([0, 0.5, 1].indexOf(s.shake) + dir) + 3) % 3]; g.audio.ui(); break;
      case 'quality': {
        const q = ['auto', 'low', 'medium', 'high'];
        s.quality = q[(q.indexOf(s.quality) + dir + q.length) % q.length];
        g.applyQuality(s.quality === 'auto' ? g.autoQuality() : s.quality);
        g.audio.ui(); break;
      }
      case 'autofire': {
        const q = ['touch', 'always', 'off'];
        s.autoFire = q[(q.indexOf(s.autoFire) + dir + q.length) % q.length];
        g.audio.ui(); break;
      }
      case 'cam': s.farCam = !s.farCam; g.chase.far = s.farCam; g.audio.ui(); break;
      case 'fps': s.showFps = !s.showFps; g.audio.ui(); break;
      case 'tag-up': this.cycleLetter(+el.dataset.slot, 1); break;
      case 'tag-down': this.cycleLetter(+el.dataset.slot, -1); break;
      case 'tag-save': this.saveTag(); break;
      default: break;
    }
    if (['vol', 'music', 'shake', 'quality', 'autofire', 'cam', 'fps'].includes(a)) {
      saveSettings(s);
      this.refreshSettings();
    }
  }

  refreshSettings() {
    const s = this.g.settings;
    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    set('o-vol', '■'.repeat(Math.round(s.volume * 10)) + '□'.repeat(10 - Math.round(s.volume * 10)));
    set('o-music', s.music ? 'ON' : 'OFF');
    set('o-shake', s.shake === 0 ? 'OFF' : s.shake === 0.5 ? 'LOW' : 'FULL');
    set('o-quality', s.quality.toUpperCase() + (s.quality === 'auto' && this.g.qualityName ? ` (${this.g.qualityName.toUpperCase()})` : ''));
    set('o-autofire', { touch: 'TOUCH ONLY', always: 'ALWAYS', off: 'OFF' }[s.autoFire]);
    set('o-cam', s.farCam ? 'FAR' : 'NEAR');
    set('o-fps', s.showFps ? 'ON' : 'OFF');
  }

  refreshTitle() {
    const s = this.g.settings;
    const e = $('t-track');
    if (e) e.textContent = TRACKS[s.track].name;
    const b = $('t-best');
    if (b) b.textContent = fmtScore(HighScores.best());
  }

  renderTable(el, highlight) {
    const l = HighScores.list();
    if (!l.length) {
      el.innerHTML = '<li class="empty">NO SCORES YET — GO WRECK SOMEBODY</li>';
      return;
    }
    el.innerHTML = l.map((e, i) => `
      <li class="${i === highlight ? 'me' : ''}">
        <span class="rk">${i + 1}</span>
        <span class="nm">${escapeHtml(e.name || '???')}</span>
        <span class="sc">${fmtScore(e.score)}</span>
        <span class="ex">${e.won ? '🏆 ' : ''}${e.pos ? 'P' + e.pos : '✖'} · ${e.kills || 0}K · ${escapeHtml(e.track || '')}</span>
      </li>`).join('');
  }

  // ---------------------------------------------------------------- results
  showResults(r) {
    $('r-title').textContent = r.title;
    $('r-title').className = 'res-title ' + r.cls;
    $('r-sub').textContent = r.sub;
    const rows = [
      ['RIVALS WRECKED', r.rivalKills, r.rivalPts],
      ['RAIDERS SCRAPPED', r.goonKills, r.goonPts],
      ['BEST COMBO', r.bestCombo > 0 ? 'x' + r.bestCombo : '—', ''],
      ['STYLE (DRIFT · AIR · SMASH)', '', r.stylePts],
      ['FINISH BONUS', r.finished ? 'P' + r.pos : '—', r.finishPts],
      ['TIME BONUS', r.finished ? r.timeLeft.toFixed(1) + 's' : '—', r.timePts],
    ];
    $('r-stats').innerHTML = rows.map(([a, b, c]) => `<div class="rs-row"><span>${a}</span><b>${b}</b><em>${c === '' ? '' : '+' + fmtScore(c)}</em></div>`).join('') +
      `<div class="rs-total"><span>SCORE</span><b id="r-score">0</b></div>`;
    this.countUp($('r-score'), r.score);
    this.entryIndex = -1;
    this.editing = false;
    const qual = HighScores.qualifies(r.score);
    if (qual) {
      this.entryIndex = HighScores.add({ name: this.tag, score: r.score, pos: r.finished ? r.pos : 0, kills: r.rivalKills + r.goonKills, won: r.won, track: r.track, date: Date.now() });
      this.editing = true;
      this.slot = 0;
    }
    $('r-entry').classList.toggle('hidden', !qual);
    $('r-newbest').classList.toggle('hidden', !(qual && this.entryIndex === 0));
    this.renderTag();
    this.renderTable($('r-table'), this.entryIndex);
    this.show('results');
  }

  countUp(el, target) {
    const t0 = performance.now();
    const dur = 900;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      el.textContent = fmtScore(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1 && this.current === 'results') requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  renderTag() {
    for (let i = 0; i < 3; i++) {
      const e = $('tag-' + i);
      if (!e) continue;
      e.textContent = this.tag[i];
      e.classList.toggle('cur', this.editing && i === this.slot);
    }
    $('r-entry').classList.toggle('editing', this.editing);
  }

  cycleLetter(i, d) {
    const idx = LETTERS.indexOf(this.tag[i]);
    const c = LETTERS[(idx + d + LETTERS.length) % LETTERS.length];
    this.tag = this.tag.slice(0, i) + c + this.tag.slice(i + 1);
    this.slot = i;
    this.editing = true;
    this.commitTag();
    this.g.audio.ui();
  }

  commitTag() {
    if (this.entryIndex >= 0) HighScores.rename(this.entryIndex, this.tag);
    this.g.settings.tag = this.tag;
    saveSettings(this.g.settings);
    this.renderTag();
    this.renderTable($('r-table'), this.entryIndex);
  }

  saveTag() {
    this.editing = false;
    this.commitTag();
    this.g.audio.ui(true);
  }

  editTag(input) {
    let L;
    while ((L = input.takeLetter())) {
      this.tag = this.tag.slice(0, this.slot) + L + this.tag.slice(this.slot + 1);
      this.slot = Math.min(2, this.slot + 1);
      this.commitTag();
      this.g.audio.ui();
    }
    if (input.take('nav-up')) this.cycleLetter(this.slot, 1);
    if (input.take('nav-down')) this.cycleLetter(this.slot, -1);
    if (input.take('nav-left')) { this.slot = Math.max(0, this.slot - 1); this.renderTag(); }
    if (input.take('nav-right')) { this.slot = Math.min(2, this.slot + 1); this.renderTag(); }
    if (input.take('back')) { this.slot = Math.max(0, this.slot - 1); this.renderTag(); }
    if (input.take('confirm') || input.take('pause')) this.saveTag();
    input.take('restart');
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export { CFG, fmtTime };
