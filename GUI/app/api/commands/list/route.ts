import { NextRequest, NextResponse } from 'next/server'
import { commandQueue } from '@/lib/command-queue'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const client_id = searchParams.get('client_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    let commands = client_id ? commandQueue.getClientCommands(client_id, limit) : commandQueue.getAllPendingCommands()

    if (status) {
      commands = commands.filter(cmd => cmd.status === status)
    }

    const stats = commandQueue.getCommandStats()

    return NextResponse.json({
      success: true,
      data: {
        commands: commands.map(c => ({
          ...c,
          parameters: c.parameters ? JSON.parse(c.parameters) : null,
        })),
        stats,
        total: commands.length,
      },
    })
  } catch (error) {
    console.error('[API] Error listing commands:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list commands',
      },
      { status: 500 }
    )
  }
}
