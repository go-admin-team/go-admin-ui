import { describe, it, expect } from 'vitest'
import { h, Comment, Fragment, type VNode } from 'vue'
import { countSearchFields, colsFor, collapseTo } from '@/components/ProTable/search'

/** Stands in for <el-form-item>; only its presence is counted. */
const field = (label: string) => h({ name: 'ElFormItem' }, { label })

const slotOf = (...nodes: VNode[]) => () => nodes

describe('countSearchFields', () => {
  it('counts the fields a page declared', () => {
    expect(countSearchFields(slotOf(field('名称'), field('状态')))).toBe(2)
  })

  it('is 0 for a page with no search slot', () => {
    expect(countSearchFields(undefined)).toBe(0)
  })

  /**
   * The number decides how many fields stay visible while collapsed, and the
   * stylesheet hides the rest with :nth-of-type -- which counts elements. A
   * field switched off with v-if leaves a comment behind and takes up no
   * position there, so counting it here would leave the panel one field short
   * of the row it is supposed to fill.
   */
  it('skips a field switched off with v-if', () => {
    expect(countSearchFields(slotOf(
      field('部门'),
      h(Comment),
      field('登录名')
    ))).toBe(2)
  })

  it('looks inside the fragments v-for and <template> produce', () => {
    expect(countSearchFields(slotOf(
      field('名称'),
      h(Fragment, null, [field('状态'), field('分组')])
    ))).toBe(3)
  })
})

describe('colsFor', () => {
  it('reads the panel width, not the window', () => {
    // The widths that matter: a full-width panel on a 1280px screen (~1050),
    // sys-user's (~850), and the generator's import dialog (~770) all get
    // three columns; a phone-sized panel gets one.
    expect(colsFor(1050)).toBe(3)
    expect(colsFor(850)).toBe(3)
    expect(colsFor(770)).toBe(3)
    expect(colsFor(1690)).toBe(4)
    expect(colsFor(520)).toBe(2)
    expect(colsFor(320)).toBe(1)
  })
})

describe('collapseTo', () => {
  it('keeps the first row, less the column the buttons take', () => {
    expect(collapseTo(4, 3)).toBe(2)
    expect(collapseTo(3, 3)).toBe(2)
  })

  it('is 0 when everything already fits, which is also "nothing to expand"', () => {
    expect(collapseTo(2, 3)).toBe(0)
    expect(collapseTo(3, 4)).toBe(0)
  })

  /**
   * A one-column panel would otherwise collapse to nothing: cols - 1 is 0, and
   * a search form with no search in it is worse than one that spills.
   */
  it('keeps one filter on a single-column panel', () => {
    expect(collapseTo(3, 1)).toBe(1)
    expect(collapseTo(1, 1)).toBe(0)
  })
})
