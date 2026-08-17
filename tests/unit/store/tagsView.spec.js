import { createStore } from 'vuex'
import tagsView from '@/store/modules/tagsView'

/**
 * tagsView drives the tab bar and, more importantly, the keep-alive include
 * list. These tests lock the behaviour down before the Vuex -> Pinia port in
 * phase P1, so the ported module can be validated against the same assertions.
 *
 * The module declares `state` as a plain object rather than a factory, so every
 * createStore() call shares the same reference. Reset it per test.
 */
function makeStore() {
  tagsView.state.visitedViews = []
  tagsView.state.cachedViews = []
  return createStore({ modules: { tagsView } })
}

const view = (path, name, meta = {}) => ({
  path,
  name,
  meta: { title: `title-${name}`, ...meta }
})

describe('store/tagsView', () => {
  let store

  beforeEach(() => {
    store = makeStore()
  })

  const visited = () => store.state.tagsView.visitedViews
  const cached = () => store.state.tagsView.cachedViews

  describe('addView', () => {
    it('adds the view to both visited and cached lists', () => {
      store.dispatch('tagsView/addView', view('/a', 'PageA'))

      expect(visited()).toHaveLength(1)
      expect(cached()).toEqual(['PageA'])
    })

    it('deduplicates by path, not by name', () => {
      store.dispatch('tagsView/addView', view('/a', 'PageA'))
      store.dispatch('tagsView/addView', view('/a', 'PageA'))

      expect(visited()).toHaveLength(1)
    })

    it('falls back to "no-name" when meta.title is empty', () => {
      store.dispatch('tagsView/addView', { path: '/a', name: 'PageA', meta: {} })

      expect(visited()[0].title).toBe('no-name')
    })

    it('keeps views marked noCache out of the cached list', () => {
      store.dispatch('tagsView/addView', view('/a', 'PageA', { noCache: true }))

      expect(visited()).toHaveLength(1)
      expect(cached()).toEqual([])
    })

    /**
     * The contract that the whole keep-alive setup rests on: cachedViews holds
     * the ROUTE name, while <keep-alive :include> matches against the COMPONENT
     * name. The two must be identical or caching silently stops working — no
     * error, no warning, pages simply re-fetch on every tab switch.
     *
     * This matters most when migrating to <script setup>, which does not derive
     * a component name at all. Such components need an explicit
     * defineOptions({ name: ... }) matching the route name.
     */
    it('stores the route name, which keep-alive include matches by component name', () => {
      store.dispatch('tagsView/addView', view('/user', 'SysUser'))

      expect(cached()).toEqual(['SysUser'])
      expect(cached()[0]).toBe(visited()[0].name)
    })
  })

  describe('delView', () => {
    beforeEach(() => {
      store.dispatch('tagsView/addView', view('/a', 'PageA'))
      store.dispatch('tagsView/addView', view('/b', 'PageB'))
    })

    it('removes the view from both lists', async() => {
      const result = await store.dispatch('tagsView/delView', view('/a', 'PageA'))

      expect(result.visitedViews.map(v => v.path)).toEqual(['/b'])
      expect(result.cachedViews).toEqual(['PageB'])
    })

    it('leaves the lists untouched for an unknown view', async() => {
      await store.dispatch('tagsView/delView', view('/zzz', 'Unknown'))

      expect(visited()).toHaveLength(2)
      expect(cached()).toEqual(['PageA', 'PageB'])
    })
  })

  describe('delOthersViews', () => {
    it('keeps the target view and any affix views', async() => {
      store.dispatch('tagsView/addView', view('/home', 'Home', { affix: true }))
      store.dispatch('tagsView/addView', view('/a', 'PageA'))
      store.dispatch('tagsView/addView', view('/b', 'PageB'))

      const result = await store.dispatch('tagsView/delOthersViews', view('/a', 'PageA'))

      expect(result.visitedViews.map(v => v.path).sort()).toEqual(['/a', '/home'])
      expect(result.cachedViews).toEqual(['PageA'])
    })

    it('empties the cache when the target view is not cached', async() => {
      store.dispatch('tagsView/addView', view('/a', 'PageA'))
      store.dispatch('tagsView/addView', view('/b', 'PageB', { noCache: true }))

      const result = await store.dispatch('tagsView/delOthersViews', view('/b', 'PageB'))

      expect(result.cachedViews).toEqual([])
    })
  })

  describe('delAllViews', () => {
    it('keeps affix views but clears the whole cache', async() => {
      store.dispatch('tagsView/addView', view('/home', 'Home', { affix: true }))
      store.dispatch('tagsView/addView', view('/a', 'PageA'))

      const result = await store.dispatch('tagsView/delAllViews')

      expect(result.visitedViews.map(v => v.path)).toEqual(['/home'])
      expect(result.cachedViews).toEqual([])
    })
  })

  describe('updateVisitedView', () => {
    it('merges new fields into the matching visited view', () => {
      store.dispatch('tagsView/addView', view('/a', 'PageA'))
      store.dispatch('tagsView/updateVisitedView', { path: '/a', title: 'renamed' })

      expect(visited()[0].title).toBe('renamed')
    })
  })
})
