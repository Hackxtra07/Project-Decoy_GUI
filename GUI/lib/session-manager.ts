import { getDatabase } from './db'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export interface Session {
  id: string
  username: string
  login_time: string
  last_activity: string
  ip_address: string | null
  user_agent: string | null
  is_active: boolean
}

export class SessionManager {
  private db = getDatabase()
  private sessions = new Map<string, { token: string; expires: number }>()

  createSession(data: {
    username: string
    ip_address?: string
    user_agent?: string
  }): { session_id: string; token: string } {
    const id = uuidv4()
    const token = crypto.randomBytes(32).toString('hex')
    const now = new Date().toISOString()

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, username, login_time, last_activity, ip_address, user_agent, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      data.username,
      now,
      now,
      data.ip_address || null,
      data.user_agent || null,
      1
    )

    // Store token in memory with expiration
    const expiresIn = 24 * 60 * 60 * 1000 // 24 hours
    this.sessions.set(token, {
      token,
      expires: Date.now() + expiresIn,
    })

    return { session_id: id, token }
  }

  getSession(id: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?')
    const row = stmt.get(id) as any
    if (!row) return null

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

  verifyToken(token: string): boolean {
    const session = this.sessions.get(token)
    if (!session) return false
    if (session.expires < Date.now()) {
      this.sessions.delete(token)
      return false
    }
    return true
  }

  updateLastActivity(id: string): void {
    const now = new Date().toISOString()
    const stmt = this.db.prepare('UPDATE sessions SET last_activity = ? WHERE id = ?')
    stmt.run(now, id)
  }

  endSession(id: string): void {
    const stmt = this.db.prepare('UPDATE sessions SET is_active = 0 WHERE id = ?')
    stmt.run(id)
  }

  getActiveSessions(): Session[] {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE is_active = 1 ORDER BY last_activity DESC')
    const rows = stmt.all() as any[]
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      login_time: row.login_time,
      last_activity: row.last_activity,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      is_active: Boolean(row.is_active),
    }))
  }

  getUserSessions(username: string): Session[] {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE username = ? ORDER BY last_activity DESC')
    const rows = stmt.all(username) as any[]
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      login_time: row.login_time,
      last_activity: row.last_activity,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      is_active: Boolean(row.is_active),
    }))
  }

  cleanupExpiredSessions(): void {
    // Clean memory sessions
    const now = Date.now()
    for (const [token, session] of this.sessions.entries()) {
      if (session.expires < now) {
        this.sessions.delete(token)
      }
    }

    // Clean database sessions older than 7 days
    const date = new Date()
    date.setDate(date.getDate() - 7)
    const timestamp = date.toISOString()

    const stmt = this.db.prepare('DELETE FROM sessions WHERE last_activity < ? AND is_active = 0')
    stmt.run(timestamp)
  }

  getSessionStats() {
    const active = this.db.prepare('SELECT COUNT(*) as count FROM sessions WHERE is_active = 1').get() as { count: number }
    const total = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number }

    return {
      activeSessions: active.count,
      totalSessions: total.count,
      inactiveSessions: total.count - active.count,
    }
  }
}

export const sessionManager = new SessionManager()
