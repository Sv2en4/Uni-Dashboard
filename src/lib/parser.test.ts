import { describe, expect, it } from 'vitest'
import { parseDateWord, parseQuickInput } from '@/lib/parser'
import type { Module } from '@/lib/types'

// Sunday, 18 October 2026
const TODAY = new Date(2026, 9, 18)

const mod = (kuerzel: string, archiviert = false): Module => ({
  id: kuerzel,
  user_id: 'u',
  name: kuerzel.toUpperCase(),
  kuerzel,
  farbe: '#8b5cf6',
  archiviert,
  last_touched_at: null,
  created_at: '',
})
const MODULES = [mod('stat'), mod('mikro'), mod('alt', true)]

const iso = (d: Date | null) =>
  d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

describe('parseDateWord', () => {
  it('heute / morgen / übermorgen', () => {
    expect(iso(parseDateWord('heute', TODAY))).toBe('2026-10-18')
    expect(iso(parseDateWord('Morgen', TODAY))).toBe('2026-10-19')
    expect(iso(parseDateWord('übermorgen', TODAY))).toBe('2026-10-20')
  })

  it('weekday = next occurrence, today included', () => {
    expect(iso(parseDateWord('so', TODAY))).toBe('2026-10-18') // today is Sunday
    expect(iso(parseDateWord('mo', TODAY))).toBe('2026-10-19')
    expect(iso(parseDateWord('fr', TODAY))).toBe('2026-10-23')
    expect(iso(parseDateWord('Samstag', TODAY))).toBe('2026-10-24')
  })

  it('dd.mm. dates, past ones roll over to next year', () => {
    expect(iso(parseDateWord('24.10.', TODAY))).toBe('2026-10-24')
    expect(iso(parseDateWord('24.10', TODAY))).toBe('2026-10-24')
    expect(iso(parseDateWord('18.10.', TODAY))).toBe('2026-10-18') // today stays this year
    expect(iso(parseDateWord('1.3.', TODAY))).toBe('2027-03-01')
    expect(iso(parseDateWord('5.1.2026', TODAY))).toBe('2026-01-05') // explicit year: kept
  })

  it('rejects non-dates', () => {
    expect(parseDateWord('31.02.', TODAY)).toBeNull()
    expect(parseDateWord('13.13.', TODAY)).toBeNull()
    expect(parseDateWord('3', TODAY)).toBeNull()
    expect(parseDateWord('Blatt', TODAY)).toBeNull()
  })
})

describe('parseQuickInput', () => {
  it('example from the spec', () => {
    const r = parseQuickInput('Übungsblatt 3 #stat fr', 'aufgabe', MODULES, TODAY)
    expect(r).toMatchObject({
      mode: 'aufgabe',
      titel: 'Übungsblatt 3',
      datum: '2026-10-23',
      error: null,
    })
    expect(r.module?.kuerzel).toBe('stat')
  })

  it('task without date or module is fine', () => {
    const r = parseQuickInput('Bücher zurückgeben', 'aufgabe', MODULES, TODAY)
    expect(r).toMatchObject({ titel: 'Bücher zurückgeben', module: null, datum: null, error: null })
  })

  it('tokens can be anywhere, shortcut is case-insensitive', () => {
    const r = parseQuickInput('#STAT morgen Blatt lesen', 'aufgabe', MODULES, TODAY)
    expect(r.titel).toBe('Blatt lesen')
    expect(r.module?.kuerzel).toBe('stat')
    expect(r.datum).toBe('2026-10-19')
  })

  it('unknown and archived shortcuts are reported', () => {
    expect(parseQuickInput('Blatt #xyz', 'aufgabe', MODULES, TODAY)).toMatchObject({
      module: null,
      unknownKuerzel: '#xyz',
      titel: 'Blatt',
    })
    expect(parseQuickInput('Blatt #alt', 'aufgabe', MODULES, TODAY).module).toBeNull()
  })

  it('events: default type abgabe, !types recognized', () => {
    expect(parseQuickInput('Hausarbeit 24.10.', 'termin', MODULES, TODAY)).toMatchObject({
      mode: 'termin',
      typ: 'abgabe',
      datum: '2026-10-24',
      error: null,
    })
    expect(parseQuickInput('Klausur !pruefung #stat 12.02.', 'termin', MODULES, TODAY)).toMatchObject({
      titel: 'Klausur',
      typ: 'pruefung',
      datum: '2027-02-12',
    })
    expect(parseQuickInput('Test 2 !test mo', 'termin', MODULES, TODAY).typ).toBe('zwischentest')
    expect(parseQuickInput('Klausur !prüfung fr', 'termin', MODULES, TODAY).typ).toBe('pruefung')
  })

  it('!type switches a task to an event', () => {
    expect(parseQuickInput('Klausur !pruefung fr', 'aufgabe', MODULES, TODAY).mode).toBe('termin')
  })

  it('event without date cannot be saved', () => {
    expect(parseQuickInput('Klausur !pruefung', 'termin', MODULES, TODAY).error).toBe('Datum fehlt')
  })

  it('missing title', () => {
    expect(parseQuickInput('#stat fr', 'aufgabe', MODULES, TODAY).error).toBe('Titel fehlt')
    expect(parseQuickInput('', 'aufgabe', MODULES, TODAY).error).toBe('Titel fehlt')
  })

  it('unknown !word stays in the title', () => {
    expect(parseQuickInput('Wichtig !!', 'aufgabe', MODULES, TODAY).titel).toBe('Wichtig !!')
  })
})
