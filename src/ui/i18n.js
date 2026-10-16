// ============================================================
// I18N — RU (source) / EN. Applied to [data-i18n] nodes and used for
// all dynamic strings.
// ============================================================
export const STR = {
  ru: {
    phase_morning: 'УТРО', phase_dusk: 'СУМЕРКИ', phase_night: 'НОЧЬ', phase_dawn: 'РАССВЕТ',
    until_dawn: 'ДО РАССВЕТА', sonar: 'СОНАР', stamina: 'ДЫХАНИЕ',
    mic_live: 'МИКРОФОН', mic_keys: 'КЛАВИШИ', mic_hint: 'тихий щелчок голосом = эхо · КРИК = смерть',
    mic_hint_keys: 'SPACE = эхо · X = крик · не ори, когда они рядом',
    silence: 'ТИШИНА', score: 'ОЧКИ', generators: 'ГЕНЕРАТОРЫ',
    t_ping: 'ЭХО', t_use: 'РУКИ', t_run: 'БЕГ', t_breath: 'ТИХО', t_shout: 'КРИК',
    brand_sub: 'sonar horror // low-poly forest',
    brand_tag: 'Ты ничего не видишь. Твой голос — единственный фонарь.',
    night_len: 'ДЛИНА НОЧИ', night_arcade: 'АРКАДА 8м', night_short: 'КОРОТКАЯ 15м', night_canon: 'КАНОН 30м',
    audio_in: 'ЗВУКОВОЙ ВВОД', mic_on: 'МИКРОФОН', mic_off: 'КЛАВИШИ', calibrate: 'КАЛИБРОВКА',
    graphics: 'ГРАФИКА', q_low: 'НИЗК.', q_high: 'ВЫС.', shake: 'Тряска экрана', scares: 'Скримеры',
    snd: 'ЗВУК', snd_master: 'Общая громкость', snd_amb: 'Лес: ветер, дрон',
    snd_mon: 'Твари и страх', snd_sfx: 'Эхо и действия', snd_ui: 'Меню',
    mic_sens: 'Чувствительность микрофона',
    hud_label: 'ИНТЕРФЕЙС', hud_full: 'ПОЛНЫЙ', hud_min: 'МИНИМУМ', hud_none: 'НИЧЕГО',
    hud_fade: 'Гасить в тишине', hud_hint_min: 'Остались сонар, нервы и микрофон',
    coop: 'ОНЛАЙН КООП', coop_host: 'СОЗДАТЬ КОМНАТУ', coop_join: 'ВОЙТИ',
    coop_msg: 'P2P через WebRTC. Хост считает монстров, гости видят общий мир. Голосовой чат включается в игре — товарищ услышит твой крик.',
    voice_chat: 'Голосовой чат', controls: 'УПРАВЛЕНИЕ',
    k_move: 'идти', k_look: 'смотреть', k_ping: 'эхолокационный щелчок (удерживай = мощный импульс)',
    k_shout: 'КРИК — видно всё, но твари сбегутся', k_run: 'бег (шумно)', k_crouch: 'красться (тихо)',
    k_breath: 'задержать дыхание', k_use: 'чинить / обыскать труп', k_map: 'цели и записки',
    k_pause: 'пауза', k_mic: 'голос: тихий щелчок языком = эхо. Не кричи.',
    k_hud: 'интерфейс: минимум → ничего → полный', k_mute: 'звук вкл/выкл',
    highscores: 'РЕКОРДЫ', clear: 'стереть', start: 'ВОЙТИ В ЛЕС',
    epilepsy: 'Есть вспышки, громкие звуки и скримеры. Нужны наушники и микрофон.',
    objectives: 'ЗАДАЧИ', found_notes: 'НАЙДЕННЫЕ ЗАПИСКИ',
    paused: 'ПАУЗА', resume: 'ПРОДОЛЖИТЬ', restart: 'ЗАНОВО', to_menu: 'В МЕНЮ',
    pause_hint: 'Монстры ждут. Они не дышат, пока ты в меню.',
    final_score: 'ИТОГ', new_record: 'НОВЫЙ РЕКОРД', save_score: 'ЗАПИСАТЬ', again: 'ЕЩЁ РАЗ',
    // dynamic
    obj_survive: 'Продержаться до рассвета', obj_gens: 'Запустить генераторы', obj_fuses: 'Найти предохранители',
    obj_notes: 'Читать записки на телах',
    interact_corpse: 'обыскать тело', interact_gen: 'починить генератор', interact_gen_nofuse: 'нужен предохранитель',
    interact_stash: 'забрать предохранитель',
    hold: 'ДЕРЖИ', fuse_got: 'ПРЕДОХРАНИТЕЛЬ', fuses_left: 'предохранителей',
    danger_near: 'ОНО РЯДОМ', danger_hunt: 'ТЕБЯ СЛЫШАТ', danger_wail: 'НЕ КРИЧИ', danger_tall: 'ЭХО ГАСНЕТ',
    dawn_in: 'ДО РАССВЕТА',
    gen_done: 'ГЕНЕРАТОР ЗАПУЩЕН', gen_short: 'ночь короче на',
    win_title: 'РАССВЕТ', you_died: 'ТЫ УМЕР',
    stat_time: 'ПРОДЕРЖАЛСЯ', stat_gens: 'ГЕНЕРАТОРЫ', stat_notes: 'ЗАПИСКИ', stat_pings: 'ЭХО',
    stat_screams: 'КРИКИ', stat_dist: 'ПРОШЁЛ', stat_nerve: 'НЕРВЫ', stat_silence: 'МАКС. ТИШИНА',
    hs_name: 'ИМЯ', hs_rank: '#', hs_score: 'ОЧКИ', hs_time: 'ВРЕМЯ', hs_gens: 'ГЕН.',
    hs_empty: 'Пока пусто. Лес ждёт первого.',
    mic_denied: 'микрофон не дан — играем на клавишах', mic_on_msg: 'микрофон жив',
    calib0: 'МОЛЧИ 2 секунды…', calib1: 'щёлкни языком / скажи «эээ»…', calib2: 'А ТЕПЕРЬ ЗАКРИЧИ!', calibDone: 'готово',
    coop_hosting: 'комната создана, ждём', coop_joining: 'подключение…', coop_connected: 'напарник в лесу',
    coop_closed: 'один в лесу', coop_err: 'не вышло: проверь сеть', coop_code: 'КОД',
    voice_on: 'голосовой чат включён', voice_remote_loud: 'НАПАРНИК ОРЕТ',
    night_start: 'НОЧЬ. Продержись до рассвета.',
    pause_stats: ['время', 'очки', 'генераторы', 'предохранители', 'нервы'],
  },
  en: {
    phase_morning: 'MORNING', phase_dusk: 'DUSK', phase_night: 'NIGHT', phase_dawn: 'DAWN',
    until_dawn: 'UNTIL DAWN', sonar: 'SONAR', stamina: 'BREATH',
    mic_live: 'MICROPHONE', mic_keys: 'KEYBOARD', mic_hint: 'quiet voice click = echo · SCREAMING = death',
    mic_hint_keys: 'SPACE = echo · X = scream · never scream when they are close',
    silence: 'SILENCE', score: 'SCORE', generators: 'GENERATORS',
    t_ping: 'ECHO', t_use: 'HANDS', t_run: 'RUN', t_breath: 'HUSH', t_shout: 'SCREAM',
    brand_sub: 'sonar horror // low-poly forest',
    brand_tag: 'You can see nothing. Your voice is the only flashlight.',
    night_len: 'NIGHT LENGTH', night_arcade: 'ARCADE 8m', night_short: 'SHORT 15m', night_canon: 'CANON 30m',
    audio_in: 'AUDIO INPUT', mic_on: 'MICROPHONE', mic_off: 'KEYBOARD', calibrate: 'CALIBRATE',
    graphics: 'GRAPHICS', q_low: 'LOW', q_high: 'HIGH', shake: 'Screen shake', scares: 'Jumpscares',
    snd: 'SOUND', snd_master: 'Master volume', snd_amb: 'Forest: wind, drone',
    snd_mon: 'Creatures & dread', snd_sfx: 'Echo & actions', snd_ui: 'Menus',
    mic_sens: 'Microphone sensitivity',
    hud_label: 'INTERFACE', hud_full: 'FULL', hud_min: 'MINIMAL', hud_none: 'NOTHING',
    hud_fade: 'Fade out when silent', hud_hint_min: 'Only sonar, nerve and the mic are left',
    coop: 'ONLINE CO-OP', coop_host: 'CREATE ROOM', coop_join: 'JOIN',
    coop_msg: 'P2P over WebRTC. The host simulates the monsters, guests share the same forest. Turn voice chat on in-game — your friend will hear you scream.',
    voice_chat: 'Voice chat', controls: 'CONTROLS',
    k_move: 'move', k_look: 'look', k_ping: 'echolocation click (hold = powerful pulse)',
    k_shout: 'SCREAM — reveals everything, wakes everything', k_run: 'run (loud)', k_crouch: 'sneak (quiet)',
    k_breath: 'hold your breath', k_use: 'repair / search a body', k_map: 'objectives and notes',
    k_pause: 'pause', k_mic: 'voice: a quiet tongue click = echo. Do not scream.',
    k_hud: 'interface: minimal → nothing → full', k_mute: 'sound on/off',
    highscores: 'HIGH SCORES', clear: 'clear', start: 'ENTER THE FOREST',
    epilepsy: 'Contains flashes, loud sounds and jumpscares. Headphones and a microphone recommended.',
    objectives: 'OBJECTIVES', found_notes: 'NOTES FOUND',
    paused: 'PAUSED', resume: 'RESUME', restart: 'RESTART', to_menu: 'MAIN MENU',
    pause_hint: 'They are waiting. They do not breathe while you are in the menu.',
    final_score: 'FINAL', new_record: 'NEW RECORD', save_score: 'SAVE', again: 'AGAIN',
    obj_survive: 'Survive until dawn', obj_gens: 'Start the generators', obj_fuses: 'Find fuses',
    obj_notes: 'Read the notes on the bodies',
    interact_corpse: 'search the body', interact_gen: 'repair the generator', interact_gen_nofuse: 'needs a fuse',
    interact_stash: 'take the fuse',
    hold: 'HOLD', fuse_got: 'FUSE', fuses_left: 'fuses',
    danger_near: 'IT IS CLOSE', danger_hunt: 'THEY HEAR YOU', danger_wail: 'DO NOT SCREAM', danger_tall: 'THE ECHO IS DYING',
    dawn_in: 'UNTIL DAWN',
    gen_done: 'GENERATOR ONLINE', gen_short: 'the night is shorter by',
    win_title: 'DAWN', you_died: 'YOU DIED',
    stat_time: 'SURVIVED', stat_gens: 'GENERATORS', stat_notes: 'NOTES', stat_pings: 'ECHOES',
    stat_screams: 'SCREAMS', stat_dist: 'WALKED', stat_nerve: 'NERVE', stat_silence: 'BEST SILENCE',
    hs_name: 'NAME', hs_rank: '#', hs_score: 'SCORE', hs_time: 'TIME', hs_gens: 'GEN',
    hs_empty: 'Empty. The forest waits for the first one.',
    mic_denied: 'mic denied — playing on keyboard', mic_on_msg: 'mic live',
    calib0: 'STAY SILENT for 2 seconds…', calib1: 'click your tongue / say "aaa"…', calib2: 'NOW SCREAM!', calibDone: 'done',
    coop_hosting: 'room created, waiting', coop_joining: 'connecting…', coop_connected: 'a partner is in the forest',
    coop_closed: 'alone in the forest', coop_err: 'failed: check your connection', coop_code: 'CODE',
    voice_on: 'voice chat on', voice_remote_loud: 'YOUR PARTNER IS SCREAMING',
    night_start: 'NIGHT. Hold on until dawn.',
    pause_stats: ['time', 'score', 'generators', 'fuses', 'nerve'],
  },
};

export class I18n {
  constructor(lang = 'ru') { this.lang = lang; }
  set(lang) { this.lang = lang; this.apply(); }
  t(key, vars) {
    let s = (STR[this.lang] && STR[this.lang][key]) ?? STR.ru[key] ?? key;
    if (vars) for (const k in vars) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    return s;
  }
  apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const k = el.getAttribute('data-i18n');
      const v = this.t(k);
      if (el.tagName === 'INPUT') el.placeholder = v;
      else if (el.childNodes.length === 1 && el.firstChild.nodeType === 3) el.textContent = v;
      else {
        // keep inner markup (kbd, b, em…) — replace only the trailing text node
        const last = el.lastChild;
        if (last && last.nodeType === 3) last.nodeValue = ' ' + v;
        else el.appendChild(document.createTextNode(' ' + v));
      }
    });
  }
}
