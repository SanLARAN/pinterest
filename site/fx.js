// Small things the whole page shares: escaping, the scramble on names, blocks that surface as they scroll in, the
// headings that arrive letter by letter like an echo, the sonar cursor over the forest, and toasts.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

// raw text with every case-insensitive match of q wrapped in <mark> (both halves escaped)
export function highlight(text, q) {
  text = String(text ?? '');
  if (!q) return esc(text);
  const lo = text.toLowerCase(), ql = q.toLowerCase();
  let out = '', at = 0, i;
  while ((i = lo.indexOf(ql, at)) !== -1) {
    out += esc(text.slice(at, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>';
    at = i + q.length;
  }
  return out + esc(text.slice(at));
}

const CYR = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЭЮЯ';
const LAT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SIGNS = '0123456789#%&/<>*+=';

// the text resolves left to right out of flickering letters (its own alphabet, so the width barely moves)
export function scramble(el, text, ms = 500) {
  const chars = [...String(text)];
  const pool = (/[\u0400-\u04ff]/.test(text) ? CYR : LAT) + SIGNS;
  const lower = text === text.toLowerCase();
  const t0 = performance.now();
  cancelAnimationFrame(el._scr || 0);
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    const n = Math.floor(k * k * chars.length);
    let s = '';
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (i < n || /\s|[«»—.,:;!?()-]/.test(c)) s += c;
      else {
        const g = pool[(Math.random() * pool.length) | 0];
        s += lower ? g.toLowerCase() : g;
      }
    }
    el.textContent = s;
    if (k < 1) el._scr = requestAnimationFrame(step);
    else el.textContent = text;
  };
  el._scr = requestAnimationFrame(step);
}

// a heading as letters (kept whole words, so lines still break between them); screen readers get the plain text
export function echoText(el, text) {
  el.setAttribute('aria-label', text);
  let i = 0;
  el.innerHTML = String(text).split(/(\s+)/).map((w) => {
    if (/^\s+$/.test(w)) return ' ';
    if (!w) return '';
    return `<span class="w" aria-hidden="true">${[...w].map((c) => `<span class="ch" style="--i:${i++}">${esc(c)}</span>`).join('')}</span>`;
  }).join('');
  el.style.setProperty('--n', i);
}

// [data-reveal] blocks surface once they come into view; children with --i stagger
let io = null;
export function reveals(root = document, reduced = false) {
  const els = root.querySelectorAll('[data-reveal]:not(.shown)');
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('shown'));
    return;
  }
  if (!io) {
    io = new IntersectionObserver((ents) => {
      for (const e of ents) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('shown');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
  }
  els.forEach((e) => io.observe(e));
}

// ---------------- toasts ----------------
let toastBox = null;
export function toast(msg, { kind = '', ms = 2600 } = {}) {
  if (!toastBox) {
    toastBox = document.createElement('div');
    toastBox.className = 'toasts';
    toastBox.setAttribute('role', 'status');
    toastBox.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastBox);
  }
  // the same line twice in a row just stays a little longer
  const last = toastBox.lastElementChild;
  if (last && last.dataset.msg === msg && !last.classList.contains('out')) {
    clearTimeout(last._t);
    last._t = setTimeout(() => drop(last), ms);
    return;
  }
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.dataset.msg = msg;
  el.textContent = msg;
  toastBox.appendChild(el);
  while (toastBox.childElementCount > 3) toastBox.firstElementChild.remove();
  requestAnimationFrame(() => el.classList.add('in'));
  el._t = setTimeout(() => drop(el), ms);
}
function drop(el) {
  el.classList.add('out');
  setTimeout(() => el.remove(), 400);
}

// ---------------- the sonar cursor ----------------
// Over the forest (and only on a mouse): a dot where the stone would go, a ring that charges while you hold, the
// three marks of the voice on it (whisper · talk · scream), and a word under it.
export class SonarCursor {
  constructor({ marks = [], words = () => [] } = {}) {
    const el = document.createElement('div');
    el.className = 'sonar-cursor';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<svg viewBox="0 0 64 64"><circle class="trk" cx="32" cy="32" r="26"/><circle class="chg" cx="32" cy="32" r="26" pathLength="100"/>${marks.map((m) => {
      const a = (m * 360 - 90) * Math.PI / 180;
      return `<line class="mk" x1="${32 + Math.cos(a) * 22}" y1="${32 + Math.sin(a) * 22}" x2="${32 + Math.cos(a) * 30}" y2="${32 + Math.sin(a) * 30}"/>`;
    }).join('')}</svg><i class="dot"></i><b class="word"></b>`;
    document.body.appendChild(el);
    this.el = el;
    this.chg = el.querySelector('.chg');
    this.word = el.querySelector('.word');
    this.words = words;
    this.marks = marks;
    this.on = false;
    this.fine = matchMedia('(pointer: fine)').matches;
  }

  // force: a finger holding the voice on a touch screen (there is no cursor there otherwise)
  move(x, y, inForest, force = false) {
    if (!this.fine && !force) return;
    this.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (inForest !== this.on) {
      this.on = inForest;
      this.el.classList.toggle('on', inForest);
      document.documentElement.classList.toggle('in-forest', inForest);
    }
  }

  // 0..1 while holding (null: let go)
  charge(k) {
    if (k == null) {
      this.el.classList.remove('charging');
      this.chg.style.strokeDashoffset = 100;
      this.word.textContent = '';
      return;
    }
    this.el.classList.add('charging');
    this.chg.style.strokeDashoffset = String(100 - k * 100);
    const w = this.words();
    let label = w[0] || '';
    for (let i = 0; i < this.marks.length; i++) if (k >= this.marks[i]) label = w[i] || label;
    this.word.textContent = label;
    this.el.classList.toggle('loud', k >= this.marks[this.marks.length - 1]);
  }

  ping(kind = '') {
    const r = document.createElement('i');
    r.className = `ring ${kind}`;
    this.el.appendChild(r);
    setTimeout(() => r.remove(), 900);
  }

  hide() {
    this.move(-100, -100, false);
  }
}
