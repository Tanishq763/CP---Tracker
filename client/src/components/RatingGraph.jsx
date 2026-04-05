import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload
    return (
      <div className="bg-[#111b2e] border border-[#1e304d] rounded-xl px-4 py-3 text-sm shadow-xl">
        <p className="text-slate-300 text-xs mb-2 max-w-[180px] truncate">{d.contestName}</p>
        <p className="text-blue-400 font-mono font-bold text-base">{d.newRating}</p>
        <p className={`text-xs font-mono ${d.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {d.change >= 0 ? '+' : ''}{d.change}
        </p>
        <p className="text-slate-500 text-xs mt-1">{d.date} · Rank #{d.rank}</p>
      </div>
    )
  }
  return null
}

export default function RatingGraph({ data }) {
  return (
    <div className="card p-6 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold text-base">Rating History</h3>
        <span className="badge bg-purple-500/10 border-purple-500/20 text-purple-400 text-xs px-2 py-1">
          {data.length} contests
        </span>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-500">
          No contest history yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e304d" />
            <XAxis
              dataKey="date"
              stroke="#334155"
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#334155"
              tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="newRating"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#60a5fa' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
