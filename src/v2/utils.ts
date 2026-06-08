import type { FlowNode, IncomePlanInput, NodeStatus } from './types'
import { calcTierIncentiveByBusinessTable } from './tierIncentive'

export function calcIncome(input: IncomePlanInput, salaryTier: number) {
  const base = input.plannedClasses * 7
  const tierIncentive = calcTierIncentiveByBusinessTable(input.plannedClasses, salaryTier)
  const convertIncentive = input.plannedConversions * 5
  const extraIncentive = input.plannedPbjgLrClasses * 2
  const shortNoticeIncentive = input.plannedShortNoticeClasses * 2
  const total = Math.round((base + tierIncentive + convertIncentive + extraIncentive + shortNoticeIncentive) * 100) / 100
  return { base, tierIncentive, convertIncentive, extraIncentive, shortNoticeIncentive, total }
}

export function toStatusText(status: NodeStatus) {
  if (status === 'completed') return 'Completed'
  if (status === 'in_progress') return 'In progress'
  return 'Not started'
}

export function calcProgress(nodes: FlowNode[]) {
  const total = nodes.length
  const completed = nodes.filter((n) => n.status === 'completed').length
  return Math.round((completed / total) * 100)
}

export function calcGrowthScore(nodes: FlowNode[]) {
  return nodes.filter((n) => n.status === 'completed').reduce((sum, n) => sum + n.points, 0)
}

export function suggestNextSteps(nodes: FlowNode[]) {
  const preSummitDone = isPreSummitPathComplete(nodes)
  const pending = nodes.filter((n) => {
    if (n.status === 'completed' || n.group === 'reward') return false
    if (n.group === 'summit') return preSummitDone
    return true
  })
  return pending
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map((n) => `Suggested next: ${n.title}`)
}

function stairSortKey(n: FlowNode) {
  return n.stairOrder ?? 999
}

/** Branch tasks on Steps 1–5 of the launch map (required before Peak Summit unlock). */
export const PRE_SUMMIT_BRANCH_NODE_IDS = [
  'dino-profile-avatar-matters',
  'dino-tpr',
  'dino-classroom-function',
  'mock-lv46',
  'branch-ws-regular-students',
  'branch-ws-regular-bookings',
] as const

/** Core stair = main-path milestones before Peak Summit (Steps 1–5). */
export function isCoreStairComplete(nodes: FlowNode[]) {
  return nodes.filter((n) => n.type === 'main' && n.group !== 'summit').every((n) => n.status === 'completed')
}

/** Steps 1–5: all core (main) and non-core (branch) tasks complete — unlocks Step 6. */
export function isPreSummitPathComplete(nodes: FlowNode[]) {
  if (!isCoreStairComplete(nodes)) return false
  return PRE_SUMMIT_BRANCH_NODE_IDS.every((id) => nodes.find((n) => n.id === id)?.status === 'completed')
}

export function getNextTrainingNodes(nodes: FlowNode[], limit = 3): FlowNode[] {
  const coreDone = isCoreStairComplete(nodes)
  return nodes
    .filter((n) => {
      if (n.status === 'completed' || n.group === 'reward') return false
      if (n.group === 'summit') return coreDone
      return true
    })
    .sort(
      (a, b) =>
        stairSortKey(a) - stairSortKey(b) ||
        a.priority - b.priority ||
        a.title.localeCompare(b.title),
    )
    .slice(0, limit)
}

export function getBestNextTrainingNode(nodes: FlowNode[]): FlowNode | null {
  return getNextTrainingNodes(nodes, 1)[0] ?? null
}

export function buildNextStepCalloutReason(node: FlowNode, rewardGap: number, inRewardZone: boolean): string {
  if (node.group === 'summit') {
    return 'Destination milestone—claim Peak Summit after the core stair to reinforce bookings and reward-ready positioning.'
  }
  if (inRewardZone) {
    return 'Keeps your reward-zone standing sharp and protects steady booking momentum.'
  }
  if (node.points > 0 && rewardGap > 0) {
    return `Adds ~${node.points} Growth Points—among the fastest moves toward the Top 30% reward zone.`
  }
  if (node.group === 'certificate' || node.group === 'mock') {
    return 'Prioritize this to widen booking eligibility and sharpen trial performance.'
  }
  return 'Moves the stair path forward and unlocks steadier ongoing bookings.'
}

export function getDrawerNextRecommendation(nodes: FlowNode[], currentId: string) {
  if (currentId === 'peak-summit') {
    return 'Keep completing bonus mocks and Dino U modules to defend reward momentum and peak-slot rhythm.'
  }
  const preSummitDone = isPreSummitPathComplete(nodes)
  const pending = nodes
    .filter((n) => {
      if (n.status === 'completed' || n.group === 'reward') return false
      if (n.group === 'summit') return preSummitDone
      return true
    })
    .sort(
      (a, b) =>
        (a.stairOrder ?? 999) - (b.stairOrder ?? 999) ||
        a.priority - b.priority ||
        a.title.localeCompare(b.title),
    )
  const current = nodes.find((n) => n.id === currentId)
  if (current?.stairOrder != null) {
    const nextStair = pending.find((n) => (n.stairOrder ?? 0) > current.stairOrder!)
    if (nextStair) return `Next recommended step: ${nextStair.title}`
  }
  const next = pending.find((n) => n.id !== currentId) ?? pending[0]
  return next ? `Next recommended step: ${next.title}` : 'Keep peak slots open and maintain reliable completions—bookings compound from there.'
}
