import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Onboarding() {
  const { user, updateHandles } = useAuth()
  const navigate = useNavigate()
  const [cfHandle, setCfHandle] = useState('')
  const [lcHandle, setLcHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validating, setValidating] = useState('')

  const validateCF = async (handle) => {
    if (!handle) return true
    try {
      const res = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`)
      return res.data.status === 'OK'
    } catch { return false }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cfHandle && !lcHandle) {
      setError('Please enter at least one handle')
      return
    }
    setLoading(true); setError('')

    // Validate CF handle
    if (cfHandle) {
      setValidating('Validating Codeforces handle...')
      const cfValid = await validateCF(cfHandle)
      if (!cfValid) {
        setError(`Codeforces handle "${cfHandle}" not found. Check spelling.`)
        setLoading(false); setValidating('')
        return
      }
    }

    setValidating('Saving your profile...')
    try {
      await updateHandles(cfHandle.trim(), lcHandle.trim())
      navigate('/profile')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Try again.')
    } finally {
      setLoading(false); setValidating('')
    }
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-3xl mx-auto mb-4">👋</div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-slate-400 text-sm">Set up your competitive programming handles to get started</p>
        </div>

        <div className="bg-[#0d1424] border border-[#1e304d] rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* CF Handle */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                <span className="text-blue-400">⚡</span> Codeforces Handle
              </label>
              <input
                type="text"
                value={cfHandle}
                onChange={e => setCfHandle(e.target.value)}
                placeholder="e.g. tourist"
                className="w-full bg-[#080c14] border border-[#1e304d] focus:border-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono text-sm focus:outline-none transition"
              />
              <p className="text-slate-600 text-xs mt-1.5">Your Codeforces username</p>
            </div>

            {/* LC Handle */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                <span className="text-amber-400">🟨</span> LeetCode Handle
              </label>
              <input
                type="text"
                value={lcHandle}
                onChange={e => setLcHandle(e.target.value)}
                placeholder="e.g. sharstigarg17"
                className="w-full bg-[#080c14] border border-[#1e304d] focus:border-amber-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono text-sm focus:outline-none transition"
              />
              <p className="text-slate-600 text-xs mt-1.5">Your LeetCode username</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}

            {validating && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                {validating}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-60 text-sm"
            >
              {loading ? 'Setting up...' : "Let's Go! →"}
            </button>

            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition"
            >
              Skip for now
            </button>
          </form>
        </div>

        <p className="text-slate-600 text-xs text-center mt-4">
          You can change these anytime from your profile
        </p>
      </div>
    </div>
  )
}
