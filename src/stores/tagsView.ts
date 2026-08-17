import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'

/** A tab in the tag bar. Carries the route fields the bar renders. */
export interface VisitedView {
  path: string
  fullPath?: string
  name?: string
  title?: string
  meta?: {
    title?: string
    affix?: boolean
    noCache?: boolean
    [key: string]: unknown
  }
  [key: string]: unknown
}

type ViewLike = VisitedView | RouteLocationNormalized

/**
 * Open tabs and the keep-alive cache list.
 *
 * IMPORTANT: `cachedViews` holds ROUTE names, while <keep-alive :include>
 * matches COMPONENT names. loadView() in the permission store reconciles the
 * two at runtime; see tests/unit/layout/keep-alive-cache.spec.js for the
 * executable contract.
 *
 * Ported from src/store/modules/tagsView.js. The Vuex actions wrapped
 * synchronous work in promises purely by convention; here they return their
 * result directly and callers no longer chain .then().
 *
 * Behaviour is covered by tests/unit/store/tagsView.spec.js.
 */
export const useTagsViewStore = defineStore('tagsView', {
  state: () => ({
    visitedViews: [] as VisitedView[],
    cachedViews: [] as string[]
  }),

  actions: {
    addView(view: ViewLike) {
      this.addVisitedView(view)
      this.addCachedView(view)
    },

    addVisitedView(view: ViewLike) {
      if (this.visitedViews.some(v => v.path === view.path)) return
      this.visitedViews.push({
        ...view,
        title: view.meta?.title || 'no-name'
      } as VisitedView)
    },

    addCachedView(view: ViewLike) {
      const name = view.name as string | undefined
      if (!name || this.cachedViews.includes(name)) return
      if (!view.meta?.noCache) {
        this.cachedViews.push(name)
      }
    },

    delView(view: ViewLike) {
      this.delVisitedView(view)
      this.delCachedView(view)
      return {
        visitedViews: [...this.visitedViews],
        cachedViews: [...this.cachedViews]
      }
    },

    delVisitedView(view: ViewLike) {
      const index = this.visitedViews.findIndex(v => v.path === view.path)
      if (index > -1) this.visitedViews.splice(index, 1)
      return [...this.visitedViews]
    },

    delCachedView(view: ViewLike) {
      const index = this.cachedViews.indexOf(view.name as string)
      if (index > -1) this.cachedViews.splice(index, 1)
      return [...this.cachedViews]
    },

    delOthersViews(view: ViewLike) {
      this.delOthersVisitedViews(view)
      this.delOthersCachedViews(view)
      return {
        visitedViews: [...this.visitedViews],
        cachedViews: [...this.cachedViews]
      }
    },

    delOthersVisitedViews(view: ViewLike) {
      this.visitedViews = this.visitedViews.filter(v => v.meta?.affix || v.path === view.path)
      return [...this.visitedViews]
    },

    delOthersCachedViews(view: ViewLike) {
      if (this.cachedViews.length > 0) {
        const index = this.cachedViews.indexOf(view.name as string)
        // index === -1 means the surviving tab was never cached, so nothing
        // should remain cached either
        this.cachedViews = index > -1 ? this.cachedViews.slice(index, index + 1) : []
      }
      return [...this.cachedViews]
    },

    delAllViews() {
      this.delAllVisitedViews()
      this.delAllCachedViews()
      return {
        visitedViews: [...this.visitedViews],
        cachedViews: [...this.cachedViews]
      }
    },

    delAllVisitedViews() {
      // Affix tabs are pinned and survive "close all"
      this.visitedViews = this.visitedViews.filter(tag => tag.meta?.affix)
      return [...this.visitedViews]
    },

    delAllCachedViews() {
      this.cachedViews = []
      return [...this.cachedViews]
    },

    updateVisitedView(view: ViewLike) {
      const target = this.visitedViews.find(v => v.path === view.path)
      if (target) Object.assign(target, view)
    },

    /** Used by the tag bar to persist a reordered tab list. */
    setVisitedViews(views: VisitedView[]) {
      this.visitedViews = views
    }
  }
})
