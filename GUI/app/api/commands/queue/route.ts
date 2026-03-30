import { NextRequest, NextResponse } from 'next/server'
import { commandQueue } from '@/lib/command-queue'
import { clientManager } from '@/lib/client-manager'
import { wsManager } from '@/lib/websocket-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { client_id, command_type, command_name, parameters } = body

    if (!client_id || !command_type || !command_name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: client_id, command_type, command_name',
        },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = clientManager.getClient(client_id)
    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      )
    }

    const command = commandQueue.queueCommand({
      client_id,
      command_type,
      command_name,
      parameters,
    })

    // Update client last seen
    clientManager.updateClientLastSeen(client_id)

    // Notify WebSocket clients
    wsManager.notifyCommandQueued(client_id, {
      commandId: command.id,
      commandType: command.command_type,
      commandName: command.command_name,
    })

    return NextResponse.json({
      success: true,
      data: {
        command: {
          ...command,
          parameters: command.parameters ? JSON.parse(command.parameters) : null,
        },
      },
    })
  } catch (error) {
    console.error('[API] Error queuing command:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to queue command',
      },
      { status: 500 }
    )
  }
}
