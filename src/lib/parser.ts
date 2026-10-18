import { addDays, addYears, isBefore, isValid, startOfDay } from 'date-fns'
import { toISODate } from '@/lib/dates'
import type { EventTyp, Module } from '@/lib/types'

// Quick entry: "Übungsblatt 3 #stat fr" → title, module, date (and event type).
//
//   #kuerzel                 module by shortcut
//   heute, morgen, übermorgen
//   mo di mi do fr sa so     next such weekday, today included
//   24.10. / 24.10 / 24.10.2027   past dates without year → next year
//   !pruefung !test !abgabe  event type (also switches to "Termin")
//
// Everything else becomes the title.

export type Mode = 'aufgabe' | 'termin'

export type ParseResult = {
  mode: Mode // can differ from the toggle if a !type was typed
  titel: string
  module: Module | null
  unknownKuerzel: string | null // "#xyz" that matches no module
  datum: string | null // 'YYYY-MM-DD'
  typ: EventTyp
  error: string | null // reason why it cannot be saved yet
}

const WEEKDAYS: Record<string, number> = {
  so: 0, sonntag: 0,
  mo: 1, montag: 1,
  di: 2, dienstag: 2,
  mi: 3, mittwoch: 3,
  do: 4, donnerstag: 4,
  fr: 5, freitag: 5,
  sa: 6, samstag: 6,
}

const TYPES: Record<string, EventTyp> = {
  pruefung: 'pruefung',
  prüfung: 'pruefung',
  klausur: 'pruefung',
  test: 'zwischentest',
  zwischentest: 'zwischentest',
  abgabe: 'abgabe',
}

export function parseDateWord(word: string, today: Date): Date | null {
  const w = word.toLowerCase()
  const base = startOfDay(today)

  if (w === 'heute') return base
  if (w === 'morgen') return addDays(base, 1)
  if (w === 'übermorgen') return addDays(base, 2)

  if (w in WEEKDAYS) {
    const diff = (WEEKDAYS[w] - base.getDay() + 7) % 7
    return addDays(base, diff)
  }

  const m = w.match(/^(\d{1,2})\.(\d{1,2})\.?(\d{4})?$/)
  if (m) {
    const [, d, mo, y] = m
    const year = y ? Number(y) : base.getFullYear()
    const date = new Date(year, Number(mo) - 1, Number(d))
    // reject impossible dates like 31.02. (JS would roll over to March)
    if (!isValid(date) || date.getDate() !== Number(d) || date.getMonth() !== Number(mo) - 1) return null
    if (!y && isBefore(date, base)) return addYears(date, 1)
    return date
  }

  return null
}

export function parseQuickInput(
  input: string,
  mode: Mode,
  modules: Module[],
  today: Date = new Date(),
): ParseResult {
  const titleWords: string[] = []
  let module: Module | null = null
  let unknownKuerzel: string | null = null
  let datum: string | null = null
  let typ: EventTyp = 'abgabe'
  let typGiven = false

  for (const word of input.trim().split(/\s+/).filter(Boolean)) {
    if (word.startsWith('#') && word.length > 1) {
      const k = word.slice(1).toLowerCase()
      const found = modules.find((m) => !m.archiviert && m.kuerzel === k)
      if (found) {
        module = found
        unknownKuerzel = null
      } else {
        unknownKuerzel = word
      }
      continue
    }

    if (word.startsWith('!') && word.slice(1).toLowerCase() in TYPES) {
      typ = TYPES[word.slice(1).toLowerCase()]
      typGiven = true
      continue
    }

    const date = parseDateWord(word, today)
    if (date) {
      datum = toISODate(date)
      continue
    }

    titleWords.push(word)
  }

  const effectiveMode: Mode = typGiven ? 'termin' : mode
  const titel = titleWords.join(' ')

  let error: string | null = null
  if (!titel) error = 'Titel fehlt'
  else if (effectiveMode === 'termin' && !datum) error = 'Datum fehlt'

  return { mode: effectiveMode, titel, module, unknownKuerzel, datum, typ, error }
}
