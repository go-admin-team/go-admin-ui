/**
 * The position page.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5). The page carries three spellings of the same idea -- 岗位排序 in the
 * column, 岗位顺序 on the form, 排序 in the exported sheet -- and all three are
 * kept, because the assertions in tests/e2e/mocked/sys-post.spec.ts read the
 * interface as it is today.
 *
 * 新增 / 修改 / 删除 / 导出 / 创建时间 / 确 定 / 取 消 come from common.ts.
 */
export default {
  // ── Search ──────────────────────────────────────────────────────
  postCode: '岗位编码',
  postCodePlaceholder: '请输入岗位编码',
  postName: '岗位名称',
  postNamePlaceholder: '请输入岗位名称',
  status: '状态',
  statusPlaceholder: '岗位状态',

  // ── Columns ─────────────────────────────────────────────────────
  postId: '岗位编号',
  postSort: '岗位排序',

  // ── Create / edit ───────────────────────────────────────────────
  addTitle: '添加岗位',
  editTitle: '修改岗位',
  /**
   * The form's placeholder under 岗位编码, worded differently from the search
   * bar's 请输入岗位编码. Both spellings are kept rather than merged.
   */
  codeNamePlaceholder: '请输入编码名称',
  sort: '岗位顺序',
  postStatus: '岗位状态',
  remark: '备注',
  remarkPlaceholder: '请输入内容',

  // ── Export ──────────────────────────────────────────────────────
  exportFilename: '岗位管理',
  exportHeader: {
    postId: '岗位编号',
    postCode: '岗位编码',
    postName: '岗位名称',
    sort: '排序',
    createdAt: '创建时间'
  },

  rules: {
    postName: '岗位名称不能为空',
    postCode: '岗位编码不能为空',
    sort: '岗位顺序不能为空'
  }
}
