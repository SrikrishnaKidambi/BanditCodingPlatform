import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { progressAPI } from '../services/api'

const LEVELS = [
  { value: 1, label: 'Never tried',  desc: '~10% success rate' },
  { value: 2, label: 'Beginner',     desc: '~25% success rate' },
  { value: 3, label: 'Intermediate', desc: '~50% success rate' },
  { value: 4, label: 'Advanced',     desc: '~80% success rate' },
]

export default function ResetArm() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const topic          = searchParams.get('topic') || ''
  const difficulty     = searchParams.get('difficulty') || ''

  const [rating, setRating]   = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const diffBadge = difficulty === 'Easy'
    ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
    : difficulty === 'Hard'
      ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
      : 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await progressAPI.resetArm(topic, difficulty, rating)
      navigate('/mastery')
    } catch {
      setError('Reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <button
        onClick={() => navigate('/mastery')}
        className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Topic Mastery
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Re-assess Arm</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
          Recalibrate the Bandit priors for
          <span className="font-semibold text-gray-700 dark:text-gray-200">{topic}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diffBadge}`}>{difficulty}</span>
        </p>
      </div>

      <div className="bg-white/20 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm backdrop-blur-md p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Choose your current comfort level. Only this arm's Bayesian priors will be updated — your submission history and other topics are untouched.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            {LEVELS.map(lvl => (
              <button
                key={lvl.value}
                type="button"
                onClick={() => setRating(lvl.value)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  rating === lvl.value
                    ? 'bg-indigo-500/20 dark:bg-indigo-500/30 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white/10 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <span>{lvl.label}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{lvl.desc}</span>
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Resetting…' : 'Reset & Recalibrate →'}
          </button>
        </form>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
        The engine will use these new priors as the starting point for future recommendations on this arm.
      </p>
    </div>
  )
}
