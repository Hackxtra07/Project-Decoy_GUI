import { NextRequest, NextResponse } from 'next/server'
import { clientManager } from '@/lib/client-manager'

export async function GET(request: NextRequest) {
  try {
    const clients = clientManager.getAllClients()
    const stats = clientManager.getClientStats()

    return NextResponse.json({
      success: true,
      data: {
        clients: clients.map(c => ({
          ...c,
          is_admin: Boolean(c.is_admin),
        })),
        stats,
        total: clients.length,
      },
    })
  } catch (error) {
    console.error('[API] Error listing clients:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list clients',
      },
      { status: 500 }
    )
  }
}
