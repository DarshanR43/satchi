import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxyTarget = 'http://127.0.0.1:8000';
const backendPrefixes = ['/api', '/user', '/events', '/eval', '/admin'];

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: Object.fromEntries(
      backendPrefixes.map((prefix) => [
        prefix,
        {
          target: proxyTarget,
          changeOrigin: true,
        },
      ]),
    ),
  },
});
