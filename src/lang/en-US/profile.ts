export default {
  title: 'Profile',
  username: 'Username',
  phone: 'Phone Number',
  email: 'Email',
  dept: 'Department',
  role: 'Roles',
  createdAt: 'Created',
  noRole: 'None',

  basic: 'Basic Information',
  tabs: {
    info: 'Basic Information',
    password: 'Change Password'
  },

  info: {
    nickName: 'Nickname',
    phone: 'Phone Number',
    email: 'Email',
    sex: 'Gender',
    male: 'Male',
    female: 'Female',
    rules: {
      nickName: 'Nickname is required',
      emailRequired: 'Email is required',
      emailFormat: 'Enter a valid email address',
      phoneRequired: 'Phone number is required',
      phoneFormat: 'Enter a valid phone number'
    }
  },

  password: {
    old: 'Current Password',
    oldPlaceholder: 'Please enter your current password',
    new: 'New Password',
    newPlaceholder: 'Please enter a new password',
    confirm: 'Confirm Password',
    confirmPlaceholder: 'Please confirm the new password',
    rules: {
      oldRequired: 'Current password is required',
      newRequired: 'New password is required',
      length: 'Must be between 6 and 20 characters',
      confirmRequired: 'Please confirm the password',
      mismatch: 'The two passwords do not match'
    }
  },

  avatar: {
    hint: 'Click to upload an avatar',
    upload: 'Upload',
    submit: 'Submit',
    dialogTitle: 'Change Avatar',
    wrongType: 'Unsupported file type. Please upload an image, such as JPG or PNG.'
  },

  save: 'Save',
  close: 'Close'
}
