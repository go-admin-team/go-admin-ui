/**
 * Fallback type declarations for third-party packages.
 *
 * None of the packages below ship a `types` field, so TS errors at the import
 * site without these. They are deliberately minimal — just enough to compile —
 * rather than an attempt to model the real API, because three of them are
 * scheduled for replacement in phase P4 of the migration plan:
 *
 *   vue-count-to    -> in-house composable (1 usage)
 *   vue-cropper     -> kept (avatar cropping; replacing it is not worth the risk)
 *   dropzone        -> kept (form generator)
 *
 * Remove the matching entry as each package is replaced, so stale declarations
 * do not mask genuinely missing types.
 */

declare module 'vue-cropper' {
  import type { DefineComponent } from 'vue'
  export const VueCropper: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  const _default: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default _default
}

declare module 'vue-count-to' {
  import type { DefineComponent } from 'vue'
  const CountTo: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default CountTo
}

declare module 'dropzone' {
  const Dropzone: unknown
  export default Dropzone
}
