/**
 * Both pages under src/views/admin/dict: the types list and the entries of one
 * type. One file because the directory is one, and two sections inside it
 * because the two pages name the same column differently -- 编号 against 编码,
 * 字典标签 against 数据标签 -- and merging them would force one of the two
 * spellings onto the other page.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5). 新增 / 修改 / 删除 / 导出 / 创建时间 / 确 定 / 取 消 come from common.ts.
 */
export default {
  /** dict/index.vue -- the dictionary types. */
  type: {
    // ── Search and columns ────────────────────────────────────────
    dictName: '字典名称',
    dictNamePlaceholder: '请输入字典名称',
    dictType: '字典类型',
    dictTypePlaceholder: '请输入字典类型',
    status: '状态',
    statusPlaceholder: '字典状态',
    dictId: '编号',
    remark: '备注',

    // ── Create / edit ─────────────────────────────────────────────
    addTitle: '添加字典类型',
    editTitle: '修改字典类型',
    remarkPlaceholder: '请输入内容',

    removeConfirm: '确认删除选中的 {count} 个字典类型？',

    // ── Export ────────────────────────────────────────────────────
    exportFilename: '字典类型',
    exportHeader: {
      dictId: '编号',
      dictName: '字典名称',
      dictType: '字典类型',
      status: '状态',
      remark: '备注'
    },

    rules: {
      dictName: '字典名称不能为空',
      dictType: '字典类型不能为空'
    }
  },

  /** dict/data.vue -- the entries of one dictionary. */
  data: {
    // ── Search and columns ────────────────────────────────────────
    // The search bar labels the type picker 字典名称 while the form labels the
    // same field 字典类型: the picker shows names, the form shows the type
    // string. Both are kept.
    dictName: '字典名称',
    dictLabel: '字典标签',
    dictLabelPlaceholder: '请输入字典标签',
    status: '状态',
    statusPlaceholder: '数据状态',
    dictCode: '编码',
    dictValue: '字典键值',
    dictSort: '排序',
    remark: '备注',

    // ── Create / edit ─────────────────────────────────────────────
    addTitle: '添加字典数据',
    editTitle: '修改字典数据',
    dictType: '字典类型',
    label: '数据标签',
    labelPlaceholder: '请输入数据标签',
    value: '数据键值',
    valuePlaceholder: '请输入数据键值',
    displaySort: '显示排序',
    remarkPlaceholder: '请输入内容',

    removeConfirm: '确认删除选中的 {count} 条字典数据？',

    rules: {
      dictLabel: '数据标签不能为空',
      dictValue: '数据键值不能为空',
      dictSort: '显示排序不能为空'
    }
  }
}
