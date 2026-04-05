import { useEffect, useRef } from 'react'
import axios from 'axios'

// Generate or retrieve session ID
const getSessionId = () => {
  let sid = sessionStorage.getItem('cp_session')
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36)
    sessionStorage.setItem('cp_session', sid)
  }
  return sid
}

// Silent fire-and-forget tracker — never breaks the app
const track = (page, handle = null, platform = null) => {
  try {
    axios.post('/api/analytics/visit', {
      sessionId: getSessionId(),
      page,
      handle,
      platform,
    }).catch(() => {}) // silently ignore errors
  } catch (e) {}
}

// Hook for page-level tracking
export const useAnalytics = (page) => {
  useEffect(() => {
    track(page)
  }, [page])
}

// Call this when a user searches a CF handle
export const trackCFSearch = (handle) => track('/dashboard', handle, 'cf')

// Call this when a user searches a LC handle  
export const trackLCSearch = (handle) => track('/leetcode', handle, 'lc')

export default track
