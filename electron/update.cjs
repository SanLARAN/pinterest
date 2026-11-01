// Which build is newer, and which file to take from a GitHub release — pure, so it can be tested without
// Electron, a network or a Windows machine (tests/round30m.test.mjs).
//
// The desktop build is a single portable .exe on the releases page (see .github/workflows/desktop.yml: every
// arena/* tag packs one and attaches it). This file answers two questions:
//   · is the release newer than what is running?
//   · which of its assets is the Windows x64 portable?
const REPO = 'SanLARAN/pinterest';
const API = `https://api.github.com/repos/${REPO}/releases?per_page=10`;
const PAGE = `https://github.com/${REPO}/releases`;

// "3.0n" / "v3.0n" / "3.0.4" → [3, 0, 4]; anything else → []
function parts(v) {
  const m = String(v || '').trim().replace(/^v/i, '').match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  return m ? [Number(m[1]), Number(m[2] || 0), Number(m[3] || 0)] : [];
}

function compare(a, b) {
  const A = parts(a), B = parts(b);
  if (!A.length || !B.length) return 0;
  for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] > B[i] ? 1 : -1;
  return 0;
}

const isNewer = (candidate, running) => compare(candidate, running) > 0;

// the portable Windows build of a release: the .exe asset, whatever electron-builder named it
function pickAsset(release, { platform = 'win32', arch = 'x64' } = {}) {
  if (!release || !Array.isArray(release.assets)) return null;
  const exe = release.assets.filter((a) => /\.exe$/i.test(a.name || ''));
  if (!exe.length) return null;
  const want = exe.find((a) => new RegExp(`${arch}`, 'i').test(a.name)) || exe[0];
  return { name: want.name, url: want.browser_download_url, size: want.size | 0 };
}

// the version a portable build carries: electron-builder names it HUSH-1.0.47-win-x64.exe out of package.json,
// and the workflow stamps the run number into that version, so the file name is the honest source of truth
// (tag names like `arena/live47` say nothing about which build is inside)
function versionOf(release, asset) {
  const fromAsset = String(asset?.name || '').match(/(\d+\.\d+\.\d+)/);
  if (fromAsset) return fromAsset[1];
  const fromTag = String(release?.tag_name || '').match(/(\d+\.\d+\.\d+)/);
  if (fromTag) return fromTag[1];
  const fromBody = String(release?.body || '').match(/(\d+\.\d+\.\d+)/);
  return fromBody ? fromBody[1] : String(release?.tag_name || '').replace(/^arena\//, '');
}

// a release as the updater needs it: which version, what to download, and the notes to show
function cleanRelease(release, running, opts) {
  if (!release || release.draft || release.prerelease) return null;
  const asset = pickAsset(release, opts);
  if (!asset) return null;
  const version = versionOf(release, asset);
  return {
    version,
    tag: release.tag_name || version,
    newer: isNewer(version, running),
    asset,
    page: release.html_url || PAGE,
    notes: String(release.body || '').split('\n').slice(0, 12).join('\n'),
    published: release.published_at || null,
  };
}

// the first release in the list that actually carries a build, newest first
function bestRelease(list, running, opts) {
  if (!Array.isArray(list)) return null;
  for (const r of list) {
    const c = cleanRelease(r, running, opts);
    if (c) return c;
  }
  return null;
}

// ---------------------------------------------------------------- 3.1d: the launcher's manifest
// Every release carries hush-manifest.json (scripts/pack-game.cjs writes it in CI): which game is inside, the
// .pak with its size and hash, and the shell (its fingerprint, the installer, the portable exe). The launcher
// fetches it from «the latest release» and takes nothing from it on trust: names, sizes and hashes are checked
// here, and every download URL is built from our own repository, never read from the file.
const LATEST = `https://github.com/${REPO}/releases/latest/download/`;
const MANIFEST_URL = `${LATEST}hush-manifest.json`;
const VERSION = /^\d+\.\d+\.\d+$/;
const HASH = /^[0-9a-f]{64}$/;

function cleanAsset(a, ext, maxMb) {
  if (!a || typeof a !== 'object') return null;
  const name = String(a.name || '');
  if (!new RegExp(`^[A-Za-z0-9._-]{1,120}\\.${ext}$`).test(name)) return null;
  const size = Number(a.size);
  if (!Number.isInteger(size) || size <= 0 || size > maxMb * 1024 * 1024) return null;
  if (!HASH.test(String(a.sha256 || ''))) return null;
  return { name, size, sha256: a.sha256, url: LATEST + encodeURIComponent(name) };
}

function cleanManifest(raw) {
  if (!raw || typeof raw !== 'object' || raw.v !== 1) return null;
  if (!VERSION.test(String(raw.version || ''))) return null;
  const game = cleanAsset(raw.pak, 'pak', 200);
  if (!game) return null;
  const s = raw.shell && typeof raw.shell === 'object' ? raw.shell : {};
  const shell = {
    id: /^[0-9a-f]{16}$/.test(String(s.id || '')) ? s.id : null,
    version: VERSION.test(String(s.version || '')) ? s.version : null,
    setup: cleanAsset(s.setup, 'exe', 400),
    portable: cleanAsset(s.portable, 'exe', 400),
  };
  return {
    version: raw.version,
    game: String(raw.game || '').slice(0, 16),
    pak: game,
    shell,
    date: typeof raw.date === 'string' ? raw.date.slice(0, 32) : null,
  };
}

// what to do with a manifest: { game: bool (download the new game), shell: 'setup' | 'portable' | null }
function plan(m, { gameVersion, shellId, mode }) {
  if (!m) return { game: false, shell: null };
  const game = isNewer(m.version, gameVersion);
  let shell = null;
  if (m.shell.id && shellId && m.shell.id !== shellId) {
    if (mode === 'nsis' && m.shell.setup) shell = 'setup';
    else if (mode === 'portable' && m.shell.portable) shell = 'portable';
  }
  return { game, shell };
}

module.exports = { REPO, API, PAGE, LATEST, MANIFEST_URL, parts, compare, isNewer, pickAsset, versionOf, cleanRelease, bestRelease, cleanAsset, cleanManifest, plan };
