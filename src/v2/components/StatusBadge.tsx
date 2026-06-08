import type { NodeStatus } from '../types'
import { toStatusText } from '../utils'

interface StatusBadgeProps {
  status: NodeStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge ${status}`}>{toStatusText(status)}</span>
}
