import type { WorkshopBookingRecord } from '../booking/bookingPolicy'
import { WORKSHOP_BOOKING_NODE_IDS } from '../workshop/workshopNodes'

/** Four priority new-teacher workshops — one session per map sub-task. */
export const RECOMMENDED_WORKSHOP_BINDINGS = [
  { sessionId: 'ws-kickoff', taskNodeId: 'workshop-core' },
  { sessionId: 'ws-students', taskNodeId: 'branch-ws-regular-students' },
  { sessionId: 'ws-bookings', taskNodeId: 'workshop-regular-bookings' },
  { sessionId: 'ws-time-mgmt', taskNodeId: 'branch-ws-regular-bookings' },
] as const

export const RECOMMENDED_WORKSHOP_SESSION_IDS = new Set<string>(
  RECOMMENDED_WORKSHOP_BINDINGS.map((b) => b.sessionId),
)

const SESSION_TO_TASK = new Map<string, string>(
  RECOMMENDED_WORKSHOP_BINDINGS.map((b) => [b.sessionId, b.taskNodeId]),
)

/** Optional add-on after the four recommended sessions (not counted on Step badges). */
export const EXTRA_WORKSHOP_NODE_ID = 'extra-workshop'

export function isRecommendedWorkshopSession(sessionId: string): boolean {
  return RECOMMENDED_WORKSHOP_SESSION_IDS.has(sessionId)
}

export function taskNodeIdForWorkshopSession(sessionId: string): string | null {
  return SESSION_TO_TASK.get(sessionId) ?? null
}

/** Canonical map task node for a booking record (session-driven, not entry-driven). */
export function resolveWorkshopBookingNodeId(sessionId: string): string {
  return taskNodeIdForWorkshopSession(sessionId) ?? EXTRA_WORKSHOP_NODE_ID
}

export function isPriorityMapTaskNodeId(nodeId: string): boolean {
  return WORKSHOP_BOOKING_NODE_IDS.has(nodeId)
}

export function normalizeWorkshopBooking(record: WorkshopBookingRecord): WorkshopBookingRecord {
  const canonical = resolveWorkshopBookingNodeId(record.sessionId)
  return { sessionId: record.sessionId, nodeId: canonical }
}

export function allRecommendedWorkshopsBooked(bookings: readonly WorkshopBookingRecord[]): boolean {
  const booked = new Set(bookings.map((b) => b.sessionId))
  return RECOMMENDED_WORKSHOP_BINDINGS.every((b) => booked.has(b.sessionId))
}

export function countExtraWorkshopBookings(bookings: readonly WorkshopBookingRecord[]): number {
  return bookings.filter((b) => !isRecommendedWorkshopSession(b.sessionId)).length
}

export const PRIORITY_WORKSHOPS_MESSAGE =
  'Please complete the booking of the 4 recommended workshops first before booking other workshops.'

export const EXTRA_WORKSHOP_LIMIT_MESSAGE =
  'You can book one additional optional workshop after the four recommended sessions.'

export type WorkshopRegistrationValidation =
  | { ok: true }
  | { ok: false; title: string; body: string }

/** Validate pending session ids before registration. */
export function validateWorkshopRegistration(
  pendingSessionIds: readonly string[],
  currentBookings: readonly WorkshopBookingRecord[],
): WorkshopRegistrationValidation {
  if (pendingSessionIds.length === 0) return { ok: true }

  const pendingNonRecommended = pendingSessionIds.filter((id) => !isRecommendedWorkshopSession(id))
  const existingNonRecommended = countExtraWorkshopBookings(currentBookings)

  if (pendingNonRecommended.length > 0) {
    const recommendedAfter = new Set(currentBookings.map((b) => b.sessionId))
    for (const id of pendingSessionIds) {
      if (isRecommendedWorkshopSession(id)) recommendedAfter.add(id)
    }
    const allFour = RECOMMENDED_WORKSHOP_BINDINGS.every((b) => recommendedAfter.has(b.sessionId))
    if (!allFour) {
      return {
        ok: false,
        title: 'Recommended workshops first',
        body: PRIORITY_WORKSHOPS_MESSAGE,
      }
    }
    if (existingNonRecommended + pendingNonRecommended.length > 1) {
      return {
        ok: false,
        title: 'Optional workshop limit',
        body: EXTRA_WORKSHOP_LIMIT_MESSAGE,
      }
    }
  }

  return { ok: true }
}

/** Merge new session bookings into the list (session-keyed; recommended tasks hold one session each). */
export function mergeWorkshopBookings(
  current: readonly WorkshopBookingRecord[],
  newSessionIds: readonly string[],
): WorkshopBookingRecord[] {
  let next = [...current.map(normalizeWorkshopBooking)]
  for (const sessionId of newSessionIds) {
    const nodeId = resolveWorkshopBookingNodeId(sessionId)
    if (isRecommendedWorkshopSession(sessionId)) {
      next = next.filter((b) => b.nodeId !== nodeId)
    }
    next = next.filter((b) => b.sessionId !== sessionId)
    next.push({ sessionId, nodeId })
  }
  return next
}

export function bookingRecordForSession(
  sessionId: string,
  bookings: readonly WorkshopBookingRecord[],
): WorkshopBookingRecord | undefined {
  return bookings.find((b) => b.sessionId === sessionId)
}
