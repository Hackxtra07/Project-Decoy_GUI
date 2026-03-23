import { NextRequest, NextResponse } from 'next/server'
import { getFileRecord, updateFileStatus, deleteFileRecord } from '@/lib/files'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const file = getFileRecord(id)

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(file)
  } catch (error) {
    console.error('[Files API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const file = updateFileStatus(
      id,
      body.status,
      body.local_path
    )

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(file)
  } catch (error) {
    console.error('[Files API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const success = deleteFileRecord(id)

    if (!success) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Files API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
