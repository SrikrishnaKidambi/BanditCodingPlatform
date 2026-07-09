import { useRef, useCallback } from 'react'

export function useTilt(maxTilt = 6) {
  const ref = useRef(null)

  const onMouseMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(800px) rotateX(${-y * maxTilt * 2}deg) rotateY(${x * maxTilt * 2}deg) scale3d(1.03,1.03,1.03)`
    el.style.boxShadow = `${-x * 20}px ${-y * 20}px 40px rgba(99,102,241,0.18)`
  }, [maxTilt])

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
    el.style.boxShadow = ''
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}
