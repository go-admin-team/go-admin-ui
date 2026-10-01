export default {
  deptName: 'Department Name',
  deptNamePlaceholder: 'Enter department name',
  status: 'Status',
  statusPlaceholder: 'Department status',
  sort: 'Order',

  addTitle: 'Add Department',
  editTitle: 'Edit Department',
  rootCategory: 'Root',
  parent: 'Parent Department',
  parentPlaceholder: 'Select parent department',
  displaySort: 'Display Order',
  leader: 'Leader',
  leaderPlaceholder: 'Enter leader',
  phone: 'Phone',
  phonePlaceholder: 'Enter phone number',
  email: 'Email',
  emailPlaceholder: 'Enter email',
  deptStatus: 'Department Status',

  removeConfirm: 'Delete this department? Its sub-departments will be deleted with it.',

  rules: {
    parentId: 'Parent department is required',
    deptName: 'Department name is required',
    sort: 'Order is required',
    leader: 'Leader is required',
    emailFormat: 'Please enter a valid email address',
    phoneFormat: 'Please enter a valid phone number'
  }
}
