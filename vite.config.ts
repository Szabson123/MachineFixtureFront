import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/unlinker-micro': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
        secure: false,
      },
      '/mes': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});