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
  gpu?: string
  motherboard?: string
  uptime?: number
  last_seen: string
  first_seen: string
  created_at: string
}

export class ClientManager {
  async registerClient(data: {
    hostname: string
    username: string
    os: string
    ip_address: string
    architecture?: string
    is_admin?: boolean
    gpu?: string
    motherboard?: string
    uptime?: number
  }): Promise<Client> {
    const db = await getDatabase()
    const id = uuidv4()
    const now = new Date().toISOString()

    const client: Client = {
      id,
      hostname: data.hostname,
      username: data.username,
      os: data.os,
      ip_address: data.ip_address,
      architecture: data.architecture || 'x64',
      is_admin: !!data.is_admin,
      status: 'online',
      gpu: data.gpu || undefined,
      motherboard: data.motherboard || undefined,
      uptime: data.uptime || 0,
      last_seen: now,
      first_seen: now,
      created_at: now,
    }

    await db.collection('clients').insertOne(client)
    return client
  }

  async getClient(id: string): Promise<Client | null> {
    const db = await getDatabase()
    const row = await db.collection('clients').findOne({ id }) as any
    return row as Client | null
  }

  async getAllClients(): Promise<Client[]> {
    const db = await getDatabase()
    const rows = await db.collection('clients').find().sort({ last_seen: -1 }).toArray() as any[]
    return rows as Client[]
  }

  async getOnlineClients(): Promise<Client[]> {
    const db = await getDatabase()
    const rows = await db.collection('clients')
      .find({ status: 'online' })
      .sort({ last_seen: -1 })
      .toArray() as any[]
    return rows as Client[]
  }

  async updateClientStatus(id: string, status: 'online' | 'offline'): Promise<void> {
    const db = await getDatabase()
    const now = new Date().toISOString()
    await db.collection('clients').updateOne(
      { id },
      { $set: { status, last_seen: now } }
    )
  }

  async updateClientLastSeen(id: string): Promise<void> {
    const db = await getDatabase()
    const now = new Date().toISOString()
    await db.collection('clients').updateOne(
      { id },
      { $set: { last_seen: now } }
    )
  }

  async deleteClient(id: string): Promise<void> {
    const db = await getDatabase()
    await db.collection('clients').deleteOne({ id })
  }

  async getClientStats() {
    const db = await getDatabase()
    const total = await db.collection('clients').countDocuments()
    const online = await db.collection('clients').countDocuments({ status: 'online' })
    const admins = await db.collection('clients').countDocuments({ is_admin: true })

    return {
      totalClients: total,
      onlineClients: online,
      adminClients: admins,
      offlineClients: total - online,
    }
  }

  async getClientsSummary() {
    const clients = await this.getAllClients()
    return clients.map(client => ({
      ...client,
      is_admin: Boolean(client.is_admin),
    }))
  }
}

export const clientManager = new ClientManager()
