// Extra ICE servers for co-op.
//
// Out of the box the game uses public STUN servers (built into Trystero). That connects most pairs of players
// directly, but when one of them is behind strict NAT — mobile internet, carrier-grade NAT, some office Wi-Fi,
// which is what «a friend in another country can't get in» usually turns out to be — they need a TURN relay.
//
// (3.1e) The relay comes from our own Supabase project: the edge function `hush-turn` asks Cloudflare's TURN
// service for 6-hour credentials (supabase/functions/hush-turn). They are fetched before joining a room and
// kept until shortly before they expire. No answer in time, or the function not configured: the game connects
// exactly as it did before, with STUN only. Everything stays end-to-end encrypted; TURN only forwards packets.
//
// A fixed relay of your own can still go into ICE_SERVERS below; it is used alongside the fetched one.
import { SUPABASE_URL, SUPABASE_KEY } from '../cloud/client.js';

export const ICE_SERVERS = [];
export const TURN_URL = `${SUPABASE_URL}/functions/v1/hush-turn`;
const ICE_URL = /^(stun|turn|turns):[^\s]{3,250}$/;

let cache = null; // { servers, until, configured }

// only what a browser should be handed: stun/turn URLs, and string credentials
export function cleanIce(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const s of list.slice(0, 8)) {
    if (!s || typeof s !== 'object') continue;
    const urls = (Array.isArray(s.urls) ? s.urls : [s.urls]).filter((u) => typeof u === 'string' && ICE_URL.test(u)).slice(0, 8);
    if (!urls.length) continue;
    const e = { urls };
    if (typeof s.username === 'string' && s.username.length < 512) e.username = s.username;
    if (typeof s.credential === 'string' && s.credential.length < 512) e.credential = s.credential;
    if (urls.some((u) => u.startsWith('turn')) && !(e.username && e.credential)) continue; // TURN without a login is useless
    out.push(e);
  }
  return out;
}

// the relay list for a room: fixed servers + fresh TURN credentials (or just the fixed ones, quickly)
export async function getIceServers({ timeout = 3500, fetchImpl = globalThis.fetch, now = Date.now() } = {}) {
  if (cache && cache.until > now) return [...ICE_SERVERS, ...cache.servers];
  if (typeof fetchImpl !== 'function') return [...ICE_SERVERS];
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => ctrl?.abort(), timeout);
  try {
    const r = await fetchImpl(TURN_URL, { headers: { apikey: SUPABASE_KEY }, signal: ctrl?.signal });
    const d = r && r.ok ? await r.json() : null;
    const servers = cleanIce(d?.iceServers);
    const ttl = Number(d?.ttl) > 0 ? Number(d.ttl) : 3600;
    // keep them until an hour before they expire (a room may run for hours on them); an empty answer for 10 min
    cache = { servers, configured: !!d?.configured, until: now + (servers.length ? Math.max(600, ttl - 3600) : 600) * 1000 };
    return [...ICE_SERVERS, ...servers];
  } catch {
    return [...ICE_SERVERS];
  } finally {
    clearTimeout(timer);
  }
}

// for the lobby: is there a relay to fall back on?
export function relayReady() {
  return ICE_SERVERS.some((s) => [].concat(s.urls).some((u) => String(u).startsWith('turn'))) || !!cache?.servers.some((s) => s.urls.some((u) => u.startsWith('turn')));
}

export function _resetIceCache() { cache = null; }
