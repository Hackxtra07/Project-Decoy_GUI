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

    // Poll every 5 seconds
    const interval = setInterval(fetchClients, 5000)

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
      <div className="p-4 border-b border-border/50 bg-background/40 backdrop-blur-md">
        <h2 className="text-lg font-bold neon-text mb-4 tracking-wider uppercase">Active Clients</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search network..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-border rounded-lg text-sm transition-all"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-primary/60 space-y-2">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-widest">Synchronizing...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="m-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <p className="text-xs font-mono text-destructive uppercase">Connection Error: {error}</p>
        </div>
      )}

      {/* Clients list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {!loading && filteredClients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-xs font-mono uppercase tracking-widest">No nodes detected</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client.id)}
              className={`p-4 rounded-lg border transition-all duration-200 ${selectedClient === client.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 hover:border-primary/40'
                }`}
            >
              {/* Client header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-0.5">{client.hostname}</h3>
                  <code className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-tighter">
                    {client.ip_address}
                  </code>
                </div>
                <div
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border ${
                    client.status === 'online' ? 'border-green-500/20 bg-green-500/5 text-green-400' : 
                    client.status === 'idle' ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400' : 
                    'border-red-500/20 bg-red-500/5 text-red-400'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${client.status === 'online' ? 'bg-green-400' : client.status === 'idle' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  {client.status}
                </div>
              </div>

              {/* Client details */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground/80 mb-4 bg-black/30 p-2 rounded border border-white/5">
                <div className="flex flex-col">
                  <span className="text-primary/40 uppercase">System:</span>
                  <span className="truncate text-foreground/80">{client.os}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-primary/40 uppercase">Identity:</span>
                  <span className="truncate text-foreground/80">{client.username}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 text-[10px] font-bold uppercase tracking-widest py-2 rounded border border-primary/30 hover:bg-primary hover:text-black transition-all duration-300">
                  Interact
                </button>
                <button
                  onClick={(e) => handleDelete(client.id, e)}
                  className="px-3 py-2 rounded bg-destructive/10 border border-destructive/20 hover:bg-destructive hover:text-white transition-all duration-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats footer */}
      <div className="p-4 border-t border-primary/20 bg-black/60 backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-primary/50 uppercase tracking-widest">Nodes Online</span>
            <span className="text-xl font-bold neon-text">
              {clients.filter((c) => c.status === 'online').length.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Global Fleet</span>
            <span className="text-xl font-bold text-foreground/60">{clients.length.toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
