import { useCallback, useState, useMemo } from 'react'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(
    async <T,>(
      url: string,
      options?: {
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
        body?: any
      }
    ): Promise<ApiResponse<T>> => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(url, {
          method: options?.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: options?.body ? JSON.stringify(options.body) : undefined,
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'An error occurred')
          return { success: false, error: data.error }
        }

        return data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { request, loading, error }
}

// Specific API hooks
export function useClients() {
  const { request, loading, error } = useApi()

  const methods = useMemo(() => ({
    listClients: () => request('/api/clients/list'),
    registerClient: (data: any) =>
      request('/api/clients/register', { method: 'POST', body: data }),
    getClientInfo: (id: string) => request(`/api/clients/${id}/info`),
    deleteClient: (id: string) =>
      request(`/api/clients/${id}/delete`, { method: 'DELETE' }),
  }), [request])

  return { ...methods, loading, error }
}

export function useCommands() {
  const { request, loading, error } = useApi()

  const methods = useMemo(() => ({
    queueCommand: (data: any) =>
      request('/api/commands/queue', { method: 'POST', body: data }),
    listCommands: (clientId?: string, status?: string) => {
      const params = new URLSearchParams()
      if (clientId) params.append('client_id', clientId)
      if (status) params.append('status', status)
      return request(`/api/commands/list?${params.toString()}`)
    },
    getCommandStatus: (id: string) => request(`/api/commands/${id}/status`),
    updateCommandStatus: (id: string, data: any) =>
      request(`/api/commands/${id}/status`, { method: 'POST', body: data }),
    cancelCommand: (id: string) =>
      request(`/api/commands/${id}/cancel`, { method: 'DELETE' }),
  }), [request])

  return { ...methods, loading, error }
}

export function useMetrics() {
  const { request, loading, error } = useApi()

  const methods = useMemo(() => ({
    updateMetrics: (data: any) =>
      request('/api/system/metrics/update', { method: 'POST', body: data }),
    getMetrics: (type: 'latest' | 'timeseries' | 'aggregate' = 'latest', clientId?: string, hours = 24, limit = 0) => {
      if (clientId) {
        return request(`/api/system/${clientId}/metrics?type=${type}&hours=${hours}${limit > 0 ? `&limit=${limit}` : ''}`)
      }
      return request('/api/system/metrics')
    },
  }), [request])

  return { ...methods, loading, error }
}

export function useFiles() {
  const { request, loading, error } = useApi()

  const methods = useMemo(() => ({
    createFileOperation: (data: any) =>
      request('/api/files/operations', { method: 'POST', body: data }),
    listFiles: (clientId?: string, operation?: string, status?: string) => {
      const params = new URLSearchParams()
      if (clientId) params.append('client_id', clientId)
      if (operation) params.append('operation', operation)
      if (status) params.append('status', status)
      return request(`/api/files/list?${params.toString()}`)
    },
    getFileStatus: (id: string) => request(`/api/files/${id}/status`),
    updateFileStatus: (id: string, data: any) =>
      request(`/api/files/${id}/status`, { method: 'POST', body: data }),
  }), [request])

  return { ...methods, loading, error }
}

export function useLoot() {
  const { request, loading, error } = useApi()

  const methods = useMemo(() => ({
    listLoot: (dir?: string) => {
        const params = new URLSearchParams()
        if (dir) params.append('dir', dir)
        return request(`/api/loot?${params.toString()}`)
    },
    getLootStats: () => request('/api/loot?action=stats'),
    viewLootFile: (file: string) => `/api/loot/view?file=${encodeURIComponent(file)}`,
  }), [request])

  return { ...methods, loading, error }
}

export function useDashboard() {
  const { request, loading, error } = useApi()

  const methods = useMemo(() => ({
    getOverview: () => request('/api/dashboard/overview'),
    getHealth: () => request('/api/dashboard/health'),
  }), [request])

  return { ...methods, loading, error }
}

export function useTestMockClient() {
  const { request, loading, error } = useApi()

  const methods = useMemo(() => ({
    registerMockClients: (count = 1) =>
      request('/api/test/mock-client', { method: 'POST', body: { action: 'register', count } }),
    recordMockMetrics: () =>
      request('/api/test/mock-client', { method: 'POST', body: { action: 'metrics' } }),
    queueMockCommands: (count = 1) =>
      request('/api/test/mock-client', { method: 'POST', body: { action: 'commands', count } }),
    cleanup: () =>
      request('/api/test/mock-client', { method: 'POST', body: { action: 'cleanup' } }),
  }), [request])

  return { ...methods, loading, error }
}
