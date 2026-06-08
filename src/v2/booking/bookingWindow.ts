/** Rolling booking window: current week + 3 future weeks (4 weeks total). */

export const BOOKING_WINDOW_WEEKS = 4

const MS_PER_DAY = 86_400_000

export interface CalendarDateParts {
  year: number
  month: number
  day: number
}

export interface BookingWeekDay extends CalendarDateParts {
  weekdayShort: string
}

export interface BookingWeekConfig {
  weekIndex: number
  /** e.g. May 19 – May 25, 2026 */
  label: string
  daysInWeek: readonly BookingWeekDay[]
}

export interface SpannedMonth {
  year: number
  month: number
  label: string
  firstWeekday: number
  daysInMonth: number
}

export function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/** Monday-start week containing ref. */
export function getBookingWindowStart(ref: Date = new Date()): Date {
  const d = startOfDay(ref)
  const weekday = d.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  d.setDate(d.getDate() + mondayOffset)
  return d
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function getBookingWindowEnd(ref: Date = new Date()): Date {
  const start = getBookingWindowStart(ref)
  return addDays(start, BOOKING_WINDOW_WEEKS * 7 - 1)
}

export function toDateParts(d: Date): CalendarDateParts {
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  }
}

export function datePartsToDate(parts: CalendarDateParts): Date {
  return startOfDay(new Date(parts.year, parts.month - 1, parts.day))
}

export function isDateInBookingWindow(parts: CalendarDateParts, ref: Date = new Date()): boolean {
  const d = datePartsToDate(parts)
  const start = getBookingWindowStart(ref)
  const end = getBookingWindowEnd(ref)
  return d >= start && d <= end
}

export function formatWeekRangeLabel(weekStart: Date, weekEnd: Date): string {
  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' })
  const startDay = weekStart.getDate()
  const endDay = weekEnd.getDate()
  const year = weekEnd.getFullYear()
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`
}

export function buildBookingWeekConfig(weekIndex: number, ref: Date = new Date()): BookingWeekConfig {
  const windowStart = getBookingWindowStart(ref)
  const weekStart = addDays(windowStart, weekIndex * 7)
  const weekEnd = addDays(weekStart, 6)
  const daysInWeek: BookingWeekDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i)
    daysInWeek.push({
      ...toDateParts(d),
      weekdayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
    })
  }
  return {
    weekIndex,
    label: formatWeekRangeLabel(weekStart, weekEnd),
    daysInWeek,
  }
}

export function getBookingWindowWeeks(ref: Date = new Date()): BookingWeekConfig[] {
  return Array.from({ length: BOOKING_WINDOW_WEEKS }, (_, i) => buildBookingWeekConfig(i, ref))
}

export function getWeekIndexForDate(parts: CalendarDateParts, ref: Date = new Date()): number {
  const start = getBookingWindowStart(ref)
  const d = datePartsToDate(parts)
  const diffDays = Math.round((d.getTime() - start.getTime()) / MS_PER_DAY)
  if (diffDays < 0 || diffDays >= BOOKING_WINDOW_WEEKS * 7) return -1
  return Math.floor(diffDays / 7)
}

export function getMonthsSpannedByWindow(ref: Date = new Date()): SpannedMonth[] {
  const start = getBookingWindowStart(ref)
  const end = getBookingWindowEnd(ref)
  const months: SpannedMonth[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)

  while (cursor <= end) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth() + 1
    const firstDay = new Date(year, cursor.getMonth(), 1)
    const daysInMonth = new Date(year, cursor.getMonth() + 1, 0).getDate()
    months.push({
      year,
      month,
      label: firstDay.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase(),
      firstWeekday: firstDay.getDay(),
      daysInMonth,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return months
}

export function bookingWindowRangeLabel(ref: Date = new Date()): string {
  const start = getBookingWindowStart(ref)
  const end = getBookingWindowEnd(ref)
  return formatWeekRangeLabel(start, end)
}

/** Monday–Sunday bounds for the week that contains ref (week 0 of the booking window). */
export function getCurrentBookingWeekBounds(ref: Date = new Date()): {
  start: CalendarDateParts
  end: CalendarDateParts
} {
  const weekStart = getBookingWindowStart(ref)
  const weekEnd = addDays(weekStart, 6)
  return { start: toDateParts(weekStart), end: toDateParts(weekEnd) }
}

export function isDateInCurrentBookingWeek(parts: CalendarDateParts, ref: Date = new Date()): boolean {
  const d = datePartsToDate(parts)
  const { start, end } = getCurrentBookingWeekBounds(ref)
  return d >= datePartsToDate(start) && d <= datePartsToDate(end)
}
