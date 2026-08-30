import common from './common'
import layout from './layout'
import route from './route'
import menu from './menu'
import dict from './dict'

/**
 * English.
 *
 * Unlike zh-CN this does carry menu and dict: those are the translations of
 * text the backend only ever sends in Chinese.
 */
export default { common, layout, route, menu, dict }
