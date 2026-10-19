// What's new: footer patch notes that open upward. The newest night first, older ones folded away.
// A dot on the tab while there's a version you haven't seen; folding the panel is remembered.
import { getLang } from '../core/i18n.js';

const KEY = 'hush.news.v1';

// newest first. date: YYYY-MM-DD
export const NEWS = [
  {
    v:'2.1',date:'2026-10-19',
    ru:{title:'Смена затянулась',items:[
      'Смена стала четыре дня: ночь — 8 минут, утро — 1 минута 45 секунд. Лимита «45 минут» больше нет: рассветы первых трёх ночей — передышка, рассвет четвёртой — победа. Через четыре минуты после начала четвёртой ночи лес просыпается окончательно',
      'Рассвет поднимает павших: кто лежал или истёк к утру — встаёт на ногах там, где его застал свет. Шкафандр оставляет себе то, что взял. Каждое падение укорачивает следующее кровотечение',
      'Опасность растёт и ночью, и с каждым пережитым днём: множитель шагает каждые четыре минуты ночи и прибавляет половину за каждый рассвет. Генераторы не гаснут наутро: починенный лагерный генератор держит свет до конца смены',
      'Рюкзак открывается по-настоящему: объёмный ранец с четырьмя карманами — вращай перетаскиванием, предметы поднимаются из карманов. Плоская сетка остаётся на сенсорных экранах',
      'Руки работают: за спиной дотягиваются до лямок и снимают рюкзак, у генератора тело приседает и налегает на машину, а ключ ходит по гайкам в такт ударам',
      'Шприц с адреналином: подними павшего друга прямо на месте (1,5 секунды, 2,2 метра), без носилки и койки. Пять минут «резиновых ног»: ходьба ×0.8, бег ×0.72, выносливость горит ×1.65. За смену в лесу их два, и только в совместной игре',
      'Ворота в гараже открываются: щеколда, створки, мотор, все садятся — и машина выезжает на полигон. Стоянка со всеми девятью предметами, мишени и четыре эндуро-мотоцикла с подвеской, наклоном, прыжками и настоящими столкновениями — по одному на каждого. Кнопка «ПОЛИГОН» в меню играет тот же фильм в одиночку',
      'Ракетница возвращается каждую ночь к новому телу; повторная находка — один патрон, а не два. Часы показывают день смены и считают время до рассвета. Протокол 14 — обновите страницу у всей комнаты',
      'Починка полигона: там теперь можно ходить, брать всё со стеллажа и кататься. Раньше выезд за ворота оставался стоячей картинкой. На мотоцикле E только сажает и слезет, обзор сидит на седле и кренится вместе с ним, стеллаж и мотоциклы больше не спорят за одну клавишу',
      'Рюкзак в руках стал читаемым: у него своя подсветка сверху слева, швы, стяжки и стальное кольцо, лямка руки уходит из кадра, а лес за ним мягко затемняется — ночь больше не съедает тёмную ткань',
      'Телефон держится с первого кадра: тач-режим включается сразу (без «нажмите, чтобы захватить курсор»), в портрете обзор шире — не 72°, а до 104°, — и подписи с разрядкой больше не уезжают за край',
      'Сборка 2.1: исправлены пропущенные куски тренировочного обновления и возвращены проверки, которые их ловят',
    ]},
    en:{title:'The long shift',items:[
      'The shift is four days: a night is 8 minutes, a morning 1:45. The 45-minute limit is gone: the first three dawns are a breather, the fourth is the win. Four minutes into the last night the forest wakes up for good',
      'Dawn clears the fallen: anyone down — or bled out — gets back on their feet where the light found them. The шкафандр keeps what it took. Every fall shortens the next bleed',
      'Danger climbs through the night and with every dawn survived: the multiplier steps every four minutes of a night and adds half a step per day. Generators stay lit come morning: a repaired camp generator holds its light for the rest of the shift',
      'The pack opens in the round: a real rucksack with four pockets — drag to turn, items lift out of their pockets. The flat grid remains the touch fallback',
      'Hands that work: they reach back for the straps and swing the pack down; at a generator the body kneels and leans in while the wrench works the bolts in time with the clanks',
      'The adrenaline syringe: raise a downed friend in place (1.5 s, 2.2 m) — no cot, no carrying. Five minutes of rubber legs: walk ×0.8, sprint ×0.72, stamina burns ×1.65. Two exist per shift, co-op only',
      'The lobby gates open: the latch, the leaves, the engine, everybody in — and the car rolls out to the training ground. A rack of all nine field items, targets, and four enduro bikes with suspension, lean, jumps and real collisions, one per player. The ПОЛИГОН button on the home menu plays the same film for solo players',
      'The flare gun returns to a new body every night; finding it again is one cartridge, not two. The wristwatch shows the day of the shift and counts down to dawn. Protocol 14: everybody must refresh',
      'The range repaired: you can walk it, take the whole rack and ride. The drive through the gates used to leave you in a frozen picture. On a bike E only mounts and steps off, the eye line sits on the seat and leans with the machine, and the rack and the bikes no longer fight over one key',
      'The pack in your hands reads as gear now: its own key light from the upper left, seams, compression straps and a steel D-ring; the swinging arm leaves the frame, and the forest dims softly behind it — the night no longer swallows dark canvas',
      'Phones are live from the first frame: touch mode starts immediately (no "click to capture the cursor"), portrait opens the view up (72° to as much as 104°), and letter-spaced captions stay inside the screen',
      'Build fix: the missing half of the training update is in, with the checks that catch it next time',
    ]},
  },
  {
    v:'2.0',date:'2026-10-18',
    ru:{title:'Большая починка смены',items:[
      'Социальный уголок вместо ссылки «Профиль»: квадрат с твоим настоящим персонажем, «Добавить друга» и список друзей ниже. На очень низком экране уголок сворачивается до портрета, чтобы не перекрывать управление',
      '«Позвать друга» на свободном месте в лобби теперь открывает выбор: отправить приглашение другу или скопировать ссылку. Входящие заявки и инвайты всплывают сбоку, не уводят из забега и не присоединяют автоматически',
      'Позывной вошедшего аккаунта нельзя подменить полем создания комнаты. Он меняется только в личном деле; сохранение обычных настроек на сервере не переименовывает профиль',
      'Добавлен быстрый вход Google с проверкой настройки провайдера. Владелец должен указать OAuth Client ID/Secret в Supabase. Лимит 2 у встроенной почты — письма в час, не аккаунты: для публичной рассылки нужен собственный SMTP, подтверждение адресов не отключено',
      'Исправлены чёрные руки: рукава брали цвет головы вместо костюма, а тёмные материалы проваливались в чёрный. Собственные руки и руки спасения получили локальную подсветку без освещения леса',
      'Три новые хижины: теперь пять, 26 шкафчиков по лесу и 20 соединяющих троп. В подходящих шкафах за ночь 2–3 шкафандра; запертый гарантированный лут не подменяется. Захват разрешает хозяин: два открытия больше не меняют жертву друг другу',
      'На верстаке лесхоза лежит одна физическая карта деталей УАЗа. Она занимает один карман, раскрывается ПРЕДМЕТОМ/ЛКМ, складывается Esc, выбрасывается и передаётся. После ухода владельца остаётся единственный подбираемый экземпляр. Это отметки исходных тайников, не GPS',
      'ИИ ищет путь вокруг стен и мебели, проходит проёмы, выходит из корпусов «Зорьки», давит и выламывает закрытые двери. Поиск ограничен по работе на кадр. Удары не проходят через стены и этажи',
      'Фонарик усилен: 21 м, полный аккумулятор 135 с, найденный 60 % ≈ 81 с, запасная батарейка +45 %. Свет по-прежнему выдаёт тебя тварям',
      'Кооп: протокол 13. Обновите страницу у всех участников комнаты',
    ]},
    en:{title:'Major shift repair',items:[
      'A social corner replaces the Profile link: your actual survivor portrait, Add Friend, and the friends list below. Very short screens collapse it to the portrait to protect the controls',
      'Invite a Friend at an empty lobby seat opens a chooser: send to a friend or copy the link. Friend requests and room invitations appear at the side without auto-joining or interrupting a run',
      'Signed-in account callsigns cannot be replaced by a lobby field. Change them in the personnel file; ordinary settings saves cannot rename the server profile',
      'Google sign-in checks provider configuration. The owner must configure OAuth Client ID/Secret in Supabase. The built-in email limit of 2 means emails per hour, not accounts; public email delivery needs custom SMTP, not disabled confirmation',
      'Black hands fixed: sleeves used the head dye instead of outfit dye and dark materials were crushed to black. Camera-local hand fill never lights the forest',
      'Three new huts: five total, 26 cabinets and 20 linked paths. Two or three eligible mimics per night, never replacing locked guaranteed loot. Host capture grants prevent simultaneous opens from swapping victims',
      'One physical UAZ parts map on the forestry workbench: one pocket, LMB/ITEM to unfold, Esc to fold, drop/pass/recover after disconnect. Original seeded hiding places, not a live GPS',
      'Bounded AI pathfinding around walls/furniture, narrow doorways and Zarya interiors. Monsters push/break closed doors. Attacks do not pass through walls or floors',
      'Flashlight buff: 21m reach, 135s full battery, 60% found charge ≈81s, spare battery +45%. Light still attracts creatures',
      'Co-op protocol 13: everybody must refresh',
    ]},
  },
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
