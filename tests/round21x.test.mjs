// 2.1x: ТИШЕ / HUSH as a desktop app. The shell is a thin, auditable one — the game is the same web build, and
// the shell's job is only: serve ./dist over a privileged scheme, let the microphone through, and stay out of the
// way. These are the blades of that: the scheme, the confinement, the permission gate, the packaging and the two
// places the .exe can be picked up from.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// the shell's pure part, exercised for real: a test-runner cannot download Chromium, but it can check that `../`
// is a 403 and that the camera stays off
const require = createRequire(import.meta.url);
const { resolveRequest, allowsPermission, isOwnOrigin, mimeType, parseRange, serveBuild } = require('../electron/serve.cjs');
// a real, platform-correct path: `new URL(...).pathname` is `/C:/…` on Windows, which no fs call or path
// comparison here would accept
const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const inside = (file) => {
  const rel = relative(DIST, file);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
};

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const pkg = JSON.parse(src('package.json'));
const main = src('electron/main.cjs');
const serve = src('electron/serve.cjs'); // the handler itself
const builder = src('electron-builder.yml');
const wf = src('.github/workflows/desktop.yml');

test('the shell loads the built game over its own privileged scheme, not over file://', () => {
  // a real, secure origin is what a microphone and a peer connection need; file:// is not one
  assert.match(main, /registerSchemesAsPrivileged/);
  const priv = main.slice(main.indexOf('registerSchemesAsPrivileged'), main.indexOf(']);', main.indexOf('registerSchemesAsPrivileged')));
  for (const flag of ['standard: true', 'secure: true', 'supportFetchAPI: true']) {
    assert.ok(priv.includes(flag), `the scheme is ${flag}`);
  }
  assert.match(main, /loadURL\(`\$\{SCHEME\}:\/\/app\/index\.html`\)/, 'it loads the game from that scheme');
  assert.equal(pkg.main, 'electron/main.cjs', 'the package entry is the shell');
});

test('it cannot read the disk: every request is confined to ./dist', () => {
  // real requests, not regexes: the entry, an asset, a page it does not know, and three ways out of the folder
  assert.equal(resolveRequest('hush://app/', DIST).file, join(DIST, 'index.html'), 'the root is the entry');
  assert.equal(resolveRequest('hush://app/assets/index-x.js', DIST).file, join(DIST, 'assets', 'index-x.js'), 'an asset is itself');
  const page = resolveRequest('hush://app/kabinet', DIST);
  assert.equal(page.file, join(DIST, 'index.html'));
  assert.equal(page.fallback, true, 'an unknown page falls back to the entry, like a single-page app');
  // `hush://app/..\..\windows\win.ini` — the URL parser leaves the backslashes, and on Windows they are separators:
  const escaped = resolveRequest('hush://app/..\\..\\windows\\win.ini', DIST);
  assert.equal(escaped.status, 403, 'backslashes out of the build are refused');
  for (const bad of ['hush://app/../../../../etc/passwd', 'hush://app/%2e%2e/%2e%2e/etc/shadow']) {
    const hit = resolveRequest(bad, DIST);
    assert.ok(hit.status === 403 || inside(hit.file), `${bad} stays inside the build: ${JSON.stringify(hit)}`);
  }
  // the handler must go through that function and not re-decide on its own
  assert.match(main, /require\('\.\/serve\.cjs'\)/, 'main.cjs uses the tested handler');
  assert.match(main, /serveBuild\(request, gameCopy\.dir,/, 'every request goes through it (3.1d: from the current copy of the game)');
  assert.match(main, /let gameCopy = \{ dir: DIST,/, 'which is the bundled build until the launcher has a newer one');
  assert.match(serve, /const hit = resolveRequest\(request\.url, dist\)/, 'and it starts by resolving the path');
  // and the page itself is sandboxed
  assert.match(main, /nodeIntegration: false/);
  assert.match(main, /contextIsolation: true/);
  assert.match(main, /sandbox: true/);
});

test('the files it serves are readable: right types, and ranges the music player needs', () => {
  // an <audio> element seeks and loops, so answering a range request with a plain 200 stalls the music
  assert.equal(mimeType('/app/dist/index.html'), 'text/html; charset=utf-8');
  assert.equal(mimeType('/app/dist/assets/a.js'), 'text/javascript; charset=utf-8');
  assert.equal(mimeType('/app/dist/audio/angler-found.mp3'), 'audio/mpeg');
  assert.equal(mimeType('/app/dist/assets/f.woff2'), 'font/woff2');
  assert.equal(mimeType('/app/dist/x.bin'), 'application/octet-stream');

  assert.deepEqual(parseRange('bytes=0-', 100), { start: 0, end: 99 });
  assert.deepEqual(parseRange('bytes=10-19', 100), { start: 10, end: 19 });
  assert.deepEqual(parseRange('bytes=-15', 100), { start: 85, end: 99 }, 'the tail, for a track near its end');
  assert.deepEqual(parseRange('bytes=0-1000', 100), { start: 0, end: 99 }, 'clamped to the file');
  assert.equal(parseRange('bytes=200-', 100), 'unsatisfiable');
  assert.equal(parseRange('bytes=19-10', 100), 'unsatisfiable');
  assert.equal(parseRange(null, 100), null, 'no header — the whole file');
  assert.equal(parseRange('bytes=oops', 100), null, 'a header it does not understand — the whole file');

  // and it answers from memory read through fs, so it works inside app.asar (a bare file: URL does not)
  assert.match(main, /fs\.readFileSync\(file\)/);
  assert.doesNotMatch(main, /net\.fetch/, 'no file:// fetch into the asar archive');
  assert.match(serve, /'content-range'/, '206 carries the range');
  assert.match(serve, /206/, 'and a partial response is a 206');
});

test('a request really is answered: html, a byte range, a fallback, a 404 and a 403', async () => {
  // a stand-in build: the handler itself is what is under test, and it must not depend on ./dist existing
  // (`npm test` runs before `npm run build` in both workflows)
  const dist = mkdtempSync(join(tmpdir(), 'hush-dist-'));
  const read = (f) => {
    if (!existsSync(f) || !statSync(f).isFile()) throw new Error('missing');
    return readFileSync(f);
  };
  const ask = (url, headers) => serveBuild(new Request(url, { headers }), dist, read);
  try {
    mkdirSync(join(dist, 'assets'), { recursive: true });
    writeFileSync(join(dist, 'index.html'), '<div id="boot"></div>');
    writeFileSync(join(dist, 'assets', 'index-abc.js'), 'console.log(1)');
    writeFileSync(join(dist, 'track.mp3'), Buffer.alloc(1000, 7));

    const entry = await ask('hush://app/');
    assert.equal(entry.status, 200);
    assert.equal(entry.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.match(await entry.text(), /id="boot"/);

    const js = await ask('hush://app/assets/index-abc.js');
    assert.equal(js.status, 200);
    assert.equal(js.headers.get('content-type'), 'text/javascript; charset=utf-8');
    assert.equal(await js.text(), 'console.log(1)');

    const part = await ask('hush://app/track.mp3', { range: 'bytes=100-199' });
    assert.equal(part.status, 206, 'a range is a partial response, or the music element stalls');
    assert.equal(part.headers.get('content-range'), 'bytes 100-199/1000');
    assert.equal((await part.arrayBuffer()).byteLength, 100);

    assert.equal((await ask('hush://app/track.mp3')).status, 200, 'no header — the whole track');
    assert.equal((await ask('hush://app/track.mp3', { range: 'bytes=5000-' })).status, 416, 'past the end');

    const page = await ask('hush://app/menu');
    assert.equal(page.status, 200, 'a page it does not know is the entry, not a 404');
    assert.equal((await ask('hush://app/assets/gone.js')).status, 404, 'a missing asset is a 404, like on the web');
    assert.equal((await ask('hush://app/..\\..\\windows\\win.ini')).status, 403);
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
});

test('the microphone is allowed, and nothing else is', () => {
  assert.equal(allowsPermission('media'), true);
  assert.equal(allowsPermission('audioCapture'), true);
  for (const no of ['camera', 'geolocation', 'clipboard-read', 'notifications', 'midi']) {
    assert.equal(allowsPermission(no), false, `${no} is refused`);
  }
  // …and only to the game's own page: a remote URL in the same window gets nothing
  assert.equal(isOwnOrigin('hush://app/index.html', 'hush'), true);
  assert.equal(isOwnOrigin('https://evil.example/', 'hush'), false);
  assert.equal(isOwnOrigin('file:///C:/x.html', 'hush'), false);
  assert.match(main, /setPermissionRequestHandler/);
  assert.match(main, /autoplay-policy/, 'the night starts with sound, without a click');
});

test('one window, one copy: a second launch focuses the running shift', () => {
  assert.match(main, /requestSingleInstanceLock/);
  assert.match(main, /second-instance/);
  assert.match(main, /window-all-closed/);
});

test('the Windows build packs every file the shell needs', () => {
  const cfg = builder;
  for (const need of ['electron/main.cjs', 'electron/serve.cjs', 'electron/assets/**', 'dist/**', 'package.json']) {
    assert.ok(cfg.includes(need), `${need} is packed`);
  }
  // a forgotten file is not a packing error — it is a blank window on the player's machine
  assert.match(pkg.main, /^electron\/main\.cjs$/, 'and the app entry is the shell');
});

test('the Windows build is a portable x64 exe with the game\'s own icon', () => {
  assert.match(builder, /target: portable/);
  assert.match(builder, /arch: \[x64\]/);
  assert.match(builder, /icon: electron\/assets\/icon\.png/);
  assert.match(builder, /requestExecutionLevel: user/, 'no admin rights');
  assert.match(builder, /electronVersion: 45\.0\.0/);
  assert.match(builder, /- dist\/\*\*/, 'the web build rides inside the app');
  // the icon is a real PNG, and a big one: Windows scales it down, never up
  const icon = readFileSync(new URL('../electron/assets/icon.png', import.meta.url));
  assert.equal(icon.subarray(1, 4).toString('ascii'), 'PNG');
  const w = icon.readUInt32BE(16), h = icon.readUInt32BE(20);
  assert.equal(w, 512); assert.equal(h, 512);
  assert.ok(existsSync(new URL('../electron/assets/icon.png', import.meta.url)));
  assert.ok(statSync(new URL('../electron/main.cjs', import.meta.url)).size > 2000);
});

test('the workflow packs the exe and leaves it where a player can get it', () => {
  assert.match(wf, /runs-on: windows-latest/);
  assert.match(wf, /npm ci/);
  assert.match(wf, /npm test/, 'a broken build is not shipped');
  assert.match(wf, /npm run build/);
  assert.match(wf, /electron-builder --win nsis portable --x64/); // (3.1d: the installer and the portable build)
  assert.match(wf, /actions\/upload-artifact@v4/, 'the exe is downloadable from the run');
  assert.match(wf, /softprops\/action-gh-release@v2/, 'and attached to a tag release');
  assert.match(wf, /tags: \['arena\/\*'\]/, 'built on the same tags as the site');
  // Google Drive: opt-in through a secret, never a token in the repository
  assert.match(wf, /secrets\.GDRIVE_SA/);
  assert.match(wf, /if: env\.GDRIVE_SA != ''/, 'and skipped silently when it is not configured');
  assert.match(wf, /rclone copy/, 'rclone is what puts the file on the drive');
});

test('the npm scripts a human types are the same commands the workflow runs', () => {
  assert.match(pkg.scripts.desktop, /npm run build && npx --yes electron@45\.0\.0 \./);
  assert.match(pkg.scripts['desktop:win'], /electron-builder@26\.15\.3 --win nsis portable --x64/);
  // the desktop deps are deliberately not in package.json: the Pages deploy stays light
  assert.equal(pkg.devDependencies.electron, undefined);
  assert.equal(pkg.devDependencies['electron-builder'], undefined);
});
