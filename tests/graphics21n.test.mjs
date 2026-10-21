import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanGraphics, effectiveGraphics, GRAPHICS_DEFAULTS, GRAPHICS_FIELDS } from '../src/render/graphicsSettings.js';
import { qualityPlan } from '../src/render/quality.js';
import { setLang, t } from '../src/core/i18n.js';
import { Post } from '../src/render/post.js';
import { saveDevice, readDevice, setScope } from '../src/core/persistence.js';
import { defaultSettings, reloadStorageState, settings } from '../src/core/storage.js';
import { cleanSettings } from '../src/cloud/snapshot.js';

const custom = overrides => ({ ...GRAPHICS_DEFAULTS, enabled: true, ...overrides });

test('advanced graphics are opt-in: disabled values cannot change any existing preset', () => {
  for (const quality of ['high', 'auto', 'low']) {
    const base = qualityPlan(quality, 1280, 800, 2);
    const disabled = qualityPlan(quality, 1280, 800, 2, 16384, false, { scale: .5, bloom: 0, aa: 'fxaa' });
    assert.deepEqual(disabled, base);
  }
  assert.deepEqual(effectiveGraphics({ enabled: false, exposure: 1.6, bloom: 0 }), GRAPHICS_DEFAULTS);
});

test('untrusted stored values are typed, clamped and whitelisted', () => {
  const g = cleanGraphics({ enabled: 'yes', scale: 999, pixelBudget: -1, exposure: NaN, aa: 'msaa4',
    bloom: Infinity, showFPS: 'true', shadows: false, targetFPS: 1000, unknown: 42 });
  assert.equal(g.enabled, false); assert.equal(g.scale, 2); assert.equal(g.pixelBudget, 1);
  assert.equal(g.exposure, 1); assert.equal(g.aa, 'off'); assert.equal(g.bloom, 1);
  assert.equal(g.showFPS, false); assert.equal(g.shadows, false); assert.equal(g.targetFPS, 60);
  assert.equal('unknown' in g, false);
  for (const input of [null, [], 5, 'bad']) assert.deepEqual(cleanGraphics(input), GRAPHICS_DEFAULTS);
});

test('custom scale and budget reach the real render plan, without enabling HDR MSAA', () => {
  const p = qualityPlan('low', 1280, 800, 2, 16384, false, custom({ scale: 1.5, pixelBudget: 2, aa: 'fxaa' }));
  assert.ok(p.maxScale < 1.5); assert.ok(1280 * 800 * p.maxScale ** 2 <= 2e6 + .01);
  assert.equal(p.minScale, p.maxScale); assert.equal(p.fxaa, true);
  const post = new Post({}); post.setSamples(4); post.setSize(1280, 800, p.maxScale);
  assert.equal(post.rtScene.samples, 0);
});

test('custom adaptation and target FPS are explicit even over the high preset', () => {
  const p = qualityPlan('high', 1280, 800, 2, 16384, false, custom({ dynamic: true, targetFPS: 90, aa: 'off' }));
  assert.equal(p.adaptive, true); assert.equal(p.targetFPS, 90); assert.equal(p.minScale, .5);
  assert.equal(p.fxaa, false);
});

test('custom 8 MP requests still obey GPU dimensions and context recovery', () => {
  const p = qualityPlan('high', 4000, 1000, 2, 2048, false, custom({ pixelBudget: 8 }));
  assert.ok(4000 * p.maxScale <= 2048); assert.ok(4000 * p.outputScale <= 2048);
  const safe = qualityPlan('high', 1280, 800, 2, 16384, true, custom({ scale: .5 }));
  assert.ok(safe.maxScale <= .5, 'recovery must never increase a small custom target');
});

test('post effects use independent multipliers and cannot overwrite game danger/fade state', () => {
  const p = new Post({}); p.u.uDanger.value = .75; p.u.uFade.value = .2; p.u.uBloom.value = .8;
  p.setGraphics(custom({ exposure: 1.3, bloom: 0, grain: .2, aberration: 0, vignette: .4, scanlines: false, flicker: false }));
  assert.equal(p.u.uUserExposure.value, 1.3); assert.equal(p.u.uUserBloom.value, 0);
  assert.equal(p.u.uUserGrain.value, .2); assert.equal(p.u.uUserAberr.value, 0);
  assert.equal(p.u.uUserVignette.value, .4); assert.equal(p.u.uUserScanlines.value, 0); assert.equal(p.u.uUserFlicker.value, 0);
  assert.equal(p.u.uDanger.value, .75); assert.equal(p.u.uFade.value, .2); assert.equal(p.u.uBloom.value, .8);
  p.setGraphics({ enabled: false, exposure: 1.6, grain: 0 });
  assert.equal(p.u.uUserExposure.value, 1); assert.equal(p.u.uUserGrain.value, 1);
});

test('zero bloom really skips all five bloom GPU passes, and resetting restores them', () => {
  const p = new Post({ setRenderTarget() {}, clear() {}, render() {} });
  const passes = []; p._pass = (mat) => passes.push(mat);
  p.setGraphics(custom({ bloom: 0 })); p.render({}, {});
  assert.deepEqual(passes, [p.comp]);
  passes.length = 0; p.setGraphics(GRAPHICS_DEFAULTS); p.render({}, {});
  assert.equal(passes.length, 6); assert.equal(passes[0], p.bright); assert.equal(passes.at(-1), p.comp);
});

test('graphics stay on the device across account switches and are excluded from cloud payloads', () => {
  setScope('guest');
  const g = custom({ grain: 0, showFPS: true }); saveDevice({ quality: 'high', graphics: g });
  assert.deepEqual(readDevice().graphics, g);
  setScope('11111111-2222-4333-8444-555555555555'); reloadStorageState();
  assert.deepEqual(settings.graphics, g);
  assert.equal('graphics' in cleanSettings({ graphics: g }), false);
  setScope('guest');
});

test('reset defaults are independent objects and each visible field has a validated default', () => {
  const a = defaultSettings(), b = defaultSettings(); a.graphics.enabled = true;
  assert.equal(b.graphics.enabled, false);
  for (const f of GRAPHICS_FIELDS) assert.ok(f.key in GRAPHICS_DEFAULTS, f.key);
  assert.equal(GRAPHICS_FIELDS.length, 14);
});

test('every advanced field has RU and genuine EN labels and hints', () => {
  const old = globalThis.document; globalThis.document = { documentElement: {} };
  try {
    setLang('ru'); assert.equal(t('gxTitle'), 'Расширенные настройки графики');
    for (const f of GRAPHICS_FIELDS) {
      for (const suffix of ['', 'Hint']) assert.notEqual(t('gx_' + f.key + suffix), 'gx_' + f.key + suffix);
    }
    setLang('en'); assert.equal(t('gxTitle'), 'Advanced graphics settings');
    for (const f of GRAPHICS_FIELDS) {
      for (const suffix of ['', 'Hint']) assert.doesNotMatch(t('gx_' + f.key + suffix), /[А-Яа-яЁё]/);
    }
  } finally { setLang('ru'); globalThis.document = old; }
});

test('FPS diagnostics use elapsed wall time and can report below the simulation clamp floor', () => {
  const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const start = source.indexOf('function measureFPS(now) {');
  const end = source.indexOf("document.addEventListener('visibilitychange'", start);
  assert.ok(start > 0 && end > start);
  const context = vm.createContext({ perf: { fpsEl: null } });
  vm.runInContext(source.slice(start, end), context);
  context.measureFPS(1000); context.measureFPS(3500);
  assert.equal(context.perf.fps, .4);
  assert.equal(context.perf.measured, true);
});
