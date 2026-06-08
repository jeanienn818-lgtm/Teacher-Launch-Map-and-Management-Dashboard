export const MOCK_BOOKING_NODE_IDS = new Set<string>(['mock-lv23', 'mock-lv46'])

export const MOCK_BOOKING_NODE_ID_LIST = ['mock-lv23', 'mock-lv46'] as const

export function isMockBookingNode(nodeId: string): boolean {
  return MOCK_BOOKING_NODE_IDS.has(nodeId)
}
