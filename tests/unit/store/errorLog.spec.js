import { setActivePinia, createPinia } from 'pinia'
import { useErrorLogStore } from '@/stores/errorLog'

/**
 * Ported from the Vuex version together with the store itself. The assertions
 * are unchanged -- they were written against behaviour rather than structure
 * precisely so they could survive this move.
 *
 * A fresh pinia per test replaces the manual state reset the Vuex suite needed,
 * since Pinia declares state as a factory.
 */
describe('stores/errorLog', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useErrorLogStore()
  })

  it('starts empty', () => {
    expect(store.logs).toEqual([])
  })

  it('appends entries in arrival order', () => {
    store.addErrorLog({ err: 'first' })
    store.addErrorLog({ err: 'second' })

    expect(store.logs.map(l => l.err)).toEqual(['first', 'second'])
  })

  it('keeps duplicates rather than deduplicating', () => {
    store.addErrorLog({ err: 'same' })
    store.addErrorLog({ err: 'same' })

    expect(store.logs).toHaveLength(2)
  })

  /**
   * clearErrorLog uses splice(0) rather than reassigning the array, so the
   * ErrorLog component keeps rendering against the same reference.
   */
  it('empties the log in place', () => {
    store.addErrorLog({ err: 'boom' })
    const before = store.logs

    store.clearErrorLog()

    expect(store.logs).toEqual([])
    expect(store.logs).toBe(before)
  })
})
