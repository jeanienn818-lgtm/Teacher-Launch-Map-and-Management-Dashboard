import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { FlowNode } from '../types'
import {
  classifyStepVisualState,
  isNodeCompleteForStepCard,
  isNodeInProgressOnMap,
} from '../booking/stepCompletion'
import type { MockBookingRecord, TaskBookingPolicy, WorkshopBookingRecord } from '../booking/bookingPolicy'
import { workshopBookedCountLabel } from '../workshop/workshopSessions'
import { mockBookedCountLabel } from '../mock/mockSlots'
import { buildFullGridFlowPathD, buildPartialGridFlowPathD, gridAreaName } from '../gridMapLayout'
import { computeTooltipPlacement } from '../mapTooltip'
import { isPreSummitPathComplete, toStatusText } from '../utils'

const MAIN_STEP_CATEGORIES = [
  'Basic Certificate',
  'Advanced Certificate',
  'Trial Mock',
  'Workshop1',
  'Workshop2',
] as const

const SUMMIT_CATEGORY = 'Peak Summit'

const STEP_COUNT = 6
const INCOMPLETE_STEP_FOCUS_SHAKE_MS = 5000

const TIP_W = 236
const TIP_H = 118

const STEP_INCOME_IMPACTS = [
  'Earn the basic certificate needed to start teaching eligible classes.',
  'Add in-demand certificates so more student requests can match your profile.',
  'Practice trial-class delivery to improve conversion into regular students.',
  'Learn booking habits that protect steady weekly student demand.',
  'Sharpen time management and regular-student routines for higher slot fill.',
  'Prepare for peak-time performance and long-term growth opportunities.',
] as const

function mainPathCircleClass(done: boolean, doing: boolean): string {
  const base = 'map-hotspot-circle map-hotspot-circle--v28 map-path-circle'
  if (done) return `${base} map-path-circle--v212-main-done`
  if (doing) return `${base} map-path-circle--v212-main-doing`
  return `${base} map-path-circle--v212-main-todo`
}

function summitPathCircleClass(opts: { done: boolean; unlocked: boolean; inProgress: boolean }): string {
  const base = 'map-hotspot-circle map-hotspot-circle--summit map-hotspot-circle--v28 map-path-circle'
  const { done, unlocked, inProgress } = opts
  if (done) return `${base} map-path-circle--v212-main-done`
  if (!unlocked) return `${base} map-path-circle--v212-summit-locked`
  if (inProgress) return `${base} map-path-circle--v212-main-doing`
  return `${base} map-path-circle--v212-main-todo`
}

function branchPathCircleClass(done: boolean, doing: boolean): string {
  const base = 'map-hotspot-circle map-hotspot-circle--branch map-hotspot-circle--v28-branch map-path-circle'
  if (done) return `${base} map-path-circle--v212-branch-done`
  if (doing) return `${base} map-path-circle--v212-branch-doing`
  return `${base} map-path-circle--v212-branch-todo`
}

function StepCompletionFlag() {
  const uid = useId().replace(/:/g, '')
  const gid = `mapFlagFillSketch-${uid}`
  return (
    <span className="map-flag-icon-v28 map-flag-icon--sketch" aria-hidden>
      <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
        <defs>
          <linearGradient id={gid} x1="4" y1="3" x2="16" y2="15" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fed7aa" />
            <stop offset="0.45" stopColor="#fb923c" />
            <stop offset="1" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <path
          d="M3.2 2.2c0.35 0.4 0.25 4.1 0.35 7.9 0.05 1.9 0.1 3.8 0.15 5.7"
          stroke="#7c2d12"
          strokeWidth="1.15"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M4.1 4.4c2.1-0.9 4.4-1.1 6.5-0.35 1.4 0.45 2.7 1.15 3.9 2.05 0.55 0.45 1.05 0.95 1.45 1.55-1.95 0.55-3.95 0.35-5.85-0.25-1.25-0.35-2.45-0.85-3.55-1.45-0.65-0.35-1.25-0.75-1.85-1.15 0.15-0.45 0.35-0.85 0.55-1.25z"
          fill={`url(#${gid})`}
          stroke="#9a3412"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
        <path
          d="M5.2 5.1c1.8 0.35 3.65 0.55 5.45 0.45"
          stroke="rgba(124,45,18,0.35)"
          strokeWidth="0.45"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  )
}

function GridStartBadge() {
  return (
    <span className="summit-grid-badge summit-grid-badge--start" aria-hidden>
      START HERE
    </span>
  )
}

function StepCardDoneBadge() {
  return (
    <span className="map-step-card__done-badge" aria-label="Step completed" title="Step completed">
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
        <path
          d="M5 10.2 8.1 13.3 15 6.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function GridEndBadge() {
  return (
    <span className="summit-grid-badge summit-grid-badge--end" aria-hidden>
      END HERE
    </span>
  )
}

export interface StepMapProgressSummary {
  growthScore: number
  completedTasks: number
  totalTasks: number
  mainProgress: number
  totalProgress: number
  certificateDone: number
  dinoDone: number
  dinoTotal: number
  onboardingBonusDaysLeft: number
}

export interface StepMapWorkshopBookedCounts {
  step4: number
  step5: number
}

interface StepMapSectionProps {
  mainNodes: FlowNode[]
  summitNode: FlowNode
  branchNodes: FlowNode[]
  activeId: string | null
  onSelectNode: (id: string) => void
  bestNextNode: FlowNode | null
  progressSummary?: StepMapProgressSummary | null
  workshopBookedCounts?: StepMapWorkshopBookedCounts
  mockBookedCount?: number
  workshopBookings?: WorkshopBookingRecord[]
  mockBookings?: MockBookingRecord[]
  taskBookingPolicies?: Record<string, TaskBookingPolicy>
  celebrationFlashNodeId?: string | null
  celebrationFlashLevel?: 1 | 2 | 3 | 4 | null
}

export function StepMapSection({
  mainNodes,
  summitNode,
  branchNodes,
  activeId,
  onSelectNode,
  bestNextNode,
  progressSummary = null,
  workshopBookedCounts = { step4: 0, step5: 0 },
  mockBookedCount = 0,
  workshopBookings = [],
  mockBookings = [],
  taskBookingPolicies = {},
  celebrationFlashNodeId = null,
  celebrationFlashLevel = null,
}: StepMapSectionProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<{ node: FlowNode; left: number; top: number } | null>(null)
  const [hoveredStepIndex, setHoveredStepIndex] = useState<number | null>(null)

  const recommendedId = bestNextNode?.id ?? null
  const summitDone = summitNode.status === 'completed'
  const summitUnlocked = useMemo(
    () => isPreSummitPathComplete([...mainNodes, ...branchNodes]),
    [mainNodes, branchNodes],
  )

  const mainNextIndex = useMemo(() => mainNodes.findIndex((n) => n.status !== 'completed'), [mainNodes])

  const fullPathD = useMemo(() => buildFullGridFlowPathD(), [])
  const partialPathD = useMemo(() => {
    const endIdx = mainNextIndex === -1 ? 5 : mainNextIndex - 1
    return buildPartialGridFlowPathD(endIdx)
  }, [mainNextIndex])

  const branchById = useMemo(() => new Map(branchNodes.map((n) => [n.id, n])), [branchNodes])
  const branchSuggestedMocks = useMemo(() => {
    const m = branchById
    return ['mock-lv46'].map((id) => m.get(id)).filter((n): n is FlowNode => Boolean(n))
  }, [branchById])
  const dinoAboveStep1 = useMemo(() => {
    const m = branchById
    return ['dino-profile-avatar-matters'].map((id) => m.get(id)).filter((n): n is FlowNode => Boolean(n))
  }, [branchById])
  const dinoAboveStep2 = useMemo(() => {
    const m = branchById
    return ['dino-tpr', 'dino-classroom-function'].map((id) => m.get(id)).filter((n): n is FlowNode => Boolean(n))
  }, [branchById])
  const workshopsAboveStep4 = useMemo(() => {
    const m = branchById
    return ['branch-ws-regular-students'].map((id) => m.get(id)).filter((n): n is FlowNode => Boolean(n))
  }, [branchById])
  const workshopAboveStep5 = useMemo(() => {
    const m = branchById
    return ['branch-ws-regular-bookings'].map((id) => m.get(id)).filter((n): n is FlowNode => Boolean(n))
  }, [branchById])

  const stepNodesByIndex = useMemo(() => {
    const steps: FlowNode[][] = []
    for (let i = 0; i < STEP_COUNT; i++) {
      const nodes: FlowNode[] = []
      if (i < mainNodes.length && mainNodes[i]) nodes.push(mainNodes[i]!)
      if (i === 0) nodes.push(...dinoAboveStep1)
      if (i === 1) nodes.push(...dinoAboveStep2)
      if (i === 2) nodes.push(...branchSuggestedMocks)
      if (i === 3) nodes.push(...workshopsAboveStep4)
      if (i === 4) nodes.push(...workshopAboveStep5)
      if (i === 5) nodes.push(summitNode)
      steps.push(nodes)
    }
    return steps
  }, [
    mainNodes,
    summitNode,
    dinoAboveStep1,
    dinoAboveStep2,
    branchSuggestedMocks,
    workshopsAboveStep4,
    workshopAboveStep5,
  ])

  const stepVisualStates = useMemo(
    () =>
      stepNodesByIndex.map((nodes) =>
        classifyStepVisualState(nodes, workshopBookings, mockBookings, taskBookingPolicies),
      ),
    [stepNodesByIndex, workshopBookings, mockBookings, taskBookingPolicies],
  )

  const nodeDoneForStep = useCallback(
    (node: FlowNode) =>
      isNodeCompleteForStepCard(node, workshopBookings, mockBookings, taskBookingPolicies),
    [workshopBookings, mockBookings, taskBookingPolicies],
  )

  const nodeDoingOnMap = useCallback(
    (node: FlowNode) =>
      isNodeInProgressOnMap(node, workshopBookings, mockBookings, taskBookingPolicies),
    [workshopBookings, mockBookings, taskBookingPolicies],
  )

  /** Smallest step number among cards not fully completed (partial or all-todo). */
  const incompleteFocusStepIndex = useMemo(() => {
    const incomplete = stepVisualStates.flatMap((state, index) => (state !== 'all-done' ? [index] : []))
    if (incomplete.length === 0) return null
    return Math.min(...incomplete)
  }, [stepVisualStates])

  const [incompleteFocusPhase, setIncompleteFocusPhase] = useState<'shake' | 'breathe'>('shake')

  useEffect(() => {
    if (incompleteFocusStepIndex === null) return
    setIncompleteFocusPhase('shake')
    const timerId = window.setTimeout(() => setIncompleteFocusPhase('breathe'), INCOMPLETE_STEP_FOCUS_SHAKE_MS)
    return () => window.clearTimeout(timerId)
  }, [incompleteFocusStepIndex])

  const incompleteFocusAnimClass = (stepIndex: number): string => {
    if (stepIndex !== incompleteFocusStepIndex) return ''
    return incompleteFocusPhase === 'shake'
      ? ' map-step-card--focus-shake'
      : ' map-step-card--focus-breathe'
  }

  const stepCardStateClass = (stepIndex: number): string => {
    const state = stepVisualStates[stepIndex]
    const focus = incompleteFocusAnimClass(stepIndex)
    if (state === 'all-done') return 'map-step-card--state-all-done'
    if (state === 'all-todo') return `map-step-card--state-all-todo${focus}`
    return `map-step-card--state-partial${focus}`
  }

  const showTip = (node: FlowNode, el: HTMLElement) => {
    const shell = shellRef.current
    if (!shell) return
    const sr = shell.getBoundingClientRect()
    const br = el.getBoundingClientRect()
    const pos = computeTooltipPlacement(sr, br, TIP_W, TIP_H)
    setTip({ node, left: pos.left, top: pos.top })
  }

  const clearTip = () => setTip(null)

  const leaveMap = () => {
    setHoveredStepIndex(null)
    clearTip()
  }

  const isStepRevealed = (stepIndex: number) => hoveredStepIndex === stepIndex

  const celebrateClass = (nodeId: string) =>
    celebrationFlashNodeId && celebrationFlashLevel && celebrationFlashNodeId === nodeId
      ? ` map-hotspot--celebrate-flash map-hotspot--celebrate-flash--l${celebrationFlashLevel}`
      : ''

  const renderBranchButton = (n: FlowNode, stepIndex: number, slotClass = '') => {
    const done = nodeDoneForStep(n)
    const doing = nodeDoingOnMap(n)
    const rec = recommendedId === n.id
    return (
      <button
        key={n.id}
        type="button"
        className={`map-hotspot map-hotspot--branch map-hotspot--branch-v28 summit-grid-branch-hotspot ${slotClass} ${doing ? 'map-hotspot--pulse-branch' : ''} ${rec ? 'map-hotspot--best-next map-hotspot--best-next--branch' : ''} ${activeId === n.id ? 'map-hotspot--active' : ''}${celebrateClass(n.id)}`}
        onClick={() => onSelectNode(n.id)}
        onMouseEnter={(e) => {
          setHoveredStepIndex(stepIndex)
          showTip(n, e.currentTarget)
        }}
        onFocus={(e) => {
          setHoveredStepIndex(stepIndex)
          showTip(n, e.currentTarget)
        }}
        onBlur={clearTip}
      >
        {rec ? (
          <span className="map-best-next-pill map-best-next-pill--branch" aria-hidden>
            Best next
          </span>
        ) : null}
        <span className={branchPathCircleClass(done, doing)}>
          {done ? (
            <span className="map-hotspot-check map-hotspot-check--sm">✓</span>
          ) : doing ? (
            <span className="map-branch-breathe-dot" aria-hidden />
          ) : null}
        </span>
      </button>
    )
  }

  const renderMainTaskButton = (node: FlowNode, idx: number) => {
    const done = nodeDoneForStep(node)
    const doing = nodeDoingOnMap(node)
    const rec = recommendedId === node.id
    const isActive = activeId === node.id
    const mainPulse = !done
    return (
      <button
        key={`main-task-${node.id}`}
        type="button"
        className={`map-hotspot map-hotspot--main map-hotspot--v28 map-step-task-main summit-grid-main-hotspot ${mainPulse ? 'map-hotspot--pulse' : ''} ${rec ? 'map-hotspot--best-next' : ''} ${isActive ? 'map-hotspot--active' : ''}${celebrateClass(node.id)}`}
        onClick={() => onSelectNode(node.id)}
        onMouseEnter={(e) => {
          setHoveredStepIndex(idx)
          showTip(node, e.currentTarget)
        }}
        onFocus={(e) => {
          setHoveredStepIndex(idx)
          showTip(node, e.currentTarget)
        }}
        onBlur={clearTip}
      >
        <span className="map-main-stair-pack-v213 map-main-stair-pack-v213--task-only">
          {rec ? (
            <span className="map-main-stair-pack__pill" aria-hidden>
              <span className="map-best-next-pill map-best-next-pill--main">Best next</span>
            </span>
          ) : null}
          <span className="map-main-stair-pack__circle-slot">
            {done ? (
              <span className="map-main-stair-pack__flag map-stair-flag-wrap-v28" title="Step completed">
                <StepCompletionFlag />
              </span>
            ) : null}
            <span className={`map-main-stair-pack__circle ${mainPathCircleClass(done, doing)}`}>
              {done ? <span className="map-hotspot-check">✓</span> : null}
            </span>
          </span>
        </span>
      </button>
    )
  }

  const renderSummitTaskButton = () => (
    <button
      type="button"
      className={`map-hotspot map-hotspot--summit map-hotspot--summit-v28 map-hotspot--v28 map-step-task-main summit-grid-main-hotspot ${!summitDone ? 'map-hotspot--pulse' : ''} ${summitDone ? 'map-hotspot--summit-done' : summitUnlocked ? 'map-hotspot--summit-open' : 'map-hotspot--summit-locked'} ${recommendedId === summitNode.id ? 'map-hotspot--best-next' : ''} ${activeId === summitNode.id ? 'map-hotspot--active' : ''}${celebrateClass(summitNode.id)}`}
      onClick={() => onSelectNode(summitNode.id)}
      onMouseEnter={(e) => {
        setHoveredStepIndex(5)
        showTip(summitNode, e.currentTarget)
      }}
      onFocus={(e) => {
        setHoveredStepIndex(5)
        showTip(summitNode, e.currentTarget)
      }}
      onBlur={clearTip}
    >
      <span className="map-main-stair-pack-v213 map-main-stair-pack-v213--summit map-main-stair-pack-v213--task-only">
        {recommendedId === summitNode.id ? (
          <span className="map-main-stair-pack__pill" aria-hidden>
            <span className="map-best-next-pill map-best-next-pill--main">Best next</span>
          </span>
        ) : null}
        <span className="map-main-stair-pack__summit-wrap">
          <div className="map-summit-node-wrap-v212">
            <span className="map-summit-mark map-summit-mark--v28 map-summit-mark--v212" aria-hidden>
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                className="map-summit-trophy-svg"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-.88 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.45 1 .88 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </span>
            <span
              className={summitPathCircleClass({
                done: summitDone,
                unlocked: summitUnlocked,
                inProgress: summitNode.status === 'in_progress',
              })}
            >
              {summitDone ? <span className="map-hotspot-check map-hotspot-check--summit">✓</span> : null}
            </span>
          </div>
        </span>
      </span>
    </button>
  )

  const renderStepCell = (stepIndex: number) => {
    const revealed = isStepRevealed(stepIndex)
    const isSummit = stepIndex === 5
    const category = isSummit ? SUMMIT_CATEGORY : (MAIN_STEP_CATEGORIES[stepIndex] ?? 'Step')
    const mainNode = !isSummit ? mainNodes[stepIndex] : null
    const stepAllDone = stepVisualStates[stepIndex] === 'all-done'
    const stepStatusLabel = stepAllDone
      ? 'Completed'
      : stepVisualStates[stepIndex] === 'all-todo'
        ? 'To do'
        : 'In progress'
    const stepTaskCount = stepNodesByIndex[stepIndex]?.length ?? 0
    const workshopBookedLabel =
      stepIndex === 3
        ? workshopBookedCountLabel(workshopBookedCounts.step4)
        : stepIndex === 4
          ? workshopBookedCountLabel(workshopBookedCounts.step5)
          : ''
    const mockBookedLabel = stepIndex === 2 ? mockBookedCountLabel(mockBookedCount) : ''

    return (
      <div
        key={`grid-step-${stepIndex}`}
        className={`summit-grid-cell ${revealed ? 'summit-grid-cell--revealed' : ''} ${isSummit ? 'summit-grid-cell--summit' : ''}`}
        style={{ gridArea: gridAreaName(stepIndex) }}
        onMouseEnter={() => setHoveredStepIndex(stepIndex)}
      >
        {stepIndex === 0 ? <GridStartBadge /> : null}
        {stepIndex === 5 ? <GridEndBadge /> : null}

        <div
          className={`map-step-card summit-grid-card ${stepCardStateClass(stepIndex)} ${isSummit ? 'summit-grid-card--summit' : ''} ${revealed ? 'summit-grid-card--revealed' : ''}`}
        >
          <div className="summit-grid-card__header">
            <div className="map-step-card__topline">
              <span className="map-step-card__num">STEP {stepIndex + 1}</span>
              <span className="map-step-card__status">{stepStatusLabel}</span>
            </div>
            <span className="map-step-card__title">{category}</span>
            <span className="map-step-card__impact">{STEP_INCOME_IMPACTS[stepIndex]}</span>
            <span className="map-step-card__task-count">{stepTaskCount} task{stepTaskCount === 1 ? '' : 's'}</span>
            {mockBookedLabel ? (
              <span className="map-step-card__mock-booked">{mockBookedLabel}</span>
            ) : null}
            {workshopBookedLabel ? (
              <span className="map-step-card__workshop-booked">{workshopBookedLabel}</span>
            ) : null}
          </div>
          {stepAllDone ? <StepCardDoneBadge /> : null}

          {revealed ? (
            <div className="summit-grid-card__tasks" aria-hidden={false}>
              {(stepIndex === 0 && dinoAboveStep1.length > 0) ||
              (stepIndex === 1 && dinoAboveStep2.length > 0) ||
              (stepIndex === 2 && branchSuggestedMocks.length > 0) ||
              (stepIndex === 3 && workshopsAboveStep4.length > 0) ||
              (stepIndex === 4 && workshopAboveStep5.length > 0) ? (
                <div className="summit-grid-card__branch-row">
                  {stepIndex === 0
                    ? dinoAboveStep1.map((n) => renderBranchButton(n, 0, 'summit-grid-branch-hotspot--in-card'))
                    : null}

                  {stepIndex === 1 ? (
                    <>
                      <span className="branch-label branch-label--dino-v28 branch-label--dino-v210 branch-label--dino-v211 summit-grid-dino-label">
                        Dino U · Bonus
                      </span>
                      <div className="summit-grid-dino-row">
                        {dinoAboveStep2.map((n, i) =>
                          renderBranchButton(
                            n,
                            1,
                            i === 0 ? 'summit-grid-branch-hotspot--in-card-left' : 'summit-grid-branch-hotspot--in-card-right',
                          ),
                        )}
                      </div>
                    </>
                  ) : null}

                  {stepIndex === 2
                    ? branchSuggestedMocks.map((n) => (
                        <div key={n.id} className="summit-grid-mock-branch">
                          <span className="branch-label branch-label--mock-v28 branch-label--mock-v210">Optional mock</span>
                          {renderBranchButton(n, 2, 'summit-grid-branch-hotspot--in-card')}
                        </div>
                      ))
                    : null}

                  {stepIndex === 3
                    ? workshopsAboveStep4.map((n) => renderBranchButton(n, 3, 'summit-grid-branch-hotspot--in-card'))
                    : null}
                  {stepIndex === 4
                    ? workshopAboveStep5.map((n) => renderBranchButton(n, 4, 'summit-grid-branch-hotspot--in-card'))
                    : null}
                </div>
              ) : null}

              <div className="summit-grid-card__main-row">
                {mainNode ? renderMainTaskButton(mainNode, stepIndex) : null}
                {isSummit ? renderSummitTaskButton() : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <section className="step-map-section step-map-section--v28 step-map-section--v211 step-map-section--v212 step-map-section--grid-map">
      <header className="step-map-header step-map-header--v28">
        <div className="step-map-header-row">
          <div>
            <span className="step-map-eyebrow">Training path</span>
            <h2>6-Step Income Growth Path</h2>
          </div>
        </div>
        <p className="step-map-urgency-banner" role="status">
          Complete the right certificates, mocks, and workshops earlier to improve booking stability and move closer to your income goal.
        </p>
        <p className="step-map-dek-v28">
          Each step turns scattered training materials into one clear action path. Hover a card to see tasks, then click a circle to open details.
        </p>
        {progressSummary ? (
          <div className="map-top-progress-wrap-v214 map-top-progress-wrap-v214--bonus-only">
            <p className="map-top-progress-strip-v214 map-top-progress-strip-v214--bonus">
              <span className="map-top-progress-strip-v214__money">{progressSummary.onboardingBonusDaysLeft}</span>{' '}
              {progressSummary.onboardingBonusDaysLeft === 1 ? 'day' : 'days'} left before your{' '}
              <span className="map-top-progress-strip-v214__money">$15</span> onboarding training cash benefit
              expires — complete the new teacher tasks below to claim it.
            </p>
          </div>
        ) : null}
      </header>

      <div className="map-composition-v212">
        <div
          ref={shellRef}
          className="summit-grid-map-shell summit-grid-map-shell--v215"
          onMouseLeave={leaveMap}
        >
          <div className="summit-grid-map-bg" aria-hidden />
          <span className="summit-grid-deco summit-grid-deco--star" aria-hidden />
          <span className="summit-grid-deco summit-grid-deco--squiggle" aria-hidden />

          <svg className="summit-grid-flow-svg" viewBox="0 0 900 520" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id="gridPathGlowV215" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fdba74" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <marker id="gridArrowHeadV215" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#2c3e50" />
              </marker>
              <marker id="gridArrowHeadProgV215" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#ea580c" />
              </marker>
            </defs>
            {fullPathD ? (
              <path
                d={fullPathD}
                className="summit-grid-flow-path summit-grid-flow-path--base"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.45}
                markerEnd="url(#gridArrowHeadV215)"
              />
            ) : null}
            {partialPathD ? (
              <path
                d={partialPathD}
                className="summit-grid-flow-path summit-grid-flow-path--progress"
                fill="none"
                stroke="url(#gridPathGlowV215)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd="url(#gridArrowHeadProgV215)"
              />
            ) : null}
          </svg>

          <div className="summit-grid-map__stage">
            <div className="summit-grid-map__grid">{[0, 1, 2, 3, 4, 5].map(renderStepCell)}</div>
          </div>

          {tip ? (
            <div
              className="map-tooltip-float map-tooltip-float--v28"
              style={{ left: tip.left, top: tip.top, width: TIP_W }}
              role="tooltip"
            >
              <strong className="map-tooltip-float-title">{tip.node.title}</strong>
              <span className="map-tooltip-float-status">Status: {toStatusText(tip.node.status)}</span>
              <p className="map-tooltip-float-why">{tip.node.whyMatters ?? tip.node.description}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
