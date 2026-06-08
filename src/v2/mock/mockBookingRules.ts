import {
  DEFAULT_TASK_BOOKING_POLICY,
  type MockBookingRecord,
  type TaskBookingPolicy,
} from '../booking/bookingPolicy'
import { MOCK_BOOKING_NODE_IDS, MOCK_BOOKING_NODE_ID_LIST } from './mockNodes'

/** Which Step 3 mock sub-task the next slot should attach to (one booking per task). */
export function resolveMockBookingNodeId(
  sourceNodeId: string,
  existingBookings: readonly MockBookingRecord[],
  taskPolicies: Record<string, TaskBookingPolicy>,
): string | null {
  const bookedNodeIds = new Set(existingBookings.map((b) => b.nodeId))

  for (const nodeId of MOCK_BOOKING_NODE_ID_LIST) {
    const policy = taskPolicies[nodeId] ?? DEFAULT_TASK_BOOKING_POLICY
    if (policy.pendingRebook && !bookedNodeIds.has(nodeId)) {
      return nodeId
    }
  }

  if (MOCK_BOOKING_NODE_IDS.has(sourceNodeId) && !bookedNodeIds.has(sourceNodeId)) {
    return sourceNodeId
  }

  for (const nodeId of MOCK_BOOKING_NODE_ID_LIST) {
    if (!bookedNodeIds.has(nodeId)) return nodeId
  }

  return null
}
