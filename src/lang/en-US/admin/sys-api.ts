export default {
  title: 'Title',
  titlePlaceholder: 'Enter title',
  path: 'Path',
  pathPlaceholder: 'Enter path',
  type: 'Type',

  // 'API' per the glossary, which keeps 'Interface' out of a product where it
  // already means something else.
  api: 'API',
  none: 'None',
  // No trailing space after the colon: the Chinese full-width colon carries its
  // own, English needs one written in.
  peekHandle: 'Handle: {value}',
  peekType: 'Type: {value}',
  peekTitle: 'Title: {value}',

  editTitle: 'Edit API',
  typePlaceholder: 'Select type',
  actionPlaceholder: 'Select method',

  rules: {
    handle: 'Handle is required',
    title: 'Title is required',
    type: 'Type is required'
  }
}
