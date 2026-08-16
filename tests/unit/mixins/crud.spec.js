import crud from '@/mixins/crud'

// crud mixin 是所有列表页的公共基础，行为变化会同时影响多个页面，
// 因此对其关键约定加测试锁定。

// 构造一个最小宿主，模拟 Vue 组件实例上 mixin 依赖的外部能力
function makeVm(options = {}, overrides = {}) {
  const vm = {
    ...crud.data(),
    crudOptions: () => options,
    // 全局方法（由 main.js 注入）
    resetForm: vi.fn(),
    msgSuccess: vi.fn(),
    msgError: vi.fn(),
    $confirm: vi.fn(() => Promise.resolve()),
    $refs: { form: { validate: cb => cb(true) } },
    ...overrides
  }
  Object.defineProperty(vm, 'crud', {
    get: () => crud.computed.crud.call(vm)
  })
  Object.entries(crud.methods).forEach(([k, fn]) => {
    vm[k] = fn.bind(vm)
  })
  return vm
}

describe('Mixins:crud', () => {
  it('未声明 crudOptions 时提供安全默认值', () => {
    const vm = makeVm()
    expect(vm.crud.idKey).toBe('id')
    expect(vm.crud.api).toEqual({})
    expect(vm.crud.defaultForm()).toEqual({})
  })

  it('getList 按 { data: { list, count } } 结构解析响应', async () => {
    const list = vi.fn(() => Promise.resolve({ data: { list: [{ id: 1 }], count: 7 } }))
    const vm = makeVm({ api: { list } })

    await vm.getList()

    expect(vm.list).toEqual([{ id: 1 }])
    expect(vm.total).toBe(7)
    expect(vm.loading).toBe(false)
  })

  it('getList 出错后 loading 必须归位', async () => {
    const list = vi.fn(() => Promise.reject(new Error('boom')))
    const vm = makeVm({ api: { list } })

    await vm.getList().catch(() => {})

    expect(vm.loading).toBe(false)
  })

  it('未提供 list 接口时不抛异常', async () => {
    const vm = makeVm()
    await expect(vm.getList()).resolves.toBeUndefined()
  })

  it('handleQuery 重置到第一页', async () => {
    const list = vi.fn(() => Promise.resolve({ data: { list: [], count: 0 } }))
    const vm = makeVm({ api: { list } })
    vm.queryParams.pageIndex = 5

    await vm.handleQuery()

    expect(vm.queryParams.pageIndex).toBe(1)
  })

  it('handleSelectionChange 按 idKey 取主键并维护禁用状态', () => {
    const vm = makeVm({ idKey: 'postId' })

    vm.handleSelectionChange([{ postId: 3 }, { postId: 8 }])
    expect(vm.ids).toEqual([3, 8])
    expect(vm.single).toBe(true) // 非恰好一项
    expect(vm.multiple).toBe(false)

    vm.handleSelectionChange([{ postId: 3 }])
    expect(vm.single).toBe(false) // 恰好一项
    expect(vm.multiple).toBe(false)

    vm.handleSelectionChange([])
    expect(vm.ids).toEqual([])
    expect(vm.multiple).toBe(true)
  })

  it('handleAdd 重置表单并打开弹窗', () => {
    const vm = makeVm({ defaultForm: () => ({ name: '默认' }) })
    vm.form = { name: '脏数据' }

    vm.handleAdd()

    expect(vm.form).toEqual({ name: '默认' })
    expect(vm.open).toBe(true)
  })

  it('submitForm 按主键有无选择新增或修改', async () => {
    const add = vi.fn(() => Promise.resolve({ code: 200 }))
    const update = vi.fn(() => Promise.resolve({ code: 200 }))
    const list = vi.fn(() => Promise.resolve({ data: { list: [], count: 0 } }))

    const vmAdd = makeVm({ api: { add, update, list } })
    vmAdd.form = { id: undefined, name: '新' }
    await vmAdd.submitForm()
    expect(add).toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()

    const vmUpd = makeVm({ api: { add, update, list } })
    vmUpd.form = { id: 9, name: '改' }
    await vmUpd.submitForm()
    expect(update).toHaveBeenCalled()
  })

  it('校验未通过时不提交', async () => {
    const add = vi.fn()
    const vm = makeVm({ api: { add } }, { $refs: { form: { validate: cb => cb(false) } } })
    vm.form = { name: '' }

    await vm.submitForm()

    expect(add).not.toHaveBeenCalled()
  })

  it('handleDelete 传 row 时删单条，不传时删选中项', async () => {
    const del = vi.fn(() => Promise.resolve({ code: 200 }))
    const list = vi.fn(() => Promise.resolve({ data: { list: [], count: 0 } }))

    const vm = makeVm({ api: { del, list } })
    vm.ids = [1, 2, 3]

    await vm.handleDelete({ id: 42 })
    expect(del).toHaveBeenLastCalledWith({ ids: [42] })

    await vm.handleDelete()
    expect(del).toHaveBeenLastCalledWith({ ids: [1, 2, 3] })
  })

  it('取消删除确认时不调用接口', async () => {
    const del = vi.fn()
    const vm = makeVm({ api: { del } }, { $confirm: () => Promise.reject(new Error('cancel')) })

    await vm.handleDelete({ id: 1 })

    expect(del).not.toHaveBeenCalled()
  })
})
