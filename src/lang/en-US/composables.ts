export default {
  remove: {
    // Pluralised, which Chinese does not need: 条数据 covers any count, while
    // 'the 1 selected records' does not. Same shape as admin.sysUser.
    // removeConfirm -- the count is passed as the plural choice as well as a
    // named value, and a message with no `|` is returned whole.
    confirm: 'Delete the selected record? | Delete the {count} selected records?',
    success: 'Deleted successfully'
  },

  form: {
    addSuccess: 'Added successfully',
    // 'Saved', not 'Edited': the toast reports that the change reached the
    // server, and 'Edited successfully' describes the reader's own action back
    // at them. 修改 is still Edit everywhere it labels the action itself.
    editSuccess: 'Saved successfully'
  }
}
