import { defineConfig } from 'vite';

// The sandbox preview proxies this server under a dynamic *.e2b.app host, so the
// host allowlist must accept it for both the dev server and `vite preview`.
export default defineConfig({
  server: { host: '0.0.0.0', allowedHosts: true },
  preview: { host: '0.0.0.0', allowedHosts: true },
});
