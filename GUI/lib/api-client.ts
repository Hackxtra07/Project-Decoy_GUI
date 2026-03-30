import { Client } from './clients'
import { Command } from './commands'

export class APIClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `API error: ${response.status}`)
    }

    return response.json()
  }

  // Clients API
  async getClients(): Promise<Client[]> {
    return this.request('/clients')
  }

  async getClientStats() {
    return this.request('/clients?action=stats')
  }

  async getOnlineClients(): Promise<Client[]> {
    return this.request('/clients?action=online')
  }

  async searchClients(query: string): Promise<Client[]> {
    return this.request(`/clients?action=search&q=${encodeURIComponent(query)}`)
  }

  async getClient(id: string): Promise<Client> {
    return this.request(`/clients/${id}`)
  }

  async registerClient(data: any): Promise<Client> {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateClientStatus(id: string, status: string): Promise<Client> {
    return this.request(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async deleteClient(id: string): Promise<{ success: boolean }> {
    return this.request(`/clients/${id}`, {
      method: 'DELETE',
    })
  }

  async getClientCommands(id: string) {
    return this.request(`/clients/${id}?action=commands`)
  }

  async getClientMetrics(id: string) {
    return this.request(`/clients/${id}?action=metrics`)
  }

  async getClientCredentials(id: string) {
    return this.request(`/clients/${id}?action=credentials`)
  }

  // Commands API
  async getCommands(clientId?: string): Promise<Command[]> {
    if (clientId) {
      return this.request(`/commands?action=pending&clientId=${clientId}`)
    }
    return this.request('/commands')
  }

  async getCommandStats() {
    return this.request('/commands?action=stats')
  }

  async getCommand(id: string): Promise<Command> {
    return this.request(`/commands/${id}`)
  }

  async createCommand(data: any): Promise<Command> {
    return this.request('/commands', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCommand(id: string, data: any): Promise<Command> {
    return this.request(`/commands/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCommand(id: string): Promise<{ success: boolean }> {
    return this.request(`/commands/${id}`, {
      method: 'DELETE',
    })
  }

  async executeCommand(clientId: string, commandName: string, parameters?: any): Promise<Command> {
    const command = await this.createCommand({
      client_id: clientId,
      command_type: 'execution',
      command_name: commandName,
      parameters,
    })

    // Trigger execution
    await this.request('/execute', {
      method: 'POST',
      body: JSON.stringify({
        commandId: command.id,
        clientId,
        commandType: 'execution',
        commandName,
        parameters,
      }),
    })

    return command
  }

  // Monitoring API
  async getLatestMetrics(clientId: string) {
    return this.request(`/monitoring?action=latest&clientId=${clientId}`)
  }

  async getMetricsSince(clientId: string, minutes: number = 60) {
    return this.request(`/monitoring?action=since&clientId=${clientId}&minutes=${minutes}`)
  }

  async getAverageMetrics(clientId: string, minutes: number = 60) {
    return this.request(`/monitoring?action=average&clientId=${clientId}&minutes=${minutes}`)
  }

  async getNetworkStats(clientId: string) {
    return this.request(`/monitoring?action=network&clientId=${clientId}`)
  }

  async getRunningProcesses(clientId: string) {
    return this.request(`/monitoring?action=processes&clientId=${clientId}`)
  }

  async recordMetrics(data: any) {
    return this.request('/monitoring', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Files API
  async getFiles(clientId: string) {
    return this.request(`/files?clientId=${clientId}`)
  }

  async getFileStats(clientId: string) {
    return this.request(`/files?action=stats&clientId=${clientId}`)
  }

  async searchFiles(clientId: string, query: string) {
    return this.request(`/files?action=search&clientId=${clientId}&q=${encodeURIComponent(query)}`)
  }

  async getFile(id: string) {
    return this.request(`/files/${id}`)
  }

  async createFileRecord(data: any) {
    return this.request('/files', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateFileStatus(id: string, status: string, localPath?: string) {
    return this.request(`/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, local_path: localPath }),
    })
  }

  async deleteFile(id: string) {
    return this.request(`/files/${id}`, {
      method: 'DELETE',
    })
  }

  // Credentials API
  async getCredentials(clientId: string) {
    return this.request(`/credentials?clientId=${clientId}`)
  }

  async getCredentialStats(clientId: string) {
    return this.request(`/credentials?action=stats&clientId=${clientId}`)
  }

  async searchCredentials(clientId: string, query: string) {
    return this.request(`/credentials?action=search&clientId=${clientId}&q=${encodeURIComponent(query)}`)
  }

  async recordCredential(data: any) {
    return this.request('/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // WebSocket API
  async notifyCommand(clientId: string, commandId: string, commandName: string) {
    return this.request('/ws', {
      method: 'POST',
      body: JSON.stringify({
        action: 'notify-command',
        clientId,
        data: { commandId, commandName },
      }),
    })
  }

  async notifyResult(clientId: string, commandId: string, result: any, status: string) {
    return this.request('/ws', {
      method: 'POST',
      body: JSON.stringify({
        action: 'notify-result',
        clientId,
        data: { commandId, result, status },
      }),
    })
  }

  async broadcastMessage(message: any) {
    return this.request('/ws', {
      method: 'POST',
      body: JSON.stringify({
        action: 'broadcast',
        message,
      }),
    })
  }

  async getConnectionStatus() {
    return this.request('/ws?action=status', {
      method: 'POST',
    })
  }
}

export const apiClient = new APIClient()
