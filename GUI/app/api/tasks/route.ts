import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase()
    // Fetch active commands (status is executing or pending and is_active is true)
    // We also show commands from last 1 hour that might still be logically 'running'
    const commands = db.prepare(`
      SELECT c.*, cl.hostname, cl.username as client_user
      FROM commands c
      JOIN clients cl ON c.client_id = cl.id
      WHERE c.is_active = 1 OR c.status = 'executing' OR c.status = 'pending'
      ORDER BY c.created_at DESC
    `).all()

    return NextResponse.json({ success: true, data: commands })
  } catch (error) {
    console.error('[Tasks API] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, taskId, clientId } = await request.json()
    const db = getDatabase()

    if (action === 'cancel') {
      // 1. Mark the original command as cancelled
      db.prepare("UPDATE commands SET status = 'cancelled', is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(taskId)

      // 2. Insert a new 'cancel_command' to be picked up by s.py and sent to the client
      const cancelId = uuidv4()
      db.prepare(`
        INSERT INTO commands (id, client_id, command_type, command_name, parameters, status)
        VALUES (?, ?, 'system', 'cancel_command', ?, 'pending')
      `).run(cancelId, clientId, JSON.stringify({ target_id: taskId }))

      return NextResponse.json({ success: true, message: 'Cancellation command queued' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Tasks API] POST Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to process task action' }, { status: 500 })
  }
}
