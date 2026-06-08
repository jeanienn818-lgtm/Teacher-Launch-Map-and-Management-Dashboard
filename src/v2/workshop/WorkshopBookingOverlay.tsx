import { useCallback, useEffect, useMemo, useState } from 'react'
import { CancelBookingDialog } from '../booking/CancelBookingDialog'
import {
  DEFAULT_TASK_BOOKING_POLICY,
  cancelBlockedReason,
  canCancelTaskBooking,
  workshopSessionStart,
  type TaskBookingPolicy,
  type WorkshopBookingRecord,
} from '../booking/bookingPolicy'
import { CombinedScheduleCalendar } from '../booking/CombinedScheduleCalendar'
import { findMockConflict } from '../mock/mockSlots'
import {
  allRecommendedWorkshopsBooked,
  bookingRecordForSession,
  isRecommendedWorkshopSession,
  mergeWorkshopBookings,
  normalizeWorkshopBooking,
  validateWorkshopRegistration,
} from './workshopBookingRules'
import {
  filterWorkshopSessionsByWeekIndex,
  getWorkshopSessions,
  sessionsById,
  type WorkshopSession,
} from './workshopSessions'
import { bookingWindowRangeLabel } from '../booking/bookingWindow'

type BookingView = 'list' | 'registering' | 'registered' | 'schedule'

interface WorkshopBookingOverlayProps {
  sourceNodeId: string
  workshopBookings: WorkshopBookingRecord[]
  taskPolicies: Record<string, TaskBookingPolicy>
  bookedMockSlotIds?: string[]
  onCompleteBooking: (sessionIds: string[]) => void
  onCancelBooking: (sessionId: string) => void
  onClose: () => void
}

type TimeFilter = 'all' | 'this-week' | 'next-week'

function WorkshopAlertDialog({
  title,
  body,
  onDismiss,
}: {
  title: string
  body: string
  onDismiss: () => void
}) {
  return (
    <div className="mock-dialog-root" role="alertdialog" aria-modal="true" aria-labelledby="ws-alert-title">
      <div className="mock-dialog-scrim" aria-hidden onClick={onDismiss} />
      <div className="mock-dialog-panel mock-dialog-panel--warn">
        <h3 id="ws-alert-title" className="mock-dialog-title">
          {title}
        </h3>
        <p className="mock-dialog-body">{body}</p>
        <div className="mock-dialog-actions mock-dialog-actions--single">
          <button type="button" className="mock-dialog-btn mock-dialog-btn--primary" onClick={onDismiss}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkshopConflictDialog({ onDismiss }: { onDismiss: () => void }) {
  return (
    <WorkshopAlertDialog
      title="Schedule conflict"
      body="You already have a mock class booked at this time. Please choose a different slot."
      onDismiss={onDismiss}
    />
  )
}

function RegisterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 8v6M16 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function WorkshopListView({
  workshopBookings,
  taskPolicies,
  selectedIds,
  bookedIds,
  timeFilter,
  onTimeFilterChange,
  onToggleSession,
  onConfirmRegister,
  onRequestCancel,
  fourRecommendedDone,
}: {
  workshopBookings: WorkshopBookingRecord[]
  taskPolicies: Record<string, TaskBookingPolicy>
  selectedIds: Set<string>
  bookedIds: Set<string>
  timeFilter: TimeFilter
  onTimeFilterChange: (f: TimeFilter) => void
  onToggleSession: (id: string) => void
  onConfirmRegister: () => void
  onRequestCancel: (session: WorkshopSession, record: WorkshopBookingRecord) => void
  fourRecommendedDone: boolean
}) {
  const allSessions = useMemo(() => getWorkshopSessions(), [])
  const windowLabel = bookingWindowRangeLabel()

  const visibleSessions = useMemo(() => {
    if (timeFilter === 'all') return allSessions
    if (timeFilter === 'this-week') return filterWorkshopSessionsByWeekIndex(allSessions, 0)
    return filterWorkshopSessionsByWeekIndex(allSessions, 1)
  }, [allSessions, timeFilter])

  const pendingCount = [...selectedIds].filter((id) => !bookedIds.has(id)).length

  return (
    <div className="ws-booking-page">
      <header className="ws-booking-topbar">
        <div className="ws-booking-tabs" role="tablist">
          <span className="ws-booking-tab">Workshop Introduction</span>
          <span className="ws-booking-tab ws-booking-tab--active" role="tab" aria-selected>
            Workshop Calendar
          </span>
        </div>
        <label className="ws-booking-tz">
          <span className="ws-booking-tz__label">Time Zone</span>
          <select className="ws-booking-tz__select" defaultValue="US/Eastern" aria-label="Time zone">
            <option value="US/Eastern">US/Eastern</option>
            <option value="US/Central">US/Central</option>
            <option value="US/Pacific">US/Pacific</option>
          </select>
        </label>
      </header>

      <nav className="ws-booking-breadcrumb" aria-label="Breadcrumb">
        Library &gt; Workshop Calendar
      </nav>

      <p className="ws-booking-window-note">
        Showing <strong>4 weeks</strong> ({windowLabel}) — this week plus the next 3 weeks.
      </p>
      <p className="ws-booking-policy-note">
        All four map workshop entries share this calendar. Book the four highlighted recommended workshops
        first; each task allows one cancel &amp; rebook more than 24 hours before start.
        {fourRecommendedDone ? ' You may add one optional workshop.' : null}
      </p>

      <div className="ws-booking-filters">
        <div className="ws-booking-filter-field">
          <span className="ws-booking-filter-label">Category</span>
          <select className="ws-booking-filter-select" defaultValue="all" aria-label="Category">
            <option value="all">Select a Category(All)</option>
            <option value="monthly">Monthly Workshop</option>
            <option value="new">New Teachers Workshop</option>
          </select>
        </div>
        <div className="ws-booking-filter-field">
          <span className="ws-booking-filter-label">Topic</span>
          <select className="ws-booking-filter-select" defaultValue="all" aria-label="Topic">
            <option value="all">Select a Topic(All)</option>
          </select>
        </div>
        <div className="ws-booking-time-filters" role="group" aria-label="Time range">
          {(
            [
              ['all', 'ALL'],
              ['this-week', 'This Week'],
              ['next-week', 'Next Week'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`ws-booking-time-btn${timeFilter === key ? ' ws-booking-time-btn--active' : ''}`}
              onClick={() => onTimeFilterChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="ws-booking-table-wrap">
        <table className="ws-booking-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Time</th>
              <th scope="col">Topic</th>
              <th scope="col">Category</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleSessions.map((session) => {
              const booked = bookedIds.has(session.id)
              const bookingRecord = bookingRecordForSession(session.id, workshopBookings)
              const normalized = bookingRecord ? normalizeWorkshopBooking(bookingRecord) : null
              const policy = taskPolicies[normalized?.nodeId ?? ''] ?? DEFAULT_TASK_BOOKING_POLICY
              const start = workshopSessionStart(session)
              const cancelBlockReason = normalized ? cancelBlockedReason(policy, start) : null
              const canCancel = normalized != null && canCancelTaskBooking(policy, start)
              const selected = selectedIds.has(session.id)
              const stepFocus = session.trainingStep
              const rowClasses = [
                stepFocus ? `ws-booking-row--step-${stepFocus}` : '',
                selected ? 'ws-booking-row--selected' : '',
                booked ? 'ws-booking-row--booked' : '',
              ]
                .filter(Boolean)
                .join(' ')
              const cellFocusClass = stepFocus ? 'ws-booking-cell--step-focus' : undefined
              return (
                <tr key={session.id} className={rowClasses || undefined}>
                  <td className={cellFocusClass}>{session.dateLabel}</td>
                  <td className={cellFocusClass}>{session.timeLabel}</td>
                  <td className={cellFocusClass}>
                    <span className="ws-booking-topic-cell">
                      {session.topic}
                      {isRecommendedWorkshopSession(session.id) ? (
                        <span className="ws-booking-tag ws-booking-tag--new">Recommended</span>
                      ) : null}
                      {session.tags?.map((tag) => (
                        <span key={tag} className={`ws-booking-tag ws-booking-tag--${tag}`}>
                          {tag === 'raffle' ? 'Raffle' : 'new'}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className={cellFocusClass}>{session.category}</td>
                  <td>
                    {booked && normalized ? (
                      <div className="ws-booking-action-cell">
                        <span className="ws-booking-registered-pill">Registered</span>
                        {canCancel ? (
                          <button
                            type="button"
                            className="ws-booking-cancel-link"
                            onClick={() => onRequestCancel(session, normalized)}
                          >
                            Cancel &amp; rebook
                          </button>
                        ) : (
                          <span className="ws-booking-cancel-hint" title={cancelBlockReason ?? undefined}>
                            {cancelBlockReason ? 'Locked' : 'Cannot cancel'}
                          </span>
                        )}
                      </div>
                    ) : booked ? (
                      <span className="ws-booking-registered-pill">Registered</span>
                    ) : (
                      <button
                        type="button"
                        className={`ws-booking-register-link${selected ? ' ws-booking-register-link--selected' : ''}`}
                        onClick={() => onToggleSession(session.id)}
                      >
                        <RegisterIcon />
                        {selected ? 'SELECTED' : 'REGISTER'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <footer className="ws-booking-list-footer">
        <p className="ws-booking-list-hint">
          <strong className="ws-booking-list-hint--orange">Orange rows</strong> are the four recommended Step
          4 &amp; Step 5 workshops. Select sessions, then confirm registration.
        </p>
        <button
          type="button"
          className="ws-booking-confirm-btn"
          disabled={pendingCount === 0}
          onClick={onConfirmRegister}
        >
          Confirm registration ({pendingCount})
        </button>
      </footer>
    </div>
  )
}

export function WorkshopBookingOverlay({
  sourceNodeId: _sourceNodeId,
  workshopBookings,
  taskPolicies,
  bookedMockSlotIds = [],
  onCompleteBooking,
  onCancelBooking,
  onClose,
}: WorkshopBookingOverlayProps) {
  const [view, setView] = useState<BookingView>('list')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [localBookings, setLocalBookings] = useState<WorkshopBookingRecord[]>(() =>
    workshopBookings.map(normalizeWorkshopBooking),
  )
  const [showMockConflict, setShowMockConflict] = useState(false)
  const [registrationBlock, setRegistrationBlock] = useState<{ title: string; body: string } | null>(null)
  const [pendingCancel, setPendingCancel] = useState<{
    session: WorkshopSession
    record: WorkshopBookingRecord
  } | null>(null)

  useEffect(() => {
    setLocalBookings(workshopBookings.map(normalizeWorkshopBooking))
  }, [workshopBookings])

  const bookedIds = useMemo(() => new Set(localBookings.map((b) => b.sessionId)), [localBookings])
  const fourRecommendedDone = useMemo(() => allRecommendedWorkshopsBooked(localBookings), [localBookings])

  const tryToggleSession = useCallback(
    (id: string) => {
      if (bookedIds.has(id)) return
      const willSelect = !selectedIds.has(id)
      if (!willSelect) {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        return
      }
      const simulatedPending = [...selectedIds, id].filter((sid) => !bookedIds.has(sid))
      const check = validateWorkshopRegistration(simulatedPending, localBookings)
      if (!check.ok) {
        setRegistrationBlock({ title: check.title, body: check.body })
        return
      }
      setSelectedIds((prev) => new Set(prev).add(id))
    },
    [bookedIds, selectedIds, localBookings],
  )

  const confirmRegister = useCallback(() => {
    const pending = [...selectedIds].filter((id) => !bookedIds.has(id))
    if (pending.length === 0) return

    const validation = validateWorkshopRegistration(pending, localBookings)
    if (!validation.ok) {
      setRegistrationBlock({ title: validation.title, body: validation.body })
      return
    }

    for (const session of sessionsById(pending)) {
      if (findMockConflict(session, bookedMockSlotIds)) {
        setShowMockConflict(true)
        return
      }
    }

    setView('registering')
    window.setTimeout(() => {
      const merged = mergeWorkshopBookings(localBookings, pending)
      setLocalBookings(merged)
      onCompleteBooking(pending)
      setSelectedIds(new Set())
      setView('registered')
      window.setTimeout(() => setView('schedule'), 1200)
    }, 900)
  }, [selectedIds, bookedIds, bookedMockSlotIds, localBookings, onCompleteBooking])

  const handleConfirmCancel = useCallback(() => {
    if (!pendingCancel) return
    const { session } = pendingCancel
    setLocalBookings((prev) => prev.filter((b) => b.sessionId !== session.id))
    onCancelBooking(session.id)
    setPendingCancel(null)
  }, [pendingCancel, onCancelBooking])

  useEffect(() => {
    if (view !== 'schedule') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, onClose])

  if (view === 'schedule') {
    return (
      <CombinedScheduleCalendar
        bookedWorkshopSessionIds={[...bookedIds]}
        bookedMockSlotIds={bookedMockSlotIds}
        title="WORKSHOPS & MOCKS"
        subtitle="Your combined training schedule"
        onClose={onClose}
      />
    )
  }

  return (
    <div className="ws-booking-overlay-root">
      <button type="button" className="ws-booking-overlay-backdrop" aria-label="Close workshop booking" onClick={onClose} />
      <div className="ws-booking-overlay-panel" role="dialog" aria-modal="true" aria-label="Workshop calendar">
        <div className="ws-booking-overlay-toolbar">
          <button type="button" className="ws-booking-back-btn" onClick={onClose}>
            ← Back to training map
          </button>
        </div>

        {view === 'list' ? (
          <WorkshopListView
            workshopBookings={localBookings}
            taskPolicies={taskPolicies}
            selectedIds={selectedIds}
            bookedIds={bookedIds}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            onToggleSession={tryToggleSession}
            onConfirmRegister={confirmRegister}
            onRequestCancel={(session, record) => setPendingCancel({ session, record })}
            fourRecommendedDone={fourRecommendedDone}
          />
        ) : null}

        {view === 'registering' ? (
          <div className="ws-booking-status-card">
            <div className="ws-booking-spinner" aria-hidden />
            <p className="ws-booking-status-title">Registering…</p>
            <p className="ws-booking-status-sub">Saving your workshop seats.</p>
          </div>
        ) : null}

        {view === 'registered' ? (
          <div className="ws-booking-status-card ws-booking-status-card--success">
            <span className="ws-booking-success-icon" aria-hidden>
              ✓
            </span>
            <p className="ws-booking-status-title">Registration complete!</p>
            <p className="ws-booking-status-sub">Opening your workshop schedule…</p>
          </div>
        ) : null}

        {showMockConflict ? <WorkshopConflictDialog onDismiss={() => setShowMockConflict(false)} /> : null}

        {registrationBlock ? (
          <WorkshopAlertDialog
            title={registrationBlock.title}
            body={registrationBlock.body}
            onDismiss={() => setRegistrationBlock(null)}
          />
        ) : null}

        {pendingCancel ? (
          <CancelBookingDialog
            title="Cancel this workshop registration?"
            body="You can register for a different session once. This is your only cancel & rebook for this task, and the new session must start more than 24 hours from now."
            onConfirm={handleConfirmCancel}
            onDismiss={() => setPendingCancel(null)}
          />
        ) : null}
      </div>
    </div>
  )
}
