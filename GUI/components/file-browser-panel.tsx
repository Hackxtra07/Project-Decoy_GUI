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

// ─── Context Menu ─────────────────────────────────────────────────────────────
interface CtxMenuState { x: number; y: number; item: FileItem }

function ContextMenu({
  ctx, onClose, onDownload, onDelete, onRename,
}: {
  ctx: CtxMenuState
  onClose: () => void
  onDownload: (item: FileItem) => void
  onDelete: (item: FileItem) => void
  onRename: (item: FileItem) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-[#1a1f2e] border border-white/10 rounded-lg shadow-2xl py-1 min-w-[160px]"
      style={{ top: ctx.y, left: ctx.x }}
    >
      {!ctx.item.is_dir && (
        <button
          onClick={() => { onDownload(ctx.item); onClose() }}
          className="w-full px-4 py-2 text-sm text-left text-slate-200 hover:bg-white/10 flex items-center gap-2"
        >
          <Download className="w-4 h-4 text-cyan-400" /> Download
        </button>
      )}
      <button
        onClick={() => { onRename(ctx.item); onClose() }}
        className="w-full px-4 py-2 text-sm text-left text-slate-200 hover:bg-white/10 flex items-center gap-2"
      >
        <Edit2 className="w-4 h-4 text-yellow-400" /> Rename
      </button>
      <div className="border-t border-white/10 my-1" />
      <button
        onClick={() => { onDelete(ctx.item); onClose() }}
        className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" /> Delete
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FileBrowserPanel({ selectedClient }: { selectedClient: string | null }) {
  const [drives, setDrives] = useState<Drive[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [parentPath, setParentPath] = useState('')
  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null)
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
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <HardDrive className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-semibold">No client selected</p>
        <p className="text-sm">Select a client from the sidebar to browse its files</p>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col h-full bg-[#0d1117] text-slate-200 select-none relative ${isDragOver ? 'ring-2 ring-cyan-400 ring-inset' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-cyan-900/40 backdrop-blur-sm pointer-events-none">
          <div className="text-cyan-300 text-2xl font-bold flex flex-col items-center gap-3">
            <Upload className="w-12 h-12" />
            Drop files to upload
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#161b27] flex-shrink-0">
        <button
          onClick={() => { if (history.length > 1) { const h = [...history]; h.pop(); setHistory(h); browse(h[h.length - 1] || currentPath, false) } }}
          disabled={history.length <= 1}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => parentPath && browse(parentPath)}
          disabled={!parentPath || parentPath === currentPath}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
          title="Up"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => currentPath && browse(currentPath, false)}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Refresh"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>

        {/* Breadcrumb */}
        <div className="flex-1 flex items-center gap-1 bg-[#0d1117] rounded-lg px-3 py-1.5 border border-white/10 overflow-x-auto text-xs">
          {currentPath ? breadcrumbs().map((crumb, i, arr) => (
            <span key={i} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => browse(crumb.path)}
                className={`hover:text-cyan-400 transition-colors ${i === arr.length - 1 ? 'text-white font-semibold' : 'text-slate-400'}`}
              >
                {crumb.label}
              </button>
              {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600" />}
            </span>
          )) : <span className="text-slate-500">Select a drive to start browsing</span>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setNewFolderMode(true)}
            disabled={!currentPath}
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors text-yellow-400"
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!currentPath}
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors text-cyan-400"
            title="Upload File"
          >
            <Upload className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-slate-400'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-slate-400'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => e.target.files && uploadFiles(e.target.files)} />
      </div>

      {/* ── Search bar ── */}
      {currentPath && (
        <div className="px-4 py-2 border-b border-white/5 bg-[#161b27] flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter files…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0d1117] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-slate-500" /></button>}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Drives sidebar ── */}
        <div className="w-52 flex-shrink-0 border-r border-white/10 bg-[#10141f] overflow-y-auto p-2 space-y-1">
          <p className="text-xs font-semibold text-slate-500 px-2 py-1 uppercase tracking-wider">Drives</p>
          {drives.length === 0 && (
            <button
              onClick={loadDrives}
              className="w-full text-xs text-slate-500 px-2 py-2 rounded hover:bg-white/5 flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> Load drives
            </button>
          )}
          {drives.map(d => (
            <button
              key={d.root}
              onClick={() => browse(d.root)}
              className={`w-full text-left px-2 py-2.5 rounded-lg flex items-start gap-2 transition-colors text-xs ${currentPath.startsWith(d.root) ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/5 text-slate-300'}`}
            >
              <HardDrive className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-500" />
              <div className="min-w-0">
                <div className="font-semibold truncate">{d.label || d.root}</div>
                <div className="text-slate-500 truncate">{d.root}</div>
                {d.total && d.total > 0 && (
                  <div className="mt-1 w-full bg-slate-700 rounded-full h-1">
                    <div className="bg-cyan-500 h-1 rounded-full" style={{ width: `${d.percent ?? 0}%` }} />
                  </div>
                )}
                {d.free && d.total && (
                  <div className="text-[10px] text-slate-500 mt-0.5">{formatBytes(d.free)} free</div>
                )}
              </div>
            </button>
          ))}
          <div className="border-t border-white/5 pt-2 mt-2">
            <p className="text-xs font-semibold text-slate-500 px-2 py-1 uppercase tracking-wider">Quick</p>
            {[
              { label: 'Desktop', path: '%USERPROFILE%\\Desktop' },
              { label: 'Downloads', path: '%USERPROFILE%\\Downloads' },
              { label: 'Documents', path: '%USERPROFILE%\\Documents' },
              { label: 'Pictures', path: '%USERPROFILE%\\Pictures' },
              { label: 'Music', path: '%USERPROFILE%\\Music' },
              { label: 'Videos', path: '%USERPROFILE%\\Videos' },
              { label: 'Temp', path: '%TEMP%' },
              { label: 'System32', path: 'C:\\Windows\\System32' },
            ].map(q => (
              <button
                key={q.label}
                onClick={() => browse(q.path)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-slate-400 flex items-center gap-2"
              >
                <Folder className="w-3.5 h-3.5 text-yellow-400/70" /> {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: File list ── */}
        <div className="flex-1 overflow-y-auto">
          {/* New folder input */}
          {newFolderMode && (
            <div className="px-4 py-2 border-b border-white/10 bg-yellow-500/5 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-yellow-400" />
              <input
                autoFocus
                type="text"
                placeholder="New folder name…"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmNewFolder(); if (e.key === 'Escape') { setNewFolderMode(false); setNewFolderName('') } }}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
              />
              <button onClick={confirmNewFolder} className="text-xs px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/30">Create</button>
              <button onClick={() => { setNewFolderMode(false); setNewFolderName('') }} className="text-xs px-2 py-1 hover:bg-white/10 rounded text-slate-400">Cancel</button>
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress && (
            <div className="mx-4 mt-3 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs text-cyan-300 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
              {uploadProgress}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-4 mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !currentPath && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600">
              <HardDrive className="w-12 h-12 mb-3" />
              <p className="text-sm">Select a drive from the left panel to start browsing</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-32 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm">Loading…</span>
            </div>
          )}

          {/* List view */}
          {!loading && currentPath && viewMode === 'list' && (
            <div className="p-2">
              {/* Header */}
              <div className="grid grid-cols-[2fr_1fr_1.5fr_auto] gap-2 px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-white/5 mb-1">
                <span>Name</span>
                <span>Size</span>
                <span>Modified</span>
                <span>Actions</span>
              </div>
              {sorted.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-600 text-sm">This folder is empty</div>
              )}
              {sorted.map(item => {
                const Icon = getFileIcon(item)
                const iconColor = getFileIconColor(item)
                const isRenaming = renameTarget?.path === item.path
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
                    className={`grid grid-cols-[2fr_1fr_1.5fr_auto] gap-2 items-center px-3 py-2 rounded-lg cursor-pointer transition-colors group
                      ${selectedItems.has(item.path) ? 'bg-cyan-500/15 border border-cyan-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') { setRenameTarget(null) } }}
                          onClick={e => e.stopPropagation()}
                          className="flex-1 bg-[#1a2030] border border-cyan-500/40 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                        />
                      ) : (
                        <span className="text-sm truncate">{item.name}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{item.is_dir ? '—' : formatBytes(item.size)}</span>
                    <span className="text-xs text-slate-500">{formatDate(item.modified)}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!item.is_dir && (
                        <button
                          onClick={e => { e.stopPropagation(); downloadFile(item) }}
                          className="p-1 rounded hover:bg-white/10 text-cyan-400"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); setRenameTarget(item); setRenameValue(item.name) }}
                        className="p-1 rounded hover:bg-white/10 text-yellow-400"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteItem(item) }}
                        className="p-1 rounded hover:bg-red-500/20 text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Grid view */}
          {!loading && currentPath && viewMode === 'grid' && (
            <div className="p-4 grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
              {sorted.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-600 text-sm">This folder is empty</div>
              )}
              {sorted.map(item => {
                const Icon = getFileIcon(item)
                const iconColor = getFileIconColor(item)
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
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors border
                      ${selectedItems.has(item.path) ? 'bg-cyan-500/15 border-cyan-500/20' : 'hover:bg-white/5 border-transparent hover:border-white/10'}`}
                  >
                    <Icon className={`w-10 h-10 ${iconColor}`} />
                    <span className="text-xs text-center leading-tight break-words w-full line-clamp-2 text-slate-200">{item.name}</span>
                    {!item.is_dir && <span className="text-[10px] text-slate-600">{formatBytes(item.size)}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      {currentPath && (
        <div className="px-4 py-1.5 border-t border-white/5 bg-[#10141f] flex items-center gap-4 text-[10px] text-slate-500 flex-shrink-0">
          <span>{sorted.length} item{sorted.length !== 1 ? 's' : ''}</span>
          {selectedItems.size > 0 && <span className="text-cyan-400">{selectedItems.size} selected</span>}
          <span className="ml-auto truncate">{currentPath}</span>
        </div>
      )}

      {/* Context Menu */}
      {ctxMenu && (
        <ContextMenu
          ctx={ctxMenu}
          onClose={() => setCtxMenu(null)}
          onDownload={downloadFile}
          onDelete={deleteItem}
          onRename={item => { setRenameTarget(item); setRenameValue(item.name) }}
        />
      )}
    </div>
  )
}
