import '@fontsource/racing-sans-one/400.css';
import '@fontsource/russo-one/400.css';
import './styles.css';
import { Game } from './game.js';

function fatal(msg) {
  const el = document.getElementById('fatal');
  el.innerHTML = msg;
  el.classList.remove('hidden');
  document.getElementById('boot').classList.add('gone');
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (_) {
    return false;
  }
}

async function boot() {
  if (!hasWebGL()) {
    fatal('NOISE RALLY needs WebGL.<br>Please enable hardware acceleration or try another browser.');
    return;
  }
  // let the boot screen paint, wait for fonts (max 1.5s) so canvas text is right
  await new Promise((r) => requestAnimationFrame(() => r()));
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  } catch (_) { /* ignore */ }
  try {
    const game = new Game();
    window.__game = game;
  } catch (e) {
    console.error(e);
    fatal('Something went wrong starting the game.<br><small>' + String(e && e.message ? e.message : e) + '</small>');
    return;
  }
  document.getElementById('boot').classList.add('gone');
  // first user gesture unlocks audio
  const unlock = () => {
    if (window.__game) window.__game.audio.init();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

boot();
