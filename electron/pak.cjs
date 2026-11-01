// 3.1d: the game as one small file. The web build (dist/, ~9 MB, ~3 MB packed) changes with every round; the
// Electron shell around it (~80 MB) almost never does. So a release carries the game on its own as a .pak, and
// the launcher swaps that in without reinstalling anything (see content.cjs, updater.cjs).
//
// The format is ours and needs nothing but Node: «HUSHPAK1», then gzip of
//   [u32 LE header length][header JSON: { v: 1, files: [{ p: 'assets/x.js', n: bytes, h: sha256 }] }][file bytes…]
// Every file carries its own hash, and unpacking refuses anything that would land outside the target folder.
// Pure (Buffers and fs in, Buffers and fs out): tested in tests/round31d.test.mjs.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const MAGIC = Buffer.from('HUSHPAK1');
const MAX_UNPACKED = 300 * 1024 * 1024; // a game this size would be a mistake, not an update
const MAX_FILES = 5000;

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// every file under dir, as posix paths relative to it, in a stable order
function listFiles(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(full, base, out);
    else if (e.isFile()) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

function pack(dir) {
  const files = listFiles(dir);
  const bodies = files.map((p) => fs.readFileSync(path.join(dir, ...p.split('/'))));
  const header = Buffer.from(JSON.stringify({ v: 1, files: files.map((p, i) => ({ p, n: bodies[i].length, h: sha256(bodies[i]) })) }));
  const len = Buffer.alloc(4);
  len.writeUInt32LE(header.length);
  const payload = Buffer.concat([len, header, ...bodies]);
  return Buffer.concat([MAGIC, zlib.gzipSync(payload, { level: 9 })]);
}

// a path from a pak that may be written: relative, forward slashes, no `..`, no drive, nothing odd
function safePath(p) {
  if (typeof p !== 'string' || !p || p.length > 260) return false;
  if (p.startsWith('/') || p.includes('\\') || p.includes('\0') || /^[a-zA-Z]:/.test(p)) return false;
  return p.split('/').every((s) => s && s !== '.' && s !== '..' && !/[<>:"|?*]/.test(s));
}

// read a pak: { files: [{ p, body }] }, or throw with a reason
function read(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < MAGIC.length + 4 || !buf.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('not_a_pak');
  let payload;
  try { payload = zlib.gunzipSync(buf.subarray(MAGIC.length), { maxOutputLength: MAX_UNPACKED }); } catch { throw new Error('corrupt_pak'); }
  const hl = payload.readUInt32LE(0);
  if (hl <= 0 || 4 + hl > payload.length) throw new Error('corrupt_pak');
  let header;
  try { header = JSON.parse(payload.subarray(4, 4 + hl).toString('utf8')); } catch { throw new Error('corrupt_pak'); }
  if (!header || header.v !== 1 || !Array.isArray(header.files) || header.files.length > MAX_FILES) throw new Error('corrupt_pak');
  let at = 4 + hl;
  const files = [];
  const seen = new Set();
  for (const f of header.files) {
    if (!f || !safePath(f.p) || seen.has(f.p.toLowerCase()) || !Number.isInteger(f.n) || f.n < 0 || at + f.n > payload.length) throw new Error('corrupt_pak');
    const body = payload.subarray(at, at + f.n);
    if (sha256(body) !== f.h) throw new Error('corrupt_pak');
    seen.add(f.p.toLowerCase());
    files.push({ p: f.p, body });
    at += f.n;
  }
  if (at !== payload.length) throw new Error('corrupt_pak');
  return { files };
}

// unpack into dir (which must not exist yet, or be empty): returns the number of files
function unpack(buf, dir) {
  const { files } = read(buf);
  if (!files.some((f) => f.p === 'index.html')) throw new Error('no_game_in_pak');
  for (const f of files) {
    const dest = path.join(dir, ...f.p.split('/'));
    const rel = path.relative(dir, dest);
    if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('corrupt_pak'); // (safePath already, twice is cheap)
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, f.body);
  }
  return files.length;
}

module.exports = { MAGIC, sha256, listFiles, pack, read, unpack, safePath };
