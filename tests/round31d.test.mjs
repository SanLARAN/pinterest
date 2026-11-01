// 3.1d: the game as an installed .exe with a launcher that keeps it current.
//
// The installer (NSIS, per-user) opens a launcher: ИГРАТЬ, the update line, what's new. Each release carries the
// game alone as a .pak (~7 MB) and a manifest with every hash; the launcher downloads a newer game, checks it and
// unpacks it beside the old one — no reinstall. When the shell itself changed (its fingerprint differs), the new
// installer comes down in the background and runs silently on quit. Everything that can run without Electron is
// run here for real: packing, unpacking, installing, the manifest, and the updater against a local HTTP server.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';

const require = createRequire(import.meta.url);
const pak = require('../electron/pak.cjs');
const content = require('../electron/content.cjs');
const upd = require('../electron/update.cjs');
const net = require('../electron/net.cjs');
const { Updater } = require('../electron/updater.cjs');
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

const tmp = () => mkdtempSync(join(tmpdir(), 'hush31d-'));
function fakeGame(dir, tag = 'A') {
  mkdirSync(join(dir, 'assets', 'deep'), { recursive: true });
  writeFileSync(join(dir, 'index.html'), `<!doctype html><title>${tag}</title>`);
  writeFileSync(join(dir, 'launcher.html'), `<!doctype html><title>launcher ${tag}</title>`);
  writeFileSync(join(dir, 'assets', 'index.js'), `console.log(${JSON.stringify(tag)})`);
  writeFileSync(join(dir, 'assets', 'deep', 'blob.bin'), Buffer.from([0, 1, 2, 255, 254, 9]));
  return dir;
}
// a pak built by hand, to say things a real one never would
function rawPak(files) {
  const bodies = files.map((f) => Buffer.from(f.body));
  const header = Buffer.from(JSON.stringify({ v: 1, files: files.map((f, i) => ({ p: f.p, n: bodies[i].length, h: f.h ?? pak.sha256(bodies[i]) })) }));
  const len = Buffer.alloc(4); len.writeUInt32LE(header.length);
  return Buffer.concat([pak.MAGIC, zlib.gzipSync(Buffer.concat([len, header, ...bodies]))]);
}

// ---------------------------------------------------------------- the .pak
test('a pak is the whole build, byte for byte, and unpacks into a fresh folder', () => {
  const dir = fakeGame(tmp());
  const buf = pak.pack(dir);
  const out = join(tmp(), 'x');
  assert.equal(pak.unpack(buf, out), 4);
  assert.deepEqual(pak.listFiles(out), pak.listFiles(dir));
  for (const f of pak.listFiles(dir)) assert.ok(readFileSync(join(out, f)).equals(readFileSync(join(dir, f))), f);
  assert.ok(pak.pack(dir).equals(buf), 'the same build gives the same pak');
});

test('a pak that lies is refused: wrong magic, a changed byte, a path out of the folder, no game in it', () => {
  assert.throws(() => pak.read(Buffer.from('PK\x03\x04 not ours')), /not_a_pak/);
  const good = rawPak([{ p: 'index.html', body: 'hi' }]);
  const bad = Buffer.from(good); bad[bad.length - 6] ^= 0xff;
  assert.throws(() => pak.read(bad), /corrupt_pak/);
  assert.throws(() => pak.read(rawPak([{ p: 'index.html', body: 'hi', h: '0'.repeat(64) }])), /corrupt_pak/, 'a file whose hash does not match');
  for (const p of ['../evil.js', '/etc/x', 'a/../../b', 'C:/Windows/x', 'a\\b', 'a//b', 'con:x']) {
    assert.throws(() => pak.read(rawPak([{ p: 'index.html', body: 'ok' }, { p, body: 'x' }])), /corrupt_pak/, p);
  }
  assert.throws(() => pak.read(rawPak([{ p: 'index.html', body: 'a' }, { p: 'INDEX.html', body: 'b' }])), /corrupt_pak/, 'two names for one file on Windows');
  assert.throws(() => pak.unpack(rawPak([{ p: 'assets/a.js', body: 'x' }]), join(tmp(), 'y')), /no_game_in_pak/);
});

// ---------------------------------------------------------------- the copies on disk
test('install: the newer copy wins, a half-written or older one never does, and the bundled one is the floor', () => {
  const userData = tmp();
  const bundledDir = fakeGame(tmp(), 'bundled');
  const at = (v) => content.resolve({ userData, bundledDir, bundledVersion: v });
  assert.deepEqual(at('1.0.10'), { dir: bundledDir, version: '1.0.10', source: 'bundled' }, 'nothing downloaded yet');
  const buf = pak.pack(fakeGame(tmp(), 'v12'));
  const dir = content.install({ userData, version: '1.0.12', buf, sha256: pak.sha256(buf) });
  assert.equal(at('1.0.10').source, 'update');
  assert.equal(at('1.0.10').dir, dir);
  assert.match(readFileSync(join(dir, 'index.html'), 'utf8'), /v12/);
  assert.equal(at('1.0.13').source, 'bundled', 'after a shell update the bundled copy is newer: it wins');
  rmSync(join(dir, content.MARK));
  assert.equal(at('1.0.10').source, 'bundled', 'a copy that never finished unpacking is not served');
  assert.throws(() => content.install({ userData, version: '1.0.14', buf, sha256: 'f'.repeat(64) }), /checksum/);
  assert.ok(!existsSync(join(content.root(userData), '1.0.14')), 'a bad download leaves nothing behind');
  assert.throws(() => content.install({ userData, version: '../../x', buf }), /bad_version/);
});

test('install keeps the copy before it (a game window may still read from it) and drops the rest', () => {
  const userData = tmp();
  for (const v of ['1.0.1', '1.0.2', '1.0.3', '1.0.4']) content.install({ userData, version: v, buf: pak.pack(fakeGame(tmp(), v)) });
  const left = readdirSync(content.root(userData)).filter((n) => n !== 'current.json').sort();
  assert.deepEqual(left, ['1.0.3', '1.0.4']);
  assert.equal(JSON.parse(readFileSync(join(content.root(userData), 'current.json'), 'utf8')).version, '1.0.4');
});

test('the shell fingerprint: the same files give the same id, any change to the shell a new one', () => {
  const a = tmp();
  cpSync(new URL('../electron', import.meta.url), a, { recursive: true });
  const id = content.shellId(a, '45.0.0');
  assert.match(id, /^[0-9a-f]{16}$/);
  assert.equal(content.shellId(new URL('../electron', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), '45.0.0'), id, 'the repo and a copy of it agree');
  writeFileSync(join(a, 'serve.cjs'), readFileSync(join(a, 'serve.cjs'), 'utf8').replace(/\n/g, '\r\n'));
  assert.equal(content.shellId(a, '45.0.0'), id, 'a checkout with Windows line ends is the same shell');
  assert.notEqual(content.shellId(a, '46.0.0'), id, 'another Electron is another shell');
  writeFileSync(join(a, 'main.cjs'), readFileSync(join(a, 'main.cjs'), 'utf8') + '\n// changed');
  assert.notEqual(content.shellId(a, '45.0.0'), id);
});

// ---------------------------------------------------------------- the manifest
const HASH = 'a'.repeat(64);
const manifest = (o = {}) => ({
  v: 1, version: '1.0.20', game: '3.1d',
  pak: { name: 'hush-game-1.0.20.pak', size: 7000000, sha256: HASH },
  shell: { id: '0123456789abcdef', version: '1.0.20', setup: { name: 'HUSH-Setup-1.0.20.exe', size: 90000000, sha256: HASH }, portable: { name: 'HUSH-1.0.20-win-x64.exe', size: 85000000, sha256: HASH } },
  ...o,
});

test('the manifest is checked, and every URL is built from our own repository, never read from it', () => {
  const m = upd.cleanManifest({ ...manifest(), pak: { ...manifest().pak, url: 'https://evil.example/x.pak' } });
  assert.equal(m.pak.url, `${upd.LATEST}hush-game-1.0.20.pak`);
  assert.ok(m.pak.url.startsWith('https://github.com/SanLARAN/pinterest/releases/latest/download/'));
  assert.equal(m.shell.setup.url, `${upd.LATEST}HUSH-Setup-1.0.20.exe`);
  for (const bad of [
    { v: 2 }, { version: '3.1d' }, { pak: null }, { pak: { name: '../x.pak', size: 1, sha256: HASH } },
    { pak: { name: 'a.pak', size: 0, sha256: HASH } }, { pak: { name: 'a.pak', size: 1, sha256: 'nope' } },
    { pak: { name: 'a.exe', size: 1, sha256: HASH } }, { pak: { name: 'a.pak', size: 999 * 1024 * 1024, sha256: HASH } },
  ]) assert.equal(upd.cleanManifest(manifest(bad)), null, JSON.stringify(bad));
  assert.equal(upd.cleanManifest(manifest({ shell: { id: 'zz', setup: { name: 'x.msi' } } })).shell.setup, null, 'a broken shell part only switches the shell update off');
});

test('the plan: a newer game is fetched; a different shell is fetched in the way this copy was installed', () => {
  const m = upd.cleanManifest(manifest());
  assert.deepEqual(upd.plan(m, { gameVersion: '1.0.19', shellId: '0123456789abcdef', mode: 'nsis' }), { game: true, shell: null });
  assert.deepEqual(upd.plan(m, { gameVersion: '1.0.20', shellId: '0123456789abcdef', mode: 'nsis' }), { game: false, shell: null });
  assert.deepEqual(upd.plan(m, { gameVersion: '1.0.20', shellId: 'ffffffffffffffff', mode: 'nsis' }), { game: false, shell: 'setup' });
  assert.deepEqual(upd.plan(m, { gameVersion: '1.0.20', shellId: 'ffffffffffffffff', mode: 'portable' }), { game: false, shell: 'portable' });
  assert.deepEqual(upd.plan(m, { gameVersion: '1.0.30', shellId: 'ffffffffffffffff', mode: 'dev' }), { game: false, shell: null }, 'a dev build never replaces itself');
});

// ---------------------------------------------------------------- the updater, against a real server
function server(routes) {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const r = routes[req.url];
      if (r === undefined) { res.writeHead(404); return res.end(); }
      if (typeof r === 'string' && r.startsWith('->')) { res.writeHead(302, { location: r.slice(2) }); return res.end(); }
      const body = Buffer.isBuffer(r) ? r : Buffer.from(typeof r === 'string' ? r : JSON.stringify(r));
      res.writeHead(200, { 'content-length': body.length });
      res.end(body);
    });
    s.listen(0, '127.0.0.1', () => resolve({ s, base: `http://127.0.0.1:${s.address().port}` }));
  });
}
const via = (base) => ({
  getJson: net.getJson,
  download: (url, dest, o) => net.download(url.replace(upd.LATEST, `${base}/dl/`), dest, o),
});

test('the updater: finds a newer game, downloads it through a redirect, checks it, and the next window opens on it', async () => {
  const gameBuf = pak.pack(fakeGame(tmp(), 'v21'));
  const m = manifest({ version: '1.0.21', pak: { name: 'hush-game-1.0.21.pak', size: gameBuf.length, sha256: pak.sha256(gameBuf) } });
  const { s, base } = await server({ '/manifest': m, '/dl/hush-game-1.0.21.pak': '->/blob', '/blob': gameBuf });
  try {
    const userData = tmp();
    const states = [];
    const u = new Updater({ net: via(base), manifestUrl: `${base}/manifest`, userData, bundledDir: fakeGame(tmp(), 'old'), bundledVersion: '1.0.20', shellId: '0123456789abcdef', mode: 'nsis', emit: (st) => states.push(st.phase) });
    assert.equal(u.state.game, '1.0.20');
    const st = await u.check();
    assert.equal(st.phase, 'ready');
    assert.equal(st.game, '1.0.21');
    assert.equal(st.source, 'update');
    assert.ok(states.includes('checking') && states.includes('downloading'));
    assert.match(readFileSync(join(u.current().dir, 'index.html'), 'utf8'), /v21/);
    assert.equal(st.shell.phase, 'none', 'the same shell: nothing else to fetch');
    assert.ok(!existsSync(join(content.root(userData), 'downloads', 'hush-game-1.0.21.pak')), 'the download itself is not kept');
    assert.equal((await u.check()).phase, 'latest', 'and then it is up to date');
  } finally { s.close(); }
});

test('the updater: a download that does not match its hash is thrown away; no network is just «offline»', async () => {
  const gameBuf = pak.pack(fakeGame(tmp(), 'v22'));
  const m = manifest({ version: '1.0.22', pak: { name: 'g.pak', size: gameBuf.length, sha256: 'b'.repeat(64) } });
  const { s, base } = await server({ '/manifest': m, '/dl/g.pak': gameBuf });
  const userData = tmp();
  try {
    const u = new Updater({ net: via(base), manifestUrl: `${base}/manifest`, userData, bundledDir: fakeGame(tmp()), bundledVersion: '1.0.20', shellId: '0123456789abcdef', mode: 'nsis' });
    const st = await u.check();
    assert.equal(st.phase, 'error');
    assert.equal(st.error, 'checksum');
    assert.equal(u.current().source, 'bundled', 'still the game it had');
  } finally { s.close(); }
  const off = new Updater({ net, manifestUrl: 'http://127.0.0.1:1/none', userData, bundledDir: fakeGame(tmp()), bundledVersion: '1.0.20', shellId: 'x', mode: 'nsis' });
  assert.equal((await off.check()).phase, 'offline');
  const dev = new Updater({ net: { getJson: () => { throw new Error('no network in dev'); } }, userData, bundledDir: fakeGame(tmp()), bundledVersion: '1.0.0', mode: 'dev' });
  assert.equal((await dev.check()).phase, 'dev');
});

test('the updater: a different shell brings its installer down in the background, once', async () => {
  const setup = Buffer.alloc(4096, 7);
  const m = manifest({ shell: { id: 'ffffffffffffffff', version: '1.0.20', setup: { name: 'HUSH-Setup-1.0.20.exe', size: setup.length, sha256: pak.sha256(setup) } } });
  let hits = 0;
  const { s, base } = await server({ '/manifest': m, get '/dl/HUSH-Setup-1.0.20.exe'() { hits++; return setup; } });
  try {
    const userData = tmp();
    const mk = () => new Updater({ net: via(base), manifestUrl: `${base}/manifest`, userData, bundledDir: fakeGame(tmp()), bundledVersion: '1.0.20', shellId: '0123456789abcdef', mode: 'nsis' });
    const u = mk();
    await u.check();
    for (let i = 0; i < 50 && u.state.shell.phase === 'downloading'; i++) await new Promise((r) => setTimeout(r, 20));
    assert.equal(u.state.shell.phase, 'ready');
    assert.equal(u.shellFile, join(userData, 'updates', 'HUSH-Setup-1.0.20.exe'));
    assert.ok(readFileSync(u.shellFile).equals(setup));
    const again = mk();
    await again.check();
    for (let i = 0; i < 50 && again.state.shell.phase === 'downloading'; i++) await new Promise((r) => setTimeout(r, 20));
    assert.equal(again.state.shell.phase, 'ready');
    assert.equal(hits, 1, 'already on disk with the right hash: not fetched twice');
  } finally { s.close(); }
});

test('CI: pack-game writes the pak and a manifest the launcher accepts', () => {
  const { main, gameRound, electronVersion } = require('../scripts/pack-game.cjs');
  assert.match(gameRound(), /^\d+\.\d+[a-z]?$/);
  assert.equal(electronVersion(), '45.0.0');
  const dist = fakeGame(tmp(), 'ci');
  const out = tmp();
  writeFileSync(join(out, 'HUSH-Setup-1.0.0.exe'), 'setup');
  writeFileSync(join(out, 'HUSH-1.0.0-win-x64.exe'), 'portable');
  const argv = process.argv;
  process.argv = [argv[0], 'pack-game.cjs', '--dist', dist, '--out', out];
  const origLog = console.log; console.log = () => {};
  try { main(); } finally { process.argv = argv; console.log = origLog; }
  const m = upd.cleanManifest(JSON.parse(readFileSync(join(out, 'hush-manifest.json'), 'utf8')));
  assert.ok(m, 'the manifest passes the launcher\'s own check');
  assert.equal(m.pak.sha256, pak.sha256(readFileSync(join(out, m.pak.name))));
  assert.equal(m.shell.setup.name, 'HUSH-Setup-1.0.0.exe');
  assert.equal(m.shell.portable.name, 'HUSH-1.0.0-win-x64.exe');
  assert.equal(m.shell.id, content.shellId(new URL('../electron', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), '45.0.0'), 'the id CI writes is the id the app computes');
});

// ---------------------------------------------------------------- the shell, the launcher, the release
test('the shell: a frameless launcher with its own bridge, the game in its own window, the update on quit', () => {
  const main = src('electron/main.cjs');
  assert.match(main, /preload: path\.join\(__dirname, 'preload-launcher\.cjs'\)/);
  assert.match(main, /frame: false/);
  assert.match(main, /win\.loadURL\(`\$\{SCHEME\}:\/\/app\/launcher\.html`\)/);
  assert.match(main, /const fromLauncher = \(e\) => !!launcherWin && e\.sender === launcherWin\.webContents;/, 'only the launcher may press its buttons');
  assert.match(main, /\['autoplay', 'fullscreen'\]\.includes\(key\) \|\| typeof value !== 'boolean'/);
  assert.match(main, /spawn\(file, \['\/S', '--updated', \.\.\.\(restart \? \['--force-run'\] : \[\]\)\]/, 'the NSIS installer, silently, in place');
  assert.match(main, /app\.on\('before-quit'/);
  assert.match(main, /if \(updater\) gameCopy = updater\.current\(\);/, 'the game window opens on the newest copy');
  assert.match(main, /fs\.existsSync\(path\.join\(gameCopy\.dir, 'launcher\.html'\)\)/, 'an old copy without a launcher goes straight to the game');
  const pre = src('electron/preload-launcher.cjs');
  assert.match(pre, /exposeInMainWorld\('hushLauncher'/);
  assert.doesNotMatch(pre, /require\('(node:)?(fs|child_process|path)'\)/);
  // every file of the shell is packed (the fingerprint covers them all, so a missing one would never match CI)
  const builder = src('electron-builder.yml');
  for (const f of readdirSync(new URL('../electron', import.meta.url)).filter((n) => n.endsWith('.cjs'))) assert.ok(builder.includes(`electron/${f}`), `${f} is packed`);
  assert.match(builder, /- target: nsis/);
  assert.match(builder, /oneClick: true\n {2}perMachine: false/);
  assert.match(builder, /artifactName: HUSH-Setup-\$\{version\}\.\$\{ext\}/);
});

test('the launcher page and the release: built by vite, words in both languages, the release marked latest', async () => {
  assert.match(src('vite.config.js'), /launcher: fileURLToPath\(new URL\('\.\/launcher\.html', import\.meta\.url\)\)/);
  const html = src('launcher.html');
  for (const id of ['lnPlay', 'lnLine', 'lnNewsList', 'lnAuto', 'lnFull', 'lnShellApply']) assert.ok(html.includes(`id="${id}"`), id);
  const js = src('src/launcher/launcher.js');
  assert.match(js, /globalThis\.hushLauncher/);
  assert.match(js, /from '\.\.\/ui\/news\.js'/, 'what\'s new comes from the same notes as the game');
  globalThis.localStorage ||= { getItem: () => null, setItem() {}, removeItem() {} };
  globalThis.document ||= { documentElement: {} };
  const { t, setLang } = await import('../src/core/i18n.js');
  const keys = [...new Set([...html.matchAll(/data-t="(\w+)"/g), ...js.matchAll(/t\('(ln\w+)'\)/g)].map((m) => m[1]))];
  assert.ok(keys.length > 15);
  for (const lang of ['ru', 'en']) {
    setLang(lang);
    for (const k of [...keys, 'dskBuild', 'dskReady', 'dskRestart', 'dskShell', 'dskHide']) assert.notEqual(t(k), k, `${lang}.${k}`);
  }
  setLang('ru');
  const wf = src('.github/workflows/desktop.yml');
  assert.match(wf, /node scripts\/pack-game\.cjs --dist dist --out release/);
  assert.match(wf, /make_latest: true/);
  assert.match(wf, /release\/\*\.pak\n\s+release\/hush-manifest\.json/);
  assert.match(src('src/ui/desktopUpdate.js'), /api\.restart\?\.\(\)/);
});
