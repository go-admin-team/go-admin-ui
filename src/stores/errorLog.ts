import { defineStore } from 'pinia'

/** A captured Vue error, as recorded by setupErrorHandler in @/utils/error-log */
export interface ErrorLogEntry {
  err: unknown
  vm: unknown
  info: string
  url: string
}

/**
 * Collected runtime errors, surfaced by the ErrorLog component in the navbar.
 *
 * Ported from src/store/modules/errorLog.js. Behaviour is covered by
 * tests/unit/store/errorLog.spec.js.
 */
export const useErrorLogStore = defineStore('errorLog', {
  state: () => ({
    logs: [] as ErrorLogEntry[]
  }),

  actions: {
    addErrorLog(log: ErrorLogEntry) {
      this.logs.push(log)
    },

    /**
     * Empties in place rather than reassigning, matching the Vuex version:
     * consumers holding a reference to the array keep seeing the same one.
     */
    clearErrorLog() {
      this.logs.splice(0)
    }
  }
})
