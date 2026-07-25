import { defineConfig } from 'vite';

export default defineConfig({
  server: { host: true, port: 5173 },
  build: {
    target: 'es2019',
    // Keep the bundle small: the site must load on degraded 4G during an outage.
    chunkSizeWarningLimit: 600,
  },
});
