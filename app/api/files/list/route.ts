import { NextRequest, NextResponse } from 'next/server'
import { fileOperations } from '@/lib/file-operations'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const client_id = searchParams.get('client_id')
    const operation = searchParams.get('operation')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    let files = client_id ? fileOperations.getClientFiles(client_id, limit) : []

    if (operation) {
      files = files.filter(f => f.operation === operation)
    }

    if (status) {
      files = files.filter(f => f.status === status)
    }

    const stats = fileOperations.getFileStats()

    return NextResponse.json({
      success: true,
      data: {
        files,
        stats,
        total: files.length,
      },
    })
  } catch (error) {
    console.error('[API] Error listing files:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list files',
      },
      { status: 500 }
    )
  }
}
