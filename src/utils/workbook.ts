import type { Cell, SheetData } from 'write-excel-file/browser'

/**
 * Turns a heading row and a grid of values into sheet data plus column widths.
 *
 * Kept apart from useExport because it is the only part of an export with a
 * right answer: given the same rows it must produce the same cells and the same
 * widths, which a unit test can check without a browser, a dialog, or a
 * download. useExport is left with the interaction around it.
 *
 * Nothing here reaches for the writer -- the imports above are types, which the
 * build erases -- so this module stays out of the chunk the writer is loaded in.
 */

export interface SheetColumn {
  /** Width in characters, the unit the format itself uses. */
  width: number
}

export interface Sheet {
  data: SheetData
  columns: SheetColumn[]
}

/** What an empty cell is sized as, since it has no text to measure. */
const EMPTY_WIDTH = 10

/**
 * How wide a value is, in characters.
 *
 * A CJK glyph occupies about two Latin character widths, so it counts double.
 * The vendored writer this replaces tested `charCodeAt(0)` -- the *first*
 * character alone -- and then doubled the whole string on the strength of it, so
 * "ceo董事长" was sized as 6 characters and "董事长ceo" as 12.
 */
export const cellWidth = (value: unknown): number => {
  if (value === null || value === undefined) return EMPTY_WIDTH
  let width = 0
  for (const character of String(value)) {
    width += (character.codePointAt(0) ?? 0) > 0xff ? 2 : 1
  }
  return width
}

/**
 * A value as a cell.
 *
 * The writer reads String, Number, Boolean and Date off the value itself, which
 * is the same set the vendored writer mapped by hand. Everything else becomes
 * text, as it did there. A non-finite number is the one case that has to be
 * caught rather than passed through: the format has no spelling for NaN, and a
 * literal `NaN` in a numeric cell is a workbook Excel refuses to open.
 */
export const toCell = (value: unknown): Cell => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value)
  if (typeof value === 'boolean' || value instanceof Date) return value
  return String(value)
}

export function buildSheet(header: string[], rows: unknown[][]): Sheet {
  const data = [header, ...rows]

  return {
    data: data.map(row => row.map(toCell)),
    // Wide enough for the widest cell in the column, the heading included.
    columns: header.map((_, column) => ({
      width: data.reduce((widest, row) => Math.max(widest, cellWidth(row[column])), 0)
    }))
  }
}
