// (5.0j) «Слушает…» — what a friend is playing in Justify, the owner's music player. A Justify account is the
// same account as the game's (one Supabase project), and Justify keeps one row per player in justify_now_playing
// (supabase/migrations/20261107120000_justify_sync_and_now_playing.sql). The game only reads it, through
// justify_friends_listening(): the database lets through friends only (hush_is_friend) and drops what went stale
// (playing — older than 3 minutes, paused — older than 30). Everything here is about drawing that safely: a row
// from the network is someone else's text, so it is clipped and stripped, and a cover or a link is kept only when
// it is a plain https address.
import { t } from '../core/i18n.js';

export const LISTEN_POLL = 45000; // asked again while a list of friends is on screen
export const LISTEN_MIN = 10000; // three screens opening at once still ask once
export const LISTEN_STALE = 180000; // what was heard longer ago than this is not shown (the server's own cutoff for a playing track)
const TEXT = 200;
const URL_MAX = 1000;
// control characters, and the marks that turn text around (a title must not reverse the line it sits in)
const UNSAFE = /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

export function clipText(v, n = TEXT) {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').replace(UNSAFE, '').trim().slice(0, n).trim();
  return s || null;
}

// an https address with a host and no login in it, or nothing
export function httpsOnly(v) {
  if (typeof v !== 'string' || !v || v.length > URL_MAX) return null;
  let u;
  try { u = new URL(v); } catch { return null; }
  if (u.protocol !== 'https:' || !u.hostname || u.username || u.password) return null;
  return u.href.length <= URL_MAX ? u.href : null;
}

const secs = (v, max = 86400) => (Number.isFinite(+v) && +v >= 0 ? Math.min(max, Math.floor(+v)) : null);

// rows from the server → Map(friend id → what they play). Only ids on the friends list are kept (the server
// already says so; this is the second lock), at most one row each. at = when this machine heard it.
export function cleanListening(rows, friends = null, now = Date.now()) {
  const out = new Map();
  if (!Array.isArray(rows)) return out;
  const ok = friends ? new Set(friends) : null;
  for (const r of rows.slice(0, 200)) {
    if (!r || typeof r !== 'object') continue;
    const id = typeof r.user_id === 'string' ? r.user_id : null;
    if (!id || (ok && !ok.has(id)) || out.has(id)) continue;
    if (r.state !== 'playing' && r.state !== 'paused') continue;
    const title = clipText(r.title);
    if (!title) continue;
    const duration = secs(r.duration);
    let position = secs(r.position) ?? 0;
    if (duration) position = Math.min(position, duration);
    out.set(id, {
      state: r.state, title, artist: clipText(r.artist), album: clipText(r.album),
      cover: httpsOnly(r.cover), link: httpsOnly(r.link), source: clipText(r.source, 20),
      duration: duration || null, position, at: now,
    });
  }
  return out;
}

// what a change looks like on screen: a playing track's clock moving on is not one
export function listeningKey(map) {
  return [...map].map(([id, x]) => [id, x.state, x.title, x.artist, x.album, x.cover, x.link].join('\u0001')).sort().join('\u0002');
}

// a playing track keeps counting here between two asks (the server sent where it was)
export function listenPosition(x, now = Date.now()) {
  if (!x) return 0;
  let p = x.position + (x.state === 'playing' ? Math.max(0, (now - x.at) / 1000) : 0);
  if (x.duration) p = Math.min(p, x.duration);
  return Math.floor(p);
}

export function clock(s) {
  s = Math.max(0, Math.floor(s || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

// «🎧 Слушает: {title} — {artist}», on pause «🎧 На паузе: …»
export function listenTrack(x) { return x.artist ? `${x.title} — ${x.artist}` : x.title; }
export function listenLine(x) { return `🎧 ${t(x.state === 'paused' ? 'listenPaused' : 'listenNow')}: ${listenTrack(x)}`; }
