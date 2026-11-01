// 3.1d: the desktop launcher — the first window the .exe opens. ИГРАТЬ, the update line under it, what's new.
//
// It is a page of the game's own build (vite: launcher.html), so it has the game's fonts, words and patch notes,
// and it updates together with the game. Everything it does goes through window.hushLauncher (electron/
// preload-launcher.cjs); opened in a plain browser it says so and points at the web version instead.
// `?demo=<phase>` (browser only) shows a pretend state, for looking at the page without the shell.
import '@fontsource/rubik-wet-paint/cyrillic-400.css';
import '@fontsource/rubik-wet-paint/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-700.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import './launcher.css';
import { t, setLang, getLang } from '../core/i18n.js';
import { settings } from '../core/storage.js';
import { NEWS } from '../ui/news.js';

setLang(settings.lang);
document.documentElement.lang = getLang();
const $ = (id) => document.getElementById(id);
const fill = (s, vars) => Object.entries(vars).reduce((a, [k, v]) => a.replaceAll(`{${k}}`, String(v)), s);
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------------------------------------------------------------- the bridge (or a pretend one)
const real = globalThis.hushLauncher || null;
const demoPhase = !real ? new URLSearchParams(location.search).get('demo') : null;
const demo = {
  state: async () => ({
    phase: demoPhase || 'latest', mode: 'nsis', game: '1.0.214', latest: '1.0.215', latestGame: NEWS[0]?.v || '', progress: 0.42, error: 'HTTP 503',
    shell: demoPhase === 'shell' ? { phase: 'downloading', progress: 0.31, size: 86 * 1048576 } : { phase: 'none' },
  }),
  onState: () => () => {},
  prefs: async () => ({ autoplay: false, fullscreen: false }),
  setPref: async () => true, play: async () => ({}), retry: async () => ({}), applyShell: async () => true, open: async () => true, win: async () => true,
};
const api = real || (demoPhase ? demo : null);

// ---------------------------------------------------------------- the words
for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
for (const b of document.querySelectorAll('[data-win]')) b.setAttribute('aria-label', t(b.dataset.win === 'min' ? 'lnMin' : 'lnClose'));

// ---------------------------------------------------------------- what's new (from the build this page belongs to)
function renderNews() {
  const lang = getLang() === 'en' ? 'en' : 'ru';
  $('lnNewsList').innerHTML = NEWS.slice(0, 5).map((n) => {
    const e = n[lang] || n.ru;
    return `<article><h3><b>${esc(n.v)}</b> ${esc(e.title)} <time>${esc(n.date || '')}</time></h3><ul>${e.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></article>`;
  }).join('');
}
renderNews();

// ---------------------------------------------------------------- the state
let waitingToPlay = false;
let last = null;

function render(s) {
  last = s;
  const play = $('lnPlay');
  const line = $('lnLine');
  const track = document.querySelector('.ln-bar-track');
  const pct = Math.round((s.progress || 0) * 100);
  track.hidden = s.phase !== 'downloading';
  $('lnFill').style.width = `${pct}%`;
  $('lnRetry').hidden = !['offline', 'error'].includes(s.phase);
  $('lnPlayNow').hidden = !(s.phase === 'downloading' && waitingToPlay);
  line.className = s.phase === 'error' || s.phase === 'offline' ? 'warn' : s.phase === 'ready' ? 'ok' : '';
  line.textContent = {
    idle: '', dev: t('lnDev'), checking: t('lnChecking'), latest: t('lnLatest'),
    downloading: fill(t('lnDownloading'), { v: s.latestGame || s.latest || '', p: pct }),
    ready: fill(t('lnReady'), { v: s.latestGame || s.game }),
    offline: t('lnOffline'), error: fill(t('lnError'), { e: s.error || '?' }), playing: t('lnPlaying'),
  }[s.phase] ?? '';
  const busy = s.phase === 'downloading' && waitingToPlay;
  play.textContent = busy ? t('lnWaitPlay') : t('lnPlay');
  play.disabled = busy || s.phase === 'playing';
  play.classList.toggle('wait', busy);
  // the shell's own update: quiet, it installs when you quit
  const sh = s.shell || { phase: 'none' };
  const box = document.querySelector('.ln-shell');
  box.hidden = sh.phase === 'none';
  $('lnShellLine').textContent = sh.phase === 'downloading' ? fill(t('lnShellGet'), { mb: Math.round((sh.size || 0) / 1048576), p: Math.round((sh.progress || 0) * 100) })
    : sh.phase === 'ready' ? t('lnShellReady') : sh.phase === 'error' ? fill(t('lnShellError'), { e: sh.error || '?' }) : '';
  $('lnShellApply').hidden = sh.phase !== 'ready';
  $('lnVer').textContent = fill(t('lnVersion'), { g: NEWS[0]?.v || '', v: s.game || '—' });
}

async function start() {
  if (!api) {
    document.querySelector('.ln-browser').hidden = false;
    $('lnPlay').hidden = true;
    document.querySelector('.ln-prefs').hidden = true;
    document.querySelector('.ln-links').hidden = true;
    return;
  }
  render(await api.state());
  api.onState((s) => {
    if (waitingToPlay && s.phase !== 'downloading') waitingToPlay = false; // (the shell starts the game itself)
    render(s);
  });
  const p = await api.prefs();
  $('lnAuto').checked = !!p.autoplay;
  $('lnFull').checked = !!p.fullscreen;
}

$('lnPlay').addEventListener('click', async () => {
  const r = await api?.play(false);
  if (r && r.waiting) { waitingToPlay = true; if (last) render(last); }
});
$('lnPlayNow').addEventListener('click', () => api?.play(true));
$('lnRetry').addEventListener('click', () => api?.retry());
$('lnShellApply').addEventListener('click', () => api?.applyShell());
$('lnAuto').addEventListener('change', (e) => api?.setPref('autoplay', e.target.checked));
$('lnFull').addEventListener('change', (e) => api?.setPref('fullscreen', e.target.checked));
for (const b of document.querySelectorAll('[data-open]')) b.addEventListener('click', () => api?.open(b.dataset.open));
for (const b of document.querySelectorAll('[data-win]')) b.addEventListener('click', () => api?.win(b.dataset.win));
addEventListener('keydown', (e) => {
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
