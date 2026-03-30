import { NextRequest, NextResponse } from 'next/server'
import { fileOperations } from '@/lib/file-operations'
import { clientManager } from '@/lib/client-manager'
import { wsManager } from '@/lib/websocket-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      client_id,
      command_id,
      file_path,
      file_name,
      file_size,
      file_type,
      operation,
      local_path,
    } = body

    if (!client_id || !file_path || !file_name || !operation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: client_id, file_path, file_name, operation',
        },
        { status: 400 }
      )
    }

    if (!['download', 'upload', 'delete', 'execute'].includes(operation)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid operation value',
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

    const fileOp = fileOperations.createFileOperation({
      client_id,
      command_id,
      file_path,
      file_name,
      file_size,
      file_type,
      operation,
      local_path,
    })

    // Notify WebSocket clients
    wsManager.notifyFileOperationUpdate(client_id, fileOp.id, 'pending')

    return NextResponse.json({
      success: true,
      data: { file_operation: fileOp },
    })
  } catch (error) {
    console.error('[API] Error creating file operation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create file operation',
      },
      { status: 500 }
    )
  }
}
