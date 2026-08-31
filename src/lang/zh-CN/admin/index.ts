import sysUser from './sys-user'
import sysRole from './sys-role'
import sysMenu from './sys-menu'
import sysConfig from './sys-config'
import sysDept from './sys-dept'
import sysPost from './sys-post'
import dict from './dict'
import sysApi from './sys-api'
import sysOperLog from './sys-oper-log'
import sysLoginLog from './sys-login-log'

/**
 * The admin section, one module per page under src/views/admin.
 *
 * The file names match those directories -- sys-user.ts for sys-user/ -- so
 * where a page's text lives needs no decision. The keys are camelCase because
 * they are read as `t('admin.sysUser.addTitle')`. A directory holding two pages
 * still gets one file: sys-config.ts carries the list page at its top level and
 * the settings form under `set`, dict.ts carries the types under `type` and the
 * entries under `data`.
 *
 * The pages still holding their Chinese in the template -- the generator, the
 * scheduler, the monitor -- are left whole until their batch, because a
 * half-migrated page is worse than an unmigrated one.
 */
export default {
  sysUser,
  sysRole,
  sysMenu,
  sysConfig,
  sysDept,
  sysPost,
  dict,
  sysApi,
  sysOperLog,
  sysLoginLog
}
