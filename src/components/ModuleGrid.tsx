import { Check } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { ModuleDot } from '@/components/ModuleDot'
import { Button } from '@/components/ui/button'
import { useTouchModule } from '@/hooks/useModules'
import {
  activityAmpel,
  activityText,
  countdownText,
  daysSince,
  daysUntil,
  type Ampel,
} from '@/lib/dates'
import type { ModuleStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

// traffic light as a tinted label, so it is not confused with the module dot
const AMPEL_STYLES: Record<Ampel, string> = {
  gruen: 'bg-green-500/10 text-green-700 dark:text-green-400',
  orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  rot: 'bg-red-500/10 text-red-700 dark:text-red-400',
  grau: 'bg-muted text-muted-foreground',
}

type Props = {
  status: ModuleStatus[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function ModuleGrid({ status, selectedId, onSelect }: Props) {
  const touch = useTouchModule()

  // "longest without activity" first; never touched counts as longest
  const sorted = status
    .filter((m) => !m.archiviert)
    .map((m) => ({ ...m, days: daysSince(m.letzte_aktivitaet) }))
    .sort((a, b) => (b.days ?? Infinity) - (a.days ?? Infinity) || a.name.localeCompare(b.name))

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine Fächer.{' '}
        <Link to="/einstellungen" className="text-primary underline-offset-4 hover:underline">
          Fach anlegen
        </Link>
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-1 xl:grid-cols-2">
      {sorted.map((m) => {
        const selected = selectedId === m.id
        const workedToday = m.days !== null && m.days <= 0
        return (
          <li
            key={m.id}
            className={cn(
              'flex flex-col rounded-xl border bg-card transition-colors',
              selected ? 'border-primary ring-1 ring-primary' : 'hover:bg-muted/40',
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(selected ? null : m.id)}
              aria-pressed={selected}
              className="flex flex-1 flex-col gap-1.5 p-3 pb-1 text-left sm:gap-2 sm:p-4 sm:pb-2"
            >
              <span className="flex items-start gap-2 text-sm font-medium sm:text-base">
                <ModuleDot color={m.farbe} className="mt-1.5" />
                <span className="line-clamp-2 hyphens-auto break-words">{m.name}</span>
              </span>
              <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                zuletzt
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 font-medium',
                    AMPEL_STYLES[activityAmpel(m.days)],
                  )}
                >
                  {activityText(m.days)}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {m.offene_aufgaben === 0
                  ? 'keine offenen Aufgaben'
                  : m.offene_aufgaben === 1
                    ? '1 offene Aufgabe'
                    : `${m.offene_aufgaben} offene Aufgaben`}
              </span>
              {m.naechster_termin_datum && (
                <span className="truncate text-xs text-muted-foreground">
                  {m.naechster_termin_titel} · {countdownText(daysUntil(m.naechster_termin_datum))}
                </span>
              )}
            </button>
            <div className="px-1 pb-1 sm:px-2 sm:pb-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-full justify-start px-2 text-xs text-muted-foreground sm:h-9 sm:text-sm"
                disabled={touch.isPending}
                onClick={() =>
                  touch.mutate(m.id, {
                    onSuccess: () => toast(`${m.name}: heute gearbeitet`, { duration: 1500 }),
                    onError: (err) => toast.error(`Fehler: ${err.message}`),
                  })
                }
              >
                <Check className={workedToday ? 'text-green-600 dark:text-green-400' : undefined} />
                Heute gearbeitet
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
