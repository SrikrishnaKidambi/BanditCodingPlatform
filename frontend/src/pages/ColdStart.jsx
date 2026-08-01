import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recommendAPI, topicsAPI } from '../services/api'
import SkyBackground from '../components/SkyBackground'

const DEFAULT_TOPICS = ['Arrays', 'BinarySearch', 'Trees', 'Graphs', 'DP']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const LEVELS = [
  { value: 1, label: 'Never tried',  desc: '~10% success rate' },
  { value: 2, label: 'Beginner',     desc: '~25% success rate' },
  { value: 3, label: 'Intermediate', desc: '~50% success rate' },
  { value: 4, label: 'Advanced',     desc: '~80% success rate' },
]

const diffColor = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' }

export default function ColdStart() {
  const navigate  = useNavigate()

  const [topics, setTopics] = useState(DEFAULT_TOPICS)
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    topicsAPI.get()
      .then(({ data }) => {
        const nextTopics = Array.isArray(data?.topics) && data.topics.length > 0 ? data.topics : DEFAULT_TOPICS
        setTopics(nextTopics)
        const initial = {}
        nextTopics.forEach(t => DIFFICULTIES.forEach(d => { initial[`${t}_${d}`] = 2 }))
        setRatings(initial)
      })
      .catch(() => {
        const initial = {}
        DEFAULT_TOPICS.forEach(t => DIFFICULTIES.forEach(d => { initial[`${t}_${d}`] = 2 }))
        setRatings(initial)
      })
  }, [])

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
    <div className="min-h-screen px-4 py-10">
      <SkyBackground />

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Code Compass</h1>
          <p className="text-indigo-200/70 mt-1 text-sm">Learn Coding Smarter</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-1">
            Quick Skill Assessment
          </h2>
          <p className="text-sm text-white/60 mb-6">
            Rate your comfort level for each topic so the engine can personalise recommendations from day one.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {topics.map(topic => (
              <div key={topic}>
                <h3 className="text-sm font-semibold text-white mb-3">{topic}</h3>
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
                                  ? 'bg-indigo-500 text-white border-indigo-500'
                                  : 'bg-white/10 text-white/70 border-white/20 hover:border-indigo-400 hover:text-white'
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
              <p className="text-sm text-red-300">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50 transition-all duration-200 mt-2 shadow-lg shadow-indigo-900/40"
            >
              {loading ? 'Setting up your profile…' : 'Start Learning →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-4">
          You can always skip — the engine will learn from your attempts.
        </p>
      </div>
    </div>
  )
}
