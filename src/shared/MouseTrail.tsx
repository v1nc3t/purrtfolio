import { useEffect, useRef } from 'react'

const GLYPHS = '·+x*/\\|-:'
const MAX = 72

type Bit = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  glyph: string
}

export function MouseTrail() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bits: Bit[] = []
    let raf = 0
    let running = false
    let px = -1
    let py = -1

    function fit() {
      const dpr = Math.min(2, devicePixelRatio || 1)
      canvas!.width = innerWidth * dpr
      canvas!.height = innerHeight * dpr
      canvas!.style.width = `${innerWidth}px`
      canvas!.style.height = `${innerHeight}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function spawn(x: number, y: number, dx: number, dy: number) {
      if (bits.length >= MAX) bits.shift()
      bits.push({
        x,
        y,
        vx: dx * 0.08 + (Math.random() - 0.5) * 1.1,
        vy: dy * 0.08 + (Math.random() - 0.5) * 1.1,
        life: 1,
        glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0],
      })
    }

    function frame() {
      ctx!.clearRect(0, 0, innerWidth, innerHeight)
      ctx!.font = '13px ui-monospace, monospace'
      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'middle'
      ctx!.fillStyle = '#fff'
      let i = 0
      while (i < bits.length) {
        const bit = bits[i]
        bit.x += bit.vx
        bit.y += bit.vy
        bit.vx *= 0.98
        bit.vy *= 0.98
        bit.life -= 0.012
        if (bit.life <= 0 || !onCanvas(bit.x, bit.y)) {
          bits.splice(i, 1)
          continue
        }
        ctx!.globalAlpha = bit.life * 0.75
        ctx!.fillText(bit.glyph, bit.x, bit.y)
        i++
      }
      ctx!.globalAlpha = 1
      if (bits.length) raf = requestAnimationFrame(frame)
      else running = false
    }

    function onCanvas(x: number, y: number) {
      const hit = document.elementFromPoint(x, y)
      return !(hit instanceof Element && hit.closest('.window-frame, .taskbar'))
    }

    function onMove(event: PointerEvent) {
      const x = event.clientX
      const y = event.clientY
      if (!onCanvas(x, y)) {
        px = -1
        py = -1
        return
      }
      if (px >= 0) {
        const dx = x - px
        const dy = y - py
        const dist = Math.hypot(dx, dy)
        const steps = Math.min(5, Math.floor(dist / 12))
        for (let s = 1; s <= steps; s++) {
          const t = s / (steps + 1)
          const sx = px + dx * t
          const sy = py + dy * t
          if (onCanvas(sx, sy)) spawn(sx, sy, dx, dy)
        }
      }
      px = x
      py = y
      if (!bits.length) return
      if (running) return
      running = true
      raf = requestAnimationFrame(frame)
    }

    fit()
    window.addEventListener('resize', fit)
    window.addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', fit)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 mix-blend-screen"
    />
  )
}
