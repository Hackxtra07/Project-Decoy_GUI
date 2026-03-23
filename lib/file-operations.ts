import { getDatabase } from './db'
import { v4 as uuidv4 } from 'uuid'

export interface FileOperation {
  id: string
  client_id: string
  command_id: string | null
  file_path: string
  file_name: string
  file_size: number | null
  file_type: string | null
  operation: 'download' | 'upload' | 'delete' | 'execute'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  local_path: string | null
  created_at: string
}

export class FileOperations {
  private db = getDatabase()

  createFileOperation(data: {
    client_id: string
    command_id?: string
    file_path: string
    file_name: string
    file_size?: number
    file_type?: string
    operation: 'download' | 'upload' | 'delete' | 'execute'
    local_path?: string
  }): FileOperation {
    const id = uuidv4()
    const now = new Date().toISOString()

    const stmt = this.db.prepare(`
      INSERT INTO files (
        id, client_id, command_id, file_path, file_name, file_size, file_type, operation, status, local_path, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      data.client_id,
      data.command_id || null,
      data.file_path,
      data.file_name,
      data.file_size || null,
      data.file_type || null,
      data.operation,
      'pending',
      data.local_path || null,
      now
    )

    return {
      id,
      client_id: data.client_id,
      command_id: data.command_id || null,
      file_path: data.file_path,
      file_name: data.file_name,
      file_size: data.file_size || null,
      file_type: data.file_type || null,
      operation: data.operation,
      status: 'pending',
      local_path: data.local_path || null,
      created_at: now,
    }
  }

  getFileOperation(id: string): FileOperation | null {
    const stmt = this.db.prepare('SELECT * FROM files WHERE id = ?')
    return stmt.get(id) as FileOperation | null
  }

  getClientFiles(client_id: string, limit = 100): FileOperation[] {
    const stmt = this.db.prepare(`
      SELECT * FROM files WHERE client_id = ? ORDER BY created_at DESC LIMIT ?
    `)
    return stmt.all(client_id, limit) as FileOperation[]
  }

  getCommandFiles(command_id: string): FileOperation[] {
    const stmt = this.db.prepare(`
      SELECT * FROM files WHERE command_id = ? ORDER BY created_at DESC
    `)
    return stmt.all(command_id) as FileOperation[]
  }

  updateFileStatus(
    id: string,
    status: 'in_progress' | 'completed' | 'failed',
    local_path?: string
  ): void {
    const stmt = this.db.prepare(`
      UPDATE files SET status = ?, local_path = ? WHERE id = ?
    `)
    stmt.run(status, local_path || null, id)
  }

  updateFileSize(id: string, size: number): void {
    const stmt = this.db.prepare('UPDATE files SET file_size = ? WHERE id = ?')
    stmt.run(size, id)
  }

  deleteFile(id: string): void {
    const stmt = this.db.prepare('DELETE FROM files WHERE id = ?')
    stmt.run(id)
  }

  getFileStats() {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM files').get() as { count: number }
    const completed = this.db.prepare("SELECT COUNT(*) as count FROM files WHERE status = 'completed'").get() as { count: number }
    const failed = this.db.prepare("SELECT COUNT(*) as count FROM files WHERE status = 'failed'").get() as { count: number }
    const totalSize = this.db.prepare('SELECT SUM(file_size) as total FROM files WHERE file_size IS NOT NULL').get() as { total: number | null }

    return {
      totalOperations: total.count,
      completedOperations: completed.count,
      failedOperations: failed.count,
      pendingOperations: total.count - completed.count - failed.count,
      totalSize: totalSize.total || 0,
    }
  }

  clearOldFiles(days = 30): void {
    const date = new Date()
    date.setDate(date.getDate() - days)
    const timestamp = date.toISOString()

    const stmt = this.db.prepare('DELETE FROM files WHERE created_at < ? AND status IN (?, ?)')
    stmt.run(timestamp, 'completed', 'failed')
  }
}

export const fileOperations = new FileOperations()
