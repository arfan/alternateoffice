/// Import the HTML-table files commonly emitted by old web applications with
/// an .xls extension. Excel accepts these files by inspecting their contents;
/// the native legacy workbook reader quite correctly does not.

import { decodeCsvBuffer, isNumericCell } from './csv-import'

import { encodeXlsxEscapes } from './xlsx-escapes'
import { DEFAULT_THEME_XML } from './xlsx-default-theme'
import { MINIMAL_STYLESHEET_XML } from './xlsx-default-styles'
import { validateSheetName } from './xlsx-sheets'
import JSZip from 'jszip'

const MAX_HTML_IMPORT_BYTES = 50 * 1024 * 1024
const MAX_HTML_ROWS = 1_048_576
const MAX_HTML_COLS = 16_384

export function looksLikeHtmlSpreadsheet(bytes: Uint8Array): boolean {
  const sample = decodeCsvBuffer(bytes.subarray(0, Math.min(bytes.length, 8192)))
    .replace(/^\uFEFF/, '')
    .trimStart()
    .toLowerCase()
  return (
    (sample.startsWith('<!doctype html') || sample.startsWith('<html') || sample.startsWith('<head')) &&
    /<table(?:\s|>)/i.test(sample)
  )
}

type PendingCell = { value: string; remaining: number }

function attribute(tag: string, name: string): number {
  const match = new RegExp(`\\b${name}\\s*=\\s*["']?([^\\s"'>]+)`, 'i').exec(tag)
  const value = Number.parseInt(match?.[1] ?? '', 10)
  return Number.isFinite(value) && value > 0 ? Math.min(value, MAX_HTML_COLS) : 1
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }
  return value.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]+);/gi, (whole, entity: string) => {
    const lower = entity.toLowerCase()
    if (lower in named) return named[lower]!
    if (lower.startsWith('#x')) {
      const code = Number.parseInt(lower.slice(2), 16)
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole
    }
    if (lower.startsWith('#')) {
      const code = Number.parseInt(lower.slice(1), 10)
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole
    }
    return whole
  })
}

function normalizeCell(value: string): string {
  return decodeEntities(value)
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim()
}

/** Extracts the largest direct HTML table without executing scripts. */
export function htmlTableToRows(html: string): string[][] {
  const candidates: string[][][] = []
  let tableDepth = 0
  let current: string[][] | undefined
  let row: string[] | undefined
  let cell: { value: string; colspan: number; rowspan: number } | undefined
  let ignoredDepth = 0
  const pending = new Map<number, PendingCell>()
  const tokens = /<!--[\s\S]*?-->|<[^>]*>|[^<]+/g

  const finishCell = (): void => {
    if (!cell || !row) return
    const value = normalizeCell(cell.value)
    let column = 0
    while (row[column] !== undefined || pending.has(column)) column += 1
    row[column] = value
    if (column + cell.colspan > MAX_HTML_COLS) throw new Error(`The HTML spreadsheet exceeds ${MAX_HTML_COLS} columns.`)
    for (let offset = 1; offset < cell.colspan; offset += 1) row[column + offset] = ''
    if (cell.rowspan > 1) {
      for (let offset = 0; offset < cell.colspan; offset += 1)
        pending.set(column + offset, { value: offset === 0 ? value : '', remaining: cell.rowspan - 1 })
    }
    cell = undefined
  }

  const finishRow = (): void => {
    finishCell()
    if (!row || !current) return
    while (row.length > 0 && row[row.length - 1] === '') row.pop()
    if (row.length > 0) {
      if (current.length >= MAX_HTML_ROWS) throw new Error(`The HTML spreadsheet exceeds ${MAX_HTML_ROWS} rows.`)
      current.push(row)
    }
    row = undefined
  }

  for (const token of html.matchAll(tokens)) {
    const part = token[0]
    if (part.startsWith('<!--')) continue
    if (!part.startsWith('<')) {
      if (cell && ignoredDepth === 0) cell.value += part
      continue
    }
    const tagMatch = /^<\/?\s*([a-z0-9]+)([^>]*)>/i.exec(part)
    if (!tagMatch) continue
    const name = tagMatch[1]!.toLowerCase()
    const closing = /^<\//.test(part)
    if (name === 'script' || name === 'style') {
      if (closing) ignoredDepth = Math.max(0, ignoredDepth - 1)
      else if (!/\/\s*>$/.test(part)) ignoredDepth += 1
      continue
    }
    if (name === 'table') {
      if (closing) {
        finishRow()
        if (tableDepth === 1 && current) candidates.push(current)
        tableDepth = Math.max(0, tableDepth - 1)
        current = tableDepth === 0 ? undefined : current
      } else {
        if (tableDepth === 0) {
          current = []
          pending.clear()
        }
        tableDepth += 1
      }
      continue
    }
    if (tableDepth !== 1 || !current) continue
    if (name === 'tr') {
      if (closing) finishRow()
      else {
        finishRow()
        row = []
        for (const [column, carried] of pending) {
          row[column] = carried.value
          if (carried.remaining <= 1) pending.delete(column)
          else pending.set(column, { ...carried, remaining: carried.remaining - 1 })
        }
      }
    } else if (name === 'td' || name === 'th') {
      if (closing) finishCell()
      else {
        finishCell()
        cell = { value: '', colspan: attribute(tagMatch[2]!, 'colspan'), rowspan: attribute(tagMatch[2]!, 'rowspan') }
      }
    } else if (!closing && name === 'br' && cell) {
      cell.value += '\n'
    }
  }
  finishRow()
  if (current) candidates.push(current)
  const best = candidates.reduce<string[][] | undefined>(
    (winner, candidate) => (!winner || candidate.flat().length > winner.flat().length ? candidate : winner),
    undefined,
  )
  if (!best || best.length === 0) throw new Error('The HTML spreadsheet contains no table data.')
  return best
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function columnLabel(column: number): string {
  let label = ''
  for (let remaining = column + 1; remaining > 0; remaining = Math.floor((remaining - 1) / 26))
    label = String.fromCharCode(65 + ((remaining - 1) % 26)) + label
  return label
}

function worksheetXml(rows: readonly (readonly string[])[]): string {
  const lines: string[] = []
  let maxColumns = 1
  rows.forEach((values, rowIndex) => {
    const cells: string[] = []
    values.forEach((value, columnIndex) => {
      if (value === '') return
      maxColumns = Math.max(maxColumns, columnIndex + 1)
      const reference = `${columnLabel(columnIndex)}${rowIndex + 1}`
        cells.push(
          isNumericCell(value)
            ? `<c r="${reference}"><v>${Number(value)}</v></c>`
            : `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(encodeXlsxEscapes(value))}</t></is></c>`,
        )
    })
    if (cells.length > 0) lines.push(`<row r="${rowIndex + 1}">${cells.join('')}</row>`)
  })
  return `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${columnLabel(maxColumns - 1)}${Math.max(rows.length, 1)}"/><sheetData>${lines.join('')}</sheetData></worksheet>`
}

export async function htmlToXlsxBufferForOpen(bytes: Uint8Array, sheetName = 'Sheet1'): Promise<Buffer> {
  if (bytes.length > MAX_HTML_IMPORT_BYTES) throw new Error('The HTML spreadsheet is too large to import.')
  validateSheetName(sheetName)
  const rows = htmlTableToRows(decodeCsvBuffer(bytes))
  const zip = new JSZip()
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`)
  zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></sheets></workbook>`)
  zip.file('xl/_rels/workbook.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
  zip.file('xl/styles.xml', MINIMAL_STYLESHEET_XML)
  zip.file('xl/worksheets/sheet1.xml', worksheetXml(rows))
  zip.file('xl/theme/theme1.xml', DEFAULT_THEME_XML)
  return zip.generateAsync({ type: 'nodebuffer' })
}
