// RU / EN strings. Russian is the default.
const STR = {
  ru: {
    title: 'ТИШЕ',
    tagline: 'Ты слеп. Лес — нет.',
    subtitle: 'эхолокационный хоррор · продержись 30 минут',
    play: 'ИГРАТЬ',
    scores: 'РЕКОРДЫ',
    settings: 'НАСТРОЙКИ',
    howto: 'КАК ИГРАТЬ',
    back: 'НАЗАД',
    resume: 'ПРОДОЛЖИТЬ',
    restart: 'ЗАНОВО',
    menu: 'В МЕНЮ',
    paused: 'ПАУЗА',
    callsign: 'Позывной',
    headphones: 'Играй в наушниках. Звук — твои глаза.',
    loading: 'лес растёт…',
    micOn: 'МИКРОФОН: ВКЛ',
    micOff: 'МИКРОФОН: ВЫКЛ',
    micAsk: 'Разрешить микрофон',
    micDenied: 'Микрофон недоступен — играй клавишами (ПРОБЕЛ / кнопка ЭХО).',
    micIframe: 'Браузер блокирует микрофон во встроенном окне.',
    micOpenTab: 'Открыть в новой вкладке',
    micTest: 'проверь микрофон: скажи «эй»',
    zoneQuiet: 'тихо',
    zoneEcho: 'эхо',
    zoneScream: 'КРИК',
    score: 'СЧЁТ',
    best: 'рекорд',
    dawnIn: 'до рассвета',
    stones: 'камни',
    stamina: 'дыхание',
    // intro / tutorial
    intro1: 'ты ничего не видишь',
    intro2: 'издай звук',
    introHintMic: 'хлопни, щёлкни языком или скажи «эй» — или зажми ПРОБЕЛ',
    introHintKeys: 'нажми ПРОБЕЛ — короткий щелчок, зажми — громче',
    introHintTouch: 'нажми ЭХО — щелчок, удерживай — громче',
    itHears: 'оно тебя слышит',
    tutMove: 'уходи тихо — WASD · Shift бег (шумно) · C красться',
    tutMoveTouch: 'уходи тихо — левый стик · до упора = бег (шумно)',
    tutStone: 'ПКМ / F — бросить камень и отвлечь их',
    tutStoneTouch: 'КАМЕНЬ — бросить и отвлечь их',
    tutShards: 'собирай янтарные осколки · дождись рассвета',
    tutScream: 'и что бы ни случилось — не кричи',
    // alerts
    aHeard: 'ОНО УСЛЫШАЛО',
    aHunt: 'ОХОТА',
    aEscaped: 'ОТОРВАЛСЯ',
    aClose: 'ВПРИТЫК',
    aShard: 'ОСКОЛОК',
    aDontScream: 'НЕ КРИЧИ',
    aWake: 'ЛЕС ПРОСЫПАЕТСЯ',
    aExhausted: 'ты задыхаешься — это слышно',
    aNoStones: 'нет камней',
    aMicLost: 'микрофон отключён',
    aDawnSoon: 'небо светлеет…',
    // ends
    deadTitle: 'ТЕБЯ НАШЛИ',
    deadScream: 'ТЫ ЗАКРИЧАЛ',
    deadCrawler: 'ОНО ПОЛЗЛО К ТЕБЕ',
    winTitle: 'РАССВЕТ',
    winSub: 'ты дожил до утра. лес отпускает тебя.',
    survived: 'продержался',
    shardsGot: 'осколки',
    closeCalls: 'впритык',
    escapes: 'отрывы',
    loudest: 'громче всего',
    newRecord: 'НОВЫЙ РЕКОРД',
    restartHint: 'R / Enter / тап — заново',
    noScores: 'пока пусто. стань первым.',
    rank: '#',
    name: 'имя',
    time: 'время',
    // settings
    sVolume: 'Громкость',
    sMouse: 'Чувствительность мыши',
    sInvert: 'Инверсия Y',
    sMic: 'Микрофон',
    sMicSens: 'Чувствительность микрофона',
    sEcho: 'Эхо голоса',
    sScares: 'Скримеры',
    sScaresFull: 'полные',
    sScaresReduced: 'мягкие (без вспышек)',
    sQuality: 'Графика',
    sQAuto: 'авто',
    sQHigh: 'высокая',
    sQLow: 'низкая',
    sLang: 'Язык',
    on: 'вкл',
    off: 'выкл',
    // how to
    howtoBody: `
<p><b>Ты в огромном тёмном лесу и ничего не видишь.</b> Любой звук — эхолокатор: волна расходится от тебя и на секунды проявляет деревья, камни… и <span class="red">их</span>.</p>
<p><b>Микрофон:</b> щёлкни языком, хлопни, скажи «эй». Громче звук — дальше видно. Но <span class="red">они слышат так же далеко</span>. Крик (красная зона) — мгновенная охота.</p>
<p><b>Без микрофона:</b> ПРОБЕЛ / ЛКМ — щелчок, удерживай — громче.</p>
<p><b>Твари</b> идут туда, где был звук, а не туда, где ты сейчас. Пискнул — уходи. Камень (ПКМ / F) уводит их в сторону и подсвечивает место падения.</p>
<p><b>Шаги</b> тоже шумят: бег громкий, красться — тихо. Врезался в дерево — это слышно.</p>
<p><b>Очки:</b> время × множитель опасности, янтарные осколки, проходы впритык, отрывы от погони. Дожить до рассвета (30:00) — огромный бонус.</p>
<table class="keys">
<tr><td>WASD</td><td>движение</td></tr>
<tr><td>Стрелки · Q / E</td><td>движение и поворот без мыши</td></tr>
<tr><td>Мышь</td><td>обзор (клик — захват курсора)</td></tr>
<tr><td>ПРОБЕЛ / ЛКМ</td><td>эхо: тап — щелчок, удерживай — громко</td></tr>
<tr><td>ПКМ / F</td><td>бросить камень</td></tr>
<tr><td>Shift / C</td><td>бег / красться</td></tr>
<tr><td>M · Esc / P</td><td>микрофон · пауза</td></tr>
</table>`,
    touchPing: 'ЭХО',
    touchStone: 'КАМЕНЬ',
    clickToLook: 'кликни, чтобы управлять взглядом',
    dragToLook: 'зажми ЛКМ и тяни, чтобы смотреть',
    touchCrouch: 'ТИХО',
    deathBy: {
      listener: 'Слушатель',
      crawler: 'Ползун',
    },
  },
  en: {
    title: 'HUSH',
    tagline: 'You are blind. The forest is not.',
    subtitle: 'an echolocation horror · survive 30 minutes',
    play: 'PLAY',
    scores: 'HIGH SCORES',
    settings: 'SETTINGS',
    howto: 'HOW TO PLAY',
    back: 'BACK',
    resume: 'RESUME',
    restart: 'RESTART',
    menu: 'MAIN MENU',
    paused: 'PAUSED',
    callsign: 'Callsign',
    headphones: 'Wear headphones. Sound is your eyes.',
    loading: 'growing the forest…',
    micOn: 'MIC: ON',
    micOff: 'MIC: OFF',
    micAsk: 'Allow microphone',
    micDenied: 'Microphone unavailable — play with keys (SPACE / ECHO button).',
    micIframe: 'The browser blocks the mic inside embedded frames.',
    micOpenTab: 'Open in a new tab',
    micTest: 'test your mic: say “hey”',
    zoneQuiet: 'quiet',
    zoneEcho: 'echo',
    zoneScream: 'SCREAM',
    score: 'SCORE',
    best: 'best',
    dawnIn: 'until dawn',
    stones: 'stones',
    stamina: 'breath',
    intro1: 'you cannot see anything',
    intro2: 'make a sound',
    introHintMic: 'clap, click your tongue or say “hey” — or hold SPACE',
    introHintKeys: 'tap SPACE for a click, hold for louder',
    introHintTouch: 'tap ECHO for a click, hold for louder',
    itHears: 'it can hear you',
    tutMove: 'move away quietly — WASD · Shift run (loud) · C sneak',
    tutMoveTouch: 'move away quietly — left stick · push fully to run (loud)',
    tutStone: 'RMB / F — throw a stone to distract them',
    tutStoneTouch: 'STONE — throw it to distract them',
    tutShards: 'collect amber shards · wait for dawn',
    tutScream: 'and whatever happens — do not scream',
    aHeard: 'IT HEARD THAT',
    aHunt: 'HUNTED',
    aEscaped: 'ESCAPED',
    aClose: 'CLOSE CALL',
    aShard: 'SHARD',
    aDontScream: "DON'T SCREAM",
    aWake: 'THE FOREST STIRS',
    aExhausted: 'you are gasping — they can hear it',
    aNoStones: 'no stones',
    aMicLost: 'microphone disconnected',
    aDawnSoon: 'the sky is getting lighter…',
    deadTitle: 'IT FOUND YOU',
    deadScream: 'YOU SCREAMED',
    deadCrawler: 'IT CRAWLED TO YOU',
    winTitle: 'DAWN',
    winSub: 'you made it to morning. the forest lets you go.',
    survived: 'survived',
    shardsGot: 'shards',
    closeCalls: 'close calls',
    escapes: 'escapes',
    loudest: 'loudest',
    newRecord: 'NEW HIGH SCORE',
    restartHint: 'R / Enter / tap — restart',
    noScores: 'empty. be the first.',
    rank: '#',
    name: 'name',
    time: 'time',
    sVolume: 'Volume',
    sMouse: 'Mouse sensitivity',
    sInvert: 'Invert Y',
    sMic: 'Microphone',
    sMicSens: 'Mic sensitivity',
    sEcho: 'Voice echo',
    sScares: 'Jumpscares',
    sScaresFull: 'full',
    sScaresReduced: 'gentle (no flashes)',
    sQuality: 'Graphics',
    sQAuto: 'auto',
    sQHigh: 'high',
    sQLow: 'low',
    sLang: 'Language',
    on: 'on',
    off: 'off',
    howtoBody: `
<p><b>You are in a vast dark forest and you cannot see.</b> Every sound is sonar: a wave spreads out from you and for a few seconds reveals trees, rocks… and <span class="red">them</span>.</p>
<p><b>Microphone:</b> click your tongue, clap, say “hey”. Louder sound — you see further. But <span class="red">they hear just as far</span>. A scream (red zone) means an instant hunt.</p>
<p><b>No mic:</b> SPACE / LMB — a click, hold for louder.</p>
<p><b>Monsters</b> walk to where the sound was, not where you are. Made a noise? Move. A stone (RMB / F) lures them away and lights up where it lands.</p>
<p><b>Footsteps</b> make noise too: running is loud, sneaking is quiet. Bumping into a tree is loud.</p>
<p><b>Score:</b> time × danger multiplier, amber shards, close calls, escaped hunts. Reaching dawn (30:00) gives a huge bonus.</p>
<table class="keys">
<tr><td>WASD</td><td>move</td></tr>
<tr><td>Arrows · Q / E</td><td>move &amp; turn without a mouse</td></tr>
<tr><td>Mouse</td><td>look (click to lock cursor)</td></tr>
<tr><td>SPACE / LMB</td><td>echo: tap = click, hold = loud</td></tr>
<tr><td>RMB / F</td><td>throw stone</td></tr>
<tr><td>Shift / C</td><td>run / sneak</td></tr>
<tr><td>M · Esc / P</td><td>mic · pause</td></tr>
</table>`,
    touchPing: 'ECHO',
    touchStone: 'STONE',
    clickToLook: 'click to control the camera',
    dragToLook: 'hold LMB and drag to look around',
    touchCrouch: 'SNEAK',
    deathBy: {
      listener: 'Listener',
      crawler: 'Crawler',
    },
  },
};

let lang = 'ru';
export function setLang(l) {
  lang = STR[l] ? l : 'ru';
  document.documentElement.lang = lang;
}
export function getLang() {
  return lang;
}
export function t(key) {
  const v = STR[lang][key];
  return v === undefined ? STR.ru[key] ?? key : v;
}
