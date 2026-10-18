import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Task, UniEvent } from '@/lib/types'

// Tasks and events behave almost the same, so they share these hooks.
// `table` decides which one: 'tasks' or 'events'.

type Tables = { tasks: Task; events: UniEvent }
type Table = keyof Tables

export function useItems<T extends Table>(table: T) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(table === 'tasks' ? 'faellig' : 'datum', { ascending: true, nullsFirst: false })
        .order('created_at')
      if (error) throw error
      return data as Tables[T][]
    },
  })
}

export type NewItem<T extends Table> = Omit<
  Tables[T],
  'id' | 'user_id' | 'erledigt' | 'erledigt_am' | 'created_at'
>

export function useCreateItem<T extends Table>(table: T) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: NewItem<T>) => {
      const { error } = await supabase.from(table).insert(item as never) // our own types, see lib/types.ts
      if (error) throw error
    },
    onSettled: () => invalidate(qc),
  })
}

export function useUpdateItem<T extends Table>(table: T) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...changes }: Partial<Tables[T]> & { id: string }) => {
      const { error } = await supabase.from(table).update(changes as never).eq('id', id)
      if (error) throw error
    },
    // Optimistic update: change the list immediately, the server follows.
    // If the server says no, roll back to the previous list.
    onMutate: async ({ id, ...changes }) => {
      await qc.cancelQueries({ queryKey: [table] })
      const previous = qc.getQueryData<Tables[T][]>([table])
      const local: Partial<Tables[T]> = { ...changes } as Partial<Tables[T]>
      if ('erledigt' in changes) {
        // the database trigger sets erledigt_am; mirror it locally
        Object.assign(local, { erledigt_am: changes.erledigt ? new Date().toISOString() : null })
      }
      qc.setQueryData<Tables[T][]>([table], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...local } : item)),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData([table], context.previous)
    },
    onSettled: () => invalidate(qc),
  })
}

export function useDeleteItem(table: Table) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => invalidate(qc),
  })
}

// Tasks/events also affect module_status (open count, next event, last activity)
function invalidate(qc: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['tasks'] }),
    qc.invalidateQueries({ queryKey: ['events'] }),
    qc.invalidateQueries({ queryKey: ['module_status'] }),
  ])
}
