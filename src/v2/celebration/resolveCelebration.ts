/** Fixed $15 onboarding bonus unlock threshold (total map tasks completed). */
export const ONBOARDING_BONUS_TASK_THRESHOLD = 7

/** Main-path milestones (Step 1, 3, 5). Peak Summit uses a dedicated final celebration instead of Level 2. */
export const MILESTONE_NODE_IDS = new Set<string>(['cert-lv23', 'mock-lv23', 'workshop-regular-bookings'])

const LEVEL_1_TOASTS = ['Completed!', 'Nice work!', 'Task completed'] as const
const LEVEL_2_TOASTS = ['Milestone reached!', 'Great progress!', "You're climbing fast!"] as const

export function countCompletedInDashboard(main: { status: string }[], branch: { status: string }[], summit: { status: string }): number {
  return [...main, summit, ...branch].filter((n) => n.status === 'completed').length
}

export function resolveCelebrationLevel(args: {
  prevCompleted: number
  nextCompleted: number
  nodeId: string
}): 1 | 2 | 3 {
  const { prevCompleted, nextCompleted, nodeId } = args
  if (nextCompleted >= ONBOARDING_BONUS_TASK_THRESHOLD && prevCompleted < ONBOARDING_BONUS_TASK_THRESHOLD) {
    return 3
  }
  if (MILESTONE_NODE_IDS.has(nodeId)) return 2
  return 1
}

export function pickLevel1Toast(): string {
  return LEVEL_1_TOASTS[(Math.random() * LEVEL_1_TOASTS.length) | 0]!
}

export function pickLevel2Toast(): string {
  return LEVEL_2_TOASTS[(Math.random() * LEVEL_2_TOASTS.length) | 0]!
}

export const BONUS_CELEBRATION_PRIMARY = 'Collect Your Bonus'

export const SUMMIT_FINAL_CELEBRATION_LINE = 'You made it! Congratulations!'
