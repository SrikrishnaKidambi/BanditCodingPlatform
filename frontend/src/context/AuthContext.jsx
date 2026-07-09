import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  async function login(email, password) {
    const { data } = await authAPI.login(email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    navigate('/dashboard')
  }

  async function register(email, password, display_name) {
    const { data } = await authAPI.register(email, password, display_name)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    navigate('/coldstart')
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
