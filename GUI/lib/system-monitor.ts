import { getDatabase } from './db'

export interface SystemMetrics {
  id?: number
  client_id: string
  cpu_usage: number
  memory_usage: number
  memory_total: number
  disk_usage: number
  disk_total: number
  network_in: number
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
    network_in?: number
    network_interfaces?: any
    running_processes?: any
    network_connections?: any
    uptime?: number
  }): Promise<SystemMetrics> {
    const db = await getDatabase()
    const now = new Date().toISOString()

    const metrics: any = {
      client_id: data.client_id,
      cpu_usage: Number(data.cpu_usage || 0),
      memory_usage: Number(data.memory_usage || 0),
      memory_total: Number(data.memory_total || 0),
      disk_usage: Number(data.disk_usage || 0),
      disk_total: Number(data.disk_total || 0),
      network_in: Number(data.network_in || 0),
      network_interfaces: JSON.stringify(data.network_interfaces || {}),
      running_processes: JSON.stringify(data.running_processes || []),
      network_connections: JSON.stringify(data.network_connections || {}),
      uptime: Number(data.uptime || 0),
      timestamp: now
    }

    try {
        const columns = Object.keys(metrics).join(', ');
        const placeholders = Object.keys(metrics).map(() => '?').join(', ');
        await db.prepare(`INSERT INTO system_info (${columns}) VALUES (${placeholders})`).all(Object.values(metrics));
    } catch (e) {
        console.error('[SystemMonitor] Record Error:', e);
    }
    
    return metrics
  }

  async getClientMetrics(client_id: string, limit = 100): Promise<SystemMetrics[]> {
    const db = await getDatabase()
    try {
        const rows = await db.prepare(`
            SELECT * FROM system_info 
            WHERE client_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `).all([client_id, limit]);
        return rows as SystemMetrics[];
    } catch (e) {
        return [];
    }
  }

  async getLatestMetrics(client_id: string): Promise<SystemMetrics | null> {
    const db = await getDatabase()
    try {
        const row = await db.prepare(`
            SELECT * FROM system_info 
            WHERE client_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        `).get([client_id]);
        return row as SystemMetrics || null;
    } catch (e) {
        return null;
    }
  }

  async getMetricsTimeseries(client_id: string, hours = 24, limit = 0): Promise<SystemMetrics[]> {
    const db = await getDatabase()
    try {
        let sql = `SELECT * FROM system_info WHERE client_id = ?`;
        const args: any[] = [client_id];

        if (limit > 0) {
            sql += ` ORDER BY timestamp DESC LIMIT ?`;
            args.push(limit);
            const rows = await db.prepare(sql).all(args);
            return rows.reverse() as SystemMetrics[];
        } else {
            const date = new Date();
            date.setHours(date.getHours() - hours);
            sql += ` AND timestamp > ? ORDER BY timestamp ASC`;
            args.push(date.toISOString());
            const rows = await db.prepare(sql).all(args);
            return rows as SystemMetrics[];
        }
    } catch (e) {
        return [];
    }
  }

  async getAggregateMetrics(client_id: string, hours = 24) {
    const db = await getDatabase()
    const date = new Date()
    date.setHours(date.getHours() - hours)
    
    try {
        const stats = await db.prepare(`
            SELECT 
                AVG(cpu_usage) as avg_cpu,
                MAX(cpu_usage) as max_cpu,
                AVG(memory_usage) as avg_memory,
                MAX(memory_usage) as max_memory,
                AVG(disk_usage) as avg_disk,
                MAX(disk_usage) as max_disk
            FROM system_info
            WHERE client_id = ? AND timestamp > ?
        `).get([client_id, date.toISOString()]);

        if (!stats || stats.avg_cpu === null) return null;

        return {
            avg_cpu: Number(stats.avg_cpu),
            max_cpu: Number(stats.max_cpu),
            avg_memory: Number(stats.avg_memory),
            max_memory: Number(stats.max_memory),
            avg_disk: Number(stats.avg_disk),
            max_disk: Number(stats.max_disk),
        }
    } catch (e) {
        return null;
    }
  }

  async getAllLatestMetrics(): Promise<any[]> {
    const db = await getDatabase()
    try {
        const rows = await db.prepare(`
            SELECT * FROM system_info 
            WHERE id IN (SELECT MAX(id) FROM system_info GROUP BY client_id)
            ORDER BY timestamp DESC
        `).all([]);
        return rows as any[];
    } catch (e) {
        return [];
    }
  }

  async clearOldMetrics(days = 30): Promise<void> {
    const db = await getDatabase()
    const date = new Date()
    date.setDate(date.getDate() - days)
    await db.prepare(`DELETE FROM system_info WHERE timestamp < ?`).all([date.toISOString()]);
  }
}

export const systemMonitor = new SystemMonitor()
