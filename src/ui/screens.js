// ============================================================
// SCREENS — menu / pause / game-over / win, settings and the local
// high-score table (localStorage).
// ============================================================
import { clamp, fmtNum, fmtTime } from '../core/util.js';
import { DEATH } from '../sim/content.js';

const HS_KEY = 'echo30.highscores.v2';
const CFG_KEY = 'echo30.config.v2';

export const DEFAULT_CFG = {
  lang: 'ru',
  nightLength: 1800,
  mic: 'mic',
  quality: 'high',
  shake: true,
  scares: true,
  sens: 1.0,
  volume: 0.85,
  name: '',
  voiceChat: false,
};

export function loadCfg() {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (!raw) return { ...DEFAULT_CFG };
    return Object.assign({}, DEFAULT_CFG, JSON.parse(raw));
  } catch (e) { return { ...DEFAULT_CFG }; }
}
export function saveCfg(cfg) {
  try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {}
}

export function loadHS() {
  try {
    const raw = localStorage.getItem(HS_KEY);
    if (!raw) return [];
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a : [];
  } catch (e) { return []; }
}
export function saveHS(list) {
  try { localStorage.setItem(HS_KEY, JSON.stringify(list.slice(0, 10))); } catch (e) {}
}
export function addHS(entry) {
  const list = loadHS();
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const out = list.slice(0, 10);
  saveHS(out);
  return { list: out, rank: out.indexOf(entry) };
}
export function clearHS() { saveHS([]); }

export class Screens {
  constructor(i18n, cfg) {
    this.i18n = i18n;
    this.cfg = cfg;
    this.el = {
      menu: document.getElementById('menu'),
      pause: document.getElementById('pause'),
      over: document.getElementById('over'),
      boot: document.getElementById('boot'),
      hud: document.getElementById('hud'),
      bootBar: document.getElementById('bootBar'),
      bootMsg: document.getElementById('bootMsg'),
      overTitle: document.getElementById('overTitle'),
      overCause: document.getElementById('overCause'),
      overStats: document.getElementById('overStats'),
      overScore: document.getElementById('overScore'),
      overRecord: document.getElementById('overRecord'),
      hsName: document.getElementById('hsName'),
      hsTable: document.getElementById('hsTable'),
      hsTableOver: document.getElementById('hsTableOver'),
      pauseStats: document.getElementById('pauseStats'),
      menuVersion: document.getElementById('menuVersion'),
    };
    this.current = 'boot';
    this.pendingEntry = null;
  }

  show(name) {
    this.current = name;
    this.el.menu.classList.toggle('hidden', name !== 'menu');
    this.el.pause.classList.toggle('hidden', name !== 'pause');
    this.el.over.classList.toggle('hidden', name !== 'over' && name !== 'win');
    this.el.boot.classList.toggle('hidden', name !== 'boot');
    this.el.hud.classList.toggle('hidden', !(name === 'game' || name === 'pause' || name === 'notes'));
    if (name === 'menu') this.renderHS(this.el.hsTable);
  }

  boot(p, msg) {
    if (this.el.bootBar) this.el.bootBar.style.width = (p * 100).toFixed(0) + '%';
    if (msg && this.el.bootMsg) this.el.bootMsg.textContent = msg;
  }

  renderHS(target) {
    const list = loadHS();
    const t = (k) => this.i18n.t(k);
    if (!list.length) { target.innerHTML = `<div class="hs-empty">${t('hs_empty')}</div>`; return; }
    const rows = [`<div class="hs-row head"><span>${t('hs_rank')}</span><span>${t('hs_name')}</span><span>${t('hs_score')}</span><span>${t('hs_time')}</span><span>${t('hs_gens')}</span></div>`];
    list.forEach((e, i) => {
      rows.push(`<div class="hs-row ${e.me ? 'me' : ''}"><span>${i + 1}</span><span class="nm">${esc(e.name)}</span><b>${fmtNum(e.score)}</b><span>${fmtTime(e.time)}</span><span>${e.gens}/5${e.win ? ' ☀' : ''}</span></div>`);
    });
    target.innerHTML = rows.join('');
  }

  fillOver(summary, lang) {
    const t = (k) => this.i18n.t(k);
    const win = summary.win;
    this.el.overTitle.textContent = win ? t('win_title') : titleFor(summary.cause, lang);
    this.el.overTitle.classList.toggle('win', win);
    this.el.overCause.textContent = win
      ? (lang === 'en'
        ? `You made it to dawn. ${summary.gens} of 5 generators hummed behind you, and the forest let you go.`
        : `Ты дожил до рассвета. За спиной гудело ${summary.gens} из 5 генераторов, и лес тебя отпустил.`)
      : causeText(summary.cause, summary.monster, lang);
    const cells = [
      [t('stat_time'), fmtTime(summary.time)],
      [t('stat_gens'), `${summary.gens}/5`],
      [t('stat_notes'), `${summary.notes}/8`],
      [t('stat_pings'), summary.pings],
      [t('stat_screams'), summary.screams],
      [t('stat_dist'), Math.round(summary.dist) + (lang === 'en' ? 'm' : 'м')],
      [t('stat_nerve'), `${summary.nerve}/3`],
      [t('stat_silence'), fmtTime(summary.longestSilence)],
    ];
    this.el.overStats.innerHTML = cells.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
    this.el.overScore.textContent = fmtNum(summary.score);
    this.pendingEntry = {
      name: (this.cfg.name || (lang === 'en' ? 'NAMELESS' : 'БЕЗЫМЯННЫЙ')).slice(0, 12).toUpperCase(),
      score: summary.score, time: Math.round(summary.time), gens: summary.gens,
      notes: summary.notes, win: !!win, cause: summary.cause || '', diff: summary.diff ? summary.diff.name : '',
      date: Date.now(), me: true,
    };
    this.el.hsName.value = this.pendingEntry.name;
    const best = loadHS()[0];
    this.el.overRecord.classList.toggle('hidden', !(best && summary.score > best.score));
    this.renderHS(this.el.hsTableOver);
  }

  saveScore(name) {
    if (!this.pendingEntry) return null;
    this.pendingEntry.name = (name || this.pendingEntry.name || '???').slice(0, 12).toUpperCase() || '???';
    this.cfg.name = this.pendingEntry.name;
    saveCfg(this.cfg);
    const old = loadHS();
    old.forEach((e) => { e.me = false; });
    saveHS(old);
    const r = addHS(this.pendingEntry);
    this.pendingEntry = null;
    this.renderHS(this.el.hsTableOver);
    this.renderHS(this.el.hsTable);
    return r;
  }

  fillPause(game) {
    const t = (k) => this.i18n.t(k);
    const p = game.local;
    const rows = [
      [t('stat_time'), fmtTime(game.nightLen - Math.max(0, game.nightT))],
      [t('score'), fmtNum(game.score)],
      [t('generators'), `${game.stats.gens}/${game.world.gens.length}`],
      [t('obj_fuses'), p ? p.fuses : 0],
      [t('stat_nerve'), p ? `${p.nerve}/3` : '-'],
      [t('stat_pings'), game.stats.pings],
    ];
    this.el.pauseStats.innerHTML = rows.map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');
  }
}

function titleFor(cause, lang) {
  const d = DEATH[cause] || DEATH.nerve;
  return lang === 'en' ? d.en[0] : d.ru[0];
}
function causeText(cause, monster, lang) {
  const key = cause === 'scream_close' ? 'scream_close' : (cause || (monster ? monster : 'nerve'));
  const d = DEATH[key] || DEATH.nerve;
  return lang === 'en' ? d.en[1] : d.ru[1];
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
