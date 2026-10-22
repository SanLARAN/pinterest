// The desktop build's own little line in the menu (3.0m).
//
// The portable .exe cannot be patched by an installer, so the shell asks GitHub for the newest release and this
// puts the answer in the corner of the menu: which build you are running, and — when there is a newer one — one
// button that downloads it and one that opens the releases page. In the browser (or on any build without the
// preload bridge) installDesktopUpdate() does nothing at all.
const HIDE_KEY = 'hush.update.skipped';

export function installDesktopUpdate() {
  const api = globalThis.hushDesktop;
  if (!api || !api.check) return null;

  const el = document.createElement('div');
  el.className = 'updater';
  el.hidden = true;
  el.innerHTML = '<span class="updater-line"></span><button type="button" class="updater-go" hidden></button><button type="button" class="updater-x" hidden>×</button>';
  document.body.append(el);
  const line = el.querySelector('.updater-line');
  const go = el.querySelector('.updater-go');
  const x = el.querySelector('.updater-x');

  let latest = null;
  let busy = false;

  const show = (text, action) => {
    el.hidden = false;
    line.textContent = text;
    go.hidden = !action;
    if (action) go.textContent = action;
    x.hidden = !action;
  };

  const check = async () => {
    if (busy) return;
    busy = true;
    try {
      const st = await api.check();
      if (!st || st.dev) { el.hidden = true; return; }
      if (st.phase === 'error') { el.hidden = true; return; }
      if (!st.latest) { el.hidden = true; return; }
      if (!st.newer) {
        show(`сборка ${st.version} · последняя`, null);
        setTimeout(() => { if (!el.hidden && !latest) el.hidden = true; }, 6000);
        return;
      }
      latest = st;
      if (localStorage.getItem(HIDE_KEY) === st.latest) return;
      show(`есть сборка ${st.latest} — скачать`, 'СКАЧАТЬ');
    } catch {
      el.hidden = true; // no network, no GitHub, no problem: a game that starts offline must not complain
    } finally {
      busy = false;
    }
  };

  go.addEventListener('click', async () => {
    if (!latest) return;
    go.disabled = true;
    go.textContent = '0%';
    const off = api.onProgress?.((s) => {
      if (s.phase === 'downloading') go.textContent = `${Math.round((s.progress || 0) * 100)}%`;
      if (s.phase === 'downloaded') { line.textContent = 'сборка скачана — игра перезапустится'; go.hidden = true; x.hidden = true; }
      if (s.phase === 'error') { line.textContent = `не вышло: ${s.error}`; go.disabled = false; go.textContent = 'ОТКРЫТЬ СТРАНИЦУ'; }
    });
    try {
      const st = await api.download();
      if (st && st.phase === 'error') {
        line.textContent = `не вышло: ${st.error}`;
        go.textContent = 'ОТКРЫТЬ СТРАНИЦУ';
        go.onclick = () => api.openReleases();
      }
    } finally {
      off?.();
    }
  });

  x.addEventListener('click', () => {
    if (latest) localStorage.setItem(HIDE_KEY, latest.latest);
    el.hidden = true;
  });

  show(`сборка ${api.version ? '' : ''}…`, null);
  api.version?.().then((v) => { line.textContent = `сборка ${v}`; }).catch(() => {});
  setTimeout(() => { el.hidden = true; }, 2500); // the version line is a greeting, not a panel
  check();
  // and once more every few hours, for a window that stays open all evening
  const timer = setInterval(check, 3 * 3600 * 1000);
  timer.unref?.(); // (a browser holds the page anyway; this keeps a test runner from waiting on it)
  globalThis.addEventListener?.('beforeunload', () => clearInterval(timer));
  return { check, el };
}
