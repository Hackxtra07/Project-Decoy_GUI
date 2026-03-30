import { NextRequest, NextResponse } from 'next/server'
import { commandQueue } from '@/lib/command-queue'
import { wsManager } from '@/lib/websocket-handler'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const command = commandQueue.getCommand(id)
    if (!command) {
      return NextResponse.json(
        {
          success: false,
          error: 'Command not found',
        },
        { status: 404 }
      )
    }

    if (command.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel command with status: ${command.status}`,
        },
        { status: 400 }
      )
    }

    commandQueue.cancelCommand(id)

    // Notify WebSocket clients
    wsManager.notifyCommandStatusUpdated(command.client_id, id, 'cancelled')

    return NextResponse.json({
      success: true,
      message: 'Command cancelled successfully',
    })
  } catch (error) {
    console.error('[API] Error cancelling command:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel command',
      },
      { status: 500 }
    )
  }
}
