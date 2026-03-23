import { NextRequest, NextResponse } from 'next/server'
import { getAllClients, getOnlineClients, registerClient, getClientStats, searchClients } from '@/lib/clients'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const query = searchParams.get('q')

    if (action === 'stats') {
      const stats = getClientStats()
      return NextResponse.json(stats)
    }

    if (action === 'online') {
      const clients = getOnlineClients()
      return NextResponse.json(clients)
    }

    if (action === 'search' && query) {
      const results = searchClients(query)
      return NextResponse.json(results)
    }

    const clients = getAllClients()
    return NextResponse.json(clients)
  } catch (error) {
    console.error('[Clients API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const client = registerClient({
      hostname: body.hostname,
      username: body.username,
      os: body.os,
      ip_address: body.ip_address,
      architecture: body.architecture,
      is_admin: body.is_admin,
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('[Clients API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to register client' },
      { status: 400 }
    )
  }
}
