// The wardrobe: what your survivor wears. Two slots (headwear, outfit), the standard kit plus three themed
// pieces for each (Taiga, the Zone, Halloween), and two dyes per piece. Clothes never change the rules —
// only how your friends see you in the echoes (and under the work lamps) on a co-op night.
//
// An outfit ("fit"): { head, body, hc: [main, accent], bc: [main, accent] } with colours as '#rrggbb'.
// Locally every piece remembers its own colours, so trying something on never loses what you had.
import { getLang } from '../core/i18n.js';

export const SLOTS = ['head', 'body'];

// themes: base = the kit you came with
export const THEMES = ['base', 'taiga', 'zone', 'halloween'];

// c: default colours [main, accent]. glow: the accent is a light (carving, lenses) rather than a fabric
export const ITEMS = {
  head: [
    { id: 'hood', theme: 'base', c: ['#b5462a', '#e9e1d2'] },
    { id: 'ushanka', theme: 'taiga', c: ['#6b4a33', '#d4a63a'] },
    { id: 'gasmask', theme: 'zone', c: ['#4e6b3c', '#9cff6a'], glow: true },
    { id: 'pumpkin', theme: 'halloween', c: ['#e8731c', '#ffc94a'], glow: true },
  ],
  body: [
    { id: 'jacket', theme: 'base', c: ['#b5462a', '#4a5560'] },
    { id: 'tulup', theme: 'taiga', c: ['#8a6a48', '#e9e1d2'] },
    { id: 'hazmat', theme: 'zone', c: ['#d4a63a', '#232527'] },
    { id: 'scarecrow', theme: 'halloween', c: ['#a3170f', '#d4a63a'] },
  ],
};

// every piece's own colours are among these (+ a free colour picker: 18 swatches, two rows of nine)
export const PALETTE = [
  ['#e9e1d2', 'snow'], ['#9aa3a6', 'ash'], ['#4a5560', 'slate'], ['#232527', 'coal'],
  ['#6b4a33', 'bark'], ['#8a6a48', 'sheep'], ['#d4a63a', 'ochre'], ['#ffc94a', 'candle'],
  ['#e8731c', 'pumpkin'], ['#b5462a', 'rust'], ['#a3170f', 'blood'], ['#e86aa0', 'rose'],
  ['#7a4a9c', 'plum'], ['#2f4f8f', 'night'], ['#4fc3d9', 'ice'], ['#4e6b3c', 'pine'], ['#9cff6a', 'toxic'],
];

const byId = Object.create(null); // (ids come over the network too: no prototype to trip over)
for (const slot of SLOTS) for (const it of ITEMS[slot]) byId[it.id] = { ...it, slot };

export function item(id) {
  return byId[id] || null;
}

const HEX = /^#[0-9a-f]{6}$/;
export function cleanHex(v, fallback) {
  const s = String(v || '').trim().toLowerCase();
  if (HEX.test(s)) return s;
  if (/^[0-9a-f]{6}$/.test(s)) return '#' + s;
  return fallback;
}

function cleanId(slot, id) {
  const it = byId[id];
  return it && it.slot === slot ? id : ITEMS[slot][0].id;
}

// anything that came over the network or out of storage → a valid fit
export function cleanFit(f) {
  const o = f && typeof f === 'object' ? f : {};
  const head = cleanId('head', o.head);
  const body = cleanId('body', o.body);
  const hd = byId[head].c, bd = byId[body].c;
  const hc = Array.isArray(o.hc) ? o.hc : [];
  const bc = Array.isArray(o.bc) ? o.bc : [];
  return {
    head, body,
    hc: [cleanHex(hc[0], hd[0]), cleanHex(hc[1], hd[1])],
    bc: [cleanHex(bc[0], bd[0]), cleanHex(bc[1], bd[1])],
  };
}

export const DEFAULT_FIT = cleanFit(null);

// the pieces that change the geometry (colours are just uniforms)
export function shapeKey(fit) {
  return `${fit.head}+${fit.body}`;
}
export function fitKey(fit) {
  return `${fit.head}:${fit.hc.join(',')}|${fit.body}:${fit.bc.join(',')}`;
}

// ---------------- your wardrobe (localStorage) ----------------
const KEY = 'hush.outfit.v1';

function load() {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    raw = null;
  }
  const w = { head: ITEMS.head[0].id, body: ITEMS.body[0].id, colors: {} };
  if (raw && typeof raw === 'object') {
    w.head = cleanId('head', raw.head);
    w.body = cleanId('body', raw.body);
    const c = raw.colors && typeof raw.colors === 'object' ? raw.colors : {};
    for (const id of Object.keys(byId)) {
      if (Array.isArray(c[id])) w.colors[id] = [cleanHex(c[id][0], byId[id].c[0]), cleanHex(c[id][1], byId[id].c[1])];
    }
  }
  return w;
}

export const wardrobe = load();

export function saveWardrobe() {
  try {
    localStorage.setItem(KEY, JSON.stringify(wardrobe));
  } catch {
    /* private mode */
  }
}

export function colorsOf(id) {
  const c = wardrobe.colors[id];
  return c ? c.slice() : byId[id].c.slice();
}

export function setColor(id, part, hex) {
  const c = colorsOf(id);
  c[part] = cleanHex(hex, c[part]);
  wardrobe.colors[id] = c;
}

export function resetColors(id) {
  delete wardrobe.colors[id];
}

export function isDefaultColors(id) {
  const c = colorsOf(id), d = byId[id].c;
  return c[0] === d[0] && c[1] === d[1];
}

// what you're wearing right now (what goes over the network)
export function myFit() {
  return cleanFit({ head: wardrobe.head, body: wardrobe.body, hc: colorsOf(wardrobe.head), bc: colorsOf(wardrobe.body) });
}

// a fit as if wearing `id` (keeping the other slot as it is)
export function fitWith(id) {
  const it = byId[id];
  const f = myFit();
  if (!it) return f;
  if (it.slot === 'head') {
    f.head = id;
    f.hc = colorsOf(id);
  } else {
    f.body = id;
    f.bc = colorsOf(id);
  }
  return f;
}

// matching pieces: a full set of one theme
export function fullSet(fit) {
  const a = byId[fit.head], b = byId[fit.body];
  return a && b && a.theme === b.theme && a.theme !== 'base' ? a.theme : null;
}

// ---------------- words ----------------
const TEXT = {
  ru: {
    title: 'ГАРДЕРОБ',
    sub: 'Таким тебя увидят друзья — в эхе и под рабочими лампами.',
    slot: { head: 'Головной убор', body: 'Костюм' },
    theme: { base: 'Штатное', taiga: 'Тайга', zone: 'Зона', halloween: 'Хэллоуин' },
    set: 'комплект',
    color: 'Цвет',
    custom: 'свой цвет',
    random: 'Случайно',
    reset: 'Сбросить цвета',
    done: 'ГОТОВО',
    hint: 'потяни — повернуть · колесо — ближе · клик — эхо',
    hintTouch: 'палец — вращать · щипок — ближе',
    note: 'Одежда не меняет правил: твари слышат всех одинаково.',
    wearing: 'надето',
    menuCap: 'Гардероб',
    swatch: {
      snow: 'снег', ash: 'пепел', slate: 'сталь', coal: 'уголь', bark: 'кора', sheep: 'овчина', ochre: 'охра', candle: 'свеча',
      pumpkin: 'тыквенный', rust: 'ржавчина', blood: 'кровь', rose: 'роза', plum: 'слива', night: 'ночь', ice: 'лёд', pine: 'хвоя', toxic: 'кислота',
    },
    items: {
      hood: { name: 'Капюшон', parts: ['Ткань', 'Шнурки'], desc: 'Штатный, от штормовки. Шнурки затянуты до упора — так почти не слышно собственного дыхания.' },
      ushanka: { name: 'Ушанка', parts: ['Мех', 'Кокарда'], desc: 'Кроличий мех и кокарда с чужой фуражки. Уши можно опустить — но в этом лесу лучше слушать.' },
      gasmask: { name: 'Противогаз', parts: ['Резина', 'Стёкла'], desc: 'Шлем-маска со склада у вышки. Стёкла светятся в темноте. Никто не знает почему.' },
      pumpkin: { name: 'Тыква', parts: ['Тыква', 'Свеча'], desc: 'Вырезана ножом из ящика с инструментами. Внутри горит свеча, снаружи — темнота.' },
      jacket: { name: 'Штормовка', parts: ['Куртка', 'Рюкзак'], desc: 'Куртка, рюкзак, спальник. Всё, с чем ты вышел из лагеря.' },
      tulup: { name: 'Тулуп', parts: ['Овчина', 'Опушка'], desc: 'Овчина до колен, кушак и валенки. Дед говорил: в таком и медведь за своего примет. Дед в лес больше не ходит.' },
      hazmat: { name: 'Химзащита', parts: ['Костюм', 'Снаряжение'], desc: 'Прорезиненный костюм, сапоги, баллон за спиной. Защищает от всего, кроме того, что живёт в этом лесу.' },
      scarecrow: { name: 'Пугало', parts: ['Рубаха', 'Солома'], desc: 'Рубаха в заплатах, солома из рукавов и ворона на плече. Ворона настоящая? Лучше не спрашивай.' },
    },
  },
  en: {
    title: 'WARDROBE',
    sub: 'This is how your friends will see you — in the echoes and under the work lamps.',
    slot: { head: 'Headwear', body: 'Outfit' },
    theme: { base: 'Standard issue', taiga: 'Taiga', zone: 'The Zone', halloween: 'Halloween' },
    set: 'full set',
    color: 'Colour',
    custom: 'custom colour',
    random: 'Random',
    reset: 'Reset colours',
    done: 'DONE',
    hint: 'drag to turn · wheel to zoom · click for an echo',
    hintTouch: 'drag to turn · pinch to zoom',
    note: "Clothes don't change the rules: the things out there hear everyone the same.",
    wearing: 'wearing',
    menuCap: 'Wardrobe',
    swatch: {
      snow: 'snow', ash: 'ash', slate: 'slate', coal: 'coal', bark: 'bark', sheep: 'sheepskin', ochre: 'ochre', candle: 'candle',
      pumpkin: 'pumpkin', rust: 'rust', blood: 'blood', rose: 'rose', plum: 'plum', night: 'night', ice: 'ice', pine: 'pine', toxic: 'toxic',
    },
    items: {
      hood: { name: 'Hood', parts: ['Fabric', 'Drawstrings'], desc: 'Standard, off the windbreaker. Drawstrings pulled all the way — you barely hear your own breathing.' },
      ushanka: { name: 'Ushanka', parts: ['Fur', 'Badge'], desc: "Rabbit fur and a badge off somebody else's cap. The flaps come down — but in this forest you'd better listen." },
      gasmask: { name: 'Gas mask', parts: ['Rubber', 'Lenses'], desc: 'A helmet-mask from the depot by the tower. The lenses glow in the dark. Nobody knows why.' },
      pumpkin: { name: 'Pumpkin', parts: ['Pumpkin', 'Candle'], desc: 'Carved with the knife from the tool bag. A candle burns inside; outside, the dark.' },
      jacket: { name: 'Windbreaker', parts: ['Jacket', 'Backpack'], desc: 'Jacket, backpack, bedroll. Everything you left the camp with.' },
      tulup: { name: 'Sheepskin', parts: ['Coat', 'Trim'], desc: "Knee-length sheepskin, a sash and felt boots. Grandpa said in a coat like this even a bear takes you for kin. Grandpa doesn't go into the woods anymore." },
      hazmat: { name: 'Hazmat suit', parts: ['Suit', 'Gear'], desc: 'Rubberised suit, boots, a tank on the back. Protects you from everything except what lives in these woods.' },
      scarecrow: { name: 'Scarecrow', parts: ['Shirt', 'Straw'], desc: 'A patched shirt, straw out of the sleeves and a crow on the shoulder. Is the crow real? Better not ask.' },
    },
  },
};

export function wt() {
  return TEXT[getLang()] || TEXT.ru;
}
