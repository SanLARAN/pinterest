// 3.0y: rebinding keys, in the settings. One row per action: its name and the key on a keycap. Click the keycap,
// press the new key (Esc cancels); a key that was already taken swaps over to the old one. Saved on this device.
import { t } from '../core/i18n.js';
import { settings, saveSettings } from '../core/storage.js';
import { ACTIONS, cleanKeys, keysToSave, rebind, bindable, keyLabel } from '../core/keybinds.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class KeysPanel {
  constructor({ host, input, uiSound = () => {} }) {
    this.input = input;
    this.uiSound = uiSound;
    this.waiting = null; // the action whose key is being chosen
    this.el = document.createElement('section');
    this.el.className = 'keys-panel';
    this.el.setAttribute('aria-labelledby', 'kbTitle');
    host.append(this.el);
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      this.uiSound('click');
      if (b.dataset.kb === 'reset') { this.save({}); this.say(t('kbResetDone')); return; }
      if (b.dataset.act) this.listen(b.dataset.act);
    });
    // the key comes in before anything else can act on it
    this.onKey = (e) => {
      if (!this.waiting) return;
      e.preventDefault();
      e.stopPropagation();
      const act = this.waiting;
      if (e.code === 'Escape') { this.stop(); this.say(''); return; }
      if (!bindable(e.code)) { this.say(t('kbNo').replace('{key}', e.code)); return; }
      this.save(rebind(cleanKeys(settings.keys), act, e.code));
      this.stop();
      this.say(t('kbSet').replace('{act}', t('kbAct')[act]).replace('{key}', keyLabel(e.code)));
    };
    this.render();
  }

  listen(act) {
    this.waiting = act;
    this.input.capturing = true;
    window.addEventListener('keydown', this.onKey, true);
    this.render();
    this.el.querySelector(`[data-act="${act}"]`)?.focus();
  }

  stop() {
    this.waiting = null;
    this.input.capturing = false;
    window.removeEventListener('keydown', this.onKey, true);
    this.render();
  }

  save(map) {
    settings.keys = keysToSave(map);
    saveSettings();
    this.input.setKeys(settings.keys);
    this.render();
  }

  say(text) {
    this.message = text;
    const s = this.el.querySelector('.kb-status');
    if (s) s.textContent = text;
  }

  render() {
    const map = cleanKeys(settings.keys), names = t('kbAct');
    this.el.innerHTML = `<h3 id="kbTitle">${esc(t('kbTitle'))}</h3><p class="kb-hint">${esc(t('kbHint'))}</p>
      <div class="kb-grid">${ACTIONS.map((a) => `<div class="kb-row"><span>${esc(names[a] || a)}</span><button type="button" class="kb-key${this.waiting === a ? ' wait' : ''}" data-act="${a}" aria-label="${esc((names[a] || a) + ': ' + keyLabel(map[a]))}">${esc(this.waiting === a ? t('kbPress') : keyLabel(map[a]))}</button></div>`).join('')}</div>
      <p class="kb-fixed">${esc(t('kbFixed'))}</p>
      <div class="kb-foot"><button type="button" class="btn" data-kb="reset">${esc(t('kbReset'))}</button><span class="kb-status" role="status" aria-live="polite">${esc(this.message || '')}</span></div>`;
  }

  // the settings closed (or the language changed): stop listening, redraw the words
  refresh() {
    if (this.waiting) this.stop();
    else this.render();
  }
}
