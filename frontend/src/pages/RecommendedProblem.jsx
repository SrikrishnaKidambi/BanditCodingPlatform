import { useState, useEffect, useCallback } from 'react'
import ProblemCard from '../components/ProblemCard'
import { recommendAPI } from '../services/api'

export default function RecommendedProblem() {
  const [rec,        setRec]        = useState(null)
  const [outcome,    setOutcome]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  const loadRecommendation = useCallback(async () => {
    setLoading(true)
    setOutcome(null)
    setError('')
    try {
      const { data } = await recommendAPI.get()
      setRec(data)
    } catch {
      setError('Could not load a recommendation. Try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRecommendation() }, [loadRecommendation])

  async function handleOutcome(solved) {
    if (!rec || submitting) return
    setSubmitting(true)
    try {
      await recommendAPI.submit(
        rec.problem.problem_id,
        rec.problem.title,
        rec.arm.topic,
        rec.arm.difficulty,
        rec.mode,
        solved
      )
      setOutcome(solved ? 'solved' : 'failed')
    } catch {
      setError('Failed to record your answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <p className="text-gray-400 dark:text-gray-500 text-sm">Finding your next problem…</p>
    </div>
  )

  if (error && !rec) return (
    <div className="p-8 max-w-2xl mx-auto">
      <p className="text-red-500 text-sm mb-4">{error}</p>
      <button onClick={loadRecommendation} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
        Try again
      </button>
    </div>
  )

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recommended Problem</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Selected by Educational Thompson Sampling · <span className="capitalize">{rec?.mode}</span> mode
        </p>
      </div>

      {rec && <ProblemCard problem={{ ...rec.problem, mode: rec.mode, reason: rec.reason }} showReason />}

      {error && (
        <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {outcome && (
        <div className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium border ${
          outcome === 'solved'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
        }`}>
          {outcome === 'solved'
            ? '✓ Marked as solved — great work! Your mastery estimate has been updated.'
            : '✗ Marked as failed — the engine will adjust and recommend better follow-ups.'}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {rec && (
          <a
            href={rec.problem.url}
            target="_blank"
            rel="noreferrer"
            className="w-full text-center bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Open on {rec.problem.platform} ↗
          </a>
        )}

        {!outcome && (
          <div className="flex gap-3">
            <button
              onClick={() => handleOutcome(true)}
              disabled={submitting}
              className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg py-2.5 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors"
            >
              ✓ Mark as Solved
            </button>
            <button
              onClick={() => handleOutcome(false)}
              disabled={submitting}
              className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg py-2.5 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
            >
              ✗ Mark as Failed
            </button>
          </div>
        )}

        {outcome && (
          <button
            onClick={loadRecommendation}
            className="w-full bg-gray-900 dark:bg-gray-700 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            Next Recommendation →
          </button>
        )}
      </div>
    </div>
  )
}
