/**
 * The text the composables put on screen themselves.
 *
 * These are defaults, not page copy: useRemove and useForm ship a sentence for
 * pages that do not pass their own, and until now those sentences were Chinese
 * literals inside the composable -- so an English reader deleting a row met an
 * English question inside a Chinese dialog with Chinese buttons. Every list page
 * goes through them, which is why they are here rather than in one page's file.
 *
 * The words the dialogs share with the toolbar -- 提示 / 确定 / 取消 / 新增 /
 * 修改 -- stay in common.ts and are read from there.
 *
 * Every Chinese value must be byte-for-byte what the interface renders today --
 * PRD R5.
 */
export default {
  remove: {
    // The count is interpolated by name so the sentence can put it where the
    // language needs it; the template literal it replaces read
    // `确认删除选中的 ${count} 条数据？`.
    confirm: '确认删除选中的 {count} 条数据？',
    success: '删除成功'
  },

  form: {
    addSuccess: '新增成功',
    editSuccess: '修改成功'
  }
}
