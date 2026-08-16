/// <reference types="vite/client" />

/**
 * Module declaration for single-file components. TS does not understand the
 * `.vue` extension; without this, every `import X from './X.vue'` reports
 * "cannot find module".
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

/**
 * Application code still uses the Vue CLI era `process.env.VUE_APP_*` form,
 * which vite.config.mjs replaces statically at build time via `define`. There is
 * no real `process` object in the browser, so only the two keys that are
 * actually injected are declared here — referencing anything else would compile
 * but resolve to undefined at runtime.
 */
declare const process: {
  env: {
    VUE_APP_BASE_API: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
}
