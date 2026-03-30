'use client'

import { useState, useEffect } from 'react'
import { Folder, File, ArrowLeft, Download, MousePointer2, Clock, HardDrive, Search, Eye, FileText, Image as ImageIcon, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface LootFile {
  name: string
  path: string
  size: number
  type: string
  mtime: string
  isDirectory: boolean
}

export default function LootPanel() {
  const [currentDir, setCurrentDir] = useState('')
  const [files, setFiles] = useState<LootFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<LootFile | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  const fetchFiles = async (dir: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/loot?dir=${encodeURIComponent(dir)}`)
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
    if (!file.isDirectory) {
        try {
            const res = await fetch(`/api/loot/view?file=${encodeURIComponent(file.path)}`)
            if (res.ok) {
                const contentType = res.headers.get('content-type')
                if (contentType?.startsWith('image/')) {
                    setFileContent('IMAGE_DISPLAY') // Special marker
                } else if (contentType === 'application/json' || file.path.endsWith('.json')) {
                    const data = await res.json()
                    setFileContent(JSON.stringify(data, null, 2))
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loot Explorer</h1>
          <p className="text-muted-foreground">Browse and analyze data captured from remote systems</p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search loot..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => fetchFiles(currentDir)}>Refresh</Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(stats).map(([cat, s]: [string, any]) => (
            <Card key={cat} className="bg-card/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="capitalize">{cat.replace('_', ' ')}</Badge>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{s.count}</span>
                  <span className="text-xs text-muted-foreground ml-2">files</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total Size: {formatSize(s.size)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* File Explorer */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            {currentDir && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  const parts = currentDir.split('/')
                  parts.pop()
                  setCurrentDir(parts.join('/'))
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <CardTitle className="text-sm font-mono">{currentDir || 'root'}/</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">{filteredFiles.length} items</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading file system...</div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No files found in this directory</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b">
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-2 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Size</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Last Modified</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredFiles.map((file) => (
                    <tr 
                      key={file.path} 
                      className="hover:bg-muted/20 group cursor-pointer"
                      onClick={() => file.isDirectory ? setCurrentDir(file.path) : openFile(file)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {file.isDirectory ? (
                            <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                          ) : (
                             file.type.match(/png|jpg|jpeg/) ? <ImageIcon className="w-4 h-4 text-purple-400" /> : <FileText className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize text-muted-foreground">{file.type}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{file.isDirectory ? '-' : formatSize(file.size)}</td>
                      <td className="py-3 px-4 text-right text-xs text-muted-foreground font-mono">
                        {new Date(file.mtime).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!file.isDirectory && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Previewer */}
      {selectedFile && !selectedFile.isDirectory && (
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
                            src={`/api/loot/view?file=${encodeURIComponent(selectedFile.path)}`} 
                            alt={selectedFile.name}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-xl shadow-black/60"
                        />
                    </div>
                ) : fileContent === 'BINARY_DATABASE' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground p-6 text-center">
                        <Database className="w-16 h-16 text-cyan-500 opacity-50" />
                        <h3 className="text-xl font-bold text-foreground">SQLite Database Captured</h3>
                        <p className="max-w-md">This is a binary database file. You can download it to explore its contents using a local database viewer.</p>
                        <Button variant="outline" className="mt-2" onClick={() => window.open(`/api/loot/view?file=${encodeURIComponent(selectedFile.path)}`)}>
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
