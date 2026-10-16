// ============================================================
// CONTENT — corpse notes (each one is an objective + a hint), lore, death lines.
// ============================================================

export const NOTES = [
  {
    who: 'ЕГЕРЬ СТЕПАН', whoEn: 'RANGER STEPAN',
    text: 'Они не видят. Они слышат. Я щёлкал языком, как летучая мышь, и ходил кругами сутки — работает. Только не говори вслух, что боишься. Оно любит голос.',
    textEn: 'They cannot see. They hear. I clicked my tongue like a bat and walked in circles for a day — it works. Just never say out loud that you are afraid. It loves the voice.',
    obj: 'Запустить генератор №1', objEn: 'Start generator #1',
    hint: 'Тихий щелчок голосом или SPACE = эхо. Держи — импульс дальше, но громче.',
    hintEn: 'A quiet click (voice or SPACE) = echo. Hold it for a longer, louder pulse.',
    reveal: { gen: 0 },
  },
  {
    who: 'ТЕЛО В БРЕЗЕНТЕ', whoEn: 'BODY IN A TARP',
    text: 'Предохранители. Без них генераторы — просто железные ящики. Мы растащили их по лесу, чтобы ОНО не включило свет первым. Ищи в карманах у таких же, как я.',
    textEn: 'Fuses. Without them the generators are just iron boxes. We scattered them through the forest so IT could not turn the lights on first. Look in the pockets of people like me.',
    obj: 'Собрать 5 предохранителей с тел', objEn: 'Collect 5 fuses from the bodies',
    hint: 'Обыщи труп: E. Один предохранитель = один генератор.',
    hintEn: 'Search a body with E. One fuse = one generator.',
    reveal: { corpseNearest: true },
  },
  {
    who: 'ДЕВОЧКА С ФОНАРИКОМ', whoEn: 'GIRL WITH A TORCH',
    text: 'Каменный круг глушит звук. Внутри него я дышала в голос, а они проходили мимо. Если прижмёт — беги туда. Только не включай там свет.',
    textEn: 'The stone circle swallows sound. Inside it I breathed out loud and they walked right past. If it gets bad — run there. Just do not light anything up.',
    obj: 'Запомнить каменный круг как убежище', objEn: 'Remember the stone circle as a shelter',
    hint: 'В круге твой шум вдвое тише. Отмечен на сонаре.',
    hintEn: 'Inside the circle your noise is halved. Marked on the sonar.',
    reveal: { circle: true },
  },
  {
    who: 'ЛЕСНИК БЕЗ ЛИЦА', whoEn: 'FACELESS WOODMAN',
    text: 'Когда эхо гаснет — это он. Длинный. Он пьёт звук: твой щелчок просто не вернётся. Иди туда, где тишина стала слишком плотной, и беги оттуда со всех ног.',
    textEn: 'When the echo dies — that is him. The Tall One. He drinks sound: your click simply will not come back. Walk toward where the silence got too thick, and run from it.',
    obj: 'Не кричать при Длинном', objEn: 'Never scream near the Tall One',
    hint: 'Он один на весь лес. Медленный, но идёт всегда. Крик = он бежит.',
    hintEn: 'One per forest. Slow, but he never stops. A scream makes him run.',
    reveal: { lore: 'tall', gen: 2 },
  },
  {
    who: 'НАУШНИКИ НА ШЕЕ', whoEn: 'HEADPHONES ROUND THE NECK',
    text: 'Беруши. Восковые. Один раз они спасут тебя, когда ты всё-таки заоришь. Только один раз. Я проверил на себе дважды — второй раз не сработал.',
    textEn: 'Earplugs. Wax ones. Once they will save you when you finally do scream. Only once. I tested it on myself twice — the second time did not work.',
    obj: 'Забрать беруши', objEn: 'Take the earplugs',
    hint: 'Беруши гасят ОДИН крик рядом с тварью.',
    hintEn: 'Earplugs absorb ONE scream next to a monster.',
    item: 'earplugs',
  },
  {
    who: 'СТОРОЖ У ОЗЕРА', whoEn: 'WATCHMAN BY THE LAKE',
    text: 'Сторожка у воды. Я оставил там запасной предохранитель, в ящике под полом. Если утонешь в озере — не кричи. Вода передаёт звук дальше, чем воздух.',
    textEn: 'The hut by the water. I left a spare fuse there, in the box under the floor. If you go into the lake — do not scream. Water carries sound farther than air.',
    obj: 'Забрать запасной предохранитель в сторожке', objEn: 'Take the spare fuse from the cabin',
    hint: 'Сторожка отмечена. В воде ты медленнее и громче.',
    hintEn: 'The cabin is marked. In water you are slower and louder.',
    reveal: { cabin: true, spareFuse: true, gen: 1 },
  },
  {
    who: 'ЖЕНЩИНА, КОТОРАЯ СМЕЯЛАСЬ', whoEn: 'THE WOMAN WHO LAUGHED',
    text: 'Плакальщица воет, а потом бежит. Когда воет — замри и не дыши (Q). И ради всего святого: не ори в ответ. Кто орёт в ответ — уходит с ней.',
    textEn: 'The Weeper wails, and then she runs. When she wails — freeze and hold your breath (Q). And for the love of God: do not scream back. Whoever screams back leaves with her.',
    obj: 'Пережить вой Плакальщицы молча', objEn: 'Survive the Weeper\'s wail in silence',
    hint: 'Она одна. Быстрее твоего бега. Воет — стой. Молчишь — живёшь.',
    hintEn: 'One per forest. Faster than your sprint. She wails — you stand still. You stay silent — you live.',
    reveal: { lore: 'weeper', gen: 4 },
  },
  {
    who: 'ВРАЧ БЕЗ РУК', whoEn: 'HANDED-LESS DOCTOR',
    text: 'Ампула. Адреналин в сердце — бегишь быстрее и не задыхаешься. Каждый запущенный генератор жжёт ночь: свет сокращает её. Пять огней — и до рассвета рукой подать.',
    textEn: 'A vial. Adrenaline into the heart — you run faster and do not gasp. Every generator you start burns the night down: light shortens it. Five lights and dawn is close.',
    obj: 'Запустить все 5 генераторов до рассвета', objEn: 'Start all 5 generators before dawn',
    hint: 'Каждый генератор укорачивает ночь на ~55 секунд и отпугивает шептунов.',
    hintEn: 'Each generator shortens the night by ~55s and repels whisperers.',
    item: 'adrenaline',
  },
];

export const DEATH = {
  scream_close: { ru: ['ТЫ ЗАКРИЧАЛ', 'Оно было в трёх шагах. Твой крик долетел до него быстрее, чем до твоих ушей.'],
                  en: ['YOU SCREAMED', 'It was three steps away. Your scream reached it faster than it reached your own ears.'] },
  whisperer:    { ru: ['ШЕПТУН НАШЁЛ ТЕБЯ', 'Ты слышал его шёпот за секунду до того, как он коснулся шеи. Больше ты ничего не слышал.'],
                  en: ['THE WHISPERER FOUND YOU', 'You heard its whisper a second before it touched your neck. You heard nothing after that.'] },
  tall:         { ru: ['ДЛИННЫЙ ПРИШЁЛ', 'Эхо погасло. Ты понял это слишком поздно — он уже стоял над тобой.'],
                  en: ['THE TALL ONE CAME', 'The echo went out. You understood too late — he was already standing over you.'] },
  weeper:       { ru: ['ПЛАКАЛЬЩИЦА ЗАБРАЛА ГОЛОС', 'Она допела твоим голосом. Лес слушал и не мешал.'],
                  en: ['THE WEEPER TOOK YOUR VOICE', 'She finished the song with your voice. The forest listened and did not interfere.'] },
  nerve:        { ru: ['НЕРВЫ КОНЧИЛИСЬ', 'Ты выжил в трёх встречах. Четвёртой твоё сердце не выдержало.'],
                  en: ['YOUR NERVES GAVE OUT', 'You survived three encounters. Your heart did not survive the fourth.'] },
  bounds:       { ru: ['ЛЕС НЕ ОТПУСКАЕТ', 'Ты пытался уйти. Лес всегда возвращает тебя обратно — к ним.'],
                  en: ['THE FOREST DOES NOT LET GO', 'You tried to leave. The forest always brings you back — to them.'] },
};

export const TUTORIAL = [
  { t: 4, ru: 'Утро. Лес обычный. Птицы, солнце, ни одной твари.', en: 'Morning. An ordinary forest. Birds, sun, not a single creature.' },
  { t: 9, ru: 'SPACE — эхолокационный щелчок. Удерживай для мощного импульса.', en: 'SPACE — echolocation click. Hold it for a powerful pulse.' },
  { t: 15, ru: 'Если дашь доступ к микрофону: щёлкай языком или мычи — звук станет эхом.', en: 'With mic access: click your tongue or hum — your voice becomes the echo.' },
  { t: 22, ru: 'В лесу 5 генераторов и 8 тел. В телах — предохранители и записки.', en: 'There are 5 generators and 8 bodies in the forest. The bodies carry fuses and notes.' },
  { t: 30, ru: 'SHIFT — бег (шумно). CTRL — красться. Q — задержать дыхание.', en: 'SHIFT — run (loud). CTRL — sneak. Q — hold your breath.' },
  { t: 40, ru: 'E рядом с телом или генератором — обыскать / чинить.', en: 'E near a body or a generator — search / repair.' },
  { t: 52, ru: 'Солнце садится быстрее, чем должно…', en: 'The sun is going down faster than it should…' },
];

export const SCARES = [
  { kind: 'branch', ru: 'Ветка треснула за спиной.', en: 'A branch snapped behind you.' },
  { kind: 'face', ru: 'В эхе мелькнуло лицо. Просто мелькнуло.', en: 'A face flickered in the echo. Just flickered.' },
  { kind: 'grab', ru: 'Что-то схватило тебя за ногу и отпустило.', en: 'Something grabbed your ankle and let go.' },
  { kind: 'bang', ru: 'Удар по железу. Очень близко.', en: 'A bang on iron. Very close.' },
  { kind: 'whisper', ru: 'Кто-то прошептал твоё имя.', en: 'Someone whispered your name.' },
  { kind: 'crow', ru: 'Вороны снялись со всех деревьев сразу.', en: 'The crows left every tree at once.' },
];
