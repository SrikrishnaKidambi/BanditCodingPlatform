import { useState, useEffect } from 'react'

function barColor(mastery) {
  if (mastery >= 0.7) return 'bg-green-500'
  if (mastery >= 0.4) return 'bg-yellow-400'
  return 'bg-red-400'
}

const strengthConfig = {
  strong:     { text: 'Strong',     style: 'text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
  developing: { text: 'Developing', style: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400' },
  weak:       { text: 'Weak',       style: 'text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
}

function getStrength(mastery) {
  if (mastery >= 0.7) return strengthConfig.strong
  if (mastery >= 0.4) return strengthConfig.developing
  return strengthConfig.weak
}

export default function MasteryBar({ difficulty, mastery, index = 0 }) {
  const pct = Math.round(mastery * 100)
  const strength = getStrength(mastery)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80 + index * 120)
    return () => clearTimeout(t)
  }, [pct, index])

  return (
    <div className="flex items-center gap-4">
      <span className="w-16 text-sm text-gray-500 dark:text-gray-400 text-right shrink-0">{difficulty}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${barColor(mastery)}`}
          style={{ width: `${width}%`, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </div>
      <span className="w-10 text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">{pct}%</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${strength.style}`}>
        {strength.text}
      </span>
    </div>
  )
}
