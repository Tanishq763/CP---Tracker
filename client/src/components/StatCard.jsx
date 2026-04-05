import React from 'react'

const colorMap = {
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400' },
  cyan:   { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   text: 'text-cyan-400' },
}

export default function StatCard({ title, value, subtitle, icon, color = 'blue', delay = 0 }) {
  const c = colorMap[color] || colorMap.blue

  return (
    <div
      className={`card p-5 animate-slide-up`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
        <span className={`text-xl ${c.bg} ${c.border} border w-9 h-9 flex items-center justify-center rounded-lg`}>
          {icon}
        </span>
      </div>
      <div className={`text-3xl font-bold font-mono ${c.text} mb-1`}>{value}</div>
      {subtitle && <div className="text-slate-500 text-xs capitalize">{subtitle}</div>}
    </div>
  )
}
