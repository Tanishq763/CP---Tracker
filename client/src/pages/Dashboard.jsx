import React, { useEffect, useState } from 'react'
import axios from 'axios'
import StatCard from '../components/StatCard'
import TagChart from '../components/TagChart'
import RatingGraph from '../components/RatingGraph'

const getRankColor = (rank = '') => {
  if (rank.includes('legendary') || rank.includes('grandmaster')) return 'text-red-400'
  if (rank.includes('master')) return 'text-orange-400'
  if (rank.includes('candidate')) return 'text-purple-400'
  if (rank.includes('expert')) return 'text-blue-400'
  if (rank.includes('specialist')) return 'text-cyan-400'
  if (rank.includes('pupil')) return 'text-green-400'
  return 'text-slate-400'
}

export default function Dashboard({ handle }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      setData(null)
      try {
        const res = await axios.get(`/api/user/${handle}/stats`)
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch data. Check the handle.')
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
        Fetching <span className="text-blue-400 font-mono">{handle}</span>...
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

  const { userInfo, totalSolved, totalSubmissions, tagAnalysis, ratingHistory } = data
  const acceptRate = totalSubmissions > 0
    ? ((totalSolved / totalSubmissions) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="card p-6 flex items-center gap-5 animate-fade-in">
        <img
          src={userInfo.avatar}
          alt="avatar"
          className="w-20 h-20 rounded-2xl border-2 border-[#1e304d] object-cover flex-shrink-0"
          onError={e => { e.target.src = 'https://userpic.codeforces.org/no-avatar.jpg' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h2 className="text-2xl font-bold text-white font-mono">{userInfo.handle}</h2>
            <a
              href={`https://codeforces.com/profile/${userInfo.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline"
            >
              ↗ CF Profile
            </a>
          </div>
          <p className={`font-semibold text-sm capitalize ${getRankColor(userInfo.rank)}`}>
            {userInfo.rank}
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            {userInfo.country && (
              <span className="text-slate-500 text-xs">🌍 {userInfo.country}</span>
            )}
            {userInfo.organization && (
              <span className="text-slate-500 text-xs truncate max-w-[200px]">
                🏢 {userInfo.organization}
              </span>
            )}
            <span className="text-slate-500 text-xs">📅 Since {userInfo.registrationTime}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-slate-500 text-xs mb-1">Contribution</p>
          <p className={`text-xl font-bold font-mono ${userInfo.contribution >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {userInfo.contribution >= 0 ? '+' : ''}{userInfo.contribution}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Current Rating"
          value={userInfo.rating}
          icon="⭐"
          color="blue"
          subtitle={userInfo.rank}
          delay={0}
        />
        <StatCard
          title="Max Rating"
          value={userInfo.maxRating}
          icon="🏆"
          color="purple"
          subtitle={`Peak: ${userInfo.maxRank}`}
          delay={50}
        />
        <StatCard
          title="Problems Solved"
          value={totalSolved}
          icon="✅"
          color="green"
          subtitle={`${acceptRate}% accept rate`}
          delay={100}
        />
        <StatCard
          title="Contests"
          value={ratingHistory.length}
          icon="🎯"
          color="orange"
          subtitle="participated"
          delay={150}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TagChart data={tagAnalysis} />
        <RatingGraph data={ratingHistory} />
      </div>

      {/* Bottom stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Submissions"
          value={totalSubmissions}
          icon="📤"
          color="cyan"
          delay={200}
        />
        <StatCard
          title="Friend of"
          value={userInfo.friendOfCount}
          icon="👥"
          color="green"
          subtitle="users"
          delay={250}
        />
        <StatCard
          title="Unique Tags"
          value={tagAnalysis.length}
          icon="🏷️"
          color="purple"
          subtitle="topics covered"
          delay={300}
        />
      </div>
    </div>
  )
}
