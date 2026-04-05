import React, { useState } from 'react'
import axios from 'axios'

const weekColors = [
  { bg:'bg-violet-500/10', border:'border-violet-500/25', accent:'text-violet-400', badge:'bg-violet-500/15 border-violet-500/30 text-violet-300' },
  { bg:'bg-cyan-500/10',   border:'border-cyan-500/25',   accent:'text-cyan-400',   badge:'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' },
  { bg:'bg-rose-500/10',   border:'border-rose-500/25',   accent:'text-rose-400',   badge:'bg-rose-500/15 border-rose-500/30 text-rose-300' },
  { bg:'bg-amber-500/10',  border:'border-amber-500/25',  accent:'text-amber-400',  badge:'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  { bg:'bg-emerald-500/10',border:'border-emerald-500/25',accent:'text-emerald-400',badge:'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
]

const diffColor = d => ({
  Easy:   'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  Medium: 'bg-amber-500/10   border-amber-500/25   text-amber-400',
  Hard:   'bg-rose-500/10    border-rose-500/25    text-rose-400',
}[d] || 'bg-slate-500/10 border-slate-500/20 text-slate-400')

const sheetColor = s => ({
  'Blind 75':     'bg-blue-500/10 border-blue-500/25 text-blue-400',
  'NeetCode 150': 'bg-violet-500/10 border-violet-500/25 text-violet-400',
  'Striver SDE':  'bg-orange-500/10 border-orange-500/25 text-orange-400',
  'Grind 75':     'bg-cyan-500/10 border-cyan-500/25 text-cyan-400',
  'Love Babbar':  'bg-pink-500/10 border-pink-500/25 text-pink-400',
}[s] || 'bg-slate-500/10 border-slate-500/20 text-slate-400')

// ── Problem Card ──────────────────────────────────────────────────────────────
const ProblemCard = ({ prob }) => (
  <a href={prob.link} target="_blank" rel="noopener noreferrer"
    className="flex items-start justify-between bg-[#080c14] hover:bg-[#0d1424] border border-[#1e304d] hover:border-violet-500/30 rounded-xl px-4 py-3 transition-all group gap-3">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="text-slate-600 font-mono text-[10px]">#{prob.id}</span>
        <p className="text-white text-sm font-medium group-hover:text-violet-300 transition-colors">{prob.name}</p>
      </div>
      {/* Sheet badges */}
      <div className="flex flex-wrap gap-1">
        {prob.sheets?.map(s => (
          <span key={s} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${sheetColor(s)}`}>{s}</span>
        ))}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border ${diffColor(prob.diff)}`}>{prob.diff}</span>
      <span className="text-violet-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
    </div>
  </a>
)

// ── Day Card ──────────────────────────────────────────────────────────────────
const DayCard = ({ day, colors }) => {
  const [open, setOpen] = useState(false)
  const problemCount = day.lcProblems?.length || 0

  return (
    <div className={`rounded-xl border transition-all ${open ? `${colors.bg} ${colors.border}` : 'border-[#1e304d] hover:border-[#2d3f5c]'}`}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(o => !o)}>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 ${colors.bg} ${colors.accent} border ${colors.border}`}>
          {day.day}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate capitalize">{day.topic}</p>
          <p className="text-slate-500 text-xs truncate">{day.goal}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${diffColor(day.difficulty)}`}>{day.difficulty}</span>
          {problemCount > 0 && (
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">
              {problemCount} problems
            </span>
          )}
          <span className={`text-slate-500 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1e304d]/60 space-y-3">
          {/* Pattern highlight */}
          {day.pattern && (
            <div className="mt-3 flex gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
              <span className="text-violet-400 flex-shrink-0">🔑</span>
              <div>
                <p className="text-violet-300 text-xs font-semibold mb-0.5">Pattern to master</p>
                <p className="text-slate-300 text-xs">{day.pattern}</p>
              </div>
            </div>
          )}

          {/* Concepts */}
          {day.concepts?.length > 0 && (
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">Key Concepts</p>
              <div className="flex flex-wrap gap-1.5">
                {day.concepts.map((c, i) => (
                  <span key={i} className={`text-xs px-2.5 py-1 rounded-lg border ${colors.badge}`}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="flex gap-2 bg-[#080c14] rounded-xl px-3 py-2.5 border border-[#1e304d]">
            <span className="text-amber-400 flex-shrink-0">💡</span>
            <p className="text-slate-300 text-xs leading-relaxed">{day.tip}</p>
          </div>

          {/* Problems */}
          {day.lcProblems?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">📌 Practice Problems</p>
                <div className="flex gap-1">
                  {['Blind 75','NeetCode 150','Striver SDE','Grind 75','Love Babbar'].map(s => (
                    <span key={s} className={`text-[8px] px-1.5 py-0.5 rounded border ${sheetColor(s)}`}>{s.split(' ')[0]}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {day.lcProblems.map((p, i) => <ProblemCard key={i} prob={p} />)}
              </div>
            </div>
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
  const totalProbs = week.days?.reduce((s, d) => s + (d.lcProblems?.length || 0), 0) || 0
  const blind75Count = week.days?.reduce((s, d) =>
    s + (d.lcProblems?.filter(p => p.blind75).length || 0), 0) || 0

  return (
    <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl overflow-hidden animate-slide-up"
      style={{ animationDelay:`${index*60}ms`, animationFillMode:'both' }}>
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-white/[0.015] transition-colors">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${colors.bg} ${colors.border}`}>
          <span className={`text-xl font-bold font-mono ${colors.accent}`}>{week.week}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="text-[10px] text-slate-500 font-mono uppercase">Week {week.week}</span>
          <p className="text-white font-semibold">{week.theme}</p>
          <p className="text-slate-500 text-xs truncate">{week.focus}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {blind75Count > 0 && (
            <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-1 rounded font-mono">
              B75:{blind75Count}
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono">{totalProbs} problems</span>
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

// ── Loading steps ─────────────────────────────────────────────────────────────
const LoadingScreen = ({ handle }) => {
  const [step, setStep] = useState(0)
  const steps = [
    { icon:'📡', text:`Fetching ${handle}'s LeetCode profile...` },
    { icon:'🔍', text:'Analyzing topic strengths & weak areas...' },
    { icon:'🧠', text:'Personalizing roadmap with your exact gaps...' },
    { icon:'🤖', text:'Generating AI study plan via Groq...' },
    { icon:'📌', text:'Mapping problems from 5 famous sheets...' },
  ]
  React.useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s+1, steps.length-1)), 2800)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col items-center py-24 gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-violet-500/30 animate-spin" style={{animationDuration:'3s'}} />
        <div className="absolute inset-4 rounded-full border-2 border-violet-500/60 border-t-violet-400 animate-spin" style={{animationDuration:'1.2s'}} />
        <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
      </div>
      <div className="space-y-2 w-full max-w-sm">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
            i === step ? 'bg-violet-500/15 border border-violet-500/30 text-white'
            : i < step ? 'text-emerald-400' : 'text-slate-700'
          }`}>
            <span>{i < step ? '✅' : s.icon}</span>
            <span className="text-sm">{s.text}</span>
          </div>
        ))}
      </div>
      <p className="text-slate-600 text-xs">Usually takes 15–25 seconds</p>
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function LCRoadmapTab({ handle, cfData }) {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [duration, setDuration] = useState(30)
  const [cfHandle, setCfHandle] = useState(cfData?.handle || '')
  const [cfRating, setCfRating] = useState(cfData?.rating || '')
  const [generated, setGenerated] = useState(false)

  const generate = async () => {
    setLoading(true); setError(''); setData(null); setGenerated(true)
    try {
      const params = new URLSearchParams({ duration })
      if (cfHandle) params.set('cfHandle', cfHandle)
      if (cfRating) params.set('cfRating', cfRating)
      const res = await axios.get(`/api/leetcode/${handle}/roadmap?${params}`)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed. Check GROQ_API_KEY.')
    } finally { setLoading(false) }
  }

  // ── Pre-generate screen ────────────────────────────────────────────────────
  if (!generated) return (
    <div className="flex flex-col items-center py-12 gap-8 animate-fade-in">
      <div className="text-center max-w-xl">
        <div className="flex justify-center gap-3 mb-5">
          {['Blind 75','NeetCode 150','Striver SDE','Grind 75','Love Babbar'].map((s, i) => (
            <span key={i} className={`text-[10px] font-mono px-2 py-1 rounded border ${sheetColor(s)}`}>{s}</span>
          ))}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">AI-Powered DSA Roadmap</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Deeply personalized using your <span className="text-amber-400">LeetCode tag-level data</span> and optionally your
          <span className="text-blue-400"> Codeforces rating</span>. Problems sourced from 5 famous sheets — prioritized for YOUR specific gaps.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
        {[
          { icon:'🎯', label:'Skips your strong topics', desc:'No time wasted on what you know' },
          { icon:'📌', label:'5 sheet coverage', desc:'B75 + NeetCode + Striver + Grind + Babbar' },
          { icon:'🔑', label:'Pattern of the day', desc:'Specific coding pattern per session' },
          { icon:'💡', label:'Topic-specific tips', desc:'Hyper-precise, not generic advice' },
          { icon:'📊', label:'Difficulty-matched', desc:'Based on your actual solve count' },
          { icon:'🤖', label:'Groq LLaMA powered', desc:'Fast, intelligent, personalized' },
        ].map(({icon,label,desc}) => (
          <div key={label} className="bg-[#0d1424] border border-[#1e304d] rounded-xl p-4">
            <span className="text-2xl mb-2 block">{icon}</span>
            <p className="text-white text-xs font-semibold">{label}</p>
            <p className="text-slate-500 text-[10px] mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Config card */}
      <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6 w-full max-w-md space-y-5">
        {/* Duration */}
        <div>
          <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Duration</p>
          <div className="flex gap-2">
            {[14,30,60].map(d => (
              <button key={d} onClick={() => setDuration(d)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  duration===d ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'border-[#1e304d] text-slate-400 hover:border-[#2d3f5c]'
                }`}>
                {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Optional CF cross-reference */}
        <div>
          <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">
            Codeforces Profile <span className="text-slate-600 normal-case">(optional — makes roadmap even smarter)</span>
          </p>
          <div className="flex gap-2">
            <input value={cfHandle} onChange={e => setCfHandle(e.target.value)}
              placeholder="CF handle e.g. tourist"
              className="flex-1 bg-[#080c14] border border-[#1e304d] rounded-xl px-3 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/40 text-sm font-mono" />
            <input value={cfRating} onChange={e => setCfRating(e.target.value)}
              placeholder="Rating"
              className="w-24 bg-[#080c14] border border-[#1e304d] rounded-xl px-3 py-2.5 text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/40 text-sm font-mono" />
          </div>
          {cfData?.handle && (
            <p className="text-slate-600 text-[10px] mt-1">
              Pre-filled from your CF session: {cfData.handle} ({cfData.rating})
            </p>
          )}
        </div>

        <button onClick={generate}
          className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95">
          🤖 Generate My Personalized Roadmap
        </button>
      </div>
    </div>
  )

  if (loading) return <LoadingScreen handle={handle} />

  if (error) return (
    <div className="flex flex-col items-center py-32 gap-4">
      <div className="text-4xl">⚠️</div>
      <p className="text-rose-400 text-sm text-center max-w-md">{error}</p>
      <button onClick={() => { setGenerated(false); setError('') }} className="text-violet-400 text-sm hover:underline">← Try again</button>
    </div>
  )

  if (!data) return null

  const { roadmap, solved, userLevel, strongTags, weakTags, cfHandle: usedCF, cfRating: usedCFR } = data
  const totalProbs  = roadmap.weeks?.reduce((s,w) => s + w.days?.reduce((ss,d) => ss + (d.lcProblems?.length||0),0), 0) || 0
  const totalBlind75 = roadmap.weeks?.reduce((s,w) => s + w.days?.reduce((ss,d) => ss + (d.lcProblems?.filter(p=>p.blind75).length||0),0), 0) || 0
  const levelBadge = { beginner:'🌱 Beginner', medium:'⚡ Intermediate', advanced:'🔥 Advanced' }[userLevel]

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500/10 via-[#0d1424] to-blue-500/5 border border-violet-500/20 rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] text-violet-400 font-mono uppercase tracking-widest">AI Generated · Groq LLaMA 70B</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-lg border ${
                userLevel==='advanced' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : userLevel==='medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>{levelBadge}</span>
              {usedCF && <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded">CF: {usedCF} ({usedCFR})</span>}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{duration}-Day Personalized DSA Roadmap</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{roadmap.summary}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-slate-500 text-xs mb-1">Target</p>
            <p className="text-2xl font-bold font-mono text-violet-400">{roadmap.targetProblems}</p>
            <p className="text-slate-500 text-xs">problems to solve</p>
          </div>
        </div>

        {/* User insights */}
        {roadmap.userInsights && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {[
              { label:'✅ Strengths', value:roadmap.userInsights.strengths, color:'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' },
              { label:'⚠️ Gaps to Fill', value:roadmap.userInsights.gaps, color:'text-amber-400 bg-amber-500/5 border-amber-500/20' },
              { label:'🎯 #1 Priority', value:roadmap.userInsights.recommendation, color:'text-violet-400 bg-violet-500/5 border-violet-500/20' },
            ].map(({label, value, color}) => (
              <div key={label} className={`rounded-xl border px-4 py-3 ${color}`}>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-1 opacity-70">{label}</p>
                <p className="text-white text-xs leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tags + sheet legend */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/5">
          <span className="text-[10px] text-slate-500">Your strong:</span>
          {strongTags?.slice(0,4).map(t => <span key={t} className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">{t}</span>)}
          <span className="text-[10px] text-slate-500 ml-2">Weak:</span>
          {weakTags?.slice(0,4).map(t => <span key={t} className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded">{t}</span>)}
          <div className="ml-auto flex gap-1 flex-wrap justify-end">
            <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-1 rounded font-mono">B75:{totalBlind75}</span>
            <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-1 rounded font-mono">Total:{totalProbs}</span>
          </div>
        </div>
      </div>

      {/* Sheet legend */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-slate-600 text-xs">Problem sources:</span>
        {['Blind 75','NeetCode 150','Striver SDE','Grind 75','Love Babbar'].map(s => (
          <span key={s} className={`text-[10px] font-mono px-2 py-1 rounded border ${sheetColor(s)}`}>{s}</span>
        ))}
      </div>

      {/* Milestones */}
      <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">🏆 Key Milestones</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roadmap.milestones?.map((m, i) => (
            <div key={i} className="bg-[#080c14] rounded-xl px-4 py-4 border border-[#1e304d]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-slate-500">WEEK {m.week}</span>
                <div className="flex-1 h-px bg-[#1e304d]" />
              </div>
              <p className="text-white text-sm font-semibold mb-1">{m.goal}</p>
              <p className="text-slate-500 text-xs">{m.metric}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Motivation */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl px-6 py-4 flex gap-3 items-start">
        <span className="text-xl flex-shrink-0">✨</span>
        <p className="text-amber-200/70 text-sm italic leading-relaxed">"{roadmap.motivation}"</p>
      </div>

      <p className="text-slate-600 text-xs text-center">Click any day → see pattern + concepts + problems from 5 sheets</p>

      {/* Weeks */}
      <div className="space-y-4">
        {roadmap.weeks?.map((week, i) => <WeekCard key={week.week} week={week} index={i} />)}
      </div>

      {/* Regenerate */}
      <div className="flex justify-center pb-6">
        <button onClick={() => { setGenerated(false); setData(null) }}
          className="flex items-center gap-2 text-slate-400 hover:text-violet-400 text-sm transition-colors border border-[#1e304d] hover:border-violet-500/30 px-6 py-2.5 rounded-xl">
          🔄 Regenerate with different options
        </button>
      </div>
    </div>
  )
}
