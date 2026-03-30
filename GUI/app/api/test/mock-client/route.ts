import { NextRequest, NextResponse } from 'next/server'
import { clientManager } from '@/lib/client-manager'
import { systemMonitor } from '@/lib/system-monitor'
import { commandQueue } from '@/lib/command-queue'

// Mock client data generators
function generateMockMetrics() {
  return {
    cpu_usage: Math.random() * 100,
    memory_usage: Math.random() * 100,
    memory_total: 16000, // MB
    disk_usage: Math.random() * 100,
    disk_total: 500000, // MB
    network_interfaces: {
      eth0: { rx: Math.random() * 1000000, tx: Math.random() * 1000000 },
      lo: { rx: Math.random() * 100000, tx: Math.random() * 100000 },
    },
    running_processes: Array.from({ length: Math.floor(Math.random() * 50) + 20 }, (_, i) => `process_${i}`),
    network_connections: {
      tcp: Math.floor(Math.random() * 100),
      udp: Math.floor(Math.random() * 50),
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, count = 1 } = body

    if (action === 'register') {
      // Register mock clients
      const clients = []
      for (let i = 0; i < count; i++) {
        const client = clientManager.registerClient({
          hostname: `MOCK-PC-${Math.random().toString(36).substring(7).toUpperCase()}`,
          username: `user${i}`,
          os: ['Windows 11', 'Windows 10', 'Linux', 'macOS'][Math.floor(Math.random() * 4)],
          ip_address: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
          architecture: 'x64',
          is_admin: Math.random() > 0.7,
        })
        clients.push(client)
      }

      return NextResponse.json({
        success: true,
        message: `Registered ${count} mock clients`,
        data: { clients },
      })
    } else if (action === 'metrics') {
      // Send mock metrics for all clients
      const clients = clientManager.getAllClients()
      const metricsRecords = []

      for (const client of clients) {
        const metrics = systemMonitor.recordMetrics({
          client_id: client.id,
          ...generateMockMetrics(),
        })
        metricsRecords.push(metrics)
      }

      return NextResponse.json({
        success: true,
        message: `Recorded metrics for ${metricsRecords.length} clients`,
        data: { metrics: metricsRecords },
      })
    } else if (action === 'commands') {
      // Queue mock commands
      const clients = clientManager.getOnlineClients()
      const commands = []

      const commandTypes = [
        { type: 'shell', name: 'whoami' },
        { type: 'shell', name: 'ipconfig' },
        { type: 'shell', name: 'tasklist' },
        { type: 'surveillance', name: 'screenshot' },
        { type: 'system', name: 'get_processes' },
      ]

      for (const client of clients.slice(0, Math.min(count, clients.length))) {
        const cmd = commandTypes[Math.floor(Math.random() * commandTypes.length)]
        const command = commandQueue.queueCommand({
          client_id: client.id,
          command_type: cmd.type,
          command_name: cmd.name,
          parameters: { delay: 1000 },
        })
        commands.push(command)
      }

      return NextResponse.json({
        success: true,
        message: `Queued ${commands.length} mock commands`,
        data: { commands },
      })
    } else if (action === 'cleanup') {
      // Clear all mock data
      const allClients = clientManager.getAllClients()

      for (const client of allClients) {
        clientManager.deleteClient(client.id)
      }

      return NextResponse.json({
        success: true,
        message: `Cleaned up ${allClients.length} clients`,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use: register, metrics, commands, or cleanup',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[API] Mock client error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Mock client operation failed',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Mock client simulator API',
    endpoints: {
      register: 'POST with {action: "register", count: 1}',
      metrics: 'POST with {action: "metrics"}',
      commands: 'POST with {action: "commands", count: 1}',
      cleanup: 'POST with {action: "cleanup"}',
    },
  })
}
