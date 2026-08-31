export default {
  type: {
    dictName: 'Dictionary Name',
    dictNamePlaceholder: 'Please enter dictionary name',
    dictType: 'Dictionary Type',
    dictTypePlaceholder: 'Please enter dictionary type',
    status: 'Status',
    statusPlaceholder: 'Dictionary status',
    dictId: 'ID',
    remark: 'Remark',

    addTitle: 'Add Dictionary Type',
    editTitle: 'Edit Dictionary Type',
    remarkPlaceholder: 'Please enter content',

    // Pluralised, which the Chinese does not need. The page passes the count as
    // the plural choice as well as a named value.
    removeConfirm: 'Delete the selected dictionary type? | Delete the {count} selected dictionary types?',

    exportFilename: 'Dictionary Types',
    exportHeader: {
      dictId: 'ID',
      dictName: 'Dictionary Name',
      dictType: 'Dictionary Type',
      status: 'Status',
      remark: 'Remark'
    },

    rules: {
      dictName: 'Dictionary name is required',
      dictType: 'Dictionary type is required'
    }
  },

  data: {
    dictName: 'Dictionary Name',
    dictLabel: 'Dictionary Label',
    dictLabelPlaceholder: 'Please enter dictionary label',
    status: 'Status',
    statusPlaceholder: 'Data status',
    dictCode: 'ID',
    dictValue: 'Dictionary Value',
    dictSort: 'Order',
    remark: 'Remark',

    addTitle: 'Add Dictionary Data',
    editTitle: 'Edit Dictionary Data',
    dictType: 'Dictionary Type',
    label: 'Data Label',
    labelPlaceholder: 'Please enter data label',
    value: 'Data Value',
    valuePlaceholder: 'Please enter data value',
    displaySort: 'Display Order',
    remarkPlaceholder: 'Please enter content',

    // 'entry' rather than a plural of 'Dictionary Data', which has none: the
    // sentence counts rows, and English has to name what a row is.
    removeConfirm: 'Delete the selected dictionary entry? | Delete the {count} selected dictionary entries?',

    rules: {
      dictLabel: 'Data label is required',
      dictValue: 'Data value is required',
      dictSort: 'Display order is required'
    }
  }
}
