import { useState } from 'react'
import { ItemEditDialog, type EditTarget } from '@/components/ItemEditDialog'
import { ModuleGrid } from '@/components/ModuleGrid'
import { QuickAdd } from '@/components/QuickAdd'
import { TaskList } from '@/components/TaskList'
import { UpcomingEvents } from '@/components/UpcomingEvents'
import { useItems } from '@/hooks/useItems'
import { useModules, useModuleStatus } from '@/hooks/useModules'
import { useToday } from '@/hooks/useToday'

// Main page. Phone: one column (quick entry, events, modules, tasks).
// Desktop: events across the full width, below it tasks (left) and modules (right).
export function DashboardPage() {
  const { data: tasks = [], isLoading: tasksLoading } = useItems('tasks')
  const { data: events = [], isLoading: eventsLoading } = useItems('events')
  const { data: modules = [] } = useModules()
  const { data: status = [], isLoading: statusLoading } = useModuleStatus()
  // re-render all countdowns when the day changes (the value itself is not needed)
  useToday()
  const [editing, setEditing] = useState<EditTarget | null>(null)
  const [filterId, setFilterId] = useState<string | null>(null)

  const moduleById = new Map(modules.map((m) => [m.id, m]))
  const filterModule = filterId ? (moduleById.get(filterId) ?? null) : null

  return (
    <div className="space-y-8 py-4">
      <div className="sticky top-0 z-10 -mx-4 bg-background/90 px-4 pt-1 pb-3 backdrop-blur sm:-mx-6 sm:px-6">
        <QuickAdd />
      </div>

      <section className="space-y-3">
        <SectionTitle>Nächste Termine</SectionTitle>
        {eventsLoading ? (
          <Skeleton className="h-36" />
        ) : (
          <UpcomingEvents
            events={events}
            moduleById={moduleById}
            onOpen={(item) => setEditing({ kind: 'event', item })}
          />
        )}
      </section>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[3fr_2fr] lg:items-start">
        <section className="space-y-3 lg:order-2">
          <div className="flex min-h-8 items-center">
            <SectionTitle>Fächer</SectionTitle>
          </div>
          {statusLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <ModuleGrid status={status} selectedId={filterId} onSelect={setFilterId} />
          )}
        </section>

        <section className="lg:order-1">
          {tasksLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <TaskList
              tasks={tasks}
              moduleById={moduleById}
              filterModule={filterModule}
              onClearFilter={() => setFilterId(null)}
              onOpen={(item) => setEditing({ kind: 'task', item })}
            />
          )}
        </section>
      </div>

      <ItemEditDialog target={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted/60 ${className}`} />
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium text-muted-foreground">{children}</h2>
}
