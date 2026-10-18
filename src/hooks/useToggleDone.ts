import { toast } from 'sonner'
import { useUpdateItem } from '@/hooks/useItems'

const UNDO_MS = 5000

// Tick off / untick a task or event. When ticking off, show a
// "Rückgängig" toast for a few seconds.
export function useToggleDone(table: 'tasks' | 'events') {
  const update = useUpdateItem(table)

  return (item: { id: string; titel: string }, erledigt: boolean) => {
    update.mutate(
      { id: item.id, erledigt },
      { onError: (err) => toast.error(`Fehler: ${err.message}`) },
    )
    if (erledigt) {
      toast(`„${item.titel}“ erledigt`, {
        duration: UNDO_MS,
        action: {
          label: 'Rückgängig',
          onClick: () => update.mutate({ id: item.id, erledigt: false }),
        },
      })
    }
  }
}
