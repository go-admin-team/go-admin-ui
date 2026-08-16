import { createPinia } from 'pinia'

/**
 * Pinia root instance.
 *
 * Lives in `src/stores/` (plural) alongside the existing Vuex `src/store/`
 * (singular) so both can be mounted at once — Vuex modules are ported one at a
 * time in phase P1 of the migration plan, and each ported module moves from
 * store/ to stores/.
 *
 * Migration order follows the dependency graph, leaves first:
 *   settings -> app -> errorLog -> tagsView -> system -> user -> permission
 *
 * `permission` goes last: it builds the dynamic routes and is coupled to the
 * router guard, the loadView dynamic import and the keep-alive include list.
 *
 * Remove src/store/ and the vuex dependency once the last consumer is ported.
 */
const pinia = createPinia()

export default pinia
