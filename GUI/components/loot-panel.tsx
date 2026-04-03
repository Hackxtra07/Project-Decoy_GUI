'use client'

import { useState, useEffect } from 'react'
import { Folder, File, ArrowLeft, Download, MousePointer2, Clock, HardDrive, Search, Eye, FileText, Image as ImageIcon, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface LootFile {
  id: string
  name: string
  path: string
  size: number
  type: string
  mtime: string
}

export default function LootPanel() {
  const [currentDir, setCurrentDir] = useState('')
  const [files, setFiles] = useState<LootFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<LootFile | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  const fetchFiles = async (type?: string) => {
    setLoading(true)
    try {
      const url = type ? `/api/loot?type=${type}` : '/api/loot'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setFiles(data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/loot?action=stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchFiles(currentDir)
    fetchStats()
  }, [currentDir])

  const openFile = async (file: LootFile) => {
    setSelectedFile(file)
    setFileContent(null)
    try {
        const res = await fetch(`/api/loot/view?id=${file.id}`)
        if (res.ok) {
            const contentType = res.headers.get('content-type')
            if (contentType?.startsWith('image/')) {
                setFileContent('IMAGE_DISPLAY') // Special marker
            } else if (contentType === 'application/json' || file.name.endsWith('.json')) {
                try {
                    const data = await res.json()
                    setFileContent(JSON.stringify(data, null, 2))
                } catch {
                    const text = await res.text()
                    setFileContent(text)
                }
            } else if (contentType?.startsWith('text/') || 
                      ['txt', 'log', 'ps1', 'bat', 'py', 'sh', 'ini', 'conf', 'yml', 'yaml'].includes(file.type)) {
                const text = await res.text()
                setFileContent(text)
            } else if (contentType === 'application/x-sqlite3' || ['db', 'sqlite', 'sqlite3'].includes(file.type)) {
                setFileContent('BINARY_DATABASE') // Special marker
            } else {
                // Try as text as fallback
                const text = await res.text()
                setFileContent(text.slice(0, 100000)) // Cap to 100k
            }
        }
    } catch (err) {
        console.error(err)
        setFileContent('Error loading file content')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter mb-2 uppercase">Loot_Vault</h1>
          <p className="text-xs font-mono text-primary/60 tracking-widest uppercase">Centralized Intelligence Repository</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="FILTER_DATA..." 
              className="pl-10 w-72 bg-white/[0.03] border-white/10 rounded-xl focus:ring-primary/20 focus:border-primary/50 font-mono text-xs" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 active:scale-95 transition-all text-xs font-bold" onClick={() => fetchFiles(currentDir)}>
            SYNC_NODE
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 gap-6">
          {Object.entries(stats).map(([cat, s]: [string, any]) => (
            <div key={cat} className={`glass-card p-6 rounded-2xl cursor-pointer transition-all relative group overflow-hidden border-l-2 ${currentDir === cat ? 'border-l-primary bg-primary/5' : 'border-l-white/10 hover:border-l-primary/50'}`} onClick={() => setCurrentDir(currentDir === cat ? '' : cat)}>
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-2 relative z-10">
                <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em]">{cat.replace('_', ' ')}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black neon-text">{s.count.toString().padStart(2, '0')}</span>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">items</span>
                </div>
                <div className="h-px w-full bg-white/5 my-1" />
                <div className="text-[10px] font-mono text-muted-foreground/60 uppercase">
                   ALLOCATED: {formatSize(s.size)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Explorer */}
      <div className="glass-card rounded-2xl border-white/5 overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,240,255,1)]" />
            <h2 className="text-xs font-black tracking-[0.3em] uppercase text-primary/80">
              {currentDir ? `Filtered_Stream: ${currentDir}` : 'Global_Capture_Feed'}
            </h2>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
            {filteredFiles.length} TOTAL_DETECTIONS
          </div>
        </div>
        
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
               <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
               <p className="text-[10px] font-mono text-primary animate-pulse tracking-widest uppercase">Indexing_Vault...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="p-20 text-center opacity-20 flex flex-col items-center justify-center gap-4">
               <Database className="w-12 h-12" />
               <p className="text-[10px] font-mono tracking-widest uppercase">Void_Detected: No_Loot_Found</p>
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="text-left py-4 px-8 font-black text-muted-foreground uppercase tracking-widest">Metadata</th>
                  <th className="text-left py-4 px-8 font-black text-muted-foreground uppercase tracking-widest">Classification</th>
                  <th className="text-right py-4 px-8 font-black text-muted-foreground uppercase tracking-widest">Mass</th>
                  <th className="text-right py-4 px-8 font-black text-muted-foreground uppercase tracking-widest">Captured_At</th>
                  <th className="text-right py-4 px-8 font-black text-muted-foreground uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredFiles.map((file) => (
                  <tr 
                    key={file.id} 
                    className="hover:bg-primary/[0.03] transition-all group cursor-pointer border-l-2 border-l-transparent hover:border-l-primary"
                    onClick={() => openFile(file)}
                  >
                    <td className="py-4 px-8">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/20 group-hover:text-primary transition-all">
                          {file.type.match(/png|jpg|jpeg/) ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{file.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-8">
                       <span className="text-[10px] font-mono bg-white/5 py-1 px-3 rounded-full text-muted-foreground uppercase tracking-tighter">{file.type}</span>
                    </td>
                    <td className="py-4 px-8 text-right font-mono text-muted-foreground">{formatSize(file.size)}</td>
                    <td className="py-4 px-8 text-right text-[10px] text-muted-foreground font-mono opacity-60">
                      {new Date(file.mtime).toLocaleString()}
                    </td>
                    <td className="py-4 px-8 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                         <div className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-black transition-all">
                           <Eye className="w-4 h-4" />
                         </div>
                         <div className="p-2 bg-white/10 text-muted-foreground rounded-lg hover:bg-white/20 transition-all">
                           <Download className="w-4 h-4" />
                         </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* File Previewer */}
      {selectedFile && (
        <Card className="fixed inset-4 md:inset-10 z-50 flex flex-col bg-background/95 backdrop-blur-md shadow-2xl border-sidebar-border overflow-hidden animate-in zoom-in duration-200">
           <CardHeader className="border-b flex flex-row items-center justify-between px-6 py-4">
             <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-blue-400" />
                <div>
                   <CardTitle className="text-lg">{selectedFile.name}</CardTitle>
                   <p className="text-xs text-muted-foreground">{selectedFile.path}</p>
                </div>
             </div>
             <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                <ArrowLeft className="w-5 h-5 rotate-90" />
             </Button>
           </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 bg-black/40 relative">
                {fileContent === 'IMAGE_DISPLAY' ? (
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <img 
                            src={`/api/loot/view?id=${selectedFile.id}`} 
                            alt={selectedFile.name}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-xl shadow-black/60"
                        />
                    </div>
                ) : fileContent === 'BINARY_DATABASE' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground p-6 text-center">
                        <Database className="w-16 h-16 text-cyan-500 opacity-50" />
                        <h3 className="text-xl font-bold text-foreground">SQLite Database Captured</h3>
                        <p className="max-w-md">This is a binary database file. You can download it to explore its contents using a local database viewer.</p>
                        <Button variant="outline" className="mt-2" onClick={() => window.open(`/api/loot/view?id=${selectedFile.id}`)}>
                            <Download className="w-4 h-4 mr-2" /> Download Database
                        </Button>
                    </div>
                ) : fileContent ? (
                  <div className="h-full w-full overflow-auto">
                    <pre className="p-6 font-mono text-sm leading-relaxed text-blue-100/90 whitespace-pre">
                      {fileContent}
                    </pre>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="animate-pulse">Analyzing capture...</p>
                  </div>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  )
}
