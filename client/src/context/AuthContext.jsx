import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Axios interceptor — attach token to every request
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('cp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roadmapLimit, setRoadmapLimit] = useState({ count: 0, limit: 2, remaining: 2 })

  // Load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem('cp_token')
    if (token) {
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchMe = async () => {
    try {
      const res = await axios.get('/api/auth/me')
      setUser(res.data)
      setRoadmapLimit(res.data.roadmapLimit)
    } catch {
      localStorage.removeItem('cp_token')
    } finally {
      setLoading(false)
    }
  }

  // Called after Google OAuth success
  const loginWithGoogle = async (accessToken) => {
    const res = await axios.post('/api/auth/google', { accessToken })
    const { token, user } = res.data
    localStorage.setItem('cp_token', token)
    setUser(user)
    setRoadmapLimit(user.roadmapLimit || { count: 0, limit: 2, remaining: 2 })
    return user
  }

  const logout = () => {
    localStorage.removeItem('cp_token')
    setUser(null)
    setRoadmapLimit({ count: 0, limit: 2, remaining: 2 })
  }

  const updateHandles = async (cfHandle, lcHandle) => {
    const res = await axios.put('/api/auth/handles', { cfHandle, lcHandle })
    setUser(prev => ({ ...prev, cfHandle: res.data.cfHandle, lcHandle: res.data.lcHandle }))
    return res.data
  }

  const refreshLimit = async () => {
    if (!user) return
    const res = await axios.get('/api/auth/roadmap-limit')
    setRoadmapLimit(res.data)
    return res.data
  }

  const saveRoadmap = async (platform, handle, duration, title, summary, target, roadmap) => {
    const res = await axios.post('/api/auth/roadmaps', {
      platform, handle, duration, title, summary, target, roadmap
    })
    await refreshLimit()
    return res.data
  }

  const getRoadmapHistory = async () => {
    const res = await axios.get('/api/auth/roadmaps')
    return res.data
  }

  const getRoadmap = async (id) => {
    const res = await axios.get(`/api/auth/roadmaps/${id}`)
    return res.data
  }

  const deleteRoadmap = async (id) => {
    await axios.delete(`/api/auth/roadmaps/${id}`)
  }

  return (
    <AuthContext.Provider value={{
      user, loading, roadmapLimit,
      loginWithGoogle, logout, updateHandles,
      saveRoadmap, getRoadmapHistory, getRoadmap, deleteRoadmap,
      refreshLimit, fetchMe,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
