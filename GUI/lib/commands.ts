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

export function createCommand(input: CreateCommandInput): Command {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO commands (id, client_id, command_type, command_name, parameters, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `)

  stmt.run(
    id,
    input.client_id,
    input.command_type,
    input.command_name,
    input.parameters ? JSON.stringify(input.parameters) : null,
    now,
    now
  )

  return getCommand(id)!
}

export function getCommand(id: string): Command | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM commands WHERE id = ?')
  const row = stmt.get(id) as any
  
  if (!row) return null
  
  return formatCommand(row)
}

export function getClientCommands(clientId: string, limit = 50): Command[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM commands 
    WHERE client_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `)
  
  const rows = stmt.all(clientId, limit) as any[]
  return rows.map(formatCommand)
}

export function getPendingCommands(clientId: string): Command[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM commands 
    WHERE client_id = ? AND status = 'pending'
    ORDER BY created_at ASC
  `)
  
  const rows = stmt.all(clientId) as any[]
  return rows.map(formatCommand)
}

export function updateCommandStatus(
  id: string,
  status: 'pending' | 'executing' | 'completed' | 'failed',
  result?: string,
  errorMessage?: string
): Command | null {
  const db = getDatabase()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    UPDATE commands 
    SET status = ?, result = ?, error_message = ?, updated_at = ?, execution_time = ?
    WHERE id = ?
  `)

  stmt.run(
    status,
    result || null,
    errorMessage || null,
    now,
    status === 'completed' || status === 'failed' ? now : null,
    id
  )

  return getCommand(id)
}

export function getCommandHistory(clientId: string, limit = 100): Command[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM commands 
    WHERE client_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `)
  
  const rows = stmt.all(clientId, limit) as any[]
  return rows.map(formatCommand)
}

export function deleteCommand(id: string): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM commands WHERE id = ?')
  const result = stmt.run(id)
  
  return (result.changes ?? 0) > 0
}

export function getExecutionStats(): {
  total: number
  pending: number
  executing: number
  completed: number
  failed: number
} {
  const db = getDatabase()
  
  const total = (db.prepare('SELECT COUNT(*) as count FROM commands').get() as any).count
  const pending = (db.prepare("SELECT COUNT(*) as count FROM commands WHERE status = 'pending'").get() as any).count
  const executing = (db.prepare("SELECT COUNT(*) as count FROM commands WHERE status = 'executing'").get() as any).count
  const completed = (db.prepare("SELECT COUNT(*) as count FROM commands WHERE status = 'completed'").get() as any).count
  const failed = (db.prepare("SELECT COUNT(*) as count FROM commands WHERE status = 'failed'").get() as any).count
  
  return { total, pending, executing, completed, failed }
}

export function archiveCommandHistory(clientId: string, daysOld = 30): number {
  const db = getDatabase()
  
  // Insert completed commands into history before archiving
  const archive = db.prepare(`
    INSERT INTO command_history (id, client_id, command_type, command_name, parameters, result, executed_at)
    SELECT id, client_id, command_type, command_name, parameters, result, created_at
    FROM commands
    WHERE client_id = ? AND status = 'completed' AND created_at < datetime('now', '-' || ? || ' days')
  `)
  
  archive.run(clientId, daysOld)
  
  // Delete old commands
  const deleteStmt = db.prepare(`
    DELETE FROM commands
    WHERE client_id = ? AND created_at < datetime('now', '-' || ? || ' days')
  `)
  
  const result = deleteStmt.run(clientId, daysOld)
  return result.changes ?? 0
}

function formatCommand(row: any): Command {
  return {
    id: row.id,
    client_id: row.client_id,
    command_type: row.command_type,
    command_name: row.command_name,
    parameters: row.parameters ? JSON.parse(row.parameters) : undefined,
    status: row.status,
    result: row.result,
    error_message: row.error_message,
    execution_time: row.execution_time,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
