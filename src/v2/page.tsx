import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import {
  BONUS_CELEBRATION_PRIMARY,
  ONBOARDING_BONUS_TASK_THRESHOLD,
  SUMMIT_FINAL_CELEBRATION_LINE,
  countCompletedInDashboard,
  pickLevel1Toast,
  pickLevel2Toast,
  resolveCelebrationLevel,
} from './celebration/resolveCelebration'
import { DashboardLayout } from './DashboardLayout'
import { playCompletionFeedback } from './sounds/playTaskCompletionSound'
import {
  cloneDemoDashboardFromSeed,
  createFreshDashboardForTeacher,
  hotTasks,
  rewardThreshold,
} from './data'
import {
  DEFAULT_TARGET_INCOME_PLANNER,
  EMPTY_TARGET_INCOME_PLANNER,
  TargetIncomePlannerPanel,
  type TargetIncomePlannerInput,
} from './components/left'
import { PageHeader } from './components/PageHeader'
import { StickyGuideBar, type GuideBarMode } from './components/StickyGuideBar'
import { StepMapSection } from './components/stepMap'
import { NodeDetailDrawer } from './components/nodeDrawer'
import { HonorWallPanel } from './components/HonorWallPanel'
import {
  MoreActionsAccordion,
  NextStepPanel,
  QuickLinksAccordion,
  RewardStatusPanel,
} from './components/right'
import {
  DEFAULT_TASK_BOOKING_POLICY,
  type MockBookingRecord,
  type TaskBookingPolicy,
  type WorkshopBookingRecord,
  policyAfterBook,
  policyAfterCancel,
} from './booking/bookingPolicy'
import { WorkshopBookingOverlay } from './workshop/WorkshopBookingOverlay'
import { mergeWorkshopBookings, normalizeWorkshopBooking, isPriorityMapTaskNodeId } from './workshop/workshopBookingRules'
import { workshopStepBadgeCount } from './booking/stepCompletion'
import { MockBookingOverlay } from './mock/MockBookingOverlay'
import { CelebrationLayer, type ActiveCelebration } from './components/CelebrationLayer'
import { LearningOverlay } from './learning/LearningOverlay'
import type { LearningRoute } from './learning/types'
import { nodeHasLearningMaterial } from './learning/types'
import {
  calcGrowthScore,
  calcProgress,
  getBestNextTrainingNode,
  getDrawerNextRecommendation,
  getNextTrainingNodes,
  isPreSummitPathComplete,
} from './utils'
import { formatTierLabel, resolveTierFromCumulativeCompletions } from './tierIncentive'
import type { FlowNode, TeacherSnapshot } from './types'
import { getOnboardingBonusDaysRemaining, resetOnboardingBonusWindow } from './onboardingBonus'
import { isLaunchGuideDoneInSession, markLaunchGuideDoneInSession } from './launchGuideSession'

/** Top sticky guide bar — single coaching line (replaces dynamic next-step / reward copy). */
const STICKY_GUIDE_BAR_MESSAGE =
  'Open more PPT slots, complete all training tasks efficiently, and reach your monthly income goal faster.'

interface DashboardState {
  teacher: TeacherSnapshot
  main: FlowNode[]
  branch: FlowNode[]
  summit: FlowNode
}

type LaunchGuidePhase = 'income' | 'map' | 'right' | 'income-target' | 'done'

export interface TeacherTrainingDashboardV2Props {
  demoTeacherId: string
  onBackToPortal?: () => void
  onResetDemo?: () => void
}

export function TeacherTrainingDashboardV2({
  demoTeacherId,
  onBackToPortal,
  onResetDemo,
}: TeacherTrainingDashboardV2Props) {
  const [dash, setDash] = useState<DashboardState>(() => {
    const seed = cloneDemoDashboardFromSeed(demoTeacherId)
    return { teacher: seed.teacher, main: seed.mainFlow, branch: seed.branchFlow, summit: seed.peakSummit }
  })
  const [plannerInput, setPlannerInput] = useState(DEFAULT_TARGET_INCOME_PLANNER)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [learningRoute, setLearningRoute] = useState<LearningRoute | null>(null)
  const [launchGuidePhase, setLaunchGuidePhase] = useState<LaunchGuidePhase>(() =>
    isLaunchGuideDoneInSession() ? 'done' : 'income',
  )
  const [celebration, setCelebration] = useState<ActiveCelebration | null>(null)
  const [honorCelebrateNodeId, setHonorCelebrateNodeId] = useState<string | null>(null)
  const [workshopBookingNodeId, setWorkshopBookingNodeId] = useState<string | null>(null)
  const [workshopBookings, setWorkshopBookings] = useState<WorkshopBookingRecord[]>([])
  const [mockBookings, setMockBookings] = useState<MockBookingRecord[]>([])
  const [taskBookingPolicies, setTaskBookingPolicies] = useState<Record<string, TaskBookingPolicy>>({})
  const [mockBookingNodeId, setMockBookingNodeId] = useState<string | null>(null)

  const bookedWorkshopSessionIds = useMemo(
    () => workshopBookings.map((b) => b.sessionId),
    [workshopBookings],
  )
  const bookedMockSlotIds = useMemo(() => mockBookings.map((b) => b.slotId), [mockBookings])

  const finishLaunchGuide = useCallback(() => {
    setLaunchGuidePhase('done')
    markLaunchGuideDoneInSession()
  }, [])

  useEffect(() => {
    if (isLaunchGuideDoneInSession()) return
    const spotlightMs = 1350
    const toMap = window.setTimeout(() => setLaunchGuidePhase('map'), spotlightMs)
    const toRight = window.setTimeout(() => setLaunchGuidePhase('right'), spotlightMs * 2)
    const toIncomeTarget = window.setTimeout(() => setLaunchGuidePhase('income-target'), spotlightMs * 3)
    return () => {
      window.clearTimeout(toMap)
      window.clearTimeout(toRight)
      window.clearTimeout(toIncomeTarget)
    }
  }, [])

  useEffect(() => {
    if (launchGuidePhase !== 'income-target') return
    const fallback = window.setTimeout(finishLaunchGuide, 12000)
    return () => window.clearTimeout(fallback)
  }, [launchGuidePhase, finishLaunchGuide])

  const handlePlannerChange = useCallback(
    (next: TargetIncomePlannerInput) => {
      setPlannerInput(next)
      if (launchGuidePhase === 'income-target') finishLaunchGuide()
    },
    [launchGuidePhase, finishLaunchGuide],
  )

  const handleTargetIncomeGuideInteract = useCallback(() => {
    if (launchGuidePhase === 'income-target') finishLaunchGuide()
  }, [launchGuidePhase, finishLaunchGuide])

  const dismissCelebration = useCallback(() => setCelebration(null), [])

  useEffect(() => {
    if (!celebration || celebration.level !== 3) return
    document.documentElement.classList.add('celebrate-bonus-unlock')
    return () => {
      document.documentElement.classList.remove('celebrate-bonus-unlock')
    }
  }, [celebration])

  const salaryTier = resolveTierFromCumulativeCompletions(dash.teacher.completedClassesUntilCutoff)
  const tierLabel = formatTierLabel(salaryTier)

  const allNodes = useMemo(() => [...dash.main, dash.summit, ...dash.branch], [dash.main, dash.summit, dash.branch])
  const allMainNodes = dash.main
  const summitNode = dash.summit

  /** One-time subtle scroll if map footer sits slightly below the fold (short laptop viewports). */
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (window.sessionStorage.getItem('v213ViewportNudgeDone') === '1') return
    } catch {
      return
    }
    const id = window.requestAnimationFrame(() => {
      const footer = document.querySelector('.map-progress-footer-v212')
      if (!footer) return
      const bottom = footer.getBoundingClientRect().bottom
      const vh = window.innerHeight
      if (bottom <= vh + 1) {
        try {
          window.sessionStorage.setItem('v213ViewportNudgeDone', '1')
        } catch {
          /* ignore */
        }
        return
      }
      const overflow = bottom - vh
      const nudge = Math.min(28, Math.max(0, overflow))
      if (nudge > 0) {
        window.scrollBy({ top: nudge, left: 0, behavior: 'instant' as ScrollBehavior })
      }
      try {
        window.sessionStorage.setItem('v213ViewportNudgeDone', '1')
      } catch {
        /* ignore */
      }
    })
    return () => window.cancelAnimationFrame(id)
  }, [])

  const growthScore = calcGrowthScore(allNodes)
  const mainProgress = calcProgress(allMainNodes)
  const totalProgress = calcProgress(allNodes)
  const completedTasks = allNodes.filter((n) => n.status === 'completed').length
  const totalTasks = allNodes.length
  const top30Gap = Math.max(rewardThreshold - growthScore, 0)
  const isTop30 = top30Gap === 0

  const bestNext = useMemo(() => getBestNextTrainingNode(allNodes), [allNodes])
  const nextThree = useMemo(() => getNextTrainingNodes(allNodes, 3), [allNodes])
  const primaryNext = nextThree[0] ?? null
  const secondaryNext = nextThree.slice(1)

  const selectedNode = activeNodeId ? allNodes.find((n) => n.id === activeNodeId) ?? null : null
  const drawerNext = activeNodeId ? getDrawerNextRecommendation(allNodes, activeNodeId) : ''

  const onboardingBonusDaysLeft = useMemo(
    () => getOnboardingBonusDaysRemaining(dash.teacher.teacherId),
    [dash.teacher.teacherId],
  )

  const guide = useMemo(
    () => ({
      mode: 'default' as GuideBarMode,
      message: STICKY_GUIDE_BAR_MESSAGE,
    }),
    [],
  )

  const handleRenameTeacher = useCallback((nextTrimmedName: string) => {
    const fresh = createFreshDashboardForTeacher(nextTrimmedName)
    resetOnboardingBonusWindow(fresh.teacher.teacherId)
    setDash({
      teacher: fresh.teacher,
      main: fresh.mainFlow,
      branch: fresh.branchFlow,
      summit: fresh.peakSummit,
    })
    setPlannerInput(EMPTY_TARGET_INCOME_PLANNER)
    setActiveNodeId(null)
    setLearningRoute(null)
    setCelebration(null)
  }, [])

  const markNodeCompleted = useCallback((nodeId: string) => {
    setDash((d) => {
      const target =
        d.main.find((n) => n.id === nodeId) ?? d.branch.find((n) => n.id === nodeId) ?? (d.summit.id === nodeId ? d.summit : null)
      if (!target || target.status === 'completed') return d

      const prevCompleted = countCompletedInDashboard(d.main, d.branch, d.summit)

      const nextMain = d.main.map((n) => (n.id === nodeId ? { ...n, status: 'completed' as const } : n))
      const nextBranch = d.branch.map((n) => (n.id === nodeId ? { ...n, status: 'completed' as const } : n))
      let nextSummit = d.summit.id === nodeId ? { ...d.summit, status: 'completed' as const } : d.summit
      const dinoDone = nextBranch.filter((n) => n.group === 'dino' && n.status === 'completed').length
      const pathNodes = [...nextMain, ...nextBranch, nextSummit]
      if (nextSummit.status === 'not_started' && isPreSummitPathComplete(pathNodes)) {
        nextSummit = { ...nextSummit, status: 'in_progress' as const }
      }
      const nextD: DashboardState = {
        ...d,
        main: nextMain,
        branch: nextBranch,
        summit: nextSummit,
        teacher: { ...d.teacher, dinoModulesCompleted: dinoDone },
      }

      const nextCompleted = countCompletedInDashboard(nextD.main, nextD.branch, nextD.summit)

      setHonorCelebrateNodeId(nodeId)

      queueMicrotask(() => {
        const hitSevenMilestone =
          nextCompleted >= ONBOARDING_BONUS_TASK_THRESHOLD && prevCompleted < ONBOARDING_BONUS_TASK_THRESHOLD
        playCompletionFeedback({
          hitSevenMilestone,
          isPeakSummit: nodeId === 'peak-summit',
        })
        if (nodeId === 'peak-summit') {
          if (nextCompleted >= 7 && prevCompleted < 7) {
            setCelebration({
              level: 3,
              nodeId,
              toastPrimary: BONUS_CELEBRATION_PRIMARY,
            })
          } else {
            setCelebration({
              level: 4,
              nodeId,
              toastPrimary: SUMMIT_FINAL_CELEBRATION_LINE,
            })
          }
          return
        }

        const level = resolveCelebrationLevel({ prevCompleted, nextCompleted, nodeId })

        if (level === 3) {
          setCelebration({
            level: 3,
            nodeId,
            toastPrimary: BONUS_CELEBRATION_PRIMARY,
          })
        } else if (level === 2) {
          setCelebration({ level: 2, nodeId, toastPrimary: pickLevel2Toast() })
        } else {
          setCelebration({ level: 1, nodeId, toastPrimary: pickLevel1Toast() })
        }
      })

      return nextD
    })
  }, [])

  /** Map / list selection: first tap moves a task from Not started → In progress (circles + drawer reflect this). */
  const bumpNodeToInProgress = useCallback((nodeId: string) => {
    setDash((d) => {
      const bump = (n: FlowNode) =>
        n.id === nodeId && n.status === 'not_started' ? { ...n, status: 'in_progress' as const } : n

      let nextSummit = d.summit
      if (d.summit.id === nodeId) {
        const coreStairDone = d.main.every((m) => m.status === 'completed')
        if (coreStairDone && d.summit.status === 'not_started') {
          nextSummit = { ...d.summit, status: 'in_progress' as const }
        }
      }

      return {
        ...d,
        main: d.main.map(bump),
        branch: d.branch.map(bump),
        summit: nextSummit,
      }
    })
  }, [])

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      dismissCelebration()
      bumpNodeToInProgress(nodeId)
      setActiveNodeId(nodeId)
    },
    [bumpNodeToInProgress, dismissCelebration],
  )

  const openTraining = useCallback(
    (nodeId: string) => {
      dismissCelebration()
      bumpNodeToInProgress(nodeId)
      const node = allNodes.find((n) => n.id === nodeId)
      if (!node) return
      const route = nodeHasLearningMaterial(node)
      if (route) setLearningRoute(route)
    },
    [allNodes, bumpNodeToInProgress, dismissCelebration],
  )

  const openWorkshopBooking = useCallback(
    (nodeId: string) => {
      dismissCelebration()
      bumpNodeToInProgress(nodeId)
      setWorkshopBookingNodeId(nodeId)
    },
    [bumpNodeToInProgress, dismissCelebration],
  )

  const closeWorkshopBooking = useCallback(() => {
    setWorkshopBookingNodeId(null)
    setActiveNodeId(null)
  }, [])

  const openMockBooking = useCallback(
    (nodeId: string) => {
      dismissCelebration()
      bumpNodeToInProgress(nodeId)
      setMockBookingNodeId(nodeId)
    },
    [bumpNodeToInProgress, dismissCelebration],
  )

  const closeMockBooking = useCallback(() => {
    setMockBookingNodeId(null)
    setActiveNodeId(null)
  }, [])

  const handleWorkshopSessionsBooked = useCallback((sessionIds: string[]) => {
    setWorkshopBookings((prev) => mergeWorkshopBookings(prev, sessionIds))
    setTaskBookingPolicies((prev) => {
      const next = { ...prev }
      for (const sessionId of sessionIds) {
        const record = normalizeWorkshopBooking({ sessionId, nodeId: '' })
        const nodeId = record.nodeId
        if (isPriorityMapTaskNodeId(nodeId)) {
          next[nodeId] = policyAfterBook(nodeId, prev)
        }
      }
      return next
    })
  }, [])

  const handleWorkshopBookingCancel = useCallback((sessionId: string) => {
    setWorkshopBookings((prev) => {
      const record = prev.find((b) => b.sessionId === sessionId)
      if (!record) return prev
      const normalized = normalizeWorkshopBooking(record)
      if (isPriorityMapTaskNodeId(normalized.nodeId)) {
        setTaskBookingPolicies((policies) => ({
          ...policies,
          [normalized.nodeId]: policyAfterCancel(policies[normalized.nodeId] ?? DEFAULT_TASK_BOOKING_POLICY),
        }))
      }
      return prev.filter((b) => b.sessionId !== sessionId)
    })
  }, [])

  const handleMockSlotsBooked = useCallback((slotIds: string[], nodeId: string) => {
    setMockBookings((prev) => {
      const withoutNode = prev.filter((b) => b.nodeId !== nodeId)
      return [...withoutNode, ...slotIds.map((slotId) => ({ slotId, nodeId }))]
    })
    setTaskBookingPolicies((prev) => ({
      ...prev,
      [nodeId]: policyAfterBook(nodeId, prev),
    }))
  }, [])

  const handleMockBookingCancel = useCallback((slotId: string) => {
    setMockBookings((prev) => {
      const record = prev.find((b) => b.slotId === slotId)
      if (!record) return prev
      setTaskBookingPolicies((policies) => ({
        ...policies,
        [record.nodeId]: policyAfterCancel(policies[record.nodeId] ?? DEFAULT_TASK_BOOKING_POLICY),
      }))
      return prev.filter((b) => b.slotId !== slotId)
    })
  }, [])

  const workshopBookedCounts = useMemo(
    () => ({
      step4: workshopStepBadgeCount(4, workshopBookings, taskBookingPolicies),
      step5: workshopStepBadgeCount(5, workshopBookings, taskBookingPolicies),
    }),
    [workshopBookings, taskBookingPolicies],
  )

  const mockBookedCount = bookedMockSlotIds.length

  const learningCompleted = useMemo(() => {
    if (!learningRoute) return false
    const n = allNodes.find((x) => x.id === learningRoute.nodeId)
    return n?.status === 'completed'
  }, [learningRoute, allNodes])

  const assetBase = typeof window !== 'undefined' ? window.location.href.split('#')[0] : ''

  const dinoBranchTotal = useMemo(() => dash.branch.filter((n) => n.group === 'dino').length, [dash.branch])
  const dinoDoneCount = allNodes.filter((n) => n.group === 'dino' && n.status === 'completed').length

  const incomeSpotlight = launchGuidePhase === 'income'
  const mapSpotlight = launchGuidePhase === 'map'
  const rightSpotlight = launchGuidePhase === 'right'
  const targetIncomeGuidePulse = launchGuidePhase === 'income-target'
  const showGuideHint =
    launchGuidePhase === 'income' ||
    launchGuidePhase === 'map' ||
    launchGuidePhase === 'right' ||
    launchGuidePhase === 'income-target'

  const handleResetDemoClick = () => {
    if (onResetDemo) onResetDemo()
  }

  return (
    <div className="v2-page v2-page--v213">
      <StickyGuideBar mode={guide.mode} message={guide.message} />

      <div className="v2-page-body">
        <div className="launch-map-utility-row" aria-label="Demo navigation">
          <div className="launch-map-utility-spacer" />
          {onBackToPortal ? (
            <button type="button" className="launch-map-utility-link" onClick={onBackToPortal}>
              ← Teacher portal
            </button>
          ) : null}
          {onResetDemo ? (
            <button type="button" className="launch-map-utility-reset" onClick={handleResetDemoClick}>
              Reset demo
            </button>
          ) : null}
        </div>

        <PageHeader snapshot={dash.teacher} tierLabel={tierLabel} onRenameTeacher={handleRenameTeacher} />

        <DashboardLayout
          left={
            <div className={incomeSpotlight ? 'launch-guide-anchor launch-guide-anchor--on' : 'launch-guide-anchor'}>
              <TargetIncomePlannerPanel
                key={dash.teacher.teacherId}
                tierLabel={tierLabel}
                salaryTier={salaryTier}
                input={plannerInput}
                onChange={handlePlannerChange}
                targetIncomeGuidePulse={targetIncomeGuidePulse}
                onTargetIncomeGuideInteract={handleTargetIncomeGuideInteract}
              />
            </div>
          }
          center={
            <div className={mapSpotlight ? 'launch-guide-anchor launch-guide-anchor--on' : 'launch-guide-anchor'}>
              <StepMapSection
                mainNodes={allMainNodes}
                summitNode={summitNode}
                branchNodes={dash.branch}
                activeId={activeNodeId}
                onSelectNode={handleSelectNode}
                bestNextNode={bestNext}
                celebrationFlashNodeId={celebration?.nodeId ?? null}
                celebrationFlashLevel={celebration?.level ?? null}
                progressSummary={{
                  growthScore,
                  completedTasks,
                  totalTasks,
                  mainProgress,
                  totalProgress,
                  certificateDone: allNodes.filter((n) => n.group === 'certificate' && n.status === 'completed').length,
                  dinoDone: dinoDoneCount,
                  dinoTotal: dinoBranchTotal,
                  onboardingBonusDaysLeft,
                }}
                workshopBookedCounts={workshopBookedCounts}
                mockBookedCount={mockBookedCount}
                workshopBookings={workshopBookings}
                mockBookings={mockBookings}
                taskBookingPolicies={taskBookingPolicies}
              />
            </div>
          }
          right={
            <div className={rightSpotlight ? 'launch-guide-anchor launch-guide-anchor--on' : 'launch-guide-anchor'}>
              <HonorWallPanel
                nodes={allNodes}
                celebrateNodeId={honorCelebrateNodeId}
                taskProgress={{
                  completedTasks,
                  totalTasks,
                  mainProgress,
                  totalProgress,
                }}
              />
              <RewardStatusPanel isTop30={isTop30} gapPoints={top30Gap} simulationDelta={0} />
              <NextStepPanel primary={primaryNext} onSelectNode={handleSelectNode} mapBestNextId={bestNext?.id ?? null} />
              <MoreActionsAccordion items={secondaryNext} onSelectNode={handleSelectNode} />
              <QuickLinksAccordion tasks={hotTasks} onFocusTask={handleSelectNode} />
            </div>
          }
        />
      </div>

      <NodeDetailDrawer
        open={Boolean(selectedNode)}
        node={selectedNode}
        nextRecommendation={drawerNext}
        rewardGap={top30Gap}
        inRewardZone={isTop30}
        preSummitPathComplete={isPreSummitPathComplete(allNodes)}
        onClose={() => setActiveNodeId(null)}
        onMarkCompleted={(id) => {
          markNodeCompleted(id)
          setActiveNodeId(null)
        }}
        onOpenTraining={openTraining}
        onOpenWorkshopBooking={openWorkshopBooking}
        onOpenMockBooking={openMockBooking}
      />

      {workshopBookingNodeId ? (
        <WorkshopBookingOverlay
          sourceNodeId={workshopBookingNodeId}
          workshopBookings={workshopBookings}
          taskPolicies={taskBookingPolicies}
          bookedMockSlotIds={bookedMockSlotIds}
          onCompleteBooking={handleWorkshopSessionsBooked}
          onCancelBooking={handleWorkshopBookingCancel}
          onClose={closeWorkshopBooking}
        />
      ) : null}

      {mockBookingNodeId ? (
        <MockBookingOverlay
          sourceNodeId={mockBookingNodeId}
          mockBookings={mockBookings}
          taskPolicies={taskBookingPolicies}
          bookedWorkshopSessionIds={bookedWorkshopSessionIds}
          onCompleteBooking={handleMockSlotsBooked}
          onCancelBooking={handleMockBookingCancel}
          onClose={closeMockBooking}
        />
      ) : null}

      {learningRoute ? (
        <LearningOverlay
          route={learningRoute}
          assetBase={assetBase}
          completed={learningCompleted}
          onClose={() => setLearningRoute(null)}
          onMarkCompleted={markNodeCompleted}
        />
      ) : null}

      <CelebrationLayer active={celebration} onDismiss={dismissCelebration} />

      {showGuideHint ? (
        <div className="launch-guide-hint-wrap" role="status" aria-live="polite">
          <p className="launch-guide-hint">
            {launchGuidePhase === 'income'
              ? "Start here: estimate this month's earning potential."
              : launchGuidePhase === 'map'
                ? 'Then follow your training path step by step.'
                : launchGuidePhase === 'right'
                  ? 'Track your next step, rewards, and quick actions on the right.'
                  : 'Enter your target monthly income to see required slots to complete and open.'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
