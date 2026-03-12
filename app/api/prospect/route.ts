import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/prospect?name=tonal
 *
 * Reads columns L–N from the Dream 100 tracker sheet.
 * Uses service account auth — the sheet does NOT need to be public.
 * Just share the sheet with the service account email.
 *
 * Required env vars:
 *   GOOGLE_SHEET_ID              – long ID from sheet URL
 *   GOOGLE_SHEET_TAB_NAME        – exact tab name at bottom of sheet (e.g. Sheet1)
 *   GOOGLE_SERVICE_ACCOUNT_KEY   – full service account JSON string
 */
export async function GET(request: NextRequest) {
  const prospect = request.nextUrl.searchParams.get('name')?.toLowerCase().trim()
  if (!prospect) {
    return NextResponse.json({ error: 'Missing ?name= parameter' }, { status: 400 })
  }

  const SHEET_ID = process.env.GOOGLE_SHEET_ID
  const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const TAB = process.env.GOOGLE_SHEET_TAB_NAME ?? 'Sheet1'

  if (!SHEET_ID) {
    return NextResponse.json({ error: 'Missing GOOGLE_SHEET_ID env var' }, { status: 500 })
  }
  if (!SERVICE_ACCOUNT_KEY) {
    return NextResponse.json({ error: 'Missing GOOGLE_SERVICE_ACCOUNT_KEY env var' }, { status: 500 })
  }

  try {
    const serviceAccount = JSON.parse(SERVICE_ACCOUNT_KEY)
    const accessToken = await getAccessToken(serviceAccount)

    // Only encode spaces in the tab name — ! and : must stay literal for Sheets API
    const encodedTab = TAB.replace(/'/g, "''").replace(/ /g, '%20')
    const range = `${encodedTab}!L:N`
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Sheets API error:', res.status, err)

      if (res.status === 403) {
        return NextResponse.json({
          error: `Access denied (403). Share the sheet with the service account email: ${serviceAccount.client_email}`
        }, { status: 502 })
      }
      if (res.status === 404) {
        return NextResponse.json({
          error: `Sheet or tab not found (404). Check GOOGLE_SHEET_ID and GOOGLE_SHEET_TAB_NAME — currently set to "${TAB}". The tab name is the small text on the coloured tab at the bottom of your Google Sheet.`
        }, { status: 502 })
      }
      return NextResponse.json({
        error: `Sheets API returned ${res.status}. Check Vercel function logs.`
      }, { status: 502 })
    }

    const data = await res.json()
    const rows: string[][] = data.values ?? []

    if (rows.length === 0) {
      return NextResponse.json({
        error: `Tab "${TAB}" has no data in columns L–N.`
      }, { status: 404 })
    }

    // Row 0 = header, find matching prospect_id in col L (index 0 of L:N slice)
    const matchIdx = rows.findIndex(
      (row, i) => i > 0 && row[0]?.toLowerCase().trim() === prospect
    )

    if (matchIdx === -1) {
      const available = rows
        .slice(1)
        .map(r => r[0]?.trim())
        .filter(Boolean)
        .join(', ')
      return NextResponse.json({
        error: `No row found for "${prospect}" in column L. Found: ${available || '(none)'}`
      }, { status: 404 })
    }

    const row = rows[matchIdx]
    return NextResponse.json({
      prospect,
      campaigns_markdown: row[1] ?? '',
      flows_markdown: row[2] ?? '',
      sheet_row: matchIdx + 1,
    })
  } catch (err) {
    console.error('Prospect API error:', err)
    return NextResponse.json({ error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
  }
}

async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const headerB64 = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payloadB64 = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const unsignedToken = `${headerB64}.${payloadB64}`
  const keyData = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(unsignedToken)
  )

  const sigBytes = new Uint8Array(signature)
  let sigStr = ''
  for (let i = 0; i < sigBytes.length; i++) sigStr += String.fromCharCode(sigBytes[i])
  const sig = btoa(sigStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const jwt = `${unsignedToken}.${sig}`
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error('No access token: ' + JSON.stringify(tokenData))
  return tokenData.access_token
}
