import { nestByPackage } from '../../gen-namespace'

/**
 * The code generator's per-table language packs (PRD 010, F9/D9).
 *
 * One file per generated page, written by the generator itself alongside the
 * .vue it labels, at `gen/{packageName}/{businessName}.ts` -- see
 * `gen-namespace.ts` for why that path is nested rather than flat, and
 * `__fixture__/sample.ts` for a fixture proving this wiring end to end.
 *
 * Not to be confused with `devTools.gen.*` (`../dev-tools/gen.ts`, imported by
 * `../dev-tools/index.ts`): that one is the generator's own interface --
 * `views/dev-tools/gen/index.vue`, the page listing the tables it manages.
 * This one is the generator's *output* -- translations for the pages it
 * writes into other packages. Same word, two unrelated namespaces at
 * different nesting depths; worth naming explicitly because a future rename
 * of either could easily be mistaken for touching the other.
 *

 * Before this, a file the generator wrote here was inert: nothing imported it,
 * so vue-i18n never saw its keys and a generated page fell back to showing the
 * key itself, silently. The glob below is what turns "a file exists in this
 * folder" into "t() can read it" -- the entire point of F9.
 *
 * eager, not lazy: zh-CN is already loaded synchronously, before createI18n
 * runs (see ../index.ts, one directory up), so a lazy glob here would only
 * turn this export into a promise that file has to await first.
 * `src/components/FormGenRender/render.js:9` is this repository's other
 * eager-glob-into-object call, one nesting level shallower than this one.
 */
const modules = import.meta.glob<{ default: Record<string, unknown> }>('./*/*.ts', { eager: true })

export default nestByPackage(modules)
