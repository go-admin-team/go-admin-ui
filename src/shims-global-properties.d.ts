import 'vue'

/**
 * Type declarations for the helpers registered on `app.config.globalProperties`
 * (see main.js).
 *
 * Every helper is registered twice — with and without a `$` prefix — because
 * existing code uses both forms. Roughly 155 call sites depend on these:
 *
 *   msgSuccess 52 · msgError 46 · resetForm 25 · getDicts 14
 *   selectDictLabel 10
 *
 * WARNING: none of these are available inside `<script setup>` (no `this`).
 * Replacements when migrating a component:
 *
 *   msgSuccess/msgError/msgInfo  -> import { ... } from '@/utils/message'
 *   getDicts/getConfigKey/...    -> import from the corresponding api module
 *   parseTime/selectDictLabel/…  -> import { ... } from '@/utils/costum'
 *   resetForm                    -> no import equivalent: it relies on
 *                                   `this.$refs`. Under the Composition API,
 *                                   call `formRef.value?.resetFields()` directly.
 *
 * Delete this file together with the globalProperties registration in main.js
 * once every page has been migrated.
 */

type MessageFn = (msg: string) => void
type DictFn = (dictType: string) => Promise<unknown>
type ConfigFn = (configKey: string) => Promise<unknown>
type ParseTimeFn = (time: unknown, pattern?: string) => string | null
type ResetFormFn = (refName: string) => void
type SelectLabelFn = (datas: unknown[], value: unknown) => string
type GetItemsFn = (f: unknown, query: unknown) => unknown
type SetItemsFn = (response: unknown, k: unknown, v: unknown) => unknown

interface GoAdminGlobalMethods {
  msgSuccess: MessageFn
  msgError: MessageFn
  msgInfo: MessageFn
  getDicts: DictFn
  getConfigKey: ConfigFn
  getItems: GetItemsFn
  setItems: SetItemsFn
  parseTime: ParseTimeFn
  resetForm: ResetFormFn
  selectDictLabel: SelectLabelFn
  selectItemsLabel: SelectLabelFn
}

type PrefixedGlobalMethods = {
  [K in keyof GoAdminGlobalMethods as `$${string & K}`]: GoAdminGlobalMethods[K]
}

declare module 'vue' {
  interface ComponentCustomProperties extends GoAdminGlobalMethods, PrefixedGlobalMethods {
    /** Global filter collection, called from templates as $filters.xxx(val) */
    $filters: Record<string, (...args: never[]) => unknown>
  }
}
