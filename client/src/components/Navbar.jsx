import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ handle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isLoggedIn, logout, roadmapLimit } = useAuth()

  const cfItems = [
    { path:'/',                label:'Dashboard',       icon:'📊' },
    { path:'/recommendations', label:'Recommendations', icon:'🎯' },
    { path:'/roadmap',         label:'AI Roadmap',      icon:'🤖', highlight:'purple' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e304d] bg-[#080c14]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-lg">⚡</div>
          <span className="font-bold text-white text-lg font-mono tracking-tight hidden sm:block">
            cp<span className="text-blue-400">tracker</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex gap-1 overflow-x-auto flex-1 justify-center">
          {handle && cfItems.map(({ path, label, icon, highlight }) => (
            <Link key={path} to={path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive(path)
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : highlight === 'purple'
                  ? 'text-purple-400 hover:bg-purple-500/10 border border-transparent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}>
              <span>{icon}</span>
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}

          <Link to="/leetcode"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              isActive('/leetcode') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-amber-500 hover:bg-amber-500/10 border border-transparent'
            }`}>
            <span>🟨</span><span className="hidden sm:block">LeetCode</span>
          </Link>

          <Link to="/analytics"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              isActive('/analytics') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-emerald-500 hover:bg-emerald-500/10 border border-transparent'
            }`}>
            <span>📊</span><span className="hidden sm:block">Analytics</span>
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Roadmap limit badge */}
          {isLoggedIn && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs border border-[#1e304d] rounded-lg px-2.5 py-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${roadmapLimit.remaining > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-slate-400 font-mono">{roadmapLimit.remaining}/2</span>
            </div>
          )}

          {isLoggedIn ? (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-[#0d1424] border border-[#1e304d] hover:border-blue-500/40 transition-all"
            >
              <img src={user.avatar} alt={user.name}
                className="w-7 h-7 rounded-lg object-cover"
                onError={e => { e.target.style.display='none' }} />
              <span className="text-slate-300 text-xs font-medium max-w-[80px] truncate hidden sm:block">
                {user.name?.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
