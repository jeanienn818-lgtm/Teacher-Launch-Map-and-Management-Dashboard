/**
 * True 6-step staircase geometry (viewBox 0 0 420 300).
 * Each step: horizontal tread + vertical riser; node sits on tread center.
 */
export const STAIR_VB = { w: 420, h: 300 } as const

const TREAD_LEN = 62
const RISER_H = 26
const TREAD_THICK = 11
const RISER_W = 5
const X0 = 22
/**
 * Baseline walking-surface Y for Step 1 (SVG y↓). Lower value = whole stair shifted up.
 * Tuned so the 6-step composition sits slightly above the viewBox vertical center (~y150):
 * less dead space above Peak Summit, Step 1 lifted off the bottom, branches stay aligned via shared geom.
 */
const Y_SURFACE_0 = 208

export interface StairStepGeom {
  index: number
  tread: { x: number; y: number; w: number; h: number }
  riser: { x: number; y: number; w: number; h: number } | null
  /** Circle center for hotspot / tooltip anchor */
  nodeCenter: { vbX: number; vbY: number }
  leftPct: number
  bottomPct: number
}

function vbToPct(vbX: number, vbY: number) {
  return {
    leftPct: (vbX / STAIR_VB.w) * 100,
    bottomPct: (1 - vbY / STAIR_VB.h) * 100,
  }
}

/** Six visible steps (1–5 main path + 6 summit platform). */
export function computeStaircaseSteps(): StairStepGeom[] {
  const out: StairStepGeom[] = []
  let x = X0
  let ySurf = Y_SURFACE_0

  for (let i = 0; i < 6; i++) {
    const tread = { x, y: ySurf, w: TREAD_LEN, h: TREAD_THICK }
    const vbX = x + TREAD_LEN / 2
    const vbY = ySurf - 9
    const { leftPct, bottomPct } = vbToPct(vbX, vbY)

    const riser =
      i < 5
        ? {
            x: x + TREAD_LEN - RISER_W,
            y: ySurf - RISER_H,
            w: RISER_W,
            h: RISER_H,
          }
        : null

    out.push({ index: i, tread, riser, nodeCenter: { vbX, vbY }, leftPct, bottomPct })

    if (i < 5) {
      x += TREAD_LEN
      ySurf -= RISER_H
    }
  }
  return out
}

export interface MainStepAnchor {
  leftPct: number
  bottomPct: number
  vbX: number
  vbY: number
}

/** Anchors for main flow nodes (Steps 1–5). */
export function computeMainStepAnchors(mainStepCount: number): MainStepAnchor[] {
  const steps = computeStaircaseSteps()
  return steps.slice(0, Math.max(mainStepCount, 1)).map((s) => ({
    leftPct: s.leftPct,
    bottomPct: s.bottomPct,
    vbX: s.nodeCenter.vbX,
    vbY: s.nodeCenter.vbY,
  }))
}

/** Summit node (Step 6 platform). */
export function computeSummitConnectVb(): { vbX: number; vbY: number } {
  const s = computeStaircaseSteps()[5]!
  return { vbX: s.nodeCenter.vbX, vbY: s.nodeCenter.vbY }
}

export function computeSummitNodeAnchorPct(): { leftPct: number; bottomPct: number } {
  const s = computeStaircaseSteps()[5]!
  return { leftPct: s.leftPct, bottomPct: s.bottomPct }
}

/** Tread upper edge + mid-depth in the same bottom-% space as map hotspots (stable vs zoom when used as anchor). */
export function computeStepTreadBottomPcts(stepIndex: number): { treadTopBottomPct: number; treadMidBottomPct: number } {
  const s = computeStaircaseSteps()[stepIndex]!
  const treadTopY = s.tread.y
  const treadMidY = s.tread.y + s.tread.h * 0.5
  return {
    treadTopBottomPct: (1 - treadTopY / STAIR_VB.h) * 100,
    treadMidBottomPct: (1 - treadMidY / STAIR_VB.h) * 100,
  }
}

export function computeMainTreadLayouts(mainStepCount: number) {
  const steps = computeStaircaseSteps()
  return steps.slice(0, Math.max(mainStepCount, 1)).map((s) => {
    const { treadTopBottomPct, treadMidBottomPct } = computeStepTreadBottomPcts(s.index)
    return {
      leftPct: s.leftPct,
      treadTopBottomPct,
      treadMidBottomPct,
    }
  })
}

/**
 * Orthogonal path along tread surfaces + risers, indices 0..endInclusive.
 */
export function buildOrthogonalClimbPathD(steps: StairStepGeom[], endInclusive: number): string | null {
  if (endInclusive < 0 || endInclusive >= steps.length) return null
  const parts: string[] = []
  for (let i = 0; i <= endInclusive; i++) {
    const s = steps[i]!
    const { tread, riser } = s
    const y = tread.y
    const xL = tread.x
    const xR = tread.x + tread.w
    if (i === 0) parts.push(`M ${xL.toFixed(1)} ${y.toFixed(1)}`)
    else parts.push(`L ${xL.toFixed(1)} ${y.toFixed(1)}`)
    parts.push(`L ${xR.toFixed(1)} ${y.toFixed(1)}`)
    if (riser && i < endInclusive) {
      const topY = riser.y
      parts.push(`L ${xR.toFixed(1)} ${topY.toFixed(1)}`)
    }
  }
  return parts.join(' ')
}

/** Full climb polyline (all 6 steps). */
export function buildFullClimbPathD(steps: StairStepGeom[]): string | null {
  return buildOrthogonalClimbPathD(steps, steps.length - 1)
}

/** @deprecated Use buildFullClimbPathD / buildOrthogonalClimbPathD */
export function buildMainStairPathD(_anchors: MainStepAnchor[]): string {
  return buildFullClimbPathD(computeStaircaseSteps()) ?? ''
}

/**
 * Gold accent along treads completed so far.
 * When all main steps are done (`mainNextIndex === -1`), trace through the summit platform too.
 */
export function buildPartialMainClimbPathD(steps: StairStepGeom[], mainNextIndex: number): string | null {
  if (mainNextIndex === -1) return buildOrthogonalClimbPathD(steps, steps.length - 1)
  if (mainNextIndex <= 0) return null
  return buildOrthogonalClimbPathD(steps, mainNextIndex - 1)
}
