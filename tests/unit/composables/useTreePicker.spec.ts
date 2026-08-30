import { computed, defineComponent, h, isRef, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useTreePicker } from '@/composables/useTreePicker'
import { i18n, setLocale } from '@/lang'
import type { ApiResponse } from '@/types/api'
import { flushPromises } from '../support/async'

interface Dept {
  deptId?: number
  deptName?: string
  children?: Dept[]
}

const tree: Dept[] = [
  { deptId: 1, deptName: '研发部', children: [{ deptId: 3, deptName: '前端组' }] },
  { deptId: 2, deptName: '测试部' }
]

const answers = (rows: Dept[]) =>
  vi.fn().mockResolvedValue({ code: 200, msg: 'ok', data: rows } as ApiResponse<Dept[]>)

const picker = (api = answers(tree), rootLabel: Parameters<typeof useTreePicker>[0]['rootLabel'] = '主类目') =>
  useTreePicker<Dept>({ api, idKey: 'deptId', labelKey: 'deptName', rootLabel })

/** Declares `data` the way el-tree-select does, so a wrong shape is reported. */
const TreeSelectStub = defineComponent({
  name: 'TreeSelectStub',
  props: { data: { type: Array, default: () => [] }},
  render() { return h('div') }
})

describe('useTreePicker', () => {
  it('wraps the tree under a synthetic root once it has loaded', async() => {
    const parent = picker()

    // Before the fetch there is still a root to select, or a page could not
    // create a top-level record while the request is in flight.
    expect(parent.options).toEqual([{ deptId: 0, deptName: '主类目', children: [] }])

    await parent.ensure()
    expect(parent.options[0].children).toEqual(tree)
  })

  it('fetches once, and again only after invalidate', async() => {
    const api = answers(tree)
    const parent = picker(api)

    await parent.ensure()
    await parent.ensure()
    expect(api).toHaveBeenCalledTimes(1)

    parent.invalidate()
    await parent.ensure()
    expect(api).toHaveBeenCalledTimes(2)
  })

  it('shares one request between two dialogs opened at once', async() => {
    const api = answers(tree)
    const parent = picker(api)

    await Promise.all([parent.ensure(), parent.ensure()])

    expect(api).toHaveBeenCalledTimes(1)
  })

  it('keeps the last good tree when the request fails', async() => {
    const api = vi.fn().mockResolvedValueOnce({ code: 200, msg: 'ok', data: tree })
    const parent = picker(api as never)
    await parent.ensure()

    api.mockRejectedValueOnce(new Error('500'))
    parent.invalidate()
    await parent.ensure()

    // Emptying it would read as "this record has no parent"
    expect(parent.options[0].children).toEqual(tree)
  })

  /**
   * The returned object is reactive(), so `parent.options` is the array.
   *
   * It used to be returned bare, which meant property access handed the
   * template the ComputedRef itself -- and el-tree-select, whose `data` prop
   * declares an Array, logged `Invalid prop: type check failed for prop "data".
   * Expected Array, got Object` on every render of both tree pages. The picker
   * still worked, because Vue passes the value through after warning, so
   * nothing but the console said anything was wrong.
   *
   * Which shape is right depends on the call site, not on taste: this one is
   * read as `parent.options`, while useRemove, useExport and useDict are
   * destructured and must stay bare refs.
   */
  describe('the shape it hands the template', () => {
    it('is an array, not a ref', () => {
      const parent = picker()

      expect(isRef(parent.options)).toBe(false)
      expect(Array.isArray(parent.options)).toBe(true)
    })

    it('passes a component prop declared as Array without a warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      try {
        const parent = picker()
        // A plain object rather than defineComponent(): one component per file
        // is a lint rule, and this host exists only to pass the prop.
        mount({ render() { return h(TreeSelectStub, { data: parent.options }) } })

        const invalid = warn.mock.calls
          .map(call => String(call[0]))
          .filter(text => text.includes('Invalid prop'))
        expect(invalid).toEqual([])
      } finally {
        warn.mockRestore()
      }
    })

    it('still updates after the tree lands, so reactive() did not snapshot it', async() => {
      const parent = picker()
      const seen: number[] = []

      mount({
        render() {
          seen.push((parent.options[0].children ?? []).length)
          return h(TreeSelectStub, { data: parent.options })
        }
      })

      expect(seen).toEqual([0])
      void parent.ensure()
      await flushPromises()
      expect(seen.at(-1)).toBe(tree.length)
    })
  })

  describe('the root label', () => {
    afterEach(async() => { await setLocale('zh-CN') })

    it('still takes a plain string, for the pages not yet migrated', () => {
      expect(picker(answers(tree), '主类目').options[0].deptName).toBe('主类目')
    })

    it('follows a ref, so it is not stranded in the language it was read in', () => {
      const label = ref('主类目')
      const parent = picker(answers(tree), label)

      expect(parent.options[0].deptName).toBe('主类目')
      label.value = 'Root'
      expect(parent.options[0].deptName).toBe('Root')
    })

    it('follows the language when given the computed the pages pass', async() => {
      // The synthetic root is the one node in the picker that is not a database
      // record, so it is the one node a language switch has to repaint. Every
      // branch under it comes from the API and changes on its own.
      const parent = picker(
        answers(tree),
        computed(() => i18n.global.t('admin.sysDept.rootCategory'))
      )
      expect(parent.options[0].deptName).toBe('主类目')

      await setLocale('en-US')
      expect(parent.options[0].deptName).toBe('Root')
    })
  })
})
