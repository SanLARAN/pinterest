// 3.0m: the portable .exe keeps itself current.
//
// The build is one file on the releases page, so the update has to be the honest portable kind: ask GitHub what
// the newest release is, compare the version stamped into the file name, download the new .exe and swap it in
// when the process exits. These check the decisions (which release, which file, is it newer) — the swap itself
// is Windows' business and is covered by reading main.cjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const U = require('../electron/update.cjs');
const here = (rel) => new URL(rel, import.meta.url);

const release = (over = {}) => ({
  tag_name: 'arena/live48',
  name: 'ТИШЕ / HUSH arena/live48',
  html_url: 'https://github.com/SanLARAN/pinterest/releases/tag/arena/live48',
  draft: false,
  prerelease: false,
  published_at: '2026-10-22T10:00:00Z',
  body: 'Портативная сборка\n\nВерсия: 1.0.48',
  assets: [
    { name: 'HUSH-1.0.48-win-x64.exe', browser_download_url: 'https://example/h.exe', size: 98_000_000 },
    { name: 'HUSH-1.0.48-win-x64.exe.blockmap', browser_download_url: 'https://example/h.blockmap', size: 100 },
  ],
  ...over,
});

test('versions are compared by number, not by how they look', () => {
  assert.equal(U.compare('1.0.47', '1.0.46'), 1);
  assert.equal(U.compare('1.0.46', '1.0.47'), -1);
  assert.equal(U.compare('1.0.47', '1.0.47'), 0);
  assert.equal(U.compare('v1.0.9', '1.0.10'), -1, 'nine is before ten, not after one');
  assert.equal(U.compare('1.0.47', '1.0.47'), 0);
  assert.equal(U.compare('garbage', '1.0.0'), 0, 'an unreadable version never forces an update');
  assert.equal(U.isNewer('1.0.48', '1.0.47'), true);
  assert.equal(U.isNewer('1.0.47', '1.0.47'), false, 'the build you already run is not an update');
});

test('the release is the portable build, and it is called by the version inside it', () => {
  const c = U.cleanRelease(release(), '1.0.47');
  assert.ok(c, 'the release is usable');
  assert.equal(c.version, '1.0.48', 'the asset name is the truth: a tag like arena/live48 says nothing');
  assert.equal(c.newer, true);
  assert.equal(c.asset.name, 'HUSH-1.0.48-win-x64.exe');
  assert.equal(c.asset.url, 'https://example/h.exe');
  assert.match(c.page, /releases\/tag/);
  assert.equal(U.cleanRelease(release(), '1.0.48').newer, false, 'already on it');
  // drafts and pre-releases are not for players
  assert.equal(U.cleanRelease(release({ draft: true }), '1.0.0'), null);
  assert.equal(U.cleanRelease(release({ prerelease: true }), '1.0.0'), null);
  // a release with no .exe (a web-only tag) is not an update either
  assert.equal(U.cleanRelease(release({ assets: [{ name: 'notes.txt', browser_download_url: 'x', size: 1 }] }), '1.0.0'), null);
  // the newest usable one wins, and a broken newest one does not hide an older good one
  const list = [release({ assets: [] }), release({ tag_name: 'arena/live47', assets: [{ name: 'HUSH-1.0.47-win-x64.exe', browser_download_url: 'u', size: 1 }] })];
  assert.equal(U.bestRelease(list, '1.0.40').version, '1.0.47');
  assert.equal(U.bestRelease([], '1.0.40'), null);
});

test('the asset has to be the Windows build, not a plugin or a map file', () => {
  const r = release({ assets: [
    { name: 'HUSH-Setup.exe', browser_download_url: 'a', size: 1 },
    { name: 'HUSH-1.0.48-win-x64.exe', browser_download_url: 'b', size: 2 },
  ] });
  assert.equal(U.cleanRelease(r, '1.0.0').asset.name, 'HUSH-1.0.48-win-x64.exe', 'x64 is preferred');
  const only = release({ assets: [{ name: 'HUSH-1.0.48-win-arm64.exe', browser_download_url: 'c', size: 3 }] });
  assert.equal(U.cleanRelease(only, '1.0.0').asset.name, 'HUSH-1.0.48-win-arm64.exe', 'but any .exe beats nothing');
});

test('the shell can actually reach the page: preload bridge, IPC, and the swap', () => {
  const main = readFileSync(here('../electron/main.cjs'), 'utf8');
  assert.match(main, /preload: path\.join\(__dirname, 'preload\.cjs'\)/, 'the window gets the bridge');
  assert.match(main, /ipcMain\.handle\('hush:update:check'/);
  assert.match(main, /ipcMain\.handle\('hush:update:restart'/); // (3.1d: the launcher downloads; the game reloads onto it)
  assert.match(main, /ipcMain\.handle\('hush:version'/);
  assert.match(main, /app\.isPackaged/, 'a dev window does not try to replace itself');
  assert.match(main, /copy \/y "\$\{file\}" "\$\{exe\}"/, 'the new build goes over the old one');
  assert.match(main, /const exe = process\.env\.PORTABLE_EXECUTABLE_FILE;/, '(3.1d) the file the player launched, not the temp copy it runs from');
  assert.match(main, /restart \? `start "" "\$\{exe\}"`/, 'and it starts again (unless the player was quitting)');
  const preload = readFileSync(here('../electron/preload.cjs'), 'utf8');
  assert.match(preload, /contextBridge\.exposeInMainWorld\('hushDesktop'/);
  assert.doesNotMatch(preload, /require\('fs'\)|require\('child_process'\)/, 'the page gets no file system');
  const builder = readFileSync(here('../electron-builder.yml'), 'utf8');
  for (const f of ['main.cjs', 'serve.cjs', 'update.cjs', 'preload.cjs']) {
    assert.ok(builder.includes(`electron/${f}`), `${f} is packed into the exe`);
  }
  const wf = readFileSync(here('../.github/workflows/desktop.yml'), 'utf8');
  assert.match(wf, /npm pkg set version="1\.0\.\$\{\{ github\.run_number \}\}"/, 'every CI build carries its own number');
});

test('in a browser the updater is simply not there', async () => {
  const mk = () => ({ className: '', hidden: true, innerHTML: '', textContent: '', querySelector: () => mk(), addEventListener() {}, append() {} });
  globalThis.document = { createElement: mk, body: { append() {} } };
  const { installDesktopUpdate } = await import('../src/ui/desktopUpdate.js');
  assert.equal(installDesktopUpdate(), null, 'no bridge, no banner');
  globalThis.hushDesktop = { check: async () => ({ phase: 'idle' }), version: async () => '1.0.48' };
  const built = installDesktopUpdate();
  assert.ok(built && built.el, 'with the bridge there is a line in the corner');
  delete globalThis.hushDesktop;
});
