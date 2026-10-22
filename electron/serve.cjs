// The parts of the desktop shell that are pure: which file a request means, and who may use the microphone.
// They live on their own so they can be tested without Electron (a test-runner cannot download a 100 MB Chromium,
// and the CI that packs the .exe should not be the first thing to find out that `../` is served).
const path = require('node:path');

// What an hush:// request is allowed to read. Returns one of:
//   { file }             — serve this file
//   { fallback }         — no such page and no extension: serve the entry (a single-page game)
//   { status, body }     — refuse, with a status a browser can print
function resolveRequest(requestUrl, dist) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl).pathname);
  } catch {
    return { status: 400, body: 'bad request' };
  }
  const rel = pathname === '' || pathname === '/' ? '/index.html' : pathname;
  const file = path.normalize(path.join(dist, rel));
  // the whole point: nothing outside the build, whatever the path says (`..`, an encoded `..`, a drive letter).
  // `path.relative` is the check that holds on Windows too, where the prefix comparison would be case-sensitive.
  const relPath = path.relative(dist, file);
  if (relPath.startsWith('..') || path.isAbsolute(relPath)) return { status: 403, body: 'forbidden' };
  if (path.extname(rel)) return { file }; // an asset: the caller decides between a file and a 404
  return { file: path.join(dist, 'index.html'), fallback: true };
}

// Only sound: the game is a microphone, nothing else it asks for is its business.
const PERMISSIONS = new Set(['media', 'audioCapture', 'speaker-selection']);
function allowsPermission(permission) {
  return PERMISSIONS.has(permission);
}

// …and only from the game's own origin: the shell's page, never a remote one.
function isOwnOrigin(pageUrl, scheme, devUrl = '') {
  if (devUrl && pageUrl.startsWith(devUrl)) return true;
  return pageUrl.startsWith(`${scheme}://`);
}

// What a file is, for the response. The build ships html/js/css/fonts/images and the game's audio.
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.map': 'application/json; charset=utf-8',
};
function mimeType(file) {
  return MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

// A `bytes=` range, clamped to the file. Returns null for "send the whole thing" (no header, or one we do not
// understand) and 'unsatisfiable' for a range that starts past the end. The music is played by an <audio>
// element that seeks and loops, so this is not cosmetic: without it looping a track stalls.
function parseRange(header, size) {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
  if (!m) return null;
  const [, a, b] = m;
  if (a === '' && b === '') return null;
  let start;
  let end;
  if (a === '') {
    // `bytes=-N`: the last N bytes
    const n = Number(b);
    if (!n) return 'unsatisfiable';
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(a);
    end = b === '' ? size - 1 : Math.min(Number(b), size - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return 'unsatisfiable';
  return { start, end };
}

// The whole request handler, minus Electron: a Request in, a Response out, reading only from `dist`.
// `readFile` is injected so a test can hand it the real build (or a fake one).
function serveBuild(request, dist, readFile) {
  const hit = resolveRequest(request.url, dist);
  if (hit.status) return new Response(hit.body, { status: hit.status });

  let file = hit.file;
  let body;
  try {
    body = readFile(file);
  } catch {
    // a single-page game: a page it does not know falls back to the entry; a missing asset 404s like on the web
    if (!hit.fallback) return new Response('not found', { status: 404 });
    file = path.join(dist, 'index.html');
    body = readFile(file);
  }

  const headers = {
    'content-type': mimeType(file),
    'accept-ranges': 'bytes',
    'cache-control': 'no-cache',
  };
  const range = parseRange(request.headers.get('range'), body.length);
  if (range === 'unsatisfiable') {
    return new Response('range not satisfiable', {
      status: 416,
      headers: { ...headers, 'content-range': `bytes */${body.length}` },
    });
  }
  if (range) {
    return new Response(body.subarray(range.start, range.end + 1), {
      status: 206,
      headers: { ...headers, 'content-range': `bytes ${range.start}-${range.end}/${body.length}` },
    });
  }
  return new Response(body, { status: 200, headers });
}

module.exports = { resolveRequest, allowsPermission, isOwnOrigin, mimeType, parseRange, serveBuild, PERMISSIONS };
