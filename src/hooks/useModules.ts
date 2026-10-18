import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Module, ModuleStatus } from '@/lib/types'

// TanStack Query caches the data under this key. After every change we
// "invalidate" it, which reloads the list everywhere it is shown.
export const MODULES_KEY = ['modules']

export function useModules() {
  return useQuery({
    queryKey: MODULES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('name')
      if (error) throw error
      return data as Module[]
    },
  })
}

export type ModuleInput = Pick<Module, 'name' | 'kuerzel' | 'farbe'>

export function useCreateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ModuleInput) => {
      const { error } = await supabase.from('modules').insert(input)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: MODULES_KEY }),
  })
}

export function useUpdateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...changes }: Partial<Module> & { id: string }) => {
      const { error } = await supabase.from('modules').update(changes).eq('id', id)
      if (error) throw error
    },
    // module_status (stage 6) also depends on modules
    onSettled: () => qc.invalidateQueries(),
  })
}

// One row per module with last activity, open tasks and next event
// (computed by the database view module_status).
export function useModuleStatus() {
  return useQuery({
    queryKey: ['module_status'],
    queryFn: async () => {
      const { data, error } = await supabase.from('module_status').select('*')
      if (error) throw error
      return data as ModuleStatus[]
    },
  })
}

// "Heute gearbeitet": set last_touched_at to now
export function useTouchModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('modules')
        .update({ last_touched_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries(),
  })
}
