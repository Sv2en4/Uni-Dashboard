import { describe, expect, it } from 'vitest'
import {
  activityAmpel,
  activityText,
  countdownText,
  daysSince,
  daysUntil,
  eventUrgency,
  isEventVisible,
  taskGroup,
} from '@/lib/dates'
import type { UniEvent } from '@/lib/types'

const WED = new Date(2026, 9, 14, 15, 30) // Wednesday 14.10.2026, afternoon
const SUN = new Date(2026, 9, 18, 9, 0) // Sunday 18.10.2026

describe('countdown and urgency', () => {
  it('days until ignores the time of day', () => {
    expect(daysUntil('2026-10-14', WED)).toBe(0)
    expect(daysUntil('2026-10-15', WED)).toBe(1)
    expect(daysUntil('2026-10-12', WED)).toBe(-2)
  })

  it('countdown text', () => {
    expect(countdownText(0)).toBe('heute')
    expect(countdownText(1)).toBe('morgen')
    expect(countdownText(3)).toBe('in 3 Tagen')
    expect(countdownText(-1)).toBe('seit gestern fällig')
    expect(countdownText(-4)).toBe('seit 4 Tagen fällig')
  })

  it('urgency: red up to 3 days, orange up to 7', () => {
    expect(eventUrgency(-2)).toBe('rot')
    expect(eventUrgency(3)).toBe('rot')
    expect(eventUrgency(4)).toBe('orange')
    expect(eventUrgency(7)).toBe('orange')
    expect(eventUrgency(8)).toBe('neutral')
  })
})

describe('event visibility', () => {
  const ev = (typ: UniEvent['typ'], datum: string, erledigt = false): UniEvent => ({
    id: '1', user_id: 'u', module_id: null, titel: 'x', typ, datum, erledigt, erledigt_am: null, created_at: '',
  })
  it('past exams disappear, past submissions stay until done', () => {
    expect(isEventVisible(ev('pruefung', '2026-10-13'), WED)).toBe(false)
    expect(isEventVisible(ev('pruefung', '2026-10-14'), WED)).toBe(true)
    expect(isEventVisible(ev('abgabe', '2026-10-01'), WED)).toBe(true)
    expect(isEventVisible(ev('abgabe', '2026-10-01', true), WED)).toBe(false)
  })
})

describe('last activity', () => {
  it('days since a timestamp, by calendar day', () => {
    expect(daysSince(null, WED)).toBeNull()
    expect(daysSince(new Date(2026, 9, 14, 1).toISOString(), WED)).toBe(0)
    expect(daysSince(new Date(2026, 9, 13, 23).toISOString(), WED)).toBe(1)
    expect(daysSince(new Date(2026, 9, 4, 12).toISOString(), WED)).toBe(10)
  })

  it('traffic light: green < 5, orange 5–9, red ≥ 10, grey never', () => {
    expect(activityAmpel(null)).toBe('grau')
    expect(activityAmpel(0)).toBe('gruen')
    expect(activityAmpel(4)).toBe('gruen')
    expect(activityAmpel(5)).toBe('orange')
    expect(activityAmpel(9)).toBe('orange')
    expect(activityAmpel(10)).toBe('rot')
  })

  it('text', () => {
    expect(activityText(null)).toBe('noch nie')
    expect(activityText(0)).toBe('heute')
    expect(activityText(1)).toBe('gestern')
    expect(activityText(6)).toBe('vor 6 Tagen')
  })
})

describe('task groups', () => {
  it('on a Wednesday', () => {
    expect(taskGroup(null, WED)).toBe('Ohne Datum')
    expect(taskGroup('2026-10-13', WED)).toBe('Überfällig')
    expect(taskGroup('2026-10-14', WED)).toBe('Heute')
    expect(taskGroup('2026-10-15', WED)).toBe('Diese Woche')
    expect(taskGroup('2026-10-18', WED)).toBe('Diese Woche') // Sunday
    expect(taskGroup('2026-10-19', WED)).toBe('Später') // next Monday
  })

  it('on a Sunday, tomorrow is already next week', () => {
    expect(taskGroup('2026-10-18', SUN)).toBe('Heute')
    expect(taskGroup('2026-10-19', SUN)).toBe('Später')
  })
})
