import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/prospect?name=wild-one
 *
 * Finds the row where column L (prospect_id) matches the name param,
 * then returns columns M (campaigns_markdown) and N (flows_markdown).
 *
 * Sheet structure (single tab):
 *   A-K  existing tracker columns
 *   L    prospect_id  (URL slug, e.g. "wild-one")
 *   M    campaigns_markdown
 *   N    flows_markdown
 *
 * Required env vars:
 *   GOOGLE_SHEETS_API_KEY  – API key with Sheets API enabled (read-only is fine)
 *   GOOGLE_SHEET_ID        – the long ID from the sheet URL
 *   GOOGLE_SHEET_TAB_NAME  – tab name (defaults to "Sheet1")
 */
export async function GET(request: NextRequest) {
  const prospect = request.nextUrl.searchParams.get('name')?.toLowerCase().trim()
  if (!prospect) {
    return NextResponse.json({ error: 'Missing ?name= parameter' }, { status: 400 })
  }

  const SHEET_ID = process.env.GOOGLE_SHEET_ID
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY
  const TAB = process.env.GOOGLE_SHEET_TAB_NAME ?? 'Sheet1'

  if (!SHEET_ID || !API_KEY) {
    return NextResponse.json({ error: 'Server misconfigured – missing Sheets credentials' }, { status: 500 })
  }

  try {
    // Fetch columns L–N (prospect_id, campaigns_markdown, flows_markdown)
    const range = encodeURIComponent(`${TAB}!L:N`)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`
    const res = await fetch(url, { next: { revalidate: 30 } })

    if (!res.ok) {
      const err = await res.text()
      console.error('Sheets API error:', err)
      return NextResponse.json({ error: 'Failed to fetch from Google Sheets' }, { status: 502 })
    }

    const data = await res.json()
    const rows: string[][] = data.values ?? []

    // Skip header row, find matching prospect_id (col L, index 0 in our slice)
    const matchIdx = rows.findIndex(
      (row, i) => i > 0 && row[0]?.toLowerCase().trim() === prospect
    )

    if (matchIdx === -1) {
      return NextResponse.json({ error: `No deliverables found for prospect: ${prospect}` }, { status: 404 })
    }

    const row = rows[matchIdx]
    return NextResponse.json({
      prospect,
      campaigns_markdown: row[1] ?? '',
      flows_markdown: row[2] ?? '',
      // Row number in sheet (1-based). Used by the update API.
      // matchIdx is the index in the L:N slice; add 1 for 1-based row number.
      sheet_row: matchIdx + 1,
    })
  } catch (err) {
    console.error('Prospect API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
