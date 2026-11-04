// (4.0) The camera's film, kept. An IndexedDB store that the game writes at the end of a shift («в альбом») and the
// site's album reads — one origin: the game at /pinterest/, the site at /pinterest/site/. And a .zip of the frames for
// «скачать»: stored, not deflated (a JPEG would not get smaller), written here — the project takes no dependencies.
// Everything but the IndexedDB calls is pure and runs in node (tests/round40c.test.mjs).

export const PHOTO_DB = 'hush-photos';
export const PHOTO_STORE = 'photos';
export const PHOTO_DB_V = 1;
export const ALBUM_MAX = 400; // frames the album keeps (the oldest go first): a JPEG is ~60 KB, so ~25 MB at most

// what one frame carries besides its picture (never trust a stored one blindly: the site reads what the game wrote)
export function cleanMeta(m = {}) {
  const num = (v, lo, hi, d = 0) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d);
  return {
    at: Math.round(num(m.at, 0, 8.64e15, Date.now())),
    shift: Math.round(num(m.shift, 0, 8.64e15, 0)), // when the shift began: the album groups by it
    day: Math.round(num(m.day, 1, 99, 1)),
    days: Math.round(num(m.days, 1, 99, 1)),
    t: Math.round(num(m.t, 0, 36000, 0)), // s into that night (or morning)
    map: m.map === 'bog' ? 'bog' : 'forest',
    phase: ['night', 'morning', 'dawn', 'dusk', 'training'].includes(m.phase) ? m.phase : 'night',
    w: Math.round(num(m.w, 1, 8192, 1)),
    h: Math.round(num(m.h, 1, 8192, 1)),
    watcher: !!m.watcher, // the Watcher was driven off by this flash
    coop: Math.round(num(m.coop, 0, 8, 0)),
  };
}

const two = (n) => String(n).padStart(2, '0');
// hush-2026-11-04-n2-0241-3.jpg: the date, the night, the night's clock, the frame
export function photoName(meta, i = 1) {
  const m = cleanMeta(meta), d = new Date(m.at);
  const clock = `${two(Math.floor(m.t / 60))}${two(m.t % 60)}`;
  return `hush-${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}-${m.map === 'bog' ? 'bog-' : ''}n${m.day}-${clock}-${i}.jpg`;
}
export function zipName(at = Date.now()) {
  const d = new Date(at);
  return `hush-shift-${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}.zip`;
}
// the way those cameras printed it in the corner of the frame
export function dateStamp(at = Date.now()) {
  const d = new Date(at);
  return `'${two(d.getFullYear() % 100)} ${two(d.getMonth() + 1)} ${two(d.getDate())}`;
}

// ---------------- the .zip ----------------
const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
const dosTime = (d) => ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff;
const dosDate = (d) => ((Math.max(0, d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;

// [{ name, data: Uint8Array, date? }] → the bytes of a whole .zip (method 0, UTF-8 names)
export function zipStore(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  let off = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = f.data, crc = crc32(data);
    const d = f.date instanceof Date ? f.date : new Date(f.date || Date.now()), tm = dosTime(d), dt = dosDate(d);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true); // the name is UTF-8
    lh.setUint16(8, 0, true); // stored
    lh.setUint16(10, tm, true);
    lh.setUint16(12, dt, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, tm, true);
    ch.setUint16(14, dt, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true);
    ch.setUint32(24, data.length, true);
    ch.setUint16(28, name.length, true);
    ch.setUint32(42, off, true); // (extra, comment, disk, attributes: all zero)
    central.push(new Uint8Array(ch.buffer), name);
    off += 30 + name.length + data.length;
  }
  const cd = central.reduce((s, p) => s + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cd, true);
  end.setUint32(16, off, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of all) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

// a list of frames ({ blob, meta }) as one .zip Blob
export async function zipPhotos(list) {
  const files = [];
  let i = 0;
  for (const p of list) {
    if (!p?.blob) continue;
    const data = new Uint8Array(await p.blob.arrayBuffer());
    files.push({ name: photoName(p.meta, ++i), data, date: new Date(cleanMeta(p.meta).at) });
  }
  return new Blob([zipStore(files)], { type: 'application/zip' });
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------------- the album (IndexedDB) ----------------
export function openPhotos(idb = globalThis.indexedDB) {
  if (!idb) return Promise.reject(new Error('no IndexedDB'));
  return new Promise((res, rej) => {
    const r = idb.open(PHOTO_DB, PHOTO_DB_V);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) db.createObjectStore(PHOTO_STORE, { keyPath: 'id', autoIncrement: true }).createIndex('at', 'at');
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error || new Error('open failed'));
    r.onblocked = () => rej(new Error('blocked'));
  });
}
function done(tx, db, value) {
  return new Promise((res, rej) => {
    tx.oncomplete = () => { db.close(); res(typeof value === 'function' ? value() : value); };
    tx.onerror = tx.onabort = () => { db.close(); rej(tx.error || new Error('transaction failed')); };
  });
}
// [{ blob, meta }] → their ids (all in one transaction: either the whole film goes in, or none of it)
export async function savePhotos(list) {
  const db = await openPhotos();
  const tx = db.transaction(PHOTO_STORE, 'readwrite'), st = tx.objectStore(PHOTO_STORE), ids = [];
  for (const p of list) {
    if (!(p?.blob instanceof Blob)) continue;
    const r = st.add({ blob: p.blob, ...cleanMeta(p.meta) });
    r.onsuccess = () => ids.push(r.result);
  }
  const out = await done(tx, db, () => ids);
  trimAlbum().catch(() => {});
  return out;
}
// newest first
export async function listPhotos() {
  const db = await openPhotos();
  const tx = db.transaction(PHOTO_STORE, 'readonly');
  const r = tx.objectStore(PHOTO_STORE).getAll();
  let rows = [];
  r.onsuccess = () => { rows = r.result || []; };
  await done(tx, db);
  return rows.filter((p) => p && p.blob instanceof Blob).map((p) => ({ id: p.id, blob: p.blob, meta: cleanMeta(p) })).sort((a, b) => b.meta.at - a.meta.at || b.id - a.id);
}
export async function deletePhoto(id) {
  const db = await openPhotos();
  const tx = db.transaction(PHOTO_STORE, 'readwrite');
  tx.objectStore(PHOTO_STORE).delete(id);
  return done(tx, db, true);
}
export async function clearPhotos() {
  const db = await openPhotos();
  const tx = db.transaction(PHOTO_STORE, 'readwrite');
  tx.objectStore(PHOTO_STORE).clear();
  return done(tx, db, true);
}
async function trimAlbum() {
  const rows = await listPhotos();
  for (const p of rows.slice(ALBUM_MAX)) await deletePhoto(p.id);
}
