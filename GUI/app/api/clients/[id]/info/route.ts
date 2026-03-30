import { NextRequest, NextResponse } from 'next/server'
import { clientManager } from '@/lib/client-manager'
import { commandQueue } from '@/lib/command-queue'
import { systemMonitor } from '@/lib/system-monitor'
import { fileOperations } from '@/lib/file-operations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const client = clientManager.getClient(id)
    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      )
    }

    const commands = commandQueue.getClientCommands(id, 20)
    const metrics = systemMonitor.getLatestMetrics(id)
    const files = fileOperations.getClientFiles(id, 10)

    return NextResponse.json({
      success: true,
      data: {
        client: {
          ...client,
          is_admin: Boolean(client.is_admin),
        },
        commands: commands.map(c => ({
          ...c,
          parameters: c.parameters ? JSON.parse(c.parameters) : null,
        })),
        metrics,
        files,
        recentActivity: {
          lastCommandCount: commands.length,
          lastCommandStatus: commands.length > 0 ? commands[0].status : null,
          hasMetrics: metrics !== null,
        },
      },
    })
  } catch (error) {
    console.error('[API] Error getting client info:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get client info',
      },
      { status: 500 }
    )
  }
}
