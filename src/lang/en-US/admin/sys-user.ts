export default {
  deptNamePlaceholder: 'Please enter department name',
  dept: 'Department',
  deptPlaceholder: 'Select department',
  username: 'Username',
  usernamePlaceholder: 'Please enter username',
  phone: 'Phone Number',
  phonePlaceholder: 'Please enter phone number',
  status: 'Status',
  statusPlaceholder: 'User status',

  userId: 'ID',
  loginName: 'Login Name',
  nickNameColumn: 'Nickname',
  phoneColumn: 'Phone',

  resetPasswordFor: 'Reset password: {name}',

  addTitle: 'Add User',
  editTitle: 'Edit User',
  nickName: 'Nickname',
  nickNamePlaceholder: 'Please enter nickname',
  deptId: 'Department',
  deptIdPlaceholder: 'Please select a department',
  email: 'Email',
  emailPlaceholder: 'Please enter email',
  password: 'Password',
  passwordPlaceholder: 'Please enter password',
  sex: 'Gender',
  selectPlaceholder: 'Please select',
  post: 'Position',
  role: 'Role',
  remark: 'Remark',
  remarkPlaceholder: 'Please enter content',

  resetPassword: 'Reset Password',
  user: 'User',
  newPassword: 'New Password',
  newPasswordPlaceholder: 'Please enter the new password',
  resetOk: 'Password has been reset',

  // Pluralised, which Chinese does not need: 个用户 covers any count, while
  // 'the 1 selected users' does not. The count is passed as the plural choice
  // as well as a named value, and a message with no `|` -- every Chinese one --
  // is returned whole.
  removeConfirm: 'Delete the selected user? | Delete the {count} selected users?',
  enableConfirm: 'Enable user "{name}"?',
  disableConfirm: 'Disable user "{name}"?',
  enableOk: 'Enabled successfully',
  disableOk: 'Disabled successfully',

  rules: {
    username: 'Username is required',
    nickName: 'Nickname is required',
    deptId: 'Department is required',
    password: 'Password is required',
    email: 'Email is required',
    emailFormat: 'Please enter a valid email address',
    phone: 'Phone number is required',
    phoneFormat: 'Please enter a valid phone number',
    newPassword: 'New password is required',
    passwordLength: 'Password must be 6 to 20 characters'
  }
}
