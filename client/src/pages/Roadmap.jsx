import React, { useState } from 'react'
import axios from 'axios'

const weekColors = [
  { bg:'bg-blue-500/10',   border:'border-blue-500/25',   accent:'text-blue-400',   badge:'bg-blue-500/15 border-blue-500/30 text-blue-300' },
  { bg:'bg-purple-500/10', border:'border-purple-500/25', accent:'text-purple-400', badge:'bg-purple-500/15 border-purple-500/30 text-purple-300' },
  { bg:'bg-cyan-500/10',   border:'border-cyan-500/25',   accent:'text-cyan-400',   badge:'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' },
  { bg:'bg-green-500/10',  border:'border-green-500/25',  accent:'text-green-400',  badge:'bg-green-500/15 border-green-500/30 text-green-300' },
  { bg:'bg-orange-500/10', border:'border-orange-500/25', accent:'text-orange-400', badge:'bg-orange-500/15 border-orange-500/30 text-orange-300' },
]

const ratingColor = r => {
  if (!r) return 'text-slate-400'
  if (r >= 2400) return 'text-red-400'
  if (r >= 1900) return 'text-purple-400'
  if (r >= 1600) return 'text-blue-400'
  if (r >= 1400) return 'text-cyan-400'
  if (r >= 1200) return 'text-green-400'
  return 'text-slate-400'
}

const trendBadge = trend => ({
  improving: { text:'📈 Improving',  cls:'bg-green-500/10 border-green-500/20 text-green-400' },
  declining: { text:'📉 Declining',  cls:'bg-red-500/10 border-red-500/20 text-red-400' },
  stable:    { text:'➡️ Stable',     cls:'bg-slate-500/10 border-slate-500/20 text-slate-400' },
}[trend] || { text:'➡️ Stable', cls:'bg-slate-500/10 border-slate-500/20 text-slate-400' })

// ── Loading ───────────────────────────────────────────────────────────────────
const LoadingScreen = ({ handle }) => {
  const steps = [
    { icon:'📡', text:'Fetching Codeforces data...' },
    { icon:'🔬', text:'Deep-analyzing tags, difficulty, patterns...' },
    { icon:'📊', text:'Computing weak areas & rating gaps...' },
    { icon:'🤖', text:'Generating hyper-personalized roadmap...' },
    { icon:'🔗', text:'Attaching real CF problems to each day...' },
  ]
  const [step, setStep] = React.useState(0)
  React.useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s+1, steps.length-1)), 3000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col items-center py-32 gap-6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-blue-500/30 animate-spin" style={{animationDuration:'3s'}} />
        <div className="absolute inset-4 rounded-full border-2 border-blue-500/50 border-t-blue-400 animate-spin" style={{animationDuration:'1.5s'}} />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-lg mb-1">Building hyper-personalized roadmap for</p>
        <p className="text-blue-400 font-mono text-xl font-bold">{handle}</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
            i === step ? 'bg-blue-500/15 border border-blue-500/30 text-white'
            : i < step ? 'text-green-400' : 'text-slate-700'
          }`}>
            <span>{i < step ? '✅' : s.icon}</span>
            <span className="text-sm">{s.text}</span>
          </div>
        ))}
      </div>
      <p className="text-slate-600 text-xs">Usually 15–25 seconds</p>
    </div>
  )
}

// ── Day Card ──────────────────────────────────────────────────────────────────
const DayCard = ({ day, colors }) => {
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
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-mono px-2 py-0.5 rounded border ${colors.badge}`}>{day.difficulty}</span>
          {day.cfProblems?.length > 0 && (
            <span className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono">
              {day.cfProblems.length} problems
            </span>
          )}
          <span className={`text-slate-500 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1e304d] space-y-3" onClick={e => e.stopPropagation()}>

          {/* Why today — new personalized field */}
          {day.whyToday && (
            <div className="mt-3 flex gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2.5">
              <span className="text-blue-400 flex-shrink-0 text-sm">🎯</span>
              <div>
                <p className="text-blue-300 text-[10px] font-mono uppercase tracking-wider mb-0.5">Why this today</p>
                <p className="text-slate-300 text-xs leading-relaxed">{day.whyToday}</p>
              </div>
            </div>
          )}

          {/* Problem types */}
          {day.problemTypes?.length > 0 && (
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">Practice Focus</p>
              <div className="flex flex-wrap gap-1.5">
                {day.problemTypes.map((pt, i) => (
                  <span key={i} className={`text-xs px-2.5 py-1 rounded-lg border ${colors.badge}`}>{pt}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="flex gap-2 bg-[#0d1424] rounded-xl px-3 py-2.5 border border-[#1e304d]">
            <span className="text-yellow-400 flex-shrink-0">💡</span>
            <p className="text-slate-300 text-xs leading-relaxed">{day.tip}</p>
          </div>

          {/* CF Problems */}
          {day.cfProblems?.length > 0 && (
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">📌 Practice Problems (Codeforces)</p>
              <div className="space-y-1.5">
                {day.cfProblems.map((prob, i) => (
                  <a key={i} href={prob.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between bg-[#0d1424] hover:bg-[#111b2e] border border-[#1e304d] hover:border-blue-500/30 rounded-lg px-4 py-2.5 transition-all group"
                    onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-slate-600 font-mono text-[10px] flex-shrink-0">{String(i+1).padStart(2,'0')}</span>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate group-hover:text-blue-300 transition-colors">{prob.name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {prob.tags?.slice(0,3).map(tag => (
                            <span key={tag} className="text-[10px] text-slate-500">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className={`font-mono font-bold text-sm ${ratingColor(prob.rating)}`}>{prob.rating}</span>
                      <span className="text-blue-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Solve →</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {day.cfProblems?.length === 0 && (
            <p className="text-slate-700 text-xs text-center py-2">No CF problems matched this topic/difficulty. Search manually on CF.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Week Card ─────────────────────────────────────────────────────────────────
const WeekCard = ({ week, index }) => {
  const [expanded, setExpanded] = useState(index === 0)
  const colors = weekColors[index % weekColors.length]
  const totalProblems = week.days?.reduce((s, d) => s + (d.cfProblems?.length || 0), 0) || 0

  return (
    <div className="card overflow-hidden animate-slide-up" style={{animationDelay:`${index*80}ms`,animationFillMode:'both'}}>
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${colors.bg} ${colors.border}`}>
          <span className={`text-xl font-bold font-mono ${colors.accent}`}>{week.week}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="text-[10px] text-slate-500 font-mono uppercase">Week {week.week}</span>
          <p className="text-white font-semibold">{week.theme}</p>
          <p className="text-slate-500 text-xs truncate mt-0.5">{week.focus}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {totalProblems > 0 && (
            <span className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-1 rounded font-mono">
              {totalProblems} problems
            </span>
          )}
          <span className="text-slate-600 text-xs font-mono">{week.days?.length || 7}d</span>
          <span className={`text-slate-400 text-sm transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      {expanded && (
        <div className="px-6 pb-6 border-t border-[#1e304d]">
          <div className="pt-4 space-y-2">
            {week.days?.map(day => <DayCard key={day.day} day={day} colors={colors} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Roadmap({ handle }) {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [duration, setDuration] = useState(30)
  const [generated, setGenerated] = useState(false)

  const generate = async () => {
    setLoading(true); setError(''); setData(null); setGenerated(true)
    try {
      const res = await axios.get(`/api/user/${handle}/roadmap?duration=${duration}`)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate. Make sure GROQ_API_KEY is set.')
    } finally { setLoading(false) }
  }

  // ── Pre-generate ──────────────────────────────────────────────────────────
  if (!generated) return (
    <div className="flex flex-col items-center py-16 gap-8 animate-fade-in">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-4xl mx-auto mb-5">🤖</div>
        <h2 className="text-2xl font-bold text-white mb-2">Hyper-Personalized CF Roadmap</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Uses your <span className="text-blue-400">deep tag analysis</span>, rating trend, comfort zone, and unsolved topics to build a roadmap that actually fits YOU — not a generic plan.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-xl">
        {[
          { icon:'🔬', label:'Deep tag analysis',    desc:'Success rate per topic' },
          { icon:'📈', label:'Rating trend aware',   desc:'Adapts to your trajectory' },
          { icon:'🎯', label:'"Why today" context',  desc:'Every day explained' },
          { icon:'🔗', label:'Real CF problems',      desc:'Matched to your level' },
          { icon:'⚠️', label:'Never-tried topics',    desc:'Fills your blind spots' },
          { icon:'💡', label:'Hyper-specific tips',   desc:'Not generic advice' },
        ].map(({icon,label,desc}) => (
          <div key={label} className="card px-4 py-3">
            <span className="text-xl mb-1 block">{icon}</span>
            <p className="text-white text-xs font-medium">{label}</p>
            <p className="text-slate-600 text-[10px] mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 w-full max-w-sm">
        <p className="text-slate-400 text-sm mb-3 text-center">Choose duration</p>
        <div className="flex gap-2">
          {[14,30,60].map(d => (
            <button key={d} onClick={() => setDuration(d)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                duration===d ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'border-[#1e304d] text-slate-400 hover:border-[#2a3f5f]'
              }`}>
              {d} days
            </button>
          ))}
        </div>
        <button onClick={generate}
          className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm">
          🤖 Generate My Roadmap
        </button>
      </div>
    </div>
  )

  if (loading) return <LoadingScreen handle={handle} />

  if (error) return (
    <div className="flex flex-col items-center py-32 gap-4">
      <div className="text-4xl">⚠️</div>
      <p className="text-red-400 text-sm text-center max-w-md">{error}</p>
      <button onClick={() => { setGenerated(false); setError('') }} className="text-blue-400 text-sm hover:underline">← Try again</button>
    </div>
  )

  if (!data) return null

  const { roadmap, userRating, maxRating, ratingTrend, totalSolved, weakTags, strongTags, neverTriedTags } = data
  const insights = roadmap.personalizedInsights
  const trend = trendBadge(ratingTrend)
  const totalCFProblems = roadmap.weeks?.reduce((s,w) => s + w.days?.reduce((ss,d) => ss+(d.cfProblems?.length||0),0),0) || 0

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header card */}
      <div className="card p-6 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">AI Generated · Groq LLaMA 70B</span>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${trend.cls}`}>{trend.text}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{duration}-Day Hyper-Personalized CF Roadmap</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{roadmap.summary}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-slate-500 text-xs mb-1">Target Rating</p>
            <p className="text-3xl font-bold font-mono text-gradient">{roadmap.targetRating}</p>
            <p className="text-slate-500 text-xs mt-1">from {userRating} current</p>
          </div>
        </div>

        {/* Personalized insights — new section */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            {[
              { label:'✅ Current Strength',   value:insights.currentStrength,  color:'text-green-400  bg-green-500/5  border-green-500/20' },
              { label:'🚨 Biggest Gap',        value:insights.biggestGap,       color:'text-red-400    bg-red-500/5    border-red-500/20' },
              { label:'⚡ Quick Win (3 days)', value:insights.quickWin,         color:'text-yellow-400 bg-yellow-500/5 border-yellow-500/20' },
              { label:'🎯 Long-term Focus',    value:insights.longTermFocus,    color:'text-purple-400 bg-purple-500/5 border-purple-500/20' },
            ].map(({label,value,color}) => value && (
              <div key={label} className={`rounded-xl border px-4 py-3 ${color}`}>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-1 opacity-60">{label}</p>
                <p className="text-white text-xs leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tags + stats footer */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#1e304d]">
          <span className="text-[10px] text-slate-500">Strong:</span>
          {strongTags?.slice(0,4).map(t => <span key={t} className="badge bg-green-500/10 border-green-500/20 text-green-400 text-[10px] px-2 py-0.5">{t}</span>)}
          <span className="text-[10px] text-slate-500 ml-2">Weak:</span>
          {weakTags?.slice(0,4).map(t => <span key={t} className="badge bg-red-500/10 border-red-500/20 text-red-400 text-[10px] px-2 py-0.5">{t}</span>)}
          {neverTriedTags?.slice(0,3).map(t => <span key={t} className="badge bg-orange-500/10 border-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5">⚠️ {t}</span>)}
          {totalCFProblems > 0 && (
            <span className="ml-auto text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-lg font-mono">
              🔗 {totalCFProblems} CF problems linked
            </span>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div className="card p-6">
        <h3 className="text-white font-semibold mb-4">🏆 Key Milestones</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roadmap.milestones?.map((m, i) => (
            <div key={i} className="bg-[#0d1424] rounded-xl px-4 py-4 border border-[#1e304d]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-slate-500">WEEK {m.week}</span>
                <span className="flex-1 h-px bg-[#1e304d]" />
              </div>
              <p className="text-white text-sm font-semibold mb-1">{m.goal}</p>
              <p className="text-slate-500 text-xs">{m.metric}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Motivation */}
      <div className="card px-6 py-4 flex items-start gap-3 bg-yellow-500/5 border-yellow-500/20">
        <span className="text-xl flex-shrink-0">✨</span>
        <p className="text-yellow-200/80 text-sm leading-relaxed italic">"{roadmap.motivation}"</p>
      </div>

      <p className="text-slate-600 text-xs text-center">Click any day to see WHY that topic + real CF problems →</p>

      {/* Week cards */}
      <div className="space-y-4">
        {roadmap.weeks?.map((week, i) => <WeekCard key={week.week} week={week} index={i} />)}
      </div>

      {/* Regenerate */}
      <div className="flex justify-center pb-6">
        <button onClick={() => { setGenerated(false); setData(null) }}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-400 text-sm transition-colors border border-[#1e304d] hover:border-blue-500/30 px-5 py-2.5 rounded-xl">
          🔄 Regenerate with different duration
        </button>
      </div>
    </div>
  )
}
