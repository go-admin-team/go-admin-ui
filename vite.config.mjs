import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { compression } from 'vite-plugin-compression2'
import path from 'path'

const resolve = dir => path.resolve(import.meta.dirname, dir)

export default defineConfig(({ mode }) => {
  // 同时加载 VITE_ 与 VUE_APP_ 前缀，保持与 Vue CLI 时期的 .env 文件兼容
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'VUE_APP_', 'NODE_'])

  return {
    base: '/',
    envPrefix: ['VITE_', 'VUE_APP_'],

    plugins: [
      vue(),
      // 替代 svg-sprite-loader，symbolId 保持 icon-[name] 不变
      createSvgIconsPlugin({
        iconDirs: [resolve('src/icons/svg')],
        symbolId: 'icon-[name]'
      }),
      // 替代 compression-webpack-plugin
      compression({
        algorithm: 'gzip',
        threshold: 10240,
        include: /\.(js|html|css)$/,
        deleteOriginalAssets: false
      })
    ],

    resolve: {
      alias: {
        '@': resolve('src'),
        // 业务代码（Sidebar/TagsView/HeaderSearch）直接 import path 拼接路由路径，
        // 浏览器无 Node 内置模块，需指向 polyfill；等价于 webpack 的 resolve.fallback
        path: 'path-browserify'
      },
      // 与 Vue CLI 保持一致：允许 import 时省略 .vue 后缀
      extensions: ['.mjs', '.js', '.jsx', '.json', '.vue']
    },

    // 业务代码沿用 process.env.VUE_APP_* 写法，此处做等价注入
    define: {
      'process.env.VUE_APP_BASE_API': JSON.stringify(env.VUE_APP_BASE_API || ''),
      'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production')
    },

    server: {
      port: 9527,
      open: false
    },

    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            'border-radius-base': '2px'
          }
        },
        scss: {
          silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin']
        }
      }
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          // 对应 Vue CLI 的 splitChunks：element-plus 与其余三方库分开打包
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (/[\\/]element-plus[\\/]/.test(id)) return 'chunk-elementPlus'
            return 'chunk-libs'
          },
          chunkFileNames: 'js/[name].[hash].js',
          entryFileNames: 'js/[name].[hash].js',
          assetFileNames: '[ext]/[name].[hash].[ext]'
        }
      }
    }
  }
})
