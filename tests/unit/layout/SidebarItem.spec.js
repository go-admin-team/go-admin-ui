import { mount } from '@vue/test-utils'
import SidebarItem from '@/layout/components/Sidebar/SidebarItem.vue'

// el-menu 开启了 :router，index 会被直接交给 router.push。外链地址不在路由表
// 中，若外链菜单也渲染成 el-menu-item，点击必然导航失败（#242）。这里断言外链
// 由 a 标签承载、且带安全的 target/rel，普通菜单则不应被包进 a 标签。
const stubs = {
  'el-menu-item': { template: '<li class="el-menu-item"><slot /><slot name="title" /></li>' },
  'el-sub-menu': { template: '<div class="el-sub-menu"><slot name="title" /><slot /></div>' },
  'svg-icon': { template: '<i class="svg-icon" />', props: ['iconClass'] }
}

const makeItem = (path, title = '菜单项') => ({
  path,
  meta: { title, icon: 'documentation' },
  children: []
})

describe('Layout:SidebarItem 外链处理', () => {
  it('http 外链渲染为 a 标签并新窗口打开', () => {
    const wrapper = mount(SidebarItem, {
      props: { item: makeItem('https://www.go-admin.pro', '官方文档'), basePath: 'https://www.go-admin.pro' },
      global: { stubs }
    })
    const a = wrapper.find('a.sidebar-external-link')
    expect(a.exists()).toBe(true)
    expect(a.attributes('href')).toBe('https://www.go-admin.pro')
    expect(a.attributes('target')).toBe('_blank')
    // 防止被打开页通过 window.opener 反向操作本页
    expect(a.attributes('rel')).toContain('noopener')
  })

  it('https 与 mailto 同样按外链处理', () => {
    for (const url of ['http://example.com', 'mailto:a@b.com']) {
      const wrapper = mount(SidebarItem, {
        props: { item: makeItem(url), basePath: url },
        global: { stubs }
      })
      expect(wrapper.find('a.sidebar-external-link').exists()).toBe(true)
    }
  })

  it('普通站内路径不包 a 标签，仍走路由', () => {
    const wrapper = mount(SidebarItem, {
      props: { item: makeItem('/admin/sys-user', '用户管理'), basePath: '/admin/sys-user' },
      global: { stubs }
    })
    expect(wrapper.find('a.sidebar-external-link').exists()).toBe(false)
    expect(wrapper.find('.el-menu-item').exists()).toBe(true)
  })
})
