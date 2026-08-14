/**
 * 拼接父级目录与子菜单的路径。
 *
 * 后端菜单配置中子菜单的 path 两种写法都有：完整绝对路径（/admin/sys-user）
 * 与相对片段（operlog）。直接字符串相接会得到 /admin/admin/sys-user 这类重复
 * 前缀，因此需分别处理。
 *
 * @param {string} parentPath 父级目录路径
 * @param {string} childPath  子菜单路径，可能为绝对或相对
 * @returns {string} 可直接用于 redirect 的绝对路径
 */
export function resolveChildPath(parentPath, childPath) {
  if (!childPath) return parentPath
  if (childPath.startsWith('/')) return childPath
  return `${parentPath.replace(/\/+$/, '')}/${childPath}`
}

/**
 * 为目录型路由推导 redirect 目标。
 *
 * 目录自身没有页面组件，导航到它时父级匹配成功却没有子路由可渲染，内容区会
 * 呈现空白。指向首个可见子路由即可避免。
 *
 * @param {string} parentPath 目录路径
 * @param {Array}  children   已生成的子路由数组
 * @returns {string|undefined} 无可见子路由时返回 undefined
 */
export function resolveRedirect(parentPath, children) {
  if (!children || !children.length) return undefined
  const target = children.find(child => !child.hidden)
  return target ? resolveChildPath(parentPath, target.path) : undefined
}
