// 3.1c: the quick wheel. Hold the backpack key (I) and the four pockets come up around the crosshair; point at one
// with the mouse and let go — it is in your hands (point at what you already hold and it goes away). Let go in the
// middle and nothing changes. A short press still opens the whole pack, as before.
//
// Unlike the pack it never stops you: you keep walking while you choose, and the head does not turn (the mouse is
// the wheel's for that moment). On a touch screen a long press on РЮКЗАК opens it and a tap on a pocket picks.
import { t, getLang } from '../core/i18n.js';
import { iconSvg } from '../game/backpackData.js';
import { bagName } from '../game/inventory.js';
import { keyLabel } from '../core/keybinds.js';

export const WHEEL = { holdMs: 180, holdTouchMs: 320, dead: 34 };
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// which pocket the mouse points at: 0 up, 1 right, 2 down, 3 left; -1 still in the middle
export function sectorOf(dx, dy, dead = WHEEL.dead) {
  if (!(Math.hypot(dx, dy) >= dead)) return -1;
  const a = Math.atan2(dx, -dy);
  return ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4;
}

export class QuickWheel {
  constructor({ getGame, input, host = document.body }) {
    this.getGame = getGame;
    this.input = input;
    this.hold = null;
    this.open = false;
    this.touch = false;
    this.sel = -1;
    this.key = '';
    const el = (this.el = document.createElement('div'));
    el.id = 'quickWheel';
    el.hidden = true;
    el.innerHTML = `<div class="qw-ring" role="menu">${[0, 1, 2, 3].map((i) => `<button type="button" class="qw-slot qw-${i}" data-i="${i}" role="menuitem"></button>`).join('')}<div class="qw-hub" aria-live="polite"><b class="qw-name"></b><span class="qw-sub"></span></div></div><p class="qw-hint"></p>`;
    host.append(el);
    // touch (or a free mouse): tap a pocket to pick it, anywhere else to close
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const b = e.target.closest('[data-i]');
      if (b && !b.disabled) { this.sel = +b.dataset.i; this.commit(); } else this.close();
    });
  }

  // the backpack key went down
  press() {
    const g = this.getGame();
    if (!g) return;
    if (this.open) { this.close(); return; } // a second press closes it (a touch wheel, a key that got stuck)
    if (g.inventory.opened) { g.inventory.close(); return; }
    this.hold = { t: performance.now(), touch: !!this.input.touch };
  }

  // every frame while playing: is it a short press (the pack), a hold (the wheel), or a release (pick)?
  frame(now = performance.now()) {
    const g = this.getGame();
    if (!g) return;
    if (this.open) {
      if (!g.inventory.canQuick()) { this.close(); return; }
      this.track();
      if (!this.touch && !this.input.bagHeld()) this.commit();
      return;
    }
    if (!this.hold) return;
    if (!this.input.bagHeld()) { this.hold = null; g.inventory.toggle(); return; } // short: the whole pack, as always
    if (now - this.hold.t >= (this.hold.touch ? WHEEL.holdTouchMs : WHEEL.holdMs)) {
      const touch = this.hold.touch;
      this.hold = null;
      if (g.inventory.canQuick()) this.show(touch);
      else g.inventory.toggle(); // (the pack says why not: hands full, and so on)
    }
  }

  show(touch) {
    this.open = true;
    this.touch = touch;
    this.sel = -1;
    this.input.wheel = touch ? null : { dx: 0, dy: 0 };
    this.el.hidden = false;
    this.el.classList.toggle('touch', touch);
    document.body.classList.add('wheel-open');
    this.key = '';
    this.render();
  }

  track() {
    const w = this.input.wheel;
    if (w) {
      const s = sectorOf(w.dx, w.dy);
      if (s !== this.sel) {
        this.sel = s;
        const g = this.getGame();
        if (s >= 0 && g?.audio?.ready && g.audio.uiClick) g.audio.uiClick();
      }
    }
    this.render();
  }

  commit() {
    const i = this.sel;
    const g = this.getGame();
    this.close();
    if (i >= 0 && g) g.inventory.quickEquip(i);
  }

  close() {
    this.open = false;
    this.hold = null;
    this.input.wheel = null;
    this.el.hidden = true;
    document.body.classList.remove('wheel-open');
  }

  // what a pocket says under its name: how many, how charged, and for a battery what the flashlight will be after
  extra(kind) {
    const g = this.getGame(), inv = g.inventory;
    if (kind === 'torch') return `${Math.ceil((g.torch.charge || 0) * 100)}%`;
    if (kind === 'tape') return `${g.tools.tapeHeld?.charges || 0} / 2`;
    if (kind === 'battery') {
      const pv = inv.batteryPreview();
      const n = `×${inv.count(kind)}`;
      if (!pv) return `${n} · ${t('bagNoTorchShort')}`;
      return pv.full ? `${n} · ${t('bagTorchFullShort')}` : `${n} · ${t('qwTorchAfter').replace('{a}', pv.from).replace('{b}', pv.to)}`;
    }
    const n = inv.count(kind);
    return n > 1 ? `×${n}` : '';
  }

  render() {
    const g = this.getGame();
    if (!g) return;
    const inv = g.inventory;
    const kinds = inv.slots;
    const key = [getLang(), this.sel, this.touch, kinds.join(','), inv.equipped, ...kinds.map((k) => (k ? this.extra(k) : ''))].join('|');
    if (key === this.key) return;
    this.key = key;
    kinds.forEach((kind, i) => {
      const b = this.el.querySelector(`.qw-${i}`);
      const sel = i === this.sel;
      if (!kind) {
        b.className = `qw-slot qw-${i} empty${sel ? ' sel' : ''}`;
        b.disabled = true;
        b.innerHTML = `<span class="qw-n">${esc(t('qwEmpty'))}</span>`;
        return;
      }
      const on = inv.equipped === kind;
      const name = kind === 'flare' && !g.player.hasFlare ? t('bagCartridges') : bagName(kind);
      b.className = `qw-slot qw-${i}${sel ? ' sel' : ''}${on ? ' on' : ''}`;
      b.disabled = false;
      b.setAttribute('aria-label', name);
      b.innerHTML = `<span class="qw-ico">${iconSvg(kind)}</span><b>${esc(name)}</b><span class="qw-n">${esc(this.extra(kind))}</span>${on ? `<i>${esc(t('bagInHands'))}</i>` : ''}`;
    });
    const k = this.sel >= 0 ? kinds[this.sel] : null;
    this.el.querySelector('.qw-name').textContent = k ? (k === 'flare' && !g.player.hasFlare ? t('bagCartridges') : bagName(k)) : '';
    this.el.querySelector('.qw-sub').textContent = this.sel < 0 ? t('qwKeep') : !k ? t('qwEmpty') : inv.equipped === k ? t('qwStow') : t('qwTake');
    this.el.querySelector('.qw-hint').textContent = this.touch ? t('qwHintT') : t('qwHint').replace('{key}', keyLabel(this.input.binds?.bag || 'KeyI'));
  }
}
