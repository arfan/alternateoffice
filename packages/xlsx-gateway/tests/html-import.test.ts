import { describe, expect, it } from 'vitest'

import { htmlTableToRows, looksLikeHtmlSpreadsheet } from '../src/gateway/html-import'

describe('HTML disguised as XLS import', () => {
  it('detects an HTML table without accepting a binary workbook', () => {
    expect(looksLikeHtmlSpreadsheet(Buffer.from('<html><body><table><tr><td>A</td></tr></table>'))).toBe(true)
    expect(looksLikeHtmlSpreadsheet(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1]))).toBe(false)
  })

  it('extracts cell text, entities, line breaks, colspan, and rowspan', () => {
    const rows = htmlTableToRows(`
      <html><body><table>
        <tr><th colspan="2">&nbsp;Name&nbsp;</th></tr>
        <tr><td rowspan="2">A</td><td>One<br>Street</td></tr>
        <tr><td>Two &amp; Three</td></tr>
      </table></body></html>
    `)
    expect(rows).toEqual([
      ['Name', ''],
      ['A', 'One\nStreet'],
      ['A', 'Two & Three'],
    ])
  })
})
