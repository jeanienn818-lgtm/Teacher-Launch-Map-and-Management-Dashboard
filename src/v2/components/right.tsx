import type { FlowNode, HotTask } from '../types'

interface ProgressPanelProps {
  growthScore: number
  completedTasks: number
  totalTasks: number
  certificateDone: number
  mockDone: number
  workshopDone: number
  dinoDone: number
  mainProgress: number
  totalProgress: number
}

export function ProgressPanel(props: ProgressPanelProps) {
  return (
    <section className="card growth-snapshot growth-snapshot--v26">
      <h3>Growth snapshot</h3>
      <div className="stats-grid stats-grid--map stats-grid--v26">
        <span>
          <em>Growth Points</em>
          {props.growthScore}
        </span>
        <span>
          <em>Tasks done / total</em>
          {props.completedTasks}/{props.totalTasks}
        </span>
        <span>
          <em>Certificates earned</em>
          {props.certificateDone}
        </span>
        <span>
          <em>Mocks completed</em>
          {props.mockDone}
        </span>
        <span>
          <em>Workshops completed</em>
          {props.workshopDone}
        </span>
        <span>
          <em>Dino U modules done</em>
          {props.dinoDone}/4
        </span>
      </div>
      <div className="progress-stack progress-stack--v26">
        <div className="progress-item">
          <label>Core stair progress</label>
          <progress max={100} value={props.mainProgress} />
          <b>{props.mainProgress}%</b>
        </div>
        <div className="progress-item">
          <label>Total completion</label>
          <progress max={100} value={props.totalProgress} />
          <b>{props.totalProgress}%</b>
        </div>
      </div>
    </section>
  )
}

interface RewardStatusPanelProps {
  isTop30: boolean
  gapPoints: number
  simulationDelta?: number
}

export function RewardStatusPanel({ isTop30, gapPoints, simulationDelta = 0 }: RewardStatusPanelProps) {
  return (
    <section className={`card reward-card reward-card--v26 ${isTop30 ? 'win' : ''}`}>
      <h3>Fast Learner Top 30% Lucky Draw</h3>
      <p className="reward-fast-learn-hint-v26">Finish tasks early to improve your draw chance.</p>
      <p className="reward-status-v26">{isTop30 ? "You're in." : `${gapPoints} points away`}</p>
      <p className="reward-list-heading-v26">Rewards:</p>
      <ul className="reward-bullets-v26">
        <li>Cash lucky draw</li>
        <li>Swag, tumblers, tote bags, tees and more</li>
      </ul>
      <p className="reward-footnote-v26">{isTop30 ? 'Stay on track to defend your spot.' : 'Keep going to stay reward-ready.'}</p>
      {simulationDelta > 0 ? (
        <p className="reward-sim-note-v26">Demo mode: +{simulationDelta} pts applied.</p>
      ) : null}
    </section>
  )
}

interface NextStepPanelProps {
  primary: FlowNode | null
  onSelectNode: (id: string) => void
  /** When this matches `primary.id`, the card subtly echoes the map “Best next” accent. */
  mapBestNextId?: string | null
}

export function NextStepPanel({
  primary,
  onSelectNode,
  mapBestNextId = null,
}: NextStepPanelProps) {
  const pathChip =
    primary?.group === 'summit' ? 'Summit' : primary?.type === 'main' ? 'Main path' : null

  const mapLinked = Boolean(primary && mapBestNextId && primary.id === mapBestNextId)

  return (
    <section className={`card next-step-card next-step-card--v26${mapLinked ? ' next-step-card--map-linked' : ''}`}>
      <h3>Next Step</h3>
      {primary ? (
        <>
          <div className="next-step-chips-v26" aria-label="Step highlights">
            <span className="step-chip-v26">Fastest move</span>
            {pathChip ? <span className="step-chip-v26">{pathChip}</span> : null}
            {primary.points > 0 ? (
              <span className="step-chip-v26 step-chip-v26--accent">+{primary.points} pts</span>
            ) : (
              <span className="step-chip-v26 step-chip-v26--muted">Milestone</span>
            )}
          </div>
          <p className="next-step-title-v26">{primary.title}</p>
          <p className="next-step-value-v26">{primary.whyMatters ?? primary.description}</p>
          <button type="button" className="next-step-cta-v26" onClick={() => onSelectNode(primary.id)}>
            Open Details
          </button>
        </>
      ) : (
        <p className="muted next-step-empty-v26">You're caught up on core stair actions—keep peak slots reliable.</p>
      )}
    </section>
  )
}

interface MoreActionsAccordionProps {
  items: FlowNode[]
  onSelectNode: (id: string) => void
}

export function MoreActionsAccordion({ items, onSelectNode }: MoreActionsAccordionProps) {
  if (items.length === 0) return null

  return (
    <details className="sidebar-accordion sidebar-accordion--v26">
      <summary className="sidebar-accordion-summary-v26">More Actions</summary>
      <div className="sidebar-accordion-body-v26">
        <ul className="more-actions-list-v26">
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" className="more-actions-row-v26" onClick={() => onSelectNode(n.id)}>
                <span className="more-actions-title-v26">{n.title}</span>
                {n.points > 0 ? <span className="more-actions-meta-v26">+{n.points}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

interface QuickLinksAccordionProps {
  tasks: HotTask[]
  onFocusTask?: (nodeId: string) => void
}

export function QuickLinksAccordion({ tasks, onFocusTask }: QuickLinksAccordionProps) {
  if (tasks.length === 0) return null

  return (
    <details className="sidebar-accordion sidebar-accordion--v26">
      <summary className="sidebar-accordion-summary-v26">Quick Links</summary>
      <div className="sidebar-accordion-body-v26">
        <ul className="quick-links-list-v26">
          {tasks.map((task) => (
            <li key={task.id}>
              {task.nodeId && onFocusTask ? (
                <button type="button" className="quick-link-row-v26" onClick={() => onFocusTask(task.nodeId!)}>
                  {task.title}
                </button>
              ) : (
                <span className="quick-link-static-v26">{task.title}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
