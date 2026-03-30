import { NextRequest, NextResponse } from 'next/server'
import { createFileRecord, getClientFiles, getFileStats, searchFiles } from '@/lib/files'

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
      const stats = getFileStats(clientId)
      return NextResponse.json(stats)
    }

    if (action === 'search' && query) {
      const results = searchFiles(clientId, query)
      return NextResponse.json(results)
    }

    const files = getClientFiles(clientId)
    return NextResponse.json(files)
  } catch (error) {
    console.error('[Files API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const file = createFileRecord({
      client_id: body.client_id,
      command_id: body.command_id,
      file_path: body.file_path,
      file_name: body.file_name,
      file_size: body.file_size,
      file_type: body.file_type,
      operation: body.operation,
      local_path: body.local_path,
    })

    return NextResponse.json(file, { status: 201 })
  } catch (error) {
    console.error('[Files API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create file record' },
      { status: 400 }
    )
  }
}
