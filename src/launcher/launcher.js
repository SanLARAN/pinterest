// 3.1d → 3.1k: the desktop launcher — the first window the .exe opens.
//
// Left: ИГРАТЬ, which carries its own progress while an update comes in, and one status line under it (with
// «проверить» / «повторить»). Right: two tabs — what's new (the game's own patch notes) and settings: how the game
// starts, the language, where it is installed and where the saves are, «проверить файлы игры», «удалить игру».
//
// It is a page of the game's own build (vite: launcher.html), so it has the game's fonts, words and patch notes,
// and it updates together with the game — which also means it can be newer than the shell around it: whatever the
// shell cannot do yet (an install from before 3.1k has no `info`) is simply not shown. Everything it does goes
// through window.hushLauncher (electron/preload-launcher.cjs); opened in a plain browser it says so and points at
// the web version instead. `?demo=<phase>` (browser only) shows a pretend state, for looking at the page.
import '@fontsource/rubik-wet-paint/cyrillic-400.css';
import '@fontsource/rubik-wet-paint/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-700.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import './launcher.css';
import { t, setLang, getLang } from '../core/i18n.js';
import { settings, saveSettings } from '../core/storage.js';
import { NEWS } from '../ui/news.js';

setLang(settings.lang);
const $ = (id) => document.getElementById(id);
const fill = (s, vars) => Object.entries(vars).reduce((a, [k, v]) => a.replaceAll(`{${k}}`, String(v)), s);
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mb = (bytes) => Math.max(1, Math.round((bytes || 0) / 1048576));

// ---------------------------------------------------------------- the bridge (or a pretend one)
const real = globalThis.hushLauncher || null;
const demoPhase = !real ? new URLSearchParams(location.search).get('demo') : null;
const demo = {
  state: async () => ({
    phase: demoPhase || 'latest', mode: 'nsis', game: '1.0.214', latest: '1.0.215', latestGame: NEWS[0]?.v || '', progress: 0.42, size: 7318189,
    error: 'HTTP 503', checkedAt: Date.now() - 120000,
    shell: demoPhase === 'shell' ? { phase: 'downloading', progress: 0.31, size: 118 * 1048576 } : { phase: 'none' },
  }),
  onState: () => () => {},
  prefs: async () => ({ autoplay: false, fullscreen: false, returnToLauncher: true }),
  info: async () => ({ mode: 'nsis', installDir: 'D:\\Games\\HUSH', dataDir: 'C:\\Users\\player\\AppData\\Roaming\\HUSH', shell: '1.0.214', electron: '45.0.0', canUninstall: true }),
  setPref: async () => true, play: async () => ({ waiting: demoPhase === 'downloading' }), retry: async () => ({}), applyShell: async () => true, open: async () => true, win: async () => true,
  repair: async () => ({ phase: 'latest' }), uninstall: async () => true,
};
const api = real || (demoPhase ? demo : null);

let waitingToPlay = false;
let last = null;
let info = null;
let repairing = false;

// ---------------------------------------------------------------- the words (again on a language switch)
function applyWords() {
  document.documentElement.lang = getLang();
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  for (const b of document.querySelectorAll('[data-win]')) b.setAttribute('aria-label', t(b.dataset.win === 'min' ? 'lnMin' : 'lnClose'));
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-checked', String(b.dataset.lang === getLang()));
  renderNews();
  renderInfo();
  if (last) render(last);
}

// ---------------------------------------------------------------- what's new (from the build this page belongs to)
function renderNews() {
  const lang = getLang() === 'en' ? 'en' : 'ru';
  $('lnNewsList').innerHTML = NEWS.slice(0, 6).map((n) => {
    const e = n[lang] || n.ru;
    return `<article><h3><b>${esc(n.v)}</b> ${esc(e.title)} <time>${esc(n.date || '')}</time></h3><ul>${e.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></article>`;
  }).join('');
}

// ---------------------------------------------------------------- the state: ИГРАТЬ and the line under it
function clock(ms) {
  try { return new Date(ms).toLocaleTimeString(getLang() === 'en' ? 'en-GB' : 'ru-RU', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

function render(s) {
  last = s;
  const play = $('lnPlay');
  const pct = Math.round((s.progress || 0) * 100);
  const downloading = s.phase === 'downloading';
  const busy = downloading && waitingToPlay;
  const running = s.phase === 'playing';
  play.style.setProperty('--p', downloading ? String(s.progress || 0) : '0');
  play.classList.toggle('busy', busy);
  play.classList.toggle('running', running);
  play.disabled = busy || running;
  $('lnPlayText').textContent = busy ? fill(t('lnUpdatingBtn'), { p: pct }) : running ? t('lnPlaying') : t('lnPlay');

  const line = $('lnLine');
  const warn = s.phase === 'error' || s.phase === 'offline';
  line.className = warn ? 'warn' : '';
  line.textContent = {
    idle: '', dev: t('lnDev'), checking: t('lnChecking'),
    latest: s.checkedAt ? fill(t('lnLatestAt'), { t: clock(s.checkedAt) }) : t('lnLatest'),
    downloading: s.size ? fill(t('lnDownloadingMb'), { v: s.latestGame || s.latest || '', p: pct, mb: mb(s.size) }) : fill(t('lnDownloading'), { v: s.latestGame || s.latest || '', p: pct }),
    ready: fill(t('lnReady'), { v: s.latestGame || s.game }),
    offline: t('lnOffline'), error: fill(t('lnError'), { e: s.error || '?' }), playing: t('lnPlaying'),
  }[s.phase] ?? '';
  const dot = document.querySelector('.ln-dot');
  dot.className = `ln-dot ${downloading || s.phase === 'checking' ? 'busy' : warn ? 'warn' : ['latest', 'ready'].includes(s.phase) ? 'ok' : ''}`;
  $('lnRetry').hidden = !warn;
  $('lnCheck').hidden = !['latest', 'ready'].includes(s.phase);
  $('lnPlayNow').hidden = !busy;

  // the shell's own update: quiet, it installs when you quit
  const sh = s.shell || { phase: 'none' };
  document.querySelector('.ln-shell').hidden = sh.phase === 'none';
  $('lnShellLine').textContent = sh.phase === 'downloading' ? fill(t('lnShellGet'), { mb: mb(sh.size), p: Math.round((sh.progress || 0) * 100) })
    : sh.phase === 'ready' ? t('lnShellReady') : sh.phase === 'error' ? fill(t('lnShellError'), { e: sh.error || '?' }) : '';
  $('lnShellApply').hidden = sh.phase !== 'ready';
  $('lnVer').textContent = fill(t('lnVersion'), { g: NEWS[0]?.v || '', v: s.game || '—' });

  $('lnRepair').disabled = repairing || downloading || s.phase === 'checking' || running;
  $('lnUninstall').disabled = running;
}

// ---------------------------------------------------------------- settings: where it lives, and what it can do there
function renderInfo() {
  const has = !!info;
  for (const el of document.querySelectorAll('[data-needs="info"]')) el.hidden = !has;
  $('lnOldShell').hidden = has || !api;
  if (!has) return;
  $('lnInstallDir').textContent = info.installDir;
  $('lnInstallDir').title = info.installDir;
  $('lnDataDir').textContent = info.dataDir;
  $('lnDataDir').title = info.dataDir;
  $('lnUninstall').hidden = !info.canUninstall;
  $('lnAbout').textContent = fill(t(info.mode === 'portable' ? 'lnAboutPortable' : 'lnAbout'), { g: NEWS[0]?.v || '', v: info.shell, e: info.electron });
}

async function start() {
  applyWords();
  if (!api) {
    document.querySelector('.ln-browser').hidden = false;
    document.querySelector('.ln-go').hidden = true;
    document.querySelector('.ln-side').hidden = true;
    document.querySelector('.ln-main').style.gridTemplateColumns = '1fr';
    return;
  }
  render(await api.state());
  api.onState((s) => {
    if (waitingToPlay && s.phase !== 'downloading') waitingToPlay = false; // (the shell starts the game itself)
    if (repairing && !['checking', 'downloading'].includes(s.phase)) {
      repairing = false;
      $('lnFilesNote').className = 'ln-note';
      $('lnFilesNote').textContent = ['latest', 'ready'].includes(s.phase) ? t('lnRepairDone') : '';
    }
    render(s);
  });
  const p = await api.prefs();
  $('lnAuto').checked = !!p.autoplay;
  $('lnFull').checked = !!p.fullscreen;
  $('lnBack').checked = p.returnToLauncher !== false;
  if (typeof api.info === 'function') {
    try { info = await api.info(); } catch { info = null; }
  }
  renderInfo();
  if (last) render(last);
}

// ---------------------------------------------------------------- the controls
$('lnPlay').addEventListener('click', async () => {
  const r = await api?.play(false);
  if (r && r.waiting) { waitingToPlay = true; if (last) render(last); }
});
$('lnPlayNow').addEventListener('click', () => api?.play(true));
$('lnRetry').addEventListener('click', () => api?.retry());
$('lnCheck').addEventListener('click', () => api?.retry());
$('lnShellApply').addEventListener('click', () => api?.applyShell());
$('lnAuto').addEventListener('change', (e) => api?.setPref('autoplay', e.target.checked));
$('lnFull').addEventListener('change', (e) => api?.setPref('fullscreen', e.target.checked));
$('lnBack').addEventListener('change', (e) => api?.setPref('returnToLauncher', e.target.checked));
for (const b of document.querySelectorAll('[data-open]')) b.addEventListener('click', () => api?.open(b.dataset.open));
for (const b of document.querySelectorAll('[data-win]')) b.addEventListener('click', () => api?.win(b.dataset.win));

// the language of the launcher and of the game (the same saved settings: one origin, hush://app)
for (const b of document.querySelectorAll('[data-lang]')) {
  b.addEventListener('click', () => {
    if (b.dataset.lang === getLang()) return;
    settings.lang = b.dataset.lang;
    saveSettings();
    setLang(settings.lang);
    applyWords();
  });
}

$('lnRepair').addEventListener('click', async () => {
  if (!api?.repair) return;
  repairing = true;
  const note = $('lnFilesNote');
  note.className = 'ln-note';
  note.textContent = t('lnRepairing');
  if (last) render(last);
  const r = await api.repair();
  if (r && r.error === 'playing') {
    repairing = false;
    note.className = 'ln-note warn';
    note.textContent = t('lnRepairPlaying');
  }
  if (r && r.phase && !['checking', 'downloading'].includes(r.phase)) {
    repairing = false;
    note.textContent = ['latest', 'ready'].includes(r.phase) ? t('lnRepairDone') : '';
  }
  if (last) render(last);
});

// «удалить игру»: one question here, then electron-builder's uninstaller takes over (and asks about the saves)
const confirmBox = $('lnConfirm');
let confirmFrom = null;
function closeConfirm() { confirmBox.hidden = true; confirmFrom?.focus(); }
$('lnUninstall').addEventListener('click', () => {
  confirmFrom = $('lnUninstall');
  confirmBox.hidden = false;
  $('lnConfirmNo').focus();
});
$('lnConfirmNo').addEventListener('click', closeConfirm);
confirmBox.addEventListener('click', (e) => { if (e.target === confirmBox) closeConfirm(); });
$('lnConfirmYes').addEventListener('click', async () => {
  const ok = await api?.uninstall?.();
  closeConfirm();
  if (!ok) { $('lnFilesNote').className = 'ln-note warn'; $('lnFilesNote').textContent = t('lnUninstallFail'); }
});

// the tabs: click, or ←/→ between them (the usual tablist keys)
const tabs = [...document.querySelectorAll('.ln-tabs [role="tab"]')];
function selectTab(tab, focus) {
  for (const x of tabs) {
    const on = x === tab;
    x.setAttribute('aria-selected', String(on));
    x.tabIndex = on ? 0 : -1;
    $(x.getAttribute('aria-controls')).hidden = !on;
  }
  if (focus) tab.focus();
}
for (const tab of tabs) {
  tab.addEventListener('click', () => selectTab(tab, false));
  tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = tabs.indexOf(tab);
    selectTab(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
  });
}

addEventListener('keydown', (e) => {
  if (!confirmBox.hidden) {
    if (e.key === 'Escape') { e.preventDefault(); closeConfirm(); }
    if (e.key === 'Tab') { // keep the focus inside the question
      const keys = [$('lnConfirmNo'), $('lnConfirmYes')];
      const i = keys.indexOf(document.activeElement);
      e.preventDefault();
      keys[(i + (e.shiftKey ? keys.length - 1 : 1)) % keys.length].focus();
    }
    return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body && !$('lnPlay').disabled) $('lnPlay').click();
});

// ---------------------------------------------------------------- the sonar behind it all
function sonar() {
  const cv = $('lnSonar');
  const ctx = cv.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const size = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; };
  size();
  addEventListener('resize', size);
  const draw = (now) => {
    const w = cv.width, h = cv.height, cx = w * 0.3, cy = h * 0.58, k = devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const ph = still ? i / 4 : ((now / 3200 + i / 4) % 1);
      const r = ph * Math.max(w, h) * 0.75;
      ctx.strokeStyle = `rgba(214, 205, 192, ${0.13 * (1 - ph)})`;
      ctx.lineWidth = 1.5 * k;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (!still) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}
sonar();
start();
