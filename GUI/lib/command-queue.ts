import { getDatabase } from './db'
import { v4 as uuidv4 } from 'uuid'

export interface Command {
  id: string
  client_id: string
  command_type: string
  command_name: string
  parameters: string | null
  status: 'pending' | 'executing' | 'completed' | 'failed'
  result: string | null
  error_message: string | null
  execution_time: string | null
  created_at: string
  updated_at: string
}

export class CommandQueue {
  async queueCommand(data: {
    client_id: string
    command_type: string
    command_name: string
    parameters?: Record<string, any>
  }): Promise<Command> {
    const db = await getDatabase()
    const id = uuidv4()
    const now = new Date().toISOString()
    const parameters = data.parameters || null

    const command: Command = {
      id,
      client_id: data.client_id,
      command_type: data.command_type,
      command_name: data.command_name,
      parameters: parameters ? JSON.stringify(parameters) : null, // Keep string for interface compatibility if needed, but Mongo stores as object
      status: 'pending',
      result: null,
      error_message: null,
      execution_time: null,
      created_at: now,
      updated_at: now,
    }

    await db.collection('commands').insertOne({
      ...command,
      parameters: parameters // Store as object in Mongo
    })

    return command
  }

  async getCommand(id: string): Promise<Command | null> {
    const db = await getDatabase()
    const row = await db.collection('commands').findOne({ id }) as any
    if (!row) return null
    return {
      ...row,
      parameters: row.parameters ? JSON.stringify(row.parameters) : null
    } as Command
  }

  async getClientCommands(client_id: string, limit = 50): Promise<Command[]> {
    const db = await getDatabase()
    const rows = await db.collection('commands')
      .find({ client_id })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray() as any[]
    return rows.map(r => ({ ...r, parameters: r.parameters ? JSON.stringify(r.parameters) : null })) as Command[]
  }

  async getPendingCommands(client_id: string): Promise<Command[]> {
    const db = await getDatabase()
    const rows = await db.collection('commands')
      .find({ client_id, status: 'pending' })
      .sort({ created_at: 1 })
      .toArray() as any[]
    return rows.map(r => ({ ...r, parameters: r.parameters ? JSON.stringify(r.parameters) : null })) as Command[]
  }

  async getAllPendingCommands(): Promise<Command[]> {
    const db = await getDatabase()
    const rows = await db.collection('commands')
      .find({ status: 'pending' })
      .sort({ created_at: 1 })
      .toArray() as any[]
    return rows.map(r => ({ ...r, parameters: r.parameters ? JSON.stringify(r.parameters) : null })) as Command[]
  }

  async updateCommandStatus(
    id: string,
    status: 'executing' | 'completed' | 'failed',
    result?: string,
    error?: string
  ): Promise<void> {
    const db = await getDatabase()
    const now = new Date().toISOString()
    const update: any = { status, updated_at: now }
    if (status === 'executing') update.execution_time = now
    if (result) update.result = result
    if (error) update.error_message = error

    await db.collection('commands').updateOne({ id }, { $set: update })
  }

  async completeCommand(id: string, result: string): Promise<void> {
    const db = await getDatabase()
    const now = new Date().toISOString()
    await db.collection('commands').updateOne(
      { id },
      { $set: { status: 'completed', result, updated_at: now } }
    )
  }

  async failCommand(id: string, error: string): Promise<void> {
    const db = await getDatabase()
    const now = new Date().toISOString()
    await db.collection('commands').updateOne(
      { id },
      { $set: { status: 'failed', error_message: error, updated_at: now } }
    )
  }

  async cancelCommand(id: string): Promise<void> {
    const command = await this.getCommand(id)
    if (command && command.status === 'pending') {
      await this.failCommand(id, 'Cancelled by user')
    }
  }

  async getCommandStats() {
    const db = await getDatabase()
    const pending = await db.collection('commands').countDocuments({ status: 'pending' })
    const executing = await db.collection('commands').countDocuments({ status: 'executing' })
    const completed = await db.collection('commands').countDocuments({ status: 'completed' })
    const failed = await db.collection('commands').countDocuments({ status: 'failed' })

    return {
      pending,
      executing,
      completed,
      failed,
      total: pending + executing + completed + failed,
    }
  }

  async clearOldCommands(days = 30): Promise<void> {
    const db = await getDatabase()
    const date = new Date()
    date.setDate(date.getDate() - days)
    const timestamp = date.toISOString()

    await db.collection('commands').deleteMany({
      created_at: { $lt: timestamp },
      status: { $in: ['completed', 'failed'] }
    })
  }
}

export const commandQueue = new CommandQueue()
