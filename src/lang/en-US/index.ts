import common from './common'
import layout from './layout'
import profile from './profile'
import sysTools from './sys-tools'
import demo from './demo'
import devTools from './dev-tools'
import schedule from './schedule'
import route from './route'
import components from './components'
import login from './login'
import dashboard from './dashboard'
import admin from './admin'
import composables from './composables'
import menu from './menu'
import dict from './dict'

/**
 * English.
 *
 * Unlike zh-CN this does carry menu and dict: those are the translations of
 * text the backend only ever sends in Chinese.
 */
export default { common, schedule, devTools, demo, sysTools, profile, layout, route, components, login, dashboard, admin, composables, menu, dict }
