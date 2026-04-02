import { MongoClient, Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

export async function getDatabase(): Promise<Db> {
  if (!db) {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error('Please define the MONGODB_URI environment variable')
    }

    client = new MongoClient(uri)
    await client.connect()
    db = client.db('c2_database') // Explicit DB name — avoids defaulting to 'test'
    
    // Initialize indexes for fast queries
    await db.collection('clients').createIndex({ id: 1 }, { unique: true })
    await db.collection('clients').createIndex({ status: 1 })
    await db.collection('commands').createIndex({ id: 1 }, { unique: true })
    await db.collection('commands').createIndex({ client_id: 1 })
    await db.collection('commands').createIndex({ status: 1 })
    await db.collection('system_info').createIndex({ client_id: 1, timestamp: -1 })
    await db.collection('files').createIndex({ id: 1 }, { unique: true })
    await db.collection('files').createIndex({ client_id: 1 })
    await db.collection('sessions').createIndex({ id: 1 }, { unique: true })
    await db.collection('credentials').createIndex({ id: 1 }, { unique: true })
    await db.collection('credentials').createIndex({ client_id: 1 })
  }
  
  return db
}

export async function closeDatabase() {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}
