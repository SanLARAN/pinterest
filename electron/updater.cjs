// 3.1d: the launcher's updater — what the status line under ИГРАТЬ says, and what happens behind it.
//
//   check()      the release manifest (update.cjs) → is there a newer game? a different shell?
//   a new game   download the .pak (a few MB), check its hash, unpack it beside the old one (content.cjs) — the
//                next game window opens on it. Nothing to install, nothing to restart.
//   a new shell  download the installer (or the portable exe) in the background; main.cjs runs it when the player
//                quits or presses «перезапустить и обновить».
//
// No Electron here: the network (net.cjs) and the folders are handed in, so tests/round31d.test.mjs runs the
// whole thing against a local server.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { MANIFEST_URL, cleanManifest, plan } = require('./update.cjs');
const content = require('./content.cjs');

function fileSha(file) {
  try { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); } catch { return null; }
}

class Updater {
  constructor({ net, userData, bundledDir, bundledVersion, shellId, mode = 'dev', manifestUrl = MANIFEST_URL, emit = () => {} }) {
    Object.assign(this, { net, userData, bundledDir, bundledVersion, shellId, mode, manifestUrl, emit });
    this.manifest = null;
    this.shellFile = null;
    this.busy = null;
    const cur = this.current();
    this.state = {
      phase: mode === 'dev' ? 'dev' : 'idle', // idle | checking | latest | downloading | ready | offline | error | dev
      mode,
      game: cur.version,
      source: cur.source,
      latest: null,
      latestGame: '',
      progress: 0,
      error: '',
      shell: { phase: 'none', progress: 0, size: 0, version: null, kind: null, error: '' }, // none | downloading | ready | error
      checkedAt: 0,
    };
  }

  current() {
    return content.resolve({ userData: this.userData, bundledDir: this.bundledDir, bundledVersion: this.bundledVersion });
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  set(patch) {
    Object.assign(this.state, patch);
    const s = this.snapshot();
    try { this.emit(s); } catch { /* a window that went away */ }
    return s;
  }

  setShell(patch) {
    return this.set({ shell: { ...this.state.shell, ...patch } });
  }

  // one check at a time; a second call while one runs waits for the same answer
  check() {
    if (this.mode === 'dev') return Promise.resolve(this.snapshot());
    if (!this.busy) this.busy = this._check().finally(() => { this.busy = null; });
    return this.busy;
  }

  async _check() {
    this.set({ phase: 'checking', error: '' });
    let m;
    try {
      m = cleanManifest(await this.net.getJson(this.manifestUrl, { timeout: 10000 }));
    } catch (e) {
      return this.set({ phase: 'offline', error: String(e.message || e), checkedAt: Date.now() });
    }
    if (!m) return this.set({ phase: 'offline', error: 'no_manifest', checkedAt: Date.now() });
    this.manifest = m;
    const cur = this.current();
    const p = plan(m, { gameVersion: cur.version, shellId: this.shellId, mode: this.mode });
    this.set({ latest: m.version, latestGame: m.game, checkedAt: Date.now(), game: cur.version, source: cur.source });
    if (p.shell && !['downloading', 'ready'].includes(this.state.shell.phase)) this.fetchShell(p.shell); // in the background
    if (!p.game) return this.set({ phase: 'latest', progress: 0 });
    return this.fetchGame(m);
  }

  async fetchGame(m) {
    this.set({ phase: 'downloading', progress: 0 });
    const dest = path.join(content.root(this.userData), 'downloads', m.pak.name);
    try {
      const r = await this.net.download(m.pak.url, dest, {
        expected: m.pak.size, maxBytes: m.pak.size + 4096, onProgress: (p) => this.set({ progress: p }),
      });
      if (r.sha256 !== m.pak.sha256) throw new Error('checksum');
      content.install({ userData: this.userData, version: m.version, buf: fs.readFileSync(r.file), sha256: m.pak.sha256 });
      const cur = this.current();
      return this.set({ phase: 'ready', progress: 1, game: cur.version, source: cur.source, error: '' });
    } catch (e) {
      return this.set({ phase: 'error', error: String(e.message || e) });
    } finally {
      fs.rmSync(dest, { force: true });
    }
  }

  async fetchShell(kind) {
    const a = this.manifest?.shell?.[kind];
    if (!a) return this.snapshot();
    const dir = path.join(this.userData, 'updates');
    const dest = path.join(dir, a.name);
    this.setShell({ phase: 'downloading', progress: 0, size: a.size, version: this.manifest.shell.version, kind, error: '' });
    try {
      // fetched in an earlier session already? (the same name and the same hash: no need to pull 80 MB again)
      if (fileSha(dest) !== a.sha256) {
        const r = await this.net.download(a.url, dest, {
          expected: a.size, maxBytes: a.size + 4096, onProgress: (p) => this.setShell({ progress: p }),
        });
        if (r.sha256 !== a.sha256) { fs.rmSync(dest, { force: true }); throw new Error('checksum'); }
      }
      for (const n of fs.readdirSync(dir)) if (n !== a.name) fs.rmSync(path.join(dir, n), { force: true, recursive: true }); // older installers
      this.shellFile = dest;
      return this.setShell({ phase: 'ready', progress: 1 });
    } catch (e) {
      return this.setShell({ phase: 'error', error: String(e.message || e) });
    }
  }
}

module.exports = { Updater };
