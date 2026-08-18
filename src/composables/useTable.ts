import { ref, reactive, computed, onMounted } from 'vue'
import type { Ref } from 'vue'
import type { ApiResponse, Id, PageQuery, PageResult } from '@/types/api'

/**
 * List-page state: paging, querying, sorting, row selection.
 *
 * Replaces mixins/crud.js. A mixin could only ever be applied once per page and
 * merged its names into the component, so a page with two lists had to hand-roll
 * the second one. A composable can be called as many times as the page needs,
 * and every name it returns is one the caller chose.
 *
 * Three defects of the mixin are fixed here rather than carried over:
 *
 *   - `loading` is restored in a finally block. Several pages set it to false
 *     inside .then() only, so any server error left the spinner turning forever.
 *   - Responses are matched against the request that asked for them. Typing in a
 *     search box fires overlapping requests, and without this the slowest one
 *     wins regardless of what the user last typed.
 *   - `search()` resets to page 1 under the real key. sys-user wrote
 *     `queryParams.page = 1`, a key the backend does not read, so searching from
 *     page 3 kept showing page 3 of the new result set.
 */

export interface UseTableOptions<TRow, TQuery extends object = Record<string, never>> {
  /**
   * The list endpoint. Receives the merged query object.
   *
   * Either shape is accepted, and which one applies follows `paginated`: a
   * paginated endpoint answers with `{ list, count }`, a non-paginated one with
   * the collection itself.
   */
  api: (query: TQuery & PageQuery) => Promise<ApiResponse<PageResult<TRow> | TRow[]>>

  /**
   * Initial query state, as a factory so `reset()` can rebuild it. Paging keys
   * are supplied automatically and should not be repeated here.
   */
  defaultQuery?: () => TQuery

  /** Primary-key field, used to derive `selectedIds`. */
  idKey?: keyof TRow & string

  /** Rows per page on first load. Ignored when `paginated` is false. */
  pageSize?: number

  /**
   * Column the list arrives sorted by.
   *
   * Seeds both the query key and the internal record of which column is sorted,
   * so the first manual sort replaces it instead of sending two contradictory
   * order keys. Pass the same value to ProTable's `default-sort` for the header
   * arrow to match.
   */
  defaultSort?: { prop: string, order: 'ascending' | 'descending' }

  /**
   * Whether the endpoint pages.
   *
   * Set false for the endpoints that answer with the whole collection in one
   * call -- the department and menu trees do, and their pages never had a pager.
   * No paging keys are then sent, ProTable renders no pagination, and the
   * response body is read as the array itself rather than as `{ list, count }`.
   */
  paginated?: boolean

  /** Fetch on mount. Set false when the first load must wait on something else. */
  immediate?: boolean

  /**
   * Called when a request fails. The interceptor has already shown the user a
   * message, so this is for extra handling only -- do not report the error
   * again from here.
   */
  onError?: (error: unknown) => void
}

/**
 * What useTable hands back.
 *
 * Every field is a plain value, not a Ref: the object is wrapped in reactive()
 * before it is returned. Vue only auto-unwraps refs that are top-level setup()
 * return values, so a bare `{ loading: Ref<boolean> }` would force each page to
 * destructure the fields it binds -- and `:disabled="table.multiple"` on the
 * un-destructured object silently reads a Ref, which is always truthy. A
 * reactive object unwraps on every property access instead, including through
 * a prop passed to a child component.
 */
export interface UseTableReturn<TRow, TQuery extends object> {
  rows: TRow[]
  total: number
  loading: boolean
  /** Live query state. Bind search inputs straight to it. */
  query: TQuery & PageQuery
  selection: TRow[]
  /**
   * Primary keys of the selected rows; empty when `idKey` was not given.
   *
   * Typed as Id[] rather than as the field's own type: TypeScript cannot infer
   * one type argument and default another, so threading the key's type through
   * would force every caller to spell out all three. Id covers what a primary
   * key can be, and non-primitive values are dropped rather than passed on.
   */
  selectedIds: Id[]
  /** True unless exactly one row is selected -- for `:disabled` on edit buttons. */
  single: boolean
  /** True when nothing is selected -- for `:disabled` on bulk buttons. */
  multiple: boolean
  /** Fetch with the current query. Keeps the current page. */
  getList: () => Promise<void>
  /** Fetch from page 1. What the search button should call. */
  search: () => Promise<void>
  /** Restore the default query and fetch from page 1. */
  resetQuery: () => Promise<void>
  /** Bind to el-table's `selection-change`. */
  handleSelectionChange: (rows: TRow[]) => void
  /** Bind to el-table's `sort-change` on columns marked `sortable="custom"`. */
  handleSortChange: (arg: { prop: string | null, order: string | null }) => Promise<void>
  /** Bind to AppPagination's `pagination`. */
  handlePagination: (payload: { page: number, limit: number }) => Promise<void>
}

const DEFAULT_PAGE_SIZE = 10

export function useTable<TRow extends object, TQuery extends object = Record<string, never>>(
  options: UseTableOptions<TRow, TQuery>
): UseTableReturn<TRow, TQuery> {
  const {
    api,
    defaultQuery = () => ({} as TQuery),
    idKey,
    pageSize = DEFAULT_PAGE_SIZE,
    immediate = true,
    paginated = true,
    defaultSort,
    onError
  } = options

  const rows = ref([]) as Ref<TRow[]>
  const total = ref(0)
  const loading = ref(false)
  const selection = ref([]) as Ref<TRow[]>

  /**
   * The filters plus the page index -- everything a reset restores.
   *
   * pageSize is deliberately absent: it belongs to the pagination control, not
   * to the filter form, and the two have different reset semantics. Including
   * it here would mean rebuilding it on every reset and then writing the user's
   * choice back over the top.
   */
  const sortValue = (order: 'ascending' | 'descending') => order === 'ascending' ? 'asc' : 'desc'

  const buildQuery = () => ({
    ...defaultQuery(),
    ...(defaultSort ? { [`${defaultSort.prop}Order`]: sortValue(defaultSort.order) } : {}),
    ...(paginated ? { pageIndex: 1 } : {})
  }) as TQuery & PageQuery

  /**
   * Seeded once; from then on the pagination control owns pageSize.
   *
   * A non-paginated table carries neither paging key, so nothing sends them to
   * an endpoint that does not read them. They stay on the type because the only
   * code that touches them -- ProTable's pager -- is the code that is not
   * rendered in that case.
   */
  const query = reactive(
    paginated ? { ...buildQuery(), pageSize } : buildQuery()
  ) as TQuery & PageQuery

  /**
   * Identifies the most recent request. A response whose token no longer
   * matches belongs to a superseded request and is dropped -- otherwise a slow
   * early request can land after a fast later one and overwrite it.
   */
  let currentToken = 0

  /**
   * Sorting is sent as `{prop}Order: 'asc' | 'desc'`, which is what the Go side
   * reads. Only one column sorts at a time, so the previous column's key is
   * cleared before the new one is set.
   */
  let sortKey: string | null = defaultSort ? `${defaultSort.prop}Order` : null

  const readPage = (response: ApiResponse<PageResult<TRow> | TRow[]>) => {
    const body = response?.data
    if (!paginated) {
      // The collection arrives as the body itself
      const rows = (Array.isArray(body) ? body : []) as TRow[]
      return { rows, total: rows.length }
    }
    const page = body as PageResult<TRow> | undefined
    return { rows: page?.list ?? [], total: page?.count ?? 0 }
  }

  const getList = async() => {
    const token = ++currentToken
    loading.value = true
    try {
      const response = await api(query)
      if (token !== currentToken) return
      const page = readPage(response)
      rows.value = page.rows
      total.value = page.total
    } catch(error) {
      if (token !== currentToken) return
      // Show an empty table rather than the previous query's rows: the inputs
      // above it now describe a search these rows did not come from. The
      // interceptor has already told the user what went wrong.
      rows.value = []
      total.value = 0
      onError?.(error)
    } finally {
      if (token === currentToken) loading.value = false
    }
  }

  const search = () => {
    // Guarded: writing the key back would put it on a query that deliberately
    // does not carry it.
    if (paginated) query.pageIndex = 1
    return getList()
  }

  const resetQuery = () => {
    // Rebuilt from the factory rather than by calling el-form's resetFields():
    // that only restores fields carrying a matching `prop`, so any filter set
    // from outside the search form -- a tree click, a chart drill-down --
    // survived the reset and silently kept filtering the list.
    const fresh = buildQuery()
    const target = query as Record<string, unknown>
    // Object.assign alone would not be enough: it overwrites the keys the
    // default declares and leaves every other one in place, which is precisely
    // the externally-set filters and sort keys this is meant to clear. pageSize
    // is outside the reset surface -- see buildQuery.
    for (const key of Object.keys(target)) {
      if (key === 'pageSize' && paginated) continue
      if (!(key in fresh)) delete target[key]
    }
    Object.assign(query, fresh)
    // Back to the default sort, not to no sort: buildQuery just restored its key
    sortKey = defaultSort ? `${defaultSort.prop}Order` : null
    selection.value = []
    return getList()
  }

  const handleSelectionChange = (selected: TRow[]) => {
    selection.value = selected
  }

  const handleSortChange = ({ prop, order }: { prop: string | null, order: string | null }) => {
    const target = query as Record<string, unknown>
    if (sortKey) {
      delete target[sortKey]
      sortKey = null
    }
    if (prop && order) {
      sortKey = `${prop}Order`
      target[sortKey] = sortValue(order as 'ascending' | 'descending')
    }
    return search()
  }

  const handlePagination = ({ page, limit }: { page: number, limit: number }) => {
    query.pageIndex = page
    query.pageSize = limit
    return getList()
  }

  const selectedIds = computed<Id[]>(() => {
    if (!idKey) return []
    return selection.value
      .map(row => row[idKey] as unknown)
      .filter((id): id is Id => typeof id === 'string' || typeof id === 'number')
  })

  const single = computed(() => selection.value.length !== 1)
  const multiple = computed(() => selection.value.length === 0)

  if (immediate) {
    onMounted(() => {
      void getList()
    })
  }

  // reactive(), not a plain object: see the note on UseTableReturn. The cast is
  // needed because reactive()'s own UnwrapNestedRefs<T> and the hand-written
  // interface describe the same shape by two different routes.
  return reactive({
    rows,
    total,
    loading,
    query,
    selection,
    selectedIds,
    single,
    multiple,
    getList,
    search,
    resetQuery,
    handleSelectionChange,
    handleSortChange,
    handlePagination
  }) as UseTableReturn<TRow, TQuery>
}
