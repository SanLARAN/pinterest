// The ballot box's client, kept free of the DOM so tests/site.test.mjs can drive it with a fake fetch.
// Two PostgREST RPCs (supabase/migrations/20261103180000_hush_mob_votes.sql): hush_mob_tally and hush_mob_vote.
// Until that migration is applied the RPCs answer 404 / PGRST202: the vote is then kept on this device as
// «pending» and sent by itself on a later visit.
import { SUPABASE_URL, SUPABASE_KEY, PROJECT_REF } from '../src/cloud/client.js';

export const MOB_IDS = ['gluhar', 'kukushka', 'gribnica', 'shatun', 'poludnica', 'pyaty'];
export const VOTE_KEY = 'hush.vote.v1';

const HEX32 = /^[0-9a-f]{32}$/;

function randomHex(n = 16) {
  const a = new Uint8Array(n);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(a);
  else for (let i = 0; i < n; i++) a[i] = (Math.random() * 256) | 0;
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function loadState(store) {
  let st = null;
  try { st = JSON.parse(store.getItem(VOTE_KEY) || 'null'); } catch { st = null; }
  if (!st || typeof st !== 'object') st = {};
  if (!HEX32.test(st.device || '')) st.device = randomHex(16);
  if (st.mob && !MOB_IDS.includes(st.mob)) st.mob = null;
  if (st.pending && !MOB_IDS.includes(st.pending)) st.pending = null;
  return st;
}

export function saveState(store, st) {
  try { store.setItem(VOTE_KEY, JSON.stringify({ device: st.device, mob: st.mob || null, pending: st.pending || null, at: st.at || null })); } catch { /* private mode */ }
}

// the game's own sign-in (supabase-js keeps it here): a live token makes the vote the account's, not the device's
export function accessToken(store, now = Date.now()) {
  try {
    const s = JSON.parse(store.getItem(`sb-${PROJECT_REF}-auth-token`) || 'null');
    const tok = s?.access_token || s?.currentSession?.access_token;
    const exp = s?.expires_at || s?.currentSession?.expires_at || 0;
    if (tok && exp * 1000 > now + 30000) return tok;
  } catch { /* none */ }
  return null;
}

// what a failed call means for the page
export function classify(status, body) {
  const code = body && typeof body === 'object' ? body.code : '';
  const msg = String((body && (body.message || body.error)) || '');
  if (status === 404 || code === 'PGRST202' || code === '42883') return 'missing';
  if (/rate_limited/.test(msg)) return 'limited';
  if (status === 401 || code === 'PGRST301' || /JWT/i.test(msg)) return 'auth';
  return 'error';
}

function normal(r) {
  const counts = {};
  for (const id of MOB_IDS) counts[id] = Math.max(0, Number(r?.counts?.[id]) || 0);
  const total = MOB_IDS.reduce((a, id) => a + counts[id], 0);
  return { ok: true, counts, total, mine: MOB_IDS.includes(r?.mine) ? r.mine : null };
}

export class VoteClient {
  constructor({ fetch: f = globalThis.fetch?.bind(globalThis), store = globalThis.localStorage, url = SUPABASE_URL, key = SUPABASE_KEY, now = () => Date.now() } = {}) {
    this.fetch = f;
    this.store = store;
    this.url = url;
    this.key = key;
    this.now = now;
    this.st = loadState(store);
    saveState(store, this.st);
    this.noAuth = false; // an expired / foreign token: carry on as the device
  }

  get mine() { return this.st.mob || this.st.pending || null; }
  get pending() { return this.st.pending || null; }

  async _rpc(name, args) {
    const headers = { apikey: this.key, 'Content-Type': 'application/json' };
    const tok = this.noAuth ? null : accessToken(this.store, this.now());
    if (tok) headers.Authorization = `Bearer ${tok}`;
    let res;
    try {
      res = await this.fetch(`${this.url}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(args) });
    } catch {
      return { ok: false, why: 'error' };
    }
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    if (res.ok) return { ok: true, body };
    const why = classify(res.status, body);
    if (why === 'auth' && tok) {
      this.noAuth = true;
      return this._rpc(name, args);
    }
    return { ok: false, why };
  }

  async tally() {
    const r = await this._rpc('hush_mob_tally', { p_device: this.st.device });
    if (!r.ok) return { ok: false, why: r.why, mine: this.mine };
    const n = normal(r.body);
    // the server knows your vote: it wins over what this device remembers
    if (n.mine && n.mine !== this.st.mob && !this.st.pending) {
      this.st.mob = n.mine;
      saveState(this.store, this.st);
    }
    return { ...n, mine: n.mine || this.mine };
  }

  async vote(mob) {
    if (!MOB_IDS.includes(mob)) return { ok: false, why: 'bad' };
    const r = await this._rpc('hush_mob_vote', { p_mob: mob, p_device: this.st.device });
    if (!r.ok) {
      if (r.why === 'missing' || r.why === 'error') {
        // keep it: it goes out by itself next time
        this.st.pending = mob;
        this.st.at = new Date(this.now()).toISOString();
        saveState(this.store, this.st);
      }
      return { ok: false, why: r.why, mine: this.mine };
    }
    this.st.mob = mob;
    this.st.pending = null;
    this.st.at = new Date(this.now()).toISOString();
    saveState(this.store, this.st);
    const n = normal(r.body);
    return { ...n, mine: mob };
  }

  // a vote that could not be sent before
  async flush() {
    if (!this.st.pending) return null;
    return this.vote(this.st.pending);
  }
}

// shares for the bars: whole percents that add up to 100 (largest remainder)
export function shares(counts, ids = MOB_IDS) {
  const total = ids.reduce((a, id) => a + (counts[id] || 0), 0);
  const out = {};
  if (!total) {
    for (const id of ids) out[id] = 0;
    return out;
  }
  const raw = ids.map((id) => ({ id, v: ((counts[id] || 0) * 100) / total }));
  let left = 100 - raw.reduce((a, r) => a + Math.floor(r.v), 0);
  for (const r of raw) out[r.id] = Math.floor(r.v);
  for (const r of [...raw].sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)))) {
    if (left <= 0) break;
    if (r.v > 0) { out[r.id]++; left--; }
  }
  return out;
}
