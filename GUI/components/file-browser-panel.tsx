'use client'

import { useState, useEffect, useRef, useCallback, DragEvent } from 'react'
import {
  Folder, File, HardDrive, ArrowLeft, ArrowUp, RefreshCw, Upload,
  Download, Trash2, Edit2, Plus, FolderPlus, Home, ChevronRight,
  AlertCircle, Lock, FileText, FileCode, FileImage, FileArchive,
  Film, Music, Eye, X, Search, LayoutGrid, List, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FileItem {
  name: string
  path: string
  is_dir: boolean
  size: number
  modified: number
  permissions?: string
}

interface BrowseResult {
  current_path: string
  parent: string
  items: FileItem[]
  error?: string
}

interface Drive {
  root: string
  label?: string
  type?: number
  fs?: string
  total?: number
  free?: number
  percent?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`
}

function formatDate(ts: number): string {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}

const EXT_ICONS: Record<string, React.ElementType> = {
  txt: FileText, md: FileText, log: FileText,
  js: FileCode, ts: FileCode, jsx: FileCode, tsx: FileCode, py: FileCode,
  html: FileCode, css: FileCode, json: FileCode, xml: FileCode,
  png: FileImage, jpg: FileImage, jpeg: FileImage, gif: FileImage, bmp: FileImage, ico: FileImage,
  zip: FileArchive, rar: FileArchive, '7z': FileArchive, tar: FileArchive, gz: FileArchive,
  mp4: Film, mkv: Film, avi: Film, mov: Film,
  mp3: Music, wav: Music, flac: Music,
}

function getFileIcon(item: FileItem): React.ElementType {
  if (item.is_dir) return Folder
  const ext = item.name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_ICONS[ext] ?? File
}

function getFileIconColor(item: FileItem): string {
  if (item.is_dir) return 'text-yellow-400'
  const ext = item.name.split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) return 'text-pink-400'
  if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return 'text-purple-400'
  if (['mp3', 'wav', 'flac'].includes(ext)) return 'text-blue-300'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'text-orange-400'
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css'].includes(ext)) return 'text-green-400'
  return 'text-slate-400'
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FileBrowserPanel({ selectedClient, onEdit }: { selectedClient: string | null; onEdit?: (path: string) => void }) {
  const [drives, setDrives] = useState<Drive[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [parentPath, setParentPath] = useState('')
  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [ctxMenu, setCtxMenu] = useState<{ x: number, y: number, item: FileItem } | null>(null)
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [newFolderMode, setNewFolderMode] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Load drives ─────────────────────────────────────────────────────────────
  const loadDrives = useCallback(async () => {
    if (!selectedClient) return
    try {
      const r = await fetch(`/api/filebrowser?action=list_drives&clientId=${selectedClient}`)
      const d = await r.json()
      if (d.drives) setDrives(d.drives)
    } catch {}
  }, [selectedClient])

  // ── Browse a path ────────────────────────────────────────────────────────────
  const browse = useCallback(async (p: string, pushHistory = true) => {
    if (!selectedClient) return
    setLoading(true)
    setError(null)
    setSearch('')
    setSelectedItems(new Set())
    try {
      const encoded = encodeURIComponent(p)
      const r = await fetch(`/api/filebrowser?action=browse&clientId=${selectedClient}&path=${encoded}`)
      const d: BrowseResult = await r.json()
      if (d.error) { setError(d.error); setLoading(false); return }
      setItems(d.items || [])
      setCurrentPath(d.current_path)
      setParentPath(d.parent)
      if (pushHistory && p) setHistory(h => [...h, p])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [selectedClient])

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedClient) {
      loadDrives()
      setDrives([])
      setCurrentPath('')
      setItems([])
      setHistory([])
    }
  }, [selectedClient, loadDrives])

  // ── Path breadcrumbs ─────────────────────────────────────────────────────────
  const breadcrumbs = (): { label: string; path: string }[] => {
    if (!currentPath) return []
    const sep = currentPath.includes('\\') ? '\\' : '/'
    const parts = currentPath.split(sep).filter(Boolean)
    const crumbs: { label: string; path: string }[] = []
    if (currentPath.match(/^[A-Z]:\\/i)) {
      crumbs.push({ label: parts[0] + '\\', path: parts[0] + '\\' })
      let acc = parts[0] + '\\'
      for (let i = 1; i < parts.length; i++) {
        acc += parts[i] + '\\'
        crumbs.push({ label: parts[i], path: acc })
      }
    } else {
      let acc = '/'
      crumbs.push({ label: '/', path: '/' })
      for (const p of parts) {
        acc += p + '/'
        crumbs.push({ label: p, path: acc })
      }
    }
    return crumbs
  }

  // ── Download file ─────────────────────────────────────────────────────────────
  const downloadFile = async (item: FileItem) => {
    try {
      setUploadProgress(`Downloading ${item.name}…`)
      const encoded = encodeURIComponent(item.path)
      const r = await fetch(`/api/filebrowser?action=download&clientId=${selectedClient}&path=${encoded}`)
      if (r.headers.get('content-type')?.includes('octet-stream')) {
        const blob = await r.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = item.name; a.click()
        URL.revokeObjectURL(url)
        setUploadProgress(null)
      } else {
        const j = await r.json()
        setUploadProgress(j.message || j.error || null)
        setTimeout(() => setUploadProgress(null), 4000)
      }
    } catch (e: any) {
      setUploadProgress(`Error: ${e.message}`)
      setTimeout(() => setUploadProgress(null), 4000)
    }
  }

  // ── Upload ───────────────────────────────────────────────────────────────────
  const uploadFiles = async (files: FileList | File[]) => {
    if (!selectedClient || !currentPath) return
    for (const file of Array.from(files)) {
      setUploadProgress(`Uploading ${file.name}…`)
      const reader = new FileReader()
      reader.onload = async () => {
        const b64 = (reader.result as string).split(',')[1]
        const r = await fetch('/api/filebrowser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload',
            clientId: selectedClient,
            filename: file.name,
            targetPath: currentPath,
            data: b64,
          }),
        })
        const d = await r.json()
        if (d.error) {
          setUploadProgress(`Error: ${d.error}`)
        } else {
          setUploadProgress(`✓ ${file.name} uploaded`)
          browse(currentPath, false)
        }
        setTimeout(() => setUploadProgress(null), 3000)
      }
      reader.readAsDataURL(file)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteItem = async (item: FileItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    const r = await fetch('/api/filebrowser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', clientId: selectedClient, path: item.path }),
    })
    const d = await r.json()
    if (d.error) setError(d.error)
    else browse(currentPath, false)
  }

  // ── Rename ────────────────────────────────────────────────────────────────────
  const confirmRename = async () => {
    if (!renameTarget || !renameValue.trim()) return
    const sep = currentPath.includes('\\') ? '\\' : '/'
    const newPath = currentPath.replace(/[/\\]$/, '') + sep + renameValue.trim()
    const r = await fetch('/api/filebrowser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rename', clientId: selectedClient, path: renameTarget.path, newPath }),
    })
    const d = await r.json()
    if (d.error) setError(d.error)
    else browse(currentPath, false)
    setRenameTarget(null)
    setRenameValue('')
  }

  // ── New Folder ────────────────────────────────────────────────────────────────
  const confirmNewFolder = async () => {
    if (!newFolderName.trim()) return
    const sep = currentPath.includes('\\') ? '\\' : '/'
    const newPath = currentPath.replace(/[/\\]$/, '') + sep + newFolderName.trim()
    const r = await fetch('/api/filebrowser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mkdir', clientId: selectedClient, path: newPath }),
    })
    const d = await r.json()
    if (d.error) setError(d.error)
    else browse(currentPath, false)
    setNewFolderMode(false)
    setNewFolderName('')
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const onDragLeave = () => setIsDragOver(false)
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }

  // ── Context menu ─────────────────────────────────────────────────────────────
  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY, item })
  }

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  // ─────────────────────────────────────────────────────────────────────────────
  if (!selectedClient) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black/20 backdrop-blur-3xl p-20 text-center animate-in fade-in duration-1000">
        <div className="relative mb-8">
           <HardDrive className="w-24 h-24 text-primary/10" />
           <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary animate-pulse" />
           </div>
        </div>
        <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter mb-2">Node_Locked</h2>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest max-w-xs leading-loose">
          Secure connection required. Select an active uplink from the primary terminal to browse the remote kernel.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col h-full bg-black/40 backdrop-blur-3xl text-foreground select-none relative transition-all duration-500 overflow-hidden ${isDragOver ? 'ring-4 ring-primary ring-inset' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md pointer-events-none border-4 border-primary border-dashed m-4 rounded-3xl animate-in zoom-in-95">
          <div className="text-primary text-2xl font-black flex flex-col items-center gap-6 uppercase tracking-[0.3em]">
            <div className="p-8 bg-black/60 rounded-full shadow-[0_0_50px_rgba(0,240,255,0.3)] animate-bounce">
              <Upload className="w-12 h-12" />
            </div>
            Infiltrate_Files...
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="flex items-center gap-1">
          <button
            onClick={() => { if (history.length > 1) { const h = [...history]; h.pop(); setHistory(h); browse(h[h.length - 1] || currentPath, false) } }}
            disabled={history.length <= 1}
            className="p-2 rounded-xl hover:bg-white/5 disabled:opacity-30 transition-all active:scale-95"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={() => parentPath && browse(parentPath)}
            disabled={!parentPath || parentPath === currentPath}
            className="p-2 rounded-xl hover:bg-white/5 disabled:opacity-30 transition-all active:scale-95"
            title="Up"
          >
            <ArrowUp className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={() => currentPath && browse(currentPath, false)}
            className="p-2 rounded-xl hover:bg-white/5 transition-all text-primary/60 hover:text-primary"
            title="Refresh"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>

        {/* Breadcrumb - Holographic Style */}
        <div className="flex-1 flex items-center gap-2 bg-black/20 rounded-xl px-4 py-2 border border-white/5 overflow-x-auto custom-scrollbar shadow-inner group-focus-within:border-primary/30 transition-all">
          <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] pointer-events-none">ROOT:</span>
          {currentPath ? breadcrumbs().map((crumb, i, arr) => (
            <span key={i} className="flex items-center gap-2 flex-shrink-0 group">
              <button
                onClick={() => browse(crumb.path)}
                className={`text-[11px] font-mono transition-all uppercase tracking-tight py-1 px-2 rounded-md ${i === arr.length - 1 ? 'text-primary font-black bg-primary/10 shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'text-foreground/40 hover:text-foreground hover:bg-white/5'}`}
              >
                {crumb.label.replace(/[\\/]/g, '') || '/'}
              </button>
              {i < arr.length - 1 && <span className="text-white/10 font-black">/</span>}
            </span>
          )) : <span className="text-[10px] font-mono text-muted-foreground animate-pulse uppercase tracking-[0.3em]">Select_Node_Mount...</span>}
        </div>

        {/* Actions - Secondary Theme */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewFolderMode(true)}
            disabled={!currentPath}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-yellow-400/20 text-yellow-400 border border-white/10 hover:border-yellow-400/40 transition-all active:scale-95 disabled:opacity-20 flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">New_Cluster</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!currentPath}
            className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all active:scale-95 disabled:opacity-20 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Push_Payload</span>
          </button>
          <div className="w-px h-6 bg-white/5 mx-2" />
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => e.target.files && uploadFiles(e.target.files)} />
      </div>

      {/* ── Search bar ── */}
      {currentPath && (
        <div className="px-6 py-3 border-b border-white/5 bg-black/20 flex-shrink-0 animate-in slide-in-from-top-2">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="SEARCH_KERNEL_FEED..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-11 pr-10 py-3 text-xs text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10 transition-all font-mono uppercase"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Drives sidebar ── */}
        <div className="w-72 flex-shrink-0 border-r border-white/5 bg-black/40 backdrop-blur-3xl overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <div>
            <p className="text-[10px] font-black text-primary/40 px-3 py-2 uppercase tracking-[0.4em] mb-2">Mass_Storage</p>
            {drives.length === 0 && (
              <button
                onClick={loadDrives}
                className="w-full text-[10px] font-mono text-muted-foreground px-3 py-4 rounded-xl border border-dashed border-white/10 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all flex flex-col items-center gap-2 group"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" /> 
                PROBE_HARDWARE
              </button>
            )}
            <div className="space-y-2">
              {drives.map(d => (
                <button
                  key={d.root}
                  onClick={() => browse(d.root)}
                  className={`w-full text-left p-4 rounded-2xl flex items-start gap-4 transition-all border group ${currentPath.startsWith(d.root) ? 'bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(0,240,255,0.05)]' : 'hover:bg-white/5 border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  <div className={`p-2.5 rounded-xl transition-all ${currentPath.startsWith(d.root) ? 'bg-primary/20 text-primary' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black truncate uppercase tracking-tighter group-hover:text-primary transition-colors">{d.label || d.root}</div>
                    <div className="text-[10px] font-mono text-muted-foreground/60 truncate uppercase">{d.root}</div>
                    {d.total && d.total > 0 && (
                      <div className="mt-3 w-full bg-white/5 rounded-full h-1 overflow-hidden border border-white/5">
                        <div className="bg-primary h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,240,255,0.5)]" style={{ width: `${d.percent ?? 0}%` }} />
                      </div>
                    )}
                    {d.free && d.total && (
                      <div className="text-[9px] font-mono text-muted-foreground mt-1.5 flex justify-between uppercase opacity-40">
                         <span>Avail: {formatBytes(d.free)}</span>
                         <span>{d.percent}%</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="pt-4">
            <p className="text-[10px] font-black text-white/20 px-3 py-2 uppercase tracking-[0.4em] mb-2">Access_Points</p>
            <div className="grid grid-cols-1 gap-1">
              {[
                { label: 'Desktop', path: '%USERPROFILE%\\Desktop' },
                { label: 'Downloads', path: '%USERPROFILE%\\Downloads' },
                { label: 'Documents', path: '%USERPROFILE%\\Documents' },
                { label: 'Pictures', path: '%USERPROFILE%\\Pictures' },
                { label: 'Videos', path: '%USERPROFILE%\\Videos' },
                { label: 'Temp', path: '%TEMP%' },
                { label: 'Sys_32', path: 'C:\\Windows\\System32' },
              ].map(q => (
                <button
                  key={q.label}
                  onClick={() => browse(q.path)}
                  className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/5 text-[10px] text-muted-foreground font-bold hover:text-foreground transition-all flex items-center gap-3 group uppercase tracking-widest"
                >
                  <Folder className="w-3.5 h-3.5 text-yellow-500/40 group-hover:text-yellow-400 group-hover:scale-110 transition-all" /> {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: File list ── */}
        <div className="flex-1 overflow-y-auto bg-black/10 selection:bg-primary/20 custom-scrollbar">
          {/* New folder input */}
          {newFolderMode && (
            <div className="mx-8 mt-6 p-4 glass-card rounded-2xl border-yellow-500/30 flex items-center gap-4 animate-in zoom-in-95 duration-200">
              <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <FolderPlus className="w-5 h-5 text-yellow-500" />
              </div>
              <input
                autoFocus
                type="text"
                placeholder="CLUSTER_NAME..."
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmNewFolder(); if (e.key === 'Escape') { setNewFolderMode(false); setNewFolderName('') } }}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/20 focus:outline-none font-mono uppercase"
              />
              <div className="flex gap-2">
                <Button onClick={confirmNewFolder} size="sm" className="bg-yellow-500 text-black hover:bg-yellow-400 font-black uppercase text-[10px] px-4 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.2)]">Establish</Button>
                <Button onClick={() => { setNewFolderMode(false); setNewFolderName('') }} size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground font-black uppercase text-[10px] px-4 rounded-lg">Abort</Button>
              </div>
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress && (
            <div className="mx-8 mt-6 p-4 glass-card rounded-2xl border-primary/30 text-xs text-primary flex items-center gap-4 animate-in slide-in-from-left-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex flex-col gap-1">
                 <span className="font-black uppercase tracking-widest text-[10px]">Data_Stream_Active</span>
                 <span className="font-mono opacity-80">{uploadProgress}</span>
              </div>
            </div>
          )}

          {/* List view */}
          {!loading && currentPath && viewMode === 'list' && (
            <div className="p-6">
              <div className="glass-card rounded-2xl border-white/5 overflow-hidden">
                <div className="grid grid-cols-[3fr_1fr_1.5fr_auto] gap-4 px-8 py-4 bg-white/[0.02] border-b border-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                  <span>Metadata</span>
                  <span>Mass</span>
                  <span>Timestamp</span>
                  <span className="text-right">Access</span>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {sorted.length === 0 && (
                    <div className="text-center py-24 flex flex-col items-center gap-4 opacity-10">
                       <Folder className="w-16 h-16" />
                       <p className="text-[10px] font-black tracking-[0.5em] uppercase">Sector_Empty</p>
                    </div>
                  )}
                  {sorted.map(item => {
                    const Icon = getFileIcon(item)
                    const iconColor = getFileIconColor(item)
                    const isRenaming = renameTarget?.path === item.path
                    const isSelected = selectedItems.has(item.path)
                    return (
                      <div
                        key={item.path}
                        onDoubleClick={() => item.is_dir && browse(item.path)}
                        onContextMenu={e => handleContextMenu(e, item)}
                        onClick={() => {
                          setSelectedItems(prev => {
                            const n = new Set(prev)
                            n.has(item.path) ? n.delete(item.path) : n.add(item.path)
                            return n
                          })
                        }}
                        className={`grid grid-cols-[3fr_1fr_1.5fr_auto] gap-4 items-center px-8 py-4 cursor-pointer transition-all border-l-4 group
                          ${isSelected ? 'bg-primary/5 border-l-primary' : 'hover:bg-white/[0.03] border-l-transparent'}`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`p-2.5 rounded-xl transition-all ${isSelected ? 'bg-primary/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor} group-hover:scale-110 transition-transform`} />
                          </div>
                          {isRenaming ? (
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') { setRenameTarget(null) } }}
                              onClick={e => e.stopPropagation()}
                              className="flex-1 bg-black/40 border border-primary/50 rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono uppercase"
                            />
                          ) : (
                            <div className="flex flex-col min-w-0">
                               <span className={`text-sm font-bold truncate group-hover:text-primary transition-colors ${item.is_dir ? 'text-foreground' : 'text-foreground/80'}`}>{item.name.toUpperCase()}</span>
                               <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-tighter">{item.permissions || (item.is_dir ? 'Directory Cluster' : 'Binary_Asset')}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{item.is_dir ? '<DIR>' : formatBytes(item.size)}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-60">{formatDate(item.modified)}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          {!item.is_dir && (
                            <button
                              onClick={e => { e.stopPropagation(); downloadFile(item) }}
                              className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-black transition-all"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); setRenameTarget(item); setRenameValue(item.name) }}
                            className="p-2 rounded-lg bg-white/5 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); deleteItem(item) }}
                            className="p-2 rounded-lg bg-white/5 text-red-500 hover:bg-red-500 hover:text-black transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Grid view - Industrial Cell Style */}
          {!loading && currentPath && viewMode === 'grid' && (
            <div className="p-8 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6">
              {sorted.map(item => {
                const Icon = getFileIcon(item)
                const iconColor = getFileIconColor(item)
                const isSelected = selectedItems.has(item.path)
                return (
                  <div
                    key={item.path}
                    onDoubleClick={() => item.is_dir && browse(item.path)}
                    onContextMenu={e => handleContextMenu(e, item)}
                    onClick={() => {
                      setSelectedItems(prev => {
                        const n = new Set(prev)
                        n.has(item.path) ? n.delete(item.path) : n.add(item.path)
                        return n
                      })
                    }}
                    className={`flex flex-col items-center gap-4 p-6 glass-card rounded-2xl cursor-pointer transition-all border group relative
                      ${isSelected ? 'bg-primary/10 border-primary/30 ring-4 ring-primary/5' : 'hover:bg-white/5 border-transparent hover:border-white/10'}`}
                  >
                    <div className={`p-4 rounded-2xl transition-all ${isSelected ? 'bg-primary/20 text-primary' : 'bg-black/20 group-hover:bg-white/5 group-hover:scale-110'}`}>
                      <Icon className={`w-10 h-10 ${iconColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`} />
                    </div>
                    <div className="text-center w-full min-w-0">
                       <p className={`text-[10px] font-black uppercase tracking-tight line-clamp-2 leading-relaxed transition-colors ${isSelected ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'}`}>
                         {item.name}
                       </p>
                       {!item.is_dir && <p className="text-[9px] font-mono text-muted-foreground/40 mt-1 uppercase">{formatBytes(item.size)}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status bar - Tech Info */}
      {currentPath && (
        <div className="px-6 py-3 border-t border-white/5 bg-black/40 backdrop-blur-xl flex items-center gap-6 text-[9px] font-black text-muted-foreground flex-shrink-0 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <span>FS_OBJECTS: <span className="text-foreground">{sorted.length}</span></span>
          </div>
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 text-primary animate-pulse">
               <div className="w-1.5 h-1.5 rounded-full bg-primary" />
               <span>ACTIVE_SELECTION: {selectedItems.size}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-3">
             <span className="opacity-40">SIGNAL_PATH:</span>
             <span className="text-primary/60 font-mono tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/5">{currentPath}</span>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {ctxMenu && (
        <div
          className="fixed z-[100] glass-card min-w-[200px] py-2 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border-primary/20 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-white/5 mb-1">
             <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.3em] mb-1">Kernel_Action</p>
             <p className="text-[11px] font-bold text-foreground truncate">{ctxMenu.item.name.toUpperCase()}</p>
          </div>
          <div className="p-1 space-y-0.5">
            {!ctxMenu.item.is_dir && (
              <button
                onClick={() => { downloadFile(ctxMenu?.item as FileItem); setCtxMenu(null) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black text-foreground/80 hover:text-primary hover:bg-primary/10 rounded-lg transition-all uppercase tracking-widest"
              >
                <Download className="w-4 h-4" /> Pull_Data
              </button>
            )}
            {!ctxMenu.item.is_dir && onEdit && (
              <button
                onClick={() => { onEdit(ctxMenu?.item.path as string); setCtxMenu(null) }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black text-foreground/80 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all uppercase tracking-widest"
              >
                <FileText className="w-4 h-4" /> Edit_Raw
              </button>
            )}
            <button
              onClick={() => { setRenameTarget(ctxMenu?.item as FileItem); setRenameValue(ctxMenu?.item.name ?? ''); setCtxMenu(null) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black text-foreground/80 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all uppercase tracking-widest"
            >
              <Edit2 className="w-4 h-4" /> Alter_ID
            </button>
            <div className="h-px bg-white/5 my-1 mx-2" />
            <button
              onClick={() => { deleteItem(ctxMenu?.item as FileItem); setCtxMenu(null) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black text-red-400 hover:text-red-100 hover:bg-red-500/20 rounded-lg transition-all uppercase tracking-widest"
            >
              <Trash2 className="w-4 h-4" /> Terminate
            </button>
          </div>
        </div>
      )}

      {/* Global Click Handler to close Context Menu */}
      {ctxMenu && <div className="fixed inset-0 z-[90]" onClick={() => setCtxMenu(null)} />}
    </div>
  )
}
