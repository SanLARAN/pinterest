// 3.0g: the menu now offers two участка. The ground is not a setting you can flip under a running shift — it
// is the world, built once at boot — so picking the one that is not loaded is a reload with it in the URL, and
// the shift starts on arrival. These check the rules of that hand-off, and the strings the panels show.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAP_IDS, cleanMap, runUrl, needsReload, MAP_KEY } from '../src/core/maps.js';
import { cleanLobbyRules } from '../src/net/lobbyRules.js';
import { t, setLang } from '../src/core/i18n.js';

// setLang touches <html lang>: a stub is all this needs (the same trick round30c needed for a sprite)
globalThis.document = globalThis.document || { documentElement: {}, createElement: () => ({ getContext: () => null, style: {} }), addEventListener() {} };

test('two участка, and anything that is not the bog is the forest', () => {
  assert.deepEqual(MAP_IDS, ['forest', 'bog']);
  assert.equal(cleanMap('bog'), 'bog');
  for (const v of [undefined, null, '', 'forest', 'FOREST', 'peat', 1, {}]) assert.equal(cleanMap(v), 'forest');
  assert.equal(MAP_KEY.bog, 'mapBog');
  assert.equal(MAP_KEY.forest, 'mapForest');
});

test('a reload carries the участок, the shift length and the hand-off to start', () => {
  // the forest is the default: no map in the URL
  const f = runUrl('forest', 4);
  assert.equal(f, '?autostart=&days=4');
  const b = new URLSearchParams(runUrl('bog', 6).slice(1));
  assert.equal(b.get('map'), 'bog');
  assert.equal(b.get('days'), '6');
  assert.ok(b.has('autostart'), 'the shift starts on arrival, not at a second menu');
  // a bad length is not written at all
  assert.equal(new URLSearchParams(runUrl('bog', 5).slice(1)).has('days'), false);
  // and the base path survives (Pages serves from a subdirectory)
  assert.equal(runUrl('bog', 4, '/pinterest/'), '/pinterest/?map=bog&autostart=&days=4');
});

test('a shift only reloads when the ground it wants is not the one loaded', () => {
  assert.equal(needsReload('bog', 'forest'), true);
  assert.equal(needsReload('forest', 'bog'), true);
  assert.equal(needsReload('bog', 'bog'), false);
  assert.equal(needsReload(undefined, 'forest'), false);
});

test('the room plays on the host\'s ground, and it is not a rule anyone can flip', () => {
  assert.equal(cleanLobbyRules({ map: 'bog' }).map, 'bog');
  for (const v of [null, {}, { map: 'swamp' }, { map: 2 }]) assert.equal(cleanLobbyRules(v).map, 'forest');
  // the rest of the rules are unchanged by the new field
  const r = cleanLobbyRules({ hideNames: true, days: 2, map: 'bog' });
  assert.deepEqual(r, { hideNames: true, days: 2, map: 'bog' });
});

test('both panels and both languages name the two участка', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('data-map="forest"') && html.includes('data-map="bog"'), 'the solo panel offers both');
  for (const lang of ['ru', 'en']) {
    setLang(lang);
    for (const key of ['mapForest', 'mapBog', 'mapForestHint', 'mapBogHint', 'ruleMap']) {
      const s = t(key);
      assert.ok(s && s !== key, `${lang}: ${key} is translated`);
    }
    assert.notEqual(t('mapForest'), t('mapBog'));
    // (5.0a) the second ground is told in chapters: each has a name and a goal in both languages
    assert.ok(t('l2Ch').includes('{n}'));
    for (const id of ['convoy', 'road', 'crash', 'village', 'generator', 'escape', 'cliff']) {
      assert.notEqual(t('l2_' + id), 'l2_' + id, `${lang}: chapter ${id} has a name`);
      assert.notEqual(t('l2Goal_' + id), 'l2Goal_' + id, `${lang}: chapter ${id} has a goal`);
    }
  }
  setLang('ru');
});
