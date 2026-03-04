import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/update
 *
 * Saves edits back to Google Sheets. Requires the EDIT_KEY for auth.
 *
 * Body: { key, tab, row, column, value }
 *   - key:    must match process.env.EDIT_KEY
 *   - tab:    "Campaigns" or "Flows"
 *   - row:    1-based row number in the sheet (header = row 1)
 *   - column: column letter (A-F)
 *   - value:  new cell value
 *
 * Required env vars:
 *   GOOGLE_SHEETS_API_KEY  – API key with Sheets API enabled (needs write scope → use OAuth or service account)
 *   GOOGLE_SHEET_ID        – sheet ID
 *   EDIT_KEY               – secret key for edit-mode auth
 *
 * NOTE: The Google Sheets API key alone only supports reads.
 * For writes you need a service account. This route is structured to work
 * with a service account token stored in GOOGLE_SERVICE_ACCOUNT_KEY (JSON).
 * If that env var is absent, it falls back to a simple append-to-sheet
 * approach via the API key (which will fail for writes — the user should
 * set up a service account for full edit support).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, tab, row, column, value } = body

    // Auth check
    const EDIT_KEY = process.env.EDIT_KEY
    if (!EDIT_KEY || key !== EDIT_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate inputs
    if (!tab || !row || !column || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields: tab, row, column, value' }, { status: 400 })
    }

    if (!['Campaigns', 'Flows'].includes(tab)) {
      return NextResponse.json({ error: 'Tab must be "Campaigns" or "Flows"' }, { status: 400 })
    }

    const SHEET_ID = process.env.GOOGLE_SHEET_ID
    const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

    if (!SHEET_ID) {
      return NextResponse.json({ error: 'Server misconfigured – missing GOOGLE_SHEET_ID' }, { status: 500 })
    }

    // Get access token from service account
    if (!SERVICE_ACCOUNT_KEY) {
      return NextResponse.json(
        { error: 'Write support requires GOOGLE_SERVICE_ACCOUNT_KEY env var (service account JSON)' },
        { status: 501 }
      )
    }

    const serviceAccount = JSON.parse(SERVICE_ACCOUNT_KEY)
    const accessToken = await getAccessToken(serviceAccount)

    const range = `${tab}!${column}${row}`
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW`

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [[value]],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Sheets write error:', errText)
      return NextResponse.json({ error: 'Failed to write to Google Sheets' }, { status: 502 })
    }

    return NextResponse.json({ success: true, range })
  } catch (err) {
    console.error('Update API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate an OAuth2 access token from a Google service account key.
 * This avoids needing the full google-auth-library dependency.
 */
async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const unsignedToken = `${header}.${payload}`

  // Import the private key and sign the JWT
  const keyData = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  )

  const sigBytes = new Uint8Array(signature)
  let sigStr = ''
  for (let i = 0; i < sigBytes.length; i++) sigStr += String.fromCharCode(sigBytes[i])
  const sig = btoa(sigStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const jwt = `${unsignedToken}.${sig}`

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    throw new Error('Failed to get access token: ' + JSON.stringify(tokenData))
  }

  return tokenData.access_token
}
