import { defineConfig } from 'vite';

// GitHub Pages serves this branch as-is ("deploy from a branch"), so the root index.html — the dev
// entry — carries a tiny redirect to the prebuilt game in ./play/. Built pages must not redirect
// (they ARE the game), so the snippet is stripped from every build.
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
  optimizeDeps: { entries: ['index.html'] },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
  },
});
