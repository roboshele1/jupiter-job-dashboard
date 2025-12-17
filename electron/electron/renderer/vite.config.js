import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'renderer/src'),
      '@api': path.resolve(__dirname, 'api'),
      '@components': path.resolve(__dirname, 'renderer/src/components')
    }
  },
  server: {
    port: 5173,
  },
});

