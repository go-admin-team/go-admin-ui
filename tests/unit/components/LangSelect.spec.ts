import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LangSelect from '@/components/LangSelect/index.vue'

/**
 * The switcher is not rendered at all on a build pinned to one language.
 *
 * Leaving it in place would offer a choice the deployment then ignores: the
 * click loads a language pack and repaints, and the next reload puts everything
 * back, because initialLocale answers to the pinned value rather than to what
 * was stored. A control that undoes itself out of sight is worse than no
 * control.
 *
 * Both hosts pass a class and an id in, so what has to disappear is the
 * component -- an element still carrying `right-menu-item` would keep its share
 * of the navbar's flex row.
 */
const stubs = {
  // Named so the assertion reads as "the dropdown", rather than depending on
  // how test-utils spells an automatic stub.
  'el-dropdown': { template: '<div class="dropdown"><slot /><slot name="dropdown" /></div>' },
  'el-dropdown-menu': { template: '<div><slot /></div>' },
  'el-dropdown-item': { template: '<div class="entry"><slot /></div>' }
}

const render = (pinned: string) => {
  vi.stubEnv('VUE_APP_LOCALE', pinned)
  return mount(LangSelect, { global: { stubs }})
}

describe('LangSelect', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('offers every language when the visitor is the one deciding', () => {
    const wrapper = render('')

    expect(wrapper.find('.dropdown').exists()).toBe(true)
    expect(wrapper.findAll('.entry')).toHaveLength(2)
  })

  it('renders nothing at all when the build is pinned', () => {
    const wrapper = render('zh-CN')

    expect(wrapper.find('.dropdown').exists()).toBe(false)
    // Not just the menu: no element at all, so neither host is left holding a
    // gap where the switcher used to be.
    expect(wrapper.element.nodeType, 'a comment, not an element').toBe(Node.COMMENT_NODE)
  })
})
