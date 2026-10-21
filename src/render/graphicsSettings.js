// Device-local, validated advanced graphics. Disabled by default: existing presets remain unchanged.
export const GRAPHICS_DEFAULTS = Object.freeze({ enabled: false, scale: 2, pixelBudget: 4.4,
  dynamic: false, targetFPS: 60, aa: 'off', exposure: 1, bloom: 1, grain: 1, aberration: 1,
  vignette: 1, scanlines: true, flicker: true, shadows: true, showFPS: false });
export const GRAPHICS_FIELDS = [
  { key: 'scale', group: 'resolution', min: .5, max: 2, step: .05, unit: 'scale' },
  { key: 'pixelBudget', group: 'resolution', min: 1, max: 8, step: .2, unit: 'mp' },
  { key: 'dynamic', group: 'resolution', type: 'check' },
  { key: 'targetFPS', group: 'resolution', type: 'select', options: [30, 45, 60, 90, 120] },
  { key: 'aa', group: 'resolution', type: 'select', options: ['off', 'fxaa'] },
  { key: 'exposure', group: 'light', min: .6, max: 1.6, step: .05 },
  { key: 'bloom', group: 'light', min: 0, max: 1.5, step: .05 },
  { key: 'vignette', group: 'light', min: 0, max: 1, step: .05 },
  { key: 'grain', group: 'film', min: 0, max: 1.5, step: .05 },
  { key: 'aberration', group: 'film', min: 0, max: 1.5, step: .05 },
  { key: 'scanlines', group: 'film', type: 'check' },
  { key: 'flicker', group: 'film', type: 'check' },
  { key: 'shadows', group: 'system', type: 'check' },
  { key: 'showFPS', group: 'system', type: 'check' },
];
export function cleanGraphics(raw) {
  const v = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = { ...GRAPHICS_DEFAULTS };
  for (const k of ['enabled', 'dynamic', 'scanlines', 'flicker', 'shadows', 'showFPS']) {
    if (typeof v[k] === 'boolean') out[k] = v[k];
  }
  for (const f of GRAPHICS_FIELDS) {
    if (f.type || !Number.isFinite(v[f.key])) continue;
    out[f.key] = Math.max(f.min, Math.min(f.max, v[f.key]));
  }
  if ([30, 45, 60, 90, 120].includes(v.targetFPS)) out.targetFPS = v.targetFPS;
  if (['off', 'fxaa'].includes(v.aa)) out.aa = v.aa;
  return out;
}
export function effectiveGraphics(raw) {
  const g = cleanGraphics(raw);
  return g.enabled ? g : { ...GRAPHICS_DEFAULTS };
}
