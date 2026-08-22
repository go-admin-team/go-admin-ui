import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useTable } from '@/composables/useTable'
import type { UseTableOptions, UseTableReturn } from '@/composables/useTable'
import type { ApiResponse, PageResult } from '@/types/api'
import { deferred, flushPromises } from '../support/async'

interface Row { id: number, name: string }
interface Query { name?: string, status?: string }

const page = (rows: Row[], count = rows.length): ApiResponse<PageResult<Row>> => ({
  code: 200,
  msg: 'ok',
  data: { list: rows, count }
})

/**
 * useTable registers an onMounted hook, so it has to run inside a component.
 *
 * `queries` holds a copy of the query as it was at each call. Asserting on
 * `api.mock.calls` directly does not work here: useTable hands the same live
 * reactive object to every call, so a recorded argument reflects the state at
 * assertion time rather than at call time -- which makes an assertion like
 * "search() sent pageIndex 1" pass even if the reset happened afterwards.
 */
function setup(options: UseTableOptions<Row, Query>) {
  let api!: UseTableReturn<Row, Query>
  const queries: Array<Record<string, unknown>> = []
  const recording = {
    ...options,
    api: (query: Parameters<typeof options.api>[0]) => {
      queries.push({ ...query })
      return options.api(query)
    }
  }
  const wrapper = mount(defineComponent({
    setup() {
      api = useTable<Row, Query>(recording)
      return () => h('div')
    }
  }))
  return { table: api, wrapper, queries }
}

describe('useTable', () => {
  it('loads on mount and maps { list, count } onto rows and total', async() => {
    const api = vi.fn().mockResolvedValue(page([{ id: 1, name: 'a' }], 42))
    const { table } = setup({ api })

    await flushPromises()

    expect(api).toHaveBeenCalledTimes(1)
    expect(table.rows).toEqual([{ id: 1, name: 'a' }])
    expect(table.total).toBe(42)
    expect(table.loading).toBe(false)
  })

  it('does not load on mount when immediate is false', async() => {
    const api = vi.fn().mockResolvedValue(page([]))
    setup({ api, immediate: false })

    await flushPromises()

    expect(api).not.toHaveBeenCalled()
  })

  it('sends the paging keys along with the default query', async() => {
    const api = vi.fn().mockResolvedValue(page([]))
    const { queries } = setup({ api, defaultQuery: () => ({ name: 'seed' }), pageSize: 25 })

    await flushPromises()

    expect(queries.at(-1)).toMatchObject({ name: 'seed', pageIndex: 1, pageSize: 25 })
  })

  // The bug this covers: pages that set loading = false inside .then() only left
  // the spinner turning forever on any server error, and the interceptor rejects
  // on every non-200 code.
  it('clears loading and empties the table when the request fails', async() => {
    const api = vi.fn()
      .mockResolvedValueOnce(page([{ id: 1, name: 'a' }]))
      .mockRejectedValueOnce(new Error('500'))
    const onError = vi.fn()
    const { table } = setup({ api, onError })

    await flushPromises()
    expect(table.rows).toHaveLength(1)

    await table.getList()

    expect(table.loading).toBe(false)
    expect(table.rows).toEqual([])
    expect(table.total).toBe(0)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  // Typing in a search box fires overlapping requests. Without the token check
  // the first response to arrive wins, which is whichever the server happened to
  // answer fastest -- not what the user last typed.
  it('discards a response that a newer request has superseded', async() => {
    const first = deferred<ApiResponse<PageResult<Row>>>()
    const second = deferred<ApiResponse<PageResult<Row>>>()
    const api = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const { table } = setup({ api, immediate: false })

    const firstCall = table.getList()
    const secondCall = table.getList()

    // The newer request answers first, then the stale one arrives late
    second.resolve(page([{ id: 2, name: 'newer' }]))
    await secondCall
    first.resolve(page([{ id: 1, name: 'stale' }]))
    await firstCall

    expect(table.rows).toEqual([{ id: 2, name: 'newer' }])
    expect(table.loading).toBe(false)
  })

  it('does not leave loading stuck when a superseded request fails', async() => {
    const first = deferred<ApiResponse<PageResult<Row>>>()
    const second = deferred<ApiResponse<PageResult<Row>>>()
    const api = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const onError = vi.fn()

    const { table } = setup({ api, immediate: false, onError })

    const firstCall = table.getList()
    const secondCall = table.getList()

    second.resolve(page([{ id: 2, name: 'newer' }]))
    await secondCall
    first.reject(new Error('stale failure'))
    await firstCall

    expect(table.rows).toEqual([{ id: 2, name: 'newer' }])
    expect(table.loading).toBe(false)
    // The superseded failure is not the user's problem
    expect(onError).not.toHaveBeenCalled()
  })

  // sys-user set `queryParams.page = 1`, a key the backend does not read, so
  // searching from page 3 returned page 3 of the new result set.
  it('search() returns to page 1', async() => {
    const api = vi.fn().mockResolvedValue(page([]))
    const { table, queries } = setup({ api, immediate: false })

    table.query.pageIndex = 3
    await table.search()

    expect(table.query.pageIndex).toBe(1)
    // The snapshot, not the live object: this has to fail if search() ever
    // fetches first and resets the page afterwards
    expect(queries.at(-1)?.pageIndex).toBe(1)
  })

  // el-form's resetFields() only restores fields carrying a matching `prop`, so
  // a filter set from outside the search form -- a tree click, say -- survived
  // the reset and kept filtering the list.
  it('resetQuery() clears filters that were set outside the search form', async() => {
    const api = vi.fn().mockResolvedValue(page([]))
    const { table } = setup({ api, immediate: false, defaultQuery: () => ({ name: '' }) })

    table.query.name = 'typed'
    ;(table.query as unknown as Record<string, unknown>).deptId = '/3/'
    table.query.pageIndex = 4

    await table.resetQuery()

    expect(table.query.name).toBe('')
    expect((table.query as unknown as Record<string, unknown>).deptId).toBeUndefined()
    expect(table.query.pageIndex).toBe(1)
  })

  // A reset clears filters. Snapping a user who chose 50 条/页 back to 10 reads
  // as a bug from the outside, so the page size survives.
  it('resetQuery() keeps the page size the user chose', async() => {
    const api = vi.fn().mockResolvedValue(page([]))
    const { table, queries } = setup({ api, immediate: false, defaultQuery: () => ({ name: '' }) })

    await table.handlePagination({ page: 3, limit: 50 })
    table.query.name = 'typed'

    await table.resetQuery()

    expect(table.query.name).toBe('')
    expect(table.query.pageIndex).toBe(1)
    expect(table.query.pageSize).toBe(50)
    expect(queries.at(-1)?.pageSize).toBe(50)
  })

  it('resetQuery() also clears the active sort', async() => {
    const api = vi.fn().mockResolvedValue(page([]))
    const { table, queries } = setup({ api, immediate: false })

    await table.handleSortChange({ prop: 'createdAt', order: 'descending' })
    await table.resetQuery()

    expect('createdAtOrder' in (queries.at(-1) as object)).toBe(false)

    // The internal sort key must be forgotten too, or the next sort would try to
    // delete a key that is no longer there and leave its own behind.
    await table.handleSortChange({ prop: 'username', order: 'ascending' })
    expect(queries.at(-1)?.usernameOrder).toBe('asc')
    expect('createdAtOrder' in (queries.at(-1) as object)).toBe(false)
  })

  it('drops the selection when the query is reset', async() => {
    const api = vi.fn().mockResolvedValue(page([]))
    const { table } = setup({ api, immediate: false, idKey: 'id' })

    table.handleSelectionChange([{ id: 1, name: 'a' }])
    expect(table.selectedIds).toEqual([1])

    await table.resetQuery()

    expect(table.selection).toEqual([])
    expect(table.multiple).toBe(true)
  })

  describe('sorting', () => {
    it('sends {prop}Order and clears the previous column', async() => {
      const api = vi.fn().mockResolvedValue(page([]))
      const { table, queries } = setup({ api, immediate: false })

      await table.handleSortChange({ prop: 'createdAt', order: 'descending' })
      expect(queries.at(-1)?.createdAtOrder).toBe('desc')

      await table.handleSortChange({ prop: 'username', order: 'ascending' })
      expect(queries.at(-1)?.usernameOrder).toBe('asc')
      expect('createdAtOrder' in (queries.at(-1) as object)).toBe(false)
    })

    it('removes the sort key when the column is unsorted', async() => {
      const api = vi.fn().mockResolvedValue(page([]))
      const { table, queries } = setup({ api, immediate: false })

      await table.handleSortChange({ prop: 'createdAt', order: 'descending' })
      await table.handleSortChange({ prop: 'createdAt', order: null })

      expect('createdAtOrder' in (queries.at(-1) as object)).toBe(false)
    })
  })

  describe('selection', () => {
    it('derives ids, single and multiple from the selected rows', async() => {
      const api = vi.fn().mockResolvedValue(page([]))
      const { table } = setup({ api, immediate: false, idKey: 'id' })

      expect(table.single).toBe(true)
      expect(table.multiple).toBe(true)

      table.handleSelectionChange([{ id: 7, name: 'a' }])
      expect(table.selectedIds).toEqual([7])
      expect(table.single).toBe(false)
      expect(table.multiple).toBe(false)

      table.handleSelectionChange([{ id: 7, name: 'a' }, { id: 8, name: 'b' }])
      expect(table.selectedIds).toEqual([7, 8])
      // Two rows selected: an edit button targeting one row stays disabled
      expect(table.single).toBe(true)
      expect(table.multiple).toBe(false)
    })

    it('yields no ids when idKey was not given', async() => {
      const api = vi.fn().mockResolvedValue(page([]))
      const { table } = setup({ api, immediate: false })

      table.handleSelectionChange([{ id: 7, name: 'a' }])

      expect(table.selectedIds).toEqual([])
    })
  })

  // The department and menu endpoints answer with the whole tree and their pages
  // never had a pager. Sending pageIndex/pageSize to them is noise, and reading
  // `{ list, count }` off an array yields an empty table.
  // A page whose list arrives pre-sorted has to record which column that is, or
  // the first manual sort adds its key beside the default one and the backend
  // receives two contradictory orders.
  describe('defaultSort', () => {
    it('sends the default order key on the first load', async() => {
      const api = vi.fn().mockResolvedValue(page([]))
      const { queries } = setup({ api, defaultSort: { prop: 'createdAt', order: 'descending' }})

      await flushPromises()

      expect(queries.at(-1)?.createdAtOrder).toBe('desc')
    })

    it('replaces it when another column is sorted', async() => {
      const api = vi.fn().mockResolvedValue(page([]))
      const { table, queries } = setup({
        api,
        immediate: false,
        defaultSort: { prop: 'createdAt', order: 'descending' }
      })

      await table.handleSortChange({ prop: 'name', order: 'ascending' })

      const sent = queries.at(-1) as Record<string, unknown>
      expect(sent.nameOrder).toBe('asc')
      expect('createdAtOrder' in sent).toBe(false)
    })

    it('restores it on reset', async() => {
      const api = vi.fn().mockResolvedValue(page([]))
      const { table, queries } = setup({
        api,
        immediate: false,
        defaultSort: { prop: 'createdAt', order: 'descending' }
      })

      await table.handleSortChange({ prop: 'name', order: 'ascending' })
      await table.resetQuery()

      const sent = queries.at(-1) as Record<string, unknown>
      expect(sent.createdAtOrder).toBe('desc')
      expect('nameOrder' in sent).toBe(false)

      // And the restored key is tracked, so the next sort replaces it too
      await table.handleSortChange({ prop: 'name', order: 'ascending' })
      expect('createdAtOrder' in (queries.at(-1) as object)).toBe(false)
    })
  })

  describe('paginated: false', () => {
    const tree = [{ id: 1, name: 'root' }, { id: 2, name: 'other' }]

    it('reads the body as the collection', async() => {
      const api = vi.fn().mockResolvedValue({ code: 200, msg: 'ok', data: tree })
      const { table } = setup({ api, paginated: false })

      await flushPromises()

      expect(table.rows).toEqual(tree)
      expect(table.total).toBe(2)
    })

    it('sends no paging keys', async() => {
      const api = vi.fn().mockResolvedValue({ code: 200, msg: 'ok', data: tree })
      const { queries } = setup({ api, paginated: false, defaultQuery: () => ({ name: 'x' }) })

      await flushPromises()

      const sent = queries.at(-1) as Record<string, unknown>
      expect(sent.name).toBe('x')
      expect('pageIndex' in sent).toBe(false)
      expect('pageSize' in sent).toBe(false)
    })

    it('still searches and resets without reintroducing paging keys', async() => {
      const api = vi.fn().mockResolvedValue({ code: 200, msg: 'ok', data: tree })
      const { table, queries } = setup({ api, paginated: false, defaultQuery: () => ({ name: '' }) })
      await flushPromises()

      table.query.name = 'typed'
      await table.search()
      expect(queries.at(-1)).toMatchObject({ name: 'typed' })
      expect('pageIndex' in (queries.at(-1) as object)).toBe(false)

      await table.resetQuery()
      expect(table.query.name).toBe('')
      expect('pageSize' in (queries.at(-1) as object)).toBe(false)
    })

    it('tolerates a body that is not an array', async() => {
      const api = vi.fn().mockResolvedValue({ code: 200, msg: 'ok', data: null })
      const { table } = setup({ api, paginated: false })

      await flushPromises()

      expect(table.rows).toEqual([])
      expect(table.total).toBe(0)
    })
  })

  it('tolerates a response with no body', async() => {
    const api = vi.fn().mockResolvedValue({ code: 200, msg: 'ok' })
    const { table } = setup({ api })

    await flushPromises()

    expect(table.rows).toEqual([])
    expect(table.total).toBe(0)
  })

  it('handlePagination writes both page and size into the query', async() => {
    const api = vi.fn().mockResolvedValue(page([]))
    const { table, queries } = setup({ api, immediate: false })

    await table.handlePagination({ page: 3, limit: 50 })

    expect(table.query.pageIndex).toBe(3)
    expect(table.query.pageSize).toBe(50)
    expect(queries.at(-1)).toMatchObject({ pageIndex: 3, pageSize: 50 })
  })

  it('exposes loading while a request is in flight', async() => {
    const pending = deferred<ApiResponse<PageResult<Row>>>()
    const api = vi.fn().mockReturnValue(pending.promise)
    const { table } = setup({ api, immediate: false })

    const call = table.getList()
    await nextTick()
    expect(table.loading).toBe(true)

    pending.resolve(page([]))
    await call
    expect(table.loading).toBe(false)
  })
})
