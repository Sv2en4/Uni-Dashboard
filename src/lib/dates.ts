import { differenceInCalendarDays, endOfISOWeek, format, parse, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  AKTIVITAET_ORANGE_AB_TAGEN,
  AKTIVITAET_ROT_AB_TAGEN,
  TERMIN_ORANGE_BIS_TAGE,
  TERMIN_ROT_BIS_TAGE,
} from '@/lib/constants'
import type { UniEvent } from '@/lib/types'

// The database stores dates as 'YYYY-MM-DD' (no time, no timezone).
// These helpers convert between that format and JavaScript Date (local time).

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function fromISODate(iso: string): Date {
  return parse(iso, 'yyyy-MM-dd', new Date())
}

// '2026-10-23' → 'Fr, 23.10.'
export function formatDatum(iso: string): string {
  return format(fromISODate(iso), 'EEEEEE, dd.MM.', { locale: de })
}

// Days from today until a date: 0 = today, 1 = tomorrow, -2 = two days ago
export function daysUntil(iso: string, today: Date = new Date()): number {
  return differenceInCalendarDays(fromISODate(iso), today)
}

// ---------- Events ----------

// "heute", "morgen", "in 3 Tagen", "seit gestern fällig", "seit 4 Tagen fällig"
export function countdownText(days: number): string {
  if (days === 0) return 'heute'
  if (days === 1) return 'morgen'
  if (days > 1) return `in ${days} Tagen`
  if (days === -1) return 'seit gestern fällig'
  return `seit ${-days} Tagen fällig`
}

export type Urgency = 'rot' | 'orange' | 'neutral'

export function eventUrgency(days: number): Urgency {
  if (days <= TERMIN_ROT_BIS_TAGE) return 'rot' // includes overdue
  if (days <= TERMIN_ORANGE_BIS_TAGE) return 'orange'
  return 'neutral'
}

// Decision 5: exams/tests disappear after their date, submissions stay until ticked off
export function isEventVisible(e: UniEvent, today: Date = new Date()): boolean {
  if (e.erledigt) return false
  return e.typ === 'abgabe' || daysUntil(e.datum, today) >= 0
}

// ---------- Modules: last activity ----------

export type Ampel = 'gruen' | 'orange' | 'rot' | 'grau'

export function daysSince(timestamp: string | null, today: Date = new Date()): number | null {
  if (!timestamp) return null
  return differenceInCalendarDays(today, parseISO(timestamp))
}

export function activityAmpel(days: number | null): Ampel {
  if (days === null) return 'grau'
  if (days < AKTIVITAET_ORANGE_AB_TAGEN) return 'gruen'
  if (days < AKTIVITAET_ROT_AB_TAGEN) return 'orange'
  return 'rot'
}

export function activityText(days: number | null): string {
  if (days === null) return 'noch nie'
  if (days <= 0) return 'heute'
  if (days === 1) return 'gestern'
  return `vor ${days} Tagen`
}

// ---------- Tasks: grouping ----------

export const TASK_GROUPS = ['Überfällig', 'Heute', 'Diese Woche', 'Später', 'Ohne Datum'] as const
export type TaskGroup = (typeof TASK_GROUPS)[number]

// Decision 4: "Diese Woche" = tomorrow up to and including Sunday of this week
export function taskGroup(faellig: string | null, today: Date = new Date()): TaskGroup {
  if (!faellig) return 'Ohne Datum'
  const days = daysUntil(faellig, today)
  if (days < 0) return 'Überfällig'
  if (days === 0) return 'Heute'
  if (fromISODate(faellig) <= endOfISOWeek(today)) return 'Diese Woche'
  return 'Später'
}
