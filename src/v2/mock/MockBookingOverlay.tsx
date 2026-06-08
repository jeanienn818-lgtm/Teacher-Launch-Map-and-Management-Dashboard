import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { CancelBookingDialog } from '../booking/CancelBookingDialog'
import {
  DEFAULT_TASK_BOOKING_POLICY,
  cancelBlockedReason,
  canCancelTaskBooking,
  mockSessionStart,
  type MockBookingRecord,
  type TaskBookingPolicy,
} from '../booking/bookingPolicy'
import { formatMinutes12h } from '../booking/bookingTime'
import { CombinedScheduleCalendar } from '../booking/CombinedScheduleCalendar'
import {
  MOCK_BOOKING_LIMIT,
  MOCK_PICKER_HOURS,
  buildMockSlot,
  defaultMockTypeForNode,
  findFirstAvailableMockSlotId,
  findWorkshopConflict,
  getMockBookingDays,
  getMockSlotAvailability,
  mockSlotsByIds,
  type MockBookingDay,
  type MockSlot,
  type MockTypeId,
} from './mockSlots'
import { resolveMockBookingNodeId } from './mockBookingRules'

type MockView = 'picker' | 'success' | 'schedule' | 'close-reminder'
type MockPickerTab = 'ready' | 'booked' | 'results'

interface MockBookingOverlayProps {
  sourceNodeId: string
  mockBookings: MockBookingRecord[]
  taskPolicies: Record<string, TaskBookingPolicy>
  bookedWorkshopSessionIds: string[]
  onCompleteBooking: (slotIds: string[], nodeId: string) => void
  onCancelBooking: (slotId: string) => void
  onClose: () => void
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarTabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function HourglassIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 2h8M8 22h8M8 2v4l4 6-4 6v4M16 2v4l-4 6 4 6v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  )
}

function formatPickerTimeLabel(hour: number, minute: 0 | 30): string {
  return formatMinutes12h(hour * 60 + minute)
}

function MockPickerSlot({
  slot,
  availability,
  disabled,
  onSelect,
  scrollAnchorRef,
}: {
  slot: MockSlot
  availability: ReturnType<typeof getMockSlotAvailability>
  disabled: boolean
  onSelect: (slot: MockSlot) => void
  scrollAnchorRef?: RefObject<HTMLDivElement | null>
}) {
  const timeLabel = formatPickerTimeLabel(slot.hour, slot.minute)
  const className = [
    'mock-picker-slot',
    `mock-picker-slot--${availability}`,
    disabled ? 'mock-picker-slot--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const anchorBtnRef = scrollAnchorRef as RefObject<HTMLButtonElement | null> | undefined

  if (availability === 'booked') {
    return (
      <div className={className} ref={scrollAnchorRef} aria-label={`Your mock class ${timeLabel}`}>
        <span className="mock-picker-slot__time">{timeLabel}</span>
        <span className="mock-picker-slot__dst">DST</span>
      </div>
    )
  }

  if (availability !== 'available') {
    return (
      <div
        className={className}
        ref={scrollAnchorRef}
        aria-hidden={availability === 'past'}
        aria-label={`${timeLabel} unavailable`}
      >
        <span className="mock-picker-slot__time">{timeLabel}</span>
        <span className="mock-picker-slot__dst">DST</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={className}
      ref={anchorBtnRef}
      disabled={disabled}
      aria-label={`Book mock at ${slot.label}`}
      onClick={() => onSelect(slot)}
    >
      <span className="mock-picker-slot__time">{timeLabel}</span>
      <span className="mock-picker-slot__dst">DST</span>
    </button>
  )
}

function MockDaySlotsColumn({
  day,
  bookedSlotIds,
  bookedWorkshopSessionIds,
  mockTypeSelected,
  atBookingLimit,
  firstAvailableSlotId,
  firstAvailableAnchorRef,
  onSelectSlot,
}: {
  day: MockBookingDay
  bookedSlotIds: Set<string>
  bookedWorkshopSessionIds: readonly string[]
  mockTypeSelected: boolean
  atBookingLimit: boolean
  firstAvailableSlotId: string | null
  firstAvailableAnchorRef: RefObject<HTMLDivElement | null>
  onSelectSlot: (slot: MockSlot) => void
}) {
  const handleSlotSelect = (slot: MockSlot) => {
    const availability = getMockSlotAvailability(slot, day.dayIndex, bookedSlotIds, bookedWorkshopSessionIds)
    if (availability !== 'available') return
    if (!mockTypeSelected || atBookingLimit) return
    onSelectSlot(slot)
  }

  return (
    <div className="mock-picker-day-slots">
      {MOCK_PICKER_HOURS.flatMap((hour) => {
        const top = buildMockSlot(day.year, day.month, day.day, hour, 0)
        const bottom = buildMockSlot(day.year, day.month, day.day, hour, 30)
        return [top, bottom].map((slot) => (
          <MockPickerSlot
            key={slot.id}
            slot={slot}
            availability={getMockSlotAvailability(slot, day.dayIndex, bookedSlotIds, bookedWorkshopSessionIds)}
            disabled={!mockTypeSelected || atBookingLimit}
            onSelect={handleSlotSelect}
            scrollAnchorRef={slot.id === firstAvailableSlotId ? firstAvailableAnchorRef : undefined}
          />
        ))
      })}
    </div>
  )
}

function MockPickerTimeGrid({
  days,
  selectedDayIndex,
  bookedSlotIds,
  bookedWorkshopSessionIds,
  mockTypeSelected,
  atBookingLimit,
  onSelectDay,
  onSelectSlot,
}: {
  days: MockBookingDay[]
  selectedDayIndex: number
  bookedSlotIds: Set<string>
  bookedWorkshopSessionIds: readonly string[]
  mockTypeSelected: boolean
  atBookingLimit: boolean
  onSelectDay: (dayIndex: number) => void
  onSelectSlot: (slot: MockSlot) => void
}) {
  const slotsScrollRef = useRef<HTMLDivElement>(null)
  const firstAvailableAnchorRef = useRef<HTMLDivElement | null>(null)
  const didScrollRef = useRef(false)

  const firstAvailableSlotId = useMemo(
    () => findFirstAvailableMockSlotId(days, bookedSlotIds, bookedWorkshopSessionIds),
    [days, bookedSlotIds, bookedWorkshopSessionIds],
  )

  const scrollToFirstAvailable = useCallback(() => {
    if (!firstAvailableSlotId || didScrollRef.current) return
    const scrollEl = slotsScrollRef.current
    const anchorEl = firstAvailableAnchorRef.current
    if (!scrollEl || !anchorEl) return
    didScrollRef.current = true
    const scrollRect = scrollEl.getBoundingClientRect()
    const anchorRect = anchorEl.getBoundingClientRect()
    const scrollTop = scrollEl.scrollTop + (anchorRect.top - scrollRect.top) - 8
    scrollEl.scrollTo({ top: Math.max(0, scrollTop), behavior: 'auto' })
  }, [firstAvailableSlotId])

  useLayoutEffect(() => {
    didScrollRef.current = false
    const id = window.requestAnimationFrame(() => {
      scrollToFirstAvailable()
      window.requestAnimationFrame(scrollToFirstAvailable)
    })
    return () => window.cancelAnimationFrame(id)
  }, [firstAvailableSlotId, bookedSlotIds, bookedWorkshopSessionIds, scrollToFirstAvailable])

  return (
    <div className="mock-picker-grid-shell">
      <div ref={slotsScrollRef} className="mock-picker-grid-scroll">
        <div className="mock-picker-grid-inner">
          <div className="mock-picker-grid-headers" role="row">
            {days.map((day) => (
              <button
                key={`head-${day.year}-${day.month}-${day.day}`}
                type="button"
                className={`mock-picker-day__head${selectedDayIndex === day.dayIndex ? ' mock-picker-day__head--selected' : ''}`}
                onClick={() => onSelectDay(day.dayIndex)}
              >
                {day.columnLabel}
              </button>
            ))}
          </div>
          <div className="mock-picker-grid-body">
            {days.map((day) => (
              <MockDaySlotsColumn
                key={`${day.year}-${day.month}-${day.day}`}
                day={day}
                bookedSlotIds={bookedSlotIds}
                bookedWorkshopSessionIds={bookedWorkshopSessionIds}
                mockTypeSelected={mockTypeSelected}
                atBookingLimit={atBookingLimit}
                firstAvailableSlotId={firstAvailableSlotId}
                firstAvailableAnchorRef={firstAvailableAnchorRef}
                onSelectSlot={onSelectSlot}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MockPickerPanel({
  sourceNodeId,
  mockBookings,
  taskPolicies,
  bookedSlotIds,
  bookedWorkshopSessionIds,
  onSelectSlot,
  onRequestCancel,
}: {
  sourceNodeId: string
  mockBookings: MockBookingRecord[]
  taskPolicies: Record<string, TaskBookingPolicy>
  bookedSlotIds: Set<string>
  bookedWorkshopSessionIds: readonly string[]
  onSelectSlot: (slot: MockSlot) => void
  onRequestCancel: (slot: MockSlot, record: MockBookingRecord) => void
}) {
  const days = useMemo(() => getMockBookingDays(), [])
  const [activeTab, setActiveTab] = useState<MockPickerTab>('ready')
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [mockType, setMockType] = useState<MockTypeId | null>(() => defaultMockTypeForNode(sourceNodeId))

  const bookedCount = bookedSlotIds.size
  const atBookingLimit = bookedCount >= MOCK_BOOKING_LIMIT
  const nextBookableNodeId = useMemo(
    () => resolveMockBookingNodeId(sourceNodeId, mockBookings, taskPolicies),
    [sourceNodeId, mockBookings, taskPolicies],
  )
  const bookedSlots = useMemo(() => mockSlotsByIds([...bookedSlotIds]), [bookedSlotIds])
  const mockTypeSelected = mockType != null

  useEffect(() => {
    if (nextBookableNodeId) {
      setMockType(defaultMockTypeForNode(nextBookableNodeId))
    }
  }, [nextBookableNodeId])

  const rangeLabel = useMemo(() => {
    if (days.length === 0) return ''
    const first = days[0]!
    const last = days[days.length - 1]!
    const start = new Date(first.year, first.month - 1, first.day)
    const end = new Date(last.year, last.month - 1, last.day)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }, [days])

  return (
    <div className="mock-picker">
      <div className="mock-picker-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ready'}
          className={`mock-picker-tab${activeTab === 'ready' ? ' mock-picker-tab--active' : ''}`}
          onClick={() => setActiveTab('ready')}
        >
          <CheckIcon />
          Ready to Book
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'booked'}
          className={`mock-picker-tab${activeTab === 'booked' ? ' mock-picker-tab--active' : ''}`}
          onClick={() => setActiveTab('booked')}
        >
          <CalendarTabIcon />
          Booked
          {bookedCount > 0 ? <span className="mock-picker-tab__count">{bookedCount}</span> : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'results'}
          className={`mock-picker-tab${activeTab === 'results' ? ' mock-picker-tab--active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <HourglassIcon />
          Mock Results List
        </button>
      </div>

      {activeTab === 'ready' ? (
        <>
          <h2 className="mock-picker-title">Choose a time slot from below:</h2>
          <p className="mock-picker-warning">
            <span className="mock-picker-warning__icon" aria-hidden>
              ⚠️
            </span>
            Each task allows one cancel &amp; rebook. Cancellation is only available more than 24 hours before
            your session starts.
          </p>

          <div className="mock-picker-type-box">
            <div className="mock-picker-type-box__head">
              <TargetIcon />
              <span>Select Mock Type (Select one to proceed)</span>
            </div>
            <div className="mock-picker-type-box__options">
              <label className="mock-picker-type-option">
                <input
                  type="radio"
                  name="mock-type"
                  checked={mockType === 'china'}
                  onChange={() => setMockType('china')}
                />
                China Trial Mock (Main contract)
              </label>
              <label className="mock-picker-type-option">
                <input
                  type="radio"
                  name="mock-type"
                  checked={mockType === 'international'}
                  onChange={() => setMockType('international')}
                />
                International Trial Mock (Main contract)
              </label>
            </div>
          </div>

          <p className="mock-picker-opportunities">
            You have <strong>{MOCK_BOOKING_LIMIT}</strong> mock booking opportunities —{' '}
            <strong>{bookedCount}</strong> used, <strong>{Math.max(0, MOCK_BOOKING_LIMIT - bookedCount)}</strong>{' '}
            remaining. Showing the next <strong>7 days</strong> ({rangeLabel}).
          </p>

          {!mockTypeSelected ? (
            <p className="mock-picker-type-hint">Select a mock type above to enable time slot booking.</p>
          ) : null}
          {atBookingLimit ? (
            <p className="mock-picker-type-hint mock-picker-type-hint--limit">
              You have used all {MOCK_BOOKING_LIMIT} mock bookings. View them under the Booked tab.
            </p>
          ) : null}

          <div className="mock-picker-tz">
            <span>Timezone</span>
            <strong>US/Eastern</strong>
          </div>

          <MockPickerTimeGrid
            days={days}
            selectedDayIndex={selectedDayIndex}
            bookedSlotIds={bookedSlotIds}
            bookedWorkshopSessionIds={bookedWorkshopSessionIds}
            mockTypeSelected={mockTypeSelected}
            atBookingLimit={atBookingLimit}
            onSelectDay={setSelectedDayIndex}
            onSelectSlot={onSelectSlot}
          />

          <footer className="mock-picker-legend" aria-label="Slot legend">
            <span className="mock-picker-legend__item">
              <span className="mock-picker-legend__swatch mock-picker-legend__swatch--available" />
              Available
            </span>
            <span className="mock-picker-legend__item">
              <span className="mock-picker-legend__swatch mock-picker-legend__swatch--booked" />
              Booked (Your Mock Class)
            </span>
            <span className="mock-picker-legend__item">
              <span className="mock-picker-legend__swatch mock-picker-legend__swatch--unavailable" />
              Unavailable
            </span>
            <span className="mock-picker-legend__item">
              <span className="mock-picker-legend__swatch mock-picker-legend__swatch--dst">DST</span>
              DST (Daylight Saving Time transition)
            </span>
          </footer>
        </>
      ) : null}

      {activeTab === 'booked' ? (
        <div className="mock-picker-booked-panel">
          <h2 className="mock-picker-title">Your booked mock classes</h2>
          <p className="mock-picker-policy-note">
            Cancel &amp; rebook is allowed once per task, and only more than 24 hours before the session.
          </p>
          {bookedSlots.length === 0 ? (
            <p className="mock-picker-empty">No mock classes booked yet. Use Ready to Book to reserve a slot.</p>
          ) : (
            <ul className="mock-picker-booked-list">
              {bookedSlots.map((slot) => {
                const record = mockBookings.find((b) => b.slotId === slot.id)
                const nodeId = record?.nodeId ?? sourceNodeId
                const policy = taskPolicies[nodeId] ?? DEFAULT_TASK_BOOKING_POLICY
                const start = mockSessionStart(slot)
                const blockReason = cancelBlockedReason(policy, start)
                const canCancel = record != null && canCancelTaskBooking(policy, start)
                return (
                  <li key={slot.id} className="mock-picker-booked-item">
                    <div className="mock-picker-booked-item__main">
                      <strong>{slot.label}</strong>
                      <span>{slot.calendarTimeShort}</span>
                    </div>
                    {record ? (
                      <div className="mock-picker-booked-item__actions">
                        {canCancel ? (
                          <button
                            type="button"
                            className="mock-picker-cancel-btn"
                            onClick={() => onRequestCancel(slot, record)}
                          >
                            Cancel &amp; rebook
                          </button>
                        ) : (
                          <span className="mock-picker-cancel-hint" title={blockReason ?? undefined}>
                            {blockReason ?? 'Cannot cancel'}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}

      {activeTab === 'results' ? (
        <div className="mock-picker-results-panel">
          <h2 className="mock-picker-title">Mock Results List</h2>
          <p className="mock-picker-empty">
            Results will appear here after your mock class is completed and reviewed.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function ConfirmSlotDialog({
  slot,
  remaining,
  onConfirm,
  onReschedule,
}: {
  slot: MockSlot
  remaining: number
  onConfirm: () => void
  onReschedule: () => void
}) {
  return (
    <div className="mock-dialog-root" role="dialog" aria-modal="true" aria-labelledby="mock-confirm-title">
      <div className="mock-dialog-scrim" aria-hidden />
      <div className="mock-dialog-panel">
        <h3 id="mock-confirm-title" className="mock-dialog-title">
          Confirm this mock slot?
        </h3>
        <p className="mock-dialog-body">
          Confirm this time slot? You have <strong>{remaining}</strong> booking
          {remaining === 1 ? '' : 's'} left — choose a time you can attend.
        </p>
        <p className="mock-dialog-slot">{slot.label}</p>
        <div className="mock-dialog-actions">
          <button type="button" className="mock-dialog-btn mock-dialog-btn--primary" onClick={onConfirm}>
            Confirm
          </button>
          <button type="button" className="mock-dialog-btn mock-dialog-btn--secondary" onClick={onReschedule}>
            Choose another time
          </button>
        </div>
      </div>
    </div>
  )
}

function ConflictDialog({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mock-dialog-root" role="alertdialog" aria-modal="true" aria-labelledby="mock-conflict-title">
      <div className="mock-dialog-scrim" aria-hidden onClick={onDismiss} />
      <div className="mock-dialog-panel mock-dialog-panel--warn">
        <h3 id="mock-conflict-title" className="mock-dialog-title">
          Schedule conflict
        </h3>
        <p className="mock-dialog-body">
          You already have a workshop booked at this time. Please choose a different slot.
        </p>
        <div className="mock-dialog-actions mock-dialog-actions--single">
          <button type="button" className="mock-dialog-btn mock-dialog-btn--primary" onClick={onDismiss}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessDialog({
  bookedCount,
  onViewSchedule,
  onContinue,
}: {
  bookedCount: number
  onViewSchedule: () => void
  onContinue: () => void
}) {
  return (
    <div className="mock-dialog-root" role="dialog" aria-modal="true" aria-labelledby="mock-success-title">
      <div className="mock-dialog-scrim" aria-hidden />
      <div className="mock-dialog-panel mock-dialog-panel--success">
        <span className="mock-dialog-success-icon" aria-hidden>
          ✓
        </span>
        <h3 id="mock-success-title" className="mock-dialog-title">
          Mock booked successfully
        </h3>
        <p className="mock-dialog-body">
          You have booked <strong>{bookedCount}</strong> mock
          {bookedCount === 1 ? '' : 's'}.
          {bookedCount < MOCK_BOOKING_LIMIT
            ? ` You can book ${MOCK_BOOKING_LIMIT - bookedCount} more.`
            : ' You have used all available mock bookings.'}
        </p>
        <div className="mock-dialog-actions">
          <button type="button" className="mock-dialog-btn mock-dialog-btn--primary" onClick={onViewSchedule}>
            View schedule
          </button>
          {bookedCount < MOCK_BOOKING_LIMIT ? (
            <button type="button" className="mock-dialog-btn mock-dialog-btn--secondary" onClick={onContinue}>
              Book another
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CloseReminderDialog({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mock-dialog-root" role="alertdialog" aria-modal="true" aria-labelledby="mock-close-title">
      <div className="mock-dialog-scrim" aria-hidden />
      <div className="mock-dialog-panel mock-dialog-panel--warn">
        <h3 id="mock-close-title" className="mock-dialog-title">
          Book your mock soon
        </h3>
        <p className="mock-dialog-body">
          Complete your mock early to earn a <strong>$7</strong> bonus and build stronger teaching skills for
          better reviews.
        </p>
        <div className="mock-dialog-actions mock-dialog-actions--single">
          <button type="button" className="mock-dialog-btn mock-dialog-btn--primary" onClick={onDismiss}>
            Back to training map
          </button>
        </div>
      </div>
    </div>
  )
}

export function MockBookingOverlay({
  sourceNodeId,
  mockBookings,
  taskPolicies,
  bookedWorkshopSessionIds,
  onCompleteBooking,
  onCancelBooking,
  onClose,
}: MockBookingOverlayProps) {
  const [view, setView] = useState<MockView>('picker')
  const [localBookings, setLocalBookings] = useState<MockBookingRecord[]>(() => [...mockBookings])
  const [pendingSlot, setPendingSlot] = useState<MockSlot | null>(null)
  const [showConflict, setShowConflict] = useState(false)
  const [pendingCancel, setPendingCancel] = useState<{ slot: MockSlot; record: MockBookingRecord } | null>(null)

  useEffect(() => {
    setLocalBookings([...mockBookings])
  }, [mockBookings])

  const bookedIds = useMemo(() => new Set(localBookings.map((b) => b.slotId)), [localBookings])
  const bookedCount = bookedIds.size
  const remaining = Math.max(0, MOCK_BOOKING_LIMIT - bookedCount)

  const handleRequestClose = useCallback(() => {
    if (bookedCount === 0) {
      setView('close-reminder')
      return
    }
    onClose()
  }, [bookedCount, onClose])

  const handleSelectSlot = useCallback(
    (slot: MockSlot) => {
      if (bookedIds.has(slot.id)) return
      if (bookedCount >= MOCK_BOOKING_LIMIT) return
      if (resolveMockBookingNodeId(sourceNodeId, localBookings, taskPolicies) == null) return
      const conflict = findWorkshopConflict(slot, bookedWorkshopSessionIds)
      if (conflict) {
        setShowConflict(true)
        return
      }
      setPendingSlot(slot)
    },
    [bookedIds, bookedCount, bookedWorkshopSessionIds, sourceNodeId, localBookings, taskPolicies],
  )

  const handleConfirmSlot = useCallback(() => {
    if (!pendingSlot) return
    const targetNodeId = resolveMockBookingNodeId(sourceNodeId, localBookings, taskPolicies)
    if (!targetNodeId) return
    setLocalBookings((prev) => {
      const withoutNode = prev.filter((b) => b.nodeId !== targetNodeId)
      return [...withoutNode, { slotId: pendingSlot.id, nodeId: targetNodeId }]
    })
    onCompleteBooking([pendingSlot.id], targetNodeId)
    setPendingSlot(null)
    setView('success')
  }, [pendingSlot, onCompleteBooking, sourceNodeId, localBookings, taskPolicies])

  const handleConfirmCancel = useCallback(() => {
    if (!pendingCancel) return
    const { slot } = pendingCancel
    setLocalBookings((prev) => prev.filter((b) => b.slotId !== slot.id))
    onCancelBooking(slot.id)
    setPendingCancel(null)
  }, [pendingCancel, onCancelBooking])

  useEffect(() => {
    if (view !== 'schedule') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleRequestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, handleRequestClose])

  if (view === 'schedule') {
    return (
      <CombinedScheduleCalendar
        bookedWorkshopSessionIds={bookedWorkshopSessionIds}
        bookedMockSlotIds={[...bookedIds]}
        title="WORKSHOPS & MOCKS"
        subtitle="Your combined training schedule"
        onClose={handleRequestClose}
      />
    )
  }

  if (view === 'close-reminder') {
    return <CloseReminderDialog onDismiss={onClose} />
  }

  return (
    <div className="mock-booking-overlay-root">
      <button
        type="button"
        className="mock-booking-overlay-backdrop"
        aria-label="Close mock booking"
        onClick={handleRequestClose}
      />
      <div className="mock-booking-overlay-panel mock-booking-overlay-panel--picker" role="dialog" aria-modal="true" aria-label="Mock class booking">
        <div className="mock-booking-overlay-toolbar">
          <button type="button" className="mock-booking-back-btn" onClick={handleRequestClose}>
            ← Back to training map
          </button>
          {bookedCount > 0 ? (
            <button type="button" className="mock-booking-schedule-link" onClick={() => setView('schedule')}>
              View combined schedule
            </button>
          ) : null}
        </div>

        {view === 'picker' ? (
          <MockPickerPanel
            sourceNodeId={sourceNodeId}
            mockBookings={localBookings}
            taskPolicies={taskPolicies}
            bookedSlotIds={bookedIds}
            bookedWorkshopSessionIds={bookedWorkshopSessionIds}
            onSelectSlot={handleSelectSlot}
            onRequestCancel={(slot, record) => setPendingCancel({ slot, record })}
          />
        ) : null}

        {pendingSlot ? (
          <ConfirmSlotDialog
            slot={pendingSlot}
            remaining={remaining}
            onConfirm={handleConfirmSlot}
            onReschedule={() => setPendingSlot(null)}
          />
        ) : null}

        {showConflict ? <ConflictDialog onDismiss={() => setShowConflict(false)} /> : null}

        {pendingCancel ? (
          <CancelBookingDialog
            title="Cancel this mock booking?"
            body="You can book a different time once. This is your only cancel & rebook for this task, and the new slot must be more than 24 hours away."
            onConfirm={handleConfirmCancel}
            onDismiss={() => setPendingCancel(null)}
          />
        ) : null}

        {view === 'success' ? (
          <SuccessDialog
            bookedCount={bookedCount}
            onViewSchedule={() => setView('schedule')}
            onContinue={() => setView('picker')}
          />
        ) : null}
      </div>
    </div>
  )
}
