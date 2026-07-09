import { useState, useEffect } from 'react'
import StatCard from '../components/StatCard'
import { userAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

export default function Profile() {
  const { logout }        = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userAPI.profile()
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        <button
          onClick={logout}
          className="text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
        >
          Sign out
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex items-center gap-5 mb-6">
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

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Details</h3>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Full Name',  value: profile.name },
            { label: 'Email',      value: profile.email },
            { label: 'Joined',     value: profile.joinDate },
            { label: 'Algorithm',  value: 'Educational Thompson Sampling' },
            { label: 'Backend',    value: 'Node.js + Express + MySQL' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between border-b border-gray-50 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
              <span className="text-gray-400 dark:text-gray-500">{label}</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
