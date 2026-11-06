// What's new: footer patch notes that open upward. The newest night first, older ones folded away.
// A dot on the tab while there's a version you haven't seen; folding the panel is remembered.
import { getLang } from '../core/i18n.js';

const KEY = 'hush.news.v1';

// newest first. date: YYYY-MM-DD
export const NEWS = [
  {
    v:'5.0c',date:'2026-11-06',
    ru:{title:'Топь, глава 2: «Грунтовка»',items:[
      'После кортежа ты за рулём. Машина хоста съезжает на грунтовку, и вести её теперь тебе: W — газ, S — тормоз и задний ход, A/D — руль. На грунтовке УАЗ разгоняется примерно до 47 км/ч, в лесу между деревьями еле ползёт. В повороте его держит только сцепление с грунтом, а врезаться в сосну можно по-настоящему.',
      'Сзади идёт щупальце. Оно ползёт по твоему же следу, раз в пару секунд выныривает из земли, встаёт аркой над дорогой и бьёт туда, где ты только что был. Отстанешь — ударит по машине. Его видно в собственном красном свете и в стоп-сигналах, а гул слышно с той стороны, где оно идёт.',
      'Новый монстр — Корень. Впереди на дороге вспучивается земля: красное кольцо в эхе, бугор с красным свечением, хруст снизу. Через секунду оттуда бьёт отросток. Уходи на другую сторону колеи: зацепит — машину развернёт и отбросит, а наехать прямо на него на скорости значит перевернуться.',
      'Дорога три раза ветвится, и две ветки из трёх кончаются поваленным деревом. Карта у штурмана — у того, кто сидит рядом с водителем: держи TAB, смотри и говори водителю, куда поворачивать. Задние смотрят по сторонам и назад, всем доступно эхо на ПРОБЕЛ. Один на один ты держишь карту сам, но пока смотришь в неё, дороги не видишь.',
      'Поймало щупальце или машина перевернулась — глава начинается сначала, у всех сразу. В коопе машину, погоню и корни ведёт хост. Доехал до конца дороги — дальше глава 3.',
    ]},
    en:{title:'The Mire, chapter 2: «The Dirt Road»',items:[
      'After the convoy you are at the wheel. The host\'s car turns onto the dirt road, and now it is yours to drive: W for gas, S to brake and reverse, A/D to steer. On the dirt road the UAZ makes about 47 km/h; in the trees it barely crawls. In a bend only the grip on the dirt holds it, and you can really drive it into a pine.',
      'The arm is behind you. It crawls along your own track, surfaces every couple of seconds, rears over the road in an arch and comes down where you just were. Fall behind and it comes down on the car. You see it in its own red light and in your tail lamps, and you hear its rumble from where it is.',
      'A new monster, the Root. Ahead of you the road swells: a red ring in the echo, a mound with a red glow, a crunch from below. A second later a limb strikes up out of it. Get to the other side of the ruts: if it catches you the car is spun and thrown aside, and driving straight over it at speed puts the car on its roof.',
      'The road forks three times, and two ways out of three end in a felled tree. The map is with the navigator, whoever sits beside the driver: hold TAB, read it and tell the driver where to turn. The back seats watch the sides and behind, and everyone has the echo on SPACE. Alone, you hold the map yourself, but while you read it you cannot see the road.',
      'If the arm catches you or the car goes over, the chapter starts again, for everyone at once. In co-op the host runs the car, the chase and the roots. Reach the end of the road and chapter 3 begins.',
    ]},
  },
  {
    v:'5.0b',date:'2026-11-06',
    ru:{title:'Топь, глава 1: «Кортеж»',items:[
      'Вторая карта теперь начинается с фильма. Ночь, трасса, машина хоста, в ней вся команда. Навстречу идёт фура и заливает салон светом фар. По радио играет ночная станция.',
      'Сзади догоняет кортеж: полиция, скорая, две пожарные машины МЧС и ещё одна полицейская. Мигалки красят лес красным и синим, а сирены слышно с той стороны, где едут машины. Машина прижимается к обочине и пропускает колонну.',
      'На развязке под фонарями дорога перекрыта. Поперёк лежит то самое щупальце с горизонта, огромное, с рядами бледных присосок. Вокруг стоит кортеж, пожарная машина светит на него прожектором, полицейский подходит с фонарём. Вы стоите в очереди и ждёте, а радио тонет в помехах.',
      'Потом щупальце оживает. Оно поднимается над дорогой, падает на полицейскую машину, утаскивает скорую в кювет и кончиком накрывает фуру. Водитель бросает машину вправо, в просвет отбойника, и уводит её на грунтовку в лес.',
      'Фильм длится полторы минуты. Enter пропускает его, в коопе пропускает хост. Вторая глава начинается на грунтовке.',
      'Заодно исправлено: на «Топи» посреди карты горел костёр из лесного лагеря, а надпись «ПОЛИЦИЯ» на дальнем борту полицейской машины читалась задом наперёд.',
    ]},
    en:{title:'The Mire, chapter 1: «The Convoy»',items:[
      'The second map now opens with a film. Night, the highway, the host\'s car with the whole crew inside. A lorry comes the other way and fills the cabin with its headlights. A night station plays on the radio.',
      'A convoy comes up from behind: police, an ambulance, two fire engines and another police car. The beacons paint the forest red and blue, and you hear each siren from where its car is. The car pulls onto the shoulder and lets the column by.',
      'At the junction under the lamps the road is shut. Across it lies the arm from the horizon, huge, with rows of pale suckers. The convoy stands round it, a fire engine shines its floodlight on it, a policeman walks up with a torch. You sit in the queue and wait while the radio drowns in static.',
      'Then the arm moves. It rises over the road, comes down on the police car, drags the ambulance into the ditch and brings its tip down on the lorry. The driver throws the car right, through the gap in the rail, and onto the dirt road into the forest.',
      'The film runs a minute and a half. Enter skips it; in co-op the host skips it. The second chapter starts on the dirt road.',
      'Also fixed: on the Mire the forest camp\'s fire was burning in the middle of the map, and «ПОЛИЦИЯ» read backwards on the far side of the police car.',
    ]},
  },
  {
    v:'5.0a',date:'2026-11-06',
    ru:{title:'Топь: второй уровень строится заново',items:[
      'Старого Торфяника больше нет: насосы, лебёдка, Утопленник, Гнус и убежище под лагерем убраны целиком. На его месте строится новый второй уровень, «Топь». Это не смена, а одна ночь в семи главах: кортеж на трассе, грунтовка, авария, деревня, генератор, гать и обрыв.',
      'Новая земля 760 × 760 метров, вчетверо больше старого болота. Вдоль южного края идёт трасса на насыпи. От неё в лес уходит грунтовка с тремя развилками, и две дороги из трёх кончаются тупиком. Посреди огромной поляны стоит деревня: шестнадцать домов и хижин с дверями, окнами и столбом внутри. На северо-востоке начинается болото: ворота с генератором, гать по воде, девятиметровый обрыв, под ним озеро и причал на дальнем берегу.',
      'Главы уже переключаются, и уровень можно пройти от начала до конца. Пока каждая глава — заготовка: фильм показывает место, где он будет, а игровые главы проходятся пешком до цели. Кортеж, езда со штурманом, Корень, Сторож, куски карты, Kugoo и старый рыбак придут в следующих раундах, по главе за раз.',
      'В коопе главу ведёт хозяин: глава заканчивается у него, и все переходят вместе.',
    ]},
    en:{title:'The Mire: the second level, rebuilt from scratch',items:[
      'The old peat bog is gone: the pumps, the winch, the Drowned, the midges and the shelter under the camp, all of it. In its place a new second level is being built, the Mire. It is not a shift but one night in seven chapters: the convoy on the highway, the dirt road, the crash, the village, the generator, the causeway and the cliff.',
      'The new ground is 760 × 760 metres, four times the old bog. A highway on an embankment runs along the south edge. From it a dirt road goes into the forest and forks three times, and two of the three roads are dead ends. In the middle of a huge clearing stands the village: sixteen houses and huts with doors, windows and a post inside. In the north-east the bog begins: a gate with a generator, a causeway across the water, a nine-metre cliff, and below it a lake with a pier on the far shore.',
      'The chapters already change and the level can be played from start to finish. For now each chapter is a stand-in: a film shows the place where it will happen, and a play chapter is walked on foot to its goal. The convoy, driving with a navigator, the Root, the Warden, the map pieces, the Kugoo bikes and the old fisherman arrive in the next rounds, one chapter at a time.',
      'In co-op the host runs the chapter: it ends on the host\'s machine and everyone moves on together.',
    ]},
  },
  {
    v:'4.2',date:'2026-11-05',
    ru:{title:'Своя машина во вступлении и верёвка, которую видно',items:[
      'У дерева Удильщика снова видно «E · развязать»: подсказку стирало в том же кадре, поэтому друга было нечем отвязать. Подойди к верёвке и держи E три секунды.',
      'Фотоаппаратов больше: в лесу их лежит два в одиночку и три в коопе, и ещё один всегда ждёт на полке какого-нибудь шкафа. У фотоаппарата появилась страница в атласе — с моделью, звуком вспышки и счётчиком кадров.',
      'Во вступлении у друзей в машине снова сидит хост: раньше каждый гость занимал его место, и хост пропадал из кадра. У костра больше не стоят по две копии каждого игрока.',
      'Во вступлении едет машина хоста: УАЗ или Trueno, в его цветах. Колёса крутятся и поворачивают, кузов кренится в поворотах, руль вертится в руках водителя.',
      'AE86 теперь кабриолет: без крыши, с низким лобовым и сложенным верхом за задним сиденьем. Во вступлении он встаёт у задних ворот лесхоза, задние пассажиры перепрыгивают через борт, и все идут во двор пешком. Мотор звучит выше и звонче, чем у УАЗа.',
      'Тюнинг УАЗа и Trueno — гардероб → «Машина» → «Покраска»: шесть видов дисков в восьми цветах, четыре степени тонировки и свои наклейки на двери, капот, задние крылья и корму. Картинка сжимается до 64×64 и 15 цветов. Машину хоста с тюнингом видит вся комната — в гараже и на дороге.',
    ]},
    en:{title:'Your own car in the opening, and a rope you can see',items:[
      'The Angler\'s tree shows "E · untie" again: the prompt was being wiped in the same frame, so there was no way to free a friend. Walk up to the rope and hold E for three seconds.',
      'More cameras: two lie in the forest solo and three in co-op, and one more always waits on a shelf in some cupboard. The camera has its own atlas page now, with a model, the flash sound and a frame counter.',
      'Friends see the host in the car during the opening again: every guest used to take the host\'s seat, and the host vanished from the shot. The campfire no longer has two copies of every player.',
      'The opening drives the host\'s own car: the UAZ or the Trueno, in the host\'s colours. The wheels roll and steer, the body leans into the turns, the steering wheel turns in the driver\'s hands.',
      'The AE86 is a convertible now: no roof, a low windscreen and the top folded behind the back seat. In the opening it stops at the forestry yard\'s back gate, the back seat hops out over the side and everyone walks in. Its engine sings higher than the UAZ\'s.',
      'Tuning for the UAZ and the Trueno — wardrobe → Car → Paint: six wheel styles in eight colours, four tint levels and your own stickers on the doors, the bonnet, the rear wings and the tail. A picture is cut down to 64×64 and 15 colours. The whole room sees the host\'s tuned car, in the garage and on the road.',
    ]},
  },
  {
    v:'4.1',date:'2026-11-04',
    ru:{title:'Обгон на заднем и то, что под водой',items:[
      'На дороге в лесхоз вас обгоняет Kugoo: байкер поднимает переднее колесо прямо рядом с УАЗом, а следом пролетает полиция с мигалками и позиционной сиреной. Пассажиры оборачиваются на обгон и погоню.',
      'УАЗ больше не едет под землёй на подъезде к лесхозу: высота следует настоящей дороге, поворот обходит столб, а сам столб отодвинут с проезда. В гараже убраны хромированные спицы, которые мерцали белыми осколками поверх дисков.',
      'Озеро доходит до настоящего берега без дыр по краям. На мелководье идёшь медленнее, в глубине плывёшь, а не бегаешь по дну. Задержишься там, где глубже двух метров, — снизу выйдет акула. В коопе друзья видят прыжок, укус и исчезновение тела под водой; стоящие рядом вздрагивают. Из её пасти на койку уже не попадёшь.',
      'Защита звука: направление слуха всегда конечное и ненулевое, даже при резком развороте; прерванный браузером аудиоконтекст возобновляется. Если в выходном тракте появляются некорректные отсчёты, фильтр и лимитер пересобираются, не обрывая голоса и источники. Обычная тишина восстановление не запускает.',
    ]},
    en:{title:'A wheelie on the highway and something below the lake',items:[
      'A Kugoo overtakes you on the way to the forestry yard: the rider lifts the front wheel right beside the UAZ, then a police car tears past with flashing lights and a positional siren. The passengers turn to watch the overtake and the pursuit.',
      'The UAZ no longer drives underground on the approach to the yard: its height follows the actual road, its turn clears the lamp post, and the post itself stands off the track. Chrome spokes that shimmered as white shards over the garage wheel discs are gone.',
      'The lake reaches its actual bank without open seams. Shallows slow you down; in deep water you swim instead of running along the bottom. Stay where it is more than two metres deep and a shark comes up from below. In co-op your friends see the breach, bite and body disappearing underwater; nearby witnesses recoil. There is no cot rescue from its jaws.',
      'Audio safeguards: the listening direction stays finite and non-zero, even during a sudden turn, and a browser-interrupted audio context resumes. Invalid output samples rebuild the filter and limiter without cutting off voices or sound sources. Ordinary silence does not trigger a repair.',
    ]},
  },
  {
    v:'4.0a',date:'2026-11-04',
    ru:{title:'Ворота лесхоза снова открываются сами',items:[
      'Ворота лесхоза снова едут сами, как и написано на табличке у них: запустил все пять генераторов — двор под током, воет сирена, ворота откатываются. Рубильника в лесу нет и не нужно: задание больше не отправляет в убежище, которого на этом участке нет, и ночь в лесу снова проходится до машины.',
      'Убежище с рубильником осталось там, где ему место, — под лагерем торфяника: там выезд с участка по-прежнему держит затвор на насыпи.',
    ]},
    en:{title:'The forestry gate opens by itself again',items:[
      'The forestry gate rolls by itself again, just as the sign on it says: start all five generators — the yard goes on the mains, the siren howls, the gate slides open. There is no breaker in the forest and none is needed: the task line no longer sends you to a shelter this site does not have, and a forest night can be finished at the car again.',
      'The shelter and its breaker stay where they belong — under the peat works\' camp: there the way off the site is still held by the gate on the causeway.',
    ]},
  },
  {
    v:'4.0',date:'2026-11-04',
    ru:{title:'ULTRA: подлесок, утро сквозь туман, щупальца на горизонте и фотоаппарат',items:[
      'Подлесок. Между деревьями теперь кусты, папоротник, молодые ёлочки и сухой валежник — по всему лесу, кроме троп, лагеря и построек. В чаще ноги вязнут (идёшь до четверти медленнее), и каждый шаг сквозь неё шуршит, а это слышно тварям. Пригнувшись, шуршишь еле-еле, но сухие ветки трещат всё равно. Эхо проявляет подлесок так же, как деревья.',
      'Утро. Солнце встаёт низко над лесом, и от каждого дерева по земле тянется длинная тень (у солнца теперь своя карта теней). Посмотри на солнце между стволами: сквозь туман бьют светлые лучи. За утро солнце поднимается чуть выше.',
      'Лес с каждой ночью хуже. Утром видно, что сделала ночь: больше мёртвых серых деревьев (сквозь них не пройти), у троп пугала и человечки из палок, каждую ночь всё ближе к лагерю, а на стволах вдоль троп красные кольца и кресты, будто кто-то ночью обходил лес с краской. У всех в комнате лес одинаковый.',
      'Ночью можно увидеть, как далеко за краем карты из земли выходят огромные щупальца, выше любой сосны, в багровом зареве, и медленно падают обратно. Сначала видишь, потом слышишь: звук идёт издалека, а удар о землю отдаётся под ногами. В первую ночь шанс 30%, дальше всё чаще (до 75%). Все в комнате видят одно и то же.',
      'Фотоаппарат. Лежит у охотничьих домиков, у вышки или у камней и мигает красной лампочкой: один на смену в одиночку, два в коопе. В нём пять вспышек, ЛКМ — снимок. Вспышка на миг освещает лес метров на тридцать вперёд, и её видно издалека: друг заметит её за сотню метров. Наблюдателя вспышка в упор (до 24 м, в кадре, без преград) прогоняет на 40–60 секунд, даже если он уже держит тебя взглядом. Обычный свет его только останавливает. Затвор щёлкает громко — твари слышат.',
      'Каждый кадр — настоящий снимок того, что было перед объективом (без твоих рук), с оранжевой датой в углу, как у старых мыльниц. В конце смены кадры показываются лентой. «В альбом» кладёт их в новый раздел «Альбом» на сайте игры: там они хранятся только в твоём браузере, по сменам, их можно смотреть, скачивать и удалять. «Скачать .zip» сохраняет всю плёнку сразу, клик по кадру — один кадр.',
      'Прыжок (V) и вес тела. Тело теперь разгоняется и тормозит, а не едет как камера на рельсах, и в воздухе только подруливаешь, а отпустишь клавиши — летишь, куда летел. Прыжок на 0,75 м, падение тяжелее подъёма. Чуть сорвался с края — ещё можно прыгнуть, нажал за миг до приземления — тоже засчитается. Прыжок стоит дыхания, приземление слышно, на приземлении камера приседает и кивает, а на рывках голова чуть отстаёт. Обрыв глубже 35 см — уже падение, а не склон. На телефоне — своя кнопка. Если V у тебя уже было занято, оно остаётся твоим, а прыжок ждёт свою клавишу в настройках.',
      'Друзья в коопе двигаются плавно. Их путь идёт по кривой между пакетами, а не ломаной, а анимация читает настоящую скорость: вперёд, вбок, назад (шаг назад больше не «лунная походка»), повороты и прыжки (колени в воздухе, присед на приземлении). Позы перетекают одна в другую. Вблизи друга теперь видно нормально: в паре шагов глаза привыкают, и это тусклая, но читаемая фигура в своей одежде, а не чёрный силуэт. Дальше ~9 м — как раньше, только эхо.',
      'Пробел — теперь эхолокатор, а не голос. Одно нажатие — одна длинная чистая волна: карта леса на 64 м вокруг держится около 20 секунд, а звук тише щелчка языком (тварь услышит только метров с семи). Потом прибор полминуты перезаряжается; когда снова готов, точка прицела отвечает мягким кольцом и двойным щелчком. В мошкаре он заряжается вдвое дольше. Кричать — только в микрофон.',
      'Трава снова растёт. Её шейдер объявлял время дважды и не собирался, поэтому поле стояло голым. Днём травинки теперь освещены как трава, а не как земля: их пробивает солнце против света, на них лежат тени деревьев.',
    ]},
    en:{title:'ULTRA: undergrowth, a morning through the fog, arms on the horizon and a camera',items:[
      'Undergrowth. Bushes, ferns, young firs and dry brushwood now grow between the trees, all over the forest but the paths, the camp and the buildings. In the thick of it your legs drag (up to a quarter slower), and every step through it rustles, which the creatures hear. Crouched, it is barely a whisper, but dry branches crack all the same. The echo draws the undergrowth just like the trees.',
      'The morning. The sun comes up low over the forest, and every tree casts a long shadow across the ground (the sun has its own shadow map now). Look at the sun between the trunks: light shafts break through the fog. Over the morning the sun climbs a little higher.',
      'The forest gets worse every night. In the morning you see what the night did: more dead grey trees (solid: you cannot walk through them), scarecrows and stick men by the paths, each night a little closer to the camp, and red rings and crosses on the trunks along the paths, as if somebody went round the forest at night with a can of paint. Everyone in the room sees the same forest.',
      'At night you may see huge arms come out of the ground far beyond the edge of the map, taller than any pine, in a crimson glow, and slowly fall back. You see it first and hear it after: the sound comes a long way, and the impact carries through the ground under your feet. Night 1 has a 30% chance, and it grows with the shift (up to 75%). Everyone in the room sees the same thing.',
      'The camera. It lies by the hunters\' cabins, the fire tower or the stones, blinking its red lamp: one a shift solo, two in co-op. It holds five flashes; LMB takes a picture. The flash lights the forest some thirty metres ahead for an instant, and it is seen from far away: a friend notices it from a hundred metres. Point-blank (within 24 m, in frame, nothing in between) it drives the Watcher off for 40–60 seconds, even when it already holds you with its gaze; ordinary light only freezes it. The shutter is loud enough for the creatures to hear.',
      'Every frame is a real picture of what was in front of the lens (without your hands), with an orange date in the corner like old point-and-shoots printed. At the end of the shift the frames come up as a strip. «To the album» keeps them in the new Album section on the game\'s site: they stay only in your browser, grouped by shift, to look at, download and delete. «Download .zip» saves the whole film at once; a click on a frame saves just that one.',
      'A jump (V) and a body with weight. You now take a moment to get going and a moment to stop instead of riding a camera on rails, and in the air you only steer; let go of the keys and you carry on where you were going. The jump is 0.75 m with a fall heavier than the rise. Slip off an edge and you can still jump for a moment; press a moment before landing and it still counts. A jump costs breath and the landing is heard. On landing the camera dips and nods, and the head lags a hair behind every push. A drop deeper than 35 cm is a fall, not a slope. Touch screens get their own button. If V was already yours for something else, it stays that way, and the jump waits for a key in the settings.',
      'Friends move smoothly in co-op. Their path follows a curve through the packets instead of a polyline, and the animation reads their real velocity: forward, sideways, backwards (a step back is no longer a moonwalk), turning and jumping (knees up in the air, a squat on landing). Poses flow into one another. Up close a friend is now properly visible: within a few steps your eyes adapt and they are a dim but readable figure in their own clothes, not a black cut-out. Beyond ~9 m it is as before: only the echo.',
      'SPACE is an echolocator now, not a voice. One press, one long clean wave: the map of the forest for 64 m around holds for about 20 seconds, and it is quieter than a click of the tongue (a creature hears it only from about seven metres). Then the device refills for half a minute; when it is ready again the crosshair answers with a soft ring and a double tick. In the gnats it refills at half speed. Screaming is the microphone\'s job alone.',
      'The grass grows again. Its shader declared the time twice and never compiled, so the field stood bare. By day the blades are now lit like grass, not like the ground: the sun shines through them against the light, and the trees\' shadows lie on them.',
    ]},
  },
  {
    v:'3.1r',date:'2026-11-03',
    ru:{title:'Kugoo на полигоне',items:[
      'Мотоциклы на полигоне теперь Kugoo Wish 01: электрический питбайк по модели из твоего Blender-файла. Белая рама (у четырёх байков четыре цвета), чёрное седло, золотая вилка, амортизатор, колёса со спицами и тормозными дисками. Вилка сжимается вдоль своей оси, маятник качается, руль поворачивается вокруг наклонной колонки. С седла видно его руль и приборку.',
      'Физика теперь настоящая. Байк качается на двух пружинах, и каждое колесо чувствует землю под собой. Электромотор с места тянет так, что поднимается передок. Сам ты ловишь газ, а с Shift (вес назад) едешь на заднем колесе до точки баланса, и S опускает его обратно. Передний тормоз клюёт вилку. Поворот идёт наклоном. Сцепление общее на тормоз, газ и поворот: перегазуешь в повороте — заднее колесо срывается, тормознёшь в полном наклоне — переднее уходит, и ты ложишься.',
      'В воздухе колёса работают как гироскопы: газ поднимает нос, тормоз опускает. Сел носом — летишь через руль, перевернулся назад — падаешь. Байк остаётся лежать на боку, E поднимает его. Пробой подвески на приземлении — металл о металл, без батута.',
      'Заодно исправлено: удар о камень под углом больше не разгоняет байк (знак отражения был перевёрнут).',
    ]},
    en:{title:'The Kugoo on the training ground',items:[
      'The bikes on the training ground are now the Kugoo Wish 01: an electric pit bike from your own Blender file. A white frame (four bikes, four colours), a black seat, a gold fork, the shock, spoked wheels with brake discs. The fork compresses along its own axis, the swingarm swings, the bars turn about the raked steering head. From the seat you see its own bars and dash.',
      'The physics is real now. The bike rides on two springs, and each wheel feels the ground under it. The electric motor pulls the front up off the line; on your own you catch the gas, and with Shift (weight back) you ride the back wheel up to the balance point, with S to bring it down. The front brake dives the fork. You turn by leaning. Grip is shared between brakes, gas and the turn: too much gas in a corner and the rear steps out, a hard brake at full lean and the front tucks and you are down.',
      'In the air the wheels are gyros: gas lifts the nose, the brake drops it. Land on the nose and you go over the bars; loop it and you are off the back. The bike stays on its side, and E picks it up. Bottoming out on a landing is metal on metal, not a trampoline.',
      'Also fixed: an angled hit on a rock no longer speeds the bike up (the bounce had its sign flipped).',
    ]},
  },
  {
    v:'3.1q',date:'2026-11-02',
    ru:{title:'Лось в темноте',items:[
      'Перед главным меню теперь заставка. Ночной лес, вдалеке среди сосен один стоит Лось — Слушатель с рогами. Играет «Detuned Piano». Каждый удар пианино — эхо, а эхо показывает только то, где он БЫЛ, поэтому каждый раз он ближе: на обрыве нарастания, потом на самом громком аккорде. На долгом аккорде он медленно поворачивает голову, и это видно — красный контур в темноте. Ещё рывок, и он в пяти шагах. Пианино стихает, секунда тишины — и он у тебя перед лицом.',
      'Любая клавиша или касание пропускает заставку. Она идёт один раз за запуск: при перезагрузке из-за смены карты и по ссылке-приглашению её нет. Если браузер не даёт звуку играть без нажатия, заставка ждёт в темноте с надписью «нажми любую клавишу»: без пианино это только половина. С настройкой «щадящие скримеры» крик тише и без вспышки.',
    ]},
    en:{title:'The elk in the dark',items:[
      'A splash now plays before the main menu. The forest at night, and far off among the pines, alone, stands the Elk — the antlered Listener. «Detuned Piano» plays. Every piano accent is an echo, and an echo shows only where it WAS, so each time it is nearer: when the swell cuts off, then on the loudest chord. On the long chord it slowly turns its head, and you see that: a red outline in the dark. One more jump and it is five steps away. The piano dies away, a second of silence — and it is in your face.',
      'Any key or tap skips it. It plays once per launch: not on the reload a map switch makes, not from an invite link. If the browser will not play sound before a key press, it waits in the dark with «press any key»: without the piano it is only half of itself. With reduced scares the scream is quieter and there is no flash.',
    ]},
  },
  {
    v:'3.1p',date:'2026-11-02',
    ru:{title:'Утро для дела, Удильщик за работой, хватка Дворняжки',items:[
      'Утром снова можно всё, что не ночная работа: подбирать вещи с земли (инструменты, фонарь, палочки, выпавшее из рюкзака, карту деталей), обыскивать тела и убирать записку на E, открывать шкафы, лезть на вышку, бросать камни, включать фонарь, колоть шприц, писать на магнитофон. Генераторы, бункер, громкоговоритель лагеря и сиденья УАЗа по-прежнему ждут ночи. Ракета и магнитофон днём честно говорят, что они на ночь, а не молчат.',
      'Удильщик снова похищает. Он подходил, клал руку тебе на плечо и уходил: место у дерева, где он привязывает, в полуметре от коры, а проверка «свободно ли» брала 0,8 м и упиралась в тот же ствол. Ни одно из ~130 деревьев рядом не проходило. Теперь он хватает, тащит к дереву и привязывает, как задумано.',
      'Хватка Дворняжки убивает и в коопе. Раньше она «надевала» тебя: ты 45 секунд стоял на месте живой и не мог шевельнуться. Теперь, как от любой твари, ты падаешь, а друг ещё может донести тебя до койки. И только потом она идёт к живым и говорит твоим именем. Твоё тело остаётся лежать, где упало.',
    ]},
    en:{title:'The morning is for work, the Angler at work, the Stray\'s hand',items:[
      'The morning lets you do everything that is not the night\'s work again: pick things up off the ground (tools, the torch, glow sticks, what fell out of a bag, the parts map), search bodies and put the page away with E, open cupboards, climb the lookout, throw stones, switch the torch on, use the needle, record on the tape. Generators, the shelter, the camp loudspeaker and the UAZ\'s seats still wait for the night. The flare gun and the tape now say they are for the night instead of doing nothing.',
      'The Angler takes people again. He walked up, put his hand on you and walked away: the spot by the tree where he ties you is half a metre off the bark, and the check for room asked for 0.8 m and hit the trunk itself. Not one of the ~130 trees in reach passed. Now he takes you, hauls you to a tree and ties you there, as he was meant to.',
      'The Stray\'s hand kills in co-op too. She used to "wear" you: you stood there for 45 seconds, alive and unable to move. Now you go down as with any creature, and a friend may still carry you to the cot. Only then does she walk to the living and speak in your name. Your body stays where it fell.',
    ]},
  },
  {
    v:'3.1o',date:'2026-11-02',
    ru:{title:'Ровный шаг, дорога без края, новый УАЗ',items:[
      'Ходьба больше не дёргается. Голова качалась на шагах так, что в каждом шаге камера разворачивалась вниз-вверх за один кадр, четыре раза в секунду. В темноте этого не видно, а на полигоне, утром и у ламп весь мир вздрагивал на каждом шаге. Теперь голова плавно проседает в шаг и поднимается, а переход на бег углубляет качку постепенно. У мотоцикла качки нет, поэтому на нём всё и было ровно.',
      'В фильме по дороге в лесхоз шоссе за машиной больше не обрывается: земля, холмы, сосны, фонари и отбойники уходят в дымку на сотни метров в обе стороны. Попутные машины тоже выезжают из дымки, а не из пустоты. Северная обочина шоссе вернулась на место: её строило в 340 метрах от дороги.',
      'УАЗ собран заново по референсу УАЗ-469, без крыши. Цельный кузов без щелей, трапециевидные арки с колёсными нишами, плоские крылья и поднятый капот, решётка с эмблемой, круглые фары с поворотниками, номера спереди и сзади. У четырёх дверей швы, петли и ручки, зеркала на кронштейнах, запаска на задней двери, тент свёрнут за задним сиденьем. Снизу рама, мосты на рессорах и кардан. Вокруг ступицы колеса больше не просвечивает кольцо.',
    ]},
    en:{title:'A steady step, a road with no end, a new UAZ',items:[
      'Walking no longer jerks. The head bob turned the camera from down to up inside one frame at every step, four times a second. In the dark you never saw it; on the training ground, in the morning and by the lamps the whole world jolted on every step. Now the head eases down into each step and back up, and breaking into a run deepens the bob gradually. A bike has no bob, which is why riding was always smooth.',
      'In the film on the way to the forestry the highway no longer ends behind the car: the land, the hills, the pines, the lamps and the rails run on into the haze for hundreds of metres both ways. Passing cars come out of the haze too, not out of nothing. The highway\'s north shoulder is back where it belongs: it was being laid 340 metres away from the road.',
      'The UAZ is rebuilt after a UAZ-469 reference, with its roof off. One closed body with no gaps, flat-topped arches with wheel wells, flat wings with the hood raised between them, the grille with its emblem, round lamps with indicators, plates front and back. Four doors with seams, hinges and handles, mirrors on arms, the spare on the tailgate, the canvas rolled up behind the back seat. Underneath: the frame, the axles on their springs, the prop shaft. No more ring of daylight round the wheel hubs.',
    ]},
  },
  {
    v:'3.1n',date:'2026-11-02',
    ru:{title:'Дорога в лесхоз',items:[
      'Смена в лесу начинается в дороге. УАЗ едет по шоссе на закате, пассажир ловит радио: сначала треск, потом песня CUPSIZE «вайфуу», как из старого автомобильного динамика.',
      'У каждого в машине своё дело. Водитель ведёт и косится на соседа, пассажир крутит радио и высовывает руку в окно, один спит, привалившись к стеклу, другой читает карту. Все кивают в такт песне. Если играешь один, ведёшь и включаешь радио сам.',
      'Машина сворачивает с шоссе в выемку, въезжает во двор лесхоза и встаёт на своё место. Ключ повёрнут, и песня обрывается на полуслове. Все выходят, сонный потягивается, и дальше начинается последний вечер в лагере.',
      'Enter пропускает всё вступление сразу, и дорогу, и лагерь.',
    ]},
    en:{title:'The road to the forestry',items:[
      'A forest shift now begins on the road. The UAZ drives along the highway at sunset and the passenger finds a station: static first, then CUPSIZE\'s «вайфуу», as if through an old car speaker.',
      'Everyone in the car has something to do. The driver drives and glances across, the passenger tunes the radio and puts an arm out of the window, one sleeps against the glass, one reads the map. Everyone nods to the beat. Alone, you drive and turn the radio on yourself.',
      'The car turns off the highway into the cut, pulls into the forestry yard and stops in its place. The key turns and the song stops mid-line. Everyone gets out, the sleeper stretches, and then the camp\'s last evening begins.',
      'Enter skips the whole opening at once, the road and the camp.',
    ]},
  },
  {
    v:'3.1m',date:'2026-11-02',
    ru:{title:'Лес: победа — уехать',items:[
      'В лесу побеждают только отъездом на УАЗе. Пережить смену — ещё не победа: рассвет последней ночи открывает «последнее утро». Это пять минут при свете, без монстров, чтобы доделать УАЗ и уехать. Не успел — смена кончилась, и это поражение.',
      'Новое приходит по одному. Первая ночь обучающая, ползуна в ней нет. Во второй появляется один ползун, на четвёртой минуте. Удильщик — с третьей ночи, порча генераторов — с четвёртой.',
      'От ползуна можно убежать. В погоне он чуть медленнее твоего бега и делает рывок только в последних трёх метрах. Оторвись и затихни — он потеряет тебя через несколько секунд.',
    ]},
    en:{title:'Forest: the win is driving out',items:[
      'In the forest the only win is driving out in the UAZ. Surviving the shift is not a win yet: the last night\'s dawn opens the last morning. That is five minutes of daylight with no monsters to finish the UAZ and go. Run out of time and the shift is over, and it counts as a loss.',
      'New threats arrive one at a time. The first night is a tutorial with no crawler. The second brings one crawler, four minutes in. The Angler arrives from the third night, generator sabotage from the fourth.',
      'You can outrun a crawler. In a chase it is a little slower than your sprint and only lunges in the last three metres. Get ahead, go quiet, and it loses you within seconds.',
    ]},
  },
  {
    v:'3.1l',date:'2026-11-02',
    ru:{title:'Часы на руке',items:[
      'Часы на TAB теперь похожи на часы. Время показано крупными сегментными цифрами, как на настоящем электронном циферблате, и сквозь них слабо видны незажжённые «восьмёрки». Над цифрами написано, до чего идёт отсчёт: «до рассвета» ночью, «до темноты» утром.',
      'Ночью экран подсвечен сине-зелёным, как подсветка у часов в темноте; днём он обычный, серо-зелёный.',
      'Под временем две короткие строки: генераторы с делениями, детали УАЗа, кто жив, очки. Задача идёт бегущей строкой, а не обрывается на полуслове. Внизу — координаты и то, что важно сейчас: тишина, заряд фонаря или рюкзак.',
    ]},
    en:{title:'The watch on your wrist',items:[
      'The TAB watch now looks like a watch. The time is in big seven-segment digits, like a real digital face, with the unlit eights faintly showing through. Above the digits it says what it counts to: to dawn at night, to dark in the morning.',
      'At night the face glows blue-green like a watch backlight in the dark; by day it is a plain grey-green LCD.',
      'Under the time there are two short lines: generators with their bars, UAZ parts, who is alive, the score. The task scrolls by as a ticker instead of being cut off mid-word. At the bottom: your coordinates and whatever matters right now (the quiet, your flashlight charge or your backpack).',
    ]},
  },
  {
    v:'3.1k',date:'2026-11-02',
    ru:{title:'Установщик и лаунчер',items:[
      'Установщик для Windows стал мастером на русском или английском. Можно выбрать, для кого ставить игру (только для себя — без прав администратора, или для всех) и в какую папку, и нужен ли ярлык на рабочем столе. В конце — «Запустить ТИШЕ».',
      'Обновления ставятся туда же, куда ты установил игру. Ярлык, который ты удалил с рабочего стола, обновление не вернёт.',
      'В лаунчере две вкладки: «Что нового» и «Настройки». Пока качается обновление, кнопка «Играть» заполняется и показывает проценты. Под ней видно, когда игра последний раз проверяла обновления, и можно проверить ещё раз.',
      'В настройках: сразу запускать игру, игра на весь экран, возвращаться ли в лаунчер после игры, язык. Там же видны папка игры и папка сохранений, есть кнопки «Проверить файлы игры» (скачать игру заново, если что-то сломалось) и «Удалить игру».',
      'При удалении игра спросит, удалять ли сохранения и настройки. Если ответить «Нет», после новой установки всё будет на месте.',
    ]},
    en:{title:'Installer and launcher',items:[
      'The Windows installer is now a wizard, in Russian or English. You choose who the game is for (just you, with no admin rights, or everyone), which folder it goes to, and whether you want a desktop shortcut. At the end: Start HUSH.',
      'Updates install into the folder you picked. A desktop shortcut you deleted stays deleted after an update.',
      'The launcher has two tabs: What\'s new and Settings. While an update downloads, the Play button fills up and shows the percentage. Under it you can see when the game last checked for updates, and check again.',
      'Settings: start the game right away, full screen, whether to come back to the launcher after playing, and the language. They also show the game folder and the saves folder, with Check game files (download the game again if something broke) and Uninstall.',
      'Uninstalling asks whether to remove your saves and settings too. Answer No and everything is still there after you install again.',
    ]},
  },
  {
    v:'3.1j',date:'2026-11-02',
    ru:{title:'Главное меню и магазин',items:[
      'Главное меню стало одним списком: «Одному» первым и крупнее всех, под ним «С друзьями», ниже «Полигон», «Гардероб» и «Магазин». Строка, на которой ты стоишь, отмечена красной чертой.',
      'По меню можно ходить стрелками ↑ и ↓ и выбирать Enter. Весь текст на главном экране стал крупнее: подписи в 6–8 пикселей больше не нужно разглядывать.',
      'Магазин снова есть в главном меню, и рядом видно, сколько у тебя осколков. Вкладка «Магазин» больше не обрезается, у панели свой заголовок, а названия и цены читаются.',
      'Панель друзей больше не наезжает на меню на ноутбуке. На невысоком экране телефона она сворачивается в твой портрет: нажми на него, и откроется та же панель с друзьями.',
    ]},
    en:{title:'Main menu and shop',items:[
      'The main menu is now a single list: Solo first and biggest, With friends under it, then Range, Wardrobe and Shop. The line you are on is marked with a red bar.',
      'You can walk the menu with the ↑ and ↓ keys and pick with Enter. All text on the title screen is larger: no more squinting at 6–8 pixel captions.',
      'The shop is back in the main menu, with your shards shown beside it. The Shop tab is no longer cut off, the panel has its own title, and names and prices are readable.',
      'The friends panel no longer covers the menu on a laptop. On a short phone screen it folds into your portrait: tap it to open the same panel, friends included.',
    ]},
  },
  {
    v:'3.1i',date:'2026-11-02',
    ru:{title:'Мышь без «зажми и тяни»',items:[
      'Режим «зажми ЛКМ и тяни, чтобы смотреть» убран. Камера всегда управляется как обычно: кликнул, и мышь вертит взгляд без зажатой кнопки.',
      'Если после выхода в меню первый клик не захватил мышь, следующий захватит. Раньше два таких клика подряд переключали управление на перетаскивание до конца игры.',
      'Если в приложении для Windows мышь так и не захватывается, значит, стоит старая версия программы. Подсказка попросит закрыть игру и открыть снова: при выходе поставится новая версия, и мышь заработает.',
    ]},
    en:{title:'The mouse without «hold and drag»',items:[
      'The «hold LMB and drag to look around» mode is gone. The camera always works the usual way: click once, and the mouse turns your view without holding a button.',
      'If the first click after the menu does not take the mouse, the next one does. Before, two such clicks in a row switched you to dragging for the rest of the game.',
      'If the Windows app still cannot take the mouse, it is an old version of the program. The hint asks you to close the game and open it again: the new version installs on exit, and the mouse works.',
    ]},
  },
  {
    v:'3.1h',date:'2026-11-01',
    ru:{title:'Новая заставка в лесу',items:[
      'Фильм перед сменой в лесу снят заново. Камера опускается на лагерь в последний светлый вечер, и у каждого игрока своё дело: один проверяет фонарь и светит в лес, другой закрывает палатку, третий доливает бензин в генератор, четвёртый заливает костёр водой из ведра.',
      'Каждого показывают отдельным планом. Люди встают со скамеек, обходят костёр, палатку и рюкзак, а не идут сквозь них. Шаги совпадают с ходьбой, ведро и канистра висят в руке, фонарь светит туда, куда смотрит игрок.',
      'Костёр гаснет по-настоящему, генератор глохнет, и все поворачиваются к темноте. В одиночку фильм идёт около 17 секунд, вчетвером около 23. Enter по-прежнему пропускает его.',
    ]},
    en:{title:'A new opening in the forest',items:[
      'The film before a forest shift is shot from scratch. The camera comes down onto the camp on its last light evening, and every player has a job: one checks a flashlight and shines it into the woods, one closes the tent, one tops up the generator, one puts the fire out with a bucket of water.',
      'Each of them gets a shot of their own. People get up from the benches and walk around the fire, the tent and the backpack instead of through them. Footsteps match the walk, the bucket and the can hang from a hand, and the flashlight shines where its owner looks.',
      'The fire really goes out, the generator dies, and everyone turns to the dark. Alone the film runs about 17 seconds, with four about 23. Enter still skips it.',
    ]},
  },
  {
    v:'3.1g',date:'2026-11-01',
    ru:{title:'Звук и Bluetooth',items:[
      'Если в Bluetooth-наушниках звук пропадал на всём компьютере на несколько секунд (например, после запуска генератора) — в настройках появился пункт «Звук». Вариант «Bluetooth (без обрывов)» даёт звуковой карте запас побольше: эхо приходит на долю секунды позже, зато звук не обрывается.',
      'По умолчанию стоит «авто»: если по названию устройства видно, что это беспроводные наушники, игра сама выберет запас побольше. «Быстрый отклик» — для проводных наушников и колонок.',
      'Новое значение начинает действовать после перезапуска игры.',
    ]},
    en:{title:'Sound and Bluetooth',items:[
      'If your Bluetooth headphones lost sound across the whole computer for a few seconds (after starting a generator, say), the settings now have a Sound option. Bluetooth (no dropouts) gives the sound card a bigger buffer: the echo arrives a fraction of a second later, but the sound no longer drops.',
      'The default is auto: if the device name says these are wireless headphones, the game picks the bigger buffer itself. Fastest response is for wired headphones and speakers.',
      'A new choice takes effect after restarting the game.',
    ]},
  },
  {
    v:'3.1f',date:'2026-11-01',
    ru:{title:'Камера в приложении',items:[
      'В версии для Windows не вертелась камера: «кликни, чтобы управлять взглядом» — и ничего. Приложение запрещало игре захватывать мышь, разрешало только микрофон. Теперь разрешено.',
      'Исправление придёт двумя шагами. Сначала, через обычное маленькое обновление игры: если старая программа всё ещё не отдаёт мышь, после двух кликов камера начнёт вертеться перетаскиванием с зажатой кнопкой. Потом лаунчер в фоне скачает новую версию программы и поставит её при выходе — после этого мышь будет как в браузере.',
    ]},
    en:{title:'The camera in the app',items:[
      'In the Windows app the camera did not turn: «click to look around», and nothing. The app refused the game the mouse and allowed only the microphone. Now it allows both.',
      'The fix comes in two steps. First, through the usual small game update: if the old program still refuses, after two clicks you can turn the camera by dragging with the button held. Then the launcher downloads the new program in the background and installs it when you quit — after that the mouse works as in the browser.',
    ]},
  },
  {
    v:'3.1e',date:'2026-11-01',
    ru:{title:'Друг издалека',items:[
      'Игроки соединяются напрямую. Если у друга мобильный интернет или «серый» IP у провайдера — часто это и есть «друг в другой стране не может зайти», — напрямую соединение не пробивается. Теперь в таком случае игра соединяется через ретранслятор (ExpressTURN): он только пересылает зашифрованные пакеты.',
      'В лобби видно, есть ли ретранслятор: «ретранслятор есть — подключится и издалека».',
      'Кнопка «Пауза фона» в профиле убрана.',
      'Привязки клавиш больше не появляются внутри расширенных настроек графики.',
    ]},
    en:{title:'A friend far away',items:[
      'Players connect directly. If a friend is on mobile internet or behind their provider\'s shared IP — which is usually what «my friend abroad can\'t get in» is — a direct link cannot get through. Now the game connects through a relay instead (ExpressTURN), which only forwards the encrypted packets.',
      'The lobby shows whether a relay is ready: «relay ready — friends far away can connect».',
      'The «Pause backdrop» button is gone from the profile.',
      'Key bindings no longer show up inside the advanced graphics settings.',
    ]},
  },
  {
    v:'3.1d',date:'2026-11-01',
    ru:{title:'Лаунчер и автообновление',items:[
      'Игру для Windows теперь можно установить: скачай HUSH-Setup со страницы релизов и запусти. Права администратора не нужны, ярлыки появятся на рабочем столе и в «Пуске».',
      'Первым открывается лаунчер: большая кнопка ИГРАТЬ, что нового в игре, строка обновления и две настройки — «сразу запускать игру» и «игра на весь экран». Пока ты играешь, лаунчер спрятан, а когда закрываешь игру, возвращается.',
      'Обновления приходят сами. Новая версия игры — это файл на несколько мегабайт: лаунчер скачивает его, проверяет и подставляет, ничего не переустанавливая. Если обновилась сама программа, лаунчер тихо скачает её в фоне и поставит, когда ты выйдешь.',
      'Если обновление скачалось, пока ты играл, в меню появится строка с кнопкой ПЕРЕЗАПУСТИТЬ. Без интернета играешь на том, что уже есть.',
      'Портативная версия (один .exe без установки) тоже осталась — с тем же лаунчером. Заодно исправлено её старое самообновление: оно подменяло временную копию, а не тот файл, который ты запускал.',
    ]},
    en:{title:'Launcher and auto-update',items:[
      'The Windows game can now be installed: download HUSH-Setup from the releases page and run it. No admin rights, with desktop and Start menu shortcuts.',
      'It opens on a launcher: a big PLAY button, what is new, the update line and two settings — start the game right away, and play in full screen. It hides while you play and comes back when you close the game.',
      'Updates arrive on their own. A new game version is a file of a few megabytes: the launcher downloads it, checks it and swaps it in with nothing to reinstall. If the program itself was updated, the launcher quietly downloads it in the background and installs it when you quit.',
      'If an update arrives while you play, the menu shows a RESTART button. Without internet you simply play what you have.',
      'The portable build (one .exe, no install) is still there, with the same launcher. Its old self-update is fixed too: it used to replace a temporary copy instead of the file you launched.',
    ]},
  },
  {
    v:'3.1c',date:'2026-11-01',
    ru:{title:'Сороки',items:[
      'В сухих деревьях у тропинок теперь сидят сороки — по четыре–семь птиц. Тронуть они не тронут, зато выдадут: пробеги под ними, подойди к самому стволу или нашуми рядом, и стая взлетит с треском. Этот стрекот слышат твари метров на пятьдесят вокруг, и считается он твоим шумом.',
      'Как их заметить: если стоять неподалёку, иногда слышно тихое «чак-чак». Взлетевшая стая ещё и освещает дерево эхом. Мимо можно пройти шагом, а крадучись — хоть под самыми ветками. Через полторы минуты птицы возвращаются.',
      'Гайка, брошенная в стаю, поднимет её — это тревога в другом конце леса, если она нужна тебе там.',
      'Быстрое колесо: зажми I — вокруг прицела появятся четыре кармана. Поведи мышью и отпусти: предмет в руках. Если отпустить в центре, ничего не изменится. Чтобы убрать предмет из рук, выбери его карман ещё раз. Ты не останавливаешься, пока выбираешь. Короткое нажатие I по-прежнему открывает рюкзак. На телефоне: долгое нажатие на РЮКЗАК и касание кармана.',
      'Предпросмотр: у батарейки — и в рюкзаке, и на колесе — видно, каким станет фонарь, например «40% → 85%». Одна батарейка добавляет 45%.',
    ]},
    en:{title:'Magpies',items:[
      'Magpies now sit in the dead trees by the paths, four to seven birds each. They will not touch you, but they will give you away: run under them, walk up to the trunk or make a noise nearby, and the flock goes up rattling. Monsters within about fifty metres hear it, and it counts as your noise.',
      'How to spot them: stand nearby and now and then you hear a quiet chak-chak. A flock taking off also lights the tree up with its echo. You can walk past, and sneaking you can pass right under the branches. They are back in a minute and a half.',
      'A stone thrown into a flock sends it up: an alarm at the other end of the forest, if that is where you want one.',
      'Quick wheel: hold I and four pockets appear around the crosshair. Point with the mouse and let go: the item is in your hands. Let go in the middle and nothing changes; pick the pocket of what you hold to put it away. You keep moving while you choose. A short press of I still opens the backpack. On a phone: long-press BACKPACK and tap a pocket.',
      'Preview: a battery shows what your flashlight will become, both in the backpack and on the wheel, e.g. 40% → 85%. One battery adds 45%.',
    ]},
  },
  {
    v:'3.1b',date:'2026-11-01',
    ru:{title:'Политика конфиденциальности',items:[
      'В меню появилась ссылка «Конфиденциальность»: на одной странице по-русски и по-английски написано, какие данные хранит игра, зачем, кто их видит и как удалить аккаунт.',
      'Коротко: без аккаунта всё остаётся в браузере. Рекламы и аналитики нет. Голос идёт напрямую игрокам комнаты и нигде не записывается.',
    ]},
    en:{title:'Privacy policy',items:[
      'The menu now has a Privacy link: one page, in Russian and English, says what data the game keeps, why, who can see it and how to delete your account.',
      'In short: without an account everything stays in your browser. There are no ads and no analytics. Voice goes directly to the players in your room and is never recorded.',
    ]},
  },
  {
    v:'3.1a',date:'2026-11-01',
    ru:{title:'Google в настольной версии',items:[
      'В настольной версии (.exe) кнопка «Войти через Google» теперь открывает твой обычный браузер: Google не пускает вход во встроенные окна. После входа вкладка скажет «Готово», а игра войдёт в аккаунт сама — ничего копировать не нужно.',
      'На сайте вход через Google работает как раньше — по кнопке в профиле, без пароля и письма. Он заработает, как только автор включит Google в настройках сервера.',
    ]},
    en:{title:'Google on desktop',items:[
      'In the desktop build (.exe) Continue with Google now opens your own browser, because Google does not allow sign-in inside embedded windows. Once you are in, the tab says Done and the game signs in by itself; nothing to copy.',
      'On the site Google sign-in works as before, from the button in your profile, with no password or email. It goes live as soon as the author switches Google on in the server settings.',
    ]},
  },
  {
    v:'3.0z',date:'2026-11-01',
    ru:{title:'Рывки, попытка третья',items:[
      'Полоска ?perf показала, откуда они: десять раз в секунду сборник смены фотографировал экран, и на быстрых мониторах каждый такой снимок давал кадр в 18–25 мс вместо 5 — под лампой заметнее всего.',
      'Теперь снимок для сборника рисует сама видеокарта в маленькую картинку и отдаёт её, когда освободится. Игра больше не ждёт её ни в одном кадре, а сборник выглядит так же.',
      'Если что-то всё равно дёргается — снова ?perf и скриншот полоски.',
    ]},
    en:{title:'Stutter, third attempt',items:[
      'The ?perf strip showed where it came from: ten times a second the shift reel took a picture of the screen, and on fast monitors each one cost an 18–25 ms frame instead of 5, most visible under a lamp.',
      'Now the graphics card draws the reel picture into a small image of its own and hands it over when it is free. The game no longer waits for it in any frame, and the reel looks the same.',
      'If anything still stutters, ?perf again and a screenshot of the strip.',
    ]},
  },
  {
    v:'3.0y',date:'2026-11-01',
    ru:{title:'Все готовы?',items:[
      'В лобби у каждого гостя есть кнопка «Я готов». Рядом с ником видно, кто готов, а кто нет, и кнопка «Начать» у хозяина ждёт всех — при наведении она пишет, кого ещё нет. Если хозяин меняет число ночей или участок, а также после каждой смены отметки снимаются: новые условия — новое «да».',
      'У тех, кто уже выиграл смену в Лесхозе, рядом с ником висит значок «лесхоз ✓» — сразу видно, кто знает дорогу на болото.',
      'Клавиши можно переназначить: Настройки → Клавиши. Нажми на клавишу действия, затем новую; если она уже занята, действия поменяются местами. Стрелки, Esc и Enter работают всегда — это путь назад, если что-то пошло не так. «Вернуть как было» сбрасывает всё.',
      'Панель аккаунта и друзей перерисована в цветах самой игры и стала читаемой: текст крупнее (раньше местами 6–8 пикселей), кнопки удобнее, никаких зелёных пятен из другого интерфейса.',
    ]},
    en:{title:'Everyone ready?',items:[
      'Every guest in the lobby has an «I\'m ready» button. The list shows who is ready and who is not, and the host\'s Start waits for everyone; hover it to see who is missing. Changing the number of nights or the ground, or finishing a shift, clears the ticks: new terms, a new yes.',
      'Players who have won a shift on the forestry wear a «forestry ✓» badge by their name, so you can see who knows the way to the bog.',
      'Keys can be rebound: Settings → Keys. Click an action\'s key, then press the new one; if it is taken, the two actions swap. The arrows, Esc and Enter always work, as the way back if something goes wrong. Back to defaults puts everything back.',
      'The account and friends panel is redrawn in the game\'s own colours and is readable now: bigger text (some of it was 6–8 pixels), easier buttons, no green leftovers from another interface.',
    ]},
  },
  {
    v:'3.0x',date:'2026-11-01',
    ru:{title:'Личное дело',items:[
      'У каждого теперь есть профиль на весь экран — «личное дело»: портрет твоего выжившего, ночи, выигранные смены, самая долгая ночь, рекорд очков, пройденные участки, генераторы и насосы, обысканные тела, поднятые друзья, встреченные твари и то, что убивало тебя чаще всего.',
      'Открывается нажатием на свой ник или портрет в углу меню, на ник друга в списке друзей и на ник игрока в лобби.',
      'За профилем — твой фон: загрузи с компьютера PNG, JPG, GIF или MP4 до 20 МБ. Он виден полупрозрачным, как сквозь грязное стекло, и без звука. Если в системе включено «уменьшить движение», видео и GIF стоят на месте; кнопка «Пауза фона» останавливает их в любой момент.',
      'Профиль и фон видят только твои друзья. Игрок из комнаты, который тебе не друг, увидит ник и кнопку «Добавить в друзья». Без аккаунта профиль тоже работает, но фон хранится только на этом компьютере.',
    ]},
    en:{title:'Personal file',items:[
      'Everyone now has a full-screen profile, a «personal file»: your survivor, the nights, the shifts won, the longest night, the best score, the grounds cleared, generators and pumps, bodies searched, friends raised, the things you met and what killed you most.',
      'It opens from your own name or portrait in the corner of the menu, a friend in the friends list, and any name in the lobby.',
      'Behind it is your backdrop: upload a PNG, JPG, GIF or MP4 of up to 20 MB from your computer. It shows half there, as if through a dirty window, and without sound. With reduced motion on in your system, video and GIFs stand still; the Pause backdrop button stops them at any time.',
      'Only your friends see the profile and the backdrop. A player in your room who is not your friend sees the name and an Add friend button. Without an account the profile works too, but the backdrop stays on this computer.',
    ]},
  },
  {
    v:'3.0w',date:'2026-11-01',
    ru:{title:'Без микро-рывков',items:[
      'Найдена причина «микро-телепортов» при ходьбе: сборник смены десять раз в секунду копировал кадр игры так, что процессор каждый раз ждал, пока видеокарта дорисует картинку. Чем тяжелее кадр — под лампой, днём, — тем дольше было ожидание. Теперь кадр для сборника снимается без ожидания, а сжатие идёт отдельно от игры.',
      'Найдёныш снова ходит плавно: походка «как плохая плёнка» из прошлого обновления читалась как такой же рывок. Его отпечаток в свете лампы почти не дрожит.',
      'Если что-то всё ещё дёргается — добавь к адресу ?perf: в углу появится полоска времени кадров и подпись, что происходило в самом долгом из них. Скриншот этой полоски скажет, в чём дело.',
    ]},
    en:{title:'No more micro-hitches',items:[
      'Found the cause of the "micro-teleports" while walking: the shift reel copied the game frame ten times a second in a way that made the CPU wait for the GPU to finish the picture each time. The heavier the frame — under a lamp, in daylight — the longer the wait. Now the reel takes its snapshot without waiting, and the compression happens apart from the game.',
      'The Stray walks smoothly again: last update\'s "badly shot film" gait read as the same hitch. Its afterimage under a lamp barely shakes.',
      'If anything still jerks, add ?perf to the address: a strip of frame times appears in the corner with a note on what the longest frame was doing. A screenshot of it will tell what is wrong.',
    ]},
  },
  {
    v:'3.0v',date:'2026-11-01',
    ru:{title:'Мышь как мышь',items:[
      'Камера больше не переходит в режим «зажми ЛКМ и тяни». Раньше хватало двух неудачных попыток захватить мышь — например, дважды закрыть рюкзак клавишей Esc, — и до перезагрузки страницы взгляд водился только с зажатой кнопкой. Теперь следующий клик просто снова захватывает мышь.',
      'Мышь больше не идёт рывками: игра перестала просить у браузера «сырой» ввод — в Chrome на Windows он приходит пачками, и камера дёргалась, особенно там, где кадр тяжелее, под лампами. Кому нужен сырой ввод — можно включить его, добавив к адресу ?rawmouse.',
      'Автонастройка графики больше не качается туда-сюда: разрешение снижается только после двух медленных секунд подряд и не пытается вернуться целую минуту — каждый такой шаг был заметным рывком.',
      'Смена и полигон из гаража захватывают мышь сразу по клику, а не после фильма — больше не нужно кликать, чтобы начать смотреть.',
    ]},
    en:{title:'A mouse is a mouse',items:[
      'The camera no longer drops into "hold the left button and drag". Two failed attempts to take the mouse used to be enough — closing the backpack with Esc twice, say — and until a reload you could only look with the button held. Now the next click simply takes the mouse again.',
      'The mouse no longer moves in steps: the game stopped asking the browser for raw input, which on Windows Chrome arrives in bursts and made the camera jerk, worst where frames are heavy — under the lamps. If you want raw input, add ?rawmouse to the address.',
      'The automatic graphics setting no longer seesaws: it lowers the resolution only after two slow seconds in a row and does not try to climb back for a whole minute — every such step was a visible hitch.',
      'A shift or the range started from the garage takes the mouse on your click, not after the film — no extra click to start looking.',
    ]},
  },
  {
    v:'3.0u',date:'2026-11-01',
    ru:{title:'По машинам',items:[
      'Любой выезд из гаража теперь начинается с того, что все садятся в машину, и только потом поворачивается ключ. У каждого из четырёх мест своя манера: водитель перемахивает через дверь, тот, что на стуле, обходит машину и перелезает через задний борт, курильщик бросает окурок, разбегается и ныряет на переднее сиденье прямо над головой водителя, а тот, что с рюкзаком, забрасывает рюкзак, спотыкается на бетоне, встаёт и карабкается через борт.',
      'Водитель в лобби больше не сидит за рулём: он стоит у своей двери, держась рукой за раму, крутит ключи на пальце и поглядывает на часы.',
      'Смена одному тоже начинается в гараже: ты запрыгиваешь в машину, она выезжает за ворота — и дальше начинается сама смена.',
      'Исправлено: «Полигон» после смены на Торфянике запускал обычную ночь. Полигон теперь всегда на Лесхозе, а выбранный для смен участок он не трогает.',
      'Исправлено: у страницы Найдёныша в атласе кнопка «Голос» молчала с самого его появления. Теперь он нюхает воздух, скулит, говорит «эй» откуда-то сбоку и рычит.',
      'Исправлено: после фильма отъезда пассажиры оставались сидеть в машине и при следующем открытии лобби занимались там своими делами.',
    ]},
    en:{title:'Everybody in',items:[
      'Every drive out of the garage now opens with everyone getting into the car, and only then does the key turn. Each of the four places does it its own way: the driver vaults in over his door, the one on the chair walks round and climbs over the tailgate, the smoker flicks his cigarette, sprints and dives into the front seat right over the driver\'s head, and the one with the pack slings it in, trips on the concrete, gets up and scrambles in over the side.',
      'The driver no longer sits at the wheel in the lobby: he stands at his door with a hand on the frame, spinning his keys on a finger and checking his watch.',
      'A solo shift starts in the garage too: you get into the car, it drives out through the gates — and then the shift itself begins.',
      'Fixed: the Range after a shift on the Bog started an ordinary night. The Range is always on the Forestry now, and it leaves the ground you play shifts on alone.',
      'Fixed: the Stray\'s atlas page had a Voice button that stayed silent since the Stray first appeared. Now it smells the air, whines, says "hey" from off to one side and growls.',
      'Fixed: after the departure film the passengers stayed sitting in the car and went about their lobby business in it the next time the lobby opened.',
    ]},
  },
  {
    v:'3.0t',date:'2026-11-01',
    ru:{title:'Дворняжка',items:[
      'Найдёныш переделан целиком. Это больше не девочка в футболке, а дворняжка, которая научилась стоять как люди, за которыми ходила. Издалека и в эхе это сутулый человек в чужом ватнике. Ближе видно, что колени гнутся назад, ходит она на носках, руки висят до колен и кончаются когтями, а вместо лица — длинная облезлая морда с висячими ушами.',
      'Она двигается не как человек: идёт рывками, как плохо снятое кино, то и дело останавливается и нюхает воздух, задрав морду. Злится — шерсть на загривке встаёт, губы ползут с зубов. В погоне бежит на четырёх. Хватает — поднимается на носки и тянет руки к горлу.',
      'Новый голос: сопение, скулёж, рык, который всё время срывается, хриплый лай в погоне и стук когтей по земле. А иногда из темноты, где никого нет, звучит человеческое «эй».',
      'В компании, когда она «надевает» друга, при свете её не видно — видно друга. Но эхо показывает, что идёт на самом деле.',
      'Её вещи после десяти встреч — тоже новые: собачья морда-маска с висячими ушами и чужой рваный ватник с оторванным рукавом. Уже надетые наряды переоденутся сами.',
    ]},
    en:{title:'The mongrel',items:[
      'The Stray is remade from the ground up. No longer a girl in a tee: a mongrel that learned to stand like the people it followed. From far off and in the echo it is a stooping man in someone else\'s quilted coat. Closer, the knees bend backwards, it walks on its toes, the arms hang to the knees and end in nails, and where the face should be there is a long mangy muzzle with its ears hanging.',
      'It does not move like a person: it walks in jerks, like a badly shot film, and keeps stopping to smell the air with its muzzle up. Angry, the hackles rise and the lips come off the teeth. On the chase it runs on all fours. When it takes you it rises on its toes and reaches for your throat.',
      'A new voice: sniffing, whining, a growl that keeps catching, hoarse barks on the chase and nails on the ground. And sometimes, from the dark where nobody is, a human "hey".',
      'In company, while it wears a friend, it is not seen in the light — you see your friend. But the echo shows what is really walking.',
      'Its things after ten meetings are new too: a dog\'s muzzle worn as a mask, ears hanging, and someone else\'s torn coat with a sleeve missing. Outfits already wearing them change by themselves.',
    ]},
  },
  {
    v:'3.0s',date:'2026-11-01',
    ru:{title:'Торфяник надо заслужить',items:[
      'Торфяник открывается после победы на Лесхозе: уедь на УАЗе или доживи до последнего рассвета. Пока этого не было, карточка участка в «Одному» заперта и говорит, что её откроет. Старые победы засчитаны: если ты уже выигрывал смену, болото открыто.',
      'С друзьями хозяин может выбрать Торфяник, если его прошёл хотя бы кто-то в комнате. Остальным приходит вопрос «Поедешь туда с командой?» — и пока все не согласились, смена не начинается. Один отказ — и комната остаётся на Лесхозе, а все видят, кто отказался.',
      'Кто зашёл в комнату, где уже выбран Торфяник, и ещё не прошёл Лесхоз, получает тот же вопрос.',
      'На загрузке болота больше не «лес растёт», а «торф проседает». В «Как играть» появился раздел про Торфяник: насосы, вода, лебёдка и как отсюда уехать.',
    ]},
    en:{title:'The Bog is earned',items:[
      'The Bog opens after a won shift on the Forestry: drive out on the UAZ or live to the last dawn. Until then its card in Solo is locked and says what opens it. Old wins count: if you have ever won a shift, the Bog is open.',
      'With friends, the host can pick the Bog if anyone in the room has cleared the Forestry. Everyone else gets a question — "Will you go there with the team?" — and the shift does not start until they all agree. One "no" keeps the room on the Forestry, and everyone sees who said it.',
      'A player who joins a room already set to the Bog without having cleared the Forestry gets the same question.',
      'Loading the Bog no longer says the forest is growing — the peat is settling. How to Play has a section on the Bog: pumps, water, the winch and how to get out.',
    ]},
  },
  {
    v:'3.0r',date:'2026-11-01',
    ru:{title:'Свои слова',items:[
      'Торфяник больше не говорит лесными словами. Подсказка в начале смены — «у насоса лежит тело», а не у генератора; утром «насос чавкает», а не «генератор тарахтит»; на часах и в паузе — насосы, а не генераторы.',
      'Вместо «УАЗ 0/4» на часах теперь трос лебёдки в процентах: на болоте нет деталей, которые надо искать, есть машина, которую надо вытащить.',
      'Экран итогов после выезда — «ПРОЧЬ С ТОРФЯНИКА» и старая колея, а не лес и ночное шоссе; строки «детали УАЗа» на болоте больше нет.',
      'В английской версии из болотных подсказок и записок убраны русские слова («the проезд», «the участок»), а у Утопленника в новостях больше нет русской «Д».',
      'Исправлен редкий сбой в кооперативе на торфянике: запрос гостя «взять фонарик» ронял игру у хозяина комнаты — фонарика на болоте нет, и заглушка не знала, что ответить.',
    ]},
    en:{title:'Its own words',items:[
      'The bog no longer talks like the forest. The first hint of the shift is "there is a body by the pump", not by the generator; the morning line is the pump slurping in the rain; the watch and the pause screen count pumps, not generators.',
      'Where the watch used to show "UAZ 0/4" it now shows the winch cable in per cent: on the bog there are no parts to find, only a car to drag out.',
      'The end screen after driving off says "OFF THE BOG" and the old track, not the forest and the night highway; the "UAZ parts" row is gone on the bog.',
      'The English bog hints and notes lost their Russian words ("the проезд", "the участок"), and the Drowned in the news no longer starts with a Cyrillic letter.',
      'Fixed a rare co-op crash on the bog: a guest asking to pick up a flashlight brought the host\'s game down — there is no flashlight on the bog, and its stand-in had no answer.',
    ]},
  },
  {
    v:'3.0q',date:'2026-10-22',
    ru:{title:'Разлом',items:[
      'На острове, где стоит лагерь, у самой воды — бетонный колпак с надписью НС-3 и стальной дверью на замке под током. Под лагерем убежище, которое торфоразработки вырыли в пятидесятых и забыли: площадка с лестницей, коридор на рёбрах в двадцать с лишним метров и дальний зал, где стена разошлась',
      'Выезд с участка больше не открывается сам: пять насосов дают ток на лагерь, и только тогда замок колпака отпускает. Контактор затвора на насыпи висит на рубильнике в убежище, в самом дальнем конце коридора. Спускаешься, идёшь мимо ламп и рёбер, кладёшь руку на рычаг',
      'Дальше всё не в твоих руках. Затвор на выезде поднимается, стена в конце коридора отвечает, и лампы гаснут по одной — от дальнего конца к тебе. В темноте остаётся красное: разлом просыпается и выпускает своих',
      'Двери убежища начинают закрываться и идут ровно три минуты. Бегом обратно по коридору, мимо красных глаз, к лестнице: успел — и ты на острове, а над тобой открыт колпак; не успел — и убежище твоё. Тот, кто догнал, убивает Разломом',
      'Сирена закрывающихся дверей своя, отдельная от затвора: ниже, медленнее и без перерыва. А без поднятого затвора машину не вывести: проезд не при чём, дорога закрыта',
    ]},
    en:{title:'The rift',items:[
      'On the island the camp stands on, at the edge of the water, there is a concrete cap marked НС-3 with a steel door on a mains lock. Under the camp is a shelter the peat works dug in the fifties and forgot: a landing with a ladder, a corridor on ribs better than twenty metres long, and a vault at the far end where the wall has come apart',
      'The way off the site no longer opens by itself: five pumps put the camp on the mains, and only then does the cap\'s lock let go. The contactor of the gate on the causeway hangs off a breaker in the shelter, at the very far end of the corridor. You go down, walk past the lamps and the ribs, and put your hand on the lever',
      'After that none of it is yours. The gate on the way out lifts, the wall at the end of the corridor answers, and the lamps go out one by one — from the far end back toward you. What is left in the dark is red: the rift wakes up and lets its own out',
      'The shelter\'s doors start down and take exactly three minutes. Back along the corridor at a run, past the eyes, to the ladder: make it and you are on the island with the cap standing open above you; don\'t, and the shelter keeps you. Whatever catches you kills you as the Rift',
      'The closing doors have a siren of their own, apart from the gate\'s: lower, slower, and it does not stop. And with the gate down there is no driving out: the ford is not the argument any more, the road is shut',
    ]}
  },
  {
    v:'3.0p',date:'2026-10-22',
    ru:{title:'План на стене',items:[
      'В гараже на задней стене вместо пустого листа теперь висит настоящий план участка: тот же отпечаток местности, что и в карточке перед сменой — вода, настилы, насосы и дорога к машине',
      'Он показывает ту землю, которую выбрала комната: хозяин переключил ЛЕСХОЗ / ТОРФЯНИК — и план на стене сменился у всех, у кого открыт гараж',
      'Щелчок по плану открывает настройки комнаты — там же, где длина смены и сам участок',
    ]},
    en:{title:'The plan on the wall',items:[
      'The blank sheet on the garage\'s back wall is a real survey of the ground now: the same print the shift card shows — water, planks, pumps and the road out to the car',
      'It shows the ground the room picked: the host switches FORESTRY / PEAT BOG, and the plan changes on the wall for everyone whose garage is open',
      'A click on it opens the room settings — where the shift length and the ground live',
    ]}
  },
  {
    v:'3.0n',date:'2026-10-22',
    ru:{title:'Вода отвечает',items:[
      'Поверхность торфяника больше не плоскость, которая только подсвечивается: она ходит. Шаг в воду, шаг друга, брошенный камень, каждый шаг Утопленника — всё это толкает воду, и от места расходится кольцо, которое живёт секунду-две и гаснет',
      'Кольца складываются: два следа рядом дают двойную волну, а на глубине вода отвечает сильнее, чем в луже. Гребень ловит эхо и светится, впадина остаётся чёрной — волну видно силуэтом, а не только ярким кругом сверху',
      'Сетка воды стала вчетверо мельче (2 м вместо 4), иначе волне не на чем было бы быть: 21 тысяча треугольников на всю карту',
      'Хозяин комнаты выбирает участок прямо в настройках лобби, рядом с длиной смены: ЛЕСХОЗ или ТОРФЯНИК. На старте все переезжают на выбранную землю — гостю даже не надо знать, откуда хост её открыл',
      'С колёс УАЗа в гараже убран белый кубик «вентиля», который торчал из покрышки и мерцал, и второй ряд протекторов, прорезавший первый. Колесо теперь просто колесо',
    ]},
    en:{title:'The water answers',items:[
      'The bog\'s surface is no longer a plane that only lights up: it moves. A boot in the water, a friend\'s boot, a thrown stone, every stride of the Drowned — all of them push it, and a ring runs out from the spot, lives a second or two and settles',
      'Rings add up: two trails side by side give twice the wave, and deep water answers harder than a puddle. The crest catches the echo and glows, the trough stays black — you see the wave as a shape, not just a bright circle drawn on top',
      'The water grid is four times finer (2 m cells instead of 4): a swell has to have something to be. Twenty-one thousand triangles for the whole map',
      'The host picks the site in the lobby\'s own settings, next to the shift length: FORESTRY or PEAT BOG. Everyone moves to that ground at the start — a guest does not even need to know which URL the host opened',
      'The wheels of the garage UAZ lost the white \"valve\" cube that poked out of the tyre and shimmered, and the second ring of tread blocks that cut through the first. A wheel is just a wheel again',
    ]}
  },
  {
    v:'3.0m',date:'2026-10-22',
    ru:{title:'Одна машина, один выезд',items:[
      'Раньше смена приезжала на одном УАЗе, а уезжала на другом — на развалине в конце гати. Теперь на участке одна машина: та, что привезла вас, и она стоит там, где её оставил фильм — носом в затопленный проезд, задними колёсами на берегу',
      'Выезд из двух условий, и оба — про эту ночь. Проезд надо откачать: пока вода стоит, стартер крутит, а мотор хлебает воду — «ДВИГАТЕЛЬ ХЛЕБНУЛ», и сначала насос в лагере. И машину надо вытащить из колеи: лебёдка на её же бампере, трос на колышек на берегу, двадцать пять секунд ручки',
      'Лебёдка держит только пока крутишь: бросил — машина сползла обратно. Каждый мёртвый насос отматывает назад 0.6 % в секунду, так что насосы и барабан — один и тот же спор',
      'Портативная сборка для Windows теперь обновляет себя: раз в несколько часов она спрашивает страницу релизов, и если там новее, в меню появляется строка «есть сборка 1.0.N — скачать». Скачивает рядом с собой и подменяет старый .exe при выходе',
    ]},
    en:{title:'One car, one way out',items:[
      'The shift used to arrive in one UAZ and drive home in another — a wreck at the end of the causeway. Now there is one car on the site: the one that brought you, standing where the opening film left it, nose into the flooded track, rear wheels on the bank',
      'Getting out takes two things, and both are what the night is about. The flooded track has to be pumped down: while the water is up the starter turns and the engine drinks — THE ENGINE IS FLOODED — so the camp pump comes first. And the car has to come out of the rut: a winch on its own bumper, a cable back to a stake on the bank, twenty-five seconds of handle',
      'The drum only holds while you turn it: let go and the car slides back. Every dead pump unwinds 0.6 % a second, so the pumps and the drum are the same argument',
      'The portable Windows build now updates itself: every few hours it asks the releases page, and if there is a newer one the menu offers \"build 1.0.N is out — download\". It downloads next to itself and swaps the old .exe out when you quit',
    ]}
  },
  {
    v:'3.0l',date:'2026-10-22',
    ru:{title:'Торфяник: приехали',items:[
      'Смена начинается не с неба, а с дороги: УАЗ выезжает из дождя по старой колее и тормозит у воды — проезд затоплен, дальше не проехать. Отсюда и вся ночь: пока не запустишь насосы, машина стоит',
      'Двери, четверо выходят и идут по затопленному проезду вброд — всплеск на каждом шаге там, где вода на самом деле. Потом склейка, и они уже у насоса: каждый за своим делом — шланг к воде, рычаг, вода в корпус, колышек с красной тряпкой у края',
      'Рычаг берёт воду — и только тогда день уходит: небо гаснет уже над работающим насосом, а не над костром',
      'Лагерь переделан в базу у размытой дороги: две палатки на четверых, кольцо камней на самом костре, стол с вахтенным журналом, бочка, ящики. Насос лагеря переехал к проезду, всасывающий шланг лежит в воде, у дороги — табличка с красной тряпкой',
      'Цель ночи звучит иначе: «проезд затоплен — запусти насос в лагере, он откачает воду». Пять насосов остались, но это уже не «генераторы для ворот»',
      'У насосов свой голос: ход поршня, стук клапана и вода, уходящая по шлангу. Генераторного гула и писка у них больше нет ни на старте, ни в работе',
    ]},
    en:{title:'Peat bog: we made it',items:[
      'The shift no longer opens with a camera falling out of the sky: a UAZ comes up the old track out of the rain and stops at the water — the flooded track is flooded, and that is as far as the road goes. Which is the whole night: until the pumps run, the car stays where it is',
      'Doors, four of them out, and they wade the flooded stretch on foot — a splash on every boot where the water actually is. Then a cut, and they are at the pump, each at their own job: the suction line to the water, the lever, water into the casing, a stake with a red rag at the edge',
      'The lever takes water — and only then does the day go: the sky dies over a running pump instead of over a fire',
      'The camp is a base at a washed-out road now: two ridge tents for four, a ring of stones on the fire itself, a table with the shift log, a fuel drum, crates. The camp pump moved to the flooded track, its suction line lies in the water, and there is a board with a red rag at the bank',
      'The night\'s aim is worded differently: "the track is under water — start the camp pump and it drains". The five pumps are still the chain, but they are no longer generators for a gate',
      'The pumps have their own voice: a piston stroke, a valve knocking, water running away down the line. No generator hum and no beep, at the start or in the running',
    ]}
  },
  {
    v:'2.1x',date:'2026-10-22',
    ru:{title:'На компьютере',items:[
      'Игру можно поставить на компьютер: один портативный .exe для Windows, без установки и без прав администратора. Это тот же самый билд, что на сайте, в своём окне — со своим значком и без адресной строки',
      'Микрофон работает как в браузере: оболочка отдаёт игру по собственной безопасной схеме hush://, поэтому это защищённый контекст, а не файл с диска. Разрешение спрашивается только на микрофон — камера, геолокация и буфер обмена ей недоступны, как и весь остальной диск',
      'F11 — полный экран, F12 — инструменты, Ctrl+R — перезапуск, F10 — сброс масштаба. Второй запуск не открывает второе окно, а поднимает уже открытое',
      'Сборка лежит в Actions (артефакт HUSH-win-x64) и в Releases на каждом теге. Ветка unsigned: Windows один раз спросит «неизвестный издатель» — это нормально',
    ]},
    en:{title:'On a desktop',items:[
      'The game can be taken off the browser: one portable Windows .exe, no installer, no admin rights. It is the very same build the site serves, in its own window, with its own icon and no address bar',
      'The microphone works as it does in a browser: the shell serves the game over its own secure hush:// scheme, so the page is a secure context instead of a file on disk. Only the microphone is allowed — the camera, geolocation and the clipboard are refused, and so is the rest of the disk',
      'F11 — fullscreen, F12 — devtools, Ctrl+R — restart, F10 — reset zoom. A second launch raises the running window instead of opening another',
      'The build lives in Actions (artifact HUSH-win-x64) and in Releases on every tag. It is unsigned: Windows will ask once about an unknown publisher, and that is expected',
    ]}
  },
  {
    v:'2.1w',date:'2026-10-22',
    ru:{title:'Одежда Найдёныша',items:[
      'Тело у неё то же, что и было: игра рисует людей скупо, и она такая же. Поправили одежду — футболка на два размера больше наконец висит как футболка: сходит с плеч, узкая в груди, до середины бедра, воротник сползает на одну сторону',
      'Отдельной юбки больше нет: это одна футболка от плеч до середины бедра, и она сама закрывает низ. Подол подвёрнут внутрь, поэтому под ним видно ткань, а не изнанку',
      'Рукава стали короче и с окатом, поэтому рука из них выходит, а не растёт из ведра. Волчья голова на груди — маркер: череп, уши и две дырки глаз',
      'Волосы: чёлка короче и толще, затылок больше не отходит доской, глаза — тонкие светящиеся диски с бликом',
    ]},
    en:{title:'The Stray\'s clothes',items:[
      'Her body is the one she always had: the game draws people sparingly, and so is she. What got fixed is the clothing — the tee two sizes too big finally hangs like a tee: off the shoulders, narrow at the chest, to mid-thigh, a rolled hem, a collar slipping to one side',
      'There is no separate skirt any more: it is one tee from the shoulders to mid-thigh, and it covers her lower body by itself. The hem is folded up inside, so under it you see cloth, not the back of a shell',
      'The sleeves are shorter, with a domed shoulder, so the arm comes out of them instead of growing out of a bucket. The wolf on her chest is a marker drawing: a skull, two ears and two eye holes',
      'Hair: a shorter, chunkier fringe, the back of it no longer sticks out like a board, and the eyes are thin lit discs with a catchlight',
    ]}
  },
  {
    v:'2.1v',date:'2026-10-22',
    ru:{title:'Найдёныш',items:[
      'Четвёртая ночь приводит её: девочка в футболке на два размера больше, белые волосы до пояса, волчьи уши. Она идёт за тобой медленнее, чем ты ходишь, и ничего не делает, пока ты идёшь. Стоит побежать рядом — просыпается, и тогда догнать тебя ей хватает',
      'Она не рвёт и не ест. Один на один — полторы секунды её руки на горле, и «УБИТ · Дворняжка». В компании страшнее: она надевает тебя — друзья видят твой силуэт, идущий к ним, и слышат твой голос, а твой микрофон для них мёртв на все сорок пять секунд',
      'Её силуэт человеческий, и в эхе его ни с чем не спутать: уши повёрнуты на тебя, даже когда она стоит спиной. Свет в лицо держит её три секунды и отступает до утра',
      'Десять встреч — и её вещи твои: белая голова с волчьими ушами (они поворачиваются на звук) и та самая футболка с волчьим черепом. Не за осколки: за десять ночей, в которые ты не побежал',
    ]},
    en:{title:'The Stray',items:[
      'The fourth night brings her: a girl in a tee two sizes too big, white hair to the waist, wolf ears. She walks after you slower than you walk and does nothing at all while you walk. Run near her and she wakes — and then she is fast enough',
      'She does not tear and does not eat. Alone: a second and a half of her hand on your throat, and "KILLED · The Stray". In company it is worse: she wears you — your friends see your shape walking up to them and hear your voice, while your microphone is dead to them for the whole forty-five seconds',
      'Her silhouette is human, and in the echo it cannot be mistaken: her ears are turned toward you even when her back is. A light in her face holds her for three seconds and she gives up until morning',
      'Ten meetings and her things are yours: the white head with the wolf ears (they turn toward a sound) and that tee with the wolf skull. Not for shards: for ten nights in which you did not run',
    ]}
  },
  {
    v:'2.1u',date:'2026-10-22',
    ru:{title:'Сборник смены',items:[
      'В конце смены — сборник хайлайтов: самые глупые моменты ночи, с разбегом и последствиями. Режиссёр сам следит за смертями, хваткой Наблюдателя, Удильщиком, упавшими друзьями, звенящими цепями, разбитыми и заведёнными генераторами и криками в темноте',
      'Клип начинается за три секунды до момента, поэтому видно, ЧТО к нему привело, и тянется пару секунд после. Соседние моменты склеиваются в один дубль, а на смену остаётся шесть лучших',
      'Сборник открывается сам, если есть на что смотреть (и открывается кнопкой на экране итогов): эпизоды, пауза, стрелки, полоса. Каждый эпизод подписан — включая имя того, кто вас достал',
      'Видео можно сохранить: кнопка пишет .webm 720p с титрами, подписями, финальной карточкой — и со звуком. Ночь свою музыку не записывала, поэтому сборник получает собственную: низкий гул, щелчок проектора на каждой склейке и свой удар под каждый эпизод — смерть падает низко, цепь звенит, генератор заводится. Если браузер не умеет писать видео — сохраняется лучший кадр картинкой',
    ]},
    en:{title:"The shift's highlights",items:[
      'At the end of a shift — a highlight reel: the night’s stupidest moments, with the run-up and the fallout. The director watches for deaths, the Watcher’s grip, the Angler, friends going down, ringing stall chains, generators dying and starting, and screams in the dark',
      'A clip starts three seconds before the moment, so you can see what led to it, and runs a couple of seconds past. Neighbours in time join into one take, and six of the best stay on the reel',
      'The reel opens by itself when there is something to watch (and from a button on the results screen): episodes, pause, arrows, a bar. Every episode is captioned — including the name of whatever got you',
      'The video can be saved: the button writes a 720p .webm with titles, captions, an end card — and sound. The night never recorded its own music, so the reel gets its own: a low drone, the projector\'s shutter on every cut and a hit under each episode — a death lands low, a chain rings, an engine comes back up. If the browser will not write video, the best still is saved as a picture instead',
    ]}
  },
  {
    v:'2.1t',date:'2026-10-22',
    ru:{title:'Голубь-доктор',items:[
      'Длина смены теперь спрашивается после кнопки «Одному»: три карточки — 2, 4 или 6 ночей, и та, что нажал, запоминается. С главного экрана ряд кнопок убран',
      'Ворота гаража в главном меню больше не отзываются на мышь — ни светом, ни защёлкой: теперь они в принципе отвечают только в комнате лобби, и никакой другой код не может вернуть им голос. В лобби всё как было',
      'Новый бесплатный комплект «Голубь-доктор»: голова сизого голубя с глазом-бусиной, клювом и лобным зеркальцем на ремешке — и белый халат до колен со стетоскопом, ручкой в кармане и перьями из-под манжет',
      'У голубя своя жизнь: на шаге голова кивает против тела, на месте он резко вертит головой, мигает, дёргает хвостом и топорщит перья на рукавах. Видно и в гардеробе, и в игре у друзей',
    ]},
    en:{title:'Pigeon in a coat',items:[
      'Shift length is asked after the SOLO button now: three cards — 2, 4 or 6 nights — and the one you press is remembered. The row of buttons has left the title screen',
      'The garage gates no longer answer the mouse on the title screen — not with light and not with the latch: they now answer only inside the lobby room, and no other code can give them their voice back. In the lobby everything is as it was',
      'New free set, the Pigeon Doctor: a city pigeon’s head with a bead eye, a beak and the doctor’s mirror on a strap — and a white coat to the knee with a stethoscope, a pen in the pocket and feathers past the cuffs',
      'The pigeon has a life of its own: its head bobs against the body as it walks, snaps around to look at things when standing, blinks, flicks its tail and ruffles its wing feathers. Visible in the wardrobe and on your friends in a night',
    ]}
  },
  {
    v:'2.1s',date:'2026-10-22',
    ru:{title:'Молоко по утрам',items:[
      'Совхоз в деле: один из пяти генераторов теперь всегда стоит у коровника, а какой-то из лесных вместо него — металлолом на эту смену. У его тела лежит объяснительная записка',
      'В среднем стойле — мёртвая корова, давно. Мухи над ней гудят метров за семнадцать',
      'У загона встал трактор. Инструментальный ящик при нём на замке — вскрой ломом, внутри батарея',
      'Цепи у стойл звенят: заденешь сам — выдашь себя, заденет тварь — услышишь её раньше, чем она тебя',
      'По площадке пожарной вышки теперь можно ходить. Спуск — через щель у лестницы с южной стороны или клавишей, как раньше',
      'Наблюдатель больше не убивает мгновенно: он держит тебя взглядом полторы секунды, и мир за это время сходит с ума — картинка и звук. Наведи на него свет, свой или чужой, — отпустит и исчезнет',
      'Длина смены — на выбор: 2, 4 или 6 ночей (в главном меню одному, в правилах комнаты — у хоста). Сложность растягивается на всю смену: вторая ночь из двух — настоящий финал',
      'Утром теперь туман. Белый и густой: лес виден метров на двадцать, дальше — молоко',
    ]},
    en:{title:'Milk in the morning',items:[
      'The sovkhoz is in the rotation: one of the five generators always stands by the cowshed now, and one of the forest ones is scrap for that shift instead. A note by its body explains everything',
      'In the middle stall — a dead cow, long dead. The flies over her hum from seventeen metres off',
      'A tractor has given up by the paddock fence. Its toolbox is padlocked — pry it with the crowbar, a battery inside',
      'The stall chains ring: brush one yourself and you give yourself away; a thing brushes one and you hear it first',
      'You can walk the lookout deck now. Down is through the ladder gap on the south side, or the key, as before',
      'The Watcher no longer kills on contact: it holds you with its gaze for a second and a half, and the world comes apart while it does — picture and sound both. Put a light on it, yours or a friend’s, and it lets go and is gone',
      'Shift length is a choice now: 2, 4 or 6 nights (in the main menu solo, in the room rules for a host). Difficulty stretches across the shift: night two of two is a true finale',
      'Mornings have fog now. White and thick: the forest is visible for twenty metres, then milk',
    ]}
  },
  {
    v:'2.1r',date:'2026-10-21',
    ru:{title:'Часы с координатами',items:[
      'На часах теперь есть координаты: нижняя строка экрана показывает, где ты стоишь, — в тех же числах, что карта деталей и записки',
      'Спасать можно и утром: рассвет сам никого не поднимает, но упавший остаётся лежать и ждёт — его минуты идут и при свете, а плечо, койка и шприц работают до последней',
    ]},
    en:{title:'Coordinates on the watch',items:[
      'The watch shows coordinates now: the bottom line of the screen says where you stand, in the same numbers the parts map and the notes use',
      'Rescue works in the morning too: dawn still raises no one by itself, but the fallen stay down and waiting — their minutes run on in daylight, and the shoulder, the cot and the needle work to the last of them',
    ]}
  },
  {
    v:'2.1q',date:'2026-10-21',
    ru:{title:'Рассвет не спасает',items:[
      'Рассвет больше не поднимает упавших: кто встретил утро на земле, погиб до конца смены. Спасайте ночью — койка и шприц работают как прежде',
      'С третьей ночи твари разбивают работающие генераторы — до двух за ночь. Запчасть остаётся внутри: заведи его заново и иди дальше',
      'Утром можно таскать и ставить запчасти от УАЗа — светлое время больше не пропадает даром',
      'Удильщик научился догонять: издалека он идёт быстрее и не отстаёт через сто секунд. Не ходи один',
      'Фонарей в лесу теперь два (в компании — три), а шприц адреналина попадается и в обычных шкафчиках',
      'Киану больше не достаёт гитару в гараже',
    ]},
    en:{title:'Dawn saves no one',items:[
      'Dawn no longer raises the fallen: whoever meets the morning on the ground is gone for the shift. Rescue at night — the cot and the syringe work as before',
      'From the third night the things beat running generators until they stop — up to two a night. The part stays inside: crank it back up and move on',
      'Car parts can be hauled and fitted in the morning now — daylight is no longer wasted',
      'The Angler has learned to catch people: from far off he comes faster and does not give up after a hundred seconds. Do not walk alone',
      'Two flashlights lie in the forest now (three in company), and the adrenaline syringe turns up in ordinary cupboards',
      'Keanu no longer takes out a guitar in the garage',
    ]}
  },
  {
    v:'2.1p',date:'2026-10-21',
    ru:{title:'Совхоз',items:[
      'Новая локация к западу от лагеря: длинный коровник со стойлами и полая силосная башня. Генератора там нет — есть добыча и сквозняк',
      'Три новых шкафа: гардероб в коровнике (может оказаться не шкафом), шкафчик в стойле и железный шкафчик в башне',
      'В атласе — страница «Совхоз» (глава III): что там было, как там не умереть и сколько раз ты там уже был',
      'Исправлено: громкость музыки больше не слетает после обновления страницы, если ты вошёл в аккаунт',
    ]},
    en:{title:'The Sovkhoz',items:[
      'A new location west of the camp: a long cowshed with stalls and a hollow silo tower. No generator there — just loot and a draught',
      'Three new cabinets: a wardrobe in the cowshed (it may not be a wardrobe), a cupboard in a stall and an iron locker in the tower',
      'The atlas has a Sovkhoz page now (chapter III): what it was, how not to die there, and how often you have been',
      'Fixed: the music volume no longer resets after a page refresh when you are signed in',
    ]}
  },
  {
    v:'2.1o',date:'2026-10-21',
    ru:{title:'Человек с фонарём',items:[
      'С третьей ночи в лесу ходит Удильщик: большой, с фонарём и тесаком. Он берёт того, кто ушёл от остальных',
      'Он волочит жертву по земле к дереву: вырывайся (A/D по очереди), но не кричи — вырубит. У дерева — пять минут на спасение, потом он вернётся и закончит навсегда',
      'Развязал друга — +750. Одинокий может сам перегрызть верёвку, но это слышно. Рассвет верёвку не снимает: часы идут и днём',
      'Старт из гаража — теперь фильм: все садятся в УАЗ, кроме одного. Тот спотыкается, бежит следом и хватает борт на ходу',
      'Новый бесплатный комплект «Киану»: волосы с пробором, борода, чёрный костюм. В полном комплекте — гитара в гараже и раздевалке',
      'В атласе — страница Удильщика: привычки, цифры и как пережить встречу. Он там ходит с фонарём и даже подходит ближе',
      'У Удильщика свой звук появления: услышал издалека — собирайтесь вместе, он уже идёт за кем-то одним',
      'Вдогонку: отставший в фильме отъезда больше не бежит задом наперёд, а у головы-экрана есть силуэт Удильщика',
      'Звёзд на небе больше нет. Ночью над лесом — только тьма',
    ]},
    en:{title:'The man with the lantern',items:[
      'From the third night the Angler walks the forest: a big man with a lantern and a cleaver. He takes whoever strayed from the others',
      'He drags his catch along the ground to a tree: tear free (alternate A/D), but do not scream — he will knock you out. At the tree there are five minutes to be found in; then he comes back and finishes it, for good',
      'Untie a friend for +750. Alone, you can chew through the rope yourself, but it makes noise. Dawn does not untie you: his clock keeps running in daylight',
      'Leaving the garage is a film now: everyone boards the UAZ but one. He trips, runs after it and grabs the side at a crawl',
      'A new free set, Keanu: centre-parted hair, a beard, a black suit. Worn whole, a guitar comes out now and then in the garage and the wardrobe',
      'The atlas has his page now: habits, numbers and how to survive him. He walks there with his lantern — and comes closer',
      'The Angler has an entrance sound now: hear it far off — get together, he is already coming for someone alone',
      'Follow-ups: the straggler in the departure film no longer runs backwards, and the screen head has an Angler silhouette',
      'The stars are gone from the sky. At night there is only dark over the forest',
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
      this.el.innerHTML = `<button class="news-tab" data-act="unfold" aria-label="${esc(W.open)} v${NEWS[0].v}">${fresh ? '<i class="news-dot"></i>' : ''}<span>${esc(W.open)}</span><em>v${NEWS[0].v}</em></button>`;
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
