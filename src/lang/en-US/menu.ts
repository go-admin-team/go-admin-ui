/**
 * Menu titles, keyed by `sys_menu.menu_name`.
 *
 * Generated against go-admin/config/db.sql: every one of the 24 visible menus
 * (menu_type M or C -- the 43 button rows are permission points and never
 * render) has a non-empty, unique menu_name, which is what makes it usable as a
 * key. Buttons are absent on purpose.
 *
 * A menu the user created themselves has no entry here, and that is a normal
 * state, not a gap: lang/backend.ts falls back to the database title. Adding a
 * language means adding a file like this one -- no schema change, no backend
 * change.
 *
 * The comment on each line is the Chinese the database actually stores, so a
 * reviewer can check a translation without opening the SQL.
 */
export default {
  Admin: 'System', // 系统管理
  SysUserManage: 'User Management', // 用户管理
  SysMenuManage: 'Menu Management', // 菜单管理
  SysRoleManage: 'Role Management', // 角色管理
  SysDeptManage: 'Department Management', // 部门管理
  SysPostManage: 'Position Management', // 岗位管理
  Dict: 'Dictionary', // 字典管理
  SysDictDataManage: 'Dictionary Data', // 字典数据
  Tools: 'Dev Tools', // 开发工具
  Swagger: 'API Docs', // 系统接口
  SysConfigManage: 'Parameters', // 参数管理
  Log: 'Logs', // 日志管理
  SysLoginLogManage: 'Login Logs', // 登录日志
  OperLog: 'Operation Logs', // 操作日志
  Gen: 'Code Generation', // 代码生成
  EditTable: 'Edit Generated Table', // 代码生成修改
  Build: 'Form Builder', // 表单构建
  ServerMonitor: 'Server Monitor', // 服务监控
  Schedule: 'Scheduled Tasks', // 定时任务
  ScheduleManage: 'Task List', // Schedule
  JobLog: 'Task Logs', // 日志
  SysApiManage: 'API Management', // 接口管理
  SysTools: 'System Tools', // 系统工具
  SysConfigSet: 'Settings' // 参数设置
}
