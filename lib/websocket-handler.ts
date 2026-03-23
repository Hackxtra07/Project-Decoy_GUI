import { WebSocket } from 'ws'

export type MessageType =
  | 'client-connected'
  | 'client-disconnected'
  | 'command-queued'
  | 'command-status-updated'
  | 'metrics-update'
  | 'file-operation-update'
  | 'error'

export interface WebSocketMessage {
  type: MessageType
  timestamp: string
  data: Record<string, any>
  clientId?: string
}

export class WebSocketManager {
  private connections = new Map<string, WebSocket>()
  private clientConnections = new Map<string, Set<WebSocket>>()

  registerConnection(id: string, socket: WebSocket): void {
    this.connections.set(id, socket)
  }

  registerClientConnection(clientId: string, socket: WebSocket): void {
    if (!this.clientConnections.has(clientId)) {
      this.clientConnections.set(clientId, new Set())
    }
    this.clientConnections.get(clientId)!.add(socket)
  }

  unregisterConnection(id: string): void {
    this.connections.delete(id)
  }

  unregisterClientConnection(clientId: string, socket: WebSocket): void {
    if (this.clientConnections.has(clientId)) {
      this.clientConnections.get(clientId)!.delete(socket)
    }
  }

  broadcast(message: WebSocketMessage): void {
    for (const socket of this.connections.values()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message))
      }
    }
  }

  broadcastToClients(clientId: string, message: WebSocketMessage): void {
    const clientSockets = this.clientConnections.get(clientId)
    if (!clientSockets) return

    for (const socket of clientSockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message))
      }
    }
  }

  sendToConnection(id: string, message: WebSocketMessage): void {
    const socket = this.connections.get(id)
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }

  notifyClientConnected(clientId: string, clientData: Record<string, any>): void {
    this.broadcast({
      type: 'client-connected',
      timestamp: new Date().toISOString(),
      data: clientData,
      clientId,
    })
  }

  notifyClientDisconnected(clientId: string): void {
    this.broadcast({
      type: 'client-disconnected',
      timestamp: new Date().toISOString(),
      data: { clientId },
      clientId,
    })
  }

  notifyCommandQueued(clientId: string, commandData: Record<string, any>): void {
    this.broadcastToClients(clientId, {
      type: 'command-queued',
      timestamp: new Date().toISOString(),
      data: commandData,
      clientId,
    })

    this.broadcast({
      type: 'command-queued',
      timestamp: new Date().toISOString(),
      data: commandData,
      clientId,
    })
  }

  notifyCommandStatusUpdated(clientId: string, commandId: string, status: string, result?: string): void {
    const message: WebSocketMessage = {
      type: 'command-status-updated',
      timestamp: new Date().toISOString(),
      data: {
        commandId,
        status,
        result: result || null,
      },
      clientId,
    }

    this.broadcastToClients(clientId, message)
    this.broadcast(message)
  }

  notifyMetricsUpdate(clientId: string, metrics: Record<string, any>): void {
    const message: WebSocketMessage = {
      type: 'metrics-update',
      timestamp: new Date().toISOString(),
      data: metrics,
      clientId,
    }

    this.broadcastToClients(clientId, message)
    this.broadcast(message)
  }

  notifyFileOperationUpdate(clientId: string, fileId: string, status: string, progress?: number): void {
    const message: WebSocketMessage = {
      type: 'file-operation-update',
      timestamp: new Date().toISOString(),
      data: {
        fileId,
        status,
        progress: progress || 0,
      },
      clientId,
    }

    this.broadcastToClients(clientId, message)
    this.broadcast(message)
  }

  notifyError(clientId: string | undefined, error: string): void {
    this.broadcast({
      type: 'error',
      timestamp: new Date().toISOString(),
      data: { error },
      clientId,
    })
  }

  getConnectionCount(): number {
    return this.connections.size
  }

  getClientConnectionCount(clientId: string): number {
    return this.clientConnections.get(clientId)?.size || 0
  }

  getAllConnectionStats() {
    return {
      totalConnections: this.connections.size,
      clientConnections: Array.from(this.clientConnections.entries()).map(([clientId, sockets]) => ({
        clientId,
        connectionCount: sockets.size,
      })),
    }
  }
}

export const wsManager = new WebSocketManager()
