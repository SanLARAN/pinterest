// What's new: footer patch notes that open upward. The newest night first, older ones folded away.
// A dot on the tab while there's a version you haven't seen; folding the panel is remembered.
import { getLang } from '../core/i18n.js';

const KEY = 'hush.news.v1';

// newest first. date: YYYY-MM-DD
export const NEWS = [
  {
    v:'2.1o',date:'2026-10-21',
    ru:{title:'Человек с фонарём',items:[
      'С третьей ночи в лесу ходит Удильщик: большой, с фонарём и тесаком. Он берёт того, кто ушёл от остальных',
      'Он волочит жертву по земле к дереву: вырывайся (A/D по очереди), но не кричи — вырубит. У дерева — пять минут на спасение, потом он вернётся и закончит навсегда',
      'Развязал друга — +750. Одинокий может сам перегрызть верёвку, но это слышно. Рассвет верёвку не снимает: часы идут и днём',
      'Старт из гаража — теперь фильм: все садятся в УАЗ, кроме одного. Тот спотыкается, бежит следом и хватает борт на ходу',
      'Новый бесплатный комплект «Киану»: волосы с пробором, борода, чёрный костюм. В полном комплекте — гитара в гараже и раздевалке',
    ]},
    en:{title:'The man with the lantern',items:[
      'From the third night the Angler walks the forest: a big man with a lantern and a cleaver. He takes whoever strayed from the others',
      'He drags his catch along the ground to a tree: tear free (alternate A/D), but do not scream — he will knock you out. At the tree there are five minutes to be found in; then he comes back and finishes it, for good',
      'Untie a friend for +750. Alone, you can chew through the rope yourself, but it makes noise. Dawn does not untie you: his clock keeps running in daylight',
      'Leaving the garage is a film now: everyone boards the UAZ but one. He trips, runs after it and grabs the side at a crawl',
      'A new free set, Keanu: centre-parted hair, a beard, a black suit. Worn whole, a guitar comes out now and then in the garage and the wardrobe',
    ]},
  },
  {
    v:'2.1n',date:'2026-10-21',
    ru:{title:'Большое отделение графики',items:[
      'В настройках появилась кнопка «Расширенные настройки графики»: четыре блока, 14 параметров с пояснениями и реальными показаниями рендерера',
      'Масштаб, бюджет пикселей, автоподстройка FPS и FXAA; экспозиция, bloom, виньетка, зерно, аберрация, строки и мерцание; тени ламп и FPS-счётчик',
      'Применяется сразу и сохраняется на устройстве. Есть сброс к пресету; пока свои параметры выключены, прежняя картинка не меняется',
      'Панель работает из меню и паузы, на телефоне прокручивается одной колонкой. HDR-MSAA по-прежнему выключен',
    ]},
    en:{title:'A full graphics control room',items:[
      'Settings now has an Advanced graphics settings button: four sections, 14 explained controls and actual renderer readings',
      'Render scale, pixel budget, adaptive FPS target and FXAA; exposure, bloom, vignette, grain, aberration, scanlines and flicker; lamp shadows and FPS counter',
      'Changes apply immediately and are saved on this device. Reset to preset is available; existing visuals remain unchanged until custom parameters are enabled',
      'Available from the menu and pause, with a single scrollable column on phones. HDR-MSAA remains disabled',
    ]},
  },
  {
    v:'2.1m',date:'2026-10-21',
    ru:{title:'Вернули чёткость без HDR-MSAA',items:[
      'В 2.1l мы слишком урезали разрешение. Высокая снова использует Retina до 2×, а на обычном экране — рендер 1.5× с уменьшением для сглаживания',
      'FXAA на высокой выключен: мелкие детали не размываются. Высокая больше не снижает разрешение молча — адаптация остаётся в режиме «авто»',
      'HDR-MSAA остаётся отключённым; сцена и выходной canvas ограничены бюджетом пикселей и пределами GPU',
      'Рабочий портрет и исправленные движения у костра и палатки сохранены',
    ]},
    en:{title:'Sharpness restored without HDR-MSAA',items:[
      '2.1l cut resolution too far. High again uses up to 2× Retina; on a standard display it renders at 1.5× and downsamples for spatial antialiasing',
      'High no longer uses FXAA or silently lowers resolution: fine details stay sharp, while adaptive scaling remains in auto',
      'HDR-MSAA stays off; both the scene and the output canvas respect pixel budgets and GPU size limits',
      'The working portrait and corrected campfire and tent movement are preserved',
    ]},
  },
  {
    v:'2.1l',date:'2026-10-21',
    ru:{title:'Лицом к огню, рабочий портрет, без HDR-MSAA',items:[
      'Из высокой графики убраны HDR-MSAA и Retina: вместо проблемного мультисэмплированного буфера используется FXAA',
      'В рюкзаке работает 3D-портрет твоего выжившего с выбранной одеждой и цветами — потяни его, чтобы повернуть',
      'В фильме персонажи смотрят на костёр, разворачиваются перед уходом и идут вперёд, а не задом',
      'У палатки сначала опускаются на четвереньки снаружи, потом ползут через настоящий вход; камера отходит и не обрезает спящих',
    ]},
    en:{title:'Facing the fire, a working portrait, no HDR-MSAA',items:[
      'High graphics no longer use HDR-MSAA or Retina: FXAA replaces the problematic multisampled framebuffer',
      'The pack shows a working 3D portrait in your chosen clothes and colours — drag it to turn',
      'In the film survivors face the fire, turn before leaving, and walk forwards rather than backwards',
      'At the tent they kneel outside before crawling through the actual entrance; the camera pulls back to keep the sleepers in frame',
    ]},
  },
  {
    v:'2.1k',date:'2026-10-20',
    ru:{title:'Ночь после фильма видно, рюкзак не врёт, чёрных квадратов нет',items:[
      'После вступительного фильма ты просыпаешься лицом к погасшему костру: картинка поднимается из темноты, а угли ещё светят — у лагеря видно, куда идти',
      'Из рюкзака убраны сердечки и клетки-призраки: он показывает только то, что ты несёшь, а справа стоит объёмный портрет твоего выжившего',
      'Retina больше не рисует чёрные квадраты: мультисэмплинг ограничен памятью под размер кадра и снимается при сбое контекста',
      'Утро больше не запирает у лагеря невидимой стеной, а рассвет идёт плавно все одиннадцать секунд',
      'В фильме у костра сглажены повороты и шаг, из котелка и ведра льётся вода, огонь стал ниже, а все отступили от ямы',
    ]},
    en:{title:'You can see the night after the film, the pack tells the truth, no black tiles',items:[
      'After the opening film you wake facing the dead fire: the picture comes up out of the dark and the coals still glow, so the camp shows you the way',
      'The hearts and the ghost tiles are gone from the pack: it lists only what you carry, with a real 3D portrait of your survivor on the right',
      'Retina no longer paints black tiles: multisampling is capped by the memory the frame needs and dropped when the context goes',
      'The morning no longer walls you in around the camp, and the dawn comes up smoothly over eleven seconds',
      'The campfire film has smoothed turns and strides, water pours from the pot and the bucket, the fire is knee-high, and everyone stands back from the pit',
    ]},
  },
  {
    v:'2.1j',date:'2026-10-20',
    ru:{title:'Смена начинается фильмом: ночь наступает на глазах',items:[
      'Камера спускается с неба на лагерь у костра, пока последний день уходит из света: небо гаснет вместе с огнём, проступают звёзды',
      'Четверо у огня тушат его каждый по-своему — водой из котелка, сапогом, брезентом, ведром — и расходятся спать: на спину, клубком, в палатку, у скамьи',
      'Одному — свой ритуал: разворошить угли палкой, затушить остатки и лечь под одеяло у огня',
      'Фильм пропускается Enter (на телефоне — кнопкой SKIP) и заканчивается ровно там, где раньше начиналась первая ночь: часы, генераторы и сеть не меняются',
      'Retina: кадр рисуется до 2× по устройству с бюджетом пикселей, а «авто» и «высокая» сами подстраивают шкалу под fps',
      'Мухи над телом наконец слышны: запись луга нормализуется по RMS и звучит на 24 dB громче',
    ]},
    en:{title:'The shift opens with a film: night falls in front of you',items:[
      'The camera comes down out of the sky onto the camp while the last day drains out of the light: the sky goes with the fire, and the stars come out',
      'Four people around the fire put it out their own way — a pot of water, a boot, a tarp, a bucket — then go to bed their own way: on their back, curled up, into the tent, down by the bench',
      'Alone it is your own ritual: rake the coals apart with a stick, put out what is left, and lie down by the fire under a blanket',
      'The film skips with Enter (SKIP on a phone) and ends exactly where the first night used to start: the clocks, the generators and the net are untouched',
      'Retina: the frame renders up to 2× the device pixels within a pixel budget, and auto and high adjust the scale to the frame rate themselves',
      'The flies over a body can finally be heard: the meadow recording is normalized by RMS and plays 24 dB louder',
    ]},
  },
  {
    v:'2.1i',date:'2026-10-20',
    ru:{title:'Сглаживание стало настоящим',items:[
      'Кадр сцены рисуется в мультисэмплированный буфер: 4× на «высокой» графике, 2× на «авто», без него на «низкой»',
      'Зубцы на силуэтах деревьев, заборе и спицах колёс больше не видны; смена пресета пересобирает буферы без перезагрузки',
    ]},
    en:{title:'Antialiasing that actually antialiases',items:[
      'The scene frame renders into a multisampled buffer: 4× on high, 2× on auto, none on low',
      'The jaggies on tree silhouettes, the fence and wheel spokes are gone; changing the preset rebuilds the buffers without a reload',
    ]},
  },
  {
    v:'2.1h',date:'2026-10-20',
    ru:{title:'Пластинка в гараже и луг над телами',items:[
      'В гараже тихо играет «Knock at the Door»: плавный вход, бесшовная петля — трек передаёт эстафету второму плееру за три секунды до конца',
      'В настройках появился отдельный ползунок «Музыка»: общая громкость по-прежнему главная, а музыку можно убрать в ноль, не трогая лес',
      'Музыка гаснет, когда начинается смена или полигон, и возвращается в меню; браузер, который не пускает звук без жеста, получит его на первом тапе',
      'Над телами больше не жужжат синтезированные мухи: играет настоящая запись луга (z_uki-prirody-lug.mp3) — петлёй, с панорамой у каждого тела и по-разному с каждого',
      'В атласе на странице тела — тот же луг; пока запись грузится, игра честно спрашивает снова, а если файла нет, остаётся старый звук',
    ]},
    en:{title:'A record in the garage and a meadow over the bodies',items:[
      'Knock at the Door plays quietly in the garage: a gentle fade-in and a seamless loop — the track hands over to a second player three seconds before its end',
      'Settings has its own Music slider: the master volume still rules, and the music can go to zero without touching the forest',
      'The music fades out when a shift or the range begins and returns in the menu; a browser that will not start sound without a gesture gets it on the first tap',
      'No more synthesised flies over the bodies: a real meadow recording (z_uki-prirody-lug.mp3) loops there — panned at every body and starting from a different point on each',
      'The atlas corpse page plays the same meadow; while it is loading the game honestly asks again, and if the file is missing the old sound stays',
    ]},
  },
  {
    v:'2.1g',date:'2026-10-20',
    ru:{title:'Записка не оставляет хвоста, приглашение отвечают на месте',items:[
      'Записка с тела больше не оставляет под собой строку «E · обыскать»: пока страница открыта, её не видно и нечем «прицелиться», а закрыл — приглашение появляется только когда рядом правда есть что взять',
      'Подсказки и кнопка «РУКИ» на телефоне тоже уходят под записку и не выглядывают из-под неё',
      'Смерть или конец смены закрывают записку вместе с подсказками — она не висит поверх посмертного экрана',
      'Приглашение в комнату приходит с двумя кнопками: «Присоединиться» и «Отказаться» (раньше у отказа не было подписи). Обе отвечают сразу из уведомления, а если сеть не приняла ответ — тост остаётся и говорит, что не вышло',
    ]},
    en:{title:'The note leaves no tail, the invitation is answered on the spot',items:[
      'The note from a body no longer leaves the “E · search” line under it: while the page is open nothing is shown and nothing is aimed at, and once it closes the prompt only comes back if there is really something to take',
      'Hints and the HANDS key on a phone go under the page too, and do not peek out from beneath it',
      'Death or the end of a shift closes the page with the hints — it no longer hangs over the death screen',
      'A room invitation arrives with two keys: JOIN and DECLINE (the decline one had no label at all). Both answer straight from the toast, and if the wire did not take the answer the toast stays and says so',
    ]},
  },
  {
    v:'2.1f',date:'2026-10-20',
    ru:{title:'Две оси и полевой справочник',items:[
      'Мотоцикл больше не липнет к земле одной точкой: высота читается под каждой осью, корпус идёт по уклону, а приземление приседает на подвеске',
      'Слез — машина стоит там, где ты её оставил, на обоих колёсах; друг на мотоцикле двигает саму машину, и после него она не уезжает к стеллажу',
      'Рюкзак открывается как полевой справочник: заголовок по центру, вкладки с подчёркиванием, полки с иконками и счётчиками, выживший с предметом в руках и карточка с красным корешком. Выбросить — перетащить мышкой',
      'На полигоне в паузе больше нет ни «ЗАВЕРШИТЬ ПОЛИГОН», ни «ЗАНОВО»: оттуда выходят через «МЕНЮ»',
      'Ворота гаража под курсором светятся сильнее и приоткрываются, а под лобби появляется строка, что они открываются, и кто их открывает',
      'Шприц адреналина есть и в одиночной смене: если рядом никто не лежит, укол идёт в собственное бедро — выносливость возвращается, ноги ватные пять минут',
      'Записка с трупа гасит подсказку «удерживай E»; раньше она возвращалась после закрытия записки',
      'Приглашение в комнату приходит с кнопками «Войти» и «Отклонить» — присоединиться можно прямо из уведомления',
      'Атлас: если витрина страницы падает, страница остаётся читаемой, а игла шприца перерисована без вырожденных треугольников',
    ]},
    en:{title:'Two axles and a field guide',items:[
      'The bike no longer sticks to the ground at one point: the hill is read under each axle, the body follows the slope, and a landing compresses the suspension',
      'Step off and the machine stands where you left it, on both wheels; a friend riding moves the bike itself, and when they step off it does not jump back to the rack',
      'The backpack opens like a field guide: a centred title, underlined tabs, shelves with icons and counts, the survivor holding the item and a card with a red spine. Drop it by dragging',
      'The range pause menu has neither END THE TRAINING nor RESTART: leave the range through MENU',
      'The garage gates under the pointer light up harder and come off the latch, and a line under the lobby says what they do and who opens them',
      'The adrenaline syringe exists in a solo shift too: with nobody down nearby the dose goes into your own thigh — stamina returns, the legs go for five minutes',
      'The note from a body now clears the hold-E prompt; it used to come back when the note closed',
      'A room invitation arrives with JOIN and DECLINE buttons — you can join straight from the toast',
      'Atlas: if a plate throws, the page still reads, and the syringe needle is rebuilt without degenerate triangles',
    ]},
  },
  {
    v:'2.1e',date:'2026-10-20',
    ru:{title:'Ночь с порога',items:[
      'Смена начинается ночью сразу: за воротами больше нет трёх секунд утреннего света — темнота приходит вместе с машиной',
      'Слез с мотоцикла — шаг в сторону и полшага назад: машина остаётся в поле зрения, а не прячется под камерой. Если полигон закончился, пока ты в седле, игра сама ставит тебя рядом с машиной',
      'Стеллаж, ящик, мишени и мотоциклы держат форму: мимо них не пройти, а на ходу соседняя машина упирается, а не проезжает сквозь',
      'Рюкзак на телефоне больше не оставляет пустой экран под полками, а на столе раскладка выросла до пяти рядов — страница заполнена от заголовка до подвала',
      'Атлас: страница шприца открывается и листается дальше — прогон по всем страницам и по перелистыванию через шприц прошёл без зависаний',
      'Патчи с исправлениями теперь с буквами: 2.1a, 2.1b, 2.1c, 2.1d, 2.1e',
    ]},
    en:{title:'Night from the threshold',items:[
      'The shift opens at night at once: the gates no longer hold three seconds of morning light — the dark arrives with the car',
      'Step off the bike and you step a pace to the side and half a pace back, so the machine stays in view instead of hiding under the camera. If the range ends while you are in the saddle, the game sets you down beside it',
      'The rack, its crate, the targets and the bikes hold their shape: you walk around them, and a moving bike stops against its neighbour instead of passing through',
      'The pack page on a phone no longer leaves an empty screen under the shelves, and on the desktop the field of slots grew to five rows — the page is filled from header to footer',
      'The atlas: the syringe page opens and turns on — a run across every page and back through the syringe finished without a stall',
      'Bug-fix patches are lettered now: 2.1a, 2.1b, 2.1c, 2.1d, 2.1e',
    ]},
  },
  {
    v:'2.1d',date:'2026-10-20',
    ru:{title:'Рюкзак-страница',items:[
      'Рюкзак открывается целой страницей, как полевой журнал: слева — полки со всем снаряжением и счётчиками, справа — выживший с выбранным предметом в руках и его описание',
      'Предмет можно выбросить, перетащив его мышкой за пределы рюкзака или на полосу «Выбросить»; на телефоне — тем же жестом или кнопкой',
      'Вкладки «Всё / Свет / Инструмент / Аптечка», «Можно нести 2 / 4», выбор стрелками, двойной клик — в руки, Delete — выбросить',
      'Колёса мотоциклов стали настоящими: шина, обод и спицы крутятся с дорогой, а переднее поворачивает вместе с рулём',
      '«ЗАВЕРШИТЬ ПОЛИГОН» убрана из паузы совсем; с полигона выходят через «МЕНЮ» — оно прибирает мотоциклы, стеллаж и мишени',
    ]},
    en:{title:'The pack as a page',items:[
      'The backpack opens as a page of its own, like a field journal: shelves of gear with counts on the left, the survivor holding the chosen item and its description on the right',
      'Throw an item away by dragging it off the pack or onto the drop strip; on a phone, the same gesture or the button',
      'Tabs for everything / light / tools / aid, CAN HOLD 2 / 4, arrow-key selection, double-click to equip, Delete to drop',
      'The bikes finally roll on real wheels: tyre, rim and spokes turn with the road, and the front wheel follows the bars',
      'END THE TRAINING is gone from the pause menu; leave the range with MENU, which packs the bikes, the rack and the targets away',
    ]},
  },
  {
    v:'2.1c',date:'2026-10-20',
    ru:{title:'Ночь, ворота и мотоциклы',items:[
      'Смена начинается сразу с ночи: ворота гаража открываются в темноту, а утро приходит только с рассветом. Четыре дня остались на месте — просто первый из них ночной',
      'Мотоцикл больше не приклеен к земле. Подъём подкидывает его со скоростью, с которой растёт сама земля, поэтому гребень и банка работают как трамплин; в воздухе руль почти не слушается, а приземление сжимает подвеску',
      'Слез с мотоцикла — он стоит на обоих колёсах. На склоне машина больше не уходит в землю и не пропадает из виду',
      'Друзей на мотоцикле видно: всадник сидит в седле, а не идёт пешком сквозь машину. Даже если событие о посадке потерялось или друг подключился к заезду позже — номер машины едет в каждом пакете состояния',
      'В полигоне больше никто не исчезает: тренировочный выезд не считался днём, и тела друзей гасились «эхом»',
      '«ЗАНОВО» на полигоне убрано совсем, вместе с R и Enter; кнопку «ЗАВЕРШИТЬ ПОЛИГОН» в 2.1d убрали — с полигона выходят через «МЕНЮ»',
      'Ворота отвечают курсору: навёл — сталь подсвечивается, створки отходят от щеколды на пол-ладони и щёлкают; увёл — закрываются. Раньше подсветки не было вовсе',
      'Атлас больше не может застрять на середине страницы: переворот, который не доехал, догружается на следующем кадре, а страница без витрины всё равно открывается',
    ]},
    en:{title:'Night, gates and bikes',items:[
      'The shift opens in the dark: the garage gates swing onto the first night, and morning only comes with a dawn. The four days are still there — the first one is simply a night',
      'The bike is no longer glued to the ground. A rise picks it up at the speed the ground itself is rising, so a crest or a bank works as a jump; in the air the bars barely bite, and a landing compresses the suspension',
      'Step off and the bike stands on both wheels: on a slope it no longer sinks into the hill and disappears',
      'A friend on a bike is visible as a rider — knees bent, hands on the bars — instead of a walker passing through the machine. The bike index rides in every state packet, so a lost mount event or a friend joining late changes nothing',
      'Nobody vanishes on the range any more: the training ground was not counted as daylight, so teammates were blanked by the echo rule',
      'The restart button is gone from the range altogether, along with R and Enter; END THE TRAINING followed it in 2.1d — leave the range with MENU',
      'The gates answer the cursor: hover lights the steel, eases the leaves off the latch a hand\'s width and clicks; move away and they close',
      'The atlas can no longer stick mid-page: a turn that never landed is finished on the next frame, and a page without its plate still opens',
    ]},
  },
  {
    v:'2.1b',date:'2026-10-20',
    ru:{title:'Ствол, стеллаж и атлас',items:[
      'Слез с мотоцикла — он на месте: машина пряталась под всадником и после «слезть» оставалась невидимой. Теперь она возвращается в кадр в тот же кадр',
      'Мотоцикл, стеллаж с предметами, ящик и мишени стали твёрдыми: сквозь них больше не пройти. Столкновение с соседней машиной тоже честное — на ходу она упирается, а не проезжает насквозь',
      'Атлас больше не запинается: страница шприца адреналина падала на сборке своей 3D-модели, перелистывание застревало на середине и книга переставала отвечать. Модель починена и перерисована, а сбой одной страницы теперь просто оставляет её без витрины, но листать не мешает',
      'Фильм выезда: у машины крутятся колёса — каждое на своей оси, с шагом по скорости',
      'Стеллаж на полигоне: камни, химсвет, ракета, батарея, карта и пенал со шприцем стоят каждый на своей полке, сверху — «СТАРТ»',
      'Мотоциклы, стеллаж и мишени больше не висят над травой: под каждым — мягкая тень на земле, её рисует сам шейдер леса (без лишних вызовов отрисовки)',
    ]},
    en:{title:'The bike, the rack and the atlas',items:[
      'Step off the bike and it is still there: the machine hid under its rider and stayed invisible after stepping down. It is back in the frame the moment you dismount',
      'The bikes, the rack of kit, its crate and the targets are solid now — you walk around them, not through them. A moving bike stops against its neighbour instead of passing through',
      'The atlas no longer jams: the adrenaline syringe page crashed while building its 3D plate, the page turn stopped halfway and the book stopped answering. The model is fixed and redrawn, and a page that fails now just opens without its plate',
      'The departure film rolls its wheels: four of them, one per axle, turning in step with the road',
      'The range rack: stones, a glow stick, a flare, the battery, the map and the syringe case each stand on their own shelf under a painted СТАРТ',
      'Bikes, rack and targets no longer hover over the grass: each sits in a soft pool of contact shade, drawn by the forest shader itself (no extra draw calls)',
    ]},
  },
  {
    v:'2.1a',date:'2026-10-19',
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
      'Сборка 2.1a: исправлены пропущенные куски тренировочного обновления и возвращены проверки, которые их ловят',
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
      'Build 2.1a: the missing half of the training update is in, with the checks that catch it next time',
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
