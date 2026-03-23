import { NextRequest, NextResponse } from 'next/server'
import { getCommand, updateCommandStatus, deleteCommand } from '@/lib/commands'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const command = getCommand(id)

    if (!command) {
      return NextResponse.json(
        { error: 'Command not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(command)
  } catch (error) {
    console.error('[Commands API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch command' },
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

    const command = updateCommandStatus(
      id,
      body.status,
      body.result,
      body.error_message
    )

    if (!command) {
      return NextResponse.json(
        { error: 'Command not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(command)
  } catch (error) {
    console.error('[Commands API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update command' },
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
    const success = deleteCommand(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Command not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Commands API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete command' },
      { status: 500 }
    )
  }
}
