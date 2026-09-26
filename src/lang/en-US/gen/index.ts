import { nestByPackage } from '../../gen-namespace'

/**
 * English side of the generator's per-table language packs.
 *
 * Not `devTools.gen.*` -- see `../../zh-CN/gen`'s comment for the distinction.
 *
 * Same file layout and nesting as `../../zh-CN/gen` -- see its comment for the
 * full rationale. `eager: true` here too, for a different reason: en-US
 * already ships as one dynamic `import()` chunk (`src/lang/index.ts`), so
 * splitting this directory into per-file lazy loads would not save a single
 * byte of that chunk -- the whole thing downloads the moment someone switches
 * language -- it would only turn one request into many.
 */
const modules = import.meta.glob<{ default: Record<string, unknown> }>('./*/*.ts', { eager: true })

export default nestByPackage(modules)
