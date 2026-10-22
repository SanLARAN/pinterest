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
// Run it: `npm run desktop` (builds first) · Package it: `npm run desktop:win` / the Desktop workflow.
const { app, BrowserWindow, Menu, session, protocol, shell, dialog, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');
const { spawn } = require('node:child_process');
// (3.0m) which release is newer and what to download from it: pure, and tested without Electron
const { API, PAGE, bestRelease } = require('./update.cjs');
// the part that decides *what* may be read and *who* may speak: pure, and tested in tests/round21x.test.mjs
const { allowsPermission, isOwnOrigin, serveBuild } = require('./serve.cjs');

const SCHEME = 'hush';
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DEV_URL = process.env.HUSH_DEV_URL || ''; // e.g. HUSH_DEV_URL=http://localhost:5173 for hot reload
const ICON = path.join(__dirname, 'assets', 'icon.png');

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

// serve dist/ over hush://app/…, and nothing outside it. Reading through `fs`, not through a file: URL, is what
// makes it work inside app.asar: Electron's fs patches know about the archive, a bare file: URL does not.
function serveBuildRequests() {
  protocol.handle(SCHEME, (request) =>
    serveBuild(request, DIST, (file) => {
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error('missing');
      return fs.readFileSync(file);
    }));
}

function createWindow() {
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

  if (DEV_URL) win.loadURL(DEV_URL);
  else win.loadURL(`${SCHEME}://app/index.html`);
  return win;
}

// ---------------------------------------------------------------- updating itself (3.0m)
// The build is one portable .exe attached to the GitHub release (see .github/workflows/desktop.yml). It cannot
// patch itself like an installed app, but it can do the honest portable thing: download the new .exe next to
// itself, and swap it in with a tiny script once the process has exited — then start again.
//
// Nothing here runs in a dev window (`electron .`): there is no build to replace.
const UPD_DIR = () => path.join(app.getPath('userData'), 'updates');
const state = { phase: 'idle', latest: null, notes: '', page: PAGE, progress: 0, error: '', file: '' };

function say(patch) {
  Object.assign(state, patch);
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('hush:update:progress', { ...state });
  return { ...state };
}

function fetchJson(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'HUSH-desktop', Accept: 'application/vnd.github+json' }, timeout: 12000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 3) {
        res.resume();
        return fetchJson(res.headers.location, redirects + 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { if (body.length < 4e6) body += c; });
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function checkUpdate() {
  const running = app.getVersion();
  if (!app.isPackaged) return say({ phase: 'idle', error: '', version: running, dev: true });
  say({ phase: 'checking', error: '', version: running });
  try {
    const list = await fetchJson(API);
    const best = bestRelease(list, running);
    if (!best) return say({ phase: 'idle', error: '', version: running, latest: null });
    return say({
      phase: 'ready',
      version: running, latest: best.version, notes: best.notes, page: best.page,
      newer: best.newer, asset: best.asset, error: '',
    });
  } catch (e) {
    return say({ phase: 'error', error: String(e.message || e), version: running });
  }
}

function downloadTo(url, dest, expected, onProgress) {
  return new Promise((resolve, reject) => {
    const get = (u, redirects = 0) => https.get(u, { headers: { 'User-Agent': 'HUSH-desktop' }, timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 4) {
        res.resume();
        return get(res.headers.location, redirects + 1);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      const total = Number(res.headers['content-length'] || expected || 0);
      let got = 0, last = 0;
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const out = fs.createWriteStream(dest);
      res.on('data', (c) => {
        got += c.length;
        const now = Date.now();
        if (onProgress && now - last > 200) { last = now; onProgress(total ? Math.min(1, got / total) : 0); }
      });
      res.pipe(out);
      out.on('finish', () => out.close(() => resolve(dest)));
      out.on('error', reject);
    });
    get(url).on('timeout', function () { this.destroy(new Error('timeout')); }).on('error', reject);
  });
}

// drop the new build over this one after we are gone, then start it again
function installAndRestart(file) {
  const exe = process.execPath;
  const dir = path.dirname(exe);
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
    `start "" "${exe}"`,
    'del "%~f0"',
  ].join('\r\n');
  try {
    fs.writeFileSync(bat, script, 'utf8');
    spawn('cmd.exe', ['/c', bat], { detached: true, stdio: 'ignore', windowsVerbatimArguments: true }).unref();
    // the folder may be read-only (a stick, Program Files): say so instead of leaving a silent black window
    fs.accessSync(dir, fs.constants.W_OK);
    setTimeout(() => app.quit(), 250);
    return true;
  } catch (e) {
    say({ phase: 'error', error: `cannot replace the build here: ${e.message}` });
    return false;
  }
}

function wireUpdateIpc() {
  ipcMain.handle('hush:version', () => app.getVersion());
  ipcMain.handle('hush:update:check', () => checkUpdate());
  ipcMain.handle('hush:update:page', () => { shell.openExternal(state.page || PAGE); return true; });
  ipcMain.handle('hush:update:download', async () => {
    if (!app.isPackaged) return say({ phase: 'idle', dev: true });
    const fresh = await checkUpdate();
    if (!fresh.asset) return fresh;
    const file = path.join(UPD_DIR(), fresh.asset.name);
    say({ phase: 'downloading', progress: 0, error: '' });
    try {
      await downloadTo(fresh.asset.url, file, fresh.asset.size, (p) => say({ progress: p }));
      say({ phase: 'downloaded', progress: 1, file });
      // the new file is on disk whatever happens next: install, or launch it by hand
      if (process.platform === 'win32') installAndRestart(file);
      else shell.showItemInFolder(file);
      return { ...state };
    } catch (e) {
      return say({ phase: 'error', error: String(e.message || e) });
    }
  });
}

// one copy at a time: a second launch focuses the first (two windows would fight over the microphone)
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('ru.hush.echolocation');
    Menu.setApplicationMenu(null);
    gatePermissions();
    if (!DEV_URL) {
      if (!fs.existsSync(path.join(DIST, 'index.html'))) {
        dialog.showErrorBox('ТИШЕ / HUSH', 'Сборки нет: сначала `npm run build`.');
        app.quit();
        return;
      }
      serveBuildRequests();
    }
    wireUpdateIpc(); // before the window: the page asks for its version the moment it loads
    createWindow();
    // check once, quietly, a few seconds in; a portable build is often launched for one shift
    if (app.isPackaged) setTimeout(() => { checkUpdate().catch(() => {}); }, 3500);
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
