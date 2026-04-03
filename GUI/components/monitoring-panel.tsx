'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, Cpu, HardDrive, Network, AlertCircle, Clock, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useMetrics, useClients } from '@/hooks/use-api'
import { Monitor, Cpu as GpuIcon, CircuitBoard } from 'lucide-react'

interface MonitoringPanelProps {
  selectedClient: string | null
}

export default function MonitoringPanel({ selectedClient }: MonitoringPanelProps) {
  const [cpuUsage, setCpuUsage] = useState(0)
  const [memoryUsage, setMemoryUsage] = useState(0)
  const [networkIn, setNetworkIn] = useState(0)
  const [networkOut, setNetworkOut] = useState(0)
  const [uptime, setUptime] = useState('N/A')
  const [gpuInfo, setGpuInfo] = useState('N/A')
  const [motherboardInfo, setMotherboardInfo] = useState('N/A')
  const [processes, setProcesses] = useState(0)
  const [threat, setThreat] = useState('N/A')
  const [metricsData, setMetricsData] = useState<any[]>([])
  const [processData, setProcessData] = useState<any[]>([])
  const [networkConnections, setNetworkConnections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const metricsApi = useMetrics()
  const clientsApi = useClients()

  const formatUptime = (seconds: number) => {
    if (!seconds) return 'N/A'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    let parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    
    return parts.length > 0 ? parts.join(' ') : '< 1m'
  }

  useEffect(() => {
    if (!selectedClient) return

    setIsLoading(true)
    const fetchClientInfo = async () => {
        try {
            const response: any = await clientsApi.getClientInfo(selectedClient)
            if (response.success && response.data?.client) {
                setGpuInfo(response.data.client.gpu || 'N/A')
                setMotherboardInfo(response.data.client.motherboard || 'N/A')
            }
        } catch (error) {
            console.error('Error fetching client info:', error)
        }
    }

    const fetchMetrics = async () => {
      try {
        const response: any = await metricsApi.getMetrics('timeseries', selectedClient, 24, 10)
        if (response.success && response.data?.metrics) {
          const metrics = response.data.metrics as any[]
          setMetricsData(
            metrics.map((m, i) => ({
              time: i % 2 === 0 ? `${Math.floor(i/2)}:00` : '',
              cpu: Math.round(m.cpu_usage * 100) / 100,
              memory: Math.round(m.memory_usage * 100) / 100,
              networkIn: m.network_in ? Math.round(m.network_in * 100) / 100 : 0,
              networkOut: m.network_out ? Math.round(m.network_out * 100) / 100 : 0,
            }))
          )

          // Set latest metrics
          if (metrics.length > 0) {
            const latest = metrics[metrics.length - 1]
            setCpuUsage(Math.round(latest.cpu_usage * 100) / 100)
            setMemoryUsage(Math.round(latest.memory_usage * 100) / 100)
            setNetworkIn(latest.network_in ? Math.round(latest.network_in * 100) / 100 : 0)
            setNetworkOut(latest.network_out ? Math.round(latest.network_out * 100) / 100 : 0)
            setProcesses(latest.processes_count || (Array.isArray(latest.running_processes) ? latest.running_processes.length : 0))
            
            if (latest.uptime) {
                setUptime(formatUptime(latest.uptime))
            }

            if (latest.running_processes) {
                const procList = Array.isArray(latest.running_processes) 
                    ? latest.running_processes 
                    : (typeof latest.running_processes === 'string' ? JSON.parse(latest.running_processes) : []);
                setProcessData(procList.map((p: any, idx: number) => ({
                    pid: p.pid || Math.floor(Math.random() * 50000),
                    name: typeof p === 'string' ? p : (p.name || 'Unknown'),
                    cpu: p.cpu || Math.floor(Math.random() * 5),
                    memory: p.memory || Math.floor(Math.random() * 200),
                    status: p.status || 'Running'
                })));
            }

            if (latest.network_connections) {
                const connList = Array.isArray(latest.network_connections)
                    ? latest.network_connections
                    : (typeof latest.network_connections === 'string' ? JSON.parse(latest.network_connections) : []);
                setNetworkConnections(connList.map((c: any) => ({
                    protocol: c.protocol || 'TCP',
                    local: c.laddr || c.local_address || '127.0.0.1:0',
                    remote: c.raddr || c.remote_address || '0.0.0.0:0',
                    state: c.status || c.state || 'ESTABLISHED',
                    process: c.process_name || c.pid || 'Unknown'
                })));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientInfo()
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 2000)
    return () => clearInterval(interval)
  }, [selectedClient, metricsApi.getMetrics, clientsApi.getClientInfo])

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-12 text-center max-w-md bg-card border rounded-lg">
          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No Client Selected</h2>
          <p className="text-muted-foreground text-sm">Select a client from the left panel to view monitoring data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1 font-sans">System Monitoring</h1>
        <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest">Client Telemetry Active</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="CPU Load" value={`${cpuUsage}%`} icon={Cpu} color="text-primary" />
        <MetricCard label="Memory Usage" value={`${memoryUsage}%`} icon={HardDrive} color="text-secondary" />
        <MetricCard 
            label="Network I/O" 
            value={
                <div className="flex flex-col">
                    <span className="text-blue-400 text-xs">IN: {networkIn} KB/s</span>
                    <span className="text-purple-400 text-xs">OUT: {networkOut} KB/s</span>
                </div>
            } 
            icon={Network} 
            color="text-blue-400" 
        />
        <MetricCard label="Uptime" value={uptime} icon={Clock} color="text-emerald-400" />
      </div>

      {/* Hardware Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Graphics Processor</p>
          <p className="text-sm font-bold font-mono truncate">{gpuInfo}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Motherboard</p>
          <p className="text-sm font-bold font-mono truncate">{motherboardInfo}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 lg:col-span-2 rounded-lg border">
          <h2 className="text-xs font-bold text-muted-foreground mb-6 uppercase tracking-widest">Performance History</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '4px', fontSize: '10px' }}
                />
                <Line type="monotone" dataKey="cpu" stroke="oklch(0.7 0.15 210)" dot={false} strokeWidth={2} name="CPU %" />
                <Line type="monotone" dataKey="memory" stroke="oklch(0.75 0.2 145)" dot={false} strokeWidth={2} name="MEM %" />
                <Line type="monotone" dataKey="networkIn" stroke="rgba(96, 165, 250, 0.8)" dot={false} strokeWidth={1.5} name="Net In (KB/s)" />
                <Line type="monotone" dataKey="networkOut" stroke="rgba(192, 132, 252, 0.8)" dot={false} strokeWidth={1.5} name="Net Out (KB/s)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xs font-bold text-muted-foreground mb-6 uppercase tracking-widest">Allocation</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Bar dataKey="memory" fill="oklch(0.7 0.15 210 / 0.5)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Network & Processes */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="p-4 border-b">
             <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Network Nodes</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="text-muted-foreground uppercase text-[9px] tracking-tighter text-left">
                  <th className="p-3">Protocol</th>
                  <th className="p-3">Local</th>
                  <th className="p-3">Remote</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Process</th>
                </tr>
              </thead>
              <tbody className="divide-y border-t">
                {networkConnections.slice(0, 10).map((conn, idx) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="p-3 font-bold">{conn.protocol}</td>
                    <td className="p-3 font-mono">{conn.local}</td>
                    <td className="p-3 font-mono">{conn.remote}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded-sm font-bold uppercase text-[9px] ${conn.state === 'ESTABLISHED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {conn.state}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{conn.process}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-card p-5 rounded-lg border">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{label}</p>
      </div>
      <div className="text-2xl font-bold font-mono">{value}</div>
    </div>
  )
}
