// What's new: the patch notes, on the main menu's left. The newest night first, older ones folded away.
// A dot on the tab while there's a version you haven't seen; folding the panel is remembered.
import { getLang } from '../core/i18n.js';

const KEY = 'hush.news.v1';

// newest first. date: YYYY-MM-DD
export const NEWS = [
  {
    v: '1.8', date: '2026-10-17',
    ru: {
      title: 'Бойкиссер, магазин и фонарик',
      items: [
        'Скин «Бойкиссер»: кошачья мордочка и пушистое тело — хвост виляет, уши дёргаются, глаза моргают, а в меню он шлёт воздушные поцелуи',
        'Магазин за осколки: «Леший», «Чумной доктор», «Космонавт» и Toyota Sprinter Trueno для гаража (видна всем, если комната твоя)',
        'Осколки теперь деньги: +1 за каждый (в коопе — всей команде), +10 за побег на УАЗе',
        'Фонарик: найди его у разбитой машины, у вышки или у могил. Батарейка садится, запасные лежат в шкафах. Свет видят и твари',
        'Настройка микрофона за 15 секунд: тишина, голос, крик — пороги подстроятся сами',
        'У эха (ПРОБЕЛ) короткая перезарядка — чем громче, тем дольше',
      ],
    },
    en: {
      title: 'Boykisser, the shop and a flashlight',
      items: [
        'The "Boykisser" skin: a cat face and a fluffy body — the tail wags, the ears twitch, the eyes blink, and in the menu it blows you kisses',
        'A shop for shards: Leshy, Plague doctor, Cosmonaut — and a Toyota Sprinter Trueno for the garage (everyone sees it when the room is yours)',
        'Shards are money now: +1 for each (on a co-op night, for the whole team), +10 for getting away in the UAZ',
        'A flashlight: find it by a wrecked car, a tower or the graves. The battery runs down, spares are in the cupboards. Things see the light too',
        'A 15-second microphone setup: silence, voice, a shout — the thresholds tune themselves',
        'The echo (SPACE) has a short cooldown — longer after a loud one',
      ],
    },
  },
  {
    v: '1.7', date: '2026-10-17',
    ru: { title: 'Аниме и голос мёртвых', items: ['Сет «Аниме»: химэ-кат и матроска', 'Погибшие слышат друг друга откуда угодно; слева — кто из них говорит', 'Посмотри вниз — там твоё тело'] },
    en: { title: 'Anime and the voice of the dead', items: ['The Anime set: a hime cut and a sailor fuku', 'The dead hear each other from anywhere; on the left — which of them is talking', 'Look down — your body is there'] },
  },
  {
    v: '1.6', date: '2026-10-17',
    ru: { title: 'Шкафы и шкафандр', items: ['В домах шкафы с вещами', 'Один из них может оказаться шкафандром — друзья тянут тебя за руки в такт'] },
    en: { title: 'Cupboards and the grindrobe', items: ['Cupboards with things in the buildings', 'One of them may be a grindrobe — friends pull you out by the hands, on the beat'] },
  },
  {
    v: '1.5', date: '2026-10-17',
    ru: { title: 'Мед-хижина и побег', items: ['Упавшего можно донести до койки и спасти', 'Светящиеся палочки, тени от стен', 'Площадка лесхоза: собери УАЗ из четырёх деталей и уезжай'] },
    en: { title: 'The first-aid hut and the way out', items: ['Carry a friend who went down to the cot and bring them back', 'Glow sticks, walls that cast shadows', 'The forestry yard: put the UAZ together from four parts and drive away'] },
  },
  {
    v: '1.4', date: '2026-10-17',
    ru: { title: 'Ракетница и гараж', items: ['Ракетница с двумя зарядами', 'Двери избушек открываются', 'Лобби — гараж с УАЗом и местом для каждого'] },
    en: { title: 'A flare gun and the garage', items: ['A flare gun with two shots', 'Cabin doors open', 'The lobby is a garage with the UAZ and a place for everyone'] },
  },
  {
    v: '1.3', date: '2026-10-16',
    ru: { title: 'Атлас и гардероб', items: ['Полевой дневник с живыми 3D-портретами', 'Гардероб: головные уборы, костюмы, цвета'] },
    en: { title: 'The atlas and the wardrobe', items: ['A field journal with live 3D plates', 'A wardrobe: headwear, outfits, colours'] },
  },
  {
    v: '1.2', date: '2026-10-16',
    ru: { title: 'Кооп до 4 игроков', items: ['Голос по близости', 'Громкость каждого друга'] },
    en: { title: 'Co-op for up to 4', items: ['Proximity voice', 'A volume for every friend'] },
  },
  {
    v: '1.1', date: '2026-10-16',
    ru: { title: 'Утро и генераторы', items: ['Утро в лагере, потом темнота', 'Пять генераторов, Наблюдатель и Ревун', 'Темнее, страшнее, новые скримеры'] },
    en: { title: 'Morning and generators', items: ['Morning at the camp, then the dark', 'Five generators, the Watcher and the Howler', 'Darker, scarier, new scares'] },
  },
  {
    v: '1.0', date: '2026-10-15',
    ru: { title: 'ТИШЕ', items: ['Ты слеп. Лес — нет. Видишь только эхом своего голоса'] },
    en: { title: 'HUSH', items: ['You are blind. The forest is not. You only see by the echo of your voice'] },
  },
];

const WORDS = {
  ru: { head: 'Что нового', earlier: 'Ранее', fold: 'свернуть', open: 'Что нового' },
  en: { head: "What's new", earlier: 'Earlier', fold: 'fold', open: "What's new" },
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null') || {};
  } catch {
    return {};
  }
}

export class News {
  constructor(el) {
    this.el = el;
    this.st = load();
    if (this.st.folded === undefined && typeof innerWidth === 'number' && innerWidth < 1020) this.st.folded = true; // (small screens: just the tab)
    this.open = new Set([NEWS[0].v]); // which versions are unfolded
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !this.el.contains(b)) return;
      if (b.dataset.v) {
        if (this.open.has(b.dataset.v)) this.open.delete(b.dataset.v);
        else this.open.add(b.dataset.v);
        this.render();
      } else if (b.dataset.act === 'fold') this.setFolded(true);
      else if (b.dataset.act === 'unfold') this.setFolded(false);
    });
    this.render();
  }

  setFolded(on) {
    this.st.folded = !!on;
    if (!on) this.st.seen = NEWS[0].v;
    this._save();
    this.render();
  }

  _save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.st));
    } catch { /* */ }
  }

  render() {
    const lang = getLang() === 'en' ? 'en' : 'ru';
    const W = WORDS[lang];
    const fresh = this.st.seen !== NEWS[0].v;
    this.el.classList.toggle('folded', !!this.st.folded);
    if (this.st.folded) {
      this.el.innerHTML = `<button class="news-tab" data-act="unfold">${fresh ? '<i class="news-dot"></i>' : ''}<span>${esc(W.open)}</span><em>v${NEWS[0].v}</em></button>`;
      return;
    }
    // seen once it's been open on the screen
    if (fresh) {
      this.st.seen = NEWS[0].v;
      this._save();
    }
    const fmt = (d) => d.slice(8, 10) + '.' + d.slice(5, 7);
    const entry = (n, i) => {
      const T = n[lang];
      const on = this.open.has(n.v);
      return `<div class="news-entry${on ? ' on' : ''}${i === 0 ? ' latest' : ''}">`
        + `<button class="news-v" data-v="${n.v}" aria-expanded="${on}"><em>v${n.v} · ${fmt(n.date)}</em><b>${esc(T.title)}</b></button>`
        + (on ? `<ul>${T.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '')
        + '</div>';
    };
    this.el.innerHTML = `<div class="news-head"><span>${esc(W.head)}</span><button class="news-fold" data-act="fold" aria-label="${esc(W.fold)}">${esc(W.fold)}</button></div>`
      + entry(NEWS[0], 0)
      + `<div class="news-earlier">${esc(W.earlier)}</div>`
      + NEWS.slice(1).map((n, i) => entry(n, i + 1)).join('');
  }
}
