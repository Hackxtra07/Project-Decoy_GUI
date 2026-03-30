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
  private db = getDatabase()

  queueCommand(data: {
    client_id: string
    command_type: string
    command_name: string
    parameters?: Record<string, any>
  }): Command {
    const id = uuidv4()
    const now = new Date().toISOString()
    const parameters = data.parameters ? JSON.stringify(data.parameters) : null

    const stmt = this.db.prepare(`
      INSERT INTO commands (
        id, client_id, command_type, command_name, parameters, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      data.client_id,
      data.command_type,
      data.command_name,
      parameters,
      'pending',
      now,
      now
    )

    return {
      id,
      client_id: data.client_id,
      command_type: data.command_type,
      command_name: data.command_name,
      parameters,
      status: 'pending',
      result: null,
      error_message: null,
      execution_time: null,
      created_at: now,
      updated_at: now,
    }
  }

  getCommand(id: string): Command | null {
    const stmt = this.db.prepare('SELECT * FROM commands WHERE id = ?')
    return stmt.get(id) as Command | null
  }

  getClientCommands(client_id: string, limit = 50): Command[] {
    const stmt = this.db.prepare(`
      SELECT * FROM commands WHERE client_id = ? ORDER BY created_at DESC LIMIT ?
    `)
    return stmt.all(client_id, limit) as Command[]
  }

  getPendingCommands(client_id: string): Command[] {
    const stmt = this.db.prepare(`
      SELECT * FROM commands WHERE client_id = ? AND status = 'pending' ORDER BY created_at ASC
    `)
    return stmt.all(client_id) as Command[]
  }

  getAllPendingCommands(): Command[] {
    const stmt = this.db.prepare(`
      SELECT * FROM commands WHERE status = 'pending' ORDER BY created_at ASC
    `)
    return stmt.all() as Command[]
  }

  updateCommandStatus(
    id: string,
    status: 'executing' | 'completed' | 'failed',
    result?: string,
    error?: string
  ): void {
    const now = new Date().toISOString()
    const execution_time = status === 'executing' ? now : null

    const stmt = this.db.prepare(`
      UPDATE commands SET status = ?, result = ?, error_message = ?, execution_time = ?, updated_at = ? WHERE id = ?
    `)

    stmt.run(status, result || null, error || null, execution_time, now, id)
  }

  completeCommand(id: string, result: string): void {
    const now = new Date().toISOString()
    const stmt = this.db.prepare(`
      UPDATE commands SET status = 'completed', result = ?, updated_at = ? WHERE id = ?
    `)
    stmt.run(result, now, id)
  }

  failCommand(id: string, error: string): void {
    const now = new Date().toISOString()
    const stmt = this.db.prepare(`
      UPDATE commands SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?
    `)
    stmt.run(error, now, id)
  }

  cancelCommand(id: string): void {
    const command = this.getCommand(id)
    if (command && command.status === 'pending') {
      this.failCommand(id, 'Cancelled by user')
    }
  }

  getCommandStats() {
    const pending = this.db.prepare("SELECT COUNT(*) as count FROM commands WHERE status = 'pending'").get() as { count: number }
    const executing = this.db.prepare("SELECT COUNT(*) as count FROM commands WHERE status = 'executing'").get() as { count: number }
    const completed = this.db.prepare("SELECT COUNT(*) as count FROM commands WHERE status = 'completed'").get() as { count: number }
    const failed = this.db.prepare("SELECT COUNT(*) as count FROM commands WHERE status = 'failed'").get() as { count: number }

    return {
      pending: pending.count,
      executing: executing.count,
      completed: completed.count,
      failed: failed.count,
      total: pending.count + executing.count + completed.count + failed.count,
    }
  }

  clearOldCommands(days = 30): void {
    const date = new Date()
    date.setDate(date.getDate() - days)
    const timestamp = date.toISOString()

    const stmt = this.db.prepare('DELETE FROM commands WHERE created_at < ? AND status IN (?, ?)')
    stmt.run(timestamp, 'completed', 'failed')
  }
}

export const commandQueue = new CommandQueue()
