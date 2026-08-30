import { createI18n } from 'vue-i18n'
import { shallowRef } from 'vue'
import elementZhCn from 'element-plus/es/locale/lang/zh-cn'
import zhCN from './zh-CN'
import { DEFAULT_LOCALE, initialLocale, rememberLocale, type Locale } from './locales'

/**
 * The i18n instance, and the one function that changes language.
 *
 * Only zh-CN is bundled into the entry: it is the default and the fallback, so
 * it is needed either way, and bundling the others would put every translation
 * of a page nobody opened into the first paint. The rest arrive through
 * `import()`, which Vite splits into their own chunks -- see
 * scripts/check-first-paint.mjs for the budget this protects.
 *
 * `legacy: false` is what makes switching work without a reload: only in
 * Composition mode is `locale` a real ref, so assigning to it re-renders
 * everything that read a translation. `globalInjection` keeps `$t()` working in
 * the Options-API pages that have not been migrated yet, so the two migrations
 * (Options -> Composition, Chinese -> i18n) do not block each other.
 */

const messageLoaders: Record<Locale, () => Promise<Record<string, unknown>>> = {
  'zh-CN': () => Promise.resolve(zhCN),
  'en-US': () => import('./en-US').then(module => module.default)
}

/**
 * Element Plus's own strings -- the date picker, the empty table, pagination.
 *
 * These cannot ride on the `locale` ref: Element Plus reads its locale from an
 * injected config, so the app has to be wrapped in <el-config-provider> bound
 * to this ref. Passing `locale` to `app.use(ElementPlus, ...)` instead, as this
 * project did, fixes the language at boot -- the plugin reads the option once.
 */
type ElementLocale = typeof elementZhCn

const elementLoaders: Record<Locale, () => Promise<ElementLocale>> = {
  'zh-CN': () => Promise.resolve(elementZhCn),
  'en-US': () => import('element-plus/es/locale/lang/en').then(module => module.default)
}

export const elementLocale = shallowRef<ElementLocale>(elementZhCn)

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { [DEFAULT_LOCALE]: zhCN }
})

/** The current language, reactive. For code outside a component. */
export const currentLocale = (): Locale => i18n.global.locale.value as Locale

/**
 * Switches language, loading whatever that language needs first.
 *
 * Both loads are awaited before `locale` is assigned so the interface never
 * renders half-translated -- a frame with English labels and a Chinese date
 * picker is worse than a frame of the old language.
 */
export const setLocale = async(locale: Locale): Promise<void> => {
  if (!i18n.global.availableLocales.includes(locale)) {
    i18n.global.setLocaleMessage(locale, await messageLoaders[locale]())
  }
  elementLocale.value = await elementLoaders[locale]()

  i18n.global.locale.value = locale
  rememberLocale(locale)
  // Screen readers pick pronunciation from this, and CSS :lang() selectors key
  // off it. Nothing in the app reads it back.
  document.documentElement.lang = locale
}

/** Called once at boot, before mount, so the first paint is already correct. */
export const setupI18n = (): Promise<void> => setLocale(initialLocale())

export * from './locales'
