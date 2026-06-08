/** Workshop tasks on Step 4 / Step 5 (main + branch) that support calendar booking. */
export const WORKSHOP_BOOKING_NODE_IDS = new Set<string>([
  'workshop-core',
  'workshop-regular-bookings',
  'branch-ws-regular-students',
  'branch-ws-regular-bookings',
])

export function isWorkshopBookingNode(nodeId: string): boolean {
  return WORKSHOP_BOOKING_NODE_IDS.has(nodeId)
}
