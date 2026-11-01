// The desktop build's own little line in the corner of the menu (3.0m, reworked in 3.1d).
//
// Since 3.1d the launcher does the updating: it downloads a newer game in the background (also while you play)
// and the shell re-installs itself when it changed. All this line does is say so — the build you are running,
// and when a newer game is already on disk, one button that reloads onto it. In the browser (or on any build
// without the preload bridge) installDesktopUpdate() does nothing at all.
import { t } from '../core/i18n.js';

const HIDE_KEY = 'hush.update.skipped';

export function installDesktopUpdate() {
  const api = globalThis.hushDesktop;
  if (!api || !api.check) return null;

  const el = document.createElement('div');
  el.className = 'updater';
  el.hidden = true;
  const hide = t('dskHide').replace(/"/g, '');
  el.innerHTML = `<span class="updater-line"></span><button type="button" class="updater-go" hidden></button><button type="button" class="updater-x" hidden aria-label="${hide}">×</button>`;
  document.body.append(el);
  const line = el.querySelector('.updater-line');
  const go = el.querySelector('.updater-go');
  const x = el.querySelector('.updater-x');

  let shown = null; // the version whose button is up
  const show = (text, action) => {
    el.hidden = false;
    line.textContent = text;
    go.hidden = !action;
    if (action) go.textContent = action;
    x.hidden = !action;
  };

  const view = (st) => {
    if (!st || st.dev) { el.hidden = true; return; }
    if (st.updateReady) {
      shown = st.latest;
      if (localStorage.getItem(HIDE_KEY) === st.latest) return;
      show(t('dskReady').replace('{v}', st.latestGame || st.latest || ''), t('dskRestart'));
      return;
    }
    if (st.shell === 'ready') { show(t('dskShell'), null); return; }
    if (!shown) el.hidden = true;
  };

  const check = async () => {
    try { view(await api.check()); } catch { el.hidden = true; } // no network is no problem: the game starts offline
  };

  go.addEventListener('click', () => { go.disabled = true; api.restart?.(); });
  x.addEventListener('click', () => {
    if (shown) localStorage.setItem(HIDE_KEY, shown);
    el.hidden = true;
  });

  // the launcher tells every open window when something changes
  api.onProgress?.((st) => view(st));

  api.version?.().then((v) => { show(t('dskBuild').replace('{v}', v), null); setTimeout(() => { if (!shown) el.hidden = true; }, 2500); }).catch(() => {});
  check();
  return { check, el };
}
