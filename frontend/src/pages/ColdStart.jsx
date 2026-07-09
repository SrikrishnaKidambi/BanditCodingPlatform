import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { recommendAPI } from '../services/api'

const TOPICS = ['Arrays', 'BinarySearch', 'Trees', 'Graphs', 'DP']
const DIFFICULTIES = ['Easy', 'Medium']
const LEVELS = [
  { value: 1, label: 'Never tried',  desc: '~10% success rate' },
  { value: 2, label: 'Beginner',     desc: '~25% success rate' },
  { value: 3, label: 'Intermediate', desc: '~50% success rate' },
  { value: 4, label: 'Advanced',     desc: '~80% success rate' },
]

const diffColor = { Easy: 'text-green-600 dark:text-green-400', Medium: 'text-yellow-600 dark:text-yellow-400' }

export default function ColdStart() {
  const navigate  = useNavigate()
  const { dark, toggle } = useTheme()

  const initial = {}
  TOPICS.forEach(t => DIFFICULTIES.forEach(d => { initial[`${t}_${d}`] = 2 }))

  const [ratings, setRatings]   = useState(initial)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  function set(key, value) {
    setRatings(prev => ({ ...prev, [key]: Number(value) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await recommendAPI.assess(ratings)
      navigate('/dashboard')
    } catch {
      setError('Failed to submit assessment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <button
        onClick={toggle}
        className="fixed top-4 right-4 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {dark ? '☀ Light' : '🌙 Dark'}
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">BanditLearn</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Adaptive Coding Practice</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Quick Skill Assessment
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Rate your comfort level for each topic so the engine can personalise recommendations from day one.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {TOPICS.map(topic => (
              <div key={topic}>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{topic}</h3>
                <div className="space-y-3 pl-2">
                  {DIFFICULTIES.map(diff => {
                    const key = `${topic}_${diff}`
                    const val = ratings[key]
                    return (
                      <div key={diff} className="flex items-center gap-4">
                        <span className={`text-xs font-medium w-14 shrink-0 ${diffColor[diff]}`}>{diff}</span>
                        <div className="flex gap-2 flex-wrap">
                          {LEVELS.map(lvl => (
                            <button
                              key={lvl.value}
                              type="button"
                              onClick={() => set(key, lvl.value)}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                                val === lvl.value
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                              }`}
                            >
                              {lvl.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Setting up your profile…' : 'Start Learning →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          You can always skip — the engine will learn from your attempts.
        </p>
      </div>
    </div>
  )
}
