// DOM controller: start / pause / level-up / game-over screens and the in-game HUD.
// Writes to the DOM only when a value changes, keeping the per-frame cost tiny.
import { cleanName, DEFAULT_NAME } from '../sim/highscores.js';
import { PSI, SKILL_IDS } from '../sim/psi.js';
import { ITEMS, INV_SLOTS, sellPrice } from '../sim/items.js';
import { loadTranslucency } from '../core/storage.js';
import { isKnown } from '../sim/atlas.js';

const SKILL_LABEL = { slam: 'Slam', charge: 'Charge', blink: 'Blink', quake: 'Quake', summon: 'Summon', volley: 'Volley', nova: 'Nova', lance: 'Lance' };

const $ = (id) => document.getElementById(id);

// every element that shows a psi skill: the desktop HUD chip and the touch button
const SKILL_NODES = {
  skill1: ['sk1', 'btnSkill1'],
  skill2: ['sk2', 'btnSkill2'],
  skill3: ['sk3', 'btnSkill3'],
};

// Inline SVG icons for the psi skills, drawn with currentColor so CSS can tint them.
const SKILL_ICONS = {
  burst: '<circle cx="12" cy="12" r="3.2" fill="currentColor"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 2.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  lance: '<path d="M3.5 20.5L15 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M13.2 4.2l6.6.2-.2 6.6-2.4-1.1-4.2 4.2-1.4-1.4 4.2-4.2z" fill="currentColor"/>',
  pull: '<path d="M4 5c5 0 8 3 8 7s-3 7-8 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 12h-7.5M15.5 9l-3 3 3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
};
const skillIcon = (id) => `<svg viewBox="0 0 24 24" aria-hidden="true">${SKILL_ICONS[PSI.skills[id].icon]}</svg>`;

// Inline SVG badges for boons (emoji fonts are not guaranteed on every platform).
const BOON_ICONS = {
  mind: '<circle cx="12" cy="12" r="8" fill="#fff" stroke="currentColor" stroke-width="1.6"/><path d="M12 6.5a5.5 5.5 0 1 0 4 9.3" fill="none" stroke="#8c5cf0" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="12" r="1.8" fill="#8c5cf0"/>',
  steel: '<path d="M12 3l2.2 9.5H9.8z" fill="#fff" stroke="currentColor"/><path d="M7 13h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 13v7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  reach: '<path d="M16 4a9 9 0 1 0 4 12A7 7 0 0 1 16 4z" fill="#fff" stroke="currentColor"/>',
  arc: '<path d="M4 15a9 9 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M7 19a6 6 0 0 1 10 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  quick: '<circle cx="12" cy="13" r="7" fill="#fff" stroke="currentColor"/><path d="M12 13V8M12 13l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 3h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  boots: '<path d="M8 4h5v9l6 3v3H8z" fill="#fff" stroke="currentColor" stroke-linejoin="round"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="#ff6b7f" stroke="currentColor" stroke-width="1.6"/>',
  wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  vamp: '<path d="M12 3c3 4.5 5.5 7.5 5.5 11a5.5 5.5 0 0 1-11 0C6.5 10.5 9 7.5 12 3z" fill="#e0344a" stroke="currentColor" stroke-width="1.6"/>',
  magnet: '<path d="M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4z" fill="#fff" stroke="currentColor" stroke-width="1.6"/><path d="M6 8h4M14 8h4" stroke="#e0344a" stroke-width="3"/>',
};
const boonIcon = (id) => `<svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">${BOON_ICONS[id] || ''}</svg>`;

// Inline SVG for consumables and permanent boosts (same look as the boon badges).
const ITEM_ICONS = {
  ring: '<circle cx="12" cy="12.5" r="6.5" fill="none" stroke="currentColor" stroke-width="3.2"/><path d="M9.5 5.5l2.5-2 2.5 2" fill="#f6c24f" stroke="currentColor" stroke-width="1.2"/><path d="M12 6v0" stroke="#ff5d6c" stroke-width="2.2" stroke-linecap="round"/>',
  bracer: '<path d="M5 8h14v8H5z" fill="#9aa3b5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8v8M15 8v8" stroke="#e4e8f2" stroke-width="1.4"/><circle cx="12" cy="12" r="1.4" fill="#f6c24f"/>',
  charm: '<circle cx="12" cy="12" r="7.5" fill="#ffd45c" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5l1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="#b5771a"/>',
  anklet: '<ellipse cx="12" cy="14" rx="7" ry="4.5" fill="none" stroke="#7fe0a0" stroke-width="3"/><circle cx="17.5" cy="10" r="1.8" fill="#f6c24f" stroke="currentColor" stroke-width="1"/>',
  fang: '<path d="M7 4c4 2 6 6 5 16-3-5-6-9-5-16z" fill="#f3ecdc" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M13 6c3 2 4.5 5 4 12-2-3.6-4-7-4-12z" fill="#d8cfbb" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>',
  potion: '<path d="M9 3h6v3l3 4v8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-8l3-4z" fill="#ff5d6c" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.5 13h9" stroke="#fff" stroke-width="1.6" opacity=".6"/>',
  vial: '<path d="M9 3h6M10 3v6l-4.5 7.5A3 3 0 0 0 8.1 21h7.8a3 3 0 0 0 2.6-4.5L14 9V3" fill="#9f7bff" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="11" cy="16" r="1.2" fill="#fff"/><circle cx="14" cy="14" r=".9" fill="#fff"/>',
  blade: '<path d="M14.5 3.5l6 6-9 9-3.6-.4-.4-3.6z" fill="#e4e8f2" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 19l2.5-2.5M3.2 20.8l1.6-1.6" stroke="#f6c24f" stroke-width="2.4" stroke-linecap="round"/>',
  fruit: '<circle cx="12" cy="14" r="7" fill="#ff7aa2" stroke="currentColor" stroke-width="1.6"/><path d="M12 7c0-2 1-3.5 3-4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M13 5c2 -1.4 3.8-.5 4.5.5-1.9.9-3.4.6-4.5-.5z" fill="#6cbd5a"/>',
  feather: '<path d="M19 4c-7 0-12 5-13 13l-1.5 3 3-1.5C15 17 20 12 20 5z" fill="#bfe9ff" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 20L14 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  crystal: '<path d="M12 2l6 7-6 13-6-13z" fill="#7ff0e0" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 9h12M12 2v20" stroke="#fff" stroke-width="1" opacity=".7"/>',
};
const itemIcon = (id) => {
  const it = id ? ITEMS[id] : null;
  return `<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">${it ? ITEM_ICONS[it.icon] || '' : ''}</svg>`;
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export class UI {
  constructor(actions) {
    this.a = actions;
    this.cache = {};
    this.bannerTimer = 0;
    this.toastTimer = 0;
    this.bind();
  }

  bind() {
    const on = (id, ev, fn) => $(id).addEventListener(ev, (e) => { e.stopPropagation(); fn(e); });
    on('btnSettings', 'click', () => this.showSettings('start'));
    on('btnSettingsPause', 'click', () => this.showSettings('pause'));
    on('btnSettingsBack', 'click', () => this.hideSettings());
    on('btnAtlas', 'click', () => this.a.onAtlas());
    on('btnAtlasBack', 'click', () => this.hideAtlas());
    for (const b of document.querySelectorAll('.atlas-tab')) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setAtlasTab(b.dataset.tab);
      });
    }
    $('transSlider').addEventListener('input', (e) => {
      e.stopPropagation();
      const v = Number(e.target.value);
      $('transVal').textContent = `${v}%`;
      this.a.onTranslucency(v);
    });
    on('btnStart', 'click', () => this.a.onStart());
    on('btnMuteStart', 'click', () => this.a.onToggleMute());
    on('btnMutePause', 'click', () => this.a.onToggleMute());
    on('btnMuteHud', 'click', () => this.a.onToggleMute());
    on('btnPause', 'click', () => this.a.onPause());
    on('btnResume', 'click', () => this.a.onResume());
    on('btnRestartPause', 'click', () => this.a.onRestart());
    on('btnQuit', 'click', () => this.a.onQuit());
    on('btnRetry', 'click', () => this.a.onRestart());
    on('btnOverTitle', 'click', () => this.a.onQuit());
    on('btnSaveName', 'click', () => this.a.onSaveName($('nameInput').value));
    on('btnDash', 'pointerdown', (e) => { e.preventDefault(); this.a.onDashButton(); });
    for (const id of SKILL_IDS) {
      on(SKILL_NODES[id][1], 'pointerdown', (e) => { e.preventDefault(); this.a.onSkill(id); });
      for (const node of SKILL_NODES[id]) {
        const slot = $(node)?.querySelector('.sk-ico');
        if (slot) slot.innerHTML = skillIcon(id);
      }
    }
    // inventory bar: tap a slot to use it (play) or select it (shop)
    $('invBar').addEventListener('click', (e) => {
      const el = e.target.closest('[data-slot]');
      if (!el) return;
      e.stopPropagation();
      this.a.onSlot(Number(el.dataset.slot));
    });
    $('invBar').addEventListener('pointerdown', (e) => e.stopPropagation());
    // merchant screen: buttons and cards carry data-act / data-i
    $('screenShop').addEventListener('click', (e) => {
      e.stopPropagation();
      const el = e.target.closest('[data-act]');
      if (!el) return;
      const act = el.dataset.act;
      if (act === 'leave') this.a.onShopLeave();
      else this.a.onShopAct(act, Number(el.dataset.i ?? 0));
    });
    $('screenShop').addEventListener('pointerdown', (e) => e.stopPropagation());
    $('nameInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.a.onSaveName($('nameInput').value);
        $('nameInput').blur();
      }
    });
    $('nameInput').addEventListener('input', () => {
      const v = $('nameInput').value;
      if (v.length > 12) $('nameInput').value = v.slice(0, 12);
    });
  }

  // ---- screens --------------------------------------------------------------
  showStart(list, muted) {
    this.renderBoard($('boardStart'), list);
    this.setMuted(muted);
    this.show('screenStart');
    this.hide('screenPause');
    this.hide('screenLevel');
    this.hide('screenOver');
    this.hide('screenShop');
    this.hide('hud');
  }

  hideStart() {
    this.hide('screenStart');
    this.hide('screenSettings');
  }

  /** Settings can be opened from the title or the pause menu; Back returns to where it came from. */
  showSettings(from) {
    this.settingsFrom = from;
    const v = loadTranslucency();
    $('transSlider').value = String(v);
    $('transVal').textContent = `${v}%`;
    this.hide(from === 'pause' ? 'screenPause' : 'screenStart');
    this.show('screenSettings');
  }

  hideSettings() {
    this.hide('screenSettings');
    this.show(this.settingsFrom === 'pause' ? 'screenPause' : 'screenStart');
  }

  showPause(muted) {
    this.setMuted(muted);
    this.show('screenPause');
  }

  hidePause() {
    this.hide('screenPause');
    this.hide('screenSettings');
  }

  showLevel(choices, onPick, level) {
    const wrap = $('cards');
    wrap.innerHTML = '';
    const skillPick = choices.length > 0 && choices[0].kind === 'skill';
    $('levelSub').textContent = skillPick
      ? `Level ${level} reached. Sharpen a psi skill. Every third level, each skill grows up to level 6.`
      : `Level ${level} reached. Choose a boon for your knight.`;
    choices.forEach((u, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'card';
      b.style.animationDelay = `${i * 0.07}s`;
      const icon = u.kind === 'skill' ? skillIcon(u.id) : boonIcon(u.id);
      const desc = u.kind === 'skill' ? `<b>Lv ${u.from} → ${u.to}</b> · ${escapeHtml(u.desc)}` : escapeHtml(u.desc);
      b.innerHTML = `<span class="key">${i + 1}</span><span class="icon">${icon}</span><span class="name">${escapeHtml(u.name)}</span><span class="desc">${desc}</span>`;
      b.addEventListener('click', (e) => { e.stopPropagation(); onPick(i); });
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      wrap.appendChild(b);
    });
    this.show('screenLevel');
  }

  hideLevel() {
    this.hide('screenLevel');
  }

  showOver(d) {
    $('overScore').textContent = d.score.toLocaleString();
    $('overWave').textContent = String(d.wave);
    $('overKills').textContent = String(d.kills);
    $('overCombo').textContent = `×${d.bestCombo}`;
    $('overLevel').textContent = String(d.level);
    $('overSeed').textContent = d.seedCode;
    $('overTitle').textContent = d.won ? 'Victory' : 'Fallen';
    $('overSub').textContent = d.won
      ? (d.qualifies ? 'The throne is shattered and your name is carved in the hall.' : 'The throne is shattered. Emberkeep is free.')
      : d.qualifies
        ? 'The hall remembers the brave.'
        : 'The rift claims another knight.';
    const box = $('nameBox');
    box.classList.toggle('hidden', !d.qualifies);
    if (d.qualifies) {
      const input = $('nameInput');
      input.value = d.name || '';
      input.placeholder = DEFAULT_NAME;
      setTimeout(() => input.focus({ preventScroll: true }), 60);
    }
    this.renderBoard($('boardOver'), d.list, d.highlight);
    this.show('screenOver');
    this.hide('screenPause');
    this.hide('screenLevel');
  }

  hideOver() {
    this.hide('screenOver');
  }

  /** Called after the high score has been committed. */
  afterSave(name, rank, list) {
    $('nameBox').classList.add('hidden');
    this.renderBoard($('boardOver'), list, rank ? rank - 1 : -1);
    this.toast(`Carved as ${name}${rank ? ` · #${rank}` : ''}`);
  }

  get nameValue() {
    return cleanName($('nameInput').value);
  }

  renderBoard(el, list, highlight = -1) {
    if (!list || !list.length) {
      el.innerHTML = '<div class="empty">No heroes yet.<br>Your name could be first.</div>';
      return;
    }
    const rows = list.map((e, i) => {
      const cls = [i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '', i === highlight ? 'mine' : ''].join(' ');
      return `<tr class="${cls}"><td class="rank">${i + 1}</td><td class="name">${escapeHtml(e.name)}</td><td class="num">${e.score.toLocaleString()}</td><td class="num">${e.wave}</td></tr>`;
    }).join('');
    el.innerHTML = `<table><thead><tr><th>#</th><th>Knight</th><th class="num">Score</th><th class="num">Ch.</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  // ---- HUD ------------------------------------------------------------------
  showHud() {
    this.show('hud');
  }

  hideHud() {
    this.hide('hud');
  }

  /** Cheap per-frame HUD refresh; only touches changed nodes. */
  setHud(s) {
    this.setText('lv', `LV ${s.level}`);
    this.setStyle('hpFill', 'width', `${Math.max(0, (s.hp / s.maxHp) * 100).toFixed(1)}%`);
    this.setText('hpText', `${Math.ceil(s.hp)} / ${s.maxHp}`);
    const low = s.hp / s.maxHp < 0.3;
    document.querySelector('.bar.hp')?.classList.toggle('low', low);
    this.setStyle('xpFill', 'width', `${Math.min(100, (s.xp / s.xpNext) * 100).toFixed(1)}%`);
    this.setText('score', s.score.toLocaleString());
    this.setText('coins', `${s.coins} coins`);
    this.setInv(s.inv);
    this.setPassive(s.passive, s.inv);
    this.setObjective(s.objective);
    this.setText('combo', s.combo >= 2 ? `Combo ×${s.combo} · ×${s.multiplier} pts` : '');
    if (s.comboTick !== this.cache.comboTick) {
      this.cache.comboTick = s.comboTick;
      const el = $('combo');
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    }
    this.setText('chapter', `Chapter ${s.wave} · ${s.chapterTitle}  —  ${s.foes} foes`);
    const dash = $('dashInd');
    this.setStyle('dashRing', '--p', String(s.dashReady ? 1 : 1 - s.dashFrac).slice(0, 5));
    dash.classList.toggle('ready', !!s.dashReady);
    this.setPsi(s.psi);
  }

  /** Psi energy bar plus the three skill states (ready / cooling down / short on energy). */
  setPsi(psi) {
    if (!psi) return;
    this.setStyle('psiFill', 'width', `${((psi.energy / PSI.max) * 100).toFixed(1)}%`);
    this.setText('psiText', `${Math.floor(psi.energy)}`);
    for (const id of SKILL_IDS) {
      const frac = psi.cooldownFrac(id);
      const state = psi.canCast(id) ? 'ready' : frac > 0 ? 'cd' : 'low';
      const cost = String(psi.costOf(id));
      const lv = `Lv ${psi.level(id)}`;
      for (const node of SKILL_NODES[id]) {
        const key = `state:${node}`;
        if (this.cache[key] !== state) {
          this.cache[key] = state;
          $(node).dataset.state = state;
        }
        if (this.cache[`cost:${node}`] !== cost) {
          this.cache[`cost:${node}`] = cost;
          const el = $(node).querySelector('[data-cost]');
          if (el) el.textContent = cost;
        }
        if (this.cache[`lv:${node}`] !== lv) {
          this.cache[`lv:${node}`] = lv;
          const el = $(node).querySelector('[data-lv]');
          if (el) el.textContent = lv;
        }
        this.setStyle(node, '--cd', frac.toFixed(3));
      }
    }
  }

  /** Pack bar: six slots, filled lazily and only rewritten when the contents change. */
  setInv(slots) {
    if (!slots) return;
    const key = slots.join('|');
    if (this.cache.inv === key) return;
    this.cache.inv = key;
    const bar = $('invBar');
    if (!bar.childElementCount) {
      for (let i = 0; i < INV_SLOTS; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'inv-slot';
        b.dataset.slot = String(i);
        b.setAttribute('aria-label', `Pack slot ${i + 1}`);
        b.innerHTML = `<kbd>${i + 1}</kbd><span class="inv-ico"></span><span class="inv-name"></span>`;
        bar.appendChild(b);
      }
    }
    slots.forEach((id, i) => {
      const b = bar.children[i];
      b.classList.toggle('full', !!id);
      b.querySelector('.inv-ico').innerHTML = id ? itemIcon(id) : '';
      b.querySelector('.inv-name').textContent = id ? ITEMS[id].name : '';
      b.title = id ? `${ITEMS[id].name}: ${ITEMS[id].desc}` : 'Empty';
    });
  }

  /** Objective card: text changes rarely, the bar width is cheap to set every frame. */
  setObjective(o) {
    if (!o) return;
    if (this.cache.objText !== o.text) {
      this.cache.objText = o.text;
      $('objText').textContent = o.text;
    }
    $('objective').classList.toggle('done', !!o.done);
    this.setStyle('objFill', 'width', `${(Math.max(0, Math.min(1, o.frac)) * 100).toFixed(1)}%`);
  }

  /** Passive badge: lists the carried passive items with their icons and summed effects. */
  setPassive(p, slots) {
    if (!p || !slots) return;
    const key = slots.join('|');
    if (this.cache.passKey === key) return;
    this.cache.passKey = key;
    const bar = $('invBar');
    slots.forEach((id, i) => bar.children[i]?.classList.toggle('passive', !!id && !!ITEMS[id].passive));
    const owned = slots.filter((id) => id && ITEMS[id].passive);
    const badge = $('passiveBadge');
    badge.classList.toggle('hidden', owned.length === 0);
    if (!owned.length) {
      badge.innerHTML = '';
      return;
    }
    const fx = [];
    if (p.regen > 0) fx.push(`+${+p.regen.toFixed(1)} HP/s`);
    if (p.takenMul < 1) fx.push(`−${Math.round((1 - p.takenMul) * 100)}% damage taken`);
    if (p.coinMul > 1) fx.push(`×${p.coinMul} coins`);
    if (p.dashMul < 1) fx.push(`dash ${Math.round((1 - p.dashMul) * 100)}% faster`);
    if (p.damageMul > 1) fx.push(`+${Math.round((p.damageMul - 1) * 100)}% melee`);
    badge.innerHTML = `<span class="pb-title">Passive ×${owned.length}</span>`
      + `<span class="pb-icons">${owned.map((id) => `<span class="pb-ico" title="${escapeHtml(ITEMS[id].name)}">${itemIcon(id)}</span>`).join('')}</span>`
      + `<span class="pb-fx">${escapeHtml(fx.join(' · '))}</span>`;
  }

  flashSlot(i) {
    const el = $('invBar').children[i];
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  // ---- merchant -------------------------------------------------------------
  showShop(view) {
    this.renderShop(view);
    this.show('screenShop');
    this.hide('screenPause');
    this.hide('screenLevel');
  }

  hideShop() {
    this.hide('screenShop');
  }

  /** Stock cards, pack slots, and the detail line for the selected pack item. */
  renderShop(v) {
    $('shopGold').textContent = String(v.gold);
    const stock = v.stock.map((id, i) => {
      if (!id) return `<div class="shop-card sold"><span class="shop-empty">Sold out</span></div>`;
      const it = ITEMS[id];
      const sel = i === v.stockSel ? ' sel' : '';
      const can = v.gold >= it.price;
      return `<div class="shop-card${sel}" data-act="stock" data-i="${i}">
        <span class="shop-ico">${itemIcon(id)}</span>
        <b class="shop-name">${escapeHtml(it.name)}</b>
        <small class="shop-desc">${escapeHtml(it.desc)}</small>
        <span class="shop-price${can ? '' : ' short'}">${it.price} coins</span>
        <span class="shop-btns">
          <button type="button" class="btn btn-small btn-primary" data-act="buy" data-i="${i}">Buy</button>
          <button type="button" class="btn btn-small btn-gold" data-act="trade" data-i="${i}">Trade</button>
        </span>
      </div>`;
    }).join('');
    $('shopStock').innerHTML = stock;

    const pack = v.pack.map((id, j) => {
      const sel = j === v.sel ? ' sel' : '';
      return `<button type="button" class="shop-slot${id ? ' full' : ''}${sel}" data-act="select" data-i="${j}" aria-label="Pack slot ${j + 1}">
        <kbd>${j + 1}</kbd><span class="shop-ico">${itemIcon(id)}</span></button>`;
    }).join('');
    $('shopPack').innerHTML = pack;

    const cur = v.pack[v.sel];
    let detail;
    if (!cur) {
      detail = 'Pick a pack slot. Sell it for coins, or trade it for a stock item.';
    } else {
      const it = ITEMS[cur];
      const want = v.stock[v.stockSel];
      const trade = want ? ` · trade for ${ITEMS[want].name} (${ITEMS[want].price - it.price >= 0 ? `+${ITEMS[want].price - it.price}` : ITEMS[want].price - it.price} coins)` : '';
      detail = `${it.name}: ${it.desc}. Sell for ${sellPrice(cur)} coins${trade}.`;
    }
    $('shopDetail').textContent = detail;
    $('shopSub').textContent = 'Coins buy stock, sell for half value, or trade for a stock item.';
    $('shopSell').disabled = !cur;
  }

  hurtFlash() {
    const v = $('vignette');
    v.classList.add('hurt');
    clearTimeout(this._hurtT);
    this._hurtT = setTimeout(() => v.classList.remove('hurt'), 140);
  }

  setLowHp(low) {
    $('vignette').classList.toggle('low', low);
  }

  banner(kicker, title, story, dur = 2.6) {
    const b = $('banner');
    $('bannerKicker').textContent = kicker;
    $('bannerTitle').textContent = title;
    $('bannerStory').textContent = story || '';
    $('bannerStory').style.display = story ? 'inline-block' : 'none';
    b.classList.remove('hidden', 'out');
    void b.offsetWidth;
    b.style.animation = 'none';
    void b.offsetWidth;
    b.style.animation = '';
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      b.classList.add('out');
      setTimeout(() => b.classList.add('hidden'), 420);
    }, dur * 1000);
  }

  hideBanner() {
    clearTimeout(this.bannerTimer);
    $('banner').classList.add('hidden');
  }

  toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    t.style.animation = 'none';
    void t.offsetWidth;
    t.style.animation = '';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.add('hidden'), 2300);
  }

  setMuted(muted) {
    const label = muted ? 'Sound: Off' : 'Sound: On';
    for (const id of ['btnMuteStart', 'btnMutePause']) $(id).textContent = label;
    $('btnMuteHud').style.opacity = muted ? '0.55' : '1';
  }

  flashSkill(id) {
    for (const node of SKILL_NODES[id]) {
      const el = $(node);
      el.classList.remove('fired');
      void el.offsetWidth;
      el.classList.add('fired');
    }
  }

  setTouch(on) {
    document.body.classList.toggle('is-touch', on);
    $('touchUI').classList.toggle('hidden', !on);
  }

  setDebug(text, visible) {
    const el = $('debug');
    el.classList.toggle('hidden', !visible);
    if (visible) el.textContent = text;
  }

  setSticks(left, right) {
    const drawStick = (el, s) => {
      if (!s) {
        el.classList.remove('on');
        return;
      }
      el.classList.add('on');
      el.style.transform = `translate3d(${s.ox}px, ${s.oy}px, 0)`;
      const k = el.querySelector('i');
      const dx = s.x - s.ox;
      const dy = s.y - s.oy;
      const m = Math.hypot(dx, dy);
      const c = Math.min(m, 64) / (m || 1);
      k.style.transform = `translate3d(${(dx * c).toFixed(1)}px, ${(dy * c).toFixed(1)}px, 0)`;
    };
    drawStick($('stickL'), left);
    drawStick($('stickR'), right);
  }

  // ---- helpers --------------------------------------------------------------
  show(id) {
    $(id).classList.remove('hidden');
  }

  hide(id) {
    $(id).classList.add('hidden');
  }

  setText(id, text) {
    if (this.cache[id] === text) return;
    this.cache[id] = text;
    $(id).textContent = text;
  }

  /** Atlas book. `data` = { atlas, catalog, getPortrait(kind, id) -> PNG data URL or null }. */
  showAtlas(data) {
    this.atlasData = data;
    this.atlasSel = null;
    this.atlasTab = this.atlasTab || 'monster';
    this.hide('screenStart');
    this.show('screenAtlas');
    this.setAtlasTab(this.atlasTab);
  }

  hideAtlas() {
    this.hide('screenAtlas');
    this.show('screenStart');
  }

  setAtlasTab(tab) {
    this.atlasTab = tab;
    this.atlasSel = null;
    for (const b of document.querySelectorAll('.atlas-tab')) b.classList.toggle('active', b.dataset.tab === tab);
    this.renderAtlas();
  }

  renderAtlas() {
    if (!this.atlasData) return;
    const { atlas, catalog, getPortrait } = this.atlasData;
    const entries = catalog[this.atlasTab];
    const list = $('atlasList');
    list.innerHTML = '';
    let known = 0;
    for (const e of entries) {
      const ok = isKnown(atlas, e.kind, e.id);
      if (ok) known++;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `atlas-card${ok ? '' : ' locked'}${ok && this.atlasSel === e.id ? ' sel' : ''}`;
      let thumb = '<span class="atlas-locked-mark">?</span>';
      if (ok) {
        thumb = e.kind === 'item' ? itemIcon(e.id) : `<img alt="" src="${getPortrait(e.kind, e.id) ?? ''}">`;
      }
      card.innerHTML = `<span class="atlas-thumb">${thumb}</span><span>${ok ? escapeHtml(e.name) : '???'}</span>`;
      if (ok) {
        card.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.atlasSel = e.id;
          this.renderAtlas();
        });
      }
      list.appendChild(card);
    }
    const det = $('atlasDetail');
    const sel = entries.find((e) => e.id === this.atlasSel && isKnown(atlas, e.kind, e.id));
    if (!sel) {
      det.innerHTML = `<p class="muted">${known} of ${entries.length} discovered. Pick an entry to read about it.</p>`;
      return;
    }
    const art = sel.kind === 'item' ? itemIcon(sel.id) : `<img alt="" src="${getPortrait(sel.kind, sel.id) ?? ''}">`;
    let tags = '';
    if (sel.kind !== 'item') tags += `<span class="atlas-tag">HP ${sel.hp}</span>`;
    if (sel.skills) for (const s of sel.skills) tags += `<span class="atlas-tag">${escapeHtml(SKILL_LABEL[s] ?? s)}</span>`;
    if (sel.passive) tags += '<span class="atlas-tag">Passive</span>';
    det.innerHTML = `<div class="atlas-portrait">${art}</div><h3>${escapeHtml(sel.name)}</h3><div>${tags}</div><p>${escapeHtml(sel.desc)}</p>`;
  }

  /** Dawn wash, 0..1: grows through the finale. */
  setDawn(p) {
    this.setStyle('dawn', 'opacity', (Math.max(0, Math.min(1, p)) * 0.55).toFixed(3));
  }

  setStyle(id, prop, value) {
    const key = `${id}:${prop}`;
    if (this.cache[key] === value) return;
    this.cache[key] = value;
    $(id).style.setProperty(prop, value);
  }

}
