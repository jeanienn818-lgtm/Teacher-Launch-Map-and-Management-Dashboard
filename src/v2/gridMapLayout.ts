/**
 * 2×3 Onboarding Summit grid map geometry (viewBox 0 0 900 520).
 * Row 1: Steps 1–3 left→right; row 2: Steps 4–6; Z-flow connectors between cards.
 */
export const GRID_MAP_VB = { w: 900, h: 520 } as const

const PAD_X = 52
const PAD_Y = 56
const GAP_X = 28
const GAP_Y = 36

function cellSize() {
  const cellW = (GRID_MAP_VB.w - 2 * PAD_X - 2 * GAP_X) / 3
  const cellH = (GRID_MAP_VB.h - 2 * PAD_Y - GAP_Y) / 2
  return { cellW, cellH }
}

/** Card center in viewBox coordinates (step index 0–5). */
export function gridCardCenterVb(stepIndex: number): { x: number; y: number } {
  const { cellW, cellH } = cellSize()
  const row = stepIndex < 3 ? 0 : 1
  const col = stepIndex < 3 ? stepIndex : stepIndex - 3
  return {
    x: PAD_X + col * (cellW + GAP_X) + cellW / 2,
    y: PAD_Y + row * (cellH + GAP_Y) + cellH / 2,
  }
}

/** Edge points for horizontal connectors (right of card i → left of card i+1, same row). */
function rowEdgePoints(row: 0 | 1) {
  const { cellW, cellH } = cellSize()
  const y = PAD_Y + row * (cellH + GAP_Y) + cellH * 0.42
  const lefts = [0, 1, 2].map((col) => PAD_X + col * (cellW + GAP_X))
  return {
    y,
    rights: lefts.map((l) => l + cellW),
    lefts,
  }
}

/** Curved Z connector from Step 3 (top-right) down to Step 4 (bottom-left). */
export function buildZTurnPathD(): string {
  const top = rowEdgePoints(0)
  const bot = rowEdgePoints(1)
  const xStart = top.rights[2]! + 6
  const yStart = top.y
  const xEnd = bot.lefts[0]! - 6
  const yEnd = bot.y
  const midY = (yStart + yEnd) / 2 + 18
  return `M ${xStart.toFixed(1)} ${yStart.toFixed(1)} C ${(xStart + 42).toFixed(1)} ${(yStart + 28).toFixed(1)}, ${(xEnd - 42).toFixed(1)} ${midY.toFixed(1)}, ${xEnd.toFixed(1)} ${yEnd.toFixed(1)}`
}

function horizontalSegment(row: 0 | 1, fromCol: number, toCol: number): string {
  const { y, rights, lefts } = rowEdgePoints(row)
  const x1 = rights[fromCol]! + 8
  const x2 = lefts[toCol]! - 8
  return `M ${x1.toFixed(1)} ${y.toFixed(1)} L ${x2.toFixed(1)} ${y.toFixed(1)}`
}

/** Full Z-flow base path (all segments). */
export function buildFullGridFlowPathD(): string {
  const parts = [
    horizontalSegment(0, 0, 1),
    horizontalSegment(0, 1, 2),
    buildZTurnPathD(),
    horizontalSegment(1, 0, 1),
    horizontalSegment(1, 1, 2),
  ]
  return parts.join(' ')
}

/**
 * Progress highlight along Z-flow up to `endStepIndex` inclusive (0–5).
 * Mirrors stair partial-path behavior for completed main steps.
 */
export function buildPartialGridFlowPathD(endStepIndex: number): string | null {
  if (endStepIndex < 0) return buildFullGridFlowPathD()
  if (endStepIndex === 0) return null

  const parts: string[] = []
  if (endStepIndex >= 1) parts.push(horizontalSegment(0, 0, 1))
  if (endStepIndex >= 2) parts.push(horizontalSegment(0, 1, 2))
  if (endStepIndex >= 3) parts.push(buildZTurnPathD())
  if (endStepIndex >= 4) parts.push(horizontalSegment(1, 0, 1))
  if (endStepIndex >= 5) parts.push(horizontalSegment(1, 1, 2))
  return parts.length ? parts.join(' ') : null
}

/** CSS grid area name for step index 0–5. */
export function gridAreaName(stepIndex: number): string {
  const row = stepIndex < 3 ? 1 : 2
  const col = (stepIndex < 3 ? stepIndex : stepIndex - 3) + 1
  return `step-${row}-${col}`
}
