#!/usr/bin/env node
/**
 * Dependency-free static server for the built game (docs/).
 * Vite's dev server blocks unknown Host headers, which the sandbox preview proxy uses,
 * so we serve the production build directly. Everything here is plain node:http.
 */
import { createServer } from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const ROOT = resolve(process.argv[2] || join(import.meta.dirname, '..', 'docs'));
const PORT = Number(process.env.PORT || process.argv[3] || 8080);
const HOST = '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error(`[serve] ${ROOT}/index.html is missing — run "npm run build" first.`);
  process.exit(1);
}

const server = createServer((req, res) => {
  let path = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, '')));
  // never escape the build directory
  if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403).end('forbidden'); return; }
  const target = existsSync(file) && statSync(file).isDirectory() ? join(file, 'index.html') : file;
  if (!existsSync(target)) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404 not found'); return; }
  const st = statSync(target);
  res.writeHead(200, {
    'content-type': MIME[extname(target).toLowerCase()] || 'application/octet-stream',
    'content-length': st.size,
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*',
  });
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(target).on('error', () => res.end()).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`[serve] ${ROOT} -> http://${HOST}:${PORT}/`);
});
