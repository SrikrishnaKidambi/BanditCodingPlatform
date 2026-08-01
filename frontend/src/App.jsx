import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ColdStart from './pages/ColdStart'
import Dashboard from './pages/Dashboard'
import RecommendedProblem from './pages/RecommendedProblem'
import PracticeHistory from './pages/PracticeHistory'
import TopicMastery from './pages/TopicMastery'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import ResetArm from './pages/ResetArm'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"     element={<Login />} />
      <Route path="/coldstart" element={<ProtectedRoute><ColdStart /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/"           element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/recommended" element={<RecommendedProblem />} />
        <Route path="/history"    element={<PracticeHistory />} />
        <Route path="/mastery"    element={<TopicMastery />} />
        <Route path="/analytics"  element={<Analytics />} />
        <Route path="/profile"    element={<Profile />} />
        <Route path="/reset-arm"  element={<ResetArm />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
