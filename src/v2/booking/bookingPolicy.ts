import { getMockSlotStartDate } from '../mock/mockSlots'
import type { MockSlot } from '../mock/mockSlots'
import { getWorkshopSessionStartDate } from '../workshop/workshopSessions'
import type { WorkshopSession } from '../workshop/workshopSessions'

/** Must cancel more than 24 hours before session start. */
export const BOOKING_CANCEL_REBOOK_MIN_MS = 24 * 60 * 60 * 1000

export interface TaskBookingPolicy {
  rescheduleUses: 0 | 1
  /** True after a cancel — next booking for this task consumes the one reschedule. */
  pendingRebook: boolean
}

export const DEFAULT_TASK_BOOKING_POLICY: TaskBookingPolicy = {
  rescheduleUses: 0,
  pendingRebook: false,
}

export interface MockBookingRecord {
  slotId: string
  nodeId: string
}

export interface WorkshopBookingRecord {
  sessionId: string
  /** Map sub-task id (from session mapping), not the drawer entry used to book. */
  nodeId: string
}

export function msUntilStart(start: Date, ref: Date = new Date()): number {
  return start.getTime() - ref.getTime()
}

export function canCancelByLeadTime(start: Date, ref: Date = new Date()): boolean {
  return msUntilStart(start, ref) > BOOKING_CANCEL_REBOOK_MIN_MS
}

export function canCancelTaskBooking(policy: TaskBookingPolicy, sessionStart: Date, ref?: Date): boolean {
  return policy.rescheduleUses === 0 && !policy.pendingRebook && canCancelByLeadTime(sessionStart, ref)
}

export function cancelBlockedReason(policy: TaskBookingPolicy, sessionStart: Date, ref?: Date): string | null {
  if (policy.rescheduleUses >= 1) {
    return 'You have already used your one cancel & rebook for this task.'
  }
  if (policy.pendingRebook) {
    return 'Book a new time to finish your reschedule.'
  }
  if (!canCancelByLeadTime(sessionStart, ref)) {
    return 'Cancellation is only available more than 24 hours before the session starts.'
  }
  return null
}

export function policyAfterCancel(policy: TaskBookingPolicy): TaskBookingPolicy {
  return { rescheduleUses: policy.rescheduleUses, pendingRebook: true }
}

export function policyAfterBook(nodeId: string, policies: Record<string, TaskBookingPolicy>): TaskBookingPolicy {
  const cur = policies[nodeId] ?? DEFAULT_TASK_BOOKING_POLICY
  if (cur.pendingRebook) {
    return { rescheduleUses: 1, pendingRebook: false }
  }
  return { rescheduleUses: 0, pendingRebook: false }
}

export function mockSessionStart(slot: MockSlot): Date {
  return getMockSlotStartDate(slot)
}

export function workshopSessionStart(session: WorkshopSession): Date {
  return getWorkshopSessionStartDate(session)
}
