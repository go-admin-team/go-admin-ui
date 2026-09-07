import { describe, it, expect } from 'vitest'
import { compile } from 'tailwindcss'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Tailwind's utilities must not answer to the class names this app writes.
 *
 * v4 generates utilities on demand from whatever words it finds while scanning
 * source, so a class of our own that happens to share a utility name gets one
 * generated for it. That rule then applies to our element -- and wins for any
 * property our own stylesheet does not set, because nothing is competing.
 *
 * That is not hypothetical. The sidebar toggles a class called `collapse` on
 * its logo block, which made Tailwind emit `.collapse{visibility:collapse}`;
 * nothing in that component sets visibility, so the whole logo disappeared the
 * moment the rail collapsed, while still reporting its usual size and position.
 *
 * `prefix(tw)` closes it structurally: utilities answer only to `tw:` names, so
 * no class we write can reach them by accident.
 *
 * Compiled here rather than asserted as text, because what matters is what
 * Tailwind emits, not how the entry point is spelled.
 */
const compileWith = async(candidates: string[]) => {
  const entry = resolve(__dirname, '../../../src/styles/tailwind.css')
  const compiler = await compile(readFileSync(entry, 'utf8'), {
    base: dirname(entry),
    loadStylesheet: async(id: string, base: string) => {
      const path = id.startsWith('tailwindcss')
        ? resolve(__dirname, '../../../node_modules', id)
        : resolve(base, id)
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
    }
  })
  return compiler.build(candidates)
}

/** Rules inside `@layer utilities { ... }`, which is where generated ones land. */
const utilityRules = (css: string) => {
  const start = css.indexOf('@layer utilities {')
  return start < 0 ? '' : css.slice(start)
}

describe('tailwind utilities are namespaced', () => {
  /**
   * Every one of these is a real class in src/, and each was generating a
   * utility of the same name before the prefix: `collapse` hid the sidebar
   * logo, and the rest were saved only by their own stylesheet happening to
   * set the same property Tailwind would have.
   */
  it('generates nothing for the class names this app already uses', async() => {
    const css = await compileWith([
      'collapse', 'hidden', 'block', 'border', 'shadow', 'text-center', 'text-sm',
      'container', 'flex', 'grid', 'fixed', 'absolute', 'visible', 'invisible'
    ])

    expect(utilityRules(css), `unexpected utilities:\n${utilityRules(css)}`).toBe('')
  })

  /**
   * The other half: a prefix that generated nothing at all would pass the check
   * above by breaking Tailwind rather than by namespacing it.
   */
  it('still generates them under the tw: prefix', async() => {
    const css = await compileWith(['tw:flex', 'tw:text-center'])

    expect(css).toContain('display: flex')
    expect(css).toContain('text-align: center')
  })
})
