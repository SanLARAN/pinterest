// The atlas: chapters, entries and their text (RU / EN). Numbers come from the game's own config
// (speeds, hearing radii of each repair noise, arrival times) — see core/config.js.
//
// entry: { model, sound, kind: 'beast' | 'task' | 'thing' | 'place', rate?: [...0..5 | null], log: [[labelKey, statKey]] }
// text:  { name, latin, text: [p...], tips: [...], facts: [[label, value]...], quote? }
// fact values may use {h} (height) and {len} (longest side) — measured from the 3D model itself.

export const CHAPTERS = [
  { id: 'beasts', num: 'I', entries: ['listener', 'crawler', 'watcher', 'howler', 'shade'] },
  { id: 'tasks', num: 'II', entries: ['generator', 'corpse', 'fuel', 'plug', 'fuses', 'belt', 'battery', 'shard', 'stone', 'flare'] },
  { id: 'places', num: 'III', entries: ['camp', 'cabin', 'tower', 'stones', 'wreck'] },
];

export const ENTRIES = {
  listener: { model: 'listener', sound: 'listener', kind: 'beast', rate: [5, 2, 3, 3], log: [['seen', 'seen:listener'], ['killed', 'kills:listener']] },
  crawler: { model: 'crawler', sound: 'crawler', kind: 'beast', rate: [3, 3, 5, 4], log: [['seen', 'seen:crawler'], ['killed', 'kills:crawler']] },
  watcher: { model: 'watcher', sound: 'watcher', kind: 'beast', rate: [0, 5, 2, 4], log: [['seen', 'seen:watcher'], ['killed', 'kills:watcher']] },
  howler: { model: 'howler', sound: 'howler', kind: 'beast', rate: [2, 4, 5, 5], log: [['seen', 'seen:howler'], ['killed', 'kills:howler']] },
  shade: { model: 'shade', sound: 'shade', kind: 'beast', rate: [null, null, null, null], log: [['appeared', 'seen:shade']] },
  generator: { model: 'generator', sound: 'generator', kind: 'thing', log: [['started', 'gens'], ['wins', 'wins']] },
  corpse: { model: 'corpse', sound: 'corpse', kind: 'thing', log: [['searched', 'bodies']] },
  fuel: { model: 'fuel', sound: 'fuel', kind: 'task', gen: 1, rate: [2, 1], log: [['fitted', 'part:0']] },
  plug: { model: 'plug', sound: 'plug', kind: 'task', gen: 2, rate: [1, 2], log: [['fitted', 'part:1']] },
  fuses: { model: 'fuses', sound: 'fuses', kind: 'task', gen: 3, rate: [4, 3], log: [['fitted', 'part:2']] },
  belt: { model: 'belt', sound: 'belt', kind: 'task', gen: 4, rate: [4, 4], log: [['fitted', 'part:3']] },
  battery: { model: 'battery', sound: 'battery', kind: 'task', gen: 5, rate: [5, 5], log: [['fitted', 'part:4']] },
  shard: { model: 'shard', sound: 'shard', kind: 'thing', log: [['found', 'shards']] },
  stone: { model: 'stone', sound: 'stone', kind: 'thing', log: [['thrown', 'stones']] },
  flare: { model: 'flare', sound: 'flare', kind: 'thing', log: [['fired', 'flares']] },
  camp: { model: 'camp', kind: 'place', log: [['startedHere', 'site:camp']] },
  cabin: { model: 'cabin', kind: 'place', log: [['startedHere', 'site:cabin']] },
  tower: { model: 'tower', kind: 'place', log: [['startedHere', 'site:tower']] },
  stones: { model: 'stones', kind: 'place', log: [['startedHere', 'site:stones']] },
  wreck: { model: 'wreck', kind: 'place', log: [['startedHere', 'site:wreck']] },
};

const TEXT = {
  ru: {
    ui: {
      title: 'АТЛАС',
      subtitle: 'полевые записи о лесе',
      found: 'Нашёлся в рюкзаке у палатки. Писал тот, кто был здесь до тебя. Последние страницы дописываешь ты.',
      contents: 'оглавление',
      toContents: 'к оглавлению',
      journal: 'твой журнал',
      survive: 'как выжить',
      howTo: 'как делать',
      facts: 'приметы',
      fromNotes: 'из записок',
      voice: 'голос',
      sound: 'звук',
      notSeen: 'ещё не встречен',
      hint: 'потяни — повернуть · клик — эхо',
      hintTouch: 'веди пальцем — повернуть · тап — эхо',
      fig: 'рис.',
      page: 'стр.',
      prev: 'назад',
      next: 'дальше',
      close: 'закрыть',
      fresh: 'новое',
      gen: 'генератор №{n}',
      keys: 'листать · Esc — закрыть',
      unknown: '?',
      m: 'м',
      cm: 'см',
      mm: 'мм',
    },
    chapters: { beasts: 'Твари', tasks: 'Задачи', places: 'Места' },
    rate: { beast: ['слух', 'чутьё', 'скорость', 'угроза'], task: ['шум', 'время'] },
    log: {
      seen: 'ночей рядом', killed: 'убил тебя', appeared: 'являлась', started: 'запущено при тебе', wins: 'побед',
      searched: 'обыскано тел', fitted: 'поставлено', found: 'найдено', thrown: 'брошено', fired: 'выпущено', startedHere: 'запущено здесь',
      nights: 'ночей', best: 'дольше всего', deaths: 'смертей', screams: 'закричал', gens: 'генераторов',
    },
    entries: {
      listener: {
        name: 'Слушатель', latin: 'Auscultator cornutus',
        text: [
          'Высокий, сутулый, с ветвистыми рогами. Глаза у него есть, но живёт он ушами: бродит, замирает, склоняет голову набок — и слушает.',
          'Любой звук он запоминает и идёт проверить. Не к тебе — к месту, где звук был. Если звук совсем рядом или это крик — бросается сразу.',
        ],
        tips: [
          'Пискнул — уходи с места. Он придёт туда, где ты был.',
          'Не беги мимо: бег в паре метров он чувствует. Рядом — только красться (C).',
          'Камень уводит его. Даже в погоне — если ты затих, а камень упал ближе к нему, чем ты.',
        ],
        facts: [['рост с рогами', '{h}'], ['шаг · охота', '1.0 · 4.7–5.5 м/с'], ['ты бежишь', '5.7 м/с'], ['бросает погоню', '~6 с тишины'], ['в лесу', 'от 2 до 6 к 25-й минуте']],
        quote: 'И тише. ОНИ слышат.',
      },
      crawler: {
        name: 'Ползун', latin: 'Reptans hexapus',
        text: [
          'Низкий, на шести тонких лапах, голова у самой земли. Голоса он слышит хуже Слушателя, зато шаги — лучше всех: чувствует их через землю.',
          'Он быстрее тебя, и по прямой от него не убежать. Зато погоню бросает быстро — стоит тебе затихнуть.',
        ],
        tips: [
          'Рядом с ним — только красться: бег он слышит издалека.',
          'Погнался — не беги прямо. Замри или брось камень: без нового звука он потеряет тебя секунды через три.',
        ],
        facts: [['длина', '{len}'], ['шаг · охота', '1.6 · 6.1–7.2 м/с'], ['слух на шаги', '×2.2'], ['бросает погоню', '~3 с тишины'], ['в лесу', 'с 4-й минуты · до 3 к 20-й']],
        quote: 'Ползучий быстрее меня. Я проверил.',
      },
      watcher: {
        name: 'Наблюдатель', latin: 'Spectator sine facie',
        text: [
          'Слишком высокий, слишком худой, лица нет. Он глух — не услышит даже крика. Шагов у него нет: только хруст суставов и тонкий звон в ушах, который растёт, когда он близко.',
          'Он двигается только в темноте. Пока на него падает свет — эхо или лампа, — он стоит. Каждый раз, когда эхо находит его, он чуть ближе.',
        ],
        tips: [
          'Звон нарастает — обернись и подай звук. Эхо его останавливает.',
          'В свет работающего генератора он не войдёт. Но и ждать у края лампы долго не станет.',
          'Если держать его на свету слишком долго, он исчезнет — и вернётся позже, за спиной.',
        ],
        facts: [['рост', '{h}'], ['слух', 'нет'], ['шаг в темноте', '3.5 м/с'], ['приходит', '4-я минута или 2-й генератор'], ['в лесу', 'один']],
        quote: 'Там ходит высокий, без лица. Пока на него падает свет — он не двигается. Не давай ему темноты.',
      },
      howler: {
        name: 'Ревун', latin: 'Ululator caecus',
        text: [
          'Огромный, ходит на костяшках рук, грудь — как кузнечные мехи. Почти глухой: слышит только громкое.',
          'Раз в полминуты он набирает воздух и воет. Вой — его глаза: волна катится по лесу, и всё, что в ней движется, он видит. И бросается.',
        ],
        tips: [
          'Услышал глубокий вдох — замри. Не иди, не крадись, не заряжай эхо.',
          'Стоишь — он смотрит сквозь тебя. Волна достаёт метров на сорок шесть.',
          'В погоне он лает каждую секунду и каждым лаем снова ищет движение. Уйди с места, где он тебя увидел, — и снова замри.',
        ],
        facts: [['рост', '{h}'], ['слышит', 'только громкое'], ['охота', '6.4–7.6 м/с'], ['вой', 'раз в 24–38 с · ~46 м'], ['приходит', '8-я минута или 3-й генератор'], ['в лесу', 'один']],
        quote: 'Услышишь глубокий вдох — замри. Оно видит своим воем: кто шевелится, того и берёт.',
      },
      shade: {
        name: 'Тень', latin: 'Umbra incerta',
        text: [
          'Силуэт на краю взгляда: длинные волосы, руки ниже колен. Обернёшься — пусто. Подашь звук — она уже ближе. Или нет.',
          'Её видели многие. Никто не может сказать, что ей нужно.',
        ],
        tips: [
          'Не кричи. Что бы ты ни увидел.',
          'Иногда лес повторяет твой голос. Не иди на него.',
        ],
        facts: [['рост', '{h}'], ['слух', '?'], ['скорость', '?'], ['приходит', 'когда не ждёшь']],
        quote: 'Я видел её у костра. Утром там ничего не было.',
      },
      generator: {
        name: 'Генератор', latin: 'ГБ-2200 «Луч», переносной',
        text: [
          'Бензиновый генератор на салазках, с рабочей лампой на шесте. Их пять: в лагере и у четырёх мест в лесу — каждую ночь в другом порядке.',
          'Запусти все пять — и тьма отступит. Генератор, о котором ты уже знаешь, пищит рацией: иди на писк. Заработал — загудел и зажёг лампу.',
        ],
        tips: [
          'Откуда пришёл писк, показывает янтарная чёрточка у точки в центре экрана.',
          'Запуск ревёт на весь лес — слышно метров на сорок–пятьдесят. Запустил — уходи.',
          'В тёплом круге лампы (~10 м) видно тварей, а Наблюдатель туда не войдёт.',
        ],
        facts: [['всего', '5'], ['очки', '2000 × множитель'], ['свет лампы', '~10 м'], ['победа', '5 из 5 · бонус за скорость']],
        quote: 'Свет вырубился разом, генератор заглох.',
      },
      corpse: {
        name: 'Тело', latin: 'тот, кто пытался раньше',
        text: [
          'У каждого генератора лежит тело: лицом в землю, рука тянется к машине. На спине приколота записка, у руки — холщовая сумка с инструментом.',
          'Обыщи его (удерживай E): в сумке деталь для этого генератора, в записке — где искать следующий.',
        ],
        tips: [
          'Когда эхо касается тела, внутри что-то сжимается. Ты почувствуешь.',
          'Над телами вьются мухи — вблизи их слышно.',
          'Сумка светится янтарём, когда её находит звук.',
        ],
        facts: [['тел', '5 — по одному у генератора'], ['очки', '400 × множитель'], ['обыск', 'удерживать E']],
        quote: 'Продержись. Я не смог.',
      },
      fuel: {
        name: 'Канистра бензина', latin: 'генератор №1 · всегда в лагере',
        text: [
          'Первый генератор — в лагере, всегда. Он заглох вместе со светом; канистра лежит у тела между тобой и ним.',
          'Залей бензин — четыре секунды бульканья и негромкого стука. Потом дёрни стартовый шнур: три рывка, и каждый слышно метров на двадцать.',
        ],
        tips: ['Перед рывками послушай лес: шнур слышно дальше, чем кажется.'],
        facts: [['работа', '4 с + 3 рывка'], ['стук', '~7 м'], ['шнур', '~20 м'], ['запуск', '~39 м']],
        quote: 'Бензин в канистре — залей и дёрни шнур.',
      },
      plug: {
        name: 'Свеча зажигания', latin: 'генератор №2',
        text: [
          'Выкрутить старую, вкрутить новую. Семь секунд тихой работы — самая спокойная починка за ночь.',
          'После второго генератора (или к четвёртой минуте) в лесу появляется Наблюдатель — записка предупреждает.',
        ],
        tips: ['Тихо — не значит неслышно: стук ключа слышно метров на восемь.'],
        facts: [['работа', '7 с'], ['стук', '~8 м'], ['запуск', '~40 м']],
        quote: 'Свечу я выкрутил, держи.',
      },
      fuses: {
        name: 'Предохранители', latin: 'генератор №3',
        text: [
          'Девять секунд в коробке с проводкой. Она коротит: каждые одну–три секунды хлопает искра — её слышно метров за тридцать.',
          'После третьего генератора (или к восьмой минуте) просыпается Ревун.',
        ],
        tips: ['Между искрами слушай лес.', 'Перед работой брось камень подальше — пусть идут туда.'],
        facts: [['работа', '9 с'], ['искры', '~31 м · каждые 1–3 с'], ['запуск', '~42 м']],
        quote: 'Предохранители в кармане. Искрят — будет громко.',
      },
      belt: {
        name: 'Приводной ремень', latin: 'генератор №4',
        text: [
          'Снят с разбитой машины. Натянуть его — десять секунд почти непрерывного лязга металла.',
          'Самая громкая работа руками за ночь. К этому времени в лесу уже все.',
        ],
        tips: ['Сначала уведи тех, кто рядом: камень подальше — и только потом за ключ.'],
        facts: [['работа', '10 с'], ['лязг', '~17 м · каждые ~0.8 с'], ['запуск', '~44 м']],
        quote: 'Ремень снял с машины. Камень уводит их в сторону: брось подальше — и иди.',
      },
      battery: {
        name: 'Аккумулятор', latin: 'генератор №5 · последний',
        text: [
          'Подключить — восемь секунд. А потом генератор долго раскручивается: девять секунд рёва, который слышит поллеса.',
          'Продержись до конца раскрутки — и пятый генератор загудит. Свет.',
        ],
        tips: ['Во время раскрутки не стой у машины: шумит она, а не ты.'],
        facts: [['работа', '8 с + 9 с раскрутки'], ['раскрутка', '~25 м, снова и снова'], ['запуск', '~49 м']],
        quote: 'Аккумулятор ещё держит. Подключи — генератор долго раскручивается и ревёт на весь лес.',
      },
      shard: {
        name: 'Янтарный осколок', latin: 'сорок шесть по всему лесу',
        text: [
          'Осколки янтаря, разбросанные по лесу. Когда их касается волна, они звенят и долго светятся — над каждым встаёт тонкий столб света.',
          'Подбери: очки, вспышка янтарного света вокруг — и камень в руку.',
        ],
        tips: ['Звон осколка — хороший ориентир в темноте.', 'Кончились камни — ищи осколки.'],
        facts: [['в лесу', '46'], ['очки', '250 × множитель'], ['даёт', '+1 камень · свет ~7 м']],
      },
      stone: {
        name: 'Камень', latin: 'оружие против их слуха',
        text: [
          'Камни не ранят тварей. Они обманывают их слух: где камень упадёт, там будет стук и эхо — туда и пойдут те, кто рядом.',
          'ПКМ или F — бросок (на телефоне — кнопка КАМЕНЬ). Больше трёх не унести; новый находишь сам примерно раз в минуту.',
        ],
        tips: ['В погоне камень сработает, если ты затих, а он упал ближе к твари, чем ты.', 'Брось подальше — и иди в другую сторону.'],
        facts: [['с собой', 'до 3'], ['новый', '~55 с'], ['ещё', '+1 за осколок']],
        quote: 'Камень уводит их в сторону: брось подальше — и иди.',
      },
      flare: {
        name: 'Ракетница', latin: 'одна на ночь · два заряда',
        text: [
          'Сигнальный пистолет с толстым стволом и два патрона к нему. Каждую ночь он лежит у другого тела — у одного из четырёх в лесу. Обыщешь — заберёшь.',
          'Q (на телефоне — кнопка РАКЕТА) — выстрел. Ракета уходит туда, куда смотришь, чуть выше, хлопает в верхней точке и медленно опускается на парашюте, секунд пятнадцать заливая лес красным. В этом свете видно всё — и всех.',
          'Но смотришь на него не ты один. На свет сходятся все твари с округи — бегом.',
        ],
        tips: ['Стреляй подальше от себя: пусть идут туда, а ты — в другую сторону.', 'Наблюдатель в её свете замирает: пока ракета горит, ему не подойти.', 'Попадёт в дерево — упадёт и догорит у корней. В озеро — погаснет.'],
        facts: [['заряды', '2'], ['горит', '~15 с'], ['свет', 'на ~80 м вокруг'], ['зовёт', 'на ~140 м']],
      },
      camp: {
        name: 'Лагерь', latin: 'старая просека · генератор №1',
        text: [
          'Кострище в кольце камней, два бревна-скамьи, упавшая палатка, брошенный рюкзак. Здесь ты просыпаешься утром.',
          'Первый генератор — всегда здесь. Тело лежит между тобой и ним. Утром его не было.',
        ],
        tips: ['Утром не уходи далеко от лагеря. Осмотрись, пока светло.'],
        facts: [['генератор', '№1, всегда'], ['утро', '32 секунды'], ['размер', '{len}']],
      },
      cabin: {
        name: 'Охотничья избушка', latin: 'генератор №2–5',
        text: [
          'Бревенчатый сруб под двускатной крышей. Дверь из толстых досок на кованых петлях — её можно закрыть (E). Внутри — стол и нары, у крыльца — столбы и остатки забора.',
          'Генератор стоит где-то у сруба, тело — рядом с ним.',
        ],
        tips: ['В лесу есть и вторая избушка. Генератор — только у одной.', 'Закрытая дверь задержит тварь: бродячая навалится, и дверь со скрипом подастся; та, что охотится, выбьет её в три удара — ты услышишь.'],
        facts: [['генератор', 'один из №2–5 · каждую ночь по-новому'], ['дверь', 'закрывается · E'], ['размер', '{len}']],
      },
      tower: {
        name: 'Старая вышка', latin: 'генератор №2–5',
        text: [
          'Ржавая решётчатая вышка с антеннами на макушке. У подножия — будка генераторной и бочки с топливом.',
          'Эхо долго ползёт вверх по её фермам — её ни с чем не спутаешь.',
        ],
        tips: ['Вышек в лесу две. Генератор — у одной.'],
        facts: [['генератор', 'один из №2–5 · каждую ночь по-новому'], ['высота', '{h}']],
      },
      stones: {
        name: 'Каменный круг', latin: 'генератор №2–5',
        text: [
          'Девять стоячих камней по кругу, пара повалена. В центре — плоский камень-алтарь, на нём что-то красное.',
          'Здесь тише, чем должно быть.',
        ],
        tips: ['Есть и второй круг, поменьше, из семи камней. Генератор — только у большого.'],
        facts: [['генератор', 'один из №2–5 · каждую ночь по-новому'], ['размер', '{len}']],
      },
      wreck: {
        name: 'Разбитая машина', latin: 'генератор №2–5',
        text: [
          'Грузовик у старой дороги: кузов перекошен, одного колеса нет, дверь сорвана. Вдоль обочины — покосившиеся столбики.',
          'Ремень для четвёртого генератора сняли с такой же.',
        ],
        tips: ['Таких машин в лесу две. Генератор — только у одной.'],
        facts: [['генератор', 'один из №2–5 · каждую ночь по-новому'], ['размер', '{len}']],
      },
    },
  },

  en: {
    ui: {
      title: 'ATLAS',
      subtitle: 'field notes on the forest',
      found: "Found in the backpack by the tent. Written by whoever was here before you. The last pages are yours to write.",
      contents: 'contents',
      toContents: 'to contents',
      journal: 'your journal',
      survive: 'how to survive',
      howTo: 'how to',
      facts: 'field marks',
      fromNotes: 'from the notes',
      voice: 'voice',
      sound: 'sound',
      notSeen: 'not met yet',
      hint: 'drag to turn · click for an echo',
      hintTouch: 'drag to turn · tap for an echo',
      fig: 'fig.',
      page: 'p.',
      prev: 'back',
      next: 'next',
      close: 'close',
      fresh: 'new',
      gen: 'generator #{n}',
      keys: 'turn pages · Esc to close',
      unknown: '?',
      m: 'm',
      cm: 'cm',
      mm: 'mm',
    },
    chapters: { beasts: 'Creatures', tasks: 'Objectives', places: 'Places' },
    rate: { beast: ['hearing', 'senses', 'speed', 'threat'], task: ['noise', 'time'] },
    log: {
      seen: 'nights near it', killed: 'killed you', appeared: 'appeared', started: 'started with you', wins: 'wins',
      searched: 'bodies searched', fitted: 'fitted', found: 'found', thrown: 'thrown', fired: 'fired', startedHere: 'started here',
      nights: 'nights', best: 'longest', deaths: 'deaths', screams: 'screamed', gens: 'generators',
    },
    entries: {
      listener: {
        name: 'Listener', latin: 'Auscultator cornutus',
        text: [
          'Tall, hunched, crowned with branching antlers. It has eyes, but it lives by its ears: it wanders, stops, tilts its head — and listens.',
          'It remembers every sound and goes to check. Not to you — to where the sound was. If the sound is right next to it, or a scream, it charges at once.',
        ],
        tips: [
          'Made a noise? Move. It will come to where you were.',
          "Don't run past it: it feels running within a couple of metres. Near it, only sneak (C).",
          "A stone draws it away. Even in a chase — if you've gone quiet and the stone lands closer to it than you are.",
        ],
        facts: [['height with antlers', '{h}'], ['walk · hunt', '1.0 · 4.7–5.5 m/s'], ['you sprint', '5.7 m/s'], ['gives up', '~6 s of silence'], ['in the forest', 'from 2 up to 6 by minute 25']],
        quote: 'And be quiet. THEY hear.',
      },
      crawler: {
        name: 'Crawler', latin: 'Reptans hexapus',
        text: [
          'Low, on six thin legs, its head almost on the ground. It hears voices worse than the Listener, but footsteps better than anything: it feels them through the earth.',
          'It is faster than you, and you will not outrun it in a straight line. But it gives up quickly — as soon as you go quiet.',
        ],
        tips: [
          'Near it, only sneak: it hears running from far away.',
          "If it charges, don't run straight. Freeze or throw a stone: with no new sound it loses you in about three seconds.",
        ],
        facts: [['length', '{len}'], ['walk · hunt', '1.6 · 6.1–7.2 m/s'], ['hears steps', '×2.2'], ['gives up', '~3 s of silence'], ['in the forest', 'from minute 4 · up to 3 by minute 20']],
        quote: 'The crawling one is faster than me. I checked.',
      },
      watcher: {
        name: 'Watcher', latin: 'Spectator sine facie',
        text: [
          'Too tall, too thin, no face. It is deaf — it would not hear a scream. It has no footsteps: only joints creaking and a thin ringing in your ears that grows as it comes close.',
          'It moves only in the dark. While light is on it — an echo or a lamp — it stands still. Every time your echo finds it, it is a little closer.',
        ],
        tips: [
          'The ringing grows? Turn around and make a sound. The echo stops it.',
          "It won't step into the light of a running generator. But it won't wait at the edge of a lamp for long either.",
          'Keep it lit for too long and it vanishes — and comes back later, behind you.',
        ],
        facts: [['height', '{h}'], ['hearing', 'none'], ['in the dark', '3.5 m/s'], ['arrives', 'minute 4 or generator #2'], ['in the forest', 'one']],
        quote: "Something tall walks there, no face. While light is on it, it can't move. Don't give it the dark.",
      },
      howler: {
        name: 'Howler', latin: 'Ululator caecus',
        text: [
          'Huge, it walks on its knuckles, its chest like a blacksmith\u2019s bellows. Nearly deaf: it hears only loud things.',
          'Every half a minute it fills its chest and howls. The howl is its eyes: the wave rolls through the forest and it sees whatever moves inside it. Then it charges.',
        ],
        tips: [
          "Hear a deep breath in? Freeze. Don't walk, don't sneak, don't charge an echo.",
          'Stand still and it looks right through you. The wave reaches about forty-six metres.',
          'In a chase it barks every second, and every bark looks for movement again. Get off the spot where it saw you — then freeze again.',
        ],
        facts: [['height', '{h}'], ['hears', 'only loud things'], ['hunt', '6.4–7.6 m/s'], ['howls', 'every 24–38 s · ~46 m'], ['arrives', 'minute 8 or generator #3'], ['in the forest', 'one']],
        quote: 'If you hear a deep breath in — freeze. It sees with its howl: whatever moves, it takes.',
      },
      shade: {
        name: 'Shade', latin: 'Umbra incerta',
        text: [
          'A silhouette at the edge of your sight: long hair, arms below the knees. Turn around — nothing. Make a sound — it is closer. Or not.',
          'Many have seen it. Nobody can say what it wants.',
        ],
        tips: [
          "Don't scream. Whatever you see.",
          "Sometimes the forest repeats your voice. Don't follow it.",
        ],
        facts: [['height', '{h}'], ['hearing', '?'], ['speed', '?'], ['arrives', "when you don't expect it"]],
        quote: 'I saw it by the fire. In the morning there was nothing there.',
      },
      generator: {
        name: 'Generator', latin: 'GB-2200 "Ray", portable',
        text: [
          'A petrol generator on skids, with a work lamp on a pole. There are five: at the camp and by four places in the forest — in a different order every night.',
          'Start all five and the dark gives way. A generator you know about chirps on its radio: follow the beeps. Once it runs, it hums and lights its lamp.',
        ],
        tips: [
          'An amber tick by the dot in the middle of the screen shows where the beep came from.',
          'Starting it roars through the forest — heard forty to fifty metres away. Start it, then leave.',
          "In the warm circle of its lamp (~10 m) the creatures can be seen, and the Watcher won't come in.",
        ],
        facts: [['in total', '5'], ['score', '2000 × multiplier'], ['lamp light', '~10 m'], ['victory', '5 of 5 · speed bonus']],
        quote: 'The lights died all at once and the generator stalled.',
      },
      corpse: {
        name: 'The body', latin: 'whoever tried before you',
        text: [
          'By every generator lies a body: face down, one arm reaching for the machine. A note is pinned to its back; by its hand, a canvas tool bag.',
          'Search it (hold E): the bag holds the part for this generator, the note tells you where to look for the next.',
        ],
        tips: [
          'When your echo touches a body, something tightens in your chest. You will feel it.',
          'Flies circle the bodies — you can hear them up close.',
          'The bag glows amber when a sound finds it.',
        ],
        facts: [['bodies', '5 — one by each generator'], ['score', '400 × multiplier'], ['search', 'hold E']],
        quote: "Hold on. I couldn't.",
      },
      fuel: {
        name: 'A can of fuel', latin: 'generator #1 · always at the camp',
        text: [
          'The first generator is at the camp, always. It stalled with the lights; the can lies by the body between you and it.',
          'Pour the fuel — four seconds of glugging and quiet knocks. Then pull the starter cord: three pulls, and each is heard twenty metres away.',
        ],
        tips: ['Listen to the forest before you pull: the cord carries further than you think.'],
        facts: [['work', '4 s + 3 pulls'], ['knocks', '~7 m'], ['cord', '~20 m'], ['start', '~39 m']],
        quote: "Fuel's in the can — pour it in, pull the cord.",
      },
      plug: {
        name: 'A spark plug', latin: 'generator #2',
        text: [
          'Out with the old one, in with the new. Seven seconds of quiet work — the calmest repair of the night.',
          'After the second generator (or by minute four) the Watcher appears in the forest — the note warns you.',
        ],
        tips: ['Quiet is not silent: the wrench is heard about eight metres away.'],
        facts: [['work', '7 s'], ['knocks', '~8 m'], ['start', '~40 m']],
        quote: "I took the spark plug out — it's yours.",
      },
      fuses: {
        name: 'Fuses', latin: 'generator #3',
        text: [
          'Nine seconds inside a box of wiring. It shorts out: every one to three seconds a spark snaps — heard thirty metres away.',
          'After the third generator (or by minute eight) the Howler wakes.',
        ],
        tips: ['Listen to the forest between the sparks.', 'Before you start, throw a stone far — let them go there.'],
        facts: [['work', '9 s'], ['sparks', '~31 m · every 1–3 s'], ['start', '~42 m']],
        quote: 'Fuses are in my pocket. They spark — it will be loud.',
      },
      belt: {
        name: 'A drive belt', latin: 'generator #4',
        text: [
          'Pulled off the wrecked truck. Fitting it means ten seconds of almost constant clanging metal.',
          'The loudest handiwork of the night. By now, everything is out there.',
        ],
        tips: ['Lead them away first: a stone far off — and only then the wrench.'],
        facts: [['work', '10 s'], ['clanks', '~17 m · every ~0.8 s'], ['start', '~44 m']],
        quote: 'Pulled the belt off the truck. A stone pulls them away: throw it far, then walk.',
      },
      battery: {
        name: 'A battery', latin: 'generator #5 · the last',
        text: [
          'Eight seconds to hook it up. Then the generator takes its time to spin up: nine seconds of roaring that half the forest hears.',
          'Hold on until it catches — and the fifth generator hums. Light.',
        ],
        tips: ["While it spins up, don't stand by the machine: it is making the noise, not you."],
        facts: [['work', '8 s + 9 s spin-up'], ['spin-up', '~25 m, again and again'], ['start', '~49 m']],
        quote: 'The battery still holds. Hook it up — it takes forever to spin up and roars the whole forest awake.',
      },
      shard: {
        name: 'Amber shard', latin: 'forty-six across the forest',
        text: [
          'Shards of amber scattered through the forest. When a wave touches them they ring and glow for a long while — a thin pillar of light rises over each.',
          'Pick one up: points, a flash of amber light around you — and a stone in your hand.',
        ],
        tips: ["A shard's ring is a good landmark in the dark.", 'Out of stones? Look for shards.'],
        facts: [['in the forest', '46'], ['score', '250 × multiplier'], ['gives', '+1 stone · light ~7 m']],
      },
      stone: {
        name: 'Stone', latin: 'a weapon against their hearing',
        text: [
          "Stones don't hurt the creatures. They fool their hearing: where a stone lands there is a knock and an echo — and whatever is near goes there.",
          'RMB or F to throw (on a phone — the STONE button). You can carry three at most; you find a new one by yourself about once a minute.',
        ],
        tips: ["In a chase a stone works if you've gone quiet and it lands closer to the creature than you are.", 'Throw it far — then walk the other way.'],
        facts: [['carry', 'up to 3'], ['new one', '~55 s'], ['also', '+1 per shard']],
        quote: 'A stone pulls them away: throw it far, then walk.',
      },
      flare: {
        name: 'Flare gun', latin: 'one a night · two shots',
        text: [
          'A fat-barrelled signal pistol and two cartridges for it. Every night it lies by a different body — one of the four out in the forest. Search the body and it is yours.',
          'Q (on a phone — the FLARE button) fires. The flare goes where you look, a little higher, pops at the top of its arc and sinks slowly under a parachute, flooding the forest with red for about fifteen seconds. In that light you see everything — and everyone.',
          'But you are not the only one looking at it. Every creature around comes to the light — at a run.',
        ],
        tips: ['Fire it away from yourself: let them go there while you go the other way.', 'The Watcher freezes in its light: while the flare burns it cannot come for you.', 'Into a tree — it drops and burns out among the roots. Into the lake — it drowns.'],
        facts: [['shots', '2'], ['burns', '~15 s'], ['light', '~80 m around'], ['calls', 'from ~140 m']],
      },
      camp: {
        name: 'The camp', latin: 'an old clearing · generator #1',
        text: [
          'A fire pit in a ring of stones, two log benches, a collapsed tent, an abandoned backpack. This is where you wake in the morning.',
          "The first generator is always here. A body lies between you and it. It wasn't there in the morning.",
        ],
        tips: ["In the morning don't stray far from the camp. Look around while it's light."],
        facts: [['generator', '#1, always'], ['morning', '32 seconds'], ['size', '{len}']],
      },
      cabin: {
        name: 'Hunting cabin', latin: 'generator #2–5',
        text: [
          'A log cabin under a gable roof. A door of thick planks on strap hinges — it closes (E). Inside, a table and a bunk; by the porch, posts and what is left of a fence.',
          'The generator stands somewhere by the cabin, the body beside it.',
        ],
        tips: ['There is a second cabin in the forest. Only one has a generator.', 'A shut door holds them for a while: a wanderer leans on it until it creaks open; the one hunting you breaks it down in three blows — you will hear it.'],
        facts: [['generator', 'one of #2–5 · reshuffled every night'], ['door', 'closes · E'], ['size', '{len}']],
      },
      tower: {
        name: 'Old tower', latin: 'generator #2–5',
        text: [
          'A rusted lattice tower with antennas at the top. At its foot, a generator shed and fuel barrels.',
          'An echo crawls up its girders for a long time — you will not mistake it for anything else.',
        ],
        tips: ['There are two towers in the forest. Only one has a generator.'],
        facts: [['generator', 'one of #2–5 · reshuffled every night'], ['height', '{h}']],
      },
      stones: {
        name: 'Stone circle', latin: 'generator #2–5',
        text: [
          'Nine standing stones in a ring, a couple of them fallen. In the middle, a flat altar stone with something red on it.',
          'It is quieter here than it should be.',
        ],
        tips: ['There is a second, smaller circle of seven stones. Only the big one has a generator.'],
        facts: [['generator', 'one of #2–5 · reshuffled every night'], ['size', '{len}']],
      },
      wreck: {
        name: 'Wrecked truck', latin: 'generator #2–5',
        text: [
          'A truck by the old road: its body twisted, a wheel missing, a door torn off. Leaning posts line the roadside.',
          'The belt for the fourth generator came off one just like it.',
        ],
        tips: ['There are two such trucks in the forest. Only one has a generator.'],
        facts: [['generator', 'one of #2–5 · reshuffled every night'], ['size', '{len}']],
      },
    },
  },
};

export function atlasText(lang) {
  return TEXT[lang] || TEXT.ru;
}

// every page in reading order: the contents first, then the chapters
export function pageList() {
  const pages = [{ id: 'contents', chapter: null }];
  for (const c of CHAPTERS) for (const id of c.entries) pages.push({ id, chapter: c.id });
  return pages;
}
