import { getDatabase } from './db'
import { v4 as uuidv4 } from 'uuid'

export interface Client {
  id: string
  hostname: string
  username: string
  os: string
  ip_address: string
  architecture?: string
  is_admin: boolean
  status: 'online' | 'offline' | 'idle'
  last_seen: string
  first_seen: string
  created_at: string
}

export interface CreateClientInput {
  hostname: string
  username: string
  os: string
  ip_address: string
  architecture?: string
  is_admin?: boolean
}

export function registerClient(input: CreateClientInput): Client {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO clients (id, hostname, username, os, ip_address, architecture, is_admin, status, last_seen, first_seen, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'online', ?, ?, ?)
  `)

  stmt.run(
    id,
    input.hostname,
    input.username,
    input.os,
    input.ip_address,
    input.architecture || 'unknown',
    input.is_admin ? 1 : 0,
    now,
    now,
    now
  )

  return getClient(id)!
}

export function getClient(id: string): Client | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM clients WHERE id = ?')
  const row = stmt.get(id) as any
  
  if (!row) return null
  
  return formatClient(row)
}

export function getAllClients(): Client[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM clients ORDER BY last_seen DESC')
  const rows = stmt.all() as any[]
  
  return rows.map(formatClient)
}

export function getOnlineClients(): Client[] {
  const db = getDatabase()
  const stmt = db.prepare("SELECT * FROM clients WHERE status = 'online' ORDER BY last_seen DESC")
  const rows = stmt.all() as any[]
  
  return rows.map(formatClient)
}

export function updateClientStatus(id: string, status: 'online' | 'offline' | 'idle'): Client | null {
  const db = getDatabase()
  const now = new Date().toISOString()
  
  const stmt = db.prepare('UPDATE clients SET status = ?, last_seen = ? WHERE id = ?')
  stmt.run(status, now, id)
  
  return getClient(id)
}

export function updateClientLastSeen(id: string): void {
  const db = getDatabase()
  const now = new Date().toISOString()
  
  const stmt = db.prepare('UPDATE clients SET last_seen = ? WHERE id = ?')
  stmt.run(now, id)
}

export function deleteClient(id: string): boolean {
  const db = getDatabase()
  
  // Delete related records first
  db.prepare('DELETE FROM commands WHERE client_id = ?').run(id)
  db.prepare('DELETE FROM system_info WHERE client_id = ?').run(id)
  db.prepare('DELETE FROM files WHERE client_id = ?').run(id)
  db.prepare('DELETE FROM command_history WHERE client_id = ?').run(id)
  db.prepare('DELETE FROM credentials WHERE client_id = ?').run(id)
  
  // Delete the client
  const stmt = db.prepare('DELETE FROM clients WHERE id = ?')
  const result = stmt.run(id)
  
  return (result.changes ?? 0) > 0
}

export function searchClients(query: string): Client[] {
  const db = getDatabase()
  const searchTerm = `%${query}%`
  
  const stmt = db.prepare(`
    SELECT * FROM clients 
    WHERE hostname LIKE ? 
      OR username LIKE ? 
      OR ip_address LIKE ? 
      OR os LIKE ?
    ORDER BY last_seen DESC
  `)
  
  const rows = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm) as any[]
  return rows.map(formatClient)
}

export function getClientStats(): {
  total: number
  online: number
  offline: number
} {
  const db = getDatabase()
  
  const total = (db.prepare('SELECT COUNT(*) as count FROM clients').get() as any).count
  const online = (db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'online'").get() as any).count
  const offline = (db.prepare("SELECT COUNT(*) as count FROM clients WHERE status = 'offline'").get() as any).count
  
  return { total, online, offline }
}

function formatClient(row: any): Client {
  return {
    id: row.id,
    hostname: row.hostname,
    username: row.username,
    os: row.os,
    ip_address: row.ip_address,
    architecture: row.architecture,
    is_admin: Boolean(row.is_admin),
    status: row.status,
    last_seen: row.last_seen,
    first_seen: row.first_seen,
    created_at: row.created_at,
  }
}
