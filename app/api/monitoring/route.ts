import { NextRequest, NextResponse } from 'next/server'
import { recordMetrics, getClientLatestMetrics, getClientMetricsSince, getAverageMetrics, getNetworkStats, getRunningProcesses } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId parameter is required' },
        { status: 400 }
      )
    }

    if (action === 'latest') {
      const metrics = getClientLatestMetrics(clientId)
      return NextResponse.json(metrics)
    }

    if (action === 'since') {
      const minutes = parseInt(searchParams.get('minutes') || '60')
      const history = getClientMetricsSince(clientId, minutes)
      return NextResponse.json(history)
    }

    if (action === 'average') {
      const minutes = parseInt(searchParams.get('minutes') || '60')
      const averages = getAverageMetrics(clientId, minutes)
      return NextResponse.json(averages)
    }

    if (action === 'network') {
      const stats = getNetworkStats(clientId)
      return NextResponse.json(stats)
    }

    if (action === 'processes') {
      const processes = getRunningProcesses(clientId)
      return NextResponse.json(processes)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Monitoring API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const metrics = recordMetrics({
      client_id: body.client_id,
      cpu_usage: body.cpu_usage,
      memory_usage: body.memory_usage,
      memory_total: body.memory_total,
      disk_usage: body.disk_usage,
      disk_total: body.disk_total,
      network_interfaces: body.network_interfaces,
      running_processes: body.running_processes,
      network_connections: body.network_connections,
    })

    return NextResponse.json(metrics, { status: 201 })
  } catch (error) {
    console.error('[Monitoring API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to record metrics' },
      { status: 400 }
    )
  }
}
