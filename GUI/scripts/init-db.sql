-- Initialize SQLite database schema for C2 Dashboard

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  hostname TEXT,
  os_type TEXT,
  status TEXT DEFAULT 'offline',
  last_seen INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Commands table
CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  command_type TEXT NOT NULL,
  parameters TEXT,
  status TEXT DEFAULT 'pending',
  output TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  executed_at INTEGER,
  completed_at INTEGER,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_info (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  cpu_percent REAL,
  memory_percent REAL,
  disk_percent REAL,
  network_in INTEGER,
  network_out INTEGER,
  processes_count INTEGER,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Files operations table
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  status TEXT DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  last_activity INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_commands_client_id ON commands(client_id);
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
CREATE INDEX IF NOT EXISTS idx_system_info_client_id ON system_info(client_id);
CREATE INDEX IF NOT EXISTS idx_files_client_id ON files(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
