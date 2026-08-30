import sysUser from './sys-user'
import sysRole from './sys-role'
import sysMenu from './sys-menu'
import sysConfig from './sys-config'
import sysDept from './sys-dept'

/**
 * The admin section, one module per page under src/views/admin.
 *
 * The file names match those directories -- sys-user.ts for sys-user/ -- so
 * where a page's text lives needs no decision. The keys are camelCase because
 * they are read as `t('admin.sysUser.addTitle')`.
 *
 * Only the five pages migrated so far are here. The rest of src/views/admin
 * still holds its Chinese in the template, and a half-migrated page would be
 * worse than an unmigrated one, so they are left whole until their batch.
 */
export default { sysUser, sysRole, sysMenu, sysConfig, sysDept }
