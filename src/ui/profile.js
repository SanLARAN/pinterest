// 3.0x: the full-screen profile — a field journal's «личное дело». Opened from your own nick (the corner of the
// title screen, your row in the lobby) or a friend's (the friends list, their row in the lobby). Behind it, half
// seen, the banner its owner chose: a PNG, JPG, GIF or a silent MP4 loop, up to 20 MB.
//
// Who sees what is the server's rule (hush_profile_view): yourself and your friends. A player in your room who is
// not your friend gets their name and an «add to friends» button. Without an account your own profile still
// works, from this machine: the stats are local, and the banner is kept in this browser (IndexedDB).
//
// Motion: a video banner does not autoplay under prefers-reduced-motion and a GIF is frozen to its first frame.
// (3.1e: the «pause the backdrop» button is gone — the author did not want it.) The banner never carries sound.
import { t } from '../core/i18n.js';
import { atlasLog, getScores } from '../core/storage.js';
import { wallet } from '../game/wallet.js';
import { strayMet } from '../core/strayLog.js';
import { myFit } from '../game/outfit.js';
import { myName } from '../net/coop.js';
import { buildCard, cleanCard, cardForest, cardCreatures } from '../core/profileCard.js';
import { BANNER_ACCEPT, bannerKind, bannerProblem } from '../cloud/banner.js';
import { cloudError } from '../cloud/words.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const reducedMotion = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// your own card, from what this machine keeps
export function myCard() {
  return buildCard({ atlas: atlasLog, scores: getScores(), wallet, strayMet: strayMet(), fit: myFit() });
}

// ---------------- the guest's banner, kept in this browser ----------------
const DB = 'hush-media', STORE = 'banner';
function idb() {
  return new Promise((res, rej) => {
    if (!globalThis.indexedDB) { rej(new Error('no_idb')); return; }
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function localBanner(set) {
  try {
    const db = await idb();
    return await new Promise((res, rej) => {
      const tx = db.transaction(STORE, set === undefined ? 'readonly' : 'readwrite');
      const st = tx.objectStore(STORE);
      const q = set === undefined ? st.get('self') : set === null ? st.delete('self') : st.put(set, 'self');
      q.onsuccess = () => res(set === undefined ? q.result || null : true);
      q.onerror = () => rej(q.error);
    });
  } catch { return null; }
}

export class ProfileScreen {
  // portrait(fit, canvas) draws a survivor; onAccount opens the account panel; onJoin(id) joins a friend's room
  constructor({ cloud, portrait = () => false, onAccount = () => {}, onJoin = () => {}, onInvite = null, canOpen = () => true }) {
    this.cloud = cloud;
    this.portrait = portrait;
    this.onAccount = onAccount;
    this.onJoin = onJoin;
    this.onInvite = onInvite;
    this.canOpen = canOpen;
    this.opened = false;
    this.seq = 0;
    this.url = null; // an object URL this screen made (revoked on close)
    this.paused = false;
    const el = (this.el = document.createElement('section'));
    el.id = 'profileScreen';
    el.className = 'profile-screen';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'pfName');
    el.innerHTML = `<div class="pf-banner" aria-hidden="true"></div><div class="pf-scrim" aria-hidden="true"></div>
      <div class="pf-sheet"><header class="pf-head"><canvas class="pf-portrait" width="256" height="256" aria-hidden="true"></canvas>
      <div class="pf-who"><p class="pf-kicker"></p><h1 id="pfName" class="pf-name"></h1><p class="pf-handle"></p></div>
      <button type="button" class="pf-close" data-pf="close"></button></header>
      <div class="pf-body"></div>
      <footer class="pf-actions"></footer>
      <p class="pf-status" role="status" aria-live="polite"></p></div>
      <input type="file" class="pf-file" accept="${BANNER_ACCEPT}" hidden>`;
    document.body.append(el);
    this.file = el.querySelector('.pf-file');
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-pf]'); if (b && !b.disabled) this.action(b.dataset.pf, b.dataset.id); });
    el.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.code === 'Escape') { e.preventDefault(); this.close(); return; }
      if (e.code === 'Tab') { // the focus stays inside the profile
        const a = [...el.querySelectorAll('button')].filter((x) => !x.disabled && x.getClientRects().length);
        if (!a.length) return;
        const i = a.indexOf(document.activeElement);
        e.preventDefault();
        a[(i + (e.shiftKey ? -1 : 1) + a.length) % a.length].focus();
      }
    });
    el.addEventListener('keyup', (e) => e.stopPropagation());
    this.file.addEventListener('change', () => { const f = this.file.files && this.file.files[0]; this.file.value = ''; if (f) this.setBanner(f); });
  }

  isOpen() { return this.opened; }

  // who: { self: true } or { id: cloud user id, name, handle } — a lobby player may come with a name and no id
  open(who = { self: true }) {
    if (!this.canOpen()) return;
    this.previous = document.activeElement;
    this.who = who;
    this.opened = true;
    this.el.hidden = false;
    document.body.classList.add('profile-open');
    this.paused = reducedMotion();
    this.message = '';
    this.load();
    requestAnimationFrame(() => this.el.querySelector('.pf-close')?.focus({ preventScroll: true }));
  }

  close() {
    if (!this.opened) return;
    this.opened = false;
    this.seq++;
    this.el.hidden = true;
    document.body.classList.remove('profile-open');
    this.clearBanner();
    (this.previous?.isConnected ? this.previous : null)?.focus?.({ preventScroll: true });
  }

  get self() { return !!this.who?.self || (!!this.who?.id && this.who.id === this.cloud.user?.id); }

  // gather the profile: your own from this machine (+ the banner from the cloud or this browser), a friend's from
  // the server. A stranger gets what the lobby knows.
  async load() {
    const seq = ++this.seq;
    const c = this.cloud;
    this.data = null;
    this.state = 'loading';
    this.render();
    try {
      if (this.self) {
        const card = myCard();
        let view = null;
        if (c.user && c.ready) view = await c.profileView(c.user.id).catch(() => null);
        if (seq !== this.seq) return;
        this.data = { self: true, name: view?.display_name || myName(), handle: view?.handle || c.profile?.handle || '', since: view?.created_at || null, card, banner: view?.banner || null, kind: view?.banner_kind || null };
        this.state = 'ready';
        this.render();
        if (this.data.banner) this.showBanner(await c.bannerUrl(this.data.banner).catch(() => null), this.data.kind, seq);
        else { const local = await localBanner(); if (seq === this.seq && local?.blob) this.showBanner(URL.createObjectURL(local.blob), local.kind, seq, true); }
        return;
      }
      if (!this.who.id || !c.user) { this.data = { stranger: true, name: this.who.name || '???' }; this.state = 'ready'; this.render(); return; }
      const view = await c.profileView(this.who.id);
      if (seq !== this.seq) return;
      this.data = { id: view.id, name: view.display_name, handle: view.handle, since: view.created_at, card: cleanCard(view.card), banner: view.banner, kind: view.banner_kind };
      this.state = 'ready';
      this.render();
      if (view.banner) this.showBanner(await c.bannerUrl(view.banner).catch(() => null), view.banner_kind, seq);
    } catch (e) {
      if (seq !== this.seq) return;
      // not a friend (or the server cannot be reached): what the lobby knows, and a way to become friends
      this.data = { stranger: true, name: this.who?.name || '???', id: this.who?.id || null };
      this.state = 'ready';
      this.render();
    }
  }

  // ---------------- the banner ----------------
  showBanner(url, kind, seq, own = false) {
    if (!url || seq !== this.seq || !this.opened) return;
    this.clearBanner();
    if (own) this.url = url;
    const box = this.el.querySelector('.pf-banner');
    let media;
    if (kind === 'video') {
      media = document.createElement('video');
      Object.assign(media, { src: url, muted: true, loop: true, playsInline: true, autoplay: !this.paused, preload: 'auto' });
      media.setAttribute('muted', '');
      media.setAttribute('playsinline', '');
      media.addEventListener('loadeddata', () => { box.classList.add('on'); if (this.paused) media.pause(); }, { once: true });
    } else {
      media = document.createElement('img');
      media.alt = '';
      media.decoding = 'async';
      media.addEventListener('load', () => { box.classList.add('on'); if (this.paused) this.freezeGif(media); }, { once: true });
      media.src = url;
    }
    box.append(media);
    this.media = media;
    this.renderActions();
  }

  // a GIF cannot be paused: its first frame goes on a canvas instead (reduced motion)
  freezeGif(img) {
    if (!img || img.tagName !== 'IMG' || this.el.querySelector('.pf-frozen')) return;
    try {
      const cv = document.createElement('canvas');
      cv.width = img.naturalWidth || 1;
      cv.height = img.naturalHeight || 1;
      cv.getContext('2d').drawImage(img, 0, 0);
      cv.className = 'pf-frozen';
      img.after(cv);
      img.hidden = true;
    } catch { /* (a frame we may not read: leave it moving) */ }
  }

  clearBanner() {
    const box = this.el.querySelector('.pf-banner');
    box.classList.remove('on');
    box.replaceChildren();
    this.media = null;
    if (this.url) { URL.revokeObjectURL(this.url); this.url = null; }
  }

  async setBanner(file) {
    const problem = bannerProblem(file);
    if (problem) { this.say(t('pfErr')[problem] || t('pfErr').banner_type, true); return; }
    const kind = bannerKind(file);
    const seq = this.seq;
    this.busy = true;
    this.say(t('pfUploading'));
    try {
      const c = this.cloud;
      if (c.user && c.ready) {
        const r = await c.uploadBanner(file);
        if (this.data) { this.data.banner = r.path; this.data.kind = r.kind; }
        await localBanner(null);
        this.say(t('pfSaved'));
      } else {
        await localBanner({ blob: file, kind });
        this.say(t('pfSavedLocal'));
      }
      this.showBanner(URL.createObjectURL(file), kind, seq, true);
    } catch (e) {
      this.say(`${t('pfErr').upload} ${cloudError(e) || ''}`.trim(), true);
    } finally {
      this.busy = false;
      this.renderActions();
    }
  }

  async removeBanner() {
    this.busy = true;
    try {
      if (this.cloud.user && this.cloud.ready && this.data?.banner) await this.cloud.clearBanner();
      await localBanner(null);
      if (this.data) { this.data.banner = null; this.data.kind = null; }
      this.clearBanner();
      this.say(t('pfRemoved'));
    } catch (e) {
      this.say(`${t('pfErr').upload} ${cloudError(e) || ''}`.trim(), true);
    } finally {
      this.busy = false;
      this.renderActions();
    }
  }

  say(text, bad = false) {
    this.message = text;
    const s = this.el.querySelector('.pf-status');
    s.textContent = text;
    s.classList.toggle('bad', bad);
  }

  async action(a, id) {
    if (a === 'close') this.close();
    else if (a === 'banner') this.file.click();
    else if (a === 'unbanner') this.removeBanner();
    else if (a === 'account') { this.close(); this.onAccount(); }
    else if (a === 'join') { this.close(); this.onJoin(id); }
    else if (a === 'invite' && this.onInvite) { try { await this.onInvite(id); this.say(t('pfInvited')); } catch (e) { this.say(cloudError(e), true); } }
    else if (a === 'add') {
      try { await this.cloud.friendAction('request', id); this.say(t('pfRequested')); } catch (e) { this.say(cloudError(e), true); }
    }
  }

  // ---------------- drawing ----------------
  presence() {
    const f = this.cloud.social?.friends?.find((x) => x.id === this.data?.id);
    if (!f) return null;
    const fresh = f.seen_at && Date.now() - Date.parse(f.seen_at) < 90000;
    return { state: fresh ? f.state : 'offline', friend: f };
  }

  render() {
    if (!this.opened) return;
    const d = this.data, el = this.el;
    el.querySelector('.pf-close').textContent = '×';
    el.querySelector('.pf-close').setAttribute('aria-label', t('pfClose'));
    el.querySelector('.pf-kicker').textContent = t(d?.self ? 'pfKickerSelf' : 'pfKicker');
    el.querySelector('.pf-name').textContent = d ? d.name : this.who?.name || '…';
    const pres = d && !d.self && !d.stranger ? this.presence() : null;
    const handle = d?.handle ? `@${d.handle}` : '';
    const state = pres ? t('pfPresence')[pres.state] || pres.state : d?.self ? t(this.cloud.user ? 'pfSelfOnline' : 'pfGuest') : '';
    el.querySelector('.pf-handle').textContent = [handle, state].filter(Boolean).join(' · ');
    el.querySelector('.pf-handle').dataset.state = pres?.state || (d?.self ? 'online' : '');
    const cv = el.querySelector('.pf-portrait');
    const fit = d?.self ? myFit() : d?.card?.fit;
    cv.hidden = !fit;
    if (fit) { try { this.portrait(fit, cv); } catch { cv.hidden = true; } }
    el.querySelector('.pf-body').innerHTML = this.state === 'loading' ? `<p class="pf-note">${esc(t('pfLoading'))}</p>` : d?.stranger ? this.strangerHTML(d) : this.statsHTML(d);
    this.renderActions();
  }

  strangerHTML(d) {
    return `<div class="pf-stranger"><p>${esc(t(this.cloud.user ? 'pfNotFriend' : 'pfSignIn'))}</p></div>`;
  }

  statsHTML(d) {
    const c = d.card, T = t('pfStat');
    const big = [[c.nights, T.nights], [c.wins, T.wins], [c.best ? mmss(c.best) : '—', T.best], [c.score || '—', T.score]];
    const since = d.since ? new Date(d.since).toLocaleDateString() : '';
    const killers = Object.entries(c.kills);
    const maxK = Math.max(1, ...killers.map(([, n]) => n));
    const names = t('pfKillers');
    const bar = (k, n) => `<li><span>${esc(names[k] || k)}</span><i style="--w:${Math.round((n / maxK) * 100)}%"></i><b>${n}</b></li>`;
    return `<div class="pf-big">${big.map(([v, l]) => `<div class="pf-tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>
      <div class="pf-grid">
        <section class="pf-block"><h2>${esc(T.grounds)}</h2>
          <p class="pf-row"><span>${esc(t('mapForest'))}</span><b class="pf-flag ${cardForest(c) ? 'yes' : 'no'}">${esc(cardForest(c) ? T.cleared : T.notYet)}</b></p>
          <p class="pf-row"><span>${esc(t('mapBog'))}</span><b>${c.bogWins ? `${c.bogWins} ${esc(T.winsShort)}` : esc(cardForest(c) ? T.open : T.locked)}</b></p>
          <p class="pf-row"><span>${esc(T.escapes)}</span><b>${c.escapes}</b></p></section>
        <section class="pf-block"><h2>${esc(T.work)}</h2>
          <p class="pf-row"><span>${esc(T.gens)}</span><b>${c.gens}</b></p>
          <p class="pf-row"><span>${esc(T.bodies)}</span><b>${c.bodies}</b></p>
          <p class="pf-row"><span>${esc(T.revives)}</span><b>${c.revives}</b></p>
          <p class="pf-row"><span>${esc(T.shards)}</span><b>${c.shards}</b></p></section>
        <section class="pf-block"><h2>${esc(T.things)}</h2>
          <p class="pf-row"><span>${esc(T.met)}</span><b>${c.met} / ${cardCreatures}</b></p>
          <p class="pf-row"><span>${esc(T.stray)}</span><b>${c.stray} / 10</b></p></section>
        <section class="pf-block"><h2>${esc(T.killers)}</h2>${killers.length ? `<ul class="pf-bars">${killers.map(([k, n]) => bar(k, n)).join('')}</ul>` : `<p class="pf-note">${esc(T.noDeaths)}</p>`}</section>
      </div>${since ? `<p class="pf-since">${esc(T.since)} ${esc(since)}</p>` : ''}`;
  }

  renderActions() {
    if (!this.opened) return;
    const d = this.data, b = (a, label, cls = '', id = '') => `<button type="button" data-pf="${a}"${id ? ` data-id="${esc(id)}"` : ''} class="${cls}"${this.busy ? ' disabled' : ''}>${esc(label)}</button>`;
    let html = '';
    if (d?.self) {
      html += b('banner', t('pfBanner'), 'primary');
      if (this.media || d.banner) html += b('unbanner', t('pfUnbanner'));
      html += b('account', t('pfAccount'));
    } else if (d?.stranger) {
      if (this.cloud.user && d.id) html += b('add', t('pfAdd'), 'primary', d.id);
    } else if (d) {
      const pres = this.presence();
      if (pres?.state === 'lobby') html += b('join', t('pfJoin'), 'primary', d.id);
      if (this.onInvite && this.onInvite.available?.()) html += b('invite', t('pfInvite'), '', d.id);
    }
    const foot = this.el.querySelector('.pf-actions');
    if (foot._html !== html) { foot._html = html; foot.innerHTML = html; }
    if (d?.self) this.el.querySelector('.pf-status').textContent = this.message || (this.cloud.user ? t('pfBannerHint') : t('pfBannerHintLocal'));
  }
}
