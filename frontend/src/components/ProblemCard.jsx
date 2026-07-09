const difficultyStyle = {
  Easy:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Hard:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const modeConfig = {
  learning: { label: 'Learning Zone', style: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  weak:     { label: 'Weak Topic',    style: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  revision: { label: 'Revision',      style: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

export default function ProblemCard({ problem, showReason = false }) {
  const mode = modeConfig[problem.mode] ?? modeConfig.learning

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${mode.style}`}>
          {mode.label}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${difficultyStyle[problem.difficulty]}`}>
          {problem.difficulty}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{problem.topic}</span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{problem.title}</h3>

      {showReason && problem.reason && (
        <p className="text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-2 mt-2">
          {problem.reason}
        </p>
      )}

      <div className="flex items-center gap-5 mt-3 text-sm text-gray-500 dark:text-gray-400">
        <span>🕐 ~{problem.estimated_solving_time} min</span>
        <span>📌 {problem.platform}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{problem.problem_id}</span>
      </div>

      <div className="flex gap-2 flex-wrap mt-3">
        {problem.tags.map(tag => (
          <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
