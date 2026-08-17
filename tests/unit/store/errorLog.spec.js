import { createStore } from 'vuex'
import errorLog from '@/store/modules/errorLog'

/**
 * Behaviour lock for the errorLog module ahead of the Vuex -> Pinia port (P1).
 */
function makeStore() {
  // state is a shared object literal, not a factory — reset between tests
  errorLog.state.logs = []
  return createStore({ modules: { errorLog } })
}

describe('store/errorLog', () => {
  let store

  beforeEach(() => {
    store = makeStore()
  })

  const logs = () => store.state.errorLog.logs

  it('starts empty', () => {
    expect(logs()).toEqual([])
  })

  it('appends entries in arrival order', () => {
    store.dispatch('errorLog/addErrorLog', { err: 'first' })
    store.dispatch('errorLog/addErrorLog', { err: 'second' })

    expect(logs().map(l => l.err)).toEqual(['first', 'second'])
  })

  it('keeps duplicates rather than deduplicating', () => {
    store.dispatch('errorLog/addErrorLog', { err: 'same' })
    store.dispatch('errorLog/addErrorLog', { err: 'same' })

    expect(logs()).toHaveLength(2)
  })

  /**
   * CLEAR_ERROR_LOG uses splice(0) rather than reassigning the array, so the
   * ErrorLog component keeps rendering against the same reference.
   */
  it('empties the log in place', () => {
    store.dispatch('errorLog/addErrorLog', { err: 'boom' })
    const before = logs()

    store.dispatch('errorLog/clearErrorLog')

    expect(logs()).toEqual([])
    expect(logs()).toBe(before)
  })
})
