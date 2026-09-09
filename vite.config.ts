import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'path';

const useDevHttps = process.env.VITE_DEV_HTTPS === 'true';
const certificatePath = path.resolve(__dirname, './certs/dev-cert.pem');
const keyPath = path.resolve(__dirname, './certs/dev-key.pem');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
    ...(useDevHttps
      ? {
          https: {
            cert: fs.readFileSync(certificatePath),
            key: fs.readFileSync(keyPath),
          },
        }
      : {}),
  },
});
