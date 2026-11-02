// 3.1k: «хороший кастомный установочник с выбором места установки и удобный, функциональный лаунчер».
// The installer is a wizard now (electron-builder's assisted NSIS with our own pages and art): Welcome → only me /
// everyone → the folder → Shortcuts → Finish, Russian or English after Windows; the uninstaller asks about the saves.
// Silent shell updates keep the chosen folder (electron-builder reads InstallLocation back from the registry).
// The launcher: ИГРАТЬ carries its own progress; tabs «Что нового» / «Настройки» — how the game starts, the language,
// where it is installed, «проверить файлы игры», «удалить игру». Locally the installer was built with
// electron-builder 26.15.3 (both halves compile under -WX); CI builds it on every tag.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('the installer: a wizard with a folder choice, both languages, still per-user by default', () => {
  const b = src('electron-builder.yml');
  for (const line of ['oneClick: false', 'perMachine: false', 'allowElevation: true', 'allowToChangeInstallationDirectory: true',
    'multiLanguageInstaller: true', 'installerLanguages: [ru_RU, en_US]', 'displayLanguageSelector: false',
    'createDesktopShortcut: true', 'runAfterFinish: true', 'deleteAppDataOnUninstall: false']) {
    assert.ok(b.includes(`  ${line}\n`), line);
  }
  assert.doesNotMatch(b, /createDesktopShortcut: always/, 'a removed desktop shortcut stays removed after an update');
  assert.match(b, /'!electron\/assets\/\*\.bmp'/, 'the installer art is not packed into the app');
});

test('its pages and words: every $(string) exists in Russian and English, the halves are fenced for -WX', () => {
  const n = src('electron/assets/installer.nsh');
  const used = [...new Set([...n.matchAll(/\$\((hush\w+)\)/g)].map((m) => m[1]))];
  assert.ok(used.length >= 10, used.join(','));
  for (const k of used) for (const id of [1049, 1033]) assert.match(n, new RegExp(`LangString ${k} ${id} "`), `${k} ${id}`);
  for (const m of ['customInit', 'customWelcomePage', 'customPageAfterChangeDir', 'customInstall', 'customUnInstall']) assert.match(n, new RegExp(`!macro ${m}\\b`), m);
  const inst = n.slice(n.indexOf('!ifndef BUILD_UNINSTALLER\n  Var hushDesk'), n.indexOf('\n!else\n'));
  assert.match(inst, /Page custom hushShortcutsShow hushShortcutsLeave/);
  assert.match(inst, /\$\{if\} \$\{isUpdated\}\s+Abort/, 'an update skips the page');
  assert.match(inst, /\$\{ifNot\} \$\{isUpdated\}\s+\$\{if\} \$hushDesk != 1\s+WinShell::UninstShortcut "\$newDesktopLink"\s+Delete "\$newDesktopLink"/);
  const un = n.slice(n.indexOf('\n!else\n'));
  assert.match(un, /\$\{ifNot\} \$\{isUpdated\}\s+\$\{andIfNot\} \$\{Silent\}\s+MessageBox MB_YESNO/, 'an update never asks and never deletes the saves');
  assert.match(un, /SetShellVarContext current\s+RMDir \/r "\$APPDATA\\HUSH"/);
  assert.match(un, /\$\{if\} \$installMode == "all"\s+SetShellVarContext all/, 'and puts the install\'s own context back');
  assert.match(n, /!ifndef BUILD_UNINSTALLER\n {2}!define MUI_FINISHPAGE_TITLE/, 'the uninstaller\'s finish page keeps its own words');
});

test('its art: the sizes NSIS wants, 24-bit', () => {
  for (const [name, w, h] of [['installerSidebar', 164, 314], ['uninstallerSidebar', 164, 314], ['installerHeader', 150, 57]]) {
    const b = readFileSync(new URL(`../electron/assets/${name}.bmp`, import.meta.url));
    assert.equal(b.toString('ascii', 0, 2), 'BM', name);
    assert.equal(b.readInt32LE(18), w, `${name} width`);
    assert.equal(Math.abs(b.readInt32LE(22)), h, `${name} height`);
    assert.equal(b.readUInt16LE(28), 24, `${name} bpp`);
  }
});

test('the shell: folders, a fresh copy of the game, the uninstaller, and «back to the launcher» as a setting', () => {
  const main = src('electron/main.cjs');
  assert.match(main, /if \(launcherWin && prefs\.returnToLauncher !== false\) \{ launcherWin\.show\(\);/);
  assert.match(main, /ipcMain\.handle\('hush:ln:info'/);
  assert.match(main, /ipcMain\.handle\('hush:ln:repair', async \(e\) => \{\s+if \(!fromLauncher\(e\)\) return null;\s+if \(gameWin\) return \{ error: 'playing' \};/, 'not under a running game');
  assert.match(main, /\/\^Uninstall \.\+\\\.exe\$\/i/, 'electron-builder\'s uninstaller, found beside the .exe');
  assert.match(main, /spawn\(uninstaller, \[\], \{ detached: true, stdio: 'ignore' \}\)\.unref\(\);\s+\} catch \{\s+return false;\s+\}\s+shellApplied = true;/, 'and no shell update is installed on the way out');
  assert.match(main, /else if \(what === 'install'\) \{ if \(info\.mode === 'portable'\) shell\.showItemInFolder\(info\.exe\); else shell\.openPath\(info\.installDir\); \}/);
  const pre = src('electron/preload-launcher.cjs');
  for (const k of ['info', 'repair', 'uninstall']) assert.match(pre, new RegExp(`${k}: \\(\\) => ipcRenderer\\.invoke\\('hush:ln:${k}'\\)`), k);
  assert.doesNotMatch(pre, /require\('(node:)?(fs|child_process|path)'\)/);
});

test('repair forgets every downloaded copy and goes back to the bundled one until the newest is fetched', async () => {
  const { Updater } = require('../electron/updater.cjs');
  const userData = mkdtempSync(join(tmpdir(), 'hush31k-'));
  const bundledDir = mkdtempSync(join(tmpdir(), 'hush31k-dist-'));
  writeFileSync(join(bundledDir, 'index.html'), 'bundled');
  const dir = join(userData, 'game', '1.0.40');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), 'downloaded');
  writeFileSync(join(dir, '.hush-ok'), JSON.stringify({ version: '1.0.40' }));
  writeFileSync(join(userData, 'game', 'current.json'), JSON.stringify({ version: '1.0.40' }));
  const u = new Updater({ net: {}, userData, bundledDir, bundledVersion: '1.0.30', shellId: '0123456789abcdef', mode: 'dev' });
  assert.equal(u.current().source, 'update');
  const s = await u.repair();
  assert.equal(existsSync(join(userData, 'game')), false, 'the downloaded copies are gone');
  assert.equal(u.current().source, 'bundled');
  assert.equal(s.game, '1.0.30');
  assert.match(src('electron/updater.cjs'), /this\.set\(\{ phase: 'downloading', progress: 0, size: m\.pak\.size \}\);/, 'the launcher can say «из 7 МБ»');
});

test('the launcher page: tabs, switches, the folders, one guarded question — and only what the shell can do', async () => {
  const html = src('launcher.html');
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 2);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 2);
  for (const id of ['lnAuto', 'lnFull', 'lnBack']) assert.match(html, new RegExp(`type="checkbox" role="switch" id="${id}"`), id);
  assert.match(html, /role="alertdialog" aria-modal="true"/);
  for (const id of ['lnInstallDir', 'lnDataDir', 'lnRepair', 'lnUninstall', 'lnCheck', 'lnPlayText']) assert.ok(html.includes(`id="${id}"`), id);
  const js = src('src/launcher/launcher.js');
  assert.match(js, /if \(typeof api\.info === 'function'\)/, 'an older shell: the parts it cannot do are not shown');
  assert.match(js, /for \(const el of document\.querySelectorAll\('\[data-needs="info"\]'\)\) el\.hidden = !has;/);
  assert.match(js, /settings\.lang = b\.dataset\.lang;\s+saveSettings\(\);/, 'the language is the game\'s own setting');
  assert.match(js, /play\.style\.setProperty\('--p', downloading \? String\(s\.progress \|\| 0\) : '0'\);/, 'ИГРАТЬ fills while the update comes in');
  globalThis.localStorage ||= { getItem: () => null, setItem() {}, removeItem() {} };
  globalThis.document ||= { documentElement: {} };
  const { t, setLang } = await import('../src/core/i18n.js');
  // the words: every data-t of the page, every t('ln…') of the script, and the two picked by mode
  const keys = [...new Set([...html.matchAll(/data-t="(\w+)"/g), ...js.matchAll(/t\('(ln\w+)'\)/g)].map((m) => m[1]))];
  assert.ok(keys.length > 40, `${keys.length} words`);
  for (const lang of ['ru', 'en']) {
    setLang(lang);
    for (const k of [...keys, 'lnAbout', 'lnAboutPortable']) {
      assert.notEqual(t(k), k, `${lang}.${k}`);
    }
  }
  setLang('ru');
});
