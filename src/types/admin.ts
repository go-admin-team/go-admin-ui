/**
 * Domain types for the admin module.
 *
 * Fields are named as the Go side sends them. Most are optional because the
 * list endpoint returns a subset of what the detail endpoint does, and the same
 * type describes a row, a loaded record and a form being filled in.
 */

/** A user, as returned by /api/v1/sys-user. */
export interface SysUser {
  userId?: number
  username?: string
  nickName?: string
  password?: string
  phone?: string
  email?: string
  sex?: string
  /** '1' disabled, '2' enabled. A string, not a boolean -- the backend's choice. */
  status?: string
  avatar?: string
  remark?: string
  deptId?: number
  postId?: number
  roleId?: number
  dept?: { deptId?: number, deptName?: string }
  createdAt?: string
}

/** Filters the user list accepts, on top of the paging keys. */
export interface SysUserQuery {
  username?: string
  phone?: string
  status?: string
  /** Set by clicking the department tree, in the `/id/` path form the API wants. */
  deptId?: string
}

/**
 * A department, as returned by /api/v1/dept.
 *
 * `status` and `sort` are the awkward pair: the list endpoint sends them as
 * numbers, the dictionary that labels status sends its values as strings, and
 * the write endpoints want numbers back. The form works in strings and converts
 * on submit.
 */
export interface SysDept {
  deptId?: number
  parentId?: number
  /** Materialised path of ancestors. `p_id === 0` marks a root, which cannot be deleted. */
  p_id?: number
  deptName?: string
  sort?: number | string
  leader?: string
  phone?: string
  email?: string
  status?: number | string
  children?: SysDept[]
  createdAt?: string
}

/** Filters the department tree accepts. It is not paginated. */
export interface SysDeptQuery {
  deptName?: string
  status?: string
}

/** A node of the department tree behind /api/v1/deptTree. */
export interface DeptTreeNode {
  id: number
  label: string
  children?: DeptTreeNode[]
}

/** A post (job title). */
export interface SysPost {
  postId?: number
  postName?: string
  postCode?: string
  sort?: number
  status?: string
  remark?: string
  createdAt?: string
}

/** Filters the post list accepts. */
export interface SysPostQuery {
  postCode?: string
  postName?: string
  status?: string
}

/** A role. `dataScope` selects which departments its holders can see. */
export interface SysRole {
  roleId?: number
  roleName?: string
  roleKey?: string
  roleSort?: number
  dataScope?: string
  status?: string
  remark?: string
  menuIds?: number[]
  deptIds?: number[]
  createdAt?: string
}

export interface SysRoleQuery {
  roleName?: string
  roleKey?: string
  status?: string
}

/** A menu entry. The route table is generated from these; see stores/permission. */
export interface SysMenu {
  menuId?: number
  menuName?: string
  parentId?: number
  /** 'M' directory, 'C' page, 'F' button-level permission. */
  menuType?: string
  path?: string
  component?: string
  icon?: string
  sort?: number
  /** '0' shown, anything else hidden. Compared loosely -- the backend sends strings. */
  visible?: string
  isFrame?: string
  noCache?: boolean
  /** Permission code, in the 模块:资源:操作 form. */
  permission?: string
  children?: SysMenu[]
  createdAt?: string
}

export interface SysMenuQuery {
  menuName?: string
  visible?: string
}

/** A registered backend route, managed under 接口管理. */
export interface SysApi {
  id?: number
  path?: string
  handle?: string
  title?: string
  type?: string
  action?: string
  createdAt?: string
}

export interface SysApiQuery {
  title?: string
  path?: string
  action?: string
}

/** A configuration entry. `configKey` is what getConfigKey looks up. */
export interface SysConfig {
  configId?: number
  configName?: string
  configKey?: string
  configValue?: string
  configType?: string
  isFrontend?: string
  remark?: string
  createdAt?: string
}

export interface SysConfigQuery {
  configName?: string
  configKey?: string
  configType?: string
}

/** A dictionary type; its entries are DictData. */
export interface DictType {
  dictId?: number
  dictName?: string
  dictType?: string
  status?: string
  remark?: string
  createdAt?: string
}

export interface DictTypeQuery {
  dictName?: string
  dictType?: string
  status?: string
}

/** One entry of a dictionary. */
export interface DictData {
  dictCode?: number
  dictSort?: number
  dictLabel?: string
  dictValue?: string
  dictType?: string
  cssClass?: string
  listClass?: string
  isDefault?: string
  status?: string
  remark?: string
  createdAt?: string
}

export interface DictDataQuery {
  dictType?: string
  dictLabel?: string
  status?: string
}

/** A scheduled job. */
export interface SysJob {
  jobId?: number
  jobName?: string
  jobGroup?: string
  jobType?: number
  cronExpression?: string
  invokeTarget?: string
  args?: string
  misfirePolicy?: number
  concurrent?: number
  status?: number
  entryId?: number
  createdAt?: string
}

export interface SysJobQuery {
  jobName?: string
  jobGroup?: string
  status?: string
}

/** An audit row: one login attempt. */
export interface SysLoginLog {
  infoId?: number
  username?: string
  ipaddr?: string
  loginLocation?: string
  browser?: string
  os?: string
  status?: string
  msg?: string
  loginTime?: string
}

/** An audit row: one write operation. */
export interface SysOperaLog {
  operId?: number
  title?: string
  businessType?: string
  method?: string
  requestMethod?: string
  operUrl?: string
  operIp?: string
  operName?: string
  status?: string
  operTime?: string
  createdAt?: string
}
