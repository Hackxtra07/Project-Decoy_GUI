import { NextRequest, NextResponse } from 'next/server'
import { commandQueue } from '@/lib/command-queue'

export async function GET(
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
    console.error('[API] Error getting command status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get command status',
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
    const { status, result, error } = body

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: status',
        },
        { status: 400 }
      )
    }

    if (!['executing', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status value',
        },
        { status: 400 }
      )
    }

    commandQueue.updateCommandStatus(id, status, result, error)

    return NextResponse.json({
      success: true,
      message: `Command status updated to ${status}`,
    })
  } catch (error) {
    console.error('[API] Error updating command status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update command status',
      },
      { status: 500 }
    )
  }
}
