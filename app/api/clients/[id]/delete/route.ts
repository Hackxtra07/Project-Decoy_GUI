import { NextRequest, NextResponse } from 'next/server'
import { clientManager } from '@/lib/client-manager'
import { wsManager } from '@/lib/websocket-handler'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const client = clientManager.getClient(id)
    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      )
    }

    clientManager.deleteClient(id)

    // Notify WebSocket clients
    wsManager.notifyClientDisconnected(id)

    return NextResponse.json({
      success: true,
      message: `Client ${client.hostname} deleted successfully`,
    })
  } catch (error) {
    console.error('[API] Error deleting client:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete client',
      },
      { status: 500 }
    )
  }
}
