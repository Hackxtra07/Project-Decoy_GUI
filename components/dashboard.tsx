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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'monitoring' | 'commands' | 'loot' | 'analytics' | 'tasks' | 'files'>('overview')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Clients panel */}
        <div className="w-80 border-r border-border bg-card overflow-y-auto">
          <ClientsPanel selectedClient={selectedClient} setSelectedClient={setSelectedClient} />
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && <MonitoringPanel selectedClient={selectedClient} />}
          {activeTab === 'commands' && <CommandPanel selectedClient={selectedClient} />}
          {activeTab === 'monitoring' && <MonitoringPanel selectedClient={selectedClient} />}
          {activeTab === 'clients' && <ClientsPanel selectedClient={selectedClient} setSelectedClient={setSelectedClient} />}
          {activeTab === 'loot' && <LootPanel />}
          {activeTab === 'analytics' && <AnalyticsPanel />}
          {activeTab === 'tasks' && <TasksPanel />}
          {activeTab === 'files' && <FileBrowserPanel selectedClient={selectedClient} />}
        </div>
      </div>
    </div>
  )
}
