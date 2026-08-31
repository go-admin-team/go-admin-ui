export default {
  // 'Position', never 'Post': the glossary settles it, because Post reads as a
  // message or as mailing before it reads as a job.
  postCode: 'Position Code',
  postCodePlaceholder: 'Please enter position code',
  postName: 'Position Name',
  postNamePlaceholder: 'Please enter position name',
  status: 'Status',
  statusPlaceholder: 'Position status',

  postId: 'Position ID',
  postSort: 'Order',

  addTitle: 'Add Position',
  editTitle: 'Edit Position',
  // The Chinese distinguishes 请输入岗位编码 from 请输入编码名称; English does
  // not, and inventing a difference here would only puzzle the reader. Both
  // keys stay, so the Chinese keeps its two spellings.
  codeNamePlaceholder: 'Please enter position code',
  sort: 'Display Order',
  postStatus: 'Position Status',
  remark: 'Remark',
  remarkPlaceholder: 'Please enter content',

  exportFilename: 'Position Management',
  exportHeader: {
    postId: 'Position ID',
    postCode: 'Position Code',
    postName: 'Position Name',
    sort: 'Order',
    createdAt: 'Created At'
  },

  rules: {
    postName: 'Position name is required',
    postCode: 'Position code is required',
    sort: 'Display order is required'
  }
}
