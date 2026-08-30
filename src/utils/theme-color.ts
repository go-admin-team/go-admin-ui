/**
 * The primary colour, and the CSS variables Element Plus derives from it.
 *
 * This replaces a mechanism that downloaded the whole of element-plus's
 * theme-chalk from unpkg, string-replaced every occurrence of the old colour in
 * it, and injected the result as a <style> tag. That broke the project's rule
 * against external CDNs -- intranet and offline deployments are a normal case
 * here -- and it predates Element Plus 2, which drives every one of its
 * components off CSS variables. Setting seven variables does the same job with
 * no network at all.
 *
 * Lives outside the picker component because the variables outlive it: the
 * picker is mounted inside the settings drawer and unmounts when it closes,
 * while the colour stays on the document. The dark-mode observer below has to
 * keep working after that.
 */

/** Element Plus derives these tints; leaving any out desaturates half the UI. */
const LIGHT_STEPS = [3, 5, 7, 8, 9] as const

/**
 * What a tint is mixed toward.
 *
 * Element Plus's own dark theme mixes toward its dark ground rather than white,
 * so a colour computed for the light theme reads washed out on dark. Both
 * values are Element Plus's.
 */
const LIGHT_GROUND = [255, 255, 255] as const
const DARK_GROUND = [20, 20, 20] as const

const channels = (hex: string): [number, number, number] => {
  const value = hex.replace('#', '')
  const full = value.length === 3
    ? value.split('').map(c => c + c).join('')
    : value
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16)
  ]
}

/** Two digits per channel, always. `(15).toString(16)` is 'f', which is not a colour. */
const toHex = (rgb: number[]): string =>
  '#' + rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')

const mix = (hex: string, ground: readonly number[], weight: number): string =>
  toHex(channels(hex).map((c, i) => c + weight * (ground[i] - c)))

let current: string | null = null

const paint = (): void => {
  if (!current) return
  const dark = document.documentElement.classList.contains('dark')
  const ground = dark ? DARK_GROUND : LIGHT_GROUND
  const style = document.documentElement.style

  style.setProperty('--el-color-primary', current)
  for (const step of LIGHT_STEPS) {
    style.setProperty(`--el-color-primary-light-${step}`, mix(current, ground, step / 10))
  }
  // The one shade rather than tint: hovering a primary button darkens it in
  // both themes, so this mixes toward black either way.
  style.setProperty('--el-color-primary-dark-2', mix(current, [0, 0, 0], 0.2))
}

/** Applies a colour and remembers it, so a theme change can recompute the tints. */
export const applyThemeColor = (hex: string): void => {
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return
  current = hex
  paint()
}

/**
 * Recomputes when light/dark changes.
 *
 * Registered once at import rather than per component: the picker is long gone
 * by the time most people touch the appearance toggle, and the tints would
 * otherwise stay mixed toward the wrong ground until the colour is picked
 * again.
 */
if (typeof MutationObserver === 'function') {
  new MutationObserver(paint).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
}
