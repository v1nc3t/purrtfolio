import {
  forceSimulation,
  type Force,
  type Simulation,
  type SimulationNodeDatum,
} from 'd3-force'
import { clampCenter } from './world'
import type { WindowFrame, WindowId } from '../store/useCanvasStore'

export const PHYSICS = {
  padding: 48,
  magnetRange: 80,
  magnetSoftness: 0.2,
  velocityDecay: 0.52,
  dragAlphaTarget: 0.28,
  overviewAlphaTarget: 0.14,
  driftPeriod: 220,
  lockOnDrop: false,
} as const

export type WindowNode = SimulationNodeDatum & {
  id: WindowId
  width: number
  height: number
}

export type SimPositions = Partial<Record<WindowId, { x: number; y: number }>>

function forceSeparate(
  padding: number,
  stiffness: number,
  active: () => boolean,
): Force<WindowNode, undefined> {
  let nodes: WindowNode[] = []

  function force() {
    if (!active()) return

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      const ax = a.x ?? 0
      const ay = a.y ?? 0

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        const bx = b.x ?? 0
        const by = b.y ?? 0
        const overlapX = (a.width + b.width) / 2 + padding - Math.abs(bx - ax)
        const overlapY = (a.height + b.height) / 2 + padding - Math.abs(by - ay)
        if (overlapX <= 0 || overlapY <= 0) continue

        const pinA = a.fx != null
        const pinB = b.fx != null
        if (pinA && pinB) continue

        if (overlapX < overlapY) {
          const dir = bx - ax < 0 ? -1 : 1
          const split = (pinA || pinB ? overlapX : overlapX / 2) * stiffness
          if (!pinA) {
            a.x = ax - dir * split
            a.vx = (a.vx ?? 0) * 0.2
          }
          if (!pinB) {
            b.x = bx + dir * split
            b.vx = (b.vx ?? 0) * 0.2
          }
        } else {
          const dir = by - ay < 0 ? -1 : 1
          const split = (pinA || pinB ? overlapY : overlapY / 2) * stiffness
          if (!pinA) {
            a.y = ay - dir * split
            a.vy = (a.vy ?? 0) * 0.2
          }
          if (!pinB) {
            b.y = by + dir * split
            b.vy = (b.vy ?? 0) * 0.2
          }
        }
      }
    }
  }

  force.initialize = (next: WindowNode[]) => {
    nodes = next
  }

  return force
}

function toNode(frame: WindowFrame, previous?: WindowNode): WindowNode {
  if (previous) {
    previous.width = frame.width
    previous.height = frame.height
    return previous
  }

  return {
    id: frame.id,
    width: frame.width,
    height: frame.height,
    x: frame.x + frame.width / 2,
    y: frame.y + frame.height / 2,
    vx: 0,
    vy: 0,
  }
}

export class WindowPhysics {
  private sim: Simulation<WindowNode, undefined> | null = null
  private nodes: WindowNode[] = []
  private onTick: ((positions: SimPositions) => void) | null = null
  private overview = false
  private focusedId: WindowId | null = null
  private dragId: WindowId | null = null
  private lastDrift = 0

  start(onTick: (positions: SimPositions) => void) {
    this.onTick = onTick
    if (this.sim) return

    this.sim = forceSimulation<WindowNode>([])
      .velocityDecay(PHYSICS.velocityDecay)
      .force(
        'magnet',
        forceSeparate(
          PHYSICS.padding + PHYSICS.magnetRange,
          PHYSICS.magnetSoftness,
          () => this.dragId != null,
        ),
      )
      .force(
        'collide',
        forceSeparate(PHYSICS.padding, 1, () => this.dragId != null),
      )
      .on('tick', () => {
        this.applyOverviewDrift()
        this.emit()
      })
  }

  sync(windows: Partial<Record<WindowId, WindowFrame>>) {
    const frames = Object.values(windows).filter(
      (frame): frame is WindowFrame => Boolean(frame),
    )
    const previous = new Map(this.nodes.map((node) => [node.id, node]))
    this.nodes = frames.map((frame) => {
      const node = toNode(frame, previous.get(frame.id))
      if (!previous.has(frame.id)) {
        node.vx = 0
        node.vy = 0
      }
      return node
    })
    this.sim?.nodes(this.nodes)
    this.applyFocusPin()
    if (this.overview) {
      this.sim?.alphaTarget(PHYSICS.overviewAlphaTarget).restart()
      return
    }
    this.sleep()
  }

  setAmbient(overview: boolean, focusedId: WindowId | null) {
    const changed = this.overview !== overview || this.focusedId !== focusedId
    this.overview = overview
    this.focusedId = focusedId
    if (!this.sim) return

    this.applyFocusPin()
    if (overview) {
      this.lastDrift = performance.now()
      this.sim.alphaTarget(PHYSICS.overviewAlphaTarget).restart()
      return
    }

    if (changed) {
      this.freeze()
      this.sleep()
    }
  }

  pin(id: WindowId, centerX: number, centerY: number) {
    const node = this.nodes.find((item) => item.id === id)
    if (!node) return
    this.dragId = id
    const clamped = clampCenter(centerX, centerY, node.width, node.height)
    node.fx = clamped.x
    node.fy = clamped.y
    node.x = clamped.x
    node.y = clamped.y
    node.vx = 0
    node.vy = 0
    this.sim?.alphaTarget(PHYSICS.dragAlphaTarget).restart()
    this.emit()
  }

  unpin(id: WindowId) {
    const node = this.nodes.find((item) => item.id === id)
    if (!node) return
    this.dragId = null
    node.vx = 0
    node.vy = 0
    if (this.overview && id === 'terminal') {
      node.fx = node.x ?? 0
      node.fy = node.y ?? 0
    } else if (!PHYSICS.lockOnDrop) {
      node.fx = null
      node.fy = null
    }
    this.freeze()
    if (this.overview) {
      this.sim?.alphaTarget(PHYSICS.overviewAlphaTarget).restart()
      return
    }
    this.sleep()
  }

  stop() {
    this.sim?.stop()
    this.sim = null
    this.nodes = []
    this.onTick = null
    this.dragId = null
    this.lastDrift = 0
  }

  private sleep() {
    this.sim?.alphaTarget(0)
    this.sim?.alpha(0)
  }

  private freeze() {
    for (const node of this.nodes) {
      if (this.dragId === node.id) continue
      node.vx = 0
      node.vy = 0
    }
  }

  private applyFocusPin() {
    for (const node of this.nodes) {
      if (this.dragId === node.id) continue
      if (this.overview && node.id === 'terminal') {
        node.fx = node.x ?? 0
        node.fy = node.y ?? 0
        continue
      }
      node.fx = null
      node.fy = null
    }
  }

  private applyOverviewDrift() {
    if (!this.overview) {
      this.lastDrift = 0
      return
    }

    const hub = this.nodes.find((node) => node.id === 'terminal')
    if (!hub || hub.x == null || hub.y == null) return

    const now = performance.now()
    const dt = this.lastDrift === 0 ? 0 : Math.min(0.05, (now - this.lastDrift) / 1000)
    this.lastDrift = now
    if (dt <= 0) return

    const angle = ((Math.PI * 2) / PHYSICS.driftPeriod) * dt
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    for (const node of this.nodes) {
      if (node.id === 'terminal' || node.fx != null) continue
      const dx = (node.x ?? 0) - hub.x
      const dy = (node.y ?? 0) - hub.y
      node.x = hub.x + dx * cos - dy * sin
      node.y = hub.y + dx * sin + dy * cos
      node.vx = 0
      node.vy = 0
    }

    this.separateOverlaps()
    this.clampNodes()
  }

  private separateOverlaps() {
    for (let pass = 0; pass < 6; pass++) {
      for (let i = 0; i < this.nodes.length; i++) {
        const a = this.nodes[i]
        const ax = a.x ?? 0
        const ay = a.y ?? 0
        for (let j = i + 1; j < this.nodes.length; j++) {
          const b = this.nodes[j]
          const bx = b.x ?? 0
          const by = b.y ?? 0
          const overlapX =
            (a.width + b.width) / 2 + PHYSICS.padding - Math.abs(bx - ax)
          const overlapY =
            (a.height + b.height) / 2 + PHYSICS.padding - Math.abs(by - ay)
          if (overlapX <= 0.5 || overlapY <= 0.5) continue

          const pinA = a.fx != null || a.id === 'terminal'
          const pinB = b.fx != null || b.id === 'terminal'
          if (pinA && pinB) continue

          if (overlapX < overlapY) {
            const dir = bx - ax < 0 ? -1 : 1
            const split = pinA || pinB ? overlapX : overlapX / 2
            if (!pinA) a.x = ax - dir * split
            if (!pinB) b.x = bx + dir * split
          } else {
            const dir = by - ay < 0 ? -1 : 1
            const split = pinA || pinB ? overlapY : overlapY / 2
            if (!pinA) a.y = ay - dir * split
            if (!pinB) b.y = by + dir * split
          }
        }
      }
    }
  }

  private clampNodes() {
    for (const node of this.nodes) {
      if (node.x == null || node.y == null) continue
      const next = clampCenter(node.x, node.y, node.width, node.height)
      node.x = next.x
      node.y = next.y
      if (node.fx != null) node.fx = next.x
      if (node.fy != null) node.fy = next.y
    }
  }

  private emit() {
    this.clampNodes()
    if (!this.onTick) return
    const positions: SimPositions = {}
    for (const node of this.nodes) {
      if (node.x == null || node.y == null) continue
      positions[node.id] = {
        x: node.x - node.width / 2,
        y: node.y - node.height / 2,
      }
    }
    this.onTick(positions)
  }
}

let engine: WindowPhysics | null = null

export function getWindowPhysics() {
  engine ??= new WindowPhysics()
  return engine
}

export function stopWindowPhysics() {
  engine?.stop()
  engine = null
}
