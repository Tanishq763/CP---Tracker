import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import SearchBar from './components/SearchBar'
import Dashboard from './pages/Dashboard'
import Recommendations from './pages/Recommendations'
import Roadmap from './pages/Roadmap'
import LeetCode from './pages/LeetCode'
import Analytics from './pages/Analytics'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import RoadmapHistory from './pages/RoadmapHistory'
import { useAuth } from './context/AuthContext'
import { trackCFSearch } from './hooks/useAnalytics'

function AppContent() {
  const { user, loading, isLoggedIn } = useAuth()
  const [handle, setHandle] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const isLeetCode  = location.pathname === '/leetcode'
  const isAnalytics = location.pathname === '/analytics'
  const isAuthPage  = ['/login', '/onboarding', '/profile'].includes(location.pathname)
  const isHistoryPage = location.pathname.startsWith('/roadmap-history')

  // Auto-load CF handle from logged-in user
  useEffect(() => {
    if (isLoggedIn && user?.cfHandle && !handle) {
      setHandle(user.cfHandle)
    }
  }, [isLoggedIn, user])

  // Handle ?handle= query param
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const h = params.get('handle')
    if (h) setHandle(h)
  }, [location.search])

  const handleSearch = (h) => {
    setHandle(h)
    trackCFSearch(h)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )

  // Auth-only pages — no main layout
  if (isAuthPage || isHistoryPage) return (
    <Routes>
      <Route path="/login"     element={<Login />} />
      <Route path="/onboarding" element={isLoggedIn ? <Onboarding /> : <Navigate to="/login" />} />
      <Route path="/profile"   element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} />
      <Route path="/roadmap-history/:id" element={isLoggedIn ? <RoadmapHistory /> : <Navigate to="/login" />} />
    </Routes>
  )

  return (
    <div className="min-h-screen bg-[#080c14]">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage:'linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)', backgroundSize:'40px 40px' }} />

      <Navbar handle={handle} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!isLeetCode && !isAnalytics && (
          <SearchBar onSearch={handleSearch} currentHandle={handle} />
        )}

        {!handle && !isLeetCode && !isAnalytics && (
          <div className="flex flex-col items-center justify-center mt-20 text-center animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-[#0d1424] border border-[#1e304d] flex items-center justify-center text-5xl mb-6 glow-blue">⚡</div>
            <h1 className="text-4xl font-bold text-gradient mb-3">CP Problem Tracker</h1>
            <p className="text-slate-400 text-lg max-w-md">
              Analyze Codeforces & LeetCode profiles, discover weak spots, and get a hyper-personalized AI roadmap.
            </p>

            {isLoggedIn && user?.cfHandle && (
              <button
                onClick={() => setHandle(user.cfHandle)}
                className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition active:scale-95"
              >
                Load my CF Dashboard ({user.cfHandle}) →
              </button>
            )}

            {!isLoggedIn && (
              <button
                onClick={() => navigate('/login')}
                className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition active:scale-95"
              >
                Sign in to save roadmaps →
              </button>
            )}

            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              {['Codeforces API','LeetCode Stats','Tag Analysis','Smart Recs','AI Roadmap','Analytics'].map(f => (
                <span key={f} className="badge bg-[#0d1424] border-[#1e304d] text-slate-400 text-xs px-3 py-1.5">{f}</span>
              ))}
            </div>
          </div>
        )}

        <Routes>
          <Route path="/"                element={handle ? <Dashboard handle={handle} /> : null} />
          <Route path="/recommendations" element={handle ? <Recommendations handle={handle} /> : <Navigate to="/" />} />
          <Route path="/roadmap"         element={handle ? <Roadmap handle={handle} /> : <Navigate to="/" />} />
          <Route path="/leetcode"        element={<LeetCode />} />
          <Route path="/analytics"       element={<Analytics />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/onboarding"      element={isLoggedIn ? <Onboarding /> : <Navigate to="/login" />} />
          <Route path="/profile"         element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/roadmap-history/:id" element={isLoggedIn ? <RoadmapHistory /> : <Navigate to="/login" />} />
          <Route path="*"                element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
