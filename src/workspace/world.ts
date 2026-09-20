export const WINDOW_ASPECT = 4 / 3
export const WINDOW_INSET = 0.08
export const WORLD_WINDOWS = 5

export type WorldRect = {
  x: number
  y: number
  width: number
  height: number
}

export function windowSizeFor(viewport: { width: number; height: number }) {
  const pad = Math.min(viewport.width, viewport.height) * WINDOW_INSET
  const maxW = Math.max(1, viewport.width - pad * 2)
  const maxH = Math.max(1, viewport.height - pad * 2)
  let width = maxW
  let height = width / WINDOW_ASPECT
  if (height > maxH) {
    height = maxH
    width = height * WINDOW_ASPECT
  }
  return { width, height }
}

export function worldRect(size: { width: number; height: number }): WorldRect {
  const width = size.width * WORLD_WINDOWS
  const height = size.height * WORLD_WINDOWS
  return {
    x: -width / 2,
    y: -height / 2,
    width,
    height,
  }
}

export function clampFrame<T extends WorldRect>(frame: T): T {
  const world = worldRect(frame)
  const minX = world.x
  const maxX = Math.max(world.x, world.x + world.width - frame.width)
  const minY = world.y
  const maxY = Math.max(world.y, world.y + world.height - frame.height)
  return {
    ...frame,
    x: Math.min(maxX, Math.max(minX, frame.x)),
    y: Math.min(maxY, Math.max(minY, frame.y)),
  }
}

export function clampCenter(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const frame = clampFrame({
    x: x - width / 2,
    y: y - height / 2,
    width,
    height,
  })
  return {
    x: frame.x + width / 2,
    y: frame.y + height / 2,
  }
}
