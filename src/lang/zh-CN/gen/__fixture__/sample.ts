/**
 * Permanent fixture for tests/unit/lang/gen-namespace.spec.ts.
 *
 * Proves that a file physically dropped into this folder is found by the real
 * Vite glob in ../index.ts and can be read through t() -- not just that the
 * reducer in gen-namespace.ts is correct in isolation. A regression here (the
 * glob pattern narrowed, the aggregator not imported by ../../index.ts, ...)
 * would go unnoticed by a test that only feeds nestByPackage a hand-built
 * object, because that never touches the glob or the import chain at all.
 *
 * Safe to leave in the generator's own directory permanently: `packageName`
 * only ever validates against `/^[a-z]*$/` (genInfoForm.vue:132-139), so a
 * generated table can never land in a package called `__fixture__` -- this
 * file can never collide with real generator output, now or later.
 */
export default {
  title: '示例标题'
}
