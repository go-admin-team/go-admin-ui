import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RightPanel from '@/components/RightPanel/index.vue'

/**
 * The drawer registers a window click listener so a click outside closes it.
 * Getting that listener off again is the whole of what is checked here: it is
 * added on a timer, removed only by a click that lands outside the panel, and
 * the panel itself sits behind a v-if that can take the component away first.
 */
describe('RightPanel', () => {
  let added
  let removed

  beforeEach(() => {
    setActivePinia(createPinia())
    added = []
    removed = []
    vi.spyOn(window, 'addEventListener').mockImplementation((type, fn) => {
      if (type === 'click') added.push(fn)
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation((type, fn) => {
      if (type === 'click') removed.push(fn)
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const open = () => {
    const wrapper = mount(RightPanel, {
      props: { modelValue: false },
      global: { stubs: { RouterLink: true }}
    })
    return wrapper
  }

  it('registers one listener however often it is reopened', async() => {
    const wrapper = open()

    for (let i = 0; i < 3; i++) {
      await wrapper.setProps({ modelValue: true })
      vi.runAllTimers()
      await wrapper.setProps({ modelValue: false })
    }

    // addEventListener is called each time, but every call passes the same bound
    // method, and the DOM keeps one registration per (type, callback) pair
    expect(new Set(added).size).toBe(1)
  })

  // Closing with the ✕ is a click inside the panel, so closeSidebar deliberately
  // leaves the listener in place. Nothing else took it off, and the drawer sits
  // behind `v-if="showSettings"` in the layout -- so turning that setting off
  // left a listener on window holding an unmounted component.
  it('takes its listener off window when unmounted', async() => {
    const wrapper = open()
    await wrapper.setProps({ modelValue: true })
    vi.runAllTimers()
    expect(added).toHaveLength(1)

    wrapper.unmount()

    expect(removed).toContain(added[0])
  })

  // Unmounting before the timer fires would otherwise re-add the listener after
  // the cleanup had already run
  it('a pending registration does not survive unmount', async() => {
    const wrapper = open()
    await wrapper.setProps({ modelValue: true })

    wrapper.unmount()
    vi.runAllTimers()

    const live = added.filter(fn => !removed.includes(fn))
    expect(live).toHaveLength(0)
  })
})
