'use client'

import { Package, Monitor, Zap, Settings, LogOut, Database, BarChart3, ShieldAlert, Activity, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: 'overview' | 'clients' | 'monitoring' | 'commands' | 'loot' | 'analytics' | 'tasks' | 'files') => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Monitor },
    { id: 'clients', label: 'Clients', icon: Package },
    { id: 'commands', label: 'Commands', icon: Zap },
    { id: 'files', label: 'File Browser', icon: FolderOpen },
    { id: 'monitoring', label: 'Monitoring', icon: ShieldAlert },
    { id: 'loot', label: 'Loot', icon: Database },
    { id: 'tasks', label: 'Active Tasks', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">C2 Server</h1>
            <p className="text-xs text-sidebar-accent-foreground opacity-70">v5.0 Elite</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium text-sm">Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Disconnect</span>
        </button>
      </div>
    </div>
  )
}
