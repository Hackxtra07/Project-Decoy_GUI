# C2 Dashboard Backend Complete Guide

## Overview
The backend is a complete Next.js 16 server-side system with SQLite database, comprehensive API routes, WebSocket support, and mock client simulator for testing.

## Architecture

### Core Components

#### 1. Database Layer (`lib/db.ts`)
- **SQLite3** with better-sqlite3 driver
- Automatic schema initialization
- Located in `data/c2-dashboard.db`
- All tables with proper foreign keys and indices
- Transaction support

#### 2. Core Modules

**ClientManager** (`lib/client-manager.ts`)
- Register and manage client connections
- Track client status (online/offline)
- Store client metadata (hostname, OS, IP, arch, admin)
- Get client statistics

**CommandQueue** (`lib/command-queue.ts`)
- Queue commands for clients
- Track command status (pending → executing → completed/failed)
- Store command results and errors
- Get command history and statistics

**SystemMonitor** (`lib/system-monitor.ts`)
- Record system metrics (CPU, memory, disk, network)
- Retrieve timeseries data for charts
- Calculate aggregate metrics (avg, max)
- Support for 24+ hours historical data

**FileOperations** (`lib/file-operations.ts`)
- Create file operation records
- Track upload/download/delete/execute operations
- Update file status and size
- Get file statistics

**SessionManager** (`lib/session-manager.ts`)
- Create and manage user sessions
- Token-based authentication
- Session expiration handling
- Track active sessions

**WebSocketManager** (`lib/websocket-handler.ts`)
- Real-time client notifications
- Command status updates
- Metrics streaming
- Event broadcasting to connected clients

### Database Schema

#### Tables
1. **clients** - Connected devices
   - id, hostname, username, os, ip_address, architecture
   - is_admin, status, last_seen, created_at

2. **commands** - Command execution log
   - id, client_id, command_type, command_name
   - parameters (JSON), status, result, error_message
   - execution_time, created_at, updated_at

3. **system_info** - System metrics
   - client_id, cpu_usage, memory_usage, disk_usage
   - network_in/out, processes_count, timestamp

4. **files** - File operations
   - client_id, file_path, file_name, file_size
   - operation (download/upload/delete), status

5. **sessions** - User sessions
   - username, login_time, last_activity, ip_address
   - user_agent, is_active

6. **credentials** - Extracted credentials (optional)
7. **command_history** - Command audit log

## API Routes

### Clients Management
```
GET    /api/clients/list                  - List all clients
POST   /api/clients/register              - Register new client
GET    /api/clients/[id]/info             - Get client detailed info
DELETE /api/clients/[id]/delete           - Delete client
```

### Command Execution
```
POST   /api/commands/queue                - Queue new command
GET    /api/commands/list                 - List commands (filter by client/status)
GET    /api/commands/[id]/status          - Get command status
POST   /api/commands/[id]/status          - Update command status
DELETE /api/commands/[id]/cancel          - Cancel pending command
```

### System Metrics
```
POST   /api/system/metrics/update         - Record new metrics
GET    /api/system/metrics                - Get latest metrics for all clients
GET    /api/system/[id]/metrics           - Get metrics for specific client
```

Query Parameters:
- `type`: latest|timeseries|aggregate (default: latest)
- `hours`: Data range in hours (default: 24)
- `limit`: Result limit

### File Operations
```
POST   /api/files/operations              - Create file operation
GET    /api/files/list                    - List file operations
GET    /api/files/[id]/status             - Get file operation status
POST   /api/files/[id]/status             - Update file operation status
```

### Dashboard
```
GET    /api/dashboard/overview            - Get dashboard summary
GET    /api/dashboard/health              - Health check
```

### Testing
```
GET    /api/test/mock-client              - Mock client info
POST   /api/test/mock-client              - Run mock client operations
```

## API Request/Response Format

### Request Format
All POST requests use JSON body:
```json
{
  "client_id": "uuid",
  "command_type": "shell",
  "command_name": "whoami",
  "parameters": {...}
}
```

### Response Format
All responses follow this format:
```json
{
  "success": true,
  "data": {...},
  "message": "Optional message",
  "error": "Error message (if failed)"
}
```

## Usage Examples

### Register a Client
```bash
curl -X POST http://localhost:3000/api/clients/register \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "WORKSTATION-01",
    "username": "admin",
    "os": "Windows 11",
    "ip_address": "192.168.1.100",
    "is_admin": true
  }'
```

### Queue a Command
```bash
curl -X POST http://localhost:3000/api/commands/queue \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client-uuid",
    "command_type": "shell",
    "command_name": "whoami",
    "parameters": {}
  }'
```

### Update Metrics
```bash
curl -X POST http://localhost:3000/api/system/metrics/update \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client-uuid",
    "cpu_usage": 45.5,
    "memory_usage": 62.3,
    "memory_total": 16000,
    "disk_usage": 50.0,
    "disk_total": 500000
  }'
```

## Testing with Mock Clients

### Register Mock Clients
```bash
curl -X POST http://localhost:3000/api/test/mock-client \
  -H "Content-Type: application/json" \
  -d '{"action": "register", "count": 5}'
```

### Record Mock Metrics
```bash
curl -X POST http://localhost:3000/api/test/mock-client \
  -H "Content-Type: application/json" \
  -d '{"action": "metrics"}'
```

### Queue Mock Commands
```bash
curl -X POST http://localhost:3000/api/test/mock-client \
  -H "Content-Type: application/json" \
  -d '{"action": "commands", "count": 3}'
```

### Cleanup Mock Data
```bash
curl -X POST http://localhost:3000/api/test/mock-client \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup"}'
```

## Frontend Integration

### API Hooks
The `hooks/use-api.ts` file provides custom React hooks for API calls:

```typescript
import { useClients, useCommands, useMetrics, useDashboard } from '@/hooks/use-api'

// Use in components
const { listClients, registerClient, loading, error } = useClients()
const clients = await listClients()

const { queueCommand, listCommands } = useCommands()
const command = await queueCommand({ client_id, command_type, command_name })
```

## Performance Optimization

### Indices
- Optimized indices on frequently queried columns
- Foreign key relationships
- Automatic cleanup of old data

### Caching
- WebSocket broadcasts prevent excessive polling
- Metrics are stored efficiently
- Command results are compressed

### Data Retention
- Old commands cleaned after 30 days (completed/failed)
- Old metrics cleaned after 30 days
- Sessions expire after 7 days of inactivity

## Security Considerations

1. **Input Validation**: All API inputs are validated
2. **Database Transactions**: Critical operations use transactions
3. **SQL Injection Prevention**: Parameterized queries everywhere
4. **Session Management**: Token-based with expiration
5. **Error Handling**: Safe error messages (no SQL leaks)

## Environment Setup

### Required Packages
```json
{
  "better-sqlite3": "^9.2.2",
  "uuid": "^9.0.1"
}
```

### Database Location
- Development: `./data/c2-dashboard.db`
- Created automatically on first run

### Port Configuration
- Default: 3000
- API accessible at: `http://localhost:3000/api/...`

## Troubleshooting

### Database Locked Error
Solution: Ensure only one instance of the app is running

### Schema Not Initialized
Solution: Delete `data/c2-dashboard.db` and restart

### API Returns 500 Error
Check server logs for error details

### WebSocket Connection Failed
Ensure WebSocket is supported and no firewall blocks it

## Future Enhancements

1. PostgreSQL support for production
2. Redis caching layer
3. Event logging and audit trails
4. Rate limiting
5. Role-based access control
6. API key authentication
7. Data encryption at rest
8. Automated backups

## Support & Debugging

Enable debug logging:
```typescript
// In your request handlers
console.log('[API] Event details:', data)
```

Check database directly:
```bash
sqlite3 data/c2-dashboard.db "SELECT * FROM clients;"
```

Monitor WebSocket connections:
```typescript
console.log('[WS] Connection stats:', wsManager.getAllConnectionStats())
```
