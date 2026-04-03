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
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col custom-scrollbar">
      {/* Header */}
      <div className="p-8 border-b border-sidebar-border/50">
        <div className="flex flex-col items-center gap-4 mb-2">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-[0.2em] uppercase">DECOY</h1>
            <p className="text-[10px] font-mono text-secondary opacity-80 uppercase tracking-widest mt-1">v5.0 ELITE C2</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
              }`}
            >
              <div className="transition-transform duration-200">
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-[0.15em]`}>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border/20 space-y-2 bg-black/20">
        <button className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-foreground/40 hover:text-foreground/90 hover:bg-white/5 transition-all duration-300 group">
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Settings</span>
        </button>
        <button className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-all duration-300 group">
          <LogOut className="w-5 h-5" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Disconnect</span>
        </button>
      </div>
    </div>
  )
}
