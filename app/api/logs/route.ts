import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const dateStr = searchParams.get('date')

    if (action === 'list') {
      const logs = logger.listLogs()
      return NextResponse.json({
        success: true,
        logs,
        logsDirectory: logger.getLogsDirectory(),
      })
    }

    if (action === 'view' && dateStr) {
      const date = new Date(dateStr)
      const logs = logger.getLogs(date)

      if (!logs) {
        return NextResponse.json(
          { error: 'Log file not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        date: dateStr,
        logs,
      })
    }

    if (action === 'today') {
      const today = new Date()
      const logs = logger.getLogs(today)

      return NextResponse.json({
        success: true,
        date: today.toISOString().split('T')[0],
        logs: logs || 'No logs for today',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Logs API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}
