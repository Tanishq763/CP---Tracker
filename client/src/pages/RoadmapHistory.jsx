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

// ── Day Card ──────────────────────────────────────────────────────────────────
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
        <span className={`text-slate-500 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1e304d]/60 space-y-3" onClick={e => e.stopPropagation()}>
          {/* Why today */}
          {day.whyToday && (
            <div className="mt-3 flex gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2.5">
              <span className="text-blue-400 flex-shrink-0">🎯</span>
              <p className="text-slate-300 text-xs leading-relaxed">{day.whyToday}</p>
            </div>
          )}

          {/* Tip */}
          {day.tip && (
            <div className="flex gap-2 bg-[#0d1424] rounded-xl px-3 py-2.5 border border-[#1e304d]">
              <span className="text-yellow-400 flex-shrink-0">💡</span>
              <p className="text-slate-300 text-xs leading-relaxed">{day.tip}</p>
            </div>
          )}

          {/* Problem types (CF) */}
          {day.problemTypes?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {day.problemTypes.map((pt, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-lg border ${colors.badge || 'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>{pt}</span>
              ))}
            </div>
          )}

          {/* CF Problems */}
          {platform === 'cf' && day.cfProblems?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">📌 Practice Problems</p>
              {day.cfProblems.map((prob, i) => (
                <a key={i} href={prob.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between bg-[#0d1424] hover:bg-[#111b2e] border border-[#1e304d] hover:border-blue-500/30 rounded-lg px-4 py-2.5 transition-all group">
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate group-hover:text-blue-300">{prob.name}</p>
                    <div className="flex gap-1 mt-0.5">
                      {prob.tags?.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] text-slate-500">{t}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-sm ml-3 flex-shrink-0 ${ratingColor(prob.rating)}`}>{prob.rating}</span>
                </a>
              ))}
            </div>
          )}

          {/* LC Problems */}
          {platform === 'lc' && day.lcProblems?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">📌 Practice Problems</p>
              {day.lcProblems.map((prob, i) => (
                <a key={i} href={prob.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between bg-[#0d1424] hover:bg-[#111b2e] border border-[#1e304d] hover:border-amber-500/30 rounded-lg px-4 py-2.5 transition-all group">
                  <div className="min-w-0">
                    <p className="text-white text-sm group-hover:text-amber-300">#{prob.id} {prob.name}</p>
                    <div className="flex gap-1 mt-0.5">
                      {prob.sheets?.map(s => (
                        <span key={s} className="text-[9px] text-amber-500/60">{s}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ml-3 flex-shrink-0 ${
                    prob.diff === 'Easy'   ? 'bg-green-500/10 border-green-500/20 text-green-400'  :
                    prob.diff === 'Hard'   ? 'bg-red-500/10   border-red-500/20   text-red-400'    :
                                            'bg-amber-500/10  border-amber-500/20  text-amber-400'
                  }`}>{prob.diff}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Week Card — proper component, no hooks in map ─────────────────────────────
const WeekCard = ({ week, index, platform, defaultExpanded }) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const colors = weekColors[index % weekColors.length]

  return (
    <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl overflow-hidden animate-slide-up"
      style={{ animationDelay:`${index*60}ms`, animationFillMode:'both' }}>
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${colors.bg} ${colors.border}`}>
          <span className={`text-xl font-bold font-mono ${colors.accent}`}>{week.week}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="text-[10px] text-slate-500 font-mono uppercase">Week {week.week}</span>
          <p className="text-white font-semibold truncate">{week.theme}</p>
          <p className="text-slate-500 text-xs mt-0.5 truncate">{week.focus}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-slate-600 text-xs font-mono">{week.days?.length || 0}d</span>
          <span className={`text-slate-400 text-sm transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
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
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
      } catch (e) {
        setError('Roadmap not found or you do not have access.')
      } finally {
        setLoading(false)
      }
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
      <div className="text-4xl">⚠️</div>
      <p className="text-rose-400 text-sm">{error}</p>
      <button onClick={() => navigate('/profile')} className="text-blue-400 text-sm hover:underline">
        ← Back to profile
      </button>
    </div>
  )

  if (!data) return null

  // Handle nested roadmap structure from auto-save
  const savedData  = data.roadmap_json
  const roadmap    = savedData?.roadmap || savedData
  const platform   = data.platform
  const insights   = roadmap?.personalizedInsights

  return (
    <div className="min-h-screen bg-[#080c14]">
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage:'linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)', backgroundSize:'40px 40px' }} />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* Back button */}
        <button onClick={() => navigate('/profile')}
          className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition">
          ← Back to profile
        </button>

        {/* Header card */}
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
              platform === 'cf' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-amber-500/10 border border-amber-500/20'
            }`}>
              {platform === 'cf' ? '⚡' : '🟨'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  platform === 'cf' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {platform === 'cf' ? 'Codeforces' : 'LeetCode'}
                </span>
                <span className="text-slate-500 text-[10px] font-mono">{data.handle}</span>
                <span className="text-slate-600 text-[10px]">{data.duration} days</span>
              </div>
              <h1 className="text-xl font-bold text-white">{data.title}</h1>
              {roadmap?.summary && (
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">{roadmap.summary}</p>
              )}
            </div>
            {data.target && (
              <div className="text-right flex-shrink-0">
                <p className="text-slate-500 text-xs mb-1">Target</p>
                <p className="text-xl font-bold font-mono text-purple-400">{data.target}</p>
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-[#1e304d]">
            <span className="text-slate-600 text-xs">
              Saved on {new Date(data.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
            </span>
          </div>
        </div>

        {/* Personalized Insights */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label:'✅ Strength',    value: insights.currentStrength || insights.strengths,      color:'text-green-400  bg-green-500/5  border-green-500/20'  },
              { label:'🚨 Gap',         value: insights.biggestGap      || insights.gaps,           color:'text-red-400    bg-red-500/5    border-red-500/20'    },
              { label:'⚡ Quick Win',   value: insights.quickWin,                                   color:'text-yellow-400 bg-yellow-500/5 border-yellow-500/20' },
              { label:'🎯 Long-term',   value: insights.longTermFocus   || insights.recommendation, color:'text-purple-400 bg-purple-500/5 border-purple-500/20' },
            ].filter(i => i.value).map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl border px-4 py-3 ${color}`}>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-1 opacity-60">{label}</p>
                <p className="text-white text-xs leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Milestones */}
        {roadmap?.milestones?.length > 0 && (
          <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4 text-sm">🏆 Milestones</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {roadmap.milestones.map((m, i) => (
                <div key={i} className="bg-[#080c14] rounded-xl px-4 py-3 border border-[#1e304d]">
                  <span className="text-[10px] font-mono text-slate-500">WEEK {m.week}</span>
                  <p className="text-white text-sm font-semibold mt-1 mb-1">{m.goal}</p>
                  <p className="text-slate-500 text-xs">{m.metric}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivation */}
        {roadmap?.motivation && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl px-6 py-4 flex gap-3 items-start">
            <span className="text-xl flex-shrink-0">✨</span>
            <p className="text-yellow-200/70 text-sm italic leading-relaxed">"{roadmap.motivation}"</p>
          </div>
        )}

        {/* Week cards — proper components, no hooks in map */}
        <div className="space-y-4">
          <p className="text-slate-600 text-xs text-center">Click any day to expand →</p>
          {roadmap?.weeks?.map((week, i) => (
            <WeekCard
              key={week.week}
              week={week}
              index={i}
              platform={platform}
              defaultExpanded={i === 0}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
