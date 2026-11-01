// 3.1e: TURN credentials for co-op — so friends far apart (or behind strict NAT) can still play.
//
// The game connects players directly (WebRTC). Most of the time STUN is enough; when it is not — mobile internet,
// carrier-grade NAT, strict office Wi-Fi, which is what «my friend in another country can't join» usually is —
// the packets need a relay. This function hands the game a TURN login (from its secrets, or short-lived ones from
// Cloudflare), which the game adds to its ICE servers (src/net/ice.js). Traffic stays end-to-end
// encrypted: a TURN server only forwards it.
//
// Two ways to configure it (Supabase → Edge Functions → Secrets):
//   • a fixed login, any provider (ExpressTURN, a coturn of your own…): TURN_URLS (comma-separated, e.g.
//     «turn:relay1.expressturn.com:3478,turn:relay1.expressturn.com:3478?transport=tcp»), TURN_USERNAME,
//     TURN_CREDENTIAL — this one wins when set;
//   • Cloudflare Realtime TURN: CF_TURN_KEY_ID, CF_TURN_API_TOKEN (short-lived credentials per request).
// Without either the function answers { iceServers: [], configured: false } and the game connects as before.
const ORIGINS = [/^https:\/\/sanlaran\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/, /^hush:\/\/app$/];
const TTL = 6 * 3600;

function cors(origin: string | null): Record<string, string> {
  const ok = origin && ORIGINS.some((re) => re.test(origin));
  return {
    ...(ok ? { 'Access-Control-Allow-Origin': origin! } : {}),
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info',
    'Vary': 'Origin',
  };
}

const json = (body: unknown, origin: string | null, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'content-type': 'application/json', 'cache-control': 'no-store' } });

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'GET') return json({ error: 'method' }, origin, 405);

  // (a fixed login: ExpressTURN and the like; a bare host:port gets the turn: prefix)
  const fixedUrls = (Deno.env.get('TURN_URLS') || '').split(',').map((u) => u.trim()).filter(Boolean)
    .map((u) => (/^(stun|turn|turns):/.test(u) ? u : `turn:${u}`));
  const user = Deno.env.get('TURN_USERNAME');
  const pass = Deno.env.get('TURN_CREDENTIAL');
  if (fixedUrls.length && user && pass) {
    return json({ iceServers: [{ urls: fixedUrls, username: user, credential: pass }], configured: true, ttl: TTL }, origin);
  }

  const keyId = Deno.env.get('CF_TURN_KEY_ID');
  const token = Deno.env.get('CF_TURN_API_TOKEN');
  if (!keyId || !token) return json({ iceServers: [], configured: false }, origin);

  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ttl: TTL }),
    });
    if (!r.ok) return json({ iceServers: [], configured: true, error: `cloudflare ${r.status}` }, origin, 502);
    const data = await r.json();
    // browsers refuse port 53 (Cloudflare's docs say to drop those URLs)
    const iceServers = (Array.isArray(data.iceServers) ? data.iceServers : [data.iceServers])
      .filter(Boolean)
      .map((s: { urls: string | string[]; username?: string; credential?: string }) => ({
        ...s,
        urls: (Array.isArray(s.urls) ? s.urls : [s.urls]).filter((u) => typeof u === 'string' && !/:53(\?|$)/.test(u)),
      }))
      .filter((s: { urls: string[] }) => s.urls.length);
    return json({ iceServers, configured: true, ttl: TTL }, origin);
  } catch (e) {
    return json({ iceServers: [], configured: true, error: String(e) }, origin, 502);
  }
});
