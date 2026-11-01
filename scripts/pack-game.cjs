#!/usr/bin/env node
// 3.1d: what a release carries for the launcher. Run in CI after the .exe files are built:
//
//   node scripts/pack-game.cjs [--dist dist] [--out release]
//
// writes into --out:
//   hush-game-<version>.pak   the web build, packed (electron/pak.cjs)
//   hush-manifest.json        { v, version, game, pak, shell: { id, version, setup, portable }, date }
// The version is package.json's (CI stamps 1.0.<run>); the game's round (3.1d…) is the newest entry in the
// patch notes; the shell id is computed from electron/*.cjs exactly as the running app computes its own.
const fs = require('node:fs');
const path = require('node:path');
const pak = require('../electron/pak.cjs');
const { shellId } = require('../electron/content.cjs');

const ROOT = path.join(__dirname, '..');
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
};

function electronVersion() {
  const yml = fs.readFileSync(path.join(ROOT, 'electron-builder.yml'), 'utf8');
  const m = yml.match(/^electronVersion:\s*([\d.]+)/m);
  if (!m) throw new Error('electronVersion is not in electron-builder.yml');
  return m[1];
}

function gameRound() {
  const news = fs.readFileSync(path.join(ROOT, 'src/ui/news.js'), 'utf8');
  const m = news.match(/v:\s*'(\d+\.\d+[a-z]?)'/);
  return m ? m[1] : '';
}

function asset(dir, re) {
  const name = fs.existsSync(dir) ? fs.readdirSync(dir).find((n) => re.test(n)) : null;
  if (!name) return null;
  const buf = fs.readFileSync(path.join(dir, name));
  return { name, size: buf.length, sha256: pak.sha256(buf) };
}

function main() {
  const dist = path.resolve(ROOT, arg('dist', 'dist'));
  const out = path.resolve(ROOT, arg('out', 'release'));
  const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`package.json version is not x.y.z: ${version}`);
  if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error(`no build in ${dist}: run npm run build first`);
  fs.mkdirSync(out, { recursive: true });

  const buf = pak.pack(dist);
  const pakName = `hush-game-${version}.pak`;
  fs.writeFileSync(path.join(out, pakName), buf);

  const ev = electronVersion();
  const manifest = {
    v: 1,
    version,
    game: gameRound(),
    pak: { name: pakName, size: buf.length, sha256: pak.sha256(buf) },
    shell: {
      id: shellId(path.join(ROOT, 'electron'), ev),
      version,
      electron: ev,
      setup: asset(out, /^HUSH-Setup-[\d.]+\.exe$/),
      portable: asset(out, /^HUSH-[\d.]+-win-x64\.exe$/),
    },
    date: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(out, 'hush-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`pak ${pakName}: ${(buf.length / 1048576).toFixed(2)} MB, ${pak.read(buf).files.length} files`);
  console.log(`game ${manifest.game} · build ${version} · shell ${manifest.shell.id} (electron ${ev})`);
  console.log(`setup: ${manifest.shell.setup?.name || '—'} · portable: ${manifest.shell.portable?.name || '—'}`);
  return manifest;
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(String(e.message || e)); process.exit(1); }
}
module.exports = { main, gameRound, electronVersion };
