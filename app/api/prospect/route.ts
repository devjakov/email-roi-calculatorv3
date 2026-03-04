import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/prospect?name=nike
 *
 * Fetches campaign and flow deliverables for a prospect from Google Sheets.
 * Uses the Google Sheets API v4 (API-key auth, sheet must be readable).
 *
 * Required env vars:
 *   GOOGLE_SHEETS_API_KEY  – API key with Sheets API enabled
 *   GOOGLE_SHEET_ID        – the long ID from the sheet URL
 */
export async function GET(request: NextRequest) {
  const prospect = request.nextUrl.searchParams.get('name')?.toLowerCase().trim()
  if (!prospect) {
    return NextResponse.json({ error: 'Missing ?name= parameter' }, { status: 400 })
  }

  const SHEET_ID = process.env.GOOGLE_SHEET_ID
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY
  if (!SHEET_ID || !API_KEY) {
    return NextResponse.json({ error: 'Server misconfigured – missing Sheets credentials' }, { status: 500 })
  }

  try {
    // Fetch both tabs in parallel
    const [campaignsRes, flowsRes] = await Promise.all([
      fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Campaigns!A:F?key=${API_KEY}`,
        { next: { revalidate: 30 } }
      ),
      fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Flows!A:F?key=${API_KEY}`,
        { next: { revalidate: 30 } }
      ),
    ])

    if (!campaignsRes.ok || !flowsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Google Sheets' }, { status: 502 })
    }

    const campaignsData = await campaignsRes.json()
    const flowsData = await flowsRes.json()

    // Parse rows into objects, filtering by prospect name
    const parseRows = (rows: string[][] | undefined) => {
      if (!rows || rows.length < 2) return []
      const headers = rows[0].map((h: string) => h.trim().toLowerCase())
      return rows.slice(1)
        .map((row: string[]) => {
          const obj: Record<string, string> = {}
          headers.forEach((h: string, i: number) => { obj[h] = row[i] ?? '' })
          return obj
        })
        .filter((r: Record<string, string>) => r.prospect?.toLowerCase().trim() === prospect)
    }

    const campaigns = parseRows(campaignsData.values)
    const flows = parseRows(flowsData.values)

    return NextResponse.json({ prospect, campaigns, flows })
  } catch (err) {
    console.error('Prospect API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
