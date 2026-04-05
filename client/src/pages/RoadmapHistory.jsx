import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ratingColor = r => {
  if (!r) return 'text-slate-400'
  if (r >= 2400) return 'text-red-400'
  if (r >= 1900) return 'text-purple-400'
  if (r >= 1600) return 'text-blue-400'
  if (r >= 1400) return 'text-cyan-400'
  if (r >= 1200) return 'text-green-400'
  return 'text-slate-400'
}

const weekColors = [
  { bg:'bg-blue-500/10',   border:'border-blue-500/25',   accent:'text-blue-400'   },
  { bg:'bg-purple-500/10', border:'border-purple-500/25', accent:'text-purple-400' },
  { bg:'bg-cyan-500/10',   border:'border-cyan-500/25',   accent:'text-cyan-400'   },
  { bg:'bg-green-500/10',  border:'border-green-500/25',  accent:'text-green-400'  },
  { bg:'bg-orange-500/10', border:'border-orange-500/25', accent:'text-orange-400' },
]

const DayCard = ({ day, colors, platform }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-xl border transition-all ${open ? `${colors.bg} ${colors.border}` : 'border-[#1e304d] hover:border-[#2a3f5f]'}`}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(o => !o)}>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 ${colors.bg} ${colors.accent} border ${colors.border}`}>
          {day.day}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate capitalize">{day.topic}</p>
          <p className="text-slate-500 text-xs truncate">{day.goal}</p>
        </div>
        <span className={`text-slate-500 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[#1e304d]/60 space-y-3" onClick={e => e.stopPropagation()}>
          {day.whyToday && (
            <div className="mt-3 flex gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2.5">
              <span className="text-blue-400 flex-shrink-0">🎯</span>
              <p className="text-slate-300 text-xs">{day.whyToday}</p>
            </div>
          )}
          {day.tip && (
            <div className="flex gap-2 bg-[#0d1424] rounded-xl px-3 py-2.5 border border-[#1e304d]">
              <span className="text-yellow-400 flex-shrink-0">💡</span>
              <p className="text-slate-300 text-xs">{day.tip}</p>
            </div>
          )}
          {/* CF Problems */}
          {platform === 'cf' && day.cfProblems?.length > 0 && (
            <div className="space-y-1.5">
              {day.cfProblems.map((prob, i) => (
                <a key={i} href={prob.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between bg-[#0d1424] hover:bg-[#111b2e] border border-[#1e304d] hover:border-blue-500/30 rounded-lg px-4 py-2.5 transition-all group">
                  <p className="text-white text-sm truncate group-hover:text-blue-300">{prob.name}</p>
                  <span className={`font-mono font-bold text-sm ml-3 ${ratingColor(prob.rating)}`}>{prob.rating}</span>
                </a>
              ))}
            </div>
          )}
          {/* LC Problems */}
          {platform === 'lc' && day.lcProblems?.length > 0 && (
            <div className="space-y-1.5">
              {day.lcProblems.map((prob, i) => (
                <a key={i} href={prob.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between bg-[#0d1424] hover:bg-[#111b2e] border border-[#1e304d] hover:border-amber-500/30 rounded-lg px-4 py-2.5 transition-all group">
                  <div>
                    <p className="text-white text-sm group-hover:text-amber-300">#{prob.id} {prob.name}</p>
                    <div className="flex gap-1 mt-0.5">
                      {prob.sheets?.map(s => <span key={s} className="text-[9px] text-amber-500/60">{s}</span>)}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ml-3 ${prob.diff === 'Easy' ? 'bg-green-500/10 border-green-500/20 text-green-400' : prob.diff === 'Hard' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                    {prob.diff}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RoadmapHistoryView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getRoadmap } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const d = await getRoadmap(id)
        setData(d)
      } catch { setError('Roadmap not found') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center flex-col gap-4">
      <p className="text-rose-400">{error}</p>
      <button onClick={() => navigate('/profile')} className="text-blue-400 text-sm hover:underline">← Back to profile</button>
    </div>
  )

  if (!data) return null

  const roadmap = data.roadmap_json?.roadmap || data.roadmap_json
  const platform = data.platform

  return (
    <div className="min-h-screen bg-[#080c14]">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Back */}
        <button onClick={() => navigate('/profile')}
          className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition">
          ← Back to profile
        </button>

        {/* Header */}
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">{platform === 'cf' ? '⚡' : '🟨'}</span>
            <div>
              <p className="text-slate-400 text-xs font-mono mb-1">
                {platform === 'cf' ? 'Codeforces' : 'LeetCode'} · {data.handle} · {data.duration} days
              </p>
              <h1 className="text-xl font-bold text-white">{data.title}</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">{roadmap?.summary}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-[#1e304d]">
            <span className="text-slate-500 text-xs">Saved on {new Date(data.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</span>
            {data.target && (
              <span className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-lg font-mono ml-auto">
                Target: {data.target}
              </span>
            )}
          </div>
        </div>

        {/* Weeks */}
        <div className="space-y-4">
          {roadmap?.weeks?.map((week, i) => {
            const colors = weekColors[i % weekColors.length]
            const [expanded, setExpanded] = useState(i === 0)
            return (
              <div key={week.week} className="bg-[#0d1424] border border-[#1e304d] rounded-2xl overflow-hidden">
                <button onClick={() => setExpanded(e => !e)}
                  className="w-full flex items-center gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors.bg} ${colors.border}`}>
                    <span className={`text-xl font-bold font-mono ${colors.accent}`}>{week.week}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold">{week.theme}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{week.focus}</p>
                  </div>
                  <span className={`text-slate-400 text-sm transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {expanded && (
                  <div className="px-6 pb-6 border-t border-[#1e304d]">
                    <div className="pt-4 space-y-2">
                      {week.days?.map(day => (
                        <DayCard key={day.day} day={day} colors={colors} platform={platform} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
