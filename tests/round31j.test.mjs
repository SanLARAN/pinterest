// 3.1j: «переделай кнопки в главном меню по стилю и удобству + магазин». The title screen was four same-size boxes
// with the way to play barely brighter than the wardrobe, links in 8 px type (down to 6 on phones), the shop's own
// entry hidden, and four stylesheets fighting over the column. Now one list — ОДНОМУ first and biggest, С ДРУЗЬЯМИ,
// a rule, ПОЛИГОН, ГАРДЕРОБ, МАГАЗИН with your shards — styled in one file, walkable with ↑/↓, nothing under 11 px;
// the shop panel says «Магазин», its four tabs fit, and its small print is readable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const sizes = (css) => [...css.matchAll(/font(?:-size)?:[^;]*?(\d+(?:\.\d+)?)px/g)].map((m) => +m[1]);

test('the home list: the way to play first, the shop back with your shards, the small print in the footer', () => {
  const html = src('index.html');
  const list = html.slice(html.indexOf('<nav class="home-list" id="homeList">'), html.indexOf('</nav>', html.indexOf('id="homeList"')));
  const order = [...list.matchAll(/class="home-item[^"]*" id="(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(order, ['btnPlay', 'btnCoop', 'btnRange', 'btnWardrobe', 'btnShop']);
  assert.match(list, /class="home-item primary" id="btnPlay"/, 'ОДНОМУ is the primary line');
  assert.match(list, /id="btnShop"[^>]*>.*id="walletMenu"/, 'the shop line carries the wallet');
  assert.ok(list.indexOf('home-rule') > list.indexOf('btnCoop') && list.indexOf('home-rule') < list.indexOf('btnRange'), 'a rule between playing and the rest');
  assert.match(list, /id="figStage" hidden/, 'the wardrobe\'s mannequin host stays (wardrobe.js attaches to it)');
  const links = html.slice(html.indexOf('<nav class="menu-links">'), html.indexOf('</nav>', html.indexOf('<nav class="menu-links">')));
  assert.doesNotMatch(links, /lnkPrivacy|btnShop/, 'three links under the list, nothing else');
  const foot = html.slice(html.indexOf('<div class="menu-foot">'), html.indexOf('</div>', html.indexOf('<aside id="news"')));
  assert.match(foot, /id="lnkPrivacy"/, 'the privacy page sits in the footer, still on the home screen');
});

test('one stylesheet owns the column, loaded last; nothing on the title screen under 11 px', () => {
  const main = src('src/main.js');
  assert.ok(main.indexOf("import './home-menu.css'") > main.indexOf("import './social.css'"), 'after social.css');
  const css = src('src/home-menu.css');
  assert.ok(Math.min(...sizes(css)) >= 11, `home-menu.css: smallest ${Math.min(...sizes(css))}px`);
  for (const f of ['src/garage-home.css', 'src/social.css', 'src/cloud.css']) {
    assert.doesNotMatch(src(f), /\.menu-main|\.menu-links|#menu \.title\b|#micPanel \{/, `${f} no longer styles the column`);
  }
  assert.ok(Math.min(...sizes(src('src/garage-home.css'))) >= 10, 'the garage panels (wardrobe, shop, footer) went down to 5 px');
  assert.match(css, /#menu \.menu-wrap > #socialDock \{ position: relative;[^}]*margin-top: auto;/, 'the friends corner flows under the list: no guessed heights to collide');
  assert.match(css, /\.home-list:not\(\.kbd\) \.home-item:hover/, 'one lit line: a resting mouse steps aside while the keyboard drives');
});

test('↑/↓ walk the list and wrap around', async () => {
  const menus = src('src/ui/menus.js');
  assert.match(menus, /\$\('homeList'\)/);
  assert.match(menus, /e\.key !== 'ArrowDown' && e\.key !== 'ArrowUp'/);
  assert.match(menus, /items\[\(i \+ \(e\.key === 'ArrowDown' \? 1 : items\.length - 1\)\) % items\.length\]/);
  assert.match(menus, /homeList\.classList\.add\('kbd'\)/);
  assert.match(menus, /addEventListener\('pointermove', \(\) => homeList\.classList\.remove\('kbd'\)\)/);
});

test('the shop panel: its own title, four tabs that fit, the wardrobe line names itself', () => {
  const w = src('src/ui/wardrobe.js');
  assert.match(w, /\$\('wrTitle'\)\.textContent = this\.slot === 'shop' \? T\.slot\.shop : T\.title;/);
  assert.match(w, /this\.btn\.querySelector\('\.hi-label'\)/);
  const g = src('src/garage-home.css');
  assert.match(g, /#wardrobePanel \.wr-slots \{ display:grid; grid-template-columns:repeat\(4,minmax\(0,1fr\)\);/);
  assert.match(g, /#wardrobePanel \.wr-title \{[^}]*text-transform:uppercase;/);
  assert.match(src('src/ui/news.js'), /class="news-tab" data-act="unfold" aria-label=/, 'the phone shows only the version: the button keeps its name');
});
