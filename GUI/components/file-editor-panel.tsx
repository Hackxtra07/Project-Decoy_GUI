'use client'

import { useState, useEffect } from 'react'
import { FileText, Save, RotateCcw, Search, X, Loader2, Check, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FileEditorPanelProps {
  selectedClient: string | null
  initialPath: string | null
}

export default function FileEditorPanel({ selectedClient, initialPath }: FileEditorPanelProps) {
  const [path, setPath] = useState(initialPath || '')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    if (initialPath) {
      setPath(initialPath)
      loadFile(initialPath)
    }
  }, [initialPath, selectedClient])

  const loadFile = async (targetPath = path) => {
    if (!selectedClient || !targetPath) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/filebrowser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read',
          clientId: selectedClient,
          path: targetPath
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setContent(data.content)
      setPath(data.path || targetPath)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveFile = async () => {
    if (!selectedClient || !path) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/filebrowser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'write',
          clientId: selectedClient,
          path,
          content
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSuccess('File saved successfully')
      setLastSaved(new Date())
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the editor?')) {
      setContent('')
    }
  }

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-12 text-center max-w-md bg-card/50 border-white/5 backdrop-blur-xl">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-bold mb-2 tracking-tight">No Client Selected</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">Select a client from the Uplink panel to initiate remote file editing.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-transparent text-foreground animate-in fade-in duration-500">
      {/* Header / Toolbar */}
      <div className="p-6 border-b border-white/5 bg-white/[0.01] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-[0.2em] uppercase text-primary/80 flex items-center gap-2">
                REMOTE_FILE_EDITOR
                {loading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
              </h2>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
                {lastSaved ? `LAST_SYNC: ${lastSaved.toLocaleTimeString()}` : 'AWAITING_INPUT'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadFile()}
              disabled={loading || saving || !path}
              className="bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-bold tracking-widest uppercase py-5"
            >
              <RotateCcw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> RELOAD
            </Button>
            <Button
              onClick={saveFile}
              disabled={loading || saving || !path}
              className="bg-primary text-black hover:bg-primary/90 text-[10px] font-bold tracking-widest uppercase py-5 px-6 shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all active:scale-95"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
              {saving ? 'SAVING...' : 'SAVE_CHANGES'}
            </Button>
          </div>
        </div>

        {/* Path Input */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-[10px] tracking-tighter opacity-50 flex items-center gap-2">
             <Search className="w-3 h-3" /> PATH:
          </div>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadFile()}
            placeholder="C:\Windows\System32\drivers\etc\hosts"
            className="w-full pl-20 pr-6 py-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-2xl text-[11px] text-white font-mono transition-all focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 placeholder:text-muted-foreground/10"
          />
        </div>
      </div>

      {/* Editor Main Area */}
      <div className="flex-1 p-6 relative min-h-0">
        <div className="h-full flex flex-col border border-white/5 rounded-2xl overflow-hidden bg-black/40 shadow-2xl relative group">
          {/* Editor Header */}
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 mr-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase truncate max-w-[400px]">
                {path.split(/[\\/]/).pop() || 'untitled.txt'}
              </span>
            </div>
            <button 
              onClick={handleClear}
              className="text-[9px] font-black text-muted-foreground hover:text-red-500 transition-colors tracking-widest flex items-center gap-2"
            >
              <X className="w-3 h-3" /> CLEAR_BUFFER
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            spellCheck={false}
            className="flex-1 w-full bg-transparent p-6 text-sm font-mono text-white/80 focus:outline-none resize-none custom-scrollbar selection:bg-primary/30 leading-relaxed"
            placeholder={loading ? "Initiating secure uplink..." : "Waiting for file target path..."}
          />
          
          {/* Status Bar */}
          <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-muted-foreground tracking-widest">
            <div className="flex items-center gap-6">
               <span>CHARS: {content.length}</span>
               <span>LINES: {content.split('\n').length}</span>
            </div>
            <div className="flex items-center gap-4">
               {error && (
                 <span className="text-red-400 flex items-center gap-1.5 animate-pulse">
                   <AlertCircle className="w-3 h-3" /> {error.toUpperCase()}
                 </span>
               )}
               {success && (
                 <span className="text-green-400 flex items-center gap-1.5">
                   <Check className="w-3 h-3" /> {success.toUpperCase()}
                 </span>
               )}
               <span className="opacity-40">UTF-8 // CRLF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
