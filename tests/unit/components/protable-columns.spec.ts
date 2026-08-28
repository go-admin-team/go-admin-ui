import { describe, it, expect } from 'vitest'
import { h, type VNode } from 'vue'
import { readCardColumns, splitCard, readProp } from '@/components/ProTable/columns'

/** Stands in for <el-table-column>; only props and children are read. */
const column = (props: Record<string, unknown>, render?: () => VNode[]) =>
  h({ name: 'ElTableColumn' }, props, render ? { default: render } : undefined)

const slotOf = (...nodes: VNode[]) => () => nodes

describe('readCardColumns', () => {
  it('reads label, prop and the column\'s own renderer', () => {
    const columns = readCardColumns(slotOf(
      column({ label: '岗位编码', prop: 'postCode' }),
      column({ label: '状态', prop: 'status' }, () => [h('span', '正常')])
    ))

    expect(columns).toHaveLength(2)
    expect(columns[0]).toMatchObject({ label: '岗位编码', prop: 'postCode' })
    expect(columns[0].render).toBeUndefined()
    expect(typeof columns[1].render).toBe('function')
  })

  it('drops table furniture that means nothing on a card', () => {
    // Labelled on purpose: an unlabelled column is already dropped for having
    // no caption, so labelling these is what actually exercises the type check.
    // `<el-table-column fixed label="序号" type="index" width="50" />` is real
    // -- it exists in dev-tools/gen -- and carries no prop, so without the
    // check the card would show 序号 with an empty value.
    const columns = readCardColumns(slotOf(
      column({ type: 'selection', label: '选择', width: 45 }),
      column({ type: 'index', label: '序号', width: 50 }),
      column({ type: 'expand', label: '展开' }),
      column({ label: '名称', prop: 'name' })
    ))

    expect(columns.map(c => c.label)).toEqual(['名称'])
  })

  it('drops columns marked hidden', () => {
    const columns = readCardColumns(slotOf(
      column({ label: '名称', prop: 'name' }),
      column({ label: '请求体', prop: 'body', 'card-role': 'hidden' })
    ))

    expect(columns.map(c => c.label)).toEqual(['名称'])
  })

  it('accepts either spelling of the role attribute', () => {
    // Vue keeps attribute names as authored, so a page may produce either.
    const columns = readCardColumns(slotOf(
      column({ label: 'A', 'card-role': 'title' }),
      column({ label: 'B', cardRole: 'badge' })
    ))

    expect(columns[0].role).toBe('title')
    expect(columns[1].role).toBe('badge')
  })

  it('descends into fragments, so v-for columns are not lost', () => {
    // sys-user builds its dictionary columns in a loop; those arrive as a
    // fragment whose children are the real columns. Without the descent the
    // mobile card would silently omit every generated column.
    const fragment = h('template', null, [
      column({ label: '性别', prop: 'sex' }),
      column({ label: '部门', prop: 'dept.deptName' })
    ])
    // A fragment carries children but no props of its own.
    ;(fragment as { props: unknown }).props = null

    const columns = readCardColumns(slotOf(
      column({ label: '用户名', prop: 'username' }),
      fragment
    ))

    expect(columns.map(c => c.label)).toEqual(['用户名', '性别', '部门'])
  })

  it('ignores columns with no label, which have nothing to caption', () => {
    const columns = readCardColumns(slotOf(
      column({ prop: 'invisible' }),
      column({ label: '', prop: 'blank' }),
      column({ label: '名称', prop: 'name' })
    ))

    expect(columns.map(c => c.label)).toEqual(['名称'])
  })
})

describe('splitCard', () => {
  /** sys-user's real columns, in their real order. */
  const sysUser = () => readCardColumns(slotOf(
    column({ label: '编号', prop: 'userId' }),
    column({ label: '登录名', prop: 'username' }),
    column({ label: '昵称', prop: 'nickName' }),
    column({ label: '部门', prop: 'dept.deptName' }),
    column({ label: '手机号', prop: 'phone' }),
    column({ label: '状态', prop: 'status' }, () => [h('span', '正常')]),
    column({ label: '创建时间', prop: 'createdAt' }, () => [h('span', '2026')])
  ))

  it('skips the leading primary key when choosing a title', () => {
    // Nine of the fifteen list pages lead with an id column. Titling the card
    // "1" would be worse than the table it replaces.
    const card = splitCard(sysUser())

    expect(card.title?.label).toBe('登录名')
    expect(card.badge?.label).toBe('状态')
    expect(card.subtitle.map(c => c.label)).toEqual(['昵称', '部门'])
    // The identifier is still reachable, just not in one of the two slots
    // visible without expanding.
    expect(card.detail.map(c => c.label)).toEqual(['手机号', '创建时间', '编号'])
  })

  it('recognises an identifier by prop or by label', () => {
    // roleId/postId/tableId/jobId match on prop; dictCode only matches on its
    // label, which is why both checks exist.
    const byProp = splitCard(readCardColumns(slotOf(
      column({ label: '编码', prop: 'roleId' }),
      column({ label: '名称', prop: 'roleName' })
    )))
    expect(byProp.title?.label).toBe('名称')

    const byLabel = splitCard(readCardColumns(slotOf(
      column({ label: '编码', prop: 'dictCode' }),
      column({ label: '字典名称', prop: 'dictName' })
    )))
    expect(byLabel.title?.label).toBe('字典名称')
  })

  it('keeps a meaningful first column as the title', () => {
    // Six pages do lead with something readable -- sys-dept, sys-menu,
    // sys-api and others. They must not be pushed aside by the id rule.
    const card = splitCard(readCardColumns(slotOf(
      column({ label: '部门名称', prop: 'deptName' }),
      column({ label: '负责人', prop: 'leader' })
    )))

    expect(card.title?.label).toBe('部门名称')
  })

  it('still titles a card whose columns are all identifiers', () => {
    const card = splitCard(readCardColumns(slotOf(
      column({ label: '编号', prop: 'id' }),
      column({ label: '编码', prop: 'code' })
    )))

    expect(card.title?.label).toBe('编号')
  })

  it('puts every column somewhere', () => {
    const columns = sysUser()
    const card = splitCard(columns)
    const placed = [card.title, card.badge, ...card.subtitle, ...card.detail]
      .filter(Boolean).length

    // A column that lands in no bucket disappears from the page without an
    // error -- the exact failure this whole approach exists to avoid.
    expect(placed).toBe(columns.length)
  })

  it('lets a page override the guess', () => {
    const card = splitCard(readCardColumns(slotOf(
      column({ label: '编号', prop: 'id' }),
      column({ label: '名称', prop: 'name', 'card-role': 'title' }),
      column({ label: '级别', prop: 'level', 'card-role': 'badge' })
    )))

    expect(card.title?.label).toBe('名称')
    expect(card.badge?.label).toBe('级别')
    // Nothing left to put in the two visible slots: the only remaining column
    // is an identifier, and those sink to the detail list.
    expect(card.subtitle).toEqual([])
    expect(card.detail.map(c => c.label)).toEqual(['编号'])
  })

  it('only promotes a status column that renders something', () => {
    // A plain text column called 状态 would arrive as an unstyled string and
    // look broken beside the title; it stays in the field list instead.
    const card = splitCard(readCardColumns(slotOf(
      column({ label: '名称', prop: 'name' }),
      column({ label: '状态', prop: 'status' })
    )))

    expect(card.badge).toBeUndefined()
    expect(card.subtitle.map(c => c.label)).toEqual(['状态'])
  })

  it('survives a table with a single column', () => {
    const card = splitCard(readCardColumns(slotOf(column({ label: '名称', prop: 'name' }))))

    expect(card.title?.label).toBe('名称')
    expect(card.subtitle).toEqual([])
    expect(card.detail).toEqual([])
  })
})

describe('readProp', () => {
  const row = { name: 'admin', dept: { deptName: '研发部' }, empty: null }

  it('reads a plain key', () => {
    expect(readProp(row, 'name')).toBe('admin')
  })

  it('reads a nested path, as el-table-column does', () => {
    expect(readProp(row, 'dept.deptName')).toBe('研发部')
  })

  it('stops at a null link instead of throwing', () => {
    // Real rows arrive with null relations; a card that throws takes the whole
    // list down, where the table would have shown an empty cell.
    expect(readProp(row, 'empty.whatever')).toBeUndefined()
    expect(readProp(row, 'missing.deep.path')).toBeUndefined()
  })

  it('returns undefined without a prop', () => {
    expect(readProp(row, undefined)).toBeUndefined()
  })
})
