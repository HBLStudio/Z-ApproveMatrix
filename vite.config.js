import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    proxy: mode === 'development' ? {
      '/feishu': {
        target: 'https://open.feishu.cn',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/feishu/, '')
      }
    } : undefined
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode) // 让 axios 代码可以识别环境变量
  }
}));
