import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MasteryBar from '../components/MasteryBar'
import { topicsAPI, userAPI } from '../services/api'

const DEFAULT_TOPICS = ['Arrays', 'BinarySearch', 'Trees', 'Graphs', 'DP']

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

function ResetIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

export default function TopicMastery() {
  const navigate = useNavigate()
  const [mastery, setMastery] = useState([])
  const [topics, setTopics] = useState(DEFAULT_TOPICS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([userAPI.mastery(), topicsAPI.get()])
      .then(([masteryRes, topicsRes]) => {
        setMastery(masteryRes.data)
        const nextTopics = Array.isArray(topicsRes.data?.topics) && topicsRes.data.topics.length > 0
          ? topicsRes.data.topics
          : DEFAULT_TOPICS
        setTopics(nextTopics)
      })
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
          Estimated from Bayesian posterior means · updated each session · click ↺ to re-assess any arm
        </p>
      </div>

      <div className="space-y-4">
        {topics.map(topic => {
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
                  <div key={arm.difficulty} className="flex items-center gap-2">
                    <div className="flex-1">
                      <MasteryBar difficulty={arm.difficulty} mastery={arm.mastery} index={i} />
                    </div>
                    <button
                      onClick={() => navigate(`/reset-arm?topic=${arm.topic}&difficulty=${arm.difficulty}`)}
                      title={`Re-assess ${arm.topic} ${arm.difficulty}`}
                      className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-white/30 dark:hover:bg-white/10 transition-colors shrink-0"
                    >
                      <ResetIcon />
                    </button>
                  </div>
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
