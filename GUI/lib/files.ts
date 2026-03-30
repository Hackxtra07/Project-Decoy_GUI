import { getDatabase } from './db'
import { v4 as uuidv4 } from 'uuid'

export interface FileRecord {
  id: string
  client_id: string
  command_id?: string
  file_path: string
  file_name: string
  file_size?: number
  file_type?: string
  operation: 'upload' | 'download' | 'browse' | 'delete' | 'encrypt'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  local_path?: string
  created_at: string
}

export interface CreateFileInput {
  client_id: string
  command_id?: string
  file_path: string
  file_name: string
  file_size?: number
  file_type?: string
  operation: 'upload' | 'download' | 'browse' | 'delete' | 'encrypt'
  local_path?: string
}

export function createFileRecord(input: CreateFileInput): FileRecord {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO files 
    (id, client_id, command_id, file_path, file_name, file_size, file_type, operation, status, local_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `)

  stmt.run(
    id,
    input.client_id,
    input.command_id || null,
    input.file_path,
    input.file_name,
    input.file_size || null,
    input.file_type || null,
    input.operation,
    input.local_path || null,
    now
  )

  return getFileRecord(id)!
}

export function getFileRecord(id: string): FileRecord | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM files WHERE id = ?')
  const row = stmt.get(id) as any
  
  if (!row) return null
  
  return formatFileRecord(row)
}

export function getClientFiles(clientId: string, limit = 100): FileRecord[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM files 
    WHERE client_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `)
  
  const rows = stmt.all(clientId, limit) as any[]
  return rows.map(formatFileRecord)
}

export function getCommandFiles(commandId: string): FileRecord[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM files 
    WHERE command_id = ? 
    ORDER BY created_at DESC
  `)
  
  const rows = stmt.all(commandId) as any[]
  return rows.map(formatFileRecord)
}

export function updateFileStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  localPath?: string
): FileRecord | null {
  const db = getDatabase()

  const updates = ['status = ?']
  const params: any[] = [status]

  if (localPath) {
    updates.push('local_path = ?')
    params.push(localPath)
  }

  params.push(id)

  const stmt = db.prepare(`
    UPDATE files 
    SET ${updates.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...params)

  return getFileRecord(id)
}

export function deleteFileRecord(id: string): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM files WHERE id = ?')
  const result = stmt.run(id)
  
  return (result.changes ?? 0) > 0
}

export function getDownloads(clientId: string, limit = 50): FileRecord[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM files 
    WHERE client_id = ? AND operation = 'download'
    ORDER BY created_at DESC 
    LIMIT ?
  `)
  
  const rows = stmt.all(clientId, limit) as any[]
  return rows.map(formatFileRecord)
}

export function getUploads(clientId: string, limit = 50): FileRecord[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM files 
    WHERE client_id = ? AND operation = 'upload'
    ORDER BY created_at DESC 
    LIMIT ?
  `)
  
  const rows = stmt.all(clientId, limit) as any[]
  return rows.map(formatFileRecord)
}

export function getFileStats(clientId: string): {
  total_downloads: number
  total_uploads: number
  completed: number
  failed: number
  pending: number
} {
  const db = getDatabase()
  
  const downloads = (db.prepare("SELECT COUNT(*) as count FROM files WHERE client_id = ? AND operation = 'download'").get(clientId) as any).count
  const uploads = (db.prepare("SELECT COUNT(*) as count FROM files WHERE client_id = ? AND operation = 'upload'").get(clientId) as any).count
  const completed = (db.prepare("SELECT COUNT(*) as count FROM files WHERE client_id = ? AND status = 'completed'").get(clientId) as any).count
  const failed = (db.prepare("SELECT COUNT(*) as count FROM files WHERE client_id = ? AND status = 'failed'").get(clientId) as any).count
  const pending = (db.prepare("SELECT COUNT(*) as count FROM files WHERE client_id = ? AND status = 'pending'").get(clientId) as any).count
  
  return {
    total_downloads: downloads,
    total_uploads: uploads,
    completed,
    failed,
    pending,
  }
}

export function searchFiles(clientId: string, query: string, limit = 50): FileRecord[] {
  const db = getDatabase()
  const searchTerm = `%${query}%`
  
  const stmt = db.prepare(`
    SELECT * FROM files 
    WHERE client_id = ? AND (file_name LIKE ? OR file_path LIKE ?)
    ORDER BY created_at DESC 
    LIMIT ?
  `)
  
  const rows = stmt.all(clientId, searchTerm, searchTerm, limit) as any[]
  return rows.map(formatFileRecord)
}

export function deleteOldFiles(daysOld = 30): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    DELETE FROM files 
    WHERE created_at < datetime('now', '-' || ? || ' days')
  `)
  
  const result = stmt.run(daysOld)
  return result.changes ?? 0
}

function formatFileRecord(row: any): FileRecord {
  return {
    id: row.id,
    client_id: row.client_id,
    command_id: row.command_id,
    file_path: row.file_path,
    file_name: row.file_name,
    file_size: row.file_size,
    file_type: row.file_type,
    operation: row.operation,
    status: row.status,
    local_path: row.local_path,
    created_at: row.created_at,
  }
}
