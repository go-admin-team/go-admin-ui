import { config } from '@vue/test-utils'
import { i18n } from '@/lang'

/**
 * Installs i18n for every mounted component.
 *
 * Without this, `mount(SomeComponent)` on anything whose template calls `$t()`
 * fails with "$t is not a function" -- the plugin that injects it is installed
 * on the real app, not on the one test-utils creates per mount. The first
 * component to hit this worked around it by calling `i18n.global.t` in its
 * script instead, which fixed that component and left the next one to discover
 * the same thing.
 *
 * Safe for the tests that came before it: installing a plugin a component never
 * uses changes nothing about how it renders.
 *
 * Note this is the real i18n instance, so mounted components render zh-CN --
 * the same strings the rest of the suite asserts on.
 */
config.global.plugins.push(i18n)
