import { NextRequest } from 'next/server'

interface ClientConnection {
  id: string
  ws: WebSocket
  lastHeartbeat: number
}

// Store active WebSocket connections
const clients = new Map<string, ClientConnection>()

// Message types for WebSocket communication
export enum MessageType {
  REGISTER = 'register',
  STATUS_UPDATE = 'status_update',
  COMMAND_QUEUED = 'command_queued',
  COMMAND_RESULT = 'command_result',
  METRICS = 'metrics',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  BROADCAST = 'broadcast',
}

interface WebSocketMessage {
  type: MessageType
  clientId?: string
  data?: any
  timestamp: string
}

export function handleClientConnection(clientId: string, ws: WebSocket) {
  const connection: ClientConnection = {
    id: clientId,
    ws,
    lastHeartbeat: Date.now(),
  }

  clients.set(clientId, connection)
  console.log(`[WebSocket] Client ${clientId} connected. Total connections: ${clients.size}`)

  // Send welcome message
  sendMessage(clientId, {
    type: MessageType.REGISTER,
    data: { message: 'Welcome to C2 Server', clientId },
  })
}

export function handleClientDisconnect(clientId: string) {
  clients.delete(clientId)
  console.log(`[WebSocket] Client ${clientId} disconnected. Total connections: ${clients.size}`)

  // Broadcast disconnect to all clients
  broadcastMessage({
    type: MessageType.DISCONNECT,
    data: { clientId },
  })
}

export function sendMessage(clientId: string, message: Partial<WebSocketMessage>) {
  const connection = clients.get(clientId)
  if (!connection) {
    console.warn(`[WebSocket] Client ${clientId} not found`)
    return false
  }

  const fullMessage: WebSocketMessage = {
    type: message.type || MessageType.BROADCAST,
    clientId,
    data: message.data,
    timestamp: new Date().toISOString(),
  }

  try {
    connection.ws.send(JSON.stringify(fullMessage))
    return true
  } catch (error) {
    console.error(`[WebSocket] Error sending message to ${clientId}:`, error)
    handleClientDisconnect(clientId)
    return false
  }
}

export function broadcastMessage(message: Partial<WebSocketMessage>) {
  const fullMessage: WebSocketMessage = {
    type: message.type || MessageType.BROADCAST,
    data: message.data,
    timestamp: new Date().toISOString(),
  }

  let successCount = 0
  for (const [clientId, connection] of clients) {
    try {
      connection.ws.send(JSON.stringify(fullMessage))
      successCount++
    } catch (error) {
      console.error(`[WebSocket] Error broadcasting to ${clientId}:`, error)
      handleClientDisconnect(clientId)
    }
  }

  console.log(`[WebSocket] Broadcast sent to ${successCount}/${clients.size} clients`)
  return successCount
}

export function notifyCommandQueued(clientId: string, commandId: string, commandName: string) {
  sendMessage(clientId, {
    type: MessageType.COMMAND_QUEUED,
    data: { commandId, commandName },
  })
}

export function notifyCommandResult(clientId: string, commandId: string, result: any, status: string) {
  sendMessage(clientId, {
    type: MessageType.COMMAND_RESULT,
    data: { commandId, result, status },
  })
}

export function notifyMetricsUpdate(clientId: string, metrics: any) {
  sendMessage(clientId, {
    type: MessageType.METRICS,
    data: metrics,
  })
}

export function notifyStatusUpdate(clientId: string, status: string) {
  broadcastMessage({
    type: MessageType.STATUS_UPDATE,
    data: { clientId, status },
  })
}

export function getConnectedClients(): string[] {
  return Array.from(clients.keys())
}

export function getConnectionCount(): number {
  return clients.size
}

export function getConnectionStatus() {
  const connections = Array.from(clients.values()).map(c => ({
    clientId: c.id,
    lastHeartbeat: new Date(c.lastHeartbeat).toISOString(),
  }))

  return {
    totalConnections: clients.size,
    connections,
  }
}

// Heartbeat mechanism to detect dead connections
export function startHeartbeat() {
  setInterval(() => {
    const now = Date.now()
    const deadConnections: string[] = []

    for (const [clientId, connection] of clients) {
      if (now - connection.lastHeartbeat > 60000) {
        // 60 second timeout
        deadConnections.push(clientId)
      } else {
        try {
          connection.ws.send(JSON.stringify({
            type: MessageType.HEARTBEAT,
            timestamp: new Date().toISOString(),
          }))
        } catch (error) {
          deadConnections.push(clientId)
        }
      }
    }

    // Remove dead connections
    deadConnections.forEach(clientId => {
      console.log(`[WebSocket] Removing dead connection: ${clientId}`)
      handleClientDisconnect(clientId)
    })
  }, 30000) // Check every 30 seconds
}

// WebSocket handler for Next.js
export async function GET(request: NextRequest) {
  return new Response('WebSocket endpoint', { status: 400 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, clientId, message, data } = body

    if (!action) {
      return new Response(JSON.stringify({ error: 'Action required' }), { status: 400 })
    }

    if (action === 'send' && clientId) {
      const success = sendMessage(clientId, message)
      return new Response(JSON.stringify({ success }), { status: 200 })
    }

    if (action === 'broadcast') {
      const count = broadcastMessage(message)
      return new Response(JSON.stringify({ success: true, count }), { status: 200 })
    }

    if (action === 'status') {
      const status = getConnectionStatus()
      return new Response(JSON.stringify(status), { status: 200 })
    }

    if (action === 'notify-command' && clientId) {
      notifyCommandQueued(clientId, data.commandId, data.commandName)
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    if (action === 'notify-result' && clientId) {
      notifyCommandResult(clientId, data.commandId, data.result, data.status)
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    if (action === 'notify-metrics' && clientId) {
      notifyMetricsUpdate(clientId, data)
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 })
  } catch (error) {
    console.error('[WebSocket] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
