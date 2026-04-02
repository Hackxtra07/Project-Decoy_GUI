import { getDatabase } from './db'

export async function getAnalytics() {
    const db = await getDatabase()
    
    // Total Clients
    const totalClients = await db.collection('clients').countDocuments()
    
    // Commands Stats
    const cmdTotals = await db.collection('commands').aggregate([
        {
            $group: {
                _id: null,
                success: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                fail: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } }
            }
        }
    ]).next() as any || { success: 0, fail: 0 }
    
    // OS Distribution
    const osDist = await db.collection('clients').aggregate([
        { $group: { _id: "$os", value: { $sum: 1 } } },
        { $project: { _id: 0, name: "$_id", value: 1 } }
    ]).toArray()
    
    // Privileges
    const adminCount = await db.collection('clients').countDocuments({ is_admin: true })
    const totalCount = totalClients || 1
    const adminPercent = Math.round((adminCount / totalCount) * 100)

    // Activity Trends (last 24h)
    const date24h = new Date()
    date24h.setHours(date24h.getHours() - 24)
    
    // Grouping by hour is a bit tricky with ISODate strings, but we can do it
    const activityTrends = await db.collection('commands').aggregate([
        { $match: { created_at: { $gt: date24h.toISOString() } } },
        {
            $group: {
                _id: { $substr: ["$created_at", 11, 2] }, // extracts HH
                connections: { $sum: 1 }
            }
        },
        { $project: { _id: 0, time: { $concat: ["$_id", ":00"] }, connections: 1 } },
        { $sort: { time: 1 } }
    ]).toArray()
    
    // Loot Distribution
    const lootDist = await db.collection('commands').aggregate([
        { $match: { status: 'completed', command_name: { $in: ['screenshot', 'webcam', 'keylog', 'passwords', 'cookies'] } } },
        { $group: { _id: "$command_name", value: { $sum: 1 } } },
        { $project: { _id: 0, name: "$_id", value: 1 } }
    ]).toArray()

    // Command Stats by Day (last 7 days)
    const date7d = new Date()
    date7d.setDate(date7d.getDate() - 7)
    
    const cmdHistory = await db.collection('commands').aggregate([
        { $match: { created_at: { $gt: date7d.toISOString() } } },
        {
            $group: {
                _id: { $substr: ["$created_at", 0, 10] }, // YYYY-MM-DD
                success: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                fail: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } }
            }
        },
        { $project: { _id: 0, date: "$_id", success: 1, fail: 1 } },
        { $sort: { date: 1 } }
    ]).toArray()

    const topLocations = [
        { name: 'United States', value: 45 },
        { name: 'Russia', value: 25 },
        { name: 'China', value: 15 },
        { name: 'Germany', value: 15 }
    ]

    return {
        totalClients,
        cmdStats: { success: cmdTotals.success, fail: cmdTotals.fail },
        osDist,
        activityTrends,
        lootDist,
        cmdHistory,
        topLocations,
        privileges: {
            admin: adminPercent,
            standard: 100 - adminPercent
        },
        integrityScore: 92
    }
}
