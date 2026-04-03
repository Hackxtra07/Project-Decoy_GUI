import { getDatabase } from './db'

export interface AnalyticsData {
    commands: {
        total: number
        completed: number
        failed: number
        pending: number
    }
    topCommands: {
        name: string
        count: number
    }[]
    activity: {
        date: string
        count: number
    }[]
}

export async function getAnalytics(): Promise<any> {
    const db = await getDatabase()

    // 1. Client Statistics
    const totalClients = await db.collection('clients').countDocuments()
    
    const osData = await db.prepare(`SELECT os as name, COUNT(*) as value FROM clients GROUP BY os`).all()
    const adminCount = await db.collection('clients').countDocuments({ is_admin: 1 })
    const standardCount = totalClients - adminCount

    // 2. Command Statistics
    const cmdStatsRaw = await db.prepare(`
        SELECT 
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as fail
        FROM commands
    `).get()
    
    const cmdHistory = await db.prepare(`
        SELECT date(created_at) as date, 
               SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success,
               SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as fail
        FROM commands
        WHERE created_at >= date('now', '-7 days')
        GROUP BY date(created_at)
        ORDER BY date ASC
    `).all()

    // 3. Loot Distribution
    const lootDist = await db.prepare(`
        SELECT type as name, COUNT(*) as value FROM loot GROUP BY type
    `).all()

    // 4. Activity Trends (Simulation of real data for the graph)
    // In a real app we'd join with telemetry, here we use command/loot activity
    const activityTrends = await db.prepare(`
        SELECT strftime('%H:00', timestamp) as time, 
               COUNT(DISTINCT client_id) as connections,
               COUNT(*) as captures
        FROM (SELECT timestamp, client_id FROM system_info UNION ALL SELECT timestamp, client_id FROM loot)
        WHERE timestamp >= datetime('now', '-24 hours')
        GROUP BY time
        ORDER BY time ASC
    `).all()

    return {
        totalClients,
        osDist: osData || [],
        privileges: {
            admin: totalClients > 0 ? Math.round((adminCount / totalClients) * 100) : 0,
            standard: totalClients > 0 ? Math.round((standardCount / totalClients) * 100) : 0
        },
        cmdStats: {
            success: Number(cmdStatsRaw?.success || 0),
            fail: Number(cmdStatsRaw?.fail || 0)
        },
        cmdHistory: cmdHistory || [],
        lootDist: lootDist || [],
        activityTrends: activityTrends || [],
        topLocations: [
            { name: "United States", value: 45 },
            { name: "Germany", value: 22 },
            { name: "Russia", value: 18 },
            { name: "China", value: 15 }
        ],
        integrityScore: 94
    }
}
