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
  network_interfaces: string
  running_processes: string
  network_connections: string
  timestamp: string
}

export class SystemMonitor {
  private db = getDatabase()

  recordMetrics(data: {
    client_id: string
    cpu_usage: number
    memory_usage: number
    memory_total: number
    disk_usage: number
    disk_total: number
    network_interfaces?: Record<string, any>
    running_processes?: string[]
    network_connections?: Record<string, any>
  }): SystemMetrics {
    const now = new Date().toISOString()

    const stmt = this.db.prepare(`
      INSERT INTO system_info (
        client_id, cpu_usage, memory_usage, memory_total, disk_usage, disk_total,
        network_interfaces, running_processes, network_connections, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      data.client_id,
      data.cpu_usage,
      data.memory_usage,
      data.memory_total,
      data.disk_usage,
      data.disk_total,
      JSON.stringify(data.network_interfaces || {}),
      JSON.stringify(data.running_processes || []),
      JSON.stringify(data.network_connections || {}),
      now
    )

    return {
      client_id: data.client_id,
      cpu_usage: data.cpu_usage,
      memory_usage: data.memory_usage,
      memory_total: data.memory_total,
      disk_usage: data.disk_usage,
      disk_total: data.disk_total,
      network_interfaces: JSON.stringify(data.network_interfaces || {}),
      running_processes: JSON.stringify(data.running_processes || []),
      network_connections: JSON.stringify(data.network_connections || {}),
      timestamp: now,
    }
  }

  getClientMetrics(client_id: string, limit = 100): SystemMetrics[] {
    const stmt = this.db.prepare(`
      SELECT * FROM system_info WHERE client_id = ? ORDER BY timestamp DESC LIMIT ?
    `)
    const rows = stmt.all(client_id, limit) as any[]
    return rows.map(row => ({
      ...row,
      network_interfaces: typeof row.network_interfaces === 'string' ? JSON.parse(row.network_interfaces) : row.network_interfaces,
      running_processes: typeof row.running_processes === 'string' ? JSON.parse(row.running_processes) : row.running_processes,
      network_connections: typeof row.network_connections === 'string' ? JSON.parse(row.network_connections) : row.network_connections,
    }))
  }

  getLatestMetrics(client_id: string): SystemMetrics | null {
    const stmt = this.db.prepare(`
      SELECT * FROM system_info WHERE client_id = ? ORDER BY timestamp DESC LIMIT 1
    `)
    const row = stmt.get(client_id) as any
    if (!row) return null

    return {
      ...row,
      network_interfaces: typeof row.network_interfaces === 'string' ? JSON.parse(row.network_interfaces) : row.network_interfaces,
      running_processes: typeof row.running_processes === 'string' ? JSON.parse(row.running_processes) : row.running_processes,
      network_connections: typeof row.network_connections === 'string' ? JSON.parse(row.network_connections) : row.network_connections,
    }
  }

  getAllLatestMetrics(): Map<string, SystemMetrics> {
    const stmt = this.db.prepare(`
      SELECT DISTINCT ON (client_id) * FROM system_info ORDER BY client_id, timestamp DESC
    `)

    try {
      const rows = stmt.all() as any[]
      const metricsMap = new Map<string, SystemMetrics>()

      for (const row of rows) {
        metricsMap.set(row.client_id, {
          ...row,
          network_interfaces: typeof row.network_interfaces === 'string' ? JSON.parse(row.network_interfaces) : row.network_interfaces,
          running_processes: typeof row.running_processes === 'string' ? JSON.parse(row.running_processes) : row.running_processes,
          network_connections: typeof row.network_connections === 'string' ? JSON.parse(row.network_connections) : row.network_connections,
        })
      }
      return metricsMap
    } catch (e) {
      // SQLite doesn't support DISTINCT ON, use alternative approach
      const allRows = this.db.prepare('SELECT * FROM system_info ORDER BY timestamp DESC').all() as any[]
      const metricsMap = new Map<string, SystemMetrics>()

      for (const row of allRows) {
        if (!metricsMap.has(row.client_id)) {
          metricsMap.set(row.client_id, {
            ...row,
            network_interfaces: typeof row.network_interfaces === 'string' ? JSON.parse(row.network_interfaces) : row.network_interfaces,
            running_processes: typeof row.running_processes === 'string' ? JSON.parse(row.running_processes) : row.running_processes,
            network_connections: typeof row.network_connections === 'string' ? JSON.parse(row.network_connections) : row.network_connections,
          })
        }
      }
      return metricsMap
    }
  }

  getMetricsTimeseries(client_id: string, hours = 24, limit = 0): SystemMetrics[] {
    let rows: any[] = []
    
    if (limit > 0) {
      // If limit is specified, ignore hours and just get the last N records
      const stmt = this.db.prepare(`
        SELECT * FROM system_info 
        WHERE client_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `)
      rows = stmt.all(client_id, limit) as any[]
      // Reverse to get chronological order for charts
      rows.reverse()
    } else {
      const date = new Date()
      date.setHours(date.getHours() - hours)
      const timestamp = date.toISOString()

      const stmt = this.db.prepare(`
        SELECT * FROM system_info 
        WHERE client_id = ? AND timestamp > ? 
        ORDER BY timestamp ASC
      `)
      rows = stmt.all(client_id, timestamp) as any[]
    }

    return rows.map(row => ({
      ...row,
      network_interfaces: typeof row.network_interfaces === 'string' ? JSON.parse(row.network_interfaces) : row.network_interfaces,
      running_processes: typeof row.running_processes === 'string' ? JSON.parse(row.running_processes) : row.running_processes,
      network_connections: typeof row.network_connections === 'string' ? JSON.parse(row.network_connections) : row.network_connections,
    }))
  }

  getAggregateMetrics(client_id: string, hours = 24) {
    const date = new Date()
    date.setHours(date.getHours() - hours)
    const timestamp = date.toISOString()

    const stmt = this.db.prepare(`
      SELECT
        AVG(cpu_usage) as avg_cpu,
        MAX(cpu_usage) as max_cpu,
        AVG(memory_usage) as avg_memory,
        MAX(memory_usage) as max_memory,
        AVG(disk_usage) as avg_disk,
        MAX(disk_usage) as max_disk
      FROM system_info
      WHERE client_id = ? AND timestamp > ?
    `)

    return stmt.get(client_id, timestamp) as {
      avg_cpu: number
      max_cpu: number
      avg_memory: number
      max_memory: number
      avg_disk: number
      max_disk: number
    } | null
  }

  clearOldMetrics(days = 30): void {
    const date = new Date()
    date.setDate(date.getDate() - days)
    const timestamp = date.toISOString()

    const stmt = this.db.prepare('DELETE FROM system_info WHERE timestamp < ?')
    stmt.run(timestamp)
  }
}

export const systemMonitor = new SystemMonitor()
