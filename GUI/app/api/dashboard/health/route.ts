import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase()

    // Test database connection
    const result = db.prepare('SELECT 1 as status').get() as { status: number }

    if (result?.status !== 1) {
      return NextResponse.json(
        {
          success: false,
          status: 'unhealthy',
          error: 'Database connection failed',
        },
        { status: 503 }
      )
    }

    // Get database stats
    const tableCount = db.prepare(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
    ).get() as { count: number }

    return NextResponse.json({
      success: true,
      status: 'healthy',
      data: {
        database: {
          connected: true,
          tables: tableCount.count,
        },
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    })
  } catch (error) {
    console.error('[API] Error checking health:', error)
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        error: 'Health check failed',
      },
      { status: 503 }
    )
  }
}
