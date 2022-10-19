import { join } from 'path'
import { defineConfig } from 'vite';
import { viteMockServe } from 'vite-plugin-mock';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteMockServe({
      mockPath: '/mock',
    }),
  ],
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
    }
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:8000',
      }
    }
  },
  // 引入全局scss变量
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/style/variables.scss";`
      }
    }
  }
});
