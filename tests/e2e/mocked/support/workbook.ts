import { readFile } from 'node:fs/promises'
import type { Download } from '@playwright/test'
import JSZip from 'jszip'

/**
 * Reads a downloaded .xlsx back into a grid of values.
 *
 * An export test that only checks the file arrived proves very little: a writer
 * that produced an empty or corrupt package still fires a download, still
 * carries the right name, and still leaves the build green. Opening the package
 * and reading the cells is what makes a writer swap checkable.
 *
 * The reader is deliberately written against OOXML rather than against one
 * writer's habits, because it exists to compare two of them. A string cell can
 * arrive in three shapes and every writer picks one:
 *
 *   t="s"          <v> holds an index into xl/sharedStrings.xml
 *   t="inlineStr"  the text sits in <is><t> on the cell itself
 *   t="str"        <v> holds the literal (SheetJS writes this with bookSST off)
 *
 * A cell with no `t` at all is numeric -- that is the format's default, and it
 * is the one shape both writers agree on, which is what lets the typing of the
 * numeric columns be asserted at all.
 */

export interface Cell {
  value: string
  /** True when the cell carries no type attribute, i.e. Excel reads it as a number. */
  numeric: boolean
}

const CELL = /<c\s([^>]*?)\/>|<c\s([^>]*?)>([\s\S]*?)<\/c>/g
const ROW = /<row[\s>][\s\S]*?<\/row>/g
const TYPE = /\bt="([^"]*)"/
const V = /<v[^>]*>([\s\S]*?)<\/v>/
const INLINE = /<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/
const SHARED = /<si>[\s\S]*?<\/si>/g
const TEXT = /<t[^>]*>([\s\S]*?)<\/t>/g

const unescape = (xml: string): string => xml
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  .replace(/&amp;/g, '&')

/** Concatenates the <t> runs in one <si>; rich text splits a string across several. */
const sharedStrings = (xml: string | null): string[] =>
  (xml?.match(SHARED) ?? []).map(si =>
    [...si.matchAll(TEXT)].map(run => unescape(run[1])).join('')
  )

const readRow = (xml: string, strings: string[]): Cell[] => {
  const cells: Cell[] = []
  for (const match of xml.matchAll(CELL)) {
    const attributes = match[1] ?? match[2] ?? ''
    const body = match[3] ?? ''
    const type = attributes.match(TYPE)?.[1]
    const literal = body.match(V)?.[1] ?? ''

    if (type === 's') cells.push({ value: strings[Number(literal)] ?? '', numeric: false })
    else if (type === 'inlineStr') cells.push({ value: unescape(body.match(INLINE)?.[1] ?? ''), numeric: false })
    else if (type === undefined) cells.push({ value: unescape(literal), numeric: true })
    else cells.push({ value: unescape(literal), numeric: false })
  }
  return cells
}

export interface Workbook {
  /** Every part in the package, so a test can assert the container is complete. */
  parts: string[]
  /** The first worksheet, row by row. */
  rows: Cell[][]
}

export async function readWorkbook(download: Download): Promise<Workbook> {
  const zip = await JSZip.loadAsync(await readFile(await download.path()))

  const sheet = zip.file('xl/worksheets/sheet1.xml')
  if (!sheet) {
    throw new Error(`no xl/worksheets/sheet1.xml in the download; parts: ${Object.keys(zip.files).join(', ')}`)
  }

  const strings = sharedStrings(await zip.file('xl/sharedStrings.xml')?.async('string') ?? null)
  const xml = await sheet.async('string')

  return {
    parts: Object.keys(zip.files),
    rows: (xml.match(ROW) ?? []).map(row => readRow(row, strings))
  }
}

/** The grid as plain text, for asserting content without asserting cell types. */
export const values = (workbook: Workbook): string[][] =>
  workbook.rows.map(row => row.map(cell => cell.value))
