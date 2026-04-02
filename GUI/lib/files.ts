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

export async function createFileRecord(input: CreateFileInput): Promise<FileRecord> {
  const db = await getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  const file: FileRecord = {
    id,
    client_id: input.client_id,
    command_id: input.command_id || undefined,
    file_path: input.file_path,
    file_name: input.file_name,
    file_size: input.file_size || undefined,
    file_type: input.file_type || undefined,
    operation: input.operation,
    status: 'pending',
    local_path: input.local_path || undefined,
    created_at: now
  }

  await db.collection('files').insertOne(file)
  return file
}

export async function getFileRecord(id: string): Promise<FileRecord | null> {
  const db = await getDatabase()
  const row = await db.collection('files').findOne({ id }) as any
  
  if (!row) return null
  return formatFileRecord(row)
}

export async function getClientFiles(clientId: string, limit = 100): Promise<FileRecord[]> {
  const db = await getDatabase()
  const rows = await db.collection('files')
    .find({ client_id: clientId })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray() as any[]
  
  return rows.map(formatFileRecord)
}

export async function getCommandFiles(commandId: string): Promise<FileRecord[]> {
  const db = await getDatabase()
  const rows = await db.collection('files')
    .find({ command_id: commandId })
    .sort({ created_at: -1 })
    .toArray() as any[]
  
  return rows.map(formatFileRecord)
}

export async function updateFileStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  localPath?: string
): Promise<FileRecord | null> {
  const db = await getDatabase()

  const updateFields: any = { status }
  if (localPath) {
    updateFields.local_path = localPath
  }

  await db.collection('files').updateOne(
    { id },
    { $set: updateFields }
  )

  return getFileRecord(id)
}

export async function deleteFileRecord(id: string): Promise<boolean> {
  const db = await getDatabase()
  const result = await db.collection('files').deleteOne({ id })
  return (result.deletedCount ?? 0) > 0
}

export async function getDownloads(clientId: string, limit = 50): Promise<FileRecord[]> {
  const db = await getDatabase()
  const rows = await db.collection('files')
    .find({ client_id: clientId, operation: 'download' })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray() as any[]
  
  return rows.map(formatFileRecord)
}

export async function getUploads(clientId: string, limit = 50): Promise<FileRecord[]> {
  const db = await getDatabase()
  const rows = await db.collection('files')
    .find({ client_id: clientId, operation: 'upload' })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray() as any[]
  
  return rows.map(formatFileRecord)
}

export async function getFileStats(clientId: string): Promise<{
  total_downloads: number
  total_uploads: number
  completed: number
  failed: number
  pending: number
}> {
  const db = await getDatabase()
  
  const downloads = await db.collection('files').countDocuments({ client_id: clientId, operation: 'download' })
  const uploads = await db.collection('files').countDocuments({ client_id: clientId, operation: 'upload' })
  const completed = await db.collection('files').countDocuments({ client_id: clientId, status: 'completed' })
  const failed = await db.collection('files').countDocuments({ client_id: clientId, status: 'failed' })
  const pending = await db.collection('files').countDocuments({ client_id: clientId, status: 'pending' })
  
  return {
    total_downloads: downloads,
    total_uploads: uploads,
    completed,
    failed,
    pending,
  }
}

export async function searchFiles(clientId: string, query: string, limit = 50): Promise<FileRecord[]> {
  const db = await getDatabase()
  const regex = new RegExp(query, 'i')

  const rows = await db.collection('files')
    .find({ 
      client_id: clientId, 
      $or: [{ file_name: regex }, { file_path: regex }] 
    })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray() as any[]
  
  return rows.map(formatFileRecord)
}

export async function deleteOldFiles(daysOld = 30): Promise<number> {
  const db = await getDatabase()
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - daysOld);

  const result = await db.collection('files').deleteMany({
    created_at: { $lt: dateLimit.toISOString() }
  })
  return result.deletedCount ?? 0
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
