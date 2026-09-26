import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { svgSprite } from './build/svg-sprite.mjs'
import { compression } from 'vite-plugin-compression2'
import path from 'path'
import { readdirSync } from 'node:fs'

const resolve = dir => path.resolve(import.meta.dirname, dir)

/**
 * Puts the Google Analytics tag at the top of <head>, and only when there is a
 * measurement id to put there.
 *
 * The id gates the whole thing because googletagmanager.com is an external host
 * and this project is deployed to intranets and offline networks, where a build
 * must not reach for one. With VUE_APP_GA_ID unset -- which is how every .env
 * in the repository ships -- nothing below runs and the built index.html has no
 * trace of analytics in it. The demo deployment sets the id in build.yml.
 *
 * Injected here rather than from application code so that it loads alongside
 * the bundle instead of after it. The bundle is some 600KB gzipped; a tag that
 * waited for it would miss everyone who left before it finished.
 *
 * `send_page_view: false` is the one departure from the snippet Google hands
 * out, and src/utils/analytics.ts explains it: the automatic page view reports
 * a hash-routed application as a single page.
 */
const googleAnalytics = measurementId => ({
  name: 'google-analytics',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      if (!measurementId) return html

      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}` },
            injectTo: 'head-prepend'
          },
          {
            tag: 'script',
            children: [
              'window.dataLayer = window.dataLayer || [];',
              'function gtag(){dataLayer.push(arguments);}',
              "gtag('js', new Date());",
              `gtag('config', '${measurementId}', { send_page_view: false });`
            ].join('\n'),
            injectTo: 'head-prepend'
          }
        ]
      }
    }
  }
})

/** The languages src/lang ships a pack for. Directories only; the rest is code. */
const shippedLocales = () => readdirSync(resolve('src/lang'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)

/**
 * Resolves VUE_APP_LOCALE, and refuses to build on a value that is not a
 * language we ship.
 *
 * Empty is the shipped value and means the visitor decides -- a stored choice,
 * else the browser, else zh-CN. Setting it fixes the whole deployment to one
 * language and removes the switcher, which is what an intranet running in a
 * single language wants after this project grew a second one.
 *
 * The throw is the point. A typo -- `zh_CN`, `zh`, `cn` -- is otherwise a
 * deployment that quietly keeps following the browser: nothing is missing from
 * the interface, no request fails, and the one person who would notice is the
 * operator who thought they had pinned it. Failing here puts the mistake in
 * front of whoever made it, while they are still looking at the build.
 *
 * tests/unit/lang/locales.spec.ts holds the directory listing and LOCALES to
 * each other, so a pack that exists is also a language the app will accept.
 */
const fixedLocale = configured => {
  const locale = (configured ?? '').trim()
  if (!locale) return ''

  const shipped = shippedLocales()
  if (!shipped.includes(locale)) {
    throw new Error(
      `VUE_APP_LOCALE is set to "${locale}", which is not a language this build ships. ` +
      `Use one of: ${shipped.join(', ')}. Leave it empty to follow the visitor's browser.`
    )
  }
  return locale
}

export default defineConfig(({ mode }) => {
  // 同时加载 VITE_ 与 VUE_APP_ 前缀，保持与 Vue CLI 时期的 .env 文件兼容
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'VUE_APP_', 'NODE_'])

  return {
    base: '/',
    envPrefix: ['VITE_', 'VUE_APP_'],

    plugins: [
      googleAnalytics(env.VUE_APP_GA_ID),
      vue(),
      // Tailwind v4 needs no config file; source scanning is automatic.
      // Layer setup lives in src/styles/tailwind.css.
      tailwindcss(),
      // Bakes src/icons/svg into one sprite of <symbol id="icon-[name]">.
      // Local rather than vite-plugin-svg-icons: see build/svg-sprite.mjs.
      svgSprite({ iconDir: resolve('src/icons/svg') }),
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
      // 与 Vue CLI 保持一致：允许 import 时省略 .vue 后缀。
      // NOTE: this replaces Vite's defaults, so the TypeScript extensions have
      // to be listed explicitly -- omitting them breaks `import x from './y'`
      // for .ts modules in dev (the production build resolves them anyway,
      // which is why this only surfaces when the dev server runs).
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },

    // 业务代码沿用 process.env.VUE_APP_* 写法，此处做等价注入
    define: {
      'process.env.VUE_APP_BASE_API': JSON.stringify(env.VUE_APP_BASE_API || ''),
      // The login footer renders this only when it is set. Left empty in every
      // .env here: a filing number belongs to whoever operates the deployment.
      'process.env.VUE_APP_ICP': JSON.stringify(env.VUE_APP_ICP || ''),
      // Empty in every .env here: a deployment that wants one language sets it,
      // and everyone else lets the visitor decide. See fixedLocale above.
      'process.env.VUE_APP_LOCALE': JSON.stringify(fixedLocale(env.VUE_APP_LOCALE)),
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
          /**
           * Only the two groups the entry genuinely needs are named here.
           * Everything else is left to the bundler, which puts a module
           * reachable only through a dynamic import into an async chunk.
           *
           * The rule this replaces ended with `return 'chunk-libs'`, which
           * assigned *every* dependency to a chunk the entry loads -- so a
           * library used by one lazy page was still downloaded by every
           * visitor before the login form appeared. echarts alone is 370 kB
           * gzipped, larger than Element Plus, and it is only ever drawn on
           * the dashboard. codemirror only exists on the generator page,
           * vue-cropper only on the avatar dialog.
           *
           * The same mechanism silently defeated the export button's dynamic
           * import once already; naming a chunk here is what caused it. Add a
           * name only for something the first paint truly needs, and let the
           * size guard in tests/unit/build catch a regression.
           */
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (/[\\/]element-plus[\\/]/.test(id)) {
              // Except its locale packs. Naming a module here assigns it to a
              // chunk the entry loads, so every language Element Plus ships
              // would be downloaded by every visitor -- exactly the bug this
              // manualChunks was rewritten to fix, one level down. src/lang
              // imports them dynamically and needs them to stay split.
              if (/[\\/]locale[\\/]lang[\\/]/.test(id)) return
              return 'chunk-elementPlus'
            }
            if (/[\\/](vue|vue-router|vue-demi|pinia|@vue)[\\/]/.test(id)) return 'chunk-vue'
            return
          },
          chunkFileNames: 'js/[name].[hash].js',
          entryFileNames: 'js/[name].[hash].js',
          assetFileNames: '[ext]/[name].[hash].[ext]'
        }
      }
    }
  }
})
