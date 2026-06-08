/** Shared date/time helpers for mock slots and workshop sessions. */

export interface CalendarDayParts {
  year: number
  month: number
  day: number
}

export interface TimeRange extends CalendarDayParts {
  /** Minutes from midnight, inclusive start. */
  startMinutes: number
  /** Minutes from midnight, exclusive end. */
  endMinutes: number
}

export function parseAmPmToken(token: string): { hour: number; minute: number } | null {
  const m = token.trim().match(/^(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.|am|pm)$/i)
  if (!m) return null
  let hour = Number(m[1])
  const minute = Number(m[2])
  const meridiem = m[3]!.toLowerCase()
  const isPm = meridiem.startsWith('p')
  if (hour === 12) hour = isPm ? 12 : 0
  else if (isPm) hour += 12
  return { hour, minute }
}

/** e.g. "11:00 a.m. - 12:00 p.m." */
export function parseWorkshopTimeLabel(timeLabel: string): { startMinutes: number; endMinutes: number } {
  const parts = timeLabel.split(/\s*-\s*/)
  const start = parseAmPmToken(parts[0] ?? '')
  const end = parseAmPmToken(parts[1] ?? '')
  if (!start || !end) return { startMinutes: 0, endMinutes: 60 }
  return {
    startMinutes: start.hour * 60 + start.minute,
    endMinutes: end.hour * 60 + end.minute,
  }
}

export function sameCalendarDay(a: CalendarDayParts, b: CalendarDayParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  if (!sameCalendarDay(a, b)) return false
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes
}

export function formatMinutes12h(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const isPm = h24 >= 12
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  const mm = minute === 0 ? '' : `:${String(minute).padStart(2, '0')}`
  return `${h12}${mm} ${isPm ? 'PM' : 'AM'}`
}

export function formatSlotDateTime(parts: CalendarDayParts, startMinutes: number): string {
  const date = new Date(parts.year, parts.month - 1, parts.day)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  return `${weekday}, ${month} ${parts.day} · ${formatMinutes12h(startMinutes)}`
}
