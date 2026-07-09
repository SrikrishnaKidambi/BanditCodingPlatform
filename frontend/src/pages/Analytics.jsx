import { useState, useEffect } from 'react'
import { userAPI } from '../services/api'

const TOPICS = ['Arrays', 'BinarySearch', 'Trees', 'Graphs', 'DP']

const modeConfig = {
  learning: { label: 'Learning Zone', color: 'bg-blue-500',   target: '70%' },
  weak:     { label: 'Weak Topic',    color: 'bg-orange-400', target: '20%' },
  revision: { label: 'Revision',      color: 'bg-purple-500', target: '10%' },
}

function heatColor(value) {
  if (value >= 0.70) return 'bg-green-500 text-white'
  if (value >= 0.50) return 'bg-green-300 text-green-900'
  if (value >= 0.40) return 'bg-yellow-300 text-yellow-900'
  if (value >= 0.25) return 'bg-orange-400 text-white'
  return 'bg-red-400 text-white'
}

function CompetencyHeatmap({ mastery }) {
  const lookup = {}
  mastery.forEach(m => { lookup[`${m.topic}_${m.difficulty}`] = m.mastery })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs text-gray-400 dark:text-gray-500 font-medium pb-3 w-32">Topic</th>
            {['Easy', 'Medium'].map(d => (
              <th key={d} className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium pb-3 px-3">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TOPICS.map(topic => (
            <tr key={topic}>
              <td className="text-xs text-gray-700 dark:text-gray-300 font-medium pr-4 py-1.5">{topic}</td>
              {['Easy', 'Medium'].map(diff => {
                const val = lookup[`${topic}_${diff}`] ?? 0
                return (
                  <td key={diff} className="px-3 py-1.5 text-center">
                    <div className={`mx-auto w-20 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${heatColor(val)}`}>
                      {Math.round(val * 100)}%
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        {[
          { color: 'bg-red-400',    label: '< 25%' },
          { color: 'bg-orange-400', label: '25–40%' },
          { color: 'bg-yellow-300', label: '40–50%' },
          { color: 'bg-green-300',  label: '50–70%' },
          { color: 'bg-green-500',  label: '≥ 70%' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrajectoryChart({ data }) {
  if (data.length === 0)
    return <p className="text-sm text-gray-400 dark:text-gray-500">No data yet — attempt some problems first.</p>

  const W = 500, H = 130, PX = 24, PY = 16
  const innerW = W - PX * 2
  const innerH = H - PY * 2

  const points = data.map((d, i) => {
    const x = PX + (i / Math.max(data.length - 1, 1)) * innerW
    const y = PY + innerH - (d.success_rate / 100) * innerH
    return [x, y]
  })

  const polyline = points.map(([x, y]) => `${x},${y}`).join(' ')

  // Fill area under the line
  const areaPoints = [
    `${PX},${PY + innerH}`,
    ...points.map(([x, y]) => `${x},${y}`),
    `${PX + innerW},${PY + innerH}`,
  ].join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 130 }}>
        {/* Grid lines at 0%, 25%, 50%, 75%, 100% */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = PY + innerH - (pct / 100) * innerH
          return (
            <g key={pct}>
              <line x1={PX} y1={y} x2={W - PX} y2={y}
                stroke="#e5e7eb" strokeWidth="0.5" className="dark:stroke-gray-700" />
              <text x={PX - 4} y={y + 4} fontSize="8" textAnchor="end"
                className="fill-gray-400 dark:fill-gray-500">{pct}%</text>
            </g>
          )
        })}
        {/* Area fill */}
        <polygon points={areaPoints} fill="#6366f1" fillOpacity="0.08" />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#6366f1" />
        ))}
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between mt-1 px-6">
        {data.length <= 7
          ? data.map(d => (
              <span key={d.day} className="text-xs text-gray-400 dark:text-gray-500">{d.day.slice(5)}</span>
            ))
          : (
            <>
              <span className="text-xs text-gray-400 dark:text-gray-500">{data[0].day.slice(5)}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{data[Math.floor(data.length / 2)].day.slice(5)}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{data[data.length - 1].day.slice(5)}</span>
            </>
          )
        }
      </div>
    </div>
  )
}

export default function Analytics() {
  const [stats,      setStats]      = useState(null)
  const [mastery,    setMastery]    = useState([])
  const [trajectory, setTrajectory] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([userAPI.stats(), userAPI.mastery(), userAPI.trajectory()])
      .then(([s, m, t]) => {
        setStats(s.data)
        setMastery(m.data)
        setTrajectory(t.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <p className="text-gray-400 dark:text-gray-500 text-sm">Loading analytics…</p>
    </div>
  )

  const modeCounts      = stats?.mode_counts       || {}
  const armCounts       = stats?.arm_counts        || []
  const revisionByTopic = stats?.revision_by_topic || {}
  const diversityScore  = stats?.diversity_score   ?? null
  const total           = Object.values(modeCounts).reduce((a, b) => a + b, 0)
  const maxArmCount     = armCounts.length > 0 ? Math.max(...armCounts.map(a => a.count)) : 1

  const weakest       = stats?.weakest?.[0]   || '—'
  const strongest     = stats?.strongest?.[0] || '—'
  const learningPct   = total > 0 ? ((modeCounts.learning || 0) / total * 100).toFixed(1) : '0.0'
  const overallMastery = stats?.overall_mastery != null ? Math.round(stats.overall_mastery * 100) : null

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Recommendation engine behaviour over {total} recommendations
        </p>
      </div>

      {/* Key Insights row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Learning Zone</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{learningPct}%</p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Target 70%</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Weakest Topic</p>
          <p className="text-xl font-bold text-orange-700 dark:text-orange-300 mt-1 truncate">
            {weakest.replace('-Easy','').replace('-Medium','')}
          </p>
          <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">Needs attention</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Strongest Topic</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1 truncate">
            {strongest.replace('-Easy','').replace('-Medium','')}
          </p>
          <p className="text-xs text-green-500 dark:text-green-400 mt-1">Excellent</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Diversity</p>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
            {diversityScore != null ? `${diversityScore}%` : '—'}
          </p>
          <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">100% = perfectly even</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        {/* Competency Heatmap */}
        <div className="bg-white/20 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm backdrop-blur-md p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Competency Heatmap</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
            Current Bayesian mastery estimate per arm
          </p>
          {mastery.length === 0
            ? <p className="text-sm text-gray-400 dark:text-gray-500">No data yet.</p>
            : <CompetencyHeatmap mastery={mastery} />
          }
        </div>

        {/* Mode Distribution */}
        <div className="bg-white/20 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm backdrop-blur-md p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Mode Distribution
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
            Target: 70% learning · 20% weak · 10% revision
          </p>
          {total === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No data yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(modeConfig).map(([mode, cfg]) => {
                const count = modeCounts[mode] || 0
                const pct   = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
                return (
                  <div key={mode}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{cfg.label}</span>
                      <span className="text-gray-400 dark:text-gray-500">
                        {pct}% <span className="text-gray-300 dark:text-gray-600">· target {cfg.target}</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                      <div className={`h-3 rounded-full ${cfg.color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{count} recommendations</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Learning Trajectory */}
        <div className="bg-white/20 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm backdrop-blur-md p-6 md:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Learning Trajectory</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
            Daily success rate (solved / attempted) over time
          </p>
          <TrajectoryChart data={trajectory} />
        </div>

        {/* Arm Selection Frequency */}
        <div className="bg-white/20 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm backdrop-blur-md p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Arm Selection Frequency
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
            How often each (Topic, Difficulty) arm was recommended
          </p>
          {armCounts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {armCounts.map(({ arm, count }) => (
                <div key={arm}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{arm}</span>
                    <span className="text-gray-400 dark:text-gray-500">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full bg-indigo-400"
                      style={{ width: `${(count / maxArmCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revision Statistics */}
        <div className="bg-white/20 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm backdrop-blur-md p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Revision Statistics
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
            How many times each topic was scheduled for spaced repetition
          </p>
          {Object.keys(revisionByTopic).length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No revision sessions yet.</p>
          ) : (
            <div className="space-y-3">
              {TOPICS.map(topic => {
                const count = revisionByTopic[topic] || 0
                const maxRev = Math.max(...Object.values(revisionByTopic), 1)
                return (
                  <div key={topic}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{topic}</span>
                      <span className="text-gray-400 dark:text-gray-500">{count} revision{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className="h-2 rounded-full bg-purple-400"
                        style={{ width: count > 0 ? `${(count / maxRev) * 100}%` : '0%' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
