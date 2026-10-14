// DOM controller: start / pause / level-up / game-over screens and the in-game HUD.
// Writes to the DOM only when a value changes, keeping the per-frame cost tiny.
import { cleanName, DEFAULT_NAME } from '../sim/highscores.js';
import { PSI, SKILL_IDS } from '../sim/psi.js';
import { ITEMS, INV_SLOTS, sellPrice } from '../sim/items.js';

const $ = (id) => document.getElementById(id);

// every element that shows a psi skill: the desktop HUD chip and the touch button
const SKILL_NODES = {
  skill1: ['sk1', 'btnSkill1'],
  skill2: ['sk2', 'btnSkill2'],
  skill3: ['sk3', 'btnSkill3'],
};

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
  }

  showPause(muted) {
    this.setMuted(muted);
    this.show('screenPause');
  }

  hidePause() {
    this.hide('screenPause');
  }

  showLevel(choices, onPick, level) {
    const wrap = $('cards');
    wrap.innerHTML = '';
    $('levelSub').textContent = `Level ${level} reached. Choose a boon for your knight.`;
    choices.forEach((u, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'card';
      b.style.animationDelay = `${i * 0.07}s`;
      b.innerHTML = `<span class="key">${i + 1}</span><span class="icon">${boonIcon(u.id)}</span><span class="name">${escapeHtml(u.name)}</span><span class="desc">${escapeHtml(u.desc)}</span>`;
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
    $('overSub').textContent = d.qualifies
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
      for (const node of SKILL_NODES[id]) {
        const key = `state:${node}`;
        if (this.cache[key] !== state) {
          this.cache[key] = state;
          $(node).dataset.state = state;
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

  setStyle(id, prop, value) {
    const key = `${id}:${prop}`;
    if (this.cache[key] === value) return;
    this.cache[key] = value;
    $(id).style.setProperty(prop, value);
  }

}
