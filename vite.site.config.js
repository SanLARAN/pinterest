import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// The landing page (site/): its own small build next to the game. GitHub Pages serves it at /pinterest/site/,
// one level under the game, so every link back into the game is relative ('../'). It imports the game's own
// modules (the renderer, the atlas, the config, the patch notes) straight from src/, so it never drifts from them.
// In development the game's own server already serves it: `npm run dev` → http://localhost:5173/site/.
export default defineConfig({
  root: fileURLToPath(new URL('./site', import.meta.url)),
  base: './',
  publicDir: false,
  build: {
    outDir: fileURLToPath(new URL('./dist/site', import.meta.url)),
    emptyOutDir: true,
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
  },
});
