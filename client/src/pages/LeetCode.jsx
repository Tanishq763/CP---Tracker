import React, { useState, useEffect } from 'react'
import { trackLCSearch } from '../hooks/useAnalytics'
import LCRoadmapTab from './LCRoadmapTab'
import axios from 'axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const diffColors = {
  easy:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', bar: '#10b981', glow: 'shadow-emerald-500/20' },
  medium: { bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   text: 'text-amber-400',   bar: '#f59e0b', glow: 'shadow-amber-500/20' },
  hard:   { bg: 'bg-rose-500/10',    border: 'border-rose-500/25',    text: 'text-rose-400',    bar: '#f43f5e', glow: 'shadow-rose-500/20' },
}

const weekColors = [
  { bg: 'bg-violet-500/10', border: 'border-violet-500/25', accent: 'text-violet-400', badge: 'bg-violet-500/15 border-violet-500/30 text-violet-300' },
  { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/25',   accent: 'text-cyan-400',   badge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' },
  { bg: 'bg-rose-500/10',   border: 'border-rose-500/25',   accent: 'text-rose-400',   badge: 'bg-rose-500/15 border-rose-500/30 text-rose-300' },
  { bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  accent: 'text-amber-400',  badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  { bg: 'bg-emerald-500/10',border: 'border-emerald-500/25',accent: 'text-emerald-400',badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
]

// ─────────────────────────────────────────────────────────────────────────────
// HEATMAP
// ─────────────────────────────────────────────────────────────────────────────
const Heatmap = ({ data }) => {
  const today = new Date()
  const start = new Date(today); start.setMonth(start.getMonth() - 6)
  const dateMap = {}
  data.forEach(d => { dateMap[d.date] = d.count })
  const days = []
  const cur = new Date(start)
  while (cur <= today) {
    const ds = cur.toISOString().split('T')[0]
    days.push({ date: ds, count: dateMap[ds] || 0 })
    cur.setDate(cur.getDate() + 1)
  }
  const maxCount = Math.max(...days.map(d => d.count), 1)
  const getColor = c => {
    if (c === 0) return '#111827'
    const i = c / maxCount
    if (i < 0.25) return '#065f46'
    if (i < 0.5) return '#059669'
    if (i < 0.75) return '#10b981'
    return '#34d399'
  }
  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-[3px] min-w-max">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div key={di} title={`${day.date}: ${day.count} submissions`}
                  className="w-[11px] h-[11px] rounded-[2px] transition-opacity hover:opacity-70 cursor-pointer"
                  style={{ backgroundColor: getColor(day.count) }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 text-[10px]">Less</span>
          {['#111827','#065f46','#059669','#10b981','#34d399'].map((c,i) => (
            <div key={i} className="w-[11px] h-[11px] rounded-[2px]" style={{ backgroundColor: c }} />
          ))}
          <span className="text-slate-600 text-[10px]">More</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DIFFICULTY RING
// ─────────────────────────────────────────────────────────────────────────────
const DiffRing = ({ solved }) => {
  const data = [
    { name: 'Easy',   value: solved.easy   || 0.01, color: '#10b981' },
    { name: 'Medium', value: solved.medium || 0.01, color: '#f59e0b' },
    { name: 'Hard',   value: solved.hard   || 0.01, color: '#f43f5e' },
  ]
  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <PieChart width={144} height={144}>
        <Pie data={data} cx={68} cy={68} innerRadius={46} outerRadius={66} paddingAngle={3} dataKey="value" strokeWidth={0}>
          {data.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-mono text-white">{solved.total}</span>
        <span className="text-slate-500 text-[10px] uppercase tracking-wider">solved</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM CARD (for roadmap)
// ─────────────────────────────────────────────────────────────────────────────
const ProblemCard = ({ prob }) => {
  const dc = diffColors[prob.difficulty?.toLowerCase()] || diffColors.medium
  return (
    <a href={prob.link} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-between bg-[#080c14] hover:bg-[#0d1424] border border-[#1e304d] hover:border-violet-500/30 rounded-lg px-4 py-2.5 transition-all group">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-slate-600 font-mono text-[10px] flex-shrink-0">#{prob.id}</span>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate group-hover:text-violet-300 transition-colors">{prob.name}</p>
          {prob.isBlind75 && (
            <span className="text-[9px] text-amber-500/70 font-mono">★ Blind 75</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${dc.bg} ${dc.border} ${dc.text}`}>
          {prob.difficulty}
        </span>
        <span className="text-violet-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
      </div>
    </a>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DAY CARD
// ─────────────────────────────────────────────────────────────────────────────
const DayCard = ({ day, colors }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-xl border transition-all ${open ? `${colors.bg} ${colors.border}` : 'border-[#1e304d] hover:border-[#2d3f5c]'}`}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(o => !o)}>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 ${colors.bg} ${colors.accent} border ${colors.border}`}>
          {day.day}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate capitalize">{day.topic}</p>
          <p className="text-slate-500 text-xs truncate">{day.goal}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${colors.badge}`}>{day.difficulty}</span>
          {day.lcProblems?.length > 0 && (
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">
              {day.lcProblems.length} problems
            </span>
          )}
          <span className={`text-slate-500 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1e304d]/60 space-y-3">
          {/* Concepts */}
          {day.concepts?.length > 0 && (
            <div className="pt-3">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">Key Concepts</p>
              <div className="flex flex-wrap gap-1.5">
                {day.concepts.map((c, i) => (
                  <span key={i} className={`text-xs px-2.5 py-1 rounded-lg border ${colors.badge}`}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="flex gap-2 bg-[#080c14] rounded-lg px-3 py-2.5">
            <span className="text-amber-400 flex-shrink-0 text-sm">💡</span>
            <p className="text-slate-300 text-xs leading-relaxed">{day.tip}</p>
          </div>

          {/* LC Problems */}
          {day.lcProblems?.length > 0 && (
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">📌 Practice Problems (LeetCode)</p>
              <div className="space-y-1.5">
                {day.lcProblems.map((p, i) => <ProblemCard key={i} prob={p} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEK CARD
// ─────────────────────────────────────────────────────────────────────────────
const WeekCard = ({ week, index }) => {
  const [expanded, setExpanded] = useState(index === 0)
  const colors = weekColors[index % weekColors.length]
  const blind75Count = week.days?.reduce((s, d) => s + (d.lcProblems?.filter(p => p.isBlind75).length || 0), 0) || 0
  const totalProbs = week.days?.reduce((s, d) => s + (d.lcProblems?.length || 0), 0) || 0

  return (
    <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl overflow-hidden animate-slide-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}>
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-white/[0.015] transition-colors">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${colors.bg} ${colors.border}`}>
          <span className={`text-xl font-bold font-mono ${colors.accent}`}>{week.week}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="text-[10px] text-slate-500 font-mono uppercase">Week {week.week}</span>
          <p className="text-white font-semibold text-sm">{week.theme}</p>
          <p className="text-slate-500 text-xs truncate">{week.focus}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {blind75Count > 0 && (
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-1 rounded font-mono">
              ★ {blind75Count} Blind75
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono">{totalProbs} problems</span>
          <span className={`text-slate-400 text-sm transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      {expanded && (
        <div className="px-6 pb-6 space-y-2 border-t border-[#1e304d]">
          <div className="pt-4 space-y-2">
            {week.days?.map(day => <DayCard key={day.day} day={day} colors={colors} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS TAB
// ─────────────────────────────────────────────────────────────────────────────
const StatsTab = ({ data }) => {
  const { profile, solved, totalAvailable, beats, acceptRate, streak, totalActiveDays, submissionCalendar, contest, contestHistory } = data

  const ContestTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-[#111827] border border-[#1e304d] rounded-xl px-4 py-3 text-sm shadow-xl">
        <p className="text-slate-300 text-xs mb-1 max-w-[200px] truncate">{d.title}</p>
        <p className="text-amber-400 font-mono font-bold">{d.rating}</p>
        <p className="text-slate-500 text-xs">Rank #{d.ranking?.toLocaleString()}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Profile */}
      <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="relative">
            <img src={profile.avatar} alt="avatar"
              className="w-20 h-20 rounded-2xl border-2 border-[#1e304d] object-cover"
              onError={e => e.target.style.display = 'none'} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-xs font-bold text-black">
              LC
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="text-2xl font-bold text-white font-mono">{profile.username}</h2>
              {profile.realName && <span className="text-slate-400 text-sm">{profile.realName}</span>}
              <a href={`https://leetcode.com/${profile.username}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-amber-400 hover:underline">↗ LC</a>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {profile.country && <span className="text-slate-500 text-xs">🌍 {profile.country}</span>}
              {profile.company && <span className="text-slate-500 text-xs">🏢 {profile.company}</span>}
              {profile.school && <span className="text-slate-500 text-xs">🎓 {profile.school}</span>}
            </div>
            {profile.badges?.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {profile.badges.map((b, i) => (
                  <span key={i} className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{b.name}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-6 text-center flex-shrink-0">
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Global Rank</p>
              <p className="text-xl font-bold font-mono text-amber-400">#{profile.ranking?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Reputation</p>
              <p className="text-xl font-bold font-mono text-orange-400">{profile.reputation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Accept Rate', value: `${acceptRate}%`, icon: '✅', color: 'text-emerald-400' },
          { label: 'Streak', value: `${streak}d`, icon: '🔥', color: 'text-orange-400' },
          { label: 'Active Days', value: totalActiveDays, icon: '📅', color: 'text-blue-400' },
          { label: 'Contests', value: contest.attended, icon: '🏆', color: 'text-amber-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-xs uppercase tracking-wider">{label}</p>
              <span className="text-lg">{icon}</span>
            </div>
            <p className={`text-3xl font-bold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Difficulty + Contest */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Difficulty */}
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-5 text-sm">Problems by Difficulty</h3>
          <div className="flex items-center gap-6">
            <DiffRing solved={solved} />
            <div className="flex-1 space-y-4">
              {['easy', 'medium', 'hard'].map(d => {
                const c = diffColors[d]
                const pct = totalAvailable[d] > 0 ? (solved[d] / totalAvailable[d]) * 100 : 0
                return (
                  <div key={d}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-semibold capitalize ${c.text}`}>{d}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-sm font-bold">{solved[d]}</span>
                        <span className="text-slate-600 text-xs">/ {totalAvailable[d]}</span>
                        {beats[d] && <span className={`text-[10px] font-mono ${c.text}`}>beats {beats[d]}%</span>}
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#080c14] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.bar, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Contest */}
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-5 text-sm">Contest Performance</h3>
          {contest.attended === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm flex-col gap-2">
              <span className="text-3xl">🎯</span>
              No contests yet
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Rating', value: contest.rating, color: 'text-amber-400' },
                  { label: 'Global Rank', value: `#${contest.globalRanking?.toLocaleString()}`, color: 'text-blue-400' },
                  { label: 'Contests', value: contest.attended, color: 'text-emerald-400' },
                  { label: 'Top %', value: contest.topPercentage ? `${contest.topPercentage}%` : 'N/A', color: 'text-violet-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#080c14] rounded-xl px-3 py-2.5 border border-[#1e304d]">
                    <p className="text-slate-500 text-[10px] mb-1">{label}</p>
                    <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              {contestHistory.length > 0 && (
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={contestHistory}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <XAxis dataKey="title" hide />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-[#111827] border border-[#1e304d] rounded-xl px-3 py-2 text-xs shadow-xl">
                          <p className="text-slate-300 mb-1 max-w-[160px] truncate">{d.title}</p>
                          <p className="text-amber-400 font-mono font-bold">{d.rating}</p>
                        </div>
                      )
                    }} />
                    <Line type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={2}
                      dot={{ r: 2, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-sm">Submission Activity</h3>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>🔥 {streak} day streak</span>
            <span>📅 {totalActiveDays} active days</span>
          </div>
        </div>
        {submissionCalendar.length > 0
          ? <Heatmap data={submissionCalendar} />
          : <p className="text-slate-500 text-sm">No submission data.</p>}
      </div>

      {/* Contest table */}
      {contestHistory.length > 0 && (
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e304d]">
            <h3 className="text-white font-semibold text-sm">Recent Contests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-[#1e304d]">
                  <th className="text-left px-6 py-3">#</th>
                  <th className="text-left px-6 py-3">Contest</th>
                  <th className="text-left px-6 py-3">Rating</th>
                  <th className="text-left px-6 py-3">Rank</th>
                  <th className="text-left px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {[...contestHistory].reverse().map((c, i) => (
                  <tr key={i} className="border-b border-[#1e304d]/40 hover:bg-white/[0.015] transition-colors">
                    <td className="px-6 py-3 text-slate-600 font-mono text-xs">{String(i+1).padStart(2,'0')}</td>
                    <td className="px-6 py-3 text-white text-sm max-w-[200px] truncate">{c.title}</td>
                    <td className="px-6 py-3 text-amber-400 font-mono font-bold">{c.rating}</td>
                    <td className="px-6 py-3 text-slate-400 font-mono text-sm">#{c.ranking?.toLocaleString()}</td>
                    <td className="px-6 py-3 text-slate-500 text-xs">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LEETCODE PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function LeetCode() {
  const [handle, setHandle] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('stats')

  useEffect(() => {
    if (!handle) return
    const fetchData = async () => {
      setLoading(true); setError(''); setData(null)
      try {
        const res = await axios.get(`/api/leetcode/${handle}/stats`)
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.error || 'User not found or LeetCode API unavailable.')
      } finally { setLoading(false) }
    }
    fetchData()
  }, [handle])

  const handleSearch = e => {
    e.preventDefault()
    if (inputVal.trim()) { setHandle(inputVal.trim()); setActiveTab('stats'); trackLCSearch(inputVal.trim()) }
  }

  // ── Landing ────────────────────────────────────────────────────────────────
  if (!handle) return (
    <div className="flex flex-col items-center justify-center py-20 gap-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-5xl">
            🟨
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">AI</div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">LeetCode Tracker</h1>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">Track your stats, submission heatmap, contest history, and get an AI-generated DSA roadmap with famous problems.</p>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {[
          { icon: '📊', label: 'Full Stats Dashboard', desc: 'Solved, beats%, ranking' },
          { icon: '🔥', label: 'Submission Heatmap', desc: '6 months activity' },
          { icon: '🏆', label: 'Contest History', desc: 'Rating graph + history' },
          { icon: '🤖', label: 'AI DSA Roadmap', desc: 'With Blind 75 problems' },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="bg-[#0d1424] border border-[#1e304d] rounded-xl p-4">
            <span className="text-2xl mb-2 block">{icon}</span>
            <p className="text-white text-sm font-medium">{label}</p>
            <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 w-full max-w-sm">
        <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
          placeholder="Enter LeetCode username..."
          className="flex-1 bg-[#0d1424] border border-[#1e304d] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition font-mono text-sm" />
        <button type="submit"
          className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-5 py-3 rounded-xl transition active:scale-95 text-sm">
          Go →
        </button>
      </form>
    </div>
  )

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
      <p className="text-slate-400 text-sm">Fetching <span className="text-amber-400 font-mono">{handle}</span>...</p>
    </div>
  )

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="text-4xl">⚠️</div>
      <p className="text-rose-400 text-sm text-center max-w-md">{error}</p>
      <button onClick={() => { setHandle(''); setError('') }}
        className="text-amber-400 text-sm hover:underline">← Try another username</button>
    </div>
  )

  if (!data) return null

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar: search + tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs pointer-events-none">lc/</span>
            <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder={handle}
              className="bg-[#0d1424] border border-[#1e304d] rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition font-mono text-sm w-48" />
          </div>
          <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm">Go</button>
        </form>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#0d1424] border border-[#1e304d] rounded-xl p-1">
          {[
            { id: 'stats', label: '📊 Stats' },
            { id: 'roadmap', label: '🤖 AI Roadmap' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? tab.id === 'roadmap'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'stats' && <StatsTab data={data} />}
      {activeTab === 'roadmap' && <LCRoadmapTab handle={handle} cfData={null} />}
    </div>
  )
}
