// The landing page: one walk through the game's night forest. The page paints first (text, the nav, the numbers
// from the game's own config); the forest (stage.js, three.js + the game's renderer) comes in behind it; the
// atlas, the ballot and the patch notes wake up as you scroll to them. Sound waits for your first gesture.
import '@fontsource/rubik-wet-paint/cyrillic-400.css';
import '@fontsource/rubik-wet-paint/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-700.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import './site.css';
import { CFG } from '../src/core/config.js';
import { MAX_PLAYERS, makeCode } from '../src/net/net.js';
import { detectLang, setLang, getLang, saveLang, readSite, saveSite, t, plural } from './i18n.js';
import { trackU, pinProgress, shiftAt, gensLitAt, SHIFT_SEGMENTS, clockText, clamp01 } from './timeline.js';
import { esc, echoText, reveals, toast, SonarCursor } from './fx.js';
import { CAMERA_SHOTS } from '../src/game/backpackData.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const S = CFG.SHIFT;
const REPO = 'SanLARAN/pinterest';
const RELEASES = `https://github.com/${REPO}/releases/latest`;
const FOREST = ['top', 'echo', 'shift', 'coop'];
const ORDER = ['top', 'echo', 'shift', 'coop', 'atlas', 'vote', 'album', 'patches'];

document.documentElement.classList.add('js');
if (reduced) document.documentElement.classList.add('reduced');
if (coarse) document.documentElement.classList.add('touch');
// on a touch screen the hints speak of taps, not clicks
if (coarse) for (const el of document.querySelectorAll('[data-i18n="hero.hint"], [data-i18n="echo.try"]')) el.dataset.i18n += 'Touch';
setLang(detectLang());

// ---------------- words ----------------
const ROOM = makeCode();
let atlasData = null; // src/ui/atlasData.js (the generators' part names), loaded after the first paint
let patchesMod = null; // ./patches.js (the patch list: the version line, the counts)

function vars() {
  const o = S.OPTIONS;
  return {
    players: MAX_PLAYERS,
    night: plural(Math.round(S.NIGHT / 60), t('shift.min')),
    morning: clockText(S.MORNING),
    wake: Math.round(S.LAST_WAKE / 60),
    finale: plural(Math.round(S.FINALE / 60), t('shift.min')),
    code: ROOM.length,
    shots: CAMERA_SHOTS,
    options: `${o.slice(0, -1).join(', ')} ${t('shift.or')} ${o[o.length - 1]}`,
  };
}

function applyLang() {
  const V = vars();
  const L = getLang();
  document.documentElement.lang = L;
  document.title = t('meta.title');
  for (const sel of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    const m = $(sel);
    if (m) m.content = t('meta.description');
  }
  for (const sel of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
    const m = $(sel);
    if (m) m.content = t('meta.title');
  }
  for (const el of $$('[data-i18n]')) {
    const s = t(el.dataset.i18n, V);
    if (el.hasAttribute('data-echo')) echoText(el, s);
    else el.textContent = s;
  }
  for (const el of $$('[data-i18n-attr]')) {
    for (const pair of el.dataset.i18nAttr.split(',')) {
      const [a, k] = pair.split(':').map((x) => x.trim());
      el.setAttribute(a, t(k, V));
    }
  }
  $('.hero-title').dataset.text = t('hero.title');
  $('#fSpeed').textContent = CFG.PULSE.speed;
  $('#fScream').textContent = `${Math.round(CFG.SCREAM * 100)}%`;
  $('#fDrop').textContent = CFG.MONSTER.listener.lock;
  $('#roomCode').textContent = ROOM;
  buildSegbar();
  buildGens();
  versionLine();
  downloadLine();
  soundUI();
  micUI();
  meter(meterK, true);
  lastShift = '';
  shiftUI(shiftP);
  atlas?.refreshLang();
  ballot?.refreshLang();
  album?.refreshLang();
  patches?.refreshLang();
}

// ---------------- the shift panel ----------------
function buildSegbar() {
  const bar = $('#segbar');
  const wakeAt = S.LAST_WAKE / S.NIGHT;
  bar.innerHTML = SHIFT_SEGMENTS.map((s, i) => {
    const label = s.kind === 'night' ? t('shift.night', { n: s.n }) : s.kind === 'morning' ? t('shift.morning') : t('shift.finale');
    const short = s.kind === 'night' ? s.n : s.kind === 'morning' ? '' : '☀';
    const wk = s.kind === 'night' && s.n === S.DAYS ? `<em class="wk" style="--at:${wakeAt}" title="${esc(t('shift.woke'))}"></em>` : '';
    return `<span class="sg ${s.kind}" data-sg="${i}" style="--w:${s.w.toFixed(4)}" title="${esc(label)}"><i></i>${wk}<b>${short}</b></span>`;
  }).join('');
}

function buildGens() {
  const T = atlasData ? atlasData.atlasText(getLang()) : null;
  $('#gens').innerHTML = CFG.GENERATORS.map((g, i) => {
    const e = T?.entries?.[g.part];
    return `<li class="gen" data-gen="${i}">
      <span class="g-n">${esc(t('shift.gen', { n: i + 1 }))}</span>
      <span class="g-name">${esc(e ? e.name : '…')}</span>
      <span class="g-state"></span>
      <span class="g-meta">${g.dur} ${esc(t('shift.sec'))} · ${esc(t('shift.noise'))} <i class="g-noise" style="--v:${g.startLoud}"></i> ${Math.round(g.startLoud * 100)}%</span>
      ${e && e.tips?.[0] ? `<span class="g-tip">${esc(e.tips[0])}</span>` : ''}
    </li>`;
  }).join('');
  lastGens = '';
}

let lastShift = '', lastGens = '';
function shiftUI(p) {
  const { seg, k, clock, woke } = shiftAt(p);
  const label = seg.kind === 'night' ? t('shift.nightUp', { n: seg.n }) : seg.kind === 'morning' ? t('shift.morningUp') : t('shift.finaleUp');
  const time = `${clockText(clock)}`;
  const key = `${label}|${time}|${woke}`;
  if (key !== lastShift) {
    lastShift = key;
    $('#clkSeg').textContent = label;
    $('#clkT').textContent = time;
    $('#clkOf').textContent = `/ ${clockText(seg.dur)}`;
    $('#clkWoke').hidden = !woke;
    const sec = $('#shift');
    sec.classList.toggle('is-night', seg.kind === 'night');
    sec.classList.toggle('is-morning', seg.kind === 'morning');
    sec.classList.toggle('is-finale', seg.kind === 'finale');
    sec.classList.toggle('is-woke', woke);
    $('#railClock').textContent = section === 'shift' ? `${label} · ${time}` : '';
  }
  for (const el of $$('#segbar .sg')) {
    const s = SHIFT_SEGMENTS[+el.dataset.sg];
    el.style.setProperty('--k', clamp01((p - s.a) / s.w).toFixed(4));
    el.classList.toggle('now', s === seg);
  }
  const { lit } = gensLitAt(p);
  const next = lit.indexOf(false);
  const g = `${lit.join()}|${next}`;
  if (g !== lastGens) {
    lastGens = g;
    $$('#gens .gen').forEach((el, i) => {
      const was = el.classList.contains('lit');
      el.classList.toggle('lit', lit[i]);
      el.classList.toggle('next', i === next);
      el.querySelector('.g-state').textContent = lit[i] ? t('shift.started') : i === next ? t('shift.next') : '';
      if (lit[i] && !was && !reduced) {
        el.classList.remove('flash');
        void el.offsetWidth;
        el.classList.add('flash');
      }
    });
  }
  void k;
}

// ---------------- the version, the download ----------------
function versionLine() {
  if (!patchesMod) return;
  const { latest, n, days } = patchesMod.Patches.facts();
  const d = new Date(`${latest.date}T12:00:00Z`).toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(/\s*г\.$/, '');
  const line = t('hero.version', { v: latest.v, date: d });
  $('#heroVer').textContent = line;
  $('#footVer').textContent = line;
  $('#patchesLead').textContent = patchesMod.Patches.lead();
  void n; void days;
}

let rel = null; // { url, size } of the Windows installer, from the latest GitHub release
function downloadLine() {
  const meta = $('#dlMeta');
  if (rel && rel.url) {
    meta.textContent = t('hero.downloadMeta', { size: `${Math.round(rel.size / 1048576)} ${t('hero.mb')}` });
    for (const a of $$('[data-dl]')) a.href = rel.url;
  } else meta.textContent = t('hero.downloadFallback');
}

async function release() {
  const KEY = 'hush.site.release';
  try {
    const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (c && c.url) { rel = c; downloadLine(); return; }
  } catch { /* fine */ }
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const a = (j.assets || []).find((x) => /^HUSH-Setup-.*\.exe$/i.test(x.name)) || (j.assets || []).find((x) => /\.exe$/i.test(x.name));
    if (!a) throw new Error('no exe');
    rel = { url: a.browser_download_url, size: a.size, tag: j.tag_name };
    try { sessionStorage.setItem(KEY, JSON.stringify(rel)); } catch { /* fine */ }
  } catch (e) {
    rel = null;
  }
  downloadLine();
}

// ---------------- sound ----------------
let engine = null;
let soundOn = readSite().sound !== false;
let ambLevel = -1;

async function loadAudio() {
  if (engine) return engine;
  try {
    const { AudioEngine } = await import('../src/audio/audio.js');
    engine = new AudioEngine();
    // the game's recordings live next to the game, one level up from /site/
    const own = engine._sample;
    engine._sample = (p) => own.call(engine, /^(https?:|\/|\.\.\/)/.test(p) ? p : `../${p}`);
  } catch (e) {
    console.warn('[site] no sound', e);
  }
  return engine;
}

// called from a gesture: wakes the engine (force: an explicit "play a sound" also turns the sound on)
function wake(force = false) {
  if (!engine) return null;
  if (!soundOn) {
    if (!force) return null;
    setSound(true);
  }
  engine.init();
  const amb = () => {
    if (!soundOn || !engine.ready) return;
    if (!engine.ambOn) engine.startAmbience();
    ambLevel = -1;
  };
  if (engine.ready) amb();
  else setTimeout(amb, 250);
  return engine;
}

function setSound(on) {
  soundOn = on;
  saveSite({ sound: on });
  if (engine?.ctx) {
    if (on) {
      engine.init();
      engine.setPaused?.(false);
    } else engine.setPaused?.(true);
  }
  if (!on && mic?.state === 'on') { mic.stop(); micUI(); }
  soundUI();
}

function soundUI() {
  const b = $('#soundBtn');
  b.classList.toggle('on', soundOn);
  b.setAttribute('aria-pressed', String(soundOn));
  b.setAttribute('aria-label', soundOn ? t('nav.soundOn') : t('nav.soundOff'));
  b.title = b.getAttribute('aria-label');
}

const audioFor = {
  stage: () => (soundOn && engine?.ready ? engine : null),
  explicit: () => wake(true),
};

// ---------------- the microphone (the game's own: src/audio/mic.js, with your calibration from the game) ----------------
let mic = null;
let micPing = -10;
async function micToggle() {
  await loadAudio();
  const A = wake(true);
  if (!A) return;
  if (!mic) {
    try { ({ mic } = await import('../src/audio/mic.js')); } catch { toast(t('echo.micDenied')); return; }
  }
  if (mic.state === 'on') {
    mic.stop();
    micUI();
    return;
  }
  const ok = await mic.start(A);
  if (!ok) toast(t('echo.micDenied'), { kind: 'red' });
  micUI();
}

function micUI() {
  const on = mic?.state === 'on';
  const b = $('#micBtn');
  b.classList.toggle('on', on);
  b.setAttribute('aria-pressed', String(on));
  b.querySelector('span').textContent = on ? t('echo.micOff') : t('echo.mic');
  $('#micState').textContent = on ? t('echo.micOn') : '';
}

function micTick(dt, T) {
  if (!mic || mic.state !== 'on' || !engine) return;
  const ev = mic.update(dt, engine.outputDb());
  const k = Math.max(ev.loud || 0, Math.min(1, mic.meter || 0) * 0.9);
  if (!holding) meter(k);
  if (ev.pulse > 0 && T - micPing >= CFG.PING_CD && stage?.ready && FOREST.includes(section)) {
    micPing = T;
    const r = stage.voice(ev.pulse, { mic: true });
    if (r) readout(ev.pulse);
  }
}

// ---------------- the meter (echo section) and your sounds ----------------
let meterK = 0, shownK = -1;
function meter(k, force = false) {
  meterK = k;
  if (!force && Math.abs(k - shownK) < 0.004) return;
  shownK = k;
  $('#meterFill').style.transform = `scaleX(${clamp01(k).toFixed(3)})`;
  const m = $('#meter');
  m.classList.toggle('talk', k >= CFG.TALK && k < CFG.SCREAM);
  m.classList.toggle('scream', k >= CFG.SCREAM);
}
function readout(k) {
  const u = t('echo.m');
  $('#mLoud').textContent = `${Math.round(k * 100)}%`;
  $('#mSeen').textContent = `${Math.round(CFG.voiceRevealRadius(k))} ${u}`;
  $('#mHeard').textContent = `${Math.round(CFG.voiceHearRadius(k))} ${u}`;
}

const told = { stone: 0, talk: 0, scream: 0 };
function tell(kind, msg, opts) {
  if (told[kind] >= 2) return;
  told[kind]++;
  toast(msg, opts);
}

function onStageEvent(kind, d) {
  if (kind === 'scream') {
    tell('scream', t('echo.toastScream'), { kind: 'red' });
    flash('scream');
  } else if (kind === 'heard' || kind === 'voice') {
    if (!d.mic) tell('talk', t('echo.toastTalk', { r: Math.round(d.hear) }));
    if (kind === 'heard') flash('heard');
  } else if (kind === 'seen') flash('seen');
}
function flash(kind) {
  if (reduced) return;
  const b = document.body;
  b.classList.remove(`fx-${kind}`);
  void b.offsetWidth;
  b.classList.add(`fx-${kind}`);
  clearTimeout(flash[kind]);
  flash[kind] = setTimeout(() => b.classList.remove(`fx-${kind}`), 1200);
}

// click = a stone, hold = your voice (it grows while you hold)
const HOLD = 0.2, CHARGE = 1.6;
let hold = null, holding = false;
let cursor = null;

function inForest(el) {
  if (!stage?.ready || !el || !el.closest) return false;
  if (!el.closest('[data-sonar]')) return false;
  return !el.closest('a, button, input, select, textarea, label, summary, [data-nosonar], .nav, .rail, .toasts');
}

function bindInput() {
  cursor = new SonarCursor({ marks: [0, CFG.TALK, CFG.SCREAM], words: () => [t('echo.whisper'), t('echo.talk'), t('echo.scream')] });
  document.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || !inForest(e.target)) return;
    loadAudio().then(() => wake());
    wake();
    hold = { id: e.pointerId, x: e.clientX, y: e.clientY, t0: performance.now(), charging: false, k: 0 };
  });
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      cursor.move(e.clientX, e.clientY, inForest(e.target) || !!hold?.charging);
      stage?.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    } else if (hold?.charging && e.pointerId === hold.id) cursor.move(e.clientX, e.clientY, true, true);
    if (hold && e.pointerId === hold.id && !hold.charging && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 10) hold = null;
  }, { passive: true });
  const end = (e, cancel) => {
    if (!hold || e.pointerId !== hold.id) return;
    const h = hold;
    hold = null;
    holding = false;
    cursor.charge(null);
    if (e.pointerType !== 'mouse') cursor.hide();
    if (h.charging) voiceOut(h.k);
    else if (!cancel) stoneAt(e.clientX, e.clientY);
  };
  document.addEventListener('pointerup', (e) => end(e, false));
  document.addEventListener('pointercancel', (e) => end(e, true));
  document.addEventListener('mouseleave', () => cursor.hide());
  // a long press on a phone is the voice, not a menu
  document.addEventListener('contextmenu', (e) => { if (inForest(e.target)) e.preventDefault(); });
}

function holdTick(now) {
  if (!hold) return;
  const s = (now - hold.t0) / 1000;
  if (!hold.charging && s >= HOLD) {
    hold.charging = true;
    holding = true;
    cursor.move(hold.x, hold.y, true, true);
  }
  if (hold.charging) {
    hold.k = clamp01((s - HOLD) / CHARGE);
    cursor.charge(hold.k);
    meter(hold.k);
    readout(hold.k);
  }
}

function stoneAt(x, y) {
  const r = stage?.stone(x, y);
  if (!r) return;
  cursor.ping('stone');
  document.body.classList.add('played');
  tell('stone', t('echo.toastStone'));
}

function voiceOut(k) {
  const r = stage?.voice(k);
  if (!r) return;
  cursor.ping(k >= CFG.SCREAM ? 'scream' : 'voice');
  document.body.classList.add('played');
  readout(k);
  // the meter falls back slowly, the readout stays
  const t0 = performance.now();
  const fall = (now) => {
    if (holding) return;
    const v = k * Math.max(0, 1 - (now - t0) / 900);
    meter(v);
    if (v > 0) requestAnimationFrame(fall);
  };
  requestAnimationFrame(fall);
}

// ---------------- the forest ----------------
let stage = null;
async function bootStage() {
  const canvas = $('#stage');
  try {
    const { Stage } = await import('./stage.js');
    const q = Number(new URLSearchParams(location.search).get('q')) || 0;
    stage = new Stage(canvas, { reduced, onEvent: onStageEvent, audio: audioFor.stage, q });
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    stage.build();
    document.body.classList.add('gl-ready');
    measure();
    scrolled();
  } catch (e) {
    console.warn('[site] the forest could not be drawn', e);
    stage = null;
    document.body.classList.add('no-gl');
    $('#noGl').hidden = false;
  }
}

// ---------------- scroll ----------------
let layout = [], vh = innerHeight, section = 'top', shiftP = 0, dirty = true;
function measure() {
  vh = innerHeight;
  const y = scrollY;
  layout = ORDER.map((id) => {
    const el = document.getElementById(id);
    const r = el.getBoundingClientRect();
    return { id, el, top: r.top + y, height: r.height };
  });
  dirty = true;
}

function scrolled() {
  dirty = false;
  const y = scrollY;
  const u = trackU(layout, y, vh);
  const sh = layout.find((s) => s.id === 'shift');
  shiftP = sh ? pinProgress(sh.top, sh.height, y, vh) : 0;
  let cur = 'top';
  for (const s of layout) if (s.top <= y + vh * 0.5) cur = s.id;
  const at = layout.find((s) => s.id === 'atlas');
  const dim = at ? clamp01((y + vh - at.top) / (vh * 0.85)) : 0;
  if (cur !== section) {
    section = cur;
    for (const a of $$('[data-nav]')) a.classList.toggle('on', a.dataset.nav === cur);
    for (const a of $$('[data-rail]')) a.classList.toggle('on', a.dataset.rail === cur);
    document.body.dataset.sec = cur;
    lastShift = '';
    if (cur !== 'shift') $('#railClock').textContent = ''; // a jump past the shift never calls shiftUI again
  }
  stage?.setScroll({ u, shiftP, section: cur, dim });
  if (cur === 'shift' || Math.abs(y - (sh?.top || 0)) < vh * 1.5) shiftUI(shiftP);
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  $('#rail').style.setProperty('--p', (y / max).toFixed(4));
  $('#nav').classList.toggle('scrolled', y > 24);
  document.body.classList.toggle('in-book', dim > 0.6);
}

// ---------------- the sections that wake up later ----------------
let atlas = null, ballot = null, album = null, patches = null;
const lazy = {
  atlas: async (el) => {
    const { AtlasTheatre } = await import('./atlas.js');
    atlas = new AtlasTheatre(el, { audio: audioFor.explicit, reduced, onToast: toast });
    return atlas;
  },
  vote: async (el) => {
    const { Ballot } = await import('./votes.js');
    ballot = new Ballot(el, { audio: audioFor.explicit, reduced, onToast: toast });
    return ballot;
  },
  album: async (el) => {
    const { Album } = await import('./album.js');
    album = new Album(el, { reduced, onToast: toast });
    return album;
  },
  patches: async (el) => {
    const m = patchesMod || (patchesMod = await import('./patches.js'));
    patches = new m.Patches(el, { reduced, onToast: toast });
    return patches;
  },
};
const mods = {};
function wakeSection(id) {
  if (mods[id]) return mods[id];
  const el = document.querySelector(`[data-mount="${id}"]`);
  mods[id] = lazy[id](el).then((m) => {
    el.classList.add('ready');
    measure();
    if (seen.has(id)) m.setVisible(true);
    return m;
  }).catch((e) => {
    console.warn(`[site] ${id}`, e);
    el.classList.add('failed');
  });
  return mods[id];
}
const seen = new Set();
function watchSections() {
  const near = new IntersectionObserver((ents) => {
    for (const e of ents) if (e.isIntersecting) wakeSection(e.target.dataset.mount);
  }, { rootMargin: '120% 0px 120% 0px' });
  const vis = new IntersectionObserver((ents) => {
    for (const e of ents) {
      const id = e.target.dataset.mount;
      if (e.isIntersecting) seen.add(id);
      else seen.delete(id);
      ({ atlas, vote: ballot, album, patches })[id]?.setVisible(e.isIntersecting);
    }
  }, { rootMargin: '10% 0px 10% 0px' });
  for (const el of $$('[data-mount]')) {
    near.observe(el);
    vis.observe(el);
  }
}

// a link straight into the atlas or a patch: wake it now and go there once it has its height
async function deepLink() {
  const h = location.hash;
  if (/^#atlas-/.test(h)) {
    await wakeSection('atlas');
    requestAnimationFrame(() => $('#atlas').scrollIntoView({ block: 'start' }));
  } else if (/^#v\d/.test(h)) {
    await wakeSection('patches');
  } else if (h === '#album') { // (4.0: the game's results screen links here once a film is saved)
    await wakeSection('album');
    requestAnimationFrame(() => $('#album').scrollIntoView({ block: 'start' }));
  }
}

// ---------------- the nav ----------------
function bindNav() {
  const nav = $('#nav');
  const burger = $('#burger');
  const close = () => {
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', t('nav.menu'));
  };
  burger.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? t('nav.close') : t('nav.menu'));
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('.nav-links a')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  $('#langBtn').addEventListener('click', () => {
    setLang(getLang() === 'ru' ? 'en' : 'ru');
    saveLang(getLang());
    applyLang();
    measure();
  });
  $('#soundBtn').addEventListener('click', async () => {
    await loadAudio();
    if (soundOn && engine?.ready) setSound(false);
    else {
      setSound(true);
      wake(true);
    }
  });
  $('#micBtn').addEventListener('click', micToggle);
  // the sections the atlas / patches deep links point into are tall: make the jump land where it should
  for (const a of $$('a[href^="#"]')) {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', id === 'top' ? location.pathname : `#${id}`); } catch { /* fine */ }
    });
  }
}

// ---------------- the loop ----------------
let last = performance.now();
let T = 0;
function loop(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  T += dt;
  if (dirty) scrolled();
  holdTick(now);
  micTick(dt, T);
  if (stage?.ready) stage.frame(dt);
  atlas?.frame(dt);
  ballot?.frame(dt);
  if (engine?.ready && soundOn) {
    const inForest = FOREST.includes(section);
    const woke = section === 'shift' && shiftAt(shiftP).woke;
    const lvl = inForest ? (woke ? 0.7 : 0.55) : 0.14;
    if (lvl !== ambLevel && engine.ambOn) {
      ambLevel = lvl;
      engine.setAmbience(lvl, woke ? 0.8 : section === 'shift' ? 0.25 : 0.1);
    }
    if (inForest) engine.update(0, section === 'shift' ? shiftP : 0.15);
  }
  requestAnimationFrame(loop);
}

// ---------------- boot ----------------
function boot() {
  for (const el of $$('[data-echo]')) el.setAttribute('data-reveal', '');
  applyLang();
  bindNav();
  bindInput();
  measure();
  scrolled();
  reveals(document, reduced);
  watchSections();
  addEventListener('scroll', () => { dirty = true; }, { passive: true });
  let rw = innerWidth, rh = innerHeight, rt = 0;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      // a phone's address bar sliding away is not a new screen
      const big = Math.abs(innerWidth - rw) > 1 || !coarse || Math.abs(innerHeight - rh) > 160;
      rw = innerWidth;
      rh = innerHeight;
      if (big) stage?.resize();
      measure();
    }, 120);
  });
  if ('ResizeObserver' in window) new ResizeObserver(() => measure()).observe($('main'));
  document.fonts?.ready?.then(() => measure());
  requestAnimationFrame(loop);
  bootStage();
  deepLink();
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 400));
  idle(() => {
    release();
    loadAudio();
    import('../src/ui/atlasData.js').then((m) => { atlasData = m; buildGens(); lastGens = ''; shiftUI(shiftP); }).catch(() => {});
    (patchesMod ? Promise.resolve(patchesMod) : import('./patches.js')).then((m) => { patchesMod = m; versionLine(); }).catch(() => {});
  });
}

// (for the page's own tests and for poking at it from the console, like the game's window.__hush)
window.__hushSite = {
  get stage() { return stage; },
  get atlas() { return atlas; },
  get ballot() { return ballot; },
  get album() { return album; },
  get patches() { return patches; },
  get engine() { return engine; },
};

boot();
