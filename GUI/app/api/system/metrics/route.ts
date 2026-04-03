import { NextRequest, NextResponse } from 'next/server'
import { systemMonitor } from '@/lib/system-monitor'

export async function GET(request: NextRequest) {
  try {
    const metricsArray = await systemMonitor.getAllLatestMetrics()

    return NextResponse.json({
      success: true,
      data: {
        metrics: metricsArray,
        total: metricsArray.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[API] Error getting all metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get metrics',
      },
      { status: 500 }
    )
  }
}
