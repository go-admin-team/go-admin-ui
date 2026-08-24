/**
 * Light or dark, and the one place that decides which.
 *
 * The dark palette has existed in styles/tokens.css for a while, as has Element
 * Plus's dark variable sheet, but nothing ever put the `dark` class on <html> --
 * so the whole thing was maintained without ever rendering. This is the switch.
 *
 * Three values, not two. `system` follows the operating system and keeps
 * following it, which is what a preference the user never set should do;
 * `light` and `dark` are a deliberate choice and stop following.
 *
 * The class is applied twice on purpose. A snippet in index.html sets it before
 * the first byte of CSS is parsed, because a stored `dark` preference would
 * otherwise show a frame of the light theme; this module then owns it for the
 * rest of the session. Both read the same key and the same rules, so they cannot
 * disagree -- keep them in step if either changes.
 */

export type ColorScheme = 'system' | 'light' | 'dark'

/** Also read by the snippet in index.html. */
export const STORAGE_KEY = 'color-scheme'

const DARK_CLASS = 'dark'

const isScheme = (value: unknown): value is ColorScheme =>
  value === 'system' || value === 'light' || value === 'dark'

/** What was stored, or `system` for anything unset or unrecognised. */
export const storedScheme = (): ColorScheme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isScheme(stored) ? stored : 'system'
  } catch {
    // Safari in private mode throws on localStorage; a theme is not worth a
    // crash on boot.
    return 'system'
  }
}

const prefersDark = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches

/** Whether a scheme renders dark right now. Only `system` depends on the OS. */
export const resolvesDark = (scheme: ColorScheme): boolean =>
  scheme === 'dark' || (scheme === 'system' && prefersDark())

const paint = (scheme: ColorScheme): void => {
  document.documentElement.classList.toggle(DARK_CLASS, resolvesDark(scheme))
}

/**
 * Applies a scheme and remembers it.
 *
 * Storage failing is not a reason to leave the page in the wrong colours, so the
 * class is set either way.
 */
export const applyColorScheme = (scheme: ColorScheme): void => {
  paint(scheme)
  try {
    localStorage.setItem(STORAGE_KEY, scheme)
  } catch { /* see storedScheme */ }
}

/**
 * Applies what is stored and keeps `system` in step with the OS.
 *
 * Called once at startup. The listener is never removed: it lives as long as the
 * document, and re-reads the stored value on each change so it stops mattering
 * the moment the user picks a side.
 */
export const initColorScheme = (): ColorScheme => {
  const scheme = storedScheme()
  paint(scheme)

  if (typeof matchMedia === 'function') {
    matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => paint(storedScheme()))
  }

  return scheme
}
