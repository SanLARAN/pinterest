// What's new: footer patch notes that open upward. The newest night first, older ones folded away.
// A dot on the tab while there's a version you haven't seen; folding the panel is remembered.
import { getLang } from '../core/i18n.js';

const KEY = 'hush.news.v1';

// newest first. date: YYYY-MM-DD
export const NEWS = [
  {
    v:'1.15',date:'2026-10-18',
    ru:{title:'Личное дело',items:[
      '«Профиль» в меню: регистрация, вход по почте и паролю, подтверждение адреса, восстановление пароля. Гостевая игра и комнаты по коду по-прежнему доступны без аккаунта',
      'Облачный гардероб, покупки, цвета и рисунок головы-экрана, личные рекорды, атлас и статистика. При первом входе — явный одноразовый перенос гостевого прогресса; исходная гостевая копия сохраняется',
      'Друзья по уникальному тегу, входящие и отправленные заявки, принятие, удаление, блокировка, статусы в сети/в лобби/в игре и приглашения в комнату. Приглашения не переключают комнату автоматически',
      'Кэш разделён по аккаунтам. Сбои сети не останавливают игру; изменения и награды ждут синхронизации. Конфликт с другим устройством требует выбора, а не молча перезаписывает данные',
      'Покупки проверяет сервер, повторные награды и импорт не дублируют осколки. Голос и движение остаются в WebRTC, аудиозаписи в облако не выгружаются. Для писем подтверждения и восстановления нужна настроенная почтовая служба проекта',
    ]},
    en:{title:'Personnel file',items:[
      'Profile in the menu: email/password registration, sign-in, confirmation and password recovery. Guest play and room codes remain available without an account',
      'Cloud wardrobe, purchases, dyes and CRT artwork, personal records, atlas and statistics. First sign-in offers an explicit one-time guest import; the original guest copy is kept',
      'Friends by unique tag, incoming/outgoing requests, accept/remove/block, online/lobby/run status and room invitations. Invitations never switch rooms automatically',
      'Account-separated local caches. Network failures do not stop gameplay; edits and rewards queue for sync. Conflicts with another device require a choice, never silent overwrites',
      'Server-priced purchases, idempotent rewards and imports. Voice and movement stay on WebRTC; no voice recordings are uploaded. Confirmation/recovery emails require the project mail service to be configured',
    ]},
  },
  {
    v:'1.14',date:'2026-10-18',
    ru:{title:'Зорька включает свет',items:[
      'Трава теперь растёт пятнами по полянам и лесу, а не только по краям троп. Разная густота, мягкое покачивание и затухание вдали; та же настоящая подсветка, без свечения',
      'Аптечный шкаф «Зорьки» закреплён на стене столовой, а не висит посреди комнаты',
      'У «Зорьки» отдельный местный генератор: удерживай E у панели шесть секунд. Он питает семь ламп — в обоих корпусах, столовой и на улице. Шум привлекает тварей; основная цепочка из пяти генераторов не стала длиннее',
      'Бесплатная голова-экран: рисунок 32 × 24, карандаш, ластик, отмена, надпись до 24 знаков и пиксельные портреты Слушателя, Ползуна, Наблюдателя, Ревуна и Тени. Рисуй мышью или пальцем, цвет люминофора меняется покраской',
      'Оформление экрана сохраняется и передаётся друзьям — в лобби, игре и эхо. Старые покупки, одежда и цвета сохранены',
    ]},
    en:{title:'Zarya switches the lights on',items:[
      'Patchy grass now fills open fields and forest floors, not just the trail edges. Varied density, gentle wind and distance fading; the same real lighting, no emissive route',
      'Zarya’s first-aid cabinet is mounted against the dining-room wall instead of floating in the room',
      'An independent local generator at Zarya: hold E at its panel for six seconds to power seven indoor and outdoor lamps. Repairs are noisy; the main five-generator quest remains unchanged',
      'Free CRT head: a 32 by 24 drawing, pencil, eraser, undo, up to 24 caption characters and pixel portraits of the Listener, Crawler, Watcher, Howler and Shade. Mouse and touch editing; dye the phosphor in Paint',
      'Your display is saved and shared with friends in the lobby, forest and echoes. Existing outfits, dyes and purchases are preserved',
    ]},
  },
  {
    v:'1.13',date:'2026-10-18',
    ru:{title:'Чай перед сменой',items:[
      'Зеркало вместе с рамой, дополнительный шкаф и помост убраны из гаража: игрок на стуле больше не перекрыт, а бочка свободна',
      'В главном меню твой выживший сидит на существующем стуле и пьёт чай. Открывая гардероб, ставит кружку на бочку и встаёт; при возвращении в меню садится обратно',
      '«Что нового» переехало в нижнюю строку. Панель раскрывается вверх без старого смещения за край экрана; кнопка сворачивания остаётся видимой при прокрутке, Esc закрывает панель',
    ]},
    en:{title:'Tea before the shift',items:[
      'The mirror and its frame, extra cabinet and platform are removed: the seated lobby player is no longer obscured, and the drum is clear',
      'Your survivor sits on the existing chair and drinks tea on the title screen. Opening the wardrobe puts the mug on the drum and stands them up; returning to the menu sits them down again',
      'What’s new moves to the footer. The panel opens upward within the viewport, with a sticky fold control and Escape support',
    ]},
  },
  {
    v:'1.12',date:'2026-10-18',
    ru:{title:'Перед ночной сменой',items:[
      'Главное меню теперь в живом гараже лесхоза: твой персонаж в выбранной одежде, машина, рабочая лампа, дождь по крыше и тёмный лес за воротами. Без долгой заставки',
      'Атлас больше не ссылка в меню: настоящая книга лежит на переднем верстаке. Нажми на неё — обложка приоткроется, и появится полевой журнал. Книга доступна с клавиатуры и на таче',
      'Гардероб — угол этого же гаража: шкафчик, зеркало с отражением и нейтральная рабочая лампа. Голова приближается при выборе головного убора; поворот, приближение и примерка работают мышью и пальцами',
      'Вещи оформлены как бирки с состояниями «надето», «надеть» и «примерить». Ненадетые платные комплекты можно посмотреть без покупки; при выходе примерка отменяется. Вся прежняя одежда, покраска и купленные вещи сохранены',
      'Около 1,2 км старых заросших троп: к генераторам, мед-хижине, «Зорьке», пожарной вышке и лесхозу. Земля, колеи, корни и трава видны при настоящем свете; эхо показывает лишь ближние фрагменты',
      'Тропы обходят озеро и препятствия. Деревья и крупный валежник не перекрывают узкий проход. Никаких светящихся линий, стрелок на экране или новой миникарты',
    ]},
    en:{title:'Before the night shift',items:[
      'The title screen is now the living forestry garage: your dressed survivor, your car, a work lamp, rain on the roof and dark trees outside. No long intro',
      'The atlas is no longer a menu link. A real book rests on the front workbench: click it to lift its cover and open the field journal. Keyboard and touch accessible',
      'The wardrobe is a corner of the same garage, with a locker, a reflecting mirror and neutral work light. Headwear gets a closer view; drag, wheel and pinch to inspect your survivor',
      'Clothes have equipment tags: equipped, equip or try on. Preview unowned paid sets without buying; leaving removes the preview. All existing outfits, colours and purchases are preserved',
      'About 1.2 km of old, overgrown paths lead to generators, the first-aid hut, Zarya, the fire lookout and the yard. Soil, ruts, roots and grass appear in actual light; echoes reveal only nearby fragments',
      'Paths skirt the lake and solid obstacles. Trees and large fallen logs leave the narrow corridor clear. No glowing route, screen arrows or new minimap',
    ]},
  },
  {
    v: '1.11', date: '2026-10-18',
    ru: {
      title: 'Не верь знакомому голосу',
      items: [
        'Ползун полностью перестроен: человеческий череп, разомкнутая челюсть, открытые рёбра и шесть длинных рук с пальцами. Рваная походка, новая поза охоты и скример',
        'I — настоящий рюкзак на четыре кармана, с движением рук и застёжки. ПКМ по предмету — взять в руки или выбросить. ЛКМ использует то, что держишь; предметных горячих клавиш больше нет',
        'Выброшенное остаётся в лесу: напарник может подобрать. Заряд фонаря и запись магнитофона сохраняются. Полный рюкзак не уничтожает находку; батарейки теперь отдельный предмет',
        'Тень повторяет целые фразы любого игрока без смены тембра, высоты и скорости — и может выглядеть как этот игрок. Только память текущей игры, не запись в меню; громкость и заглушение друзей учитываются',
        'TAB — поднять левую руку и взглянуть на цифровые часы: время, задача, генераторы, детали УАЗ, очки и команда. Прежняя всплывающая сводка убрана',
        'На стене гаража плакат «Настройки». Хозяин комнаты выбирает, скрывать ли имена игроков в лесу; правило одинаково у всех',
      ],
    },
    en: {
      title: 'Do not trust a familiar voice',
      items: [
        'A rebuilt Crawler: a human skull, broken jaw, exposed rib cage and six long, fingered arms. A ragged gait, new hunting pose and kill animation',
        'I opens a real four-pocket backpack with a shoulder reach and flap animation. RMB on an item: equip or drop. LMB uses the equipped item; per-item hotkeys are gone',
        'Dropped items stay in the woods for a teammate to pick up. Flashlight charge and recorder contents survive. A full bag never destroys loot; batteries are a separate item',
        'The Shade repeats complete phrases from any player without changing their voice, pitch or speed — and can wear their appearance. In-memory for this game only, never in the menu; friend volume and mute apply',
        'TAB raises your left wrist to a digital watch: time, objective, generators, UAZ parts, score and team. The old floating summary is gone',
        'A Settings poster on the garage wall lets the host hide player names in the woods. One rule for the entire room',
      ],
    },
  },
  {
    v: '1.10', date: '2026-10-17',
    ru: {
      title: '«Зорька» и пожарная вышка',
      items: [
        'Два новых места в лесу: пожарная вышка на северо-западе и заброшенный пионерлагерь «Зорька» на юго-западе. У костра — указатель',
        'На вышку нужно подниматься по скрипучей лестнице. Наверху бинокль: десять секунд зелёного изображения леса, генераторов и движущихся тварей — не сквозь стены',
        'В «Зорьке» два спальных корпуса, столовая и восемь шкафчиков с лутом. Громкоговоритель на линейке можно включить один раз за ночь — твари идут на старый горн',
        'Кассетный магнитофон: V — записать две секунды голоса, B — поставить приманку. Через три секунды она зазвучит на двадцать секунд. Два заряда; без микрофона — стук',
        'Лом у ворот лагеря и у вышки: удерживай E у запертого шкафчика. Взлом громкий; лом — не оружие',
        'В атласе шесть новых 3D-страниц: фонарик, магнитофон, лом, бинокль и оба новых места. Всё работает в коопе и с тач-управлением',
      ],
    },
    en: {
      title: 'Zarya and the fire lookout',
      items: [
        'Two new forest detours: a fire lookout to the northwest and the abandoned Zarya pioneer camp to the southwest. A signpost by the fire points the way',
        'Climb the creaking ladder. At the top, binoculars give ten seconds of green forest, generators and moving creatures — never through walls',
        'Zarya has two dormitories, a dining hall and eight cabinets with loot. The assembly-square loudspeaker works once a night — creatures follow its old bugle call',
        'Cassette recorder: V records two seconds of your voice, B places a lure. Three seconds of silence, then twenty seconds of playback. Two charges; without a mic, it knocks',
        'A crowbar by the camp gate and the lookout: hold E at a locked cabinet. Prying is loud; the bar is not a weapon',
        'Six new 3D atlas pages: flashlight, recorder, crowbar, binoculars and both places. Co-op and touch controls included',
      ],
    },
  },
  {
    v: '1.9', date: '2026-10-17',
    ru: {
      title: 'Фонарик — для того, чтобы глянуть',
      items: [
        'Фонарик ослаблен: батарейки на минуту, найден полуразряженным, луч короче и уже, запасные батарейки в шкафах реже',
        'Включённый фонарь видно издалека: тварь поблизости, которой ничто тебя не загораживает, идёт на свет',
        'Когда батарейка почти села, фонарь гаснет на мгновения — и в эти мгновения Наблюдатель делает рывок',
        'Бойкиссер больше не скручивается, когда наклоняет голову, а руки не остаются вывернутыми после жестов',
      ],
    },
    en: {
      title: 'The flashlight is for a quick look',
      items: [
        'A weaker flashlight: a minute of battery, found half flat, a shorter and narrower beam, spare batteries rarer in the cupboards',
        'A lit flashlight is seen from far off: anything near with nothing between you comes to the light',
        'When the battery is nearly flat, the light goes out for moments — and the Watcher lunges in those moments',
        "The Boykisser no longer screws itself round when it tilts its head, and its arms don't stay twisted after a gesture",
      ],
    },
  },
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
    if (this.st.folded === undefined) this.st.folded = true; // (small screens: just the tab)
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
    this.el.querySelector(on?'.news-tab':'.news-fold')?.focus({preventScroll:true});
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
