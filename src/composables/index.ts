/**
 * Reusable page logic.
 *
 * These replace mixins/. A mixin merges its names into the component, so it can
 * be applied only once and any collision is silent; a composable is called, so a
 * page can have two lists or three forms and names each one itself.
 */

export { useTable } from './useTable'
export type { UseTableOptions, UseTableReturn } from './useTable'

export { useForm } from './useForm'
export type { UseFormOptions, UseFormReturn } from './useForm'

export { useRemove } from './useRemove'
export type { UseRemoveOptions, UseRemoveReturn } from './useRemove'

export { useDict, dictLabel, clearDictCache } from './useDict'

export { useExport } from './useExport'
export type { ExportOptions, UseExportReturn } from './useExport'

export { useTreePicker } from './useTreePicker'
export type { UseTreePickerOptions, UseTreePickerReturn } from './useTreePicker'
