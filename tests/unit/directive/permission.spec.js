import { mount } from '@vue/test-utils'
import permission from '@/directive/permission/permission'

jest.mock('@/store', () => ({
  getters: {
    roles: ['editor']
  }
}))

// 指令通过 el.parentNode.removeChild(el) 移除元素，因此被测元素必须有父节点
const factory = value =>
  mount(
    {
      template: '<div><section v-permission="value">内容</section></div>',
      data: () => ({ value })
    },
    {
      global: { directives: { permission } }
    }
  )

describe('v-permission', () => {
  it('角色匹配时保留元素', () => {
    const wrapper = factory(['editor'])
    expect(wrapper.find('section').exists()).toBe(true)
  })

  it('角色不匹配时移除元素', () => {
    const wrapper = factory(['admin'])
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('角色值为空数组时抛出错误', () => {
    expect(() => factory([])).toThrow('need roles!')
  })
})
