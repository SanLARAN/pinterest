// 3.1d: which copy of the game the shell serves.
//
// The installer brings one copy (dist/ inside app.asar, «bundled»). The launcher downloads newer ones as .paks
// into <userData>/game/<version>/ and points <userData>/game/current.json at the one to use. Whichever is newer
// wins — after a shell update the bundled copy may well be the newest. A downloaded copy is only trusted if it
// unpacked completely (the .hush-ok marker is written last); anything else falls back to the bundled one, so a
// half-written update can never leave the player with a black window.
//
// Also here: the shell's own fingerprint (shellId). The launcher compares it with the release's to know whether
// the 80 MB part changed too, or only the game. Pure Node: tested in tests/round31d.test.mjs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const pak = require('./pak.cjs');
const { compare } = require('./update.cjs');

const MARK = '.hush-ok';
const VERSION = /^\d+\.\d+\.\d+$/;
const root = (userData) => path.join(userData, 'game');

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}
function writeJsonAtomic(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}

// a downloaded copy that unpacked completely
function intact(dir, version) {
  const m = readJson(path.join(dir, MARK));
  return !!m && m.version === version && fs.existsSync(path.join(dir, 'index.html'));
}

// the copy to serve: { dir, version, source: 'update' | 'bundled' }
function resolve({ userData, bundledDir, bundledVersion }) {
  const bundled = { dir: bundledDir, version: bundledVersion, source: 'bundled' };
  if (!userData) return bundled;
  const cur = readJson(path.join(root(userData), 'current.json'));
  if (!cur || !VERSION.test(cur.version || '')) return bundled;
  const dir = path.join(root(userData), cur.version);
  if (!intact(dir, cur.version)) return bundled;
  return compare(cur.version, bundledVersion) > 0 ? { dir, version: cur.version, source: 'update' } : bundled;
}

// unpack a verified .pak as <version>, make it current, keep the one before it, drop the rest
function install({ userData, version, buf, sha256 }) {
  if (!VERSION.test(version || '')) throw new Error('bad_version');
  if (sha256 && pak.sha256(buf) !== sha256) throw new Error('checksum');
  const base = root(userData);
  fs.mkdirSync(base, { recursive: true });
  const dir = path.join(base, version);
  const tmp = path.join(base, `${version}.part-${process.pid}-${Date.now()}`);
  try {
    pak.unpack(buf, tmp);
    fs.writeFileSync(path.join(tmp, MARK), JSON.stringify({ version, at: new Date().toISOString() }));
    fs.rmSync(dir, { recursive: true, force: true });
    fs.renameSync(tmp, dir);
  } catch (e) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw e;
  }
  const prev = readJson(path.join(base, 'current.json'));
  writeJsonAtomic(path.join(base, 'current.json'), { version, previous: prev?.version !== version ? prev?.version || null : prev?.previous || null });
  prune(userData);
  return dir;
}

// keep the current copy and the one before it (a copy a running game window may still be reading from)
function prune(userData) {
  const base = root(userData);
  const cur = readJson(path.join(base, 'current.json')) || {};
  const keep = new Set([cur.version, cur.previous].filter(Boolean));
  let removed = 0;
  for (const e of fs.existsSync(base) ? fs.readdirSync(base, { withFileTypes: true }) : []) {
    if (!e.isDirectory() || keep.has(e.name)) continue;
    fs.rmSync(path.join(base, e.name), { recursive: true, force: true });
    removed++;
  }
  return removed;
}

// the shell's fingerprint: its own code and the Electron it runs on. The same files give the same id in CI
// (scripts/pack-game.cjs) and in the running app (inside app.asar), so «the shell changed» is never a guess.
const SHELL_FILES = /^[a-z][a-z-]*\.cjs$/;
function shellId(electronDir, electronVersion) {
  const h = crypto.createHash('sha256');
  for (const name of fs.readdirSync(electronDir).filter((n) => SHELL_FILES.test(n)).sort()) {
    h.update(name + '\0');
    h.update(fs.readFileSync(path.join(electronDir, name), 'utf8').replace(/\r\n/g, '\n')); // (a checkout's line ends do not count)
    h.update('\0');
  }
  h.update(`electron@${electronVersion}`);
  return h.digest('hex').slice(0, 16);
}

module.exports = { root, resolve, install, prune, intact, shellId, MARK };
