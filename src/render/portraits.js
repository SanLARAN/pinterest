// Atlas portraits: a monster or boss is rendered once, offscreen, with the game's own renderer,
// and the result is cached as a PNG data URL. Items use their vector icons instead.
import * as THREE from 'three';
import { createEnemyModel } from './enemyModels.js';

/**
 * Renders one enemy model into a square PNG data URL.
 * `tint` and `accent` match how the boss is coloured in the arena (see game.js spawn).
 */
export function renderEnemyPortrait(renderer, type, { size = 160, tint = null, accent = null } = {}) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xdfe4ff, 0x3a2a4a, 2.2));
  const key = new THREE.DirectionalLight(0xfff2d8, 1.6);
  key.position.set(3, 6, 4);
  scene.add(key);

  const model = createEnemyModel(type);
  if (tint != null) model.mat.color.setHex(tint);
  if (accent != null && model.ring) model.ring.material.color.setHex(accent);
  model.root.position.set(0, 0, 0);
  scene.add(model.root);

  // frame the model: centre it on its bounds and back the camera off until it fits
  const box = new THREE.Box3().setFromObject(model.root);
  const centre = box.getCenter(new THREE.Vector3());
  const radius = Math.max(0.6, box.getSize(new THREE.Vector3()).length() * 0.5);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  cam.position.set(centre.x + radius * 0.35, centre.y + radius * 0.5, centre.z + radius * 2.6);
  cam.lookAt(centre);

  const target = new THREE.WebGLRenderTarget(size, size);
  const prevTarget = renderer.getRenderTarget();
  const prevClear = renderer.getClearColor(new THREE.Color());
  const prevAlpha = renderer.getClearAlpha();
  renderer.setRenderTarget(target);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(scene, cam);

  const px = new Uint8Array(size * size * 4);
  renderer.readRenderTargetPixels(target, 0, 0, size, size, px);
  renderer.setRenderTarget(prevTarget);
  renderer.setClearColor(prevClear, prevAlpha);

  // GL rows are bottom-up; flip them into a canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    img.data.set(px.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
  }
  ctx.putImageData(img, 0, 0);

  target.dispose();
  scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    // the red outline material is shared by every foe, so it is never disposed here
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (!m.isShaderMaterial) m.dispose(); });
  });
  return canvas.toDataURL('image/png');
}
