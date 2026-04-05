import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n ?? 0)

const StatBox = ({ label, value, sub, color, icon, delay = 0 }) => (
  <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-5 animate-slide-up"
    style={{ animationDelay:`${delay}ms`, animationFillMode:'both' }}>
    <div className="flex items-start justify-between mb-3">
      <p className="text-slate-400 text-xs uppercase tracking-wider">{label}</p>
      <span className="text-xl">{icon}</span>
    </div>
    <p className={`text-3xl font-bold font-mono ${color}`}>{fmt(value)}</p>
    {sub && <p className="text-slate-600 text-xs mt-1">{sub}</p>}
  </div>
)

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111b2e] border border-[#1e304d] rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-mono">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Password gate ─────────────────────────────────────────────────────────────
const PasswordGate = ({ onAuth }) => {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const tryAuth = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await axios.get(`/api/analytics/dashboard?password=${pwd}`)
      onAuth(pwd)
    } catch (err) {
      setError(err.response?.status === 401 ? 'Wrong password' : 'Server error')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6 animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#0d1424] border border-[#1e304d] flex items-center justify-center text-3xl mx-auto mb-4">🔒</div>
        <h2 className="text-xl font-bold text-white mb-1">Analytics Dashboard</h2>
        <p className="text-slate-500 text-sm">Enter your analytics password</p>
      </div>
      <form onSubmit={tryAuth} className="flex gap-2 w-full max-w-xs">
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)}
          placeholder="Password..."
          className="flex-1 bg-[#0d1424] border border-[#1e304d] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 text-sm" />
        <button type="submit" disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 rounded-xl transition text-sm disabled:opacity-50">
          {loading ? '...' : 'Go'}
        </button>
      </form>
      {error && <p className="text-rose-400 text-sm">{error}</p>}
      <p className="text-slate-700 text-xs">Set ANALYTICS_PASSWORD in server/.env<br/>Leave blank to disable auth</p>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Analytics() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [password, setPassword] = useState(null)
  const [authed, setAuthed]     = useState(false)
  const [activeChart, setActiveChart] = useState('visits')

  const fetchData = async (pwd = password) => {
    setLoading(true); setError('')
    try {
      const url = `/api/analytics/dashboard${pwd ? `?password=${pwd}` : ''}`
      const res = await axios.get(url)
      setData(res.data)
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthed(false)
      } else {
        setError(err.response?.data?.error || 'Failed to load analytics')
      }
    } finally { setLoading(false) }
  }

  // Try without password first
  useEffect(() => {
    fetchData('')
    const interval = setInterval(() => fetchData(), 60000) // refresh every minute
    return () => clearInterval(interval)
  }, [])

  const handleAuth = (pwd) => {
    setPassword(pwd)
    setAuthed(true)
    fetchData(pwd)
  }

  if (!authed && !data && !loading) return <PasswordGate onAuth={handleAuth} />

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
      <p className="text-slate-400 text-sm">Loading analytics...</p>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="text-4xl">⚠️</div>
      <p className="text-rose-400 text-sm">{error}</p>
      <button onClick={() => fetchData()} className="text-blue-400 text-sm hover:underline">Retry</button>
    </div>
  )

  if (!data) return null

  const { summary, dailyChart, platforms, topUsers, recentActivity, hourlyToday } = data

  // Prepare chart data
  const chartData = dailyChart.map(d => ({
    date: d.date.slice(5), // MM-DD
    Visits: d.total_visits,
    'Unique Users': d.unique_users,
    'CF Searches': d.cf_searches,
    'LC Searches': d.lc_searches,
    'Roadmaps': d.roadmaps_gen,
  }))

  const hourlyData = Array.from({length:24}, (_, h) => {
    const found = hourlyToday?.find(x => parseInt(x.hour) === h)
    return { hour: `${String(h).padStart(2,'0')}:00`, visits: found?.visits || 0 }
  })

  const retentionRate = summary.mau > 0 ? Math.round((summary.dau / summary.mau) * 100) : 0
  const stickiness    = summary.mau > 0 ? Math.round((summary.wau / summary.mau) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📊 Analytics Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time usage stats for CP Tracker</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-[#0d1424] border border-[#1e304d] rounded-lg px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live · refreshes every 60s
          </div>
          <button onClick={() => fetchData()}
            className="text-sm text-blue-400 hover:text-blue-300 border border-[#1e304d] hover:border-blue-500/30 px-3 py-2 rounded-lg transition">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Total Users Ever" value={summary.totalUsers} icon="👥" color="text-blue-400" sub="registered handles" delay={0} />
        <StatBox label="Daily Active (DAU)" value={summary.dau} icon="🟢" color="text-emerald-400" sub="active today" delay={50} />
        <StatBox label="Weekly Active (WAU)" value={summary.wau} icon="📅" color="text-cyan-400" sub="last 7 days" delay={100} />
        <StatBox label="Monthly Active (MAU)" value={summary.mau} icon="📆" color="text-violet-400" sub="last 30 days" delay={150} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Visits Today" value={summary.todayVisits} icon="👁️" color="text-white" sub="page views" delay={200} />
        <StatBox label="Total Visits" value={summary.totalVisits} icon="🌐" color="text-amber-400" sub="all time" delay={250} />
        <StatBox label="Roadmaps Generated" value={summary.totalRoadmaps} icon="🤖" color="text-purple-400" sub="AI roadmaps" delay={300} />
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-5 animate-slide-up" style={{animationDelay:'350ms',animationFillMode:'both'}}>
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Engagement</p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">DAU/MAU</span>
                <span className="text-emerald-400 font-mono">{retentionRate}%</span>
              </div>
              <div className="h-1.5 bg-[#080c14] rounded-full">
                <div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.min(retentionRate,100)}%`}} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">WAU/MAU</span>
                <span className="text-cyan-400 font-mono">{stickiness}%</span>
              </div>
              <div className="h-1.5 bg-[#080c14] rounded-full">
                <div className="h-full bg-cyan-500 rounded-full" style={{width:`${Math.min(stickiness,100)}%`}} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main chart */}
        <div className="lg:col-span-2 bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h3 className="text-white font-semibold">30-Day Trends</h3>
            <div className="flex gap-1">
              {['visits','users','searches','roadmaps'].map(c => (
                <button key={c} onClick={() => setActiveChart(c)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all capitalize ${
                    activeChart === c ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'border-[#1e304d] text-slate-500 hover:text-slate-300'
                  }`}>{c}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e304d" />
              <XAxis dataKey="date" stroke="#334155" tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false} interval={4} />
              <YAxis stroke="#334155" tick={{fontSize:10,fill:'#64748b',fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              {activeChart === 'visits'   && <Line type="monotone" dataKey="Visits" stroke="#3b82f6" strokeWidth={2} dot={false} />}
              {activeChart === 'users'    && <Line type="monotone" dataKey="Unique Users" stroke="#10b981" strokeWidth={2} dot={false} />}
              {activeChart === 'searches' && <>
                <Line type="monotone" dataKey="CF Searches" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="LC Searches" stroke="#a78bfa" strokeWidth={2} dot={false} />
                <Legend />
              </>}
              {activeChart === 'roadmaps' && <Line type="monotone" dataKey="Roadmaps" stroke="#8b5cf6" strokeWidth={2} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly today */}
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-5 text-sm">Today by Hour</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData} margin={{left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e304d" vertical={false} />
              <XAxis dataKey="hour" tick={{fontSize:9,fill:'#475569'}} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="visits" fill="#3b82f6" radius={[3,3,0,0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Platform breakdown + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Platform pie */}
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-5 text-sm">Platform Breakdown</h3>
          <div className="space-y-3">
            {platforms?.length > 0 ? platforms.map(p => {
              const total = platforms.reduce((s,x) => s+x.users, 0)
              const pct = total > 0 ? Math.round((p.users/total)*100) : 0
              const isLC = p.platform === 'lc'
              return (
                <div key={p.platform}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white flex items-center gap-1.5">
                      {isLC ? '🟨' : '⚡'} {isLC ? 'LeetCode' : 'Codeforces'}
                    </span>
                    <span className={`font-mono ${isLC ? 'text-amber-400' : 'text-blue-400'}`}>
                      {p.users} users ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[#080c14] rounded-full">
                    <div className={`h-full rounded-full transition-all duration-700 ${isLC ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{width:`${pct}%`}} />
                  </div>
                </div>
              )
            }) : (
              <p className="text-slate-600 text-sm text-center py-8">No data yet</p>
            )}
          </div>

          {/* Summary stats */}
          <div className="mt-5 pt-5 border-t border-[#1e304d] grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold font-mono text-blue-400">{fmt(summary.dau)}</p>
              <p className="text-slate-600 text-[10px]">Today</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold font-mono text-violet-400">{fmt(summary.totalRoadmaps)}</p>
              <p className="text-slate-600 text-[10px]">Roadmaps</p>
            </div>
          </div>
        </div>

        {/* Recent activity feed */}
        <div className="lg:col-span-2 bg-[#0d1424] border border-[#1e304d] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e304d]">
            <h3 className="text-white font-semibold text-sm">🕐 Recent User Activity</h3>
          </div>
          <div className="divide-y divide-[#1e304d]/50">
            {recentActivity?.length > 0 ? recentActivity.map((u, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.015] transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                  u.platform === 'lc' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-blue-500/10 border border-blue-500/20'
                }`}>
                  {u.platform === 'lc' ? '🟨' : '⚡'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-mono font-medium">{u.handle}</p>
                  <p className="text-slate-500 text-xs capitalize">{u.platform === 'lc' ? 'LeetCode' : 'Codeforces'}</p>
                </div>
                <p className="text-slate-600 text-xs flex-shrink-0">{u.last_seen}</p>
              </div>
            )) : (
              <div className="flex items-center justify-center py-12 text-slate-600 text-sm">
                No activity yet — start searching users!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top users table */}
      {topUsers?.length > 0 && (
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e304d]">
            <h3 className="text-white font-semibold text-sm">🏆 Most Active Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-[#1e304d]">
                  <th className="text-left px-6 py-3">#</th>
                  <th className="text-left px-6 py-3">Handle</th>
                  <th className="text-left px-6 py-3">Platform</th>
                  <th className="text-left px-6 py-3">Visits</th>
                  <th className="text-left px-6 py-3">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((u, i) => (
                  <tr key={i} className="border-b border-[#1e304d]/40 hover:bg-white/[0.015] transition-colors">
                    <td className="px-6 py-3 text-slate-600 font-mono text-xs">{String(i+1).padStart(2,'0')}</td>
                    <td className="px-6 py-3 text-white font-mono text-sm font-medium">{u.handle}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        u.platform === 'lc'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                        {u.platform === 'lc' ? 'LeetCode' : 'Codeforces'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-emerald-400 font-mono font-bold">{u.visit_count}</td>
                    <td className="px-6 py-3 text-slate-500 text-xs">{u.last_seen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-slate-700 text-xs text-center pb-4">
        Analytics stored locally in SQLite · Data is private · Auto-refreshes every 60 seconds
      </p>
    </div>
  )
}
