// 3.1a: «Войти через Google» in the desktop build.
//
// Google refuses to sign in inside an embedded window (an Electron BrowserWindow is one), and the web flow would
// land on the website rather than come back to hush://app anyway. So the desktop build does what desktop apps do:
// the sign-in opens in the player's own browser, and comes back to a one-shot server on the loopback address.
//
//   begin()  → a server on 127.0.0.1:47615 and a redirect with a fresh secret in its path
//   finish() → waits for that one redirect: Supabase sends the browser to /hush-auth/<secret>#access_token=…; the
//              hash never reaches a server, so the tiny page served there posts it back to /hush-auth/<secret>/done
//              and the tokens go to the game (which calls auth.setSession). Then the server closes.
//
// Only 127.0.0.1, only the one secret path, only once, five minutes at most. Pure Node: tested in tests/round31a.
const http = require('node:http');
const crypto = require('node:crypto');

const PORT = 47615; // fixed: Supabase's redirect allow-list needs it (http://127.0.0.1:47615/**)
const WAIT_MS = 5 * 60 * 1000;
const TOKEN = /^[A-Za-z0-9._~+/=-]{8,4096}$/;

const page = (lang) => `<!doctype html><meta charset="utf-8"><title>ТИШЕ / HUSH</title>
<style>body{background:#050607;color:#d6cdc0;font:15px/1.6 ui-monospace,monospace;display:grid;place-items:center;min-height:90vh;margin:0}p{max-width:440px;text-align:center}</style>
<p id="m">…</p><script>
(async () => {
  const h = new URLSearchParams(location.hash.slice(1)), q = new URLSearchParams(location.search);
  const body = { access_token: h.get('access_token') || '', refresh_token: h.get('refresh_token') || '', error: h.get('error_description') || q.get('error_description') || h.get('error') || q.get('error') || '' };
  history.replaceState(null, '', location.pathname);
  let ok = false;
  try { ok = (await fetch(location.pathname + '/done', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).ok; } catch {}
  const ru = ${JSON.stringify(lang !== 'en')};
  document.getElementById('m').textContent = ok && !body.error
    ? (ru ? 'Готово. Можно закрыть вкладку и вернуться в игру.' : 'Done. You can close this tab and go back to the game.')
    : (ru ? 'Вход не удался. Вернись в игру и попробуй ещё раз.' : 'Sign-in failed. Go back to the game and try again.');
})();
</script>`;

function cleanResult(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  if (r.error) return { error: String(r.error).slice(0, 200) };
  if (!TOKEN.test(r.access_token || '') || !TOKEN.test(r.refresh_token || '')) return { error: 'no_tokens' };
  return { access_token: r.access_token, refresh_token: r.refresh_token };
}

// one sign-in at a time; a second begin() cancels the first
let current = null;

function begin({ port = PORT, host = '127.0.0.1', waitMs = WAIT_MS, lang = 'ru' } = {}) {
  cancel('replaced');
  const secret = crypto.randomBytes(18).toString('hex');
  const base = `/hush-auth/${secret}`;
  let settle;
  const result = new Promise((resolve) => { settle = resolve; });
  const server = http.createServer((req, res) => {
    const path = (req.url || '').split('?')[0];
    if (req.method === 'GET' && path === base) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
      return res.end(page(lang));
    }
    if (req.method === 'POST' && path === base + '/done') {
      let body = '';
      req.setEncoding('utf8');
      req.on('data', (c) => { body += c; if (body.length > 16384) req.destroy(); });
      req.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch { /* junk */ }
        res.writeHead(200, { 'content-type': 'text/plain' });
        res.end('ok');
        done(cleanResult(parsed));
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });
  const timer = setTimeout(() => done({ error: 'timeout' }), waitMs);
  const me = { server, result, redirect: `http://${host}:${port}${base}`, settle: null };
  function done(r) {
    if (current !== me) return;
    current = null;
    clearTimeout(timer);
    server.close();
    settle(r);
  }
  me.settle = done;
  current = me;
  const listening = new Promise((resolve, reject) => {
    server.once('error', (e) => { done({ error: e.code === 'EADDRINUSE' ? 'port_busy' : 'server' }); reject(e); });
    server.listen(port, host, resolve);
  });
  return { redirect: me.redirect, listening, result };
}

function cancel(why = 'cancelled') {
  if (current) current.settle({ error: why });
}

// the authorize URL the game hands us must be Supabase's own, for Google, coming back to our loopback
function safeAuthorizeUrl(raw, redirect) {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && /^[a-z0-9]{20}\.supabase\.co$/.test(u.hostname) && u.pathname === '/auth/v1/authorize'
      && u.searchParams.get('provider') === 'google' && u.searchParams.get('redirect_to') === redirect;
  } catch { return false; }
}

module.exports = { PORT, begin, cancel, cleanResult, safeAuthorizeUrl };
