/**
 * 列表页通用逻辑。
 *
 * 各列表页的分页查询、搜索重置、多选、新增/修改弹窗、删除确认这几段代码此前
 * 在每个页面各写一遍，实现完全相同，仅接口函数与主键字段名不同。此 mixin 将
 * 其收敛，页面只需通过 crudOptions() 声明差异部分。
 *
 * 用法见 src/views/demo/product/index.vue。
 *
 * 页面需实现：
 *   crudOptions() {
 *     return {
 *       api:  { list, get, add, update, del },  // 缺省的操作可不传
 *       idKey: 'id',                            // 主键字段名，默认 'id'
 *       defaultForm: () => ({ ... })            // 表单初始值
 *     }
 *   }
 *
 * mixin 提供的 data：list / total / loading / ids / single / multiple /
 *   open / title / form / queryParams
 *
 * mixin 提供的方法：getList / handleQuery / resetQuery / handleSelectionChange /
 *   handleAdd / handleUpdate / handleDelete / cancel / reset / submitForm
 */
export default {
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      // 选中项主键，供批量操作使用
      ids: [],
      // 是否恰好选中一项 / 是否未选中任何项，用于按钮禁用
      single: true,
      multiple: true,
      open: false,
      title: '',
      form: {},
      queryParams: {
        pageIndex: 1,
        pageSize: 10
      }
    }
  },

  computed: {
    // 缓存 crudOptions() 的结果，避免每次访问都重新构造
    crud() {
      return {
        idKey: 'id',
        api: {},
        defaultForm: () => ({}),
        ...(typeof this.crudOptions === 'function' ? this.crudOptions() : {})
      }
    }
  },

  created() {
    this.reset()
  },

  methods: {
    getList() {
      const { list } = this.crud.api
      if (!list) return Promise.resolve()

      this.loading = true
      return list(this.queryParams)
        .then(res => {
          // 后端分页响应固定为 { data: { list, count } }
          this.list = (res.data && res.data.list) || []
          this.total = (res.data && res.data.count) || 0
        })
        .finally(() => {
          this.loading = false
        })
    },

    handleQuery() {
      this.queryParams.pageIndex = 1
      return this.getList()
    },

    resetQuery() {
      this.resetForm('queryForm')
      return this.handleQuery()
    },

    handleSelectionChange(selection) {
      const key = this.crud.idKey
      this.ids = selection.map(item => item[key])
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },

    reset() {
      this.form = this.crud.defaultForm()
      this.resetForm('form')
    },

    cancel() {
      this.open = false
      this.reset()
    },

    handleAdd() {
      this.reset()
      this.open = true
      this.title = '新增'
    },

    handleUpdate(row) {
      this.reset()
      const { get } = this.crud.api
      const id = (row && row[this.crud.idKey]) || this.ids[0]
      if (!get) return

      return get(id).then(res => {
        this.form = res.data
        this.open = true
        this.title = '修改'
      })
    },

    submitForm() {
      return this.$refs.form.validate(valid => {
        if (!valid) return
        const { add, update } = this.crud.api
        const id = this.form[this.crud.idKey]
        const action = id ? update : add
        if (!action) return

        return action(this.form).then(res => {
          if (res.code !== 200) return this.msgError(res.msg)
          this.msgSuccess(id ? '修改成功' : '新增成功')
          this.open = false
          this.getList()
        })
      })
    },

    handleDelete(row) {
      const { del } = this.crud.api
      if (!del) return

      // 有 row 时删单条，否则删当前选中项
      const ids = row ? [row[this.crud.idKey]] : this.ids
      return this.$confirm(`确认删除选中的 ${ids.length} 条数据？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => del({ ids }))
        .then(res => {
          if (res.code !== 200) return this.msgError(res.msg)
          this.msgSuccess('删除成功')
          this.getList()
        })
        .catch(() => {})
    }
  }
}
