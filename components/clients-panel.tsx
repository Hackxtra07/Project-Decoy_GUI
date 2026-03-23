'use client'

import { useState, useEffect } from 'react'
import { Search, Trash2, Activity, Wifi } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'

interface ClientsPanelProps {
  selectedClient: string | null
  setSelectedClient: (id: string | null) => void
}

interface ClientData {
  id: string
  hostname: string
  username: string
  os: string
  ip_address: string
  status: 'online' | 'offline' | 'idle'
  last_seen: string
  created_at: string
}

export default function ClientsPanel({ selectedClient, setSelectedClient }: ClientsPanelProps) {
  const [clients, setClients] = useState<ClientData[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch clients on mount and poll every 5 seconds
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setError(null)
        const data = await apiClient.getClients()
        setClients(data)
        
        // Auto-select first online client if none is selected
        if (!selectedClient && data.length > 0) {
            const online = data.find((c: any) => c.status === 'online') || data[0];
            setSelectedClient(online.id);
        }
        
        // Apply search filter
        const filtered = data.filter(
          (client: ClientData) =>
            client.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.ip_address.toLowerCase().includes(searchQuery.toLowerCase())
        )
        setFilteredClients(filtered)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch clients')
        console.error('[ClientsPanel] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()

    // Poll every 1 second
    const interval = setInterval(fetchClients, 1000)

    return () => clearInterval(interval)
  }, [searchQuery])

  const getStatusColor = (status: string): string => {
    if (status === 'online') return 'bg-green-900/30 text-green-400'
    if (status === 'idle') return 'bg-yellow-900/30 text-yellow-400'
    return 'bg-red-900/30 text-red-400'
  }

  const handleDelete = async (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to remove this client?')) {
      try {
        await apiClient.deleteClient(clientId)
        setClients(clients.filter((c) => c.id !== clientId))
        if (selectedClient === clientId) setSelectedClient(null)
      } catch (err) {
        console.error('[ClientsPanel] Delete error:', err)
        alert('Failed to delete client')
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Active Clients</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <p className="text-sm">Loading clients...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="m-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Clients list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!loading && filteredClients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No clients found</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedClient === client.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              {/* Client header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-foreground">{client.hostname}</h3>
                  <p className="text-xs text-muted-foreground">{client.ip_address}</p>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(
                    client.status
                  )}`}
                >
                  <Activity className="w-3 h-3" />
                  {client.status === 'online' ? 'Online' : client.status === 'idle' ? 'Idle' : 'Offline'}
                </div>
              </div>

              {/* Client details */}
              <div className="space-y-1 text-xs text-muted-foreground mb-3">
                <p>
                  <span className="text-foreground/60">OS:</span> {client.os}
                </p>
                <p>
                  <span className="text-foreground/60">User:</span> {client.username}
                </p>
                <p className="flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  {new Date(client.last_seen).toLocaleString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 text-xs py-2 rounded bg-primary/20 hover:bg-primary/30 text-primary transition-colors">
                  Interact
                </button>
                <button 
                  onClick={(e) => handleDelete(client.id, e)}
                  className="px-2 py-2 rounded bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats footer */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Online</p>
            <p className="text-lg font-bold text-green-400">
              {clients.filter((c) => c.status === 'online').length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{clients.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
