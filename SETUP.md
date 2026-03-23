# Complete C2 Dashboard - Setup & Getting Started

## Installation

### 1. Install Dependencies
```bash
pnpm install
# or
npm install
# or
yarn install
```

Key dependencies installed:
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- Recharts (charts)
- Lucide (icons)
- better-sqlite3 (database)
- ws (WebSocket - optional)

### 2. Verify Database
```bash
# Create data directory (done automatically on first run)
# Or manually:
mkdir -p data
```

The database `data/c2-dashboard.db` is created automatically on first app start.

### 3. Run Development Server
```bash
pnpm dev
# or
npm run dev
```

App will be available at: **http://localhost:3000**

## Architecture Overview

```
Frontend (Dashboard)
      ↓
React Components + Hooks (use-api.ts)
      ↓
Next.js API Routes
      ↓
Core Libraries (managers, monitors, etc.)
      ↓
SQLite Database
```

## Quick Start - 5 Minutes

### Step 1: Start the App
```bash
pnpm dev
```
Open http://localhost:3000 in browser

### Step 2: Create Mock Data
Open new terminal:
```bash
# Register 5 mock clients
curl -X POST http://localhost:3000/api/test/mock-client \
  -H "Content-Type: application/json" \
  -d '{"action": "register", "count": 5}'
```

### Step 3: Add Metrics
```bash
# Record metrics for all clients
curl -X POST http://localhost:3000/api/test/mock-client \
  -H "Content-Type: application/json" \
  -d '{"action": "metrics"}'
```

### Step 4: View Dashboard
- Refresh http://localhost:3000
- You should see 5 clients listed
- Click on any client to view details

### Step 5: Queue Commands
```bash
# Queue mock commands
curl -X POST http://localhost:3000/api/test/mock-client \
  -H "Content-Type: application/json" \
  -d '{"action": "commands", "count": 3}'
```

## Directory Structure

```
/vercel/share/v0-project/
├── app/
│   ├── api/                    # API Routes
│   │   ├── clients/           # Client management
│   │   ├── commands/          # Command execution
│   │   ├── system/            # System metrics
│   │   ├── files/             # File operations
│   │   ├── dashboard/         # Dashboard stats
│   │   └── test/              # Mock client API
│   ├── layout.tsx             # Root layout (dark theme)
│   ├── page.tsx               # Dashboard page
│   └── globals.css            # Tailwind + theme
├── components/
│   ├── dashboard.tsx          # Main dashboard
│   ├── sidebar.tsx            # Navigation
│   ├── clients-panel.tsx      # Client list
│   ├── command-panel.tsx      # Command interface
│   ├── monitoring-panel.tsx   # Metrics & charts
│   └── ui/                    # shadcn/ui components
├── hooks/
│   └── use-api.ts             # API client hooks
├── lib/
│   ├── db.ts                  # Database init
│   ├── client-manager.ts      # Client logic
│   ├── command-queue.ts       # Command queue
│   ├── system-monitor.ts      # Metrics tracking
│   ├── file-operations.ts     # File management
│   ├── session-manager.ts     # Sessions
│   └── websocket-handler.ts   # Real-time updates
├── data/
│   └── c2-dashboard.db        # SQLite database (auto-created)
├── scripts/
│   └── init-db.sql            # Schema definitions
└── documentation files (*.md)
```

## Using the Dashboard

### Dashboard Sections

1. **Sidebar Navigation**
   - Clients: View connected clients
   - Commands: Execute and track commands
   - Monitoring: View system metrics
   - Files: Manage file operations

2. **Clients Panel**
   - Search and filter clients
   - View client status (online/offline)
   - Sort by various criteria
   - Delete or view details

3. **Command Panel**
   - 34 commands across 8 categories
   - Queue commands with parameters
   - View command history
   - Cancel pending commands
   - 8 Command Categories:
     - Execution (shell, powershell, script)
     - Surveillance (screenshot, webcam, keylog, etc.)
     - Files (download, upload, browse, encrypt)
     - Credentials (extract passwords, cookies, wifi)
     - System (info, processes, registry, scanner)
     - Persistence (enable, elevate, RDP, UAC)
     - Cleanup (traces, self-destruct, abort)

4. **Monitoring Panel**
   - Real-time CPU, Memory, Disk usage
   - Network activity charts
   - Process list
   - System uptime and alerts

## API Reference

### Base URL
All APIs: `http://localhost:3000/api`

### Main Endpoints

**Clients**
- `GET /clients/list` - All clients
- `POST /clients/register` - Register client
- `GET /clients/[id]/info` - Client details
- `DELETE /clients/[id]/delete` - Delete client

**Commands**
- `POST /commands/queue` - Queue command
- `GET /commands/list` - List commands
- `GET /commands/[id]/status` - Command status
- `POST /commands/[id]/status` - Update status
- `DELETE /commands/[id]/cancel` - Cancel command

**Metrics**
- `POST /system/metrics/update` - Record metrics
- `GET /system/metrics` - All latest metrics
- `GET /system/[id]/metrics` - Client metrics

**Files**
- `POST /files/operations` - Create file op
- `GET /files/list` - List file operations
- `GET /files/[id]/status` - File status
- `POST /files/[id]/status` - Update status

**Dashboard**
- `GET /dashboard/overview` - Dashboard stats
- `GET /dashboard/health` - System health

**Testing**
- `GET /test/mock-client` - Info
- `POST /test/mock-client` - Run operations

## React Hooks Usage

```typescript
import { useClients, useCommands, useMetrics, useDashboard } from '@/hooks/use-api'

// In your component
function MyComponent() {
  const { listClients, loading, error } = useClients()
  
  useEffect(() => {
    const load = async () => {
      const response = await listClients()
      console.log(response.data.clients)
    }
    load()
  }, [listClients])
  
  return <div>...</div>
}
```

## Common Tasks

### Check Database
```bash
sqlite3 data/c2-dashboard.db "SELECT * FROM clients;" 
```

### Clear All Data
```bash
rm data/c2-dashboard.db
# Will be recreated on next app start
```

### View Command History
```bash
sqlite3 data/c2-dashboard.db "SELECT * FROM commands;"
```

### Export Metrics
```bash
sqlite3 data/c2-dashboard.db ".mode csv" ".output metrics.csv" "SELECT * FROM system_info;" ".quit"
```

## Troubleshooting

### Port 3000 Already in Use
```bash
# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Errors
```bash
# Reset database
rm data/c2-dashboard.db
pnpm dev  # Will recreate
```

### Module Not Found
```bash
pnpm install
# or clear node_modules
rm -rf node_modules
pnpm install
```

### WebSocket Issues
Ensure your firewall allows WebSocket connections on port 3000.

## Production Deployment

### Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=https://your-domain.com
NODE_ENV=production
```

### Database Migration
For production, consider:
1. PostgreSQL (better for multi-user)
2. Regular backups
3. Connection pooling
4. SSL/TLS for all connections

### Build & Deploy
```bash
pnpm build
pnpm start
```

Or deploy to Vercel:
```bash
vercel deploy
```

## Performance Tips

1. **Limit Historical Data**
   - Metrics older than 30 days are auto-deleted
   - Commands older than 30 days are cleaned

2. **Optimize Queries**
   - Use pagination (`limit` parameter)
   - Filter by status or date

3. **Monitor Database**
   - Check database size periodically
   - Run cleanup after heavy usage

## Next Steps

1. Read `BACKEND_GUIDE.md` for API details
2. Read `FEATURES.md` for command descriptions
3. Integrate with actual clients (Python/C# agent)
4. Set up WebSocket for real-time updates
5. Add authentication layer

## Support

For issues or questions:
1. Check the documentation files
2. Review server logs
3. Test with mock client API
4. Verify database connectivity

---

**Ready?** Run `pnpm dev` and open http://localhost:3000!
