import { getDatabase } from './db'

export interface SystemMetrics {
  id?: any // MongoDB using _id usually
  client_id: string
  cpu_usage: number
  memory_usage: number
  memory_total: number
  disk_usage: number
  disk_total: number
  network_interfaces?: any
  running_processes?: any
  network_connections?: any
  network_in?: number
  network_out?: number
  timestamp: string
}

export interface CreateMetricsInput {
  client_id: string
  cpu_usage: number
  memory_usage: number
  memory_total: number
  disk_usage: number
  disk_total: number
  network_interfaces?: any
  running_processes?: any
  network_connections?: any
  network_in?: number
  network_out?: number
}

export async function recordMetrics(input: CreateMetricsInput): Promise<SystemMetrics> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const metrics: SystemMetrics = {
    client_id: input.client_id,
    cpu_usage: input.cpu_usage,
    memory_usage: input.memory_usage,
    memory_total: input.memory_total,
    disk_usage: input.disk_usage,
    disk_total: input.disk_total,
    network_interfaces: input.network_interfaces || [],
    running_processes: input.running_processes || [],
    network_connections: input.network_connections || [],
    network_in: input.network_in || 0,
    network_out: input.network_out || 0,
    timestamp: now
  }

  const result = await db.collection('system_info').insertOne(metrics)
  return { ...metrics, id: result.insertedId }
}

export async function getClientLatestMetrics(clientId: string): Promise<SystemMetrics | null> {
  const db = await getDatabase()
  const row = await db.collection('system_info')
    .find({ client_id: clientId })
    .sort({ timestamp: -1 })
    .limit(1)
    .next() as any
  
  if (!row) return null
  return formatMetrics(row)
}

export async function getClientMetricsHistory(clientId: string, limit = 100): Promise<SystemMetrics[]> {
  const db = await getDatabase()
  const rows = await db.collection('system_info')
    .find({ client_id: clientId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray() as any[]
  
  return rows.map(formatMetrics)
}

export async function getClientMetricsSince(clientId: string, minutes = 60): Promise<SystemMetrics[]> {
  const db = await getDatabase()
  const dateLimit = new Date();
  dateLimit.setMinutes(dateLimit.getMinutes() - minutes);

  const rows = await db.collection('system_info')
    .find({ 
      client_id: clientId, 
      timestamp: { $gt: dateLimit.toISOString() } 
    })
    .sort({ timestamp: -1 })
    .toArray() as any[]
  
  return rows.map(formatMetrics)
}

export async function getAverageMetrics(clientId: string, minutes = 60): Promise<{
  avg_cpu: number
  avg_memory: number
  avg_disk: number
}> {
  const db = await getDatabase()
  const dateLimit = new Date();
  dateLimit.setMinutes(dateLimit.getMinutes() - minutes);

  const stats = await db.collection('system_info').aggregate([
    {
      $match: {
        client_id: clientId,
        timestamp: { $gt: dateLimit.toISOString() }
      }
    },
    {
      $group: {
        _id: null,
        avg_cpu: { $avg: "$cpu_usage" },
        avg_memory: { $avg: "$memory_usage" },
        avg_disk: { $avg: "$disk_usage" }
      }
    }
  ]).next() as any

  return {
    avg_cpu: stats?.avg_cpu || 0,
    avg_memory: stats?.avg_memory || 0,
    avg_disk: stats?.avg_disk || 0,
  }
}

export async function deleteOldMetrics(daysOld = 7): Promise<number> {
  const db = await getDatabase()
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - daysOld);

  const result = await db.collection('system_info').deleteMany({
    timestamp: { $lt: dateLimit.toISOString() }
  })
  return result.deletedCount ?? 0
}

export async function getNetworkStats(clientId: string): Promise<{
  connections: number
  interfaces: string[]
}> {
  const latest = await getClientLatestMetrics(clientId)
  
  if (!latest) {
    return { connections: 0, interfaces: [] }
  }

  const connections = Array.isArray(latest.network_connections) ? latest.network_connections.length : 0
  const interfaces = Array.isArray(latest.network_interfaces) ? latest.network_interfaces.map((i: any) => i.name || i) : []

  return { connections, interfaces }
}

export async function getRunningProcesses(clientId: string): Promise<any[]> {
  const latest = await getClientLatestMetrics(clientId)
  return latest?.running_processes || []
}

function formatMetrics(row: any): SystemMetrics {
  return {
    id: row._id || row.id,
    client_id: row.client_id,
    cpu_usage: row.cpu_usage,
    memory_usage: row.memory_usage,
    memory_total: row.memory_total,
    disk_usage: row.disk_usage,
    disk_total: row.disk_total,
    network_interfaces: row.network_interfaces,
    running_processes: row.running_processes,
    network_connections: row.network_connections,
    network_in: row.network_in,
    network_out: row.network_out,
    timestamp: row.timestamp,
  }
}
