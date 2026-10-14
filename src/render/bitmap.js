// Bitmap look for the 3D world: posterized shading with an ordered (Bayer) dither, which
// reads as pixel-art gradients, plus a wind-sway vertex pass for foliage and a banded sky.
import * as THREE from 'three';
import { vertexMaterial } from './geo.js';

/** Shared across every bitmap material so one update animates the whole world. */
export const bitmapUniforms = {
  uTime: { value: 0 },
  uLevels: { value: 6 }, // colour levels per channel; lower = chunkier bands
};

const BAYER_GLSL = /* glsl */ `
float bitmapBayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bitmapBayer4(vec2 a) { return bitmapBayer2(0.5 * a) * 0.25 + bitmapBayer2(a); }
`;

/**
 * Vertex-coloured Lambert material with posterize + dither. `sway` > 0 adds wind motion
 * weighted by height, so tall foliage moves and the ground stays put.
 */
export function bitmapMaterial({ sway = 0 } = {}) {
  const mat = vertexMaterial();
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = bitmapUniforms.uTime;
    shader.uniforms.uLevels = bitmapUniforms.uLevels;
    shader.uniforms.uSway = { value: sway };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uSway;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        if (uSway > 0.0) {
          float h = clamp(position.y / 3.0, 0.0, 1.0);
          float ph = position.x * 0.9 + position.z * 0.7;
          transformed.x += sin(uTime * 1.7 + ph) * 0.09 * h * uSway;
          transformed.z += cos(uTime * 1.3 + ph * 0.8) * 0.07 * h * uSway;
        }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uLevels;\n${BAYER_GLSL}`)
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        {
          // colour bands only: no screen-wide Bayer dot grid (the fog frame is the only grid)
          float L = uLevels;
          gl_FragColor.rgb = floor(gl_FragColor.rgb * L + 0.5) / L;
        }`,
      );
  };
  mat.customProgramCacheKey = () => `bitmap-${sway > 0 ? 'sway' : 'flat'}`;
  return mat;
}

/** Vertical gradient sky, banded to a few hard steps (nearest-filtered, so it stays pixelated). */
export function bandedSkyTexture(stops) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const c = mix(stops, t);
    ctx.fillStyle = c;
    ctx.fillRect(0, (i / steps) * canvas.height, 2, canvas.height / steps + 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function mix(stops, t) {
  const n = stops.length - 1;
  const f = Math.min(0.9999, t) * n;
  const i = Math.floor(f);
  const a = new THREE.Color(stops[i]);
  const b = new THREE.Color(stops[i + 1]);
  a.lerp(b, f - i);
  return `#${a.getHexString()}`;
}
