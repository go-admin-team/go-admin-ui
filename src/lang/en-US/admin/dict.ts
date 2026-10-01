export default {
  type: {
    dictName: 'Dictionary Name',
    dictNamePlaceholder: 'Enter dictionary name',
    dictType: 'Dictionary Type',
    dictTypePlaceholder: 'Enter dictionary type',
    status: 'Status',
    statusPlaceholder: 'Dictionary status',
    dictId: 'ID',
    remark: 'Remark',

    addTitle: 'Add Dictionary Type',
    editTitle: 'Edit Dictionary Type',
    remarkPlaceholder: 'Enter content',

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
    dictLabelPlaceholder: 'Enter dictionary label',
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
    labelPlaceholder: 'Enter data label',
    value: 'Data Value',
    valuePlaceholder: 'Enter data value',
    displaySort: 'Display Order',
    remarkPlaceholder: 'Enter content',

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
