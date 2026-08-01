import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_admin')) } catch { return null }
  })

  function login(token, adminData) {
    localStorage.setItem('cc_admin_token', token)
    localStorage.setItem('cc_admin', JSON.stringify(adminData))
    setAdmin(adminData)
  }

  function logout() {
    localStorage.removeItem('cc_admin_token')
    localStorage.removeItem('cc_admin')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
