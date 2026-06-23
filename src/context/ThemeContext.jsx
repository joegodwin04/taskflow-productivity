/* eslint-disable react-refresh/only-export-components */
// ThemeContext.jsx — Light/dark mode with per-user localStorage persistence
import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({ theme: 'dark', toggle: () => {}, setUserId: () => {} })

export function ThemeProvider({ children }) {
  const [userId, setUserId] = useState(null)

  const [theme, setTheme] = useState(() => {
    // On initial load, check if a user session exists for immediate per-user theme
    try {
      const savedUser = localStorage.getItem('tf_user')
      if (savedUser) {
        const user = JSON.parse(savedUser)
        if (user?.id) {
          const userTheme = localStorage.getItem(`taskflow_${user.id}_theme`)
          if (userTheme) return userTheme
        }
      }
    } catch { /* ignore malformed localStorage data */ }
    return localStorage.getItem('tf_theme') || 'dark'
  })

  // Adjusting state during render when userId changes — React-recommended pattern
  // (see react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const [prevUserId, setPrevUserId] = useState(null)
  if (userId !== prevUserId) {
    setPrevUserId(userId)
    if (userId) {
      const saved = localStorage.getItem(`taskflow_${userId}_theme`) || 'dark'
      setTheme(saved)
    }
  }

  // Apply theme to DOM and persist under the correct user-scoped key
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const key = userId ? `taskflow_${userId}_theme` : 'tf_theme'
    localStorage.setItem(key, theme)
  }, [theme, userId])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggle, setUserId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
