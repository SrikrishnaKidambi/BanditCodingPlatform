import { useEffect, useRef } from 'react'

const STAR_COUNT    = 220
const SHOOT_INTERVAL = 4000  // ms between shooting stars

function randomBetween(a, b) { return a + Math.random() * (b - a) }

export default function StarField({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let lastShoot = 0

    // --- Stars ---
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x:     Math.random(),
      y:     Math.random(),
      r:     randomBetween(0.3, 1.6),
      base:  randomBetween(0.3, 1.0),   // base opacity
      speed: randomBetween(0.0003, 0.0012),
      phase: Math.random() * Math.PI * 2,
    }))

    // --- Shooting star state ---
    let shoot = null

    function spawnShoot(W, H) {
      const startX = randomBetween(0.1, 0.9) * W
      const startY = randomBetween(0.0, 0.3) * H
      const angle  = randomBetween(20, 50) * Math.PI / 180
      shoot = {
        x: startX, y: startY,
        dx: Math.cos(angle) * 8,
        dy: Math.sin(angle) * 8,
        len: randomBetween(80, 160),
        life: 0, maxLife: 40,
      }
    }

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function draw(ts) {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Stars
      stars.forEach(s => {
        const opacity = s.base * (0.6 + 0.4 * Math.sin(ts * s.speed + s.phase))
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${opacity})`
        ctx.fill()
      })

      // Shooting star
      if (ts - lastShoot > SHOOT_INTERVAL) {
        lastShoot = ts
        spawnShoot(W, H)
      }
      if (shoot) {
        const t = shoot.life / shoot.maxLife
        const alpha = t < 0.5 ? t * 2 : (1 - t) * 2
        const tailX = shoot.x - shoot.dx * (shoot.len / 8)
        const tailY = shoot.y - shoot.dy * (shoot.len / 8)
        const grad  = ctx.createLinearGradient(tailX, tailY, shoot.x, shoot.y)
        grad.addColorStop(0, 'rgba(255,255,255,0)')
        grad.addColorStop(1, `rgba(200,220,255,${alpha * 0.9})`)
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(shoot.x, shoot.y)
        ctx.strokeStyle = grad
        ctx.lineWidth   = 1.5
        ctx.stroke()
        shoot.x += shoot.dx
        shoot.y += shoot.dy
        shoot.life++
        if (shoot.life >= shoot.maxLife) shoot = null
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  )
}
