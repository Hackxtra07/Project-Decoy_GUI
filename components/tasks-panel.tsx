'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { 
  Play, 
  Square, 
  Loader2, 
  Terminal, 
  Monitor, 
  Cpu, 
  Clock, 
  User, 
  XCircle,
  AlertCircle,
  RefreshCcw,
  Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface Task {
  id: string
  client_id: string
  command_type: string
  command_name: string
  parameters: string
  status: string
  created_at: string
  updated_at: string
  hostname: string
  client_user: string
  is_active: number
}

export default function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      if (data.success) {
        setTasks(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleCancel = async (taskId: string, clientId: string) => {
    setCancelling(taskId)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', taskId, clientId })
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Cancellation Queued",
          description: "A cancellation signal has been sent to the client.",
        })
        fetchTasks()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to cancel task",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error occurred",
      })
    } finally {
      setCancelling(null)
    }
  }

  const filteredTasks = tasks.filter(task => 
    task.hostname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.command_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executing':
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse">Running</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
            <Cpu className="w-8 h-8 text-blue-400" />
            Active Tasks
          </h1>
          <p className="text-muted-foreground">Monitor and terminate long-running background processes on client systems.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-9 bg-card border-border" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => { setLoading(true); fetchTasks(); }}>
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-400" />
          <p>Scanning for active tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="bg-card/50 border-dashed border-2 flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium text-white mb-1">No Active Tasks Found</h3>
          <p className="text-muted-foreground max-w-xs text-center">There are no background tasks currently running on your connected clients.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="bg-card border-border hover:border-blue-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Badge variant="outline" className="text-[10px] font-mono">ID: {task.id.slice(0, 8)}</Badge>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  {getStatusBadge(task.status)}
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-400" />
                  {task.command_name.toUpperCase()}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                   <Monitor className="w-3 h-3" />
                   {task.hostname}
                   <span className="mx-1">•</span>
                   <User className="w-3 h-3" />
                   {task.client_user}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-xs text-blue-200/70 overflow-hidden text-ellipsis whitespace-nowrap">
                   {task.parameters || 'No parameters'}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Started: {new Date(task.created_at).toLocaleTimeString()}
                  </span>
                  <span className="flex items-center gap-1">
                    Last Update: {new Date(task.updated_at).toLocaleTimeString()}
                  </span>
                </div>

                <Button 
                  className="w-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition-all gap-2"
                  disabled={cancelling === task.id || task.status === 'cancelled'}
                  onClick={() => handleCancel(task.id, task.client_id)}
                >
                  {cancelling === task.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4 fill-current" />
                  )}
                  Terminate Task
                </Button>
              </CardContent>
              
              {/* Progress bar decoration for 'executing' tasks */}
              {task.status === 'executing' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500/20">
                  <div className="h-full bg-blue-500 animate-progress origin-left" style={{ width: '100%' }}></div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Warning Alert for persistence */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4 items-start">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
        <div>
          <h4 className="text-amber-500 font-medium font-bold">Background Tasks Note</h4>
          <p className="text-sm text-amber-200/70">
            Some tasks (like stream or webcam) are persistent background threads. 
            Terminating them here sends a signal to the victim script to stop the specific thread. 
            If the client is offline, the signal will be delivered next time it connects.
          </p>
        </div>
      </div>
    </div>
  )
}
