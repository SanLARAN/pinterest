// Rendering policy, independent of the DOM/GL so quality cannot silently regress again.
// MSAA is deliberately absent: more single-sampled pixels do not need the broken HDR resolve.
const PIXELS = { high: 4.4e6, auto: 2.9e6, low: 1.2e6 };
export function qualityPlan(quality, width, height, devicePixelRatio = 1, maxSize = 16384, recovery = false) {
  const q = quality === 'high' || quality === 'low' ? quality : 'auto';
  const w = Math.max(1, Number.isFinite(width) ? width : 1);
  const h = Math.max(1, Number.isFinite(height) ? height : 1);
  const dpr = Math.min(2, Math.max(1, Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1));
  const edge = Math.max(1, Number.isFinite(maxSize) ? maxSize : 16384);
  const budget = recovery ? Math.min(PIXELS[q], 1.2e6) : PIXELS[q];
  const requested = recovery ? 1 : q === 'high' ? Math.max(1.5, dpr) : q === 'low' ? 0.55 : Math.min(1.5, dpr);
  const maxScale = Math.min(requested, Math.sqrt(budget / (w * h)), edge / w, edge / h);
  const adaptive = q === 'auto';
  return {
    // High is an explicit quality choice. Only AUTO trades detail away for frame time.
    minScale: adaptive ? Math.min(0.5, maxScale) : maxScale,
    maxScale,
    // A 1x monitor downsamples the high preset's 1.5x scene for spatial AA. Retina presents extra pixels.
    // Cap the default framebuffer too: never allocate a 2x 4K canvas behind a budget-limited scene.
    outputScale: Math.min(dpr, maxScale),
    adaptive,
    fxaa: adaptive, // do not blur the high preset's fine lines with three FXAA searches per pixel
  };
}
