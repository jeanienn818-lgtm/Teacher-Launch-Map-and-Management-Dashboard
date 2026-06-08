import {
  formatMinutes12h,
  formatSlotDateTime,
  parseWorkshopTimeLabel,
  rangesOverlap,
  type TimeRange,
} from '../booking/bookingTime'
import { sessionsById, type WorkshopSession } from '../workshop/workshopSessions'

export const MOCK_BOOKING_LIMIT = 2

/** Mock booking picker shows today + next 6 days (7 total). */
export const MOCK_BOOKING_DAYS = 7

export type MockSlotAvailability = 'available' | 'booked' | 'workshop' | 'unavailable' | 'past'

export type MockTypeId = 'china' | 'international'

export interface MockSlot {
  id: string
  year: number
  month: number
  day: number
  hour: number
  minute: 0 | 30
  /** e.g. Mon, Jun 1 · 9:00 AM */
  label: string
  calendarTimeShort: string
}

export interface MockBookingDay {
  year: number
  month: number
  day: number
  weekdayShort: string
  /** e.g. May 26th (Tuesday) */
  columnLabel: string
  isToday: boolean
  dayIndex: number
}

/** All 30-minute rows in the picker (12:00 AM – 11:30 PM). */
export const MOCK_PICKER_HOURS = Array.from({ length: 24 }, (_, i) => i) as readonly number[]

function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

function daySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

export function formatMockDayColumnLabel(d: Date): string {
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const dayNum = d.getDate()
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  return `${month} ${dayNum}${daySuffix(dayNum)} (${weekday})`
}

export function getMockBookingDays(ref: Date = new Date()): MockBookingDay[] {
  const today = startOfDay(ref)
  return Array.from({ length: MOCK_BOOKING_DAYS }, (_, dayIndex) => {
    const d = addDays(today, dayIndex)
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      weekdayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
      columnLabel: formatMockDayColumnLabel(d),
      isToday: dayIndex === 0,
      dayIndex,
    }
  })
}

export function mockSlotId(year: number, month: number, day: number, hour: number, minute: 0 | 30): string {
  return `mock-${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}-${String(hour).padStart(2, '0')}${minute === 30 ? '30' : '00'}`
}

export function parseMockSlotId(id: string): MockSlot | null {
  const m = id.match(/^mock-(\d{4})-(\d{2})-(\d{2})-(\d{2})(00|30)$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const hour = Number(m[4])
  const minute = (m[5] === '30' ? 30 : 0) as 0 | 30
  return buildMockSlot(year, month, day, hour, minute)
}

export function mockSlotToRange(slot: MockSlot): TimeRange {
  const startMinutes = slot.hour * 60 + slot.minute
  return {
    year: slot.year,
    month: slot.month,
    day: slot.day,
    startMinutes,
    endMinutes: startMinutes + 30,
  }
}

export function workshopSessionToRange(session: WorkshopSession): TimeRange {
  const { startMinutes, endMinutes } = parseWorkshopTimeLabel(session.timeLabel)
  return {
    year: session.year,
    month: session.month,
    day: session.day,
    startMinutes,
    endMinutes,
  }
}

export function buildMockSlot(year: number, month: number, day: number, hour: number, minute: 0 | 30): MockSlot {
  const startMinutes = hour * 60 + minute
  const parts = { year, month, day }
  return {
    id: mockSlotId(year, month, day, hour, minute),
    year,
    month,
    day,
    hour,
    minute,
    label: formatSlotDateTime(parts, startMinutes),
    calendarTimeShort: `@${formatMinutes12h(startMinutes).replace(' ', '').toLowerCase()} ET`,
  }
}

export function mockSlotsForDay(day: MockBookingDay): MockSlot[] {
  const slots: MockSlot[] = []
  for (const hour of MOCK_PICKER_HOURS) {
    slots.push(buildMockSlot(day.year, day.month, day.day, hour, 0))
    slots.push(buildMockSlot(day.year, day.month, day.day, hour, 30))
  }
  return slots
}

export function mockSlotsForNextSevenDays(ref: Date = new Date()): MockSlot[] {
  return getMockBookingDays(ref).flatMap((day) => mockSlotsForDay(day))
}

export function mockSlotsByIds(ids: readonly string[]): MockSlot[] {
  return ids.map((id) => parseMockSlotId(id)).filter((s): s is MockSlot => Boolean(s))
}

export function mockBookedCountLabel(count: number): string {
  if (count <= 0) return ''
  return count === 1 ? '1 Mock Booked' : `${count} Mocks Booked`
}

export function getMockSlotStartDate(slot: MockSlot): Date {
  return new Date(slot.year, slot.month - 1, slot.day, slot.hour, slot.minute, 0, 0)
}

export function isMockSlotInPast(slot: MockSlot, ref: Date = new Date()): boolean {
  return getMockSlotStartDate(slot).getTime() <= ref.getTime()
}

/** Demo availability: prime 3:00 PM – 9:30 PM; some 9:00 AM – 12:00 PM on even day offsets. */
function isPrimeOrMorningOpen(slot: MockSlot, dayIndex: number): boolean {
  const minutes = slot.hour * 60 + slot.minute
  const primeOpen = minutes >= 15 * 60 && minutes < 21 * 60 + 30
  const morningOpen = dayIndex % 2 === 0 && minutes >= 9 * 60 && minutes < 12 * 60
  return primeOpen || morningOpen
}

export function getMockSlotAvailability(
  slot: MockSlot,
  dayIndex: number,
  bookedMockIds: Set<string>,
  bookedWorkshopSessionIds: readonly string[],
  ref: Date = new Date(),
): MockSlotAvailability {
  if (isMockSlotInPast(slot, ref)) return 'past'
  if (bookedMockIds.has(slot.id)) return 'booked'
  if (findWorkshopConflict(slot, bookedWorkshopSessionIds, ref)) return 'workshop'
  if (!isPrimeOrMorningOpen(slot, dayIndex)) return 'unavailable'
  return 'available'
}

export function findWorkshopConflict(
  slot: MockSlot,
  bookedWorkshopSessionIds: readonly string[],
  ref: Date = new Date(),
): WorkshopSession | null {
  const slotRange = mockSlotToRange(slot)
  for (const session of sessionsById([...bookedWorkshopSessionIds], ref)) {
    if (rangesOverlap(slotRange, workshopSessionToRange(session))) return session
  }
  return null
}

export function findMockConflict(
  session: WorkshopSession,
  bookedMockSlotIds: readonly string[],
): MockSlot | null {
  const sessionRange = workshopSessionToRange(session)
  for (const slot of mockSlotsByIds(bookedMockSlotIds)) {
    if (rangesOverlap(sessionRange, mockSlotToRange(slot))) return slot
  }
  return null
}

export function defaultMockTypeForNode(nodeId: string): MockTypeId | null {
  if (nodeId === 'mock-lv23') return 'china'
  if (nodeId === 'mock-lv46') return 'international'
  return null
}

/** First bookable slot in chronological order (for auto-scroll). */
export function findFirstAvailableMockSlotId(
  days: readonly MockBookingDay[],
  bookedMockIds: Set<string>,
  bookedWorkshopSessionIds: readonly string[],
  ref: Date = new Date(),
): string | null {
  for (const day of days) {
    for (const hour of MOCK_PICKER_HOURS) {
      for (const minute of [0, 30] as const) {
        const slot = buildMockSlot(day.year, day.month, day.day, hour, minute)
        if (
          getMockSlotAvailability(slot, day.dayIndex, bookedMockIds, bookedWorkshopSessionIds, ref) ===
          'available'
        ) {
          return slot.id
        }
      }
    }
  }
  return null
}
