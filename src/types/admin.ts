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

/** A node of the department tree behind /api/v1/deptTree. */
export interface DeptTreeNode {
  id: number
  label: string
  children?: DeptTreeNode[]
}

/** A post (job title), as offered in the user form. */
export interface SysPost {
  postId: number
  postName: string
  status: string
}

/** A role, as offered in the user form. */
export interface SysRole {
  roleId: number
  roleName: string
  status: string
}
