import common from './common'
import layout from './layout'
import route from './route'
import components from './components'
import login from './login'
import dashboard from './dashboard'

/**
 * Chinese, the default and the fallback.
 *
 * There is deliberately no menu.ts or dict.ts here. Those two translate text
 * that arrives from the database, which is already Chinese -- a zh-CN copy
 * would be a second source of truth for the same strings, and the two would
 * drift the first time someone renamed a menu. Chinese always falls through to
 * the database value; see lang/backend.ts.
 */
export default { common, layout, route, components, login, dashboard }
