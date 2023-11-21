import { join } from 'path'
import { defineConfig } from 'vite';
import { viteMockServe } from 'vite-plugin-mock';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteMockServe({
      mockPath: '/mock',
    }),
    svgLoader(),
    viteMockServe({
      mockPath: '/mock',
    }),
    Components({
      resolvers: [VuetifyResolver()],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
    }),
  ],
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
    }
  },
  server: {
    host: true,
    port: 1798,
    proxy: {
      '/api/v1': {
        target: 'http://117.50.186.148:8000',
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
  },
  publicDir: '/public'
});
