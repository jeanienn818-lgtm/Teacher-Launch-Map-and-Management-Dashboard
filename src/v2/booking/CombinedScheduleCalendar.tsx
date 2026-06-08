import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import {
  bookingWindowRangeLabel,
  getCurrentBookingWeekBounds,
  getMonthsSpannedByWindow,
  isDateInCurrentBookingWeek,
  type CalendarDateParts,
} from '../booking/bookingWindow'
import { sessionsById, type WorkshopSession } from '../workshop/workshopSessions'
import { mockSlotsByIds, type MockSlot } from '../mock/mockSlots'

const WEEKDAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
const WEEKDAY_HEADER_COLORS = ['#e85d4c', '#f59e0b', '#eab308', '#14b8a6', '#22c55e', '#f97316', '#ef4444'] as const

export interface CombinedScheduleCalendarProps {
  bookedWorkshopSessionIds: readonly string[]
  bookedMockSlotIds: readonly string[]
  title?: string
  subtitle?: string
  onClose: () => void
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${month}-${day}`
}

function buildMonthCells(firstWeekday: number, daysInMonth: number): (number | null)[] {
  const cells: (number | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function MonthScheduleGrid({
  monthLabel,
  firstWeekday,
  daysInMonth,
  year,
  month,
  workshops,
  mocks,
  weekAnchorRef,
  weekAnchorTakenRef,
}: {
  monthLabel: string
  firstWeekday: number
  daysInMonth: number
  year: number
  month: number
  workshops: WorkshopSession[]
  mocks: MockSlot[]
  weekAnchorRef: RefObject<HTMLDivElement | null>
  weekAnchorTakenRef: RefObject<boolean>
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, { workshops: WorkshopSession[]; mocks: MockSlot[] }>()
    for (const s of workshops) {
      if (s.year !== year || s.month !== month) continue
      const key = dateKey(s.year, s.month, s.day)
      const entry = map.get(key) ?? { workshops: [], mocks: [] }
      entry.workshops.push(s)
      map.set(key, entry)
    }
    for (const m of mocks) {
      if (m.year !== year || m.month !== month) continue
      const key = dateKey(m.year, m.month, m.day)
      const entry = map.get(key) ?? { workshops: [], mocks: [] }
      entry.mocks.push(m)
      map.set(key, entry)
    }
    return map
  }, [workshops, mocks, year, month])

  const cells = buildMonthCells(firstWeekday, daysInMonth)

  return (
    <section className="ws-schedule-month-block">
      <header className="ws-schedule-modal-head ws-schedule-modal-head--compact">
        <p className="ws-schedule-modal-month">{monthLabel.split(' ')[0]}</p>
        <h3 className="ws-schedule-modal-title ws-schedule-modal-title--compact">{monthLabel}</h3>
      </header>
      <div className="ws-schedule-grid">
        {WEEKDAY_HEADERS.map((label, i) => (
          <div key={`${monthLabel}-${label}`} className="ws-schedule-dow" style={{ backgroundColor: WEEKDAY_HEADER_COLORS[i] }}>
            {label}
          </div>
        ))}
        {cells.map((day, idx) => {
          const entry = day != null ? (byDay.get(dateKey(year, month, day)) ?? { workshops: [], mocks: [] }) : null
          const hasWorkshop = (entry?.workshops.length ?? 0) > 0
          const hasMock = (entry?.mocks.length ?? 0) > 0
          const parts: CalendarDateParts | null =
            day != null ? { year, month, day } : null
          const inCurrentWeek = parts != null && isDateInCurrentBookingWeek(parts)
          const isToday =
            parts != null &&
            parts.year === new Date().getFullYear() &&
            parts.month === new Date().getMonth() + 1 &&
            parts.day === new Date().getDate()

          const useWeekAnchor =
            inCurrentWeek && !weekAnchorTakenRef.current && day != null
          if (useWeekAnchor) {
            weekAnchorTakenRef.current = true
          }

          const cellClasses = [
            'ws-schedule-cell',
            hasWorkshop ? 'ws-schedule-cell--workshop' : '',
            hasMock ? 'ws-schedule-cell--mock' : '',
            inCurrentWeek ? 'ws-schedule-cell--current-week' : '',
            isToday ? 'ws-schedule-cell--today' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <div
              key={`${monthLabel}-cell-${idx}`}
              ref={useWeekAnchor ? weekAnchorRef : undefined}
              className={cellClasses}
            >
              {day != null ? (
                <span className={`ws-schedule-day-num${isToday ? ' ws-schedule-day-num--today' : ''}`}>{day}</span>
              ) : null}
              {entry?.workshops.map((s) => (
                <div key={s.id} className="ws-schedule-event ws-schedule-event--workshop">
                  <strong>{s.topic}</strong>
                  <span>{s.calendarTimeShort}</span>
                </div>
              ))}
              {entry?.mocks.map((m) => (
                <div key={m.id} className="ws-schedule-event ws-schedule-event--mock">
                  <strong>Mock Class</strong>
                  <span>{m.calendarTimeShort}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function CombinedScheduleCalendar({
  bookedWorkshopSessionIds,
  bookedMockSlotIds,
  title = 'TRAINING SCHEDULE',
  subtitle = 'Your booked workshops & mock classes',
  onClose,
}: CombinedScheduleCalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const weekAnchorRef = useRef<HTMLDivElement>(null)
  const weekAnchorTakenRef = useRef(false)
  const didScrollRef = useRef(false)

  const bookedWorkshops = useMemo(
    () => sessionsById([...bookedWorkshopSessionIds]),
    [bookedWorkshopSessionIds],
  )
  const bookedMocks = useMemo(() => mockSlotsByIds(bookedMockSlotIds), [bookedMockSlotIds])
  const spannedMonths = useMemo(() => getMonthsSpannedByWindow(), [])
  const windowLabel = bookingWindowRangeLabel()
  const currentWeekLabel = useMemo(() => {
    const { start, end } = getCurrentBookingWeekBounds()
    const startDate = new Date(start.year, start.month - 1, start.day)
    const endDate = new Date(end.year, end.month - 1, end.day)
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }, [])
  const hasBookings = bookedWorkshops.length > 0 || bookedMocks.length > 0

  const scrollToCurrentWeek = () => {
    if (didScrollRef.current) return
    const scrollEl = scrollRef.current
    const anchorEl = weekAnchorRef.current
    if (!scrollEl || !anchorEl) return
    didScrollRef.current = true
    const scrollRect = scrollEl.getBoundingClientRect()
    const anchorRect = anchorEl.getBoundingClientRect()
    const scrollTop = scrollEl.scrollTop + (anchorRect.top - scrollRect.top) - 12
    scrollEl.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' })
  }

  weekAnchorTakenRef.current = false

  useLayoutEffect(() => {
    didScrollRef.current = false
    weekAnchorTakenRef.current = false
    const id = window.requestAnimationFrame(() => {
      scrollToCurrentWeek()
      window.requestAnimationFrame(scrollToCurrentWeek)
    })
    return () => window.cancelAnimationFrame(id)
  }, [bookedWorkshopSessionIds, bookedMockSlotIds])

  return (
    <div className="ws-schedule-modal-root" role="dialog" aria-modal="true" aria-labelledby="ws-schedule-title">
      <div className="ws-schedule-modal-scrim" aria-hidden onClick={onClose} />
      <div className="ws-schedule-modal-panel ws-schedule-modal-panel--combined">
        <button type="button" className="ws-schedule-modal-close" onClick={onClose} aria-label="Close schedule calendar">
          ×
        </button>
        <header className="ws-schedule-modal-head">
          <h2 id="ws-schedule-title" className="ws-schedule-modal-title">
            {title}
          </h2>
          <p className="ws-schedule-modal-sub">{subtitle}</p>
          <p className="ws-schedule-modal-window">4-week window: {windowLabel}</p>
          <p className="ws-schedule-modal-current-week">Showing week of {currentWeekLabel}</p>
        </header>

        <div className="ws-schedule-legend" aria-hidden>
          <span className="ws-schedule-legend-item ws-schedule-legend-item--workshop">Workshop</span>
          <span className="ws-schedule-legend-item ws-schedule-legend-item--mock">Mock class</span>
        </div>

        <div ref={scrollRef} className="ws-schedule-modal-scroll">
          {spannedMonths.map((m) => (
            <MonthScheduleGrid
              key={`${m.year}-${m.month}`}
              monthLabel={m.label}
              firstWeekday={m.firstWeekday}
              daysInMonth={m.daysInMonth}
              year={m.year}
              month={m.month}
              workshops={bookedWorkshops}
              mocks={bookedMocks}
              weekAnchorRef={weekAnchorRef}
              weekAnchorTakenRef={weekAnchorTakenRef}
            />
          ))}

          {!hasBookings ? (
            <p className="ws-schedule-modal-empty">No bookings yet — reserve a workshop or mock class from your training map.</p>
          ) : null}
        </div>

        <p className="ws-schedule-modal-foot">Close this calendar to return to your training map.</p>
      </div>
    </div>
  )
}
