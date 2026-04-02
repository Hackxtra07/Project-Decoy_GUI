import { NextRequest, NextResponse } from 'next/server'
import { clientManager } from '@/lib/client-manager'
import { commandQueue } from '@/lib/command-queue'
import { fileOperations } from '@/lib/file-operations'
import { sessionManager } from '@/lib/session-manager'
import { systemMonitor } from '@/lib/system-monitor'

export async function GET(request: NextRequest) {
  try {
    const clientStats = await clientManager.getClientStats()
    const commandStats = await commandQueue.getCommandStats()
    const fileStats = await fileOperations.getFileStats()
    const sessionStats = await sessionManager.getSessionStats()

    const clients = await clientManager.getAllClients()
    const latestMetrics = await systemMonitor.getAllLatestMetrics()

    // Calculate system-wide metrics
    let totalCpu = 0
    let totalMemory = 0
    let metricsCount = 0

    latestMetrics.forEach(metrics => {
      totalCpu += metrics.cpu_usage || 0
      totalMemory += metrics.memory_usage || 0
      metricsCount++
    })

    const avgCpu = metricsCount > 0 ? totalCpu / metricsCount : 0
    const avgMemory = metricsCount > 0 ? totalMemory / metricsCount : 0

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          clients: clientStats,
          commands: commandStats,
          files: fileStats,
          sessions: sessionStats,
        },
        metrics: {
          averageCpu: Math.round(avgCpu * 100) / 100,
          averageMemory: Math.round(avgMemory * 100) / 100,
          totalClients: clients.length,
        },
        recentActivity: {
          pendingCommands: commandStats.pending,
          onlineClients: clientStats.onlineClients,
          completedFiles: fileStats.completedOperations,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[API] Error getting dashboard overview:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get dashboard overview',
      },
      { status: 500 }
    )
  }
}
