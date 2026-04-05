import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { loginWithGoogle, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoggedIn) navigate('/profile')
  }, [isLoggedIn])

  // Load Google Identity Services script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGoogle
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

  const initGoogle = () => {
    if (!window.google) return
    window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: handleGoogleResponse,
    })
  }

  const handleGoogleResponse = async (response) => {
    if (response.error) { setError('Google sign-in failed'); return }
    setLoading(true); setError('')
    try {
      const user = await loginWithGoogle(response.access_token)
      // If no handles set yet, go to onboarding
      if (!user.cfHandle && !user.lcHandle) {
        navigate('/onboarding')
      } else {
        navigate('/profile')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const triggerGoogleLogin = () => {
    if (!window.google) { setError('Google not loaded. Refresh and try again.'); return }
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: handleGoogleResponse,
    })
    tokenClient.requestAccessToken()
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center px-4">
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-[#0d1424] border border-[#1e304d] flex items-center justify-center text-5xl mx-auto mb-5 glow-blue">⚡</div>
          <h1 className="text-3xl font-bold text-white font-mono">
            cp<span className="text-blue-400">tracker</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Your personalized CP & DSA companion</p>
        </div>

        {/* Card */}
        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-8">
          <h2 className="text-white font-semibold text-lg mb-2 text-center">Welcome back</h2>
          <p className="text-slate-500 text-sm text-center mb-8">Sign in to save roadmaps, track history, and unlock all features</p>

          {/* Features list */}
          <div className="space-y-3 mb-8">
            {[
              { icon: '🤖', text: 'AI-powered personalized roadmaps' },
              { icon: '💾', text: 'Save & revisit your roadmap history' },
              { icon: '⚡', text: 'Auto-load your CF & LC dashboards' },
              { icon: '📊', text: '2 AI roadmaps per day, saved forever' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-400">
                <span className="text-base flex-shrink-0">{icon}</span>
                {text}
              </div>
            ))}
          </div>

          {/* Google button */}
          <button
            onClick={triggerGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3.5 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {error && (
            <p className="text-rose-400 text-sm text-center mt-4">{error}</p>
          )}

          <p className="text-slate-600 text-xs text-center mt-6">
            By signing in you agree to use this platform for CP practice.
          </p>
        </div>
      </div>
    </div>
  )
}
