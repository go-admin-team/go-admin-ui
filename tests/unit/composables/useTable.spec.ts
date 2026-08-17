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
 * The wrapper is returned so tests that need it can unmount.
 */
function setup(options: UseTableOptions<Row, Query>) {
  let api!: UseTableReturn<Row, Query>
  const wrapper = mount(defineComponent({
    setup() {
      api = useTable<Row, Query>(options)
      return () => h('div')
    }
  }))
  return { table: api, wrapper }
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
    setup({ api, defaultQuery: () => ({ name: 'seed' }), pageSize: 25 })

    await flushPromises()

    expect(api).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'seed', pageIndex: 1, pageSize: 25 })
    )
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
    const { table } = setup({ api, immediate: false })

    table.query.pageIndex = 3
    await table.search()

    expect(table.query.pageIndex).toBe(1)
    expect(api).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 1 }))
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

  it('resetQuery() also clears the active sort', async() => {
    const api = vi.fn().mockResolvedValue(page([]))
    const { table } = setup({ api, immediate: false })

    await table.handleSortChange({ prop: 'createdAt', order: 'descending' })
    await table.resetQuery()

    const afterReset = api.mock.lastCall?.[0] as Record<string, unknown>
    expect('createdAtOrder' in afterReset).toBe(false)

    // The internal sort key must be forgotten too, or the next sort would try to
    // delete a key that is no longer there and leave its own behind.
    await table.handleSortChange({ prop: 'username', order: 'ascending' })
    const afterSort = api.mock.lastCall?.[0] as Record<string, unknown>
    expect(afterSort.usernameOrder).toBe('asc')
    expect('createdAtOrder' in afterSort).toBe(false)
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
      const { table } = setup({ api, immediate: false })

      await table.handleSortChange({ prop: 'createdAt', order: 'descending' })
      expect(api).toHaveBeenLastCalledWith(expect.objectContaining({ createdAtOrder: 'desc' }))

      await table.handleSortChange({ prop: 'username', order: 'ascending' })
      const lastQuery = api.mock.lastCall?.[0] as Record<string, unknown>
      expect(lastQuery.usernameOrder).toBe('asc')
      expect('createdAtOrder' in lastQuery).toBe(false)
    })

    it('removes the sort key when the column is unsorted', async() => {
      const api = vi.fn().mockResolvedValue(page([]))
      const { table } = setup({ api, immediate: false })

      await table.handleSortChange({ prop: 'createdAt', order: 'descending' })
      await table.handleSortChange({ prop: 'createdAt', order: null })

      const lastQuery = api.mock.lastCall?.[0] as Record<string, unknown>
      expect('createdAtOrder' in lastQuery).toBe(false)
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

  it('reads a non-standard response through transform', async() => {
    const api = vi.fn().mockResolvedValue({
      code: 200,
      msg: 'ok',
      data: { records: [{ id: 3, name: 'c' }], totalCount: 9 }
    })
    const { table } = setup({
      api,
      transform: response => {
        const body = (response as ApiResponse<{ records: Row[], totalCount: number }>).data
        return { rows: body.records, total: body.totalCount }
      }
    })

    await flushPromises()

    expect(table.rows).toEqual([{ id: 3, name: 'c' }])
    expect(table.total).toBe(9)
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
    const { table } = setup({ api, immediate: false })

    await table.handlePagination({ page: 3, limit: 50 })

    expect(table.query.pageIndex).toBe(3)
    expect(table.query.pageSize).toBe(50)
    expect(api).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 3, pageSize: 50 }))
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
