import { getDatabase } from './db'
import { v4 as uuidv4 } from 'uuid'

export interface Client {
  id: string
  hostname: string
  username: string
  os: string
  ip_address: string
  architecture: string
  is_admin: boolean
  status: 'online' | 'offline'
  last_seen: string
  first_seen: string
  created_at: string
}

export class ClientManager {
  private db = getDatabase()

  registerClient(data: {
    hostname: string
    username: string
    os: string
    ip_address: string
    architecture?: string
    is_admin?: boolean
  }): Client {
    const id = uuidv4()
    const now = new Date().toISOString()

    const stmt = this.db.prepare(`
      INSERT INTO clients (
        id, hostname, username, os, ip_address, architecture, is_admin, status, last_seen, first_seen, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      data.hostname,
      data.username,
      data.os,
      data.ip_address,
      data.architecture || 'x64',
      data.is_admin ? 1 : 0,
      'online',
      now,
      now,
      now
    )

    return {
      id,
      hostname: data.hostname,
      username: data.username,
      os: data.os,
      ip_address: data.ip_address,
      architecture: data.architecture || 'x64',
      is_admin: data.is_admin || false,
      status: 'online',
      last_seen: now,
      first_seen: now,
      created_at: now,
    }
  }

  getClient(id: string): Client | null {
    const stmt = this.db.prepare('SELECT * FROM clients WHERE id = ?')
    return stmt.get(id) as Client | null
  }

  getAllClients(): Client[] {
    const stmt = this.db.prepare('SELECT * FROM clients ORDER BY last_seen DESC')
    return stmt.all() as Client[]
  }

  getOnlineClients(): Client[] {
    const stmt = this.db.prepare("SELECT * FROM clients WHERE status = 'online' ORDER BY last_seen DESC")
    return stmt.all() as Client[]
  }

  updateClientStatus(id: string, status: 'online' | 'offline'): void {
    const now = new Date().toISOString()
    const stmt = this.db.prepare('UPDATE clients SET status = ?, last_seen = ? WHERE id = ?')
    stmt.run(status, now, id)
  }

  updateClientLastSeen(id: string): void {
    const now = new Date().toISOString()
    const stmt = this.db.prepare('UPDATE clients SET last_seen = ? WHERE id = ?')
    stmt.run(now, id)
  }

  deleteClient(id: string): void {
    const stmt = this.db.prepare('DELETE FROM clients WHERE id = ?')
    stmt.run(id)
  }

  getClientStats() {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number }
    const online = this.db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'online'").get() as { count: number }
    const admins = this.db.prepare('SELECT COUNT(*) as count FROM clients WHERE is_admin = 1').get() as { count: number }

    return {
      totalClients: total.count,
      onlineClients: online.count,
      adminClients: admins.count,
      offlineClients: total.count - online.count,
    }
  }

  getClientsSummary() {
    const clients = this.getAllClients()
    return clients.map(client => ({
      ...client,
      is_admin: Boolean(client.is_admin),
    }))
  }
}

export const clientManager = new ClientManager()
