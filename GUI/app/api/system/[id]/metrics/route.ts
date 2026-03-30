import { NextRequest, NextResponse } from 'next/server'
import { systemMonitor } from '@/lib/system-monitor'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'latest' // latest, timeseries, aggregate
    const hours = parseInt(searchParams.get('hours') || '24')
    const limit = parseInt(searchParams.get('limit') || '0')

    let data: any

    if (type === 'latest') {
      data = systemMonitor.getLatestMetrics(id)
    } else if (type === 'timeseries') {
      data = systemMonitor.getMetricsTimeseries(id, hours, limit)
    } else if (type === 'aggregate') {
      data = systemMonitor.getAggregateMetrics(id, hours)
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type parameter',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics: data,
        type,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[API] Error getting metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get metrics',
      },
      { status: 500 }
    )
  }
}
