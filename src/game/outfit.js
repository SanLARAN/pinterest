// The wardrobe: what your survivor wears. Two slots (headwear, outfit), the standard kit plus themed pieces
// for each (Taiga, the Zone, Halloween, Anime, Furry — and three sets from the shop), and two dyes per piece.
// A third slot is the car in the co-op garage (the host's is the one everybody sees). Clothes never change the
// rules — only how your friends see you in the echoes (and under the work lamps) on a co-op night.
//
// An outfit ("fit"): { head, body, hc: [main, accent], bc: [main, accent], car, cc: [main, accent] } with
// colours as '#rrggbb'. Locally every piece remembers its own colours, so trying something on never loses
// what you had. Shop pieces (shop: product id) can only be worn once bought (see wallet.js).
import { getLang } from '../core/i18n.js';
import { hasProduct } from './wallet.js';

export const SLOTS = ['head', 'body', 'car'];
export const WEAR = ['head', 'body']; // what a survivor wears (the car stays in the garage)

// themes: base = the kit you came with
export const THEMES = ['base', 'taiga', 'zone', 'halloween', 'anime', 'furry', 'leshy', 'plague', 'cosmos', 'tuning'];

// c: default colours [main, accent]. glow: the accent is a light (carving, lenses) rather than a fabric
export const ITEMS = {
  head: [
    { id: 'hood', theme: 'base', c: ['#b5462a', '#e9e1d2'] },
    { id: 'ushanka', theme: 'taiga', c: ['#6b4a33', '#d4a63a'] },
    { id: 'gasmask', theme: 'zone', c: ['#4e6b3c', '#9cff6a'], glow: true },
    { id: 'pumpkin', theme: 'halloween', c: ['#e8731c', '#ffc94a'], glow: true },
    { id: 'animehair', theme: 'anime', c: ['#e86aa0', '#e9e1d2'] },
    { id: 'boykisser', theme: 'furry', c: ['#e9e1d2', '#e86aa0'] },
    { id: 'leshyhead', theme: 'leshy', c: ['#4e6b3c', '#9cff6a'], glow: true, shop: 'leshy' },
    { id: 'plaguemask', theme: 'plague', c: ['#e9e1d2', '#232527'], shop: 'plague' },
    { id: 'helmet', theme: 'cosmos', c: ['#e9e1d2', '#ffc94a'], glow: true, shop: 'cosmos' },
  ],
  body: [
    { id: 'jacket', theme: 'base', c: ['#b5462a', '#4a5560'] },
    { id: 'tulup', theme: 'taiga', c: ['#8a6a48', '#e9e1d2'] },
    { id: 'hazmat', theme: 'zone', c: ['#d4a63a', '#232527'] },
    { id: 'scarecrow', theme: 'halloween', c: ['#a3170f', '#d4a63a'] },
    { id: 'seifuku', theme: 'anime', c: ['#e9e1d2', '#2f4f8f'] },
    { id: 'fluffy', theme: 'furry', c: ['#e9e1d2', '#e86aa0'] },
    { id: 'ghillie', theme: 'leshy', c: ['#4e6b3c', '#6b4a33'], shop: 'leshy' },
    { id: 'plaguecoat', theme: 'plague', c: ['#232527', '#6b4a33'], shop: 'plague' },
    { id: 'spacesuit', theme: 'cosmos', c: ['#e9e1d2', '#2f4f8f'], shop: 'cosmos' },
  ],
  // the car in the co-op garage (the host's is the one in the lobby)
  car: [
    { id: 'uaz', theme: 'base', c: ['#4e6b3c', '#8a6a48'] },
    { id: 'trueno', theme: 'tuning', c: ['#e9e1d2', '#232527'], shop: 'trueno' },
  ],
};

// the shop: what shards buy (a set unlocks both its pieces)
export const SHOP = [
  { id: 'leshy', price: 40, items: ['leshyhead', 'ghillie'] },
  { id: 'plague', price: 60, items: ['plaguemask', 'plaguecoat'] },
  { id: 'cosmos', price: 80, items: ['helmet', 'spacesuit'] },
  { id: 'trueno', price: 86, items: ['trueno'] },
];
export function product(id) {
  return SHOP.find((p) => p.id === id) || null;
}

// can you wear it? (everything that isn't in the shop is yours from the start)
export function owns(id) {
  const it = byIdOf(id);
  return !!it && (!it.shop || hasProduct(it.shop));
}
function byIdOf(id) {
  return byId[id] || null;
}

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
  const car = cleanId('car', o.car);
  const hd = byId[head].c, bd = byId[body].c, cd = byId[car].c;
  const hc = Array.isArray(o.hc) ? o.hc : [];
  const bc = Array.isArray(o.bc) ? o.bc : [];
  const cc = Array.isArray(o.cc) ? o.cc : [];
  return {
    head, body,
    hc: [cleanHex(hc[0], hd[0]), cleanHex(hc[1], hd[1])],
    bc: [cleanHex(bc[0], bd[0]), cleanHex(bc[1], bd[1])],
    car,
    cc: [cleanHex(cc[0], cd[0]), cleanHex(cc[1], cd[1])],
  };
}

export const DEFAULT_FIT = cleanFit(null);

// the pieces that change the geometry (colours are just uniforms)
export function shapeKey(fit) {
  return `${fit.head}+${fit.body}`;
}
export function fitKey(fit) {
  return `${fit.head}:${fit.hc.join(',')}|${fit.body}:${fit.bc.join(',')}|${fit.car}:${fit.cc.join(',')}`;
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
  const w = { head: ITEMS.head[0].id, body: ITEMS.body[0].id, car: ITEMS.car[0].id, colors: {} };
  if (raw && typeof raw === 'object') {
    for (const slot of SLOTS) {
      const id = cleanId(slot, raw[slot]);
      w[slot] = owns(id) ? id : ITEMS[slot][0].id; // (a shop piece that isn't yours: back to the standard one)
    }
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
  return cleanFit({
    head: wardrobe.head, body: wardrobe.body, hc: colorsOf(wardrobe.head), bc: colorsOf(wardrobe.body),
    car: wardrobe.car, cc: colorsOf(wardrobe.car),
  });
}

const COL = { head: 'hc', body: 'bc', car: 'cc' };
// a fit as if wearing `ids` (keeping the other slots as they are)
export function fitWith(...ids) {
  const f = myFit();
  for (const id of ids) {
    const it = byId[id];
    if (!it) continue;
    f[it.slot] = id;
    f[COL[it.slot]] = colorsOf(id);
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
    slot: { head: 'Голова', body: 'Костюм', car: 'Машина', shop: 'Магазин' },
    theme: { base: 'Штатное', taiga: 'Тайга', zone: 'Зона', halloween: 'Хэллоуин', anime: 'Аниме', furry: 'Фурри', leshy: 'Леший', plague: 'Чума', cosmos: 'Космос', tuning: 'Тюнинг' },
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
    shop: {
      title: 'МАГАЗИН',
      sub: 'Янтарные осколки из леса — это ещё и деньги. По одному за каждый (в коопе — всей команде), +10 за побег на УАЗе.',
      buy: 'КУПИТЬ',
      owned: 'КУПЛЕНО',
      wear: 'НАДЕТЬ',
      worn: 'НАДЕТО',
      short: 'не хватает {n}',
      bought: 'Куплено: {name}',
      shards: 'осколки',
      carNote: 'Машину видят все в лобби, если хозяин комнаты — ты.',
      sets: {
        leshy: { name: 'Леший', desc: 'Голова из мха с рогами-ветками и светящимися глазами, шкура из лохмотьев мха и коры. Лучшая маскировка в этом лесу — стать его частью.' },
        plague: { name: 'Чумной доктор', desc: 'Маска с клювом и круглыми стёклами, широкополая шляпа, вощёный плащ до пят. Врач из другого века пришёл лечить этот лес.' },
        cosmos: { name: 'Космонавт', desc: 'Гермошлем с золотым светофильтром (светится в темноте) и белый скафандр с ранцем. Вместо Байконура — тайга.' },
        trueno: { name: 'Toyota Sprinter Trueno', desc: 'AE86 «панда» с фарами-раскладушками — встаёт в гараже лобби вместо УАЗа, когда комнату создаёшь ты. При заводке фары поднимаются.' },
      },
    },
    swatch: {
      snow: 'снег', ash: 'пепел', slate: 'сталь', coal: 'уголь', bark: 'кора', sheep: 'овчина', ochre: 'охра', candle: 'свеча',
      pumpkin: 'тыквенный', rust: 'ржавчина', blood: 'кровь', rose: 'роза', plum: 'слива', night: 'ночь', ice: 'лёд', pine: 'хвоя', toxic: 'кислота',
    },
    items: {
      hood: { name: 'Капюшон', parts: ['Ткань', 'Шнурки'], desc: 'Штатный, от штормовки. Шнурки затянуты до упора — так почти не слышно собственного дыхания.' },
      ushanka: { name: 'Ушанка', parts: ['Мех', 'Кокарда'], desc: 'Кроличий мех и кокарда с чужой фуражки. Уши можно опустить — но в этом лесу лучше слушать.' },
      gasmask: { name: 'Противогаз', parts: ['Резина', 'Стёкла'], desc: 'Шлем-маска со склада у вышки. Стёкла светятся в темноте. Никто не знает почему.' },
      pumpkin: { name: 'Тыква', parts: ['Тыква', 'Свеча'], desc: 'Вырезана ножом из ящика с инструментами. Внутри горит свеча, снаружи — темнота.' },
      animehair: { name: 'Химэ-кат', parts: ['Волосы', 'Бант'], desc: 'Длинные, до пояса, прямые: ровная чёлка, пряди вдоль лица, непослушный хохолок и бант на затылке. Героиня первой серии тоже думала, что это просто лес.' },
      jacket: { name: 'Штормовка', parts: ['Куртка', 'Рюкзак'], desc: 'Куртка, рюкзак, спальник. Всё, с чем ты вышел из лагеря.' },
      tulup: { name: 'Тулуп', parts: ['Овчина', 'Опушка'], desc: 'Овчина до колен, кушак и валенки. Дед говорил: в таком и медведь за своего примет. Дед в лес больше не ходит.' },
      hazmat: { name: 'Химзащита', parts: ['Костюм', 'Снаряжение'], desc: 'Прорезиненный костюм, сапоги, баллон за спиной. Защищает от всего, кроме того, что живёт в этом лесу.' },
      scarecrow: { name: 'Пугало', parts: ['Рубаха', 'Солома'], desc: 'Рубаха в заплатах, солома из рукавов и ворона на плече. Ворона настоящая? Лучше не спрашивай.' },
      boykisser: { name: 'Бойкиссер', parts: ['Мех', 'Румянец'], desc: 'Белая кошачья мордочка, розовые ушки и румянец, хитрая улыбка «:3». Уши дёргаются на каждый шорох — удобно, в этом лесу шорохов хватает.' },
      leshyhead: { name: 'Леший', parts: ['Мох', 'Глаза'], desc: 'Голова из мха и коры, рога из сухих веток, зелёный огонь в глазах. Лес принимает тебя за своего. Почти.' },
      plaguemask: { name: 'Чумной доктор', parts: ['Маска', 'Шляпа'], desc: 'Клюв набит сухими травами — от поветрия. От того, что ходит между ёлок, травы не помогают, но пахнет приятно.' },
      helmet: { name: 'Гермошлем', parts: ['Шлем', 'Стекло'], desc: 'Шлем «Сокола» с золотым светофильтром и красной полосой «СССР». Изнутри слышно только собственное дыхание — и это даже хорошо.' },
      fluffy: { name: 'Пушистик', parts: ['Мех', 'Подушечки'], desc: 'Белый мех, пушистые манжеты, розовые подушечки на лапах и хвост, который живёт своей жизнью. Хвост выдаёт настроение. Твари этим пользуются.' },
      ghillie: { name: 'Шкура лешего', parts: ['Мох', 'Кора'], desc: 'Лохмотья мха до земли, наплечники из коры, ветки за поясом. Стой тихо — и ты просто кочка.' },
      plaguecoat: { name: 'Чумной плащ', parts: ['Плащ', 'Ремни'], desc: 'Вощёный плащ до пят, пелерина, перчатки и сапоги. Ни одной открытой полоски кожи — кто знает, что здесь заразно.' },
      spacesuit: { name: 'Скафандр', parts: ['Скафандр', 'Отделка'], desc: 'Белый скафандр с пультом на груди, шлангами и ранцем жизнеобеспечения. Сел не в том лесу.' },
      uaz: { name: 'УАЗ-469', parts: ['Кузов', 'Тент'], desc: 'Тот самый, без тента: заводится с третьего раза, гремит на каждой кочке, вывезет откуда угодно.' },
      trueno: { name: 'Sprinter Trueno', parts: ['Верх', 'Низ'], desc: 'AE86: «панда», фары-раскладушки, ручка КПП как влитая. Шильдик на двери — семейная лавка тофу. Стоит в гараже, если хозяин комнаты в гараже — ты.' },
      seifuku: { name: 'Матроска', parts: ['Блузка', 'Юбка и воротник'], desc: 'Сэйлор-фуку: матросский воротник в полоску, бант, плиссированная юбка, гольфы и лоферы. Ближайшая школа — в трёхстах километрах. Чья это форма, лес не говорит.' },
    },
  },
  en: {
    title: 'WARDROBE',
    sub: 'This is how your friends will see you — in the echoes and under the work lamps.',
    slot: { head: 'Head', body: 'Outfit', car: 'Car', shop: 'Shop' },
    theme: { base: 'Standard issue', taiga: 'Taiga', zone: 'The Zone', halloween: 'Halloween', anime: 'Anime', furry: 'Furry', leshy: 'Leshy', plague: 'Plague', cosmos: 'Cosmos', tuning: 'Tuning' },
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
    shop: {
      title: 'SHOP',
      sub: 'The amber shards out in the forest are money too. One for each (on a co-op night, for the whole team), +10 for driving away in the UAZ.',
      buy: 'BUY',
      owned: 'OWNED',
      wear: 'WEAR',
      worn: 'WORN',
      short: '{n} short',
      bought: 'Bought: {name}',
      shards: 'shards',
      carNote: 'Everybody in the lobby sees the car when the room is yours.',
      sets: {
        leshy: { name: 'Leshy', desc: 'A moss head with branch antlers and glowing eyes, a hide of moss rags and bark. The best disguise in this forest is to become part of it.' },
        plague: { name: 'Plague doctor', desc: 'A beaked mask with round lenses, a wide-brimmed hat, a waxed coat to the heels. A doctor from another century came to treat this forest.' },
        cosmos: { name: 'Cosmonaut', desc: 'A helmet with a gold sun visor (it glows in the dark) and a white spacesuit with a pack. Instead of Baikonur — the taiga.' },
        trueno: { name: 'Toyota Sprinter Trueno', desc: 'An AE86 "panda" with pop-up headlights — it takes the UAZ\'s place in the lobby garage when you make the room. The lights flip up when it starts.' },
      },
    },
    swatch: {
      snow: 'snow', ash: 'ash', slate: 'slate', coal: 'coal', bark: 'bark', sheep: 'sheepskin', ochre: 'ochre', candle: 'candle',
      pumpkin: 'pumpkin', rust: 'rust', blood: 'blood', rose: 'rose', plum: 'plum', night: 'night', ice: 'ice', pine: 'pine', toxic: 'toxic',
    },
    items: {
      hood: { name: 'Hood', parts: ['Fabric', 'Drawstrings'], desc: 'Standard, off the windbreaker. Drawstrings pulled all the way — you barely hear your own breathing.' },
      ushanka: { name: 'Ushanka', parts: ['Fur', 'Badge'], desc: "Rabbit fur and a badge off somebody else's cap. The flaps come down — but in this forest you'd better listen." },
      gasmask: { name: 'Gas mask', parts: ['Rubber', 'Lenses'], desc: 'A helmet-mask from the depot by the tower. The lenses glow in the dark. Nobody knows why.' },
      pumpkin: { name: 'Pumpkin', parts: ['Pumpkin', 'Candle'], desc: 'Carved with the knife from the tool bag. A candle burns inside; outside, the dark.' },
      animehair: { name: 'Hime cut', parts: ['Hair', 'Bow'], desc: 'Waist-long and straight: blunt bangs, locks framing the face, a stubborn ahoge and a bow at the back. The heroine in episode one also thought it was just a forest.' },
      jacket: { name: 'Windbreaker', parts: ['Jacket', 'Backpack'], desc: 'Jacket, backpack, bedroll. Everything you left the camp with.' },
      tulup: { name: 'Sheepskin', parts: ['Coat', 'Trim'], desc: "Knee-length sheepskin, a sash and felt boots. Grandpa said in a coat like this even a bear takes you for kin. Grandpa doesn't go into the woods anymore." },
      hazmat: { name: 'Hazmat suit', parts: ['Suit', 'Gear'], desc: 'Rubberised suit, boots, a tank on the back. Protects you from everything except what lives in these woods.' },
      scarecrow: { name: 'Scarecrow', parts: ['Shirt', 'Straw'], desc: 'A patched shirt, straw out of the sleeves and a crow on the shoulder. Is the crow real? Better not ask.' },
      boykisser: { name: 'Boykisser', parts: ['Fur', 'Blush'], desc: 'A white cat face, pink ears and blush, a smug little ":3". The ears twitch at every rustle — handy, this forest is full of rustles.' },
      leshyhead: { name: 'Leshy', parts: ['Moss', 'Eyes'], desc: 'A head of moss and bark, antlers of dead branches, green fire in the eyes. The forest takes you for one of its own. Almost.' },
      plaguemask: { name: 'Plague doctor', parts: ['Mask', 'Hat'], desc: "The beak is stuffed with dry herbs against the miasma. Against what walks between the firs herbs don't help, but it smells nice." },
      helmet: { name: 'Space helmet', parts: ['Helmet', 'Visor'], desc: 'A Sokol helmet with a gold sun visor and a red "СССР" stripe. Inside you only hear your own breathing — and that is a good thing.' },
      fluffy: { name: 'Fluffy', parts: ['Fur', 'Beans'], desc: 'White fur, fluffy cuffs, pink toe beans and a tail with a life of its own. The tail gives your mood away. The things out there use that.' },
      ghillie: { name: 'Leshy hide', parts: ['Moss', 'Bark'], desc: 'Moss rags to the ground, bark pauldrons, twigs in the belt. Stand still and you are just a hummock.' },
      plaguecoat: { name: 'Plague coat', parts: ['Coat', 'Straps'], desc: 'A waxed coat to the heels, a cape, gloves and boots. Not one strip of skin showing — who knows what is catching around here.' },
      spacesuit: { name: 'Spacesuit', parts: ['Suit', 'Trim'], desc: 'A white suit with a chest console, hoses and a life-support pack. Landed in the wrong forest.' },
      uaz: { name: 'UAZ-469', parts: ['Body', 'Canvas'], desc: 'The very one, top off: starts on the third try, rattles over every bump, gets you out of anywhere.' },
      trueno: { name: 'Sprinter Trueno', parts: ['Top', 'Bottom'], desc: 'AE86: "panda" paint, pop-up headlights, a gear stick like it grew there. The door says family tofu shop. It stands in the garage when the room is yours.' },
      seifuku: { name: 'Sailor fuku', parts: ['Blouse', 'Skirt & collar'], desc: "A sailor collar with stripes, a ribbon, a pleated skirt, knee socks and loafers. The nearest school is three hundred kilometres away. Whose uniform this was, the forest won't say." },
    },
  },
};

export function wt() {
  return TEXT[getLang()] || TEXT.ru;
}
