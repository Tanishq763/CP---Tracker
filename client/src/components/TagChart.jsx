import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#111b2e] border border-[#1e304d] rounded-xl px-4 py-3 text-sm shadow-xl">
        <p className="text-white font-semibold mb-1">{label}</p>
        <p className="text-blue-400 font-mono">{payload[0].value} solved</p>
      </div>
    )
  }
  return null
}

export default function TagChart({ data }) {
  const top12 = data.slice(0, 12)
  const maxVal = Math.max(...top12.map(d => d.count))

  return (
    <div className="card p-6 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold text-base">Problems by Tag</h3>
        <span className="badge bg-blue-500/10 border-blue-500/20 text-blue-400 text-xs px-2 py-1">
          Top 12
        </span>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={top12} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e304d" horizontal={false} />
          <XAxis
            type="number"
            stroke="#334155"
            tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="tag"
            stroke="#334155"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            width={130}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {top12.map((entry, i) => (
              <Cell
                key={i}
                fill={`rgba(59,130,246,${0.35 + (entry.count / maxVal) * 0.65})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
