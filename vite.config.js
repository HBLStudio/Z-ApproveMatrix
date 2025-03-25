import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    proxy: {
      '/feishu': {
        target: `https://open.feishu.cn`,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/feishu/, '')
      }
    }
  }
})
