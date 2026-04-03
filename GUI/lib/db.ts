import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

let clientInstance: any = null;

// MongoDB Cursor Simulation for Libsql
class LibsqlCursor {
  private client: any;
  private table: string;
  private query: any;
  private sortOptions: any = null;
  private limitCount: number | null = null;

  constructor(client: any, table: string, query: any) {
    this.client = client;
    this.table = table;
    this.query = query;
  }

  sort(options: any) {
    this.sortOptions = options;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async toArray() {
    let sql = `SELECT * FROM ${this.table}`;
    const args: any[] = [];
    
    // Build WHERE
    if (this.query && Object.keys(this.query).length > 0) {
      const parts: string[] = [];
      
      const processQuery = (q: any, isOr = false) => {
        const localParts: string[] = [];
        for (const [key, val] of Object.entries(q)) {
            if (key === '$or' && Array.isArray(val)) {
                const orParts: string[] = [];
                for (const orQuery of val) {
                    const innerParts = processQuery(orQuery, true);
                    if (innerParts) orParts.push(`(${innerParts})`);
                }
                if (orParts.length) localParts.push(`(${orParts.join(' OR ')})`);
            } else if (val instanceof RegExp) {
                localParts.push(`${key} LIKE ?`);
                args.push(`%${val.source}%`);
            } else if (typeof val === 'object' && val !== null) {
                // Ignore complex operators for now, just stringify
                localParts.push(`${key} = ?`);
                args.push(JSON.stringify(val));
            } else {
                localParts.push(`${key} = ?`);
                args.push(val);
            }
        }
        return localParts.join(isOr ? ' OR ' : ' AND ');
      };

      const whereClause = processQuery(this.query);
      if (whereClause) sql += ` WHERE ${whereClause}`;
    }

    // Build ORDER BY
    if (this.sortOptions) {
      const fields = Object.entries(this.sortOptions).map(([k, v]) => `${k} ${v === -1 ? 'DESC' : 'ASC'}`).join(', ');
      sql += ` ORDER BY ${fields}`;
    }

    // Build LIMIT
    if (this.limitCount !== null) {
      sql += ` LIMIT ${this.limitCount}`;
    }

    try {
      const rs = await this.client.execute({ sql, args });
      // Map rows and parse JSON strings back to objects
      return rs.rows.map((row: any) => {
        const processed: any = { ...row };
        // Attempt to parse JSON for text columns that look like objects/arrays
        for (const [key, val] of Object.entries(processed)) {
          if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
            try { processed[key] = JSON.parse(val); } catch {}
          }
        }
        return {
          ...processed,
          _id: { toString: () => processed.id || processed.rowid || '' }
        };
      });
    } catch (e) {
      console.error(`Libsql Cursor Error in ${this.table}:`, e);
      return [];
    }
  }

  async next() {
    const rows = await this.limit(1).toArray();
    return rows[0] || null;
  }
}

class LibsqlCollection {
  name: string;
  client: any;

  constructor(name: string, client: any) {
    this.name = name;
    this.client = client;
  }

  find(query: any = {}) {
    return new LibsqlCursor(this.client, this.name, query);
  }

  async findOne(query: any) {
    const cursor = new LibsqlCursor(this.client, this.name, query);
    return await cursor.next();
  }

  async insertOne(doc: any) {
    const data = { ...doc };
    delete data._id; // Remove _id if it's there
    
    // Sanitize values
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'object' && val !== null) {
        data[key] = JSON.stringify(val);
      }
    }

    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const args = Object.values(data);
    return await this.client.execute({ sql: `INSERT INTO ${this.name} (${columns}) VALUES (${placeholders})`, args });
  }

  async updateOne(query: any, update: any) {
    const setObj = update.$set || {};
    const setKeys = Object.keys(setObj).map(k => `${k} = ?`).join(', ');
    const setArgs = Object.values(setObj).map(v => 
      (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v
    );

    const whereKeys = Object.keys(query).map(k => `${k} = ?`).join(' AND ');
    const whereArgs = Object.values(query).map(v => 
      (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v
    );

    return await this.client.execute({ sql: `UPDATE ${this.name} SET ${setKeys} WHERE ${whereKeys}`, args: [...setArgs, ...whereArgs] });
  }

  async updateMany(query: any, update: any) {
    return await this.updateOne(query, update);
  }

  async deleteMany(query: any) {
    const keys = Object.keys(query).map(k => `${k} = ?`).join(' AND ');
    const args = Object.values(query).map(v => 
      (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v
    );
    return await this.client.execute({ sql: `DELETE FROM ${this.name} WHERE ${keys}`, args });
  }

  async deleteOne(query: any) {
    return await this.deleteMany(query);
  }

  async countDocuments(query: any = {}) {
    const keys = Object.keys(query).map(k => `${k} = ?`).join(' AND ');
    const args = Object.values(query).map(v => 
      (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v
    );
    let sql = `SELECT COUNT(*) as count FROM ${this.name}`;
    if (keys) sql += ` WHERE ${keys}`;
    const rs = await this.client.execute({ sql, args });
    return rs.rows[0] ? Number(rs.rows[0].count) : 0;
  }

  // Basic aggregate translation for simple group by cases used in Loot/Analytics
  aggregate(pipeline: any[]) {
    return {
      toArray: async () => {
        // For Loot stats specifically:
        if (this.name === 'loot' && pipeline.some(p => p.$group)) {
            const rs = await this.client.execute(`SELECT type, COUNT(*) as count, SUM(size) as size FROM loot GROUP BY type`);
            return rs.rows.map((r: any) => ({ _id: r.type, count: r.count, size: r.size }));
        }
        return [];
      },
      next: async () => {
        const results = await (this.aggregate(pipeline) as any).toArray();
        return results[0] || null;
      }
    };
  }

  async createIndex() { return true; }
}

export async function getDatabase() {
  if (!clientInstance) {
    const dbPath = path.resolve(process.cwd(), '../data/c2.db');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    clientInstance = createClient({
      url: `file:${dbPath}`,
    });
    
    await clientInstance.executeMultiple(`
      CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, ip_address TEXT, hostname TEXT, os TEXT, username TEXT, status TEXT DEFAULT 'offline', last_seen TEXT, is_admin BOOLEAN DEFAULT 0, gpu TEXT, motherboard TEXT);
      CREATE TABLE IF NOT EXISTS commands (id TEXT PRIMARY KEY, client_id TEXT NOT NULL, command_type TEXT NOT NULL, command_name TEXT NOT NULL, parameters TEXT, status TEXT DEFAULT 'pending', result TEXT, error_message TEXT, execution_time DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_active BOOLEAN DEFAULT 0);
      CREATE TABLE IF NOT EXISTS loot (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id TEXT, type TEXT, filename TEXT, path TEXT, size INTEGER DEFAULT 0, timestamp TEXT);
      CREATE TABLE IF NOT EXISTS system_info (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id TEXT, cpu_usage FLOAT, memory_usage FLOAT, memory_total FLOAT, disk_usage FLOAT, disk_total FLOAT, network_in FLOAT DEFAULT 0, network_out FLOAT DEFAULT 0, network_interfaces TEXT, running_processes TEXT, network_connections TEXT, uptime FLOAT, timestamp TEXT);
      
      CREATE INDEX IF NOT EXISTS idx_commands_client_id ON commands(client_id);
      CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
      CREATE INDEX IF NOT EXISTS idx_loot_client_id ON loot(client_id);
      CREATE INDEX IF NOT EXISTS idx_loot_type ON loot(type);
      CREATE INDEX IF NOT EXISTS idx_system_info_client_id ON system_info(client_id);
      CREATE INDEX IF NOT EXISTS idx_system_info_timestamp ON system_info(timestamp);
    `);

    // Migration for existing tables
    try { await clientInstance.execute("ALTER TABLE loot ADD COLUMN size INTEGER DEFAULT 0"); } catch (e) {}
    try { await clientInstance.execute("ALTER TABLE system_info ADD COLUMN network_in FLOAT DEFAULT 0"); } catch (e) {}
    try { await clientInstance.execute("ALTER TABLE system_info ADD COLUMN network_out FLOAT DEFAULT 0"); } catch (e) {}
  }

  return {
    collection: (name: string) => new LibsqlCollection(name, clientInstance),
    // Compatibility for db.prepare(...)
    prepare: (sql: string) => ({
      all: async (params: any[] = []) => {
        const rs = await clientInstance.execute({ sql, args: params });
        return rs.rows;
      },
      get: async (params: any[] = []) => {
        const rs = await clientInstance.execute({ sql, args: params });
        return rs.rows[0];
      }
    }),
    execute: async (sql: string, args: any[] = []) => {
        return await clientInstance.execute({ sql, args });
    }
  };
}

export async function closeDatabase() {
  if (clientInstance) {
    clientInstance.close();
    clientInstance = null;
  }
}
