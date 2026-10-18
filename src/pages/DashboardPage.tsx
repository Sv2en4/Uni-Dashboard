import { useState } from 'react'
import { ItemEditDialog, type EditTarget } from '@/components/ItemEditDialog'
import { ItemRow } from '@/components/ItemRow'
import { QuickAdd } from '@/components/QuickAdd'
import { useItems } from '@/hooks/useItems'
import { useModules } from '@/hooks/useModules'
import { useToggleDone } from '@/hooks/useToggleDone'
import { TYP_LABELS } from '@/lib/labels'

// Provisional version (stage 5). Stage 6 adds event cards, module grid and grouping.
export function DashboardPage() {
  const { data: tasks = [] } = useItems('tasks')
  const { data: events = [] } = useItems('events')
  const { data: modules = [] } = useModules()
  const toggleTask = useToggleDone('tasks')
  const toggleEvent = useToggleDone('events')
  const [editing, setEditing] = useState<EditTarget | null>(null)
  const [showDone, setShowDone] = useState(false)

  const moduleById = new Map(modules.map((m) => [m.id, m]))
  const visibleTasks = tasks.filter((t) => showDone || !t.erledigt)
  const visibleEvents = events.filter((e) => showDone || !e.erledigt)

  return (
    <div className="space-y-8 py-4">
      <QuickAdd />

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Termine</h2>
        {visibleEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Termine.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {visibleEvents.map((e) => (
              <ItemRow
                key={e.id}
                titel={e.titel}
                erledigt={e.erledigt}
                datum={e.datum}
                extra={TYP_LABELS[e.typ]}
                module={e.module_id ? moduleById.get(e.module_id) : undefined}
                onToggle={(v) => toggleEvent(e, v)}
                onOpen={() => setEditing({ kind: 'event', item: e })}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Aufgaben</h2>
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showDone ? 'Erledigte ausblenden' : 'Erledigte zeigen'}
          </button>
        </div>
        {visibleTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine offenen Aufgaben.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {visibleTasks.map((t) => (
              <ItemRow
                key={t.id}
                titel={t.titel}
                erledigt={t.erledigt}
                datum={t.faellig}
                module={t.module_id ? moduleById.get(t.module_id) : undefined}
                onToggle={(v) => toggleTask(t, v)}
                onOpen={() => setEditing({ kind: 'task', item: t })}
              />
            ))}
          </ul>
        )}
      </section>

      <ItemEditDialog target={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
