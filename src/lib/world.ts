export const DEFAULT_WINDOW_SIZE = { width: 640, height: 448 }
export const WORLD_WINDOWS = 5

export type WorldRect = {
  x: number
  y: number
  width: number
  height: number
}

export function worldRect(): WorldRect {
  const width = DEFAULT_WINDOW_SIZE.width * WORLD_WINDOWS
  const height = DEFAULT_WINDOW_SIZE.height * WORLD_WINDOWS
  return {
    x: -width / 2,
    y: -height / 2,
    width,
    height,
  }
}

export function clampFrame<T extends WorldRect>(frame: T): T {
  const world = worldRect()
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
