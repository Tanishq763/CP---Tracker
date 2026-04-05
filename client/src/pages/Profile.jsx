import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const platformBadge = (p) => p === 'cf'
  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'

const RoadmapCard = ({ entry, onDelete, onClick }) => (
  <div
    onClick={() => onClick(entry.id)}
    className="bg-[#0d1424] border border-[#1e304d] hover:border-blue-500/30 rounded-xl p-4 cursor-pointer transition-all group"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${platformBadge(entry.platform)}`}>
            {entry.platform === 'cf' ? '⚡ CF' : '🟨 LC'}
          </span>
          <span className="text-slate-500 text-[10px] font-mono">{entry.handle}</span>
          <span className="text-slate-600 text-[10px]">{entry.duration} days</span>
        </div>
        <p className="text-white text-sm font-semibold truncate">{entry.title}</p>
        {entry.summary && (
          <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">{entry.summary}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <p className="text-slate-600 text-[10px]">{entry.createdAt}</p>
        {entry.target && (
          <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-mono">
            Target: {entry.target}
          </span>
        )}
      </div>
    </div>
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1e304d]/50">
      <span className="text-blue-400 text-xs opacity-0 group-hover:opacity-100 transition">View roadmap →</span>
      <button
        onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
        className="text-slate-600 hover:text-rose-400 text-xs transition opacity-0 group-hover:opacity-100"
      >
        🗑️ Delete
      </button>
    </div>
  </div>
)

export default function Profile() {
  const { user, logout, updateHandles, getRoadmapHistory, deleteRoadmap, roadmapLimit, refreshLimit } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [editing, setEditing] = useState(false)
  const [cfHandle, setCfHandle] = useState(user?.cfHandle || '')
  const [lcHandle, setLcHandle] = useState(user?.lcHandle || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    loadHistory()
    refreshLimit()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await getRoadmapHistory()
      setHistory(data)
    } catch (e) {}
    finally { setLoadingHistory(false) }
  }

  const handleSaveHandles = async () => {
    setSaving(true); setSaveMsg('')
    try {
      await updateHandles(cfHandle, lcHandle)
      setSaveMsg('✅ Saved!')
      setEditing(false)
    } catch { setSaveMsg('❌ Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this roadmap?')) return
    await deleteRoadmap(id)
    setHistory(h => h.filter(r => r.id !== id))
  }

  const handleViewRoadmap = (id) => {
    navigate(`/roadmap-history/${id}`)
  }

  const goToDashboard = () => {
    if (user?.cfHandle) navigate('/?handle=' + user.cfHandle)
    else navigate('/')
  }

  if (!user) return null

  const limitPct = Math.round(((2 - roadmapLimit.remaining) / 2) * 100)

  return (
    <div className="min-h-screen bg-[#080c14]">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">⚡</div>
            <span className="font-bold text-white font-mono">cp<span className="text-blue-400">tracker</span></span>
          </Link>
          <button onClick={logout}
            className="text-slate-500 hover:text-rose-400 text-sm border border-[#1e304d] hover:border-rose-500/30 px-4 py-2 rounded-lg transition">
            Sign out
          </button>
        </div>

        {/* Profile card */}
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <img src={user.avatar} alt={user.name}
              className="w-16 h-16 rounded-2xl border-2 border-[#1e304d] flex-shrink-0"
              onError={e => e.target.style.display='none'} />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">{user.name}</h1>
              <p className="text-slate-500 text-sm">{user.email}</p>
              <p className="text-slate-600 text-xs mt-1">Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month:'short', year:'numeric' })}</p>
            </div>
            <button
              onClick={goToDashboard}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition active:scale-95"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>

        {/* Handles card */}
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">⚙️ Your Handles</h2>
            <button
              onClick={() => { setEditing(!editing); setSaveMsg('') }}
              className={`text-sm px-4 py-1.5 rounded-lg border transition ${editing ? 'text-slate-400 border-[#1e304d]' : 'text-blue-400 border-blue-500/30 hover:bg-blue-500/10'}`}
            >
              {editing ? 'Cancel' : '✏️ Edit'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">⚡ Codeforces Handle</label>
                <input value={cfHandle} onChange={e => setCfHandle(e.target.value)}
                  placeholder="e.g. tourist"
                  className="w-full bg-[#080c14] border border-[#1e304d] focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono text-sm focus:outline-none transition" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">🟨 LeetCode Handle</label>
                <input value={lcHandle} onChange={e => setLcHandle(e.target.value)}
                  placeholder="e.g. sharstigarg17"
                  className="w-full bg-[#080c14] border border-[#1e304d] focus:border-amber-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono text-sm focus:outline-none transition" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSaveHandles} disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {saveMsg && <span className="text-sm text-slate-400">{saveMsg}</span>}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#080c14] rounded-xl px-4 py-3 border border-[#1e304d]">
                <p className="text-slate-500 text-xs mb-1">⚡ Codeforces</p>
                {user.cfHandle ? (
                  <a href={`https://codeforces.com/profile/${user.cfHandle}`} target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 font-mono font-semibold hover:underline">
                    {user.cfHandle} ↗
                  </a>
                ) : (
                  <span className="text-slate-600 text-sm">Not set</span>
                )}
              </div>
              <div className="bg-[#080c14] rounded-xl px-4 py-3 border border-[#1e304d]">
                <p className="text-slate-500 text-xs mb-1">🟨 LeetCode</p>
                {user.lcHandle ? (
                  <a href={`https://leetcode.com/${user.lcHandle}`} target="_blank" rel="noopener noreferrer"
                    className="text-amber-400 font-mono font-semibold hover:underline">
                    {user.lcHandle} ↗
                  </a>
                ) : (
                  <span className="text-slate-600 text-sm">Not set</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Daily limit card */}
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">🤖 AI Roadmap Usage Today</h2>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">{2 - roadmapLimit.remaining} of 2 used</span>
            <span className={`text-sm font-semibold ${roadmapLimit.remaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {roadmapLimit.remaining} remaining
            </span>
          </div>
          <div className="h-2 bg-[#080c14] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${limitPct >= 100 ? 'bg-red-500' : limitPct >= 50 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${limitPct}%` }}
            />
          </div>
          <p className="text-slate-600 text-xs mt-2">Resets every day at midnight</p>
        </div>

        {/* Roadmap history */}
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e304d] flex items-center justify-between">
            <h2 className="text-white font-semibold">📚 Roadmap History</h2>
            <span className="text-slate-500 text-xs font-mono">{history.length} saved</span>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">📭</span>
              <p className="text-slate-500 text-sm">No roadmaps saved yet</p>
              <p className="text-slate-600 text-xs">Generate an AI roadmap and it will appear here</p>
              <Link to="/"
                className="mt-2 text-blue-400 text-sm hover:underline">
                Generate your first roadmap →
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {history.map(entry => (
                <RoadmapCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  onClick={handleViewRoadmap}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
