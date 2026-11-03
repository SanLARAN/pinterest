// What's new: every patch note the game has ever shipped (src/ui/news.js — the same list the game shows in its
// footer), newest first. A version rail grouped by major line with a scrollspy, a search that marks what it found,
// filters by line, cards that open their whole list, links to a single patch (#v3.1r), and a mark on what came out
// since you last opened the game's own notes (hush.news.v1 — same origin, same localStorage).
import { NEWS } from '../src/ui/news.js';
import { t, getLang, plural } from './i18n.js';
import { esc, highlight } from './fx.js';

const PAGE = 8;
const SHOWN = 2; // items on a folded card

export function majorOf(v) {
  const m = /^(\d+)\.(\d+)/.exec(String(v));
  if (!m) return '1.x';
  return +m[1] >= 2 ? `${m[1]}.${m[2]}` : '1.x';
}

export function majors(list = NEWS) {
  const out = [];
  for (const n of list) {
    const k = majorOf(n.v);
    const g = out.find((x) => x.id === k);
    if (g) g.n++;
    else out.push({ id: k, n: 1 });
  }
  return out;
}

// days between the first and the last patch, both counted
export function spanDays(list = NEWS) {
  const ts = list.map((n) => Date.parse(`${n.date}T12:00:00Z`)).filter(Number.isFinite);
  if (!ts.length) return 0;
  return Math.round((Math.max(...ts) - Math.min(...ts)) / 864e5) + 1;
}

function seenIndex() {
  try {
    const st = JSON.parse(localStorage.getItem('hush.news.v1') || 'null');
    if (!st || !st.seen) return -1;
    return NEWS.findIndex((n) => n.v === st.seen);
  } catch {
    return -1;
  }
}

function dateText(d, lang) {
  const t0 = Date.parse(`${d}T12:00:00Z`);
  if (!Number.isFinite(t0)) return d;
  try {
    return new Date(t0).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(/\s*г\.$/, '');
  } catch {
    return d;
  }
}

function short(d, lang) {
  const [, m, day] = String(d).split('-');
  return lang === 'ru' ? `${day}.${m}` : `${day}/${m}`;
}

export class Patches {
  constructor(root, { reduced = false, onToast = () => {} } = {}) {
    this.root = root;
    this.reduced = reduced;
    this.onToast = onToast;
    this.q = '';
    this.major = 'all';
    this.limit = PAGE;
    this.open = new Set();
    this.seen = seenIndex();
    this.active = NEWS[0].v;
    this.visible = false;
    this._build();
    this._bind();
    this.render();
    const h = location.hash.match(/^#v(\d[\w.]*)$/);
    if (h) requestAnimationFrame(() => this.go(h[1]));
  }

  static facts() {
    return { n: NEWS.length, days: spanDays(), latest: NEWS[0] };
  }

  _build() {
    this.root.innerHTML = `
      <div class="pt-tools">
        <label class="pt-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>
          <input type="search" autocomplete="off" spellcheck="false">
          <output class="pt-found" aria-live="polite"></output>
          <kbd aria-hidden="true">/</kbd>
          <button type="button" class="pt-clear" hidden>×</button>
        </label>
        <div class="pt-chips" role="group"></div>
      </div>
      <div class="pt-body">
        <nav class="pt-rail"></nav>
        <div class="pt-feed">
          <ol class="pt-list"></ol>
          <p class="pt-none" hidden></p>
          <div class="pt-more-row"><button class="btn pt-showmore" type="button"></button></div>
        </div>
      </div>`;
    this.input = this.root.querySelector('.pt-search input');
    this.found = this.root.querySelector('.pt-found');
    this.clearBtn = this.root.querySelector('.pt-clear');
    this.chips = this.root.querySelector('.pt-chips');
    this.rail = this.root.querySelector('.pt-rail');
    this.list = this.root.querySelector('.pt-list');
    this.none = this.root.querySelector('.pt-none');
    this.moreBtn = this.root.querySelector('.pt-showmore');
  }

  _bind() {
    let qt = 0;
    this.input.addEventListener('input', () => {
      clearTimeout(qt);
      qt = setTimeout(() => {
        this.q = this.input.value.trim();
        this.limit = PAGE;
        this.render();
      }, 120);
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.input.value = '';
        this.q = '';
        this.render();
        this.input.blur();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || !this.visible || e.target.closest?.('input, textarea')) return;
      e.preventDefault();
      this.input.focus();
    });
    this.root.addEventListener('click', (e) => {
      const b = e.target.closest('button, a');
      if (!b || !this.root.contains(b)) return;
      if (b.dataset.major) {
        this.major = b.dataset.major;
        this.limit = PAGE;
        this.render();
      } else if (b.dataset.more) {
        const v = b.dataset.more;
        if (this.open.has(v)) this.open.delete(v);
        else this.open.add(v);
        this._card(v);
      } else if (b.dataset.copy) {
        this.copy(b.dataset.copy);
      } else if (b.dataset.go) {
        e.preventDefault();
        this.go(b.dataset.go);
      } else if (b === this.clearBtn) {
        this.input.value = '';
        this.q = '';
        this.render();
        this.input.focus();
      } else if (b === this.moreBtn) {
        this.limit += PAGE * 2;
        this.render(true);
      }
    });
  }

  // what passes the filters, in order
  _items() {
    const L = getLang();
    const q = this.q.toLowerCase();
    return NEWS.filter((n) => {
      if (this.major !== 'all' && majorOf(n.v) !== this.major) return false;
      if (!q) return true;
      const x = n[L] || n.ru;
      return n.v.toLowerCase().includes(q) || x.title.toLowerCase().includes(q) || x.items.some((s) => s.toLowerCase().includes(q));
    });
  }

  render(keep = false) {
    const L = getLang();
    this.input.placeholder = t('patches.search');
    this.input.setAttribute('aria-label', t('patches.search'));
    // the chips: all, then every line
    const groups = majors();
    this.chips.innerHTML = [{ id: 'all', n: NEWS.length, label: t('patches.all') }, ...groups.map((g) => ({ ...g, label: g.id }))]
      .map((g) => `<button type="button" class="chip${g.id === this.major ? ' on' : ''}" data-major="${g.id}" aria-pressed="${g.id === this.major}">${esc(g.label)}<small>${g.n}</small></button>`).join('');
    const items = this._items();
    this.shown = this.q ? items : items.slice(0, this.limit);
    const first = keep ? this.list.childElementCount : 0;
    this.list.innerHTML = this.shown.map((n, i) => this._cardHtml(n, L, Math.max(0, i - first))).join('');
    this.none.hidden = items.length > 0;
    this.found.textContent = this.q ? plural(items.length, t('patches.found'), L) : '';
    this.clearBtn.hidden = !this.q;
    this.clearBtn.setAttribute('aria-label', t('patches.clear'));
    this.none.textContent = t('patches.none');
    this.moreBtn.hidden = this.q || this.shown.length >= items.length;
    this.moreBtn.textContent = `${t('patches.showMore')} · ${items.length - this.shown.length}`;
    this._rail(L, this.q ? new Set(items.map((n) => n.v)) : null);
    this._spy();
  }

  _cardHtml(n, L, k) {
    const x = n[L] || n.ru;
    const i = NEWS.indexOf(n);
    const q = this.q;
    const fresh = this.seen > 0 && i < this.seen;
    const all = !!q || this.open.has(n.v);
    const items = all ? x.items : x.items.slice(0, SHOWN);
    const rest = x.items.length - SHOWN;
    return `
      <li class="pt-card${fresh ? ' fresh' : ''}${i === 0 ? ' latest' : ''}${this.reduced ? '' : ' scan'}" id="v${esc(n.v)}" data-v="${esc(n.v)}" style="--k:${Math.min(k, 8)}">
        <header class="pt-h">
          <a class="pt-v" href="#v${esc(n.v)}" data-go="${esc(n.v)}">${highlight(n.v, q)}</a>
          <time datetime="${esc(n.date)}">${esc(dateText(n.date, L))}</time>
          ${i === 0 ? `<span class="pt-tag">${esc(t('patches.latest'))}</span>` : ''}
          ${fresh ? `<span class="pt-tag fresh">${esc(t('patches.fresh'))}</span>` : ''}
          <button type="button" class="pt-copy" data-copy="${esc(n.v)}" title="${esc(t('patches.link'))}" aria-label="${esc(t('patches.link'))} ${esc(n.v)}">#</button>
        </header>
        <h3 class="pt-title">${highlight(x.title, q)}</h3>
        <ul class="pt-items">${items.map((s) => `<li>${highlight(s, q)}</li>`).join('')}</ul>
        ${!q && rest > 0 ? `<button type="button" class="pt-more" data-more="${esc(n.v)}" aria-expanded="${all}">${esc(all ? t('patches.less') : t('patches.more', { n: rest }))}</button>` : ''}
      </li>`;
  }

  _card(v) {
    const el = this.list.querySelector(`[data-v="${CSS.escape(v)}"]`);
    const n = NEWS.find((x) => x.v === v);
    if (!el || !n) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = this._cardHtml(n, getLang(), 0);
    const fresh = tmp.firstElementChild;
    fresh.classList.remove('scan');
    el.replaceWith(fresh);
  }

  // hits: the versions a search found (the rest of the rail fades, so it still shows where they sit in the history)
  _rail(L, hits = null) {
    const groups = majors();
    this.rail.setAttribute('aria-label', t('patches.title'));
    this.rail.innerHTML = groups.map((g) => {
      const vs = NEWS.filter((n) => majorOf(n.v) === g.id);
      const dim = (this.major !== 'all' && this.major !== g.id) || (hits && !vs.some((n) => hits.has(n.v)));
      return `<div class="pt-grp${dim ? ' dim' : ''}"><b>${esc(g.id)}<small>${esc(t('patches.count', { n: g.n }))}</small></b><ol>${vs.map((n) => `<li${hits && !hits.has(n.v) ? ' class="miss"' : ''}><a href="#v${esc(n.v)}" data-go="${esc(n.v)}" data-rv="${esc(n.v)}"${n.v === this.active ? ' class="on"' : ''}><span>${esc(n.v)}</span><small>${esc(short(n.date, L))}</small></a></li>`).join('')}</ol></div>`;
    }).join('');
  }

  // open a version even if it is past the page or filtered away, then bring it up
  go(v) {
    const i = NEWS.findIndex((n) => n.v === v);
    if (i < 0) return;
    let items = this._items();
    if (!items.includes(NEWS[i])) {
      this.q = '';
      this.input.value = '';
      this.major = 'all';
      items = this._items();
    }
    const k = items.indexOf(NEWS[i]);
    if (k >= this.limit) this.limit = k + 1;
    this.open.add(v);
    this.render();
    const el = this.list.querySelector(`[data-v="${CSS.escape(v)}"]`);
    if (el) {
      el.scrollIntoView({ block: 'start', behavior: this.reduced ? 'auto' : 'smooth' });
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    }
    try { history.replaceState(null, '', `#v${v}`); } catch { /* fine */ }
  }

  copy(v) {
    const url = `${location.origin}${location.pathname}#v${v}`;
    const done = () => this.onToast(`${t('patches.copied')} · ${v}`);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, done);
    else done();
  }

  // the scrollspy: the card under the upper third of the screen lights its version on the rail
  _spy() {
    this.io?.disconnect();
    if (!('IntersectionObserver' in window)) return;
    this.io = new IntersectionObserver((ents) => {
      for (const e of ents) if (e.isIntersecting) this._activate(e.target.dataset.v);
    }, { rootMargin: '-28% 0px -64% 0px' });
    for (const c of this.list.children) this.io.observe(c);
  }

  _activate(v) {
    if (!v || v === this.active) return;
    this.active = v;
    for (const a of this.rail.querySelectorAll('a.on')) a.classList.remove('on');
    const a = this.rail.querySelector(`a[data-rv="${CSS.escape(v)}"]`);
    if (!a) return;
    a.classList.add('on');
    // keep it in view inside the rail without moving the page
    const r = this.rail;
    const top = a.offsetTop - r.clientHeight * 0.4;
    if (r.scrollHeight > r.clientHeight) r.scrollTo({ top, behavior: this.reduced ? 'auto' : 'smooth' });
  }

  setVisible(v) {
    this.visible = v;
  }

  refreshLang() {
    this.render();
  }

  // the section's lead: "73 updates in 20 days"
  static lead() {
    const n = NEWS.length, d = spanDays();
    return t('patches.lead', { n: plural(n, t('patches.updates')), days: plural(d, t('patches.days')) });
  }
}
