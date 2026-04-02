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
  private sessions = new Map<string, { token: string; expires: number }>()

  async createSession(data: {
    username: string
    ip_address?: string
    user_agent?: string
  }): Promise<{ session_id: string; token: string }> {
    const db = await getDatabase()
    const id = uuidv4()
    const token = crypto.randomBytes(32).toString('hex')
    const now = new Date().toISOString()

    await db.collection('sessions').insertOne({
      id,
      username: data.username,
      login_time: now,
      last_activity: now,
      ip_address: data.ip_address || null,
      user_agent: data.user_agent || null,
      is_active: true,
    })

    // Store token in memory with expiration
    const expiresIn = 24 * 60 * 60 * 1000 // 24 hours
    this.sessions.set(token, {
      token,
      expires: Date.now() + expiresIn,
    })

    return { session_id: id, token }
  }

  async getSession(id: string): Promise<Session | null> {
    const db = await getDatabase()
    const row = await db.collection('sessions').findOne({ id }) as any
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

  async updateLastActivity(id: string): Promise<void> {
    const db = await getDatabase()
    const now = new Date().toISOString()
    await db.collection('sessions').updateOne({ id }, { $set: { last_activity: now } })
  }

  async endSession(id: string): Promise<void> {
    const db = await getDatabase()
    await db.collection('sessions').updateOne({ id }, { $set: { is_active: false } })
  }

  async getActiveSessions(): Promise<Session[]> {
    const db = await getDatabase()
    const rows = await db.collection('sessions')
      .find({ is_active: true })
      .sort({ last_activity: -1 })
      .toArray() as any[]
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

  async getUserSessions(username: string): Promise<Session[]> {
    const db = await getDatabase()
    const rows = await db.collection('sessions')
      .find({ username })
      .sort({ last_activity: -1 })
      .toArray() as any[]
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

  async cleanupExpiredSessions(): Promise<void> {
    // Clean memory sessions
    const now = Date.now()
    for (const [token, session] of this.sessions.entries()) {
      if (session.expires < now) {
        this.sessions.delete(token)
      }
    }

    // Clean database sessions older than 7 days
    const db = await getDatabase()
    const date = new Date()
    date.setDate(date.getDate() - 7)
    const timestamp = date.toISOString()

    await db.collection('sessions').deleteMany({
      last_activity: { $lt: timestamp },
      is_active: false,
    })
  }

  async getSessionStats() {
    const db = await getDatabase()
    const active = await db.collection('sessions').countDocuments({ is_active: true })
    const total = await db.collection('sessions').countDocuments()

    return {
      activeSessions: active,
      totalSessions: total,
      inactiveSessions: total - active,
    }
  }
}

export const sessionManager = new SessionManager()
