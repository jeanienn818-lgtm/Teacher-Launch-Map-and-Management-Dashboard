import type { FlowNode } from './types'
import type { MainStepAnchor } from './stairLayout'
import { computeSummitConnectVb, computeSummitNodeAnchorPct } from './stairLayout'

const STEP4_ANCHOR_INDEX = 3 // Core workshop track
const STEP5_ANCHOR_INDEX = 4 // Required workshop: regular bookings

/** Local callout anchor: main nodes directly; branches snap to the nearest main tread */
export function getCalloutPlacement(
  mainNodes: FlowNode[],
  anchors: MainStepAnchor[],
  bestNext: FlowNode | null,
): { anchor: MainStepAnchor; labelNode: FlowNode } | null {
  if (!bestNext || anchors.length === 0) return null
  if (bestNext.group === 'summit') {
    const pct = computeSummitNodeAnchorPct()
    const { vbX, vbY } = computeSummitConnectVb()
    const anchor: MainStepAnchor = { ...pct, vbX, vbY }
    return { anchor, labelNode: bestNext }
  }
  const midx = mainNodes.findIndex((n) => n.id === bestNext.id)
  if (midx >= 0) return { anchor: anchors[midx], labelNode: bestNext }
  if (bestNext.group === 'mock' && bestNext.type === 'branch') {
    const idx = mainNodes.findIndex((n) => n.id === 'mock-lv23')
    return { anchor: anchors[idx >= 0 ? idx : Math.min(2, anchors.length - 1)], labelNode: bestNext }
  }
  if (bestNext.group === 'dino') {
    const idx = Math.min(STEP4_ANCHOR_INDEX, anchors.length - 1)
    return { anchor: anchors[idx >= 0 ? idx : 0], labelNode: bestNext }
  }
  if (bestNext.group === 'reward') {
    const idx = Math.max(0, anchors.length - 1)
    return { anchor: anchors[idx], labelNode: bestNext }
  }
  if (bestNext.group === 'workshop' && bestNext.id === 'workshop-regular-bookings') {
    const idx = Math.min(STEP5_ANCHOR_INDEX, anchors.length - 1)
    return { anchor: anchors[idx], labelNode: bestNext }
  }
  return null
}
