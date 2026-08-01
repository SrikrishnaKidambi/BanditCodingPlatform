import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { userAPI, progressAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

export default function Profile() {
  const { logout }        = useAuth()
  const navigate          = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting]       = useState(false)
  const [resetError, setResetError]     = useState('')

  useEffect(() => {
    userAPI.profile()
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleFullReset() {
    setResetting(true)
    setResetError('')
    try {
      await progressAPI.resetAll()
      setConfirmReset(false)
      navigate('/coldstart')
    } catch {
      setResetError('Reset failed. Please try again.')
      setResetting(false)
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <p className="text-gray-400 dark:text-gray-500 text-sm">Loading…</p>
    </div>
  )

  if (!profile) return null

  const successRate = profile.totalAttempted > 0
    ? Math.round((profile.totalSolved / profile.totalAttempted) * 100)
    : 0

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 max-w-sm mx-4 w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Reset All Progress?</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This permanently deletes your submission history and Bandit learning state. You will be taken back to the skill assessment to start fresh.
            </p>
            {resetError && <p className="text-xs text-red-500 mb-3">{resetError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmReset(false); setResetError('') }}
                className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFullReset}
                disabled={resetting}
                className="flex-1 text-sm px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {resetting ? 'Resetting…' : 'Yes, Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        <button
          onClick={logout}
          className="text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
        >
          Sign out
        </button>
      </div>

      <div className="bg-white/20 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm backdrop-blur-md p-6 flex items-center gap-5 mb-6">
        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-white">{initials(profile.name)}</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{profile.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Member since {profile.joinDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Problems Solved" value={profile.totalSolved}       sub={`of ${profile.totalAttempted} attempted`} color="indigo" />
        <StatCard label="Success Rate"    value={`${successRate}%`}         sub="all time"                                  color="green"  />
        <StatCard label="Current Streak"  value={`${profile.streak} days`}  sub="keep it up!"                              color="orange" />
        <StatCard label="Topics Studied"  value={profile.topicsActive}      sub="of 5 total topics"                        color="purple" />
      </div>

      <div className="bg-white/20 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm backdrop-blur-md p-6 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Details</h3>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Full Name',  value: profile.name },
            { label: 'Email',      value: profile.email },
            { label: 'Joined',     value: profile.joinDate },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between border-b border-gray-50 dark:border-white/10 pb-3 last:border-0 last:pb-0">
              <span className="text-gray-400 dark:text-gray-500">{label}</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/10 dark:bg-white/5 rounded-xl border border-red-200/50 dark:border-red-900/30 backdrop-blur-md p-5">
        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Danger Zone</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Resets all submission history and Bandit learning state. You will re-do the skill assessment from scratch. Topic-level resets are available on the Mastery page.
        </p>
        <button
          onClick={() => setConfirmReset(true)}
          className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium border border-red-200 dark:border-red-800/50 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset All Progress
        </button>
      </div>
    </div>
  )
}
