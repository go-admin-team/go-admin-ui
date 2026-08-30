import { ref, reactive, computed, unref } from 'vue'
import type { MaybeRef } from 'vue'
import type { ApiResponse } from '@/types/api'

/**
 * The tree behind a parent picker, kept separate from the list on screen.
 *
 * Both the menu and the department page hand an el-tree-select the whole
 * hierarchy under a synthetic root, so a top-level record can be created. Both
 * had built it from `table.rows` -- which holds the *search results*. A record's
 * parent is routinely a branch the search filtered out, so opening the dialog on
 * a match found no node for its own parentId, rendered an empty selection, and
 * saving re-parented the record to whatever was picked next. Adding after a
 * filter also offered only the filtered branches as parents.
 *
 * Fetching it eagerly is not the answer either: the picker and the list read the
 * same endpoint, so a fetch on mount and another after every write cost a second
 * copy of a body already on screen. This loads on first use and marks itself
 * stale on write, so an untouched picker costs nothing and a used one costs one
 * request per write at most.
 *
 *   const parent = useTreePicker<SysMenu>({
 *     api: () => listMenu({}),
 *     idKey: 'menuId',
 *     labelKey: 'title',
 *     rootLabel: computed(() => t('admin.sysMenu.rootCategory'))
 *   })
 *
 *   // opening a dialog
 *   const handleAdd = (row?: SysMenu) => { void parent.ensure(); form.openCreate(...) }
 *   // and on every write
 *   onSuccess: () => { parent.invalidate(); return table.getList() }
 *
 * `ensure()` is deliberately not awaited at the call sites: the dialog opens at
 * once and the picker fills in when the tree lands, rather than the button
 * appearing dead for the length of a request.
 */
export interface UseTreePickerOptions<TRow> {
  /** Fetches the whole tree. Must send no filters. */
  api: () => Promise<ApiResponse<TRow[]>>
  /** Field el-tree-select uses as node-key. */
  idKey: string
  /** Field el-tree-select shows as the label. */
  labelKey: string
  /**
   * Label of the synthetic root, e.g. 主类目.
   *
   * Accepts a computed as well as a plain string, and a translated page needs
   * one: a plain `t(...)` is resolved once, when the page is set up, so the one
   * node in the picker that is not a database record would keep whichever
   * language the page was opened in while every branch under it changed.
   */
  rootLabel: MaybeRef<string>
  /** Value the synthetic root carries. Backends use 0 for "no parent". */
  rootId?: number
}

/**
 * Plain values, not Refs -- the object is wrapped in reactive() before it is
 * returned, the way useTable and useForm are.
 *
 * The rule is what the call site does with it. This one is reached by property
 * access (`parent.options`, `parent.ensure()`), and property access on a plain
 * object hands the template the ComputedRef itself: el-tree-select then got an
 * object where its `data` prop declares an array and logged `Invalid prop: type
 * check failed for prop "data"` on every render. useRemove, useExport and
 * useDict return bare objects holding refs on purpose -- those are destructured,
 * and destructuring a reactive object would snapshot the values instead.
 */
export interface UseTreePickerReturn<TRow> {
  /** Bind to el-tree-select's `data`. The synthetic root wraps the tree. */
  options: TRow[]
  /** Loads the tree unless it is already current. Safe to call on every open. */
  ensure: () => Promise<void>
  /** Marks the tree stale, so the next `ensure()` refetches it. */
  invalidate: () => void
}

export function useTreePicker<TRow extends object>(
  options: UseTreePickerOptions<TRow>
): UseTreePickerReturn<TRow> {
  const { api, idKey, labelKey, rootLabel, rootId = 0 } = options

  const tree = ref<TRow[]>([]) as { value: TRow[] }
  let current = false
  let inFlight: Promise<void> | null = null

  const load = async() => {
    try {
      const response = await api()
      tree.value = response.data ?? []
      current = true
    } catch {
      // Reported by the interceptor. The picker keeps its last good tree rather
      // than emptying, which would look like "this record has no parent".
    } finally {
      inFlight = null
    }
  }

  // Two dialogs opened in quick succession share one request
  const ensure = () => {
    if (current) return Promise.resolve()
    inFlight ??= load()
    return inFlight
  }

  const invalidate = () => { current = false }

  const pickerOptions = computed<TRow[]>(() => [
    { [idKey]: rootId, [labelKey]: unref(rootLabel), children: tree.value } as unknown as TRow
  ])

  return reactive({
    options: pickerOptions,
    ensure,
    invalidate
  }) as UseTreePickerReturn<TRow>
}
