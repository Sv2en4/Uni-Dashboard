import { ModuleDot } from '@/components/ModuleDot'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDatum } from '@/lib/dates'
import type { Module } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
  titel: string
  erledigt: boolean
  datum: string | null
  module?: Module
  extra?: string // e.g. event type
  onToggle?: (erledigt: boolean) => void // omitted = no checkbox
  onOpen: () => void
}

// One line in a list: checkbox, title, module and date. Click opens editing.
export function ItemRow({ titel, erledigt, datum, module, extra, onToggle, onOpen }: Props) {
  return (
    <li className="flex items-center gap-3 px-3">
      {onToggle && (
        <Checkbox
          checked={erledigt}
          onCheckedChange={(v) => onToggle(v === true)}
          aria-label={erledigt ? `${titel} wieder öffnen` : `${titel} abhaken`}
          className="size-5"
        />
      )}
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-12 flex-1 items-center gap-3 overflow-hidden text-left"
      >
        <span className={cn('flex-1 truncate', erledigt && 'text-muted-foreground line-through')}>
          {titel}
        </span>
        {extra && <span className="shrink-0 text-xs text-muted-foreground">{extra}</span>}
        {module && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <ModuleDot color={module.farbe} className="size-2" />
            <span className="hidden sm:inline">{module.name}</span>
          </span>
        )}
        {datum && (
          <span className="w-20 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
            {formatDatum(datum)}
          </span>
        )}
      </button>
    </li>
  )
}
