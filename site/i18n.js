// The site's own words (RU / EN). The game keeps its strings in src/core/i18n.js; the landing page is a separate
// build, so its lines live here — every key in both languages (tests/site.test.mjs checks the parity).
// Numbers in {braces} are filled from the game's own config (core/config.js) by main.js, so the page never
// promises a different forest from the one you play.
import { readJSON } from '../src/core/persistence.js';

export const STR = {
  ru: {
    meta: {
      title: 'ТИШЕ / HUSH — эхолокационный хоррор в браузере',
      description: 'Ночной лес, ты слеп, твой голос — сонар. Бесплатный кооперативный хоррор до четырёх игроков: запусти пять генераторов и не кричи.',
    },
    nav: { echo: 'Эхо', shift: 'Смена', coop: 'Вместе', atlas: 'Атлас', vote: 'Голосование', patches: 'Патчи', play: 'Играть', menu: 'Меню', close: 'Закрыть', lang: 'EN', langLabel: 'Switch to English', top: 'Наверх', sound: 'Звук', soundOn: 'Выключить звук', soundOff: 'Включить звук', skip: 'К содержанию', home: 'ТИШЕ — в начало' },
    hero: {
      kicker: 'эхолокационный хоррор · кооператив до {players}',
      title: 'ТИШЕ',
      sub: 'Ночной лес. Ты слеп. Твой голос — сонар.',
      sub2: 'Запусти пять генераторов. Не кричи.',
      play: 'Играть в браузере',
      download: 'Скачать для Windows',
      downloadMeta: 'установщик · {size}',
      downloadFallback: 'все сборки на GitHub',
      free: 'бесплатно · без регистрации · RU / EN',
      scroll: 'листай — и слушай',
      hint: 'клик — камень · зажми — голос',
      hintTouch: 'тап — камень · держи — голос',
      version: 'версия {v} · {date}',
      mb: 'МБ',
    },
    echo: {
      kicker: 'I · эхо',
      title: 'Звук — твои глаза',
      lead: 'Здесь темно по-настоящему. Видно только то, что прозвучало: шаг, голос, брошенный камень. Эхо обрисует стволы — и того, кто стоит между ними.',
      lead2: 'Чем громче звук, тем дальше видно. И тем дальше слышно. Каждый раз решаешь сам, что тебе нужнее.',
      tryTitle: 'Попробуй прямо здесь',
      try: 'Клик по лесу — бросить камень: звук будет там, где он упал. Зажми — голос: чем дольше держишь, тем громче.',
      tryTouch: 'Тап по лесу — бросить камень: звук будет там, где он упал. Держи палец — голос: чем дольше, тем громче.',
      loud: 'громкость',
      seen: 'видно',
      heard: 'слышно',
      m: 'м',
      whisper: 'шёпот',
      talk: 'разговор',
      scream: 'крик',
      mic: 'Включить микрофон',
      micOn: 'Микрофон слушает',
      micOff: 'Выключить микрофон',
      micNote: 'Звук не покидает браузер — как в игре.',
      micDenied: 'Микрофон не дали. Ничего — кликай.',
      factSpeed: 'метров в секунду летит эхо: видно, как оно идёт по лесу',
      factScream: 'громкость крика: после неё на тебя охотятся сразу',
      factDrop: 'секунд тишины — и Слушатель бросает погоню',
      toastStone: 'Камень. Он пойдёт туда, где упало.',
      toastTalk: 'Голос. Слышно на {r} м.',
      toastScream: 'Ты закричал. Он уже здесь.',
    },
    shift: {
      kicker: 'II · смена',
      title: 'Четыре ночи',
      lead: 'Ночь — {night}. Между ночами — утро у лагеря, {morning}: отдышаться, найти детали, подготовиться. Потом свет умирает, как перегоревшая лампочка.',
      wake: 'Четвёртая ночь, {wake}-я минута: лес просыпается насовсем.',
      gensTitle: 'Пять генераторов',
      gensLead: 'Каждый сломан по-своему, и каждая починка шумит. Запустишь все пять — во дворе лесхоза дадут свет.',
      gen: '№{n}',
      noise: 'шум запуска',
      sec: 'с',
      escapeTitle: 'Или уехать',
      escape: 'УАЗ во дворе лесхоза: нет колеса, аккумулятора, карбюратора и бензина. Найди, принеси в руках, поставь — и за руль. Последний рассвет даёт на это {finale}.',
      night: 'ночь {n}',
      nightUp: 'НОЧЬ {n}',
      morning: 'утро',
      morningUp: 'УТРО',
      finale: 'рассвет',
      finaleUp: 'ПОСЛЕДНИЙ РАССВЕТ',
      woke: 'лес проснулся',
      started: 'запущен',
      scrub: 'листай — время идёт',
      min: ['минута', 'минуты', 'минут'],
      or: 'или',
      next: 'следующий',
    },
    coop: {
      kicker: 'III · вместе',
      title: 'До четырёх',
      lead: 'Комната по коду из {code} букв, связь напрямую — без своих серверов. Микрофон здесь и рация, и сонар: голос друга тоже освещает лес. Его тоже слышат.',
      f1t: 'Голос — это свет',
      f1: 'Любое слово в рации — эхо вокруг того, кто говорит. Тихий разговор слышно в паре метров, крик — на полкарты.',
      f2t: 'Тень крадёт голоса',
      f2: 'Она запоминает фразы и повторяет их голосом друга. Голос вдалеке — ещё не сам друг.',
      f3t: 'Не бросай своих',
      f3: 'Упавшего можно поднять: шприц адреналина из аптечки «Зорьки» — полторы секунды рядом, и он на ногах.',
      f4t: 'Длина смены',
      f4: 'Хост выбирает, сколько ночей держаться: {options}.',
      cta: 'Собрать отряд',
      room: 'комната',
      radio: 'рация',
    },
    atlas: {
      kicker: 'IV · атлас',
      title: 'Атлас',
      lead: 'Полевой журнал того, кто был здесь до тебя. Каждая тварь, деталь и место — живые модели из игры, освещённые эхом.',
      help: 'тяни — повернуть · клик — эхо · ctrl + колесо — ближе',
      helpTouch: 'веди — повернуть · тап — эхо · щипок — ближе',
      keys: '← → листать · S голос · F экран',
      ping: 'эхо',
      full: 'во весь экран',
      exitFull: 'свернуть',
      link: 'ссылка',
      copied: 'ссылка скопирована',
      seen: 'встречен',
      notSeen: 'ещё не встречен',
      heights: 'рост рядом с тобой',
      you: 'ты',
      loading: 'проявляется…',
      noGl: 'Тут должна быть живая модель, но WebGL недоступен.',
      of: 'из',
      fig: 'рис.',
      scale: 'масштаб',
      journalEmpty: 'Сыграй ночь — и здесь появится твой журнал.',
    },
    vote: {
      kicker: 'V · голосование',
      title: 'Кто придёт следующим',
      lead: 'Шесть тварей ждут своей ночи. Голосуй за ту, которую хочешь встретить: самая желанная выйдет в лес первой. Один голос с устройства, передумать можно.',
      vote: 'Голосую',
      voted: 'Твой голос',
      change: 'Отдать голос сюда',
      sending: 'Отправляю…',
      total: 'голосов: {n}',
      hidden: 'итоги откроются после твоего голоса',
      leading: 'лидирует',
      pending: 'Голос сохранён на этом устройстве: отправится сам, когда урна откроется.',
      error: 'Урна не отвечает. Попробуй ещё раз чуть позже.',
      limited: 'С этой сети сегодня голосовали слишком часто. Завтра урна снова примет.',
      thanks: 'Принято. Лес запомнил.',
      mechanics: 'как будет охотиться',
      concept: 'концепт',
      listen: 'послушать',
      share: '{p}% голосов',
      fig: 'рис. V.{n}',
    },
    patches: {
      kicker: 'VI · патчи',
      title: 'Что нового',
      lead: '{n} за {days}. Игра меняется почти каждую ночь — вот как.',
      updates: ['обновление', 'обновления', 'обновлений'],
      days: ['день', 'дня', 'дней'],
      search: 'искать в патчах…',
      all: 'все',
      more: 'ещё {n}',
      less: 'свернуть',
      showMore: 'показать ещё',
      none: 'Ничего не нашлось.',
      found: ['патч', 'патча', 'патчей'],
      clear: 'Очистить поиск',
      fresh: 'новое для тебя',
      latest: 'свежий',
      link: 'ссылка на патч',
      copied: 'скопировано',
      count: '{n} шт.',
    },
    footer: {
      line: 'ТИШЕ / HUSH — бесплатная игра. Код открыт.',
      play: 'Играть',
      download: 'Скачать',
      github: 'GitHub',
      about: 'Об игре',
      privacy: 'Конфиденциальность',
      top: 'Наверх',
    },
    rail: { top: 'Лес', echo: 'Эхо', shift: 'Смена', coop: 'Вместе', atlas: 'Атлас', vote: 'Голос', patches: 'Патчи' },
    noGl: 'WebGL недоступен — лес не нарисовать, но читать можно.',
  },
  en: {
    meta: {
      title: 'HUSH — echolocation horror in your browser',
      description: 'A night forest, you are blind, your voice is your sonar. A free co-op horror for up to four: start five generators and do not scream.',
    },
    nav: { echo: 'Echo', shift: 'The shift', coop: 'Together', atlas: 'Atlas', vote: 'Vote', patches: 'Patches', play: 'Play', menu: 'Menu', close: 'Close', lang: 'RU', langLabel: 'Переключить на русский', top: 'Back to top', sound: 'Sound', soundOn: 'Turn the sound off', soundOff: 'Turn the sound on', skip: 'Skip to content', home: 'HUSH — back to the start' },
    hero: {
      kicker: 'echolocation horror · co-op up to {players}',
      title: 'HUSH',
      sub: 'A night forest. You are blind. Your voice is your sonar.',
      sub2: 'Start five generators. Do not scream.',
      play: 'Play in the browser',
      download: 'Download for Windows',
      downloadMeta: 'installer · {size}',
      downloadFallback: 'every build on GitHub',
      free: 'free · no sign-up · RU / EN',
      scroll: 'scroll — and listen',
      hint: 'click — a stone · hold — your voice',
      hintTouch: 'tap — a stone · hold — your voice',
      version: 'version {v} · {date}',
      mb: 'MB',
    },
    echo: {
      kicker: 'I · echo',
      title: 'Sound is your sight',
      lead: 'The dark here is real. You only see what made a sound: a step, a voice, a thrown stone. The echo draws the trunks — and whatever stands between them.',
      lead2: 'The louder the sound, the further you see. And the further you are heard. Every time, you choose what you need more.',
      tryTitle: 'Try it right here',
      try: 'Click the forest to throw a stone: the sound is where it lands. Hold for your voice: the longer you hold, the louder.',
      tryTouch: 'Tap the forest to throw a stone: the sound is where it lands. Keep your finger down for your voice: the longer, the louder.',
      loud: 'loudness',
      seen: 'seen',
      heard: 'heard',
      m: 'm',
      whisper: 'whisper',
      talk: 'talk',
      scream: 'scream',
      mic: 'Use the microphone',
      micOn: 'The microphone is listening',
      micOff: 'Turn the microphone off',
      micNote: 'The sound never leaves your browser — just like in the game.',
      micDenied: 'No microphone. Never mind — click.',
      factSpeed: 'metres a second: you watch the echo travel through the trees',
      factScream: 'the loudness of a scream: past it, the hunt starts at once',
      factDrop: 'seconds of silence — and the Listener gives up the chase',
      toastStone: 'A stone. It will go where it landed.',
      toastTalk: 'A voice. Heard {r} m away.',
      toastScream: 'You screamed. It is already here.',
    },
    shift: {
      kicker: 'II · the shift',
      title: 'Four nights',
      lead: 'A night is {night}. Between the nights, a morning at the camp, {morning}: catch your breath, find the parts, get ready. Then the light dies like a burnt-out bulb.',
      wake: 'The fourth night, minute {wake}: the forest wakes up for good.',
      gensTitle: 'Five generators',
      gensLead: 'Each is broken its own way, and every repair makes noise. Start all five and the forestry yard gets its power back.',
      gen: '#{n}',
      noise: 'start-up noise',
      sec: 's',
      escapeTitle: 'Or drive away',
      escape: 'A UAZ in the forestry yard, missing a wheel, a battery, a carburettor and fuel. Find them, carry them, fit them — and take the wheel. The last dawn gives you {finale} for it.',
      night: 'night {n}',
      nightUp: 'NIGHT {n}',
      morning: 'morning',
      morningUp: 'MORNING',
      finale: 'dawn',
      finaleUp: 'THE LAST DAWN',
      woke: 'the forest woke',
      started: 'running',
      scrub: 'scroll — time moves',
      min: ['minute', 'minutes'],
      or: 'or',
      next: 'next up',
    },
    coop: {
      kicker: 'III · together',
      title: 'Up to four',
      lead: 'A room by a {code}-letter code, a direct connection — no servers of our own. The microphone is your radio and your sonar: a friend\u2019s voice lights the forest too. And it is heard.',
      f1t: 'A voice is light',
      f1: 'Every word on the radio is an echo around whoever said it. A quiet talk carries a few metres, a scream half the map.',
      f2t: 'The Shade steals voices',
      f2: 'It remembers phrases and repeats them in your friend\u2019s voice. A voice far off is not yet your friend.',
      f3t: 'Leave no one behind',
      f3: 'A fallen friend can get up again: an adrenaline shot from the Zarya first-aid kit — a second and a half beside them and they stand.',
      f4t: 'The length of the shift',
      f4: 'The host picks how many nights to hold out: {options}.',
      cta: 'Gather a team',
      room: 'room',
      radio: 'radio',
    },
    atlas: {
      kicker: 'IV · atlas',
      title: 'The atlas',
      lead: 'The field journal of whoever was here before you. Every creature, part and place is a live model from the game, lit by the echo.',
      help: 'drag — turn · click — echo · ctrl + wheel — closer',
      helpTouch: 'drag — turn · tap — echo · pinch — closer',
      keys: '← → turn pages · S voice · F full screen',
      ping: 'echo',
      full: 'full screen',
      exitFull: 'exit full screen',
      link: 'link',
      copied: 'link copied',
      seen: 'met',
      notSeen: 'not met yet',
      heights: 'its height next to yours',
      you: 'you',
      loading: 'developing…',
      noGl: 'A live model belongs here, but WebGL is not available.',
      of: 'of',
      fig: 'fig.',
      scale: 'scale',
      journalEmpty: 'Play a night and your journal appears here.',
    },
    vote: {
      kicker: 'V · the vote',
      title: 'Who comes next',
      lead: 'Six creatures are waiting for their night. Vote for the one you want to meet: the most wanted walks into the forest first. One vote per device, and you can change it.',
      vote: 'Vote',
      voted: 'Your vote',
      change: 'Move my vote here',
      sending: 'Sending…',
      total: 'votes: {n}',
      hidden: 'the results open after your vote',
      leading: 'leading',
      pending: 'Your vote is saved on this device and will be sent once the ballot box opens.',
      error: 'The ballot box is not answering. Try again a little later.',
      limited: 'Too many votes from this network today. The box opens again tomorrow.',
      thanks: 'Counted. The forest will remember.',
      mechanics: 'how it will hunt',
      concept: 'concept',
      listen: 'listen',
      share: '{p}% of the votes',
      fig: 'fig. V.{n}',
    },
    patches: {
      kicker: 'VI · patches',
      title: 'What\u2019s new',
      lead: '{n} in {days}. The game changes almost every night — here is how.',
      updates: ['update', 'updates'],
      days: ['day', 'days'],
      search: 'search the patches…',
      all: 'all',
      more: '{n} more',
      less: 'fold',
      showMore: 'show more',
      none: 'Nothing found.',
      found: ['patch', 'patches'],
      clear: 'Clear the search',
      fresh: 'new to you',
      latest: 'latest',
      link: 'link to this patch',
      copied: 'copied',
      count: '{n}',
    },
    footer: {
      line: 'HUSH is a free game. The code is open.',
      play: 'Play',
      download: 'Download',
      github: 'GitHub',
      about: 'About',
      privacy: 'Privacy',
      top: 'Back to top',
    },
    rail: { top: 'Forest', echo: 'Echo', shift: 'Shift', coop: 'Together', atlas: 'Atlas', vote: 'Vote', patches: 'Patches' },
    noGl: 'WebGL is not available — the forest cannot be drawn, but you can still read.',
  },
};

export const LANGS = ['ru', 'en'];
const SITE_KEY = 'hush.site.v1';

// the page's language: the one picked here, else the game's own setting, else the browser's
export function detectLang(nav = typeof navigator !== 'undefined' ? navigator : null) {
  try {
    const own = JSON.parse(localStorage.getItem(SITE_KEY) || 'null');
    if (own && LANGS.includes(own.lang)) return own.lang;
  } catch { /* private mode */ }
  const game = readJSON('hush.settings.v1', null);
  if (game && LANGS.includes(game.lang)) return game.lang;
  const l = String((nav && (nav.languages?.[0] || nav.language)) || 'ru').toLowerCase();
  return /^(ru|uk|be|kk)/.test(l) ? 'ru' : 'en';
}

// the page's own settings (language, sound): { lang, sound }
export function readSite() {
  try {
    const v = JSON.parse(localStorage.getItem(SITE_KEY) || 'null');
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
export function saveSite(patch) {
  try { localStorage.setItem(SITE_KEY, JSON.stringify({ ...readSite(), ...patch })); } catch { /* fine */ }
}
export function saveLang(lang) {
  saveSite({ lang });
}

let lang = 'ru';
export function setLang(l) { lang = LANGS.includes(l) ? l : 'ru'; }
export function getLang() { return lang; }

export function fmt(s, vars = {}) {
  return String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
}

// t('hero.sub', { v }) — a dotted path into the current language
export function t(path, vars) {
  let v = STR[lang];
  for (const p of path.split('.')) v = v?.[p];
  if (v == null) {
    let r = STR.ru;
    for (const p of path.split('.')) r = r?.[p];
    v = r ?? path;
  }
  return vars ? fmt(v, vars) : v;
}

// "8 минут", "1 minute": the number with the right form of the word (forms: ru [1, 2–4, 5+], en [1, many])
export function plural(n, forms, l = lang) {
  if (!Array.isArray(forms)) return `${n} ${forms}`;
  if (l === 'ru') {
    const a = Math.abs(n) % 100, b = a % 10;
    const f = a > 10 && a < 20 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2;
    return `${n} ${forms[f] ?? forms[forms.length - 1]}`;
  }
  return `${n} ${n === 1 ? forms[0] : forms[1] ?? forms[0]}`;
}

// every leaf path of a strings tree (for the parity test)
export function leafPaths(o, pre = '') {
  const out = [];
  for (const [k, v] of Object.entries(o)) {
    const p = pre ? `${pre}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...leafPaths(v, p));
    else out.push(p);
  }
  return out;
}
