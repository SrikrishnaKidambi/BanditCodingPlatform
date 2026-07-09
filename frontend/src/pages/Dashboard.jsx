import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import ProblemCard from '../components/ProblemCard'
import { userAPI, recommendAPI } from '../services/api'

const difficultyStyle = {
  Easy:   'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  Medium: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
}

const outcomeStyle = {
  solved: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  failed: 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [profile,  setProfile]  = useState(null)
  const [rec,      setRec]      = useState(null)
  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    Promise.all([userAPI.profile(), recommendAPI.get(), userAPI.history()])
      .then(([p, r, h]) => {
        setProfile(p.data)
        setRec(r.data)
        setHistory(h.data.slice(0, 3))
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <p className="text-gray-400 dark:text-gray-500 text-sm">Loading…</p>
    </div>
  )

  if (error) return (
    <div className="p-8 max-w-4xl mx-auto">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  )

  const successRate = profile.totalAttempted > 0
    ? Math.round((profile.totalSolved / profile.totalAttempted) * 100)
    : 0

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {greeting}, {profile.name.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here is your learning plan for today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Total Solved"   value={profile.totalSolved}      sub="problems"      color="indigo" />
        <StatCard label="Current Streak" value={`${profile.streak}d`}     sub="days in a row" color="orange" />
        <StatCard label="Active Topics"  value={profile.topicsActive}     sub="of 5 topics"   color="purple" />
        <StatCard label="Success Rate"   value={`${successRate}%`}        sub="all time"      color="green"  />
      </div>

      {rec && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Today's Recommendation</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">Powered by Thompson Sampling</span>
          </div>
          <ProblemCard problem={{ ...rec.problem, mode: rec.mode, reason: rec.reason }} showReason />
          <button
            onClick={() => navigate('/recommended')}
            className="mt-3 w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Practice Now →
          </button>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Activity</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No attempts yet — start practising!</p>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm divide-y divide-gray-50 dark:divide-gray-700">
            {history.map(entry => (
              <div key={entry.problem_id + entry.date} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{entry.topic} · {entry.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyStyle[entry.difficulty]}`}>
                    {entry.difficulty}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${outcomeStyle[entry.outcome]}`}>
                    {entry.outcome === 'solved' ? '✓ Solved' : '✗ Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => navigate('/history')}
          className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
        >
          View full history →
        </button>
      </div>
    </div>
  )
}
