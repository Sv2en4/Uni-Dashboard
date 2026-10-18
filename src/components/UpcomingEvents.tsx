import { ModuleDot } from '@/components/ModuleDot'
import { Checkbox } from '@/components/ui/checkbox'
import { useToggleDone } from '@/hooks/useToggleDone'
import { ANZAHL_NAECHSTE_TERMINE } from '@/lib/constants'
import { countdownText, daysUntil, eventUrgency, formatDatum, isEventVisible } from '@/lib/dates'
import { TYP_LABELS } from '@/lib/labels'
import type { Module, UniEvent } from '@/lib/types'
import { cn } from '@/lib/utils'

const URGENCY_STYLES = {
  rot: { text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' },
  orange: { text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  neutral: { text: '', border: '' },
}

type Props = {
  events: UniEvent[]
  moduleById: Map<string, Module>
  onOpen: (e: UniEvent) => void
}

export function UpcomingEvents({ events, moduleById, onOpen }: Props) {
  const toggle = useToggleDone('events')
  const upcoming = events
    .filter((e) => isEventVisible(e))
    .sort((a, b) => a.datum.localeCompare(b.datum))
    .slice(0, ANZAHL_NAECHSTE_TERMINE)

  if (upcoming.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine anstehenden Termine.</p>
  }

  return (
    // phone: swipe horizontally; desktop: all cards in one row
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
      {upcoming.map((e) => {
        const days = daysUntil(e.datum)
        const style = URGENCY_STYLES[eventUrgency(days)]
        const module = e.module_id ? moduleById.get(e.module_id) : undefined
        return (
          <li
            key={e.id}
            className={cn(
              'relative w-[70%] shrink-0 snap-start rounded-xl border bg-card transition-colors hover:bg-muted/40 sm:w-auto',
              style.border,
            )}
          >
            <button
              type="button"
              onClick={() => onOpen(e)}
              className="flex h-full w-full flex-col gap-3 p-4 text-left"
            >
              <span className={cn('pr-6 text-xl font-semibold tracking-tight', style.text)}>
                {countdownText(days)}
              </span>
              <span className="flex flex-col gap-1">
                <span className="line-clamp-2 pr-6 font-medium">{e.titel}</span>
                <span className="text-xs text-muted-foreground">
                  {TYP_LABELS[e.typ]} · {formatDatum(e.datum)}
                </span>
                {module && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ModuleDot color={module.farbe} className="size-2" />
                    {module.name}
                  </span>
                )}
              </span>
            </button>
            {e.typ === 'abgabe' && (
              <Checkbox
                checked={false}
                onCheckedChange={() => toggle(e, true)}
                aria-label={`${e.titel} abhaken`}
                className="absolute top-4 right-4 size-5"
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
