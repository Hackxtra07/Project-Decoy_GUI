import { NextRequest, NextResponse } from 'next/server'
import { createCommand, getExecutionStats, getPendingCommands } from '@/lib/commands'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const clientId = searchParams.get('clientId')

    if (action === 'stats') {
      const stats = await getExecutionStats()
      return NextResponse.json(stats)
    }

    if (action === 'pending' && clientId) {
      const commands = await getPendingCommands(clientId)
      return NextResponse.json(commands)
    }

    if (action === 'history' && clientId) {
      const { getClientCommands } = await import('@/lib/commands')
      const commands = await getClientCommands(clientId, 20)
      return NextResponse.json(commands)
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Commands API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commands' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Commands API] Received request:', body)

    const command = await createCommand({
      client_id: body.client_id,
      command_type: body.command_type,
      command_name: body.command_name,
      parameters: body.parameters,
    })
    console.log('[Commands API] Created command:', command.id)

    return NextResponse.json(command, { status: 201 })
  } catch (error) {
    console.error('[Commands API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create command' },
      { status: 400 }
    )
  }
}
