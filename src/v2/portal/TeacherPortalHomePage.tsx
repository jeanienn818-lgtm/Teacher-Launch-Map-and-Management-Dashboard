import { DemoTeacherSwitcher } from '../components/DemoTeacherSwitcher'
import { defaultIncomePlan, getDemoTeacherPreset } from '../data'
import { calcIncome } from '../utils'
import { formatTierLabel, resolveTierFromCumulativeCompletions } from '../tierIncentive'

interface TeacherPortalHomePageProps {
  demoTeacherId: string
  onSelectDemoTeacher: (demoTeacherId: string) => void
  onOpenLaunchMap: () => void
  onResetDemo: () => void
}

const UPCOMING = [
  { id: '1', student: 'Leo · L3 Reading', time: 'Today · 18:40 (Beijing)' },
  { id: '2', student: 'Mia · L2 Wonders', time: 'Tomorrow · 08:20 (Beijing)' },
]

const NOTIFICATIONS = [
  { id: 'n1', title: 'Platform', body: 'Peak-time incentive window updated for your region.' },
  { id: 'n2', title: 'Reminder', body: 'Submit monthly availability by Friday to protect booking slots.' },
  { id: 'n3', title: 'Onboarding', body: 'Complete your Month 0 checklist to unlock priority support.' },
]

export function TeacherPortalHomePage({
  demoTeacherId,
  onSelectDemoTeacher,
  onOpenLaunchMap,
  onResetDemo,
}: TeacherPortalHomePageProps) {
  const teacher = getDemoTeacherPreset(demoTeacherId).snapshot
  const tier = resolveTierFromCumulativeCompletions(teacher.completedClassesUntilCutoff)
  const tierLabel = formatTierLabel(tier)
  const income = calcIncome(defaultIncomePlan, tier)

  return (
    <div className="portal-page">
      <header className="portal-shell-header">
        <div className="portal-shell-brand">
          <span className="portal-shell-logo" aria-hidden>
            NA
          </span>
          <div>
            <p className="portal-shell-product">Teacher workspace</p>
            <p className="portal-shell-meta">Portal home · simulation</p>
          </div>
        </div>
        <button type="button" className="portal-demo-reset" onClick={onResetDemo}>
          Reset demo
        </button>
      </header>

      <main className="portal-shell-main">
        <section className="portal-welcome" aria-labelledby="portal-welcome-heading">
          <div>
            <h1 id="portal-welcome-heading" className="portal-welcome-title">
              Welcome back, {teacher.teacherShowName}
            </h1>
            <p className="portal-welcome-sub">
              Teacher ID <span className="portal-mono">{teacher.teacherId}</span> · {tierLabel}
            </p>
          </div>
          <DemoTeacherSwitcher
            selectedId={demoTeacherId}
            onSelect={onSelectDemoTeacher}
            variant="portal"
          />
        </section>

        <section className="portal-featured" aria-labelledby="launch-map-card-title">
          <article className="portal-launch-card">
            <div className="portal-launch-card-glow" aria-hidden />
            <div className="portal-launch-card-inner">
              <p className="portal-launch-kicker">Onboarding · featured</p>
              <h2 id="launch-map-card-title" className="portal-launch-title">
                New Teacher Launch Map
              </h2>
              <p className="portal-launch-subtitle">
                Build steady bookings faster through income planning and sharpening teaching skills.
              </p>
              <p className="portal-launch-hint">Recommended for Month 0–Month 2 teachers.</p>
              <div className="portal-launch-actions">
                <button type="button" className="portal-launch-cta" onClick={onOpenLaunchMap}>
                  Open Launch Map
                </button>
              </div>
            </div>
          </article>
        </section>

        <div className="portal-mid-grid">
          <section className="portal-card portal-card--elevated" aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading" className="portal-card-title">
              Upcoming classes
            </h2>
            <p className="portal-card-metric">
              <strong>6</strong> <span className="portal-muted">this week</span>
            </p>
            <p className="portal-next-slot">
              Next: <strong>Today · 18:40</strong> (Beijing)
            </p>
            <ul className="portal-lesson-list">
              {UPCOMING.map((u) => (
                <li key={u.id}>
                  <span className="portal-lesson-name">{u.student}</span>
                  <span className="portal-lesson-time">{u.time}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="portal-card portal-card--elevated" aria-labelledby="earnings-heading">
            <h2 id="earnings-heading" className="portal-card-title">
              Earnings snapshot
            </h2>
            <p className="portal-card-metric">
              <strong>{defaultIncomePlan.plannedClasses}</strong>{' '}
              <span className="portal-muted">planned completed classes (this month est.)</span>
            </p>
            <p className="portal-earnings-line">
              Estimated income (demo inputs): <strong>${income.total.toFixed(2)}</strong>
            </p>
            <p className="portal-muted portal-earnings-note">
              Launch Map includes a live calculator you can tune for your own plan.
            </p>
          </section>
        </div>

        <section className="portal-card portal-card--quiet" aria-labelledby="notify-heading">
          <h2 id="notify-heading" className="portal-card-title portal-card-title--small">
            Notifications
          </h2>
          <ul className="portal-notify-list">
            {NOTIFICATIONS.map((n) => (
              <li key={n.id}>
                <span className="portal-notify-label">{n.title}</span>
                <span className="portal-notify-body">{n.body}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
