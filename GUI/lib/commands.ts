import { getDatabase } from './db'
import { v4 as uuidv4 } from 'uuid'

export interface Command {
  id: string
  client_id: string
  command_type: string
  command_name: string
  parameters?: Record<string, any>
  status: 'pending' | 'executing' | 'completed' | 'failed'
  result?: string
  error_message?: string
  execution_time?: string
  created_at: string
  updated_at: string
}

export interface CreateCommandInput {
  client_id: string
  command_type: string
  command_name: string
  parameters?: Record<string, any>
}

export async function createCommand(input: CreateCommandInput): Promise<Command> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  const command: Command = {
    id,
    client_id: input.client_id,
    command_type: input.command_type,
    command_name: input.command_name,
    parameters: input.parameters || {},
    status: 'pending',
    created_at: now,
    updated_at: now,
  }

  await db.collection('commands').insertOne(command)
  return command
}

export async function getCommand(id: string): Promise<Command | null> {
  const db = await getDatabase()
  const row = await db.collection('commands').findOne({ id }) as any
  
  if (!row) return null
  return formatCommand(row)
}

export async function getClientCommands(clientId: string, limit = 50): Promise<Command[]> {
  const db = await getDatabase()
  const rows = await db.collection('commands')
    .find({ client_id: clientId })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray() as any[]
  
  return rows.map(formatCommand)
}

export async function getPendingCommands(clientId: string): Promise<Command[]> {
  const db = await getDatabase()
  const rows = await db.collection('commands')
    .find({ client_id: clientId, status: 'pending' })
    .sort({ created_at: 1 })
    .toArray() as any[]
  
  return rows.map(formatCommand)
}

export async function updateCommandStatus(
  id: string,
  status: 'pending' | 'executing' | 'completed' | 'failed',
  result?: string,
  errorMessage?: string
): Promise<Command | null> {
  const db = await getDatabase()
  const now = new Date().toISOString()

  const updateFields: any = {
    status,
    updated_at: now,
    result: result || null,
    error_message: errorMessage || null
  }

  if (status === 'completed' || status === 'failed') {
    updateFields.execution_time = now
  }

  await db.collection('commands').updateOne(
    { id },
    { $set: updateFields }
  )

  return getCommand(id)
}

export async function getCommandHistory(clientId: string, limit = 100): Promise<Command[]> {
  const db = await getDatabase()
  const rows = await db.collection('commands')
    .find({ client_id: clientId })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray() as any[]
  
  return rows.map(formatCommand)
}

export async function deleteCommand(id: string): Promise<boolean> {
  const db = await getDatabase()
  const result = await db.collection('commands').deleteOne({ id })
  return (result.deletedCount ?? 0) > 0
}

export async function getExecutionStats(): Promise<{
  total: number
  pending: number
  executing: number
  completed: number
  failed: number
}> {
  const db = await getDatabase()
  
  const total = await db.collection('commands').countDocuments()
  const pending = await db.collection('commands').countDocuments({ status: 'pending' })
  const executing = await db.collection('commands').countDocuments({ status: 'executing' })
  const completed = await db.collection('commands').countDocuments({ status: 'completed' })
  const failed = await db.collection('commands').countDocuments({ status: 'failed' })
  
  return { total, pending, executing, completed, failed }
}

export async function archiveCommandHistory(clientId: string, daysOld = 30): Promise<number> {
  const db = await getDatabase()
  const dateLimit = new Date()
  dateLimit.setDate(dateLimit.getDate() - daysOld)
  
  const query = {
    client_id: clientId,
    created_at: { $lt: dateLimit.toISOString() }
  }

  // In MongoDB we can just move them to another collection or delete
  const oldCommands = await db.collection('commands').find(query).toArray()
  if (oldCommands.length > 0) {
    await db.collection('command_history').insertMany(oldCommands)
    const result = await db.collection('commands').deleteMany(query)
    return result.deletedCount ?? 0
  }
  
  return 0
}

function formatCommand(row: any): Command {
  return {
    id: row.id,
    client_id: row.client_id,
    command_type: row.command_type,
    command_name: row.command_name,
    parameters: row.parameters,
    status: row.status,
    result: row.result,
    error_message: row.error_message,
    execution_time: row.execution_time,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
