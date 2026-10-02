export default {
  deptNamePlaceholder: 'Search department',
  dept: 'Department',
  deptPlaceholder: 'Select department',
  username: 'Username',
  usernamePlaceholder: 'Enter username',
  phone: 'Phone Number',
  phonePlaceholder: 'Enter phone number',
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
  nickNamePlaceholder: 'Enter nickname',
  deptId: 'Department',
  deptIdPlaceholder: 'Select department',
  email: 'Email',
  emailPlaceholder: 'Enter email',
  password: 'Password',
  passwordPlaceholder: 'Enter password',
  sex: 'Gender',
  post: 'Position',
  role: 'Role',
  remark: 'Remark',
  remarkPlaceholder: 'Enter content',

  resetPassword: 'Reset Password',
  user: 'User',
  newPassword: 'New Password',
  newPasswordPlaceholder: 'Enter new password',
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
