import { ref } from 'vue'
import type { Ref } from 'vue'
import { getDicts } from '@/api/admin/dict/data'
import type { ApiResponse, DictOption } from '@/types/api'

/**
 * Dictionary options, fetched once per type and shared.
 *
 *   const { sys_normal_disable, sys_user_sex } = useDict('sys_normal_disable', 'sys_user_sex')
 *
 * Each name comes back as a ref that starts empty and fills in when the request
 * lands, so templates can bind to it immediately.
 *
 * Requests are cached at module level. Dictionaries change about as often as the
 * schema does, and the previous `this.getDicts(...)` in every created() hook
 * meant that walking through five pages that all show a status column fetched
 * sys_normal_disable five times.
 */

const cache = new Map<string, Promise<DictOption[]>>()

const fetchDict = (type: string): Promise<DictOption[]> => {
  const cached = cache.get(type)
  if (cached) return cached

  const request = (getDicts(type) as unknown as Promise<ApiResponse<DictOption[]>>)
    .then(response => response?.data ?? [])
    .catch(error => {
      // Drop the failed attempt so a later page can retry; keeping it would
      // cache the failure for the rest of the session. The interceptor has
      // already told the user.
      cache.delete(type)
      console.error(`useDict: failed to load "${type}"`, error)
      return [] as DictOption[]
    })

  cache.set(type, request)
  return request
}

export function useDict<T extends string>(...types: T[]): Record<T, Ref<DictOption[]>> {
  const result = {} as Record<T, Ref<DictOption[]>>

  for (const type of types) {
    const options = ref<DictOption[]>([])
    result[type] = options
    void fetchDict(type).then(list => {
      options.value = list
    })
  }

  return result
}

/**
 * Look up the label for a value.
 *
 * NOT interchangeable with utils/costum.js's selectDictLabel, which the
 * unmigrated Options-API pages still use: that one compares strictly after
 * stringifying and falls back to an empty string. This compares loosely -- the
 * backend sends dictionary values as strings while several tables store the
 * same field as a number -- and falls back to the raw value, so an unmapped
 * code shows as itself instead of vanishing from the column.
 */
export function dictLabel(options: DictOption[], value: unknown): string {
  if (value === undefined || value === null) return ''
  // eslint-disable-next-line eqeqeq
  const hit = options.find(option => option.value == value)
  return hit ? hit.label : String(value)
}

/** Force the next `useDict` call to refetch. For the dictionary admin pages. */
export function clearDictCache(type?: string): void {
  if (type) cache.delete(type)
  else cache.clear()
}
