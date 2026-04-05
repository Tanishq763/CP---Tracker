import React, { useEffect, useState } from 'react'
import axios from 'axios'

const ratingColor = (r) => {
  if (!r) return 'text-slate-400'
  if (r >= 2400) return 'text-red-400'
  if (r >= 1900) return 'text-purple-400'
  if (r >= 1600) return 'text-blue-400'
  if (r >= 1400) return 'text-cyan-400'
  if (r >= 1200) return 'text-green-400'
  return 'text-slate-400'
}

export default function Recommendations({ handle }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      setData(null)
      try {
        const res = await axios.get(`/api/user/${handle}/recommend`)
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch recommendations')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [handle])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
      <p className="text-slate-400 text-sm">
        Analyzing weak spots for <span className="text-blue-400 font-mono">{handle}</span>...
      </p>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="text-4xl">⚠️</div>
      <p className="text-red-400 text-sm">{error}</p>
    </div>
  )

  if (!data) return null

  const { weakTags, userRating, ratingRange, recommendations } = data
  const weakTagNames = new Set(weakTags.map(t => t.tag))

  const filtered = filter === 'all'
    ? recommendations
    : recommendations.filter(p => p.tags.includes(filter))

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Weak tags grid */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">📉 Your Weak Topics</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Topics where you have the fewest solves — focus here for fastest growth.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {weakTags.map(({ tag, solved, attempted }, i) => (
            <button
              key={tag}
              onClick={() => setFilter(filter === tag ? 'all' : tag)}
              className={`text-left rounded-xl px-4 py-3 flex items-center gap-3 border transition-all ${
                filter === tag
                  ? 'bg-red-500/15 border-red-500/40'
                  : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
              }`}
            >
              <span className="text-red-400 font-bold font-mono text-lg flex-shrink-0">
                #{i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{tag}</p>
                <p className="text-slate-500 text-xs font-mono">{solved}/{attempted} solved</p>
              </div>
            </button>
          ))}
        </div>
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Show all problems
          </button>
        )}
      </div>

      {/* Rating info */}
      <div className="card px-5 py-4 flex items-center gap-3 flex-wrap">
        <span className="text-xl">🎯</span>
        <p className="text-slate-400 text-sm">
          Problems rated{' '}
          <span className="text-white font-mono">{ratingRange.min}–{ratingRange.max}</span>
          {' '}based on your rating of{' '}
          <span className="text-blue-400 font-mono font-semibold">{userRating}</span>
        </p>
        {filter !== 'all' && (
          <span className="ml-auto badge bg-red-500/10 border-red-500/20 text-red-400 px-3 py-1 text-xs">
            Filtered: {filter}
          </span>
        )}
      </div>

      {/* Problem table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1e304d] flex items-center justify-between">
          <h3 className="text-white font-semibold">🔥 Recommended Problems</h3>
          <span className="text-slate-500 text-xs font-mono">{filtered.length} problems</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
            No problems found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-[#1e304d]">
                  <th className="text-left px-6 py-3 w-8">#</th>
                  <th className="text-left px-6 py-3">Problem</th>
                  <th className="text-left px-6 py-3">Rating</th>
                  <th className="text-left px-6 py-3">Tags</th>
                  <th className="text-left px-6 py-3">Link</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((prob, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#1e304d]/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-3 text-slate-600 font-mono text-xs">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-3 text-white font-medium text-sm">
                      {prob.name}
                    </td>
                    <td className={`px-6 py-3 font-mono font-bold text-sm ${ratingColor(prob.rating)}`}>
                      {prob.rating}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {prob.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className={`badge text-[10px] px-2 py-0.5 ${
                              weakTagNames.has(tag)
                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : 'bg-blue-500/5 border-blue-500/20 text-blue-400'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                        {prob.tags.length > 3 && (
                          <span className="badge bg-slate-500/10 border-slate-500/20 text-slate-500 text-[10px] px-2 py-0.5">
                            +{prob.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <a
                        href={prob.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        Solve →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
