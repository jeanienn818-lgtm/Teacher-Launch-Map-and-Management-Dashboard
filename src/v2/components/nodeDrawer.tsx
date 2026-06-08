import type { FlowNode } from '../types'
import { StatusBadge } from './StatusBadge'
import { nodeHasLearningMaterial } from '../learning/types'

interface NodeDetailDrawerProps {
  open: boolean
  node: FlowNode | null
  nextRecommendation: string
  rewardGap: number
  inRewardZone: boolean
  preSummitPathComplete: boolean
  onClose: () => void
  /** Same as learning overlay: records the task as completed on the map. */
  onMarkCompleted: (id: string) => void
  /** Opens integrated learning when the node has material (Step 2 cert, Dino TPR). */
  onOpenTraining?: (nodeId: string) => void
  /** Opens workshop calendar booking for Step 4/5 workshop tasks. */
  onOpenWorkshopBooking?: (nodeId: string) => void
  /** Opens mock class weekly booking for Step 3 mock tasks. */
  onOpenMockBooking?: (nodeId: string) => void
}

const SUMMIT_BENEFIT_LINES = [
  'Steadier ongoing bookings',
  'Stronger earning potential',
  'Better odds of Top 30% rewards',
  'Cash & physical gift lucky-draw eligibility',
] as const

function oneLineWhy(node: FlowNode): string {
  const raw = (node.whyMatters ?? node.description).replace(/\s+/g, ' ').trim()
  const first = raw.split(/(?<=[.!?])\s+/)[0] ?? raw
  return first.length > 200 ? `${first.slice(0, 197)}…` : first
}

function pickGainBullets(node: FlowNode): string[] {
  if (node.group === 'summit') {
    return [SUMMIT_BENEFIT_LINES[0]!, SUMMIT_BENEFIT_LINES[1]!]
  }
  if (node.group === 'reward') {
    return ['Keeps your finish-fast momentum visible.', 'Supports staying reward-ready.']
  }
  const bySentence = node.benefit
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (bySentence.length >= 2) {
    return [bySentence[0]!, bySentence[1]!].map((s) => (s.length > 95 ? `${s.slice(0, 92)}…` : s))
  }
  if (bySentence.length === 1) {
    const s = bySentence[0]!
    return [s.length > 120 ? `${s.slice(0, 117)}…` : s]
  }
  const parts = node.benefit.split(',').map((s) => s.trim()).filter(Boolean)
  return parts.slice(0, 2).map((s) => (s.length > 95 ? `${s.slice(0, 92)}…` : s))
}

function trainingCtaLabel(node: FlowNode): string {
  if (node.group === 'reward') return 'View tips'
  if (node.group === 'summit') return 'Check Your Achievement'
  if (node.group === 'dino') return 'Start learning'
  if (node.group === 'workshop') return 'Open training'
  if (node.group === 'mock') return 'Open training'
  return 'Open training'
}

function nextLine(raw: string): string {
  const t = raw.replace(/^Next recommended step:\s*/i, '').trim()
  return t.length > 160 ? `${t.slice(0, 157)}…` : t
}

interface CompactImpactProps {
  node: FlowNode
  effectiveCompleted: boolean
  pointsDelta: number
  rewardGapBefore: number
  rewardGapAfter: number
  inRewardZoneAfter: boolean
}

function DrawerImpactCompact({
  node,
  effectiveCompleted,
  pointsDelta,
  rewardGapBefore,
  rewardGapAfter,
  inRewardZoneAfter,
}: CompactImpactProps) {
  if (effectiveCompleted) {
    return (
      <div className="drawer-card drawer-card--impact">
        <span className="drawer-card-label">Progress</span>
        <p className="drawer-card-single">Done — recorded on your stair.</p>
      </div>
    )
  }

  if (node.group === 'reward') {
    return (
      <div className="drawer-card drawer-card--impact">
        <span className="drawer-card-label">If you stay on track</span>
        <ul className="drawer-impact-ul">
          <li>No Growth Points from this nudge—follow task center for official credit.</li>
          <li>{inRewardZoneAfter ? 'Already in Top 30% — helps defend your spot.' : `${rewardGapBefore} pts to reward zone.`}</li>
        </ul>
      </div>
    )
  }

  if (node.group === 'summit') {
    return (
      <div className="drawer-card drawer-card--impact">
        <span className="drawer-card-label">Reward position</span>
        <ul className="drawer-impact-ul">
          <li>Growth Points: milestone unlock</li>
          {inRewardZoneAfter ? (
            <li>Already in the Top 30% reward zone — helps defend your spot.</li>
          ) : (
            <li>{rewardGapAfter} points away from Top 30%</li>
          )}
        </ul>
      </div>
    )
  }

  const gapShrink = Math.max(0, rewardGapBefore - rewardGapAfter)

  if (pointsDelta <= 0) {
    return (
      <div className="drawer-card drawer-card--impact">
        <span className="drawer-card-label">If you complete this</span>
        <ul className="drawer-impact-ul">
          <li>Progress logged toward your launch map</li>
          {inRewardZoneAfter ? (
            <li>Already in the Top 30% reward zone — helps defend your spot.</li>
          ) : (
            <li>{rewardGapAfter} points away from Top 30%</li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <div className="drawer-card drawer-card--impact">
      <span className="drawer-card-label">If you complete this</span>
      <ul className="drawer-impact-ul">
        <li>+{pointsDelta} Growth Points</li>
        {inRewardZoneAfter ? (
          <li>Already in the Top 30% reward zone — helps defend your spot.</li>
        ) : (
          <li>
            Reward gap −{gapShrink} pts ({rewardGapAfter} away)
          </li>
        )}
      </ul>
    </div>
  )
}

export function NodeDetailDrawer({
  open,
  node,
  nextRecommendation,
  rewardGap,
  inRewardZone,
  preSummitPathComplete,
  onClose,
  onMarkCompleted,
  onOpenTraining,
  onOpenWorkshopBooking,
  onOpenMockBooking,
}: NodeDetailDrawerProps) {
  if (!open || !node) return null

  const effectiveCompleted = node.status === 'completed'
  const pointsDelta = node.group === 'reward' || node.group === 'summit' ? 0 : node.points
  const rewardGapAfter =
    effectiveCompleted || node.group === 'reward' || node.group === 'summit'
      ? rewardGap
      : Math.max(0, rewardGap - Math.min(pointsDelta, rewardGap))
  const inAfter = inRewardZone || rewardGapAfter === 0

  const summitBlocked = node.group === 'summit' && !effectiveCompleted && !preSummitPathComplete
  const gains = pickGainBullets(node)
  const cta = trainingCtaLabel(node)
  const learningRoute = nodeHasLearningMaterial(node)
  const hasInteractiveLearning = Boolean(learningRoute && onOpenTraining)
  const primaryDisabled =
    summitBlocked ||
    node.group === 'reward' ||
    (['certificate', 'workshop', 'mock', 'dino'].includes(node.group) && !hasInteractiveLearning)

  const hasWorkshopBooking = node.group === 'workshop' && Boolean(onOpenWorkshopBooking) && !effectiveCompleted
  const hasMockBooking = node.group === 'mock' && Boolean(onOpenMockBooking) && !effectiveCompleted

  const handlePrimary = () => {
    if (summitBlocked) return
    if (hasInteractiveLearning && onOpenTraining) {
      onOpenTraining(node.id)
      onClose()
    }
  }

  return (
    <>
      <button type="button" className="drawer-backdrop" aria-label="Close details" onClick={onClose} />
      <aside
        className={`node-drawer-panel node-drawer-panel--action ${open ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-task-title"
      >
        <header className="drawer-head drawer-head--action">
          <div className="drawer-head-text">
            <h3 id="drawer-task-title" className="drawer-task-title">
              {node.title}
            </h3>
            <StatusBadge status={effectiveCompleted ? 'completed' : node.status} />
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close drawer">
            ×
          </button>
        </header>

        <div className="drawer-scroll drawer-scroll--action">
          {hasMockBooking ? (
            <section className="drawer-mock-book-banner" aria-label="Mock class booking">
              <p className="drawer-mock-book-kicker">Limited-time bonus</p>
              <button
                type="button"
                className="drawer-mock-book-cta"
                onClick={() => {
                  onOpenMockBooking!(node.id)
                  onClose()
                }}
              >
                Book your mock time
              </button>
              <p className="drawer-mock-book-note">
                Complete your mock within 60 days of onboarding to earn a <strong>$7</strong> bonus. You have up
                to <strong>2</strong> mock booking slots — pick times you can attend.
              </p>
            </section>
          ) : null}

          {hasWorkshopBooking ? (
            <section className="drawer-workshop-book-banner" aria-label="Workshop booking">
              <p className="drawer-workshop-book-kicker">Priority action</p>
              <button
                type="button"
                className="drawer-workshop-book-cta"
                onClick={() => {
                  onOpenWorkshopBooking!(node.id)
                  onClose()
                }}
              >
                Book Workshop
              </button>
              <p className="drawer-workshop-book-note">
                Reserve your seat on the workshop calendar — complete registration to lock in your times.
              </p>
            </section>
          ) : null}

          {summitBlocked ? (
            <p className="drawer-inline-note">
              Complete all core and bonus tasks in Steps 1–5 first to unlock this milestone.
            </p>
          ) : null}

          <section className="drawer-section drawer-section--tight">
            <h4 className="drawer-section-label">Why it matters</h4>
            <p className="drawer-one-liner">{oneLineWhy(node)}</p>
          </section>

          <section className="drawer-section drawer-section--tight">
            <h4 className="drawer-section-label">What you gain</h4>
            <ul className="drawer-gain-ul">
              {gains.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>

          <DrawerImpactCompact
            node={node}
            effectiveCompleted={effectiveCompleted}
            pointsDelta={pointsDelta}
            rewardGapBefore={rewardGap}
            rewardGapAfter={rewardGapAfter}
            inRewardZoneAfter={inAfter}
          />

          <section className="drawer-section drawer-section--next">
            <h4 className="drawer-section-label">Next step</h4>
            <p className="drawer-next-line">{nextLine(nextRecommendation)}</p>
          </section>
        </div>

        <footer className="drawer-footer drawer-footer--action">
          <button
            type="button"
            className="drawer-primary-cta"
            disabled={primaryDisabled}
            title={
              primaryDisabled
                ? summitBlocked
                  ? 'Finish all Steps 1–5 tasks first'
                  : node.group === 'reward'
                    ? 'Tips live in your task center'
                    : 'Learning material is not linked for this task yet'
                : undefined
            }
            onClick={handlePrimary}
          >
            {cta}
          </button>
          {node.group !== 'reward' ? (
            node.status === 'completed' ? (
              <p className="drawer-footer-done-note">Marked complete on your map.</p>
            ) : summitBlocked ? (
              <p className="drawer-footer-done-note drawer-footer-done-note--muted">
                Finish all core and bonus tasks in Steps 1–5 to unlock Peak Summit.
              </p>
            ) : node.group === 'summit' ? (
              <p className="drawer-footer-done-note drawer-footer-done-note--muted">
                Open your certificate with Check Your Achievement — the milestone completes automatically.
              </p>
            ) : (
              <button
                type="button"
                className="drawer-sim-link"
                onClick={() => onMarkCompleted(node.id)}
              >
                Mark as completed
              </button>
            )
          ) : null}
        </footer>
      </aside>
    </>
  )
}
