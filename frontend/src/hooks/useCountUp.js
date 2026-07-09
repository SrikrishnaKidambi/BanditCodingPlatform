import { useState, useEffect } from 'react'

export function useCountUp(end, duration = 900) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (typeof end !== 'number' || isNaN(end)) { setValue(0); return }
    if (end === 0) { setValue(0); return }
    const startTime = performance.now()

    function tick(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setValue(Math.round(end * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [end, duration])

  return value
}
