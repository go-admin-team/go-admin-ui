import { i18n } from '.'

/**
 * Translating text that came out of the database.
 *
 * Menu titles and dictionary labels are Chinese strings the backend sends and
 * this project does not change -- go-admin's schema has one title column, not
 * one per language, and adding one would break every existing deployment's
 * upgrade path. What the data does have is a stable English key alongside the
 * Chinese: `sys_menu.menu_name`, and `dict_type` + `dict_value`. These
 * functions translate by that key and fall back to the Chinese when there is no
 * entry.
 *
 * None of them call `t()` or `te()`, for two reasons:
 *
 * 1. A missing key here is normal. Menus and dictionaries the user created have
 *    no translation and never will, and PRD R2 says they must simply show their
 *    Chinese. `t()` would log a missing-key warning for each one, on every
 *    render. Silencing that with a global `missingWarn: false` would also
 *    silence the ordinary language packs, where a missing key IS a bug worth
 *    hearing about -- the two kinds of "not found" need to stay separable.
 *
 * 2. `t('dict.sys_user_sex.0')` is a dotted path vue-i18n splits on `.`. The
 *    seed data has no dots in any dict_value, but a user-created dictionary can
 *    hold anything, and a value with a dot would silently resolve to nothing.
 *    Plain object access has no such failure mode.
 *
 * Reading `i18n.global.locale.value` is what makes these reactive: called from
 * a computed or a template, they re-run when the language changes.
 */

type Messages = Record<string, unknown>

const messages = (): Messages =>
  i18n.global.getLocaleMessage(i18n.global.locale.value) as Messages

/** One level of lookup that tolerates a missing or non-object parent. */
const at = (parent: unknown, key: string | undefined): unknown => {
  if (!key || typeof parent !== 'object' || parent === null) return undefined
  return (parent as Record<string, unknown>)[key]
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined

/**
 * A menu's title in the current language.
 *
 * `fallback` is the title as stored, which is what zh-CN always renders -- that
 * language deliberately ships no menu.ts, so this returns the database value
 * unchanged and the Chinese interface stays byte-for-byte what it was.
 */
export const translateMenuTitle = (menuName: unknown, fallback?: string): string =>
  asString(at(messages().menu, typeof menuName === 'string' ? menuName : undefined)) ?? fallback ?? ''

/** A dictionary entry's label, keyed by its type and its value. */
export const translateDictLabel = (
  dictType: string | undefined,
  dictValue: unknown,
  fallback?: string
): string => {
  const values = at(messages().dict, 'values')
  const value = dictValue === undefined || dictValue === null ? undefined : String(dictValue)
  return asString(at(at(values, dictType), value)) ?? fallback ?? ''
}

/** A dictionary type's own name, as shown on the dictionary admin page. */
export const translateDictTypeName = (dictType: string | undefined, fallback?: string): string =>
  asString(at(at(messages().dict, 'types'), dictType)) ?? fallback ?? ''

/**
 * The title to render for a route, whether it came from the menu API or from
 * the static route table.
 *
 * Called at render time rather than written back into `meta.title`. Rewriting
 * the tree on every switch would mean walking three separate Pinia arrays and
 * hoping they share the same node objects, and it would leave tagsView's copied
 * titles stale anyway. Translating where the string is displayed makes all
 * three call sites -- sidebar, breadcrumb, tab strip -- correct by
 * construction, and reactive for free.
 *
 * The two kinds of route are looked up through different channels on purpose.
 * A static route (`meta.titleKey`) is the frontend's own text, so a missing key
 * is a migration bug and `t()`'s warning is exactly what should happen. A menu
 * route's title came from the database, where a missing translation is the
 * normal state for anything the user created.
 */
export const routeTitle = (route: {
  name?: unknown
  meta?: { title?: unknown, titleKey?: unknown } | null
} | null | undefined): string => {
  const meta = route?.meta
  const key = asString(meta?.titleKey)
  if (key) return i18n.global.t(key)
  return translateMenuTitle(route?.name, asString(meta?.title))
}
