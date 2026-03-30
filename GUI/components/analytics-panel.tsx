'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Activity, Target, Zap, ShieldCheck, ShieldAlert, BarChart3, TrendingUp, Globe, Users, Clock, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const COLORS = ['#60a5fa', '#a78bfa', '#22d3ee', '#f472b6', '#fbbf24', '#4ade80']

export default function AnalyticsPanel() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({
    activityTrends: [],
    lootDistribution: [],
    commandStats: [],
    osDistribution: [],
    totalClients: 0,
    totalSuccess: 0,
    totalFail: 0,
    topLocations: [],
    privileges: { admin: 0, standard: 0 },
    integrityScore: 0
  })

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics')
        const json = await res.json()
        if (json.success) {
          const d = json.data
          setData({
            activityTrends: d.activityTrends.length > 0 ? d.activityTrends : [],
            lootDistribution: d.lootDist.length > 0 ? d.lootDist.map((l: any, i: number) => ({
                name: l.name,
                value: l.value,
                color: COLORS[i % COLORS.length]
            })) : [],
            commandStats: d.cmdHistory?.length > 0 ? d.cmdHistory.map((h: any) => ({
                name: h.date.split('-').slice(1).join('/'),
                success: h.success,
                fail: h.fail
            })) : [],
            osDistribution: d.osDist || [],
            topLocations: d.topLocations || [],
            privileges: d.privileges || { admin: 0, standard: 0 },
            integrityScore: d.integrityScore || 0,
            totalClients: d.totalClients || 0,
            totalSuccess: d.cmdStats?.success || 0,
            totalFail: d.cmdStats?.fail || 0
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            Intelligence & Analytics
          </h1>
          <p className="text-muted-foreground">High-performance data analysis and system telemetry</p>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-400 border-green-400/20 bg-green-400/5 px-3 py-1">
                Real-time Sync Active
            </Badge>
            <div className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" /> Updated: {new Date().toLocaleTimeString()}
            </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="Total Compromised" 
            value={data.totalClients?.toString() || "0"} 
            trend={data.totalClients > 0 ? "+1" : "0"} 
            icon={Target} 
            description="Active clients tracked"
            color="text-red-400"
          />
          <StatCard 
            title="Loot Collected" 
            value={data.lootDistribution?.reduce((acc: number, curr: any) => acc + curr.value, 0).toString() || "0"} 
            trend="Files" 
            icon={Database} 
            description="Total database records"
            color="text-blue-400"
          />
          <StatCard 
            title="Success Rate" 
            value={data.totalSuccess + data.totalFail > 0 ? (data.totalSuccess / (data.totalSuccess + data.totalFail) * 100).toFixed(1) + "%" : "100%"} 
            trend={`${data.totalSuccess} OK`} 
            icon={ShieldCheck} 
            description="Command execution"
            color="text-green-400"
          />
          <StatCard 
            title="Active Sessions" 
            value={data.totalClients?.toString() || "0"} 
            trend="Live" 
            icon={Zap} 
            description="Persistent connections"
            color="text-yellow-400"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Activity Chart */}
          <Card className="col-span-1 lg:col-span-2 border-border/40 bg-card/30 backdrop-blur-sm">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" /> Activity Pulse
                  </CardTitle>
                  <CardDescription>Network connections and data captures over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.activityTrends}>
                              <defs>
                                  <linearGradient id="colorConn" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorCap" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                              <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                              />
                              <Area type="monotone" dataKey="connections" stroke="#60a5fa" strokeWidth={2} fillOpacity={1} fill="url(#colorConn)" />
                              <Area type="monotone" dataKey="captures" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#colorCap)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </CardContent>
          </Card>

          {/* Distribution Charts */}
          <Card className="border-border/40 bg-card/30 backdrop-blur-sm">
               <CardHeader>
                  <CardTitle>Resource Allocation</CardTitle>
                  <CardDescription>Types of data captured across all systems</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                  <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                data={data.lootDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {data.lootDistribution.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                 contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                              />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-4 px-4">
                          {data.lootDistribution.map((item: any, i: number) => (
                              <div key={item.name} className="flex items-center gap-2 text-xs">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                  <span className="text-muted-foreground">{item.name}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/30 backdrop-blur-sm">
               <CardHeader>
                  <CardTitle>System Vector Integrity</CardTitle>
                  <CardDescription>Operating system distribution and success metrics</CardDescription>
              </CardHeader>
              <CardContent>
                   <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.commandStats}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip 
                                  cursor={{fill: '#ffffff05'}}
                                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                              />
                              <Bar dataKey="success" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={30} />
                              <Bar dataKey="fail" fill="#f87171" radius={[4, 4, 0, 0]} barSize={30} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2 text-xs">
                           <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                           <span className="text-muted-foreground">Successful Executions</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                           <div className="w-3 h-3 rounded-sm bg-red-400"></div>
                           <span className="text-muted-foreground">Failed Attempts</span>
                      </div>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
               <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-blue-500/10 rounded-xl">
                       <Globe className="w-6 h-6 text-blue-400" />
                   </div>
                   <div>
                       <h3 className="font-semibold">Top Locations</h3>
                       <p className="text-sm text-muted-foreground">Infection hotspots</p>
                   </div>
               </div>
               <div className="space-y-3">
                   {(data.topLocations || []).map((loc: any, i: number) => (
                       <div key={loc.name} className="flex items-center justify-between text-sm">
                           <span>{loc.name}</span>
                           <span className="font-mono text-blue-400">{loc.value}%</span>
                       </div>
                   ))}
               </div>
          </Card>

          <Card className="p-6">
               <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-purple-500/10 rounded-xl">
                       <Users className="w-6 h-6 text-purple-400" />
                   </div>
                   <div>
                       <h3 className="font-semibold">User Privileges</h3>
                       <p className="text-sm text-muted-foreground">Access level overview</p>
                   </div>
               </div>
               <div className="space-y-3">
                   <div className="space-y-1">
                       <div className="flex justify-between text-xs mb-1">
                           <span>Admin / SYSTEM</span>
                           <span className="text-purple-400">{data.privileges?.admin || 0}%</span>
                       </div>
                       <div className="w-full bg-input rounded-full h-1.5 overflow-hidden">
                           <div className="bg-purple-400 h-full" style={{ width: `${data.privileges?.admin || 0}%` }}></div>
                       </div>
                   </div>
                   <div className="space-y-1">
                       <div className="flex justify-between text-xs mb-1">
                           <span>Standard User</span>
                           <span className="text-blue-400">{data.privileges?.standard || 0}%</span>
                       </div>
                       <div className="w-full bg-input rounded-full h-1.5 overflow-hidden">
                           <div className="bg-blue-400 h-full" style={{ width: `${data.privileges?.standard || 0}%` }}></div>
                       </div>
                   </div>
               </div>
          </Card>

          <Card className="p-6">
               <div className="flex items-center gap-4 mb-4">
                   <div className="p-3 bg-amber-500/10 rounded-xl">
                       <ShieldAlert className="w-6 h-6 text-amber-400" />
                   </div>
                   <div>
                       <h3 className="font-semibold">Persistence Rank</h3>
                       <p className="text-sm text-muted-foreground">Stability scoring</p>
                   </div>
               </div>
               <div className="text-center py-2">
                 <div className="text-4xl font-bold text-amber-400">{data.integrityScore || 92}</div>
                 <p className="text-xs text-muted-foreground mt-1">Average Integrity Score</p>
                 <Badge className="mt-4 bg-amber-400/20 text-amber-400 border-none">Tier 1 Threat Level</Badge>
               </div>
          </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, trend, icon: Icon, description, color }: any) {
    return (
        <Card className="relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12`}>
                <Icon className={`w-12 h-12 ${color}`} />
            </div>
            <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs font-medium text-muted-foreground">{title}</span>
                </div>
                <div className="flex items-end gap-2">
                    <div className="text-3xl font-bold">{value}</div>
                    <div className={`text-xs font-semibold mb-1 ${trend.startsWith('+') ? 'text-green-400' : 'text-blue-400'}`}>
                        {trend}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    )
}
