export default {
  operUrl: 'Request URL',
  operUrlPlaceholder: 'Please enter request URL',
  status: 'Status',
  statusPlaceholder: 'Operation status',
  // 操作时间 and 操作日期 are two spellings of one thing -- the picker labels
  // the range with the first, the column heads with the second -- and English
  // has no matching pair. Both keys stay so the Chinese keeps both spellings.
  operTime: 'Operated At',
  rangeSeparator: 'to',
  startDate: 'Start date',
  endDate: 'End date',

  clean: 'Clear',

  operId: 'ID',
  request: 'Request',
  // No trailing space after the colon: the Chinese full-width colon carries its
  // own, English needs one written in.
  peekHost: 'Host: {value}',
  peekLocation: 'Location: {value}',
  peekLatency: 'Duration: {value}',
  operName: 'Operator',
  operDate: 'Operated At',
  detail: 'Detail',

  detailTitle: 'Operation Log Detail',
  detailUrl: 'Request URL',
  loginInfo: 'Login Info',
  requestMethod: 'Method',
  latency: 'Duration',
  module: 'Module',
  operStatus: 'Operation Status',
  operParam: 'Request Parameters',
  jsonResult: 'Response Parameters',
  // Same word as common.close; only the Chinese spacing differs.
  dialogClose: 'Close',

  removeConfirm: 'Delete the selected operation log? | Delete the {count} selected operation logs?',
  cleanConfirm: 'Clear every operation log? This cannot be undone.',
  cleanOk: 'Cleared',

  exportFilename: 'Operation Logs',
  exportHeader: {
    operId: 'ID',
    module: 'Module',
    businessType: 'Operation Type',
    operName: 'Operator',
    operIp: 'Host',
    operLocation: 'Location',
    requestMethod: 'Method',
    operUrl: 'Request URL',
    status: 'Status',
    operDate: 'Operated At'
  }
}
