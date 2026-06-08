/** Lifetime completed classes (locked as of the 4th) → pay Tier 1–10 */
export function resolveTierFromCumulativeCompletions(completed: number): number {
  if (completed < 80) return 1
  if (completed < 200) return 2
  if (completed < 400) return 3
  if (completed < 800) return 4
  if (completed < 1500) return 5
  if (completed < 2500) return 6
  if (completed < 4500) return 7
  if (completed < 7000) return 8
  if (completed < 10000) return 9
  return 10
}

export function formatTierLabel(tier: number) {
  return `Tier ${tier}`
}

/** Lifetime completed classes (as of the 4th) → Tier; upper bound exclusive except tier 10. */
export const TIER_LIFETIME_CLASS_RANGES: Array<{ tier: number; minClasses: number; maxClasses: number | null }> = [
  { tier: 1, minClasses: 0, maxClasses: 80 },
  { tier: 2, minClasses: 80, maxClasses: 200 },
  { tier: 3, minClasses: 200, maxClasses: 400 },
  { tier: 4, minClasses: 400, maxClasses: 800 },
  { tier: 5, minClasses: 800, maxClasses: 1500 },
  { tier: 6, minClasses: 1500, maxClasses: 2500 },
  { tier: 7, minClasses: 2500, maxClasses: 4500 },
  { tier: 8, minClasses: 4500, maxClasses: 7000 },
  { tier: 9, minClasses: 7000, maxClasses: 10000 },
  { tier: 10, minClasses: 10000, maxClasses: null },
]

/** Activity segments for monthly classes (same as incentive calculation). */
export const TIER_INCENTIVE_SEGMENT_LABELS = ['1–20', '21–40', '41–60', '61–90', '91–130', '131–180', '181+'] as const

/**
 * Activity segments for planned monthly classes: 1–20, 21–40, 41–60, 61–90, 91–130, 131–180, 181+
 * Each segment applies a dollars-per-class tier incentive rate from the matrix below.
 */
const SEGMENT_WIDTHS = [20, 20, 20, 30, 40, 50] as const

/** USD per class by tier row × activity segment column (used in calculator + Tier details modal). */
export const TIER_SEGMENT_INCENTIVE_RATES_MATRIX: number[][] = [
  [0.8, 1.2, 1.6, 1.7, 1.9, 2.0, 2.1],
  [0.8, 1.2, 1.6, 1.7, 1.9, 2.1, 2.3],
  [0.8, 1.2, 1.6, 1.7, 2.0, 2.2, 2.5],
  [0.8, 1.2, 1.6, 1.8, 2.1, 2.3, 2.6],
  [0.8, 1.2, 1.6, 1.8, 2.2, 2.4, 2.7],
  [0.8, 1.2, 1.7, 1.8, 2.3, 2.5, 2.8],
  [0.8, 1.2, 1.6, 1.9, 2.4, 2.6, 2.9],
  [0.8, 1.2, 1.6, 1.9, 2.4, 2.7, 3.0],
  [0.8, 1.2, 1.6, 1.9, 2.5, 2.8, 3.1],
  [0.8, 1.2, 1.6, 1.9, 2.5, 2.9, 3.2],
]

/** Tier incentive for the month from segmented table (USD, rounded to cents). */
export function calcTierIncentiveByBusinessTable(plannedMonthlyClasses: number, tier: number): number {
  const tierIndex = Math.min(Math.max(tier, 1), 10) - 1
  const rates = TIER_SEGMENT_INCENTIVE_RATES_MATRIX[tierIndex]
  let remaining = Math.max(0, plannedMonthlyClasses)
  let incentive = 0
  for (let i = 0; i < 7; i++) {
    if (remaining <= 0) break
    const width = i < 6 ? SEGMENT_WIDTHS[i] : remaining
    const take = Math.min(remaining, width)
    incentive += take * rates[i]
    remaining -= take
  }
  return Math.round(incentive * 100) / 100
}
