// 3.1d: the shell's two network calls, without Electron: a small JSON (the release manifest) and a download that
// hashes what it writes as it writes it. GitHub's «latest release» URLs redirect twice (github.com → the asset
// store), so redirects are followed; http is allowed only so the tests can run a local server.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');

const UA = { 'User-Agent': 'HUSH-launcher' };
const lib = (url) => (url.startsWith('http:') ? http : https);

function request(url, { timeout = 15000, redirects = 5, accept = '*/*' } = {}) {
  return new Promise((resolve, reject) => {
    const go = (u, left) => {
      let req;
      try {
        req = lib(u).get(u, { headers: { ...UA, Accept: accept }, timeout }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            if (left <= 0) return reject(new Error('too_many_redirects'));
            return go(new URL(res.headers.location, u).href, left - 1);
          }
          if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
          resolve(res);
        });
      } catch (e) { return reject(e); }
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', reject);
    };
    go(url, redirects);
  });
}

async function getJson(url, opts = {}) {
  const res = await request(url, { ...opts, accept: 'application/json' });
  return new Promise((resolve, reject) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (c) => { body += c; if (body.length > 1e6) res.destroy(new Error('too_big')); });
    res.on('end', () => { try { resolve(JSON.parse(body)); } catch { reject(new Error('bad_json')); } });
    res.on('error', reject);
  });
}

// download to `dest` (via dest.part, renamed at the end): { file, size, sha256 }. Refuses more than maxBytes.
async function download(url, dest, { expected = 0, maxBytes = 500 * 1024 * 1024, onProgress = null, timeout = 30000 } = {}) {
  const res = await request(url, { timeout });
  const total = Number(res.headers['content-length'] || expected || 0);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const part = `${dest}.part`;
  const hash = crypto.createHash('sha256');
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(part);
    let got = 0, last = 0, failed = false;
    const fail = (e) => {
      if (failed) return;
      failed = true;
      res.destroy();
      out.destroy();
      fs.rm(part, { force: true }, () => reject(e));
    };
    res.on('data', (c) => {
      got += c.length;
      if (got > maxBytes) return fail(new Error('too_big'));
      hash.update(c);
      const now = Date.now();
      if (onProgress && (now - last > 150 || got === total)) { last = now; onProgress(total ? Math.min(1, got / total) : 0, got); }
    });
    res.on('error', fail);
    res.on('aborted', () => fail(new Error('aborted')));
    out.on('error', fail);
    out.on('finish', () => {
      if (failed) return;
      if (total && got !== total) return fail(new Error('short_download'));
      try { fs.rmSync(dest, { force: true }); fs.renameSync(part, dest); } catch (e) { return fail(e); }
      resolve({ file: dest, size: got, sha256: hash.digest('hex') });
    });
    res.pipe(out);
  });
}

module.exports = { request, getJson, download };
