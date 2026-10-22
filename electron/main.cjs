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
const { app, BrowserWindow, Menu, session, protocol, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
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
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
