import {socialWords} from './socialWords.js';
import {reliableTouchButtons} from './touchButtons.js';

// Notifications in the corner: a friend request, a friend accepted, and — the one that has to be
// answered on the spot — an invitation into someone's room. An invitation carries its own two keys,
// «Присоединиться» and «Отказаться»: it is answered right here, without opening the panel.
// (It used to ask for a word that did not exist, so the decline button came out empty.)
const MAX_ROWS = 3;
const INVITE_MS = 26000;
const OTHER_MS = 12000;

export class SocialToasts {
  constructor({ cloud, account }) {
    this.cloud = cloud;
    this.account = account;
    this.rows = new Map();
    this.seen = new Set();
    this.el = document.createElement('aside');
    this.el.id = 'socialToasts';
    this.el.setAttribute('aria-label', 'Notifications');
    this.el.setAttribute('aria-live', 'polite');
    document.body.append(this.el);
    this.off = cloud.on(() => {
      const id = cloud.user?.id || null;
      if (id !== this.owner) {
        this.owner = id;
        this.clear();
      }
    });
    this.touch = reliableTouchButtons(this.el, () => this.rows.size > 0, () => cloud.user?.id || 'guest');
    this.el.addEventListener('click', (e) => this.click(e));
  }

  push({ type, item } = {}) {
    if (!item || !this.cloud.user) return;
    const key = this.cloud.user.id + ':' + type + ':' + item.id;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    if (this.seen.size > 256) this.seen.delete(this.seen.values().next().value);
    while (this.rows.size >= MAX_ROWS) this.remove(this.rows.keys().next().value);
    const S = socialWords();
    const invite = type === 'room_invite';
    const el = document.createElement('section');
    el.className = 'social-toast';
    el.dataset.kind = type;

    const title = document.createElement('strong');
    title.textContent = S[type] || S.room_invite;
    el.append(title);

    const name = document.createElement('p');
    name.className = 'social-toast-name';
    if (!this.account.canOpen()) name.textContent = S.later;
    else {
      const who = item.display_name || (item.handle ? '@' + item.handle : '');
      const room = item.room_code ? ` · ${S.room || 'комната'} ${item.room_code}` : '';
      name.textContent = invite ? `${who || S.friend} ${S.inviteBody}${room}` : who;
    }
    el.append(name);

    const buttons = document.createElement('div');
    buttons.className = 'social-toast-actions';
    const list = invite
      ? [['accept', S.joinRoom], ['decline', S.decline], ['dismiss', '×']]
      : [['view', S.view], ['dismiss', '×']];
    for (const [action, text] of list) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.action = action;
      b.dataset.id = key;
      b.textContent = text;
      if (action === 'accept') b.className = 'primary';
      if (action === 'dismiss') b.setAttribute('aria-label', S.toastClose || 'Close');
      buttons.append(b);
    }
    el.append(buttons);

    if (invite) {
      const err = document.createElement('p');
      err.className = 'social-toast-err';
      err.hidden = true;
      el.append(err);
    }

    this.el.append(el);
    const timer = setTimeout(() => this.remove(key), invite ? INVITE_MS : OTHER_MS);
    this.rows.set(key, { key, el, timer, item, type, busy: false });
  }

  click(e) {
    const b = e.target?.closest?.('[data-action]');
    if (!b) return;
    const row = this.rows.get(b.dataset.id);
    if (!row) return;
    const action = b.dataset.action;
    if (action === 'dismiss') {
      this.remove(row.key);
      return;
    }
    if (action === 'accept' || action === 'decline') {
      this.answer(row, action === 'accept');
      return;
    }
    if (this.account.canOpen()) {
      this.account.open('friends');
      this.remove(row.key);
    }
  }

  // answered on the spot: the keys go quiet, and the row only leaves once the server has said yes
  async answer(row, accept) {
    if (row.busy) return;
    row.busy = true;
    const S = socialWords();
    const joinKey = row.el.querySelector('[data-action="accept"]');
    const noKey = row.el.querySelector('[data-action="decline"]');
    const err = row.el.querySelector('.social-toast-err');
    const keep = accept ? S.joinRoom : S.decline;
    if (joinKey) joinKey.disabled = true;
    if (noKey) noKey.disabled = true;
    const asked = accept ? joinKey : noKey;
    if (asked) asked.textContent = accept ? S.joining : S.declining;
    row.el.setAttribute('aria-busy', 'true');
    if (err) err.hidden = true;
    let ok = true;
    try {
      ok = await Promise.resolve(this.account.toastInvite?.(row.item?.id, accept));
    } catch {
      ok = false;
    }
    row.el.removeAttribute('aria-busy');
    if (ok !== false) {
      this.remove(row.key);
      return;
    }
    row.busy = false;
    if (joinKey) joinKey.disabled = false;
    if (noKey) noKey.disabled = false;
    if (asked) asked.textContent = keep;
    if (err) {
      err.textContent = S.toastFail;
      err.hidden = false;
    }
    row.busy = false;
  }

  remove(key) {
    const r = this.rows.get(key);
    if (!r) return;
    clearTimeout(r.timer);
    r.el.remove();
    this.rows.delete(key);
  }

  clear() {
    for (const key of [...this.rows.keys()]) this.remove(key);
  }

  destroy() {
    this.off();
    this.touch();
    this.clear();
    this.el.remove();
  }
}
