import { mount } from '@vue/test-utils'
import permisaction from '@/directive/permission/permisaction'

jest.mock('@/store', () => ({
  getters: {
    permisaction: ['admin:sysUser:add', 'admin:sysUser:edit']
  }
}))

// 指令通过 el.parentNode.removeChild(el) 移除元素，因此被测元素必须有父节点
const factory = value =>
  mount(
    {
      template: '<div><button v-permisaction="value">操作</button></div>',
      data: () => ({ value })
    },
    {
      global: { directives: { permisaction } }
    }
  )

describe('v-permisaction', () => {
  it('拥有权限时保留元素', () => {
    const wrapper = factory(['admin:sysUser:add'])
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('缺少权限时移除元素', () => {
    const wrapper = factory(['admin:sysUser:delete'])
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('权限值为空数组时抛出错误', () => {
    expect(() => factory([])).toThrow('请设置操作权限标签值')
  })
})
