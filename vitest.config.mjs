import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const resolve = dir => path.resolve(import.meta.dirname, dir)

/**
 * Vitest configuration, migrated from jest.config.js.
 *
 * Instead of the jest 27 + @vue/vue3-jest + babel-jest transform chain, this
 * reuses Vite's own pipeline: .vue is handled by @vitejs/plugin-vue, while
 * aliases and TypeScript need no extra setup.
 */
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': resolve('src'),
      // Matches vite.config.mjs: application code imports `path`, which must
      // resolve to the browser polyfill
      path: 'path-browserify'
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },

  // Application code still uses the process.env.VUE_APP_* form
  define: {
    'process.env.VUE_APP_BASE_API': JSON.stringify(''),
    'process.env.NODE_ENV': JSON.stringify('test')
  },

  test: {
    environment: 'jsdom',
    // Test files use describe/it/expect/vi directly instead of importing each
    globals: true,
    include: ['tests/unit/**/*.spec.{js,ts}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'tests/unit/coverage',
      reporter: ['lcov', 'text-summary'],
      include: [
        'src/utils/**/*.{js,ts,vue}',
        'src/components/**/*.{js,ts,vue}',
        'src/composables/**/*.ts',
        'src/stores/**/*.ts'
      ],
      exclude: ['src/utils/auth.js', 'src/utils/request.js']
    }
  }
})
