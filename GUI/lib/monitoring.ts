import { getDatabase } from './db'

export interface SystemMetrics {
  id: number
  client_id: string
  cpu_usage: number
  memory_usage: number
  memory_total: number
  disk_usage: number
  disk_total: number
  network_interfaces?: any
  running_processes?: any
  network_connections?: any
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
}

export function recordMetrics(input: CreateMetricsInput): SystemMetrics {
  const db = getDatabase()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO system_info 
    (client_id, cpu_usage, memory_usage, memory_total, disk_usage, disk_total, network_interfaces, running_processes, network_connections, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    input.client_id,
    input.cpu_usage,
    input.memory_usage,
    input.memory_total,
    input.disk_usage,
    input.disk_total,
    input.network_interfaces ? JSON.stringify(input.network_interfaces) : null,
    input.running_processes ? JSON.stringify(input.running_processes) : null,
    input.network_connections ? JSON.stringify(input.network_connections) : null,
    now
  )

  // Get the last inserted record
  const result = db.prepare('SELECT last_insert_rowid() as id').get() as any
  return getMetrics(result.id)!
}

export function getMetrics(id: number): SystemMetrics | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM system_info WHERE id = ?')
  const row = stmt.get(id) as any
  
  if (!row) return null
  
  return formatMetrics(row)
}

export function getClientLatestMetrics(clientId: string): SystemMetrics | null {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM system_info 
    WHERE client_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 1
  `)
  
  const row = stmt.get(clientId) as any
  if (!row) return null
  
  return formatMetrics(row)
}

export function getClientMetricsHistory(clientId: string, limit = 100): SystemMetrics[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM system_info 
    WHERE client_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `)
  
  const rows = stmt.all(clientId, limit) as any[]
  return rows.map(formatMetrics)
}

export function getClientMetricsSince(clientId: string, minutes = 60): SystemMetrics[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM system_info 
    WHERE client_id = ? 
      AND timestamp > datetime('now', '-' || ? || ' minutes')
    ORDER BY timestamp DESC
  `)
  
  const rows = stmt.all(clientId, minutes) as any[]
  return rows.map(formatMetrics)
}

export function getAverageMetrics(clientId: string, minutes = 60): {
  avg_cpu: number
  avg_memory: number
  avg_disk: number
} {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT 
      AVG(cpu_usage) as avg_cpu,
      AVG(memory_usage) as avg_memory,
      AVG(disk_usage) as avg_disk
    FROM system_info 
    WHERE client_id = ? 
      AND timestamp > datetime('now', '-' || ? || ' minutes')
  `)
  
  const result = stmt.get(clientId, minutes) as any
  return {
    avg_cpu: result.avg_cpu || 0,
    avg_memory: result.avg_memory || 0,
    avg_disk: result.avg_disk || 0,
  }
}

export function deleteOldMetrics(daysOld = 7): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    DELETE FROM system_info 
    WHERE timestamp < datetime('now', '-' || ? || ' days')
  `)
  
  const result = stmt.run(daysOld)
  return result.changes ?? 0
}

export function getNetworkStats(clientId: string): {
  connections: number
  interfaces: string[]
} {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT network_connections, network_interfaces 
    FROM system_info 
    WHERE client_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 1
  `)
  
  const row = stmt.get(clientId) as any
  
  if (!row) {
    return { connections: 0, interfaces: [] }
  }

  let connections = 0
  let interfaces: string[] = []

  try {
    if (row.network_connections) {
      const parsed = JSON.parse(row.network_connections)
      connections = Array.isArray(parsed) ? parsed.length : 0
    }
    if (row.network_interfaces) {
      const parsed = JSON.parse(row.network_interfaces)
      interfaces = Array.isArray(parsed) ? parsed.map((i: any) => i.name || i) : []
    }
  } catch (e) {
    console.error('[Monitoring] Error parsing network data:', e)
  }

  return { connections, interfaces }
}

export function getRunningProcesses(clientId: string): any[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT running_processes 
    FROM system_info 
    WHERE client_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 1
  `)
  
  const row = stmt.get(clientId) as any
  
  if (!row || !row.running_processes) {
    return []
  }

  try {
    return JSON.parse(row.running_processes)
  } catch (e) {
    console.error('[Monitoring] Error parsing processes data:', e)
    return []
  }
}

function formatMetrics(row: any): SystemMetrics {
  return {
    id: row.id,
    client_id: row.client_id,
    cpu_usage: row.cpu_usage,
    memory_usage: row.memory_usage,
    memory_total: row.memory_total,
    disk_usage: row.disk_usage,
    disk_total: row.disk_total,
    network_interfaces: row.network_interfaces ? JSON.parse(row.network_interfaces) : undefined,
    running_processes: row.running_processes ? JSON.parse(row.running_processes) : undefined,
    network_connections: row.network_connections ? JSON.parse(row.network_connections) : undefined,
    timestamp: row.timestamp,
  }
}
