import { NextRequest, NextResponse } from 'next/server'
import { getAnalytics } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const data = getAnalytics()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Analytics API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
