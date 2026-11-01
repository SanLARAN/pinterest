import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// When GitHub Pages serves this branch as-is ("deploy from a branch"), the root index.html — the dev
// entry — redirects to the prebuilt game in ./play/. Built pages must not redirect (they ARE the
// game), so the snippet is stripped from every build.
const stripPagesRedirect = {
  name: 'strip-pages-redirect',
  transformIndexHtml: {
    order: 'pre',
    handler(html, ctx) {
      if (ctx.server) return html;
      return html.replace(/[ \t]*<script id="pages-redirect">[\s\S]*?<\/script>\s*\n?/, '');
    },
  },
};

export default defineConfig({
  base: './',
  plugins: [stripPagesRedirect],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    watch: { ignored: ['**/play/**'] },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
  // don't let the dependency scanner crawl the prebuilt copy in ./play
  optimizeDeps: { entries: ['index.html', 'launcher.html'] },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    // (3.1d) two pages: the game, and the desktop launcher (the first window the .exe opens)
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        launcher: fileURLToPath(new URL('./launcher.html', import.meta.url)),
      },
    },
  },
});
