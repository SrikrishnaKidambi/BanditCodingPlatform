import { useTilt } from '../hooks/useTilt'
import { useCountUp } from '../hooks/useCountUp'

const colorMap = {
  indigo: { text: 'text-indigo-600 dark:text-indigo-400', glow: 'hover:shadow-indigo-100 dark:hover:shadow-indigo-900/40' },
  green:  { text: 'text-green-600 dark:text-green-400',   glow: 'hover:shadow-green-100 dark:hover:shadow-green-900/40'   },
  orange: { text: 'text-orange-500 dark:text-orange-400', glow: 'hover:shadow-orange-100 dark:hover:shadow-orange-900/40' },
  purple: { text: 'text-purple-600 dark:text-purple-400', glow: 'hover:shadow-purple-100 dark:hover:shadow-purple-900/40' },
}

function parseValue(value) {
  if (typeof value === 'number') return { num: value, suffix: '' }
  const match = String(value).match(/^(\d+)(.*)$/)
  if (match) return { num: parseInt(match[1], 10), suffix: match[2] }
  return { num: null, suffix: String(value) }
}

export default function StatCard({ label, value, sub, color = 'indigo' }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt(5)
  const { num, suffix } = parseValue(value)
  const counted = useCountUp(num ?? 0)
  const cfg = colorMap[color]

  const display = num !== null ? `${counted}${suffix}` : suffix

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
      className={`bg-white/20 dark:bg-white/5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md p-5 cursor-default will-change-transform ${cfg.glow}`}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${cfg.text}`}>{display}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
