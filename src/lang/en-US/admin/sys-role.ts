export default {
  roleName: 'Role Name',
  roleNamePlaceholder: 'Please enter role name',
  // Not 'Permission Key', which is sys-menu's 权限标识: this one identifies the
  // role itself, and the two appear in the same product.
  roleKey: 'Role Key',
  roleKeyPlaceholder: 'Please enter role key',
  status: 'Status',
  statusPlaceholder: 'Role status',

  roleId: 'ID',
  name: 'Name',
  sort: 'Order',

  addTitle: 'Add Role',
  editTitle: 'Edit Role',
  roleSort: 'Display Order',
  menuPermission: 'Menu Permissions',
  remark: 'Remark',
  remarkPlaceholder: 'Please enter content',
  treeLoading: 'Loading, please wait',
  adminNeedsNoMenus: 'The super administrator already holds every permission',

  dataScope: 'Data Scope',
  dataScopeTitle: 'Assign Data Scope',
  scope: 'Scope',
  scopeOptions: {
    all: 'All data',
    custom: 'Custom data',
    dept: 'This department',
    deptAndBelow: 'This department and below',
    self: 'Own data only'
  },
  dataScopeSaved: 'Data scope saved',

  enableConfirm: 'Enable role "{name}"?',
  disableConfirm: 'Disable role "{name}"?',
  enableOk: 'Enabled successfully',
  disableOk: 'Disabled successfully',

  exportFilename: 'Role Management',
  exportHeader: {
    roleId: 'Role ID',
    roleName: 'Role Name',
    roleKey: 'Role Key',
    roleSort: 'Display Order',
    status: 'Status',
    createdAt: 'Created At'
  },

  rules: {
    roleName: 'Role name is required',
    roleKey: 'Role key is required',
    roleSort: 'Display order is required'
  }
}
