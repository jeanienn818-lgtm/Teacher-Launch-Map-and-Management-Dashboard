import { useEffect, useId, useMemo, useState } from 'react'
import type { FlowNode } from '../types'

/** Fixed 12 slots: 2 certificate, 3 Dino U, 2 mock, 4 workshop, 1 summit — matches map task set. */
const HONOR_WALL_SLOTS: readonly { nodeId: string; category: string }[] = [
  { nodeId: 'cert-lv23', category: 'Core Certificate' },
  { nodeId: 'cert-lv46', category: 'Core Certificate' },
  { nodeId: 'dino-profile-avatar-matters', category: 'Dino U' },
  { nodeId: 'dino-tpr', category: 'Dino U' },
  { nodeId: 'dino-classroom-function', category: 'Dino U' },
  { nodeId: 'mock-lv23', category: 'Mock' },
  { nodeId: 'mock-lv46', category: 'Mock' },
  { nodeId: 'workshop-core', category: 'Workshop' },
  { nodeId: 'workshop-regular-bookings', category: 'Workshop' },
  { nodeId: 'branch-ws-regular-students', category: 'Workshop' },
  { nodeId: 'branch-ws-regular-bookings', category: 'Workshop' },
  { nodeId: 'peak-summit', category: 'Peak Summit' },
] as const

/** Five-point star, tuned for 24×24 viewBox. */
const STAR_PATH =
  'M12 2.35l2.72 6.12 6.66.58-5.04 4.37 1.58 6.45L12 16.82l-5.94 2.05 1.58-6.45-5.04-4.37 6.66-.58L12 2.35z'

const HONOR_WALL_CELEBRATE_MS = 5000

export interface HonorWallTaskProgress {
  completedTasks: number
  totalTasks: number
  mainProgress: number
  totalProgress: number
}

interface HonorWallPanelProps {
  nodes: FlowNode[]
  /** Task id just completed — its star enlarges, shakes, and lights up for 5s. */
  celebrateNodeId?: string | null
  taskProgress?: HonorWallTaskProgress | null
}

export function HonorWallPanel({ nodes, celebrateNodeId = null, taskProgress = null }: HonorWallPanelProps) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const gradId = `honor-star-gold-${useId().replace(/:/g, '')}`
  const [activeCelebrateNodeId, setActiveCelebrateNodeId] = useState<string | null>(null)

  useEffect(() => {
    if (!celebrateNodeId) return
    setActiveCelebrateNodeId(celebrateNodeId)
    const timerId = window.setTimeout(() => setActiveCelebrateNodeId(null), HONOR_WALL_CELEBRATE_MS)
    return () => window.clearTimeout(timerId)
  }, [celebrateNodeId])

  return (
    <section className="card honor-wall-card honor-wall-card--v26" aria-label="Honor Wall">
      <svg width="0" height="0" className="honor-wall-defs-v26" aria-hidden focusable="false">
        <defs>
          <linearGradient id={gradId} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="42%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
      </svg>
      <h3 className="honor-wall-title-v26">Honor Wall</h3>
      <p className="honor-wall-hint-v26">Complete tasks to light up your stars.</p>
      {taskProgress ? (
        <p className="honor-wall-progress-v26" role="status" aria-label="Training progress at a glance">
          <span className="honor-wall-progress-v26__muted">Tasks</span>{' '}
          <strong className="honor-wall-progress-v26__num">
            {taskProgress.completedTasks}/{taskProgress.totalTasks}
          </strong>
          <span className="honor-wall-progress-v26__sep" aria-hidden>
            ·
          </span>
          <span className="honor-wall-progress-v26__muted">Core path</span>{' '}
          <strong className="honor-wall-progress-v26__num">{taskProgress.mainProgress}%</strong>
          <span className="honor-wall-progress-v26__sep" aria-hidden>
            ·
          </span>
          <span className="honor-wall-progress-v26__muted">Total</span>{' '}
          <strong className="honor-wall-progress-v26__num">{taskProgress.totalProgress}%</strong>
        </p>
      ) : null}
      <div className="honor-wall-grid-v26" role="list">
        {HONOR_WALL_SLOTS.map((slot) => {
          const node = byId.get(slot.nodeId)
          const done = node?.status === 'completed'
          const celebrating = activeCelebrateNodeId === slot.nodeId
          const label = node?.title ?? slot.nodeId
          const tip = `${slot.category} · ${label}`
          return (
            <span
              key={slot.nodeId}
              role="listitem"
              className={`honor-wall-slot-v26${done ? ' honor-wall-slot-v26--lit' : ' honor-wall-slot-v26--dim'}${celebrating ? ' honor-wall-slot-v26--celebrate' : ''}`}
              title={tip}
            >
              <svg className="honor-wall-star-v26" viewBox="0 0 24 24" aria-hidden>
                <path
                  d={STAR_PATH}
                  className="honor-wall-star-path-v26"
                  fill={done ? `url(#${gradId})` : 'none'}
                />
              </svg>
            </span>
          )
        })}
      </div>
    </section>
  )
}
