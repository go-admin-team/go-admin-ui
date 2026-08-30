/**
 * Which languages exist, and which one this visitor gets.
 *
 * Deliberately parallel to utils/color-scheme.ts: a stored choice wins, an
 * unset one follows the environment, and storage throwing is never a reason to
 * fail the boot. Kept free of vue-i18n imports so it can be unit-tested without
 * standing up an i18n instance.
 */

export const LOCALES = [
  // Labels are endonyms on purpose -- someone who cannot read the current
  // language still has to be able to find their own in the switcher.
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' }
] as const

export type Locale = typeof LOCALES[number]['value']

/** The language every fallback ultimately lands on. */
export const DEFAULT_LOCALE: Locale = 'zh-CN'

export const STORAGE_KEY = 'locale'

export const isLocale = (value: unknown): value is Locale =>
  LOCALES.some(locale => locale.value === value)

/**
 * The closest supported language to a browser tag.
 *
 * navigator.language is a BCP 47 tag, and the region half varies more than the
 * language half: en-GB, en-AU and en all have to reach en-US. Matching the
 * language subtag is what makes that work; an exact match against our two
 * values would send every one of them to Chinese.
 */
export const matchLocale = (tag: string | undefined): Locale | undefined => {
  const language = (tag ?? '').toLowerCase().split('-')[0]
  if (!language) return undefined
  return LOCALES.find(locale => locale.value.toLowerCase().split('-')[0] === language)?.value
}

/** What the visitor chose, if it is still a language we ship. */
export const storedLocale = (): Locale | undefined => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isLocale(stored) ? stored : undefined
  } catch {
    // Safari in private mode throws on localStorage. See color-scheme.ts.
    return undefined
  }
}

export const rememberLocale = (locale: Locale): void => {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch { /* see storedLocale */ }
}

/**
 * The language to start in: an explicit choice, else the browser's, else zh-CN.
 *
 * navigator.languages is checked before navigator.language because the first
 * entry of the list is not always the same as the singular property when the
 * user has ordered several languages.
 */
export const initialLocale = (): Locale => {
  const stored = storedLocale()
  if (stored) return stored

  const tags = typeof navigator === 'undefined'
    ? []
    : [...(navigator.languages ?? []), navigator.language]

  for (const tag of tags) {
    const matched = matchLocale(tag)
    if (matched) return matched
  }

  return DEFAULT_LOCALE
}
