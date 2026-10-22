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

module.exports = { REPO, API, PAGE, parts, compare, isNewer, pickAsset, versionOf, cleanRelease, bestRelease };
