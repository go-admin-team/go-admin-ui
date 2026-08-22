import { setActivePinia, createPinia } from 'pinia'
import { useTagsViewStore } from '@/stores/tagsView'

/**
 * Ported from the Vuex version together with the store itself.
 *
 * The assertions are unchanged apart from dropping `await`: the Vuex actions
 * wrapped synchronous work in promises by convention, and the Pinia versions
 * return their result directly.
 */
const view = (path, name, meta = {}) => ({
  path,
  name,
  meta: { title: `title-${name}`, ...meta }
})

describe('stores/tagsView', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTagsViewStore()
  })

  describe('addView', () => {
    it('adds the view to both visited and cached lists', () => {
      store.addView(view('/a', 'PageA'))

      expect(store.visitedViews).toHaveLength(1)
      expect(store.cachedViews).toEqual(['PageA'])
    })

    it('deduplicates by path, not by name', () => {
      store.addView(view('/a', 'PageA'))
      store.addView(view('/a', 'PageA'))

      expect(store.visitedViews).toHaveLength(1)
    })

    it('falls back to "no-name" when meta.title is empty', () => {
      store.addView({ path: '/a', name: 'PageA', meta: {}})

      expect(store.visitedViews[0].title).toBe('no-name')
    })

    it('keeps views marked noCache out of the cached list', () => {
      store.addView(view('/a', 'PageA', { noCache: true }))

      expect(store.visitedViews).toHaveLength(1)
      expect(store.cachedViews).toEqual([])
    })

    /**
     * The contract the whole keep-alive setup rests on: cachedViews holds the
     * ROUTE name, while <keep-alive :include> matches the COMPONENT name. The
     * two must agree or caching silently stops working -- no error, no warning,
     * pages simply re-fetch on every tab switch.
     *
     * See tests/unit/layout/keep-alive-cache.spec.js for the matching side.
     */
    it('stores the route name, which keep-alive include matches by component name', () => {
      store.addView(view('/user', 'SysUser'))

      expect(store.cachedViews).toEqual(['SysUser'])
      expect(store.cachedViews[0]).toBe(store.visitedViews[0].name)
    })
  })

  describe('delView', () => {
    beforeEach(() => {
      store.addView(view('/a', 'PageA'))
      store.addView(view('/b', 'PageB'))
    })

    it('removes the view from both lists', () => {
      const result = store.delView(view('/a', 'PageA'))

      expect(result.visitedViews.map(v => v.path)).toEqual(['/b'])
      expect(result.cachedViews).toEqual(['PageB'])
    })

    it('leaves the lists untouched for an unknown view', () => {
      store.delView(view('/zzz', 'Unknown'))

      expect(store.visitedViews).toHaveLength(2)
      expect(store.cachedViews).toEqual(['PageA', 'PageB'])
    })
  })

  describe('delOthersViews', () => {
    it('keeps the target view and any affix views', () => {
      store.addView(view('/home', 'Home', { affix: true }))
      store.addView(view('/a', 'PageA'))
      store.addView(view('/b', 'PageB'))

      const result = store.delOthersViews(view('/a', 'PageA'))

      expect(result.visitedViews.map(v => v.path).sort()).toEqual(['/a', '/home'])
      expect(result.cachedViews).toEqual(['PageA'])
    })

    it('empties the cache when the target view is not cached', () => {
      store.addView(view('/a', 'PageA'))
      store.addView(view('/b', 'PageB', { noCache: true }))

      const result = store.delOthersViews(view('/b', 'PageB'))

      expect(result.cachedViews).toEqual([])
    })
  })

  describe('delAllViews', () => {
    it('keeps affix views but clears the whole cache', () => {
      store.addView(view('/home', 'Home', { affix: true }))
      store.addView(view('/a', 'PageA'))

      const result = store.delAllViews()

      expect(result.visitedViews.map(v => v.path)).toEqual(['/home'])
      expect(result.cachedViews).toEqual([])
    })
  })

  describe('updateVisitedView', () => {
    it('merges new fields into the matching visited view', () => {
      store.addView(view('/a', 'PageA'))
      store.updateVisitedView({ path: '/a', title: 'renamed' })

      expect(store.visitedViews[0].title).toBe('renamed')
    })
  })

  /**
   * The tab bar restores a previously persisted tab list from sessionStorage.
   * Under Vuex it assigned to state directly, bypassing mutations; the store now
   * exposes this explicitly.
   */
  describe('setVisitedViews', () => {
    it('replaces the visited list wholesale', () => {
      store.addView(view('/a', 'PageA'))
      store.setVisitedViews([{ path: '/restored', name: 'Restored', meta: {}}])

      expect(store.visitedViews.map(v => v.path)).toEqual(['/restored'])
    })
  })
})
