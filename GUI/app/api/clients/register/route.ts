import { NextRequest, NextResponse } from 'next/server'
import { clientManager } from '@/lib/client-manager'
import { wsManager } from '@/lib/websocket-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { hostname, username, os, ip_address, architecture, is_admin } = body

    if (!hostname || !username || !os || !ip_address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: hostname, username, os, ip_address',
        },
        { status: 400 }
      )
    }

    const client = clientManager.registerClient({
      hostname,
      username,
      os,
      ip_address,
      architecture,
      is_admin,
    })

    // Notify WebSocket clients
    wsManager.notifyClientConnected(client.id, client)

    return NextResponse.json({
      success: true,
      data: {
        client: {
          ...client,
          is_admin: Boolean(client.is_admin),
        },
      },
    })
  } catch (error) {
    console.error('[API] Error registering client:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register client',
      },
      { status: 500 }
    )
  }
}
