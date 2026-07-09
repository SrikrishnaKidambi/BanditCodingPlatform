import { useState, useEffect } from 'react'
import { userAPI } from '../services/api'

const difficultyStyle = {
  Easy:   'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  Medium: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
}
const modeStyle = {
  learning: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  weak:     'text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  revision: 'text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
}
const outcomeStyle = {
  solved: 'text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  failed: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
}

export default function PracticeHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    userAPI.history()
      .then(r => setHistory(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = history.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.topic.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Practice History</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {loading ? 'Loading…' : `${history.length} problems attempted`}
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by title or topic…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-white/5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white/20 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm backdrop-blur-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-white/10">
              {['Date', 'Problem', 'Topic', 'Difficulty', 'Mode', 'Outcome'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.map((entry, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 whitespace-nowrap">{entry.date}</td>
                <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">{entry.title}</td>
                <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{entry.topic}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyStyle[entry.difficulty]}`}>
                    {entry.difficulty}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${modeStyle[entry.mode]}`}>
                    {entry.mode}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${outcomeStyle[entry.outcome]}`}>
                    {entry.outcome === 'solved' ? '✓ Solved' : '✗ Failed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
            {history.length === 0 ? 'No attempts yet — start practising!' : 'No problems match your search.'}
          </p>
        )}
      </div>
    </div>
  )
}
