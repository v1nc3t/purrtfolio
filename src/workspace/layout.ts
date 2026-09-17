import { PHYSICS } from './windowPhysics'
import { DEFAULT_WINDOW_SIZE } from './world'

export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export type Direction = 'left' | 'right' | 'up' | 'down'

export const ORBIT_SLOTS = 3
export { DEFAULT_WINDOW_SIZE } from './world'

export function spawnGap() {
  return PHYSICS.padding + PHYSICS.magnetRange
}

export function orbitRadius(
  hub: Pick<Rect, 'width' | 'height'>,
  size = DEFAULT_WINDOW_SIZE,
  padding = spawnGap(),
  angle = -Math.PI / 2,
) {
  const clearX = (hub.width + size.width) / 2 + padding
  const clearY = (hub.height + size.height) / 2 + padding
  const absCos = Math.abs(Math.cos(angle))
  const absSin = Math.abs(Math.sin(angle))
  const byX = absCos < 0.04 ? Number.POSITIVE_INFINITY : clearX / absCos
  const byY = absSin < 0.04 ? Number.POSITIVE_INFINITY : clearY / absSin
  return Math.min(byX, byY)
}

export function placeAroundHub(
  hub: Rect,
  satellites: Rect[],
  size = DEFAULT_WINDOW_SIZE,
): { x: number; y: number } {
  const origin = center(hub)
  const occupied = satellites.map((rect) => {
    const point = center(rect)
    return Math.atan2(point.y - origin.y, point.x - origin.x)
  })
  const slotCount = Math.max(ORBIT_SLOTS, satellites.length + 1)
  const slotWidth = (Math.PI * 2) / slotCount

  for (let i = 0; i < slotCount; i++) {
    const angle = -Math.PI / 2 + i * slotWidth
    const taken = occupied.some((item) => angularDistance(item, angle) < slotWidth * 0.7)
    if (taken) continue
    const radius = orbitRadius(hub, size, spawnGap(), angle)
    return {
      x: origin.x + Math.cos(angle) * radius - size.width / 2,
      y: origin.y + Math.sin(angle) * radius - size.height / 2,
    }
  }

  const fallback = -Math.PI / 2 + satellites.length * slotWidth
  const radius = orbitRadius(hub, size, spawnGap(), fallback)
  return {
    x: origin.x + Math.cos(fallback) * radius - size.width / 2,
    y: origin.y + Math.sin(fallback) * radius - size.height / 2,
  }
}

function center(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

function angularDistance(a: number, b: number) {
  const delta = Math.abs(a - b) % (Math.PI * 2)
  return Math.min(delta, Math.PI * 2 - delta)
}

export function pickWindowInDirection<T extends Rect & { id: string }>(
  frames: T[],
  focusedId: string,
  direction: Direction,
): string | null {
  const current = frames.find((frame) => frame.id === focusedId)
  if (!current) return null

  const origin = center(current)
  const threshold = 8

  const candidates = frames.filter((frame) => {
    if (frame.id === focusedId) return false
    const point = center(frame)
    switch (direction) {
      case 'left':
        return point.x < origin.x - threshold
      case 'right':
        return point.x > origin.x + threshold
      case 'up':
        return point.y < origin.y - threshold
      case 'down':
        return point.y > origin.y + threshold
    }
  })

  if (candidates.length === 0) return null

  let best = candidates[0]
  let bestScore = Number.POSITIVE_INFINITY

  for (const frame of candidates) {
    const point = center(frame)
    const dx = point.x - origin.x
    const dy = point.y - origin.y
    const score =
      direction === 'left' || direction === 'right'
        ? Math.abs(dx) + Math.abs(dy) * 2
        : Math.abs(dy) + Math.abs(dx) * 2
    if (score < bestScore) {
      best = frame
      bestScore = score
    }
  }

  return best.id
}
