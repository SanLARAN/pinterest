import { t } from '../core/i18n.js';
import { settings, saveSettings } from '../core/storage.js';
import { cleanGraphics, GRAPHICS_DEFAULTS, GRAPHICS_FIELDS } from '../render/graphicsSettings.js';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const word = key => 'gx_' + key;
const resolution = new Set(['enabled', 'scale', 'pixelBudget', 'dynamic', 'aa', 'reset']);

export class AdvancedGraphics {
  constructor({ onChange, stats }) {
    this.onChange = onChange; this.stats = stats;
    this.root = $('graphicsAdvanced'); this.panel = this.root.closest('.panel');
    this.button = $('btnGraphicsAdvanced'); this.opened = false;
    this.button.addEventListener('click', () => this.open());
    this.root.addEventListener('change', e => this.change(e));
    this.root.addEventListener('input', e => { if (e.target.type === 'range') this.change(e); });
    this.panel.addEventListener('keydown', e => {
      if (!this.opened) return;
      if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); }
      if (e.code === 'Tab') {
        const list = [...this.panel.querySelectorAll('button,input,select')].filter(el => !el.disabled && el.getClientRects().length);
        if (!list.length) return;
        const first = list[0], last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    this.render();
  }
  field(f) {
    const id = 'gx-' + f.key;
    let control;
    if (f.type === 'check') control = `<input id="${id}" data-gx="${f.key}" type="checkbox">`;
    else if (f.type === 'select') control = `<select id="${id}" data-gx="${f.key}">${f.options.map(v => `<option value="${v}">${esc(typeof v === 'number' ? String(v) : t('gxAA_' + v))}</option>`).join('')}</select>`;
    else control = `<input id="${id}" data-gx="${f.key}" type="range" min="${f.min}" max="${f.max}" step="${f.step}"><output for="${id}"></output>`;
    return `<label class="gx-field" for="${id}"><span><b>${esc(t(word(f.key)))}</b><small>${esc(t(word(f.key) + 'Hint'))}</small></span><span class="gx-control">${control}</span></label>`;
  }
  render() {
    this.root.innerHTML = `<header class="gx-header"><div><span class="gx-kicker">${esc(t('gxKicker'))}</span><h2 id="gxTitle">${esc(t('gxTitle'))}</h2><p>${esc(t('gxIntro'))}</p></div><span class="gx-tag">${esc(t('gxPipeline'))}</span></header>
      <div class="gx-toolbar"><label><input type="checkbox" data-gx="enabled"><span>${esc(t('gxEnabled'))}</span></label><span class="gx-mode"></span></div>
      <div class="gx-layout"><div class="gx-groups">${['resolution','light','film','system'].map((group, i) => `<fieldset data-group="${group}"><legend><i>0${i+1}</i>${esc(t('gxGroup_' + group))}</legend>${GRAPHICS_FIELDS.filter(f => f.group === group).map(f => this.field(f)).join('')}</fieldset>`).join('')}</div>
      <aside class="gx-aside"><h3>${esc(t('gxLive'))}</h3><dl class="gx-stats"></dl><p>${esc(t('gxLiveHint'))}</p><div class="gx-safe"><h3>${esc(t('gxSafe'))}</h3><p>${esc(t('gxSafeHint'))}</p></div><p>${esc(t('gxDevice'))}</p><button type="button" class="btn gx-reset">${esc(t('gxReset'))}</button><p class="gx-saved" role="status"></p></aside></div>`;
    this.root.querySelector('.gx-reset').addEventListener('click', () => {
      clearTimeout(this.applyTimer); this.pending = null;
      settings.graphics = { ...GRAPHICS_DEFAULTS }; saveSettings();
      this.onChange?.('graphics:reset'); this.sync();
      this.root.querySelector('.gx-saved').textContent = t('gxResetDone');
    });
    this.sync();
  }
  sync() {
    const g = cleanGraphics(settings.graphics);
    for (const el of this.root.querySelectorAll('[data-gx]')) {
      const key = el.dataset.gx;
      if (el.type === 'checkbox') el.checked = g[key]; else el.value = g[key];
      el.disabled = key !== 'enabled' && (!g.enabled || key === 'targetFPS' && !g.dynamic);
      if (el.type === 'range') {
        const f = GRAPHICS_FIELDS.find(f => f.key === key);
        el.nextElementSibling.textContent = f.unit === 'mp' ? `${g[key].toFixed(1)} ${t('gxMP')}` : `${Math.round(g[key]*100)}%`;
      }
    }
    this.root.querySelector('.gx-mode').textContent = g.enabled ? t('gxCustom') : t('gxPreset') + ' · ' + t(settings.quality === 'high' ? 'sQHigh' : settings.quality === 'low' ? 'sQLow' : 'sQAuto');
    this.updateStats();
  }
  change(e) {
    const el = e.target, key = el.dataset.gx;
    if (!key || e.type === 'input' && el.type !== 'range') return;
    if (e.type === 'change' && el.type === 'range') { this.flush(); return; }
    const value = el.type === 'checkbox' ? el.checked : el.type === 'range' || key === 'targetFPS' ? Number(el.value) : el.value;
    settings.graphics = cleanGraphics({ ...settings.graphics, [key]: value });
    saveSettings();
    const event = resolution.has(key) ? 'graphics:' + key : 'graphics:effects';
    if (el.type === 'range' && resolution.has(key)) {
      clearTimeout(this.applyTimer); this.pending = event;
      this.applyTimer = setTimeout(() => this.flush(), 160);
    } else { this.flush(); this.onChange?.(event); }
    this.sync();
    this.root.querySelector('.gx-saved').textContent = t(this.pending ? 'gxApplying' : 'gxSaved');
  }
  flush() {
    clearTimeout(this.applyTimer);
    if (!this.pending) return;
    const event = this.pending; this.pending = null;
    this.onChange?.(event);
    this.root.querySelector('.gx-saved').textContent = t('gxSaved');
  }
  updateStats() {
    const s = this.stats?.();
    if (!s) return;
    const lines = [['gxScene', `${s.w} × ${s.h}`], ['gxOutput', `${s.ow} × ${s.oh}`],
      ['gxPixels', `${(s.w*s.h/1e6).toFixed(2)} ${t('gxMP')}`], ['gxFPS', s.fps > 0 ? s.fps.toFixed(0) : '—'],
      ['gxAA', s.fxaa ? 'FXAA' : t('gxAA_off')]];
    this.root.querySelector('.gx-stats').innerHTML = lines.map(([key, value]) => `<div><dt>${esc(t(key))}</dt><dd>${esc(value)}</dd></div>`).join('');
  }
  open() {
    clearInterval(this.timer);
    this.render(); this.opened = true; this.root.hidden = false;
    this.panel.classList.add('graphics-expanded'); this.button.setAttribute('aria-expanded', 'true');
    this.panel.scrollTop = 0;
    this.root.querySelector('[data-gx="enabled"]').focus();
    this.timer = setInterval(() => this.updateStats(), 500);
  }
  close(focus = true) {
    this.flush();
    this.opened = false; clearInterval(this.timer); this.timer = null;
    this.root.hidden = true; this.panel.classList.remove('graphics-expanded');
    this.button.setAttribute('aria-expanded', 'false');
    if (focus) this.button.focus();
  }
}
