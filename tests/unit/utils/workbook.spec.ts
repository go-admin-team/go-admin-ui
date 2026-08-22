import { describe, it, expect } from 'vitest'
import { buildSheet, cellWidth, toCell } from '@/utils/workbook'

/**
 * The part of an export with a right answer.
 *
 * The end-to-end side of this lives in tests/e2e/mocked/sys-post.spec.ts, which
 * clicks 导出 and opens the workbook that comes back. That run costs a browser
 * and a dev server, so it checks one grid; the cases that only differ in the
 * values -- empty cells, wide glyphs, a number that is not a number -- are
 * cheaper to pin down here.
 */

describe('cellWidth', () => {
  it('counts a latin character as one and a CJK glyph as two', () => {
    expect(cellWidth('ceo')).toBe(3)
    expect(cellWidth('董事长')).toBe(6)
  })

  it('measures every character, not just the first', () => {
    // The vendored writer decided on charCodeAt(0) alone, so a mixed string was
    // sized by whichever script it happened to start with.
    expect(cellWidth('ceo董事长')).toBe(9)
    expect(cellWidth('董事长ceo')).toBe(9)
  })

  it('gives an empty cell a width it has no text to earn', () => {
    expect(cellWidth(null)).toBe(10)
    expect(cellWidth(undefined)).toBe(10)
  })

  it('measures a number by the text it renders as', () => {
    expect(cellWidth(1)).toBe(1)
    expect(cellWidth(1000)).toBe(4)
  })
})

describe('toCell', () => {
  it('keeps the four types the format stores natively', () => {
    const date = new Date('2026-08-01T10:00:00Z')
    expect(toCell('ceo')).toBe('ceo')
    expect(toCell(42)).toBe(42)
    expect(toCell(true)).toBe(true)
    expect(toCell(date)).toBe(date)
  })

  it('empties a cell rather than writing the word null into it', () => {
    expect(toCell(null)).toBeNull()
    expect(toCell(undefined)).toBeNull()
  })

  it('turns anything else into text', () => {
    expect(toCell({ id: 1 })).toBe('[object Object]')
    expect(toCell([1, 2])).toBe('1,2')
  })

  it('does not let a non-finite number reach a numeric cell', () => {
    // The format has no spelling for these. Written as numbers they produce a
    // workbook Excel declines to open, which is worse than seeing "NaN".
    expect(toCell(NaN)).toBe('NaN')
    expect(toCell(Infinity)).toBe('Infinity')
  })
})

describe('buildSheet', () => {
  const header = ['岗位编号', '岗位编码', '岗位名称']
  const rows = [
    [1, 'ceo', '董事长'],
    [2, 'dev', '开发工程师']
  ]

  it('puts the heading row above the data', () => {
    expect(buildSheet(header, rows).data).toEqual([
      ['岗位编号', '岗位编码', '岗位名称'],
      [1, 'ceo', '董事长'],
      [2, 'dev', '开发工程师']
    ])
  })

  it('sizes each column to its widest cell, heading included', () => {
    expect(buildSheet(header, rows).columns).toEqual([
      { width: 8 }, // 岗位编号, wider than "1" or "2"
      { width: 8 }, // 岗位编码, wider than "ceo"
      { width: 10 } // 开发工程师, wider than 岗位名称
    ])
  })

  it('gives one column per heading even when a row runs short', () => {
    const { data, columns } = buildSheet(header, [[1, 'ceo']])
    expect(columns).toHaveLength(3)
    // The missing cell counts as an empty one, and an empty cell asks for room
    // to be typed into rather than for none -- so the column widens to 10
    // rather than shrinking to its heading.
    expect(columns[2]).toEqual({ width: 10 })
    expect(data[1]).toEqual([1, 'ceo'])
  })

  it('writes a heading row on its own when there is nothing to export', () => {
    // useExport returns early on an empty list, so this is defence rather than a
    // path a page can reach -- but a widths loop over no rows is where an
    // off-by-one would land.
    expect(buildSheet(header, [])).toEqual({
      data: [['岗位编号', '岗位编码', '岗位名称']],
      columns: [{ width: 8 }, { width: 8 }, { width: 8 }]
    })
  })
})
