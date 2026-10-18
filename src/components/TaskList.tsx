import { useState } from 'react'
import { X } from 'lucide-react'
import { ItemRow } from '@/components/ItemRow'
import { ModuleDot } from '@/components/ModuleDot'
import { useToggleDone } from '@/hooks/useToggleDone'
import { TASK_GROUPS, taskGroup, type TaskGroup } from '@/lib/dates'
import type { Module, Task } from '@/lib/types'
import { cn } from '@/lib/utils'

const LEAVE_ANIMATION_MS = 450
const MAX_ERLEDIGT = 20

type Props = {
  tasks: Task[]
  moduleById: Map<string, Module>
  filterModule: Module | null
  onClearFilter: () => void
  onOpen: (t: Task) => void
}

export function TaskList({ tasks, moduleById, filterModule, onClearFilter, onOpen }: Props) {
  const toggle = useToggleDone('tasks')
  const [showDone, setShowDone] = useState(false)
  // tasks that were just ticked off and are fading out
  const [leaving, setLeaving] = useState<Set<string>>(new Set())

  const filtered = filterModule ? tasks.filter((t) => t.module_id === filterModule.id) : tasks
  const open = filtered.filter((t) => !t.erledigt)
  const done = filtered
    .filter((t) => t.erledigt)
    .sort((a, b) => (b.erledigt_am ?? '').localeCompare(a.erledigt_am ?? ''))
    .slice(0, MAX_ERLEDIGT)

  const groups = new Map<TaskGroup, Task[]>()
  for (const t of open) {
    const g = taskGroup(t.faellig)
    groups.set(g, [...(groups.get(g) ?? []), t])
  }

  function tickOff(t: Task) {
    setLeaving((s) => new Set(s).add(t.id))
    setTimeout(() => {
      toggle(t, true)
      setLeaving((s) => {
        const next = new Set(s)
        next.delete(t.id)
        return next
      })
    }, LEAVE_ANIMATION_MS)
  }

  const row = (t: Task, group?: TaskGroup) => (
    <ItemRow
      key={t.id}
      titel={t.titel}
      erledigt={t.erledigt}
      leaving={leaving.has(t.id)}
      datum={t.faellig}
      dateClassName={group === 'Überfällig' ? 'text-red-600 dark:text-red-400' : undefined}
      module={t.module_id ? moduleById.get(t.module_id) : undefined}
      onToggle={(v) => (v ? tickOff(t) : toggle(t, false))}
      onOpen={() => onOpen(t)}
    />
  )

  return (
    <div className="space-y-3">
      <div className="flex min-h-8 items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Aufgaben</h2>
        {filterModule && (
          <button
            type="button"
            onClick={onClearFilter}
            className="flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs hover:bg-muted"
          >
            <ModuleDot color={filterModule.farbe} className="size-2" />
            {filterModule.name}
            <X className="size-3 text-muted-foreground" aria-label="Filter entfernen" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowDone((v) => !v)}
          className="ml-auto h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          {showDone ? 'Erledigte ausblenden' : 'Erledigte zeigen'}
        </button>
      </div>

      {open.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {filterModule ? `Keine offenen Aufgaben in ${filterModule.name}.` : 'Alles erledigt. 🎉'}
        </p>
      )}

      {TASK_GROUPS.filter((g) => groups.has(g)).map((g) => (
        <section key={g} className="space-y-1.5">
          <h3
            className={cn(
              'px-1 text-xs font-medium text-muted-foreground',
              g === 'Überfällig' && 'text-red-600 dark:text-red-400',
            )}
          >
            {g} <span className="font-normal">{groups.get(g)!.length}</span>
          </h3>
          <ul className="divide-y rounded-xl border bg-card">{groups.get(g)!.map((t) => row(t, g))}</ul>
        </section>
      ))}

      {showDone && done.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="px-1 text-xs font-medium text-muted-foreground">Erledigt</h3>
          <ul className="divide-y rounded-xl border bg-card">{done.map((t) => row(t))}</ul>
        </section>
      )}
    </div>
  )
}
