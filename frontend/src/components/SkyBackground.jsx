import { useEffect, useRef } from 'react'

// --- colour helpers ---
function lerp(a, b, t) { return a + (b - a) * t }
function lerpRGB(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ]
}
function rgb(c, a) {
  return a !== undefined
    ? `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`
    : `rgb(${c[0]},${c[1]},${c[2]})`
}

// --- sky gradient keyframes [hour, topRGB, bottomRGB] ---
const SKY = [
  { h: 0,  top: [0,2,5],       bot: [8,12,25]     },  // midnight
  { h: 4,  top: [0,2,5],       bot: [8,12,25]     },  // late night
  { h: 5,  top: [26,5,51],     bot: [120,40,15]   },  // pre-dawn
  { h: 6,  top: [49,46,129],   bot: [234,88,12]   },  // sunrise
  { h: 7,  top: [3,100,148],   bot: [252,196,69]  },  // early morning
  { h: 9,  top: [2,119,189],   bot: [186,230,253] },  // morning
  { h: 12, top: [2,132,199],   bot: [224,242,254] },  // noon
  { h: 15, top: [3,105,161],   bot: [186,230,253] },  // afternoon
  { h: 17, top: [12,100,130],  bot: [251,176,90]  },  // golden hour
  { h: 18, top: [90,30,160],   bot: [200,60,10]   },  // sunset
  { h: 19, top: [55,15,90],    bot: [100,35,15]   },  // dusk
  { h: 20, top: [10,8,30],     bot: [55,15,90]    },  // twilight
  { h: 21, top: [0,2,5],       bot: [10,15,35]    },  // night
  { h: 24, top: [0,2,5],       bot: [8,12,25]     },  // midnight wrap
]

function getSkyColors(hour) {
  for (let i = 0; i < SKY.length - 1; i++) {
    if (hour >= SKY[i].h && hour < SKY[i + 1].h) {
      const t = (hour - SKY[i].h) / (SKY[i + 1].h - SKY[i].h)
      return {
        top: lerpRGB(SKY[i].top, SKY[i + 1].top, t),
        bot: lerpRGB(SKY[i].bot, SKY[i + 1].bot, t),
      }
    }
  }
  return { top: SKY[0].top, bot: SKY[0].bot }
}

function getHour() {
  const debug = new URLSearchParams(window.location.search).get('hour')
  if (debug !== null) return parseFloat(debug)
  const n = new Date()
  return n.getHours() + n.getMinutes() / 60 + n.getSeconds() / 3600
}

// star alpha: 0 during day, 1 at night, fades at dawn/dusk
function starAlpha(hour) {
  if (hour >= 21 || hour < 5.5)           return 1
  if (hour >= 19.5 && hour < 21)          return (hour - 19.5) / 1.5
  if (hour >= 5.5  && hour < 7.0)         return 1 - (hour - 5.5) / 1.5
  return 0
}

// fixed star field (created once at module load — consistent across re-mounts)
const STARS = Array.from({ length: 200 }, () => ({
  x:     Math.random(),
  y:     Math.random() * 0.85,
  r:     0.3 + Math.random() * 1.3,
  base:  0.4 + Math.random() * 0.6,
  speed: 0.0003 + Math.random() * 0.0009,
  phase: Math.random() * Math.PI * 2,
}))

export default function SkyBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let shoot    = null
    let lastShoot = 0

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function spawnShoot() {
      const angle = (25 + Math.random() * 30) * Math.PI / 180
      shoot = {
        x:       (0.05 + Math.random() * 0.55) * canvas.width,
        y:       (0.02 + Math.random() * 0.33) * canvas.height,
        dx:      Math.cos(angle) * 9,
        dy:      Math.sin(angle) * 9,
        len:     90 + Math.random() * 90,
        life:    0,
        maxLife: 38,
      }
    }

    function draw(ts) {
      const W    = canvas.width
      const H    = canvas.height
      const hour = getHour()
      const { top, bot } = getSkyColors(hour)

      // sky gradient
      const skyG = ctx.createLinearGradient(0, 0, 0, H)
      skyG.addColorStop(0, rgb(top))
      skyG.addColorStop(1, rgb(bot))
      ctx.fillStyle = skyG
      ctx.fillRect(0, 0, W, H)

      // stars + shooting star
      const sa = starAlpha(hour)
      if (sa > 0) {
        STARS.forEach(s => {
          const a = sa * s.base * (0.5 + 0.5 * Math.sin(ts * s.speed + s.phase))
          ctx.beginPath()
          ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`
          ctx.fill()
        })

        if (sa > 0.5 && ts - lastShoot > 4500 + Math.random() * 2500) {
          lastShoot = ts
          spawnShoot()
        }
        if (shoot) {
          const t  = shoot.life / shoot.maxLife
          const a  = sa * (t < 0.4 ? t / 0.4 : (1 - t) / 0.6) * 0.9
          const tx = shoot.x - shoot.dx * (shoot.len / 9)
          const ty = shoot.y - shoot.dy * (shoot.len / 9)
          const sg = ctx.createLinearGradient(tx, ty, shoot.x, shoot.y)
          sg.addColorStop(0, 'rgba(255,255,255,0)')
          sg.addColorStop(1, `rgba(210,230,255,${a.toFixed(3)})`)
          ctx.beginPath()
          ctx.moveTo(tx, ty)
          ctx.lineTo(shoot.x, shoot.y)
          ctx.strokeStyle = sg
          ctx.lineWidth   = 1.5
          ctx.stroke()
          shoot.x    += shoot.dx
          shoot.y    += shoot.dy
          shoot.life += 1
          if (shoot.life >= shoot.maxLife) shoot = null
        }
      }

      // ---- Sun (5.5 → 18.5, 13-hour arc) ----
      if (hour >= 5.5 && hour <= 18.5) {
        const tSun  = (hour - 5.5) / 13
        const angle = Math.PI * (1 - tSun)             // π → 0 (left to right)
        const cx    = W / 2
        const hy    = H * 0.92
        const R     = Math.min(W * 0.52, H * 0.64)
        const sx    = cx + R * Math.cos(angle)
        const sy    = hy - R * Math.sin(angle)
        const alt   = Math.sin(angle)                   // 0 at horizon, 1 at zenith
        const low   = alt < 0.18
        const coreC = low ? [255, 130, 40] : [255, 248, 185]

        // atmosphere glow
        const glowR = 80 + alt * 40
        const atmo  = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR)
        atmo.addColorStop(0,   rgb(coreC, low ? 0.55 : 0.40))
        atmo.addColorStop(0.4, rgb(coreC, low ? 0.20 : 0.12))
        atmo.addColorStop(1,   rgb(coreC, 0))
        ctx.beginPath()
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2)
        ctx.fillStyle = atmo
        ctx.fill()

        // sun disk
        const diskR = 18 + alt * 7
        const disk  = ctx.createRadialGradient(sx, sy, 0, sx, sy, diskR)
        disk.addColorStop(0,   rgb([255, 255, 240]))
        disk.addColorStop(0.6, rgb(coreC))
        disk.addColorStop(1,   rgb(coreC, 0))
        ctx.beginPath()
        ctx.arc(sx, sy, diskR, 0, Math.PI * 2)
        ctx.fillStyle = disk
        ctx.fill()
      }

      // ---- Moon (18.5 → 30.5 normalised, i.e. 18:30 → 06:30 next day) ----
      const mh = hour < 6.5 ? hour + 24 : hour
      if (mh >= 18.5 && mh <= 30.5) {
        const tMoon = (mh - 18.5) / 12
        const angle = Math.PI * (1 - tMoon)
        const cx    = W / 2
        const hy    = H * 0.92
        const R     = Math.min(W * 0.52, H * 0.64)
        const mx    = cx + R * Math.cos(angle)
        const my    = hy - R * Math.sin(angle)

        // fade in/out near horizon
        let ma = 1
        if (mh < 20)   ma = (mh - 18.5) / 1.5
        if (mh > 29.0) ma = (30.5 - mh) / 1.5
        ma = Math.max(0, Math.min(1, ma))

        const mr = 15

        // soft glow
        const mglow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 3.5)
        mglow.addColorStop(0, rgb([200, 215, 255], 0.25 * ma))
        mglow.addColorStop(1, 'rgba(200,215,255,0)')
        ctx.beginPath()
        ctx.arc(mx, my, mr * 3.5, 0, Math.PI * 2)
        ctx.fillStyle = mglow
        ctx.fill()

        // moon body
        ctx.beginPath()
        ctx.arc(mx, my, mr, 0, Math.PI * 2)
        ctx.fillStyle = rgb([230, 235, 255], ma)
        ctx.fill()

        // crescent: clip to moon circle, paint sky-coloured shadow disk
        ctx.save()
        ctx.beginPath()
        ctx.arc(mx, my, mr, 0, Math.PI * 2)
        ctx.clip()
        const fy      = Math.max(0, Math.min(1, my / H))
        const shadowC = lerpRGB(top, bot, fy)
        ctx.beginPath()
        ctx.arc(mx + mr * 0.42, my - mr * 0.05, mr * 0.88, 0, Math.PI * 2)
        ctx.fillStyle = rgb(shadowC, ma)
        ctx.fill()
        ctx.restore()
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        0,
      }}
    />
  )
}
