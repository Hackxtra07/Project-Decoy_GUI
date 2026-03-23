import { NextRequest, NextResponse } from 'next/server'
import { fileOperations } from '@/lib/file-operations'
import { wsManager } from '@/lib/websocket-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const file = fileOperations.getFileOperation(id)
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'File operation not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { file_operation: file },
    })
  } catch (error) {
    console.error('[API] Error getting file status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get file status',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, local_path, file_size, progress } = body

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: status',
        },
        { status: 400 }
      )
    }

    const file = fileOperations.getFileOperation(id)
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'File operation not found',
        },
        { status: 404 }
      )
    }

    fileOperations.updateFileStatus(id, status, local_path)

    if (file_size) {
      fileOperations.updateFileSize(id, file_size)
    }

    // Notify WebSocket clients
    wsManager.notifyFileOperationUpdate(file.client_id, id, status, progress)

    return NextResponse.json({
      success: true,
      message: `File operation status updated to ${status}`,
    })
  } catch (error) {
    console.error('[API] Error updating file status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update file status',
      },
      { status: 500 }
    )
  }
}
