# C2 Dashboard - Visual Guide

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                     C2 SERVER - V5.0 ELITE                          │
├──────────┬─────────────────────────┬─────────────────────────────────┤
│          │                         │                                 │
│ SIDEBAR  │   CLIENTS PANEL         │     MAIN CONTENT AREA           │
│          │                         │                                 │
│ Overview │ Active Clients          │  Overview / Commands /          │
│ Clients  │ ─────────────────────   │  Monitoring / Settings          │
│ Commands │ [Search Bar]            │                                 │
│ Monitor  │ ─────────────────────   │ Real-time data, charts,        │
│          │ DESKTOP-USER001  ✓      │ command outputs, metrics       │
│ Settings │ 192.168.1.105           │                                 │
│ Logout   │ Windows 10              │                                 │
│          │ [Interact] [Remove]     │                                 │
│          │                         │                                 │
│          │ LAPTOP-DEV02    ✓       │                                 │
│          │ 192.168.1.42            │                                 │
│          │ Windows 11              │                                 │
│          │ [Interact] [Remove]     │                                 │
│          │                         │                                 │
│          │ SERVER-PROD01   ✓       │                                 │
│          │ 10.0.1.50               │                                 │
│          │ Windows Server 2019     │                                 │
│          │ [Interact] [Remove]     │                                 │
│          │                         │                                 │
│          │ Online: 3 / Total: 4    │                                 │
└──────────┴─────────────────────────┴─────────────────────────────────┘
```

---

## Color Scheme

### Primary Colors
```
Background     #0f172a    ███████ Deep Navy (Professional)
Foreground     #f2f4f7    ███████ Light Gray (High contrast)
Primary        #60a5fa    ███████ Professional Blue
Card           #1e293b    ███████ Dark Blue-Gray
Border         #334155    ███████ Medium Slate
Accent         #65a30d    ███████ Accent Green (for status)
```

### Status Colors
```
Online         #10b981    ███████ Green (Active systems)
Offline        #6b7280    ███████ Gray (Inactive systems)
Executing      #f59e0b    ███████ Amber (Pending commands)
Threat-Low     #10b981    ███████ Green (Safe)
Threat-Medium  #f59e0b    ███████ Amber (Caution)
Threat-High    #ef4444    ███████ Red (Alert)
```

---

## Sidebar Navigation

```
┌─────────────────┐
│  [⚡ C2 Server] │ ← Logo & Title
│      v5.0 Elite │
├─────────────────┤
│  📊 Overview    │ ← Current Section
│  👥 Clients     │
│  ⚡ Commands    │
│  📈 Monitoring  │
├─────────────────┤
│  ⚙️  Settings    │
│  🚪 Disconnect  │
└─────────────────┘
```

---

## Clients Panel

### Search Bar
```
┌────────────────────────────────────┐
│ 🔍 Search clients...               │
└────────────────────────────────────┘
```

### Client Card (Online)
```
┌──────────────────────────────────────────┐
│ DESKTOP-USER001              [✓ Online]  │
│ 192.168.1.105                            │
│                                          │
│ OS: Windows 10                           │
│ User: administrator                      │
│ 📡 2 seconds ago                         │
│                                          │
│ [Interact]          [🗑️]                │
└──────────────────────────────────────────┘
```

### Client Card (Offline)
```
┌──────────────────────────────────────────┐
│ WORKSTATION-03               [✗ Offline] │
│ 192.168.1.88                             │
│                                          │
│ OS: Windows 10                           │
│ User: user                               │
│ 📡 3 minutes ago                         │
│                                          │
│ [Interact]          [🗑️]                │
└──────────────────────────────────────────┘
```

---

## Command Panel - Category View

```
┌────────────────────────────────────────────────────────┐
│ [Execution] [Surveillance] [Files] [Credentials]       │
│ [System] [Persistence] [Cleanup] [Advanced]            │
└────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🖥️ Shell Command  │  │ 🎬 Screenshot     │  │ 💾 Download File  │
│ Execute system    │  │ Capture screen    │  │ Get file from     │
│ commands          │  │                   │  │ client            │
│                   │  │ [Execute]         │  │ [Execute]         │
│ [Execute]         │  └──────────────────┘  └──────────────────┘
└──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🔵 PowerShell     │  │ 📹 Webcam Stream  │  │ 📁 File Browser   │
│ PowerShell exec   │  │ Capture webcam    │  │ Browse filesystem │
│                   │  │ images            │  │                   │
│ [Execute]         │  │ [Execute]         │  │ [Execute]         │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Command Execution Interface

### Direct Command Input
```
┌────────────────────────────────────────────────────────┐
│ Direct Command Input                                   │
├────────────────────────────────────────────────────────┤
│ [Enter custom command...          ] [Send ↵]           │
└────────────────────────────────────────────────────────┘
```

### Command Output Display
```
┌────────────────────────────────────────────────────────┐
│ Command Output                                         │
├────────────────────────────────────────────────────────┤
│ > Screenshot                                           │
│ [14:30:22] Executing: Screenshot                       │
│ → Command sent to client successfully                  │
│                                                        │
│ > Shell Command                                        │
│ [14:31:45] $ dir C:\Users                              │
│ → Executed successfully                                │
└────────────────────────────────────────────────────────┘
```

---

## Monitoring Dashboard

### Key Metrics Cards
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 🔵 CPU Usage │  │ 💾 Memory    │  │ 🌐 Network   │  │ ⏱️ Uptime    │
│     45%      │  │     62%      │  │     28%      │  │  45d 12h 34m │
│ ↑ increasing │  │ ↑ increasing │  │ ↓ decreasing │  │ → stable     │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Performance Charts
```
System Performance (3-line chart)
┌──────────────────────────────────────────────────┐
│  400 ┤                                            │
│      │    ┌─────                                  │
│  200 ┤───╱─────────────────                       │
│      │                                            │
│    0 ├────────────────────────────────────────────│
│      └──────────────────────────────────────────┘ │
│        12:00  12:15  12:30  12:45  13:00  13:30  │
│        ─── CPU   ─── Memory   ─── Network        │
└──────────────────────────────────────────────────┘
```

### Process List
```
Top Processes
┌──────────────────────────────────────────────────┐
│ explorer.exe          CPU: 8%  | RAM: 120MB      │
│ chrome.exe            CPU: 15% | RAM: 450MB      │
│ outlook.exe           CPU: 5%  | RAM: 200MB      │
│ vscode.exe            CPU: 12% | RAM: 380MB      │
└──────────────────────────────────────────────────┘
```

### System Stats
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 👥 Processes │  │ ⚠️ Threat     │  │ 💽 Disk      │
│     342      │  │    Low       │  │   847 GB     │
│ Running      │  │ Security OK  │  │ Available    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Network Connections Table
```
Active Network Connections
┌───────┬─────────────────────┬────────────────────┬──────────────┬───────────┐
│ Proto │ Local Address       │ Remote Address     │ State        │ Process   │
├───────┼─────────────────────┼────────────────────┼──────────────┼───────────┤
│ TCP   │ 192.168.1.105:49200 │ 8.8.8.8:443        │ ESTABLISHED  │ chrome    │
│ TCP   │ 192.168.1.105:49201 │ 142.250.80.46:443  │ ESTABLISHED  │ firefox   │
│ TCP   │ 192.168.1.105:49202 │ 1.1.1.1:53         │ TIME_WAIT    │ System    │
│ UDP   │ 192.168.1.105:53    │ 0.0.0.0:0          │ LISTENING    │ dns.exe   │
└───────┴─────────────────────┴────────────────────┴──────────────┴───────────┘
```

---

## Command Categories Overview

```
Execution (3 commands)
├── 🖥️ Shell Command
├── 🔵 PowerShell
└── 📜 Run Script

Surveillance (8 commands)
├── 📸 Screenshot
├── 📷 Webcam
├── 🎬 Screen Stream
├── 🎤 Microphone
├── ⌨️ Keylogger
├── 📋 Clipboard
├── 🪟 Window Logger
└── 🎥 Webcam Stream

Files (4 commands)
├── ⬇️ Download
├── ⬆️ Upload
├── 📁 Browse
└── 🔐 Encrypt

Credentials (5 commands)
├── 🔑 Passwords
├── 🍪 Cookies
├── 📶 WiFi
├── 🎮 Discord
└── ✈️ Telegram

System (7 commands)
├── ℹ️ System Info
├── ⚙️ Process Manager
├── 📝 Registry
├── 🔍 Port Scanner
├── 🛡️ AV Detection
├── 📊 Netstat
└── 📡 ARP

Persistence (4 commands)
├── 🔒 Enable Persistence
├── 👑 Escalate
├── 🖥️ RDP
└── 🚀 UAC Bypass

Cleanup (3 commands)
├── 🧹 Clean Traces
├── 💣 Self Destruct
└── ⛔ Abort Tasks
```

---

## User Interaction Flow

### Select Client → Execute Command → View Output

```
Start
  │
  ├─→ [1] Search Client
  │     │
  │     ├─→ Type in search box
  │     └─→ Results filter in real-time
  │
  ├─→ [2] Click Client
  │     │
  │     ├─→ Client highlights (blue)
  │     └─→ Status shows "Online/Offline"
  │
  ├─→ [3] Navigate to Commands
  │     │
  │     ├─→ Click "Commands" in sidebar
  │     └─→ Command categories appear
  │
  ├─→ [4] Select Category
  │     │
  │     ├─→ Click category button
  │     └─→ Commands in that category show
  │
  ├─→ [5] Execute Command
  │     │
  │     ├─→ Click command card
  │     └─→ Command sent to selected client
  │
  └─→ [6] View Output
        │
        ├─→ Output appears in Command Output section
        ├─→ Timestamp shows execution time
        └─→ Status shows success/failure
```

---

## Responsive Design Breakpoints

### Desktop (1920x1080)
```
┌─────────────────────────────────────────────────┐
│ 64px │ 320px │ Full width main content          │
└─────────────────────────────────────────────────┘
Full layout with all panels visible side-by-side
```

### Laptop (1366x768)
```
┌──────────────────────────────────────────────┐
│ 64px │ 280px │ Adjusted main content         │
└──────────────────────────────────────────────┘
Compressed layout, all panels still visible
```

### Tablet (768x1024)
```
┌──────────────────┐
│ 64px │ 240px     │ Stacked layout
└──────────────────┘
Sidebar narrower, client panel smaller
```

### Mobile (375x667)
```
┌─────┐
│ 📱 │ Hamburger menu for sidebar
│     │ Single column layout
└─────┘
(Not fully optimized - desktop-first design)
```

---

## Status Indicators

### Client Status
```
✓ Online       Green status dot - System connected and responding
✗ Offline      Gray status dot - System disconnected or no response
⏳ Connecting   Amber status dot - Connection in progress
⚠️ Warning      Red status dot - System has issues
```

### Command Status
```
⏳ Pending      Command queued, awaiting execution
⚙️ Executing    Command running on client
✓ Success      Command completed successfully
✗ Failed       Command failed with error
```

### Threat Level
```
🟢 Low         Safe - No threats detected
🟡 Medium      Caution - Some suspicious activity
🔴 High        Alert - Critical threats detected
```

---

## Keyboard Navigation (Ready for Implementation)

```
Ctrl + K       Search/Command palette
Ctrl + /       Help documentation
Ctrl + L       Focus client search
Alt + 1        Go to Overview
Alt + 2        Go to Clients
Alt + 3        Go to Commands
Alt + 4        Go to Monitoring
Enter          Execute selected command
Escape         Close active modal
```

---

## Information Density

### High Information Areas (Charts, Tables)
- More visual space required
- Larger fonts for readability
- Proper spacing between elements
- Clear legends and labels

### Dense Data Tables
- Compact rows (32px height)
- Monospace font for addresses/paths
- Color-coded status
- Horizontal scrolling if needed

### Visual Hierarchy
```
1. Main Title (32px, bold)
2. Section Headers (20px, bold)
3. Card Titles (16px, semi-bold)
4. Body Text (14px, regular)
5. Help Text (12px, light)
```

---

## Color Usage in Charts

```
CPU Line         #60a5fa (Blue) ────────────
Memory Line      #a78bfa (Purple) ────────
Network Line     #22d3ee (Cyan) ────────

Process Bars     #a78bfa (Purple) ▓▓▓▓▓▓
Text Overlay     #f2f4f7 (White)

Error States     #ef4444 (Red)
Success States   #10b981 (Green)
Warning States   #f59e0b (Amber)
```

---

## Typography Usage

### Headings
```
Main Dashboard Title     → 32px, Bold, Primary Color
Section Headers          → 20px, Bold, Foreground
Card Titles             → 16px, Semi-bold, Foreground
```

### Body Text
```
Normal Text             → 14px, Regular, Foreground
Helper/Secondary        → 12px, Regular, Muted Foreground
Monospace (CLI output)  → 13px, Monospace, Green
```

### Forms/Input
```
Input Labels            → 12px, Medium, Muted Foreground
Placeholder Text        → 14px, Regular, Muted Foreground
Input Text              → 14px, Regular, Foreground
```

---

## Spacing Guide

### Common Spacing Values
```
4px    - Extra small gap (icon spacing)
8px    - Small gap (input padding)
12px   - Medium gap (component padding)
16px   - Large gap (section padding)
24px   - Extra large gap (section margins)
```

### Card Layout
```
┌────────────────────────────────────┐
│ 12px padding                       │
│ ┌──────────────────────────────┐   │
│ │ Card content with 16px gaps  │   │
│ └──────────────────────────────┘   │
│                                    │
└────────────────────────────────────┘
```

---

## Animation & Transitions

### Smooth Transitions
```
Hover Effects       → 150ms ease
Click Feedback      → 100ms scale
Page Transitions    → 200ms fade
Chart Animations    → 300ms easing
```

### Visual Feedback
```
Button Hover        → Color shift + slight scale
Card Hover          → Border color change + shadow
Tab Switch          → Fade transition
Command Execute     → Output slides in
```

---

## Accessibility Considerations

### Focus States
```
All interactive elements have clear focus rings
Focus color: #60a5fa (Primary blue)
Focus width: 2px
```

### Color Contrast
```
Foreground on Background    → 21:1 ratio (exceeds WCAG AAA)
Muted text on Background    → 7:1 ratio (exceeds WCAG AA)
```

### Screen Reader Support
```
All images have alt text
All forms have labels
ARIA roles for sections
Semantic HTML elements
```

---

**Visual design is professional, clean, and purposeful.**
**Every element serves a function in the command and control workflow.**
