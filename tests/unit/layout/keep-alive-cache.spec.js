import { h, ref, nextTick, KeepAlive } from 'vue'
import { mount } from '@vue/test-utils'

/**
 * Executable specification of the keep-alive caching contract.
 *
 * The app caches pages with <keep-alive :include="cachedViews">, where
 * cachedViews holds ROUTE names (tagsView module) while keep-alive matches
 * COMPONENT names. When the two drift apart nothing throws — pages simply stop
 * being cached, losing scroll position and half-filled forms on every tab
 * switch.
 *
 * This is the main hazard of migrating pages to <script setup>, so the
 * behaviour is pinned here rather than left as a comment. Each test asserts a
 * cache hit or miss by counting setup() invocations: a cached component is
 * created once and merely reactivated afterwards.
 */

/** Builds a page component plus a counter of how often it was created. */
function makePage(options) {
  let setupCount = 0
  const component = {
    ...options,
    setup() {
      setupCount++
      return () => h('div', 'page')
    }
  }
  return { component, created: () => setupCount }
}

/** Mounts two pages behind keep-alive; flipping the ref switches between them. */
function mountBehindKeepAlive(include, pageA, pageB) {
  const showA = ref(true)
  mount({
    setup: () => () => h(KeepAlive, { include }, () => h(showA.value ? pageA : pageB))
  })
  return showA
}

/** Navigates away from page A and back again. */
async function switchAwayAndBack(showA) {
  showA.value = false
  await nextTick()
  showA.value = true
  await nextTick()
}

describe('keep-alive caching contract', () => {
  /** Baseline: names line up, so returning to the page reuses the instance. */
  it('caches a page whose component name is in the include list', async() => {
    const { component: pageA, created } = makePage({ name: 'SysUser' })
    const { component: pageB } = makePage({ name: 'Other' })

    const showA = mountBehindKeepAlive(['SysUser'], pageA, pageB)
    expect(created()).toBe(1)

    await switchAwayAndBack(showA)

    expect(created()).toBe(1)
  })

  /**
   * The failure this contract guards against: the route is named 'SysUser' but
   * the component calls itself something else, so include never matches and the
   * page is rebuilt on every visit -- with no error of any kind.
   */
  it('does not cache when the component name differs from the route name', async() => {
    const { component: pageA, created } = makePage({ name: 'NotTheRouteName' })
    const { component: pageB } = makePage({ name: 'Other' })

    const showA = mountBehindKeepAlive(['SysUser'], pageA, pageB)
    expect(created()).toBe(1)

    await switchAwayAndBack(showA)

    expect(created()).toBe(2)
  })

  /**
   * What <script setup> actually compiles to: the name is inferred from the
   * FILE name and exposed as __name, which Vue falls back to when `name` is
   * absent. Such a component is not nameless -- it is called 'index', which is
   * what nearly every page file in this project is named.
   *
   * That is precisely why migrating a page to <script setup> breaks caching:
   * 'index' can never match a route name like 'SysUser'.
   */
  it('falls back to the compiler-inferred __name, which is the file name', async() => {
    const { component: pageA, created } = makePage({ __name: 'index' })
    const { component: pageB } = makePage({ name: 'Other' })

    const showA = mountBehindKeepAlive(['SysUser'], pageA, pageB)

    await switchAwayAndBack(showA)

    expect(created()).toBe(2)
  })

  /**
   * The remedy, and what loadView() already applies at runtime: an explicit
   * `name` wins over the inferred __name. Pages moved to <script setup> must
   * therefore declare defineOptions({ name: '<RouteName>' }).
   */
  it('an explicit name overrides the inferred __name and restores caching', async() => {
    const { component: pageA, created } = makePage({ __name: 'index', name: 'SysUser' })
    const { component: pageB } = makePage({ name: 'Other' })

    const showA = mountBehindKeepAlive(['SysUser'], pageA, pageB)
    expect(created()).toBe(1)

    await switchAwayAndBack(showA)

    expect(created()).toBe(1)
  })
})
