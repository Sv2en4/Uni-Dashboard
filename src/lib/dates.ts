import { format, parse } from 'date-fns'
import { de } from 'date-fns/locale'

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
