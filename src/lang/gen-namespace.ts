/**
 * Reshapes a `gen/{packageName}/{businessName}.ts` glob into the object
 * `gen/index.ts` exports: nested by package, one level for each of the two
 * path segments.
 *
 * `import.meta.glob` has to be called directly at each aggregator's own call
 * site -- Vite resolves it statically there and cannot see through a function
 * that wraps it (see zh-CN/gen/index.ts and en-US/gen/index.ts) -- so this
 * only holds the part that can be shared between the two: turning the flat
 * `{'./admin/userProfile.ts': module}` map that call produces into the nested
 * shape below.
 *
 * Nested rather than flat because `businessName` only has a pattern check, no
 * uniqueness check (`genInfoForm.vue:148-155`): two tables in different
 * packages can share one, and a flat `gen/{businessName}.ts` directory would
 * let the second file silently overwrite the first at import time -- the same
 * collision PRD 010's G10 describes for the built-in `admin` namespace, one
 * level down.
 */
export const nestByPackage = (
  modules: Record<string, { default: Record<string, unknown> }>
): Record<string, Record<string, unknown>> => {
  const nested: Record<string, Record<string, unknown>> = {}
  for (const [path, module] of Object.entries(modules)) {
    const match = /^\.\/([^/]+)\/([^/]+)\.ts$/.exec(path)
    if (!match) continue
    const [, packageName, businessName] = match
    nested[packageName] ??= {}
    nested[packageName][businessName] = module.default
  }
  return nested
}
