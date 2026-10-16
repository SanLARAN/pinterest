/** Static UI wiring check: every element id the code asks for must exist in index.html,
 *  every data-i18n key must exist in the dictionary, and the built bundle must be current. */
import { readFileSync, existsSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { STR } from '../src/ui/i18n.js';

const root = join(import.meta.dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|mjs)$/.test(e)) files.push(p);
  }
})(join(root, 'src'));

// ids the code reaches for, either directly or through a local binding helper
const wanted = new Set();
// ids the code creates at runtime (getElementById then create-if-missing)
const created = new Set();
const literals = new Set();
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/getElementById\(\s*'([^']+)'/g)) wanted.add(m[1]);
  for (const m of s.matchAll(/\$\(\s*'([^']+)'\s*\)/g)) wanted.add(m[1]);
  for (const m of s.matchAll(/\.id\s*=\s*'([^']+)'/g)) created.add(m[1]);
  for (const m of s.matchAll(/'([A-Za-z][\w-]{1,24})'/g)) literals.add(m[1]);
}
const missing = [...wanted].filter((id) => !ids.has(id) && !created.has(id));
const unused = [...ids].filter((id) => !wanted.has(id) && !literals.has(id));

// i18n
const keys = new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]));
const badKeys = [...keys].filter((k) => !(k in STR.ru) || !(k in STR.en));
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  // i18n keys are ascii identifiers; tr('русский текст', ...) literals are not keys
  for (const m of s.matchAll(/(?:i18n|this)\.t\(\s*'([a-z][a-z0-9_.]*)'/g)) {
    if (!(m[1] in STR.ru) || !(m[1] in STR.en)) badKeys.push(m[1] + ' (' + f.split('/').pop() + ')');
  }
}

// shader integrity: every three.js chunk we #include must actually exist
const THREE = await import('three');
const chunks = THREE.ShaderChunk || {};
const badChunks = [];
let chunkRefs = 0;
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/#include\s*<([\w]+)>/g)) {
    chunkRefs++;
    if (!(m[1] in chunks)) badChunks.push(m[1] + ' (' + f.split('/').pop() + ')');
  }
}

// build freshness: every asset referenced by docs/index.html must exist
const docsIdx = join(root, 'docs', 'index.html');
let staleBuild = [];
if (existsSync(docsIdx)) {
  const d = readFileSync(docsIdx, 'utf8');
  for (const m of d.matchAll(/(?:src|href)="\.\/([^"]+)"/g)) {
    if (!existsSync(join(root, 'docs', m[1]))) staleBuild.push(m[1]);
  }
  const newestSrc = files.concat([join(root, 'index.html')]).reduce((a, f) => Math.max(a, statSync(f).mtimeMs), 0);
  const built = statSync(docsIdx).mtimeMs;
  if (newestSrc > built + 1000) staleBuild.push(`docs/index.html is older than src/ by ${((newestSrc - built) / 1000).toFixed(0)}s`);
} else staleBuild.push('docs/ is missing — run npm run build');

let bad = 0;
const say = (ok, label, extra = '') => { console.log(`  ${ok ? '✓' : '✗'} ${label}${extra ? ' ' + extra : ''}`); if (!ok) bad++; };
console.log('\n== UI WIRING ==');
console.log(`  ${ids.size} ids in index.html, ${wanted.size} referenced from src/, ${files.length} modules`);
say(missing.length === 0, 'every id the code asks for exists', missing.join(', '));
say(badKeys.length === 0, 'every i18n key is defined in RU and EN', [...new Set(badKeys)].join(', '));
say(badChunks.length === 0, `all ${chunkRefs} three.js shader chunks exist`, [...new Set(badChunks)].join(', '));
say(staleBuild.length === 0, 'docs/ build is present and current', staleBuild.join(' | '));
console.log(`  markup-only ids (styled by CSS, never touched by JS): ${unused.length ? unused.join(', ') : 'none'}`);
say(unused.every((id) => /^(app|fx)$/.test(id)), 'no markup is dead weight', unused.join(', '));
if (bad) { console.log(`\nUI CHECK FAILED (${bad})`); process.exit(1); }
console.log('\nUI CHECK OK');
