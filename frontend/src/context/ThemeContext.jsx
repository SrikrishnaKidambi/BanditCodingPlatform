import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

function isDayHour() {
  const debug = new URLSearchParams(window.location.search).get('hour')
  const h = debug !== null ? parseFloat(debug) : new Date().getHours()
  return h >= 7 && h < 19
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => !isDayHour())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // re-sync with real time every 5 minutes
  useEffect(() => {
    const id = setInterval(() => setDark(!isDayHour()), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <ThemeContext.Provider value={{ dark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
