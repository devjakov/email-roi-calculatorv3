import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/update
 *
 * Writes edited markdown back to Google Sheets.
 *
 * Body: { key, sheet_row, field, value }
 *   - key:        must match process.env.EDIT_KEY
 *   - sheet_row:  1-based row number in the sheet (returned by /api/prospect)
 *   - field:      "campaigns" (col M) or "flows" (col N)
 *   - value:      new markdown string
 *
 * Required env vars:
 *   GOOGLE_SHEET_ID              – sheet ID
 *   GOOGLE_SHEET_TAB_NAME        – tab name (defaults to "Sheet1")
 *   EDIT_KEY                     – secret key for edit-mode auth
 *   GOOGLE_SERVICE_ACCOUNT_KEY   – full service account JSON string (for write access)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, sheet_row, field, value } = body

    // Auth check
    const EDIT_KEY = process.env.EDIT_KEY
    if (!EDIT_KEY || key !== EDIT_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!sheet_row || !field || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields: sheet_row, field, value' }, { status: 400 })
    }

    if (!['campaigns', 'flows'].includes(field)) {
      return NextResponse.json({ error: 'field must be "campaigns" or "flows"' }, { status: 400 })
    }

    const SHEET_ID = process.env.GOOGLE_SHEET_ID
    const TAB = process.env.GOOGLE_SHEET_TAB_NAME ?? 'Sheet1'
    const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

    if (!SHEET_ID) {
      return NextResponse.json({ error: 'Server misconfigured – missing GOOGLE_SHEET_ID' }, { status: 500 })
    }

    if (!SERVICE_ACCOUNT_KEY) {
      return NextResponse.json(
        { error: 'Write support requires GOOGLE_SERVICE_ACCOUNT_KEY env var' },
        { status: 501 }
      )
    }

    // field "campaigns" → column M, "flows" → column N
    const column = field === 'campaigns' ? 'M' : 'N'
    const range = encodeURIComponent(`${TAB}!${column}${sheet_row}`)

    const serviceAccount = JSON.parse(SERVICE_ACCOUNT_KEY)
    const accessToken = await getAccessToken(serviceAccount)

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW`
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: decodeURIComponent(range),
        majorDimension: 'ROWS',
        values: [[value]],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Sheets write error:', errText)
      return NextResponse.json({ error: 'Failed to write to Google Sheets' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate an OAuth2 access token from a Google service account key.
 * Avoids needing the google-auth-library dependency.
 */
async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const headerB64 = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payloadB64 = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
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
  const sig = btoa(sigStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const jwt = `${unsignedToken}.${sig}`

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
