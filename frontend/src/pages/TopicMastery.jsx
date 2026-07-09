import { useState, useEffect } from 'react'
import MasteryBar from '../components/MasteryBar'
import { userAPI } from '../services/api'

const TOPICS = ['Arrays', 'BinarySearch', 'Trees', 'Graphs', 'DP']

const strengthStyle = {
  strong:     'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  developing: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  weak:       'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
}

function getStrengthKey(avg) {
  if (avg >= 0.7) return 'strong'
  if (avg >= 0.4) return 'developing'
  return 'weak'
}

export default function TopicMastery() {
  const [mastery, setMastery] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userAPI.mastery()
      .then(r => setMastery(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <p className="text-gray-400 dark:text-gray-500 text-sm">Loading mastery data…</p>
    </div>
  )

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Topic Mastery</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Estimated from Bayesian posterior means · updated each session
        </p>
      </div>

      <div className="space-y-4">
        {TOPICS.map(topic => {
          const arms = mastery.filter(d => d.topic === topic)
          if (arms.length === 0) return null
          const avg = arms.reduce((s, d) => s + d.mastery, 0) / arms.length
          const key = getStrengthKey(avg)

          return (
            <div key={topic} className="bg-white/20 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm backdrop-blur-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{topic}</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${strengthStyle[key]}`}>
                  {key.charAt(0).toUpperCase() + key.slice(1)} · {Math.round(avg * 100)}% avg
                </span>
              </div>
              <div className="space-y-3">
                {arms.map((arm, i) => (
                  <MasteryBar key={arm.difficulty} difficulty={arm.difficulty} mastery={arm.mastery} index={i} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6">
        Mastery estimated via Beta distribution posterior means from Thompson Sampling.
        Green ≥ 70% · Yellow 40–70% · Red &lt; 40%
      </p>
    </div>
  )
}
