export default {
  username: 'Username',
  usernamePlaceholder: 'Please enter username',
  status: 'Status',
  statusPlaceholder: 'Login status',
  ipaddr: 'IP Address',
  ipaddrPlaceholder: 'Please enter IP address',

  msg: 'Type',
  // No trailing space after the colon: the Chinese full-width colon carries its
  // own, English needs one written in.
  peekLocation: 'Location: {value}',
  peekBrowser: 'Browser: {value}',
  peekOs: 'OS: {value}',
  // 'Platform', not a translation of 固件 (firmware): the field behind it is
  // loginLog.platform, and the Chinese label misnames it. Fixing the Chinese is
  // a separate change -- PRD R5 keeps it as it renders today.
  peekPlatform: 'Platform: {value}',
  loginTime: 'Login Time',

  removeConfirm: 'Delete the selected login log? | Delete the {count} selected login logs?'
}
