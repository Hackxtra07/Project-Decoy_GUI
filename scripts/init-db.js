import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  console.log('[Database] Created data directory:', dataDir)
}

// Initialize database
const dbPath = path.join(dataDir, 'c2.db')
const db = new Database(dbPath)

console.log('[Database] Connecting to:', dbPath)

// Read and execute schema
const schemaPath = path.join(__dirname, 'setup-db.sql')
const schema = fs.readFileSync(schemaPath, 'utf-8')

try {
  // Split by semicolon and execute each statement
  const statements = schema.split(';').filter(s => s.trim())
  
  for (const statement of statements) {
    if (statement.trim()) {
      db.exec(statement)
    }
  }
  
  console.log('[Database] Schema initialized successfully')
  
  // Verify tables were created
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
  
  console.log('[Database] Tables created:', tables.map(t => t.name).join(', '))
  
} catch (error) {
  console.error('[Database] Error initializing schema:', error.message)
  process.exit(1)
}

// Test connection
try {
  const result = db.prepare('SELECT COUNT(*) as count FROM clients').get()
  console.log('[Database] Connection test successful. Clients count:', result.count)
} catch (error) {
  console.error('[Database] Connection test failed:', error.message)
}

db.close()
console.log('[Database] Database initialization complete')
