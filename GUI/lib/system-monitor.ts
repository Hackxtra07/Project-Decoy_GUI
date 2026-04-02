import { getDatabase } from './db'
import { v4 as uuidv4 } from 'uuid'

export interface SystemMetrics {
  id?: number
  client_id: string
  cpu_usage: number
  memory_usage: number
  memory_total: number
  disk_usage: number
  disk_total: number
  uptime?: number
  network_interfaces: string
  running_processes: string
  network_connections: string
  timestamp: string
}

export class SystemMonitor {
  async recordMetrics(data: {
    client_id: string
    cpu_usage: number
    memory_usage: number
    memory_total: number
    disk_usage: number
    disk_total: number
    network_interfaces?: Record<string, any>
    running_processes?: string[]
    network_connections?: Record<string, any>
    uptime?: number
  }): Promise<SystemMetrics> {
    const db = await getDatabase()
    const now = new Date().toISOString()

    const metrics: any = {
      client_id: data.client_id,
      cpu_usage: data.cpu_usage,
      memory_usage: data.memory_usage,
      memory_total: data.memory_total,
      disk_usage: data.disk_usage,
      disk_total: data.disk_total,
      network_interfaces: data.network_interfaces || {},
      running_processes: data.running_processes || [],
      network_connections: data.network_connections || {},
      uptime: data.uptime || 0,
      timestamp: now
    }

    await db.collection('system_info').insertOne(metrics)
    return metrics
  }

  async getClientMetrics(client_id: string, limit = 100): Promise<SystemMetrics[]> {
    const db = await getDatabase()
    const rows = await db.collection('system_info')
      .find({ client_id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray() as any[]
    return rows as SystemMetrics[]
  }

  async getLatestMetrics(client_id: string): Promise<SystemMetrics | null> {
    const db = await getDatabase()
    const row = await db.collection('system_info')
      .find({ client_id })
      .sort({ timestamp: -1 })
      .limit(1)
      .next() as any
    return row as SystemMetrics | null
  }

  async getAllLatestMetrics(): Promise<Map<string, SystemMetrics>> {
    const db = await getDatabase()
    const metricsMap = new Map<string, SystemMetrics>()
    
    const rows = await db.collection('system_info').aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$client_id", latest: { $first: "$$ROOT" } } }
    ]).toArray()

    for (const row of rows) {
      metricsMap.set(row._id, row.latest)
    }
    return metricsMap
  }

  async getMetricsTimeseries(client_id: string, hours = 24, limit = 0): Promise<SystemMetrics[]> {
    const db = await getDatabase()
    let rows: any[] = []
    
    if (limit > 0) {
      rows = await db.collection('system_info')
        .find({ client_id })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray() as any[]
      rows.reverse()
    } else {
      const date = new Date()
      date.setHours(date.getHours() - hours)
      const timestamp = date.toISOString()

      rows = await db.collection('system_info')
        .find({ client_id, timestamp: { $gt: timestamp } })
        .sort({ timestamp: 1 })
        .toArray() as any[]
    }

    return rows as SystemMetrics[]
  }

  async getAggregateMetrics(client_id: string, hours = 24) {
    const db = await getDatabase()
    const date = new Date()
    date.setHours(date.getHours() - hours)
    const timestamp = date.toISOString()

    const stats = await db.collection('system_info').aggregate([
      { $match: { client_id, timestamp: { $gt: timestamp } } },
      {
        $group: {
          _id: null,
          avg_cpu: { $avg: "$cpu_usage" },
          max_cpu: { $max: "$cpu_usage" },
          avg_memory: { $avg: "$memory_usage" },
          max_memory: { $max: "$memory_usage" },
          avg_disk: { $avg: "$disk_usage" },
          max_disk: { $max: "$disk_usage" }
        }
      }
    ]).next() as any

    if (!stats) return null

    return {
      avg_cpu: stats.avg_cpu,
      max_cpu: stats.max_cpu,
      avg_memory: stats.avg_memory,
      max_memory: stats.max_memory,
      avg_disk: stats.avg_disk,
      max_disk: stats.max_disk,
    }
  }

  async clearOldMetrics(days = 30): Promise<void> {
    const db = await getDatabase()
    const date = new Date()
    date.setDate(date.getDate() - days)
    const timestamp = date.toISOString()

    await db.collection('system_info').deleteMany({ timestamp: { $lt: timestamp } })
  }
}

export const systemMonitor = new SystemMonitor()
