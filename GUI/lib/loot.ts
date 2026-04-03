import { getDatabase } from './db'

export interface LootFile {
  id: string
  name: string
  path: string
  size: number
  type: string
  mtime: string
  client_id: string
}

export async function listLoot(client_id?: string, type?: string): Promise<LootFile[]> {
  const db = await getDatabase()
  
  let sql = `SELECT * FROM loot WHERE 1=1`
  const args: any[] = []
  
  if (client_id) {
    sql += ` AND client_id = ?`
    args.push(client_id)
  }
  
  if (type) {
    sql += ` AND type = ?`
    args.push(type)
  }
  
  sql += ` ORDER BY timestamp DESC`

  const rows = await db.prepare(sql).all(args)
  
  return (rows || []).map((row: any) => ({
    id: String(row.id || row.rowid || ''),
    name: row.filename || 'Unknown',
    path: row.path || row.filename || '',
    size: Number(row.size || 0),
    type: row.type || 'misc',
    mtime: row.timestamp || new Date().toISOString(),
    client_id: row.client_id || ''
  }))
}

export async function getLootContent(id: string): Promise<Buffer | null> {
  const db = await getDatabase()
  
  try {
    // Standard ID lookup (Numeric in SQLite auto-inc, or String if UUID)
    const row = await db.prepare(`SELECT data FROM loot WHERE id = ?`).get([id])
    if (!row || !row.data) return null
    
    return Buffer.from(row.data)
  } catch (e) {
    console.error('[Loot Lib] Error fetching data:', e)
    return null
  }
}

export async function getLootStats() {
  const db = await getDatabase()
  
  try {
    const rows = await db.prepare(`
        SELECT type, COUNT(*) as count, SUM(CAST(size AS INTEGER)) as total_size
        FROM loot
        GROUP BY type
    `).all()

    const stats: Record<string, { count: number, size: number }> = {
      command_result: { count: 0, size: 0 },
      keylog: { count: 0, size: 0 },
      screenshot: { count: 0, size: 0 },
      system_info: { count: 0, size: 0 },
      recordings: { count: 0, size: 0 }
    };

    (rows || []).forEach((row: any) => {
      if (row.type && stats[row.type] !== undefined) {
        stats[row.type] = {
          count: Number(row.count),
          size: Number(row.total_size || 0)
        }
      } else if (row.type) {
        stats[row.type] = {
          count: Number(row.count),
          size: Number(row.total_size || 0)
        }
      }
    })

    return stats
  } catch (e) {
    console.error('[Loot Lib] Stats Error:', e)
    return {}
  }
}
