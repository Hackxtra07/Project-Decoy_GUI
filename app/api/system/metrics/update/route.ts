import { NextRequest, NextResponse } from 'next/server'
import { systemMonitor } from '@/lib/system-monitor'
import { clientManager } from '@/lib/client-manager'
import { wsManager } from '@/lib/websocket-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      client_id,
      cpu_usage,
      memory_usage,
      memory_total,
      disk_usage,
      disk_total,
      network_interfaces,
      running_processes,
      network_connections,
    } = body

    if (!client_id || cpu_usage === undefined || memory_usage === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: client_id, cpu_usage, memory_usage',
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

    const metrics = systemMonitor.recordMetrics({
      client_id,
      cpu_usage,
      memory_usage,
      memory_total,
      disk_usage,
      disk_total,
      network_interfaces,
      running_processes,
      network_connections,
    })

    // Update client last seen
    clientManager.updateClientLastSeen(client_id)

    // Notify WebSocket clients
    wsManager.notifyMetricsUpdate(client_id, metrics)

    return NextResponse.json({
      success: true,
      data: { metrics },
    })
  } catch (error) {
    console.error('[API] Error updating metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update metrics',
      },
      { status: 500 }
    )
  }
}
