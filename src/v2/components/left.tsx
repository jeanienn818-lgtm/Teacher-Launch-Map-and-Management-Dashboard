import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { calcIncome } from '../utils'
import { playTwoCompletionDings } from '../sounds/playTaskCompletionSound'

/** V2.15 left column: Target Monthly Income Planner + collapsible booking guide */

/** Left-column target-income planner inputs (slots-based UI; pay logic unchanged). */
export interface TargetIncomePlannerInput {
  targetMonthlyIncome: number
  /** Only counts when teacher actively entered a value (see pptSlotsEntered). */
  plannedPptSlots: number
  pptSlotsEntered: boolean
  trialConversions: number
  shortNoticeCompletedSlots: number
}

export const DEFAULT_TARGET_INCOME_PLANNER: TargetIncomePlannerInput = {
  targetMonthlyIncome: 1000,
  plannedPptSlots: 0,
  pptSlotsEntered: false,
  trialConversions: 0,
  shortNoticeCompletedSlots: 0,
}

export const EMPTY_TARGET_INCOME_PLANNER: TargetIncomePlannerInput = {
  targetMonthlyIncome: 0,
  plannedPptSlots: 0,
  pptSlotsEntered: false,
  trialConversions: 0,
  shortNoticeCompletedSlots: 0,
}

const PPT_BOOKING_RATE = 0.8
const NON_PPT_BOOKING_RATE = 0.6
const MONTHLY_PPT_SLOT_MAX = 120

/** Platform average open PPT slots — below this triggers center alert. */
const PPT_PLATFORM_AVG_OPEN_SLOTS = 54
const PPT_BELOW_AVG_ALERT_AUTO_DISMISS_MS = 5000
/** Wait after last keystroke before showing below-average PPT alert (avoids firing on partial input). */
const PPT_BELOW_AVG_ALERT_DEBOUNCE_MS = 1000

/** Default recommended open-slot mix when PPT input is blank (48% = remainder after 52% PPT). */
const PPT_OPEN_SPLIT = 0.52

export interface ReverseSlotPlanResult {
  requiredTotalCompletedSlots: number
  recommendedTotalOpenSlots: number
  recommendedPptOpenSlots: number
  recommendedNonPptOpenSlots: number
}

function slotIncomeFromCompleted(pptCompleted: number, nonPptCompleted: number, salaryTier: number): number {
  const total = pptCompleted + nonPptCompleted
  return calcIncome(
    {
      plannedClasses: total,
      plannedPeakClasses: pptCompleted,
      plannedConversions: 0,
      plannedPbjgLrClasses: 0,
      plannedShortNoticeClasses: 0,
    },
    salaryTier,
  ).total
}

function minNonPptSlotsForTarget(pptCompleted: number, slotIncomeNeeded: number, salaryTier: number): number {
  if (slotIncomeNeeded <= 0) return 0
  const pptOnly = slotIncomeFromCompleted(pptCompleted, 0, salaryTier)
  if (pptOnly >= slotIncomeNeeded) return 0

  let lo = 0
  let hi = 60
  while (slotIncomeFromCompleted(pptCompleted, hi, salaryTier) < slotIncomeNeeded) {
    hi = Math.min(hi * 2, 600)
    if (hi >= 600) break
  }

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (slotIncomeFromCompleted(pptCompleted, mid, salaryTier) >= slotIncomeNeeded) hi = mid
    else lo = mid + 1
  }
  return lo
}

function expectedCompletedFromOpen(pptOpen: number, nonPptOpen: number): { pptCompleted: number; nonPptCompleted: number } {
  return {
    pptCompleted: Math.floor(pptOpen * PPT_BOOKING_RATE),
    nonPptCompleted: Math.floor(nonPptOpen * NON_PPT_BOOKING_RATE),
  }
}

function incomeFromOpenPlan(pptOpen: number, nonPptOpen: number, salaryTier: number): number {
  const { pptCompleted, nonPptCompleted } = expectedCompletedFromOpen(pptOpen, nonPptOpen)
  return slotIncomeFromCompleted(pptCompleted, nonPptCompleted, salaryTier)
}

function splitRecommendedOpenSlots(totalOpen: number): { pptOpen: number; nonPptOpen: number } {
  const safeTotal = Math.max(0, Math.ceil(totalOpen))
  if (safeTotal === 0) return { pptOpen: 0, nonPptOpen: 0 }
  const pptOpen = Math.ceil(safeTotal * PPT_OPEN_SPLIT)
  const nonPptOpen = Math.max(0, safeTotal - pptOpen)
  return { pptOpen, nonPptOpen }
}

function clampPptOpenSlots(value: number): number {
  return Math.min(MONTHLY_PPT_SLOT_MAX, Math.max(0, Math.floor(value)))
}

/** Apply monthly PPT open cap; overflow income need shifts to non-PPT open slots. */
function applyPptOpenCapToRecommendation(
  initialPptOpen: number,
  slotIncomeNeeded: number,
  salaryTier: number,
): { recommendedPptOpenSlots: number; recommendedNonPptOpenSlots: number; recommendedTotalOpenSlots: number } {
  const recommendedPptOpenSlots = clampPptOpenSlots(initialPptOpen)
  const recommendedNonPptOpenSlots = minNonPptOpenForTeacherPptPlan(
    recommendedPptOpenSlots,
    slotIncomeNeeded,
    salaryTier,
  )
  return {
    recommendedPptOpenSlots,
    recommendedNonPptOpenSlots,
    recommendedTotalOpenSlots: recommendedPptOpenSlots + recommendedNonPptOpenSlots,
  }
}

function resolveDefaultSplitRecommendation(
  totalOpen: number,
  slotIncomeNeeded: number,
  salaryTier: number,
): { pptOpen: number; nonPptOpen: number } {
  const split = splitRecommendedOpenSlots(totalOpen)
  if (split.pptOpen <= MONTHLY_PPT_SLOT_MAX) return split
  const capped = applyPptOpenCapToRecommendation(split.pptOpen, slotIncomeNeeded, salaryTier)
  return { pptOpen: capped.recommendedPptOpenSlots, nonPptOpen: capped.recommendedNonPptOpenSlots }
}

function minTotalOpenWithDefaultSplit(slotIncomeNeeded: number, salaryTier: number): number {
  if (slotIncomeNeeded <= 0) return 0
  let lo = 0
  let hi = 60
  while (true) {
    const probe = resolveDefaultSplitRecommendation(hi, slotIncomeNeeded, salaryTier)
    if (incomeFromOpenPlan(probe.pptOpen, probe.nonPptOpen, salaryTier) >= slotIncomeNeeded) break
    hi = Math.min(hi * 2, 600)
    if (hi >= 600) break
  }
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    const probe = resolveDefaultSplitRecommendation(mid, slotIncomeNeeded, salaryTier)
    if (incomeFromOpenPlan(probe.pptOpen, probe.nonPptOpen, salaryTier) >= slotIncomeNeeded) hi = mid
    else lo = mid + 1
  }
  return lo
}

function minNonPptOpenForTeacherPptPlan(pptOpen: number, slotIncomeNeeded: number, salaryTier: number): number {
  if (slotIncomeNeeded <= 0) return 0
  const pptCompleted = Math.floor(pptOpen * PPT_BOOKING_RATE)
  const nonPptCompletedNeeded = minNonPptSlotsForTarget(pptCompleted, slotIncomeNeeded, salaryTier)
  return nonPptCompletedNeeded > 0 ? Math.ceil(nonPptCompletedNeeded / NON_PPT_BOOKING_RATE) : 0
}

/** Minimum completed slots for slot-income goal (same baseline as blank PPT plan). */
function baselineRequiredCompletedSlots(slotIncomeNeeded: number, salaryTier: number): number {
  return minNonPptSlotsForTarget(0, slotIncomeNeeded, salaryTier)
}

/** Minimum PPT open slots if teacher only opens PPT (ceil(completed ÷ 80% booking rate)). */
function minPptOnlyOpenSlots(requiredCompletedSlots: number): number {
  if (requiredCompletedSlots <= 0) return 0
  return Math.ceil(requiredCompletedSlots / PPT_BOOKING_RATE)
}

/**
 * When entered PPT open exceeds the PPT-only minimum for tier + income, show the tightest
 * compliant recommendation (not the teacher's higher input).
 */
function applyRecommendedOpenSlotsRigor(
  slotIncomeNeeded: number,
  salaryTier: number,
  baselineRequiredCompleted: number,
  minPptOpenCompliant: number,
): ReverseSlotPlanResult {
  const rigorOpen = applyPptOpenCapToRecommendation(minPptOpenCompliant, slotIncomeNeeded, salaryTier)
  return {
    requiredTotalCompletedSlots: baselineRequiredCompleted,
    recommendedPptOpenSlots: rigorOpen.recommendedPptOpenSlots,
    recommendedNonPptOpenSlots: rigorOpen.recommendedNonPptOpenSlots,
    recommendedTotalOpenSlots: rigorOpen.recommendedTotalOpenSlots,
  }
}

export function calcReverseSlotPlan(input: TargetIncomePlannerInput, salaryTier: number): ReverseSlotPlanResult {
  const target = Math.max(0, input.targetMonthlyIncome)
  const trialConversions = Math.max(0, Math.floor(input.trialConversions))
  const shortNotice = Math.max(0, Math.floor(input.shortNoticeCompletedSlots))

  const fixedIncentiveTotal = trialConversions * 5 + shortNotice * 2
  const slotIncomeNeeded = Math.max(0, target - fixedIncentiveTotal)

  if (input.pptSlotsEntered) {
    const pptOpen = clampPptOpenSlots(input.plannedPptSlots)
    const baselineRequiredCompleted = baselineRequiredCompletedSlots(slotIncomeNeeded, salaryTier)
    const minPptOpenCompliant = minPptOnlyOpenSlots(baselineRequiredCompleted)

    const pptCompleted = Math.floor(pptOpen * PPT_BOOKING_RATE)
    const requiredNonPptCompleted = minNonPptSlotsForTarget(pptCompleted, slotIncomeNeeded, salaryTier)
    const requiredTotalCompletedSlots = pptCompleted + requiredNonPptCompleted
    const { recommendedPptOpenSlots, recommendedNonPptOpenSlots, recommendedTotalOpenSlots } =
      applyPptOpenCapToRecommendation(pptOpen, slotIncomeNeeded, salaryTier)

    const rawPlan: ReverseSlotPlanResult = {
      requiredTotalCompletedSlots,
      recommendedTotalOpenSlots,
      recommendedPptOpenSlots,
      recommendedNonPptOpenSlots,
    }

    if (
      baselineRequiredCompleted > 0 &&
      pptOpen > minPptOpenCompliant &&
      pptOpen <= MONTHLY_PPT_SLOT_MAX
    ) {
      return applyRecommendedOpenSlotsRigor(
        slotIncomeNeeded,
        salaryTier,
        baselineRequiredCompleted,
        minPptOpenCompliant,
      )
    }

    return rawPlan
  }

  const requiredNonPptCompleted = minNonPptSlotsForTarget(0, slotIncomeNeeded, salaryTier)
  const requiredTotalCompletedSlots = requiredNonPptCompleted
  const uncappedTotalOpen = minTotalOpenWithDefaultSplit(slotIncomeNeeded, salaryTier)
  const { pptOpen: recommendedPptOpenSlots, nonPptOpen: recommendedNonPptOpenSlots } =
    resolveDefaultSplitRecommendation(uncappedTotalOpen, slotIncomeNeeded, salaryTier)
  const recommendedTotalOpenSlots = recommendedPptOpenSlots + recommendedNonPptOpenSlots

  return {
    requiredTotalCompletedSlots,
    recommendedTotalOpenSlots,
    recommendedPptOpenSlots,
    recommendedNonPptOpenSlots,
  }
}

export interface TargetIncomePlannerPanelProps {
  tierLabel: string
  input: TargetIncomePlannerInput
  onChange: (next: TargetIncomePlannerInput) => void
  salaryTier: number
  /** First-visit guide: elevate Target Monthly Income field during spotlight tour. */
  targetIncomeGuidePulse?: boolean
  onTargetIncomeGuideInteract?: () => void
}

function parseOptionalInt(raw: string): number {
  const trimmed = raw.trim()
  if (trimmed === '') return 0
  const num = Number(trimmed)
  return Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0
}

const PPT_TIME_SLOTS = ['19:00', '19:30', '20:00', '20:30'] as const

const BOOKING_GUIDE_PANEL_ID = 'slot-booking-guide-panel'

function PptBelowAverageAlert({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="slot-ppt-below-avg-root">
      <div className="slot-ppt-below-avg-scrim" aria-hidden onClick={onClose} />
      <div
        className="slot-ppt-below-avg-center"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="slot-ppt-below-avg-title"
      >
        <div className="slot-ppt-below-avg-card">
          <button type="button" className="slot-ppt-below-avg-close" onClick={onClose} aria-label="Dismiss">
            <span aria-hidden>×</span>
          </button>
          <p id="slot-ppt-below-avg-title" className="slot-ppt-below-avg-title">
            Below platform average
          </p>
          <p className="slot-ppt-below-avg-body">
            The current platform average for open PPT slots is{' '}
            <strong className="slot-ppt-below-avg-platform-num">{PPT_PLATFORM_AVG_OPEN_SLOTS}</strong>. Your plan is
            below that average.
            Open more PPT slots—your booking rate could reach <strong>80%–98%</strong>.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function PptBookingGuideCard({ onClose }: { onClose: () => void }) {
  return (
    <div
      id={BOOKING_GUIDE_PANEL_ID}
      className="slot-booking-guide-card"
      role="region"
      aria-label="PPT and Non-PPT booking guidance"
    >
      <div className="slot-booking-guide-card__head">
        <div className="slot-booking-guide-card__title-row">
          <h4 className="slot-booking-guide-card__title">PPT &amp; Non-PPT booking</h4>
          <span className="chip chip--peak chip--booking-guide">Booking guide</span>
        </div>
        <button type="button" className="slot-booking-guide-card__close" onClick={onClose} aria-label="Close booking guide">
          <span aria-hidden>×</span>
        </button>
      </div>
      <div className="time-tags time-tags--peak-widget slot-planner-time-tags" role="list" aria-label="Recommended PPT times">
        {PPT_TIME_SLOTS.map((t) => (
          <span key={t} role="listitem">
            {t}
          </span>
        ))}
      </div>
      <p className="slot-planner-kicker slot-booking-guide-card__kicker">Open more PPT slots to improve booking chances.</p>
      <div className="peak-metrics-row peak-metrics-row--widget slot-planner-guidance-metrics">
        <div className="peak-metric">
          <span className="peak-metric-label">PPT booking</span>
          <span className="peak-metric-value">
            <strong>80%+</strong>
          </span>
          <span className="peak-metric-unit">peak 85–98%</span>
        </div>
        <div className="peak-metric peak-metric--highlight">
          <span className="peak-metric-label">Non-PPT</span>
          <span className="peak-metric-value">
            <strong>60%+</strong>
          </span>
        </div>
        <div className="peak-metric">
          <span className="peak-metric-label">Monthly PPT max</span>
          <span className="peak-metric-value">
            <strong>120</strong>
          </span>
          <span className="peak-metric-unit">open slots</span>
        </div>
      </div>
    </div>
  )
}

export function TargetIncomePlannerPanel({
  tierLabel,
  input,
  onChange,
  salaryTier,
  targetIncomeGuidePulse = false,
  onTargetIncomeGuideInteract,
}: TargetIncomePlannerPanelProps) {
  const [pptRaw, setPptRaw] = useState('')
  const [trialRaw, setTrialRaw] = useState(String(input.trialConversions || ''))
  const [bookingGuideOpen, setBookingGuideOpen] = useState(false)
  const [pptBelowAvgAlertOpen, setPptBelowAvgAlertOpen] = useState(false)
  const pptBelowAvgDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearPptBelowAvgDebounce = () => {
    if (pptBelowAvgDebounceRef.current != null) {
      window.clearTimeout(pptBelowAvgDebounceRef.current)
      pptBelowAvgDebounceRef.current = null
    }
  }

  useEffect(() => () => clearPptBelowAvgDebounce(), [])

  useEffect(() => {
    if (!pptBelowAvgAlertOpen) return
    const timerId = window.setTimeout(() => setPptBelowAvgAlertOpen(false), PPT_BELOW_AVG_ALERT_AUTO_DISMISS_MS)
    return () => window.clearTimeout(timerId)
  }, [pptBelowAvgAlertOpen])

  const effectiveInput = useMemo((): TargetIncomePlannerInput => {
    const pptEntered = input.pptSlotsEntered
    return {
      ...input,
      plannedPptSlots: pptEntered ? input.plannedPptSlots : 0,
      shortNoticeCompletedSlots: 0,
    }
  }, [input])

  const plan = useMemo(() => calcReverseSlotPlan(effectiveInput, salaryTier), [effectiveInput, salaryTier])
  const pptOpenMetricLabel = input.pptSlotsEntered ? 'YOUR PPT OPEN' : 'Recommended PPT open'
  const targetIncomeLabel = `$${Math.max(0, input.targetMonthlyIncome || 0).toLocaleString()}`

  const updateTarget = (value: string) => {
    const num = parseOptionalInt(value)
    onChange({ ...input, targetMonthlyIncome: num })
  }

  const updatePpt = (value: string) => {
    setPptRaw(value)
    const trimmed = value.trim()
    if (trimmed === '') {
      clearPptBelowAvgDebounce()
      setPptBelowAvgAlertOpen(false)
      onChange({ ...input, plannedPptSlots: 0, pptSlotsEntered: false })
      return
    }
    const capped = clampPptOpenSlots(parseOptionalInt(value))
    if (String(capped) !== trimmed) setPptRaw(String(capped))
    onChange({ ...input, plannedPptSlots: capped, pptSlotsEntered: true })

    clearPptBelowAvgDebounce()
    if (capped < PPT_PLATFORM_AVG_OPEN_SLOTS) {
      pptBelowAvgDebounceRef.current = window.setTimeout(() => {
        pptBelowAvgDebounceRef.current = null
        setPptBelowAvgAlertOpen(true)
        playTwoCompletionDings()
      }, PPT_BELOW_AVG_ALERT_DEBOUNCE_MS)
    } else {
      setPptBelowAvgAlertOpen(false)
    }
  }

  const updateTrial = (value: string) => {
    setTrialRaw(value)
    onChange({ ...input, trialConversions: parseOptionalInt(value) })
  }

  return (
    <>
    <div className="slot-planner-stack">
      <section className="card slot-planner-panel slot-planner-panel--peak slot-planner-planner">
        <div className="slot-planner-panel-head">
          <div>
            <span className="slot-planner-section-eyebrow">Income goal</span>
            <h3 className="slot-planner-panel-title">Target Monthly Income Planner</h3>
          </div>
          <span className="chip chip--peak">Plan first</span>
        </div>
        <p className="slot-planner-kicker">Start with the monthly income you want, then check whether your open slots can support it.</p>
        <p className="slot-planner-tier-line">
          <strong>Active tier</strong> · {tierLabel} <span className="slot-planner-tier-note">(system)</span>
        </p>

        <div className="slot-planner-fields">
          <label
            className={`slot-planner-field slot-planner-field--full slot-planner-field--target-income${targetIncomeGuidePulse ? ' slot-planner-field--guide-pulse' : ''}`}
          >
            <span className="slot-planner-field-label">Target Monthly Income ($)</span>
            <input
              className="slot-planner-input"
              type="number"
              min={0}
              step={50}
              value={input.targetMonthlyIncome || ''}
              onChange={(e) => {
                updateTarget(e.target.value)
                onTargetIncomeGuideInteract?.()
              }}
              onFocus={() => onTargetIncomeGuideInteract?.()}
            />
          </label>
          <div className="slot-planner-form-row">
            <div className="slot-planner-field slot-planner-field--ppt-guide">
              <div className="slot-planner-field-label-row">
                <span className="slot-planner-field-label" id="slot-ppt-field-label">
                  Plan to Open PPT Slots
                </span>
                <button
                  type="button"
                  className={`slot-booking-guide-trigger${bookingGuideOpen ? ' slot-booking-guide-trigger--open' : ' slot-booking-guide-trigger--pulse'}`}
                  aria-expanded={bookingGuideOpen}
                  aria-controls={BOOKING_GUIDE_PANEL_ID}
                  onClick={() => setBookingGuideOpen((open) => !open)}
                >
                  <span className="slot-booking-guide-trigger__dot" aria-hidden />
                  <span className="slot-booking-guide-trigger__text">
                    {bookingGuideOpen ? 'Hide Guide' : 'View Guide'}
                  </span>
                  <svg
                    className="slot-booking-guide-trigger__chevron"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    aria-hidden
                  >
                    <path
                      d="M3.5 5.25L7 8.75l3.5-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <span className="slot-planner-field-hint">Optional · max 120 · tap guide for booking tips</span>
              {bookingGuideOpen ? <PptBookingGuideCard onClose={() => setBookingGuideOpen(false)} /> : null}
              <input
                className="slot-planner-input"
                type="number"
                min={0}
                max={MONTHLY_PPT_SLOT_MAX}
                placeholder="0"
                value={pptRaw}
                onChange={(e) => updatePpt(e.target.value)}
                aria-labelledby="slot-ppt-field-label"
              />
            </div>
          </div>
          <details className="slot-planner-optional-details">
            <summary className="slot-planner-optional-summary">
              <span>Optional incentives</span>
              <small>Trial conversion +$5 each</small>
            </summary>
            <label className="slot-planner-field slot-planner-field--trial">
              <span className="slot-planner-field-label">Trial Conversion Incentive</span>
              <span className="slot-planner-field-hint">Optional · +$5 each</span>
              <input
                className="slot-planner-input"
                type="number"
                min={0}
                placeholder="0"
                value={trialRaw}
                onChange={(e) => updateTrial(e.target.value)}
              />
            </label>
          </details>
        </div>

        <div className="slot-planner-results slot-planner-results--peak" aria-live="polite">
          <div className="slot-planner-goal-summary">
            <span className="slot-planner-goal-summary__label">To reach {targetIncomeLabel}/month</span>
            <strong>{plan.requiredTotalCompletedSlots} completed slots</strong>
            <span>with about {plan.recommendedTotalOpenSlots} open slots planned.</span>
          </div>
          <div className="slot-planner-compact-breakdown" aria-label="Recommended open slot breakdown">
            <span>
              <em>{pptOpenMetricLabel}</em>
              <strong>{plan.recommendedPptOpenSlots}</strong>
            </span>
            <span>
              <em>Non-PPT open</em>
              <strong>{plan.recommendedNonPptOpenSlots}</strong>
            </span>
            <span>
              <em>Total open</em>
              <strong>{plan.recommendedTotalOpenSlots}</strong>
            </span>
          </div>
        </div>
        <ol className="slot-planner-action-path" aria-label="Income planning sequence">
          <li>Set income target</li>
          <li>Open enough PPT and non-PPT slots</li>
          <li>Complete training steps that unlock stronger booking chances</li>
        </ol>
        <small className="slot-planner-footnote">Estimate only. Final pay is based on the official statement.</small>
      </section>

      <section className="card slot-planner-panel slot-planner-panel--tips" aria-label="Extra income and growth tips">
        <details className="slot-planner-tips-details">
          <summary className="slot-planner-tips-summary">
            <span className="slot-planner-panel-title slot-planner-panel-title--tips">More to Earn</span>
            <small>Extra income opportunities</small>
          </summary>
          <ul className="slot-planner-tip-cards">
            <li className="slot-planner-tip-card">
              <strong>PB / JG / LR classes are 50mins: +$4 each</strong>
            </li>
            <li className="slot-planner-tip-card">
              <strong>Short-notice completed slots (booked within 24h of class time): +$2 each</strong>
            </li>
            <li className="slot-planner-tip-card">
              <strong>Refer 1 new teacher who starts teaching: +$100</strong>
            </li>
            <li className="slot-planner-tip-card">
              <strong>
                After teaching for 2 contract periods, you may join more special projects and become a Mentor from the 3rd
                contract period
              </strong>
            </li>
          </ul>
        </details>
      </section>
    </div>
    <PptBelowAverageAlert open={pptBelowAvgAlertOpen} onClose={() => setPptBelowAvgAlertOpen(false)} />
    </>
  )
}
