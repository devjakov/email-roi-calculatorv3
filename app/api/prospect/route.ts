import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/prospect?name=tonal
 *
 * Finds the row where column L (prospect_id) matches the name param,
 * returns columns M (campaigns_markdown) and N (flows_markdown).
 *
 * Sheet must be shared: "Anyone with the link → Viewer"
 *
 * Required env vars:
 *   GOOGLE_SHEETS_API_KEY  – API key with Sheets API enabled
 *   GOOGLE_SHEET_ID        – the long ID from the sheet URL
 *   GOOGLE_SHEET_TAB_NAME  – exact tab name at bottom of sheet (defaults to "Sheet1")
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
    return NextResponse.json({ error: 'Server misconfigured – missing GOOGLE_SHEET_ID or GOOGLE_SHEETS_API_KEY' }, { status: 500 })
  }

  try {
    // Only encode the tab name (handles spaces), NOT the ! or : which must stay literal
    const encodedTab = TAB.replace(/'/g, "''").replace(/ /g, '%20')
    const range = `${encodedTab}!L:N`
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`

    const res = await fetch(url, { cache: 'no-store' })

    if (!res.ok) {
      const err = await res.text()
      console.error('Sheets API error:', res.status, err)

      // Surface a helpful message based on the HTTP status
      if (res.status === 403) {
        return NextResponse.json({
          error: 'Google Sheets access denied (403). Share the sheet: File → Share → Anyone with the link → Viewer'
        }, { status: 502 })
      }
      if (res.status === 404) {
        return NextResponse.json({
          error: `Sheet or tab not found (404). Check GOOGLE_SHEET_ID and GOOGLE_SHEET_TAB_NAME (current: "${TAB}")`
        }, { status: 502 })
      }
      return NextResponse.json({
        error: `Sheets API returned ${res.status}. Check Vercel function logs for details.`
      }, { status: 502 })
    }

    const data = await res.json()
    const rows: string[][] = data.values ?? []

    if (rows.length === 0) {
      return NextResponse.json({
        error: `Tab "${TAB}" appears empty or columns L-N have no data.`
      }, { status: 404 })
    }

    // Skip header row (row 0), find matching prospect_id (col L = index 0 in L:N slice)
    const matchIdx = rows.findIndex(
      (row, i) => i > 0 && row[0]?.toLowerCase().trim() === prospect
    )

    if (matchIdx === -1) {
      // List available prospect_ids to help debug
      const available = rows
        .slice(1)
        .map(r => r[0]?.trim())
        .filter(Boolean)
        .join(', ')
      return NextResponse.json({
        error: `No row found for prospect_id "${prospect}". Available in column L: ${available || '(none found)'}`
      }, { status: 404 })
    }

    const row = rows[matchIdx]
    return NextResponse.json({
      prospect,
      campaigns_markdown: row[1] ?? '',
      flows_markdown: row[2] ?? '',
      sheet_row: matchIdx + 1, // 1-based row number used by /api/update
    })
  } catch (err) {
    console.error('Prospect API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
