import { defineConfig } from 'vite';

// Relative base so the build works from any GitHub Pages sub-path
// (https://user.github.io/repo/) as well as from file:// or a plain static server.
export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    target: 'es2020',
    modulePreload: { polyfill: false },
    assetsInlineLimit: 8192,
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          net: ['peerjs'],
        },
      },
    },
  },
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
});
