import { describe, it, expect } from 'vitest'
import { h, Comment, Fragment, type VNode } from 'vue'
import { searchFieldSpans, colsFor, collapseTo } from '@/components/ProTable/search'

/** Stands in for <el-form-item>; only its presence and its class are read. */
const field = (label: string, cls?: unknown) =>
  h({ name: 'ElFormItem' }, cls === undefined ? { label } : { label, class: cls })

const slotOf = (...nodes: VNode[]) => () => nodes

describe('searchFieldSpans', () => {
  it('reports one column per field a page declared', () => {
    expect(searchFieldSpans(slotOf(field('名称'), field('状态')))).toEqual([1, 1])
  })

  it('is empty for a page with no search slot', () => {
    expect(searchFieldSpans(undefined)).toEqual([])
  })

  /**
   * The number decides how many fields stay visible while collapsed, and the
   * stylesheet hides the rest with :nth-of-type -- which counts elements. A
   * field switched off with v-if leaves a comment behind and takes up no
   * position there, so counting it here would leave the panel one field short
   * of the row it is supposed to fill.
   */
  it('skips a field switched off with v-if', () => {
    expect(searchFieldSpans(slotOf(
      field('部门'),
      h(Comment),
      field('登录名')
    ))).toEqual([1, 1])
  })

  it('reports two columns for a field marked is-wide', () => {
    expect(searchFieldSpans(slotOf(field('名称'), field('操作时间', 'is-wide')))).toEqual([1, 2])
  })

  /**
   * Vue hands the class through as the page wrote it, and pages write all
   * three forms. normalizeClass is what flattens them; without it an array or
   * an object would read as "not wide" and the field would quietly collapse to
   * one column -- visible only as a squeezed date picker.
   */
  it('reads the class however the page wrote it', () => {
    expect(searchFieldSpans(slotOf(field('a', 'is-wide')))).toEqual([2])
    expect(searchFieldSpans(slotOf(field('b', ['pinned', 'is-wide'])))).toEqual([2])
    expect(searchFieldSpans(slotOf(field('c', { 'is-wide': true, pinned: false })))).toEqual([2])
    expect(searchFieldSpans(slotOf(field('d', { 'is-wide': false })))).toEqual([1])
  })

  /** Whole class names, not a substring: `not-is-wide` is a different class. */
  it('does not match a class that merely contains the name', () => {
    expect(searchFieldSpans(slotOf(field('e', 'not-is-wide')))).toEqual([1])
    expect(searchFieldSpans(slotOf(field('f', 'is-wide-ish')))).toEqual([1])
  })

  it('looks inside the fragments v-for and <template> produce', () => {
    expect(searchFieldSpans(slotOf(
      field('名称'),
      h(Fragment, null, [field('状态'), field('分组')])
    ))).toEqual([1, 1, 1])
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
  const ones = (n: number) => Array(n).fill(1)

  it('keeps the first row, less the column the buttons take', () => {
    expect(collapseTo(ones(4), 3)).toBe(2)
    expect(collapseTo(ones(3), 3)).toBe(2)
  })

  it('is 0 when everything already fits, which is also "nothing to expand"', () => {
    expect(collapseTo(ones(2), 3)).toBe(0)
    expect(collapseTo(ones(3), 4)).toBe(0)
  })

  /**
   * The point of collapsing is one row, and a two-column field fills a row
   * faster than a one-column one. sys-oper-log is the case: [2, 1, 1] on three
   * columns keeps the range and nothing else, because the range plus any second
   * field plus the buttons is four columns of a three-column row.
   */
  it('spends columns, not fields', () => {
    expect(collapseTo([2, 1, 1], 3)).toBe(1)
    expect(collapseTo([1, 1, 2], 3)).toBe(2)
    expect(collapseTo([2, 1, 1], 4)).toBe(2)
  })

  it('still collapses nothing when the wide field is the only one', () => {
    expect(collapseTo([2], 3)).toBe(0)
    expect(collapseTo([2, 1], 4)).toBe(0)
  })

  /**
   * A one-column panel would otherwise collapse to nothing: cols - 1 is 0, and
   * a search form with no search in it is worse than one that spills.
   */
  it('keeps one filter on a single-column panel', () => {
    expect(collapseTo(ones(3), 1)).toBe(1)
    expect(collapseTo(ones(1), 1)).toBe(0)
    expect(collapseTo([2, 1], 1)).toBe(1)
  })
})
