import { resolveChildPath, resolveRedirect } from '@/utils/route'

// 目录型路由自身没有页面组件。若不生成 redirect，导航到目录地址时父级路由匹配
// 成功却没有子路由可渲染，内容区一片空白（#82 / #159）。
//
// 这两个纯函数由 store/modules/permission.js 的 generaMenu 调用；该模块用了
// Vite 的 import.meta.glob，jest 无法解析，故对函数本身做覆盖。
describe('Utils:route resolveChildPath', () => {
  it('子路径为绝对路径时原样返回', () => {
    expect(resolveChildPath('/admin', '/admin/sys-user')).toBe('/admin/sys-user')
  })

  it('子路径为相对片段时与父级拼接', () => {
    expect(resolveChildPath('/log', 'operlog')).toBe('/log/operlog')
  })

  it('父级带尾斜杠时不产生双斜杠', () => {
    expect(resolveChildPath('/log/', 'operlog')).toBe('/log/operlog')
  })

  it('子路径为空时退回父级', () => {
    expect(resolveChildPath('/admin', '')).toBe('/admin')
    expect(resolveChildPath('/admin', undefined)).toBe('/admin')
  })
})

describe('Utils:route resolveRedirect', () => {
  const child = (path, hidden = false) => ({ path, hidden })

  it('指向首个可见子路由', () => {
    expect(resolveRedirect('/admin', [child('/admin/sys-user'), child('/admin/sys-role')]))
      .toBe('/admin/sys-user')
  })

  it('跳过隐藏的子路由', () => {
    expect(resolveRedirect('/admin', [child('/admin/hidden', true), child('/admin/shown')]))
      .toBe('/admin/shown')
  })

  it('相对片段子路由正确拼接，不重复前缀', () => {
    expect(resolveRedirect('/log', [child('operlog')])).toBe('/log/operlog')
  })

  it('无子路由时返回 undefined（叶子页不需要 redirect）', () => {
    expect(resolveRedirect('/admin/sys-user', [])).toBeUndefined()
    expect(resolveRedirect('/admin/sys-user', undefined)).toBeUndefined()
  })

  it('子路由全部隐藏时返回 undefined', () => {
    expect(resolveRedirect('/admin', [child('/admin/a', true), child('/admin/b', true)]))
      .toBeUndefined()
  })
})
