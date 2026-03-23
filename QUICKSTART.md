# Quick Start Guide

Get the C2 Dashboard running in 5 minutes!

## Prerequisites

- Node.js 18+ 
- pnpm (or npm)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Clone/Download Project
```bash
cd c2-dashboard
```

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Run Development Server
```bash
pnpm dev
# or
npm run dev
```

### 4. Open Dashboard
Navigate to: **[http://localhost:3000](http://localhost:3000)**

✅ Dashboard is now running!

---

## Dashboard Navigation

### Left Sidebar
- **Overview**: Main dashboard view
- **Clients**: Connected systems list
- **Commands**: Execute operations
- **Monitoring**: Real-time metrics

### Client Selection (Left Panel)
1. Search for a client
2. Click a client to select it
3. Client turns blue when selected

### Command Execution
1. Click "Commands" in sidebar
2. Select command category (Execution, Surveillance, etc.)
3. Click command card to execute
4. View output in "Command Output" section

### System Monitoring
1. Click "Monitoring" in sidebar
2. View real-time performance charts
3. Check active processes
4. Monitor network connections

---

## Features Overview

### 34 Available Commands

**Execution** (3)
- Shell Command
- PowerShell
- Run Script

**Surveillance** (8)
- Screenshot
- Webcam Capture
- Screen Stream
- Microphone Record
- Keylogger
- Clipboard Monitor
- Window Activity Logger
- Webcam Stream

**Files** (4)
- Download File
- Upload File
- File Browser
- File Encryption

**Credentials** (5)
- Browser Passwords
- Browser Cookies
- WiFi Passwords
- Discord Tokens
- Telegram Data

**System** (7)
- System Info
- Process Manager
- Registry Editor
- Port Scanner
- AV Detection
- Network Statistics
- ARP Table

**Persistence** (4)
- Enable Persistence
- Privilege Escalation
- RDP Enable
- UAC Bypass

**Cleanup** (3)
- Clean Traces
- Self Destruct
- Abort Tasks

---

## Mock Data

The dashboard includes sample data for testing:

**Sample Clients**:
- DESKTOP-USER001 (192.168.1.105) - Online
- LAPTOP-DEV02 (192.168.1.42) - Online
- SERVER-PROD01 (10.0.1.50) - Online
- WORKSTATION-03 (192.168.1.88) - Offline

**Sample Metrics**:
- CPU: 45% (simulated real-time)
- Memory: 62%
- Network: 28%
- Processes: 342
- Uptime: 45d 12h 34m

---

## Configuration

### Environment Variables

Create `.env.local`:
```env
# C2 Server Connection (optional for backend integration)
NEXT_PUBLIC_C2_SERVER_HOST=localhost
NEXT_PUBLIC_C2_SERVER_PORT=4444

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Logging
NEXT_PUBLIC_LOG_LEVEL=info
```

### Customization

**Change Theme Colors**:
Edit `/app/globals.css` - modify CSS variables in `.dark` section:
```css
.dark {
  --background: oklch(0.09 0 0);        /* Main background */
  --primary: oklch(0.65 0.15 210);      /* Primary blue */
  --card: oklch(0.12 0 0);              /* Card background */
  /* ... more colors ... */
}
```

**Modify Client Data**:
Edit `/components/clients-panel.tsx` - update `mockClients` array

**Change Chart Data**:
Edit `/components/monitoring-panel.tsx` - update `systemMetrics` array

---

## File Structure

```
c2-dashboard/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── globals.css             # Theme & styles
│   ├── page.tsx                # Main page
│   └── api/                    # API routes (for backend)
├── components/
│   ├── dashboard.tsx           # Main dashboard
│   ├── sidebar.tsx             # Navigation
│   ├── clients-panel.tsx       # Clients list
│   ├── command-panel.tsx       # Commands UI
│   ├── monitoring-panel.tsx    # Metrics/charts
│   └── ui/
│       ├── card.tsx            # Card component
│       └── button.tsx          # Button component
├── lib/
│   ├── utils.ts                # Helper functions
├── public/
│   └── ...                     # Static assets
├── README.md                   # Main documentation
├── FEATURES.md                 # Feature list
├── INTEGRATION.md              # Backend integration guide
├── QUICKSTART.md               # This file
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

---

## Keyboard Shortcuts (Future)

```
Ctrl+K    - Command search
Ctrl+L    - Client search
Ctrl+/    - Help
Escape    - Close modal
Enter     - Execute command
```

(Currently: Manual clicking)

---

## Development Tips

### Hot Module Replacement
Changes auto-reload without page refresh while `pnpm dev` is running

### Browser DevTools
- Inspect React components: React DevTools extension
- Debug network: Chrome DevTools Network tab
- Check console: Chrome DevTools Console tab

### Enable Debug Logging
Add to `/components/command-panel.tsx`:
```typescript
console.log("[v0] Executing command:", command)
console.log("[v0] Command output:", output)
```

---

## Common Issues & Solutions

### Issue: Components not loading
**Solution**: Ensure all dependencies installed
```bash
pnpm install
```

### Issue: Charts not displaying
**Solution**: Recharts needs proper height. Check container height.

### Issue: Styling looks wrong
**Solution**: Clear browser cache and reload
```bash
Ctrl+Shift+Delete (Chrome)
Cmd+Shift+Delete (macOS)
```

### Issue: Port 3000 already in use
**Solution**: Use different port
```bash
pnpm dev -- -p 3001
```

---

## Production Build

### Build for Production
```bash
pnpm build
```

### Run Production Version
```bash
pnpm start
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## Next Steps

### 1. Explore the Interface
- Click through different tabs
- Try selecting different clients
- Execute sample commands
- View monitoring data

### 2. Understand the Code
- Review `components/dashboard.tsx` for layout
- Study `components/command-panel.tsx` for command logic
- Check `components/monitoring-panel.tsx` for charts

### 3. Connect Backend (Optional)
- Follow guide in `INTEGRATION.md`
- Create API endpoints in `/app/api/`
- Update components to use real data

### 4. Customize
- Change colors in `globals.css`
- Add your branding
- Modify command categories
- Add new metrics

---

## Resources

| Resource | Link |
|----------|------|
| Next.js Docs | https://nextjs.org/docs |
| React Docs | https://react.dev |
| Tailwind CSS | https://tailwindcss.com |
| Recharts | https://recharts.org |
| Lucide Icons | https://lucide.dev |
| shadcn/ui | https://ui.shadcn.com |

---

## Support & Troubleshooting

### Check Logs
```bash
# Frontend console
# Open: DevTools > Console tab

# Backend (if integrated)
# Check: c2_server.log
```

### Database Status (Backend)
```bash
# Check SQLite database
sqlite3 c2.db "SELECT COUNT(*) FROM clients;"
```

### Network Issues
```bash
# Test server connectivity
curl http://localhost:4444

# Check port usage
lsof -i :3000 (macOS/Linux)
netstat -ano | grep 3000 (Windows)
```

---

## Performance Optimization

### Reduce Bundle Size
```bash
# Analyze bundle
pnpm build && pnpm analyze
```

### Optimize Images
- Use next/image component
- Compress images before upload
- Use WebP format

### Enable Caching
```typescript
// Add to API routes
response.headers['Cache-Control'] = 'public, max-age=3600'
```

---

## Security Notes

⚠️ **This is a demonstration dashboard only**

For production use:
- ✅ Add authentication (OAuth, JWT, etc.)
- ✅ Implement API key validation
- ✅ Use HTTPS/TLS encryption
- ✅ Add CORS policies
- ✅ Implement rate limiting
- ✅ Audit all command executions
- ✅ Use environment variables for secrets
- ✅ Validate all user inputs
- ✅ Implement logging and monitoring

---

## Deployment Checklist

- [ ] Remove console.log statements
- [ ] Set environment variables
- [ ] Configure CORS
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Test all commands
- [ ] Security audit
- [ ] Load testing
- [ ] Deploy to production

---

## Getting Help

### Read Documentation
1. `README.md` - Overview
2. `FEATURES.md` - Feature details
3. `INTEGRATION.md` - Backend setup
4. Component files - Code comments

### Debug Issues
1. Check browser console (F12)
2. Review Next.js terminal output
3. Check database status
4. Review logs in backend

### Ask Questions
- Check code comments
- Review component prop types
- Study example implementations

---

## What's Next?

🎯 **Goal 1**: Understand the interface
- [ ] Explore all tabs
- [ ] Try selecting clients
- [ ] View monitoring data

🎯 **Goal 2**: Customize styling
- [ ] Change primary color
- [ ] Add custom logo
- [ ] Modify font

🎯 **Goal 3**: Integrate backend
- [ ] Create API endpoints
- [ ] Connect to s.py server
- [ ] Test all commands

🎯 **Goal 4**: Deploy
- [ ] Build for production
- [ ] Deploy to Vercel/VPS
- [ ] Set up monitoring

---

## Version Information

- **Next.js**: 16.2.0
- **React**: 19.2.4
- **Tailwind CSS**: 4.2.0
- **Recharts**: 2.15.0
- **Lucide React**: 0.564.0

---

**Dashboard Ready!** 🚀

You now have a fully functional C2 command control dashboard. Start exploring and customizing!

Need help? Check the documentation files or review the component source code.
