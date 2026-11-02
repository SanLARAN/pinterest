// ТИШЕ / HUSH — the desktop shell.
//
// The game is a web build (dist/): no server, no network at start, everything it needs is in the folder. Electron
// loads it through its own scheme, `hush://app/…`, instead of file:// on purpose:
//   • a real origin (not an opaque one) is what the browser needs for a microphone and for WebRTC — the whole game
//     is built on getUserMedia, and file:// origins are second-class citizens there;
//   • the scheme is registered as *standard* and *secure*, so the page counts as a secure context: the audio
//     worklets, the mic and the peer connection behave exactly as they do on the https site;
//   • and the request handler only ever serves files from dist/ — the game cannot reach the rest of the disk.
//
// (3.1d) It opens on a launcher (launcher.html: ИГРАТЬ, updates, what's new) and keeps itself current: the game
// part (~7 MB) is swapped in from each release without reinstalling, the shell (~80 MB) re-installs itself when
// it changed. See updater.cjs, content.cjs and docs/DESKTOP.md.
//
// Run it: `npm run desktop` (builds first) · Package it: `npm run desktop:win` / the Desktop workflow.
const { app, BrowserWindow, Menu, session, protocol, shell, dialog, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
// (3.0m) which release is newer; (3.1d) and what the launcher may take from the release manifest — pure, tested
const { PAGE } = require('./update.cjs');
// (3.1d) the launcher's updater, the copies of the game on disk, and the two network calls — all without Electron
const { Updater } = require('./updater.cjs');
const content = require('./content.cjs');
const net = require('./net.cjs');
// (3.1a) Google sign-in in the player's own browser, back through a one-shot loopback server
const oauth = require('./oauth.cjs');
// the part that decides *what* may be read and *who* may speak: pure, and tested in tests/round21x.test.mjs
const { allowsPermission, isOwnOrigin, serveBuild } = require('./serve.cjs');

const SCHEME = 'hush';
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DEV_URL = process.env.HUSH_DEV_URL || ''; // e.g. HUSH_DEV_URL=http://localhost:5173 for hot reload
const ICON = path.join(__dirname, 'assets', 'icon.png');
const SITE = 'https://sanlaran.github.io/pinterest/';
const ISSUES = 'https://github.com/SanLARAN/pinterest/issues';

// before app is ready, and before any window exists: the scheme has to be privileged up front
protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true },
  },
]);

// the game wants to be heard: no "press play first" for the title music and the ambience
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// a microphone in a game about listening: allowed from our own origin, and nothing else is
function allowAudio(contents) {
  return isOwnOrigin(contents.getURL(), SCHEME, DEV_URL);
}
function gatePermissions() {
  const ses = session.defaultSession;
  const verdict = (contents, permission) => allowAudio(contents) && allowsPermission(permission);
  ses.setPermissionRequestHandler((contents, permission, callback) => callback(verdict(contents, permission)));
  ses.setPermissionCheckHandler((contents, permission) => verdict(contents, permission));
  // the game needs no camera, no notifications, no clipboard: anything else is refused by the handler above
}

// serve the game over hush://app/…, and nothing outside it. Reading through `fs`, not through a file: URL, is what
// makes it work inside app.asar: Electron's fs patches know about the archive, a bare file: URL does not.
// (3.1d) «the game» is whichever copy is current: the bundled dist/, or a newer one the launcher downloaded. It is
// chosen when a window opens on it (gameCopy), never under a page that is already running.
let gameCopy = { dir: DIST, version: '0.0.0', source: 'bundled' };
function serveBuildRequests() {
  protocol.handle(SCHEME, (request) =>
    serveBuild(request, gameCopy.dir, (file) => {
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error('missing');
      return fs.readFileSync(file);
    }));
}

function createGameWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#000000',
    title: 'ТИШЕ / HUSH',
    icon: fs.existsSync(ICON) ? ICON : undefined,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), // the update bridge, and nothing else
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false, // a shift is long; the game must not be slowed down when it loses focus
      spellcheck: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // F11 — fullscreen, F12 — devtools, Ctrl/Cmd+R — restart the page. The game's own keys are untouched.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); event.preventDefault(); }
    else if (input.key === 'F12') { win.webContents.toggleDevTools(); event.preventDefault(); }
    else if ((input.control || input.meta) && input.key.toLowerCase() === 'r') { win.webContents.reload(); event.preventDefault(); }
    else if (input.key === 'F10') { win.webContents.setZoomFactor(1); event.preventDefault(); }
  });

  // no pop-ups: links open in the player's own browser, a new window would only be an empty black square
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // an uncaught error in a packaged build has no console to go to: say it, don't just go black
  win.webContents.on('render-process-gone', (_e, details) => {
    dialog.showErrorBox('ТИШЕ / HUSH', `Окно игры закрылось (${details.reason}).\nЗапусти её ещё раз — смена не сохраняется.`);
  });

  if (prefs.fullscreen) win.setFullScreen(true);
  if (DEV_URL) win.loadURL(DEV_URL);
  else win.loadURL(`${SCHEME}://app/index.html`);
  return win;
}

// ---------------------------------------------------------------- the launcher (3.1d)
// The first window: ИГРАТЬ, the update line, what's new, settings. It hides while the game window is open and comes
// back when it closes (unless the player turned that off: then closing the game quits); closing the launcher quits.
// Its settings live in <userData>/launcher.json.
const PREFS_FILE = () => path.join(app.getPath('userData'), 'launcher.json');
const PREF_KEYS = ['autoplay', 'fullscreen', 'returnToLauncher'];
let prefs = { autoplay: false, fullscreen: false, returnToLauncher: true };
function loadPrefs() {
  try { prefs = { ...prefs, ...JSON.parse(fs.readFileSync(PREFS_FILE(), 'utf8')) }; } catch { /* first run */ }
}
function savePrefs() {
  try { fs.writeFileSync(PREFS_FILE(), JSON.stringify(prefs)); } catch { /* a read-only profile: keep them for this run */ }
}

// how this copy of the shell was installed, which decides how it updates itself
function shellMode() {
  if (!app.isPackaged) return 'dev';
  if (process.env.PORTABLE_EXECUTABLE_FILE) return 'portable';
  return 'nsis';
}

// (3.1k) where this copy lives, for the launcher's settings: the folder the player chose in the installer (or the
// portable .exe's own folder), the saves, and the uninstaller electron-builder left beside the .exe
function installInfo() {
  const mode = shellMode();
  const exe = mode === 'portable' ? process.env.PORTABLE_EXECUTABLE_FILE : process.execPath;
  const installDir = mode === 'dev' ? ROOT : path.dirname(exe);
  let uninstaller = null;
  if (mode === 'nsis') {
    try {
      const name = fs.readdirSync(installDir).find((n) => /^Uninstall .+\.exe$/i.test(n));
      if (name) uninstaller = path.join(installDir, name);
    } catch { /* a folder we cannot list: no uninstall button */ }
  }
  return { mode, installDir, exe, dataDir: app.getPath('userData'), shell: app.getVersion(), electron: process.versions.electron, uninstaller };
}

let updater = null;
let launcherWin = null;
let gameWin = null;
let pendingPlay = false;
let quitting = false;
let shellApplied = false;

function sendState(s) {
  if (launcherWin && !launcherWin.isDestroyed()) launcherWin.webContents.send('hush:ln:state', s);
  if (gameWin && !gameWin.isDestroyed()) gameWin.webContents.send('hush:update:progress', gameView(s));
  // ИГРАТЬ was pressed while the new game was downloading: go as soon as it is in (or failed)
  if (pendingPlay && !['downloading', 'checking'].includes(s.phase)) { pendingPlay = false; openGame(); }
}

function createLauncher() {
  const win = new BrowserWindow({
    width: 980,
    height: 600,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    backgroundColor: '#050607',
    title: 'ТИШЕ / HUSH',
    icon: fs.existsSync(ICON) ? ICON : undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-launcher.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win.once('ready-to-show', () => { if (!gameWin) win.show(); });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.on('closed', () => { launcherWin = null; if (!gameWin) app.quit(); });
  if (DEV_URL) win.loadURL(`${DEV_URL}/launcher.html`);
  else win.loadURL(`${SCHEME}://app/launcher.html`);
  return win;
}

// ИГРАТЬ: the newest copy of the game, in its own window; the launcher steps aside
function play(force) {
  if (gameWin) { if (gameWin.isMinimized()) gameWin.restore(); gameWin.focus(); return {}; }
  if (!force && updater && updater.state.phase === 'downloading') { pendingPlay = true; return { waiting: true }; }
  pendingPlay = false;
  openGame();
  return {};
}

function openGame() {
  if (gameWin) return;
  if (updater) gameCopy = updater.current();
  gameWin = createGameWindow();
  gameWin.on('closed', () => {
    gameWin = null;
    if (quitting) return;
    if (launcherWin && prefs.returnToLauncher !== false) { launcherWin.show(); launcherWin.focus(); updater?.check(); }
    else app.quit();
  });
  launcherWin?.hide();
}

// the shell's own update: the downloaded installer (or portable exe) takes over from here
function applyShell(restart) {
  if (shellApplied || !updater?.shellFile || !fs.existsSync(updater.shellFile)) return false;
  const file = updater.shellFile;
  const mode = shellMode();
  try {
    if (mode === 'nsis') {
      // electron-builder's NSIS installer: /S silent, --updated keeps the shortcuts, --force-run starts it again
      spawn(file, ['/S', '--updated', ...(restart ? ['--force-run'] : [])], { detached: true, stdio: 'ignore' }).unref();
    } else if (mode === 'portable') {
      if (!swapPortable(file, restart)) return false;
    } else return false;
  } catch (e) {
    updater.setShell({ phase: 'error', error: String(e.message || e) });
    return false;
  }
  shellApplied = true;
  quitting = true;
  setTimeout(() => app.quit(), 200);
  return true;
}

// a portable .exe unpacks itself into a temp folder to run: process.execPath is that copy, and replacing it changes
// nothing. The file the player launched is PORTABLE_EXECUTABLE_FILE — that is the one to put the new build over.
function swapPortable(file, restart) {
  const exe = process.env.PORTABLE_EXECUTABLE_FILE;
  if (!exe) return false;
  fs.accessSync(path.dirname(exe), fs.constants.W_OK); // (a read-only folder: say so instead of a silent nothing)
  const bat = path.join(app.getPath('temp'), `hush-update-${Date.now()}.cmd`);
  const script = [
    '@echo off',
    'chcp 65001 > nul',
    'ping 127.0.0.1 -n 3 > nul',
    ':again',
    `copy /y "${file}" "${exe}" > nul`,
    'if errorlevel 1 (',
    '  ping 127.0.0.1 -n 2 > nul',
    '  goto again',
    ')',
    restart ? `start "" "${exe}"` : 'rem (no restart: the player was quitting)',
    'del "%~f0"',
  ].join('\r\n');
  fs.writeFileSync(bat, script, 'utf8');
  spawn('cmd.exe', ['/c', bat], { detached: true, stdio: 'ignore', windowsVerbatimArguments: true }).unref();
  return true;
}

function wireLauncherIpc() {
  const fromLauncher = (e) => !!launcherWin && e.sender === launcherWin.webContents;
  ipcMain.handle('hush:ln:state', (e) => (fromLauncher(e) ? updater.snapshot() : null));
  ipcMain.handle('hush:ln:play', (e, force) => (fromLauncher(e) ? play(!!force) : null));
  ipcMain.handle('hush:ln:retry', (e) => (fromLauncher(e) ? updater.check() : null));
  ipcMain.handle('hush:ln:shell', (e) => (fromLauncher(e) ? applyShell(true) : false));
  ipcMain.handle('hush:ln:prefs', (e) => (fromLauncher(e) ? { ...prefs } : null));
  ipcMain.handle('hush:ln:pref', (e, key, value) => {
    if (!fromLauncher(e) || !PREF_KEYS.includes(key) || typeof value !== 'boolean') return false;
    prefs[key] = value;
    savePrefs();
    return true;
  });
  ipcMain.handle('hush:ln:open', (e, what) => {
    if (!fromLauncher(e)) return false;
    const info = installInfo();
    if (what === 'folder' || what === 'data') shell.openPath(info.dataDir);
    else if (what === 'install') { if (info.mode === 'portable') shell.showItemInFolder(info.exe); else shell.openPath(info.installDir); }
    else if (what === 'site') shell.openExternal(SITE);
    else if (what === 'privacy') shell.openExternal(`${SITE}privacy.html`);
    else if (what === 'issues') shell.openExternal(ISSUES);
    else if (what === 'releases') shell.openExternal(PAGE);
    else return false;
    return true;
  });
  // (3.1k) the settings tab: the folders, and the two things it can do with them
  ipcMain.handle('hush:ln:info', (e) => {
    if (!fromLauncher(e)) return null;
    const { mode, installDir, dataDir, shell: ver, electron, uninstaller } = installInfo();
    return { mode, installDir, dataDir, shell: ver, electron, canUninstall: !!uninstaller };
  });
  ipcMain.handle('hush:ln:repair', async (e) => {
    if (!fromLauncher(e)) return null;
    if (gameWin) return { error: 'playing' };
    return updater.repair();
  });
  // hand over to electron-builder's uninstaller (it asks for itself, and about the saves): the launcher steps out
  // of its way, and a shell update downloaded in the background is not installed on the way out
  ipcMain.handle('hush:ln:uninstall', (e) => {
    if (!fromLauncher(e) || gameWin) return false;
    const { uninstaller } = installInfo();
    if (!uninstaller) return false;
    try {
      spawn(uninstaller, [], { detached: true, stdio: 'ignore' }).unref();
    } catch {
      return false;
    }
    shellApplied = true;
    quitting = true;
    setTimeout(() => app.quit(), 200);
    return true;
  });
  ipcMain.handle('hush:ln:win', (e, action) => {
    if (!fromLauncher(e)) return false;
    if (action === 'min') launcherWin.minimize();
    else if (action === 'close') launcherWin.close();
    return true;
  });
}

// ---------------------------------------------------------------- inside the game (3.0m → 3.1d)
// The game's own corner line (src/ui/desktopUpdate.js): which build is running, and — when the launcher has
// downloaded a newer game while you played — a button that reloads onto it.
function gameView(s) {
  return {
    phase: s.phase,
    version: gameCopy.version,
    latest: s.latest,
    latestGame: s.latestGame,
    updateReady: !!updater && updater.current().version !== gameCopy.version,
    shell: s.shell?.phase || 'none',
    dev: s.phase === 'dev',
  };
}

function wireGameIpc() {
  const fromGame = (e) => !!gameWin && e.sender === gameWin.webContents;
  ipcMain.handle('hush:version', () => gameCopy.version);
  ipcMain.handle('hush:update:check', async (e) => (fromGame(e) && updater ? gameView(await updater.check()) : null));
  ipcMain.handle('hush:update:page', () => { shell.openExternal(PAGE); return true; });
  // reload the game window onto the newest copy (only between shifts: the button lives in the menu)
  ipcMain.handle('hush:update:restart', (e) => {
    if (!fromGame(e) || !updater) return false;
    gameCopy = updater.current();
    gameWin.webContents.reload();
    return true;
  });
}

// (3.1a) «Войти через Google»: begin → a loopback redirect for Supabase; finish → open the authorize URL in the
// system browser and wait for the tokens. Only our own page may ask, and only for Supabase's Google URL.
function wireOAuthIpc() {
  let pending = null;
  const ours = (e) => isOwnOrigin(e.senderFrame?.url || e.sender.getURL(), SCHEME, DEV_URL);
  ipcMain.handle('hush:oauth:begin', async (e, lang) => {
    if (!ours(e)) return { error: 'origin' };
    const b = oauth.begin({ lang: lang === 'en' ? 'en' : 'ru' });
    try { await b.listening; } catch { return { error: 'port_busy' }; }
    pending = b;
    return { redirect: b.redirect };
  });
  ipcMain.handle('hush:oauth:finish', async (e, url) => {
    const b = pending;
    pending = null;
    if (!ours(e) || !b || !oauth.safeAuthorizeUrl(url, b.redirect)) { oauth.cancel('bad_url'); return { error: 'bad_url' }; }
    shell.openExternal(url);
    const r = await b.result;
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
    return r;
  });
}

// one copy at a time: a second launch focuses the first (two windows would fight over the microphone)
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = gameWin || launcherWin;
    if (win) { if (!win.isVisible()) win.show(); if (win.isMinimized()) win.restore(); win.focus(); }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('ru.hush.echolocation');
    Menu.setApplicationMenu(null);
    gatePermissions();
    loadPrefs();
    if (!DEV_URL && !fs.existsSync(path.join(DIST, 'index.html'))) {
      dialog.showErrorBox('ТИШЕ / HUSH', 'Сборки нет: сначала `npm run build`.');
      app.quit();
      return;
    }
    updater = new Updater({
      net,
      userData: app.getPath('userData'),
      bundledDir: DIST,
      bundledVersion: app.getVersion(),
      shellId: content.shellId(__dirname, process.versions.electron),
      mode: DEV_URL ? 'dev' : shellMode(),
      emit: sendState,
    });
    gameCopy = updater.current();
    if (!DEV_URL) serveBuildRequests();
    wireOAuthIpc();
    wireGameIpc();
    wireLauncherIpc();
    // a copy of the game from before the launcher existed has no launcher.html: straight into the game then
    const hasLauncher = !!DEV_URL || fs.existsSync(path.join(gameCopy.dir, 'launcher.html'));
    if (hasLauncher) launcherWin = createLauncher();
    const first = updater.check();
    if (!hasLauncher || process.argv.includes('--play')) openGame();
    else if (prefs.autoplay) {
      // «сразу запускать игру»: look for an update for a moment, then go (a download in progress is waited for)
      Promise.race([first, new Promise((r) => setTimeout(r, 6000))]).then(() => { if (!gameWin) play(false); });
    }
    // a window that stays open all evening still hears about new builds
    setInterval(() => { updater.check(); }, 3 * 3600 * 1000).unref?.();
  });

  // a new shell downloaded in the background installs on the way out (no restart: the player was quitting)
  app.on('before-quit', (e) => {
    quitting = true;
    if (!shellApplied && updater?.state.shell.phase === 'ready' && updater.shellFile) {
      e.preventDefault();
      if (!applyShell(false)) { shellApplied = true; app.quit(); }
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
