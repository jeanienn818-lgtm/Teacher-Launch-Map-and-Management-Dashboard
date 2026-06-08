import {
  addDays,
  getBookingWindowStart,
  getWeekIndexForDate,
  type CalendarDateParts,
} from '../booking/bookingWindow'
import { parseWorkshopTimeLabel } from '../booking/bookingTime'

export type WorkshopSessionTag = 'raffle' | 'new'

/** Maps calendar rows to Step 4 / Step 5 on the training map (4 priority workshops). */
export type WorkshopTrainingStep = 4 | 5

export interface WorkshopSession {
  id: string
  /** e.g. Mon, May 25 */
  dateLabel: string
  year: number
  month: number
  day: number
  /** e.g. 11:00 a.m. - 12:00 p.m. */
  timeLabel: string
  /** Short line for calendar cell, e.g. @2pm ET */
  calendarTimeShort: string
  topic: string
  category: string
  tags?: WorkshopSessionTag[]
  /** Step 4 / Step 5 training-path workshop — highlighted on booking table. */
  trainingStep?: WorkshopTrainingStep
}

interface WorkshopSessionTemplate {
  id: string
  /** Days from the Monday of the current booking window (0–27). */
  dayOffset: number
  timeLabel: string
  calendarTimeShort: string
  topic: string
  category: string
  tags?: WorkshopSessionTag[]
  trainingStep?: WorkshopTrainingStep
}

const WORKSHOP_SESSION_TEMPLATES: readonly WorkshopSessionTemplate[] = [
  {
    id: 'ws-kickoff',
    dayOffset: 3,
    timeLabel: '11:00 a.m. - 12:00 p.m.',
    calendarTimeShort: '@11am ET',
    topic: 'New Teacher Kick Off',
    category: 'New Teachers Workshop',
    tags: ['new'],
    trainingStep: 4,
  },
  {
    id: 'ws-pacing',
    dayOffset: 5,
    timeLabel: '2:00 p.m. - 3:00 p.m.',
    calendarTimeShort: '@2pm ET',
    topic: 'Pacing w/Purpose',
    category: 'Monthly Workshop',
  },
  {
    id: 'ws-command',
    dayOffset: 7,
    timeLabel: '10:00 a.m. - 11:00 a.m.',
    calendarTimeShort: '@10am ET',
    topic: 'Classroom Command',
    category: 'Monthly Workshop',
    tags: ['raffle'],
  },
  {
    id: 'ws-bookings',
    dayOffset: 10,
    timeLabel: '1:00 p.m. - 2:00 p.m.',
    calendarTimeShort: '@1pm ET',
    topic: 'How to gain regular bookings',
    category: 'New Teachers Workshop',
    tags: ['new'],
    trainingStep: 5,
  },
  {
    id: 'ws-korean-am',
    dayOffset: 12,
    timeLabel: '9:00 a.m. - 10:00 a.m.',
    calendarTimeShort: '@9am ET',
    topic: 'Korean Platform Workshop',
    category: 'Monthly Workshop',
  },
  {
    id: 'ws-korean-pm',
    dayOffset: 12,
    timeLabel: '4:00 p.m. - 5:00 p.m.',
    calendarTimeShort: '@4pm ET',
    topic: 'Korean Platform Workshop',
    category: 'Monthly Workshop',
  },
  {
    id: 'ws-students',
    dayOffset: 14,
    timeLabel: '11:30 a.m. - 12:30 p.m.',
    calendarTimeShort: '@11:30am ET',
    topic: 'How to gain regular students',
    category: 'New Teachers Workshop',
    trainingStep: 4,
  },
  {
    id: 'ws-energy',
    dayOffset: 17,
    timeLabel: '3:00 p.m. - 4:00 p.m.',
    calendarTimeShort: '@3pm ET',
    topic: 'Energy Levels in the Classroom',
    category: 'Monthly Workshop',
    tags: ['raffle'],
  },
  {
    id: 'ws-teaching-skills',
    dayOffset: 21,
    timeLabel: '11:00 a.m. - 12:00 p.m.',
    calendarTimeShort: '@11am ET',
    topic: 'Teaching Skills Lab',
    category: 'New Teachers Workshop',
    tags: ['new'],
  },
  {
    id: 'ws-time-mgmt',
    dayOffset: 21,
    timeLabel: '2:00 p.m. - 3:00 p.m.',
    calendarTimeShort: '@2pm ET',
    topic: 'Time Management',
    category: 'Monthly Workshop',
    trainingStep: 5,
  },
  {
    id: 'ws-retention',
    dayOffset: 24,
    timeLabel: '12:00 p.m. - 1:00 p.m.',
    calendarTimeShort: '@12pm ET',
    topic: 'Student Retention Strategies',
    category: 'Monthly Workshop',
  },
] as const

function formatWorkshopDateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function getWorkshopSessions(ref: Date = new Date()): WorkshopSession[] {
  const windowStart = getBookingWindowStart(ref)
  return WORKSHOP_SESSION_TEMPLATES.map((template) => {
    const date = addDays(windowStart, template.dayOffset)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return {
      id: template.id,
      dateLabel: formatWorkshopDateLabel(date),
      year,
      month,
      day,
      timeLabel: template.timeLabel,
      calendarTimeShort: template.calendarTimeShort,
      topic: template.topic,
      category: template.category,
      tags: template.tags,
      trainingStep: template.trainingStep,
    }
  })
}

/** Sessions in the default 4-week booking window (includes this week). */
export const WORKSHOP_SESSIONS: readonly WorkshopSession[] = getWorkshopSessions()

export function getWorkshopSessionStartDate(session: WorkshopSession): Date {
  const { startMinutes } = parseWorkshopTimeLabel(session.timeLabel)
  const hour = Math.floor(startMinutes / 60)
  const minute = startMinutes % 60
  return new Date(session.year, session.month - 1, session.day, hour, minute, 0, 0)
}

export function sessionsById(ids: string[], ref: Date = new Date()): WorkshopSession[] {
  const set = new Set(ids)
  return getWorkshopSessions(ref).filter((s) => set.has(s.id))
}

export function countBookedSessionsForTrainingStep(
  bookedIds: readonly string[],
  step: WorkshopTrainingStep,
  ref: Date = new Date(),
): number {
  const set = new Set(bookedIds)
  return getWorkshopSessions(ref).filter((s) => s.trainingStep === step && set.has(s.id)).length
}

export function workshopBookedCountLabel(count: number): string {
  if (count <= 0) return ''
  return count === 1 ? '1 Workshop Booked' : `${count} Workshops Booked`
}

export function getWorkshopSessionWeekIndex(session: WorkshopSession, ref: Date = new Date()): number {
  const parts: CalendarDateParts = { year: session.year, month: session.month, day: session.day }
  return getWeekIndexForDate(parts, ref)
}

export function filterWorkshopSessionsByWeekIndex(
  sessions: readonly WorkshopSession[],
  weekIndex: number,
  ref: Date = new Date(),
): WorkshopSession[] {
  return sessions.filter((s) => getWorkshopSessionWeekIndex(s, ref) === weekIndex)
}
