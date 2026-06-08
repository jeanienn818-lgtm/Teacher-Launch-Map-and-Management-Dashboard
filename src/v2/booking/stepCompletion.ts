import {
  DEFAULT_TASK_BOOKING_POLICY,
  type MockBookingRecord,
  type TaskBookingPolicy,
  type WorkshopBookingRecord,
} from './bookingPolicy'
import { MOCK_BOOKING_NODE_IDS } from '../mock/mockNodes'
import { WORKSHOP_BOOKING_NODE_IDS } from '../workshop/workshopNodes'
import type { FlowNode } from '../types'

export type StepCardVisualState = 'all-done' | 'all-todo' | 'partial'

/** Whether a map node counts as finished for its step card (status + booking lifecycle). */
export function isNodeCompleteForStepCard(
  node: FlowNode,
  workshopBookings: readonly WorkshopBookingRecord[],
  mockBookings: readonly MockBookingRecord[],
  taskPolicies: Record<string, TaskBookingPolicy>,
): boolean {
  if (node.status !== 'completed') return false

  if (WORKSHOP_BOOKING_NODE_IDS.has(node.id)) {
    const policy = taskPolicies[node.id] ?? DEFAULT_TASK_BOOKING_POLICY
    if (policy.pendingRebook) return false
    if (workshopBookings.some((b) => b.nodeId === node.id)) return false
  }

  if (MOCK_BOOKING_NODE_IDS.has(node.id)) {
    const policy = taskPolicies[node.id] ?? DEFAULT_TASK_BOOKING_POLICY
    if (policy.pendingRebook) return false
    if (mockBookings.some((b) => b.nodeId === node.id)) return false
  }

  return true
}

export function nodeHasOutstandingBooking(
  node: FlowNode,
  workshopBookings: readonly WorkshopBookingRecord[],
  mockBookings: readonly MockBookingRecord[],
  taskPolicies: Record<string, TaskBookingPolicy>,
): boolean {
  const policy = taskPolicies[node.id] ?? DEFAULT_TASK_BOOKING_POLICY
  if (policy.pendingRebook) return true
  if (WORKSHOP_BOOKING_NODE_IDS.has(node.id)) {
    return workshopBookings.some((b) => b.nodeId === node.id)
  }
  if (MOCK_BOOKING_NODE_IDS.has(node.id)) {
    return mockBookings.some((b) => b.nodeId === node.id)
  }
  return false
}

export function isNodeInProgressOnMap(
  node: FlowNode,
  workshopBookings: readonly WorkshopBookingRecord[],
  mockBookings: readonly MockBookingRecord[],
  taskPolicies: Record<string, TaskBookingPolicy>,
): boolean {
  if (isNodeCompleteForStepCard(node, workshopBookings, mockBookings, taskPolicies)) return false
  return node.status === 'in_progress' || nodeHasOutstandingBooking(node, workshopBookings, mockBookings, taskPolicies)
}

export function classifyStepVisualState(
  nodes: FlowNode[],
  workshopBookings: readonly WorkshopBookingRecord[],
  mockBookings: readonly MockBookingRecord[],
  taskPolicies: Record<string, TaskBookingPolicy>,
): StepCardVisualState {
  if (nodes.length === 0) return 'all-todo'
  const doneCount = nodes.filter((n) =>
    isNodeCompleteForStepCard(n, workshopBookings, mockBookings, taskPolicies),
  ).length
  if (doneCount === nodes.length) return 'all-done'
  if (doneCount === 0) return 'all-todo'
  return 'partial'
}

/** Map task node IDs grouped by training step (Step 4 / Step 5 on the launch map). */
export const WORKSHOP_STEP_NODE_IDS: Record<4 | 5, readonly string[]> = {
  4: ['workshop-core', 'branch-ws-regular-students'],
  5: ['workshop-regular-bookings', 'branch-ws-regular-bookings'],
}

/** Registered sessions on this step's map tasks (matches workshop calendar "Registered" rows). */
export function countWorkshopSessionsBookedForStep(
  step: 4 | 5,
  workshopBookings: readonly WorkshopBookingRecord[],
  _taskPolicies: Record<string, TaskBookingPolicy>,
): number {
  const nodeIds = new Set(WORKSHOP_STEP_NODE_IDS[step])
  return workshopBookings.filter((b) => nodeIds.has(b.nodeId)).length
}

/** Tasks on this step that still have a booking or pending rebook (used for completion checks). */
export function countWorkshopTasksWithOutstandingBooking(
  step: 4 | 5,
  workshopBookings: readonly WorkshopBookingRecord[],
  taskPolicies: Record<string, TaskBookingPolicy>,
): number {
  const nodeIds = WORKSHOP_STEP_NODE_IDS[step]
  return nodeIds.filter((nodeId) => {
    const policy = taskPolicies[nodeId] ?? DEFAULT_TASK_BOOKING_POLICY
    if (policy.pendingRebook) return true
    return workshopBookings.some((b) => b.nodeId === nodeId)
  }).length
}

/** @deprecated alias — use countWorkshopTasksWithOutstandingBooking */
export function countActiveWorkshopBookingsForStep(
  step: 4 | 5,
  workshopBookings: readonly WorkshopBookingRecord[],
  taskPolicies: Record<string, TaskBookingPolicy>,
): number {
  return countWorkshopTasksWithOutstandingBooking(step, workshopBookings, taskPolicies)
}

/** Step has an outstanding booking or pending rebook on any workshop task. */
export function stepHasOutstandingWorkshopBooking(
  stepIndex: number,
  workshopBookings: readonly WorkshopBookingRecord[],
  taskPolicies: Record<string, TaskBookingPolicy>,
): boolean {
  if (stepIndex === 3) return countWorkshopTasksWithOutstandingBooking(4, workshopBookings, taskPolicies) > 0
  if (stepIndex === 4) return countWorkshopTasksWithOutstandingBooking(5, workshopBookings, taskPolicies) > 0
  return false
}

/** Step card badge: total registered sessions on this step's tasks (same notion as calendar "Registered" rows). */
export function workshopStepBadgeCount(
  step: 4 | 5,
  workshopBookings: readonly WorkshopBookingRecord[],
  taskPolicies: Record<string, TaskBookingPolicy>,
): number {
  return countWorkshopSessionsBookedForStep(step, workshopBookings, taskPolicies)
}
