// 3.0y: which key does what. The game reads actions, not keys; this file is the only place that knows the codes.
// Bindings are physical (e.code), so they keep working on any layout. A player's own choices live in
// settings.keys (a device setting: core/persistence.js DEVICE_KEYS) on top of the defaults below.
//
// The arrows (move / turn), Escape (pause) and Enter (confirm) stay where they are whatever is rebound: they are
// the way back if a binding goes wrong.

// (4.0) jump: V, as in the survival games that keep SPACE for something else (here: the echolocator)
export const ACTIONS = ['forward', 'back', 'left', 'right', 'sprint', 'crouch', 'jump', 'ping', 'use', 'bag', 'watch', 'carry', 'mic', 'pause'];
export const DEFAULT_KEYS = {
  forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', sprint: 'ShiftLeft', crouch: 'KeyC', jump: 'KeyV',
  ping: 'Space', use: 'KeyE', bag: 'KeyI', watch: 'Tab', carry: 'KeyR', mic: 'KeyM', pause: 'KeyP',
};
// fixed keys that always work alongside the bindings (and cannot be taken by one)
export const FIXED = { ArrowUp: 'forward', ArrowDown: 'back', ArrowLeft: 'turnLeft', ArrowRight: 'turnRight', Escape: 'pause', Enter: 'confirm', NumpadEnter: 'confirm', ShiftRight: 'sprint' };

const CODE = /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|F([1-9]|1[0-2])|Space|Tab|ShiftLeft|ControlLeft|ControlRight|AltLeft|AltRight|CapsLock|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash|Backspace|Delete|Insert|Home|End|PageUp|PageDown)$/;
export const bindable = (code) => typeof code === 'string' && CODE.test(code) && !(code in FIXED);

// a player's saved choices → a full, valid map (unknown actions and bad codes dropped; no code used twice)
export function cleanKeys(raw) {
  const out = { ...DEFAULT_KEYS };
  const src = raw && typeof raw === 'object' ? raw : {};
  const mine = ACTIONS.filter((a) => bindable(src[a]));
  for (const a of mine) out[a] = src[a];
  // (4.0) a player's own choices first, then the defaults: a key that joins the defaults later (V for the jump)
  // never takes one somebody had already chosen for something else — the newcomer is left unbound instead
  const seen = new Map();
  for (const a of [...mine, ...ACTIONS.filter((x) => !mine.includes(x))]) {
    const c = out[a];
    if (seen.has(c)) out[a] = DEFAULT_KEYS[a] !== c && ![...seen.keys()].includes(DEFAULT_KEYS[a]) ? DEFAULT_KEYS[a] : null;
    if (out[a]) seen.set(out[a], a);
  }
  return out;
}

// only what differs from the defaults is stored
export function keysToSave(map) {
  const out = {};
  for (const a of ACTIONS) if (map[a] && map[a] !== DEFAULT_KEYS[a]) out[a] = map[a];
  return out;
}

// bind `code` to `action`; whatever had that code before takes the action's old key (a swap, never a hole)
export function rebind(map, action, code) {
  if (!ACTIONS.includes(action) || !bindable(code)) return map;
  const next = { ...map };
  const other = ACTIONS.find((a) => a !== action && next[a] === code);
  if (other) next[other] = next[action];
  next[action] = code;
  return next;
}

// code → action, for the keyboard handler
export function actionMap(map) {
  const m = new Map();
  for (const a of ACTIONS) if (map[a]) m.set(map[a], a);
  for (const [code, a] of Object.entries(FIXED)) if (!m.has(code)) m.set(code, a);
  return m;
}

// how a key is written on a keycap
export function keyLabel(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  const names = { Space: 'Space', Tab: 'Tab', ShiftLeft: 'Shift', ControlLeft: 'Ctrl', ControlRight: 'Ctrl R', AltLeft: 'Alt', AltRight: 'Alt R', CapsLock: 'Caps', Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backspace: 'Backspace', Delete: 'Del', Insert: 'Ins', Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn' };
  return names[code] || code;
}
